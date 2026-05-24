import Link from 'next/link';
import { BookOpen, Zap, FileText, Download, ArrowRight, CheckCircle } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
              <span className="text-white font-black text-sm">V</span>
            </div>
            <span className="font-bold text-lg">VedaAI</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5">
              Sign in
            </Link>
            <Link href="/register" className="text-sm bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 rounded-full font-semibold hover:opacity-90 transition-opacity">
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 dark:bg-orange-950/30 text-orange-600 text-sm font-medium mb-8 border border-orange-200 dark:border-orange-800">
          <Zap className="w-3.5 h-3.5" />
          AI-Powered Assessment Creation
        </div>
        <h1 className="text-5xl sm:text-6xl font-extrabold text-foreground leading-tight mb-6">
          Create Exam Papers<br />
          <span className="text-orange-500">in Seconds</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
          VedaAI generates structured, professional question papers from your topic. MCQs, short answers, essays — formatted and ready to print.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/register" className="flex items-center gap-2 px-7 py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-semibold rounded-full hover:opacity-90 transition-opacity shadow-md">
            Get Started Free <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/login" className="px-7 py-3 border border-border rounded-full font-medium hover:bg-accent transition-colors text-sm">
            Sign In
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { icon: Zap,          title: 'AI-Powered',       desc: 'GPT-4 generates contextually relevant questions tailored to your topic.' },
            { icon: FileText,     title: 'Multiple Types',   desc: 'MCQ, short answer, long answer, true/false — all in one paper.' },
            { icon: Download,     title: 'PDF Export',       desc: 'Download exam-ready PDFs with proper formatting and student fields.' },
            { icon: Zap,          title: 'Real-time',        desc: 'Watch your paper being generated live with WebSocket progress.' },
            { icon: CheckCircle,  title: 'Editable',         desc: 'Edit any generated question directly before downloading.' },
            { icon: BookOpen,     title: 'Upload Material',  desc: 'Upload a PDF and AI generates questions from your content.' },
          ].map((f, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 hover:border-orange-300 dark:hover:border-orange-700 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-orange-50 dark:bg-orange-950/30 text-orange-500 flex items-center justify-center mb-3">
                <f.icon className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-foreground mb-1 text-sm">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-2xl mx-auto px-6 py-16 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-3">Ready to save hours of work?</h2>
        <p className="text-muted-foreground mb-8 text-sm">Join thousands of teachers using VedaAI to create better assessments faster.</p>
        <Link href="/register" className="inline-flex items-center gap-2 px-7 py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-semibold rounded-full hover:opacity-90 transition-opacity">
          Start Creating for Free <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      <footer className="border-t border-border py-6">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-orange-500 flex items-center justify-center">
              <span className="text-white font-black text-xs">V</span>
            </div>
            <span className="font-bold text-sm">VedaAI</span>
          </div>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} VedaAI</p>
        </div>
      </footer>
    </div>
  );
}
