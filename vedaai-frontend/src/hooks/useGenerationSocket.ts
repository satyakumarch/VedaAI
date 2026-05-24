// ============================================================
// VedaAI Frontend - Generation Socket Hook
// ============================================================
'use client';

import { useEffect, useCallback } from 'react';
import { getSocket, joinAssignmentRoom, leaveAssignmentRoom } from '@/lib/socket';
import { useGenerationStore } from '@/store/generationStore';
import { GenerationProgressPayload } from '@/types';

export const useGenerationSocket = (assignmentId: string | null) => {
  const { setProgress, setPaper, setError, fetchPaper } = useGenerationStore();

  const handleStarted = useCallback(
    (payload: GenerationProgressPayload) => {
      setProgress(payload.progress, payload.message, 'processing');
    },
    [setProgress]
  );

  const handleProgress = useCallback(
    (payload: GenerationProgressPayload) => {
      setProgress(payload.progress, payload.message, 'processing');
    },
    [setProgress]
  );

  const handleCompleted = useCallback(
    async (payload: GenerationProgressPayload) => {
      setProgress(100, payload.message, 'completed');
      // Fetch the full paper from API
      if (assignmentId) {
        await fetchPaper(assignmentId);
      }
    },
    [setProgress, fetchPaper, assignmentId]
  );

  const handleFailed = useCallback(
    (payload: GenerationProgressPayload) => {
      setError(payload.message);
    },
    [setError]
  );

  useEffect(() => {
    if (!assignmentId) return;

    const socket = getSocket();
    joinAssignmentRoom(assignmentId);

    socket.on('generation_started', handleStarted);
    socket.on('generation_progress', handleProgress);
    socket.on('generation_completed', handleCompleted);
    socket.on('generation_failed', handleFailed);

    return () => {
      leaveAssignmentRoom(assignmentId);
      socket.off('generation_started', handleStarted);
      socket.off('generation_progress', handleProgress);
      socket.off('generation_completed', handleCompleted);
      socket.off('generation_failed', handleFailed);
    };
  }, [assignmentId, handleStarted, handleProgress, handleCompleted, handleFailed]);
};
