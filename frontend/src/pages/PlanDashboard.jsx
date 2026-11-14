import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import PlanDashboardComponent from '../components/core/PlanDashboard';
import { toast } from 'react-hot-toast';
const PlanDashboardPage = () => {
  const {
    user
  } = useSelector(state => state.profile);
  const {
    token
  } = useSelector(state => state.auth);
  const navigate = useNavigate();
  const [userPid, setUserPid] = useState(null);
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Get user token from Redux
        if (!token) {
          toast.error('Please login to access your plan dashboard');
          navigate('/login');
          return;
        }

        // Get user PID
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
        if (!pid) {
          toast.error('User PID not found. Please login again.');
          navigate('/login');
          return;
        }
        setUserPid(pid);
      } catch (error) {
        console.error('Error initializing plan dashboard:', error);
        toast.error('Failed to load dashboard data');
      }
    };
    initializeData();
  }, [user, navigate, token]);
  if (!userPid || !token) {
    return <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>;
  }
  return <PlanDashboardComponent pid={userPid} token={token} />;
};
export default PlanDashboardPage;
