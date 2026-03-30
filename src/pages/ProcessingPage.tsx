import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { PageTransition } from '../components/SharedComponents';
import { Download, FileText, Image, Sparkles, CheckCircle, Loader2, RefreshCw, ChevronLeft, ChevronRight, ZoomIn, X } from 'lucide-react';
import { generateOutput } from '../utils/outputGeneration';
import { saveAs } from 'file-saver';

const processingSteps = [
  { label: 'Applying enhancements…', icon: Sparkles },
  { label: 'Composing layout…', icon: Image },
  { label: 'Generating final document…', icon: FileText },
  { label: 'Preparing download…', icon: Download },
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

export function ProcessingPage() {
  const {
    pages, layoutSettings, enhancementSettings,
    outputFormat, setOutputFormat, finalBlob, setFinalBlob,
    addToast, resetApp, setStep,
    setProcessing, processProgress, setProcessProgress,
    processMessage, setProcessMessage
  } = useApp();

  const [done, setDone] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [previewIdx, setPreviewIdx] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const hasStarted = useRef(false);

  const selectedPages = pages.filter(p => p.selected);

  const startProcessing = useCallback(async () => {
    if (hasStarted.current) return;
    hasStarted.current = true;
    setProcessing(true);
    setDone(false);
    setProcessProgress(0);
    setCurrentStepIdx(0);

    try {
      const result = await generateOutput(
        selectedPages,
        layoutSettings,
        enhancementSettings,
        outputFormat,
        (msg, progress) => {
          setProcessMessage(msg);
          setProcessProgress(progress);
          if (progress < 20) setCurrentStepIdx(0);
          else if (progress < 50) setCurrentStepIdx(1);
          else if (progress < 80) setCurrentStepIdx(2);
          else setCurrentStepIdx(3);
        }
      );

      setFinalBlob(result.blob);
      setPreviewUrls(result.previewUrls);
      setProcessProgress(100);
      setProcessMessage('Complete!');
      setCurrentStepIdx(3);
      setDone(true);
      setProcessing(false);
      addToast('success', 'Document generated successfully!');
    } catch (err) {
      setProcessing(false);
      addToast('error', err instanceof Error ? err.message : 'Processing failed');
      hasStarted.current = false;
    }
  }, [selectedPages, layoutSettings, enhancementSettings, outputFormat, setFinalBlob, setProcessing, setProcessProgress, setProcessMessage, addToast]);

  useEffect(() => {
    startProcessing();
  }, [startProcessing]);

  const handleDownload = () => {
    if (!finalBlob) return;
    const ext = outputFormat === 'pdf' ? 'pdf' : 'zip';
    const filename = `merged-notes.${ext}`;
    saveAs(finalBlob, filename);
    addToast('success', `Downloaded ${filename}`);
  };

  const handleRestart = () => {
    resetApp();
    setStep(1);
  };

  // Confetti effect
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; color: string; delay: number }>>([]);
  useEffect(() => {
    if (done) {
      setConfetti(
        Array.from({ length: 40 }, (_, i) => ({
          id: i,
          x: Math.random() * 100,
          color: ['#6366f1', '#0ea5e9', '#22c55e', '#f59e0b', '#ec4899', '#8b5cf6'][Math.floor(Math.random() * 6)],
          delay: Math.random() * 0.5,
        }))
      );
    }
  }, [done]);

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto px-4 pb-12">
        {/* Confetti */}
        <AnimatePresence>
          {done && confetti.map(c => (
            <motion.div
              key={c.id}
              className="fixed top-0 w-2 h-3 rounded-sm z-50 pointer-events-none"
              style={{ left: `${c.x}%`, backgroundColor: c.color }}
              initial={{ y: -20, opacity: 1, rotate: 0 }}
              animate={{
                y: window.innerHeight + 20,
                opacity: 0,
                rotate: Math.random() * 720 - 360,
                x: Math.random() * 200 - 100,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2 + Math.random() * 2, delay: c.delay, ease: 'easeIn' }}
            />
          ))}
        </AnimatePresence>

        <motion.div
          className="text-center py-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">
            {done ? '🎉 Your Document is Ready!' : 'Processing Your Document'}
          </h2>
        </motion.div>

        {/* Processing Steps */}
        <motion.div
          className="glass-card rounded-2xl p-6 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="space-y-3 mb-6">
            {processingSteps.map((ps, i) => {
              const Icon = ps.icon;
              const isActive = i === currentStepIdx && !done;
              const isComplete = i < currentStepIdx || done;

              return (
                <motion.div
                  key={i}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                    isActive ? 'bg-primary-50 dark:bg-primary-500/10' : ''
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * i }}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                    isComplete
                      ? 'bg-success-500 text-white'
                      : isActive
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                  }`}>
                    {isComplete ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : isActive ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  <span className={`text-sm font-medium ${
                    isComplete ? 'text-success-600 dark:text-success-400' : isActive ? 'text-primary-700 dark:text-primary-400' : 'text-gray-400'
                  }`}>
                    {ps.label}
                  </span>
                </motion.div>
              );
            })}
          </div>

          {/* Progress Bar */}
          <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${
                done
                  ? 'bg-gradient-to-r from-success-400 to-success-600'
                  : 'bg-gradient-to-r from-primary-500 to-accent-500'
              }`}
              initial={{ width: '0%' }}
              animate={{ width: `${processProgress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">{processMessage}</span>
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">{processProgress}%</span>
          </div>
        </motion.div>

        {/* Completion Section */}
        <AnimatePresence>
          {done && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {/* Preview Section — shows composed output with enhancements */}
              {previewUrls.length > 0 && (
                <div className="glass-card rounded-2xl p-6 mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Document Preview</h3>
                  <div className="relative rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <img
                      src={previewUrls[previewIdx]}
                      alt={`Preview page ${previewIdx + 1}`}
                      className="w-full h-64 md:h-80 object-contain cursor-zoom-in"
                      onClick={() => setLightbox(true)}
                    />
                    {/* Nav */}
                    {previewUrls.length > 1 && (
                      <>
                        <button
                          onClick={() => setPreviewIdx(p => Math.max(0, p - 1))}
                          disabled={previewIdx === 0}
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 dark:bg-gray-900/80 flex items-center justify-center disabled:opacity-30"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setPreviewIdx(p => Math.min(previewUrls.length - 1, p + 1))}
                          disabled={previewIdx >= previewUrls.length - 1}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 dark:bg-gray-900/80 flex items-center justify-center disabled:opacity-30"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setLightbox(true)}
                      className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-white/80 dark:bg-gray-900/80 flex items-center justify-center"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/50 text-white text-xs">
                      {previewIdx + 1} / {previewUrls.length}
                    </div>
                  </div>
                </div>
              )}

              {/* Download Section */}
              <div className="glass-card rounded-2xl p-6 mb-6">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Download Options</h3>

                <div className="flex gap-3 mb-5">
                  <button
                    onClick={() => {
                      if (outputFormat !== 'pdf') {
                        setOutputFormat('pdf');
                        hasStarted.current = false;
                        setDone(false);
                        setTimeout(() => startProcessing(), 100);
                      }
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
                      outputFormat === 'pdf'
                        ? 'bg-primary-500 text-white shadow-md'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 cursor-pointer'
                    }`}
                  >
                    <FileText className="w-5 h-5" /> PDF
                  </button>
                  <button
                    onClick={() => {
                      if (outputFormat !== 'png-zip') {
                        setOutputFormat('png-zip');
                        hasStarted.current = false;
                        setDone(false);
                        setTimeout(() => startProcessing(), 100);
                      }
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
                      outputFormat === 'png-zip'
                        ? 'bg-primary-500 text-white shadow-md'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 cursor-pointer'
                    }`}
                  >
                    <Image className="w-5 h-5" /> PNG (ZIP)
                  </button>
                </div>

                {finalBlob && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-4">
                    File size: {formatFileSize(finalBlob.size)}
                  </p>
                )}

                <motion.button
                  onClick={handleDownload}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 rounded-xl font-bold text-white text-lg bg-gradient-to-r from-primary-600 to-accent-600 shadow-xl hover:shadow-2xl hover:shadow-primary-500/25 transition-all flex items-center justify-center gap-3 cursor-pointer"
                >
                  <Download className="w-6 h-6" />
                  Download {outputFormat === 'pdf' ? 'PDF' : 'PNG Bundle'}
                </motion.button>
              </div>

              {/* Restart */}
              <div className="text-center">
                <motion.button
                  onClick={handleRestart}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-primary-500/10 hover:bg-primary-100 dark:hover:bg-primary-500/20 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  ✨ Process Another Document
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lightbox */}
        <AnimatePresence>
          {lightbox && previewUrls[previewIdx] && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
              onClick={() => setLightbox(false)}
            >
              <button className="absolute top-4 right-4 text-white p-2">
                <X className="w-6 h-6" />
              </button>
              <img
                src={previewUrls[previewIdx]}
                alt="Full preview"
                className="max-w-full max-h-full object-contain"
                onClick={e => e.stopPropagation()}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
