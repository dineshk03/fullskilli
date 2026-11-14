const configuredOrigin = (import.meta.env.VITE_PUBLIC_APP_URL || '').trim().replace(/\/$/, '');

export function getCertificateVerificationUrl(certificateId) {
  if (!certificateId) return '';
  const origin = configuredOrigin || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${origin}/verify-certificate/${encodeURIComponent(String(certificateId).trim())}`;
}

