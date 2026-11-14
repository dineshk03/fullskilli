import CleanInternshipCertificate from './CleanInternshipCertificate';
import CollaborationCertificate from './CollaborationCertificate';
import PropTypes from 'prop-types';
import CustomCertificate from './CustomCertificate';

export default function CertificateDesign({ certificateData }) {
  const appearance = certificateData?.designData;
  if (appearance?.layoutVersion === 2 || (appearance?.layout && appearance?.title)) return <CustomCertificate certificateData={certificateData} />;
  return certificateData?.design === 'collaboration'
    ? <CollaborationCertificate certificateData={certificateData} />
    : <CleanInternshipCertificate certificateData={certificateData} />;
}

CertificateDesign.propTypes = { certificateData: PropTypes.shape({ design: PropTypes.string, designData: PropTypes.shape({ layoutVersion: PropTypes.number, layout: PropTypes.string, title: PropTypes.string }) }) };
