import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'HuffPack \u2014 Ambitious File Compressor',
  description: 'A premium, highly optimized Huffman file compression and archiving tool.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen selection:bg-primary selection:text-background">
        <header className="fixed top-0 w-full z-50 glass border-b border-white/10 dark:border-white/5 supports-backdrop-blur:bg-white/60 bg-white/60 dark:bg-black/60">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="font-semibold text-xl tracking-tight flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-gray-900 to-gray-500 dark:from-white dark:to-gray-400"></div>
              HuffPack
            </div>
            <nav className="text-sm font-medium text-gray-500 hover:text-primary transition-colors cursor-pointer dark:text-gray-400">
              Native Archiver
            </nav>
          </div>
        </header>
        <div className="absolute inset-0 z-[-1] overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/10 blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tl from-cyan-500/20 to-blue-500/10 blur-[100px]" />
        </div>
        <main className="pt-24 pb-12 px-6 max-w-7xl mx-auto flex-1 flex flex-col justify-center">
          {children}
        </main>
      </body>
    </html>
  );
}
