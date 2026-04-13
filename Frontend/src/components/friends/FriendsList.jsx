import React, { useEffect, useState } from "react";
import api from "../../api/api";
import { Link } from "react-router-dom";

const FriendsList = () => {
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    const loadFriends = async () => {
      try {
        const res = await api.get("/api/friends/list");
        setFriends(res.data);
      } catch (err) {
        console.error("Failed to load friends", err);
      }
    };

    loadFriends();
  }, []);

  return (
    <div className="min-h-screen bg-[#1A1A24] pt-8 pb-12">
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white tracking-tight mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>Your Circle.</h1>
          <p className="text-gray-400">People you are connected with.</p>
        </div>

        {friends.length === 0 ? (
          <div className="text-center py-16 bg-[#232330] rounded-xl border border-[#2D2D3B] border-dashed">
            <div className="mx-auto h-12 w-12 text-[#2D2D3B] mb-3">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white">Your circle is empty</h3>
            <p className="mt-1 text-sm text-gray-400">Start connecting with people to build your network.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {friends.map((f) => (
              <Link
                to={`/profile/${f._id}`}
                key={f._id}
                className="group flex flex-col items-center bg-[#232330] p-6 rounded-2xl border border-[#2D2D3B] hover:border-gray-600 transition-all hover:-translate-y-1 text-center shadow-sm"
              >
                <div className="relative mb-4">
                  {f.profilePic ? (
                    <img
                      src={f.profilePic}
                      className="h-24 w-24 rounded-full object-cover ring-4 ring-[#1A1A24] group-hover:ring-[#2D2D3B] transition-all"
                      alt={f.name}
                    />
                  ) : (
                    <div className="h-24 w-24 rounded-full bg-[#2A2A3A] flex items-center justify-center text-gray-400 font-bold text-3xl ring-4 ring-[#1A1A24]">
                      {f.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                </div>

                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-[#8E54E9] transition-colors">{f.name}</h3>
                <p className="text-sm text-gray-400 mb-4">@{f.username || "user"}</p>

                <span className="w-full py-2 bg-[#1A1A24] text-gray-300 text-sm font-semibold rounded-lg group-hover:bg-[#2A2A3A] transition-colors">
                  View Profile
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendsList;
