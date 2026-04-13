import React, { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");

  const emailFormik = useFormik({
    initialValues: { email: "" },
    validationSchema: Yup.object({
      email: Yup.string().email("Invalid email address").required("Email is required"),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const res = await axios.post(`${API_URL}/api/auth/forgot-password-init`, { email: values.email });
        toast.success(res.data.message || "OTP sent to your email!", {
           style: { borderRadius: '10px', background: '#ecfdf5', color: '#047857', fontWeight: 'bold' }
        });
        setEmail(values.email);
        setStep(2);
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to send OTP", {
           style: { borderRadius: '10px', background: '#fff0f6', color: '#c53030', fontWeight: 'bold' }
        });
      } finally {
        setSubmitting(false);
      }
    },
  });

  const resetFormik = useFormik({
    initialValues: { otp: "", newPassword: "", confirmPassword: "" },
    validationSchema: Yup.object({
      otp: Yup.string().length(6, "OTP must be 6 digits").required("OTP is required"),
      newPassword: Yup.string()
        .min(8, "Password must be at least 8 characters")
        .matches(/[A-Z]/, "Must contain an uppercase letter")
        .matches(/[0-9]/, "Must contain a number")
        .matches(/[@$!%*?&#]/, "Must contain a special character")
        .required("New Password is required"),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref("newPassword"), null], "Passwords must match")
        .required("Confirm Password is required"),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const payload = {
            email,
            otp: values.otp,
            newPassword: values.newPassword
        };
        const res = await axios.post(`${API_URL}/api/auth/forgot-password-verify`, payload);
        toast.success(res.data.message || "Password updated successfully!", {
           style: { borderRadius: '10px', background: '#ecfdf5', color: '#047857', fontWeight: 'bold' }
        });
        setTimeout(() => navigate("/login"), 1500);
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to reset password", {
           style: { borderRadius: '10px', background: '#fff0f6', color: '#c53030', fontWeight: 'bold' }
        });
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div className="min-h-screen flex h-screen w-full bg-[#1A1A24]">
      <Toaster />

      {/* LEFT PANEL */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 lg:px-24">
        <div className="max-w-md w-full mx-auto">
          {step === 1 ? (
             <>
               {/* STEP 1: Email Form */}
               <div className="mb-10">
                 <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
                   Reset your password
                 </h1>
                 <p className="text-gray-400 font-medium">
                   Enter your registered email and we'll send you an OTP to reset your password.
                 </p>
               </div>

               <form onSubmit={emailFormik.handleSubmit} className="space-y-6">
                 <div>
                   <label className="block text-sm font-semibold text-gray-300 mb-2">Email Address</label>
                   <input
                     type="email"
                     name="email"
                     {...emailFormik.getFieldProps("email")}
                     className={`w-full px-4 py-3 rounded-lg border ${emailFormik.touched.email && emailFormik.errors.email ? 'border-red-500 focus:ring-red-500/20' : 'border-[#2D2D3B] focus:ring-[#8E54E9]/20 focus:border-[#8E54E9]'} bg-[#232330] text-white placeholder-gray-500 focus:outline-none focus:ring-4 transition-all duration-200`}
                     placeholder="name@example.com"
                   />
                   {emailFormik.touched.email && emailFormik.errors.email ? (
                     <div className="text-red-500 text-xs font-medium mt-2 flex items-center gap-1">
                       ⚠️ {emailFormik.errors.email}
                     </div>
                   ) : null}
                 </div>

                 <div className="pt-4">
                   <button
                     type="submit"
                     disabled={emailFormik.isSubmitting}
                     className={`w-full py-3.5 px-4 rounded-lg text-white font-bold text-sm tracking-wide transition-all ${emailFormik.isSubmitting ? 'bg-[#5a4387] cursor-not-allowed' : 'bg-[#7A42E4] hover:bg-[#6835C4] hover:shadow-lg hover:shadow-[#7A42E4]/25'}`}
                   >
                     {emailFormik.isSubmitting ? 'Sending OTP...' : 'Send OTP'}
                   </button>
                 </div>
               </form>
             </>
          ) : (
            <>
               {/* STEP 2: OTP & New Password */}
               <div className="mb-10">
                 <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
                   Set new password
                 </h1>
                 <p className="text-gray-400 font-medium">
                   Please enter the 6-digit OTP sent to <span className="text-white font-semibold">{email}</span> and your new password.
                 </p>
               </div>

               <form onSubmit={resetFormik.handleSubmit} className="space-y-6">
                 {/* OTP Input */}
                 <div>
                   <label className="block text-sm font-semibold text-gray-300 mb-2">One-Time Password (OTP)</label>
                   <input
                     type="text"
                     name="otp"
                     maxLength="6"
                     {...resetFormik.getFieldProps("otp")}
                     className={`w-full px-4 py-3 rounded-lg border ${resetFormik.touched.otp && resetFormik.errors.otp ? 'border-red-500 focus:ring-red-500/20' : 'border-[#2D2D3B] focus:ring-[#8E54E9]/20 focus:border-[#8E54E9]'} bg-[#232330] text-white placeholder-gray-500 focus:outline-none focus:ring-4 transition-all duration-200 tracking-widest text-lg`}
                     placeholder="123456"
                   />
                   {resetFormik.touched.otp && resetFormik.errors.otp ? (
                     <div className="text-red-500 text-xs font-medium mt-2 flex items-center gap-1">
                       ⚠️ {resetFormik.errors.otp}
                     </div>
                   ) : null}
                 </div>

                 {/* New Password */}
                 <div>
                   <label className="block text-sm font-semibold text-gray-300 mb-2">New Password</label>
                   <input
                     type="password"
                     name="newPassword"
                     {...resetFormik.getFieldProps("newPassword")}
                     className={`w-full px-4 py-3 rounded-lg border ${resetFormik.touched.newPassword && resetFormik.errors.newPassword ? 'border-red-500 focus:ring-red-500/20' : 'border-[#2D2D3B] focus:ring-[#8E54E9]/20 focus:border-[#8E54E9]'} bg-[#232330] text-white placeholder-gray-500 focus:outline-none focus:ring-4 transition-all duration-200`}
                     placeholder="••••••••"
                   />
                   {resetFormik.touched.newPassword && resetFormik.errors.newPassword ? (
                     <div className="text-red-500 text-xs font-medium mt-2 flex items-center gap-1">
                       ⚠️ {resetFormik.errors.newPassword}
                     </div>
                   ) : null}
                 </div>

                 {/* Confirm Password */}
                 <div>
                   <label className="block text-sm font-semibold text-gray-300 mb-2">Confirm New Password</label>
                   <input
                     type="password"
                     name="confirmPassword"
                     {...resetFormik.getFieldProps("confirmPassword")}
                     className={`w-full px-4 py-3 rounded-lg border ${resetFormik.touched.confirmPassword && resetFormik.errors.confirmPassword ? 'border-red-500 focus:ring-red-500/20' : 'border-[#2D2D3B] focus:ring-[#8E54E9]/20 focus:border-[#8E54E9]'} bg-[#232330] text-white placeholder-gray-500 focus:outline-none focus:ring-4 transition-all duration-200`}
                     placeholder="••••••••"
                   />
                   {resetFormik.touched.confirmPassword && resetFormik.errors.confirmPassword ? (
                     <div className="text-red-500 text-xs font-medium mt-2 flex items-center gap-1">
                       ⚠️ {resetFormik.errors.confirmPassword}
                     </div>
                   ) : null}
                 </div>

                 <div className="pt-4">
                   <button
                     type="submit"
                     disabled={resetFormik.isSubmitting}
                     className={`w-full py-3.5 px-4 rounded-lg text-white font-bold text-sm tracking-wide transition-all ${resetFormik.isSubmitting ? 'bg-[#5a4387] cursor-not-allowed' : 'bg-[#7A42E4] hover:bg-[#6835C4] hover:shadow-lg hover:shadow-[#7A42E4]/25'}`}
                   >
                     {resetFormik.isSubmitting ? 'Resetting Password...' : 'Reset Password'}
                   </button>
                 </div>
               </form>
               <div className="mt-4 text-center">
                   <button onClick={() => setStep(1)} className="text-sm text-gray-400 hover:text-white transition-colors">
                     ← Change email / Resend OTP
                   </button>
               </div>
            </>
          )}

          {/* Footer Back to Login Link */}
          <div className="mt-8 text-center sm:text-left">
            <p className="text-gray-400 text-sm">
              Remember your password?{" "}
              <Link to="/login" className="text-white font-semibold hover:text-[#8E54E9] transition-colors">
                Log In
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Branding Image / Logo (Matched with Login) */}
      <div className="hidden lg:flex w-1/2 relative bg-[#0D0D14] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1b1535]/80 via-[#271E4A]/60 to-[#100D1C]/90 z-10 mix-blend-multiply"></div>
        <img
          src="https://images.unsplash.com/photo-1542332213-31f87348057f?q=80&w=2670&auto=format&fit=crop"
          alt="Abstract Sand Dunes"
          className="absolute inset-0 w-full h-full object-cover z-0 object-center opacity-80"
        />
        <div className="relative z-20 flex flex-col justify-between w-full h-full p-16">
          <div className="flex items-center justify-between">
            <h2 className="text-white text-3xl font-black tracking-tighter" style={{ fontFamily: "'Outfit', sans-serif" }}>
              SentiAware.
            </h2>
          </div>
          <div className="max-w-lg mb-8">
            <h3 className="text-white text-4xl font-semibold leading-tight tracking-tight">
              Regain Access,<br />
              Secure Your Memories
            </h3>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ForgotPassword;
