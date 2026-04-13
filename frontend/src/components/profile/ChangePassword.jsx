import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { useSelector } from 'react-redux';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const ChangePassword = () => {
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const [mode, setMode] = useState('change'); // 'change' or 'forgot'
    const [sendingOTP, setSendingOTP] = useState(false);

    const changePasswordFormik = useFormik({
        initialValues: { oldPassword: '', newPassword: '', confirmPassword: '' },
        validationSchema: Yup.object({
            oldPassword: Yup.string().required('Current Password is required'),
            newPassword: Yup.string()
                .min(8, 'Password must be at least 8 characters')
                .matches(/[A-Z]/, 'Must contain an uppercase letter')
                .matches(/[0-9]/, 'Must contain a number')
                .matches(/[@$!%*?&#]/, 'Must contain a special character')
                .required('New Password is required'),
            confirmPassword: Yup.string()
                .oneOf([Yup.ref('newPassword'), null], 'Passwords must match')
                .required('Confirm Password is required'),
        }),
        onSubmit: async (values, { setSubmitting, resetForm }) => {
            try {
                const token = user?.token || localStorage.getItem("token");
                const res = await axios.put(`${API_URL}/api/auth/change-password`,
                    { oldPassword: values.oldPassword, newPassword: values.newPassword },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                toast.success(res.data.message || 'Password updated successfully!', {
                    style: { borderRadius: '10px', background: '#ecfdf5', color: '#047857', fontWeight: 'bold' }
                });
                resetForm();
                setTimeout(() => navigate('/settings'), 1500);
            } catch (error) {
                toast.error(error.response?.data?.message || 'Failed to change password', {
                    style: { borderRadius: '10px', background: '#fff0f6', color: '#c53030', fontWeight: 'bold' }
                });
            } finally {
                setSubmitting(false);
            }
        },
    });

    const handleForgotPasswordClick = async () => {
        setSendingOTP(true);
        try {
            const res = await axios.post(`${API_URL}/api/auth/forgot-password-init`, { email: user?.email });
            toast.success(res.data.message || "OTP sent to your email!", {
                style: { borderRadius: '10px', background: '#ecfdf5', color: '#047857', fontWeight: 'bold' }
            });
            setMode('forgot');
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to send OTP", {
                style: { borderRadius: '10px', background: '#fff0f6', color: '#c53030', fontWeight: 'bold' }
            });
        } finally {
            setSendingOTP(false);
        }
    };

    const forgotPasswordFormik = useFormik({
        initialValues: { otp: '', newPassword: '', confirmPassword: '' },
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
                    email: user?.email,
                    otp: values.otp,
                    newPassword: values.newPassword
                };
                const res = await axios.post(`${API_URL}/api/auth/forgot-password-verify`, payload);
                toast.success(res.data.message || "Password reset successfully!", {
                    style: { borderRadius: '10px', background: '#ecfdf5', color: '#047857', fontWeight: 'bold' }
                });
                setTimeout(() => navigate("/settings"), 1500);
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
        <div className="min-h-screen bg-slate-900 pt-20 px-4 sm:px-6 lg:px-8 pb-12">
            <Toaster />
            <div className="max-w-xl mx-auto">
                <div className="bg-slate-800 rounded-2xl shadow-sm border border-slate-700 overflow-hidden">
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-slate-700 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate('/settings')}
                                className="p-2 -ml-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                {mode === 'change' ? 'Change Password' : 'Reset Password'}
                            </h2>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {mode === 'change' ? (
                            <form onSubmit={changePasswordFormik.handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Current Password</label>
                                    <input
                                        type="password"
                                        name="oldPassword"
                                        {...changePasswordFormik.getFieldProps("oldPassword")}
                                        className={`w-full px-4 py-3 rounded-xl border ${changePasswordFormik.touched.oldPassword && changePasswordFormik.errors.oldPassword ? 'border-red-500/50 bg-red-500/5 focus:ring-red-500/20' : 'border-slate-600 bg-slate-900/50 focus:ring-indigo-500/20 focus:border-indigo-500'} text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-4 transition-all duration-200`}
                                        placeholder="••••••••"
                                    />
                                    {changePasswordFormik.touched.oldPassword && changePasswordFormik.errors.oldPassword ? (
                                        <div className="text-red-400 text-xs mt-1.5">{changePasswordFormik.errors.oldPassword}</div>
                                    ) : null}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1.5">New Password</label>
                                    <input
                                        type="password"
                                        name="newPassword"
                                        {...changePasswordFormik.getFieldProps("newPassword")}
                                        className={`w-full px-4 py-3 rounded-xl border ${changePasswordFormik.touched.newPassword && changePasswordFormik.errors.newPassword ? 'border-red-500/50 bg-red-500/5 focus:ring-red-500/20' : 'border-slate-600 bg-slate-900/50 focus:ring-indigo-500/20 focus:border-indigo-500'} text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-4 transition-all duration-200`}
                                        placeholder="••••••••"
                                    />
                                    {changePasswordFormik.touched.newPassword && changePasswordFormik.errors.newPassword ? (
                                        <div className="text-red-400 text-xs mt-1.5">{changePasswordFormik.errors.newPassword}</div>
                                    ) : null}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirm New Password</label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        {...changePasswordFormik.getFieldProps("confirmPassword")}
                                        className={`w-full px-4 py-3 rounded-xl border ${changePasswordFormik.touched.confirmPassword && changePasswordFormik.errors.confirmPassword ? 'border-red-500/50 bg-red-500/5 focus:ring-red-500/20' : 'border-slate-600 bg-slate-900/50 focus:ring-indigo-500/20 focus:border-indigo-500'} text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-4 transition-all duration-200`}
                                        placeholder="••••••••"
                                    />
                                    {changePasswordFormik.touched.confirmPassword && changePasswordFormik.errors.confirmPassword ? (
                                        <div className="text-red-400 text-xs mt-1.5">{changePasswordFormik.errors.confirmPassword}</div>
                                    ) : null}
                                </div>

                                <div className="pt-4 flex items-center justify-between">
                                    <button
                                        type="button"
                                        onClick={handleForgotPasswordClick}
                                        disabled={sendingOTP}
                                        className={`text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors ${sendingOTP ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {sendingOTP ? 'Sending OTP...' : 'Forgot current password?'}
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={changePasswordFormik.isSubmitting}
                                        className={`px-6 py-2.5 rounded-xl text-white font-medium shadow-sm transition-all duration-200 ${changePasswordFormik.isSubmitting ? 'bg-indigo-600/50 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 hover:shadow-indigo-500/25 active:bg-indigo-700'}`}
                                    >
                                        {changePasswordFormik.isSubmitting ? 'Updating...' : 'Update Password'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={forgotPasswordFormik.handleSubmit} className="space-y-5">
                                <div className="mb-4">
                                    <p className="text-sm text-slate-400 bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 inline-block w-full">
                                        An OTP has been sent to <span className="text-slate-200 font-semibold">{user?.email}</span>. Please enter it below along with your new password.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1.5">One-Time Password (OTP)</label>
                                    <input
                                        type="text"
                                        name="otp"
                                        maxLength="6"
                                        {...forgotPasswordFormik.getFieldProps("otp")}
                                        className={`w-full px-4 py-3 rounded-xl border ${forgotPasswordFormik.touched.otp && forgotPasswordFormik.errors.otp ? 'border-red-500/50 bg-red-500/5 focus:ring-red-500/20' : 'border-slate-600 bg-slate-900/50 focus:ring-indigo-500/20 focus:border-indigo-500'} text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-4 transition-all duration-200 tracking-widest text-lg`}
                                        placeholder="123456"
                                    />
                                    {forgotPasswordFormik.touched.otp && forgotPasswordFormik.errors.otp ? (
                                        <div className="text-red-400 text-xs mt-1.5">{forgotPasswordFormik.errors.otp}</div>
                                    ) : null}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1.5">New Password</label>
                                    <input
                                        type="password"
                                        name="newPassword"
                                        {...forgotPasswordFormik.getFieldProps("newPassword")}
                                        className={`w-full px-4 py-3 rounded-xl border ${forgotPasswordFormik.touched.newPassword && forgotPasswordFormik.errors.newPassword ? 'border-red-500/50 bg-red-500/5 focus:ring-red-500/20' : 'border-slate-600 bg-slate-900/50 focus:ring-indigo-500/20 focus:border-indigo-500'} text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-4 transition-all duration-200`}
                                        placeholder="••••••••"
                                    />
                                    {forgotPasswordFormik.touched.newPassword && forgotPasswordFormik.errors.newPassword ? (
                                        <div className="text-red-400 text-xs mt-1.5">{forgotPasswordFormik.errors.newPassword}</div>
                                    ) : null}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirm New Password</label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        {...forgotPasswordFormik.getFieldProps("confirmPassword")}
                                        className={`w-full px-4 py-3 rounded-xl border ${forgotPasswordFormik.touched.confirmPassword && forgotPasswordFormik.errors.confirmPassword ? 'border-red-500/50 bg-red-500/5 focus:ring-red-500/20' : 'border-slate-600 bg-slate-900/50 focus:ring-indigo-500/20 focus:border-indigo-500'} text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-4 transition-all duration-200`}
                                        placeholder="••••••••"
                                    />
                                    {forgotPasswordFormik.touched.confirmPassword && forgotPasswordFormik.errors.confirmPassword ? (
                                        <div className="text-red-400 text-xs mt-1.5">{forgotPasswordFormik.errors.confirmPassword}</div>
                                    ) : null}
                                </div>

                                <div className="pt-4 flex justify-between items-center">
                                    <button
                                        type="button"
                                        onClick={() => setMode('change')}
                                        className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
                                    >
                                        ← Back
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={forgotPasswordFormik.isSubmitting}
                                        className={`px-6 py-2.5 rounded-xl text-white font-medium shadow-sm transition-all duration-200 ${forgotPasswordFormik.isSubmitting ? 'bg-indigo-600/50 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 hover:shadow-indigo-500/25 active:bg-indigo-700'}`}
                                    >
                                        {forgotPasswordFormik.isSubmitting ? 'Resetting...' : 'Reset Password'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChangePassword;
