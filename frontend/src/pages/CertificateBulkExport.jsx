import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import CertificateDesign from '../components/core/Certificate/CertificateDesign';
import { exportCertificatesPdf } from '../utils/certificatePdf';

export default function CertificateBulkExport() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState('Preparing your certificate download…');
  const [items, setItems] = useState([]);
  const [progress, setProgress] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const key = `certificate-export-${params.get('task') || ''}`;
    try {
      const task = JSON.parse(localStorage.getItem(key) || 'null');
      if (!task?.items?.length) throw new Error('This download request has expired. Return to Certificates and try again.');
      localStorage.removeItem(key);
      flushSync(() => setItems(task.items));
      setTimeout(async () => {
        try {
          const nodes = task.items.map(certificate => document.getElementById(`export-certificate-${certificate.certificateId}`));
          for (let attempt = 0; attempt < 50 && nodes.some(node => !node || node.offsetWidth === 0 || node.offsetHeight === 0); attempt += 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          if (nodes.some(node => !node || node.offsetWidth === 0 || node.offsetHeight === 0)) throw new Error('Certificate preview did not finish loading. Please retry the bulk download.');
          await exportCertificatesPdf(nodes, task.filename, false, null, { scale: task.scale, onProgress: (current, total) => { setProgress(Math.round((current / total) * 100)); setStatus(`Preparing certificate ${current} of ${total}…`); } });
          setStatus('Your PDF download has started. You can close this tab.');
        } catch (error) { setStatus(error.message || 'Could not prepare the PDF.'); }
      }, 0);
    } catch (error) { setStatus(error.message || 'Could not load this download request.'); }
  }, [params]);

  const complete = progress === 100;
  return <main className="min-h-screen bg-[#050d1c] text-richblack-5 px-4 py-10 sm:px-8"><section className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#182957] via-[#111c40] to-[#241445] shadow-2xl"><div className="border-b border-white/10 bg-white/[.03] px-6 py-5 sm:px-10"><div className="flex items-center gap-4"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-yellow-50 text-2xl text-richblack-900">↓</div><div><p className="text-xs font-bold tracking-[.2em] text-yellow-100">BEEJA ACADEMY</p><h1 className="mt-1 text-2xl font-semibold">Certificate download</h1></div></div></div><div className="px-6 py-10 sm:px-10"><div className="rounded-2xl border border-white/10 bg-richblack-900/40 p-6"><div className="flex items-center justify-between gap-4"><div><p className="text-lg font-semibold">{complete ? 'Your PDF is ready' : 'Preparing your PDF'}</p><p className="mt-1 text-sm text-richblack-200" role="status">{status}</p></div><span className="text-2xl font-bold text-yellow-50">{progress}%</span></div><div className="mt-6 h-3 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-yellow-100 via-yellow-50 to-orange-300 transition-all duration-500" style={{ width: `${progress}%` }} /></div><div className="mt-5 flex items-center justify-between text-sm text-richblack-200"><span>{items.length || '…'} certificates in this batch</span><span>{complete ? 'Download started' : 'You can keep working in your other tab'}</span></div></div><div className="mt-7 grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-white/10 bg-white/[.03] p-4"><strong className="block text-yellow-50">Separate tab</strong><span className="mt-1 block text-sm text-richblack-200">Your library remains available.</span></div><div className="rounded-xl border border-white/10 bg-white/[.03] p-4"><strong className="block text-yellow-50">High quality</strong><span className="mt-1 block text-sm text-richblack-200">Each certificate is prepared carefully.</span></div><a href="/admin?tab=certificates" className="rounded-xl border border-yellow-50/50 bg-yellow-50 px-4 py-4 font-semibold text-richblack-900 transition hover:bg-yellow-100">Back to certificates</a></div></div></section><div aria-hidden="true" style={{ position: 'fixed', left: '-12000px', top: 0, pointerEvents: 'none' }}>{items.map(certificate => <div id={`export-certificate-${certificate.certificateId}`} key={certificate.certificateId}><CertificateDesign certificateData={certificate} /></div>)}</div></main>;
}
