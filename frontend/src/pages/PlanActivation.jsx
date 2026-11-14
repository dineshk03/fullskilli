import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import PlanActivation from '../components/core/PlanActivation';
import { toast } from 'react-hot-toast';
const PlanActivationPage = () => {
  const {
    user
  } = useSelector(state => state.profile);
  const navigate = useNavigate();
  const [userPid, setUserPid] = useState(null);
  useEffect(() => {
    // Get user PID from user data or URL params
    const getPid = () => {
      // Check if PID is in URL params
      const urlParams = new URLSearchParams(window.location.search);
      const urlPid = urlParams.get('pid');
      if (urlPid) {
        return urlPid;
      }

      // Check if user has PID in their profile
      if (user?.pid) {
        return user.pid;
      }

      // Check if user ID can be used as PID
      if (user?._id) {
        return user._id;
      }
      return null;
    };
    const pid = getPid();
    setUserPid(pid);
    if (!pid) {
      toast.error('User PID not found. Please login again.');
      navigate('/login');
    }
  }, [user, navigate]);
  const handleActivationSuccess = () => {
    toast.success('Activation successful! You can now access the LMS.');

    // Optionally redirect to dashboard after successful activation
    setTimeout(() => {
      navigate('/dashboard/plans');
    }, 2000);
  };
  const handleActivationError = error => {
    console.error('Activation error:', error);
    toast.error(error.response?.data?.message || 'Activation failed');
  };
  if (!userPid) {
    return <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>;
  }
  return <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <PlanActivation pid={userPid} courseId={new URLSearchParams(window.location.search).get('courseId')} onSuccess={handleActivationSuccess} onError={handleActivationError} redirectPath={new URLSearchParams(window.location.search).get('redirect') || '/dashboard'} />
      </div>
    </div>;
};
export default PlanActivationPage;
