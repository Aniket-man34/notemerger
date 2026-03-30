import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { Upload, LayoutGrid, Sparkles, Download, Sun, Moon, X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import type { AppStep, Toast as ToastType } from '../types';
import { useEffect, useState, useCallback } from 'react';

const steps: { step: AppStep; label: string; icon: typeof Upload }[] = [
  { step: 1, label: 'Upload', icon: Upload },
  { step: 2, label: 'Select Pages', icon: LayoutGrid },
  { step: 3, label: 'Enhance & Layout', icon: Sparkles },
  { step: 4, label: 'Download', icon: Download },
];

export function StepBar() {
  const { step, maxStep, setStep } = useApp();

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-3">
      <div className="flex items-center justify-between relative">
        {/* Connection line */}
        <div className="absolute top-5 left-[10%] right-[10%] h-0.5 bg-gray-200 dark:bg-gray-700 z-0" />
        <motion.div
          className="absolute top-5 left-[10%] h-0.5 bg-gradient-to-r from-primary-500 to-accent-500 z-0"
          initial={{ width: '0%' }}
          animate={{ width: `${((step - 1) / 3) * 80}%` }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        />

        {steps.map((s) => {
          const isCompleted = s.step < step;
          const isCurrent = s.step === step;
          const isAccessible = s.step <= maxStep;
          const Icon = s.icon;

          return (
            <motion.button
              key={s.step}
              onClick={() => isAccessible && setStep(s.step)}
              disabled={!isAccessible}
              className={`relative z-10 flex flex-col items-center gap-1.5 group ${isAccessible ? 'cursor-pointer' : 'cursor-not-allowed'}`}
              whileHover={isAccessible ? { scale: 1.05 } : {}}
              whileTap={isAccessible ? { scale: 0.95 } : {}}
            >
              <motion.div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                  isCurrent
                    ? 'bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-lg shadow-primary-500/30'
                    : isCompleted
                    ? 'bg-success-500 text-white shadow-md shadow-success-500/20'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}
                animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </motion.div>
              <span className={`text-xs font-medium hidden sm:block transition-colors ${
                isCurrent ? 'text-primary-600 dark:text-primary-400' : isCompleted ? 'text-success-600 dark:text-success-400' : 'text-gray-400 dark:text-gray-500'
              }`}>
                {s.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

export function ThemeToggle() {
  const { darkMode, toggleDarkMode } = useApp();

  return (
    <motion.button
      onClick={toggleDarkMode}
      className="p-2 rounded-xl glass-card hover:scale-110 transition-transform"
      whileTap={{ scale: 0.9, rotate: 180 }}
      aria-label="Toggle theme"
    >
      <AnimatePresence mode="wait">
        {darkMode ? (
          <motion.div key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
            <Sun className="w-5 h-5 text-yellow-400" />
          </motion.div>
        ) : (
          <motion.div key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
            <Moon className="w-5 h-5 text-primary-600" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

const toastIcons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const toastColors = {
  success: 'border-success-500 bg-success-50 dark:bg-success-500/10 text-success-700 dark:text-success-400',
  error: 'border-red-500 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400',
  warning: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  info: 'border-primary-500 bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400',
};

export function ToastContainer() {
  const { toasts, removeToast } = useApp();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      <AnimatePresence>
        {toasts.map((toast: ToastType) => {
          const Icon = toastIcons[toast.type];
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 100, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.8 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border-l-4 shadow-lg backdrop-blur-sm ${toastColors[toast.type]}`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium flex-1">{toast.message}</span>
              <button onClick={() => removeToast(toast.id)} className="flex-shrink-0 opacity-60 hover:opacity-100">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

export function AnimatedBackground() {
  const { darkMode } = useApp();
  const [particles, setParticles] = useState<Particle[]>([]);

  const generateParticles = useCallback(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 20 + 15,
      delay: Math.random() * 5,
      opacity: Math.random() * 0.3 + 0.1,
    }));
  }, []);

  useEffect(() => {
    setParticles(generateParticles());
  }, [generateParticles]);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className={`absolute inset-0 transition-colors duration-700 ${
        darkMode
          ? 'bg-gradient-to-br from-gray-950 via-primary-950 to-gray-900'
          : 'bg-gradient-to-br from-slate-50 via-primary-50 to-accent-50'
      }`} />

      {/* Gradient orbs */}
      <motion.div
        className={`absolute w-96 h-96 rounded-full blur-3xl ${darkMode ? 'bg-primary-800/20' : 'bg-primary-300/20'}`}
        animate={{ x: [0, 100, 0], y: [0, -50, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        style={{ top: '10%', left: '10%' }}
      />
      <motion.div
        className={`absolute w-72 h-72 rounded-full blur-3xl ${darkMode ? 'bg-accent-800/15' : 'bg-accent-300/20'}`}
        animate={{ x: [0, -80, 0], y: [0, 60, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
        style={{ bottom: '20%', right: '15%' }}
      />

      {/* Floating particles */}
      <svg className="absolute inset-0 w-full h-full">
        {particles.map((p) => (
          <motion.circle
            key={p.id}
            cx={`${p.x}%`}
            cy={`${p.y}%`}
            r={p.size}
            fill={darkMode ? 'rgba(165,180,252,' + p.opacity + ')' : 'rgba(99,102,241,' + p.opacity + ')'}
            animate={{
              cy: [`${p.y}%`, `${(p.y + 30) % 100}%`, `${p.y}%`],
              cx: [`${p.x}%`, `${(p.x + 10) % 100}%`, `${p.x}%`],
            }}
            transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
          />
        ))}
      </svg>
    </div>
  );
}

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}
