'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import GenerationLoader from '@/components/assignment/GenerationLoader';
import { useRequireAuth } from '@/hooks/useAuth';
import { useGenerationStore } from '@/store/generationStore';
import { useAssignmentStore } from '@/store/assignmentStore';

export default function GeneratingPage() {
  useRequireAuth();
  const params = useParams();
  const assignmentId = params.id as string;
  const { reset } = useGenerationStore();
  const { fetchAssignment } = useAssignmentStore();

  useEffect(() => {
    reset();
    fetchAssignment(assignmentId);
  }, [assignmentId, reset, fetchAssignment]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <GenerationLoader assignmentId={assignmentId} />
      </main>
    </div>
  );
}
