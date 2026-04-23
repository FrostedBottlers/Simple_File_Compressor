'use client';

import { useState, useRef, useEffect } from 'react';
import { compressFile, decompressFile } from './actions';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ filename: string; data: string; oldSize: number; newSize: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(true);
  };

  const handleDragLeave = () => {
    setIsHovering(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(false);
    setError(null);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleCompress = async () => {
    if (!file) return;
    setIsLoading(true);
    setError(null);

    const isDecompressing = file.name.endsWith('.huff');

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await (isDecompressing ? decompressFile(formData) : compressFile(formData));
      if (res.success && res.data) {
        setResult({
          filename: res.filename as string,
          data: res.data,
          oldSize: res.originalSize as number,
          newSize: res.size as number,
        });
      } else {
        setError(res.error || (isDecompressing ? 'Decompression failed' : 'Compression failed'));
      }
    } catch (e: any) {
      setError(e.message || 'Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadFile = () => {
    if (!result) return;
    const link = document.createElement('a');
    link.href = `data:application/octet-stream;base64,${result.data}`;
    link.download = result.filename;
    link.click();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] font-sans">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-500 dark:from-white dark:to-gray-400">
          Compactor & Extractor
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto dark:text-gray-400">
          Drop any file to compress it, or drop a <b>.huff</b> file to extract it instantly using our native C++ Canonical Huffman algorithm. Like WinRAR, but better.
        </p>
      </div>

      <div className="w-full max-w-2xl">
        <div 
          className={`glass squircle p-10 transition-all duration-300 ease-out border-2 border-dashed relative overflow-hidden group
            ${isHovering ? 'border-primary scale-102 bg-black/5 dark:bg-white/5' : 'border-transparent'}
            `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !file && fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange}
            className="hidden" 
          />
          
          <div className="flex flex-col items-center justify-center text-center min-h-[200px]">
             {!file ? (
                <>
                  <div className={`w-16 h-16 rounded-full bg-accent mb-6 flex items-center justify-center transition-transform duration-500 ${isHovering ? 'scale-110' : ''}`}>
                    <svg className="w-8 h-8 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                  </div>
                  <h3 className="text-xl font-medium mb-2">Drop your file here</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">or click to browse from your device</p>
                </>
             ) : (
                <div className="w-full relative z-10 animate-in fade-in zoom-in duration-300">
                  <div className="flex items-center justify-between p-4 bg-accent/50 squircle-inner border border-white/10 shrink-0">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center text-white shrink-0">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                       </div>
                       <div className="text-left overflow-hidden">
                          <p className="font-medium truncate max-w-[200px] mb-1">{file.name}</p>
                          <p className="text-xs text-gray-500">{formatSize(file.size)}</p>
                       </div>
                    </div>
                    
                    {!result && (
                      <button 
                         onClick={(e) => { e.stopPropagation(); setFile(null); }}
                         className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors"
                      >
                         <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                      </button>
                    )}
                  </div>

                  {!result && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleCompress(); }}
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
                      ) : file.name.endsWith('.huff') ? (
                        'Extract Archive'
                      ) : (
                        'Compress File'
                      )}
                    </button>
                  )}

                  {result && (
                    <div className="mt-8 pt-8 border-t border-white/10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="flex items-center justify-center gap-8 mb-8 text-center">
                         <div>
                            <p className="text-sm text-gray-500 mb-1">Original</p>
                            <p className="font-semibold">{formatSize(result.oldSize)}</p>
                         </div>
                         <div className="w-12 h-px bg-gray-300 dark:bg-gray-700 relative">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                               <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                            </div>
                         </div>
                         <div>
                            <p className="text-sm text-gray-500 mb-1">Compressed</p>
                            <p className="font-semibold text-green-500 dark:text-green-400">{formatSize(result.newSize)}</p>
                         </div>
                      </div>
                      <div className="flex gap-4">
                          <button 
                            onClick={(e) => { e.stopPropagation(); downloadFile(); }}
                            className="flex-1 py-4 bg-primary text-background font-medium squircle-inner hover:opacity-90 transition-opacity animate-pulse-glow"
                          >
                            {file.name.endsWith('.huff') ? 'Download Extracted' : 'Download Archive'}
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setFile(null); setResult(null); }}
                            className="px-6 py-4 bg-accent font-medium squircle-inner hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                          >
                            New
                          </button>
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="mt-4 p-4 text-sm text-red-500 bg-red-50 dark:bg-red-950/30 squircle-inner">
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
