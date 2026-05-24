'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import QuestionPaper from '@/components/paper/QuestionPaper';
import { AssignmentCardSkeleton } from '@/components/common/SkeletonCard';
import { useRequireAuth } from '@/hooks/useAuth';
import { useGenerationStore } from '@/store/generationStore';
import { useAssignmentStore } from '@/store/assignmentStore';
import { Assignment } from '@/types';
import api from '@/lib/axios';
import { toast } from 'sonner';

export default function ResultPage() {
  useRequireAuth();
  const params = useParams();
  const router = useRouter();
  const assignmentId = params.id as string;

  const { paper, fetchPaper, isLoading, error } = useGenerationStore();
  const { fetchAssignment } = useAssignmentStore();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [a] = await Promise.all([
        fetchAssignment(assignmentId),
        fetchPaper(assignmentId),
      ]);
      setAssignment(a);
    };
    load();
  }, [assignmentId, fetchAssignment, fetchPaper]);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      await api.post(`/assignments/${assignmentId}/regenerate`);
      toast.success('Regeneration started!');
      router.push(`/assignment/${assignmentId}/generating`);
    } catch {
      toast.error('Failed to start regeneration');
      setIsRegenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {isLoading || !paper || !assignment ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <AssignmentCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Failed to load paper
            </h2>
            <p className="text-muted-foreground text-sm mb-6">{error}</p>
            <button
              onClick={handleRegenerate}
              className="px-5 py-2.5 bg-veda-600 hover:bg-veda-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Try Regenerating
            </button>
          </motion.div>
        ) : (
          <QuestionPaper
            paper={paper}
            assignment={assignment}
            onRegenerate={handleRegenerate}
            isRegenerating={isRegenerating}
          />
        )}
      </main>
    </div>
  );
}
