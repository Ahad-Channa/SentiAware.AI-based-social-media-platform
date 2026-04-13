import React, { useState } from 'react';
import { reportPost } from '../../api/api';
import toast from 'react-hot-toast';

const CATEGORIES = [
    { value: "nsfw",          label: "🔞 Sexually Explicit / NSFW" },
    { value: "violence",      label: "🩸 Violent or Graphic Content" },
    { value: "hate_speech",   label: "🚫 Hate Speech or Discrimination" },
    { value: "misinformation",label: "❌ Misinformation / Fake News" },
    { value: "spam",          label: "📢 Spam or Scam" },
    { value: "harassment",    label: "😠 Harassment or Bullying" },
    { value: "other",         label: "⚠️ Other" },
];

// Maps imageFlag values to default pre-selected categories
const FLAG_TO_CATEGORY = {
    nsfw:         "nsfw",
    violence:     "violence",
    toxic_text:   "misinformation",
    community_report: "other",
};

const ReportModal = ({ post, onClose, onPostRemoved }) => {
    const defaultCategory = FLAG_TO_CATEGORY[post.imageFlag] || "";
    const [category, setCategory] = useState(defaultCategory);
    const [note, setNote] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!category) {
            toast.error("Please select a reason for reporting.");
            return;
        }
        setIsSubmitting(true);
        try {
            const result = await reportPost(post._id, category, note);
            onClose();

            if (result.action === "removed") {
                toast.error("This post was automatically removed by community action.", {
                    duration: 5000,
                    style: { background: '#1a1a24', color: '#fff', border: '1px solid #ef4444' }
                });
                if (onPostRemoved) onPostRemoved(post._id);
            } else if (result.action === "community_flagged") {
                toast("This post has been blurred by community reports.", {
                    icon: "👁️",
                    duration: 4000,
                    style: { background: '#1a1a24', color: '#fff', border: '1px solid #f59e0b' }
                });
            } else {
                toast.success("Report submitted. Thank you for keeping the community safe!", {
                    style: { background: '#1a1a24', color: '#fff', border: '1px solid #10b981' }
                });
            }
        } catch (error) {
            const msg = error.response?.data?.message || "Failed to submit report.";
            if (error.response?.status === 409) {
                toast("You have already reported this post.", {
                    icon: "ℹ️",
                    style: { background: '#1a1a24', color: '#fff', border: '1px solid #6366f1' }
                });
                onClose();
            } else {
                toast.error(msg);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-[#232330] rounded-2xl w-full max-w-md mx-4 shadow-2xl border border-[#2D2D3B] animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                {/* Header - always visible */}
                <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#2D2D3B] flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                        </svg>
                        <h2 className="text-base font-bold text-white">Report Post</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-1 rounded-full hover:bg-[#2A2A3A]">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Scrollable body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
                    <p className="text-sm text-gray-400">Select the reason that best describes why this post violates community guidelines.</p>

                    {/* AI-flagged notice */}
                    {post.imageFlag && (
                        <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-lg">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            This post was already flagged by our AI. Your report carries extra weight.
                        </div>
                    )}

                    {/* Category radio list */}
                    <div className="space-y-2">
                        {CATEGORIES.map((cat) => (
                            <label
                                key={cat.value}
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer border transition-colors
                                    ${category === cat.value
                                        ? 'border-red-500/50 bg-red-500/10 text-white'
                                        : 'border-[#2D2D3B] text-gray-400 hover:bg-[#2A2A3A] hover:text-white'}`}
                            >
                                <input
                                    type="radio"
                                    name="category"
                                    value={cat.value}
                                    checked={category === cat.value}
                                    onChange={() => setCategory(cat.value)}
                                    className="accent-red-500"
                                />
                                <span className="text-sm">{cat.label}</span>
                            </label>
                        ))}
                    </div>

                    {/* Optional note */}
                    <div>
                        <label className="block text-xs text-gray-500 mb-1.5">Additional details (optional)</label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Describe why you think this post is inappropriate..."
                            rows={2}
                            className="w-full bg-[#1A1A24] border border-[#2D2D3B] text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-red-500/50 resize-none placeholder-gray-600"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 text-sm text-gray-400 hover:text-white border border-[#2D2D3B] rounded-xl hover:bg-[#2A2A3A] transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !category}
                            className="flex-1 px-4 py-2.5 text-sm bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? "Submitting..." : "Submit Report"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReportModal;
