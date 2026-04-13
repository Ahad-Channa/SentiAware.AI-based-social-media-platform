
import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useFormik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { loginSuccess } from "../../redux/authSlice";
import { useNavigate, Link } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";

const Signup = () => {
  const [profilePic, setProfilePic] = useState(null);
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  // Timer states
  const [timeLeft, setTimeLeft] = useState(60); // 1 minute
  const [canResend, setCanResend] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Countdown effect
  useEffect(() => {
    if (!showOtp) return;
    if (timeLeft <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, showOtp]);

  const formatTime = (sec) => {
    const m = String(Math.floor(sec / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  const formik = useFormik({
    initialValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      gender: "",
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Full Name is required"),
      email: Yup.string().email("Invalid email address").required("Email is required"),
      password: Yup.string()
        .min(8, "Password must be 8+ chars, with an uppercase letter, number, & special character")
        .matches(/[A-Z]/, "Password must be 8+ chars, with an uppercase letter, number, & special character")
        .matches(/[0-9]/, "Password must be 8+ chars, with an uppercase letter, number, & special character")
        .matches(/[@$!%*?&#]/, "Password must be 8+ chars, with an uppercase letter, number, & special character")
        .required("Password is required"),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password'), null], "Passwords must match")
        .required("Confirm Password is required"),
      gender: Yup.string().required("Please select your gender"),
    }),
    onSubmit: async (values) => {
      try {
        setLoading(true);
        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
        await axios.post(`${API_URL}/api/auth/register-init`, {
          name: values.name,
          email: values.email,
          password: values.password,
          gender: values.gender,
        });

        toast.success("OTP sent to your email", {
          style: {
            borderRadius: '10px',
            background: '#f0fdf4',
            color: '#15803d',
            fontWeight: 'bold',
          }
        });
        setShowOtp(true);
        setTimeLeft(60);
        setCanResend(false);
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to send OTP", {
          style: {
            borderRadius: '10px',
            background: '#fff0f6',
            color: '#c53030',
            fontWeight: 'bold',
          }
        });

        // If the error is about an existing unexpired OTP, show the modal anyway
        if (error.response?.data?.message?.includes("OTP was already sent")) {
          setShowOtp(true);
          // Don't reset time left since we don't know exactly, just leave it as is or a generic value
        }
      } finally {
        setLoading(false);
      }
    },
  });

  const handleFileChange = (e) => {
    setProfilePic(e.target.files[0]);
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      toast.error("Enter OTP");
      return;
    }

    if (timeLeft <= 0) {
      toast.error("OTP expired. Please resend.");
      return;
    }

    const form = new FormData();
    form.append("name", formik.values.name);
    form.append("email", formik.values.email);
    form.append("password", formik.values.password);
    form.append("otp", otp);
    if (profilePic) form.append("profilePic", profilePic);

    try {
      setLoading(true);
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const res = await axios.post(
        `${API_URL}/api/auth/register-verify`,
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      dispatch(loginSuccess(res.data));
      toast.success("Account verified & created!");
      navigate("/feed");
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    try {
      setLoading(true);
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      await axios.post(`${API_URL}/api/auth/register-init`, {
        name: formik.values.name,
        email: formik.values.email,
        password: formik.values.password,
        gender: formik.values.gender,
      });

      toast.success("New OTP sent");
      setTimeLeft(60);
      setCanResend(false);
    } catch {
      toast.error("Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex h-screen w-full bg-[#1A1A24]">
      <Toaster />

      {/* LEFT PANEL: Branding Image / Logo (Mirrored for Signup) */}
      <div className="hidden lg:flex w-1/2 relative bg-[#0D0D14] overflow-hidden">
        {/* Dark Purple Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1b1535]/80 via-[#271E4A]/60 to-[#100D1C]/90 z-10 mix-blend-multiply"></div>

        <img
          src="https://images.unsplash.com/photo-1542332213-31f87348057f?q=80&w=2670&auto=format&fit=crop"
          alt="Abstract Sand Dunes"
          className="absolute inset-0 w-full h-full object-cover z-0 object-center opacity-80"
        />

        {/* Branding Content */}
        <div className="relative z-20 flex flex-col justify-between w-full h-full p-16">
          <div className="flex items-center justify-between">
            <h2 className="text-white text-3xl font-black tracking-tighter" style={{ fontFamily: "'Outfit', sans-serif" }}>
              SentiAware.
            </h2>
          </div>

          <div className="max-w-lg mb-8">
            <h3 className="text-white text-4xl font-semibold leading-tight tracking-tight">
              Capturing Moments,<br />
              Creating Memories
            </h3>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Form Side (Dark Theme) */}
      <div className="w-full lg:w-1/2 flex flex-col px-8 sm:px-16 lg:px-24 h-screen overflow-y-auto custom-scrollbar">
        <div className="max-w-md w-full mx-auto py-12 md:py-20">

          {/* Header */}
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
              Create an account
            </h1>
            <p className="text-gray-400 font-medium">
              Join us to start exploring.
            </p>
          </div>

          <form onSubmit={formik.handleSubmit} className="space-y-5">

            {/* Name */}
            <div>
              <input
                type="text"
                name="name"
                {...formik.getFieldProps("name")}
                placeholder="Full Name"
                className={`w-full px-4 py-3 rounded-lg border ${formik.touched.name && formik.errors.name ? 'border-red-500 focus:ring-red-500/20' : 'border-[#2D2D3B] focus:ring-[#8E54E9]/20 focus:border-[#8E54E9]'} bg-[#232330] text-white placeholder-gray-500 focus:outline-none focus:ring-4 transition-all duration-200`}
              />
              {formik.touched.name && formik.errors.name ? (
                <div className="text-red-500 text-xs font-medium mt-2 flex items-center gap-1">⚠️ {formik.errors.name}</div>
              ) : null}
            </div>

            {/* Email */}
            <div>
              <input
                type="email"
                name="email"
                {...formik.getFieldProps("email")}
                placeholder="Email address"
                className={`w-full px-4 py-3 rounded-lg border ${formik.touched.email && formik.errors.email ? 'border-red-500 focus:ring-red-500/20' : 'border-[#2D2D3B] focus:ring-[#8E54E9]/20 focus:border-[#8E54E9]'} bg-[#232330] text-white placeholder-gray-500 focus:outline-none focus:ring-4 transition-all duration-200`}
              />
              {formik.touched.email && formik.errors.email ? (
                <div className="text-red-500 text-xs font-medium mt-2 flex items-center gap-1">⚠️ {formik.errors.email}</div>
              ) : null}
            </div>

            {/* Password */}
            <div>
              <input
                type="password"
                name="password"
                {...formik.getFieldProps("password")}
                placeholder="Password"
                className={`w-full px-4 py-3 rounded-lg border ${formik.touched.password && formik.errors.password ? 'border-red-500 focus:ring-red-500/20' : 'border-[#2D2D3B] focus:ring-[#8E54E9]/20 focus:border-[#8E54E9]'} bg-[#232330] text-white placeholder-gray-500 focus:outline-none focus:ring-4 transition-all duration-200`}
              />
              {formik.touched.password && formik.errors.password ? (
                <div className="text-red-500 text-xs font-medium mt-2 flex items-center gap-1">⚠️ {formik.errors.password}</div>
              ) : null}
            </div>

            {/* Confirm Password */}
            <div>
              <input
                type="password"
                name="confirmPassword"
                {...formik.getFieldProps("confirmPassword")}
                placeholder="Confirm Password"
                className={`w-full px-4 py-3 rounded-lg border ${formik.touched.confirmPassword && formik.errors.confirmPassword ? 'border-red-500 focus:ring-red-500/20' : 'border-[#2D2D3B] focus:ring-[#8E54E9]/20 focus:border-[#8E54E9]'} bg-[#232330] text-white placeholder-gray-500 focus:outline-none focus:ring-4 transition-all duration-200`}
              />
              {formik.touched.confirmPassword && formik.errors.confirmPassword ? (
                <div className="text-red-500 text-xs font-medium mt-2 flex items-center gap-1">⚠️ {formik.errors.confirmPassword}</div>
              ) : null}
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => formik.setFieldValue('gender', 'boy')}
                  className={`py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${formik.values.gender === 'boy'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-[#232330] text-gray-400 border border-[#2D2D3B] hover:bg-[#2D2D3B] hover:text-white'
                    }`}
                >
                  Boy
                </button>
                <button
                  type="button"
                  onClick={() => formik.setFieldValue('gender', 'girl')}
                  className={`py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${formik.values.gender === 'girl'
                    ? 'bg-pink-600 text-white shadow-lg shadow-pink-500/30'
                    : 'bg-[#232330] text-gray-400 border border-[#2D2D3B] hover:bg-[#2D2D3B] hover:text-white'
                    }`}
                >
                  Girl
                </button>
                <button
                  type="button"
                  onClick={() => formik.setFieldValue('gender', 'other')}
                  className={`py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${formik.values.gender === 'other'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                    : 'bg-[#232330] text-gray-400 border border-[#2D2D3B] hover:bg-[#2D2D3B] hover:text-white'
                    }`}
                >
                  Other
                </button>
              </div>
              {formik.touched.gender && formik.errors.gender ? (
                <div className="text-red-500 text-xs font-medium mt-2 flex items-center gap-1">⚠️ {formik.errors.gender}</div>
              ) : null}
            </div>

            {/* File Upload - Styled */}
            <div className="relative pt-2">
              <label className="flex items-center justify-center w-full px-4 py-3 bg-[#232330] border border-[#2D2D3B] border-dashed rounded-lg cursor-pointer hover:bg-[#2A2A3A] transition-colors focus-within:ring-4 focus-within:ring-[#8E54E9]/20">
                <span className="text-sm font-medium text-gray-400 truncate max-w-[200px]">
                  {profilePic ? profilePic.name : "Upload Profile Picture (Optional)"}
                </span>
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading || formik.isSubmitting}
                className={`w-full py-3.5 px-4 rounded-lg text-white font-bold text-sm tracking-wide transition-all ${loading || formik.isSubmitting ? 'bg-[#5a4387] cursor-not-allowed' : 'bg-[#7A42E4] hover:bg-[#6835C4] hover:shadow-lg hover:shadow-[#7A42E4]/25'}`}
              >
                {loading ? "Processing..." : "Create account"}
              </button>
            </div>
          </form>

          <p className="text-center sm:text-left text-gray-400 mt-8 text-sm">
            Already have an account?{" "}
            <Link to="/login" className="text-white font-semibold hover:text-[#8E54E9] transition-colors">Log in</Link>
          </p>
        </div>
      </div>

      {/* OTP MODAL - Dark Theme Update */}
      {showOtp && (
        <div className="absolute inset-0 z-50 bg-[#000000]/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1A1A24] p-8 rounded-2xl border border-[#2D2D3B] shadow-2xl w-full max-w-sm animate-in fade-in zoom-in duration-200 relative">
            <button
              onClick={() => setShowOtp(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-[#8E54E9] transition-colors p-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-white">Verify Email</h3>
              <p className="text-sm text-gray-400 mt-2">
                We sent a secure code to your email.
              </p>
            </div>

            <div className="mb-6 text-center">
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${timeLeft > 0 ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                {timeLeft > 0 ? `Expires in ${formatTime(timeLeft)}` : "Code Expired"}
              </span>
            </div>

            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter 6-digit code"
              className="w-full px-4 py-4 text-center text-xl tracking-[0.5em] font-mono border border-[#2D2D3B] rounded-lg focus:outline-none focus:ring-4 focus:ring-[#8E54E9]/20 focus:border-[#8E54E9] bg-[#232330] text-white placeholder-gray-600 mb-6"
              maxLength={6}
            />

            <div className="space-y-3">
              <button
                onClick={handleVerifyOtp}
                disabled={loading || timeLeft <= 0}
                className="w-full py-3.5 rounded-lg bg-[#7A42E4] text-white font-bold text-sm tracking-wide hover:bg-[#6835C4] hover:shadow-lg hover:shadow-[#7A42E4]/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Verifying..." : "Verify & Create Account"}
              </button>

              <button
                onClick={resendOtp}
                disabled={!canResend || loading}
                className={`w-full py-3 rounded-lg text-sm font-semibold transition-colors ${canResend ? "text-white bg-[#232330] hover:bg-[#2D2D3B] border border-[#2D2D3B]" : "text-gray-500 bg-transparent cursor-not-allowed"
                  }`}
              >
                Resend Code
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Signup;
