'use client';

import { motion } from 'framer-motion';
import { Users, Plus, BookOpen, GraduationCap } from 'lucide-react';
import TopBar from '@/components/layout/TopBar';

const SAMPLE_GROUPS = [
  { name: 'Grade 8 - Science', students: 32, subject: 'Science', color: 'bg-green-100 text-green-600 dark:bg-green-950/30 dark:text-green-400' },
  { name: 'Grade 10 - Mathematics', students: 28, subject: 'Math', color: 'bg-blue-100 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400' },
  { name: 'Grade 9 - English', students: 35, subject: 'English', color: 'bg-purple-100 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400' },
];

export default function GroupsPage() {
  return (
    <>
      <TopBar title="My Groups" showBack={false} />
      <main className="flex-1 overflow-auto bg-background">
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
                  <h1 className="font-bold text-base text-foreground">My Groups</h1>
                </div>
                <p className="text-xs text-muted-foreground ml-4">Manage your class groups and students.</p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity">
                <Plus className="w-4 h-4" /> New Group
              </button>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {SAMPLE_GROUPS.map((group, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="bg-card border border-border rounded-xl p-5 hover:border-orange-300 dark:hover:border-orange-700 transition-colors cursor-pointer space-y-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${group.color}`}>
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{group.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Users className="w-3 h-3" /> {group.students} students
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${group.color}`}>
                  {group.subject}
                </span>
              </motion.div>
            ))}

            {/* Add group card */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="border-2 border-dashed border-border rounded-xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-orange-300 transition-colors text-center">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <Plus className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Create New Group</p>
              <p className="text-xs text-muted-foreground">Coming soon</p>
            </motion.div>
          </div>

          {/* Info banner */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="bg-muted/50 border border-border rounded-xl p-5 flex items-start gap-4">
            <BookOpen className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground mb-1">Groups feature coming soon</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Soon you&apos;ll be able to create class groups, assign question papers directly to students,
                track submissions, and view performance analytics per group.
              </p>
            </div>
          </motion.div>

        </div>
      </main>
    </>
  );
}
