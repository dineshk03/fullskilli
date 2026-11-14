import { certificateHeaderTop } from './certificateLogoPlacement';
import CertificateLogos from './CertificateLogos';
import SecondLogoWatermark from './SecondLogoWatermark';
import { useId } from 'react';
import PropTypes from 'prop-types';
import { certificateTextStyle } from './certificateAppearance';

const fitted = { position: 'absolute', left: '50%', top: '50%', width: '100%', transform: 'translate(-50%, -50%)', boxSizing: 'border-box' };
export default function PurpleWorkshopCertificate({ certificateData, data, qr, verificationUrl, rootRef }) {
  const headerTop = certificateHeaderTop(data, certificateData.design === 'collaboration', 20, 195, 805);
  const contentScale = (520 - headerTop) / 500;
  const patternId = `academy-pattern-${useId().replace(/:/g, '')}`;
  const academy = data.academyName || 'Beeja Academy';
  const watermarkGap = data.watermarkSpacing || 62;
  const watermarkWidth = Math.max(48, academy.length * 3.1 + 7) * watermarkGap / 62;
  const watermarkRowHeight = 8 * watermarkGap / 62;
  const values = { course: certificateData.courseName || 'Your workshop or program', academy, college: data.collegeName || '', department: data.department || '', hours: data.hours || '', year: data.academicYear || '' };
  const message = data.bodyText.replace(/\{(course|academy|college|department|hours|year)\}/g, (_, key) => values[key]);
  const rawDate = certificateData.completionDate || certificateData.issuedDate;
  const date = rawDate ? new Date(`${String(rawDate).slice(0, 10)}T00:00:00`) : null;
  const dateText = date && !Number.isNaN(date.getTime()) ? `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}` : 'Completion date';
  const text = (key, content, style = {}, Tag = 'div') => <Tag data-certificate-text={key} style={{ ...style, ...certificateTextStyle(data, key) }}>{content}</Tag>;
  const area = (key, top, height, content, left = 90, width = 820) => <div data-layout-slot={key} style={{ position: 'absolute', top: top < 520 ? headerTop + (top - 20) * contentScale : top, left, height: top < 520 ? height * contentScale : height, width }}><div style={fitted}>{content}</div></div>;
  const signature = (role, left) => <div style={{ position: 'absolute', left, top: 564, width: 310, textAlign: 'center' }}>
    <div style={{ position: 'relative', height: 32 }}>{data[`${role}SignatureUrl`] && <img data-certificate-signature={role} src={data[`${role}SignatureUrl`]} alt={`${role === 'principal' ? 'College' : 'Academy'} authorized signature`} style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: data[`${role}SignatureWidth`] || 150, height: data[`${role}SignatureHeight`] || 52, maxWidth: '100%', objectFit: 'contain' }} />}</div>
    <div style={{ height: 2, background: data.accentColor, margin: '7px 20px' }} />
    <div data-layout-slot={`signature-${role}-name`} style={{ position: 'relative', height: 24 }}><div style={fitted}>{text(`${role}Name`, data[`${role}Name`] || 'Authorized signatory', { fontSize: 18, color: data.accentColor, lineHeight: 1.2 })}</div></div>
    <div data-layout-slot={`signature-${role}-title`} style={{ position: 'relative', height: 22 }}><div style={fitted}>{text(`${role}Title`, data[`${role}Title`] || 'Director', { fontSize: 16, textTransform: 'uppercase', lineHeight: 1.2 })}</div></div>
    <div data-layout-slot={`signature-${role}-organization`} style={{ position: 'relative', height: 25 }}><div style={fitted}>{text(`${role}Organization`, data[`${role}Organization`] || academy, { fontSize: 16, textTransform: 'uppercase', lineHeight: 1.2 })}</div></div>
  </div>;
  return <article ref={rootRef} aria-label="Customized certificate" data-certificate-layout="workshop" data-certificate-qr-required={Boolean(certificateData.certificateId && data.showQr)} style={{ position: 'relative', width: 1000, height: 700, overflow: 'hidden', background: data.backgroundColor, color: data.textColor, fontFamily: data.font === 'serif' ? 'Georgia, serif' : 'Arial, sans-serif', boxSizing: 'border-box', textAlign: 'center' }}>
    <CertificateLogos data={data} collaboration={certificateData.design === 'collaboration'} />
    <SecondLogoWatermark data={data} />
    <svg aria-hidden="true" width="1000" height="700" viewBox="0 0 1000 700" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <defs>
        <pattern id={patternId} width={watermarkWidth} height={watermarkRowHeight} patternUnits="userSpaceOnUse">
          <text x="1" y={watermarkRowHeight * 0.78} fill="#737b87" fontSize="5.5" fontWeight="500" fontFamily="Arial,sans-serif" letterSpacing=".25">{academy}</text>
        </pattern>
      </defs>
      {data.showWatermark && <rect data-certificate-watermark="horizontal-text" width="1000" height="700" fill={`url(#${patternId})`} opacity={data.watermarkOpacity ?? 0.18} />}
      <path d="M1000 0H795L1000 205Z M0 700V385L210 700Z" fill={data.accentColor} opacity=".09" />
      <path d="M995 -15L895 85Q850 130 895 175L1020 300 M-20 355L55 435Q100 480 55 525L-20 600" fill="none" stroke={data.accentColor} strokeWidth="14" />
    </svg>
    {area('header', 20, 100, text('academy', academy, { fontSize: 38, fontWeight: 700, lineHeight: 1.2, overflowWrap: 'anywhere' }), 195, 610)}
    {area('heading', 137, 134, <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 12 }}>
      {text('heading', data.title, { fontSize: 58, fontWeight: 800, margin: 0, color: data.accentColor, letterSpacing: 3, lineHeight: 1 }, 'h1')}
      {text('subtitle', data.subtitle, { fontSize: 24, fontWeight: 700, letterSpacing: 1.5, lineHeight: 1, margin: 0 })}
      {text('introduction', data.introduction, { fontSize: 20, fontWeight: 700, letterSpacing: 4, lineHeight: 1, margin: 0 })}
    </div>)}
    {area('recipient-name', 291, 84, <>{text('recipient', certificateData.studentName || 'Recipient name', { fontSize: data.nameSize, fontFamily: 'Georgia, serif', lineHeight: 1.2, overflowWrap: 'anywhere' })}<div style={{ width: 220, height: 3, background: '#bd83e5', margin: '13px auto 0' }} /></>)}
    {area('completion-message', 388, 78, text('body', message, { fontSize: 24, whiteSpace: 'pre-line', lineHeight: 1.5, overflowWrap: 'anywhere' }))}
    {data.showCompletionDate && area('date', 474, 40, text('date', <strong style={{ color: data.accentColor }}>{dateText}</strong>, { fontSize: 25, lineHeight: 1.4 }))}
    {signature('principal', 40)}{signature('director', 650)}
    {data.showQr && qr && <a href={verificationUrl} aria-label="Verify this certificate" style={{ position: 'absolute', top: 656 - (data.qrSize || 56), left: (1000 - (data.qrSize || 56)) / 2 }}><img src={qr} alt="Certificate verification QR code" style={{ width: data.qrSize || 56, height: data.qrSize || 56, background: '#fff' }} /></a>}
    {area('footer', 680, 15, text('footer', `${data.footerText ? `${data.footerText} · ` : ''}Certificate ID: ${certificateData.certificateId || 'Assigned when issued'}`, { fontSize: 9, color: '#555' }), 180, 640)}
  </article>;
}
PurpleWorkshopCertificate.propTypes = { certificateData: PropTypes.object.isRequired, data: PropTypes.object.isRequired, qr: PropTypes.string, verificationUrl: PropTypes.string, rootRef: PropTypes.object.isRequired };
