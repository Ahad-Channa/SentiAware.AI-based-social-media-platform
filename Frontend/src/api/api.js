import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

export const searchUsers = async (query) => {
  if (!query) return [];
  const res = await api.get(`/api/users/search?q=${query}`);
  return res.data;
};

export const getUserById = async (id) => {
  try {
    const res = await api.get(`/api/users/${id}`);
    return res.data;
  } catch (error) {
    console.error("Error fetching user by ID:", error.response?.data || error);
    throw error;
  }
};


export const getSuggestedUsers = async () => {
  const res = await api.get("/api/users/suggested");
  return res.data;
};

export const getNotifications = async () => {
  const res = await api.get("/api/notifications");
  return res.data;
};

export const markNotificationRead = async (id) => {
  const res = await api.put(`/api/notifications/${id}/read`);
  return res.data;
};

// --- Post API ---

export const createPost = async (formData) => {
  const res = await api.post("/api/posts", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const validatePostText = async (content) => {
  const res = await api.post("/api/posts/validate-text", { content });
  return res.data;
};

export const getModerationLogs = async () => {
  const res = await api.get("/api/posts/moderated-logs");
  return res.data;
};

export const getCommentModerationLogs = async () => {
  const res = await api.get("/api/posts/comment-moderated-logs");
  return res.data;
};

export const validateCommentText = async (text) => {
  const res = await api.post("/api/posts/validate-text", { content: text });
  return res.data;
};

export const getFeedPosts = async () => {
  const res = await api.get("/api/posts/feed");
  return res.data;
};

export const getUserPosts = async (userId) => {
  const res = await api.get(`/api/posts/user/${userId}`);
  return res.data;
};

export const getPostById = async (id) => {
  const res = await api.get(`/api/posts/${id}`);
  return res.data;
};

export const likePost = async (id) => {
  const res = await api.put(`/api/posts/${id}/like`);
  return res.data;
};

export const commentPost = async (id, text, originalToxicText = null) => {
  const body = { text };
  if (originalToxicText) body.originalToxicText = originalToxicText;
  const res = await api.post(`/api/posts/${id}/comment`, body);
  return res.data;
};

export const updatePost = async (id, content) => {
  const res = await api.put(`/api/posts/${id}`, { content });
  return res.data;
};

export const deletePost = async (id) => {
  const res = await api.delete(`/api/posts/${id}`);
  return res.data;
};

export const reportPost = async (id, category, note = "") => {
  const res = await api.post(`/api/posts/${id}/report`, { category, note });
  return res.data;
};


export const replyToComment = async (postId, commentId, text, originalToxicText = null) => {
  const body = { text };
  if (originalToxicText) body.originalToxicText = originalToxicText;
  const res = await api.post(`/api/posts/${postId}/comments/${commentId}/reply`, body);
  return res.data;
};

export const editComment = async (postId, commentId, text, originalToxicText = null) => {
  const body = { text };
  if (originalToxicText) body.originalToxicText = originalToxicText;
  const res = await api.put(`/api/posts/${postId}/comments/${commentId}`, body);
  return res.data;
};

export const deleteComment = async (postId, commentId) => {
  const res = await api.delete(`/api/posts/${postId}/comments/${commentId}`);
  return res.data;
};

export const hideComment = async (postId, commentId) => {
  const res = await api.put(`/api/posts/${postId}/comments/${commentId}/hide`);
  return res.data;
};

export const sendFriendRequest = async (id) => {
  const res = await api.post(`/api/friends/send/${id}`);
  return res.data;
};

// --- Chat Moderation API ---

export const toggleChatModeration = async (conversationId) => {
  const res = await api.put(`/api/messages/moderation/${conversationId}`);
  return res.data;
};

export const getMessageModerationLogs = async () => {
  const res = await api.get("/api/messages/moderation-logs");
  return res.data;
};

export default api;
