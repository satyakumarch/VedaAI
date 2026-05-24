import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Difficulty } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const difficultyConfig: Record<
  Difficulty,
  { label: string; color: string; bg: string; border: string }
> = {
  easy: {
    label:  'Easy',
    color:  'text-emerald-700 dark:text-emerald-400',
    bg:     'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  medium: {
    label:  'Medium',
    color:  'text-amber-700 dark:text-amber-400',
    bg:     'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
  },
  hard: {
    label:  'Hard',
    color:  'text-red-700 dark:text-red-400',
    bg:     'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-200 dark:border-red-800',
  },
};

export const questionTypeLabels: Record<string, string> = {
  mcq:          'Multiple Choice',
  short_answer: 'Short Answer',
  long_answer:  'Long Answer',
  true_false:   'True / False',
  diagram:      'Diagram / Graph',
  numerical:    'Numerical',
  fill_blanks:  'Fill in Blanks',
};

export const formatDate = (date: string | Date): string =>
  new Date(date).toLocaleDateString('en-IN', {
    day:   '2-digit',
    month: '2-digit',
    year:  'numeric',
  });

export const formatRelativeTime = (date: string | Date): string => {
  const diff    = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours   = Math.floor(diff / 3600000);
  const days    = Math.floor(diff / 86400000);
  if (minutes < 1)  return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24)   return `${hours}h ago`;
  return `${days}d ago`;
};

export const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  draft:      { label: 'Draft',      color: 'text-gray-600',    bg: 'bg-gray-100' },
  queued:     { label: 'Queued',     color: 'text-blue-600',    bg: 'bg-blue-100' },
  processing: { label: 'Processing', color: 'text-orange-600',  bg: 'bg-orange-100' },
  completed:  { label: 'Completed',  color: 'text-emerald-600', bg: 'bg-emerald-100' },
  failed:     { label: 'Failed',     color: 'text-red-600',     bg: 'bg-red-100' },
};
