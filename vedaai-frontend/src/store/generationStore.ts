// ============================================================
// VedaAI Frontend - Generation Progress Zustand Store
// ============================================================
import { create } from 'zustand';
import { GeneratedPaper, AssignmentStatus, Section } from '@/types';
import api from '@/lib/axios';

interface GenerationState {
  status: AssignmentStatus | null;
  progress: number;
  message: string;
  paper: GeneratedPaper | null;
  isLoading: boolean;
  error: string | null;

  setProgress: (progress: number, message: string, status: AssignmentStatus) => void;
  setPaper: (paper: GeneratedPaper) => void;
  setError: (error: string) => void;
  reset: () => void;
  fetchPaper: (assignmentId: string) => Promise<GeneratedPaper | null>;
  updateQuestion: (
    assignmentId: string,
    sectionIndex: number,
    questionIndex: number,
    data: Partial<{ question: string; marks: number; difficulty: string }>
  ) => Promise<void>;
}

export const useGenerationStore = create<GenerationState>((set, get) => ({
  status: null,
  progress: 0,
  message: '',
  paper: null,
  isLoading: false,
  error: null,

  setProgress: (progress, message, status) =>
    set({ progress, message, status }),

  setPaper: (paper) => set({ paper, status: 'completed', progress: 100 }),

  setError: (error) => set({ error, status: 'failed' }),

  reset: () =>
    set({ status: null, progress: 0, message: '', paper: null, error: null }),

  fetchPaper: async (assignmentId) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get(`/papers/${assignmentId}`);
      const paper = data.data as GeneratedPaper;
      set({ paper, isLoading: false, status: 'completed' });
      return paper;
    } catch {
      set({ isLoading: false, error: 'Failed to load paper' });
      return null;
    }
  },

  updateQuestion: async (assignmentId, sectionIndex, questionIndex, data) => {
    const { data: res } = await api.patch(
      `/papers/${assignmentId}/sections/${sectionIndex}/questions/${questionIndex}`,
      data
    );
    set({ paper: res.data as GeneratedPaper });
  },
}));
