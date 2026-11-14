import PropTypes from "prop-types";
import { useState } from 'react';
import { validateActivationForLMS, getLMSAccessURL, redirectToLMS } from '../../services/planService';
import { formatPlanValidity } from '../../services/planService';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { FiExternalLink, FiCheckCircle, FiAlertCircle, FiLoader } from 'react-icons/fi';
const PlanActivation = ({
  pid,
  courseId = null,
  onSuccess = null,
  onError = null,
  redirectPath = '/dashboard',
  showPlanDetails = true
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [planDetails, setPlanDetails] = useState(null);
  const [accessGranted, setAccessGranted] = useState(false);
  const [lmsAccessUrl, setLmsAccessUrl] = useState(null);
  const {
    register,
    handleSubmit,
    formState: {
      errors
    },
    reset
  } = useForm();
  const handleActivationSubmit = async data => {
    setIsLoading(true);
    try {
      // Validate activation code and get LMS access
      const result = await validateActivationForLMS(pid, data.activationCode, courseId);
      setPlanDetails(result);
      setAccessGranted(true);

      // Generate LMS access URL
      const lmsResult = await getLMSAccessURL(pid, data.activationCode, courseId, redirectPath);
      setLmsAccessUrl(lmsResult.access_url);
      if (onSuccess) {
        onSuccess(result, lmsResult);
      }
      toast.success('LMS access granted successfully!');
    } catch (error) {
      console.error('Activation failed:', error);
      if (onError) {
        onError(error);
      }
    } finally {
      setIsLoading(false);
    }
  };
  const handleRedirectToLMS = async () => {
    if (!planDetails || !lmsAccessUrl) return;
    setIsLoading(true);
    try {
      // Open LMS in new tab
      window.open(lmsAccessUrl, '_blank');
      toast.success('Redirecting to LMS...');
    } catch (error) {
      toast.error('Failed to redirect to LMS');
    } finally {
      setIsLoading(false);
    }
  };
  const handleDirectRedirect = async activationCode => {
    setIsLoading(true);
    try {
      const result = await redirectToLMS(pid, activationCode, courseId, redirectPath);
      if (result.redirect_url) {
        window.location.href = result.redirect_url;
      }
    } catch (error) {
      toast.error('Failed to redirect to LMS');
    } finally {
      setIsLoading(false);
    }
  };
  return <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Activate LMS Course Access
        </h2>
        <p className="text-gray-600">
          Enter your activation code to access courses in the LMS system.
        </p>
      </div>

      {!accessGranted ? <form onSubmit={handleSubmit(handleActivationSubmit)} className="space-y-6">
          <div>
            <label htmlFor="activationCode" className="block text-sm font-medium text-gray-700 mb-2">
              Activation Code
            </label>
            <input type="text" id="activationCode" {...register('activationCode', {
          required: 'Activation code is required',
          minLength: {
            value: 10,
            message: 'Activation code must be at least 10 characters'
          }
        })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Enter your activation code" disabled={isLoading} />
            {errors.activationCode && <p className="mt-1 text-sm text-red-600">
                {errors.activationCode.message}
              </p>}
          </div>

          <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center">
            {isLoading ? <>
                <FiLoader className="animate-spin mr-2" />
                Validating...
              </> : 'Activate LMS Access'}
          </button>
        </form> : <div className="space-y-6">
          {/* Success Message */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <FiCheckCircle className="text-green-600 mr-3 text-xl" />
              <div>
                <h3 className="text-green-900 font-semibold">Access Granted!</h3>
                <p className="text-green-700 text-sm">
                  Your LMS access has been successfully activated.
                </p>
              </div>
            </div>
          </div>

          {/* Plan Details */}
          {showPlanDetails && planDetails && <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Plan Details</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Plan Name:</span>
                  <span className="font-medium">{planDetails.plan_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Activation Code:</span>
                  <span className="font-mono text-sm">{planDetails.activation_code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Remaining Courses:</span>
                  <span className="font-medium">{planDetails.remaining_courses}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Access Granted:</span>
                  <span className="font-medium">
                    {new Date(planDetails.access_granted_at).toLocaleString()}
                  </span>
                </div>
                {planDetails.validity && <div className="flex justify-between">
                    <span className="text-gray-600">Validity:</span>
                    <span className="font-medium text-sm">
                      {formatPlanValidity(planDetails.validity)}
                    </span>
                  </div>}
              </div>
            </div>}

          {/* Action Buttons */}
          <div className="space-y-3">
            <button onClick={handleRedirectToLMS} disabled={isLoading || !lmsAccessUrl} className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center">
              {isLoading ? <>
                  <FiLoader className="animate-spin mr-2" />
                  Loading...
                </> : <>
                  <FiExternalLink className="mr-2" />
                  Open LMS in New Tab
                </>}
            </button>

            <button onClick={() => handleDirectRedirect(planDetails.activation_code)} disabled={isLoading} className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center">
              {isLoading ? <>
                  <FiLoader className="animate-spin mr-2" />
                  Redirecting...
                </> : 'Redirect to LMS (Same Tab)'}
            </button>

            <button onClick={() => {
          setAccessGranted(false);
          setPlanDetails(null);
          setLmsAccessUrl(null);
          reset();
        }} disabled={isLoading} className="w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 disabled:bg-gray-400 disabled:cursor-not-allowed">
              Activate Another Code
            </button>
          </div>
        </div>}

      {/* Help Section */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-start">
          <FiAlertCircle className="text-blue-600 mr-2 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Need Help?</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Activation codes are user-specific and cannot be shared</li>
              <li>Each activation code provides access to specific courses</li>
              <li>Course usage is tracked automatically</li>
              <li>Contact support if you face any issues with activation</li>
            </ul>
          </div>
        </div>
      </div>
    </div>;
};
export default PlanActivation;
PlanActivation.propTypes = {
  "pid": PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  "courseId": PropTypes.string,
  "onSuccess": PropTypes.func,
  "onError": PropTypes.func,
  "redirectPath": PropTypes.string,
  "showPlanDetails": PropTypes.bool
};
