import { useState, useRef, useEffect } from "react";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { FcGoogle } from "react-icons/fc";
import { FaLinkedin, FaFacebook } from "react-icons/fa";
import { HiRefresh } from "react-icons/hi";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from '@react-oauth/google';
import { useLinkedIn } from 'react-linkedin-login-oauth2';
import { toast } from "react-hot-toast";
import { login, googleLogin, linkedinLogin, facebookLogin } from "../../../services/operations/authAPI";
import { useFacebookSDK } from "../../../hooks/useFacebookSDK";
function LoginForm() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    captcha: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [captchaHtml, setCaptchaHtml] = useState('');
  const [captchaLoading] = useState(false);
  const isFacebookSDKLoaded = useFacebookSDK();
  const googleButtonRef = useRef(null);
  const {
    email,
    password,
    captcha
  } = formData;

  // TEMPORARILY DISABLED CAPTCHA FETCHING FOR TESTING
  useEffect(() => {
    // fetchCaptcha(); // Disabled
    setCaptchaHtml('<div>Captcha disabled for testing</div>');
  }, []);

  // Function to fetch captcha from backend - DISABLED
  const fetchCaptcha = async () => {
    // setCaptchaLoading(true);
    // try {
    //   const backendUrl = import.meta.env.VITE_LARAVEL_BASE_URL || 'http://localhost:5001';
    //   const response = await apiConnector('GET', `${backendUrl}/refresh-captcha`);
    //   if (response.data && response.data.captcha) {
    //     setCaptchaHtml(response.data.captcha);
    //   }
    // } catch (error) {
    //   console.error('Error fetching captcha:', error);
    //   toast.error('Failed to load captcha');
    // }
    // setCaptchaLoading(false);
    console.log('Captcha fetch disabled for testing');
  };
  const handleOnChange = e => {
    setFormData(prevData => ({
      ...prevData,
      [e.target.name]: e.target.value
    }));
  };
  const handleOnSubmit = async e => {
    e.preventDefault();
    // TEMPORARILY DISABLED CAPTCHA VALIDATION FOR TESTING
    /*
    if (!captcha) {
      toast.error('Please enter the captcha');
      return;
    }
    */

    try {
      // Pass 'test' as captcha since backend validation is disabled
      await dispatch(login(email, password, captcha || 'test', navigate));
    } catch (error) {
      // Clear captcha input on login failure (captcha refresh disabled)
      setFormData(prev => ({
        ...prev,
        captcha: ''
      }));
      // fetchCaptcha(); // Disabled for testing
      console.log('Login failed, but captcha refresh disabled for testing');
    }
  };
  const handleGoogleSuccess = credentialResponse => {
    dispatch(googleLogin(credentialResponse.credential, navigate));
  };
  const handleGoogleError = () => {
    console.log('Google Login Failed');
  };

  // LinkedIn OAuth
  const {
    linkedInLogin
  } = useLinkedIn({
    clientId: import.meta.env.VITE_LINKEDIN_CLIENT_ID || '',
    redirectUri: `${window.location.origin}/linkedin`,
    onSuccess: code => {
      dispatch(linkedinLogin(code, navigate));
    },
    onError: error => {
      console.log('LinkedIn Login Failed:', error);
    },
    scope: 'openid profile email'
  });

  // Facebook OAuth
  const handleFacebookLogin = () => {
    console.log('Facebook login button clicked');
    console.log('Facebook SDK loaded:', isFacebookSDKLoaded);
    console.log('window.FB exists:', typeof window.FB !== 'undefined');
    console.log('Current URL:', window.location.href);
    console.log('Protocol:', window.location.protocol);
    console.log('Hostname:', window.location.hostname);

    // Check if running on HTTPS or localhost
    const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    console.log('Is secure context:', isSecure);
    if (!isSecure) {
      console.error('Facebook login requires HTTPS or localhost');
      toast.error('Facebook login requires HTTPS. Please access via https:// or http://localhost');
      return;
    }

    // Check if Facebook SDK is loaded and initialized
    if (!isFacebookSDKLoaded || typeof window.FB === 'undefined') {
      console.error('Facebook SDK not loaded or not initialized');
      toast.error('Facebook SDK is still loading. Please wait a moment and try again.');
      return;
    }

    // Additional check: Verify FB.getAuthResponse exists (means SDK is truly ready)
    if (typeof window.FB.getAuthResponse !== 'function') {
      console.error('Facebook SDK not fully initialized');
      toast.error('Facebook SDK is not ready. Please refresh the page.');
      return;
    }
    console.log('Initiating Facebook login...');

    // Use a try-catch to handle any SDK errors
    try {
      window.FB.login(response => {
        console.log('Facebook login response:', response);
        if (response.authResponse) {
          console.log('Facebook login successful, access token received');
          dispatch(facebookLogin(response.authResponse.accessToken, navigate));
        } else {
          console.log('Facebook Login Failed or cancelled by user');
          if (response.status === 'not_authorized') {
            toast.error('Please authorize the app to continue');
          } else if (response.status === 'unknown') {
            console.log('User cancelled login or did not fully authorize');
          }
        }
      }, {
        scope: 'public_profile,email'
      });
    } catch (error) {
      console.error('Facebook login error:', error);
      toast.error('Facebook login failed. Please try again or contact support.');
    }
  };
  return <form onSubmit={handleOnSubmit} className="mt-6 flex w-full flex-col gap-y-4">
      <label className="w-full">
        <p className="mb-1 text-[0.875rem] leading-[1.375rem] text-richblack-5">
          Email Address <sup className="text-pink-200">*</sup>
        </p>
        <input required type="text" name="email" value={email} onChange={handleOnChange} placeholder="Enter email address" style={{
        boxShadow: "inset 0px -1px 0px rgba(255, 255, 255, 0.18)"
      }} className="w-full rounded-[0.5rem] bg-richblack-800 p-[12px] text-richblack-5 outline-none" />
      </label>

      <label className="relative">
        <p className="mb-1 text-[0.875rem] leading-[1.375rem] text-richblack-5">
          Password <sup className="text-pink-200">*</sup>
        </p>
        <input required type={showPassword ? "text" : "password"} name="password" value={password} onChange={handleOnChange} placeholder="Enter Password" style={{
        boxShadow: "inset 0px -1px 0px rgba(255, 255, 255, 0.18)"
      }} className="w-full rounded-[0.5rem] bg-richblack-800 p-[12px] pr-12 text-richblack-5 outline-none" />
        <span onClick={() => setShowPassword(prev => !prev)} className="absolute right-3 top-[38px] z-[10] cursor-pointer">
          {showPassword ? <AiOutlineEyeInvisible fontSize={24} fill="#AFB2BF" /> : <AiOutlineEye fontSize={24} fill="#AFB2BF" />}
        </span>
        <Link to="/forgot-password">
          <p className="mt-1 ml-auto max-w-max text-xs text-blue-100">
            Forgot Password
          </p>
        </Link>
      </label>

      {/* Captcha Field - TEMPORARILY HIDDEN FOR TESTING */}
      {false && <div className="w-full">
        <p className="mb-1 text-[0.875rem] leading-[1.375rem] text-richblack-5">
          Captcha <sup className="text-pink-200">*</sup>
        </p>
        <div className="flex items-center gap-2">
          <input required type="text" name="captcha" value={captcha} onChange={handleOnChange} placeholder="Enter the characters" style={{
          boxShadow: "inset 0px -1px 0px rgba(255, 255, 255, 0.18)"
        }} className="flex-1 rounded-[0.5rem] bg-richblack-800 p-[12px] text-richblack-5 outline-none" />
          <div className="flex items-center gap-2 bg-white p-2 rounded-[0.5rem]">
            {captchaLoading ? <div className="text-richblack-900 text-sm">Loading...</div> : <div dangerouslySetInnerHTML={{
            __html: captchaHtml
          }} />}
            <button type="button" onClick={fetchCaptcha} className="p-1 hover:bg-richblack-100 rounded transition-colors" title="Refresh Captcha">
              <HiRefresh className="text-xl text-richblack-900" />
            </button>
          </div>
        </div>
      </div>}

      <button type="submit" className="mt-6 rounded-[8px] bg-yellow-50 py-[8px] px-[12px] font-medium text-richblack-900">
        Sign In
      </button>

      {/* Divider with Icon */}
      <div className="relative flex items-center justify-center my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-richblack-600"></div>
        </div>
        <div className="relative bg-richblack-900 px-4">
          <span className="text-richblack-400 text-sm font-medium">Or</span>
        </div>
      </div>

      {/* Social Login Icons */}
      <div className="w-full flex items-center justify-center gap-4">
        {/* Google Sign-In Icon */}
        <div className="relative">
          <button type="button" onClick={() => {
          // Trigger the hidden GoogleLogin button
          const googleBtn = googleButtonRef.current?.querySelector('div[role="button"]');
          if (googleBtn) {
            googleBtn.click();
          }
        }} className="group relative w-14 h-14 flex items-center justify-center bg-white hover:bg-gray-50 rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200" title="Continue with Google">
            <FcGoogle className="text-2xl" />
          </button>
          {/* Hidden GoogleLogin component */}
          <div ref={googleButtonRef} className="absolute top-0 left-0 opacity-0 pointer-events-none w-0 h-0 overflow-hidden">
            <GoogleLogin onSuccess={handleGoogleSuccess} onError={handleGoogleError} theme="filled_blue" size="large" text="signin_with" shape="rectangular" scope="openid email profile" useOneTap={false} />
          </div>
        </div>

        {/* LinkedIn Sign-In Icon */}
        <button type="button" onClick={linkedInLogin} className="group relative w-14 h-14 flex items-center justify-center bg-[#0077B5] hover:bg-[#005582] rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200" title="Continue with LinkedIn">
          <FaLinkedin className="text-2xl text-white" />
        </button>

        {/* Facebook Sign-In Icon */}
        <button type="button" onClick={handleFacebookLogin} disabled={!isFacebookSDKLoaded} className={`group relative w-14 h-14 flex items-center justify-center rounded-full shadow-lg transition-all duration-200 ${isFacebookSDKLoaded ? 'bg-[#1877F2] hover:bg-[#0C63D4] hover:shadow-xl transform hover:scale-110 cursor-pointer' : 'bg-gray-400 cursor-not-allowed opacity-50'}`} title={isFacebookSDKLoaded ? "Continue with Facebook" : "Facebook SDK loading..."}>
          <FaFacebook className="text-2xl text-white" />
        </button>
      </div>
    </form>;
}
export default LoginForm;
