
import React, { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../redux/authSlice";
import { fetchNotifications } from "../../redux/notificationSlice";
import { fetchUnreadChatsCount } from "../../redux/chatSlice";
import UserSearch from "../search/UserSearch";
import NotificationList from "../notifications/NotificationList";
import { useSocketContext } from "../../context/SocketContext";
import TutorialModal from "../tutorial/TutorialModal";

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const { unreadCount } = useSelector((state) => state.notifications);
  const { unreadChatsCount } = useSelector((state) => state.chat);
  const { socket } = useSocketContext();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  const notificationRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    if (user) {
      dispatch(fetchNotifications());
      dispatch(fetchUnreadChatsCount());

      // Poll for notifications and chat count every 5 seconds
      const intervalId = setInterval(() => {
        dispatch(fetchNotifications());
        dispatch(fetchUnreadChatsCount());
      }, 5000);

      return () => clearInterval(intervalId);
    }
  }, [dispatch, user]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#1A1A24] border-b border-[#2D2D3B] shadow-sm">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-14 md:h-16">

          <div className="flex-shrink-0 flex items-center pr-1 md:pr-0">
            <Link to="/" className="text-xl md:text-3xl font-black text-white tracking-tighter hover:opacity-80 transition-opacity whitespace-nowrap" style={{ fontFamily: "'Outfit', sans-serif" }}>
              SentiAware.
            </Link>
          </div>

          {/* Middle: Search */}
          <div className="hidden md:flex flex-1 justify-center px-8">
            <div className="w-full max-w-sm">
              <UserSearch />
            </div>
          </div>

          {/* Right: Nav */}
          <nav className="flex items-center gap-0.5 md:gap-2">

            {/* Messages Icon */}
            <NavLink
              to="/chat"
              className={({ isActive }) =>
                `p-2 md:p-2.5 rounded-lg transition-all duration-200 group relative ${isActive
                  ? "text-white bg-[#232330]"
                  : "text-gray-400 hover:bg-[#232330] hover:text-white"
                }`
              }
              title="Messages"
            >
              <svg className="w-[22px] h-[22px] md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
              {unreadChatsCount > 0 && (
                <span className="absolute 0 -right-1 flex h-[18px] w-[18px] md:h-5 md:w-5 items-center justify-center rounded-full bg-red-500 text-[10px] md:text-[10px] font-bold text-white border-2 border-[#1A1A24]">
                  {unreadChatsCount}
                </span>
              )}
            </NavLink>

            {/* Friends Icon */}
            <NavLink
              to="/friends"
              className={({ isActive }) =>
                `p-2 md:p-2.5 rounded-lg transition-all duration-200 group relative ${isActive
                  ? "text-white bg-[#232330]"
                  : "text-gray-400 hover:bg-[#232330] hover:text-white"
                }`
              }
              title="Friends"
            >
              <svg className="w-[22px] h-[22px] md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
            </NavLink>

            {/* Feed Icon */}
            <NavLink
              to="/feed"
              className={({ isActive }) =>
                `p-2 md:p-2.5 rounded-lg transition-all duration-200 group relative ${isActive
                  ? "text-white bg-slate-800"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`
              }
              title="Feed"
            >
              <svg className="w-[22px] h-[22px] md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path></svg>
            </NavLink>

            {/* Notification Bell */}
            <div className="relative" ref={notificationRef}>
              <button
                className={`relative p-2 md:p-2.5 text-gray-400 hover:text-white hover:bg-[#232330] rounded-lg transition-colors focus:outline-none ${showNotifications ? 'bg-[#232330] text-white' : ''}`}
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <svg className="w-[22px] h-[22px] md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>

                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 md:top-2 md:right-2 h-2 w-2 bg-red-500 rounded-full border border-white"></span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 origin-top-right z-50">
                  <NotificationList 
                    onClose={() => setShowNotifications(false)} 
                    onOpenTutorial={() => {
                        setShowNotifications(false);
                        setShowTutorial(true);
                    }}
                  />
                </div>
              )}
            </div>

            {/* User Profile Dropdown */}
            <div className="relative ml-0.5 md:ml-2" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center focus:outline-none"
              >
                <div className="h-8 w-8 rounded-full overflow-hidden border border-[#2D2D3B] hover:border-gray-500 transition-colors">
                  {user?.profilePic ? (
                    <img src={user.profilePic} alt="User" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-[#232330] text-gray-400 font-bold text-xs">
                      {user?.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-3 w-56 bg-[#232330] rounded-xl shadow-2xl border border-[#2D2D3B] overflow-hidden z-50 animate-in fade-in zoom-in duration-150 origin-top-right">
                  <div className="px-4 py-3 border-b border-[#2D2D3B] bg-[#1A1A24]">
                    <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                    <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                  </div>

                    <div className="py-1">
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#2A2A3A] transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        My Profile
                      </Link>
                      <Link
                        to="/settings"
                        className="block flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-[#2A2A3A] transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                         <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                         Settings
                      </Link>
                      <button
                        onClick={() => {
                            setShowUserMenu(false);
                            setShowTutorial(true);
                        }}
                        className="block w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-[#2A2A3A] transition-colors"
                      >
                         <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                         Platform Tutorial
                      </button>
                    </div>

                  <div className="border-t border-[#2D2D3B] py-1">
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      Log Out
                    </button>
                  </div>
                </div>
              )}
            </div>

          </nav>
        </div>
      </div>
    </header>
    <TutorialModal isOpen={showTutorial} onClose={() => setShowTutorial(false)} />
    </>
  );
};

export default Header;
