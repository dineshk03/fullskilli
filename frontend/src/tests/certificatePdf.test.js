import { expect, it, vi } from 'vitest';
import { exportCertificatesPdf } from '../utils/certificatePdf';
const mocks = vi.hoisted(() => ({ save: vi.fn(), capture: vi.fn(async () => ({ width: 1000, height: 700, toDataURL: () => 'data:image/jpeg;base64,test' })) }));
vi.mock('../utils/certificateRaster', () => ({ rasterizeCertificate: mocks.capture }));
vi.mock('jspdf', () => ({ default: class { internal = { pageSize: { getWidth: () => 297, getHeight: () => 210 } }; addImage() {} save = mocks.save; } }));
it('exports a customized certificate when QR visibility is disabled', async () => {
  Object.defineProperty(document, 'fonts', { configurable: true, value: { ready: Promise.resolve() } });
  const node = document.createElement('article');
  node.setAttribute('data-certificate-qr-required', 'false');
  await exportCertificatesPdf([node], 'custom.pdf');
  expect(mocks.capture).toHaveBeenCalledWith(node, 3.5, expect.any(Map));
  expect(mocks.save).toHaveBeenCalledWith('custom.pdf');
});
it('uses the image-embedding renderer for every certificate design', async () => {
  const node = document.createElement('article');
  node.setAttribute('data-certificate-qr-required', 'false');
  node.setAttribute('aria-label', 'Customized certificate');
  await exportCertificatesPdf([node], 'custom-layout.pdf');
  expect(mocks.capture).toHaveBeenCalledWith(node, 3.5, expect.any(Map));
  expect(mocks.save).toHaveBeenCalledWith('custom-layout.pdf');
});
it('renders professional print PDFs at the 600 DPI scale', async () => {
  const node = document.createElement('article');
  node.setAttribute('data-certificate-qr-required', 'false');
  node.setAttribute('aria-label', 'Customized certificate');
  await exportCertificatesPdf([node], 'professional-print.pdf', false, null, { scale: 7 });
  expect(mocks.capture).toHaveBeenCalledWith(node, 7, expect.any(Map));
  expect(mocks.save).toHaveBeenCalledWith('professional-print.pdf');
});
