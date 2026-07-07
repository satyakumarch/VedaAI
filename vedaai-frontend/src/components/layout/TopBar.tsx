'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, LayoutGrid, Bell, ChevronDown, Menu } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useMobileMenu } from '@/app/dashboard/layout';

interface TopBarProps {
  title?: string;
  showBack?: boolean;
  titleIcon?: React.ReactNode;
}

export default function TopBar({
  title = 'Assignment',
  showBack = true,
  titleIcon,
}: TopBarProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { openMenu } = useMobileMenu();

  return (
    <header className="h-[52px] flex items-center justify-between px-4 sm:px-5 border-b border-border bg-[hsl(var(--sidebar-bg))] shrink-0">
      {/* Left */}
      <div className="flex items-center gap-2 sm:gap-2.5 text-[13px] text-muted-foreground min-w-0">
        {/* Hamburger — mobile only */}
        <button
          onClick={openMenu}
          className="lg:hidden p-1.5 rounded-lg hover:bg-accent transition-colors shrink-0"
        >
          <Menu className="w-5 h-5 text-foreground" />
        </button>

        {showBack && (
          <button
            onClick={() => router.back()}
            className="hover:text-foreground transition-colors p-0.5 shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <span className="hidden sm:block shrink-0">
          {titleIcon ?? <LayoutGrid className="w-3.5 h-3.5" />}
        </span>
        <span className="text-foreground/70 truncate">{title}</span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Bell with orange dot */}
        <button className="relative p-1.5 rounded-lg hover:bg-accent transition-colors">
          <Bell className="w-[15px] h-[15px] text-muted-foreground" />
          <span className="absolute top-[5px] right-[5px] w-[6px] h-[6px] bg-orange-500 rounded-full border border-white dark:border-[hsl(var(--sidebar-bg))]" />
        </button>

        {/* User avatar + name */}
        <button className="flex items-center gap-1.5 sm:gap-2 hover:bg-accent px-2 py-1.5 rounded-lg transition-colors">
          <div className="w-[26px] h-[26px] rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center overflow-hidden shrink-0">
            <span className="text-orange-600 font-bold text-[11px] leading-none">
              {user?.name?.charAt(0).toUpperCase() ?? 'U'}
            </span>
          </div>
          <span className="hidden sm:inline text-[13px] font-medium text-foreground max-w-[100px] truncate">
            {user?.name ?? 'User'}
          </span>
          <ChevronDown className="hidden sm:block w-3 h-3 text-muted-foreground" />
        </button>
      </div>
    </header>
  );
}
