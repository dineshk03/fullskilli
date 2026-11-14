import PropTypes from 'prop-types';
import { secondWatermarkPlacement } from './secondWatermarkPlacement';

export default function SecondLogoWatermark({ data }) {
  if (!data.showSecondWatermark) return null;
  const placement = secondWatermarkPlacement(data);
  return <img data-certificate-second-watermark src="/beejalogo.png" alt="" aria-hidden="true" style={{ position: 'absolute', left: placement.x, top: placement.y, width: placement.width, height: placement.height, objectFit: 'contain', opacity: placement.opacity, pointerEvents: 'none', zIndex: 0 }} />;
}
SecondLogoWatermark.propTypes = { data: PropTypes.object.isRequired };
