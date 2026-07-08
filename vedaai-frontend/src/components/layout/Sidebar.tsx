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

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[hsl(var(--sidebar,var(--card)))] w-[220px]">
      {/* Logo */}
      <div className="px-5 pt-5 pb-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
            <svg viewBox="0 0 20 20" className="w-5 h-5 fill-white">
              <path d="M3 4l7 12 7-12H3z" />
            </svg>
          </div>
          <span className="font-bold text-[17px] text-foreground">VedaAI</span>
        </div>
        <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg hover:bg-accent">
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Create button */}
      <div className="px-4 mb-5 shrink-0">
        <button
          onClick={() => go('/dashboard/assignments/create')}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-[13px] font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus className="w-3.5 h-3.5" />
          Create Assignment
        </button>
      </div>

      {/* Nav */}
      <div className="mx-3 border border-border rounded-xl overflow-hidden mb-4 shrink-0">
        {NAV.map(({ label, href, icon: Icon, badge }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <button
              key={href}
              onClick={() => go(href)}
              className={cn(
                'w-full flex items-center gap-3 px-3.5 py-2.5 text-[13px] transition-colors border-b border-border last:border-b-0 text-left',
                active ? 'bg-accent font-semibold text-foreground' : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
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

      <div className="flex-1 overflow-y-auto" />

      {/* Bottom */}
      <div className="px-3 pb-4 space-y-1 shrink-0">
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
            <span className="text-orange-600 font-bold text-sm">
              {user?.name?.charAt(0).toUpperCase() ?? 'U'}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-foreground truncate">{user?.name ?? 'User'}</p>
            <p className="text-[11px] text-muted-foreground truncate">{user?.email ?? ''}</p>
          </div>
          <button
            onClick={() => { logout(); router.push('/'); }}
            className="p-1 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop: static sidebar, always in flow ── */}
      <aside className="hidden lg:flex w-[220px] h-screen shrink-0 border-r border-border overflow-y-auto">
        <SidebarContent />
      </aside>

      {/* ── Mobile: full-screen overlay drawer ── */}
      <div
        className={cn(
          'fixed inset-0 z-[100] lg:hidden transition-all duration-300',
          isOpen ? 'pointer-events-auto' : 'pointer-events-none'
        )}
      >
        {/* Backdrop */}
        <div
          className={cn(
            'absolute inset-0 bg-black/60 transition-opacity duration-300',
            isOpen ? 'opacity-100' : 'opacity-0'
          )}
          onClick={onClose}
        />

        {/* Drawer panel — slides from left, full height */}
        <div
          className={cn(
            'absolute top-0 left-0 h-full w-[220px] shadow-2xl transition-transform duration-300 ease-in-out overflow-y-auto',
            isOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <SidebarContent />
        </div>
      </div>
    </>
  );
}
