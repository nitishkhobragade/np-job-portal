/**
 * Utility functions for reliable client-side file handling across all mobile and desktop browsers
 */

/**
 * Format byte count into human-readable size string.
 * Never outputs 0 KB for real non-empty files.
 */
export function formatFileSize(bytes: number): string {
  if (bytes === undefined || bytes === null || isNaN(bytes) || bytes <= 0) {
    return '0 KB';
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    const kb = bytes / 1024;
    return `${kb < 10 ? kb.toFixed(1) : Math.round(kb)} KB`;
  }
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(2)} MB`;
}

/**
 * Resolve actual file size in bytes.
 * On some Android Chrome devices, `file.size` can erroneously return 0
 * until read into memory via ArrayBuffer or blob slice.
 */
export async function getRealFileBytes(file: File): Promise<number> {
  if (file.size && file.size > 0) {
    return file.size;
  }
  try {
    const buffer = await file.arrayBuffer();
    if (buffer && buffer.byteLength > 0) {
      return buffer.byteLength;
    }
  } catch (err) {
    console.warn('Could not read arrayBuffer for size:', err);
  }
  return file.size || 0;
}
