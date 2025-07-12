// backend/middlewares/uploadMiddleware.js
const multer = require('multer');
const { Readable } = require('stream');
const cloudinary = require('../utils/cloudinary');

const storage = multer.memoryStorage();
const upload = multer({ storage });

const uploadToCloudinary = (req, res, next) => {
  try {
    if (!req.file) return next(); // ✅ safely skip if no file

    const stream = cloudinary.uploader.upload_stream(
      { folder: 'support-uploads' },
      (err, result) => {
        if (err) {
          console.error("❌ Cloudinary upload error:", err);
          return res.status(500).json({ error: "Cloudinary upload failed." });
        }

        req.cloudinaryUrl = result.secure_url;
        req.cloudinaryPublicId = result.public_id;
        next();
      }
    );

    // Ensure buffer is valid before piping
    if (req.file.buffer) {
      Readable.from(req.file.buffer).pipe(stream);
    } else {
      return res.status(400).json({ error: "Invalid file buffer." });
    }
  } catch (error) {
    console.error("❌ Middleware crash:", error);
    return res.status(500).json({ error: "File upload middleware failed." });
  }
};

module.exports = {
  upload,
  uploadToCloudinary,
};
