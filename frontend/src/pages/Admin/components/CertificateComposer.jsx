import { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { FiArrowLeft, FiArrowRight, FiAward, FiCheck, FiCheckCircle, FiDownload, FiFileText, FiImage, FiSave, FiShield, FiUploadCloud, FiUsers } from 'react-icons/fi';
import CertificatePreview from '../../../components/core/Certificate/CertificatePreview';
import { certificateDraftErrors, certificateNames, displayDate, uniqueCertificateNames } from './certificateWorkspaceUtils';
import styles from './CertificateWorkspace.module.css';
import CertificateAppearance from './CertificateAppearance';
import CertificateRecipients from './CertificateRecipients';
import CertificateModal from '../../../components/core/Certificate/CertificateModal';

const steps = ['Certificate details', 'Recipients', 'Review & issue'];

export default function CertificateComposer({ draft, colleges = [], onAddCollege, onChange, onImport, onAsset, onSaveTemplate, onSubmit, onCancel, busy, importing, uploading, savingTemplate }) {
  const [step, setStep] = useState(0);
  const [attempted, setAttempted] = useState(false);
  const [entryMode, setEntryMode] = useState('paste');
  const [fileName, setFileName] = useState('');
  const [expandedPreview, setExpandedPreview] = useState(false);
  const [previewRecipientIndex, setPreviewRecipientIndex] = useState(0);
  const form = useRef(null);
  const heading = useRef(null);
  const names = certificateNames(draft.nameText);
  const recipientRows = draft.recipientRows || [];
  const duplicates = names.length - uniqueCertificateNames(names).length;
  const errors = certificateDraftErrors(draft);
  const collaboration = draft.design === 'collaboration';
  const updateDesign = (key, value) => onChange('designData', { ...draft.designData, [key]: value });
  const selectCollege = event => {
    const collegeId = event.target.value;
    const college = colleges.find(item => item._id === collegeId);
    onChange('collegeId', collegeId);
    if (college) onChange('designData', { ...draft.designData, collegeName: college.name, ...(college.details ? { collegeDetails: college.details } : {}) });
  };
  const detailsErrors = Object.keys(errors).filter(key => key !== 'nameText');
  const move = next => { setStep(next); setAttempted(false); heading.current?.focus(); };
  const next = () => {
    setAttempted(true);
    if (!form.current.reportValidity()) return;
    if ((step === 0 && detailsErrors.length) || (step === 1 && errors.nameText)) return;
    move(step + 1);
  };
  const importFile = event => {
    setFileName(event.target.files?.[0]?.name || '');
    onImport(event);
  };
  const first = recipientRows[Math.min(previewRecipientIndex, recipientRows.length - 1)] || {};
  const previewData = { studentName: first.name || names[0] || 'Recipient name', courseName: first.courseName || draft.courseName || 'Your course or program', categoryName: draft.categoryName || 'General', completionDate: draft.completionDate, issuedDate: draft.completionDate, certificateId: '', design: draft.design, designData: { ...draft.designData, ...Object.fromEntries(['studentYear', 'department', 'collegeName', 'startDate', 'endDate', 'hours', 'academicYear'].filter(key => first[key] !== undefined && first[key] !== '').map(key => [key, first[key]])) } };
  const field = (key, label, options = {}) => <label className={styles.field} key={key}>
    <span id={`certificate-label-${key}`}>{label}{options.optional && <small>Optional</small>}</span>
    <input aria-labelledby={`certificate-label-${key}`} name={key} value={options.design ? draft.designData[key] : draft[key]} onChange={event => options.design ? updateDesign(key, event.target.value) : onChange(key, event.target.value)} required={!options.optional} type={options.type || 'text'} maxLength={options.maxLength || 180} min={options.type === 'number' ? 1 : undefined} max={options.type === 'number' ? 10000 : undefined} placeholder={options.placeholder} aria-invalid={attempted && Boolean(errors[key])} aria-describedby={attempted && errors[key] ? `certificate-error-${key}` : undefined} />
    {attempted && errors[key] && <small id={`certificate-error-${key}`} className={styles.fieldError}>{errors[key]}</small>}
  </label>;
  const asset = (key, label) => <div className={styles.asset} key={key}>
    <label className={styles.assetPicker}>
      {draft.designData[key] ? <img src={draft.designData[key]} alt={`${label} preview`} /> : <FiImage aria-hidden="true" />}
      <span><strong>{label}</strong><small>{uploading === key ? 'Uploading image…' : draft.designData[key] ? 'Click to replace image' : 'Upload PNG, JPG or WebP · Max 2 MB'}</small></span>
      <input type="file" aria-label={`Upload ${label.toLowerCase()}`} accept="image/png,image/jpeg,image/webp" disabled={Boolean(uploading)} onChange={event => onAsset(key, event)} className={styles.visuallyHidden} />
      {draft.designData[key] && <FiCheckCircle className={styles.successIcon} aria-hidden="true" />}
    </label>
    {attempted && errors[key] && <small className={styles.fieldError}>{errors[key]}</small>}
  </div>;

  return <div className={styles.composer}>
    <div className={styles.editor}>
      <div className={styles.stepper} aria-label="Certificate creation progress">
        {steps.map((label, index) => <button type="button" key={label} disabled={index > step || busy} onClick={() => index < step && move(index)} className={`${styles.step} ${index === step ? styles.currentStep : ''} ${index < step ? styles.completedStep : ''}`} aria-current={index === step ? 'step' : undefined} aria-label={`Step ${index + 1}: ${label}`}>
          <span>{index < step ? <FiCheck aria-hidden="true" /> : index + 1}</span><strong>{label}</strong>
        </button>)}
      </div>
      <form ref={form} noValidate onSubmit={event => {
        event.preventDefault();
        if (busy || uploading || importing) return;
        if (step < 2) { next(); return; }
        if (Object.keys(errors).length) { setAttempted(true); setStep(detailsErrors.length ? 0 : 1); return; }
        onSubmit(event);
      }}>
        <fieldset disabled={busy} className={styles.formFieldset}>
          <div key={step} className={styles.editorBody}>
            <div className={styles.sectionIntro}><span className={styles.eyebrow}>STEP {step + 1} OF 3</span><h2 ref={heading} tabIndex={-1}>{steps[step]}</h2><p>{['Choose a design and tell us what your recipients have accomplished.', 'Add one person or a whole group. Names appear exactly as you enter them.', 'Check the details before creating permanent, verifiable certificates.'][step]}</p></div>

            {step === 0 && <>
              <label className={styles.secondaryButton}>Import names & course details<input type="file" aria-label="Import certificate spreadsheet" className={styles.visuallyHidden} accept=".csv,.xlsx,.xls" onChange={importFile} disabled={importing} /></label><p className={styles.previewCaption}>Spreadsheet columns: Student Name, Year / class, Department, College Name, Course, Start Date, End Date, Hours, Academic Year. Only Student Name is required.</p>
              <div className={styles.designOptions} role="group" aria-label="Certificate design">
                {[['classic', 'Beeja Academy', 'A classic certificate for your courses and programs.', FiAward], ['collaboration', 'College collaboration', 'Co-branded with your college, logos and signatories.', FiUsers]].map(([value, title, description, Icon]) => <button type="button" key={value} aria-label={title} aria-describedby={`certificate-design-${value}`} aria-pressed={draft.design === value} onClick={() => onChange('design', value)} className={`${styles.designOption} ${draft.design === value ? styles.chosenDesign : ''}`}>
                  <span className={styles.designIcon}><Icon aria-hidden="true" /></span><strong>{title}</strong><small id={`certificate-design-${value}`}>{description}</small><span className={styles.radioIndicator}>{draft.design === value && <FiCheck aria-hidden="true" />}</span>
                </button>)}
              </div>
              <div className={styles.formGrid}>
                <div className={styles.fullWidth}>{field('courseName', 'Course or program title', { placeholder: 'e.g. Full Stack Web Development', maxLength: 160 })}</div>
                {field('studentYear', 'Default year / class', { design: true, optional: true, placeholder: 'e.g. III Year' })}
                <label className={styles.field}><span>College folder <small>Optional</small></span><select value={draft.collegeId || ''} onChange={selectCollege}><option value="">No college folder</option>{colleges.map(college => <option key={college._id} value={college._id}>{college.name}</option>)}</select><small>Optionally organize certificates in a college folder.</small><button type="button" className={styles.textButton} onClick={onAddCollege}>+ Add new college folder</button></label>
                {field('categoryName', 'Category', { optional: true, placeholder: 'e.g. Technology', maxLength: 120 })}
                {field('completionDate', 'Completion date', { type: 'date' })}
              </div>
              {attempted && (errors.title || errors.bodyText) && <p role="alert" className={styles.fieldError}>{errors.title || errors.bodyText}</p>}<CertificateAppearance previewData={previewData} value={draft.designData} onChange={value => { onChange('designData', value); if (value.layout === 'ramnad') onChange('design', 'collaboration'); }} onAsset={onAsset} uploading={uploading} />
              <button type="button" className={styles.textButton} onClick={onSaveTemplate} disabled={savingTemplate || Boolean(uploading)}><FiSave aria-hidden="true" />{savingTemplate ? 'Saving…' : 'Save certificate template'}</button>
              {collaboration && <div className={styles.collaborationFields}>
                <div className={styles.sectionHeading}><div><h3>Organizations & branding</h3><p>These details can be saved and reused next time.</p></div><button type="button" className={styles.textButton} onClick={onSaveTemplate} disabled={savingTemplate || Boolean(uploading)}><FiSave aria-hidden="true" />{savingTemplate ? 'Saving…' : 'Save settings'}</button></div>
                <div className={styles.formGrid}>
                  {field('academyName', 'Academy name', { design: true })}{field('collegeName', 'College name', { design: true, placeholder: 'Optional partner college' })}
                  {field('studentYear', 'Year / class', { design: true, optional: true, placeholder: 'e.g. III Year' })}{field('department', 'Department', { design: true, placeholder: 'e.g. Computer Science' })}{field('academicYear', 'Academic year', { design: true, placeholder: 'e.g. 2026–2027' })}
                  {field('hours', 'Course hours', { design: true, type: 'number', placeholder: 'e.g. 40' })}{field('collegeDetails', 'Affiliation or college details', { design: true, optional: true, maxLength: 300 })}
                  {asset('academyLogoUrl', 'Academy logo')}{asset('collegeLogoUrl', 'College logo')}
                </div>
                <h3 className={styles.signatoryHeading}>Signatories</h3>
                <div className={styles.signatories}>{[['principal', 'College signatory'], ['director', 'Academy signatory']].map(([role, title]) => <div className={styles.signatory} key={role}><h4>{title}</h4>{field(`${role}Name`, 'Full name', { design: true })}{field(`${role}Title`, 'Title or designation', { design: true })}{asset(`${role}SignatureUrl`, `${role === 'principal' ? 'College' : 'Academy'} signature`)}</div>)}</div>
              </div>}
            </>}

            {step === 1 && <>
              <div className={styles.entryTabs}><button type="button" aria-pressed={entryMode === 'paste'} className={entryMode === 'paste' ? styles.entryActive : ''} onClick={() => setEntryMode('paste')}><FiFileText aria-hidden="true" />Type or paste names</button><button type="button" aria-pressed={entryMode === 'upload'} className={entryMode === 'upload' ? styles.entryActive : ''} onClick={() => setEntryMode('upload')}><FiUploadCloud aria-hidden="true" />Upload a list</button></div>
              {!recipientRows.length && <button type="button" className={styles.secondaryButton} onClick={() => onChange('recipientRows', names.length ? names.map(name => ({ name })) : [{ name: '' }])}>Add recipient details (Year, department, dates…)</button>}
              {entryMode === 'upload' && <div className={styles.dropZone} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); if (!importing) importFile({ target: { files: event.dataTransfer.files, value: '' } }); }}>
                <FiUploadCloud aria-hidden="true" /><h3>{importing ? 'Reading your file…' : 'Drop your recipient list here'}</h3><p>CSV, XLSX or XLS · Up to 2 MB · 100 recipients per batch</p>
                <label className={styles.secondaryButton}>Choose a file<input type="file" aria-label="Upload recipient list" className={styles.visuallyHidden} accept=".csv,.xlsx,.xls" onChange={importFile} disabled={importing} /></label>
                {fileName && <span className={styles.fileName}>{fileName}</span>}
                <a href="/sample-certificate-names.csv" download className={styles.textButton}><FiDownload aria-hidden="true" />Download sample CSV</a>
              </div>}
              {recipientRows.length ? <CertificateRecipients rows={recipientRows} onChange={rows => onChange('recipientRows', rows)} defaults={{ ...draft.designData, courseName: draft.courseName }} /> : <label className={styles.field}><span>Recipient names<small>One full name per line</small></span><textarea name="nameText" value={draft.nameText} onChange={event => onChange('nameText', event.target.value)} rows={7} placeholder={'Ada Lovelace\nGrace Hopper\nAlan Turing'} aria-invalid={attempted && Boolean(errors.nameText)} aria-describedby="recipient-hint" /><small id="recipient-hint">For per-student year, department, college, course, dates, or academic year, upload a spreadsheet or add recipient rows.</small></label>}
              <div className={styles.recipientCount}><span className={names.length > 100 ? styles.fieldError : ''}><FiUsers aria-hidden="true" /><strong>{names.length}</strong> / 100 recipients</span>{names.length > 0 && <button type="button" className={styles.textButton} onClick={() => onChange('nameText', '')}>Clear names</button>}</div>
              {duplicates > 0 && <div className={styles.notice}><span>{duplicates} repeated name{duplicates === 1 ? '' : 's'} found. Keep them if they belong to different people.</span><button type="button" onClick={() => { if (recipientRows.length) { const seen = new Set(); onChange('recipientRows', recipientRows.filter(row => { const key = row.name.trim().toLocaleLowerCase(); if (seen.has(key)) return false; seen.add(key); return true; })); } else onChange('nameText', uniqueCertificateNames(names).join('\n')); }}>Remove repeats</button></div>}
              {attempted && errors.nameText && <p role="alert" className={styles.fieldError}>{errors.nameText}</p>}
            </>}

            {step === 2 && <>
              <div className={styles.reviewSummary}><FiCheckCircle aria-hidden="true" /><div><h3>Ready to recognize {names.length} {names.length === 1 ? 'achievement' : 'achievements'}</h3><p>Each recipient receives a unique certificate ID and verification link.</p></div></div>
              <dl className={styles.reviewDetails}><div><dt>Course / program</dt><dd>{draft.courseName}</dd></div><div><dt>College folder</dt><dd>{colleges.find(college => college._id === draft.collegeId)?.name || 'Not selected'}</dd></div><div><dt>Completion date</dt><dd>{displayDate(draft.completionDate)}</dd></div><div><dt>Design</dt><dd>{collaboration ? 'College collaboration' : 'Beeja Academy'}</dd></div><div><dt>Category</dt><dd>{draft.categoryName || 'General'}</dd></div></dl>
              <div className={styles.sectionHeading}><h3>Recipients <span className={styles.countBadge}>{names.length}</span></h3><button type="button" className={styles.textButton} onClick={() => move(1)}>Edit names</button></div>
              <ol className={styles.reviewNames}>{names.map((name, index) => <li key={`${index}-${name}`}><span>{index + 1}</span><div>{name}{recipientRows[index] && <small className={styles.recipientDetail}>{[recipientRows[index].studentYear || draft.designData.studentYear, recipientRows[index].department || draft.designData.department, recipientRows[index].collegeName || draft.designData.collegeName, recipientRows[index].courseName || draft.courseName, recipientRows[index].startDate || draft.designData.startDate, recipientRows[index].endDate || draft.designData.endDate, (recipientRows[index].hours || draft.designData.hours) && `${recipientRows[index].hours || draft.designData.hours} hours`, recipientRows[index].academicYear || draft.designData.academicYear].filter(Boolean).join(' · ')}</small>}</div></li>)}</ol>
              {duplicates > 0 && <p className={styles.notice}>Your list includes {duplicates} repeated {duplicates === 1 ? 'name' : 'names'}. Each line will create a separate certificate.</p>}
              <p className={styles.reviewNote}><FiShield aria-hidden="true" />Please check spelling carefully. Issued certificates are permanent records.</p>
            </>}
          </div>
          <div className={styles.editorFooter}><button type="button" className={styles.secondaryButton} onClick={() => step ? move(step - 1) : onCancel()}><FiArrowLeft aria-hidden="true" />{step ? 'Back' : 'Back to library'}</button><button type="submit" className={styles.primaryButton} disabled={busy || importing || Boolean(uploading)}>{busy ? 'Issuing certificates…' : step === 2 ? `Issue ${names.length} certificate${names.length === 1 ? '' : 's'}` : 'Continue'}{step === 2 ? <FiAward aria-hidden="true" /> : <FiArrowRight aria-hidden="true" />}</button></div>
        </fieldset>
      </form>
    </div>
    <aside className={styles.previewPanel}><div className={styles.previewHeading}><span className={styles.liveDot} />Live preview<span className={styles.draftBadge}>DRAFT</span></div><button type="button" className={styles.secondaryButton} onClick={() => setExpandedPreview(true)}>Expand certificate preview</button>{recipientRows.length > 0 && <label className={styles.field} style={{ margin: '12px 16px' }}><span>Preview recipient</span><select aria-label="Preview recipient" value={Math.min(previewRecipientIndex, recipientRows.length - 1)} onChange={event => setPreviewRecipientIndex(Number(event.target.value))}>{recipientRows.map((row, index) => <option key={index} value={index}>{row.name || `Recipient ${index + 1}`}</option>)}</select></label>}<div className={styles.previewCanvas}><CertificatePreview certificateData={previewData} /></div><p className={styles.previewCaption}>Updates as you enter details. A unique ID is added when issued.</p><div className={styles.previewSummary}><span><FiAward aria-hidden="true" />{collaboration ? 'College collaboration' : 'Beeja Academy'}</span><span><FiUsers aria-hidden="true" />{names.length ? `${names.length} recipient${names.length === 1 ? '' : 's'}` : 'No recipients yet'}</span><span><FiShield aria-hidden="true" />Publicly verifiable certificate</span></div><div className={styles.previewTip}><strong>A little recognition goes a long way.</strong><p>For a group, upload a spreadsheet to create up to 100 personalized certificates together.</p></div></aside>{expandedPreview && <CertificateModal certificateData={previewData} onClose={() => setExpandedPreview(false)} />}
  </div>;
}

CertificateComposer.propTypes = {
  draft: PropTypes.shape({ courseName: PropTypes.string.isRequired, categoryName: PropTypes.string.isRequired, completionDate: PropTypes.string.isRequired, design: PropTypes.string.isRequired, designData: PropTypes.object.isRequired, nameText: PropTypes.string.isRequired, collegeId: PropTypes.string, recipientRows: PropTypes.array }).isRequired,
  colleges: PropTypes.array, onAddCollege: PropTypes.func, onChange: PropTypes.func.isRequired, onImport: PropTypes.func.isRequired, onAsset: PropTypes.func.isRequired, onSaveTemplate: PropTypes.func.isRequired, onSubmit: PropTypes.func.isRequired, onCancel: PropTypes.func.isRequired,
  busy: PropTypes.bool, importing: PropTypes.bool, uploading: PropTypes.string, savingTemplate: PropTypes.bool,
};
