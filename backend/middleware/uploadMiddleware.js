import multer from "multer";

// Keep files in memory for Cloudinary upload
const storage = multer.memoryStorage();

// File filter for images only
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
    } else {
        cb(new Error("Only image files are allowed!"), false);
    }
};

const upload = multer({ 
    storage,
    limits: { fileSize: 1.5 * 1024 * 1024 }, // 1.5MB
    fileFilter
});

export default upload;
