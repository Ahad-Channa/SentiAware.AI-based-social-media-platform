import React from 'react';
import { useNavigate } from 'react-router-dom';

const settingsItems = [
    {
        id: 'moderation-log',
        label: 'AI Moderation Log',
        description: 'View posts that were automatically flagged and cleaned by our AI.',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        ),
        iconBg: 'bg-orange-500/15',
        iconColor: 'text-orange-400',
        route: '/settings/moderation-log',
        disabled: false,
    },
    {
        id: 'change-password',
        label: 'Change Password',
        description: 'Update your account password to keep your account secure.',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
        ),
        iconBg: 'bg-indigo-500/15',
        iconColor: 'text-indigo-400',
        route: '/settings/change-password',
        disabled: false,
    },
];

const Settings = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-900 pt-20 px-4 sm:px-6 lg:px-8 pb-12">
            <div className="max-w-3xl mx-auto">
                <div className="bg-slate-800 rounded-2xl shadow-sm border border-slate-700 overflow-hidden">

                    {/* Header */}
                    <div className="px-6 py-5 border-b border-slate-700">
                        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                            <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Account Settings
                        </h2>
                        <p className="mt-1 text-sm text-slate-400">
                            Manage your account preferences and security.
                        </p>
                    </div>

                    {/* Settings Cards */}
                    <div className="p-6 space-y-3">
                        {settingsItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => !item.disabled && navigate(item.route)}
                                disabled={item.disabled}
                                className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 text-left group
                                    ${item.disabled
                                        ? 'border-slate-700/50 bg-slate-800/40 cursor-not-allowed opacity-60'
                                        : 'border-slate-700 bg-slate-700/20 hover:bg-slate-700/50 hover:border-slate-600 cursor-pointer'
                                    }`}
                            >
                                {/* Icon */}
                                <div className={`flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-xl ${item.iconBg} ${item.iconColor}`}>
                                    {item.icon}
                                </div>

                                {/* Text */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-slate-100 text-sm">{item.label}</span>
                                        {item.badge && (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-600 text-slate-400 font-medium">
                                                {item.badge}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-400 mt-0.5 truncate">{item.description}</p>
                                </div>

                                {/* Chevron */}
                                {!item.disabled && (
                                    <svg className="w-4 h-4 text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all duration-200 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                    </svg>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
