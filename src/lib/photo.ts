// Photo evidence helpers: downscale, stamp with site/time/GPS, and compress to JPEG.
const MAX_SIDE = 1280;

/** Draws `source` scaled to at most MAX_SIDE, burns `lines` into a caption bar, returns a JPEG. */
export function stampPhoto(source: CanvasImageSource, width: number, height: number, lines: string[]): Promise<Blob> {
  const scale = Math.min(1, MAX_SIDE / Math.max(width, height));
  const w = Math.round(width * scale);
  const h = Math.round(height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx || !w || !h) return Promise.reject(new Error('Could not process the photo.'));
  ctx.drawImage(source, 0, 0, w, h);

  const size = Math.max(12, Math.round(w / 48));
  const pad = Math.round(size * .8);
  const lineHeight = size * 1.35;
  const barHeight = pad * 2 + lineHeight * lines.length;
  ctx.fillStyle = 'rgba(0, 0, 0, .65)';
  ctx.fillRect(0, h - barHeight, w, barHeight);
  ctx.fillStyle = '#facc15';
  ctx.font = `bold ${size}px "JetBrains Mono", ui-monospace, monospace`;
  ctx.textBaseline = 'top';
  lines.forEach((line, i) => ctx.fillText(line, pad, h - barHeight + pad + i * lineHeight, w - pad * 2));

  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Could not process the photo.')), 'image/jpeg', .8));
}

/** Loads an image file (respecting phone EXIF rotation) and stamps it. */
export async function stampPhotoFile(file: File, lines: string[]): Promise<Blob> {
  if (!file.type.startsWith('image/')) throw new Error('Choose an image file.');
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return await stampPhoto(img, img.naturalWidth, img.naturalHeight, lines);
  } catch (err) {
    throw err instanceof Error && err.message.startsWith('Could not') ? err : new Error('This image could not be opened. Try a JPEG or PNG.');
  } finally {
    URL.revokeObjectURL(url);
  }
}
