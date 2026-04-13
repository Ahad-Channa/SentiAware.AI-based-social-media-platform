import React from "react";
import { useDispatch } from "react-redux";
import { useFormik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { loginSuccess } from "../../redux/authSlice";
import { useNavigate, Link } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: Yup.object({
      email: Yup.string().email("Invalid email address").required("Email is required"),
      password: Yup.string().required("Password is required"),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const res = await axios.post(`${API_URL}/api/auth/login`, values);
        dispatch(loginSuccess(res.data)); // save user in Redux + localStorage
        navigate("/feed"); // redirect after login
      } catch (error) {
        toast.error(error.response?.data?.message || "Login failed", {
          duration: 4000,
          position: "top-center",
          style: {
            borderRadius: '10px',
            background: '#fff0f6',
            color: '#c53030',
            fontWeight: 'bold',
          }
        });
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div className="min-h-screen flex h-screen w-full bg-[#1A1A24]">
      <Toaster />

      {/* LEFT PANEL: Form Side (Dark Theme) */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 lg:px-24">
        <div className="max-w-md w-full mx-auto">

          {/* Header */}
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
              Log in to your account
            </h1>
            <p className="text-gray-400 font-medium">
              Welcome back! Please enter your details.
            </p>
          </div>

          <form onSubmit={formik.handleSubmit} className="space-y-6">

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Email</label>
              <input
                type="email"
                name="email"
                {...formik.getFieldProps("email")}
                className={`w-full px-4 py-3 rounded-lg border ${formik.touched.email && formik.errors.email ? 'border-red-500 focus:ring-red-500/20' : 'border-[#2D2D3B] focus:ring-[#8E54E9]/20 focus:border-[#8E54E9]'} bg-[#232330] text-white placeholder-gray-500 focus:outline-none focus:ring-4 transition-all duration-200`}
                placeholder="name@example.com"
              />
              {formik.touched.email && formik.errors.email ? (
                <div className="text-red-500 text-xs font-medium mt-2 flex items-center gap-1">
                  ⚠️ {formik.errors.email}
                </div>
              ) : null}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-300">Password</label>
                <Link to="/forgot-password" className="text-sm font-medium text-[#8E54E9] hover:text-[#a57ced] transition-colors">
                  Forgot Password?
                </Link>
              </div>
              <input
                type="password"
                name="password"
                {...formik.getFieldProps("password")}
                className={`w-full px-4 py-3 rounded-lg border ${formik.touched.password && formik.errors.password ? 'border-red-500 focus:ring-red-500/20' : 'border-[#2D2D3B] focus:ring-[#8E54E9]/20 focus:border-[#8E54E9]'} bg-[#232330] text-white placeholder-gray-500 focus:outline-none focus:ring-4 transition-all duration-200`}
                placeholder="••••••••"
              />
              {formik.touched.password && formik.errors.password ? (
                <div className="text-red-500 text-xs font-medium mt-2 flex items-center gap-1">
                  ⚠️ {formik.errors.password}
                </div>
              ) : null}
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={formik.isSubmitting}
                className={`w-full py-3.5 px-4 rounded-lg text-white font-bold text-sm tracking-wide transition-all ${formik.isSubmitting ? 'bg-[#5a4387] cursor-not-allowed' : 'bg-[#7A42E4] hover:bg-[#6835C4] hover:shadow-lg hover:shadow-[#7A42E4]/25'}`}
              >
                {formik.isSubmitting ? 'Signing in...' : 'Sign In'}
              </button>
            </div>

          </form>

          {/* Footer */}
          <div className="mt-8 text-center sm:text-left">
            <p className="text-gray-400 text-sm">
              Don't have an account?{" "}
              <Link to="/signup" className="text-white font-semibold hover:text-[#8E54E9] transition-colors">
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Branding Image / Logo */}
      <div className="hidden lg:flex w-1/2 relative bg-[#0D0D14] overflow-hidden">
        {/* Dark Purple Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1b1535]/80 via-[#271E4A]/60 to-[#100D1C]/90 z-10 mix-blend-multiply"></div>

        {/* Placeholder Sand Dune Image (similar vibe to reference) */}
        <img
          src="https://images.unsplash.com/photo-1542332213-31f87348057f?q=80&w=2670&auto=format&fit=crop"
          alt="Abstract Sand Dunes"
          className="absolute inset-0 w-full h-full object-cover z-0 object-center opacity-80"
        />

        {/* Branding Content */}
        <div className="relative z-20 flex flex-col justify-between w-full h-full p-16">
          {/* Top Logo */}
          <div className="flex items-center justify-between">
            <h2 className="text-white text-3xl font-black tracking-tighter" style={{ fontFamily: "'Outfit', sans-serif" }}>
              SentiAware.
            </h2>
          </div>

          {/* Bottom Tagline */}
          <div className="max-w-lg mb-8">
            <h3 className="text-white text-4xl font-semibold leading-tight tracking-tight">
              Capturing Moments,<br />
              Creating Memories
            </h3>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Login;
