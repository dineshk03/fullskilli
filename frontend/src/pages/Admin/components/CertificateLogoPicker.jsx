import PropTypes from 'prop-types';
import styles from './CertificateWorkspace.module.css';

export default function CertificateLogoPicker({ data, role = 'academy', onChange, onAsset, uploading }) {
  const key = `${role}LogoUrl`;
  const visibilityKey = `show${role[0].toUpperCase()}${role.slice(1)}Logo`;
  const visible = data[visibilityKey] !== false && (role !== 'third' || Boolean(data[key]));
  const label = role === 'academy' ? 'Organization' : role === 'third' ? 'Third' : 'College';
  return <div className={styles.logoPicker}>
    <h4>{label} logo</h4>
    <div className={styles.logoChoices}>
      <button type="button" className={`${styles.logoChoice} ${!visible ? styles.logoChoiceSelected : ''}`} aria-label={`No ${label.toLowerCase()} logo`} aria-pressed={!visible} disabled={Boolean(uploading)} onClick={() => onChange({ ...data, [visibilityKey]: false, layoutVersion: 2 })}><span>No logo</span></button>
      {role === 'academy' && <button type="button" className={`${styles.logoChoice} ${visible && !data[key] ? styles.logoChoiceSelected : ''}`} aria-pressed={visible && !data[key]} disabled={Boolean(uploading)} onClick={() => onChange({ ...data, [key]: '', [visibilityKey]: true, useDefaultAcademyLogo: true, layoutVersion: 2 })}><img src="/beejalogo.png" alt="Default Beeja logo" /><span>Default Beeja logo</span></button>}
      {data[key] && <button type="button" className={`${styles.logoChoice} ${visible ? styles.logoChoiceSelected : ''}`} aria-pressed={visible} disabled={Boolean(uploading)} onClick={() => onChange({ ...data, [visibilityKey]: true, layoutVersion: 2 })}><img src={data[key]} alt={`Selected ${label.toLowerCase()} logo`} /><span>{visible ? 'Selected logo' : 'Use uploaded logo'}</span></button>}
      <label className={styles.logoUpload}><span>{uploading === key ? 'Uploading logo...' : data[key] ? 'Choose a different logo' : 'Upload your logo'}</span><input type="file" aria-label={`Choose ${label.toLowerCase()} logo`} accept="image/png,image/jpeg,image/webp" disabled={Boolean(uploading)} onChange={event => onAsset(key, event)} /><small>PNG, JPG or WebP · Up to 2 MB</small></label>
    </div>
  </div>;
}
CertificateLogoPicker.propTypes = { data: PropTypes.object.isRequired, role: PropTypes.oneOf(['academy', 'college', 'third']), onChange: PropTypes.func.isRequired, onAsset: PropTypes.func.isRequired, uploading: PropTypes.string };
