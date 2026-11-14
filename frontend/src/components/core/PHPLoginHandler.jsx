import { PHP_BASE_URL } from '../../config/api';
import PropTypes from "prop-types";
import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setUser } from '../../slices/profileSlice';
import { setToken } from '../../slices/authSlice';
import phpIntegrationService from '../../services/phpIntegrationService';
import { toast } from 'react-hot-toast';
const PHPLoginHandler = ({
  children
}) => {
  const dispatch = useDispatch();
  const {
    token
  } = useSelector(state => state.auth);
  const [phpSessionChecked, setPhpSessionChecked] = useState(false);
  useEffect(() => {
    // An existing LMS session must never wait for, or be replaced by, a portal session.
    if (token || !PHP_BASE_URL) {
      setPhpSessionChecked(true);
      return undefined;
    }
    const phpToken = localStorage.getItem('php_token') || getCookie('php_session');
    if (!phpToken) {
      setPhpSessionChecked(true);
      return undefined;
    }
    const controller = new AbortController();
    let cancelled = false;
    const timeout = setTimeout(() => controller.abort(), 5000);
    const checkPHPSession = async () => {
    try {
        // Validate PHP session
        const response = await fetch(`${PHP_BASE_URL}/api/user/validate-session`, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${phpToken}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user && !cancelled && !controller.signal.aborted) {
            // Auto-login user from PHP session
            dispatch(setToken(phpToken));
            dispatch(setUser(data.user));
            toast.success('Logged in from PHP website');
          }
        }
    } catch (error) {
      if (!controller.signal.aborted) console.error('PHP session check failed:', error);
    } finally {
      clearTimeout(timeout);
      if (!cancelled) setPhpSessionChecked(true);
    }
    };
    void checkPHPSession();
    return () => {
      cancelled = true;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [dispatch, token]);
  useEffect(() => {
    if (!token || !phpSessionChecked || !PHP_BASE_URL) return undefined;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    // Portal synchronization is optional background work, never a page-loading gate.
    void phpIntegrationService.initializePHPSession(token, { signal: controller.signal }).catch(error => {
      if (!controller.signal.aborted) console.error('PHP integration failed:', error);
    }).finally(() => clearTimeout(timeout));
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [token, phpSessionChecked]);
  return <>{children}</>;
};

const getCookie = name => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
};
export default PHPLoginHandler;
PHPLoginHandler.propTypes = {
  "children": PropTypes.node
};
