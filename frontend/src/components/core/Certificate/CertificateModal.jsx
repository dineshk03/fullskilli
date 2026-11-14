import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import CertificateDesign from './CertificateDesign';
import CertificatePreview from './CertificatePreview';
import { FiDownload, FiLoader, FiPrinter, FiShield, FiX } from 'react-icons/fi';
import styles from './CertificateModal.module.css';
import { exportCertificatesPdf } from '../../../utils/certificatePdf';
import { toast } from 'react-hot-toast';

export default function CertificateModal({ onClose, certificateData, onCustomize }) {
  const certificateRef = useRef();
  const [busy, setBusy] = useState(false);
  const [quality, setQuality] = useState('ultra');
  const dialog = useRef(null);
  const closeButton = useRef(null);
  const busyRef = useRef(false);
  busyRef.current = busy;
  const titleId = useId();
  const filename = `${certificateData?.certificateId || 'beeja-certificate'}.pdf`;

  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    const appRoot = document.getElementById('root');
    const previousInert = appRoot?.inert;
    if (appRoot) appRoot.inert = true;
    document.body.style.overflow = 'hidden';
    closeButton.current?.focus();
    const keyboard = event => {
      if (event.key === 'Escape' && !busyRef.current) { event.preventDefault(); onClose(); }
      if (event.key !== 'Tab') return;
      const targets = [...dialog.current.querySelectorAll('button:not(:disabled), a[href], [tabindex="0"]')];
      const first = targets[0];
      const last = targets[targets.length - 1];
      if (!targets.includes(document.activeElement)) { event.preventDefault(); (event.shiftKey ? last : first)?.focus(); }
      else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', keyboard);
    return () => {
      document.body.style.overflow = previousOverflow;
      if (appRoot) appRoot.inert = previousInert;
      document.removeEventListener('keydown', keyboard);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [onClose]);

  const handleDownload = async () => {
    setBusy(true);
    try {
      await exportCertificatesPdf(
        [certificateRef.current?.firstElementChild],
        filename, false, null, { scale: quality === 'ultra' ? 7 : quality === 'high' ? 3.5 : 2 }
      );
    } catch (error) {
      toast.error(error.message || 'Could not download certificate');
    } finally {
      setBusy(false);
    }
  };

  const handlePrint = async () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return toast.error('Allow pop-ups to print certificates');
    setBusy(true);
    try {
      await exportCertificatesPdf([certificateRef.current?.firstElementChild], filename, true, printWindow, { scale: quality === 'ultra' ? 7 : quality === 'high' ? 3.5 : 2 });
    } catch (error) {
      if (!printWindow.closed) printWindow.close();
      toast.error(error.message || 'Could not prepare certificate for printing');
    } finally {
      setBusy(false);
    }
  };

  return createPortal(<div className={styles.backdrop} onClick={event => { if (event.target === event.currentTarget && !busy) onClose(); }}>
    <section ref={dialog} role="dialog" aria-modal="true" aria-labelledby={titleId} className={styles.dialog} tabIndex={-1}>
      <header className={styles.header}><div><span className={styles.eyebrow}>CERTIFICATE PREVIEW</span><h2 id={titleId}>{certificateData.studentName || 'Certificate'}</h2><p>{certificateData.courseName}</p></div><button ref={closeButton} type="button" disabled={busy} onClick={onClose} className={styles.close} aria-label="Close certificate preview"><FiX /></button></header>
      <div className={styles.canvas}><CertificatePreview certificateData={certificateData} /></div>
      {busy && <p role="status" className={styles.progress}><FiLoader aria-hidden="true" />Preparing your PDF…</p>}
      <footer className={styles.footer}>{certificateData.certificateId ? <a className={styles.verification} href={`/verify-certificate/${encodeURIComponent(certificateData.certificateId)}`} target="_blank" rel="noopener noreferrer"><FiShield aria-hidden="true" />{certificateData.certificateId} · View verification</a> : <span className={styles.verification}>Draft preview · Verification is available after issuing</span>}<div className={styles.actions}><select aria-label="PDF quality" value={quality} disabled={busy} onChange={event => setQuality(event.target.value)} className={styles.secondary}><option value="ultra">Professional print (600 DPI)</option><option value="high">Print quality (300 DPI)</option><option value="standard">Standard PDF</option></select>{onCustomize && <button type="button" className={styles.secondary} disabled={busy} onClick={onCustomize}>Customize & issue new</button>}<button type="button" className={styles.secondary} onClick={handlePrint} disabled={busy}><FiPrinter aria-hidden="true" />Print certificate</button><button type="button" className={styles.primary} onClick={handleDownload} disabled={busy}><FiDownload aria-hidden="true" />Download PDF</button></div></footer>
      <div ref={certificateRef} data-certificate-pdf-stage aria-hidden="true" style={{ position: 'fixed', left: '-12000px', top: 0, pointerEvents: 'none' }}><CertificateDesign certificateData={certificateData} /></div>
    </section>
  </div>, document.body);
}

CertificateModal.propTypes = {
  onClose: PropTypes.func,
  onCustomize: PropTypes.func,
  certificateData: PropTypes.shape({ certificateId: PropTypes.string, studentName: PropTypes.string, courseName: PropTypes.string }).isRequired,
};
