// backend/middlewares/uploadMiddleware.js
const multer = require('multer');
const { Readable } = require('stream');
const cloudinary = require('../utils/cloudinary');

// Use memory storage so file is available as buffer
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Middleware to upload file to Cloudinary
const uploadToCloudinary = (req, res, next) => {
  if (!req.file) return next();

  const stream = cloudinary.uploader.upload_stream(
    { folder: 'support-uploads' }, // you can name the folder as needed
    (err, result) => {
      if (err) return next(err);

      req.cloudinaryUrl = result.secure_url; // accessible in controller
      req.cloudinaryPublicId = result.public_id;
      next();
    }
  );

  // Send buffer to Cloudinary stream
  Readable.from(req.file.buffer).pipe(stream);
};

module.exports = {
  upload,
  uploadToCloudinary,
};
