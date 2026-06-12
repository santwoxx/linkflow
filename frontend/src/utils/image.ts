/**
 * Compresses an image file to a base64 data URL, ensuring the result stays
 * within Firestore's document size limits (500 000 chars for iconUrl/imageUrl).
 *
 * @param file     - The File object from an <input type="file" />
 * @param maxW     - Maximum width in pixels
 * @param maxH     - Maximum height in pixels
 * @param quality  - Initial JPEG quality (0–1). Will be reduced automatically
 *                   if the first pass produces a string larger than maxBytes.
 * @param maxBytes - Target maximum size for the base64 string (default 350 000
 *                   chars, well under the 500 000-char Firestore rule limit).
 */
export function compressImage(
  file: File,
  maxW: number,
  maxH: number,
  quality: number,
  maxBytes = 350_000
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      // Scale down proportionally
      if (width > height) {
        if (width > maxW) {
          height = Math.round(height * (maxW / width));
          width = maxW;
        }
      } else {
        if (height > maxH) {
          width = Math.round(width * (maxH / height));
          height = maxH;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('canvas-context-unavailable'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      // Try with the requested quality first; if the result is too large,
      // halve quality and try again (max 3 attempts).
      let result = '';
      let q = Math.min(quality, 0.75); // never exceed 0.75 for upload images
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          result = canvas.toDataURL('image/jpeg', q);
        } catch (err) {
          reject(err);
          return;
        }
        if (result.length <= maxBytes) break;
        q = Math.max(0.1, q * 0.55); // aggressive reduction each round
      }

      // Last resort: if still too big, shrink canvas by 50% and re-encode
      if (result.length > maxBytes) {
        canvas.width = Math.max(1, Math.round(width * 0.5));
        canvas.height = Math.max(1, Math.round(height * 0.5));
        const ctx2 = canvas.getContext('2d');
        if (ctx2) {
          ctx2.drawImage(img, 0, 0, canvas.width, canvas.height);
          try {
            result = canvas.toDataURL('image/jpeg', 0.55);
          } catch (err) {
            reject(err);
            return;
          }
        }
      }

      resolve(result);
    };
    img.onerror = () => reject(new Error('image-load-failed'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Sanitizes image URLs to convert viewer links (from popular image hosting services like ImgBB or Postimages)
 * into their direct image file links.
 */
export function sanitizeImageUrl(url: string): string {
  if (!url) return '';
  
  let cleaned = url.trim();

  // ImgBB viewer page link to direct image link (ignores the filename and pulls directly)
  const imgbbRegex = /(?:https?:\/\/)?(?:www\.)?ibb\.co\/([a-zA-Z0-9]+)/i;
  const imgbbMatch = cleaned.match(imgbbRegex);
  if (imgbbMatch && imgbbMatch[1]) {
    return `https://i.ibb.co/${imgbbMatch[1]}/logo.png`;
  }

  // Postimages viewer page link to direct image link
  const postimgRegex = /(?:https?:\/\/)?(?:www\.)?postimg\.cc\/([a-zA-Z0-9]+)/i;
  const postimgMatch = cleaned.match(postimgRegex);
  if (postimgMatch && postimgMatch[1]) {
    return `https://i.postimg.cc/${postimgMatch[1]}/logo.png`;
  }

  return cleaned;
}

