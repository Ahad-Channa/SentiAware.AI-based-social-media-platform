import User from "../models/User.js";
import Notification from "../models/Notification.js";
import bcrypt from "bcryptjs";
import generateToken from "../utils/generateToken.js";
import sendEmail from "../utils/sendEmail.js";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "profilePics" },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    stream.end(fileBuffer);
  });
};

const pendingRegistrations = new Map();
const pendingPasswordResets = new Map();

// STEP 1: INIT FORGOT PASSWORD (Send OTP)
export const forgotPasswordInit = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "No account found with that email." });
    }

    const existingPending = pendingPasswordResets.get(email);
    if (existingPending && existingPending.expires > Date.now()) {
      const waitTimeRemaining = Math.ceil((existingPending.expires - Date.now()) / 1000 / 60);
      return res.status(400).json({ message: `An OTP was already sent. Please wait ${waitTimeRemaining} minutes before requesting a new one.` });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    pendingPasswordResets.set(email, {
      otp,
      expires: Date.now() + 5 * 60 * 1000, // 5 minutes expiration
    });

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #1A1A24; padding: 20px; border-radius: 10px; color: #ffffff;">
        <h2 style="color: #8E54E9; text-align: center;">SentiAware Password Reset</h2>
        <p style="font-size: 16px; color: #d1d5db;">Hello ${user.name},</p>
        <p style="font-size: 16px; color: #d1d5db;">We received a request to reset your password. Here is your One-Time Password (OTP):</p>
        <div style="background-color: #232330; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <strong style="font-size: 32px; color: #ffffff; letter-spacing: 5px;">${otp}</strong>
        </div>
        <p style="font-size: 14px; color: #9ca3af;">This OTP is valid for 5 minutes. If you did not request a password reset, please ignore this email.</p>
        <hr style="border-color: #2D2D3B; margin-top: 30px; margin-bottom: 20px;" />
        <p style="font-size: 12px; color: #6b7280; text-align: center;">© 2026 SentiAware. All rights reserved.</p>
      </div>
    `;

    await sendEmail(
      email,
      "SentiAware Password Reset - OTP",
      `Your OTP for password reset is: ${otp}. It expires in 5 minutes.`,
      htmlBody
    );

    res.json({ message: "OTP sent to your email" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// STEP 2: VERIFY OTP AND RESET PASSWORD
export const forgotPasswordVerify = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const record = pendingPasswordResets.get(email);

    if (!record) {
      return res.status(400).json({ message: "No pending password reset found. Please request a new OTP." });
    }

    if (record.expires < Date.now()) {
      pendingPasswordResets.delete(email);
      return res.status(400).json({ message: "OTP expired. Please request a new one." });
    }

    if (record.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (
      newPassword.length < 8 ||
      !/[A-Z]/.test(newPassword) ||
      !/[0-9]/.test(newPassword) ||
      !/[@$!%*?&#]/.test(newPassword)
    ) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters long, contain an uppercase letter, a number, and a special character.",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    pendingPasswordResets.delete(email);

    res.status(200).json({ message: "Password updated successfully!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const registerInit = async (req, res) => {
  try {
    const { name, email, password, gender } = req.body;

    // 👇 This checks if the email is already registered to a user
    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "User already exists" });

    // Validate Password Strength
    if (
      password.length < 8 ||
      !/[A-Z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[@$!%*?&#]/.test(password)
    ) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters long, contain an uppercase letter, a number, and a special character.",
      });
    }

    // 👇 PREVENT MULTIPLE OTPS: Check if an unexpired OTP already exists for this email
    const existingPending = pendingRegistrations.get(email);
    if (existingPending && existingPending.expires > Date.now()) {
      const waitTimeRemaining = Math.ceil((existingPending.expires - Date.now()) / 1000 / 60);
      return res.status(400).json({ message: `An OTP was already sent. Please wait ${waitTimeRemaining} minutes before requesting a new one.` });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    pendingRegistrations.set(email, {
      name,
      email,
      password,
      gender,
      otp,
      expires: Date.now() + 1 * 60 * 1000,
    });



    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #1A1A24; padding: 20px; border-radius: 10px; color: #ffffff;">
        <h2 style="color: #8E54E9; text-align: center;">Welcome to SentiAware!</h2>
        <p style="font-size: 16px; color: #d1d5db;">Hello ${name},</p>
        <p style="font-size: 16px; color: #d1d5db;">Thank you for starting your registration. Here is your One-Time Password (OTP) to verify your email address:</p>
        <div style="background-color: #232330; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <strong style="font-size: 32px; color: #ffffff; letter-spacing: 5px;">${otp}</strong>
        </div>
        <p style="font-size: 14px; color: #9ca3af;">This OTP is valid for 1 minute. If you did not request this registration, please ignore this email.</p>
        <hr style="border-color: #2D2D3B; margin-top: 30px; margin-bottom: 20px;" />
        <p style="font-size: 12px; color: #6b7280; text-align: center;">© 2026 SentiAware. All rights reserved.</p>
      </div>
    `;

    await sendEmail(
      email,
      "SentiAware Registration OTP",
      `Your OTP is: ${otp}`,
      htmlBody
    );

    res.json({ message: "OTP sent to your email" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// STEP 2: VERIFY OTP & CREATE USER
export const registerVerify = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const record = pendingRegistrations.get(email);

    if (!record)
      return res.status(400).json({ message: "No pending registration found" });

    if (record.expires < Date.now())
      return res.status(400).json({ message: "OTP expired" });

    if (record.otp !== otp)
      return res.status(400).json({ message: "Invalid OTP" });

    // Use stored data, NOT req.body
    const { name, password, gender } = record;

    const hashedPassword = await bcrypt.hash(password, 10);

    let profilePic = "";
    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file.buffer);
      profilePic = uploadResult.secure_url;
    }

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      gender,
      profilePic,
    });

    // Create Welcome Notification fail-safe
    try {
      await Notification.create({
        recipient: user._id,
        message: "Welcome to SentiAware! Complete your profile to get started. Click here for a short tutorial.",
        type: "system",
      });
    } catch (err) {
      console.error("Welcome notification error:", err.message);
    }

    pendingRegistrations.delete(email);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      profilePic: user.profilePic,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }


};



// @desc Register user
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, gender } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "User already exists" });

    // Validate Password Strength
    if (
      password.length < 8 ||
      !/[A-Z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[@$!%*?&#]/.test(password)
    ) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters long, contain an uppercase letter, a number, and a special character.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let profilePic = "";
    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file.buffer);
      profilePic = uploadResult.secure_url;
    }

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      gender,
      profilePic,
    });

    // Create Welcome Notification fail-safe
    try {
      await Notification.create({
        recipient: user._id,
        message: "Welcome to SentiAware! Complete your profile to get started. Click here for a short tutorial.",
        type: "system",
      });
    } catch (err) {
      console.error("Welcome notification error:", err.message);
    }

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      profilePic: user.profilePic,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Login user
// @desc Login user
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid password" });

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      profilePic: user.profilePic,
      bio: user.bio || "",
      location: user.location || "",
      address: user.address || "",
      phone: user.phone || "",
      nickname: user.nickname || "",
      token: generateToken(user._id),
      createdAt: user.createdAt,
      friends: user.friends || [],

    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user._id; // assuming auth middleware adds req.user
    const { name, bio, location, address, phone, nickname } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.name = name || user.name;
    user.bio = bio || user.bio;
    user.location = location || user.location;
    user.address = address || user.address;
    user.phone = phone || user.phone;
    if (nickname !== undefined) user.nickname = nickname;

    // ✅ Proper profilePic update
    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file.buffer);
      user.profilePic = uploadResult.secure_url;
    }

    const updatedUser = await user.save();

    res.status(200).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      profilePic: updatedUser.profilePic,
      bio: updatedUser.bio,
      location: updatedUser.location,
      address: updatedUser.address,
      phone: updatedUser.phone,
      nickname: updatedUser.nickname,
      token: generateToken(updatedUser._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Change Password
export const changePassword = async (req, res) => {
  try {
    const userId = req.user._id;
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(401).json({ message: "Incorrect current password" });

    // Validate Password Strength
    if (
      newPassword.length < 8 ||
      !/[A-Z]/.test(newPassword) ||
      !/[0-9]/.test(newPassword) ||
      !/[@$!%*?&#]/.test(newPassword)
    ) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters long, contain an uppercase letter, a number, and a special character.",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};