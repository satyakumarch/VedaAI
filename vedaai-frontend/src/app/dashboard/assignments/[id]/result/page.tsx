'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Download, RefreshCw, AlertCircle } from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import { useGenerationStore } from '@/store/generationStore';
import { useAssignmentStore } from '@/store/assignmentStore';
import { Assignment, GeneratedPaper, Section, Question } from '@/types';
import { formatDate } from '@/lib/utils';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function ResultPage() {
  const params       = useParams();
  const router       = useRouter();
  const assignmentId = params.id as string;

  const { paper, fetchPaper, isLoading, error } = useGenerationStore();
  const { fetchAssignment }                      = useAssignmentStore();
  const [assignment,     setAssignment]     = useState<Assignment | null>(null);
  const [isDownloading,  setIsDownloading]  = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  useEffect(() => {
    (async () => {
      const [a] = await Promise.all([fetchAssignment(assignmentId), fetchPaper(assignmentId)]);
      setAssignment(a);
    })();
  }, [assignmentId, fetchAssignment, fetchPaper]);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const res = await api.get(`/papers/${assignmentId}/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a   = document.createElement('a');
      a.href     = url;
      a.download = `${assignment?.title?.replace(/[^a-z0-9]/gi, '_') ?? 'paper'}_exam.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded');
    } catch { toast.error('Download failed'); }
    finally { setIsDownloading(false); }
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      await api.post(`/assignments/${assignmentId}/regenerate`);
      toast.success('Regeneration started');
      router.push(`/dashboard/assignments/${assignmentId}/generating`);
    } catch { toast.error('Failed to regenerate'); setIsRegenerating(false); }
  };

  return (
    <>
      <TopBar title="Create New" />
      <main className="flex-1 overflow-auto bg-[hsl(var(--background))]">
        {isLoading || !paper || !assignment ? (
          <div className="flex items-center justify-center h-full">
            <div className="space-y-3 w-full max-w-2xl px-8">
              {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl bg-muted shimmer" />)}
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <AlertCircle className="w-12 h-12 text-destructive" />
            <p className="text-muted-foreground">{error}</p>
            <button onClick={handleRegenerate}
              className="px-5 py-2.5 bg-gray-900 text-white rounded-full text-sm font-semibold">
              Try Regenerating
            </button>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-6 py-6 space-y-4">

            {/* ── AI intro banner ── */}
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="bg-gray-900 dark:bg-gray-800 text-white rounded-2xl p-5">
              <p className="text-sm leading-relaxed mb-4">
                Certainly! Here are customized Question Papers for your{' '}
                <strong>{assignment.subject}</strong> classes on the topic:{' '}
                <strong>{assignment.topic}</strong>
              </p>
              <div className="flex items-center gap-3">
                <button onClick={handleDownload} disabled={isDownloading}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                  <Download className="w-4 h-4" />
                  {isDownloading ? 'Downloading...' : 'Download as PDF'}
                </button>
                <button onClick={handleRegenerate} disabled={isRegenerating}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                  <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                  Regenerate
                </button>
              </div>
            </motion.div>

            {/* ── Paper body ── */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
              className="bg-white dark:bg-card border border-border rounded-2xl overflow-hidden shadow-sm">

              {/* Paper header — school style */}
              <div className="px-12 pt-10 pb-6 text-center border-b border-border space-y-1">
                <h1 className="text-xl font-bold text-gray-900 dark:text-foreground">
                  {assignment.title}
                </h1>
                <p className="text-sm font-semibold text-gray-800 dark:text-foreground">
                  Subject: {assignment.subject}
                </p>
                <p className="text-sm text-gray-700 dark:text-muted-foreground">
                  Topic: {assignment.topic}
                </p>
              </div>

              {/* Meta row */}
              <div className="px-10 py-4 border-b border-border flex items-center justify-between text-sm text-gray-800 dark:text-foreground">
                <span>Time Allowed: —</span>
                <span>Maximum Marks: <strong>{paper.totalMarks}</strong></span>
              </div>

              {/* General instruction */}
              <div className="px-10 py-3 border-b border-border">
                <p className="text-sm text-gray-800 dark:text-foreground font-medium">
                  All questions are compulsory unless stated otherwise.
                </p>
              </div>

              {/* Student fields */}
              <div className="px-10 py-5 border-b border-border space-y-2 text-sm text-gray-800 dark:text-foreground">
                <p>Name: <span className="inline-block w-44 border-b border-gray-400 dark:border-border ml-1 align-bottom" /></p>
                <p>Roll Number: <span className="inline-block w-32 border-b border-gray-400 dark:border-border ml-1 align-bottom" /></p>
                <p>
                  Class:{' '}
                  <span className="inline-block w-20 border-b border-gray-400 dark:border-border ml-1 align-bottom" />
                  {' '}Section:{' '}
                  <span className="inline-block w-16 border-b border-gray-400 dark:border-border ml-1 align-bottom" />
                </p>
              </div>

              {/* Sections */}
              <div className="px-10 py-8 space-y-10">
                {paper.sections.map((section, si) => (
                  <PaperSection
                    key={si}
                    section={section}
                    startNum={paper.sections.slice(0, si).reduce((s, sec) => s + sec.questions.length, 0) + 1}
                  />
                ))}

                <p className="text-sm font-bold text-gray-900 dark:text-foreground text-center pt-6 border-t border-border">
                  End of Question Paper
                </p>

                {/* Answer Key */}
                <AnswerKey paper={paper} />
              </div>
            </motion.div>

            <div className="pb-8" />
          </div>
        )}
      </main>
    </>
  );
}

/* ── Paper Section ── */
function PaperSection({ section, startNum }: { section: Section; startNum: number }) {
  return (
    <div className="space-y-3">
      <h2 className="text-base font-bold text-gray-900 dark:text-foreground text-center">
        {section.title}
      </h2>
      <div>
        <p className="text-sm font-semibold text-gray-800 dark:text-foreground">
          {section.instruction.split('.')[0]}
        </p>
        <p className="text-xs text-gray-500 dark:text-muted-foreground italic">
          {section.instruction}
        </p>
      </div>
      <ol className="space-y-2.5 list-none" start={startNum}>
        {section.questions.map((q, qi) => (
          <QuestionItem key={qi} question={q} number={startNum + qi} />
        ))}
      </ol>
    </div>
  );
}

/* ── Question Item ── */
function QuestionItem({ question, number }: { question: Question; number: number }) {
  const diffLabel = question.difficulty === 'easy'
    ? 'Easy'
    : question.difficulty === 'medium'
    ? 'Moderate'
    : 'Challenging';

  return (
    <li className="text-sm text-gray-800 dark:text-foreground leading-relaxed">
      <span>
        {number}. [{diffLabel}] {question.question}{' '}
        <span className="text-gray-500 dark:text-muted-foreground">
          [{question.marks} {question.marks === 1 ? 'Mark' : 'Marks'}]
        </span>
      </span>
      {question.options && question.options.length > 0 && (
        <div className="ml-6 mt-1.5 space-y-1">
          {question.options.map((opt, oi) => (
            <p key={oi} className="text-sm text-gray-600 dark:text-muted-foreground">{opt}</p>
          ))}
        </div>
      )}
    </li>
  );
}

/* ── Answer Key ── */
function AnswerKey({ paper }: { paper: GeneratedPaper }) {
  const allQs = paper.sections.flatMap(s => s.questions).filter(q => q.answer);
  if (allQs.length === 0) return null;

  return (
    <div className="pt-6 border-t border-border space-y-3">
      <h2 className="text-base font-bold text-gray-900 dark:text-foreground">Answer Key:</h2>
      <ol className="space-y-3">
        {allQs.map((q, i) => (
          <li key={i} className="text-sm text-gray-800 dark:text-foreground leading-relaxed">
            <span className="font-medium">{i + 1}.</span>{' '}{q.answer}
          </li>
        ))}
      </ol>
    </div>
  );
}
