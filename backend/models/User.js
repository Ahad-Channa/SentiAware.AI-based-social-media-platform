import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Please enter your name"] },
    email: { type: String, required: [true, "Please enter your email"], unique: true },
    password: { type: String, required: [true, "Please enter a password"] },
    profilePic: { type: String, default: "" },

    bio: { type: String, default: "" },
    location: { type: String, default: "" },
    address: { type: String, default: "" },
    phone: { type: String, default: "" },
    nickname: { type: String, default: "" },
    gender: { type: String, enum: ["boy", "girl", "other"], required: true },

    // ⭐ Added for Friend System
    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    friendRequestsSent: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    friendRequestsReceived: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
