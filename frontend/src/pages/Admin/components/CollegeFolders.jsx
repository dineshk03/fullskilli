import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { FiFolder, FiPlus, FiSearch, FiRefreshCw, FiUsers } from 'react-icons/fi';
import styles from './CertificateWorkspace.module.css';

export default function CollegeFolders({ colleges, loading, onOpen, onRefresh, onAdd }) {
  const [search, setSearch] = useState('');
  const visible = useMemo(() => colleges.filter(college => `${college.name} ${college.details || ''}`.toLowerCase().includes(search.trim().toLowerCase())), [colleges, search]);
  return <section className={styles.folderDashboard} aria-label="College certificate folders">
    <div className={styles.libraryHeading}><div><h2>College folders</h2><p>Open a college to find its certificates, search students, preview, download, or manage them.</p></div><div className={styles.folderActions}><button type="button" className={styles.primaryButton} onClick={onAdd}><FiPlus />Add college folder</button><button type="button" className={styles.iconButton} onClick={onRefresh} disabled={loading} aria-label="Refresh college folders"><FiRefreshCw /></button></div></div>
    <div className={styles.toolbar}><label className={styles.search}><span className={styles.visuallyHidden}>Search college folders</span><FiSearch /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search college folders…" /></label></div>
    <div className={styles.folderGrid}>{loading ? <p className={styles.folderEmpty}>Loading college folders…</p> : visible.map(college => <button type="button" className={styles.folderCard} key={college._id} onClick={() => onOpen(college)}><span className={styles.folderIcon}><FiFolder /></span><span><strong>{college.name}</strong><small>{college.details || 'Certificate folder'}</small></span><span className={styles.folderCount}><FiUsers /> {college.certificateCount || 0} certificate{college.certificateCount === 1 ? '' : 's'}</span><span className={styles.folderOpen}>Open folder →</span></button>)}</div>
    {!loading && !visible.length && <p className={styles.folderEmpty}>{search ? 'No college folder matches your search.' : 'No college folders yet. Select or add a college while creating a collaboration certificate.'}</p>}
  </section>;
}
CollegeFolders.propTypes = { colleges: PropTypes.array.isRequired, loading: PropTypes.bool, onOpen: PropTypes.func.isRequired, onRefresh: PropTypes.func.isRequired, onAdd: PropTypes.func.isRequired };
