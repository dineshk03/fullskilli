import { toast } from "react-hot-toast";
import { studentEndpoints } from "../apis";
import { apiConnector } from "../apiConnector";
import beejaLogo from "../../assets/Logo/Logo-Small-Light.png";
import { resetCart } from "../../slices/cartSlice";
import { showPaymentAnimation } from "../../utils/paymentAnimationHelper";
const {
  COURSE_PAYMENT_API,
  COURSE_VERIFY_API
} = studentEndpoints;
function loadScript(src) {
  return new Promise(resolve => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

// ================ buyCourse ================ 
export async function buyCourse(token, coursesId, userDetails, navigate, dispatch, couponData = null, activationCode = null) {
  const toastId = toast.loading("Loading payment gateway...");
  try {
    // Prepare request body with coupon information if available
    const requestBody = {
      coursesId
    };
    if (activationCode) requestBody.activationCode = activationCode;
    if (couponData) {
      requestBody.couponCode = couponData.code;
      requestBody.discountAmount = couponData.discountAmount;
    }

    // First API call - capture payment/create Razorpay order
    const orderResponse = await apiConnector("POST", COURSE_PAYMENT_API, requestBody, {
      Authorization: `Bearer ${token}`
    });
    if (!orderResponse.data.success) {
      throw new Error(orderResponse.data.message);
    }

    // If it's a free course, directly verify and enroll
    if (orderResponse.data.isFree) {
      toast.dismiss(toastId);
      const freeEnrollToast = toast.loading("Enrolling in free course...");
      const verifyResponse = await apiConnector("POST", COURSE_VERIFY_API, requestBody, {
        Authorization: `Bearer ${token}`
      });
      toast.dismiss(freeEnrollToast);
      if (!verifyResponse.data.success) {
        throw new Error(verifyResponse.data.message);
      }
      toast.success("Successfully enrolled in the course!");
      navigate("/dashboard/enrolled-courses");
      dispatch(resetCart());
      return;
    }

    // Load Razorpay script
    const res = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
    if (!res) {
      toast.error("Razorpay SDK failed to load. Please check your internet connection.");
      return;
    }
    toast.dismiss(toastId);

    // Razorpay options with enhanced UI customization
    const options = {
      key: orderResponse.data.key,
      currency: orderResponse.data.currency,
      amount: orderResponse.data.amount * 100,
      // Amount in paise
      order_id: orderResponse.data.orderId,
      name: "Beeja Academy",
      description: "Premium Course Enrollment",
      image: beejaLogo,
      prefill: {
        name: orderResponse.data.userDetails.name,
        email: orderResponse.data.userDetails.email,
        contact: orderResponse.data.userDetails.contact
      },
      notes: {
        course_purchase: "true",
        platform: "Beeja LMS"
      },
      config: {
        display: {
          blocks: {
            banks: {
              name: 'Pay using Netbanking',
              instruments: [{
                method: 'netbanking'
              }]
            },
            card: {
              name: 'Pay using Cards',
              instruments: [{
                method: 'card'
              }]
            },
            upi: {
              name: 'Pay using UPI',
              instruments: [{
                method: 'upi'
              }]
            },
            wallet: {
              name: 'Pay using Wallet',
              instruments: [{
                method: 'wallet'
              }]
            }
          },
          sequence: ['upi', 'card', 'banks', 'wallet'],
          preferences: {
            show_default_blocks: true
          }
        }
      },
      handler: async function (response) {
        // Payment successful - verify payment
        const verifyToast = toast.loading("Verifying payment...");
        try {
          const verifyResponse = await apiConnector("POST", COURSE_VERIFY_API, {
            ...requestBody,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
          }, {
            Authorization: `Bearer ${token}`
          });
          toast.dismiss(verifyToast);
          if (!verifyResponse.data.success) {
            throw new Error(verifyResponse.data.message);
          }

          // Show success animation
          showPaymentAnimation('success', () => {
            toast.success("Payment successful! You are now enrolled.");
            navigate("/dashboard/enrolled-courses");
            dispatch(resetCart());
          });
        } catch (error) {
          toast.dismiss(verifyToast);
          console.log("PAYMENT VERIFICATION ERROR.....", error);

          // Show failure animation
          showPaymentAnimation('failure', () => {
            toast.error(error.response?.data?.message || "Payment verification failed");
          });
        }
      },
      theme: {
        color: "#7561FA",
        // Purple/Indigo theme for premium look
        backdrop_color: "rgba(15, 23, 42, 0.9)",
        // Darker backdrop
        image_padding: false,
        // Remove padding around logo
        image_frame: true // Add frame around logo
      },
      modal: {
        ondismiss: function () {
          // Show failure animation for cancelled payment
          showPaymentAnimation('failure', () => {
            toast.error("Payment cancelled");
          });
        },
        confirm_close: true,
        // Ask for confirmation before closing
        escape: true,
        // Allow ESC key to close
        animation: true,
        // Enable modal animations
        backdropclose: false // Don't close on backdrop click
      },
      readonly: {
        email: true,
        // Make email readonly
        contact: true,
        // Make contact readonly
        name: true // Make name readonly
      },
      remember_customer: true,
      // Remember customer for future payments
      send_sms_hash: true // Send SMS hash for autofill OTP
    };

    // Open Razorpay checkout
    const paymentObject = new window.Razorpay(options);
    paymentObject.open();
    paymentObject.on("payment.failed", function (response) {
      console.log("Payment failed:", response.error);

      // Show failure animation
      showPaymentAnimation('failure', () => {
        toast.error("Payment failed. Please try again.");
      });
    });
  } catch (error) {
    console.log("PAYMENT API ERROR.....", error);
    toast.error(error.response?.data?.message || "Could not initiate payment");
  } finally {
    toast.dismiss(toastId);
  }
}

// ================ send Payment Success Email ================
