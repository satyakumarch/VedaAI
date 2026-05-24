'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar, FileQuestion, ArrowRight, Trash2 } from 'lucide-react';
import { Assignment } from '@/types';
import StatusBadge from '@/components/common/StatusBadge';
import { formatDate, formatRelativeTime, questionTypeLabels } from '@/lib/utils';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { useAssignmentStore } from '@/store/assignmentStore';

interface AssignmentCardProps {
  assignment: Assignment;
  index?: number;
}

export default function AssignmentCard({ assignment, index = 0 }: AssignmentCardProps) {
  const { fetchAssignments } = useAssignmentStore();

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm('Delete this assignment and its generated paper?')) return;
    try {
      await api.delete(`/assignments/${assignment._id}`);
      toast.success('Assignment deleted');
      fetchAssignments();
    } catch {
      toast.error('Failed to delete assignment');
    }
  };

  const href =
    assignment.status === 'completed'
      ? `/assignment/${assignment._id}/result`
      : assignment.status === 'processing' || assignment.status === 'queued'
      ? `/assignment/${assignment._id}/generating`
      : `/assignment/${assignment._id}/result`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group"
    >
      <Link href={href}>
        <div className="bg-card border border-border rounded-xl p-5 hover:border-veda-300 dark:hover:border-veda-700 hover:shadow-md hover:shadow-veda-500/5 transition-all cursor-pointer">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate group-hover:text-veda-600 dark:group-hover:text-veda-400 transition-colors">
                {assignment.title}
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {assignment.subject} · {assignment.topic}
              </p>
            </div>
            <StatusBadge status={assignment.status} />
          </div>

          {/* Question types */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {assignment.questionTypes.map((type) => (
              <span
                key={type}
                className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded-full"
              >
                {questionTypeLabels[type]}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <FileQuestion className="w-3.5 h-3.5" />
                {assignment.numberOfQuestions} questions
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(assignment.dueDate)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span>{formatRelativeTime(assignment.createdAt)}</span>
              <button
                onClick={handleDelete}
                className="p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
