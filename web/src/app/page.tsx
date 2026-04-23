'use client';

import { useState } from 'react';
import { Command } from '@tauri-apps/plugin-shell';
import { open, save } from '@tauri-apps/plugin-dialog';

export default function Home() {
  const [filePath, setFilePath] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ op: string; path: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSelectFile = async () => {
    try {
      const selected = await open({
        multiple: false,
        title: 'Select a file or archive to process'
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

    const isDecompressing = fileName.endsWith('.huff');

    try {
      if (isDecompressing) {
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
        
        const cmd = Command.sidecar('../core/huffpack', ['unpack', filePath, outDir as string]);
        const res = await cmd.execute();
        
        if (res.code === 0) {
           setResult({ op: 'Extracted', path: outDir as string });
        } else {
           setError('Extraction failed: ' + res.stderr);
        }
      } else {
        // Output file selection
        const outFile = await save({
          filters: [{ name: 'HuffPack Archive', extensions: ['huff'] }],
          defaultPath: fileName + '.huff'
        });
        
        if (!outFile) {
           setIsLoading(false);
           return;
        }

        const cmd = Command.sidecar('../core/huffpack', ['pack', outFile, filePath]);
        const res = await cmd.execute();
        
        if (res.code === 0) {
           setResult({ op: 'Compressed', path: outFile });
        } else {
           setError('Compression failed: ' + res.stderr);
        }
      }
    } catch (e: any) {
      setError(e.message || 'Execution error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] font-sans">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-500 dark:from-white dark:to-gray-400">
          Compactor & Extractor
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto dark:text-gray-400">
          Native Desktop Client. Process files instantly using the bundled C++ Canonical Huffman sidecar. Limitless speed and size.
        </p>
      </div>

      <div className="w-full max-w-2xl">
        <div className="glass squircle p-10 transition-all duration-300 ease-out border-2 border-transparent relative overflow-hidden group">
          <div className="flex flex-col items-center justify-center text-center min-h-[200px]">
             {!filePath ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-accent mb-6 flex items-center justify-center transition-transform duration-500 group-hover:scale-110">
                    <svg className="w-8 h-8 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                  </div>
                  <h3 className="text-xl font-medium mb-2">Ready to compress</h3>
                  <button 
                    onClick={handleSelectFile}
                    className="mt-4 px-8 py-3 bg-primary text-background font-medium squircle-inner hover:opacity-90 transition-opacity"
                  >
                    Select File
                  </button>
                </>
             ) : (
                <div className="w-full relative z-10 animate-in fade-in zoom-in duration-300">
                  <div className="flex items-center justify-between p-4 bg-accent/50 squircle-inner border border-white/10 shrink-0">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center text-white shrink-0">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                       </div>
                       <div className="text-left overflow-hidden">
                          <p className="font-medium truncate max-w-[300px] mb-1">{fileName}</p>
                          <p className="text-xs text-gray-500 truncate max-w-[300px]">{filePath}</p>
                       </div>
                    </div>
                    
                    {!result && (
                      <button 
                         onClick={() => { setFilePath(null); setFileName(null); }}
                         className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors"
                      >
                         <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                      </button>
                    )}
                  </div>

                  {!result && (
                    <button 
                      onClick={handleProcess}
                      disabled={isLoading}
                      className="mt-8 w-full py-4 bg-primary text-background font-medium squircle-inner hover:opacity-90 transition-opacity disabled:opacity-50 relative overflow-hidden"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                           <svg className="animate-spin h-5 w-5 text-background" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                           Processing...
                        </div>
                      ) : fileName?.endsWith('.huff') ? (
                        'Extract Archive'
                      ) : (
                        'Compress File'
                      )}
                    </button>
                  )}

                  {result && (
                    <div className="mt-8 pt-8 border-t border-white/10 animate-in fade-in slide-in-from-bottom-4 duration-500 text-center">
                      <div className="w-16 h-16 rounded-full bg-green-500/20 text-green-500 mx-auto mb-4 flex items-center justify-center">
                         <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                      </div>
                      <h4 className="text-xl font-medium mb-2">Successfully {result.op}!</h4>
                      <p className="text-sm text-gray-500 mb-6 truncate px-4">Saved to: {result.path}</p>
                      
                      <button 
                        onClick={() => { setFilePath(null); setFileName(null); setResult(null); }}
                        className="px-8 py-3 bg-accent font-medium squircle-inner hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                      >
                        Process Another File
                      </button>
                    </div>
                  )}

                  {error && (
                    <div className="mt-4 p-4 text-sm text-red-500 bg-red-50 dark:bg-red-950/30 squircle-inner overflow-auto max-h-32">
                      {error}
                    </div>
                  )}
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
