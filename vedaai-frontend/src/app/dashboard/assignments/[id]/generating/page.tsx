'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, XCircle, Sparkles, Brain,
  FileText, Zap, RefreshCw, ArrowRight,
} from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import { useGenerationStore } from '@/store/generationStore';
import { useGenerationSocket } from '@/hooks/useGenerationSocket';
import { cn } from '@/lib/utils';
import api from '@/lib/axios';

// ── Steps shown during generation ───────────────────────────
const STEPS = [
  { icon: Brain,    label: 'Analyzing topic & requirements', threshold: 15 },
  { icon: Sparkles, label: 'Generating questions with AI',   threshold: 45 },
  { icon: FileText, label: 'Structuring sections & marks',   threshold: 75 },
  { icon: Zap,      label: 'Finalizing question paper',      threshold: 92 },
];

export default function GeneratingPage() {
  const params       = useParams();
  const router       = useRouter();
  const assignmentId = params.id as string;

  const { status, progress, message, error, reset, fetchPaper } = useGenerationStore();
  const [localProgress, setLocalProgress] = useState(0);
  const [localMessage,  setLocalMessage]  = useState('Starting generation...');
  const [localStatus,   setLocalStatus]   = useState<'processing' | 'completed' | 'failed'>('processing');
  const pollRef  = useRef<NodeJS.Timeout | null>(null);
  const doneRef  = useRef(false);

  // Reset store on mount
  useEffect(() => { reset(); }, [reset]);

  // Connect socket for real-time updates
  useGenerationSocket(assignmentId);

  // Sync store → local state
  useEffect(() => {
    if (status === 'completed') {
      setLocalProgress(100);
      setLocalMessage('Question paper ready!');
      setLocalStatus('completed');
    } else if (status === 'failed') {
      setLocalStatus('failed');
      setLocalMessage(error ?? 'Generation failed');
    } else if (status === 'processing' && progress > 0) {
      setLocalProgress(progress);
      setLocalMessage(message || 'Generating...');
    }
  }, [status, progress, message, error]);

  // ── Polling fallback ─────────────────────────────────────
  // If socket doesn't deliver events, poll the assignment status every 3s
  useEffect(() => {
    if (doneRef.current) return;

    // Animate progress bar even without socket events
    const fakeProgress = setInterval(() => {
      setLocalProgress(prev => {
        if (prev >= 88) { clearInterval(fakeProgress); return prev; }
        return prev + Math.random() * 4;
      });
    }, 1800);

    // Poll assignment status
    const poll = async () => {
      if (doneRef.current) return;
      try {
        const { data } = await api.get(`/assignments/${assignmentId}`);
        const s = data.data?.status;

        if (s === 'completed') {
          doneRef.current = true;
          clearInterval(fakeProgress);
          if (pollRef.current) clearInterval(pollRef.current);
          setLocalProgress(100);
          setLocalMessage('Question paper ready!');
          setLocalStatus('completed');
          await fetchPaper(assignmentId);
        } else if (s === 'failed') {
          doneRef.current = true;
          clearInterval(fakeProgress);
          if (pollRef.current) clearInterval(pollRef.current);
          setLocalStatus('failed');
          setLocalMessage('Generation failed. Please try again.');
        }
      } catch { /* ignore poll errors */ }
    };

    pollRef.current = setInterval(poll, 3000);
    poll(); // immediate first check

    return () => {
      clearInterval(fakeProgress);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [assignmentId, fetchPaper]);

  // ── Auto-redirect when done ──────────────────────────────
  useEffect(() => {
    if (localStatus === 'completed') {
      const t = setTimeout(() => {
        router.push(`/dashboard/assignments/${assignmentId}/result`);
      }, 1800);
      return () => clearTimeout(t);
    }
  }, [localStatus, assignmentId, router]);

  const pct        = Math.min(Math.round(localProgress), 100);
  const isCompleted = localStatus === 'completed';
  const isFailed    = localStatus === 'failed';

  return (
    <>
      <TopBar title="Generating Paper" />
      <main className="flex-1 overflow-auto flex items-center justify-center p-6 bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-lg space-y-8"
        >
          {/* ── Central icon ── */}
          <div className="flex justify-center">
            <div className="relative w-28 h-28">
              <AnimatePresence mode="wait">
                {isCompleted ? (
                  <motion.div key="done" initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="w-28 h-28 rounded-full bg-green-100 dark:bg-green-950/30 flex items-center justify-center">
                    <CheckCircle2 className="w-14 h-14 text-green-500" />
                  </motion.div>
                ) : isFailed ? (
                  <motion.div key="fail" initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="w-28 h-28 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
                    <XCircle className="w-14 h-14 text-red-500" />
                  </motion.div>
                ) : (
                  <motion.div key="spin" className="w-28 h-28 flex items-center justify-center">
                    {/* SVG ring */}
                    <svg className="absolute inset-0 w-28 h-28 -rotate-90" viewBox="0 0 112 112">
                      <circle cx="56" cy="56" r="50" fill="none" strokeWidth="5"
                        stroke="currentColor" className="text-muted" />
                      <motion.circle cx="56" cy="56" r="50" fill="none" strokeWidth="5"
                        stroke="currentColor" strokeLinecap="round"
                        className="text-orange-500"
                        strokeDasharray={`${2 * Math.PI * 50}`}
                        strokeDashoffset={`${2 * Math.PI * 50 * (1 - pct / 100)}`}
                        transition={{ duration: 0.6, ease: 'easeOut' }} />
                    </svg>
                    {/* Percentage in center */}
                    <span className="relative text-2xl font-bold text-foreground z-10">
                      {pct}%
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ── Title & message ── */}
          <div className="text-center space-y-1.5">
            <h2 className="text-xl font-bold text-foreground">
              {isCompleted ? '🎉 Paper Ready!' : isFailed ? 'Generation Failed' : 'Generating Your Paper'}
            </h2>
            <p className="text-sm text-muted-foreground">{localMessage}</p>
          </div>

          {/* ── Progress bar ── */}
          {!isFailed && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span className="font-semibold text-foreground">{pct}%</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className={cn(
                    'h-full rounded-full transition-all',
                    isCompleted
                      ? 'bg-green-500'
                      : 'bg-gradient-to-r from-orange-500 to-amber-400'
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </div>
            </div>
          )}

          {/* ── Step indicators ── */}
          {!isFailed && (
            <div className="space-y-2.5">
              {STEPS.map((step, i) => {
                const Icon     = step.icon;
                const isDone   = pct >= step.threshold;
                const isActive = pct >= (STEPS[i - 1]?.threshold ?? 0) && pct < step.threshold;

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
                      isDone   ? 'bg-green-50 dark:bg-green-950/20'
                      : isActive ? 'bg-orange-50 dark:bg-orange-950/10'
                      : 'bg-muted/40'
                    )}
                  >
                    {/* Step icon */}
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                      isDone   ? 'bg-green-100 dark:bg-green-900/40'
                      : isActive ? 'bg-orange-100 dark:bg-orange-900/30'
                      : 'bg-muted'
                    )}>
                      {isDone
                        ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                        : <Icon className={cn('w-4 h-4', isActive ? 'text-orange-500 animate-pulse' : 'text-muted-foreground')} />
                      }
                    </div>

                    {/* Label */}
                    <span className={cn(
                      'text-sm flex-1',
                      isDone   ? 'text-green-700 dark:text-green-400 font-medium'
                      : isActive ? 'text-orange-700 dark:text-orange-400 font-medium'
                      : 'text-muted-foreground'
                    )}>
                      {step.label}
                    </span>

                    {/* Threshold badge */}
                    <span className={cn(
                      'text-xs font-mono px-1.5 py-0.5 rounded',
                      isDone ? 'text-green-600 bg-green-100 dark:bg-green-900/30'
                      : 'text-muted-foreground bg-muted'
                    )}>
                      {step.threshold}%
                    </span>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* ── Completed CTA ── */}
          {isCompleted && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="flex justify-center">
              <button
                onClick={() => router.push(`/dashboard/assignments/${assignmentId}/result`)}
                className="flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-full font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                View Question Paper <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* ── Failed CTA ── */}
          {isFailed && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="flex justify-center gap-3">
              <button
                onClick={() => router.push('/dashboard/assignments/create')}
                className="flex items-center gap-2 px-5 py-2.5 border border-border rounded-full text-sm font-semibold hover:bg-accent transition-colors"
              >
                Create New
              </button>
              <button
                onClick={async () => {
                  try {
                    await api.post(`/assignments/${assignmentId}/regenerate`);
                    doneRef.current = false;
                    setLocalStatus('processing');
                    setLocalProgress(0);
                    setLocalMessage('Retrying generation...');
                  } catch { /* ignore */ }
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                <RefreshCw className="w-4 h-4" /> Retry
              </button>
            </motion.div>
          )}

          {/* ── Info note ── */}
          {!isFailed && !isCompleted && (
            <p className="text-center text-xs text-muted-foreground">
              This usually takes 15–30 seconds. Please don&apos;t close this tab.
            </p>
          )}
        </motion.div>
      </main>
    </>
  );
}
