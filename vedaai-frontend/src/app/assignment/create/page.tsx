'use client';

import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import AssignmentForm from '@/components/forms/AssignmentForm';
import { useRequireAuth } from '@/hooks/useAuth';

export default function CreateAssignmentPage() {
  useRequireAuth();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold text-foreground">Create New Assignment</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Fill in the details and AI will generate a structured question paper for you
          </p>
        </motion.div>

        <AssignmentForm />
      </main>
    </div>
  );
}
