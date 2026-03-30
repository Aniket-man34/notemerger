import { AnimatePresence } from 'framer-motion';
import { AppProvider, useApp } from './context/AppContext';
import { StepBar, ThemeToggle, ToastContainer, AnimatedBackground } from './components/SharedComponents';
import { UploadPage } from './pages/UploadPage';
import { PageSelectionPage } from './pages/PageSelectionPage';
import { EnhancementPage } from './pages/EnhancementPage';
import { ProcessingPage } from './pages/ProcessingPage';

const faviconSrc = `${import.meta.env.BASE_URL}favicon.svg`;

function AppContent() {
  const { step, darkMode } = useApp();

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen text-gray-900 dark:text-gray-100 transition-colors duration-500">
        <AnimatedBackground />
        <ToastContainer />

        {/* Header */}
        <header className="sticky top-0 z-40 w-full">
          <div className="glass-card border-0 border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src={faviconSrc} alt="NoteMerger logo" className="w-8 h-8 rounded-lg shadow-sm" />
                <span className="text-lg font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent hidden sm:block">
                  NoteMerger
                </span>
              </div>
              <ThemeToggle />
            </div>
            <StepBar />
          </div>
        </header>

        {/* Main */}
        <main className="pt-4">
          <AnimatePresence mode="wait">
            {step === 1 && <UploadPage key="upload" />}
            {step === 2 && <PageSelectionPage key="select" />}
            {step === 3 && <EnhancementPage key="enhance" />}
            {step === 4 && <ProcessingPage key="process" />}
          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer className="text-center py-6 text-xs text-gray-400 dark:text-gray-600">
          NoteMerger — All processing happens locally in your browser. Your files never leave your device.
        </footer>
      </div>
    </div>
  );
}

export function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
