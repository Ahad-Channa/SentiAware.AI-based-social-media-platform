import Report from "../models/Report.js";
import Post from "../models/Post.js";
import Notification from "../models/Notification.js";
import cloudinary from "../config/cloudinary.js";

// Auto-removal thresholds
const THRESHOLDS = {
    // Posts already AI-flagged: lower bar since AI already suspects them
    flagged_ai: {
        remove: 3,  // AI-flagged posts: auto-remove after 3 reports
    },
    // Clean posts reported for NSFW/violence
    severe: {
        categories: ["nsfw", "violence"],
        remove: 5,  // Auto-remove after 5 reports
    },
    // Lower severity categories
    moderate: {
        categories: ["misinformation", "spam", "harassment", "hate_speech", "other"],
        blur_badge: 7,   // Auto-blur + badge after 7 reports
        remove: 10,      // Auto-remove after 10 reports (7 + 3 more)
    },
};

const autoModeratPost = async (post, reportCount, category) => {
    const isAlreadyAIFlagged = !!post.imageFlag;

    // --- Rule 1: AI-flagged post gets 3 community reports → REMOVE ---
    if (isAlreadyAIFlagged && reportCount >= THRESHOLDS.flagged_ai.remove) {
        return "removed";
    }

    // --- Rule 2: Severe categories (nsfw/violence) → REMOVE at 5 ---
    if (THRESHOLDS.severe.categories.includes(category)) {
        if (reportCount >= THRESHOLDS.severe.remove) {
            return "removed";
        }
    }

    // --- Rule 3: Moderate categories → blur+badge at 7, remove at 10 ---
    if (THRESHOLDS.moderate.categories.includes(category)) {
        if (reportCount >= THRESHOLDS.moderate.remove) {
            return "removed";
        }
        if (reportCount >= THRESHOLDS.moderate.blur_badge) {
            return "community_flagged"; // blur + badge
        }
    }

    return null; // no action needed yet
};

// @desc    Report a post
// @route   POST /api/posts/:id/report
// @access  Private
export const reportPost = async (req, res) => {
    try {
        const { category, note } = req.body;
        const postId = req.params.id;
        const reporterId = req.user._id;

        // Validate category
        const validCategories = ["nsfw", "violence", "hate_speech", "misinformation", "spam", "harassment", "other"];
        if (!validCategories.includes(category)) {
            return res.status(400).json({ message: "Invalid report category" });
        }

        // Fetch the post
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Cannot report your own post
        if (post.author.toString() === reporterId.toString()) {
            return res.status(403).json({ message: "You cannot report your own post" });
        }

        // Cannot report an already-removed post
        if (post.moderationStatus === "removed") {
            return res.status(400).json({ message: "This post has already been removed" });
        }

        // Create report (unique index prevents duplicate from same user)
        try {
            await Report.create({
                reporter: reporterId,
                post: postId,
                category,
                note: note || "",
            });
        } catch (err) {
            if (err.code === 11000) {
                return res.status(409).json({ message: "You have already reported this post" });
            }
            throw err;
        }

        // Count all unique reports for this post
        const reportCount = await Report.countDocuments({ post: postId });

        // Run auto-moderation threshold check
        const action = await autoModeratPost(post, reportCount, category);

        if (action === "removed") {
            // Delete image from Cloudinary if exists
            if (post.image) {
                try {
                    const publicIdMatch = post.image.match(/\/upload\/(?:v\d+\/)?([^.]+)/);
                    if (publicIdMatch && publicIdMatch[1]) {
                        await cloudinary.uploader.destroy(publicIdMatch[1]);
                    }
                } catch (err) {
                    console.error("Error deleting image from Cloudinary on community removal:", err);
                }
            }
            post.moderationStatus = "removed";
            post.isModerated = true;
            await post.save();

            // Notify the post author about removal
            await Notification.create({
                recipient: post.author,
                type: "system",
                message: `Your post was automatically removed after receiving multiple community reports for "${category.replace("_", " ")}".`,
                post: post._id,
            });

            return res.status(201).json({
                message: "Report submitted. This post has been automatically removed by community action.",
                action: "removed",
                reportCount,
            });
        }

        if (action === "community_flagged") {
            post.moderationStatus = "flagged";
            post.isModerated = true;
            post.imageFlag = post.imageFlag || "community_report"; // add badge if not already there
            await post.save();

            return res.status(201).json({
                message: "Report submitted. This post has been blurred by community action.",
                action: "community_flagged",
                reportCount,
            });
        }

        // Notify the post author that their post was reported (first time or subsequent)
        await Notification.create({
            recipient: post.author,
            type: "system",
            message: `Someone reported your post for "${category.replace("_", " ")}". It is under review. (${reportCount} report${reportCount > 1 ? 's' : ''} total)`,
            post: post._id,
        });

        res.status(201).json({
            message: "Thank you for your report. We will review it shortly.",
            action: "pending",
            reportCount,
        });
    } catch (error) {
        console.error("Error reporting post:", error);
        res.status(500).json({ message: "Server error" });
    }
};
