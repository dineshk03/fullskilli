import LmsCertificateStudents from './LmsCertificateStudents';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { getManualCertificates, issueManualCertificates, uploadCertificateAsset, getCertificateTemplate, saveCertificateTemplate, getCertificateBatch, setCertificateStatus, deleteCertificate, bulkSetCertificateStatus, bulkDeleteCertificates, getCertificateColleges, createCertificateCollege } from '../../../services/operations/certificateAPI';
import { exportCertificatesPdf } from '../../../utils/certificatePdf';
import CertificateModal from '../../../components/core/Certificate/CertificateModal';
import CertificateDesign from '../../../components/core/Certificate/CertificateDesign';

import { FiAward, FiCheckCircle, FiCheckSquare, FiHelpCircle, FiLayers, FiPlus } from 'react-icons/fi';
import CertificateComposer from './CertificateComposer';
import CertificateLibrary from './CertificateLibrary';
import CollegeFolders from './CollegeFolders';
import { certificateNames, localDate } from './certificateWorkspaceUtils';
import styles from './CertificateWorkspace.module.css';
import { parseCertificateRecipients } from './certificateRecipientImport';
import { certificateAppearance, certificateBranding } from '../../../components/core/Certificate/certificateAppearance';
import { getCertificateVerificationUrl } from '../../../utils/certificateVerification';

const today = localDate();

export default function ManualCertificates() {
  const draftTouched = useRef(false);
  const { token } = useSelector(state => state.auth);
  const [workspaceView, setWorkspaceView] = useState('library');
  const certificateSource = workspaceView === 'lms' ? 'course' : 'manual';
  const [showHelp, setShowHelp] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [listError, setListError] = useState('');
  const [importing, setImporting] = useState(false);
  const [courseName, setCourseName] = useState('');
  const [collegeId, setCollegeId] = useState('');
  const [colleges, setColleges] = useState([]);
  const [collegeLoading, setCollegeLoading] = useState(false);
  const [folderCollege, setFolderCollege] = useState(null);
  const [design, setDesign] = useState('classic');
  const [designData, setDesignData] = useState({ ...certificateAppearance, academyName: 'Beeja Academy', collegeName: '', showCollaboration: true, showDepartment: true, showRecipientCollege: true, studentYear: '', department: '', hours: '', academicYear: '', collegeDetails: '', academyLogoUrl: '', collegeLogoUrl: '', principalSignatureUrl: '', directorSignatureUrl: '', principalName: '', principalTitle: 'Principal', directorName: '', directorTitle: 'Director' });
  const [uploading, setUploading] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [exportQuality, setExportQuality] = useState('ultra');
  const [exportProgress, setExportProgress] = useState('');
  const [exportBusy, setExportBusy] = useState(false);
  const [lastBatchId, setLastBatchId] = useState('');
  const [lastBatchCount, setLastBatchCount] = useState(0);
  const [batchLoading, setBatchLoading] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [completionDate, setCompletionDate] = useState(today);
  const [nameText, setNameText] = useState('');
  const [recipientRows, setRecipientRows] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [selectedRecords, setSelectedRecords] = useState({});
  const [preview, setPreview] = useState(null);
  const [renderItems, setRenderItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [designFilter, setDesignFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sort, setSort] = useState('newest');
  const [listLoading, setListLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const nextSearch = searchInput.trim();
    if (nextSearch === search) return undefined;
    const timer = setTimeout(() => { setPage(1); setSearch(nextSearch); }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, search]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    if (fromDate && toDate && fromDate > toDate) {
      setListError('The start date must be before the end date.');
      setListLoading(false);
      return undefined;
    }
    setListError('');
    setListLoading(true);
    getManualCertificates(token, page, { source: certificateSource, limit: pageSize, search, design: designFilter, from: fromDate, to: toDate, sort, collegeId: folderCollege?._id })
      .then(result => {
        if (cancelled) return;
        setCertificates(result.data || []);
        setPages(result.pages || 1);
        setPage(current => Math.min(current, result.pages || 1));
        setTotal(result.total || 0);
      })
      .catch(error => { if (!cancelled) setListError(error.response?.data?.message || 'We could not load your certificates. Please try again.'); })
      .finally(() => { if (!cancelled) setListLoading(false); });
    return () => { cancelled = true; };
  }, [token, page, pageSize, search, designFilter, fromDate, toDate, sort, reloadKey, certificateSource, folderCollege]);

  useEffect(() => {
    if (!token) return;
    getCertificateTemplate(token).then(template => {
      if (!template) return;
      setDesignData(previous => ({ ...previous, ...template.designData }));
      if (template.design) setDesign(template.design);
      setCourseName(template.courseName || '');
      setCategoryName(template.categoryName || '');
      draftTouched.current = false;
    }).catch(() => toast.error('Could not load saved certificate design'));
  }, [token]);

  const refreshColleges = async () => {
    if (!token) return;
    setCollegeLoading(true);
    try { setColleges(await getCertificateColleges(token)); } catch { toast.error('Could not load college folders'); } finally { setCollegeLoading(false); }
  };
  useEffect(() => { refreshColleges(); }, [token]);

  const names = certificateNames(nameText);
  const selected = Object.values(selectedRecords);
  const updateDesignData = (key, value) => setDesignData(previous => ({ ...previous, [key]: value, ...(key === 'academyLogoUrl' ? { showAcademyLogo: true } : key === 'collegeLogoUrl' ? { showCollegeLogo: true } : key === 'thirdLogoUrl' ? { showThirdLogo: true } : {}) }));
  const handleSaveTemplate = async () => {
    setSavingTemplate(true);
    try {
      const saved = await saveCertificateTemplate({ courseName, categoryName, design, designData }, token);
      if (saved?.designData) setDesignData(previous => ({ ...previous, ...saved.designData }));
      draftTouched.current = false;
      toast.success('Certificate template saved for future certificates');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not save design');
    } finally {
      setSavingTemplate(false);
    }
  };
  const handleAddCollege = async () => {
    const name = window.prompt('College name');
    if (!name?.trim()) return;
    const details = window.prompt('College details (optional)') || '';
    try {
      const college = await createCertificateCollege({ name, details }, token);
      setColleges(previous => [...previous, college].sort((a, b) => a.name.localeCompare(b.name)));
      setCollegeId(college._id);
      setDesignData(previous => ({ ...previous, collegeName: college.name, ...(details ? { collegeDetails: details } : {}) }));
      toast.success(`${college.name} folder created`);
    } catch (error) {
      const existing = error.response?.data?.data;
      if (existing?._id) { setCollegeId(existing._id); toast.success(`${existing.name} is already available and selected`); }
      else toast.error(error.response?.data?.message || 'Could not add college');
    }
  };
  const handleAsset = async (key, event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
      toast.error('Choose a PNG, JPEG or WebP image under 2 MB');
      return;
    }
    setUploading(key);
    try {
      updateDesignData(key, await uploadCertificateAsset(file, token));
      toast.success('Image uploaded');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Image upload failed');
    } finally {
      setUploading('');
    }
  };

  const handleFile = async event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Choose a file smaller than 2 MB');
      return;
    }
    if (!/\.(csv|xlsx|xls)$/i.test(file.name)) { toast.error('Choose a CSV, XLSX or XLS file'); return; }
    setImporting(true);
    draftTouched.current = true;
    try {
      const xlsxModule = await import('xlsx');
      const XLSX = xlsxModule.default || xlsxModule;
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1, blankrows: false });
      if (!rows.length) throw new Error('The file is empty');
      const { recipients: imported, hasDetails } = parseCertificateRecipients(rows);
      if (Math.max(names.length, recipientRows.length) + imported.length > 100) throw new Error('Issue at most 100 certificates at a time');
      if (hasDetails || recipientRows.length) setRecipientRows(previous => [...(previous.length ? previous : names.map(name => ({ name }))), ...imported]);
      setNameText(previous => [previous.trim(), ...imported.map(recipient => recipient.name)].filter(Boolean).join('\n'));
      if (hasDetails) {
        const first = imported[0];
        setCourseName(previous => first.courseName || previous);
        setDesignData(previous => ({ ...previous, studentYear: first.studentYear || previous.studentYear || '', department: first.department || previous.department || '', collegeName: first.collegeName || previous.collegeName || '', startDate: first.startDate || previous.startDate || '', endDate: first.endDate || previous.endDate || '', hours: first.hours || previous.hours || '', academicYear: first.academicYear || previous.academicYear || '' }));
      }
      toast.success(`Added ${imported.length} names`);
    } catch (error) {
      toast.error(error.message || 'Could not read the name list');
    } finally {
      setImporting(false);
    }
  };

  const handleIssue = async event => {
    event.preventDefault();
    if (!courseName.trim() || !names.length || names.length > 100) {
      toast.error('Enter a title and between 1 and 100 names');
      return;
    }
    if (design === 'collaboration' && (!designData.academyName.trim() || !designData.department.trim() || !designData.academicYear.trim() || !designData.principalName.trim() || !designData.principalTitle.trim() || !designData.directorName.trim() || !designData.directorTitle.trim() || !Number(designData.hours) || ['academyLogoUrl', 'principalSignatureUrl', 'directorSignatureUrl'].some(key => !(key === 'academyLogoUrl' && designData.showAcademyLogo === false) && !designData[key] && !(key === 'academyLogoUrl' && designData.useDefaultAcademyLogo)))) {
      toast.error('Complete the available collaboration and signatory details, then upload the required signatures');
      return;
    }
    setBusy(true);
    try {
      const issued = await issueManualCertificates({ names, courseName, categoryName, completionDate, design, designData, collegeId, ...(recipientRows.length ? { recipients: recipientRows } : {}) }, token);
      if (issued.some(certificate => certificate.designData?.layoutVersion !== 2)) toast.error('The server returned an older certificate design. Restart or deploy the updated backend before issuing more certificates.', { duration: 10000 });
      setSearchInput('');
      setSearch('');
      setDesignFilter('');
      setFromDate('');
      setToDate('');
      setSort('newest');
      setPage(1);
      setReloadKey(previous => previous + 1);
      setSelectedRecords(Object.fromEntries(issued.map(certificate => [certificate.certificateId, certificate])));
      setLastBatchId(issued[0]?.batchId || '');
      setLastBatchCount(issued.length);
      setNameText('');
      setRecipientRows([]);
      setWorkspaceView('library');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not issue certificates');
    } finally {
      setBusy(false);
    }
  };

  const handleExport = async (print, items = selected, filenameOverride = '') => {
    if (exportBusy) { toast.error('A certificate download is already being prepared'); return; }
    if (!items.length || items.length > 100) {
      toast.error('Select between 1 and 100 certificates');
      return;
    }
    const printWindow = print ? window.open('', '_blank') : null;
    if (print && !printWindow) {
      toast.error('Allow pop-ups to print certificates');
      return;
    }
    const filename = filenameOverride || (items.length === 1 ? `${items[0].certificateId}-${items[0].studentName.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')}.pdf` : `beeja-certificates-${today}.pdf`);
    if (!print && items.length > 1) {
      const taskId = crypto.randomUUID();
      localStorage.setItem(`certificate-export-${taskId}`, JSON.stringify({ items, filename, scale: exportQuality === 'ultra' ? 7 : exportQuality === 'high' ? 3.5 : 2 }));
      const exportWindow = window.open(`/certificate-export?task=${encodeURIComponent(taskId)}`, '_blank');
      if (!exportWindow) { localStorage.removeItem(`certificate-export-${taskId}`); toast.error('Allow pop-ups to prepare the bulk PDF in a separate tab'); }
      else toast.success('Bulk download is preparing in a separate tab');
      return;
    }
    setExportBusy(true);
    setRenderItems(items);
    setExportProgress('Preparing PDF...');
    try {
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const nodes = items.map(certificate => document.getElementById(`certificate-pdf-${certificate.certificateId}`));
      await exportCertificatesPdf(nodes, filename, print, printWindow, {
        scale: exportQuality === 'ultra' ? 7 : exportQuality === 'high' ? 3.5 : 2,
        onProgress: (current, total) => setExportProgress(`Preparing certificate ${current} of ${total}...`),
      });
      toast.success(print ? 'Print-ready PDF opened' : 'PDF downloaded');
    } catch (error) {
      if (printWindow && !printWindow.closed) printWindow.close();
      toast.error(error.message || 'Could not prepare PDF');
    } finally {
      setRenderItems([]);
      setExportProgress('');
      setExportBusy(false);
    }
  };

  const handleBatchDownload = async batchId => {
    if (!batchId || exportBusy || batchLoading) return;
    setBatchLoading(batchId);
    try {
      const items = await getCertificateBatch(batchId, token);
      await handleExport(false, items, `beeja-batch-${batchId}.pdf`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not load certificate batch');
    } finally {
      setBatchLoading('');
    }
  };

  const toggleSelected = certificate => {
    if (!selectedRecords[certificate.certificateId] && selected.length >= 100) {
      toast.error('Select up to 100 certificates at a time');
      return;
    }
    setSelectedRecords(previous => {
      const next = { ...previous };
      if (next[certificate.certificateId]) delete next[certificate.certificateId];
      else next[certificate.certificateId] = certificate;
      return next;
    });
  };

  const selectShown = () => {
    const next = { ...selectedRecords };
    const allSelected = certificates.every(item => selectedRecords[item.certificateId]);
    if (allSelected) certificates.forEach(item => delete next[item.certificateId]);
    else certificates.forEach(item => { next[item.certificateId] = item; });
    if (Object.keys(next).length > 100) { toast.error('Select up to 100 certificates. Clear some selections first.'); return; }
    setSelectedRecords(next);
  };

  const downloadDetailsCsv = () => {
    const cell = value => {
      let text = String(value ?? '');
      if (/^[-=+@]/.test(text)) text = `'${text}`;
      return `"${text.replace(/"/g, '""')}"`;
    };
    const rows = [['Student Name', 'Course', 'Design', 'Certificate ID', 'Issued Date', 'Verification Link'],
      ...selected.map(certificate => [certificate.studentName, certificate.courseName,
        certificate.design === 'collaboration' ? 'Collaboration' : 'Beeja Academy', certificate.certificateId,
        certificate.issuedDate ? new Date(certificate.issuedDate).toISOString().slice(0, 10) : '',
        getCertificateVerificationUrl(certificate.certificateId)])];
    const blob = new Blob(['\uFEFF', rows.map(row => row.map(cell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `beeja-certificate-details-${today}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const copyVerificationLink = async certificate => {
    try {
      await navigator.clipboard.writeText(getCertificateVerificationUrl(certificate.certificateId));
      toast.success('Verification link copied');
    } catch {
      toast.error('Could not copy verification link');
    }
  };

  const customizeCertificate = certificate => {
    draftTouched.current = true;
    setCourseName(certificate.courseName || '');
    setCategoryName(certificate.categoryName || '');
    setCompletionDate(certificate.completionDate ? String(certificate.completionDate).slice(0, 10) : today);
    setDesign(certificate.design || 'classic');
    setDesignData({ ...certificateAppearance, ...certificateBranding, ...certificate.designData, layoutVersion: 2 });
    setNameText(certificate.studentName || '');
    setRecipientRows([]);
    setPreview(null);
    setWorkspaceView('create');
  };
  const handleStatus = async certificate => {
    const enabling = certificate.isActive === false;
    if (!enabling && !window.confirm(`Disable certificate ${certificate.certificateId}? It will no longer pass public verification.`)) return;
    setBusy(true);
    try {
      await setCertificateStatus(certificate.certificateId, enabling, token);
      setCertificates(previous => previous.map(item => item.certificateId === certificate.certificateId ? { ...item, isActive: enabling } : item));
      setSelectedRecords(previous => previous[certificate.certificateId] ? { ...previous, [certificate.certificateId]: { ...previous[certificate.certificateId], isActive: enabling } } : previous);
      setReloadKey(previous => previous + 1);
      toast.success(`Certificate ${enabling ? 'enabled' : 'disabled'}`);
    } catch (error) { toast.error(error.response?.data?.message || 'Could not update certificate'); }
    finally { setBusy(false); }
  };
  const handleDelete = async certificate => {
    if (!window.confirm(`Permanently delete certificate ${certificate.certificateId} for ${certificate.studentName}? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await deleteCertificate(certificate.certificateId, token);
      setSelectedRecords(previous => { const next = { ...previous }; delete next[certificate.certificateId]; return next; });
      setPreview(current => current?.certificateId === certificate.certificateId ? null : current);
      setReloadKey(previous => previous + 1);
      toast.success('Certificate permanently deleted');
    } catch (error) { toast.error(error.response?.data?.message || 'Could not delete certificate'); }
    finally { setBusy(false); }
  };
  const handleBulkStatus = async isActive => {
    if (!selected.length) return;
    const action = isActive ? 'enable' : 'disable';
    if (!window.confirm(`${action[0].toUpperCase()}${action.slice(1)} ${selected.length} selected certificate${selected.length === 1 ? '' : 's'}?${isActive ? '' : ' They will no longer pass public verification.'}`)) return;
    setBusy(true);
    try {
      const result = await bulkSetCertificateStatus(selected.map(item => item.certificateId), isActive, token);
      const selectedIds = new Set(selected.map(item => item.certificateId));
      setCertificates(previous => previous.map(item => selectedIds.has(item.certificateId) ? { ...item, isActive } : item));
      setSelectedRecords(previous => Object.fromEntries(Object.entries(previous).map(([id, item]) => [id, { ...item, isActive }])));
      toast.success(result.message || `${selected.length} certificates ${isActive ? 'enabled' : 'disabled'}`);
    } catch (error) { toast.error(error.response?.data?.message || 'Could not update selected certificates'); }
    finally { setBusy(false); }
  };
  const handleBulkDelete = async () => {
    if (!selected.length || !window.confirm(`Permanently delete ${selected.length} selected certificate${selected.length === 1 ? '' : 's'}? This cannot be undone.`)) return;
    setBusy(true);
    try {
      const result = await bulkDeleteCertificates(selected.map(item => item.certificateId), token);
      setSelectedRecords({});
      setPreview(current => selected.some(item => item.certificateId === current?.certificateId) ? null : current);
      setReloadKey(previous => previous + 1);
      toast.success(result.message || `${selected.length} certificates permanently deleted`);
    } catch (error) { toast.error(error.response?.data?.message || 'Could not delete selected certificates'); }
    finally { setBusy(false); }
  };
  const draft = { recipientRows, courseName, categoryName, completionDate, design, designData, nameText, collegeId };
  const changeDraft = (key, value) => {
    draftTouched.current = true;
    if (key === 'recipientRows') { setRecipientRows(value); setNameText(value.map(recipient => recipient.name).join('\n')); return; }
    if (key === 'nameText') setRecipientRows([]);
    return ({ courseName: setCourseName, categoryName: setCategoryName, completionDate: setCompletionDate, design: setDesign, designData: setDesignData, nameText: setNameText, collegeId: setCollegeId })[key](value); };
  const switchLibrary = view => {
    setWorkspaceView(view);
    setPage(1);
    setCertificates([]);
    setSelectedRecords({});
    setPreview(null);
    setSearchInput('');
    setSearch('');
    setDesignFilter('');
    setFromDate('');
    setToDate('');
    setListError('');
  };
  const clearFilters = () => { setSearchInput(''); setSearch(''); setDesignFilter(''); setFromDate(''); setToDate(''); setPage(1); };
  const changeFilter = (key, value) => {
    if (key !== 'searchInput') setPage(1);
    ({ searchInput: setSearchInput, designFilter: setDesignFilter, fromDate: setFromDate, toDate: setToDate, sort: setSort })[key](value);
  };
  const filtered = Boolean(search || designFilter || fromDate || toDate);
  const working = busy;

  return <div className={styles.workspace}>
    <header className={styles.header}><div><span className={styles.eyebrow}>BEEJA ACADEMY / CREDENTIALS</span><h1>Certificates</h1><p>Recognize achievements. Make every milestone official.</p></div><div className={styles.headerActions}><button type="button" className={styles.secondaryButton} onClick={() => setShowHelp(previous => !previous)} aria-expanded={showHelp} aria-controls="certificate-help"><FiHelpCircle aria-hidden="true" />Quick guide</button>{workspaceView !== 'create' && <button type="button" className={styles.primaryButton} onClick={() => setWorkspaceView('create')} disabled={working}><FiPlus aria-hidden="true" />Create certificate</button>}</div></header>
    {showHelp && <div id="certificate-help" className={styles.helpPanel}><strong>From achievement to certificate in three steps</strong><ol><li>Choose a design and enter the course details.</li><li>Add names individually, paste a list or upload a spreadsheet.</li><li>Review, issue and download. Use the library to find certificates or copy verification links later.</li></ol></div>}
    <div className={styles.stats}>
      <div className={styles.stat}><span className={styles.statIcon}><FiAward aria-hidden="true" /></span><div><strong>{listLoading ? '—' : total.toLocaleString()}</strong><span>{filtered ? 'Matching certificates' : certificateSource === 'course' ? 'LMS certificates' : 'Manual certificates'}</span></div></div>
      <div className={styles.stat}><span className={styles.statIcon}><FiCheckSquare aria-hidden="true" /></span><div><strong>{selected.length}</strong><span>Selected across pages</span></div></div>
      <div className={styles.stat}><span className={styles.statIcon}><FiLayers aria-hidden="true" /></span><div><strong>{lastBatchCount || 100}</strong><span>{lastBatchCount ? 'Certificates in latest batch' : 'Recipients per batch'}</span></div></div>
    </div>
    {lastBatchId && <div className={styles.successBanner} role="status"><div><FiCheckCircle aria-hidden="true" /><div><strong>Your certificates are ready</strong><p>{lastBatchCount} certificate{lastBatchCount === 1 ? '' : 's'} issued successfully. Download the complete batch in one PDF.</p></div></div><button type="button" disabled={busy || Boolean(batchLoading)} onClick={() => handleBatchDownload(lastBatchId)} className={styles.primaryButton}>{batchLoading === lastBatchId ? 'Preparing batch…' : 'Download latest batch'}</button></div>}
    <nav className={styles.workspaceNav} aria-label="Certificate workspace"><button type="button" className={workspaceView === 'library' ? styles.activeNav : ''} aria-pressed={workspaceView === 'library'} onClick={() => switchLibrary('library')} disabled={working}>Manual certificates</button><button type="button" className={workspaceView === 'folders' ? styles.activeNav : ''} aria-pressed={workspaceView === 'folders'} onClick={() => switchLibrary('folders')} disabled={working}>College folders</button><button type="button" className={workspaceView === 'lms' ? styles.activeNav : ''} aria-pressed={workspaceView === 'lms'} onClick={() => switchLibrary('lms')} disabled={working}>LMS certificates</button><button type="button" className={workspaceView === 'create' ? styles.activeNav : ''} aria-pressed={workspaceView === 'create'} onClick={() => setWorkspaceView('create')} disabled={working}>Create certificate</button></nav>
    {workspaceView === 'lms' && <LmsCertificateStudents token={token} busy={working} onPreview={setPreview} onDownload={certificate => handleExport(false, [certificate])} onIssued={() => setReloadKey(value => value + 1)} />}
    {workspaceView === 'folders' ? <CollegeFolders colleges={colleges} loading={collegeLoading} onRefresh={refreshColleges} onAdd={handleAddCollege} onOpen={college => { setFolderCollege(college); setPage(1); setWorkspaceView('library'); }} /> : workspaceView === 'create' ? <CertificateComposer draft={draft} colleges={colleges} onAddCollege={handleAddCollege} onChange={changeDraft} onImport={handleFile} onAsset={handleAsset} onSaveTemplate={handleSaveTemplate} onSubmit={handleIssue} onCancel={() => setWorkspaceView('library')} busy={working} importing={importing} uploading={uploading} savingTemplate={savingTemplate} /> : workspaceView !== 'lms' && <>{folderCollege && <div className={styles.folderContext}><span>College folder: <strong>{folderCollege.name}</strong></span><button type="button" className={styles.textButton} onClick={() => { setFolderCollege(null); setPage(1); }}>Show all certificates</button></div>}<CertificateLibrary source={certificateSource} records={certificates} pagination={{ page, pages, total, pageSize }} filters={{ searchInput, designFilter, fromDate, toDate, sort }} selection={selectedRecords} loading={listLoading} error={listError} busy={working} exportBusy={exportBusy} batchLoading={batchLoading} exportProgress={exportProgress} exportQuality={exportQuality} showFilters={showFilters} onToggleFilters={() => setShowFilters(previous => !previous)} onFilter={changeFilter} onClearFilters={clearFilters} onPage={setPage} onPageSize={value => { setPage(1); setPageSize(value); }} onRefresh={() => setReloadKey(previous => previous + 1)} onCreate={() => setWorkspaceView('create')} onToggleRecord={toggleSelected} onTogglePage={selectShown} onClearSelection={() => setSelectedRecords({})} onExport={handleExport} onCsv={downloadDetailsCsv} onPreview={setPreview} onBatchDownload={handleBatchDownload} onCopyLink={copyVerificationLink} onQuality={setExportQuality} onCustomize={certificateSource === 'manual' ? customizeCertificate : undefined} onStatus={handleStatus} onDelete={handleDelete} onBulkStatus={handleBulkStatus} onBulkDelete={handleBulkDelete} /></>}
    {createPortal(<div id="certificate-pdf-stage" aria-hidden="true" style={{ position: 'fixed', left: '-12000px', top: 0, pointerEvents: 'none' }}>{renderItems.map(certificate => <div id={`certificate-pdf-${certificate.certificateId}`} key={certificate.certificateId}><CertificateDesign certificateData={certificate} /></div>)}</div>, document.body)}
    {preview && <CertificateModal certificateData={preview} onClose={() => setPreview(null)} onCustomize={certificateSource === 'manual' ? () => customizeCertificate(preview) : undefined} />}
  </div>;
}
