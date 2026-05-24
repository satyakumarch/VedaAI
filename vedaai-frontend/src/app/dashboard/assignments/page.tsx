'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Filter, Search, Plus, MoreVertical } from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import { useAssignmentStore } from '@/store/assignmentStore';
import { Assignment } from '@/types';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import api from '@/lib/axios';

export default function AssignmentsPage() {
  const router = useRouter();
  const { assignments, isLoadingList, fetchAssignments } = useAssignmentStore();
  const [search, setSearch]     = useState('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const containerRef            = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchAssignments(); }, [fetchAssignments]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node))
        setOpenMenu(null);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const filtered = assignments.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.subject.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    setOpenMenu(null);
    if (!confirm('Delete this assignment?')) return;
    try {
      await api.delete(`/assignments/${id}`);
      toast.success('Deleted');
      fetchAssignments();
    } catch { toast.error('Failed to delete'); }
  };

  const goTo = (a: Assignment) => {
    setOpenMenu(null);
    const path = ['queued', 'processing'].includes(a.status)
      ? `/dashboard/assignments/${a._id}/generating`
      : `/dashboard/assignments/${a._id}/result`;
    router.push(path);
  };

  return (
    <>
      <TopBar title="Assignment" />

      <div className="flex-1 flex flex-col overflow-hidden bg-background">
        {assignments.length === 0 && !isLoadingList ? (
          /* ── Empty state ── */
          <div className="flex-1 flex items-center justify-center p-8">
            <div
              className="w-full max-w-[680px] rounded-2xl bg-[hsl(220_14%_91%)] dark:bg-muted flex flex-col items-center justify-center py-20 px-8 text-center"
              style={{ border: '2px solid #c7d2fe' }}
            >
              {/* SVG illustration */}
              <div className="w-36 h-36 mb-6 relative">
                <div className="absolute inset-0 rounded-full bg-white/60 dark:bg-white/10" />
                <svg viewBox="0 0 120 120" className="w-full h-full relative z-10">
                  {/* Document */}
                  <rect x="28" y="14" width="46" height="60" rx="4" fill="white" stroke="#e5e7eb" strokeWidth="1.5"/>
                  <line x1="37" y1="28" x2="65" y2="28" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="37" y1="38" x2="65" y2="38" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="37" y1="48" x2="55" y2="48" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round"/>
                  {/* Magnifier circle */}
                  <circle cx="72" cy="72" r="22" fill="white" stroke="#c4b5fd" strokeWidth="2.5"/>
                  {/* X inside magnifier */}
                  <line x1="64" y1="64" x2="80" y2="80" stroke="#ef4444" strokeWidth="3" strokeLinecap="round"/>
                  <line x1="80" y1="64" x2="64" y2="80" stroke="#ef4444" strokeWidth="3" strokeLinecap="round"/>
                  {/* Handle */}
                  <line x1="88" y1="88" x2="100" y2="100" stroke="#9ca3af" strokeWidth="4" strokeLinecap="round"/>
                  {/* Sparkle */}
                  <circle cx="24" cy="80" r="3" fill="#60a5fa"/>
                  <path d="M95 28 L97 33 L102 35 L97 37 L95 42 L93 37 L88 35 L93 33 Z" fill="#fbbf24"/>
                </svg>
              </div>

              <h2 className="text-[15px] font-bold text-foreground mb-2">No assignments yet</h2>
              <p className="text-[13px] text-muted-foreground max-w-[300px] leading-relaxed mb-8">
                Create your first assignment to start collecting and grading student submissions.
                You can set up rubrics, define marking criteria, and let AI assist with grading.
              </p>
              <button
                onClick={() => router.push('/dashboard/assignments/create')}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#1a1a1a] dark:bg-white text-white dark:text-[#1a1a1a] rounded-full text-[13px] font-semibold hover:opacity-90 transition-opacity"
              >
                <Plus className="w-3.5 h-3.5" />
                Create Your First Assignment
              </button>
            </div>
          </div>
        ) : (
          /* ── List state ── */
          <div className="flex-1 flex flex-col overflow-hidden">

            {/* Page title row */}
            <div
              className="px-5 pt-4 pb-3 bg-[hsl(var(--sidebar-bg))]"
              style={{ borderBottom: '1.5px dashed #93c5fd' }}
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />
                <span className="text-[14px] font-bold text-foreground">Assignments</span>
              </div>
              <p className="text-[12px] text-muted-foreground mt-0.5 ml-[18px]">
                Manage and create assignments for your classes.
              </p>
            </div>

            {/* Filter + Search */}
            <div
              className="flex items-center px-5 py-2.5 bg-[hsl(var(--sidebar-bg))]"
              style={{ borderBottom: '1.5px dashed #93c5fd' }}
            >
              <button className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors">
                <Filter className="w-3.5 h-3.5" />
                Filter By
              </button>
              <div className="flex-1" />
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search Assignment"
                  className="pl-9 pr-4 py-2 text-[12px] border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-blue-300/50 w-52 placeholder:text-muted-foreground"
                />
              </div>
            </div>

            {/* Cards grid */}
            <div className="flex-1 overflow-auto" ref={containerRef}>
              {isLoadingList ? (
                <div className="grid grid-cols-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-24 shimmer bg-muted"
                      style={{ borderBottom: '1.5px dashed #93c5fd', borderRight: i % 2 === 0 ? '1.5px dashed #93c5fd' : undefined }}
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2">
                  {filtered.map((a, i) => (
                    <AssignmentCard
                      key={a._id}
                      assignment={a}
                      index={i}
                      isLast={i >= filtered.length - 2}
                      isRight={i % 2 === 1}
                      isMenuOpen={openMenu === a._id}
                      onMenuToggle={() => setOpenMenu(openMenu === a._id ? null : a._id)}
                      onView={() => goTo(a)}
                      onDelete={() => handleDelete(a._id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Floating bottom button */}
            <div className="sticky bottom-0 flex justify-center py-4 pointer-events-none">
              <button
                onClick={() => router.push('/dashboard/assignments/create')}
                className="pointer-events-auto flex items-center gap-2 px-6 py-2.5 bg-[#1a1a1a] dark:bg-white text-white dark:text-[#1a1a1a] rounded-full text-[13px] font-semibold hover:opacity-90 transition-opacity shadow-lg"
              >
                <Plus className="w-3.5 h-3.5" />
                Create Assignment
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/* ── Assignment Card ── */
function AssignmentCard({
  assignment, index, isLast, isRight,
  isMenuOpen, onMenuToggle, onView, onDelete,
}: {
  assignment: Assignment;
  index: number;
  isLast: boolean;
  isRight: boolean;
  isMenuOpen: boolean;
  onMenuToggle: () => void;
  onView: () => void;
  onDelete: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.03 }}
      className="relative bg-[hsl(var(--sidebar-bg))] cursor-pointer hover:bg-accent/40 transition-colors"
      style={{
        borderBottom: isLast ? undefined : '1.5px dashed #93c5fd',
        borderRight:  isRight ? undefined : '1.5px dashed #93c5fd',
        padding: '16px 18px 14px',
      }}
      onClick={onView}
    >
      {/* Title + menu */}
      <div className="flex items-start justify-between mb-5">
        <h3 className="text-[14px] font-semibold text-foreground leading-snug pr-4">
          {assignment.title}
        </h3>
        <button
          onClick={e => { e.stopPropagation(); onMenuToggle(); }}
          className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground shrink-0 -mt-0.5"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      {/* Dates */}
      <div className="flex items-center justify-between text-[12px]">
        <span className="text-muted-foreground">
          <span className="font-semibold text-foreground">Assigned on</span>
          {' '}: {formatDate(assignment.createdAt)}
        </span>
        <span className="text-muted-foreground">
          <span className="font-semibold text-foreground">Due</span>
          {' '}: {formatDate(assignment.dueDate)}
        </span>
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.1 }}
            className="absolute top-9 right-4 z-50 bg-white dark:bg-card border border-border rounded-xl shadow-xl py-1 w-40"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={onView}
              className="w-full text-left px-4 py-2.5 text-[13px] text-foreground hover:bg-accent transition-colors"
            >
              View Assignment
            </button>
            <button
              onClick={onDelete}
              className="w-full text-left px-4 py-2.5 text-[13px] text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
            >
              Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
