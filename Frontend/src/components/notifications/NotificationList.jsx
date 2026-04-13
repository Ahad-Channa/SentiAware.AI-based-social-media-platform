import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNotifications, markRead } from '../../redux/notificationSlice';
import NotificationItem from './NotificationItem';

const NotificationList = ({ onClose, onOpenTutorial }) => {
    const dispatch = useDispatch();
    const { items, loading, error } = useSelector((state) => state.notifications);

    useEffect(() => {
        dispatch(fetchNotifications());
    }, [dispatch]);

    const handleMarkRead = (id) => {
        dispatch(markRead(id));
    };

    if (loading && items.length === 0) {
        return <div className="p-4 text-center text-gray-500">Loading...</div>;
    }

    if (error) {
        return <div className="p-4 text-center text-red-500">Error loading notifications</div>;
    }

    return (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-[#232330] rounded-xl shadow-2xl border border-[#2D2D3B] overflow-hidden z-50 animate-in fade-in zoom-in duration-150 origin-top-right">
            <div className="p-3 border-b border-[#2D2D3B] bg-[#1A1A24] flex justify-between items-center">
                <h3 className="font-semibold text-white">Notifications</h3>
                {onClose && (
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        &times;
                    </button>
                )}
            </div>

            <div className="max-h-96 overflow-y-auto custom-scrollbar">
                {items.length === 0 ? (
                    <div className="p-6 text-center text-gray-400">
                        No notifications yet
                    </div>
                ) : (
                    items.map((notification) => (
                        <NotificationItem
                            key={notification._id}
                            notification={notification}
                            onMarkRead={handleMarkRead}
                            onOpenTutorial={onOpenTutorial}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default NotificationList;
