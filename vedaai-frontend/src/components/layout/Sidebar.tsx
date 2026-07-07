'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutGrid, Users, FileText, Cpu, BookOpen,
  Settings, Plus, Home, LogOut, X,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useAssignmentStore } from '@/store/assignmentStore';
import { cn } from '@/lib/utils';

const NAV = [
  { label: 'Home',                 href: '/dashboard',                icon: LayoutGrid },
  { label: 'My Groups',            href: '/dashboard/groups',         icon: Users },
  { label: 'Assignments',          href: '/dashboard/assignments',    icon: FileText, badge: true },
  { label: "AI Teacher's Toolkit", href: '/dashboard/toolkit',        icon: Cpu },
  { label: 'My Library',           href: '/dashboard/library',        icon: BookOpen },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, logout } = useAuthStore();
  const { assignments }  = useAssignmentStore();

  const count = assignments.length;

  const go = (href: string) => {
    router.push(href);
    onClose?.();
  };

  return (
    <>
      {/* Mobile backdrop — only shown when drawer is open on small screens */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel
          - Mobile: fixed drawer, slides in/out based on isOpen
          - Desktop (lg+): static part of the flex layout, always visible
      */}
      <aside
        className={cn(
          // Base styles
          'flex flex-col bg-[hsl(var(--sidebar))] border-r border-border w-[220px] shrink-0 h-full',
          // Mobile: fixed overlay drawer
          'fixed top-0 left-0 z-50 transition-transform duration-300 ease-in-out',
          // Mobile visibility
          isOpen ? 'translate-x-0' : '-translate-x-full',
          // Desktop: static, always visible, not fixed
          'lg:relative lg:translate-x-0 lg:z-auto'
        )}
      >
        {/* Logo row */}
        <div className="px-5 pt-5 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center shadow-sm">
              <svg viewBox="0 0 20 20" className="w-5 h-5 fill-white">
                <path d="M3 4l7 12 7-12H3z" />
              </svg>
            </div>
            <span className="font-bold text-[17px] tracking-tight text-foreground">VedaAI</span>
          </div>
          {/* Close button — mobile only */}
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg hover:bg-accent transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Create button */}
        <div className="px-4 mb-5">
          <button
            onClick={() => go('/dashboard/assignments/create')}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-[#1a1a1a] dark:bg-white text-white dark:text-[#1a1a1a] text-[13px] font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Assignment
          </button>
        </div>

        {/* Nav links */}
        <div className="mx-3 border border-border rounded-xl overflow-hidden mb-4">
          {NAV.map(({ label, href, icon: Icon, badge }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
            return (
              <button
                key={href}
                onClick={() => go(href)}
                className={cn(
                  'w-full flex items-center gap-3 px-3.5 py-2.5 text-[13px] transition-colors border-b border-border last:border-b-0 text-left',
                  active
                    ? 'bg-accent font-semibold text-foreground'
                    : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                )}
              >
                <Icon className="w-[15px] h-[15px] shrink-0" />
                <span className="flex-1 leading-none">{label}</span>
                {badge && count > 0 && (
                  <span className="text-[11px] font-bold bg-orange-500 text-white rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex-1" />

        {/* Bottom */}
        <div className="px-3 pb-4 space-y-1">
          <Link href="/" onClick={onClose}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[13px] text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
            <Home className="w-[15px] h-[15px]" />
            Back to Home
          </Link>
          <Link href="/dashboard/settings" onClick={onClose}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[13px] text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
            <Settings className="w-[15px] h-[15px]" />
            Settings
          </Link>

          {/* User card */}
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-muted/60 border border-border">
            <div className="w-9 h-9 rounded-full bg-orange-100 border-2 border-orange-200 flex items-center justify-center shrink-0">
              <span className="text-orange-600 font-bold text-sm leading-none">
                {user?.name?.charAt(0).toUpperCase() ?? 'U'}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-foreground truncate leading-tight">{user?.name ?? 'User'}</p>
              <p className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">{user?.email ?? ''}</p>
            </div>
            <button
              onClick={() => { logout(); router.push('/'); }}
              className="p-1 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
