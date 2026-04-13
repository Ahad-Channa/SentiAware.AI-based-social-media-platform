import React from 'react';
import { formatDistanceToNow } from 'date-fns';

import { useNavigate } from 'react-router-dom';

const NotificationItem = ({ notification, onMarkRead, onOpenTutorial }) => {
    const navigate = useNavigate();

    // Support both old (relatedId as user) and new (sender/post fields) schema
    const sender = notification.sender || notification.relatedId;
    const isPostNotification = ["like", "comment", "reply"].includes(notification.type);

    const handleClick = () => {
        onMarkRead(notification._id);

        if (notification.type === 'system' && notification.message.includes('Welcome to SentiAware')) {
            if (onOpenTutorial) onOpenTutorial();
            return;
        }

        if (isPostNotification && notification.post) {
            // If it's a post notification, go to the post
            const postId = typeof notification.post === 'object' ? notification.post._id : notification.post;
            navigate(`/post/${postId}`);
        } else if (sender) {
            // Otherwise go to the user profile (e.g. friend request)
            navigate(`/profile/${sender._id}`);
        }
    };

    return (
        <div
            className={`p-3 border-b border-[#2D2D3B] hover:bg-[#2A2A3A] flex items-start space-x-3 transition-colors cursor-pointer ${!notification.read ? 'bg-[#1e1e2d]' : ''}`}
            onClick={handleClick}
        >
            <div className="flex-shrink-0">
                {sender && sender.profilePic ? (
                    <img
                        src={sender.profilePic}
                        alt={sender.name}
                        className="h-10 w-10 rounded-full object-cover ring-1 ring-[#2D2D3B]"
                    />
                ) : (
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${!notification.read ? 'bg-[#8E54E9]/20 text-[#8E54E9]' : 'bg-[#2A2A3A] text-gray-400'} ring-1 ring-[#2D2D3B]`}>
                        <span className="text-xs font-bold">
                            {sender?.name?.[0] || "S"}
                        </span>
                    </div>
                )}
            </div>

            <div className="flex-1">
                <p className={`text-sm ${!notification.read ? 'text-white font-medium' : 'text-gray-400'}`}>
                    {notification.message}
                </p>
                <div className="flex items-center gap-2 mt-1">
                    {/* Optional: Icon based on type */}
                    {notification.type === 'like' && <span className="text-xs text-rose-500">❤️ Liked your post</span>}
                    {notification.type === 'comment' && <span className="text-xs text-blue-500">💬 Commented</span>}
                    {notification.type === 'reply' && <span className="text-xs text-indigo-500">↩️ Replied</span>}

                    <span className="text-xs text-gray-400">
                        • {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </span>
                </div>
            </div>
            {/* Read Indicator Dot */}
            {!notification.read && (
                <div className="mt-2 h-2 w-2 rounded-full bg-[#8E54E9] flex-shrink-0 shadow-[0_0_8px_rgba(142,84,233,0.8)]"></div>
            )}
        </div>
    );
};

export default NotificationItem;
