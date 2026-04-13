import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    text: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    isHidden: {
        type: Boolean,
        default: false,
    },
    isEdited: {
        type: Boolean,
        default: false,
    },
    // Moderation fields
    isModerated: {
        type: Boolean,
        default: false,
    },
    originalText: {
        type: String, // Original toxic text before AI cleanup
    },
});

// Add recursive replies field
commentSchema.add({
    replies: [commentSchema]
});

const postSchema = new mongoose.Schema(
    {
        content: {
            type: String,
            required: [
                function () {
                    return !this.image;
                },
                "Please add some content or an image",
            ],
        },
        image: {
            type: String,
            default: "",
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        likes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        comments: [commentSchema],
        // Moderation fields
        isModerated: {
            type: Boolean,
            default: false,
        },
        moderationStatus: {
            type: String,
            enum: ["pending", "safe", "flagged", "removed"],
            default: "pending",
        },
        originalContent: {
            type: String, // Store original if modified by AI
        },
        toxicityScore: {
            type: Number, // Placeholder for future AI score
        },
        imageFlag: {
            type: String, // e.g., "violence", "nsfw", "toxic_text"
            default: "",
        },
    },
    { timestamps: true }
);

const Post = mongoose.model("Post", postSchema);
export default Post;
