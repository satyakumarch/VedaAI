'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  BookOpen, FileText, Download, Eye, Search,
  Calendar, Tag, ChevronRight, Plus,
} from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import { useAssignmentStore } from '@/store/assignmentStore';
import { useGenerationStore } from '@/store/generationStore';
import { Assignment } from '@/types';
import { formatDate } from '@/lib/utils';
import api from '@/lib/axios';
import { toast } from 'sonner';

const SUBJECT_COLORS: Record<string, string> = {
  default:  'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  math:     'bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
  science:  'bg-green-100 text-green-600 dark:bg-green-950/40 dark:text-green-400',
  english:  'bg-purple-100 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400',
  history:  'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
  physics:  'bg-cyan-100 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400',
  chemistry:'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400',
  biology:  'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
};

const getSubjectColor = (subject: string) => {
  const key = subject.toLowerCase();
  for (const [k, v] of Object.entries(SUBJECT_COLORS)) {
    if (key.includes(k)) return v;
  }
  return SUBJECT_COLORS.default;
};

const RESOURCES = [
  {
    title: 'Bloom\'s Taxonomy Guide',
    description: 'A comprehensive guide to using Bloom\'s Taxonomy for creating effective learning objectives and assessments.',
    type: 'Guide',
    tags: ['Assessment', 'Pedagogy'],
    color: 'bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800',
  },
  {
    title: 'Question Writing Best Practices',
    description: 'Tips and techniques for writing clear, unambiguous exam questions across all difficulty levels.',
    type: 'Article',
    tags: ['Questions', 'Tips'],
    color: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800',
  },
  {
    title: 'Difficulty Level Framework',
    description: 'How to balance Easy, Medium, and Hard questions for fair and effective assessments.',
    type: 'Framework',
    tags: ['Difficulty', 'Balance'],
    color: 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800',
  },
  {
    title: 'MCQ Design Principles',
    description: 'Best practices for designing multiple choice questions that accurately measure student understanding.',
    type: 'Guide',
    tags: ['MCQ', 'Design'],
    color: 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800',
  },
  {
    title: 'Numerical Problem Templates',
    description: 'Ready-to-use templates for creating numerical and calculation-based questions in Math, Physics, and Chemistry.',
    type: 'Template',
    tags: ['Numerical', 'Math'],
    color: 'bg-cyan-50 dark:bg-cyan-950/20 border-cyan-200 dark:border-cyan-800',
  },
  {
    title: 'Formative vs Summative Assessment',
    description: 'Understanding the difference between formative and summative assessments and when to use each.',
    type: 'Article',
    tags: ['Assessment', 'Strategy'],
    color: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800',
  },
];

export default function LibraryPage() {
  const router = useRouter();
  const { assignments, fetchAssignments, isLoadingList } = useAssignmentStore();
  const [search, setSearch] = useState('');
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  useEffect(() => { fetchAssignments(); }, [fetchAssignments]);

  const completedAssignments = assignments.filter(a => a.status === 'completed');
  const filtered = completedAssignments.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.subject.toLowerCase().includes(search.toLowerCase()) ||
    a.topic.toLowerCase().includes(search.toLowerCase())
  );

  const handleDownload = async (assignment: Assignment) => {
    setIsDownloading(assignment._id);
    try {
      const res = await api.get(`/papers/${assignment._id}/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a   = document.createElement('a');
      a.href     = url;
      a.download = `${assignment.title.replace(/[^a-z0-9]/gi, '_')}_exam.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded');
    } catch { toast.error('Download failed'); }
    finally { setIsDownloading(null); }
  };

  return (
    <>
      <TopBar title="My Library" showBack={false} />
      <main className="flex-1 overflow-auto bg-background">
        <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
                  <h1 className="font-bold text-base text-foreground">My Library</h1>
                </div>
                <p className="text-xs text-muted-foreground ml-4">
                  All your generated question papers and teaching resources.
                </p>
              </div>
              <button
                onClick={() => router.push('/dashboard/assignments/create')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" /> New Paper
              </button>
            </div>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Papers',    value: completedAssignments.length, icon: FileText,  color: 'text-orange-500' },
              { label: 'Subjects',        value: new Set(completedAssignments.map(a => a.subject)).size, icon: BookOpen, color: 'text-blue-500' },
              { label: 'Resources',       value: RESOURCES.length, icon: Tag, color: 'text-purple-500' },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                  className="bg-card border border-border rounded-xl p-4 text-center">
                  <Icon className={`w-5 h-5 ${s.color} mx-auto mb-1`} />
                  <p className="text-2xl font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </motion.div>
              );
            })}
          </div>

          {/* Generated Papers */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground">Generated Question Papers</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search papers..."
                  className="pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-orange-400/40 w-48" />
              </div>
            </div>

            {isLoadingList ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-20 rounded-xl bg-muted shimmer" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-border rounded-2xl">
                <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground mb-1">No papers yet</p>
                <p className="text-xs text-muted-foreground mb-4">Create your first assignment to see it here</p>
                <button onClick={() => router.push('/dashboard/assignments/create')}
                  className="px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity">
                  Create Assignment
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((assignment, i) => (
                  <motion.div key={assignment._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 hover:border-orange-300 dark:hover:border-orange-700 transition-colors group">
                    {/* Subject badge */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${getSubjectColor(assignment.subject)}`}>
                      <BookOpen className="w-5 h-5" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-sm truncate">{assignment.title}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getSubjectColor(assignment.subject)}`}>
                          {assignment.subject}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {formatDate(assignment.createdAt)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {assignment.numberOfQuestions} questions · {assignment.totalMarks} marks
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => router.push(`/dashboard/assignments/${assignment._id}/result`)}
                        className="p-2 rounded-lg hover:bg-accent transition-colors" title="View">
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button onClick={() => handleDownload(assignment)}
                        disabled={isDownloading === assignment._id}
                        className="p-2 rounded-lg hover:bg-accent transition-colors" title="Download PDF">
                        <Download className={`w-4 h-4 text-muted-foreground ${isDownloading === assignment._id ? 'animate-bounce' : ''}`} />
                      </button>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Teaching Resources */}
          <div className="space-y-4">
            <h2 className="font-semibold text-foreground">Teaching Resources</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {RESOURCES.map((res, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.05 }}
                  className={`border rounded-xl p-4 space-y-2 ${res.color}`}>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-foreground text-sm">{res.title}</h3>
                    <span className="text-xs bg-white dark:bg-gray-800 border border-border px-2 py-0.5 rounded-full text-muted-foreground shrink-0">
                      {res.type}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{res.description}</p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {res.tags.map(tag => (
                      <span key={tag} className="text-xs bg-white/60 dark:bg-gray-800/60 px-2 py-0.5 rounded-full text-muted-foreground">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </>
  );
}
