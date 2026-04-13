import Post from "../models/Post.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import cloudinary from "../config/cloudinary.js";
import { analyzeText, analyzeImage } from "../services/moderationService.js";

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
export const createPost = async (req, res) => {
    try {
        const { content, originalToxicContent } = req.body;
        let imageUrl = "";

        // 1. Initialize moderation state
        let isFlagged = false;
        let toxicityDetails = {};
        
        // 2. Image Upload & Moderation
        if (req.file) {
            const imageCheck = await analyzeImage(req.file.buffer, req.file.mimetype);
            if (!imageCheck.safe) {
                isFlagged = true;
                toxicityDetails.imageFlag = imageCheck.type || "toxic_text";
            }

            // Upload to Cloudinary
            const b64 = Buffer.from(req.file.buffer).toString("base64");
            let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
            const result = await cloudinary.uploader.upload(dataURI, {
                folder: "senti_posts",
            });
            imageUrl = result.secure_url;
        }

        // 3. Text Moderation
        // If frontend sends originalToxicContent, it means user already accepted AI suggestion
        // If they bypass it, we run analyzeText again to be safe
        let finalContent = content;
        
        if (originalToxicContent) {
            isFlagged = true;
            toxicityDetails.originalContent = originalToxicContent;
        } else {
            const moderationResult = await analyzeText(content);
            if (!moderationResult.safe) {
                 finalContent = moderationResult.moderatedText;
                 isFlagged = true;
                 toxicityDetails.originalContent = content;
                 toxicityDetails.toxicityScore = moderationResult.score;
            }
        }

        // Construct Post Object
        const newPost = new Post({
            author: req.user._id,
            content: finalContent,
            image: imageUrl,
            originalContent: toxicityDetails.originalContent || undefined,
            isModerated: isFlagged,
            moderationStatus: isFlagged ? "flagged" : "safe", 
            toxicityScore: toxicityDetails.toxicityScore,
            imageFlag: toxicityDetails.imageFlag || "",
        });

        const savedPost = await newPost.save();

        // Populate author details for immediate frontend display
        await savedPost.populate("author", "name profilePic");

        res.status(201).json(savedPost);
    } catch (error) {
        console.error("Error creating post:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Validate text for toxicity before creating post
// @route   POST /api/posts/validate-text
// @access  Private
export const validateText = async (req, res) => {
    try {
        const { content } = req.body;
        if (!content) {
            return res.status(400).json({ message: "Content is required" });
        }

        const moderationResult = await analyzeText(content);
        res.json(moderationResult);
    } catch (error) {
        console.error("Error validating text:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Get moderation logs for current user
// @route   GET /api/posts/moderated-logs
// @access  Private
export const getModerationLogs = async (req, res) => {
    try {
        const logs = await Post.find({ 
            author: req.user._id, 
            isModerated: true 
        }).sort({ createdAt: -1 });
        
        res.json(logs);
    } catch (error) {
        console.error("Error fetching moderation logs:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Get comment moderation logs for current user
// @route   GET /api/posts/comment-moderated-logs
// @access  Private
export const getCommentModerationLogs = async (req, res) => {
    try {
        const userId = req.user._id;

        // Flatten all comments (and nested replies) and filter for moderated ones by this user
        const posts = await Post.find({
            $or: [
                { "comments.user": userId, "comments.isModerated": true },
                { "comments.replies.user": userId, "comments.replies.isModerated": true }
            ]
        });

        const logs = [];

        for (const post of posts) {
            for (const comment of post.comments) {
                // Top-level comments
                if (comment.isModerated && comment.user.toString() === userId.toString()) {
                    logs.push({
                        _id: comment._id,
                        postId: post._id,
                        type: "comment",
                        originalText: comment.originalText || "N/A",
                        text: comment.text,
                        createdAt: comment.createdAt,
                    });
                }
                // Nested replies
                if (comment.replies && comment.replies.length > 0) {
                    for (const reply of comment.replies) {
                        if (reply.isModerated && reply.user.toString() === userId.toString()) {
                            logs.push({
                                _id: reply._id,
                                postId: post._id,
                                type: "reply",
                                originalText: reply.originalText || "N/A",
                                text: reply.text,
                                createdAt: reply.createdAt,
                            });
                        }
                    }
                }
            }
        }

        // Sort newest first
        logs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json(logs);
    } catch (error) {
        console.error("Error fetching comment moderation logs:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Get all posts (Feed: Friends + Suggestions Shuffled)
// @route   GET /api/posts/feed
// @access  Private
export const getFeedPosts = async (req, res) => {
    try {
        const currentUser = await User.findById(req.user._id);
        const friendIds = currentUser.friends;

        // 1. Get recent posts from friends and user (Priority)
        const friendPosts = await Post.find({ author: { $in: [...friendIds, req.user._id] } })
            .sort({ createdAt: -1 })
            .limit(20)
            .populate("author", "name profilePic")
            .populate("comments.user", "name profilePic")
            .populate("comments.replies.user", "name profilePic");

        // 2. Get random suggested posts from non-friends (Discovery)
        const suggestedPostsAgg = await Post.aggregate([
            {
                $match: {
                    author: { $nin: [...friendIds, req.user._id] }
                }
            },
            { $sample: { size: 10 } }
        ]);

        // Populate suggested posts since aggregate returns plain objects
        const suggestedPosts = await Post.populate(suggestedPostsAgg, [
            { path: "author", select: "name profilePic" },
            { path: "comments.user", select: "name profilePic" },
            { path: "comments.replies.user", select: "name profilePic" }
        ]);

        // 3. Friends newest-first at top, discovery posts below
        const feedPosts = [...friendPosts, ...suggestedPosts];

        res.json(feedPosts);
    } catch (error) {
        console.error("Error fetching feed:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Get posts by user ID
// @route   GET /api/posts/user/:userId
// @access  Private
export const getUserPosts = async (req, res) => {
    try {
        const posts = await Post.find({ author: req.params.userId })
            .sort({ createdAt: -1 })
            .populate("author", "name profilePic")
            .populate("comments.user", "name profilePic")
            .populate("comments.replies.user", "name profilePic");

        res.json(posts);
    } catch (error) {
        console.error("Error fetching user posts:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Get single post by ID
// @route   GET /api/posts/:id
// @access  Private
export const getPostById = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)
            .populate("author", "name profilePic")
            .populate("comments.user", "name profilePic")
            .populate("comments.replies.user", "name profilePic");

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        res.json(post);
    } catch (error) {
        console.error("Error fetching post:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Like/Unlike a post
// @route   PUT /api/posts/:id/like
// @access  Private
export const likePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Check if post has already been liked
        if (post.likes.includes(req.user._id)) {
            // Unlike - Atomically remove from array
            const updatedPost = await Post.findByIdAndUpdate(
                req.params.id,
                { $pull: { likes: req.user._id } },
                { new: true }
            );

            // Remove corresponding like notification
            await Notification.deleteMany({
                recipient: post.author,
                sender: req.user._id,
                type: "like",
                post: post._id
            });
            
            return res.json(updatedPost.likes);
        } else {
            // Like - Atomically add to array if not present
            const updatedPost = await Post.findOneAndUpdate(
                { _id: req.params.id, likes: { $ne: req.user._id } },
                { $addToSet: { likes: req.user._id } },
                { new: true }
            );

            if (updatedPost) {
                // Create Notification if not self-like
                if (post.author.toString() !== req.user._id.toString()) {
                    const newNotification = new Notification({
                        recipient: post.author,
                        sender: req.user._id,
                        type: "like",
                        post: post._id,
                        message: `${req.user.name} liked your post.`,
                        relatedId: req.user._id // Backup for old frontend logic
                    });
                    await newNotification.save();
                }
                return res.json(updatedPost.likes);
            } else {
                // Post was already liked concurrently
                const currentPost = await Post.findById(req.params.id);
                return res.json(currentPost ? currentPost.likes : post.likes);
            }
        }
    } catch (error) {
        console.error("Error liking post:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Comment on a post
// @route   POST /api/posts/:id/comment
// @access  Private
export const commentPost = async (req, res) => {
    try {
        const { text, originalToxicText } = req.body;
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        let finalText = text;
        let isModerated = false;
        let originalText = undefined;

        if (originalToxicText) {
            // Frontend already showed warning and user accepted cleaned text
            isModerated = true;
            originalText = originalToxicText;
        } else {
            // Safety net: re-check on backend
            const moderationResult = await analyzeText(text);
            if (!moderationResult.safe) {
                isModerated = true;
                originalText = text;
                finalText = moderationResult.moderatedText;
            }
        }

        const newComment = {
            user: req.user._id,
            text: finalText,
            createdAt: new Date(),
            isModerated,
            originalText,
        };

        post.comments.unshift(newComment);
        await post.save();

        // Create Notification for post author
        if (post.author.toString() !== req.user._id.toString()) {
            const newNotification = new Notification({
                recipient: post.author,
                sender: req.user._id,
                type: "comment",
                post: post._id,
                message: `${req.user.name} commented on your post.`,
                relatedId: req.user._id
            });
            await newNotification.save();
        }

        const updatedPost = await Post.findById(req.params.id)
            .populate("comments.user", "name profilePic");

        res.json(updatedPost.comments);
    } catch (error) {
        console.error("Error commenting on post:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Helper to find comment recursively
const findComment = (comments, targetId) => {
    for (let comment of comments) {
        if (comment._id.toString() === targetId) {
            return comment;
        }
        if (comment.replies && comment.replies.length > 0) {
            const found = findComment(comment.replies, targetId);
            if (found) return found;
        }
    }
    return null;
};

// Helper to delete comment recursively
const deleteCommentRecursive = (comments, targetId) => {
    for (let i = 0; i < comments.length; i++) {
        if (comments[i]._id.toString() === targetId) {
            comments.splice(i, 1);
            return true;
        }
        if (comments[i].replies && comments[i].replies.length > 0) {
            const deleted = deleteCommentRecursive(comments[i].replies, targetId);
            if (deleted) return true;
        }
    }
    return false;
};

// @desc    Reply to a comment
// @route   POST /api/posts/:id/comments/:commentId/reply
// @access  Private
export const replyToComment = async (req, res) => {
    try {
        const { text, originalToxicText } = req.body;
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        const comment = findComment(post.comments, req.params.commentId);
        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        let finalText = text;
        let isModerated = false;
        let originalText = undefined;

        if (originalToxicText) {
            isModerated = true;
            originalText = originalToxicText;
        } else {
            const moderationResult = await analyzeText(text);
            if (!moderationResult.safe) {
                isModerated = true;
                originalText = text;
                finalText = moderationResult.moderatedText;
            }
        }

        const newReply = {
            user: req.user._id,
            text: finalText,
            createdAt: new Date(),
            isModerated,
            originalText,
        };

        comment.replies.push(newReply);
        await post.save();

        // Create Notification for comment author
        if (comment.user.toString() !== req.user._id.toString()) {
            const newNotification = new Notification({
                recipient: comment.user,
                sender: req.user._id,
                type: "reply",
                post: post._id,
                message: `${req.user.name} replied to your comment.`,
                relatedId: req.user._id
            });
            await newNotification.save();
        }

        const updatedPost = await Post.findById(req.params.id)
            .populate({
                path: "comments",
                populate: [
                    { path: "user", select: "name profilePic" },
                    {
                        path: "replies",
                        populate: [
                            { path: "user", select: "name profilePic" },
                            {
                                path: "replies",
                                populate: { path: "user", select: "name profilePic" }
                            }
                        ]
                    }
                ]
            });

        // Return the whole updated post comments to ensure UI consistency
        res.json(updatedPost.comments);
    } catch (error) {
        console.error("Error replying to comment:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Edit a comment
// @route   PUT /api/posts/:id/comments/:commentId
// @access  Private
export const editComment = async (req, res) => {
    try {
        const { text, originalToxicText } = req.body;
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        const comment = findComment(post.comments, req.params.commentId);
        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        // Check ownership
        if (comment.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: "User not authorized" });
        }

        let finalText = text;

        if (originalToxicText) {
            comment.isModerated = true;
            comment.originalText = originalToxicText;
            finalText = text;
        } else {
            const moderationResult = await analyzeText(text);
            if (!moderationResult.safe) {
                comment.isModerated = true;
                comment.originalText = text;
                finalText = moderationResult.moderatedText;
            } else {
                // If editing to clean text, reset moderation flag
                comment.isModerated = false;
                comment.originalText = undefined;
            }
        }

        comment.text = finalText;
        comment.isEdited = true;

        await post.save();

        // Return updated comments
        const updatedPost = await Post.findById(req.params.id)
            .populate({
                path: "comments",
                populate: [
                    { path: "user", select: "name profilePic" },
                    {
                        path: "replies",
                        populate: [
                            { path: "user", select: "name profilePic" },
                            {
                                path: "replies",
                                populate: { path: "user", select: "name profilePic" }
                            }
                        ]
                    }
                ]
            });

        res.json(updatedPost.comments);
    } catch (error) {
        console.error("Error editing comment:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Delete a comment
// @route   DELETE /api/posts/:id/comments/:commentId
// @access  Private
// note: user can delete own comment
export const deleteComment = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        const comment = findComment(post.comments, req.params.commentId);
        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        // Check ownership (Comment Author OR Post Author can delete?) 
        // Requirement: "user can delete its own comment"
        if (comment.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: "User not authorized" });
        }

        deleteCommentRecursive(post.comments, req.params.commentId);

        await post.save();

        // Attempt to remove corresponding comment notification 
        // Only if it's the main comment and the author wasn't the post author
        if (comment.user.toString() !== post.author.toString()) {
            await Notification.deleteMany({
                recipient: post.author,
                sender: comment.user,
                type: "comment",
                post: post._id
            });
        }

        // Return updated comments needed for UI update
        const updatedPost = await Post.findById(req.params.id)
            .populate({
                path: "comments",
                populate: [
                    { path: "user", select: "name profilePic" },
                    {
                        path: "replies",
                        populate: [
                            { path: "user", select: "name profilePic" },
                            {
                                path: "replies",
                                populate: { path: "user", select: "name profilePic" }
                            }
                        ]
                    }
                ]
            });

        res.json(updatedPost.comments);
    } catch (error) {
        console.error("Error deleting comment:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Hide a comment
// @route   PUT /api/posts/:id/comments/:commentId/hide
// @access  Private
// note: post owner can hide comment
export const hideComment = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        const comment = findComment(post.comments, req.params.commentId);
        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        // Check ownership: Only Post Author can hide comments
        if (post.author.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: "User not authorized" });
        }

        // Toggle hide
        comment.isHidden = !comment.isHidden;

        await post.save();

        const updatedPost = await Post.findById(req.params.id)
            .populate({
                path: "comments",
                populate: [
                    { path: "user", select: "name profilePic" },
                    {
                        path: "replies",
                        populate: [
                            { path: "user", select: "name profilePic" },
                            {
                                path: "replies",
                                populate: { path: "user", select: "name profilePic" }
                            }
                        ]
                    }
                ]
            });

        res.json(updatedPost.comments);
    } catch (error) {
        console.error("Error hiding comment:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Update a post
// @route   PUT /api/posts/:id
// @access  Private
export const updatePost = async (req, res) => {
    try {
        const { content } = req.body;
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Check ownership
        if (post.author.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: "User not authorized" });
        }

        // Moderation for updated content
        const moderationResult = await analyzeText(content);

        post.content = moderationResult.safe ? content : moderationResult.moderatedText;
        post.isModerated = !moderationResult.safe;
        post.moderationStatus = moderationResult.safe ? "safe" : "flagged";
        if (!moderationResult.safe) {
            post.originalContent = content;
            post.toxicityScore = moderationResult.score;
        } else {
            // If safe now, maybe clear original content or keep history? 
            // For now, let's just update standard fields.
            post.originalContent = undefined;
            post.toxicityScore = undefined;
        }

        const updatedPost = await post.save();
        await updatedPost.populate("author", "name profilePic");
        await updatedPost.populate("comments.user", "name profilePic");

        res.json(updatedPost);
    } catch (error) {
        console.error("Error updating post:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Delete a post
// @route   DELETE /api/posts/:id
// @access  Private
export const deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Check ownership
        if (post.author.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: "User not authorized" });
        }

        // Delete image from Cloudinary if exists
        if (post.image) {
            try {
                // Extract public_id using a more robust regex that handles /upload/(vXXX/)?folder/filename.ext
                const publicIdMatch = post.image.match(/\/upload\/(?:v\d+\/)?([^.]+)/);
                if (publicIdMatch && publicIdMatch[1]) {
                    const publicId = publicIdMatch[1];
                    await cloudinary.uploader.destroy(publicId);
                    console.log(`Successfully deleted image from Cloudinary: ${publicId}`);
                }
            } catch (err) {
                console.error("Error deleting image from Cloudinary:", err);
                // Continue to delete post even if image deletion fails
            }
        }

        await post.deleteOne();

        res.json({ message: "Post removed" });
    } catch (error) {
        console.error("Error deleting post:", error);
        res.status(500).json({ message: "Server error" });
    }
};
