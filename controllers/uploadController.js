const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');
dotenv.config();

// Cấu hình cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Controller upload
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'avatars'     // 👉 Bạn có thể đổi thành folder tuỳ ý
    });

    res.status(200).json({
      message: 'Upload successful',
      url: result.secure_url
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Upload failed', error: err.message });
  }
};