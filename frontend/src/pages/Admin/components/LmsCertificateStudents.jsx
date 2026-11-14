import CertificateAppearance from './CertificateAppearance';
import { certificateAppearance, certificateBranding } from '../../../components/core/Certificate/certificateAppearance';
import CertificatePreview from '../../../components/core/Certificate/CertificatePreview';
import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { toast } from 'react-hot-toast';
import { getLmsEnrollments, createLmsCertificate, getCertificateTemplate, saveCertificateTemplate, uploadCertificateAsset } from '../../../services/operations/certificateAPI';
import styles from './CertificateWorkspace.module.css';

export default function LmsCertificateStudents({ token, onPreview, onDownload, onIssued, busy }) {
  const [editing, setEditing] = useState(false);
  const [draftDesign, setDraftDesign] = useState('classic');
  const [draftData, setDraftData] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState('');
  const [designChoice, setDesignChoice] = useState('standard');
  const [template, setTemplate] = useState(null);
  const [templateLoading, setTemplateLoading] = useState(true);
  const [templateError, setTemplateError] = useState('');
  useEffect(() => {
    let active = true;
    getCertificateTemplate(token, 'lms').then(value => { if (active) setTemplate(value); }).catch(() => { if (active) setTemplateError('Could not load saved design. Refresh to try again.'); }).finally(() => { if (active) setTemplateLoading(false); });
    return () => { active = false; };
  }, [token]);
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState('');
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    const timer = setTimeout(() => {
      getLmsEnrollments(token, page, search).then(result => {
        if (!active) return;
        setRows(result.data || []);
        setPages(Math.max(1, result.pages || 1));
        setError('');
      }).catch(() => { if (active) setError('Could not load enrolled students. Please try again.'); })
        .finally(() => { if (active) setLoading(false); });
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [token, page, search, reload]);
  const editDesign = () => {
    setDraftDesign(template?.design || 'classic');
    setDraftData({ ...certificateAppearance, ...certificateBranding, ...template?.designData });
    setEditing(true);
  };
  const saveDesign = async () => {
    if (!draftData.title?.trim() || !draftData.bodyText?.trim()) { toast.error('Enter a heading and achievement message'); return; }
    setSaving(true);
    try {
      const saved = await saveCertificateTemplate({ scope: 'lms', design: draftDesign, designData: draftData }, token);
      setTemplate(saved);
      setDesignChoice('saved');
      setEditing(false);
      toast.success('LMS certificate design saved');
    } catch (failure) { toast.error(failure.response?.data?.message || 'Could not save LMS design'); }
    finally { setSaving(false); }
  };
  const uploadAsset = async (key, event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) { toast.error('Choose a PNG, JPEG or WebP image under 2 MB'); return; }
    setUploading(key);
    try {
      const url = await uploadCertificateAsset(file, token);
      setDraftData(previous => ({ ...previous, [key]: url, ...(key === 'academyLogoUrl' ? { showAcademyLogo: true } : key === 'collegeLogoUrl' ? { showCollegeLogo: true } : key === 'thirdLogoUrl' ? { showThirdLogo: true } : {}) }));
    } catch { toast.error('Could not upload image'); }
    finally { setUploading(''); }
  };
  const create = async row => {
    setCreating(`${row.studentId}-${row.courseId}`);
    try {
      const certificate = await createLmsCertificate(row.studentId, row.courseId, token, designChoice);
      setRows(previous => previous.map(item => item.studentId === row.studentId && item.courseId === row.courseId ? { ...item, certificate } : item));
      onIssued();
      onPreview(certificate);
      toast.success('Certificate ready');
    } catch (failure) {
      toast.error(failure.response?.data?.message || 'Could not create certificate');
    } finally { setCreating(''); }
  };
  return <section className={styles.library} aria-label="LMS enrolled students">
    <div className={styles.libraryHeading}><div><h2>Enrolled students</h2><p>Create certificates for students who have completed their LMS course.</p></div><button type="button" className={styles.secondaryButton} onClick={() => setReload(value => value + 1)} disabled={loading || busy || Boolean(creating)}>Refresh students</button></div>
    <div className={styles.toolbar}><label className={styles.search}><span className={styles.visuallyHidden}>Search enrolled students</span><input value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} placeholder="Search student, email or course" /></label></div>
    <div className={styles.lmsDesignPicker}>
      <label className={styles.field}><span>Design for new LMS certificates</span><select aria-label="LMS certificate design" value={designChoice} onChange={event => setDesignChoice(event.target.value)} disabled={Boolean(creating) || busy}><option value="standard">Standard LMS design</option><option value="saved" disabled={templateLoading || !template}>Saved custom design{templateLoading ? ' (loading...)' : !template ? ' (save a design first)' : ''}</option></select></label>
      <button type="button" className={styles.secondaryButton} onClick={editDesign} disabled={Boolean(creating) || busy || templateLoading || editing}>Edit LMS design</button>
      {templateError && <p role="alert">{templateError}</p>}
      {designChoice === 'saved' && template && <div className={styles.lmsDesignPreview}><CertificatePreview certificateData={{ studentName: rows[0]?.studentName || 'Student name', courseName: rows[0]?.courseName || 'LMS course', design: template.design, designData: template.designData }} /><small>Saved design preview. Each certificate uses the student name and LMS course. Already issued certificates keep their original design.</small></div>}
    </div>
    {editing && <section className={styles.lmsDesignPicker} aria-label="LMS certificate design editor">
      <fieldset className={styles.formFieldset} disabled={saving || Boolean(uploading)} style={{ width: '100%' }}>
        <h3>Edit LMS certificate design</h3><p>Save this design for new LMS course certificates.</p>
        <label className={styles.field}><span>Certificate type</span><select value={draftDesign} onChange={event => setDraftDesign(event.target.value)}><option value="classic">Academy certificate</option><option value="collaboration">College collaboration</option></select></label>
        <CertificateAppearance value={draftData} onChange={value => { setDraftData(value); if (value.layout === 'ramnad') setDraftDesign('collaboration'); }} onAsset={uploadAsset} uploading={uploading} previewData={{ studentName: rows[0]?.studentName || 'Student name', courseName: rows[0]?.courseName || 'LMS course', design: draftDesign, designData: draftData }} />
        {(draftDesign === 'collaboration' || draftData.layout === 'ramnad') && <div className={styles.formGrid}>
          {[['collegeName', 'College name'], ['department', 'Department'], ['hours', 'Course hours'], ['academicYear', 'Academic year']].map(([key, label]) => <label key={key} className={styles.field}><span>{label}</span><input value={draftData[key] || ''} maxLength={180} onChange={event => setDraftData(previous => ({ ...previous, [key]: event.target.value }))} /></label>)}
          <label className={styles.field}><span>College logo</span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={event => uploadAsset('collegeLogoUrl', event)} /></label>
        </div>}
        <div className={styles.rowActions}><button type="button" className={styles.primaryButton} onClick={saveDesign}>{saving ? 'Saving...' : 'Save LMS design'}</button><button type="button" className={styles.secondaryButton} onClick={() => setEditing(false)}>Cancel design changes</button></div>
      </fieldset>
    </section>}
    {error && <p role="alert" className={styles.errorState}>{error}</p>}
    <div className={styles.tableWrap} aria-busy={loading}>
      <table className={styles.recipientTable}>
        <thead><tr><th>Student</th><th>Email</th><th>LMS course</th><th>Completion</th><th>Certificate status</th><th>Actions</th></tr></thead>
        <tbody>{loading ? <tr><td colSpan={6}>Loading enrolled students...</td></tr> : rows.map(row => <tr key={`${row.studentId}-${row.courseId}`}>
          <td>{row.studentName}</td><td>{row.email}</td><td>{row.courseName}</td><td>{row.completion}%</td>
          <td>{row.certificate ? <>Issued <small>{row.certificate.certificateId}</small></> : row.certificateEnabled === false ? 'Certificates disabled' : row.eligible ? 'Ready to create' : 'Course incomplete'}</td>
          <td><div className={styles.rowActions}>{row.certificate ? <><button type="button" className={styles.textButton} onClick={() => onPreview(row.certificate)} disabled={busy || Boolean(creating)}>Preview</button><button type="button" className={styles.secondaryButton} onClick={() => onDownload(row.certificate)} disabled={busy || Boolean(creating)}>Download PDF</button></> : <button type="button" className={styles.primaryButton} disabled={!row.eligible || busy || Boolean(creating) || editing} onClick={() => create(row)}>{creating === `${row.studentId}-${row.courseId}` ? 'Creating...' : 'Create certificate'}</button>}</div></td>
        </tr>)}</tbody>
      </table>
      {!loading && !rows.length && !error && <p className={styles.emptyState}>No enrolled students found.</p>}
    </div>
    <div className={styles.pagination}><button type="button" className={styles.secondaryButton} disabled={page <= 1 || loading || Boolean(creating)} onClick={() => setPage(value => value - 1)}>Previous students</button><span>Page {page} of {pages}</span><button type="button" className={styles.secondaryButton} disabled={page >= pages || loading || Boolean(creating)} onClick={() => setPage(value => value + 1)}>Next students</button></div>
  </section>;
}
LmsCertificateStudents.propTypes = { token: PropTypes.string.isRequired, onPreview: PropTypes.func.isRequired, onDownload: PropTypes.func.isRequired, onIssued: PropTypes.func.isRequired, busy: PropTypes.bool };
