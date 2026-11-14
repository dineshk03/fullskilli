import PropTypes from 'prop-types';
import CertificateLogos from './CertificateLogos';
import SecondLogoWatermark from './SecondLogoWatermark';
import { certificateTextStyle } from './certificateAppearance';

const slot = { position: 'relative', minHeight: 0, minWidth: 0 };

export default function SAEnggCertificate({ certificateData, data, qr, verificationUrl, rootRef }) {
  const academy = data.academyName || 'Beeja Academy';
  const college = data.collegeName || '';
  const values = {
    course: certificateData.courseName || 'Full Stack Development (Server Side / Back End)',
    academy,
    college,
    department: data.department || (certificateData.certificateId ? '' : 'Department'),
    // Keep the preview self-explanatory before a recipient value is entered.
    // Issued certificates still omit this placeholder when the field is blank.
    studentYear: data.studentYear || (certificateData.certificateId ? '' : 'Year / class'),
    hours: data.hours || '',
    year: data.academicYear || 'Academic year',
    startDate: data.startDate || 'Start date',
    endDate: data.endDate || 'End date',
  };
  const renderMessageLine = line => line.split(/(\{(?:course|academy|college|department|studentYear|hours|year|startDate|endDate)\})/g).map((part, index) => /^\{.*\}$/.test(part) ? <strong key={index} style={{ color: data.textColor }}>{values[part.slice(1, -1)]}</strong> : part);
  const bodyLines = data.bodyText.split('\n');
  const bodyLineStyle = key => {
    if (!data.linkAchievementLines) return certificateTextStyle(data, key);
    const { position, left, top, zIndex, ...style } = certificateTextStyle(data, key);
    return style;
  };
  const collegeHeadingGap = Math.min(80, Math.max(0, Number(data.collegeSpaceAfter ?? 12)));
  const headingBodyGap = Math.min(80, Math.max(0, Number(data.headingSpaceAfter ?? 12)));
  const signature = role => <div data-layout-slot={`signature-${role}`} style={{ textAlign: 'center', alignSelf: 'end', minWidth: 0 }}>
    <div style={{ height: 34, position: 'relative' }}>{data[`${role}SignatureUrl`] && <img src={data[`${role}SignatureUrl`]} alt="Authorized signature" data-certificate-signature={role} style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: data[`${role}SignatureWidth`] || 150, height: data[`${role}SignatureHeight`] || 34, objectFit: 'contain' }} />}</div>
    <div style={{ width: 142, maxWidth: '80%', borderTop: '1px solid #999ca4', margin: '0 auto 8px' }} />
    {data[`${role}Name`] && <div data-certificate-text={`${role}Name`} style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', ...certificateTextStyle(data, `${role}Name`) }}>{data[`${role}Name`]}</div>}
    <div data-certificate-text={`${role}Title`} style={{ fontSize: 11, fontWeight: 700, color: '#62636b', textTransform: 'uppercase', ...certificateTextStyle(data, `${role}Title`) }}>{data[`${role}Title`] || (role === 'principal' ? 'GM - Programs' : 'Director')}</div>
  </div>;

  return <article ref={rootRef} aria-label="Customized certificate" data-certificate-layout="sa-engg" data-certificate-college-heading-gap={collegeHeadingGap} data-certificate-heading-body-gap={headingBodyGap} data-certificate-qr-required={Boolean(certificateData.certificateId && data.showQr)} style={{ position: 'relative', width: 1000, height: 700, overflow: 'hidden', boxSizing: 'border-box', background: data.backgroundColor, color: '#14141b', fontFamily: 'Arial, sans-serif' }}>
    <CertificateLogos data={data} collaboration={certificateData.design === 'collaboration'} />
    <SecondLogoWatermark data={data} />
    {data.borderStyle !== 'none' && <><div style={{ position: 'absolute', inset: 19, border: `1px solid ${data.accentColor}` }} /><svg aria-hidden="true" viewBox="0 0 1000 700" style={{ position: 'absolute', inset: 0 }}><path d="M85 35 H915 V85 H965 V615 H915 V665 H85 V615 H35 V85 H85 Z" fill="none" stroke={data.accentColor} strokeWidth="3" />{['translate(0 0)', 'translate(1000 0) scale(-1 1)', 'translate(0 700) scale(1 -1)', 'translate(1000 700) scale(-1 -1)'].map(transform => <g key={transform} transform={transform}><rect x="45" y="45" width="20" height="20" fill="none" stroke={data.accentColor} strokeWidth="3" /><circle cx="55" cy="55" r="2" fill={data.accentColor} /><path d="M55 100 V55 H100" fill="none" stroke="#9b91d3" /></g>)}</svg></>}
    {data.showWatermark && <img src={data.academyLogoUrl || '/beejalogo.png'} alt="" style={{ position: 'absolute', left: 390, top: 245, width: 220, height: 220, objectFit: 'contain', opacity: .045 }} />}
    <div style={{ position: 'relative', height: '100%', padding: '40px 78px', boxSizing: 'border-box', display: 'grid', gridTemplateRows: `${160 + collegeHeadingGap}px ${70 + headingBodyGap}px minmax(0,1fr) 80px`, gap: 8 }}>
      <header style={{ position: 'relative', minWidth: 0 }}><div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, textAlign: 'center', textTransform: 'uppercase' }}>
        <div data-certificate-text="academy" style={{ color: data.textColor, fontSize: 28, lineHeight: 1.2, fontWeight: 700, letterSpacing: 2.2, overflowWrap: 'anywhere', ...certificateTextStyle(data, 'academy') }}>{academy}</div>
        {college && data.showCollaboration !== false && <><div data-certificate-text="collaboration" style={{ marginTop: 12, color: '#41414a', fontSize: 12, lineHeight: 1.3, fontWeight: 700, letterSpacing: 2.4, ...certificateTextStyle(data, 'collaboration') }}>In collaboration with</div>
        <div data-certificate-text="college" style={{ marginTop: 14, color: data.textColor, fontSize: college.length > 55 ? 23 : 28, lineHeight: 1.2, fontWeight: 700, letterSpacing: 2, overflowWrap: 'anywhere', ...certificateTextStyle(data, 'college'), marginBottom: 0 }}>{college}</div></>}
      </div></header>
      <section data-layout-slot="heading" style={{ ...slot, textAlign: 'center', zIndex: 3 }}><div style={{ position: 'absolute', left: '50%', top: '50%', width: '100%', transform: 'translate(-50%, -50%)', boxSizing: 'border-box' }}><h1 data-certificate-text="heading" style={{ position: 'relative', zIndex: 1, margin: 0, color: '#3b3b3d', fontSize: 34, lineHeight: 1.2, fontWeight: 700, letterSpacing: 4.2, whiteSpace: 'nowrap', ...certificateTextStyle(data, 'heading'), marginBottom: 0 }}>{data.title}</h1><div data-certificate-text="stars" aria-label="Blue stars decoration" style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: 5, marginTop: 15, padding: '4px 8px', ...certificateTextStyle(data, 'stars') }}>{Array.from({ length: 5 }, (_, index) => <span key={index} style={{ width: 5, height: 5, background: data.accentColor, transform: 'rotate(45deg)', pointerEvents: 'none' }} />)}</div></div></section>
      <section style={{ paddingTop: 22, fontSize: 19, lineHeight: 1.5 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'max-content minmax(190px,1fr) max-content', gap: 8, alignItems: 'end' }}><span data-certificate-text="introduction" style={certificateTextStyle(data, 'introduction')}>{data.introduction}</span><div style={{ borderBottom: '1px solid #4d4d55', textAlign: 'center', lineHeight: 1.35 }}><strong data-certificate-text="recipient" style={{ color: data.textColor, fontSize: Math.min(data.nameSize || 24, 30), ...certificateTextStyle(data, 'recipient') }}>{certificateData.studentName || 'Recipient name'}</strong></div><span>{values.studentYear ? <>of <strong data-certificate-text="studentYear" style={{ color: data.textColor, ...certificateTextStyle(data, 'studentYear') }}>{values.studentYear}</strong>,</> : 'of'}</span></div>
        {((data.showDepartment !== false && values.department) || (data.showRecipientCollege !== false && college)) && <p data-certificate-text="recipientDetails" style={{ margin: '12px 0 0', ...certificateTextStyle(data, 'recipientDetails') }}><strong style={{ color: data.textColor }}>{[data.showDepartment !== false && values.department, data.showRecipientCollege !== false && college].filter(Boolean).join(', ')}</strong></p>}
        <div style={{ marginTop: 8, ...certificateTextStyle(data, 'body') }}>{bodyLines.map((line, index) => { const key = `bodyLine${Math.min(index + 1, 4)}`; return <p key={`${key}-${index}`} data-certificate-text={key} style={{ margin: index ? '2px 0 0' : 0, whiteSpace: 'pre-line', ...bodyLineStyle(key) }}>{renderMessageLine(line)}</p>; })}</div>
      </section>
      <section aria-label="Certificate authorization" style={{ display: 'grid', gridTemplateColumns: '1fr 120px 1fr', gap: 25 }}>{signature('principal')}<div style={{ display: 'grid', placeItems: 'center' }}>{data.showQr && (qr ? <a href={verificationUrl} aria-label="Verify this certificate"><img src={qr} alt="Certificate verification QR code" style={{ width: data.qrSize || 64, height: data.qrSize || 64 }} /></a> : <span>QR after issue</span>)}</div>{signature('director')}</section>
    </div>
  </article>;
}

SAEnggCertificate.propTypes = { certificateData: PropTypes.object.isRequired, data: PropTypes.object.isRequired, qr: PropTypes.string, verificationUrl: PropTypes.string, rootRef: PropTypes.object.isRequired };
