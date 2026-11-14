import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useProfileImage } from '../../hooks/useProfileImage';
import { logout } from '../../services/operations/authAPI';
const NavbarDebug = () => {
  const {
    user
  } = useProfileImage();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      dispatch(logout(navigate));
    }
  };
  return <div style={{
    position: 'fixed',
    top: '80px',
    right: '10px',
    background: 'black',
    color: 'lime',
    padding: '10px',
    borderRadius: '5px',
    fontSize: '12px',
    zIndex: 9999,
    fontFamily: 'monospace',
    maxWidth: '300px'
  }}>
      <div><strong>🔍 Debug Info:</strong></div>
      <div>createdVia: <strong>{user?.createdVia || 'undefined'}</strong></div>
      <div>isFromSkilliJobs: <strong>{user?.createdVia === 'php_website' ? 'YES ✅' : 'NO ❌'}</strong></div>
      <div>PID: <strong>{user?.pid || 'null'}</strong></div>
      <div>Email: {user?.email}</div>
      <div>Name: {user?.firstName} {user?.lastName}</div>
      <button onClick={handleLogout} style={{
      marginTop: '10px',
      padding: '5px 10px',
      background: '#ff4444',
      color: 'white',
      border: 'none',
      borderRadius: '3px',
      cursor: 'pointer',
      fontSize: '11px',
      fontWeight: 'bold',
      width: '100%'
    }}>
        🚪 Logout
      </button>
    </div>;
};
export default NavbarDebug;
