import PropTypes from 'prop-types';
import { logoPlacement } from '../../../components/core/Certificate/certificateLogoPlacement';
import styles from './CertificateWorkspace.module.css';

export default function CertificateLogoControls({ data, role, onChange }) {
  const placement = logoPlacement(data, role);
  const update = (dimension, value) => onChange({ ...data, [`${role}Logo${dimension}`]: value, layoutVersion: 2 });
  return <div className={styles.formGrid}>
    <label className={styles.field}><span>Place logo</span><select aria-label={`${role} logo corner`} value="" onChange={event => {
      const corner = event.target.value;
      onChange({ ...data, [`${role}LogoX`]: corner.endsWith('center') ? Math.round((1000 - placement.Width) / 2) : corner.endsWith('right') ? 972 - placement.Width : 28, [`${role}LogoY`]: corner.startsWith('bottom') ? 672 - placement.Height : 22, layoutVersion: 2 });
    }}><option value="" disabled>Choose a position</option><option value="top-left">Top left</option><option value="top-center">Top center</option><option value="top-right">Top right</option><option value="bottom-left">Bottom left</option><option value="bottom-right">Bottom right</option></select></label>
    {[['Width', 'Width', 20, 400], ['Height', 'Height', 20, 250], ['X', 'Horizontal position', 0, 980], ['Y', 'Vertical position', 0, 680]].map(([dimension, label, min, max]) => <label className={styles.field} key={dimension}><span>{label} (px)</span><input type="number" aria-label={`${role} logo ${label.toLowerCase()}`} value={placement[dimension]} min={min} max={max} onChange={event => { const value = Number(event.target.value); if (Number.isInteger(value) && value >= min && value <= max) update(dimension, value); }} /></label>)}
    <button type="button" className={styles.textButton} onClick={() => onChange(Object.fromEntries(Object.entries(data).filter(([key]) => !['X', 'Y', 'Width', 'Height'].some(dimension => key === `${role}Logo${dimension}`))))}>Reset logo placement</button>
  </div>;
}
CertificateLogoControls.propTypes = { data: PropTypes.object.isRequired, role: PropTypes.oneOf(['academy', 'college', 'third']).isRequired, onChange: PropTypes.func.isRequired };
