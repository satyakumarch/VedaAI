'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Moon, Sun, BookOpen, LogOut, LayoutDashboard, Plus } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 glass border-b border-border/50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-veda-500 to-purple-600 flex items-center justify-center shadow-md group-hover:shadow-veda-500/30 transition-shadow">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-xl gradient-text">VedaAI</span>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-accent"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
                <Link
                  href="/assignment/create"
                  className="flex items-center gap-1.5 text-sm bg-veda-600 hover:bg-veda-700 text-white px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">New Assignment</span>
                </Link>
                <div className="flex items-center gap-2 pl-2 border-l border-border">
                  <span className="text-sm text-muted-foreground hidden sm:inline">
                    {user?.name}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="text-sm bg-veda-600 hover:bg-veda-700 text-white px-4 py-1.5 rounded-lg transition-colors"
                >
                  Get started
                </Link>
              </>
            )}

            {/* Theme toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg hover:bg-accent transition-colors"
              aria-label="Toggle theme"
            >
              <Sun className="w-4 h-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute w-4 h-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
