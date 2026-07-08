'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, Bell, Palette, LogOut, Save, Moon, Sun } from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const inputCls = 'w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-orange-400/40 placeholder:text-muted-foreground transition-colors';

export default function SettingsPage() {
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const [name,  setName]  = useState(user?.name  ?? '');
  const [email, setEmail] = useState(user?.email ?? '');

  const handleSaveProfile = () => {
    toast.success('Profile saved (UI only — connect to API to persist)');
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const sections = [
    {
      icon: User,
      title: 'Profile',
      content: (
        <div className="space-y-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-orange-100 border-2 border-orange-200 flex items-center justify-center shrink-0">
              <span className="text-orange-600 font-bold text-2xl">
                {user?.name?.charAt(0).toUpperCase() ?? 'U'}
              </span>
            </div>
            <div>
              <p className="font-semibold text-foreground">{user?.name}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Full Name</label>
              <input value={name} onChange={e => setName(e.target.value)} className={inputCls} placeholder="Your name" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Email</label>
              <input value={email} onChange={e => setEmail(e.target.value)} className={inputCls} placeholder="your@email.com" type="email" />
            </div>
          </div>
          <button onClick={handleSaveProfile}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity">
            <Save className="w-4 h-4" /> Save Profile
          </button>
        </div>
      ),
    },
    {
      icon: Palette,
      title: 'Appearance',
      content: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { value: 'light',  label: 'Light',         icon: Sun,     preview: 'bg-white border-gray-200' },
              { value: 'dark',   label: 'Dark',          icon: Moon,    preview: 'bg-gray-900 border-gray-700' },
              { value: 'system', label: 'System',        icon: Palette, preview: 'bg-gradient-to-br from-white to-gray-900 border-gray-400' },
              { value: 'bw',     label: 'Black & White', icon: Sun,     preview: 'bg-white border-black' },
            ].map(t => {
              const Icon = t.icon;
              return (
                <button key={t.value} onClick={() => {
                  if (t.value === 'bw') {
                    setTheme('light');
                    document.documentElement.classList.add('theme-bw');
                    localStorage.setItem('vedaai-theme-bw', 'true');
                  } else {
                    document.documentElement.classList.remove('theme-bw');
                    localStorage.removeItem('vedaai-theme-bw');
                    setTheme(t.value);
                  }
                }}
                  className={cn('flex flex-col items-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all',
                    theme === t.value
                      ? 'border-orange-400 bg-orange-50 dark:bg-orange-950/20 text-orange-600'
                      : 'border-border hover:border-orange-300 text-muted-foreground hover:text-foreground'
                  )}>
                  {/* Color preview */}
                  <div className={cn('w-10 h-10 rounded-lg border-2', t.preview)} />
                  <span className="text-xs">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ),
    },
    {
      icon: Bell,
      title: 'Notifications',
      content: (
        <div className="space-y-3">
          {[
            { label: 'Generation completed', desc: 'Notify when a paper is ready', on: true },
            { label: 'Email notifications',  desc: 'Send updates to your email',    on: false },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border">
              <div>
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <div className={cn('w-10 h-6 rounded-full transition-colors relative cursor-pointer',
                item.on ? 'bg-orange-500' : 'bg-muted-foreground/30')}>
                <div className={cn('absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all',
                  item.on ? 'right-1' : 'left-1')} />
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: Lock,
      title: 'Security',
      content: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Change your password</p>
          <div className="space-y-3">
            {['Current Password', 'New Password', 'Confirm New Password'].map((label, i) => (
              <div key={i} className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">{label}</label>
                <input type="password" placeholder="••••••••" className={inputCls} />
              </div>
            ))}
          </div>
          <button onClick={() => toast.info('Password change coming soon')}
            className="flex items-center gap-2 px-5 py-2.5 border border-border rounded-full text-sm font-semibold hover:bg-accent transition-colors">
            Update Password
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <TopBar title="Settings" showBack={false} />
      <main className="flex-1 overflow-auto bg-background">
        <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">

          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
              <h1 className="font-bold text-base text-foreground">Settings</h1>
            </div>
            <p className="text-xs text-muted-foreground ml-4">Manage your account and preferences.</p>
          </motion.div>

          {sections.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-muted/30">
                  <Icon className="w-4 h-4 text-orange-500" />
                  <h2 className="font-semibold text-sm text-foreground">{s.title}</h2>
                </div>
                <div className="px-5 py-5">{s.content}</div>
              </motion.div>
            );
          })}

          {/* Danger zone */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="bg-card border border-red-200 dark:border-red-900 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20">
              <LogOut className="w-4 h-4 text-red-500" />
              <h2 className="font-semibold text-sm text-red-600 dark:text-red-400">Account</h2>
            </div>
            <div className="px-5 py-5">
              <p className="text-sm text-muted-foreground mb-4">Sign out of your VedaAI account.</p>
              <button onClick={handleLogout}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-full text-sm font-semibold transition-colors">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </motion.div>

        </div>
      </main>
    </>
  );
}
