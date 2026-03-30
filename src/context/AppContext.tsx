import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { PageImage, UploadedFile, LayoutSettings, EnhancementSettings, AppStep, Toast } from '../types';

interface AppContextType {
  step: AppStep;
  pages: PageImage[];
  files: UploadedFile[];
  layoutSettings: LayoutSettings;
  enhancementSettings: EnhancementSettings;
  outputFormat: 'pdf' | 'png-zip';
  darkMode: boolean;
  toasts: Toast[];
  processing: boolean;
  processProgress: number;
  processMessage: string;
  finalBlob: Blob | null;
  setStep: (step: AppStep) => void;
  addPages: (newPages: PageImage[]) => void;
  setFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>;
  togglePageSelection: (id: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  invertSelection: () => void;
  updateLayout: (settings: Partial<LayoutSettings>) => void;
  updateEnhancement: (settings: Partial<EnhancementSettings>) => void;
  setOutputFormat: (format: 'pdf' | 'png-zip') => void;
  toggleDarkMode: () => void;
  addToast: (type: Toast['type'], message: string) => void;
  removeToast: (id: string) => void;
  setProcessing: (processing: boolean) => void;
  setProcessProgress: (progress: number) => void;
  setProcessMessage: (message: string) => void;
  setFinalBlob: (blob: Blob | null) => void;
  resetApp: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [step, setStep] = useState<AppStep>(1);
  const [pages, setPages] = useState<PageImage[]>([]);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [outputFormat, setOutputFormat] = useState<'pdf' | 'png-zip'>('pdf');
  const [darkMode, setDarkMode] = useState(() => 
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [processing, setProcessing] = useState(false);
  const [processProgress, setProcessProgress] = useState(0);
  const [processMessage, setProcessMessage] = useState('');
  const [finalBlob, setFinalBlob] = useState<Blob | null>(null);

  const [layoutSettings, setLayoutSettings] = useState<LayoutSettings>({
    pageSize: 'original',
    orientation: 'portrait',
    rows: 2,
    cols: 2,
    pageNumbers: true,
    pageNumberPosition: 'bottom-center',
    pageNumberSize: 'medium',
    startingNumber: 1,
  });

  const [enhancementSettings, setEnhancementSettings] = useState<EnhancementSettings>({
    invert: false,
    clearBackground: false,
    grayscale: false,
    blackAndWhite: false,
    bwThreshold: 150,
    dpi: 200,
    logoRemoval: null,
  });

  // Optimized: Uses functional updates to handle rapid batch processing
  const addPages = useCallback((newPages: PageImage[]) => {
    setPages(prev => [...prev, ...newPages]);
  }, []);

  // Optimized: Us
  const togglePageSelection = useCallback((id: string) => {
    setPages(prev => prev.map(page => 
      page.id === id ? { ...page, selected: !page.selected } : page
    ));
  }, []);

  const selectAll = useCallback(() => {
    setPages(prev => prev.map(p => ({ ...p, selected: true })));
  }, []);

  const deselectAll = useCallback(() => {
    setPages(prev => prev.map(p => ({ ...p, selected: false })));
  }, []);

  const invertSelection = useCallback(() => {
    setPages(prev => prev.map(p => ({ ...p, selected: !p.selected })));
  }, []);

  const updateLayout = useCallback((settings: Partial<LayoutSettings>) => {
    setLayoutSettings(prev => ({ ...prev, ...settings }));
  }, []);

  const updateEnhancement = useCallback((settings: Partial<EnhancementSettings>) => {
    setEnhancementSettings(prev => ({ ...prev, ...settings }));
  }, []);

  const toggleDarkMode = useCallback(() => setDarkMode(prev => !prev), []);

  const addToast = useCallback((type: Toast['type'], message: string) => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Optimized: Rigorous memory cleanup to free browser RAM
  const resetApp = useCallback(() => {
    pages.forEach(page => {
      if (page.thumbnailUrl) URL.revokeObjectURL(page.thumbnailUrl);
      if (page.fullUrl) URL.revokeObjectURL(page.fullUrl);
    });
    
    setPages([]);
    setFiles([]);
    setStep(1);
    setProcessing(false);
    setProcessProgress(0);
    setProcessMessage('');
    setFinalBlob(null);
  }, [pages]);

  const value = {
    step, setStep,
    pages, addPages,
    files, setFiles,
    togglePageSelection, selectAll, deselectAll, invertSelection,
    layoutSettings, updateLayout,
    enhancementSettings, updateEnhancement,
    outputFormat, setOutputFormat,
    darkMode, toggleDarkMode,
    toasts, addToast, removeToast,
    processing, setProcessing,
    processProgress, setProcessProgress,
    processMessage, setProcessMessage,
    finalBlob, setFinalBlob,
    resetApp,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};