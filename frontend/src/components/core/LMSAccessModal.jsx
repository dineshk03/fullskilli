import PropTypes from "prop-types";
import { useState } from 'react';
import { validateActivationForLMS, getLMSAccessURL } from '../../services/planService';
import { FiX, FiExternalLink, FiLoader, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
const LMSAccessModal = ({
  isOpen,
  onClose,
  pid,
  courseId = null,
  courseTitle = '',
  token,
  onSuccess = null
}) => {
  const [step, setStep] = useState('input'); // 'input', 'validating', 'success', 'error'
  const [activationCode, setActivationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [accessData, setAccessData] = useState(null);
  const [error, setError] = useState('');
  const handleSubmit = async e => {
    e.preventDefault();
    if (!activationCode.trim()) {
      setError('Please enter an activation code');
      return;
    }
    setIsLoading(true);
    setStep('validating');
    setError('');
    try {
      // Validate activation code for LMS access
      const result = await validateActivationForLMS(pid, activationCode, courseId, token);

      // Get LMS access URL
      const lmsResult = await getLMSAccessURL(pid, activationCode, courseId, `/courses/${courseId}`, token);
      setAccessData({
        planData: result,
        lmsData: lmsResult
      });
      setStep('success');
      if (onSuccess) {
        onSuccess(result, lmsResult);
      }
      toast.success('LMS access granted successfully!');
    } catch (error) {
      console.error('Activation failed:', error);
      setError(error.response?.data?.message || 'Failed to activate LMS access');
      setStep('error');
    } finally {
      setIsLoading(false);
    }
  };
  const handleOpenLMS = () => {
    if (accessData?.lmsData?.access_url) {
      window.open(accessData.lmsData.access_url, '_blank');
    }
  };
  const handleReset = () => {
    setStep('input');
    setActivationCode('');
    setAccessData(null);
    setError('');
  };
  const handleClose = () => {
    if (step === 'success') {
      // Allow closing after successful activation
      onClose();
    } else if (step === 'input' || step === 'error') {
      // Allow closing from input or error state
      onClose();
    }
    // Don't allow closing during validation
  };
  if (!isOpen) return null;
  return <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {step === 'success' ? 'Access Granted!' : 'Activate LMS Access'}
          </h2>
          <button onClick={handleClose} disabled={step === 'validating'} className="text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed">
            <FiX className="text-xl" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'input' && <div>
              {courseTitle && <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Course:</strong> {courseTitle}
                  </p>
                </div>}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="activationCode" className="block text-sm font-medium text-gray-700 mb-2">
                    Activation Code
                  </label>
                  <input type="text" id="activationCode" value={activationCode} onChange={e => setActivationCode(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Enter your activation code" autoFocus />
                </div>

                {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>}

                <div className="flex space-x-3">
                  <button type="submit" disabled={isLoading} className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
                    {isLoading ? <>
                        <FiLoader className="animate-spin inline mr-2" />
                        Validating...
                      </> : 'Activate Access'}
                  </button>
                  
                  <button type="button" onClick={handleClose} disabled={isLoading} className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 disabled:bg-gray-400 disabled:cursor-not-allowed">
                    Cancel
                  </button>
                </div>
              </form>

              <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-start">
                  <FiAlertCircle className="text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-yellow-800">
                    <p className="font-semibold mb-1">Important:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Activation codes are user-specific and cannot be shared</li>
                      <li>Each activation provides access based on your plan limits</li>
                      <li>Course usage will be tracked automatically</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>}

          {step === 'validating' && <div className="text-center py-8">
              <FiLoader className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Validating activation code...</p>
              <p className="text-sm text-gray-500 mt-2">Please wait while we verify your access</p>
            </div>}

          {step === 'success' && accessData && <div>
              <div className="text-center mb-6">
                <FiCheckCircle className="text-4xl text-green-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  LMS Access Activated!
                </h3>
                <p className="text-gray-600">
                  You now have access to {courseTitle || 'the LMS system'}
                </p>
              </div>

              {/* Plan Details */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Activation Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Plan:</span>
                    <span className="font-medium">{accessData.planData.plan_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Activation Code:</span>
                    <span className="font-mono">{accessData.planData.activation_code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Remaining Courses:</span>
                    <span className="font-medium">{accessData.planData.remaining_courses}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button onClick={handleOpenLMS} className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 flex items-center justify-center">
                  <FiExternalLink className="mr-2" />
                  Open LMS Course
                </button>

                <button onClick={handleClose} className="w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-300">
                  Close
                </button>
              </div>
            </div>}

          {step === 'error' && <div>
              <div className="text-center mb-6">
                <FiAlertCircle className="text-4xl text-red-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Activation Failed
                </h3>
                <p className="text-gray-600">{error}</p>
              </div>

              <div className="space-y-3">
                <button onClick={handleReset} className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700">
                  Try Again
                </button>

                <button onClick={handleClose} className="w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-300">
                  Cancel
                </button>
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-800">
                  <strong>Need help?</strong> Contact support with your activation code and user details for assistance.
                </p>
              </div>
            </div>}
        </div>
      </div>
    </div>;
};
export default LMSAccessModal;
LMSAccessModal.propTypes = {
  "isOpen": PropTypes.bool,
  "onClose": PropTypes.func,
  "pid": PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  "courseId": PropTypes.string,
  "courseTitle": PropTypes.string,
  "token": PropTypes.string,
  "onSuccess": PropTypes.func
};
