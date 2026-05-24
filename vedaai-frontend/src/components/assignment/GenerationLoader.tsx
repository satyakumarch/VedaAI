'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGenerationSocket } from '@/hooks/useGenerationSocket';
import { useGenerationStore } from '@/store/generationStore';
import { useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, Sparkles, Brain, FileText, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GenerationLoaderProps {
  assignmentId: string;
}

const STEPS = [
  { icon: Brain, label: 'Analyzing topic & requirements', threshold: 20 },
  { icon: Sparkles, label: 'Generating questions with AI', threshold: 50 },
  { icon: FileText, label: 'Structuring sections', threshold: 80 },
  { icon: Zap, label: 'Finalizing question paper', threshold: 95 },
];

export default function GenerationLoader({ assignmentId }: GenerationLoaderProps) {
  const router = useRouter();
  const { status, progress, message, error } = useGenerationStore();

  useGenerationSocket(assignmentId);

  // Redirect to result page when done
  useEffect(() => {
    if (status === 'completed') {
      const timer = setTimeout(() => {
        router.push(`/assignment/${assignmentId}/result`);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [status, assignmentId, router]);

  const isCompleted = status === 'completed';
  const isFailed = status === 'failed';

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center py-16 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md space-y-8 text-center"
      >
        {/* Animated Icon */}
        <div className="relative mx-auto w-24 h-24">
          <AnimatePresence mode="wait">
            {isCompleted ? (
              <motion.div
                key="done"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-24 h-24 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center"
              >
                <CheckCircle2 className="w-12 h-12 text-emerald-500" />
              </motion.div>
            ) : isFailed ? (
              <motion.div
                key="failed"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-24 h-24 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center"
              >
                <XCircle className="w-12 h-12 text-red-500" />
              </motion.div>
            ) : (
              <motion.div
                key="loading"
                className="w-24 h-24 rounded-full bg-veda-100 dark:bg-veda-950/30 flex items-center justify-center"
              >
                {/* Spinning ring */}
                <svg className="absolute inset-0 w-24 h-24 -rotate-90" viewBox="0 0 96 96">
                  <circle
                    cx="48"
                    cy="48"
                    r="44"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="text-veda-100 dark:text-veda-900"
                  />
                  <motion.circle
                    cx="48"
                    cy="48"
                    r="44"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    className="text-veda-500"
                    strokeDasharray={`${2 * Math.PI * 44}`}
                    strokeDashoffset={`${2 * Math.PI * 44 * (1 - progress / 100)}`}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </svg>
                <Sparkles className="w-10 h-10 text-veda-500 animate-pulse" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">
            {isCompleted
              ? 'Paper Ready!'
              : isFailed
              ? 'Generation Failed'
              : 'Generating Your Paper'}
          </h2>
          <p className="text-muted-foreground text-sm">
            {isFailed
              ? error ?? 'Something went wrong. Please try again.'
              : message || 'Please wait while AI crafts your question paper...'}
          </p>
        </div>

        {/* Progress bar */}
        {!isFailed && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className={cn(
                  'h-full rounded-full',
                  isCompleted
                    ? 'bg-emerald-500'
                    : 'bg-gradient-to-r from-veda-500 to-purple-500'
                )}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}

        {/* Steps */}
        {!isFailed && (
          <div className="space-y-3 text-left">
            {STEPS.map((step, i) => {
              const StepIcon = step.icon;
              const isDone = progress >= step.threshold;
              const isActive =
                progress >= (STEPS[i - 1]?.threshold ?? 0) && progress < step.threshold;

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg transition-all',
                    isDone
                      ? 'bg-emerald-50 dark:bg-emerald-950/20'
                      : isActive
                      ? 'bg-veda-50 dark:bg-veda-950/20'
                      : 'bg-muted/50'
                  )}
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                      isDone
                        ? 'bg-emerald-100 dark:bg-emerald-900/30'
                        : isActive
                        ? 'bg-veda-100 dark:bg-veda-900/30'
                        : 'bg-muted'
                    )}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <StepIcon
                        className={cn(
                          'w-4 h-4',
                          isActive
                            ? 'text-veda-500 animate-pulse'
                            : 'text-muted-foreground'
                        )}
                      />
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-sm',
                      isDone
                        ? 'text-emerald-700 dark:text-emerald-400 font-medium'
                        : isActive
                        ? 'text-veda-700 dark:text-veda-400 font-medium'
                        : 'text-muted-foreground'
                    )}
                  >
                    {step.label}
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Retry button on failure */}
        {isFailed && (
          <button
            onClick={() => router.push('/assignment/create')}
            className="px-6 py-2.5 bg-veda-600 hover:bg-veda-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Try Again
          </button>
        )}
      </motion.div>
    </div>
  );
}
