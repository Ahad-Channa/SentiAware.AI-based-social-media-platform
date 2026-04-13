import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getSuggestedUsers } from "../../api/api";
import { useSelector, useDispatch } from "react-redux";
import { sendFriendRequest } from "../../redux/friendsSlice";

const RightSidebar = () => {
    const [allSuggestions, setAllSuggestions] = useState([]);
    const [displayedUsers, setDisplayedUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [requestSent, setRequestSent] = useState({}); // To track sent requests globally or locally
    const currentUser = useSelector((state) => state.auth.user);
    const dispatch = useDispatch();

    useEffect(() => {
        const fetchSuggestions = async () => {
            try {
                const users = await getSuggestedUsers();
                setAllSuggestions(users);
                // Initially pick 4 random or top 4
                pickRandomUsers(users, 4);
            } catch (error) {
                console.error("Failed to fetch suggestions", error);
            } finally {
                setLoading(false);
            }
        };

        if (currentUser) {
            fetchSuggestions();
        }
    }, [currentUser]);

    const pickRandomUsers = (users, count) => {
        if (!users || users.length === 0) {
            setDisplayedUsers([]);
            return;
        }
        // Shuffle array
        const shuffled = [...users].sort(() => 0.5 - Math.random());
        setDisplayedUsers(shuffled.slice(0, count));
    };

    const handleShuffle = () => {
        pickRandomUsers(allSuggestions, 4);
    };

    const handleAddFriend = async (userId) => {
        try {
            await dispatch(sendFriendRequest(userId)).unwrap();
            setRequestSent((prev) => ({ ...prev, [userId]: true }));
        } catch (error) {
            console.error("Failed to send friend request", error);
        }
    };

    if (loading) {
        return (
            <div className="bg-[#232330] rounded-xl border border-[#2D2D3B] shadow-sm p-4 animate-pulse">
                <div className="h-4 bg-[#2D2D3B] rounded w-1/2 mb-4"></div>
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-[#2D2D3B] rounded-full"></div>
                            <div className="flex-1">
                                <div className="h-3 bg-[#2D2D3B] rounded w-3/4 mb-1"></div>
                                <div className="h-2 bg-[#2D2D3B] rounded w-1/2"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (allSuggestions.length === 0) {
        return (
            <div className="bg-[#232330] rounded-xl border border-[#2D2D3B] shadow-sm p-4">
                <p className="text-gray-400 text-sm">No suggestions available right now.</p>
            </div>
        );
    }

    return (
        <div className="bg-[#232330] rounded-xl border border-[#2D2D3B] shadow-sm p-5 sticky top-24">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-white">People you may know</h3>
                <button
                    onClick={handleShuffle}
                    className="text-xs text-[#8E54E9] hover:text-[#7A42E4] font-medium transition-colors cursor-pointer hover:bg-[#2A2A3A] px-2 py-1 rounded"
                    title="Shuffle suggestions"
                >
                    Shuffle
                </button>
            </div>

            <div className="space-y-5">
                {displayedUsers.map((user) => (
                    <div key={user._id} className="flex items-center justify-between group">
                        <Link to={`/profile/${user._id}`} className="flex items-center gap-3 flex-1 min-w-0">
                            {user.profilePic ? (
                                <img
                                    src={user.profilePic}
                                    alt={user.name}
                                    className="h-10 w-10 rounded-full object-cover ring-1 ring-[#2D2D3B] group-hover:ring-[#8E54E9] transition-shadow"
                                />
                            ) : (
                                <div className="h-10 w-10 rounded-full bg-[#2A2A3A] flex items-center justify-center text-[#8E54E9] font-bold text-xs ring-1 ring-[#2D2D3B]">
                                    {user.name?.[0]?.toUpperCase()}
                                </div>
                            )}
                            <div className="truncate">
                                <p className="text-sm font-semibold text-white truncate group-hover:text-[#8E54E9] transition-colors">
                                    {user.name}
                                </p>
                                <p className="text-xs text-gray-400 truncate">
                                    @{user.username || user.name.toLowerCase().replace(/\s/g, '')}
                                </p>
                            </div>
                        </Link>

                        {requestSent[user._id] ? (
                            <span className="text-xs text-green-400 font-medium bg-[#1A1A24] px-2 py-1 rounded-full border border-green-500/20">
                                Sent
                            </span>
                        ) : (
                            <button
                                onClick={() => handleAddFriend(user._id)}
                                className="ml-2 p-1.5 text-gray-400 hover:text-[#8E54E9] hover:bg-[#2A2A3A] rounded-full transition-colors"
                                title="Add Friend"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                </svg>
                            </button>
                        )}
                    </div>
                ))}
            </div>

            <div className="mt-5 pt-4 border-t border-[#2D2D3B]">
                <Link to="/search" className="text-xs text-gray-400 hover:text-white flex items-center justify-center gap-1 transition-colors">
                    Find more people
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                </Link>
            </div>
        </div>
    );
};

export default RightSidebar;
