import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import { Toaster } from 'sonner';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  metadataBase: new URL('http://localhost:3000'),
  title: {
    default: 'VedaAI — AI-Powered Assessment Creator',
    template: '%s | VedaAI',
  },
  description:
    'Create professional exam papers and assessments powered by AI. Generate structured question papers in seconds.',
  keywords: ['AI', 'assessment', 'exam', 'question paper', 'education', 'teacher'],
  authors: [{ name: 'VedaAI' }],
  openGraph: {
    title: 'VedaAI — AI-Powered Assessment Creator',
    description: 'Create professional exam papers powered by AI',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        {/* Restore B&W theme on hydration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(localStorage.getItem('vedaai-theme-bw')==='true'){document.documentElement.classList.add('theme-bw');}}catch(e){}})();`,
          }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster
            position="top-right"
            richColors
            closeButton
            toastOptions={{
              duration: 4000,
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
