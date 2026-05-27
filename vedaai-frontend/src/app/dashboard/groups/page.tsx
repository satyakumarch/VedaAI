'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Plus, GraduationCap, Trash2, X,
  AlertCircle, MoreVertical, Edit3,
} from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { cn } from '@/lib/utils';

// ── Types ────────────────────────────────────────────────────
interface Group {
  _id: string;
  name: string;
  subject: string;
  grade: string;
  studentCount: number;
  description?: string;
  color: string;
  createdAt: string;
}

// ── Color options ────────────────────────────────────────────
const COLOR_OPTIONS = [
  { value: 'blue',   label: 'Blue',   cls: 'bg-blue-500' },
  { value: 'green',  label: 'Green',  cls: 'bg-green-500' },
  { value: 'purple', label: 'Purple', cls: 'bg-purple-500' },
  { value: 'orange', label: 'Orange', cls: 'bg-orange-500' },
  { value: 'red',    label: 'Red',    cls: 'bg-red-500' },
  { value: 'cyan',   label: 'Cyan',   cls: 'bg-cyan-500' },
  { value: 'amber',  label: 'Amber',  cls: 'bg-amber-500' },
  { value: 'pink',   label: 'Pink',   cls: 'bg-pink-500' },
];

const colorMap: Record<string, { icon: string; badge: string }> = {
  blue:   { icon: 'bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',     badge: 'bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400' },
  green:  { icon: 'bg-green-100 text-green-600 dark:bg-green-950/40 dark:text-green-400', badge: 'bg-green-100 text-green-600 dark:bg-green-950/40 dark:text-green-400' },
  purple: { icon: 'bg-purple-100 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400', badge: 'bg-purple-100 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400' },
  orange: { icon: 'bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400', badge: 'bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400' },
  red:    { icon: 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400',         badge: 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400' },
  cyan:   { icon: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400',     badge: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400' },
  amber:  { icon: 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400', badge: 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400' },
  pink:   { icon: 'bg-pink-100 text-pink-600 dark:bg-pink-950/40 dark:text-pink-400',     badge: 'bg-pink-100 text-pink-600 dark:bg-pink-950/40 dark:text-pink-400' },
};

const getColor = (color: string) => colorMap[color] ?? colorMap.blue;

// ── Main Page ────────────────────────────────────────────────
export default function GroupsPage() {
  const [groups,      setGroups]      = useState<Group[]>([]);
  const [isLoading,   setIsLoading]   = useState(true);
  const [showModal,   setShowModal]   = useState(false);
  const [editGroup,   setEditGroup]   = useState<Group | null>(null);
  const [openMenu,    setOpenMenu]    = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenu(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchGroups = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/groups');
      setGroups(data.data ?? []);
    } catch { toast.error('Failed to load groups'); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchGroups(); }, []);

  const handleDelete = async (id: string) => {
    setOpenMenu(null);
    if (!confirm('Delete this group?')) return;
    try {
      await api.delete(`/groups/${id}`);
      setGroups(prev => prev.filter(g => g._id !== id));
      toast.success('Group deleted');
    } catch { toast.error('Failed to delete group'); }
  };

  const handleEdit = (group: Group) => {
    setOpenMenu(null);
    setEditGroup(group);
    setShowModal(true);
  };

  const handleSaved = (group: Group) => {
    setGroups(prev => {
      const exists = prev.find(g => g._id === group._id);
      return exists ? prev.map(g => g._id === group._id ? group : g) : [group, ...prev];
    });
    setShowModal(false);
    setEditGroup(null);
  };

  return (
    <>
      <TopBar title="My Groups" showBack={false} />
      <main className="flex-1 overflow-auto bg-background">
        <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
                <h1 className="font-bold text-base text-foreground">My Groups</h1>
              </div>
              <p className="text-xs text-muted-foreground ml-4">
                Manage your class groups and students.
              </p>
            </div>
            <button
              onClick={() => { setEditGroup(null); setShowModal(true); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm"
            >
              <Plus className="w-4 h-4" /> New Group
            </button>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Groups',   value: groups.length },
              { label: 'Total Students', value: groups.reduce((s, g) => s + g.studentCount, 0) },
              { label: 'Subjects',       value: new Set(groups.map(g => g.subject)).size },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                className="bg-card border border-border rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Groups grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1,2,3].map(i => <div key={i} className="h-36 rounded-xl bg-muted shimmer" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4" ref={menuRef}>
              <AnimatePresence>
                {groups.map((group, i) => {
                  const c = getColor(group.color);
                  return (
                    <motion.div key={group._id}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: i * 0.05 }}
                      className="relative bg-card border border-border rounded-xl p-5 hover:border-orange-300 dark:hover:border-orange-700 transition-colors space-y-3"
                    >
                      {/* Three-dot menu */}
                      <button
                        onClick={() => setOpenMenu(openMenu === group._id ? null : group._id)}
                        className="absolute top-4 right-4 p-1 rounded hover:bg-accent transition-colors"
                      >
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                      </button>

                      {/* Dropdown */}
                      <AnimatePresence>
                        {openMenu === group._id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -4 }}
                            className="absolute top-10 right-4 z-50 bg-card border border-border rounded-xl shadow-lg py-1 w-36"
                          >
                            <button onClick={() => handleEdit(group)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors">
                              <Edit3 className="w-3.5 h-3.5" /> Edit
                            </button>
                            <button onClick={() => handleDelete(group._id)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.icon}`}>
                        <GraduationCap className="w-5 h-5" />
                      </div>

                      {/* Info */}
                      <div>
                        <p className="font-semibold text-foreground text-sm pr-6">{group.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Users className="w-3 h-3" /> {group.studentCount} students
                        </p>
                        {group.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{group.description}</p>
                        )}
                      </div>

                      {/* Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.badge}`}>
                          {group.subject}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {group.grade}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Add new card */}
              <motion.button
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                onClick={() => { setEditGroup(null); setShowModal(true); }}
                className="border-2 border-dashed border-border rounded-xl p-5 flex flex-col items-center justify-center gap-2 hover:border-orange-400 hover:bg-orange-50/30 dark:hover:bg-orange-950/10 transition-colors text-center min-h-[144px]"
              >
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                  <Plus className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Create New Group</p>
              </motion.button>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && groups.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center py-16 border-2 border-dashed border-border rounded-2xl">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="font-semibold text-foreground mb-1">No groups yet</p>
              <p className="text-sm text-muted-foreground mb-5">Create your first class group to get started</p>
              <button onClick={() => setShowModal(true)}
                className="px-5 py-2.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity">
                Create Group
              </button>
            </motion.div>
          )}
        </div>
      </main>

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <GroupModal
            group={editGroup}
            onClose={() => { setShowModal(false); setEditGroup(null); }}
            onSaved={handleSaved}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ── Create / Edit Modal ──────────────────────────────────────
function GroupModal({
  group,
  onClose,
  onSaved,
}: {
  group: Group | null;
  onClose: () => void;
  onSaved: (g: Group) => void;
}) {
  const [name,         setName]         = useState(group?.name ?? '');
  const [subject,      setSubject]      = useState(group?.subject ?? '');
  const [grade,        setGrade]        = useState(group?.grade ?? '');
  const [studentCount, setStudentCount] = useState(group?.studentCount ?? 0);
  const [description,  setDescription]  = useState(group?.description ?? '');
  const [color,        setColor]        = useState(group?.color ?? 'blue');
  const [isSaving,     setIsSaving]     = useState(false);
  const [errors,       setErrors]       = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim())    e.name    = 'Group name is required';
    if (!subject.trim()) e.subject = 'Subject is required';
    if (!grade.trim())   e.grade   = 'Grade is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      const payload = { name: name.trim(), subject: subject.trim(), grade: grade.trim(), studentCount, description: description.trim(), color };
      const { data } = group
        ? await api.patch(`/groups/${group._id}`, payload)
        : await api.post('/groups', payload);
      toast.success(group ? 'Group updated' : 'Group created');
      onSaved(data.data as Group);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to save group';
      toast.error(msg);
    } finally { setIsSaving(false); }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-5"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-foreground">{group ? 'Edit Group' : 'Create New Group'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <Field label="Group Name" error={errors.name} required>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Grade 8 - Science A"
              className={inputCls(!!errors.name)} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Subject" error={errors.subject} required>
              <input value={subject} onChange={e => setSubject(e.target.value)}
                placeholder="e.g. Science"
                className={inputCls(!!errors.subject)} />
            </Field>
            <Field label="Grade / Class" error={errors.grade} required>
              <input value={grade} onChange={e => setGrade(e.target.value)}
                placeholder="e.g. Grade 8"
                className={inputCls(!!errors.grade)} />
            </Field>
          </div>

          <Field label="Number of Students">
            <input type="number" value={studentCount} min={0} max={1000}
              onChange={e => setStudentCount(parseInt(e.target.value) || 0)}
              className={inputCls(false)} />
          </Field>

          <Field label="Description">
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              rows={2} placeholder="Optional description..."
              className={cn(inputCls(false), 'resize-none')} />
          </Field>

          {/* Color picker */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Color</label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_OPTIONS.map(c => (
                <button key={c.value} type="button" onClick={() => setColor(c.value)}
                  className={cn('w-7 h-7 rounded-full transition-all', c.cls,
                    color === c.value ? 'ring-2 ring-offset-2 ring-offset-card ring-gray-900 dark:ring-gray-100 scale-110' : 'hover:scale-105'
                  )} title={c.label} />
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button onClick={onClose}
            className="flex-1 py-2.5 border border-border rounded-full text-sm font-semibold hover:bg-accent transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={isSaving}
            className="flex-1 py-2.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
            {isSaving ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
            ) : (
              group ? 'Save Changes' : 'Create Group'
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Helpers ──────────────────────────────────────────────────
function Field({ label, error, required, children }: {
  label: string; error?: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />{error}
        </p>
      )}
    </div>
  );
}

const inputCls = (hasError: boolean) => cn(
  'w-full border rounded-lg px-3 py-2.5 text-sm bg-background',
  'focus:outline-none focus:ring-2 focus:ring-orange-400/40',
  'placeholder:text-muted-foreground transition-colors',
  hasError ? 'border-red-400' : 'border-border'
);
