// src/components/friends/FriendButton.jsx
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchFriendStatus,
  sendFriendRequest,
  cancelFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  unfriendUser,
} from "../../redux/friendsSlice";
import { addFriendLocally, removeFriendLocally } from "../../redux/authSlice";

const FriendButton = ({ targetUserId, onFriendAdded, onFriendRemoved }) => {
  const dispatch = useDispatch();
  const status = useSelector((state) => state.friends.statusByUser[targetUserId]);
  const loading = useSelector((state) => state.friends.loading);
  const currentUser = useSelector((state) => state.auth.user);

  useEffect(() => {
    if (!targetUserId) return;
    dispatch(fetchFriendStatus(targetUserId));
  }, [dispatch, targetUserId]);

  // If profile of current user -> don't show
  if (!currentUser || currentUser._id === targetUserId) return null;

  const onSend = () => dispatch(sendFriendRequest(targetUserId));
  const onCancel = () => dispatch(cancelFriendRequest(targetUserId));
  
  const onAccept = async () => {
    await dispatch(acceptFriendRequest(targetUserId));
    dispatch(addFriendLocally(targetUserId)); // Updates profile active friend count instantly
    if (onFriendAdded) onFriendAdded();
  };
  
  const onReject = () => dispatch(rejectFriendRequest(targetUserId));
  
  const onUnfriend = async () => {
    await dispatch(unfriendUser(targetUserId));
    dispatch(removeFriendLocally(targetUserId)); // Updates profile active friend count instantly
    if (onFriendRemoved) onFriendRemoved();
  };

  // default state while loading
  if (loading && !status) {
    return <button className="px-5 py-2.5 rounded-full text-sm font-semibold bg-[#2A2A3A] text-gray-400 border border-[#2D2D3B]" disabled>Loading...</button>;
  }

  switch (status) {
    case "friends":
      return (
        <div className="flex items-center justify-center space-x-2">
          <button onClick={onUnfriend} className="px-5 py-2.5 rounded-full text-sm font-semibold bg-[#2A2A3A] text-gray-300 hover:bg-red-600 hover:text-white hover:border-red-600 border border-[#2D2D3B] transition-all">
            Unfriend
          </button>
        </div>
      );
    case "request_sent":
      return (
        <div className="flex items-center justify-center space-x-2">
          <button onClick={onCancel} className="px-5 py-2.5 rounded-full text-sm font-semibold bg-[#2A2A3A] text-yellow-500 hover:bg-yellow-600 hover:text-white hover:border-yellow-600 border border-[#2D2D3B] transition-all">
            Cancel Request
          </button>
        </div>
      );
    case "request_received":
      return (
        <div className="flex items-center justify-center space-x-3">
          <button onClick={onAccept} className="px-6 py-2.5 rounded-full text-sm font-semibold bg-green-600 text-white hover:bg-green-700 shadow-md shadow-green-900/20 transition-all border border-green-500">
            Accept
          </button>
          <button onClick={onReject} className="px-6 py-2.5 rounded-full text-sm font-semibold bg-[#2A2A3A] text-gray-300 hover:bg-[#323246] hover:text-white border border-[#2D2D3B] transition-all">
            Reject
          </button>
        </div>
      );
    default:
      // not_friends or undefined
      return (
        <div className="flex items-center justify-center space-x-2">
          <button onClick={onSend} className="px-6 py-2.5 rounded-full text-sm font-semibold bg-[#8E54E9] text-white hover:bg-[#7A42E4] shadow-md shadow-[#8E54E9]/20 transition-all">
            Add Friend
          </button>
        </div>
      );
  }
};

export default FriendButton;
