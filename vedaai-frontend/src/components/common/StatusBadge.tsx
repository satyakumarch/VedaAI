import { cn, statusConfig } from '@/lib/utils';
import { AssignmentStatus } from '@/types';

interface StatusBadgeProps {
  status: AssignmentStatus;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const cfg = statusConfig[status] ?? statusConfig.draft;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full',
        cfg.color,
        cfg.bg,
        className
      )}
    >
      {['queued', 'processing'].includes(status) && (
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      )}
      {cfg.label}
    </span>
  );
}
