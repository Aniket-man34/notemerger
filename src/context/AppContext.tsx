import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { PageImage, UploadedFile, LayoutSettings, EnhancementSettings, AppStep, Toast } from '../types';

interface AppState {
  step: AppStep;
  maxStep: AppStep;
  darkMode: boolean;
  files: UploadedFile[];
  pages: PageImage[];
  layoutSettings: LayoutSettings;
  enhancementSettings: EnhancementSettings;
  toasts: Toast[];
  processing: boolean;
  processProgress: number;
  processMessage: string;
  outputFormat: 'pdf' | 'png-zip';
  finalBlob: Blob | null;
}

interface AppContextType extends AppState {
  setStep: (s: AppStep) => void;
  toggleDarkMode: () => void;
  setFiles: (f: UploadedFile[]) => void;
  addFiles: (f: UploadedFile[]) => void;
  removeFile: (id: string) => void;
  moveFileUp: (id: string) => void;
  moveFileDown: (id: string) => void;
  setPages: (p: PageImage[]) => void;
  togglePageSelection: (id: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  invertSelection: () => void;
  setLayoutSettings: (s: Partial<LayoutSettings>) => void;
  setEnhancementSettings: (s: Partial<EnhancementSettings>) => void;
  addToast: (type: Toast['type'], message: string) => void;
  removeToast: (id: string) => void;
  setProcessing: (p: boolean) => void;
  setProcessProgress: (p: number) => void;
  setProcessMessage: (m: string) => void;
  setOutputFormat: (f: 'pdf' | 'png-zip') => void;
  setFinalBlob: (b: Blob | null) => void;
  resetApp: () => void;
}

const defaultLayout: LayoutSettings = {
  pageSize: 'a4',
  orientation: 'portrait',
  rows: 1,
  cols: 1,
  pageNumbers: false,
  pageNumberPosition: 'bottom-center',
  pageNumberSize: 'medium',
  startingNumber: 1,
};

const defaultEnhancement: EnhancementSettings = {
  invert: false,
  clearBackground: false,
  grayscale: false,
  blackAndWhite: false,
  bwThreshold: 128,
  dpi: 150,
  logoRemoval: null,
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [step, _setStep] = useState<AppStep>(1);
  const [maxStep, setMaxStep] = useState<AppStep>(1);
  const [darkMode, setDarkMode] = useState(false);
  const [files, setFilesState] = useState<UploadedFile[]>([]);
  const [pages, setPagesState] = useState<PageImage[]>([]);
  const [layoutSettings, setLayoutState] = useState<LayoutSettings>(defaultLayout);
  const [enhancementSettings, setEnhancementState] = useState<EnhancementSettings>(defaultEnhancement);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [processing, setProcessing] = useState(false);
  const [processProgress, setProcessProgress] = useState(0);
  const [processMessage, setProcessMessage] = useState('');
  const [outputFormat, setOutputFormat] = useState<'pdf' | 'png-zip'>('pdf');
  const [finalBlob, setFinalBlob] = useState<Blob | null>(null);

  const setStep = useCallback((s: AppStep) => {
    _setStep(s);
    setMaxStep(prev => Math.max(prev, s) as AppStep);
  }, []);

  const toggleDarkMode = useCallback(() => setDarkMode(p => !p), []);

  const setFiles = useCallback((f: UploadedFile[]) => setFilesState(f), []);
  const addFiles = useCallback((f: UploadedFile[]) => setFilesState(prev => [...prev, ...f]), []);
  const removeFile = useCallback((id: string) => setFilesState(prev => prev.filter(f => f.id !== id)), []);

  const moveFileUp = useCallback((id: string) => {
    setFilesState(prev => {
      const idx = prev.findIndex(f => f.id === id);
      if (idx <= 0) return prev;
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  }, []);

  const moveFileDown = useCallback((id: string) => {
    setFilesState(prev => {
      const idx = prev.findIndex(f => f.id === id);
      if (idx < 0 || idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  }, []);

  const setPages = useCallback((p: PageImage[]) => setPagesState(p), []);
  const togglePageSelection = useCallback((id: string) => {
    setPagesState(prev => prev.map(p => p.id === id ? { ...p, selected: !p.selected } : p));
  }, []);
  const selectAll = useCallback(() => setPagesState(prev => prev.map(p => ({ ...p, selected: true }))), []);
  const deselectAll = useCallback(() => setPagesState(prev => prev.map(p => ({ ...p, selected: false }))), []);
  const invertSelection = useCallback(() => setPagesState(prev => prev.map(p => ({ ...p, selected: !p.selected }))), []);

  const setLayoutSettings = useCallback((s: Partial<LayoutSettings>) => setLayoutState(prev => ({ ...prev, ...s })), []);
  const setEnhancementSettings = useCallback((s: Partial<EnhancementSettings>) => setEnhancementState(prev => ({ ...prev, ...s })), []);

  const addToast = useCallback((type: Toast['type'], message: string) => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);
  const removeToast = useCallback((id: string) => setToasts(prev => prev.filter(t => t.id !== id)), []);

  const resetApp = useCallback(() => {
    pages.forEach(p => {
      URL.revokeObjectURL(p.thumbnailUrl);
      URL.revokeObjectURL(p.fullUrl);
    });
    _setStep(1);
    setMaxStep(1);
    setFilesState([]);
    setPagesState([]);
    setLayoutState(defaultLayout);
    setEnhancementState(defaultEnhancement);
    setProcessing(false);
    setProcessProgress(0);
    setProcessMessage('');
    setFinalBlob(null);
  }, [pages]);

  return (
    <AppContext.Provider value={{
      step, maxStep, darkMode, files, pages, layoutSettings, enhancementSettings, toasts,
      processing, processProgress, processMessage, outputFormat, finalBlob,
      setStep, toggleDarkMode, setFiles, addFiles, removeFile, moveFileUp, moveFileDown,
      setPages, togglePageSelection, selectAll, deselectAll, invertSelection,
      setLayoutSettings, setEnhancementSettings, addToast, removeToast,
      setProcessing, setProcessProgress, setProcessMessage, setOutputFormat,
      setFinalBlob, resetApp,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
