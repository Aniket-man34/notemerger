import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { PageTransition } from '../components/SharedComponents';
import { CheckSquare, Square, ToggleLeft, X, CheckCircle } from 'lucide-react';

export function PageSelectionPage() {
  const { pages, togglePageSelection, selectAll, deselectAll, invertSelection, setStep, addToast } = useApp();

  const selectedCount = pages.filter(p => p.selected).length;

  const handleContinue = () => {
    if (selectedCount === 0) {
      addToast('warning', 'Please select at least one page');
      return;
    }
    setStep(3);
  };

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto px-4 pb-12">
        {/* Header */}
        <motion.div
          className="text-center py-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">
            Select Pages to Include
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            {pages.length} pages extracted — click to toggle selection
          </p>
        </motion.div>

        {/* Toolbar */}
        <motion.div
          className="glass-card rounded-xl px-4 py-3 flex flex-wrap items-center gap-3 mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <button
            onClick={selectAll}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-primary-700 dark:text-primary-400 bg-primary-100 dark:bg-primary-500/10 hover:bg-primary-200 dark:hover:bg-primary-500/20 transition-colors"
          >
            <CheckSquare className="w-4 h-4" /> Select All
          </button>
          <button
            onClick={deselectAll}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <Square className="w-4 h-4" /> Deselect All
          </button>
          <button
            onClick={invertSelection}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-purple-700 dark:text-purple-400 bg-purple-100 dark:bg-purple-500/10 hover:bg-purple-200 dark:hover:bg-purple-500/20 transition-colors"
          >
            <ToggleLeft className="w-4 h-4" /> Invert
          </button>
          <div className="ml-auto">
            <span className={`text-sm font-semibold ${selectedCount > 0 ? 'text-success-600 dark:text-success-400' : 'text-red-500'}`}>
              {selectedCount} of {pages.length} selected
            </span>
          </div>
        </motion.div>

        {/* Page Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {pages.map((page, index) => (
            <motion.div
              key={page.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: Math.min(index * 0.03, 0.5), duration: 0.3 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => togglePageSelection(page.id)}
              className={`relative rounded-xl overflow-hidden cursor-pointer transition-all duration-200 ${
                page.selected
                  ? 'ring-2 ring-primary-500 shadow-lg shadow-primary-500/20'
                  : 'ring-1 ring-gray-200 dark:ring-gray-700 opacity-50'
              }`}
            >
              {/* Thumbnail */}
              <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <img
                  src={page.thumbnailUrl}
                  alt={`Page ${page.pageNumber}`}
                  className={`w-full h-full object-contain transition-all duration-200 ${
                    !page.selected ? 'grayscale' : ''
                  }`}
                  loading="lazy"
                />
              </div>

              {/* Selection indicator */}
              <div className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                page.selected
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-800/50 text-white'
              }`}>
                {page.selected ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <X className="w-4 h-4" />
                )}
              </div>

              {/* Label */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5">
                <p className="text-white text-xs font-medium truncate">
                  Page {page.pageNumber}
                </p>
                <p className="text-white/60 text-[10px] truncate">
                  {page.sourceFile}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Continue Button */}
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <motion.button
            onClick={handleContinue}
            disabled={selectedCount === 0}
            whileHover={selectedCount > 0 ? { scale: 1.02 } : {}}
            whileTap={selectedCount > 0 ? { scale: 0.98 } : {}}
            className={`px-8 py-3.5 rounded-xl font-semibold text-white text-base shadow-lg transition-all duration-300 ${
              selectedCount > 0
                ? 'bg-gradient-to-r from-primary-600 to-accent-600 hover:shadow-xl hover:shadow-primary-500/25 cursor-pointer'
                : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed shadow-none'
            }`}
          >
            Process {selectedCount} Page{selectedCount !== 1 ? 's' : ''} →
          </motion.button>
        </motion.div>
      </div>
    </PageTransition>
  );
}
