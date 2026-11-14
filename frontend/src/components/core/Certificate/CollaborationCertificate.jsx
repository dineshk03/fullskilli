import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import QRCode from 'qrcode';
import { getCertificateVerificationUrl } from '../../../utils/certificateVerification';
const navy = '#292d5c';
const blue = '#55a9df';
export default function CollaborationCertificate({
  certificateData
}) {
  const data = certificateData?.designData || {};
  const [qr, setQr] = useState('');
  useEffect(() => {
    if (!certificateData?.certificateId) return;
    QRCode.toDataURL(getCertificateVerificationUrl(certificateData.certificateId)).then(setQr).catch(() => setQr(''));
  }, [certificateData?.certificateId]);
  const academyLength = data.academyName?.length || 0;
  const collegeLength = data.collegeName?.length || 0;
  const bodyLength = (data.department?.length || 0) + collegeLength + (certificateData?.courseName?.length || 0);
  const bodyFontSize = bodyLength > 135 ? 16 : bodyLength > 100 ? 17 : 19;
  const corner = (top, left) => <div style={{
    position: 'absolute',
    [top]: 25,
    [left]: 25,
    width: 44,
    height: 44,
    border: `3px solid ${blue}`
  }}><span style={{
      position: 'absolute',
      [top]: 14,
      [left]: 14,
      width: 17,
      height: 17,
      border: `1px solid ${navy}`,
      display: 'block'
    }} /></div>;
  return <div style={{
    width: 1000,
    height: 700,
    boxSizing: 'border-box',
    background: '#fff',
    color: '#191c25',
    fontFamily: 'Arial, sans-serif',
    position: 'relative',
    overflow: 'hidden'
  }} aria-label="Collaboration certificate">
    <div style={{
      position: 'absolute',
      inset: 17,
      border: `1px solid ${blue}`
    }} />
    <div style={{
      position: 'absolute',
      inset: '32px 31px',
      border: `3px solid ${blue}`
    }} />
    <div style={{
      position: 'absolute',
      inset: '47px 58px',
      borderTop: `3px solid ${blue}`,
      borderBottom: `3px solid ${blue}`
    }} />
    {corner('top', 'left')}{corner('top', 'right')}{corner('bottom', 'left')}{corner('bottom', 'right')}

    <header style={{
      position: 'absolute',
      top: 75,
      left: 75,
      right: 75,
      height: 190,
      textAlign: 'center'
    }}>
      <img src={data.academyLogoUrl} alt="Academy logo" style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: 105,
        height: 75,
        objectFit: 'contain'
      }} />
      <img src={data.collegeLogoUrl} alt="College logo" style={{
        position: 'absolute',
        right: 0,
        top: 0,
        width: 105,
        height: 75,
        objectFit: 'contain'
      }} />
      <div style={{
        width: 570,
        margin: '0 auto',
        minHeight: 32,
        fontSize: academyLength > 35 ? 18 : academyLength > 25 ? 21 : 26,
        lineHeight: 1.25,
        letterSpacing: academyLength > 30 ? 1.2 : 2.5,
        fontWeight: 800,
        color: navy,
        textTransform: 'uppercase',
        overflowWrap: 'break-word'
      }}>{data.academyName}</div>
      <div style={{
        marginTop: 6,
        fontSize: 13,
        letterSpacing: 3,
        fontWeight: 700
      }}>IN COLLABORATION WITH</div>
      <div style={{
        maxWidth: 790,
        margin: '12px auto 0',
        fontSize: collegeLength > 65 ? 18 : collegeLength > 40 ? 21 : 24,
        lineHeight: 1.28,
        letterSpacing: collegeLength > 50 ? 1.1 : 2.2,
        fontWeight: 800,
        color: navy,
        textTransform: 'uppercase',
        overflowWrap: 'break-word'
      }}>{data.collegeName}</div>
      {data.collegeDetails && <div style={{
        margin: '7px auto 0',
        maxWidth: 650,
        fontSize: 11,
        lineHeight: 1.2,
        letterSpacing: 1,
        whiteSpace: 'pre-line',
        fontWeight: 600
      }}>{data.collegeDetails}</div>}
    </header>

    <div style={{
      position: 'absolute',
      top: 268,
      left: 75,
      right: 75,
      textAlign: 'center',
      fontSize: 23,
      letterSpacing: 3,
      fontWeight: 800,
      color: navy
    }}>CERTIFICATE OF COMPLETION</div>
    <div style={{
      position: 'absolute',
      top: 302,
      left: 75,
      right: 75,
      textAlign: 'center',
      color: blue,
      fontSize: 15,
      letterSpacing: 3
    }}>◆◆◆◆◆</div>

    <div style={{
      position: 'absolute',
      top: 350,
      left: 92,
      right: 92,
      maxHeight: 205,
      fontSize: bodyFontSize,
      lineHeight: 1.55,
      letterSpacing: .1,
      overflowWrap: 'break-word'
    }}>
      <div>This is to certify that Mr./Ms. <strong style={{
          color: navy,
          borderBottom: '1px solid #777',
          display: 'inline-block',
          minWidth: 260,
          maxWidth: 360,
          textAlign: 'center',
          textTransform: 'uppercase',
          verticalAlign: 'bottom',
          overflowWrap: 'break-word'
        }}>{certificateData?.studentName}</strong> of</div>
      <div>{data.department}, {data.collegeName}</div>
      <div>has successfully completed the Value Added Course on <strong style={{
          color: navy
        }}>{certificateData?.courseName}</strong></div>
      <div>conducted for <strong style={{
          color: navy
        }}>{data.hours} hours</strong> during the academic year {data.academicYear}.</div>
    </div>

    <footer style={{
      position: 'absolute',
      bottom: 63,
      left: 92,
      right: 92,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'end',
      textAlign: 'center',
      color: '#555b66',
      fontSize: 12,
      fontWeight: 700
    }}>
      <div style={{
        width: 285,
        minHeight: 95
      }}><img src={data.principalSignatureUrl} alt="Principal signature" style={{
          width: 135,
          height: 36,
          objectFit: 'contain'
        }} /><div style={{
          borderTop: '1px solid #a1a5ac',
          margin: '0 auto 4px',
          width: 140
        }} /><div style={{
          fontSize: 11
        }}>{data.principalName}</div><div style={{
          fontSize: 10,
          marginTop: 2
        }}>{data.principalTitle || 'Principal'}</div><div style={{
          fontSize: 9,
          lineHeight: 1.2,
          marginTop: 2
        }}>{data.collegeName?.toUpperCase()}</div></div>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontSize: 9,
        fontWeight: 400
      }}>{qr && <img src={qr} alt="Certificate QR Code" style={{
          width: 49,
          height: 49
        }} />}<span>{certificateData?.certificateId}</span></div>
      <div style={{
        width: 285,
        minHeight: 95
      }}><img src={data.directorSignatureUrl} alt="Director signature" style={{
          width: 135,
          height: 36,
          objectFit: 'contain'
        }} /><div style={{
          borderTop: '1px solid #a1a5ac',
          margin: '0 auto 4px',
          width: 140
        }} /><div style={{
          fontSize: 11
        }}>{data.directorName}</div><div style={{
          fontSize: 10,
          marginTop: 2
        }}>{data.directorTitle || 'Director'}</div><div style={{
          fontSize: 9,
          lineHeight: 1.2,
          marginTop: 2
        }}>{data.academyName?.toUpperCase()}</div></div>
    </footer>
  </div>;
}
CollaborationCertificate.propTypes = {
  certificateData: PropTypes.shape({
    designData: PropTypes.object,
    certificateId: PropTypes.string,
    studentName: PropTypes.string,
    courseName: PropTypes.string
  })
};
