import PropTypes from 'prop-types';
import { secondWatermarkPlacement } from '../../../components/core/Certificate/secondWatermarkPlacement';
import styles from './CertificateWorkspace.module.css';

export default function SecondWatermarkControls({ data, onChange }) {
  const placement = secondWatermarkPlacement(data);
  const change = (key, value) => onChange({ ...data, [key]: value, layoutVersion: 2 });
  return <details className={styles.brandingDetails} open>
    <summary>Second logo watermark size & position</summary>
    <p>This adds one faint default Beeja logo without changing the existing watermark.</p>
    <div className={styles.formGrid}>
      <label className={styles.field}><span>Place watermark</span><select aria-label="Second watermark corner" value="" onChange={event => {
        const corner = event.target.value;
        onChange({ ...data, secondWatermarkX: corner === 'center' ? Math.round((1000 - placement.width) / 2) : corner.endsWith('right') ? 972 - placement.width : 28, secondWatermarkY: corner === 'center' ? Math.round((700 - placement.height) / 2) : corner.startsWith('bottom') ? 672 - placement.height : 22, layoutVersion: 2 });
      }}><option value="" disabled>Choose a position</option><option value="top-left">Top left</option><option value="top-right">Top right</option><option value="bottom-left">Bottom left</option><option value="bottom-right">Bottom right</option><option value="center">Center</option></select></label>
      <label className={styles.field}><span>Visibility: {Math.round(placement.opacity * 100)}%</span><input aria-label="Second watermark visibility" type="range" min={0.02} max={0.35} step={0.01} value={placement.opacity} onChange={event => change('secondWatermarkOpacity', Number(event.target.value))} /></label>
      {[['Width', 'Width', 20, 500, placement.width], ['Height', 'Height', 20, 400, placement.height], ['X', 'Horizontal position', 0, 980, placement.x], ['Y', 'Vertical position', 0, 680, placement.y]].map(([suffix, label, min, max, value]) => <label className={styles.field} key={suffix}><span>{label} (px)</span><input type="number" aria-label={`Second watermark ${label.toLowerCase()}`} min={min} max={max} value={value} onChange={event => { const next = Number(event.target.value); if (Number.isInteger(next) && next >= min && next <= max) change(`secondWatermark${suffix}`, next); }} /></label>)}
      <button type="button" className={styles.textButton} onClick={() => onChange({ ...Object.fromEntries(Object.entries(data).filter(([key]) => !key.startsWith('secondWatermark'))), showSecondWatermark: true })}>Reset second watermark</button>
    </div>
  </details>;
}
SecondWatermarkControls.propTypes = { data: PropTypes.object.isRequired, onChange: PropTypes.func.isRequired };
