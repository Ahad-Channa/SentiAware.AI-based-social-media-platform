import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getModerationLogs, getCommentModerationLogs, getMessageModerationLogs } from '../../api/api';
import { formatDistanceToNow } from 'date-fns';

const LogTable = ({ logs, isLoading, error, emptyMessage, columns }) => {
    if (isLoading) return (
        <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
    );
    if (error) return (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl">{error}</div>
    );
    if (logs.length === 0) return (
        <div className="text-center p-10 border border-slate-700 border-dashed rounded-xl bg-slate-800/50">
            <svg className="w-10 h-10 text-slate-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-slate-400 font-medium">{emptyMessage}</p>
            <p className="text-slate-500 text-sm mt-1">Keep it clean — you're all good!</p>
        </div>
    );
    return (
        <div className="overflow-x-auto rounded-xl border border-slate-700">
            <table className="w-full text-left text-sm text-slate-300">
                <thead className="text-xs text-slate-400 uppercase bg-slate-700/60">
                    <tr>
                        {columns.map((col) => (
                            <th key={col} className="px-4 py-3">{col}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                    {logs.map((log) => (
                        <tr key={log._id} className="hover:bg-slate-700/20 transition-colors">
                            <td className="px-4 py-4 whitespace-nowrap text-slate-400 text-xs">
                                {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                            </td>
                            <td className="px-4 py-4 max-w-[240px] truncate text-red-400 font-medium cursor-help" title={log.originalContent || log.originalText}>
                                {log.originalContent || log.originalText || 'N/A'}
                            </td>
                            <td className="px-4 py-4 max-w-[240px] truncate text-emerald-400 cursor-help" title={log.content || log.text}>
                                {log.content || log.text}
                            </td>
                            {log.type !== undefined && (
                                <td className="px-4 py-4">
                                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${log.type === 'reply' ? 'bg-purple-500/15 text-purple-400' : 'bg-blue-500/15 text-blue-400'}`}>
                                        {log.type}
                                    </span>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const TABS = [
    { id: 'posts', label: 'Posts', icon: '📄' },
    { id: 'comments', label: 'Comments & Replies', icon: '💬' },
    { id: 'messages', label: 'Messages', icon: '✉️' },
];

const ModerationLog = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('posts');

    const [postLogs, setPostLogs] = useState([]);
    const [postLoading, setPostLoading] = useState(true);
    const [postError, setPostError] = useState(null);

    const [commentLogs, setCommentLogs] = useState([]);
    const [commentLoading, setCommentLoading] = useState(true);
    const [commentError, setCommentError] = useState(null);

    const [messageLogs, setMessageLogs] = useState([]);
    const [messageLoading, setMessageLoading] = useState(true);
    const [messageError, setMessageError] = useState(null);

    useEffect(() => {
        getModerationLogs()
            .then(setPostLogs)
            .catch(() => setPostError('Failed to load post moderation history.'))
            .finally(() => setPostLoading(false));

        getCommentModerationLogs()
            .then(setCommentLogs)
            .catch(() => setCommentError('Failed to load comment moderation history.'))
            .finally(() => setCommentLoading(false));

        getMessageModerationLogs()
            .then(data => setMessageLogs(data.map(m => ({
                _id: m._id,
                originalText: m.originalMessage || 'N/A',
                text: m.message,
                createdAt: m.createdAt,
            }))))
            .catch(() => setMessageError('Failed to load message moderation history.'))
            .finally(() => setMessageLoading(false));
    }, []);

    return (
        <div className="min-h-screen bg-slate-900 pt-20 px-4 sm:px-6 lg:px-8 pb-12">
            <div className="max-w-4xl mx-auto">
                <div className="bg-slate-800 rounded-2xl shadow-sm border border-slate-700 overflow-hidden">

                    {/* Header */}
                    <div className="px-6 py-5 border-b border-slate-700 flex items-center gap-3">
                        <button
                            onClick={() => navigate('/settings')}
                            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-700 transition-all duration-200"
                            title="Back to Settings"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div>
                            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                                <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                AI Moderation Log
                            </h2>
                            <p className="mt-0.5 text-sm text-slate-400">Content automatically moderated by our AI system.</p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-slate-700 px-6">
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-200 -mb-px
                                    ${activeTab === tab.id
                                        ? 'border-indigo-500 text-indigo-400'
                                        : 'border-transparent text-slate-400 hover:text-slate-200'
                                    }`}
                            >
                                <span>{tab.icon}</span>
                                <span>{tab.label}</span>
                                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${activeTab === tab.id ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-700 text-slate-500'}`}>
                                    {tab.id === 'posts' ? postLogs.length : tab.id === 'comments' ? commentLogs.length : messageLogs.length}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {activeTab === 'posts' ? (
                            <LogTable
                                logs={postLogs}
                                isLoading={postLoading}
                                error={postError}
                                emptyMessage="No moderated posts found."
                                columns={['Date / Time', 'Original (Blocked)', 'Cleaned & Published']}
                            />
                        ) : activeTab === 'comments' ? (
                            <LogTable
                                logs={commentLogs}
                                isLoading={commentLoading}
                                error={commentError}
                                emptyMessage="No moderated comments or replies found."
                                columns={['Date / Time', 'Original (Blocked)', 'Cleaned & Published', 'Type']}
                            />
                        ) : (
                            <LogTable
                                logs={messageLogs}
                                isLoading={messageLoading}
                                error={messageError}
                                emptyMessage="No moderated messages found."
                                columns={['Date / Time', 'Original (Toxic)', 'Cleaned & Sent']}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModerationLog;


