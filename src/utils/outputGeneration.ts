import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import type { PageImage, LayoutSettings, EnhancementSettings } from '../types';
import { composePage } from './imageEnhancement';

export interface GenerateOutputResult {
  blob: Blob;
  previewUrls: string[];
}

interface ProcessedPage {
  previewUrl: string;
  pdfData?: Uint8Array;
  zipBlob?: Blob;
  width: number;
  height: number;
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

  const processedPages: ProcessedPage[] = [];

  for (let i = 0; i < totalOutputPages; i++) {
    const start = i * slidesPerPage;
    const end = Math.min(start + slidesPerPage, selectedPages.length);
    const pageImages = selectedPages.slice(start, end);

    onProgress?.(
      `Processing page ${i + 1}/${totalOutputPages}...`,
      10 + (i / totalOutputPages) * 60
    );

    const canvas = await composePage(
      pageImages.map(p => ({ blob: p.blob, width: p.width, height: p.height })),
      layout,
      enhancement,
      i
    );

    // 1. Generate Preview
    const previewCanvas = document.createElement('canvas');
    const maxDim = 800;
    const scale = Math.min(maxDim / canvas.width, maxDim / canvas.height, 1);
    previewCanvas.width = Math.round(canvas.width * scale);
    previewCanvas.height = Math.round(canvas.height * scale);
    const ctx = previewCanvas.getContext('2d', { alpha: false })!;
    ctx.drawImage(canvas, 0, 0, previewCanvas.width, previewCanvas.height);
    const previewUrl = previewCanvas.toDataURL('image/jpeg', 0.85);

    // 2. Encode for Output
    let pdfData: Uint8Array | undefined;
    let zipBlob: Blob | undefined;

    if (format === 'pdf') {
      pdfData = await new Promise<Uint8Array>((resolve) => {
        canvas.toBlob((blob) => {
          blob!.arrayBuffer().then(ab => resolve(new Uint8Array(ab)));
        }, 'image/jpeg', 0.90);
      });
    } else {
      zipBlob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/png');
      });
    }

    processedPages.push({
      previewUrl,
      pdfData,
      zipBlob,
      width: canvas.width,
      height: canvas.height
    });

    // 3. CRITICAL MEMORY FIX: Destroy canvas contexts immediately to prevent browser crash
    canvas.width = 0;
    canvas.height = 0;
    previewCanvas.width = 0;
    previewCanvas.height = 0;
  }

  onProgress?.('Generating final document...', 75);

  let blob: Blob;
  if (format === 'pdf') {
    blob = await generatePDF(processedPages, onProgress);
  } else {
    blob = await generateZIP(processedPages, onProgress);
  }

  return { 
    blob, 
    previewUrls: processedPages.map(p => p.previewUrl) 
  };
}

async function generatePDF(
  pages: ProcessedPage[],
  onProgress?: (message: string, progress: number) => void
): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();

  for (let i = 0; i < pages.length; i++) {
    onProgress?.(`Merging PDF page ${i + 1}/${pages.length}...`, 75 + (i / pages.length) * 20);

    const pageData = pages[i];
    const jpgImage = await pdfDoc.embedJpg(pageData.pdfData!);
    
    const page = pdfDoc.addPage([pageData.width * 0.75, pageData.height * 0.75]);
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
  pages: ProcessedPage[],
  onProgress?: (message: string, progress: number) => void
): Promise<Blob> {
  const zip = new JSZip();

  for (let i = 0; i < pages.length; i++) {
    onProgress?.(`Zipping page ${i + 1}/${pages.length}...`, 75 + (i / pages.length) * 20);
    zip.file(`page-${String(i + 1).padStart(3, '0')}.png`, pages[i].zipBlob!);
  }

  onProgress?.('Preparing download...', 95);
  return await zip.generateAsync({ type: 'blob' });
}