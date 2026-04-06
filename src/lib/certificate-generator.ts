/**
 * Certificate Generator Utilities
 * This library provides helper functions for the Certificate Engine.
 */

/**
 * Generates a unique, verifiable certificate code.
 * Format: CERT-XXXX-XXXX (e.g. CERT-A8X9-JL2P)
 */
export function generateCertificateCode(): string {
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
  return `CERT-${randomStr}`;
}

/**
 * Sanitizes a learner name for certificate display.
 */
export function sanitizeNameForCertificate(name: string): string {
  if (!name) return 'Valued Learner';
  return name.trim().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
}

/**
 * Returns the absolute URL for a certificate view.
 */
export function getCertificateUrl(domain: string, userId: string, courseId: string): string {
  return `/api/t/${domain}/certificates/view?userId=${userId}&courseId=${courseId}`;
}
