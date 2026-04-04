import sharp from 'sharp';

/**
 * Converts filename to .webp extension.
 * Handles edge cases like no extension, multiple dots, etc.
 */
function toWebpFilename(filename: string): string {
  const withoutExt = filename.replace(/\.[^.]+$/, '');
  return withoutExt !== filename ? `${withoutExt}.webp` : `${filename}.webp`;
}

/**
 * Processes an image buffer, converting it to WebP for optimal web delivery.
 *
 * Behavior:
 * - Non-image MIME types: pass through unchanged
 * - SVG: pass through unchanged (vector format, should not rasterize)
 * - HEIC/HEIF: convert to WebP, with graceful fallback if libvips lacks HEIC support
 * - All other image/*: convert to WebP, with fallback to original if conversion fails
 *
 * Provides automatic format normalization so users can upload any image format
 * (PNG, JPEG, GIF, BMP, TIFF, HEIC from iPhones) and it's stored as optimized WebP.
 */
export async function processImage(
  buffer: Buffer,
  mimeType: string,
  filename: string
): Promise<{ buffer: Buffer; mimeType: string; filename: string }> {
  // Non-image types pass through unchanged
  if (!mimeType.startsWith('image/')) {
    return { buffer, mimeType, filename };
  }

  // SVG is vector — never rasterize with Sharp
  if (mimeType === 'image/svg+xml') {
    return { buffer, mimeType, filename };
  }

  // HEIC/HEIF isolated block — libvips may lack HEIC support on some servers
  // Separate try/catch allows graceful fallback for this specific format
  if (mimeType === 'image/heic' || mimeType === 'image/heif') {
    try {
      const converted = await sharp(buffer).webp({ quality: 85 }).toBuffer();
      return {
        buffer: converted,
        mimeType: 'image/webp',
        filename: toWebpFilename(filename),
      };
    } catch (err) {
      console.warn(
        '[ImageProcessor] HEIC/HEIF conversion failed (libvips may lack HEIC support), uploading original:',
        err
      );
      return { buffer, mimeType, filename };
    }
  }

  // All other image/* types: attempt conversion, fall back to original on any error
  try {
    const converted = await sharp(buffer).webp({ quality: 85 }).toBuffer();
    return {
      buffer: converted,
      mimeType: 'image/webp',
      filename: toWebpFilename(filename),
    };
  } catch (err) {
    console.warn(
      `[ImageProcessor] WebP conversion failed for ${mimeType} (${filename}), uploading original:`,
      err
    );
    return { buffer, mimeType, filename };
  }
}
