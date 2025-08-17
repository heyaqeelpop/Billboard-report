const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

// ✅ Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Configure Cloudinary Storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "billboard-reports", // Folder name in Cloudinary
    format: async (req, file) => {
      // Support jpg, jpeg, png
      const supportedFormats = ["jpg", "jpeg", "png"];
      const fileFormat = file.mimetype.split("/")[1];
      return supportedFormats.includes(fileFormat) ? fileFormat : "png";
    },
    public_id: (req, file) => {
      // Generate unique filename
      return Date.now() + "_" + Math.round(Math.random() * 1e9);
    },
    transformation: [
      {
        width: 1000,
        height: 1000,
        crop: "limit", // Limit max size but keep aspect ratio
        quality: "auto", // Auto optimize quality
      },
    ],
  },
});

// ✅ Configure Multer with Cloudinary storage
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
}).single("image");

// ✅ Error handling middleware
const handleMulterErrors = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ error: "File too large. Maximum size is 10MB." });
    }
  }
  if (error) {
    return res.status(400).json({ error: error.message });
  }
  next();
};

module.exports = { upload, handleMulterErrors, cloudinary };
