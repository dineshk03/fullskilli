import { afterEach, expect, it, vi } from 'vitest';
import { embedCertificateImage } from '../utils/certificateRaster';
afterEach(() => vi.unstubAllGlobals());
it('embeds archived uploaded images when the storage host rejects CORS', async () => {
  const fetch = vi.fn().mockRejectedValueOnce(new Error('CORS blocked')).mockResolvedValueOnce({ ok: true, blob: async () => new Blob(['logo'], { type: 'image/png' }) });
  vi.stubGlobal('fetch', fetch);
  expect(await embedCertificateImage('https://storage.example.com/certificate-assets/logo.png')).toMatch(/^data:image\/png;base64,/);
  expect(fetch.mock.calls[1][0]).toContain('/certificate/asset-image?url=');
});
it('reports an unavailable logo rather than downloading a PDF with missing images', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Unavailable')));
  await expect(embedCertificateImage('https://storage.example.com/logo.png')).rejects.toThrow('Re-upload');
});
