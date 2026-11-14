import PropTypes from "prop-types";
import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import phpIntegrationService, { fetchUserCourseSubscriptions } from '../../services/phpIntegrationService';
import { getPlanPurchase } from '../../services/planService';
import { FiBookOpen, FiShoppingCart, FiCheckCircle, FiClock, FiTag, FiLoader, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
const CourseSubscriptionPanel = ({
  courseId,
  onAccessGranted
}) => {
  const {
    token
  } = useSelector(state => state.auth);
  const {
    user
  } = useSelector(state => state.profile);
  const [loading, setLoading] = useState(true);
  const [subscribedCourses, setSubscribedCourses] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [userPlans, setUserPlans] = useState([]);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [generatingCoupon, setGeneratingCoupon] = useState(false);
  const [couponData, setCouponData] = useState(null);
  const initializeUserData = useCallback(async () => {
    setLoading(true);
    try {
      // Initialize PHP session
      const sessionResult = await phpIntegrationService.initializePHPSession(token);
      if (sessionResult.success) {
        // Fetch user's subscriptions
        const subscriptions = await fetchUserCourseSubscriptions();
        setSubscribedCourses(subscriptions);

        // Fetch available courses
        const available = await phpIntegrationService.fetchAvailableCourses();
        setAvailableCourses(available);

        // Fetch user's plan data
        if (user?._id) {
          const planData = await getPlanPurchase(user._id, token);
          setUserPlans(planData.plans || []);
        }
      }
    } catch (error) {
      console.error('Error initializing user data:', error);
      toast.error('Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  }, [token, user._id]);
  useEffect(() => {
    if (user && token) {
      initializeUserData();
    }
  }, [user, token, initializeUserData]);
  const checkCourseAccess = () => {
    // Check if user has access through PHP subscription
    const hasSubAccess = phpIntegrationService.hasCourseAccess(courseId);

    // Check if user has access through plan
    const activePlans = userPlans.filter(plan => plan.status === 'ACTIVE');
    const hasPlanAccess = activePlans.some(plan => plan.courses && plan.courses.remaining > 0);
    return {
      hasSubscriptionAccess: hasSubAccess,
      hasPlanAccess: hasPlanAccess,
      hasAccess: hasSubAccess || hasPlanAccess
    };
  };
  const handleGenerateCoupon = async course => {
    if (!user?._id) {
      toast.error('User ID not found');
      return;
    }
    setGeneratingCoupon(true);
    setSelectedCourse(course);
    try {
      const result = await phpIntegrationService.generatePurchaseCoupon(course.id, user._id);
      if (result.success) {
        setCouponData(result);
        setShowPurchaseModal(true);
        toast.success('Coupon generated successfully!');
      } else {
        toast.error(result.error || 'Failed to generate coupon');
      }
    } catch (error) {
      console.error('Error generating coupon:', error);
      toast.error('Failed to generate coupon');
    } finally {
      setGeneratingCoupon(false);
    }
  };
  const handlePurchaseWithCoupon = async () => {
    if (!couponData || !user?._id) return;
    try {
      const result = await phpIntegrationService.purchaseCourseWithCoupon(couponData.coupon, user._id);
      if (result.success) {
        toast.success('Course purchased successfully!');
        setShowPurchaseModal(false);
        setCouponData(null);

        // Refresh user data
        await initializeUserData();
        if (onAccessGranted) {
          onAccessGranted(result);
        }
      } else {
        toast.error(result.error || 'Purchase failed');
      }
    } catch (error) {
      console.error('Error purchasing course:', error);
      toast.error('Failed to purchase course');
    }
  };
  const accessStatus = checkCourseAccess();
  if (loading) {
    return <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center py-8">
          <FiLoader className="animate-spin text-2xl text-blue-600 mr-3" />
          <span className="text-gray-600">Loading subscription data...</span>
        </div>
      </div>;
  }
  return <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Course Access</h3>
        <div className="flex items-center gap-2">
          {accessStatus.hasAccess ? <span className="flex items-center text-green-600">
              <FiCheckCircle className="mr-1" />
              Access Granted
            </span> : <span className="flex items-center text-orange-600">
              <FiAlertCircle className="mr-1" />
              Purchase Required
            </span>}
        </div>
      </div>

      {/* Current Subscriptions */}
      {subscribedCourses.length > 0 && <div className="mb-6">
          <h4 className="text-md font-medium text-gray-700 mb-3">Your Active Subscriptions</h4>
          <div className="space-y-2">
            {subscribedCourses.map(subscription => <div key={subscription.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <FiBookOpen className="text-green-600 mr-2" />
                  <div>
                    <p className="font-medium text-gray-900">{subscription.course_title}</p>
                    <p className="text-sm text-gray-600">
                      Expires: {new Date(subscription.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                  Active
                </span>
              </div>)}
          </div>
        </div>}

      {/* Plan-based Access */}
      {userPlans.filter(plan => plan.status === 'ACTIVE').length > 0 && <div className="mb-6">
          <h4 className="text-md font-medium text-gray-700 mb-3">Plan-based Access</h4>
          <div className="space-y-2">
            {userPlans.filter(plan => plan.status === 'ACTIVE').map(plan => <div key={plan.activation_code} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{plan.plan_name}</p>
                  <p className="text-sm text-gray-600">
                    Courses: {plan.courses?.remaining || 0}/{plan.courses?.total || 0} remaining
                  </p>
                </div>
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                  {plan.status}
                </span>
              </div>)}
          </div>
        </div>}

      {/* Purchase Options */}
      {!accessStatus.hasAccess && availableCourses.length > 0 && <div>
          <h4 className="text-md font-medium text-gray-700 mb-3">Available Courses</h4>
          <div className="space-y-3">
            {availableCourses.map(course => <div key={course.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900">{course.title}</h5>
                  <p className="text-sm text-gray-600 mb-2">{course.description}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center text-gray-500">
                      <FiTag className="mr-1" />
                      ₹{course.price}
                    </span>
                    <span className="flex items-center text-gray-500">
                      <FiClock className="mr-1" />
                      {course.duration}
                    </span>
                  </div>
                </div>
                <button onClick={() => handleGenerateCoupon(course)} disabled={generatingCoupon} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
                  {generatingCoupon && selectedCourse?.id === course.id ? <FiLoader className="animate-spin mr-2" /> : <FiShoppingCart className="mr-2" />}
                  Purchase
                </button>
              </div>)}
          </div>
        </div>}

      {/* Purchase Modal */}
      {showPurchaseModal && couponData && <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Purchase Course</h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Course: {selectedCourse?.title}</p>
              <p className="text-sm text-gray-600 mb-2">Price: ₹{selectedCourse?.price}</p>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900 mb-1">Coupon Code:</p>
                <p className="text-lg font-bold text-yellow-800">{couponData.coupon}</p>
                <p className="text-xs text-gray-600 mt-1">Activation Code: {couponData.activation_code}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowPurchaseModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handlePurchaseWithCoupon} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Confirm Purchase
              </button>
            </div>
          </div>
        </div>}
    </div>;
};
export default CourseSubscriptionPanel;
CourseSubscriptionPanel.propTypes = {
  "courseId": PropTypes.string,
  "courseTitle": PropTypes.string,
  "onAccessGranted": PropTypes.func
};
