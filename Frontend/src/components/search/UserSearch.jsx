
import React, { useState, useEffect, useRef } from "react";
import { searchUsers } from "../../api/api";
import { Link } from "react-router-dom";
import FriendButton from "../friends/FriendButton";

const UserSearch = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [show, setShow] = useState(false);

  const dropdownRef = useRef();

  useEffect(() => {
    const fetchData = async () => {
      if (query.trim().length === 0) {
        setResults([]);
        return;
      }
      const users = await searchUsers(query);
      setResults(users);
    };

    const delay = setTimeout(fetchData, 300);
    return () => clearTimeout(delay);
  }, [query]);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShow(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative w-full max-w-md" ref={dropdownRef}>
      <input
        type="text"
        placeholder="Search users..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShow(true);
        }}
        className="w-full px-4 py-2 rounded-full border border-gray-200 
                  bg-gray-50 text-gray-900 placeholder-gray-500
                  focus:outline-none focus:ring-2 focus:ring-gray-200 
                  focus:border-gray-300 focus:bg-white transition-all shadow-sm"
      />

      {show && results.length > 0 && (
        <div className="absolute mt-2 bg-white shadow-lg rounded-xl w-full p-2 z-50 space-y-1 border border-gray-100 ring-1 ring-black ring-opacity-5">
          {results.map((user) => (
            <div
              key={user._id}
              className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
            >
              {/* Left side → user info */}
              <Link
                to={`/profile/${user._id}`}
                className="flex items-center space-x-3"
                onClick={() => setShow(false)}
              >
                <img
                  src={user.profilePic}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <span className="text-gray-800">{user.name}</span>
              </Link>

              {/* Right side → Friend Button */}
              <FriendButton targetUserId={user._id} small />
            </div>
          ))}
        </div>
      )}

      {show && query && results.length === 0 && (
        <div className="absolute mt-2 bg-white shadow-lg rounded-xl w-full p-3 text-gray-500">
          No users found
        </div>
      )}
    </div>
  );
};

export default UserSearch;
