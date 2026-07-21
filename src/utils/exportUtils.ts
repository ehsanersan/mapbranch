import { toPng, toJpeg } from 'html-to-image';

export async function captureElement(
  element: HTMLElement,
  format: 'png' | 'jpeg' | 'webp' = 'png',
  scale: number = 2,
  quality: number = 0.95,
  bgColor?: string
): Promise<string> {
  const options = {
    pixelRatio: scale,
    quality,
    backgroundColor: bgColor || undefined,
    cacheBust: true,
    skipFonts: true,
    filter: (node: HTMLElement) => {
      // Skip UI elements
      if (node.classList?.contains('map-controls')) return false;
      if (node.classList?.contains('leaflet-control')) return false;
      return true;
    },
  };

  try {
    if (format === 'jpeg') {
      return await toJpeg(element, { ...options, backgroundColor: bgColor || '#0a0612' });
    }
    return await toPng(element, options);
  } catch (err) {
    console.error('Export failed:', err);
    throw new Error('خروجی با خطا مواجه شد');
  }
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  try {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    
    // Cleanup after a delay
    setTimeout(() => {
      document.body.removeChild(link);
    }, 100);
  } catch (err) {
    console.error('Download failed:', err);
    throw new Error('دانلود با خطا مواجه شد');
  }
}

export function downloadText(content: string, filename: string, mimeType: string = 'text/plain'): void {
  try {
    // Add BOM for UTF-8 support in Excel
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  } catch (err) {
    console.error('Text download failed:', err);
    throw new Error('دانلود با خطا مواجه شد');
  }
}

export function downloadJSON(data: unknown, filename: string): void {
  try {
    const json = JSON.stringify(data, null, 2);
    downloadText(json, filename, 'application/json');
  } catch (err) {
    console.error('JSON download failed:', err);
    throw new Error('دانلود با خطا مواجه شد');
  }
}

export function formatPersianDate(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' بایت';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' کیلوبایت';
  return (bytes / (1024 * 1024)).toFixed(1) + ' مگابایت';
}
