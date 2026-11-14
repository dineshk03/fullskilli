import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setToken } from '../slices/authSlice';
import { setUser } from '../slices/profileSlice';
import toast from 'react-hot-toast';
const PIDLogin = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    const handlePIDLogin = async () => {
      try {
        // Get PID and token from URL parameters
        const pid = searchParams.get('pid');
        const token = searchParams.get('token');
        if (!pid || !token) {
          setError('Missing PID or token');
          toast.error('Invalid login link');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }
        console.log('PID Login - PID:', pid);

        // Call the login-by-pid API
        const response = await fetch(`${import.meta.env.VITE_REACT_APP_BASE_URL}/auth/login-by-pid`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            pid,
            token
          })
        });
        const data = await response.json();
        if (data.success) {
          // Store token and user data
          dispatch(setToken(data.token));
          dispatch(setUser(data.user));

          // Store in localStorage
          localStorage.setItem('user', JSON.stringify(data.user));
          toast.success('Login successful! Welcome to Skilli');

          // Get redirect parameter or default to courses
          const redirectTo = searchParams.get('redirect') || '/courses';

          // Redirect to specified page or courses
          setTimeout(() => {
            navigate(redirectTo);
          }, 1000);
        } else {
          setError(data.message || 'Login failed');
          toast.error(data.message || 'Login failed');
          setTimeout(() => navigate('/login'), 2000);
        }
      } catch (err) {
        console.error('PID Login Error:', err);
        setError('An error occurred during login');
        toast.error('Login failed. Please try again.');
        setTimeout(() => navigate('/login'), 2000);
      } finally {
        setLoading(false);
      }
    };
    handlePIDLogin();
  }, [searchParams, navigate, dispatch]);
  return <div className="flex min-h-screen items-center justify-center bg-richblack-900">
            <div className="w-full max-w-md rounded-lg bg-richblack-800 p-8 text-center shadow-lg">
                {loading ? <div className="space-y-4">
                        <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-yellow-50 border-t-transparent"></div>
                        <h2 className="text-2xl font-semibold text-richblack-5">
                            Logging you in...
                        </h2>
                        <p className="text-richblack-200">
                            Please wait while we authenticate your account
                        </p>
                    </div> : error ? <div className="space-y-4">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
                            <svg className="h-8 w-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-semibold text-richblack-5">
                            Login Failed
                        </h2>
                        <p className="text-richblack-200">{error}</p>
                        <p className="text-sm text-richblack-300">
                            Redirecting to login page...
                        </p>
                    </div> : <div className="space-y-4">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                            <svg className="h-8 w-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-semibold text-richblack-5">
                            Welcome to Skilli!
                        </h2>
                        <p className="text-richblack-200">
                            Redirecting to courses...
                        </p>
                    </div>}
            </div>
        </div>;
};
export default PIDLogin;
