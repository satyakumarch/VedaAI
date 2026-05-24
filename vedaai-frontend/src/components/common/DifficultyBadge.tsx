import { cn, difficultyConfig } from '@/lib/utils';
import { Difficulty } from '@/types';

interface DifficultyBadgeProps {
  difficulty: Difficulty;
  size?: 'sm' | 'md';
  className?: string;
}

export default function DifficultyBadge({
  difficulty,
  size = 'sm',
  className,
}: DifficultyBadgeProps) {
  const cfg = difficultyConfig[difficulty];

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border',
        cfg.color,
        cfg.bg,
        cfg.border,
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1',
        className
      )}
    >
      {cfg.label}
    </span>
  );
}
