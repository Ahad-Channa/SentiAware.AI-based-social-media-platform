
import express from "express";
import User from "../models/User.js";
import protect from "../middleware/authMiddleware.js";
import { getUserProfile, getSuggestedUsers } from "../controllers/userController.js";

const router = express.Router();

// --- SUGGESTED USERS ---
router.get("/suggested", protect, getSuggestedUsers);

// --- SEARCH USERS ---
router.get("/search", protect, async (req, res) => {
  try {
    const query = req.query.q;

    if (!query) return res.json([]);

    const users = await User.find({
      name: { $regex: query, $options: "i" }
    }).select("name profilePic _id");

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- GET ANY USER PROFILE ---
router.get("/:id", protect, getUserProfile);

export default router;
