import React, { useState } from "react";
import { useSocketContext } from "../../context/SocketContext";
import { toggleChatModeration } from "../../api/api";

const ConversationList = ({ friends, selectedChat, setSelectedChat, onDeleteChat, onToggleModeration }) => {
    const { onlineUsers } = useSocketContext();
    const [openDropdownId, setOpenDropdownId] = useState(null);
    const [chatToDelete, setChatToDelete] = useState(null);
    const [togglingId, setTogglingId] = useState(null);

    const handleToggleModeration = async (e, friend) => {
        e.stopPropagation();
        if (!friend.conversationId) return;
        setTogglingId(friend._id);
        try {
            const res = await toggleChatModeration(friend.conversationId);
            onToggleModeration(friend.conversationId, res.isModerationEnabled);
        } catch (error) {
            console.error("Failed to toggle moderation", error);
        } finally {
            setTogglingId(null);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-[#2D2D3B]">
                <h2 className="text-xl font-bold text-white">Messages</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {friends.length === 0 ? (
                    <p className="text-gray-400 text-center text-sm p-4">No conversations yet.</p>
                ) : (
                    friends.map((friend) => {
                        const isOnline = onlineUsers.includes(friend._id);
                        const isSelected = selectedChat?._id === friend._id;
                        const unreadCount = friend.unreadCount || 0;
                        const isModerated = friend.isModerationEnabled || false;

                        return (
                            <div
                                key={friend._id}
                                onClick={() => setSelectedChat(friend)}
                                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${isSelected ? "bg-[#2D2D3B]" : "hover:bg-[#2A2A3A]"
                                    }`}
                            >
                                <div className="relative flex-shrink-0">
                                    {friend.profilePic ? (
                                        <img
                                            src={friend.profilePic}
                                            alt={friend.name}
                                            className="w-12 h-12 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-[#1A1A24] flex items-center justify-center text-gray-400 font-bold border border-[#2D2D3B]">
                                            {friend.name?.[0]?.toUpperCase()}
                                        </div>
                                    )}
                                    {isOnline && (
                                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-[#232330] rounded-full"></span>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <h3 className={`font-medium truncate ${unreadCount > 0 ? "text-white font-bold" : "text-white"}`}>{friend.name}</h3>
                                        {isModerated && (
                                            <span title="AI Moderation ON" className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 font-medium flex-shrink-0">🛡️</span>
                                        )}
                                    </div>
                                    <p className={`text-sm truncate ${unreadCount > 0 ? "text-gray-300 font-medium" : "text-gray-400"}`}>
                                        {friend.lastMessage ? friend.lastMessage.message : `@${friend.nickname || friend.email?.split('@')[0] || "user"}`}
                                    </p>
                                </div>

                                {unreadCount > 0 && (
                                    <div className="flex-shrink-0 ml-2">
                                        <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-[#8E54E9] rounded-full">
                                            {unreadCount > 99 ? "99+" : unreadCount}
                                        </span>
                                    </div>
                                )}

                                {/* Chat Options Dropdown */}
                                <div className="relative ml-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                    <button
                                        onClick={() => setOpenDropdownId(openDropdownId === friend._id ? null : friend._id)}
                                        className="p-1.5 text-gray-500 hover:text-white rounded-full hover:bg-[#3D3D4E] transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                        </svg>
                                    </button>

                                    {openDropdownId === friend._id && (
                                        <div className="absolute right-0 top-full mt-1 z-20 w-52 bg-[#232330] border border-[#2D2D3B] rounded-lg shadow-xl overflow-hidden">
                                            {/* Moderation Toggle */}
                                            {friend.conversationId && (
                                                <button
                                                    onClick={(e) => handleToggleModeration(e, friend)}
                                                    disabled={togglingId === friend._id}
                                                    className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-300 hover:bg-[#2D2D3B] hover:text-white transition-colors border-b border-[#2D2D3B]"
                                                >
                                                    <span className="flex items-center gap-2">
                                                        <span>🛡️</span>
                                                        <span>Moderate Messages</span>
                                                    </span>
                                                    {/* Toggle Switch */}
                                                    <div className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${isModerated ? "bg-[#8E54E9]" : "bg-[#3D3D4E]"}`}>
                                                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${isModerated ? "translate-x-4" : "translate-x-0.5"}`} />
                                                    </div>
                                                </button>
                                            )}
                                            {/* Delete Chat */}
                                            <button
                                                onClick={() => {
                                                    setOpenDropdownId(null);
                                                    setChatToDelete(friend);
                                                }}
                                                className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-[#2D2D3B] hover:text-red-300 transition-colors"
                                            >
                                                Delete Chat
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
            {/* Delete Chat Modal */}
            {chatToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
                    <div className="bg-[#232330] border border-[#2D2D3B] p-6 rounded-2xl shadow-2xl max-w-sm w-full mx-auto" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-white mb-2">Clear Chat History</h3>
                        <p className="text-gray-300 mb-6 text-sm">
                            Are you sure you want to delete your conversation with <span className="font-semibold text-white">{chatToDelete.name}</span>? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setChatToDelete(null);
                                }}
                                className="px-4 py-2 rounded-xl text-gray-300 hover:text-white bg-[#2D2D3B] hover:bg-[#3D3D4E] transition-colors font-medium text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteChat(chatToDelete._id);
                                    setChatToDelete(null);
                                }}
                                className="px-4 py-2 rounded-xl text-white bg-red-500 hover:bg-red-600 transition-colors font-medium text-sm shadow-lg shadow-red-500/20"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConversationList;
