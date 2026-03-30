import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { PageTransition } from '../components/SharedComponents';
import {
  Contrast, Eraser, Palette, CircleDot, Stamp, ZoomIn,
  AlignVerticalSpaceAround, AlignHorizontalSpaceAround,
  Hash, ChevronRight, X, Settings2, Wand2, ChevronLeft
} from 'lucide-react';
import type { LayoutSettings } from '../types';
import { applyEnhancements, hasAnyEnhancement } from '../utils/imageEnhancement';

const PAGE_SIZES: { value: LayoutSettings['pageSize']; label: string }[] = [
  { value: 'original', label: 'Original Size' },
  { value: 'a4', label: 'A4 (210×297mm)' },
  { value: 'letter', label: 'Letter (8.5×11")' },
  { value: 'legal', label: 'Legal (8.5×14")' },
  { value: 'a3', label: 'A3 (297×420mm)' },
];

export function EnhancementPage() {
  const {
    layoutSettings, setLayoutSettings,
    enhancementSettings, setEnhancementSettings,
    pages, setStep, addToast
  } = useApp();

  const [activeTab, setActiveTab] = useState<'layout' | 'enhance'>('layout');
  const [showLogoModal, setShowLogoModal] = useState(false);

  const selectedCount = pages.filter(p => p.selected).length;
  const slidesPerPage = layoutSettings.rows * layoutSettings.cols;

  const handleContinue = () => {
    if (selectedCount === 0) {
      addToast('warning', 'No pages selected');
      return;
    }
    setStep(4);
  };

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto px-4 pb-12">
        <motion.div
          className="text-center py-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">
            Enhancement & Layout
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Customize your output with enhancements and layout options
          </p>
        </motion.div>

        {/* Mobile Tabs */}
        <div className="md:hidden flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('layout')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'layout'
                ? 'bg-primary-500 text-white shadow-lg'
                : 'glass-card text-gray-600 dark:text-gray-400'
            }`}
          >
            <Settings2 className="w-4 h-4 inline mr-1.5" /> Layout
          </button>
          <button
            onClick={() => setActiveTab('enhance')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'enhance'
                ? 'bg-primary-500 text-white shadow-lg'
                : 'glass-card text-gray-600 dark:text-gray-400'
            }`}
          >
            <Wand2 className="w-4 h-4 inline mr-1.5" /> Enhance
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Layout Section */}
          <motion.div
            className={`glass-card rounded-2xl p-5 ${activeTab !== 'layout' ? 'hidden md:block' : ''}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h3 className="flex items-center gap-2 text-lg font-bold text-gray-800 dark:text-gray-100 mb-5">
              <Settings2 className="w-5 h-5 text-primary-500" /> Layout Options
            </h3>

            {/* Page Size */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Document Size</label>
              <select
                value={layoutSettings.pageSize}
                onChange={(e) => setLayoutSettings({ pageSize: e.target.value as LayoutSettings['pageSize'] })}
                className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              >
                {PAGE_SIZES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Orientation */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Orientation</label>
              <div className="flex gap-2">
                {(['portrait', 'landscape'] as const).map(o => (
                  <button
                    key={o}
                    onClick={() => setLayoutSettings({ orientation: o })}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      layoutSettings.orientation === o
                        ? 'bg-primary-500 text-white shadow-md'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {o === 'portrait' ? (
                      <AlignVerticalSpaceAround className="w-4 h-4" />
                    ) : (
                      <AlignHorizontalSpaceAround className="w-4 h-4" />
                    )}
                    {o.charAt(0).toUpperCase() + o.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Slides Per Page</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Rows</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map(n => (
                      <button
                        key={n}
                        onClick={() => setLayoutSettings({ rows: n })}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                          layoutSettings.rows === n
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Columns</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map(n => (
                      <button
                        key={n}
                        onClick={() => setLayoutSettings({ cols: n })}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                          layoutSettings.cols === n
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-xs text-primary-600 dark:text-primary-400 mt-2 font-medium">
                Layout: {layoutSettings.rows}×{layoutSettings.cols} = {slidesPerPage} slide{slidesPerPage > 1 ? 's' : ''} per page
              </p>
            </div>

            {/* Page Numbers */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Hash className="w-4 h-4" /> Page Numbers
                </label>
                <button
                  onClick={() => setLayoutSettings({ pageNumbers: !layoutSettings.pageNumbers })}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    layoutSettings.pageNumbers ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <motion.div
                    className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md"
                    animate={{ left: layoutSettings.pageNumbers ? '22px' : '2px' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

              <AnimatePresence>
                {layoutSettings.pageNumbers && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 overflow-hidden"
                  >
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Position</label>
                      <div className="grid grid-cols-3 gap-1">
                        {(['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'] as const).map(pos => (
                          <button
                            key={pos}
                            onClick={() => setLayoutSettings({ pageNumberPosition: pos })}
                            className={`py-1.5 px-2 rounded-lg text-[10px] font-medium transition-all ${
                              layoutSettings.pageNumberPosition === pos
                                ? 'bg-primary-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            {pos.replace('-', ' ')}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Size</label>
                        <select
                          value={layoutSettings.pageNumberSize}
                          onChange={(e) => setLayoutSettings({ pageNumberSize: e.target.value as 'small' | 'medium' | 'large' })}
                          className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm outline-none text-gray-800 dark:text-gray-200"
                        >
                          <option value="small">Small</option>
                          <option value="medium">Medium</option>
                          <option value="large">Large</option>
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Start From</label>
                        <input
                          type="number"
                          min={1}
                          value={layoutSettings.startingNumber}
                          onChange={(e) => setLayoutSettings({ startingNumber: parseInt(e.target.value) || 1 })}
                          className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm outline-none text-gray-800 dark:text-gray-200"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Live Preview */}
            <LayoutPreview layout={layoutSettings} selectedCount={selectedCount} />
          </motion.div>

          {/* Enhancement Section */}
          <motion.div
            className={`glass-card rounded-2xl p-5 ${activeTab !== 'enhance' ? 'hidden md:block' : ''}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="flex items-center gap-2 text-lg font-bold text-gray-800 dark:text-gray-100 mb-5">
              <Wand2 className="w-5 h-5 text-accent-500" /> Enhancement Options
            </h3>

            <div className="space-y-3">
              <EnhanceToggle
                icon={<Contrast className="w-5 h-5" />}
                title="Invert Colors"
                desc="Convert dark backgrounds to light"
                active={enhancementSettings.invert}
                onToggle={() => setEnhancementSettings({ invert: !enhancementSettings.invert })}
                color="from-indigo-500 to-purple-500"
              />
              <EnhanceToggle
                icon={<Eraser className="w-5 h-5" />}
                title="Clear Background"
                desc="Remove noise and shadows"
                active={enhancementSettings.clearBackground}
                onToggle={() => setEnhancementSettings({ clearBackground: !enhancementSettings.clearBackground })}
                color="from-blue-500 to-cyan-500"
              />
              <EnhanceToggle
                icon={<Palette className="w-5 h-5" />}
                title="Grayscale"
                desc="Convert to grayscale"
                active={enhancementSettings.grayscale}
                onToggle={() => setEnhancementSettings({ grayscale: !enhancementSettings.grayscale })}
                color="from-gray-500 to-gray-700"
              />
              <EnhanceToggle
                icon={<CircleDot className="w-5 h-5" />}
                title="Black & White"
                desc="Pure B&W with thresholding"
                active={enhancementSettings.blackAndWhite}
                onToggle={() => setEnhancementSettings({ blackAndWhite: !enhancementSettings.blackAndWhite })}
                color="from-gray-800 to-black"
              />

              {enhancementSettings.blackAndWhite && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="pl-4 ml-2 border-l-2 border-gray-200 dark:border-gray-700"
                >
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Threshold: {enhancementSettings.bwThreshold}
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={255}
                    value={enhancementSettings.bwThreshold}
                    onChange={(e) => setEnhancementSettings({ bwThreshold: parseInt(e.target.value) })}
                    className="w-full accent-primary-500"
                  />
                </motion.div>
              )}

              {/* Logo Removal */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setShowLogoModal(true)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                  enhancementSettings.logoRemoval
                    ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30'
                    : 'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 hover:border-primary-300'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  enhancementSettings.logoRemoval
                    ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                }`}>
                  <Stamp className="w-5 h-5" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Remove Logo / Watermark</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {enhancementSettings.logoRemoval ? '✅ Region defined — tap to adjust' : 'Draw area to remove'}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </motion.button>

              {/* DPI */}
              <div className="mt-4">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <ZoomIn className="w-4 h-4" /> Output DPI
                </label>
                <select
                  value={enhancementSettings.dpi}
                  onChange={(e) => setEnhancementSettings({ dpi: parseInt(e.target.value) })}
                  className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  {[72, 90, 150, 300, 600].map(d => (
                    <option key={d} value={d}>{d} DPI</option>
                  ))}
                </select>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                  Higher DPI = better quality but larger file size
                </p>
              </div>
            </div>

            {/* Live Enhancement Preview */}
            <EnhancementPreview />
          </motion.div>
        </div>

        {/* Process Button */}
        <motion.div className="mt-8 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <motion.button
            onClick={handleContinue}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-8 py-3.5 rounded-xl font-semibold text-white text-base bg-gradient-to-r from-primary-600 to-accent-600 shadow-lg hover:shadow-xl hover:shadow-primary-500/25 transition-all cursor-pointer"
          >
            Process File →
          </motion.button>
        </motion.div>

        {/* Logo Removal Modal */}
        <AnimatePresence>
          {showLogoModal && (
            <LogoRemovalModal onClose={() => setShowLogoModal(false)} />
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}

/* ── Enhancement Toggle Button ─────────────────────────────── */
function EnhanceToggle({
  icon, title, desc, active, onToggle, color
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  active: boolean;
  onToggle: () => void;
  color: string;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onToggle}
      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
        active
          ? `bg-gradient-to-r ${color.replace('from-', 'from-').replace('to-', 'to-')}/10 border border-primary-500/30`
          : 'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 hover:border-primary-300'
      }`}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
        active ? `bg-gradient-to-br ${color} text-white` : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
      }`}>
        {icon}
      </div>
      <div className="text-left flex-1">
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
      </div>
      <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
        active ? 'bg-primary-500 text-white' : 'bg-gray-200 dark:bg-gray-700'
      }`}>
        {active && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}>✓</motion.span>}
      </div>
    </motion.button>
  );
}

/* ── Layout Preview (SVG schematic) ────────────────────────── */
function LayoutPreview({ layout, selectedCount }: { layout: LayoutSettings; selectedCount: number }) {
  const slidesPerPage = layout.rows * layout.cols;
  const isLandscape = layout.orientation === 'landscape';
  const pageW = isLandscape ? 200 : 150;
  const pageH = isLandscape ? 150 : 200;

  const cells = useMemo(() => {
    const arr = [];
    const margin = 8;
    const gap = 4;
    const cellW = (pageW - margin * 2 - gap * (layout.cols - 1)) / layout.cols;
    const cellH = (pageH - margin * 2 - gap * (layout.rows - 1)) / layout.rows;
    for (let r = 0; r < layout.rows; r++) {
      for (let c = 0; c < layout.cols; c++) {
        arr.push({
          x: margin + c * (cellW + gap),
          y: margin + r * (cellH + gap),
          w: cellW,
          h: cellH,
        });
      }
    }
    return arr;
  }, [layout.rows, layout.cols, pageW, pageH]);

  const pnPos = useMemo(() => {
    if (!layout.pageNumbers) return null;
    const pos = layout.pageNumberPosition;
    let x = pageW / 2;
    let y = pageH - 8;
    let anchor: 'middle' | 'start' | 'end' = 'middle';
    if (pos.includes('left')) { x = 8; anchor = 'start'; }
    if (pos.includes('right')) { x = pageW - 8; anchor = 'end'; }
    if (pos.includes('top')) { y = 14; }
    return { x, y, anchor };
  }, [layout.pageNumbers, layout.pageNumberPosition, pageW, pageH]);

  return (
    <div className="mt-4">
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        🔴 Live Preview
      </label>
      <div className="flex justify-center p-4 rounded-xl bg-gray-100 dark:bg-gray-800/50">
        <motion.svg
          width={pageW}
          height={pageH}
          viewBox={`0 0 ${pageW} ${pageH}`}
          className="drop-shadow-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <rect x={0} y={0} width={pageW} height={pageH} rx={4} fill="white" stroke="#d1d5db" strokeWidth={1} />
          {cells.map((cell, i) => (
            <motion.rect
              key={`${layout.rows}-${layout.cols}-${i}`}
              x={cell.x}
              y={cell.y}
              width={cell.w}
              height={cell.h}
              rx={2}
              fill={i < selectedCount ? '#e0e7ff' : '#f3f4f6'}
              stroke={i < selectedCount ? '#6366f1' : '#d1d5db'}
              strokeWidth={0.5}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
            />
          ))}
          {pnPos && (
            <text
              x={pnPos.x}
              y={pnPos.y}
              textAnchor={pnPos.anchor}
              fontSize={layout.pageNumberSize === 'small' ? 8 : layout.pageNumberSize === 'medium' ? 10 : 13}
              fill="#6b7280"
              fontFamily="Inter, sans-serif"
            >
              {layout.startingNumber}
            </text>
          )}
        </motion.svg>
      </div>
      <p className="text-center text-[11px] text-gray-500 dark:text-gray-400 mt-2">
        {slidesPerPage} slide{slidesPerPage > 1 ? 's' : ''}/page • {Math.ceil(selectedCount / slidesPerPage)} output page{Math.ceil(selectedCount / slidesPerPage) !== 1 ? 's' : ''}
      </p>
    </div>
  );
}

/* ── Live Enhancement Preview ──────────────────────────────── */
function EnhancementPreview() {
  const { pages, enhancementSettings } = useApp();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const selectedPages = pages.filter(p => p.selected);
  const firstPage = selectedPages[0];

  useEffect(() => {
    if (!firstPage || !canvasRef.current) return;
    let cancelled = false;
    const canvas = canvasRef.current;
    const img = new Image();

    img.onload = () => {
      if (cancelled) return;
      const maxSize = 220;
      const scale = Math.min(maxSize / img.naturalWidth, maxSize / img.naturalHeight, 1);
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      if (hasAnyEnhancement(enhancementSettings)) {
        const previewSettings = { ...enhancementSettings };
        if (previewSettings.logoRemoval && firstPage) {
          const sx = canvas.width / firstPage.width;
          const sy = canvas.height / firstPage.height;
          previewSettings.logoRemoval = {
            ...previewSettings.logoRemoval,
            x: previewSettings.logoRemoval.x * sx,
            y: previewSettings.logoRemoval.y * sy,
            width: previewSettings.logoRemoval.width * sx,
            height: previewSettings.logoRemoval.height * sy,
          };
        }
        applyEnhancements(canvas, previewSettings);
      }
    };
    img.src = firstPage.fullUrl;

    return () => {
      cancelled = true;
      img.onload = null;
    };
  }, [firstPage, enhancementSettings]);

  if (!firstPage) return null;

  return (
    <div className="mt-5">
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        ✨ Enhancement Preview
      </label>
      <div className="flex justify-center p-3 rounded-xl bg-gray-100 dark:bg-gray-800/50">
        <canvas
          ref={canvasRef}
          className="rounded-lg shadow-md max-w-full"
          style={{ maxHeight: '220px' }}
        />
      </div>
      <p className="text-center text-[11px] text-gray-500 dark:text-gray-400 mt-1">
        First page with current enhancements
      </p>
    </div>
  );
}

/* ── Logo Removal Modal (Interactive Drag, Resize, Move) ───────── */
const HANDLE_SIZE = 10;
type HandleType = 'tl' | 't' | 'tr' | 'l' | 'r' | 'bl' | 'b' | 'br';

function LogoRemovalModal({ onClose }: { onClose: () => void }) {
  const { enhancementSettings, setEnhancementSettings, pages } = useApp();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [shape, setShape] = useState<'rectangle' | 'circle'>(
    enhancementSettings.logoRemoval?.shape || 'rectangle'
  );
  const [applyTo, setApplyTo] = useState<'all' | 'current' | 'custom'>(
    enhancementSettings.logoRemoval?.applyTo || 'all'
  );
  const [previewIdx, setPreviewIdx] = useState(0);

  // Canvas display size (set when image loads)
  const [canvasSize, setCanvasSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const loadedImgRef = useRef<HTMLImageElement | null>(null);

  // Drag state
  const [dragMode, setDragMode] = useState<'idle' | 'drawing' | 'resizing' | 'moving'>('idle');
  const [activeHandle, setActiveHandle] = useState<HandleType | null>(null);
  const [hoverCursor, setHoverCursor] = useState('crosshair');

  // Move offsets
  const dragStartRef = useRef<{ cursor: { x: number; y: number }; selStart: { x: number; y: number }; selEnd: { x: number; y: number } } | null>(null);

  const [selStart, setSelStart] = useState<{ x: number; y: number } | null>(null);
  const [selEnd, setSelEnd] = useState<{ x: number; y: number } | null>(null);
  const hasRestoredRef = useRef(false);

  const selectedPages = pages.filter(p => p.selected);
  const currentPage = selectedPages[previewIdx];

  /* ---------- load image when page changes ---------- */
  useEffect(() => {
    if (!currentPage) return;
    const img = new Image();
    img.onload = () => {
      loadedImgRef.current = img;
      const maxW = 460;
      const maxH = 320;
      const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1);
      setCanvasSize({
        w: Math.round(img.naturalWidth * scale),
        h: Math.round(img.naturalHeight * scale),
      });
    };
    img.src = currentPage.fullUrl;
  }, [currentPage]);

  /* ---------- restore existing selection once ---------- */
  useEffect(() => {
    if (hasRestoredRef.current || !enhancementSettings.logoRemoval || !currentPage || canvasSize.w === 0) return;
    hasRestoredRef.current = true;
    const lr = enhancementSettings.logoRemoval;
    const sx = canvasSize.w / currentPage.width;
    const sy = canvasSize.h / currentPage.height;
    setSelStart({ x: lr.x * sx, y: lr.y * sy });
    setSelEnd({ x: (lr.x + lr.width) * sx, y: (lr.y + lr.height) * sy });
  }, [canvasSize, currentPage, enhancementSettings.logoRemoval]);

  /* ---------- get handles coordinates ---------- */
  const getHandlesPos = (x: number, y: number, w: number, h: number) => ({
    tl: { x, y, cursor: 'nwse-resize' },
    t: { x: x + w / 2, y, cursor: 'ns-resize' },
    tr: { x: x + w, y, cursor: 'nesw-resize' },
    l: { x, y: y + h / 2, cursor: 'ew-resize' },
    r: { x: x + w, y: y + h / 2, cursor: 'ew-resize' },
    bl: { x, y: y + h, cursor: 'nesw-resize' },
    b: { x: x + w / 2, y: y + h, cursor: 'ns-resize' },
    br: { x: x + w, y: y + h, cursor: 'nwse-resize' },
  });

  const getHitRegion = (pos: { x: number; y: number }) => {
    if (!selStart || !selEnd) return null;
    const x = Math.min(selStart.x, selEnd.x);
    const y = Math.min(selStart.y, selEnd.y);
    const w = Math.abs(selEnd.x - selStart.x);
    const h = Math.abs(selEnd.y - selStart.y);

    if (w <= 5 || h <= 5) return null;

    // Check handles first
    const handles = getHandlesPos(x, y, w, h);
    for (const [key, handle] of Object.entries(handles)) {
      if (Math.abs(pos.x - handle.x) <= HANDLE_SIZE && Math.abs(pos.y - handle.y) <= HANDLE_SIZE) {
        return { type: 'handle', key: key as HandleType, cursor: handle.cursor };
      }
    }

    // Check inside shape for moving
    if (pos.x >= x && pos.x <= x + w && pos.y >= y && pos.y <= y + h) {
      return { type: 'inside', cursor: 'move' };
    }

    return null;
  };

  /* ---------- draw canvas ---------- */
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = loadedImgRef.current;
    if (!canvas || !img || canvasSize.w === 0) return;

    canvas.width = canvasSize.w;
    canvas.height = canvasSize.h;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, canvasSize.w, canvasSize.h);

    if (selStart && selEnd) {
      const x = Math.min(selStart.x, selEnd.x);
      const y = Math.min(selStart.y, selEnd.y);
      const w = Math.abs(selEnd.x - selStart.x);
      const h = Math.abs(selEnd.y - selStart.y);

      if (w > 2 && h > 2) {
        // Dim the whole image
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.fillRect(0, 0, canvasSize.w, canvasSize.h);

        // Cut out the selected region
        ctx.save();
        ctx.beginPath();
        if (shape === 'rectangle') {
          ctx.rect(x, y, w, h);
        } else {
          ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
        }
        ctx.clip();
        ctx.drawImage(img, 0, 0, canvasSize.w, canvasSize.h);
        ctx.restore();

        // Draw border
        ctx.setLineDash([6, 4]);
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ef4444';
        if (shape === 'rectangle') {
          ctx.strokeRect(x, y, w, h);
        } else {
          ctx.beginPath();
          ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.setLineDash([]);

        // Draw Resize Handles
        const handles = getHandlesPos(x, y, w, h);
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 1.5;
        Object.values(handles).forEach(h => {
          ctx.beginPath();
          ctx.rect(h.x - HANDLE_SIZE / 2, h.y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
          ctx.fill();
          ctx.stroke();
        });
      }
    }
  }, [canvasSize, selStart, selEnd, shape]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  /* ---------- pointer handlers ---------- */
  const getCanvasPos = (e: React.PointerEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(canvasSize.w, (e.clientX - rect.left) * (canvasSize.w / rect.width))),
      y: Math.max(0, Math.min(canvasSize.h, (e.clientY - rect.top) * (canvasSize.h / rect.height))),
    };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    const pos = getCanvasPos(e);
    if (!pos) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const hit = getHitRegion(pos);
    
    if (hit?.type === 'handle') {
      setDragMode('resizing');
      setActiveHandle(hit.key!);
    } else if (hit?.type === 'inside') {
      setDragMode('moving');
      dragStartRef.current = { cursor: pos, selStart: { ...selStart! }, selEnd: { ...selEnd! } };
    } else {
      setDragMode('drawing');
      setActiveHandle(null);
      setSelStart(pos);
      setSelEnd(pos);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const pos = getCanvasPos(e);
    if (!pos) return;

    if (dragMode === 'idle') {
      const hit = getHitRegion(pos);
      setHoverCursor(hit ? hit.cursor : 'crosshair');
      return;
    }

    if (dragMode === 'drawing') {
      setSelEnd(pos);
    } else if (dragMode === 'resizing' && activeHandle && selStart && selEnd) {
      const minSize = 10;
      let newStartX = selStart.x;
      let newStartY = selStart.y;
      let newEndX = selEnd.x;
      let newEndY = selEnd.y;

      if (activeHandle.includes('l')) newStartX = Math.min(pos.x, newEndX - minSize);
      if (activeHandle.includes('r')) newEndX = Math.max(pos.x, newStartX + minSize);
      if (activeHandle.includes('t')) newStartY = Math.min(pos.y, newEndY - minSize);
      if (activeHandle.includes('b')) newEndY = Math.max(pos.y, newStartY + minSize);

      setSelStart({ x: newStartX, y: newStartY });
      setSelEnd({ x: newEndX, y: newEndY });
    } else if (dragMode === 'moving' && dragStartRef.current) {
      const dx = pos.x - dragStartRef.current.cursor.x;
      const dy = pos.y - dragStartRef.current.cursor.y;

      let newStartX = dragStartRef.current.selStart.x + dx;
      let newStartY = dragStartRef.current.selStart.y + dy;
      let newEndX = dragStartRef.current.selEnd.x + dx;
      let newEndY = dragStartRef.current.selEnd.y + dy;

      // Keep inside canvas bounds
      const minX = Math.min(newStartX, newEndX);
      const maxX = Math.max(newStartX, newEndX);
      const minY = Math.min(newStartY, newEndY);
      const maxY = Math.max(newStartY, newEndY);

      if (minX < 0) { newStartX -= minX; newEndX -= minX; }
      if (minY < 0) { newStartY -= minY; newEndY -= minY; }
      if (maxX > canvasSize.w) { newStartX -= (maxX - canvasSize.w); newEndX -= (maxX - canvasSize.w); }
      if (maxY > canvasSize.h) { newStartY -= (maxY - canvasSize.h); newEndY -= (maxY - canvasSize.h); }

      setSelStart({ x: newStartX, y: newStartY });
      setSelEnd({ x: newEndX, y: newEndY });
    }
  };

  const handlePointerUp = () => {
    // If the user just clicked without dragging, clear the selection
    if (dragMode === 'drawing' && selStart && selEnd) {
      const w = Math.abs(selEnd.x - selStart.x);
      const h = Math.abs(selEnd.y - selStart.y);
      if (w < 5 && h < 5) {
        setSelStart(null);
        setSelEnd(null);
      }
    }

    setDragMode('idle');
    setActiveHandle(null);
    dragStartRef.current = null;

    if (selStart && selEnd) {
      const minX = Math.min(selStart.x, selEnd.x);
      const maxX = Math.max(selStart.x, selEnd.x);
      const minY = Math.min(selStart.y, selEnd.y);
      const maxY = Math.max(selStart.y, selEnd.y);
      setSelStart({ x: minX, y: minY });
      setSelEnd({ x: maxX, y: maxY });
    }
  };

  // Allow pressing ESC key to cancel/clear the selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelStart(null);
        setSelEnd(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  /* ---------- apply / clear / cancel ---------- */
  const selectionValid =
    selStart && selEnd && Math.abs(selEnd.x - selStart.x) > 3 && Math.abs(selEnd.y - selStart.y) > 3;

  const handleApply = () => {
    if (!selStart || !selEnd || !currentPage || !selectionValid) return;
    const x = Math.min(selStart.x, selEnd.x);
    const y = Math.min(selStart.y, selEnd.y);
    const w = Math.abs(selEnd.x - selStart.x);
    const h = Math.abs(selEnd.y - selStart.y);

    const sx = currentPage.width / canvasSize.w;
    const sy = currentPage.height / canvasSize.h;

    setEnhancementSettings({
      logoRemoval: {
        shape, x: x * sx, y: y * sy, width: w * sx, height: h * sy, applyTo, customRange: '',
      },
    });
    onClose();
  };

  const handleClearAction = () => {
    if (selStart && selEnd) {
      // Just clear the current shape to try again
      setSelStart(null);
      setSelEnd(null);
    } else {
      // Remove the effect entirely and close
      setEnhancementSettings({ logoRemoval: null });
      onClose();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-900 rounded-2xl p-5 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Remove Logo / Watermark</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Click & drag to draw. Drag edges to resize. Drag center to move. Tap 'Clear Selection' to restart.
        </p>

        {currentPage && canvasSize.w > 0 && (
          <div className="relative mb-4 flex justify-center rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
            <canvas
              ref={canvasRef}
              style={{ width: canvasSize.w, height: canvasSize.h, touchAction: 'none', cursor: hoverCursor }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="select-none"
            />
          </div>
        )}

        {selectedPages.length > 1 && (
          <div className="flex items-center justify-center gap-2 mb-4">
            <button
              onClick={() => setPreviewIdx((p) => Math.max(0, p - 1))}
              disabled={previewIdx === 0}
              className="p-1 rounded-lg bg-gray-100 dark:bg-gray-800 disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
              Page {previewIdx + 1} / {selectedPages.length}
            </span>
            <button
              onClick={() => setPreviewIdx((p) => Math.min(selectedPages.length - 1, p + 1))}
              disabled={previewIdx >= selectedPages.length - 1}
              className="p-1 rounded-lg bg-gray-100 dark:bg-gray-800 disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Shape</label>
            <div className="flex gap-2">
              {(['rectangle', 'circle'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setShape(s)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                    shape === s
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Apply To</label>
            <select
              value={applyTo}
              onChange={(e) => setApplyTo(e.target.value as 'all' | 'current' | 'custom')}
              className="w-full px-2 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs outline-none text-gray-800 dark:text-gray-200"
            >
              <option value="all">All Pages</option>
              <option value="current">Current Page</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
        </div>

        {selectionValid && (
          <p className="text-xs text-success-600 dark:text-success-400 mb-3 font-medium">
            ✅ Region selected — ready to apply
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleClearAction}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {selStart && selEnd ? 'Clear Selection' : 'Cancel'}
          </button>
          <button
            onClick={handleApply}
            disabled={!selectionValid}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              selectionValid
                ? 'bg-primary-500 text-white hover:bg-primary-600 cursor-pointer'
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            Apply Selection
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}