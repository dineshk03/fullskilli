import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { BiArrowBack } from "react-icons/bi";
import OTPInput from "react-otp-input";
import { toast } from "react-hot-toast";
import { verifyGoogleOTP } from "../services/operations/authAPI";
function VerifyGoogleOTP() {
  const [otp, setOtp] = useState("");
  const {
    loading
  } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  useEffect(() => {
    // Get email from localStorage
    const storedEmail = localStorage.getItem('googleLoginEmail');
    if (!storedEmail) {
      toast.error("Session expired. Please login again.");
      navigate("/login");
    } else {
      setEmail(storedEmail);
    }
  }, [navigate]);
  const handleVerifyAndSignup = e => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }
    dispatch(verifyGoogleOTP(email, otp, navigate));
  };
  return <div className="min-h-[calc(100vh-3.5rem)] grid place-items-center bg-richblack-900">
      <div className="max-w-[500px] p-4 lg:p-8">
        <div className="bg-richblack-800 p-8 rounded-xl border border-richblack-700 shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-center mb-6">
            <div className="bg-white p-3 rounded-full">
              <FcGoogle className="text-4xl" />
            </div>
          </div>

          <h1 className="text-richblack-5 font-semibold text-[1.875rem] leading-[2.375rem] text-center">
            Welcome to Beeja Academy!
          </h1>
          
          <p className="text-[1.125rem] leading-[1.625rem] my-4 text-richblack-100 text-center">
            Please verify your email to complete registration
          </p>
          
          <p className="text-sm text-richblack-300 text-center mb-2">
            We&apos;ve sent a 6-digit code to:
          </p>
          
          <p className="text-richblack-5 font-semibold text-center mb-6">
            {email}
          </p>

          <form onSubmit={handleVerifyAndSignup}>
            <div className="mb-6">
              <OTPInput value={otp} onChange={setOtp} numInputs={6} renderInput={props => <input {...props} placeholder="-" style={{
              boxShadow: "inset 0px -1px 0px rgba(255, 255, 255, 0.18)"
            }} className="w-[48px] lg:w-[60px] border-0 bg-richblack-700 rounded-[0.5rem] text-richblack-5 aspect-square text-center focus:border-0 focus:outline-2 focus:outline-yellow-50" />} containerStyle={{
              justifyContent: "space-between",
              gap: "0 6px"
            }} />
            </div>

            <button type="submit" disabled={loading} className="w-full bg-yellow-50 py-[12px] px-[12px] rounded-[8px] mt-6 font-medium text-richblack-900 hover:bg-yellow-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? "Verifying..." : "Complete Registration"}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between">
            <Link to="/login">
              <p className="text-richblack-5 flex items-center gap-x-2 hover:text-richblack-100 transition-all duration-200">
                <BiArrowBack /> Back To Login
              </p>
            </Link>
          </div>

          {/* Info */}
          <div className="mt-6 p-4 bg-richblack-700 rounded-lg border border-richblack-600">
            <p className="text-xs text-richblack-300 text-center">
              🔒 This verification is required only for first-time Google login.
              The OTP is valid for 5 minutes.
            </p>
          </div>
        </div>
      </div>
    </div>;
}
export default VerifyGoogleOTP;
