import type { LayoutSettings, EnhancementSettings } from '../types';

interface ImageSource {
  blob: Blob;
  width: number;
  height: number;
}

export async function composePage(
  images: ImageSource[],
  layout: LayoutSettings,
  enhancement: EnhancementSettings,
  pageIndex: number
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { alpha: false })!;
  
  const targetWidth = 1654; 
  const targetHeight = 2339;

  if (layout.orientation === 'landscape') {
    canvas.width = targetHeight;
    canvas.height = targetWidth;
  } else {
    canvas.width = targetWidth;
    canvas.height = targetHeight;
  }

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const padding = 40;
  const availableWidth = canvas.width - (padding * (layout.cols + 1));
  const availableHeight = canvas.height - (padding * (layout.rows + 1));
  const slotWidth = availableWidth / layout.cols;
  const slotHeight = availableHeight / layout.rows;

  for (let i = 0; i < images.length; i++) {
    const row = Math.floor(i / layout.cols);
    const col = i % layout.cols;
    const x = padding + col * (slotWidth + padding);
    const y = padding + row * (slotHeight + padding);

    const imgSource = images[i];
    const imgElement = await blobToImage(imgSource.blob);
    
    const enhancedBuffer = await applyEnhancements(imgElement, enhancement);
    
    const scale = Math.min(slotWidth / enhancedBuffer.width, slotHeight / enhancedBuffer.height);
    const drawW = enhancedBuffer.width * scale;
    const drawH = enhancedBuffer.height * scale;
    const drawX = x + (slotWidth - drawW) / 2;
    const drawY = y + (slotHeight - drawH) / 2;

    ctx.drawImage(enhancedBuffer, drawX, drawY, drawW, drawH);

    enhancedBuffer.width = 0;
    enhancedBuffer.height = 0;
    URL.revokeObjectURL(imgElement.src);
  }

  if (layout.pageNumbers) {
    drawPageNumber(ctx, canvas.width, canvas.height, layout, pageIndex);
  }

  return canvas;
}

async function applyEnhancements(
  img: HTMLImageElement, 
  settings: EnhancementSettings
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

  ctx.drawImage(img, 0, 0);

  if (settings.grayscale || settings.blackAndWhite || settings.invert) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      if (settings.grayscale || settings.blackAndWhite) {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        if (settings.blackAndWhite) {
          const v = gray > settings.bwThreshold ? 255 : 0;
          r = g = b = v;
        } else {
          r = g = b = gray;
        }
      }

      if (settings.invert) {
        r = 255 - r;
        g = 255 - g;
        b = 255 - b;
      }

      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }
    ctx.putImageData(imageData, 0, 0);
  }

  return canvas;
}

function drawPageNumber(
  ctx: CanvasRenderingContext2D, 
  w: number, 
  h: number, 
  layout: LayoutSettings, 
  index: number
) {
  const pageNum = layout.startingNumber + index;
  const fontSize = layout.pageNumberSize === 'small' ? 24 : layout.pageNumberSize === 'large' ? 48 : 36;
  ctx.font = `${fontSize}px Inter, sans-serif`;
  ctx.fillStyle = '#666666';
  
  let x = w / 2;
  let y = h - 50;

  if (layout.pageNumberPosition.includes('left')) x = 50;
  if (layout.pageNumberPosition.includes('right')) x = w - 50;
  if (layout.pageNumberPosition.includes('top')) y = 50 + fontSize;

  ctx.textAlign = layout.pageNumberPosition.includes('center') ? 'center' : 
                 layout.pageNumberPosition.includes('left') ? 'left' : 'right';
                 
  ctx.fillText(pageNum.toString(), x, y);
}

function blobToImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = URL.createObjectURL(blob);
  });
}