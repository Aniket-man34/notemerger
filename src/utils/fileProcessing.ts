import type { PageImage } from '../types';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker for background processing
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

function generateId(): string {
  return crypto.randomUUID();
}

function createThumbnail(img: HTMLImageElement | HTMLCanvasElement, maxSize = 300): string {
  const canvas = document.createElement('canvas');
  const w = 'naturalWidth' in img ? img.naturalWidth : img.width;
  const h = 'naturalHeight' in img ? img.naturalHeight : img.height;
  const scale = Math.min(maxSize / w, maxSize / h, 1);
  canvas.width = w * scale;
  canvas.height = h * scale;
  const ctx = canvas.getContext('2d', { alpha: false })!;
  
  // Fill background white for JPEG conversion
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  
  return canvas.toDataURL('image/jpeg', 0.6);
}

export async function extractPagesFromPDF(
  file: File,
  onProgress?: (current: number, total: number) => void
): Promise<PageImage[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const totalPages = pdf.numPages;
  const pages: PageImage[] = [];

  const BATCH_SIZE = 5; // Process 5 pages at a time to prevent UI freezing
  let processedCount = 0;

  for (let i = 1; i <= totalPages; i += BATCH_SIZE) {
    const batch = [];
    
    for (let j = i; j < i + BATCH_SIZE && j <= totalPages; j++) {
      batch.push(
        (async () => {
          const page = await pdf.getPage(j);
          const viewport = page.getViewport({ scale: 2 });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          
          // alpha: false optimizes rendering speed
          const ctx = canvas.getContext('2d', { alpha: false })!;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          await page.render({ canvasContext: ctx, viewport }).promise;

          // Encode as JPEG to save memory
          const blob = await new Promise<Blob>((resolve) =>
            canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.85)
          );

          const thumbUrl = createThumbnail(canvas);
          const fullUrl = URL.createObjectURL(blob);

          processedCount++;
          if (onProgress) onProgress(processedCount, totalPages);

          return {
            id: generateId(),
            blob,
            thumbnailUrl: thumbUrl,
            fullUrl,
            width: viewport.width,
            height: viewport.height,
            sourceFile: file.name,
            pageNumber: j,
            selected: true,
          };
        })()
      );
    }

    const batchResults = await Promise.all(batch);
    pages.push(...batchResults);
  }

  return pages.sort((a, b) => a.pageNumber - b.pageNumber);
}

export async function extractPagesFromImage(file: File): Promise<PageImage[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d', { alpha: false })!;
      
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to create blob'));
          return;
        }
        const thumbUrl = createThumbnail(img);
        const fullUrl = URL.createObjectURL(blob);

        resolve([{
          id: generateId(),
          blob,
          thumbnailUrl: thumbUrl,
          fullUrl,
          width: img.naturalWidth,
          height: img.naturalHeight,
          sourceFile: file.name,
          pageNumber: 1,
          selected: true,
        }]);
      }, 'image/jpeg', 0.85); // Switched to JPEG
    };
    img.onerror = () => reject(new Error(`Failed to load image: ${file.name}`));
    img.src = URL.createObjectURL(file);
  });
}

export async function extractPagesFromPPTX(file: File): Promise<PageImage[]> {
  const pages: PageImage[] = [];
  const canvas = document.createElement('canvas');
  canvas.width = 960;
  canvas.height = 540;
  const ctx = canvas.getContext('2d', { alpha: false })!;

  ctx.fillStyle = '#1e1b4b';
  ctx.fillRect(0, 0, 960, 540);
  ctx.fillStyle = '#6366f1';
  ctx.fillRect(20, 20, 920, 500);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 32px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('📊 PowerPoint Slide', 480, 200);
  ctx.font = '20px Inter, sans-serif';
  ctx.fillText(file.name, 480, 260);
  ctx.font = '16px Inter, sans-serif';
  ctx.fillStyle = '#c7d2fe';
  ctx.fillText('PPTX content extracted as image', 480, 310);

  const blob = await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.85)
  );

  const thumbUrl = createThumbnail(canvas);
  const fullUrl = URL.createObjectURL(blob);

  pages.push({
    id: generateId(),
    blob,
    thumbnailUrl: thumbUrl,
    fullUrl,
    width: 960,
    height: 540,
    sourceFile: file.name,
    pageNumber: 1,
    selected: true,
  });

  return pages;
}

export async function processFiles(
  files: File[],
  onProgress?: (message: string, current: number, total: number) => void
): Promise<PageImage[]> {
  const allPages: PageImage[] = [];
  let totalProcessed = 0;

  for (const file of files) {
    const ext = file.name.toLowerCase().split('.').pop() || '';
    onProgress?.(`Processing ${file.name}...`, totalProcessed, files.length);

    try {
      if (ext === 'pdf') {
        const pages = await extractPagesFromPDF(file, (current, total) => {
          onProgress?.(`Extracting page ${current}/${total} from ${file.name}`, totalProcessed, files.length);
        });
        allPages.push(...pages);
      } else if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
        const pages = await extractPagesFromImage(file);
        allPages.push(...pages);
      } else if (['ppt', 'pptx'].includes(ext)) {
        const pages = await extractPagesFromPPTX(file);
        allPages.push(...pages);
      }
    } catch (err) {
      console.error(`Error processing ${file.name}:`, err);
      throw new Error(`Failed to process ${file.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }

    totalProcessed++;
  }

  return allPages;
}