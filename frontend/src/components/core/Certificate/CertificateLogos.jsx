import PropTypes from 'prop-types';

import { logoPlacement } from './certificateLogoPlacement';

export default function CertificateLogos({ data, collaboration }) {
  return <>{['academy', 'college', 'third'].map(role => {
    if (data[`show${role[0].toUpperCase()}${role.slice(1)}Logo`] === false) return null;
    if (role === 'college' && (!collaboration || !data.collegeLogoUrl)) return null;
    if (role === 'third' && !data.thirdLogoUrl) return null;
    const placement = logoPlacement(data, role);
    return <img key={role} data-certificate-logo={role} src={data[`${role}LogoUrl`] || '/beejalogo.png'} alt={role === 'academy' ? 'Academy logo' : role === 'third' ? 'Third logo' : 'College logo'} style={{ position: 'absolute', left: placement.X, top: placement.Y, width: placement.Width, height: placement.Height, objectFit: 'contain', zIndex: 2 }} />;
  })}</>;
}
CertificateLogos.propTypes = { data: PropTypes.object.isRequired, collaboration: PropTypes.bool };
