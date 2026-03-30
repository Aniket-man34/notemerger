export interface PageImage {
  id: string;
  blob: Blob;
  thumbnailUrl: string;
  fullUrl: string;
  width: number;
  height: number;
  sourceFile: string;
  pageNumber: number;
  selected: boolean;
}

export interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  file: File;
}

export interface LayoutSettings {
  pageSize: 'original' | 'a4' | 'letter' | 'legal' | 'a3';
  orientation: 'portrait' | 'landscape';
  rows: number;
  cols: number;
  pageNumbers: boolean;
  pageNumberPosition: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  pageNumberSize: 'small' | 'medium' | 'large';
  startingNumber: number;
}

export interface EnhancementSettings {
  invert: boolean;
  clearBackground: boolean;
  grayscale: boolean;
  blackAndWhite: boolean;
  bwThreshold: number;
  dpi: number;
  logoRemoval: LogoRemovalSettings | null;
}

export interface LogoRemovalSettings {
  shape: 'rectangle' | 'circle';
  x: number;
  y: number;
  width: number;
  height: number;
  applyTo: 'all' | 'current' | 'custom';
  customRange: string;
}

export type AppStep = 1 | 2 | 3 | 4;

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}
