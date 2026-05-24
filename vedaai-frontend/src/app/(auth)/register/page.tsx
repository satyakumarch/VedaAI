'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { BookOpen, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useRedirectIfAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  useRedirectIfAuth();
  const { register: registerUser, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    try {
      await registerUser(values.name, values.email, values.password);
      toast.success('Account created! Welcome to VedaAI.');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Registration failed';
      toast.error(msg);
    }
  };

  const fields = [
    { name: 'name' as const, label: 'Full Name', type: 'text', placeholder: 'Jane Smith' },
    { name: 'email' as const, label: 'Email', type: 'email', placeholder: 'you@school.edu' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-veda-50 via-background to-purple-50 dark:from-veda-950/20 dark:via-background dark:to-purple-950/20 px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br bg-orange-500 flex items-center justify-center shadow-lg">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-2xl ">VedaAI</span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground mt-6 mb-1">Create your account</h1>
          <p className="text-muted-foreground text-sm">Start creating AI-powered assessments</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-xl shadow-black/5">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {fields.map((field) => (
              <div key={field.name} className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">{field.label}</label>
                <input
                  {...register(field.name)}
                  type={field.type}
                  placeholder={field.placeholder}
                  className={cn(
                    'w-full rounded-lg border px-3 py-2.5 text-sm bg-background',
                    'focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400',
                    'placeholder:text-muted-foreground transition-colors',
                    errors[field.name] ? 'border-destructive' : 'border-input'
                  )}
                />
                {errors[field.name] && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors[field.name]?.message}
                  </p>
                )}
              </div>
            ))}

            {/* Password */}
            {(['password', 'confirmPassword'] as const).map((fieldName) => (
              <div key={fieldName} className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  {fieldName === 'password' ? 'Password' : 'Confirm Password'}
                </label>
                <div className="relative">
                  <input
                    {...register(fieldName)}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className={cn(
                      'w-full rounded-lg border px-3 py-2.5 text-sm bg-background pr-10',
                      'focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400',
                      'placeholder:text-muted-foreground transition-colors',
                      errors[fieldName] ? 'border-destructive' : 'border-input'
                    )}
                  />
                  {fieldName === 'password' && (
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}
                </div>
                {errors[fieldName] && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors[fieldName]?.message}
                  </p>
                )}
              </div>
            ))}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r bg-gray-900 dark:bg-gray-100 text-white font-semibold rounded-xl shadow-md hover:shadow-veda-500/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-orange-500 hover:text-orange-600 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
