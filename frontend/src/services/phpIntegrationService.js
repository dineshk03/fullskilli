import { PHP_BASE_URL } from '../config/api';
import { apiConnector } from "./apiConnector";
// PHP Website Integration Service
class PHPIntegrationService {
  constructor() {
    this.phpBaseUrl = PHP_BASE_URL; // Your Laravel backend URL
    this.currentUser = null;
    this.subscribedCourses = [];
    this.availableCourses = [];
  }

  // Initialize PHP user session
  async initializePHPSession(token, { signal } = {}) {
    if (!this.phpBaseUrl) return { success: false, error: 'Portal integration is not configured' };
    try {
      const response = await apiConnector("POST", `${this.phpBaseUrl}/api/user/session`, {
        token
      }, {
        Authorization: `Bearer ${token}`
      }, undefined, { timeout: 5000, signal, skipAuthRedirect: true });
      if (response.data.success) {
        if (signal?.aborted) return { success: false, error: 'Portal request cancelled' };
        this.currentUser = { ...response.data.user, token: response.data.user?.token || token };
        await this.fetchUserCourseSubscriptions({ signal });
        return {
          success: true,
          user: this.currentUser,
          subscriptions: this.subscribedCourses
        };
      }
      throw new Error("Failed to initialize PHP session");
    } catch (error) {
      if (!signal?.aborted) console.error("PHP Session Error:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Fetch user's course subscriptions from PHP
  async fetchUserCourseSubscriptions({ signal } = {}) {
    try {
      if (!this.currentUser?.id) return [];
      const response = await apiConnector("POST", `${this.phpBaseUrl}/api/course-subscriptions/user`, {
        user_id: this.currentUser.id
      }, {
        Authorization: `Bearer ${this.currentUser.token}`
      }, undefined, { timeout: 5000, signal, skipAuthRedirect: true });
      if (response.data.success) {
        if (signal?.aborted) return [];
        this.userSubscriptions = response.data.data || [];
        // Extract courses from subscriptions
        this.subscribedCourses = this.extractCoursesFromSubscriptions(this.userSubscriptions);
        return this.userSubscriptions;
      }
      return [];
    } catch (error) {
      if (!signal?.aborted) console.error("Failed to fetch user course subscriptions:", error);
      return [];
    }
  }

  // Extract courses from user's course subscriptions
  extractCoursesFromSubscriptions(subscriptions) {
    const courses = [];
    subscriptions.forEach(subscription => {
      if (subscription.is_active && subscription.plan_name) {
        // Add subscription info to courses
        courses.push({
          subscription_id: subscription.id,
          plan_name: subscription.plan_name,
          activation_code: subscription.activation_code,
          status: subscription.status,
          skills: subscription.skills,
          usage: subscription.usage,
          validity: subscription.validity,
          access_type: 'course_subscription'
        });
      }
    });
    return courses;
  }

  // Fetch available courses with pricing
  async fetchAvailableCourses() {
    try {
      const response = await apiConnector("GET", `${this.phpBaseUrl}/api/courses/available`, null);
      if (response.data.success) {
        this.availableCourses = response.data.courses || [];
        return this.availableCourses;
      }
      return [];
    } catch (error) {
      console.error("Failed to fetch available courses:", error);
      return [];
    }
  }

  // Generate purchase coupon for course
  async generatePurchaseCoupon(courseId, userId) {
    try {
      const response = await apiConnector("POST", `${this.phpBaseUrl}/api/courses/generate-coupon`, {
        course_id: courseId,
        user_id: userId
      });
      if (response.data.success) {
        return {
          success: true,
          coupon: response.data.coupon,
          activation_code: response.data.activation_code,
          price: response.data.price,
          validity: response.data.validity
        };
      }
      throw new Error(response.data.message || "Failed to generate coupon");
    } catch (error) {
      console.error("Coupon generation error:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Check if user has access to specific course
  hasCourseAccess(courseId) {
    return this.subscribedCourses.some(subscription => subscription.course_id === courseId && subscription.status === 'active');
  }

  // Get user's subscription status
  getSubscriptionStatus(courseId) {
    const subscription = this.subscribedCourses.find(sub => sub.course_id === courseId);
    return subscription ? {
      status: subscription.status,
      expires_at: subscription.expires_at,
      access_type: subscription.access_type,
      can_access: subscription.status === 'active'
    } : null;
  }

  // Purchase course with coupon
  async purchaseCourseWithCoupon(couponCode, userId) {
    try {
      const response = await apiConnector("POST", `${this.phpBaseUrl}/api/courses/purchase-with-coupon`, {
        coupon_code: couponCode,
        user_id: userId
      });
      if (response.data.success) {
        // Refresh subscriptions after purchase
        await this.fetchUserCourseSubscriptions();
        return {
          success: true,
          purchase: response.data.purchase,
          subscription: response.data.subscription,
          activation_code: response.data.activation_code
        };
      }
      throw new Error(response.data.message || "Purchase failed");
    } catch (error) {
      console.error("Purchase error:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get user's current session info
  getCurrentUser() {
    return this.currentUser;
  }

  // Get subscribed courses
  getSubscribedCourses() {
    return this.subscribedCourses;
  }

  // Get available courses
  getAvailableCourses() {
    return this.availableCourses;
  }

  // Clear session (logout)
  clearSession() {
    this.currentUser = null;
    this.subscribedCourses = [];
    this.availableCourses = [];
  }
}

// Create singleton instance
const phpIntegrationService = new PHPIntegrationService();
export default phpIntegrationService;

// Export individual functions for easier usage
export const {
  initializePHPSession,
  fetchUserCourseSubscriptions,
  fetchAvailableCourses,
  generatePurchaseCoupon,
  hasCourseAccess,
  getSubscriptionStatus,
  purchaseCourseWithCoupon,
  getCurrentUser,
  getSubscribedCourses,
  getAvailableCourses,
  clearSession
} = {
  initializePHPSession: phpIntegrationService.initializePHPSession.bind(phpIntegrationService),
  fetchUserCourseSubscriptions: phpIntegrationService.fetchUserCourseSubscriptions.bind(phpIntegrationService),
  fetchAvailableCourses: phpIntegrationService.fetchAvailableCourses.bind(phpIntegrationService),
  generatePurchaseCoupon: phpIntegrationService.generatePurchaseCoupon.bind(phpIntegrationService),
  hasCourseAccess: phpIntegrationService.hasCourseAccess.bind(phpIntegrationService),
  getSubscriptionStatus: phpIntegrationService.getSubscriptionStatus.bind(phpIntegrationService),
  purchaseCourseWithCoupon: phpIntegrationService.purchaseCourseWithCoupon.bind(phpIntegrationService),
  getCurrentUser: phpIntegrationService.getCurrentUser.bind(phpIntegrationService),
  getSubscribedCourses: phpIntegrationService.getSubscribedCourses.bind(phpIntegrationService),
  getAvailableCourses: phpIntegrationService.getAvailableCourses.bind(phpIntegrationService),
  clearSession: phpIntegrationService.clearSession.bind(phpIntegrationService)
};
