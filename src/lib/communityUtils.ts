/**
 * Community utilities for WildSaura community system
 */

/**
 * Format a Firestore timestamp or ISO string to relative time
 */
export function timeAgo(ts: any): string {
  if (!ts) return 'Just now';
  try {
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  } catch {
    return 'Just now';
  }
}

/**
 * Compress image before upload (handles mobile/iOS quirks)
 */
export async function compressImage(
  file: File,
  maxWidth = 1200,
  quality = 0.8
): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    const cleanup = () => { try { URL.revokeObjectURL(objectUrl); } catch {} };

    const timeout = setTimeout(() => {
      cleanup();
      resolve(file);
    }, 10000);

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        let w = img.width;
        let h = img.height;
        if (w > maxWidth) { h = (h * maxWidth) / w; w = maxWidth; }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) { clearTimeout(timeout); cleanup(); resolve(file); return; }
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(
          (blob) => { clearTimeout(timeout); cleanup(); resolve(blob && blob.size > 0 ? blob : file); },
          'image/jpeg',
          quality
        );
      } catch { clearTimeout(timeout); cleanup(); resolve(file); }
    };
    img.onerror = () => { clearTimeout(timeout); cleanup(); resolve(file); };
    img.crossOrigin = 'anonymous';
    img.src = objectUrl;
  });
}
