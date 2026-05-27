'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Sparkles, FileQuestion, BookOpen, PenTool, BarChart3,
  ClipboardList, Brain, Lightbulb, ArrowRight, Zap,
} from 'lucide-react';
import TopBar from '@/components/layout/TopBar';

// ── Tool cards data ──────────────────────────────────────────
const TOOLS = [
  {
    icon: FileQuestion,
    title: 'Question Paper Generator',
    description: 'Generate structured exam papers with MCQs, short answers, numerical problems and more using AI.',
    badge: 'Most Used',
    badgeColor: 'bg-orange-100 text-orange-600',
    action: '/dashboard/assignments/create',
    color: 'from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20',
    border: 'border-orange-200 dark:border-orange-800',
  },
  {
    icon: Brain,
    title: 'Lesson Plan Creator',
    description: 'Create detailed lesson plans aligned with curriculum standards. Define objectives, activities, and assessments.',
    badge: 'Coming Soon',
    badgeColor: 'bg-purple-100 text-purple-600',
    action: null,
    color: 'from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20',
    border: 'border-purple-200 dark:border-purple-800',
  },
  {
    icon: ClipboardList,
    title: 'Rubric Builder',
    description: 'Design grading rubrics with clear criteria and performance levels. Export as PDF or share with students.',
    badge: 'Coming Soon',
    badgeColor: 'bg-blue-100 text-blue-600',
    action: null,
    color: 'from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20',
    border: 'border-blue-200 dark:border-blue-800',
  },
  {
    icon: PenTool,
    title: 'Assignment Feedback',
    description: 'Get AI-powered feedback suggestions for student assignments. Save time while providing detailed comments.',
    badge: 'Coming Soon',
    badgeColor: 'bg-green-100 text-green-600',
    action: null,
    color: 'from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20',
    border: 'border-green-200 dark:border-green-800',
  },
  {
    icon: BarChart3,
    title: 'Performance Analytics',
    description: 'Analyze student performance trends across assignments. Identify learning gaps and areas for improvement.',
    badge: 'Coming Soon',
    badgeColor: 'bg-indigo-100 text-indigo-600',
    action: null,
    color: 'from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20',
    border: 'border-indigo-200 dark:border-indigo-800',
  },
  {
    icon: Lightbulb,
    title: 'Quiz Generator',
    description: 'Create quick formative quizzes from any topic or uploaded material. Perfect for classroom check-ins.',
    badge: 'Coming Soon',
    badgeColor: 'bg-yellow-100 text-yellow-600',
    action: null,
    color: 'from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20',
    border: 'border-yellow-200 dark:border-yellow-800',
  },
];

const TIPS = [
  'Upload a PDF or text file as reference material for more accurate questions.',
  'Use the difficulty distribution to balance your exam — 40% easy, 40% medium, 20% hard works well.',
  'Add specific instructions like "focus on practical examples" for better AI output.',
  'Numerical problems work best when you specify the topic clearly (e.g. "Ohm\'s Law calculations").',
  'Regenerate the paper if you want a fresh set of questions on the same topic.',
];

export default function ToolkitPage() {
  const router = useRouter();
  const [tipIndex, setTipIndex] = useState(0);

  return (
    <>
      <TopBar title="AI Teacher's Toolkit" showBack={false} />
      <main className="flex-1 overflow-auto bg-background">
        <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
              <h1 className="font-bold text-base text-foreground">AI Teacher&apos;s Toolkit</h1>
            </div>
            <p className="text-xs text-muted-foreground ml-4">
              Powerful AI tools to help you teach smarter, not harder.
            </p>
          </motion.div>

          {/* AI Tip banner */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-r from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-5 flex items-start gap-4"
          >
            <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wide">AI Tip</p>
              <p className="text-sm text-white leading-relaxed">{TIPS[tipIndex]}</p>
            </div>
            <button
              onClick={() => setTipIndex((tipIndex + 1) % TIPS.length)}
              className="text-xs text-gray-400 hover:text-white transition-colors shrink-0 mt-1"
            >
              Next tip →
            </button>
          </motion.div>

          {/* Tools grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {TOOLS.map((tool, i) => {
              const Icon = tool.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className={`relative bg-gradient-to-br ${tool.color} border ${tool.border} rounded-2xl p-5 flex flex-col gap-3 ${tool.action ? 'cursor-pointer hover:shadow-md transition-shadow' : 'opacity-80'}`}
                  onClick={() => tool.action && router.push(tool.action)}
                >
                  {/* Badge */}
                  <span className={`absolute top-4 right-4 text-xs font-semibold px-2 py-0.5 rounded-full ${tool.badgeColor}`}>
                    {tool.badge}
                  </span>

                  {/* Icon */}
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center">
                    <Icon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground text-sm mb-1">{tool.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{tool.description}</p>
                  </div>

                  {/* CTA */}
                  {tool.action && (
                    <div className="flex items-center gap-1 text-xs font-semibold text-orange-600 dark:text-orange-400">
                      Open tool <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-3 gap-4"
          >
            {[
              { icon: FileQuestion, label: 'Question Types', value: '7', sub: 'MCQ, Short, Long, T/F, Diagram, Numerical, Fill Blanks' },
              { icon: Sparkles,     label: 'AI Providers',   value: '3', sub: 'Groq · OpenAI · Gemini' },
              { icon: BookOpen,     label: 'Export Formats', value: '2', sub: 'PDF Download · Copy Text' },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="bg-card border border-border rounded-xl p-4 text-center space-y-1">
                  <Icon className="w-5 h-5 text-orange-500 mx-auto" />
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs font-semibold text-foreground">{stat.label}</p>
                  <p className="text-xs text-muted-foreground">{stat.sub}</p>
                </div>
              );
            })}
          </motion.div>
        </div>
      </main>
    </>
  );
}
