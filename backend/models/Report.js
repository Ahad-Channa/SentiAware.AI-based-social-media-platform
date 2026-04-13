import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
    {
        reporter: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        post: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post",
            required: true,
        },
        category: {
            type: String,
            enum: ["nsfw", "violence", "hate_speech", "misinformation", "spam", "harassment", "other"],
            required: true,
        },
        note: {
            type: String,
            default: "",
        },
        status: {
            type: String,
            enum: ["pending", "reviewed", "dismissed"],
            default: "pending",
        },
    },
    { timestamps: true }
);

// Prevent the same user from reporting the same post twice
reportSchema.index({ reporter: 1, post: 1 }, { unique: true });

const Report = mongoose.model("Report", reportSchema);
export default Report;
