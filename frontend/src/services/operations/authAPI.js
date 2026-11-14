import { BASE_URL as SERVER_URL, PHP_BASE_URL } from '../../config/api';
import { toast } from "react-hot-toast"

import { setLoading, setToken, setUser, clearAuth } from "../../slices/authSlice"
import { resetCart } from "../../slices/cartSlice"
import { setUser as setProfileUser } from "../../slices/profileSlice"
import { apiConnector } from "../apiConnector"
import { endpoints } from "../apis"

const {
  SENDOTP_API,
  SIGNUP_API,
  LOGIN_API,
  GOOGLE_LOGIN_API,
  VERIFY_GOOGLE_OTP_API,
  LINKEDIN_LOGIN_API,
  FACEBOOK_LOGIN_API,
  RESETPASSTOKEN_API,
  RESETPASSWORD_API,
} = endpoints

// ================ send Otp ================
export function sendOtp(email, navigate) {
  return async (dispatch) => {

    const toastId = toast.loading("Loading...");
    dispatch(setLoading(true));

    try {
      const response = await apiConnector("POST", SENDOTP_API, {
        email,
        checkUserPresent: true,
      })
      // console.log("SENDOTP API RESPONSE ---> ", response)

      // console.log(response.data.success)
      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      navigate("/verify-email");
      toast.success("OTP Sent Successfully");
    } catch (error) {
      console.log("SENDOTP API ERROR --> ", error);
      toast.error(error.response.data?.message);
      // toast.error("Could Not Send OTP")
    }
    dispatch(setLoading(false));
    toast.dismiss(toastId);
  }
}

// ================ sign Up ================
export function signUp(accountType, firstName, lastName, email, password, confirmPassword, otp, navigate) {
  return async (dispatch) => {

    const toastId = toast.loading("Loading...");
    dispatch(setLoading(true));
    try {
      const response = await apiConnector("POST", SIGNUP_API, {
        accountType,
        firstName,
        lastName,
        email,
        password,
        confirmPassword,
        otp,
      })

      // console.log("SIGNUP API RESPONSE --> ", response);
      if (!response.data.success) {
        toast.error(response.data.message);
        throw new Error(response.data.message);
      }

      toast.success("Signup Successful");
      navigate("/login");
    } catch (error) {
      console.log("SIGNUP API ERROR --> ", error);
      const errorMessage = error.response?.data?.message || "Invalid OTP";
      toast.error(errorMessage);
      // Clear the OTP input and stay on verify-email page
      dispatch(setLoading(false));
      toast.dismiss(toastId);
      return;
    }
    dispatch(setLoading(false))
    toast.dismiss(toastId)
  }
}


// ================ Login ================
export function login(email, password, captcha, navigate) {
  return async (dispatch) => {

    const toastId = toast.loading("Loading...");
    dispatch(setLoading(true));

    try {
      const response = await apiConnector("POST", LOGIN_API, {
        email,
        password,
        captcha,
      })

      console.log("LOGIN API RESPONSE............", response);

      if (!response.data.success) {
        throw new Error(response.data.message)
      }

      toast.success("Login Successful")
      dispatch(setToken(response.data.token))

      const userImage = response.data?.user?.image
        ? response.data.user.image
        : `https://api.dicebear.com/5.x/initials/svg?seed=${response.data.user.firstName} ${response.data.user.lastName}`

      const userData = { ...response.data.user, image: userImage };

      // Set user data in both auth and profile slices
      dispatch(setUser(userData));
      dispatch(setProfileUser(userData));

      // Clear cart to prevent payment-related redirects
      dispatch(resetCart());

      // Always redirect to dashboard after successful login
      console.log("Redirecting to dashboard after login...");
      navigate("/dashboard/my-profile");
    } catch (error) {
      console.log("LOGIN API ERROR.......", error)
      toast.error(error.response?.data?.message || 'Login failed')
      // Re-throw the error so LoginForm can catch it and refresh captcha
      throw error;
    } finally {
      dispatch(setLoading(false))
      toast.dismiss(toastId)
    }
  }
}


// ================ Google Login ================
export function googleLogin(credential, navigate) {
  return async (dispatch) => {
    const toastId = toast.loading("Signing in with Google...");
    dispatch(setLoading(true));

    try {
      const response = await apiConnector("POST", GOOGLE_LOGIN_API, {
        credential,
      })

      console.log("GOOGLE LOGIN API RESPONSE............", response);

      if (!response.data.success) {
        throw new Error(response.data.message)
      }

      // Check if OTP is required (for new users only)
      if (response.data.requiresOTP) {
        toast.dismiss(toastId);
        toast.success("Welcome! OTP sent to your email for verification.");
        dispatch(setLoading(false));

        // Store email for OTP verification
        localStorage.setItem('googleLoginEmail', response.data.email);

        // Navigate to OTP verification page
        navigate("/verify-google-otp");
        return;
      }

      // For existing users - direct login without OTP
      toast.success("Welcome back! Login successful")
      dispatch(setToken(response.data.token))

      const userImage = response.data?.user?.image
        ? response.data.user.image
        : `https://api.dicebear.com/5.x/initials/svg?seed=${response.data.user.firstName} ${response.data.user.lastName}`

      const userData = { ...response.data.user, image: userImage };

      dispatch(setUser(userData));
      dispatch(setProfileUser(userData));

      navigate("/dashboard/my-profile");
    } catch (error) {
      console.log("GOOGLE LOGIN API ERROR.......", error)
      toast.error(error.response?.data?.message || "Google login failed")
    }
    dispatch(setLoading(false))
    toast.dismiss(toastId)
  }
}

// ================ Verify Google OTP ================
export function verifyGoogleOTP(email, otp, navigate) {
  return async (dispatch) => {
    const toastId = toast.loading("Verifying OTP...");
    dispatch(setLoading(true));

    try {
      const response = await apiConnector("POST", VERIFY_GOOGLE_OTP_API, {
        email,
        otp,
      })

      console.log("VERIFY GOOGLE OTP API RESPONSE............", response);

      if (!response.data.success) {
        throw new Error(response.data.message)
      }

      toast.success("Google Login Successful!")
      dispatch(setToken(response.data.token))

      const userImage = response.data?.user?.image
        ? response.data.user.image
        : `https://api.dicebear.com/5.x/initials/svg?seed=${response.data.user.firstName} ${response.data.user.lastName}`

      const userData = { ...response.data.user, image: userImage };

      dispatch(setUser(userData));
      dispatch(setProfileUser(userData));

      // Clear stored email
      localStorage.removeItem('googleLoginEmail');

      navigate("/dashboard/my-profile");
    } catch (error) {
      console.log("VERIFY GOOGLE OTP API ERROR.......", error)
      toast.error(error.response?.data?.message || "OTP verification failed")
    }
    dispatch(setLoading(false))
    toast.dismiss(toastId)
  }
}


// ================ LinkedIn Login ================
export function linkedinLogin(code, navigate) {
  return async (dispatch) => {
    const toastId = toast.loading("Signing in with LinkedIn...");
    dispatch(setLoading(true));

    try {
      const response = await apiConnector("POST", LINKEDIN_LOGIN_API, {
        code,
        redirectUri: `${window.location.origin}/linkedin`
      })

      console.log("LINKEDIN LOGIN API RESPONSE............", response);

      if (!response.data.success) {
        throw new Error(response.data.message)
      }

      toast.success("LinkedIn Login Successful")
      dispatch(setToken(response.data.token))

      const userImage = response.data?.user?.image
        ? response.data.user.image
        : `https://api.dicebear.com/5.x/initials/svg?seed=${response.data.user.firstName} ${response.data.user.lastName}`

      const userData = { ...response.data.user, image: userImage };

      dispatch(setUser(userData));
      dispatch(setProfileUser(userData));

      navigate("/dashboard/my-profile");
    } catch (error) {
      console.log("LINKEDIN LOGIN API ERROR.......", error)
      toast.error(error.response?.data?.message || "LinkedIn login failed")
    }
    dispatch(setLoading(false))
    toast.dismiss(toastId)
  }
}


// ================ Facebook Login ================
export function facebookLogin(accessToken, navigate) {
  return async (dispatch) => {
    const toastId = toast.loading("Signing in with Facebook...");
    dispatch(setLoading(true));

    try {
      const response = await apiConnector("POST", FACEBOOK_LOGIN_API, {
        accessToken
      })

      console.log("FACEBOOK LOGIN API RESPONSE............", response);

      if (!response.data.success) {
        throw new Error(response.data.message)
      }

      toast.success("Facebook Login Successful")
      dispatch(setToken(response.data.token))

      const userImage = response.data?.user?.image
        ? response.data.user.image
        : `https://api.dicebear.com/5.x/initials/svg?seed=${response.data.user.firstName} ${response.data.user.lastName}`

      const userData = { ...response.data.user, image: userImage };

      dispatch(setUser(userData));
      dispatch(setProfileUser(userData));

      navigate("/dashboard/my-profile");
    } catch (error) {
      console.log("FACEBOOK LOGIN API ERROR.......", error)
      toast.error(error.response?.data?.message || "Facebook login failed")
    }
    dispatch(setLoading(false))
    toast.dismiss(toastId)
  }
}


// ================ get Password Reset Token ================
export function getPasswordResetToken(email, setEmailSent) {
  return async (dispatch) => {
    const toastId = toast.loading("Sending reset email...")
    dispatch(setLoading(true))

    try {
      const response = await apiConnector("POST", RESETPASSTOKEN_API, {
        email: email.toLowerCase().trim(),
      })

      console.log("RESET PASS TOKEN RESPONSE:", response)

      if (!response.data.success) {
        throw new Error(response.data.message)
      }

      toast.success(response.data.message || "Reset email sent successfully!")
      setEmailSent(true)

    } catch (error) {
      console.error("RESET PASS TOKEN ERROR:", error)

      // Handle different types of errors
      if (error.response?.status === 429) {
        toast.error("Too many attempts. Please wait before trying again.")
      } else if (error.response?.status === 400) {
        toast.error(error.response.data?.message || "Invalid email address")
      } else if (error.response?.status === 500) {
        toast.error("Server error. Please try again later.")
      } else {
        toast.error(error.response?.data?.message || "Failed to send reset email")
      }
    } finally {
      toast.dismiss(toastId)
      dispatch(setLoading(false))
    }
  }
}

// ================ verify Reset Token ================
export function verifyResetToken(token) {
  return async () => {
    try {
      const response = await apiConnector("GET", `${RESETPASSTOKEN_API.replace('reset-password-token', 'verify-reset-token')}/${token}`)

      if (!response.data.success) {
        throw new Error(response.data.message)
      }

      return { success: true, data: response.data.data }
    } catch (error) {
      console.error("VERIFY TOKEN ERROR:", error)
      return {
        success: false,
        message: error.response?.data?.message || "Invalid or expired reset token"
      }
    }
  }
}

// ================ reset Password ================
export function resetPassword(password, confirmPassword, token, navigate) {
  return async (dispatch) => {
    const toastId = toast.loading("Resetting password...")
    dispatch(setLoading(true))

    try {
      const response = await apiConnector("POST", RESETPASSWORD_API, {
        password,
        confirmPassword,
        token,
      })

      console.log("RESETPASSWORD RESPONSE:", response)

      if (!response.data.success) {
        throw new Error(response.data.message)
      }

      toast.success(response.data.message || "Password reset successfully!")

      // Clear any stored auth data
      localStorage.removeItem("token")
      localStorage.removeItem("user")

      // Navigate to login after a short delay
      setTimeout(() => {
        navigate("/login")
      }, 1500)

    } catch (error) {
      console.error("RESETPASSWORD ERROR:", error)

      // Handle different types of errors
      if (error.response?.status === 400) {
        const errorData = error.response.data
        if (errorData.errors && Array.isArray(errorData.errors)) {
          // Show password requirement errors
          errorData.errors.forEach(err => toast.error(err))
        } else {
          toast.error(errorData.message || "Invalid password requirements")
        }
      } else if (error.response?.status === 401) {
        toast.error("Reset token has expired. Please request a new password reset.")
        setTimeout(() => {
          navigate("/forgot-password")
        }, 2000)
      } else {
        toast.error(error.response?.data?.message || "Failed to reset password")
      }
    } finally {
      toast.dismiss(toastId)
      dispatch(setLoading(false))
    }
  }
}


// ================ Logout ================
export function logout(navigate) {
  return async (dispatch, getState) => {
    try {
      const { user } = getState().profile;
      const sessionToken = getState().auth.token;

      // If user has PID (came from Skilli Jobs), perform SSO logout
      if (user && user.pid) {
        console.log('Performing SSO logout for PID user:', user.pid);

        // Show logout message
        toast.success("Logging out from both systems...");

        // Clear LMS session first
        dispatch(clearAuth())
        dispatch(setProfileUser(null))
        dispatch(resetCart())

        // Call backend SSO logout endpoint (don't wait for response)
        apiConnector("POST", `${SERVER_URL}/api/v1/auth/sso-logout`, {
          pid: user.pid
        }, { Authorization: `Bearer ${sessionToken}` }).catch(error => {
          console.error('Error calling SSO logout endpoint:', error);
        });

        // Immediately redirect to Skilli Jobs logout endpoint
        // This will clear PHP session and redirect to login page
        setTimeout(() => {
          window.location.href = PHP_BASE_URL ? `${PHP_BASE_URL}/mylogout` : '/login';
        }, 500); // Small delay to ensure state is cleared
        return;
      }

      // Regular logout for direct Beeja LMS users
      dispatch(clearAuth())
      dispatch(setProfileUser(null))
      dispatch(resetCart())
      toast.success("Logged Out")
      navigate("/")

    } catch (error) {
      console.error('Error during logout:', error);

      // Force logout anyway
      dispatch(clearAuth())
      dispatch(setProfileUser(null))
      dispatch(resetCart())
      toast.success("Logged Out")
      navigate("/")
    }
  }
}
