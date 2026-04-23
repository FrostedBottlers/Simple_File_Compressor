'use client';

import { useState } from 'react';
import { Command } from '@tauri-apps/plugin-shell';
import { open, save } from '@tauri-apps/plugin-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { FileUp, FolderUp, ArchiveRestore, CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';

export default function Home() {
  const [mode, setMode] = useState<'compress' | 'extract'>('compress');
  
  const [filePath, setFilePath] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ op: string; path: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resetState = () => {
    setFilePath(null);
    setFileName(null);
    setResult(null);
    setError(null);
  };

  const handleModeChange = (newMode: 'compress' | 'extract') => {
    if (isLoading) return;
    setMode(newMode);
    resetState();
  };

  const handleSelect = async (isFolder: boolean) => {
    try {
      const selected = await open({
        directory: isFolder,
        multiple: false,
        title: isFolder ? 'Select a folder to compress' : (mode === 'compress' ? 'Select a file to compress' : 'Select an archive to extract'),
        filters: mode === 'extract' ? [{ name: 'HuffPack Archive', extensions: ['huff'] }] : undefined
      });
      if (selected && typeof selected === 'string') {
        const name = selected.split(/[\/\\]/).pop() || 'Unknown';
        setFilePath(selected);
        setFileName(name);
        setResult(null);
        setError(null);
      }
    } catch (err: any) {
      setError('Failed to select file: ' + err.message);
    }
  };

  const handleProcess = async () => {
    if (!filePath || !fileName) return;
    setIsLoading(true);
    setError(null);

    try {
      if (mode === 'extract') {
        // Output directory selection
        const outDir = await open({
          directory: true,
          multiple: false,
          title: 'Select extraction destination'
        });
        if (!outDir) {
           setIsLoading(false);
           return;
        }
        
        if (filePath === outDir) {
            setError('Cannot extract an archive directly onto itself!');
            setIsLoading(false);
            return;
        }
        
        const cmd = Command.sidecar('../../core/huffpack', ['unpack', filePath, outDir as string]);
        const res = await cmd.execute();
        
        if (res.code === 0) {
           setResult({ op: 'Extracted', path: outDir as string });
        } else {
           setError(`Exit Code: ${res.code} | StdErr: ${res.stderr || 'EMPTY'} | StdOut: ${res.stdout || 'EMPTY'}`);
        }
      } else {
        // Safely strip extensions (e.g. .pdf) off the original file name so the OS save dialog respects our .huff suffix
        let baseName = fileName;
        if (baseName.includes('.')) {
             baseName = baseName.substring(0, baseName.lastIndexOf('.'));
        }
        
        // Output file selection
        const outFile = await save({
          filters: [{ name: 'HuffPack Archive', extensions: ['huff'] }],
          defaultPath: baseName + '.huff'
        });
        
        if (!outFile) {
           setIsLoading(false);
           return;
        }
        
        if (outFile === filePath) {
           setError('Cannot overwrite the original file! Choose a distinct output path.');
           setIsLoading(false);
           return;
        }

        const cmd = Command.sidecar('../../core/huffpack', ['pack', outFile, filePath]);
        const res = await cmd.execute();
        
        if (res.code === 0) {
           setResult({ op: 'Compressed', path: outFile });
        } else {
           setError(`Exit Code: ${res.code} | StdErr: ${res.stderr || 'EMPTY'} | StdOut: ${res.stdout || 'EMPTY'}`);
        }
      }
    } catch (e: any) {
      setError(e.message || 'Execution error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto font-sans relative">
      {/* Floating Segmented Control */}
      <div className="glass squircle-inner p-1 mb-8 flex items-center relative shadow-lg">
        <motion.div
           layoutId="activePill"
           className="absolute inset-y-1 bg-primary squircle-inner z-0"
           initial={false}
           animate={{
              left: mode === 'compress' ? '4px' : 'calc(50% + 2px)',
              right: mode === 'compress' ? 'calc(50% + 2px)' : '4px'
           }}
           transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
        <button 
           onClick={() => handleModeChange('compress')}
           className={`relative z-10 w-40 py-2.5 text-sm font-medium transition-colors duration-300 ${mode === 'compress' ? 'text-background' : 'text-foreground/70 hover:text-foreground'}`}
        >
          Compress
        </button>
        <button 
           onClick={() => handleModeChange('extract')}
           className={`relative z-10 w-40 py-2.5 text-sm font-medium transition-colors duration-300 ${mode === 'extract' ? 'text-background' : 'text-foreground/70 hover:text-foreground'}`}
        >
          Extract
        </button>
      </div>

      {/* Main Glass Pane */}
      <div className="w-full glass squircle shadow-2xl p-10 min-h-[420px] flex flex-col relative overflow-hidden bg-white/40 dark:bg-black/40 backdrop-blur-3xl border-white/20 dark:border-white/10">
        <AnimatePresence mode="popLayout">
          <motion.div 
            key={mode + (filePath ? 'file' : 'empty') + (result ? 'res' : '')}
            initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col"
          >
            {!filePath ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-white/10 dark:to-white/5 shadow-inner flex items-center justify-center mb-6">
                  {mode === 'compress' ? (
                     <ArchiveRestore className="w-8 h-8 text-foreground/70" />
                  ) : (
                     <FileUp className="w-8 h-8 text-foreground/70" />
                  )}
                </div>
                <h2 className="text-2xl font-semibold mb-3 tracking-tight">
                  {mode === 'compress' ? 'Compact your files' : 'Extract an archive'}
                </h2>
                <p className="text-foreground/60 mb-8 max-w-sm leading-relaxed">
                  {mode === 'compress' 
                    ? 'Select a single file or an entire directory to compress natively with Canonical Huffman algorithms.'
                    : 'Select a highly dense .huff archive to extract its original file structures safely.'}
                </p>

                <div className="flex flex-wrap justify-center gap-4">
                  {mode === 'compress' ? (
                    <>
                      <button onClick={() => handleSelect(false)} className="squircle-inner bg-primary text-background px-6 py-3 font-medium hover:opacity-90 transition-opacity flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95">
                        <FileUp className="w-4 h-4" /> Select File
                      </button>
                      <button onClick={() => handleSelect(true)} className="squircle-inner bg-white/50 dark:bg-white/5 border border-border px-6 py-3 font-medium hover:bg-white dark:hover:bg-white/10 transition-colors flex items-center gap-2 shadow-sm hover:scale-105 active:scale-95">
                        <FolderUp className="w-4 h-4" /> Select Folder
                      </button>
                    </>
                  ) : (
                    <button onClick={() => handleSelect(false)} className="squircle-inner bg-primary text-background px-8 py-3 font-medium hover:opacity-90 transition-opacity flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95">
                      <ArchiveRestore className="w-4 h-4" /> Select Archive
                    </button>
                  )}
                </div>
              </div>
            ) : result ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <motion.div 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }} 
                  transition={{ type: "spring", bounce: 0.5, delay: 0.1 }}
                  className="w-24 h-24 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mb-6 shadow-[inset_0_0_20px_rgba(34,197,94,0.2)]"
                >
                  <CheckCircle className="w-12 h-12" />
                </motion.div>
                <h2 className="text-3xl font-semibold mb-3 tracking-tight">Successfully {result.op}</h2>
                <p className="text-foreground/50 mb-10 font-mono text-sm max-w-xs truncate px-4 py-2 bg-black/5 dark:bg-white/5 rounded-lg">{result.path}</p>
                <button onClick={resetState} className="squircle-inner bg-primary text-background px-8 py-3.5 font-medium hover:opacity-90 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-primary/20">
                  {mode === 'compress' ? 'Compress Another' : 'Extract Another'}
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h2 className="text-xl font-semibold mb-6">Verify Details</h2>
                  <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-black/20 squircle-inner border border-white/40 dark:border-white/10 shadow-sm mb-6 transition-all hover:bg-white/70 dark:hover:bg-black/30">
                    <div className="flex items-center gap-5 overflow-hidden">
                      <div className="w-14 h-14 rounded-[14px] bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white shrink-0 shadow-inner">
                        {mode === 'compress' ? <FileUp className="w-6 h-6"/> : <ArchiveRestore className="w-6 h-6"/>}
                      </div>
                      <div className="overflow-hidden text-left">
                        <h3 className="font-semibold text-lg truncate mb-0.5">{fileName}</h3>
                        <p className="text-xs text-foreground/50 truncate max-w-[280px] font-mono">{filePath}</p>
                      </div>
                    </div>
                    {!isLoading && (
                      <button onClick={resetState} className="p-2.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors shrink-0 group">
                        <XCircle className="w-6 h-6 text-foreground/30 group-hover:text-red-500 transition-colors" />
                      </button>
                    )}
                  </div>
                  
                  {error && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-4 bg-red-500/10 border border-red-500/20 squircle-inner text-red-600 dark:text-red-400 text-sm mb-6 overflow-hidden">
                      <div className="flex gap-3 items-start">
                        <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <p className="leading-relaxed break-words">{error}</p>
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="mt-auto pt-4">
                  <button 
                    onClick={handleProcess}
                    disabled={isLoading}
                    className="w-full relative overflow-hidden group squircle-inner bg-primary text-background py-4 font-semibold disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-primary/20 flex justify-center items-center gap-2 text-lg"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" /> Processing Core
                      </>
                    ) : (
                      <>
                        {mode === 'compress' ? 'Compact Now' : 'Extract Archive'} <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
