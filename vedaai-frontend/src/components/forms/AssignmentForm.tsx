'use client';

import { useCallback, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Upload,
  X,
  ChevronRight,
  BookOpen,
  Target,
  Settings,
  AlertCircle,
} from 'lucide-react';
import { useAssignmentStore } from '@/store/assignmentStore';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { QuestionType } from '@/types';

// ── Validation Schema ────────────────────────────────────────
const schema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  subject: z.string().min(2, 'Subject is required').max(100),
  topic: z.string().min(2, 'Topic is required').max(200),
  dueDate: z.string().min(1, 'Due date is required'),
  questionTypes: z.array(z.string()).min(1, 'Select at least one question type'),
  numberOfQuestions: z
    .number({ invalid_type_error: 'Must be a number' })
    .int()
    .min(1, 'Minimum 1 question')
    .max(100, 'Maximum 100 questions'),
  totalMarks: z
    .number({ invalid_type_error: 'Must be a number' })
    .int()
    .min(1, 'Minimum 1 mark')
    .max(500, 'Maximum 500 marks'),
  difficultyDistribution: z
    .object({
      easy: z.number().min(0).max(100),
      medium: z.number().min(0).max(100),
      hard: z.number().min(0).max(100),
    })
    .refine((d) => d.easy + d.medium + d.hard === 100, {
      message: 'Must sum to 100%',
    }),
  instructions: z.string().max(1000).optional(),
});

type FormValues = z.infer<typeof schema>;

const QUESTION_TYPES: { value: QuestionType; label: string; desc: string }[] = [
  { value: 'mcq', label: 'MCQ', desc: 'Multiple choice with 4 options' },
  { value: 'short_answer', label: 'Short Answer', desc: '2-4 sentence responses' },
  { value: 'long_answer', label: 'Long Answer', desc: 'Detailed essay responses' },
  { value: 'true_false', label: 'True / False', desc: 'Binary answer questions' },
];

export default function AssignmentForm() {
  const router = useRouter();
  const { createAssignment, isCreating, draftForm, setDraftForm } = useAssignmentStore();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: draftForm.title,
      subject: draftForm.subject,
      topic: draftForm.topic,
      dueDate: draftForm.dueDate,
      questionTypes: draftForm.questionTypes,
      numberOfQuestions: draftForm.numberOfQuestions,
      totalMarks: draftForm.totalMarks,
      difficultyDistribution: draftForm.difficultyDistribution,
      instructions: draftForm.instructions,
    },
  });

  const watchedTypes = watch('questionTypes') as QuestionType[];
  const watchedDiff = watch('difficultyDistribution');

  // Auto-save draft on change
  const watchAll = watch();
  const saveDraft = useCallback(() => {
    setDraftForm(watchAll as Partial<typeof draftForm>);
  }, [watchAll, setDraftForm]);

  // File dropzone
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) setUploadedFile(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'text/plain': ['.txt'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    onDropRejected: (files) => {
      const err = files[0]?.errors[0];
      toast.error(err?.message ?? 'File rejected');
    },
  });

  const toggleQuestionType = (type: QuestionType) => {
    const current = watchedTypes ?? [];
    const updated = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    setValue('questionTypes', updated, { shouldValidate: true });
  };

  const onSubmit = async (values: FormValues) => {
    const formData = new FormData();
    Object.entries(values).forEach(([key, val]) => {
      if (key === 'difficultyDistribution' || key === 'questionTypes') {
        formData.append(key, JSON.stringify(val));
      } else {
        formData.append(key, String(val));
      }
    });
    if (uploadedFile) formData.append('file', uploadedFile);

    try {
      const assignment = await createAssignment(formData);
      toast.success('Assignment created! Generating your paper...');
      router.push(`/assignment/${assignment._id}/generating`);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to create assignment';
      toast.error(msg);
    }
  };

  const diffSum = (watchedDiff?.easy ?? 0) + (watchedDiff?.medium ?? 0) + (watchedDiff?.hard ?? 0);

  return (
    <form onSubmit={handleSubmit(onSubmit)} onChange={saveDraft} className="space-y-8">
      {/* ── Section 1: Basic Info ── */}
      <FormSection
        icon={<BookOpen className="w-5 h-5" />}
        title="Assignment Details"
        step={1}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <FormField label="Assignment Title" error={errors.title?.message} required>
              <input
                {...register('title')}
                placeholder="e.g. Mid-Term Examination — Computer Networks"
                className={inputClass(!!errors.title)}
              />
            </FormField>
          </div>
          <FormField label="Subject" error={errors.subject?.message} required>
            <input
              {...register('subject')}
              placeholder="e.g. Computer Science"
              className={inputClass(!!errors.subject)}
            />
          </FormField>
          <FormField label="Topic" error={errors.topic?.message} required>
            <input
              {...register('topic')}
              placeholder="e.g. OSI Model & TCP/IP"
              className={inputClass(!!errors.topic)}
            />
          </FormField>
          <FormField label="Due Date" error={errors.dueDate?.message} required>
            <input
              {...register('dueDate')}
              type="date"
              min={new Date().toISOString().split('T')[0]}
              className={inputClass(!!errors.dueDate)}
            />
          </FormField>
        </div>
      </FormSection>

      {/* ── Section 2: Question Config ── */}
      <FormSection
        icon={<Target className="w-5 h-5" />}
        title="Question Configuration"
        step={2}
      >
        {/* Question Types */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Question Types <span className="text-destructive">*</span>
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {QUESTION_TYPES.map((qt) => {
              const selected = watchedTypes?.includes(qt.value);
              return (
                <button
                  key={qt.value}
                  type="button"
                  onClick={() => toggleQuestionType(qt.value)}
                  className={cn(
                    'p-3 rounded-xl border-2 text-left transition-all',
                    selected
                      ? 'border-veda-500 bg-veda-50 dark:bg-veda-950/30'
                      : 'border-border hover:border-veda-300 bg-card'
                  )}
                >
                  <div
                    className={cn(
                      'text-sm font-semibold',
                      selected ? 'text-veda-700 dark:text-veda-400' : 'text-foreground'
                    )}
                  >
                    {qt.label}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{qt.desc}</div>
                </button>
              );
            })}
          </div>
          {errors.questionTypes && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.questionTypes.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
          <FormField
            label="Number of Questions"
            error={errors.numberOfQuestions?.message}
            required
          >
            <input
              {...register('numberOfQuestions', { valueAsNumber: true })}
              type="number"
              min={1}
              max={100}
              className={inputClass(!!errors.numberOfQuestions)}
            />
          </FormField>
          <FormField label="Total Marks" error={errors.totalMarks?.message} required>
            <input
              {...register('totalMarks', { valueAsNumber: true })}
              type="number"
              min={1}
              max={500}
              className={inputClass(!!errors.totalMarks)}
            />
          </FormField>
        </div>

        {/* Difficulty Distribution */}
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">
              Difficulty Distribution <span className="text-destructive">*</span>
            </label>
            <span
              className={cn(
                'text-xs font-mono px-2 py-0.5 rounded',
                diffSum === 100
                  ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30'
                  : 'text-destructive bg-destructive/10'
              )}
            >
              {diffSum}% / 100%
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {(['easy', 'medium', 'hard'] as const).map((level) => {
              const colors = {
                easy: 'text-emerald-600 border-emerald-200 focus:ring-emerald-500',
                medium: 'text-amber-600 border-amber-200 focus:ring-amber-500',
                hard: 'text-red-600 border-red-200 focus:ring-red-500',
              };
              return (
                <div key={level} className="space-y-1">
                  <label className={cn('text-xs font-semibold capitalize', colors[level])}>
                    {level}
                  </label>
                  <div className="relative">
                    <Controller
                      name={`difficultyDistribution.${level}`}
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="number"
                          min={0}
                          max={100}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          className={cn(
                            'w-full rounded-lg border px-3 py-2 text-sm pr-8',
                            'bg-background focus:outline-none focus:ring-2',
                            colors[level]
                          )}
                        />
                      )}
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      %
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          {errors.difficultyDistribution && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {(errors.difficultyDistribution as { message?: string })?.message ??
                'Distribution must sum to 100%'}
            </p>
          )}
        </div>
      </FormSection>

      {/* ── Section 3: Additional ── */}
      <FormSection
        icon={<Settings className="w-5 h-5" />}
        title="Additional Options"
        step={3}
      >
        <FormField label="Additional Instructions" error={errors.instructions?.message}>
          <textarea
            {...register('instructions')}
            rows={3}
            placeholder="Any specific instructions for the AI (e.g. focus on practical examples, avoid repetition...)"
            className={cn(inputClass(!!errors.instructions), 'resize-none')}
          />
        </FormField>

        {/* File Upload */}
        <div className="mt-5 space-y-2">
          <label className="text-sm font-medium text-foreground">
            Reference Material{' '}
            <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <div
            {...getRootProps()}
            className={cn(
              'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all',
              isDragActive
                ? 'border-veda-500 bg-veda-50 dark:bg-veda-950/20'
                : 'border-border hover:border-veda-400 hover:bg-accent/50'
            )}
          >
            <input {...getInputProps()} />
            <AnimatePresence mode="wait">
              {uploadedFile ? (
                <motion.div
                  key="file"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center justify-center gap-3"
                >
                  <FileText className="w-8 h-8 text-veda-500" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">{uploadedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(uploadedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setUploadedFile(null);
                    }}
                    className="ml-2 p-1 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-2"
                >
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground">
                    {isDragActive
                      ? 'Drop your file here...'
                      : 'Drag & drop a PDF or TXT file, or click to browse'}
                  </p>
                  <p className="text-xs text-muted-foreground">Max 10MB</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </FormSection>

      {/* ── Submit ── */}
      <motion.button
        type="submit"
        disabled={isCreating}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className={cn(
          'w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl',
          'bg-gradient-to-r from-veda-600 to-purple-600 text-white font-semibold text-base',
          'shadow-lg shadow-veda-500/25 hover:shadow-veda-500/40 transition-all',
          'disabled:opacity-60 disabled:cursor-not-allowed'
        )}
      >
        {isCreating ? (
          <>
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Creating Assignment...
          </>
        ) : (
          <>
            Generate Question Paper
            <ChevronRight className="w-5 h-5" />
          </>
        )}
      </motion.button>
    </form>
  );
}

// ── Helper Components ────────────────────────────────────────
function FormSection({
  icon,
  title,
  step,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  step: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: step * 0.1 }}
      className="bg-card border border-border rounded-2xl p-6 space-y-5"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-veda-100 dark:bg-veda-950/50 text-veda-600 dark:text-veda-400 flex items-center justify-center">
          {icon}
        </div>
        <h3 className="font-semibold text-foreground">{title}</h3>
        <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          Step {step}
        </span>
      </div>
      {children}
    </motion.div>
  );
}

function FormField({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

const inputClass = (hasError: boolean) =>
  cn(
    'w-full rounded-lg border px-3 py-2.5 text-sm bg-background',
    'focus:outline-none focus:ring-2 focus:ring-veda-500/50 focus:border-veda-500',
    'placeholder:text-muted-foreground transition-colors',
    hasError ? 'border-destructive focus:ring-destructive/50' : 'border-input'
  );
