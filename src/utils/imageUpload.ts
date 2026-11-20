/**
 * Compresses an HTMLImageElement (optionally cropped to a normalized 0..1 rect)
 * into a lightweight JPEG data URL guaranteed to fit within Firestore limits (< 260 KB).
 */
export interface NormalizedCropRect {
  /** Left offset in [0, 1] */
  x: number;
  /** Top offset in [0, 1] */
  y: number;
  /** Width fraction in (0, 1] */
  w: number;
  /** Height fraction in (0, 1] */
  h: number;
}

export function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load image for cropping.'));
    img.src = src;
  });
}

export function readFileAsDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    return Promise.reject(new Error('Please choose a valid image file (JPG, PNG, or WebP).'));
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the selected image.'));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

export async function renderCroppedImageToDataUrl(
  imageSrc: string,
  crop: NormalizedCropRect,
  maxDimension = 900,
  maxBytes = 240_000,
): Promise<string> {
  const img = await loadImageElement(imageSrc);
  const natW = img.naturalWidth || img.width;
  const natH = img.naturalHeight || img.height;

  const sx = Math.max(0, Math.min(natW - 1, Math.round(crop.x * natW)));
  const sy = Math.max(0, Math.min(natH - 1, Math.round(crop.y * natH)));
  const sw = Math.max(1, Math.min(natW - sx, Math.round(crop.w * natW)));
  const sh = Math.max(1, Math.min(natH - sy, Math.round(crop.h * natH)));

  let outW = sw;
  let outH = sh;
  if (outW > maxDimension || outH > maxDimension) {
    const ratio = Math.min(maxDimension / outW, maxDimension / outH);
    outW = Math.max(1, Math.round(outW * ratio));
    outH = Math.max(1, Math.round(outH * ratio));
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Browser canvas unavailable for image cropping.');
  }

  canvas.width = outW;
  canvas.height = outH;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, outW, outH);
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);

  let quality = 0.78;
  let dataUrl = canvas.toDataURL('image/jpeg', quality);

  while (dataUrl.length > maxBytes && quality > 0.34) {
    quality -= 0.14;
    dataUrl = canvas.toDataURL('image/jpeg', quality);
  }

  if (dataUrl.length > maxBytes) {
    const scale = 0.72;
    canvas.width = Math.max(1, Math.round(outW * scale));
    canvas.height = Math.max(1, Math.round(outH * scale));
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    dataUrl = canvas.toDataURL('image/jpeg', 0.64);
  }

  if (dataUrl.length > 340_000) {
    throw new Error('Cropped image is still too large. Please pick a smaller region or photo.');
  }

  return dataUrl;
}

export async function compressImageFileToDataUrl(
  file: File,
  maxDimension = 900,
  maxBytes = 240_000,
): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose a valid image file (JPG, PNG, or WebP).');
  }

  if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
    const objectUrl = URL.createObjectURL(file);
    try {
      return await renderCroppedImageToDataUrl(
        objectUrl,
        { x: 0, y: 0, w: 1, h: 1 },
        maxDimension,
        maxBytes,
      );
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  const rawUrl = await readFileAsDataUrl(file);
  return renderCroppedImageToDataUrl(
    rawUrl,
    { x: 0, y: 0, w: 1, h: 1 },
    maxDimension,
    maxBytes,
  );
}
