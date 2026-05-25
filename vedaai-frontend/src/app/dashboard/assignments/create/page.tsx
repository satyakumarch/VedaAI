'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Plus, Minus, X, ChevronDown, Mic, ArrowLeft, ArrowRight, FileText,
} from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import { useAssignmentStore } from '@/store/assignmentStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/* ── Question type options ── */
const QUESTION_TYPE_OPTIONS = [
  { value: 'mcq',          label: 'Multiple Choice Questions' },
  { value: 'short_answer', label: 'Short Questions' },
  { value: 'long_answer',  label: 'Long Answer Questions' },
  { value: 'true_false',   label: 'True/False Questions' },
  { value: 'diagram',      label: 'Diagram/Graph-Based Questions' },
  { value: 'numerical',    label: 'Numerical Problems' },
  { value: 'fill_blanks',  label: 'Fill in the Blanks' },
];

interface QuestionRow {
  id: string;
  type: string;
  count: number;
  marks: number;
}

const makeRow = (): QuestionRow => ({
  id:    Math.random().toString(36).slice(2),
  type:  'mcq',
  count: 4,
  marks: 1,
});

export default function CreateAssignmentPage() {
  const router = useRouter();
  const { createAssignment, isCreating } = useAssignmentStore();

  const [title,        setTitle]        = useState('');
  const [subject,      setSubject]      = useState('');
  const [topic,        setTopic]        = useState('');
  const [dueDate,      setDueDate]      = useState('');
  const [instructions, setInstructions] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [rows,         setRows]         = useState<QuestionRow[]>([makeRow()]);

  /* ── Dropzone ── */
  const onDrop = useCallback((files: File[]) => {
    if (files[0]) setUploadedFile(files[0]);
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'text/plain': ['.txt'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    onDropRejected: () => toast.error('Only PDF/TXT files up to 10 MB'),
  });

  /* ── Row helpers ── */
  const updateRow = (id: string, field: keyof QuestionRow, value: string | number) =>
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  const addRow    = () => setRows(prev => [...prev, makeRow()]);
  const removeRow = (id: string) =>
    setRows(prev => prev.length > 1 ? prev.filter(r => r.id !== id) : prev);

  const totalQuestions = rows.reduce((s, r) => s + r.count, 0);
  const totalMarks     = rows.reduce((s, r) => s + r.count * r.marks, 0);

  /* ── Submit ── */
  const handleSubmit = async () => {
    if (!title.trim())   { toast.error('Assignment title is required'); return; }
    if (!subject.trim()) { toast.error('Subject is required'); return; }
    if (!topic.trim())   { toast.error('Topic is required'); return; }
    if (!dueDate)        { toast.error('Due date is required'); return; }
    if (totalQuestions < 1) { toast.error('Add at least one question'); return; }

    // Build a rich instructions string from the row breakdown
    const rowDetail = rows
      .map(r => {
        const label = QUESTION_TYPE_OPTIONS.find(o => o.value === r.type)?.label ?? r.type;
        return `${r.count} ${label} (${r.marks} mark each)`;
      })
      .join(', ');

    const fullInstructions = [
      instructions.trim(),
      `Question breakdown: ${rowDetail}`,
    ].filter(Boolean).join('\n\n');

    // Unique question types from rows
    const questionTypes = Array.from(new Set(rows.map(r => r.type)));

    const formData = new FormData();
    formData.append('title',                title.trim());
    formData.append('subject',              subject.trim());
    formData.append('topic',                topic.trim());
    formData.append('dueDate',              dueDate);
    formData.append('numberOfQuestions',    String(totalQuestions));
    formData.append('totalMarks',           String(totalMarks));
    formData.append('questionTypes',        JSON.stringify(questionTypes));
    formData.append('difficultyDistribution', JSON.stringify({ easy: 40, medium: 40, hard: 20 }));
    formData.append('instructions',         fullInstructions);
    if (uploadedFile) formData.append('file', uploadedFile);

    try {
      const assignment = await createAssignment(formData);
      toast.success('Assignment created! Generating your paper...');
      router.push(`/dashboard/assignments/${assignment._id}/generating`);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string; errors?: { field: string; message: string }[] } } };
      const serverMsg = apiErr?.response?.data?.message;
      const errors    = apiErr?.response?.data?.errors;
      if (errors?.length) {
        errors.forEach(e => toast.error(`${e.field}: ${e.message}`));
      } else {
        toast.error(serverMsg ?? 'Failed to create assignment. Check backend is running.');
      }
      console.error('Create assignment error:', err);
    }
  };

  return (
    <>
      <TopBar title="Assignment" />
      <main className="flex-1 overflow-auto bg-[hsl(var(--background))]">

        {/* Page header */}
        <div className="px-8 pt-6 pb-2">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
            <h1 className="font-bold text-base text-foreground">Create Assignment</h1>
          </div>
          <p className="text-xs text-muted-foreground ml-4">Set up a new assignment for your students</p>
        </div>

        {/* Progress bar */}
        <div className="px-8 mb-5">
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div className="h-full w-1/2 bg-gray-900 dark:bg-gray-100 rounded-full transition-all" />
          </div>
        </div>

        {/* ── Form card ── */}
        <div className="px-8 pb-28">
          <div className="bg-card border border-border rounded-2xl p-8 max-w-2xl mx-auto space-y-6 shadow-sm">

            {/* Section heading */}
            <div>
              <h2 className="font-bold text-foreground">Assignment Details</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Basic information about your assignment</p>
            </div>

            {/* Title */}
            <Field label="Assignment Title" required>
              <input value={title} onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Mid-Term Examination — Computer Networks"
                className={inputCls} />
            </Field>

            {/* Subject + Topic */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Subject" required>
                <input value={subject} onChange={e => setSubject(e.target.value)}
                  placeholder="e.g. Science" className={inputCls} />
              </Field>
              <Field label="Topic" required>
                <input value={topic} onChange={e => setTopic(e.target.value)}
                  placeholder="e.g. Electricity" className={inputCls} />
              </Field>
            </div>

            {/* File upload */}
            <div
              {...getRootProps()}
              className={cn(
                'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
                isDragActive ? 'border-orange-400 bg-orange-50 dark:bg-orange-950/10' : 'border-border hover:border-orange-300'
              )}
            >
              <input {...getInputProps()} />
              <AnimatePresence mode="wait">
                {uploadedFile ? (
                  <motion.div key="file" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex items-center justify-center gap-3">
                    <FileText className="w-6 h-6 text-orange-500" />
                    <span className="text-sm font-medium text-foreground">{uploadedFile.name}</span>
                    <button type="button" onClick={e => { e.stopPropagation(); setUploadedFile(null); }}
                      className="p-1 rounded-full hover:bg-muted">
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </motion.div>
                ) : (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm font-medium text-foreground mb-1">
                      Choose a File or drag &amp; drop it here
                    </p>
                    <p className="text-xs text-muted-foreground mb-4">PDF, TXT, upto 10MB</p>
                    <button type="button"
                      className="px-5 py-1.5 border border-border rounded-lg text-sm font-medium hover:bg-accent transition-colors">
                      Browse Files
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <p className="text-xs text-muted-foreground text-center -mt-4">
              Upload reference material for better AI output (optional)
            </p>

            {/* Due Date */}
            <Field label="Due Date" required>
              <div className="relative">
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className={cn(inputCls, 'text-muted-foreground')} />
              </div>
            </Field>

            {/* ── Question type rows ── */}
            <div className="space-y-3">
              {/* Column headers */}
              <div className="grid grid-cols-[1fr_32px_90px_90px] gap-3 items-center">
                <span className="text-sm font-semibold text-foreground">Question Type</span>
                <span />
                <span className="text-xs font-semibold text-foreground text-center leading-tight">No. of<br/>Questions</span>
                <span className="text-xs font-semibold text-foreground text-center">Marks</span>
              </div>

              <AnimatePresence>
                {rows.map(row => (
                  <QuestionTypeRow
                    key={row.id}
                    row={row}
                    onChange={(f, v) => updateRow(row.id, f, v)}
                    onRemove={() => removeRow(row.id)}
                    canRemove={rows.length > 1}
                  />
                ))}
              </AnimatePresence>

              {/* Add row */}
              <button type="button" onClick={addRow}
                className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-orange-500 transition-colors mt-1">
                <span className="w-7 h-7 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 flex items-center justify-center shrink-0">
                  <Plus className="w-4 h-4" />
                </span>
                Add Question Type
              </button>

              {/* Totals */}
              <div className="text-right text-sm space-y-0.5 pt-3 border-t border-border">
                <p><span className="text-muted-foreground">Total Questions : </span><span className="font-semibold">{totalQuestions}</span></p>
                <p><span className="text-muted-foreground">Total Marks : </span><span className="font-semibold">{totalMarks}</span></p>
              </div>
            </div>

            {/* Additional info */}
            <Field label="Additional Information" hint="(For better output)">
              <div className="relative">
                <textarea value={instructions} onChange={e => setInstructions(e.target.value)}
                  rows={4} placeholder="e.g Generate a question paper for 3 hour exam duration..."
                  className={cn(inputCls, 'resize-none pr-10')} />
                <Mic className="absolute right-3 bottom-3 w-4 h-4 text-muted-foreground" />
              </div>
            </Field>
          </div>
        </div>

        {/* ── Bottom nav bar ── */}
        <div className="fixed bottom-0 left-[220px] right-0 flex items-center justify-between px-8 py-4 bg-card border-t border-border z-10">
          <button onClick={() => router.back()}
            className="flex items-center gap-2 px-6 py-2.5 border border-border rounded-full text-sm font-semibold hover:bg-accent transition-colors">
            <ArrowLeft className="w-4 h-4" /> Previous
          </button>
          <button onClick={handleSubmit} disabled={isCreating}
            className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
            {isCreating ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</>
            ) : (
              <>Next <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </main>
    </>
  );
}

/* ── Question Type Row ── */
function QuestionTypeRow({ row, onChange, onRemove, canRemove }: {
  row: QuestionRow;
  onChange: (field: keyof QuestionRow, val: string | number) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
      className="grid grid-cols-[1fr_32px_90px_90px] gap-3 items-center">
      {/* Type selector */}
      <div className="relative">
        <select value={row.type} onChange={e => onChange('type', e.target.value)}
          className="w-full appearance-none border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-orange-400/40 pr-8">
          {QUESTION_TYPE_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
      </div>
      {/* Remove */}
      <button type="button" onClick={onRemove} disabled={!canRemove}
        className="p-1 rounded hover:bg-muted transition-colors disabled:opacity-30 flex items-center justify-center">
        <X className="w-3.5 h-3.5 text-muted-foreground" />
      </button>
      {/* Count stepper */}
      <Stepper value={row.count} min={1} max={50} onChange={v => onChange('count', v)} />
      {/* Marks stepper */}
      <Stepper value={row.marks} min={1} max={20} onChange={v => onChange('marks', v)} />
    </motion.div>
  );
}

/* ── Stepper ── */
function Stepper({ value, min, max, onChange }: {
  value: number; min: number; max: number; onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between border border-border rounded-lg overflow-hidden h-10 bg-background">
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))}
        className="px-2.5 h-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
        <Minus className="w-3 h-3" />
      </button>
      <span className="text-sm font-semibold text-foreground w-6 text-center select-none">{value}</span>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))}
        className="px-2.5 h-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );
}

/* ── Field wrapper ── */
function Field({ label, hint, required, children }: {
  label: string; hint?: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-semibold text-foreground">
        {label}{' '}
        {hint && <span className="font-normal text-muted-foreground">{hint}</span>}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = 'w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-orange-400/40 placeholder:text-muted-foreground transition-colors';
