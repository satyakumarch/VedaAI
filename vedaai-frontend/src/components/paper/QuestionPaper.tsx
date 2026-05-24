'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  RefreshCw,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Edit3,
  Save,
  X,
} from 'lucide-react';
import { GeneratedPaper, Section, Question, Difficulty } from '@/types';
import { Assignment } from '@/types';
import DifficultyBadge from '@/components/common/DifficultyBadge';
import { cn, questionTypeLabels, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { useGenerationStore } from '@/store/generationStore';

interface QuestionPaperProps {
  paper: GeneratedPaper;
  assignment: Assignment;
  onRegenerate: () => void;
  isRegenerating?: boolean;
}

export default function QuestionPaper({
  paper,
  assignment,
  onRegenerate,
  isRegenerating,
}: QuestionPaperProps) {
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Set<number>>(new Set());

  const toggleSection = (idx: number) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const handleCopy = async () => {
    const text = paper.sections
      .map((s) => {
        const qs = s.questions
          .map((q, i) => {
            let qText = `Q${i + 1}. ${q.question} [${q.marks}M]`;
            if (q.options) qText += '\n' + q.options.join('\n');
            return qText;
          })
          .join('\n\n');
        return `${s.title}\n${s.instruction}\n\n${qs}`;
      })
      .join('\n\n---\n\n');

    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await api.get(`/papers/${assignment._id}/download`, {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${assignment.title.replace(/[^a-z0-9]/gi, '_')}_exam.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded');
    } catch {
      toast.error('Failed to download PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center gap-3 p-4 bg-card border border-border rounded-xl"
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground">
            {paper.totalQuestions} questions · {paper.totalMarks} marks ·{' '}
            {paper.sections.length} sections
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-border hover:bg-accent transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            onClick={onRegenerate}
            disabled={isRegenerating}
            className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-border hover:bg-accent transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn('w-4 h-4', isRegenerating && 'animate-spin')} />
            Regenerate
          </button>
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-veda-600 hover:bg-veda-700 text-white transition-colors disabled:opacity-50 shadow-sm"
          >
            <Download className={cn('w-4 h-4', isDownloading && 'animate-bounce')} />
            {isDownloading ? 'Downloading...' : 'Download PDF'}
          </button>
        </div>
      </motion.div>

      {/* Paper Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-2xl overflow-hidden"
      >
        {/* Header band */}
        <div className="bg-gradient-to-r from-veda-600 to-purple-700 px-6 py-5 text-white">
          <p className="text-xs uppercase tracking-widest opacity-75 mb-1">
            VedaAI Assessment Platform
          </p>
          <h1 className="text-2xl font-bold">{assignment.title}</h1>
          <p className="text-sm opacity-80 mt-1">
            {assignment.subject} · {assignment.topic}
          </p>
        </div>

        {/* Meta row */}
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-border">
          {[
            { label: 'Total Marks', value: paper.totalMarks },
            { label: 'Questions', value: paper.totalQuestions },
            { label: 'Sections', value: paper.sections.length },
            { label: 'Due Date', value: formatDate(assignment.dueDate) },
          ].map((item) => (
            <div key={item.label} className="px-4 py-3 text-center">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="font-semibold text-foreground">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Student info */}
        <div className="px-6 py-4 border-t border-border bg-muted/30">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Name', 'Roll Number', 'Section', 'Date'].map((field) => (
              <div key={field} className="space-y-1">
                <p className="text-xs text-muted-foreground">{field}</p>
                <div className="h-7 border-b-2 border-dashed border-border" />
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Sections */}
      {paper.sections.map((section, si) => (
        <SectionBlock
          key={si}
          section={section}
          sectionIndex={si}
          assignmentId={assignment._id}
          isCollapsed={collapsedSections.has(si)}
          onToggle={() => toggleSection(si)}
          startQuestionNumber={
            paper.sections.slice(0, si).reduce((sum, s) => sum + s.questions.length, 0) + 1
          }
        />
      ))}

      {/* Difficulty breakdown */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-card border border-border rounded-xl p-5"
      >
        <h3 className="text-sm font-semibold text-foreground mb-3">Difficulty Breakdown</h3>
        <div className="flex gap-4">
          {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => {
            const count = paper.difficultyBreakdown[d];
            const pct = Math.round((count / paper.totalQuestions) * 100);
            return (
              <div key={d} className="flex-1 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <DifficultyBadge difficulty={d} />
                  <span className="text-muted-foreground">{count} Qs</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                    className={cn(
                      'h-full rounded-full',
                      d === 'easy'
                        ? 'bg-emerald-500'
                        : d === 'medium'
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    )}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

// ── Section Block ────────────────────────────────────────────
function SectionBlock({
  section,
  sectionIndex,
  assignmentId,
  isCollapsed,
  onToggle,
  startQuestionNumber,
}: {
  section: Section;
  sectionIndex: number;
  assignmentId: string;
  isCollapsed: boolean;
  onToggle: () => void;
  startQuestionNumber: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: sectionIndex * 0.05 }}
      className="bg-card border border-border rounded-2xl overflow-hidden"
    >
      {/* Section header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-4 bg-veda-50 dark:bg-veda-950/20 hover:bg-veda-100 dark:hover:bg-veda-950/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="font-bold text-veda-700 dark:text-veda-400 text-lg">
            {section.title}
          </span>
          <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded-full border border-border">
            {section.questions.length} questions · {section.totalMarks} marks
          </span>
        </div>
        {isCollapsed ? (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        )}
      </button>

      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Instruction */}
            <div className="px-6 py-3 border-b border-border bg-muted/20">
              <p className="text-sm text-muted-foreground italic">{section.instruction}</p>
            </div>

            {/* Questions */}
            <div className="divide-y divide-border">
              {section.questions.map((question, qi) => (
                <QuestionRow
                  key={qi}
                  question={question}
                  questionNumber={startQuestionNumber + qi}
                  sectionIndex={sectionIndex}
                  questionIndex={qi}
                  assignmentId={assignmentId}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Question Row ─────────────────────────────────────────────
function QuestionRow({
  question,
  questionNumber,
  sectionIndex,
  questionIndex,
  assignmentId,
}: {
  question: Question;
  questionNumber: number;
  sectionIndex: number;
  questionIndex: number;
  assignmentId: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(question.question);
  const [isSaving, setIsSaving] = useState(false);
  const { updateQuestion } = useGenerationStore();

  const handleSave = async () => {
    if (editText.trim() === question.question) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    try {
      await updateQuestion(assignmentId, sectionIndex, questionIndex, {
        question: editText.trim(),
      });
      toast.success('Question updated');
      setIsEditing(false);
    } catch {
      toast.error('Failed to update question');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="px-6 py-4 hover:bg-muted/20 transition-colors group">
      <div className="flex items-start gap-3">
        {/* Question number */}
        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-veda-100 dark:bg-veda-950/40 text-veda-700 dark:text-veda-400 text-xs font-bold flex items-center justify-center mt-0.5">
          {questionNumber}
        </span>

        <div className="flex-1 min-w-0 space-y-2">
          {/* Question text */}
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={3}
                className="w-full text-sm border border-veda-300 rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-veda-500/50 resize-none"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs bg-veda-600 text-white rounded-lg hover:bg-veda-700 disabled:opacity-50"
                >
                  <Save className="w-3 h-3" />
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => {
                    setEditText(question.question);
                    setIsEditing(false);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-accent"
                >
                  <X className="w-3 h-3" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-foreground leading-relaxed">{question.question}</p>
          )}

          {/* MCQ Options */}
          {question.options && question.options.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-2">
              {question.options.map((opt, oi) => (
                <div
                  key={oi}
                  className={cn(
                    'text-xs px-3 py-1.5 rounded-lg border',
                    question.answer === opt
                      ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400'
                      : 'border-border bg-muted/30 text-muted-foreground'
                  )}
                >
                  {opt}
                </div>
              ))}
            </div>
          )}

          {/* Meta row */}
          <div className="flex items-center gap-2 flex-wrap">
            <DifficultyBadge difficulty={question.difficulty} />
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {questionTypeLabels[question.type]}
            </span>
            <span className="text-xs font-semibold text-veda-600 dark:text-veda-400 ml-auto">
              {question.marks} {question.marks === 1 ? 'mark' : 'marks'}
            </span>
          </div>
        </div>

        {/* Edit button */}
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-accent transition-all flex-shrink-0"
            title="Edit question"
          >
            <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  );
}
