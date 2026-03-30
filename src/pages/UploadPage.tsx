import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { PageTransition } from '../components/SharedComponents';
import { Upload, FileText, Image, Presentation, Scissors, Sparkles, LayoutGrid, X, Loader2, File, ChevronUp, ChevronDown, Music, Video, StickyNote } from 'lucide-react';
import { processFiles } from '../utils/fileProcessing';
import type { UploadedFile } from '../types';

const ACCEPTED = '.png,.jpg,.jpeg,.pdf,.ppt,.pptx,.webp';
const faviconSrc = `${import.meta.env.BASE_URL}favicon.svg`;

const features = [
  { icon: FileText, title: 'Multi-Format', desc: 'PNG, JPEG, PDF, PPT/PPTX', color: 'from-blue-500 to-cyan-500' },
  { icon: Scissors, title: 'Page Selection', desc: 'Pick only pages you need', color: 'from-purple-500 to-pink-500' },
  { icon: Sparkles, title: 'Enhancement', desc: 'Invert, clean, grayscale & more', color: 'from-amber-500 to-orange-500' },
  { icon: LayoutGrid, title: 'Custom Layouts', desc: 'Grid layouts, orientations, page numbers', color: 'from-green-500 to-emerald-500' },
];

function getFileIcon(name: string) {
  const ext = name.toLowerCase().split('.').pop() || '';
  if (ext === 'pdf') return <FileText className="w-5 h-5 text-red-500" />;
  if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) return <Image className="w-5 h-5 text-green-500" />;
  if (['ppt', 'pptx'].includes(ext)) return <Presentation className="w-5 h-5 text-orange-500" />;
  return <File className="w-5 h-5 text-gray-500" />;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

// Background Animation Component
const FloatingBackground = () => {
  const icons = [FileText, Image, Presentation, File, Sparkles, StickyNote];
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number; duration: number; delay: number; Icon: any }>>([]);

  useEffect(() => {
    // Generate random particles only on client side to match hydration
    const newParticles = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 16 + Math.random() * 30, // 16px to 46px
      duration: 15 + Math.random() * 20, // 15s to 35s
      delay: Math.random() * -20, // Negative delay to start mid-animation
      Icon: icons[Math.floor(Math.random() * icons.length)],
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute text-primary-300/20 dark:text-primary-500/10"
          initial={{ x: `${p.x}%`, y: `${p.y}%`, opacity: 0 }}
          animate={{
            y: [`${p.y}%`, `${(p.y - 20 + 100) % 100}%`, `${(p.y + 10 + 100) % 100}%`], // Drift vertically
            x: [`${p.x}%`, `${(p.x + 10 + 100) % 100}%`, `${(p.x - 10 + 100) % 100}%`], // Drift horizontally
            rotate: [0, 180, 360],
            opacity: [0, 0.4, 0],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "linear",
            delay: p.delay,
            repeatType: "reverse",
          }}
        >
          <p.Icon size={p.size} />
        </motion.div>
      ))}
    </div>
  );
};

export function UploadPage() {
  const { files, addFiles, removeFile, moveFileUp, moveFileDown, setPages, setStep, addToast } = useApp();
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((fileList: FileList | File[]) => {
    const validExts = ['png', 'jpg', 'jpeg', 'pdf', 'ppt', 'pptx', 'webp'];
    const newFiles: UploadedFile[] = [];

    Array.from(fileList).forEach(file => {
      const ext = file.name.toLowerCase().split('.').pop() || '';
      if (!validExts.includes(ext)) {
        addToast('warning', `${file.name} is not a supported format`);
        return;
      }
      newFiles.push({
        id: crypto.randomUUID(),
        name: file.name,
        type: ext,
        size: file.size,
        file,
      });
    });

    if (newFiles.length > 0) {
      addFiles(newFiles);
      addToast('success', `${newFiles.length} file(s) added`);
    }
  }, [addFiles, addToast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleProcess = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setProgress(0);
    setProgressMsg('Starting...');

    try {
      const allFiles = files.map(f => f.file);
      const pages = await processFiles(allFiles, (msg, current, total) => {
        setProgressMsg(msg);
        setProgress(Math.round(((current + 0.5) / total) * 100));
      });

      setPages(pages);
      setProgress(100);
      setProgressMsg('Complete!');
      addToast('success', `Extracted ${pages.length} pages from ${files.length} file(s)`);

      setTimeout(() => {
        setStep(2);
        setIsProcessing(false);
      }, 600);
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Processing failed');
      setIsProcessing(false);
    }
  };

  return (
    <PageTransition>
      <div className="relative min-h-[calc(100vh-80px)] overflow-hidden">
        {/* Animated Background */}
        <FloatingBackground />

        <div className="max-w-5xl mx-auto px-4 pb-12 relative z-10">
          {/* Hero */}
          <motion.div
            className="text-center py-8 md:py-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="inline-flex mb-4"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <img src={faviconSrc} alt="NoteMerger logo" className="w-16 h-16 rounded-2xl shadow-xl shadow-primary-500/25" />
            </motion.div>
            <h1 className="text-3xl md:text-5xl font-extrabold bg-gradient-to-r from-primary-600 via-accent-500 to-primary-600 bg-clip-text text-transparent animate-gradient mb-3">
              Merge, Enhance & Transform
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Upload documents, select pages, enhance quality, and customize layout — all in your browser
            </p>
          </motion.div>

          {/* Feature Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i, duration: 0.4 }}
                whileHover={{ scale: 1.03, y: -2 }}
                className="glass-card rounded-xl p-4 text-center backdrop-blur-md bg-white/60 dark:bg-gray-800/60"
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${f.color} flex items-center justify-center mx-auto mb-2`}>
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-200">{f.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{f.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Upload Zone */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative glass-card rounded-2xl p-8 md:p-12 text-center cursor-pointer transition-all duration-300 backdrop-blur-md ${
                isDragging
                  ? 'border-2 border-dashed border-primary-500 bg-primary-50/80 dark:bg-primary-500/20 scale-[1.02]'
                  : 'border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary-400 bg-white/50 dark:bg-gray-800/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED}
                multiple
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
                className="hidden"
              />

              <motion.div
                animate={isDragging ? { scale: 1.1, rotate: 10 } : { scale: 1, rotate: 0 }}
                className="mb-4 inline-block"
              >
                <Upload className={`w-12 h-12 mx-auto ${isDragging ? 'text-primary-500' : 'text-gray-400 dark:text-gray-500'}`} />
              </motion.div>

              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {isDragging ? 'Drop files here!' : 'Drag & drop files here'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                or click to browse
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400 text-xs font-medium">
                <span>PNG</span><span>•</span><span>JPEG</span><span>•</span><span>PDF</span><span>•</span><span>PPT/PPTX</span>
              </div>
            </div>
          </motion.div>

          {/* File List with Reorder */}
          <AnimatePresence>
            {files.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6"
              >
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  {files.length} file{files.length > 1 ? 's' : ''} selected
                  {files.length > 1 && (
                    <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-2">
                      — use arrows to set processing order
                    </span>
                  )}
                </h3>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {files.map((file, i) => (
                    <motion.div
                      key={file.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: i * 0.03 }}
                      className="glass-card rounded-xl px-3 py-2.5 flex items-center gap-2 backdrop-blur-sm bg-white/70 dark:bg-gray-800/70"
                    >
                      {/* Order number */}
                      <span className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-500/15 text-primary-700 dark:text-primary-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {i + 1}
                      </span>

                      {/* Up / Down buttons */}
                      <div className="flex flex-col gap-0.5 flex-shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); moveFileUp(file.id); }}
                          disabled={i === 0}
                          className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                          title="Move up"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); moveFileDown(file.id); }}
                          disabled={i === files.length - 1}
                          className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                          title="Move down"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* File icon */}
                      {getFileIcon(file.name)}

                      {/* File info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{file.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{formatSize(file.size)}</p>
                      </div>

                      {/* Remove button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); removeFile(file.id); }}
                        className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Processing Progress */}
          <AnimatePresence>
            {isProcessing && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-6 glass-card rounded-xl p-6 backdrop-blur-md bg-white/80 dark:bg-gray-800/80"
              >
                <div className="flex items-center gap-3 mb-3">
                  <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{progressMsg}</span>
                </div>
                <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className="text-right text-xs text-gray-500 mt-1">{progress}%</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Process Button */}
          {!isProcessing && (
            <motion.div className="mt-6 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
              <motion.button
                onClick={handleProcess}
                disabled={files.length === 0}
                whileHover={files.length > 0 ? { scale: 1.02, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" } : {}}
                whileTap={files.length > 0 ? { scale: 0.98 } : {}}
                className={`px-8 py-3.5 rounded-xl font-semibold text-white text-base shadow-lg transition-all duration-300 ${
                  files.length > 0
                    ? 'bg-gradient-to-r from-primary-600 to-accent-600 hover:shadow-xl hover:shadow-primary-500/25 cursor-pointer'
                    : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed shadow-none'
                }`}
              >
                Upload & Process →
              </motion.button>
            </motion.div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
