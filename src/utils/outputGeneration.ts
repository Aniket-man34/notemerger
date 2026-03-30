import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import type { PageImage, LayoutSettings, EnhancementSettings } from '../types';
import { composePage } from './imageEnhancement';

export interface GenerateOutputResult {
  blob: Blob;
  previewUrls: string[];
}

export async function generateOutput(
  selectedPages: PageImage[],
  layout: LayoutSettings,
  enhancement: EnhancementSettings,
  format: 'pdf' | 'png-zip',
  onProgress?: (message: string, progress: number) => void
): Promise<GenerateOutputResult> {
  const slidesPerPage = layout.rows * layout.cols;
  const totalOutputPages = Math.ceil(selectedPages.length / slidesPerPage);

  onProgress?.('Applying enhancements...', 5);

  // Group pages for composition
  const composedCanvases: HTMLCanvasElement[] = [];

  for (let i = 0; i < totalOutputPages; i++) {
    const start = i * slidesPerPage;
    const end = Math.min(start + slidesPerPage, selectedPages.length);
    const pageImages = selectedPages.slice(start, end);

    onProgress?.(
      `Composing layout for page ${i + 1}/${totalOutputPages}...`,
      10 + (i / totalOutputPages) * 50
    );

    const canvas = await composePage(
      pageImages.map(p => ({ blob: p.blob, width: p.width, height: p.height })),
      layout,
      enhancement,
      i
    );
    composedCanvases.push(canvas);
  }

  // Generate preview thumbnails from composed canvases (with enhancements baked in)
  onProgress?.('Generating previews...', 62);
  const previewUrls = composedCanvases.map(canvas => {
    const thumb = document.createElement('canvas');
    const maxDim = 800;
    const scale = Math.min(maxDim / canvas.width, maxDim / canvas.height, 1);
    thumb.width = Math.round(canvas.width * scale);
    thumb.height = Math.round(canvas.height * scale);
    const ctx = thumb.getContext('2d')!;
    ctx.drawImage(canvas, 0, 0, thumb.width, thumb.height);
    return thumb.toDataURL('image/jpeg', 0.85);
  });

  onProgress?.('Generating final document...', 70);

  let blob: Blob;
  if (format === 'pdf') {
    blob = await generatePDF(composedCanvases, onProgress);
  } else {
    blob = await generateZIP(composedCanvases, onProgress);
  }

  return { blob, previewUrls };
}

async function generatePDF(
  canvases: HTMLCanvasElement[],
  onProgress?: (message: string, progress: number) => void
): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();

  for (let i = 0; i < canvases.length; i++) {
    onProgress?.(`Adding page ${i + 1}/${canvases.length} to PDF...`, 70 + (i / canvases.length) * 25);

    const canvas = canvases[i];
    // Use JPEG for faster encoding when generating PDF
    const jpegData = await new Promise<Uint8Array>((resolve) => {
      canvas.toBlob((blob) => {
        blob!.arrayBuffer().then(ab => resolve(new Uint8Array(ab)));
      }, 'image/jpeg', 0.92);
    });

    const jpgImage = await pdfDoc.embedJpg(jpegData);
    const page = pdfDoc.addPage([canvas.width * 0.75, canvas.height * 0.75]);
    page.drawImage(jpgImage, {
      x: 0,
      y: 0,
      width: page.getWidth(),
      height: page.getHeight(),
    });
  }

  onProgress?.('Preparing download...', 95);
  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
}

async function generateZIP(
  canvases: HTMLCanvasElement[],
  onProgress?: (message: string, progress: number) => void
): Promise<Blob> {
  const zip = new JSZip();

  for (let i = 0; i < canvases.length; i++) {
    onProgress?.(`Adding page ${i + 1}/${canvases.length} to ZIP...`, 70 + (i / canvases.length) * 25);

    const blob = await new Promise<Blob>((resolve) => {
      canvases[i].toBlob((b) => resolve(b!), 'image/png');
    });
    zip.file(`page-${String(i + 1).padStart(3, '0')}.png`, blob);
  }

  onProgress?.('Preparing download...', 95);
  return await zip.generateAsync({ type: 'blob' });
}
