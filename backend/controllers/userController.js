import User from "../models/User.js";
import Post from "../models/Post.js";

export const getUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    // Count posts for this user
    const totalPosts = await Post.countDocuments({ author: userId });

    // Return user data with totalPosts included
    res.json({ ...user.toObject(), totalPosts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get suggested users (not friends)
// @route   GET /api/users/suggested
// @access  Private
export const getSuggestedUsers = async (req, res) => {
  try {
    // Exclude current user and already friends
    // Assuming req.user is populated by protect middleware
    // We also need to get the current user's friends list if it's not in req.user

    const currentUser = await User.findById(req.user._id);

    // Use aggregation to get random users efficiently
    const suggestedUsers = await User.aggregate([
      {
        $match: {
          _id: {
            $ne: req.user._id,
            $nin: [...currentUser.friends, ...currentUser.friendRequestsSent, ...currentUser.friendRequestsReceived]
          },
        },
      },
      { $sample: { size: 15 } }, // Get 15 random users
      {
        $project: {
          name: 1,
          username: 1,
          profilePic: 1,
        },
      },
    ]);

    res.json(suggestedUsers);
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    res.status(500).json({ message: "Server error" });
  }
};
