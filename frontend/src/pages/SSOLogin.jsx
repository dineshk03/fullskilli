import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setToken } from '../slices/authSlice';
import { setUser } from '../slices/profileSlice';
import toast from 'react-hot-toast';
import { apiConnector } from '../services/apiConnector';
import { endpoints } from '../services/apis';
const SSOLogin = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    const handleSSOLogin = async () => {
      try {
        // Get parameters from URL
        const ssoToken = searchParams.get('sso_token');
        const email = searchParams.get('email');
        const firstName = searchParams.get('firstName');
        const lastName = searchParams.get('lastName');
        const courseId = searchParams.get('courseId');

        // Validate required parameters
        if (!ssoToken || !email) {
          setError('Invalid SSO parameters. Please try again from skilli.jobs');
          setLoading(false);
          return;
        }

        // Show loading toast
        const toastId = toast.loading('Authenticating...');

        // Call the SSO login API
        const response = await apiConnector('POST', endpoints.EXTERNAL_SSO_LOGIN_API, {
          token: ssoToken,
          email: email,
          firstName: firstName || '',
          lastName: lastName || '',
          courseId: courseId || ''
        });
        toast.dismiss(toastId);
        if (response.data.success) {
          // Store token and user data
          dispatch(setToken(response.data.token));
          dispatch(setUser(response.data.user));

          // Store in localStorage
          localStorage.setItem('user', JSON.stringify(response.data.user));

          // Show success message
          toast.success(response.data.message || 'Login successful!');

          // Redirect to appropriate page
          if (response.data.redirectUrl) {
            // Extract the path from the full URL
            const url = new URL(response.data.redirectUrl);
            navigate(url.pathname);
          } else if (courseId) {
            navigate(`/courses/${courseId}`);
          } else {
            navigate('/dashboard/my-profile');
          }
        } else {
          setError(response.data.message || 'Authentication failed');
          toast.error(response.data.message || 'Authentication failed');
          setLoading(false);
        }
      } catch (error) {
        console.error('SSO Login Error:', error);
        setError(error.response?.data?.message || 'Authentication failed. Please try again.');
        toast.error(error.response?.data?.message || 'Authentication failed');
        setLoading(false);
      }
    };
    handleSSOLogin();
  }, [searchParams, navigate, dispatch]);
  return <div className="min-h-screen flex items-center justify-center bg-richblack-900">
      <div className="max-w-md w-full p-8 bg-richblack-800 rounded-lg shadow-lg">
        {loading ? <div className="text-center">
            <div className="spinner-border animate-spin inline-block w-12 h-12 border-4 border-yellow-50 border-t-transparent rounded-full mb-4"></div>
            <h2 className="text-2xl font-semibold text-richblack-5 mb-2">
              Authenticating...
            </h2>
            <p className="text-richblack-100">
              Please wait while we log you in from skilli.jobs
            </p>
          </div> : error ? <div className="text-center">
            <div className="mb-4">
              <svg className="w-16 h-16 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-richblack-5 mb-2">
              Authentication Failed
            </h2>
            <p className="text-richblack-100 mb-6">{error}</p>
            <div className="space-y-3">
              <button onClick={() => navigate('/login')} className="w-full bg-yellow-50 text-richblack-900 py-2 px-4 rounded-md hover:bg-yellow-100 transition-colors">
                Go to Login Page
              </button>
              <button onClick={() => window.location.href = 'https://skilli.jobs'} className="w-full bg-richblack-700 text-richblack-5 py-2 px-4 rounded-md hover:bg-richblack-600 transition-colors">
                Return to skilli.jobs
              </button>
            </div>
          </div> : null}
      </div>
    </div>;
};
export default SSOLogin;
