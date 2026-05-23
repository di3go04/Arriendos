const STORAGE_KEY = 'rentnow_device_fp';

/** Fingerprint estable en el cliente (no PII). */
export function getOrCreateDeviceFingerprint(): string {
  if (typeof window === 'undefined') return 'server';
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;
    const fp = `fp_${crypto.randomUUID()}`;
    localStorage.setItem(STORAGE_KEY, fp);
    return fp;
  } catch {
    return `fp_${Date.now()}`;
  }
}
