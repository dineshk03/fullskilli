import PropTypes from "prop-types";
import { useState, useEffect, useCallback } from 'react';
import { validateActivationForLMS, getLMSAccessURL, getPlanPurchase } from '../../services/planService';
import { FiBookOpen, FiLock, FiUnlock, FiLoader } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
const CourseAccessButton = ({
  courseId,
  courseTitle,
  pid,
  token,
  variant = 'primary',
  // 'primary', 'secondary', 'outline'
  size = 'medium',
  // 'small', 'medium', 'large'
  showStatus = true,
  onAccessGranted = null,
  onAccessDenied = null
}) => {
  const [accessStatus, setAccessStatus] = useState('checking'); // 'checking', 'granted', 'denied', 'requires_activation'
  const [isLoading, setIsLoading] = useState(false);
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [activationCode, setActivationCode] = useState('');
  const [lmsAccessUrl, setLmsAccessUrl] = useState(null);

  // Check course access on component mount

  const checkAccess = useCallback(async () => {
    if (!courseId || !pid) return;
    setAccessStatus('checking');
    try {
      // Get plan details using the new API
      const planData = await getPlanPurchase(pid, token);
      const activePlans = planData.plans?.filter(plan => plan.status === 'ACTIVE') || [];

      // Check if user has any course access available
      const hasCourseAccess = activePlans.some(plan => plan.courses && plan.courses.remaining > 0);
      if (hasCourseAccess) {
        setAccessStatus('granted');
      } else {
        setAccessStatus('requires_activation');
      }
    } catch (error) {
      console.error('Error checking course access:', error);
      setAccessStatus('denied');
    }
  }, [courseId, pid, token]);
  useEffect(() => {
    checkAccess();
  }, [checkAccess, courseId, pid, token]);
  const handleActivationSubmit = async e => {
    e.preventDefault();
    if (!activationCode.trim()) {
      toast.error('Please enter an activation code');
      return;
    }
    setIsLoading(true);
    try {
      // Validate activation code for LMS access
      const result = await validateActivationForLMS(pid, activationCode, courseId, token);

      // Get LMS access URL
      const lmsResult = await getLMSAccessURL(pid, activationCode, courseId, `/courses/${courseId}`, token);
      setLmsAccessUrl(lmsResult.access_url);
      setAccessStatus('granted');
      setShowActivationModal(false);
      setActivationCode('');
      if (onAccessGranted) {
        onAccessGranted(result, lmsResult);
      }
      toast.success('Course access granted successfully!');
    } catch (error) {
      console.error('Activation failed:', error);
      toast.error(error.response?.data?.message || 'Failed to activate course access');
      if (onAccessDenied) {
        onAccessDenied(error);
      }
    } finally {
      setIsLoading(false);
    }
  };
  const handleCourseAccess = () => {
    if (accessStatus === 'granted' && lmsAccessUrl) {
      // Open course in LMS
      window.open(lmsAccessUrl, '_blank');
    } else if (accessStatus === 'denied') {
      // Show activation modal
      setShowActivationModal(true);
    }
  };

  // Button styling based on variant and size
  const getButtonClasses = () => {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
    const sizeClasses = {
      small: 'px-3 py-1.5 text-sm',
      medium: 'px-4 py-2 text-sm',
      large: 'px-6 py-3 text-base'
    };
    const variantClasses = {
      primary: {
        granted: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
        denied: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
        checking: 'bg-gray-400 text-white cursor-not-allowed'
      },
      secondary: {
        granted: 'bg-green-100 text-green-800 hover:bg-green-200 focus:ring-green-500',
        denied: 'bg-blue-100 text-blue-800 hover:bg-blue-200 focus:ring-blue-500',
        checking: 'bg-gray-100 text-gray-500 cursor-not-allowed'
      },
      outline: {
        granted: 'border border-green-600 text-green-600 hover:bg-green-50 focus:ring-green-500',
        denied: 'border border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500',
        checking: 'border border-gray-300 text-gray-500 cursor-not-allowed'
      }
    };
    return `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant][accessStatus]}`;
  };
  const getButtonIcon = () => {
    if (isLoading) {
      return <FiLoader className="animate-spin mr-2" />;
    }
    switch (accessStatus) {
      case 'granted':
        return <FiUnlock className="mr-2" />;
      case 'denied':
        return <FiLock className="mr-2" />;
      case 'checking':
        return <FiLoader className="animate-spin mr-2" />;
      default:
        return <FiBookOpen className="mr-2" />;
    }
  };
  const getButtonText = () => {
    if (isLoading) return 'Loading...';
    switch (accessStatus) {
      case 'granted':
        return 'Access Course';
      case 'denied':
        return 'Activate Access';
      case 'checking':
        return 'Checking...';
      default:
        return 'Access Course';
    }
  };
  return <>
      {/* Main Button */}
      <button onClick={handleCourseAccess} disabled={accessStatus === 'checking' || isLoading} className={getButtonClasses()}>
        {getButtonIcon()}
        {getButtonText()}
      </button>

      {/* Status Indicator */}
      {showStatus && <div className="mt-2 text-xs">
          {accessStatus === 'granted' && <span className="text-green-600 flex items-center">
              <FiUnlock className="mr-1" />
              Access granted
            </span>}
          {accessStatus === 'denied' && <span className="text-blue-600 flex items-center">
              <FiLock className="mr-1" />
              Activation required
            </span>}
          {accessStatus === 'checking' && <span className="text-gray-500 flex items-center">
              <FiLoader className="animate-spin mr-1" />
              Checking access...
            </span>}
        </div>}

      {/* Activation Modal */}
      {showActivationModal && <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Activate Course Access
            </h3>
            
            <p className="text-gray-600 mb-4">
              Enter your activation code to access &quot;{courseTitle}&quot; in the LMS system.
            </p>

            <form onSubmit={handleActivationSubmit}>
              <div className="mb-4">
                <label htmlFor="activationCode" className="block text-sm font-medium text-gray-700 mb-2">
                  Activation Code
                </label>
                <input type="text" id="activationCode" value={activationCode} onChange={e => setActivationCode(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Enter your activation code" disabled={isLoading} autoFocus />
              </div>

              <div className="flex space-x-3">
                <button type="submit" disabled={isLoading || !activationCode.trim()} className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
                  {isLoading ? <>
                      <FiLoader className="animate-spin inline mr-2" />
                      Activating...
                    </> : 'Activate Access'}
                </button>
                
                <button type="button" onClick={() => {
              setShowActivationModal(false);
              setActivationCode('');
            }} disabled={isLoading} className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 disabled:bg-gray-400 disabled:cursor-not-allowed">
                  Cancel
                </button>
              </div>
            </form>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-800">
                <strong>Note:</strong> Activation codes are user-specific and cannot be shared. 
                Each activation provides access to specific courses based on your plan.
              </p>
            </div>
          </div>
        </div>}
    </>;
};
export default CourseAccessButton;
CourseAccessButton.propTypes = {
  "courseId": PropTypes.string,
  "courseTitle": PropTypes.string,
  "pid": PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  "token": PropTypes.string,
  "variant": PropTypes.string,
  "size": PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  "showStatus": PropTypes.bool,
  "onAccessGranted": PropTypes.func,
  "onAccessDenied": PropTypes.func
};
