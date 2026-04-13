import React, { useEffect, useState } from "react";
import api from "../../api/api";
import { acceptFriendRequest, rejectFriendRequest } from "../../redux/friendsSlice";
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";

const FriendRequests = () => {
  const [requests, setRequests] = useState([]);
  const dispatch = useDispatch();

  useEffect(() => {
    const loadRequests = async () => {
      const res = await api.get("/api/friends/requests");
      setRequests(res.data);
    };

    loadRequests();
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-[#1A1A24] p-6 text-white">
      <h1 className="text-3xl font-bold mb-6">Friend Requests</h1>

      {requests.length === 0 ? (
        <p className="text-gray-400">No pending requests.</p>
      ) : (
        <div className="space-y-3">
          {requests.map((user) => (
            <div
              key={user._id}
              className="flex justify-between items-center bg-[#232330] p-4 rounded-xl border border-[#2D2D3B] shadow-sm"
            >
              <Link to={`/profile/${user._id}`} className="flex items-center space-x-3 group">
                <img
                  src={user.profilePic}
                  className="h-12 w-12 rounded-full object-cover ring-2 ring-transparent group-hover:ring-[#8E54E9] transition-all"
                  alt=""
                />
                <span className="text-lg font-semibold text-white group-hover:text-[#8E54E9] transition-colors">{user.name}</span>
              </Link>

              <div className="flex gap-2 text-sm font-semibold">
                <button
                  onClick={async () => {
                    await dispatch(acceptFriendRequest(user._id)).unwrap();
                    setRequests(prev => prev.filter(req => req._id !== user._id));
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md shadow-green-900/20"
                >
                  Accept
                </button>
                <button
                  onClick={async () => {
                    await dispatch(rejectFriendRequest(user._id)).unwrap();
                    setRequests(prev => prev.filter(req => req._id !== user._id));
                  }}
                  className="px-4 py-2 bg-[#2A2A3A] text-gray-300 rounded-lg hover:bg-[#323246] hover:text-white transition-colors border border-[#2D2D3B]"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FriendRequests;
