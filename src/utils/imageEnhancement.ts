import type { EnhancementSettings, LayoutSettings, LogoRemovalSettings } from '../types';

/** Returns true if any enhancement effect is actually enabled */
export function hasAnyEnhancement(settings: EnhancementSettings): boolean {
  return (
    settings.invert ||
    settings.clearBackground ||
    settings.grayscale ||
    settings.blackAndWhite ||
    settings.logoRemoval !== null
  );
}

export function applyEnhancements(
  canvas: HTMLCanvasElement,
  settings: EnhancementSettings
): HTMLCanvasElement {
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  if (settings.invert) {
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255 - data[i];
      data[i + 1] = 255 - data[i + 1];
      data[i + 2] = 255 - data[i + 2];
    }
  }

  if (settings.clearBackground) {
    const w = canvas.width;
    const h = canvas.height;
    const copy = new Uint8ClampedArray(data);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = (y * w + x) * 4;
        for (let c = 0; c < 3; c++) {
          const sum =
            copy[((y - 1) * w + x) * 4 + c] +
            copy[((y + 1) * w + x) * 4 + c] +
            copy[(y * w + x - 1) * 4 + c] +
            copy[(y * w + x + 1) * 4 + c] +
            copy[idx + c];
          data[idx + c] = Math.round(sum / 5);
        }
      }
    }
    for (let i = 0; i < data.length; i += 4) {
      for (let c = 0; c < 3; c++) {
        const val = data[i + c];
        data[i + c] = Math.min(255, Math.max(0, ((val - 128) * 1.3) + 128));
      }
    }
  }

  if (settings.grayscale) {
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      data[i] = data[i + 1] = data[i + 2] = gray;
    }
  }

  if (settings.blackAndWhite) {
    const threshold = settings.bwThreshold;
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      const bw = gray > threshold ? 255 : 0;
      data[i] = data[i + 1] = data[i + 2] = bw;
    }
  }

  if (settings.logoRemoval) {
    applyLogoRemoval(data, canvas.width, canvas.height, settings.logoRemoval);
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

function applyLogoRemoval(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  logo: LogoRemovalSettings
) {
  const x1 = Math.max(0, Math.round(logo.x));
  const y1 = Math.max(0, Math.round(logo.y));
  const x2 = Math.min(width, Math.round(logo.x + logo.width));
  const y2 = Math.min(height, Math.round(logo.y + logo.height));

  if (logo.shape === 'rectangle') {
    for (let y = y1; y < y2; y++) {
      for (let x = x1; x < x2; x++) {
        const idx = (y * width + x) * 4;
        data[idx] = 255;
        data[idx + 1] = 255;
        data[idx + 2] = 255;
        data[idx + 3] = 255;
      }
    }
  } else {
    const cx = logo.x + logo.width / 2;
    const cy = logo.y + logo.height / 2;
    const rx = logo.width / 2;
    const ry = logo.height / 2;
    for (let y = y1; y < y2; y++) {
      for (let x = x1; x < x2; x++) {
        const dx = (x - cx) / rx;
        const dy = (y - cy) / ry;
        if (dx * dx + dy * dy <= 1) {
          const idx = (y * width + x) * 4;
          data[idx] = 255;
          data[idx + 1] = 255;
          data[idx + 2] = 255;
          data[idx + 3] = 255;
        }
      }
    }
  }
}

export function getPageDimensions(pageSize: LayoutSettings['pageSize'], orientation: LayoutSettings['orientation'], dpi: number) {
  const sizes: Record<string, [number, number]> = {
    a4: [210, 297],
    letter: [215.9, 279.4],
    legal: [215.9, 355.6],
    a3: [297, 420],
    original: [210, 297],
  };

  const [w, h] = sizes[pageSize] || sizes.a4;
  const pxPerMm = dpi / 25.4;
  let pw = Math.round(w * pxPerMm);
  let ph = Math.round(h * pxPerMm);

  if (orientation === 'landscape') {
    [pw, ph] = [ph, pw];
  }

  return { width: pw, height: ph };
}

export async function composePage(
  images: { blob: Blob; width: number; height: number }[],
  layout: LayoutSettings,
  enhancement: EnhancementSettings,
  pageIndex: number,
  _onProgress?: (msg: string) => void
): Promise<HTMLCanvasElement> {
  const { width, height } = getPageDimensions(layout.pageSize, layout.orientation, enhancement.dpi);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  const margin = Math.round(width * 0.03);
  const gap = Math.round(width * 0.015);
  const availW = width - margin * 2 - gap * (layout.cols - 1);
  const availH = height - margin * 2 - gap * (layout.rows - 1);
  const cellW = Math.floor(availW / layout.cols);
  const cellH = Math.floor(availH / layout.rows);

  const needsEnhancement = hasAnyEnhancement(enhancement);

  for (let i = 0; i < images.length && i < layout.rows * layout.cols; i++) {
    const row = Math.floor(i / layout.cols);
    const col = i % layout.cols;
    const x = margin + col * (cellW + gap);
    const y = margin + row * (cellH + gap);

    const img = await createImageBitmap(images[i].blob);

    let drawSource: CanvasImageSource;
    let srcW = img.width;
    let srcH = img.height;

    if (needsEnhancement) {
      // Only create temp canvas + apply enhancements when needed
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = img.width;
      tempCanvas.height = img.height;
      const tempCtx = tempCanvas.getContext('2d')!;
      tempCtx.drawImage(img, 0, 0);
      applyEnhancements(tempCanvas, enhancement);
      drawSource = tempCanvas;
      srcW = tempCanvas.width;
      srcH = tempCanvas.height;
    } else {
      // Skip enhancement pipeline entirely — draw ImageBitmap directly
      drawSource = img;
    }

    // Scale to fit cell maintaining aspect ratio
    const scale = Math.min(cellW / srcW, cellH / srcH);
    const drawW = srcW * scale;
    const drawH = srcH * scale;
    const offsetX = x + (cellW - drawW) / 2;
    const offsetY = y + (cellH - drawH) / 2;

    ctx.drawImage(drawSource, offsetX, offsetY, drawW, drawH);

    // Draw subtle border
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.strokeRect(offsetX, offsetY, drawW, drawH);
  }

  // Add page numbers
  if (layout.pageNumbers) {
    const fontSize = layout.pageNumberSize === 'small' ? 12 : layout.pageNumberSize === 'medium' ? 16 : 22;
    const scaledFontSize = Math.round(fontSize * (enhancement.dpi / 72));
    ctx.font = `${scaledFontSize}px Inter, sans-serif`;
    ctx.fillStyle = '#374151';
    const pageNum = String(layout.startingNumber + pageIndex);

    let tx: number, ty: number;
    const pos = layout.pageNumberPosition;
    const padX = margin;
    const padY = Math.round(margin * 0.8);

    if (pos.includes('left')) {
      ctx.textAlign = 'left';
      tx = padX;
    } else if (pos.includes('right')) {
      ctx.textAlign = 'right';
      tx = width - padX;
    } else {
      ctx.textAlign = 'center';
      tx = width / 2;
    }

    if (pos.includes('top')) {
      ty = padY + scaledFontSize;
    } else {
      ty = height - padY;
    }

    ctx.fillText(pageNum, tx, ty);
  }

  return canvas;
}
