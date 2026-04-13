import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PostList from '../post/PostList';
import RightSidebar from './RightSidebar';


const Feed = () => {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    setCurrentUser(user);
  }, []);

  return (
    <div className="min-h-screen bg-[#1A1A24] pt-8 pb-12">
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Feed Column - WIDER (Span 2) */}
          <main className="lg:col-span-2">

            {/* Create Post Trigger - Minimal & Clean */}
            <div className="bg-[#232330] rounded-xl border border-[#2D2D3B] shadow-sm p-4 mb-6 transition-shadow hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  {currentUser?.profilePic ? (
                    <img src={currentUser.profilePic} alt="Me" className="h-10 w-10 rounded-full object-cover ring-2 ring-[#2D2D3B]" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-[#2A2A3A] flex items-center justify-center text-gray-400 font-semibold border border-[#2D2D3B]">
                      {currentUser?.name?.[0]?.toUpperCase() || "ME"}
                    </div>
                  )}
                </div>
                <Link
                  to="/create-post"
                  className="flex-grow px-4 py-2.5 bg-[#1A1A24] text-gray-400 rounded-lg hover:bg-[#2A2A3A] hover:text-white cursor-pointer transition-colors text-left text-sm font-medium border border-[#2D2D3B]"
                >
                  Start a post...
                </Link>
              </div>
            </div>

            <PostList />
          </main>

          {/* Right Sidebar - Suggestions (Span 1) */}
          <aside className="hidden lg:block lg:col-span-1">
            <RightSidebar />
          </aside>
        </div>

      </div>
    </div>
  );
};

export default Feed;
