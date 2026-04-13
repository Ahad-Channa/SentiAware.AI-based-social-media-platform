import express from "express";
import {
  createPost,
  getFeedPosts,
  getUserPosts,
  likePost,
  commentPost,
  updatePost,
  replyToComment,
  editComment,
  deleteComment as deletePostComment,
  hideComment,
  deletePost,
  getPostById,
  validateText,
  getModerationLogs,
  getCommentModerationLogs,
} from "../controllers/postController.js";
import { reportPost } from "../controllers/reportController.js";
import protect from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post("/validate-text", protect, validateText);
router.get("/moderated-logs", protect, getModerationLogs);
router.get("/comment-moderated-logs", protect, getCommentModerationLogs);

// Custom wrapper to catch Multer errors and return clean JSON response
const uploadSingleImage = (req, res, next) => {
    const uploader = upload.single("image");
    uploader(req, res, function (err) {
        if (err) {
            if (err.code === "LIMIT_FILE_SIZE") {
                return res.status(400).json({ message: "Image size cannot exceed 1.5MB." });
            }
            return res.status(400).json({ message: err.message });
        }
        next();
    });
};

router.post("/", protect, uploadSingleImage, createPost);
router.get("/feed", protect, getFeedPosts);
router.get("/user/:userId", protect, getUserPosts);
router.get("/:id", protect, getPostById);
router.put("/:id/like", protect, likePost);
router.post("/:id/comment", protect, commentPost);
router.post("/:id/comments/:commentId/reply", protect, replyToComment);
router.put("/:id/comments/:commentId", protect, editComment);
router.delete("/:id/comments/:commentId", protect, deletePostComment);
router.put("/:id/comments/:commentId/hide", protect, hideComment);
router.put("/:id", protect, updatePost);
router.delete("/:id", protect, deletePost);
router.post("/:id/report", protect, reportPost);

export default router;
