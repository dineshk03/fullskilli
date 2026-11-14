export function fitCertificateLayout(node) {
  if (!node) return;
  [...node.querySelectorAll('[data-layout-slot]')].reverse().forEach(frame => {
    const content = frame.firstElementChild;
    if (!content || !frame.clientHeight || !frame.clientWidth) return;
    const scale = Math.min(1, frame.clientHeight / Math.max(1, content.scrollHeight), frame.clientWidth / Math.max(1, content.scrollWidth));
    const alignStart = frame.dataset.fitAlign === 'start';
    const hasCustomOffset = content.style.position === 'relative' && (content.style.left || content.style.top);
    if (!hasCustomOffset) {
      content.style.left = alignStart ? '0px' : '50%';
      content.style.top = alignStart ? '0px' : '50%';
    }
    content.style.transformOrigin = alignStart ? 'top left' : 'center';
    content.style.transform = alignStart ? `scale(${scale})` : `translate(-50%, -50%) scale(${scale})`;
  });
}
