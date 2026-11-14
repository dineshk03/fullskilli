const pause = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const yieldToBrowser = () => new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 0)));
import { rasterizeCertificate } from './certificateRaster';
import { fitCertificateLayout } from './certificateLayout';

async function waitForCertificate(node) {
  await document.fonts.ready;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const qrCode = node.querySelector('img[alt="Certificate QR Code"], img[alt="Certificate verification QR code"]');
    const requiresQr = node.getAttribute('data-certificate-qr-required') !== 'false';
    const images = [...node.querySelectorAll('img')].filter(image => node.getAttribute('aria-label') !== 'Customized certificate' || image.src.startsWith('data:'));
    if ((!requiresQr || qrCode) && images.every(image => image.complete && image.naturalWidth > 0)) {
      fitCertificateLayout(node);
      return;
    }
    await pause(100);
  }
  throw new Error('Certificate images did not finish loading');
}

export async function exportCertificatesPdf(nodes, filename, print = false, openedWindow = null, options = {}) {
  if (!nodes.length || nodes.some(node => !node)) throw new Error('No certificates selected');

  // Open the print window during the click event, before asynchronous PDF rendering.
  const printWindow = print ? (openedWindow || window.open('', '_blank')) : null;
  if (print && !printWindow) throw new Error('Allow pop-ups to print certificates');
  if (printWindow) printWindow.document.body.textContent = 'Preparing certificates for printing...';

  try {
    const { default: jsPDF } = await import('jspdf');
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imageCache = new Map();
    const scale = options.scale === 7 ? 7 : options.scale === 2 ? 2 : options.scale === 1.5 ? 1.5 : 3.5;
    const printQuality = scale >= 3.5;

    for (let index = 0; index < nodes.length; index += 1) {
      options.onProgress?.(index + 1, nodes.length);
      await yieldToBrowser();
      await waitForCertificate(nodes[index]);
      // Use the same image-embedding renderer for every certificate design.
      // html2canvas can silently omit an uploaded logo when its storage host
      // does not expose CORS headers; rasterizeCertificate embeds each image
      // (using the archived backend copy as a fallback) before capture.
      const canvas = await rasterizeCertificate(nodes[index], scale, imageCache);
      if (index) pdf.addPage();
      const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
      const width = canvas.width * ratio;
      const height = canvas.height * ratio;
      pdf.addImage(canvas.toDataURL(printQuality ? 'image/png' : 'image/jpeg', 0.98), printQuality ? 'PNG' : 'JPEG', (pageWidth - width) / 2, (pageHeight - height) / 2, width, height);
      // Release each large canvas before rendering the next batch page.
      canvas.width = 0;
      canvas.height = 0;
      await yieldToBrowser();
    }

    if (print) {
      pdf.autoPrint();
      const url = URL.createObjectURL(pdf.output('blob'));
      printWindow.location.href = url;
      setTimeout(() => URL.revokeObjectURL(url), 120000);
    } else {
      pdf.save(filename);
    }
  } catch (error) {
    if (printWindow) printWindow.close();
    throw error;
  }
}
