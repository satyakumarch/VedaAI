'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Sparkles, Brain, FileText, Zap } from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import { useGenerationSocket } from '@/hooks/useGenerationSocket';
import { useGenerationStore } from '@/store/generationStore';
import { cn } from '@/lib/utils';

const STEPS = [
  { icon: Brain,    label: 'Analyzing topic & requirements', threshold: 20 },
  { icon: Sparkles, label: 'Generating questions with AI',   threshold: 50 },
  { icon: FileText, label: 'Structuring sections',           threshold: 80 },
  { icon: Zap,      label: 'Finalizing question paper',      threshold: 95 },
];

export default function GeneratingPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params.id as string;
  const { status, progress, message, error, reset } = useGenerationStore();

  useEffect(() => { reset(); }, [reset]);
  useGenerationSocket(assignmentId);

  useEffect(() => {
    if (status === 'completed') {
      const t = setTimeout(() => router.push(`/dashboard/assignments/${assignmentId}/result`), 1200);
      return () => clearTimeout(t);
    }
  }, [status, assignmentId, router]);

  const isCompleted = status === 'completed';
  const isFailed    = status === 'failed';

  return (
    <>
      <TopBar title="Generating Paper" />
      <main className="flex-1 overflow-auto flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center space-y-8"
        >
          {/* Icon */}
          <div className="relative mx-auto w-24 h-24">
            <AnimatePresence mode="wait">
              {isCompleted ? (
                <motion.div key="done" initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-950/30 flex items-center justify-center">
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                </motion.div>
              ) : isFailed ? (
                <motion.div key="fail" initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className="w-24 h-24 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
                  <XCircle className="w-12 h-12 text-red-500" />
                </motion.div>
              ) : (
                <motion.div key="spin" className="w-24 h-24 rounded-full bg-orange-50 dark:bg-orange-950/20 flex items-center justify-center">
                  <svg className="absolute inset-0 w-24 h-24 -rotate-90" viewBox="0 0 96 96">
                    <circle cx="48" cy="48" r="44" fill="none" stroke="currentColor" strokeWidth="4" className="text-orange-100 dark:text-orange-900" />
                    <motion.circle cx="48" cy="48" r="44" fill="none" stroke="currentColor" strokeWidth="4"
                      strokeLinecap="round" className="text-orange-500"
                      strokeDasharray={`${2 * Math.PI * 44}`}
                      strokeDashoffset={`${2 * Math.PI * 44 * (1 - progress / 100)}`}
                      transition={{ duration: 0.5, ease: 'easeOut' }} />
                  </svg>
                  <Sparkles className="w-10 h-10 text-orange-500 animate-pulse" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Title */}
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-foreground">
              {isCompleted ? 'Paper Ready!' : isFailed ? 'Generation Failed' : 'Generating Your Paper'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isFailed ? (error ?? 'Something went wrong.') : (message || 'AI is crafting your question paper...')}
            </p>
          </div>

          {/* Progress bar */}
          {!isFailed && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progress</span><span>{progress}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className={cn('h-full rounded-full', isCompleted ? 'bg-green-500' : 'bg-orange-500')}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>
          )}

          {/* Steps */}
          {!isFailed && (
            <div className="space-y-2 text-left">
              {STEPS.map((step, i) => {
                const Icon    = step.icon;
                const isDone  = progress >= step.threshold;
                const isActive = progress >= (STEPS[i - 1]?.threshold ?? 0) && progress < step.threshold;
                return (
                  <div key={i} className={cn('flex items-center gap-3 p-3 rounded-lg transition-all',
                    isDone ? 'bg-green-50 dark:bg-green-950/20' : isActive ? 'bg-orange-50 dark:bg-orange-950/10' : 'bg-muted/40')}>
                    <div className={cn('w-7 h-7 rounded-full flex items-center justify-center shrink-0',
                      isDone ? 'bg-green-100' : isActive ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-muted')}>
                      {isDone
                        ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                        : <Icon className={cn('w-4 h-4', isActive ? 'text-orange-500 animate-pulse' : 'text-muted-foreground')} />}
                    </div>
                    <span className={cn('text-sm', isDone ? 'text-green-700 dark:text-green-400 font-medium' : isActive ? 'text-orange-700 dark:text-orange-400 font-medium' : 'text-muted-foreground')}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {isFailed && (
            <button onClick={() => router.push('/dashboard/assignments/create')}
              className="px-6 py-2.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity">
              Try Again
            </button>
          )}
        </motion.div>
      </main>
    </>
  );
}
