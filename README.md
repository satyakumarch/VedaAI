# VedaAI — AI-Powered Assessment Creator

> Generate structured, professional exam question papers in seconds.  
> Built for teachers. Powered by Groq · OpenAI · Gemini.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js 14)                │
│  Landing → Login/Register → Dashboard → Create → Result  │
│         Zustand Store  ·  Socket.IO Client  ·  Axios     │
└──────────────────────┬──────────────────────────────────┘
                       │ REST API + WebSocket
┌──────────────────────▼──────────────────────────────────┐
│                  BACKEND (Express + TypeScript)           │
│                                                          │
│   Routes → Controllers → Services → Models               │
│                                                          │
│   ┌──────────┐   ┌──────────┐   ┌────────────────────┐  │
│   │ MongoDB  │   │  Redis   │   │   Socket.IO Server  │  │
│   │ (data)   │   │ (cache)  │   │   (live updates)    │  │
│   └──────────┘   └────┬─────┘   └────────────────────┘  │
│                       │ BullMQ Queue                     │
│   ┌───────────────────▼──────────────────────────────┐   │
│   │              AI WORKER (separate process)         │   │
│   │   Groq (Llama 3.3) → OpenAI → Gemini (fallback)  │   │
│   │   Generates JSON → Saves Paper → Emits WS event  │   │
│   └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Generation Flow
```
Form Submit → POST /api/assignments → Save to MongoDB
    → Add job to BullMQ (Redis) → Return assignment ID
    → Frontend joins Socket.IO room
    → Worker picks job → Calls AI API
    → Streams progress events via WebSocket
    → Saves GeneratedPaper to MongoDB
    → Emits generation_completed
    → Frontend redirects to result page → Download PDF
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, TailwindCSS |
| State | Zustand (persisted draft), React Hook Form + Zod |
| Realtime | Socket.IO client/server |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB Atlas + Mongoose |
| Queue | Redis + BullMQ |
| AI | Groq · OpenAI · Gemini (auto-fallback) |
| PDF | pdf-lib |
| Auth | JWT + bcrypt |
| Logging | Winston |

---

## AI Providers

Tried in order — first available key wins:

| Priority | Provider | Key | Cost | Link |
|----------|----------|-----|------|------|
| 1st | Groq ⭐ | `GROQ_API_KEY` | **Free** | [console.groq.com/keys](https://console.groq.com/keys) |
| 2nd | OpenAI | `OPENAI_API_KEY` | Paid | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| 3rd | Gemini | `GEMINI_API_KEY` | Free | [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) |

---

## Project Structure

```
VedaAI/
├── vedaai-backend/
│   └── src/
│       ├── config/          # DB, Redis, app config
│       ├── controllers/     # Auth, Assignment, Paper
│       ├── middleware/       # JWT auth, Zod validate, Multer upload
│       ├── models/          # User, Assignment, GeneratedPaper
│       ├── queues/          # BullMQ queue definition
│       ├── routes/          # /api/auth, /api/assignments, /api/papers
│       ├── services/        # aiService, pdfService, fileService
│       ├── websocket/       # Socket.IO manager
│       ├── workers/         # AI generation worker
│       └── index.ts         # Express entry point
│
└── vedaai-frontend/
    └── src/
        ├── app/             # Next.js pages (App Router)
        │   ├── (auth)/      # login, register
        │   └── dashboard/   # home, assignments, create, result
        ├── components/      # Sidebar, TopBar, Forms, Paper, Badges
        ├── hooks/           # useGenerationSocket, useAuth
        ├── lib/             # axios, socket.io, utils
        ├── store/           # authStore, assignmentStore, generationStore
        └── types/           # Shared TypeScript types
```

---

## Setup

### Prerequisites
- Node.js v18+
- MongoDB Atlas account — [cloud.mongodb.com](https://cloud.mongodb.com)
- Redis Cloud account — [redis.com/try-free](https://redis.com/try-free)
- Groq API key — [console.groq.com/keys](https://console.groq.com/keys)

### Backend
```bash
cd vedaai-backend
npm install
copy .env.example .env    # fill in your values
```

### Frontend
```bash
cd vedaai-frontend
npm install
```

Create `vedaai-frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

---

## Run

Open **3 terminals**:

```bash
# Terminal 1 — API server
cd vedaai-backend
npm run dev

# Terminal 2 — AI worker
cd vedaai-backend
npm run worker

# Terminal 3 — Frontend
cd vedaai-frontend
npm run dev
```

Open **http://localhost:3000**

---

## Environment Variables

`vedaai-backend/.env`:

```env
NODE_ENV=development
PORT=5000

MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/vedaai
REDIS_URL=redis://default:<pass>@redis-host:port

JWT_SECRET=your-long-secret-key
JWT_EXPIRES_IN=7d

# Set at least one AI key
GROQ_API_KEY=gsk_...
OPENAI_API_KEY=sk-proj-...
GEMINI_API_KEY=AIza...
OPENAI_MODEL=gpt-4o-mini

CORS_ORIGIN=http://localhost:3000
MAX_FILE_SIZE_MB=10
QUEUE_CONCURRENCY=3
QUEUE_ATTEMPTS=3
QUEUE_BACKOFF_DELAY=5000
```

---

## API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login → returns JWT |
| GET | `/api/auth/me` | Get current user |

### Assignments *(requires `Authorization: Bearer <token>`)*
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/assignments` | List all |
| POST | `/api/assignments` | Create + queue AI generation |
| GET | `/api/assignments/:id` | Get one |
| DELETE | `/api/assignments/:id` | Delete |
| POST | `/api/assignments/:id/regenerate` | Re-generate |

### Papers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/papers/:assignmentId` | Get paper JSON |
| GET | `/api/papers/:assignmentId/download` | Download PDF |
| PATCH | `/api/papers/:assignmentId/sections/:si/questions/:qi` | Edit question |

### WebSocket Events
```
Client emits:  join_assignment <assignmentId>
Server emits:  generation_started · generation_progress · generation_completed · generation_failed
Payload:       { assignmentId, status, progress: 0-100, message, data? }
```

---

## Common Issues

| Error | Fix |
|-------|-----|
| `Failed to create assignment` | Backend not running — `npm run dev` |
| `MongoDB connection failed` | Atlas → Network Access → Add `0.0.0.0/0` |
| `AI generation failed: 429` | OpenAI quota exceeded — set `GROQ_API_KEY` |
| `EADDRINUSE :::5000` | `Stop-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess -Force` |
| Worker not processing | Redis not connected — check `REDIS_URL` |

---

## Deployment

| Service | Platform |
|---------|---------|
| Frontend | [Vercel](https://vercel.com) |
| Backend API | [Render](https://render.com) — Web Service |
| AI Worker | [Render](https://render.com) — Background Worker |
| Database | [MongoDB Atlas](https://cloud.mongodb.com) |
| Redis | [Redis Cloud](https://redis.com/try-free) |

---

## License

MIT © 2026 VedaAI
