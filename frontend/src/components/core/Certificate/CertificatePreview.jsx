import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import CertificateDesign from './CertificateDesign';

export default function CertificatePreview({ certificateData }) {
  const container = useRef(null);
  const [width, setWidth] = useState(320);
  useEffect(() => {
    const node = container.current;
    const measure = () => setWidth(node.getBoundingClientRect().width || 320);
    measure();
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(measure);
      observer.observe(node);
      return () => observer.disconnect();
    }
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);
  return <div ref={container} style={{ width: '100%', minWidth: 0 }}>
    <div style={{ height: width * 0.7, position: 'relative', overflow: 'hidden', background: '#fff', borderRadius: 5 }}>
      <div style={{ width: 1000, height: 700, transform: `scale(${width / 1000})`, transformOrigin: 'top left' }}>
        <CertificateDesign certificateData={certificateData} />
      </div>
    </div>
  </div>;
}
CertificatePreview.propTypes = { certificateData: PropTypes.object.isRequired };
