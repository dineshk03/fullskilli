import CertificateLogoPicker from './CertificateLogoPicker';
import CertificateLogoControls from './CertificateLogoControls';
import { useLayoutEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import CertificatePreview from '../../../components/core/Certificate/CertificatePreview';
import styles from './CertificateWorkspace.module.css';

export default function CertificateTextEditor({ certificateData, onChange, onAsset, uploading }) {
  const root = useRef(null);
  const drag = useRef(null);
  const [selected, setSelected] = useState(null);
  const [zoom, setZoom] = useState(false);
  const data = certificateData.designData || {};
  useLayoutEffect(() => {
    root.current.querySelectorAll('[data-certificate-text], [data-certificate-signature], [data-certificate-logo]').forEach(node => {
      if (!node.textContent.trim() && !node.dataset.certificateSignature && !node.dataset.certificateLogo && node.dataset.certificateText !== 'stars') return;
      node.tabIndex = 0;
      node.setAttribute('role', 'button');
      node.setAttribute('aria-label', node.dataset.certificateLogo ? `Resize or move ${node.dataset.certificateLogo} logo` : node.dataset.certificateSignature ? `Resize ${node.dataset.certificateSignature === 'principal' ? 'college' : 'academy'} signature` : node.dataset.certificateText === 'stars' ? 'Format or move stars' : node.dataset.certificateText === 'recipientLine' ? 'Format or move recipient line' : `Format: ${node.textContent.trim()}`);
      node.setAttribute('aria-pressed', String((node.dataset.certificateText || (node.dataset.certificateLogo ? `${node.dataset.certificateLogo}Logo` : `${node.dataset.certificateSignature}Signature`)) === selected?.key));
      node.dataset.textSelected = String((node.dataset.certificateText || (node.dataset.certificateLogo ? `${node.dataset.certificateLogo}Logo` : `${node.dataset.certificateSignature}Signature`)) === selected?.key);
    });
  }, [certificateData, selected]);
  const select = event => {
    const node = event.target.closest('[data-certificate-text], [data-certificate-signature], [data-certificate-logo]');
    if (!node || !root.current.contains(node)) return;
    event.preventDefault();
    if (node.dataset.certificateLogo) { setSelected({ key: `${node.dataset.certificateLogo}Logo`, logo: node.dataset.certificateLogo, text: 'Logo' }); return; }
    if (node.dataset.certificateSignature) {
      setSelected({ key: `${node.dataset.certificateSignature}Signature`, image: true, text: 'Signature image' });
      return;
    }
    if (node.dataset.certificateText === 'stars') {
      setSelected({ key: 'stars', isStars: true, text: 'Blue stars decoration', size: 12, lineHeight: 1, spacing: 5, bold: false });
      return;
    }
    if (node.dataset.certificateText === 'recipientLine') {
      setSelected({ key: 'recipientLine', text: 'Recipient name line', size: 19, lineHeight: 1.5, spacing: 0, bold: false });
      return;
    }
    const computed = window.getComputedStyle(node);
    setSelected({ key: node.dataset.certificateText, text: node.textContent.trim(), size: Math.round(parseFloat(computed.fontSize)) || 16, lineHeight: parseFloat(computed.lineHeight) / parseFloat(computed.fontSize) || 1.4, spacing: computed.letterSpacing === 'normal' ? 0 : parseFloat(computed.letterSpacing) || 0, bold: Number(computed.fontWeight) >= 600 || computed.fontWeight === 'bold' });
  };
  const update = (suffix, value) => onChange({ ...data, [`${selected.key}Text${suffix}`]: value, layoutVersion: 2 });
  const reset = () => {
    const next = { ...data };
    const offsetKey = selected.key.startsWith('bodyLine') && data.linkAchievementLines ? 'body' : selected.key;
    delete next[`${selected.key}Width`];
    delete next[`${selected.key}Height`];
    delete next[`${selected.key}TextSize`];
    delete next[`${selected.key}TextBold`];
    delete next[`${selected.key}LetterSpacing`];
    delete next[`${selected.key}LineHeight`];
    delete next[`${selected.key}SpaceAfter`];
    delete next[`${offsetKey}OffsetX`];
    delete next[`${offsetKey}OffsetY`];
    onChange(next);
    setSelected(null);
  };
  const startDrag = event => {
    const node = event.target.closest('[data-certificate-text]');
    if (!node || event.button !== 0) return;
    const key = node.dataset.certificateText;
    const offsetKey = key.startsWith('bodyLine') && data.linkAchievementLines ? 'body' : key;
    const article = node.closest('article');
    const scale = (article?.getBoundingClientRect().width || 1000) / 1000;
    const safeScale = scale || 1;
    select(event);
    drag.current = { key: offsetKey, x: event.clientX, y: event.clientY, offsetX: Number(data[`${offsetKey}OffsetX`] || 0), offsetY: Number(data[`${offsetKey}OffsetY`] || 0), scale: safeScale };
    event.currentTarget.setPointerCapture?.(event.pointerId);
    event.preventDefault();
    const move = moveEvent => {
      if (!drag.current) return;
      const x = Math.round(drag.current.offsetX + (moveEvent.clientX - drag.current.x) / drag.current.scale);
      const y = Math.round(drag.current.offsetY + (moveEvent.clientY - drag.current.y) / drag.current.scale);
      const currentKey = drag.current.key;
      onChange({ ...data, [`${currentKey}OffsetX`]: Math.min(400, Math.max(-400, x)), [`${currentKey}OffsetY`]: Math.min(250, Math.max(-250, y)), layoutVersion: 2 });
    };
    const stop = () => { drag.current = null; window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', stop); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop, { once: true });
  };
  const handleTextKeyDown = event => {
    const node = event.target.closest('[data-certificate-text]');
    if (!node) {
      if (event.key === 'Enter' || event.key === ' ') select(event);
      return;
    }
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      if (event.key === 'Enter' || event.key === ' ') select(event);
      return;
    }
    event.preventDefault();
    const key = node.dataset.certificateText;
    const offsetKey = key.startsWith('bodyLine') && data.linkAchievementLines ? 'body' : key;
    const distance = event.shiftKey ? 10 : 1;
    const x = Number(data[`${offsetKey}OffsetX`] || 0) + (event.key === 'ArrowLeft' ? -distance : event.key === 'ArrowRight' ? distance : 0);
    const y = Number(data[`${offsetKey}OffsetY`] || 0) + (event.key === 'ArrowUp' ? -distance : event.key === 'ArrowDown' ? distance : 0);
    select({ target: node, preventDefault() {} });
    onChange({ ...data, [`${offsetKey}OffsetX`]: Math.min(400, Math.max(-400, x)), [`${offsetKey}OffsetY`]: Math.min(250, Math.max(-250, y)), layoutVersion: 2 });
  };
  return <section className={styles.textEditor} aria-label="Edit text on certificate">
    <h3>Edit text & signatures</h3>
    <p>Click text to format it, drag it into position, or use the arrow keys to move it. Hold Shift with an arrow key to move 10 pixels. Click a logo to resize or move it, or a signature to resize it.</p>
    <button type="button" className={styles.secondaryButton} aria-pressed={zoom} onClick={() => setZoom(!zoom)}>{zoom ? 'Fit certificate to screen' : 'Enlarge for precise editing'}</button>
    <div className={styles.textToolbar}>
      {selected && /^(principal|director)/.test(selected.key) && <div className={styles.signatureParts}>
        {['Signature', 'Name', 'Title', 'Organization'].map(part => {
          const role = selected.key.startsWith('principal') ? 'principal' : 'director';
          const key = `${role}${part}`;
          return <button type="button" key={part} className={styles.secondaryButton} aria-pressed={selected.key === key} onClick={() => {
            const node = root.current.querySelector(part === 'Signature' ? `[data-certificate-signature="${role}"]` : `[data-certificate-text="${key}"]`);
            if (node) select({ target: node, preventDefault() {} });
          }}>{part === 'Signature' ? 'Signature image' : part === 'Organization' ? 'Organization' : part}</button>;
        })}
      </div>}

      {selected ? <>
        {/^(principal|director)Organization$/.test(selected.key) && <label className={styles.organizationField}>Organization text<input aria-label="Signatory organization text" maxLength={180} value={data[selected.key] || ''} placeholder="Use certificate organization" onChange={event => onChange({ ...data, [selected.key]: event.target.value, layoutVersion: 2 })} /></label>}
        <span className={styles.selectedText} title={selected.text}>{selected.text}</span>
        {selected.logo ? <>{onAsset && <CertificateLogoPicker data={data} role={selected.logo} onChange={onChange} onAsset={onAsset} uploading={uploading} />}<CertificateLogoControls data={data} role={selected.logo} onChange={onChange} /></> : selected.image ? <>{['Width', 'Height'].map(dimension => <label key={dimension}>{dimension} <input type="range" aria-label={`Signature ${dimension.toLowerCase()}`} min={10} max={dimension === 'Width' ? 300 : 100} value={data[`${selected.key}${dimension}`] || (dimension === 'Width' ? (data.layout === 'ramnad' ? 150 : 142) : (data.layout === 'ramnad' ? 34 : 38))} onChange={event => onChange({ ...data, [`${selected.key}${dimension}`]: Number(event.target.value), layoutVersion: 2 })} /></label>)}</> : selected.isStars ? <span style={{ padding: '0 8px', fontSize: 13, color: 'var(--ink)' }}>Drag stars into position or use arrow keys (Shift+arrow moves 10px).</span> : <>
        <label>Size <input aria-label="Selected text size" type="number" min={6} max={72} value={data[`${selected.key}TextSize`] ?? selected.size} onChange={event => { const size = Number(event.target.value); if (Number.isInteger(size) && size >= 6 && size <= 72) update('Size', size); }} /></label>
        <label>{data.layout === 'saEngg' && selected.key === 'college' ? 'Gap before certificate heading (px)' : data.layout === 'saEngg' && selected.key === 'heading' ? 'Gap after certificate heading (px)' : 'Space after (px)'} <input aria-label={data.layout === 'saEngg' && selected.key === 'college' ? 'Gap before certificate heading' : data.layout === 'saEngg' && selected.key === 'heading' ? 'Gap after certificate heading' : 'Selected text space after'} type="number" min={0} max={80} value={data[`${selected.key}SpaceAfter`] ?? ''} placeholder={data.layout === 'saEngg' && (selected.key === 'college' || selected.key === 'heading') ? '12' : 'Layout default'} onChange={event => { const next = { ...data, layoutVersion: 2 }; if (event.target.value === '') { delete next[`${selected.key}SpaceAfter`]; onChange(next); return; } const value = Number(event.target.value); if (Number.isInteger(value) && value >= 0 && value <= 80) onChange({ ...next, [`${selected.key}SpaceAfter`]: value }); }} /></label>
        <label>Line spacing <input aria-label="Selected text line spacing" type="number" min={0.8} max={3} step={0.1} value={data[`${selected.key}LineHeight`] ?? data.lineHeight ?? Math.round(selected.lineHeight * 100) / 100} onChange={event => { const value = Number(event.target.value); if (Number.isFinite(value) && value >= 0.8 && value <= 3) onChange({ ...data, [`${selected.key}LineHeight`]: value, layoutVersion: 2 }); }} /></label>
        <label>Letter spacing <input aria-label="Selected text letter spacing" type="number" min={-2} max={20} step={0.5} value={data[`${selected.key}LetterSpacing`] ?? selected.spacing} onChange={event => { const spacing = Number(event.target.value); if (Number.isFinite(spacing) && spacing >= -2 && spacing <= 20) onChange({ ...data, [`${selected.key}LetterSpacing`]: spacing, layoutVersion: 2 }); }} /></label>
        <label>Alignment <select aria-label="Selected text alignment" value={data[`${selected.key}TextAlign`] || 'left'} onChange={event => onChange({ ...data, [`${selected.key}TextAlign`]: event.target.value, layoutVersion: 2 })}><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option><option value="justify">Justify</option></select></label>
        <button type="button" className={styles.secondaryButton} aria-label="Bold selected text" aria-pressed={data[`${selected.key}TextBold`] ?? selected.bold} onClick={() => update('Bold', !(data[`${selected.key}TextBold`] ?? selected.bold))}><b>B</b> Bold</button></>}
        {!selected.logo && <button type="button" className={styles.textButton} onClick={reset}>{selected.isStars ? 'Reset position' : 'Reset text style'}</button>}
      </> : <span>Select text below to show formatting controls.</span>}
    </div>
    <div ref={root} className={`${styles.editableCertificate} ${zoom ? styles.zoomCertificate : ''}`} onPointerDown={startDrag} onClick={select} onKeyDown={handleTextKeyDown}>
      <CertificatePreview certificateData={certificateData} />
    </div>
    <small>Text stays inside its space. Large sizes may shrink to fit.</small>
  </section>;
}
CertificateTextEditor.propTypes = { certificateData: PropTypes.object.isRequired, onChange: PropTypes.func.isRequired, onAsset: PropTypes.func, uploading: PropTypes.string };
