import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  sendFriendRequest,
  cancelFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  unfriendUser,
  getFriendStatus,
  getReceivedRequests,
  getFriendsList
} from "../controllers/friendController.js";

const router = express.Router();

// Send request
router.post("/send/:id", protect, sendFriendRequest);

// Cancel request
router.post("/cancel/:id", protect, cancelFriendRequest);

// Accept request
router.post("/accept/:id", protect, acceptFriendRequest);

// Reject request
router.post("/reject/:id", protect, rejectFriendRequest);

// Unfriend
router.post("/unfriend/:id", protect, unfriendUser);

// Get relationship status
router.get("/status/:id", protect, getFriendStatus);

// Get pending received requests
router.get("/received", protect, getReceivedRequests);

// Get friends list
router.get("/list", protect, getFriendsList);

export default router;
