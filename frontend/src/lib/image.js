/**
 * Shrinks a photo to a small JPEG data URL so it fits comfortably in a Firestore document
 * (limit 1 MiB) and keeps free-plan storage/bandwidth low.
 */
const MAX_CHARS = 350_000;
const STEPS = [[1280, 0.72], [1024, 0.6], [900, 0.5], [720, 0.45], [600, 0.4]];

function loadBitmap(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('That file could not be read as an image.')); };
    img.src = url;
  });
}

export async function compressImage(file) {
  const img = await loadBitmap(file);
  for (const [maxSide, quality] of STEPS) {
    const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff'; // flatten PNG/WebP transparency
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    if (dataUrl.length <= MAX_CHARS) return dataUrl;
  }
  throw new Error('That photo is too detailed to store. Please try a smaller photo.');
}
