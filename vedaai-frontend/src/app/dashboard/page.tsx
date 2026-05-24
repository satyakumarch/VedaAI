'use client';

import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import { useAuthStore } from '@/store/authStore';

export default function DashboardHome() {
  const router = useRouter();
  const { user } = useAuthStore();

  return (
    <>
      <TopBar title="Home" showBack={false} />
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl mx-auto text-center pt-16 space-y-4">
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-muted-foreground">
            Use the sidebar to navigate to Assignments or the AI Teacher&apos;s Toolkit.
          </p>
          <button
            onClick={() => router.push('/dashboard/assignments/create')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-full font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Create Assignment
          </button>
        </div>
      </main>
    </>
  );
}
