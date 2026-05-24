// ============================================================
// VedaAI Frontend - Assignment Zustand Store
// Persists draft assignment state
// ============================================================
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Assignment, AssignmentFormData, DifficultyDistribution } from '@/types';
import api from '@/lib/axios';

const defaultFormData: AssignmentFormData = {
  title: '',
  subject: '',
  topic: '',
  dueDate: '',
  questionTypes: ['mcq'],
  numberOfQuestions: 10,
  totalMarks: 50,
  difficultyDistribution: { easy: 40, medium: 40, hard: 20 },
  instructions: '',
  file: null,
};

interface AssignmentState {
  // Draft form state (persisted)
  draftForm: AssignmentFormData;
  setDraftForm: (data: Partial<AssignmentFormData>) => void;
  resetDraftForm: () => void;

  // Assignment list
  assignments: Assignment[];
  isLoadingList: boolean;
  fetchAssignments: () => Promise<void>;

  // Current assignment
  currentAssignment: Assignment | null;
  setCurrentAssignment: (a: Assignment | null) => void;
  fetchAssignment: (id: string) => Promise<Assignment>;

  // Create
  isCreating: boolean;
  createAssignment: (formData: FormData) => Promise<Assignment>;
}

export const useAssignmentStore = create<AssignmentState>()(
  persist(
    (set, get) => ({
      draftForm: defaultFormData,

      setDraftForm: (data) =>
        set((state) => ({ draftForm: { ...state.draftForm, ...data } })),

      resetDraftForm: () => set({ draftForm: defaultFormData }),

      assignments: [],
      isLoadingList: false,

      fetchAssignments: async () => {
        set({ isLoadingList: true });
        try {
          const { data } = await api.get('/assignments');
          set({ assignments: data.data.assignments, isLoadingList: false });
        } catch {
          set({ isLoadingList: false });
        }
      },

      currentAssignment: null,
      setCurrentAssignment: (a) => set({ currentAssignment: a }),

      fetchAssignment: async (id) => {
        const { data } = await api.get(`/assignments/${id}`);
        const assignment = data.data as Assignment;
        set({ currentAssignment: assignment });
        return assignment;
      },

      isCreating: false,

      createAssignment: async (formData) => {
        set({ isCreating: true });
        try {
          const { data } = await api.post('/assignments', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          const assignment = data.data.assignment as Assignment;
          set((state) => ({
            assignments: [assignment, ...state.assignments],
            currentAssignment: assignment,
            isCreating: false,
          }));
          return assignment;
        } catch (error) {
          set({ isCreating: false });
          throw error;
        }
      },
    }),
    {
      name: 'vedaai-assignment',
      partialize: (state) => ({ draftForm: state.draftForm }),
    }
  )
);
