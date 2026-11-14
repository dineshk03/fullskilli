import { certificateHeaderTop } from './certificateLogoPlacement';
import CertificateLogos from './CertificateLogos';
import SecondLogoWatermark from './SecondLogoWatermark';
import PurpleWorkshopCertificate from './PurpleWorkshopCertificate';
import { certificateTextStyle } from './certificateAppearance';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import QRCode from 'qrcode';
import { getCertificateVerificationUrl } from '../../../utils/certificateVerification';
import { certificateAppearance } from './certificateAppearance';
import RamnadCertificate from './RamnadCertificate';
import SAEnggCertificate from './SAEnggCertificate';
import { fitCertificateLayout } from '../../../utils/certificateLayout';

const fitted = { position: 'absolute', left: '50%', top: '50%', width: '100%', boxSizing: 'border-box', transform: 'translate(-50%, -50%)', transformOrigin: 'center' };
const slot = { position: 'relative', minHeight: 0, minWidth: 0 };

export default function CustomCertificate({ certificateData }) {
  const root = useRef(null);
  const data = { ...certificateAppearance, ...certificateData.designData };
  const [qr, setQr] = useState('');
  const id = certificateData.certificateId;
  const verificationUrl = getCertificateVerificationUrl(id);
  useEffect(() => {
    let active = true;
    setQr('');
    if (verificationUrl && data.showQr) QRCode.toDataURL(verificationUrl, { margin: 4, width: 300, errorCorrectionLevel: 'M', color: { dark: '#000000', light: '#ffffff' } }).then(value => { if (active) setQr(value); }).catch(() => {});
    return () => { active = false; };
  }, [verificationUrl, data.showQr]);

  // Reserve independent areas, fitting long content inside each rather than
  // allowing it to push the signatures or verification details off the page.
  useLayoutEffect(() => {
    let active = true;
    const fit = () => {
      if (!active || !root.current) return;
      fitCertificateLayout(root.current);
    };
    fit();
    document.fonts?.ready.then(fit);
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(fit) : null;
    if (root.current) observer?.observe(root.current);
    return () => { active = false; observer?.disconnect(); };
  }, [certificateData, qr]);

  const collaboration = certificateData.design === 'collaboration';
  const headerTop = certificateHeaderTop(data, collaboration, 40, 146, 854);
  const name = certificateData.studentName || 'Recipient name';
  const tokens = { course: certificateData.courseName || 'Your course or program', academy: data.academyName || 'Beeja Academy', college: data.collegeName || '', studentYear: data.studentYear || '', hours: data.hours || '', department: data.department || '', year: data.academicYear || '' };
  const body = data.bodyText.replace(/\{(course|academy|college|studentYear|hours|department|year)\}/g, (_, key) => tokens[key]);
  const date = certificateData.completionDate || certificateData.issuedDate;
  const parsed = date ? new Date(String(date).slice(0, 10) + 'T00:00:00') : null;
  const dateText = parsed && !Number.isNaN(parsed.getTime()) ? parsed.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Completion date';
  const signatory = (role, fallback) => <div data-layout-slot={`signature-${role}`} style={slot}><div style={{ ...fitted, textAlign: 'center', padding: '0 18px' }}>
    <div style={{ font: '600 7px/1.4 Arial, sans-serif', letterSpacing: 1.8, color: data.accentColor, marginBottom: 6 }}>AUTHORIZED SIGNATORY</div>
    <div style={{ position: 'relative', height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 5 }}>{data[`${role}SignatureUrl`] && <img src={data[`${role}SignatureUrl`]} alt={`${role === 'principal' ? 'College' : 'Academy'} authorized signature`} data-certificate-signature={role} style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: data[`${role}SignatureWidth`] || 142, height: data[`${role}SignatureHeight`] || 38, maxWidth: '100%', objectFit: 'contain' }} />}</div>
    <div aria-hidden="true" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, width: '78%', margin: '0 auto 8px', color: data.accentColor }}><span style={{ height: 1, background: data.accentColor, flex: 1, opacity: .65 }} /><span style={{ width: 4, height: 4, background: data.accentColor, transform: 'rotate(45deg)', flexShrink: 0 }} /><span style={{ height: 1, background: data.accentColor, flex: 1, opacity: .65 }} /></div>
    <div data-certificate-text={`${role}Name`} style={{ fontFamily: data.font === 'sans' ? 'Arial, sans-serif' : 'Georgia, serif', fontSize: 15, fontWeight: 600, lineHeight: 1.3, overflowWrap: 'anywhere' , ...certificateTextStyle(data, `${role}Name`) }}>{data[`${role}Name`] || fallback}</div>
    <div data-certificate-text={`${role}Title`} style={{ font: '11px/1.4 Arial, sans-serif', marginTop: 3, overflowWrap: 'anywhere' , ...certificateTextStyle(data, `${role}Title`) }}>{data[`${role}Title`] || 'Authorized signatory'}</div>
    {(collaboration || data[`${role}Organization`]) && <div data-certificate-text={`${role}Organization`} style={{ font: '500 7.5px/1.5 Arial, sans-serif', letterSpacing: .6, textTransform: 'uppercase', marginTop: 5, opacity: .72, overflowWrap: 'anywhere' , ...certificateTextStyle(data, `${role}Organization`) }}>{data[`${role}Organization`] || (role === 'principal' ? tokens.college : tokens.academy)}</div>}
  </div></div>;
  if (data.layout === 'workshop') return <PurpleWorkshopCertificate certificateData={certificateData} data={data} qr={qr} verificationUrl={verificationUrl} rootRef={root} />;
  if (data.layout === 'ramnad') return <RamnadCertificate certificateData={certificateData} data={data} qr={qr} verificationUrl={verificationUrl} rootRef={root} />;
  if (data.layout === 'saEngg') return <SAEnggCertificate certificateData={certificateData} data={data} qr={qr} verificationUrl={verificationUrl} rootRef={root} />;
  return <article ref={root} data-certificate-qr-required={Boolean(id && data.showQr)} aria-label="Customized certificate" style={{ width: 1000, height: 700, position: 'relative', boxSizing: 'border-box', overflow: 'hidden', background: data.backgroundColor, color: data.textColor, fontFamily: data.font === 'sans' ? 'Arial, sans-serif' : 'Georgia, serif' }}>
    <CertificateLogos data={data} collaboration={certificateData.design === 'collaboration'} />
    <SecondLogoWatermark data={data} />
    {data.layout === 'modern' && <><div style={{ position: 'absolute', inset: '0 auto 0 0', width: 18, background: data.accentColor }} /><div style={{ position: 'absolute', right: -55, top: -85, width: 240, height: 240, border: `36px solid ${data.accentColor}`, opacity: .12, transform: 'rotate(35deg)' }} /></>}
    {data.borderStyle !== 'none' && <div style={{ position: 'absolute', inset: 22, border: `${data.borderStyle === 'double' ? '6px double' : '2px solid'} ${data.accentColor}`, pointerEvents: 'none' }} />}
    {data.showWatermark && data.showAcademyLogo !== false && <img src={data.academyLogoUrl || '/beejalogo.png'} alt="" style={{ position: 'absolute', width: 270, height: 270, objectFit: 'contain', left: 365, top: 205, opacity: .045 }} />}
    <div style={{ position: 'relative', height: '100%', padding: `${headerTop}px 58px 38px`, display: 'grid', gridTemplateRows: '76px minmax(0, 1fr) 132px 84px', gap: 12, textAlign: 'center', boxSizing: 'border-box' }}>
      <header data-layout-slot="header" style={slot}><div style={{ ...fitted, display: 'grid', gridTemplateColumns: '70px minmax(0, 1fr) 70px', gap: 18, alignItems: 'center' }}>
        <span />
        <div><div data-certificate-text={'academy'} style={{ font: '700 21px/1.3 Arial, sans-serif', overflowWrap: 'anywhere' , ...certificateTextStyle(data, 'academy') }}>{tokens.academy}</div>{collaboration && <div data-certificate-text={'collaboration'} style={{ font: '13px/1.4 Arial, sans-serif', marginTop: 6, overflowWrap: 'anywhere' , ...certificateTextStyle(data, 'collaboration') }}>In collaboration with {tokens.college}</div>}</div>
        {collaboration && data.collegeLogoUrl ? <span /> : <span />}
      </div></header>
      <section data-layout-slot="achievement" style={slot}><div style={fitted}>
        <h1 data-certificate-text={'heading'} style={{ margin: '0 0 6px', fontSize: data.title.length > 25 ? 30 : 43, letterSpacing: 4, lineHeight: 1.2, fontWeight: 500, overflowWrap: 'anywhere', ...certificateTextStyle(data, 'heading') }}>{data.title}</h1>
        <div data-certificate-text={'subtitle'} style={{ color: data.accentColor, font: '600 12px/1.5 Arial, sans-serif', letterSpacing: 3, overflowWrap: 'anywhere' , ...certificateTextStyle(data, 'subtitle') }}>{data.subtitle}</div>
        <div style={{ width: 65, height: 2, background: data.accentColor, margin: '15px auto' }} />
        <p data-certificate-text={'introduction'} style={{ margin: 0, font: '14px/1.5 Arial, sans-serif', overflowWrap: 'anywhere' , ...certificateTextStyle(data, 'introduction') }}>{data.introduction}</p>
        <h2 data-certificate-text={'recipient'} style={{ margin: '12px 0 13px', fontSize: Math.min(data.nameSize, name.length > 65 ? 25 : name.length > 35 ? 34 : data.nameSize), lineHeight: 1.2, fontWeight: 500, color: data.accentColor, overflowWrap: 'anywhere', ...certificateTextStyle(data, 'recipient') }}>{name}</h2>
        <p data-certificate-text={'body'} style={{ margin: '0 auto', maxWidth: 760, font: `${body.length > 350 ? 13 : 16}px/1.6 Arial, sans-serif`, whiteSpace: 'pre-line', overflowWrap: 'anywhere', ...certificateTextStyle(data, 'body') }}>{body}</p>
        {(collaboration || data.department || data.hours || data.academicYear) && <p style={{ font: '11px/1.5 Arial, sans-serif', margin: '10px 0 0', overflowWrap: 'anywhere' }}>{[data.department, data.hours && `${data.hours} hours`, data.academicYear, data.collegeDetails].filter(Boolean).join(' · ')}</p>}
      </div></section>
      <section aria-label="Certificate authorization" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 116px minmax(0, 1fr)', columnGap: 38, minHeight: 0 }}>
        {collaboration || data.principalName ? signatory('principal', 'College representative') : <div data-layout-slot="date" style={slot}><div style={{ ...fitted, textAlign: 'left', font: '12px/1.7 Arial, sans-serif' }}><span style={{ color: data.accentColor, fontSize: 10, letterSpacing: 2 }}>COMPLETED ON</span><br />{dateText}</div></div>}
        <div style={{ display: 'grid', placeItems: 'center' }}>{data.showSeal && <div aria-label="Achievement seal" style={{ width: 88, height: 88, boxSizing: 'border-box', border: `3px double ${data.accentColor}`, borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, color: data.accentColor }}><span style={{ fontSize: 28, lineHeight: 1 }}>★</span><span style={{ font: '700 7px/1.3 Arial, sans-serif', letterSpacing: .45 }}>EXCELLENCE</span></div>}</div>
        {signatory('director', tokens.academy)}
      </section>
      <footer data-layout-slot="footer" style={{ ...slot, borderTop: `1px solid ${data.accentColor}` }}><div data-certificate-text={'footer'} style={{ ...fitted, display: 'grid', gridTemplateColumns: data.showQr ? `minmax(0, 1fr) ${Math.max(130, (data.qrSize || 72) + 98)}px` : 'minmax(0, 1fr)', alignItems: 'center', gap: 24, paddingTop: 8, font: '10px/1.6 Arial, sans-serif', textAlign: 'left', ...certificateTextStyle(data, 'footer') }}>
        <div style={{ overflowWrap: 'anywhere' }}><div>{data.footerText}</div><div style={{ marginTop: 4 }}>Certificate ID: {id || 'Assigned when issued'}{collaboration && ` · ${dateText}`}</div></div>
        {data.showQr && <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'end' }}><span>Scan to verify<br />authenticity</span>{qr ? <a href={verificationUrl} target="_blank" rel="noopener noreferrer" aria-label="Verify this certificate" style={{ display: 'block', width: data.qrSize || 72, height: data.qrSize || 72, flexShrink: 0 }}><img src={qr} alt="Certificate verification QR code" style={{ display: 'block', width: data.qrSize || 72, height: data.qrSize || 72, background: '#fff' }} /></a> : <span style={{ width: data.qrSize || 72, height: data.qrSize || 72, boxSizing: 'border-box', flexShrink: 0, border: `1px dashed ${data.accentColor}`, display: 'grid', placeItems: 'center', fontSize: 9 }}>QR</span>}</div>}
      </div></footer>
    </div>
  </article>;
}
CustomCertificate.propTypes = { certificateData: PropTypes.object.isRequired };
