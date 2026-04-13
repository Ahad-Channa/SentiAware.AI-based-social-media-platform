import React, { useEffect, useState } from 'react';
import Post from './Post';
import { getFeedPosts, getUserPosts } from '../../api/api';

const PostList = ({ userId, refreshTrigger, viewMode = 'list' }) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchPosts = async () => {
        try {
            setLoading(true);
            let data;
            if (userId) {
                data = await getUserPosts(userId);
            } else {
                data = await getFeedPosts();
            }
            setPosts(data);
        } catch (err) {
            console.error("Error fetching posts:", err);
            setError("Failed to load posts.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, [userId, refreshTrigger]);

    const handlePostUpdate = (updatedPost) => {
        setPosts(prevPosts =>
            prevPosts.map(p => p._id === updatedPost._id ? updatedPost : p)
        );
    };

    const handlePostDelete = (deletedPostId) => {
        setPosts(prevPosts => prevPosts.filter(p => p._id !== deletedPostId));
    };

    if (loading) {
        return (
            <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "space-y-6"}>
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-[#232330] rounded-xl border border-[#2D2D3B] p-6 animate-pulse">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="h-10 w-10 rounded-full bg-[#2D2D3B]"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-[#2D2D3B] rounded w-1/3"></div>
                                <div className="h-3 bg-[#2D2D3B] rounded w-1/5"></div>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="h-4 bg-[#2D2D3B] rounded w-3/4"></div>
                            <div className="h-4 bg-[#2D2D3B] rounded w-full"></div>
                            <div className="h-64 bg-[#2D2D3B] rounded-xl mt-4"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg inline-block text-sm font-medium">
                    {error}
                </div>
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className="text-center py-16 bg-[#232330] rounded-xl border border-[#2D2D3B] border-dashed">
                <div className="mx-auto h-12 w-12 text-[#2D2D3B] mb-3">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                </div>
                <h3 className="text-lg font-medium text-white">No posts yet</h3>
                <p className="mt-1 text-sm text-gray-400">
                    {userId ? "This user hasn't posted anything yet." : "Get started by creating your first post!"}
                </p>
            </div>
        );
    }

    return (
        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "space-y-6"}>
            {posts.map((post, index) => {
                // Logic: Images always 1 col. Text posts can span 2 cols for variety.
                const isTextOnly = !post.image;
                const shouldSpan = isTextOnly && (index % 3 === 0);

                return (
                    <div
                        key={post._id}
                        className={viewMode === 'grid' && shouldSpan ? "md:col-span-2" : ""}
                    >
                        <Post
                            post={post}
                            onPostUpdated={handlePostUpdate}
                            onPostDeleted={handlePostDelete}
                        />
                    </div>
                );
            })}
        </div>
    );
};

export default PostList;
