import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPostById } from '../../api/api';
import Post from './Post';

const SinglePost = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const data = await getPostById(id);
                setPost(data);
            } catch (err) {
                console.error("Failed to load post", err);
                setError("Post not found or has been deleted.");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchPost();
        }
    }, [id]);

    const handlePostUpdated = (updatedPost) => {
        setPost(updatedPost);
    };

    const handlePostDeleted = () => {
        navigate('/feed');
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-64px)] bg-[#1A1A24]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#8E54E9]"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-xl mx-auto mt-8 px-4 text-center">
                <div className="bg-[#232330] text-red-400 p-4 rounded-lg border border-red-500/20 shadow-2xl">
                    {error}
                </div>
                <button
                    onClick={() => navigate('/feed')}
                    className="mt-4 text-gray-400 hover:text-white underline transition-colors"
                >
                    Back to Feed
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#1A1A24] py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
                <button
                    onClick={() => navigate(-1)}
                    className="mb-4 flex items-center text-gray-400 hover:text-white transition-colors"
                >
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back
                </button>

                {post && (
                    <Post
                        post={post}
                        onPostUpdated={handlePostUpdated}
                        onPostDeleted={handlePostDeleted}
                    />
                )}
            </div>
        </div>
    );
};

export default SinglePost;
