import { BASE_URL } from '../config/api';

const blobDataUrl = blob => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(new Error('Could not embed a certificate image'));
  reader.readAsDataURL(blob);
});

const yieldToBrowser = () => new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 0)));

export async function embedCertificateImage(source) {
  if (source.startsWith('data:')) return source;
  const url = new URL(source, window.location.href);
  const read = async target => {
    const response = await fetch(target, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error('Image unavailable');
    const blob = await response.blob();
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'].includes(blob.type)) throw new Error('Invalid image');
    return blobDataUrl(blob);
  };
  try { return await read(url.href); }
  catch {
    // Uploaded certificate images are archived in our database. Read that copy
    // when an S3 bucket does not allow browser canvas/CORS requests.
    try { return await read(`${BASE_URL}/api/v1/certificate/asset-image?url=${encodeURIComponent(url.href)}`); }
    catch { throw new Error('A certificate logo or signature could not be embedded. Re-upload the missing image and try again.'); }
  }
}

async function drawCertificateLogos(node, canvas, context, imageCache) {
  const rootRect = node.getBoundingClientRect();
  const scaleX = canvas.width / node.offsetWidth;
  const scaleY = canvas.height / node.offsetHeight;
  for (const logo of node.querySelectorAll('img[data-certificate-logo]')) {
    const source = logo.currentSrc || logo.src;
    if (!imageCache.has(source)) imageCache.set(source, embedCertificateImage(source));
    const image = new Image();
    image.src = await imageCache.get(source);
    await image.decode();

    const rect = logo.getBoundingClientRect();
    const boxWidth = rect.width * scaleX;
    const boxHeight = rect.height * scaleY;
    const ratio = Math.min(boxWidth / image.naturalWidth, boxHeight / image.naturalHeight);
    const width = image.naturalWidth * ratio;
    const height = image.naturalHeight * ratio;
    const x = (rect.left - rootRect.left) * scaleX + (boxWidth - width) / 2;
    const y = (rect.top - rootRect.top) * scaleY + (boxHeight - height) / 2;

    context.save();
    context.globalAlpha = Number.parseFloat(getComputedStyle(logo).opacity) || 1;
    context.drawImage(image, x, y, width, height);
    context.restore();
  }
}

export async function rasterizeCertificate(node, scale = 1.5, imageCache = new Map()) {
  const clone = node.cloneNode(true);
  const originals = [node, ...node.querySelectorAll('*')];
  const copies = [clone, ...clone.querySelectorAll('*')];
  for (let index = 0; index < originals.length; index += 1) {
    const computed = getComputedStyle(originals[index]);
    const target = copies[index];
    // Certificate components define their print layout inline. Copying every
    // computed CSS property also serializes browser-specific font metrics and
    // resolved transforms, shifting text and image fitting in SVG capture.
    // Keep the authored percentage transforms and explicit inline typography.
    target.style.boxSizing = computed.boxSizing;
    target.style.animation = 'none';
    target.style.transition = 'none';
    if (originals[index].tagName === 'IMG') {
      const source = originals[index].currentSrc || originals[index].src;
      if (!imageCache.has(source)) imageCache.set(source, embedCertificateImage(source));
      target.removeAttribute('crossorigin');
      target.removeAttribute('srcset');
      target.src = await imageCache.get(source);
    }
  }
  const width = node.offsetWidth, height = node.offsetHeight;
  Object.assign(clone.style, { position: 'relative', left: '0px', top: '0px', margin: '0px', transform: 'none', width: `${width}px`, height: `${height}px` });
  clone.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
  const markup = new XMLSerializer().serializeToString(clone);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale); canvas.height = Math.round(height * scale);
  const context = canvas.getContext('2d');
  context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height);

  // Chromium can corrupt a single large foreignObject image at 600 DPI,
  // especially when the certificate contains repeating watermark text. Render
  // high-resolution exports in smaller SVG tiles and assemble one final canvas.
  const tileSize = scale >= 3.5 ? 250 : Math.max(width, height);
  for (let top = 0; top < height; top += tileSize) {
    for (let left = 0; left < width; left += tileSize) {
      const tileWidth = Math.min(tileSize, width - left);
      const tileHeight = Math.min(tileSize, height - top);
      const pixelWidth = Math.round(tileWidth * scale);
      const pixelHeight = Math.round(tileHeight * scale);
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${pixelWidth}" height="${pixelHeight}" viewBox="${left} ${top} ${tileWidth} ${tileHeight}"><foreignObject x="0" y="0" width="${width}" height="${height}">${markup}</foreignObject></svg>`;
      const source = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
      const image = new Image();
      image.src = source;
      await image.decode();
      context.drawImage(image, Math.round(left * scale), Math.round(top * scale), pixelWidth, pixelHeight);
      await yieldToBrowser();
    }
  }
  // Draw logos directly onto the completed canvas as a final pass. Large,
  // mostly-transparent uploaded PNGs can be omitted when nested in a tiled
  // SVG foreignObject even after they have been converted to data URLs.
  await drawCertificateLogos(node, canvas, context, imageCache);
  return canvas;
}
