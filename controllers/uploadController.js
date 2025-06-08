const path = require('path');
const fs = require('fs');
require('dotenv').config();

exports.uploadImage = async (req, res) => {
  try {
    console.log('========== BẮT ĐẦU UPLOAD ==========');

    if (!req.file) {
      console.warn('[❌] Không có file được gửi lên từ client!');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    console.log('[📦] File nhận được từ client:', req.file);

    const fileUrl = `/uploads/${req.file.filename}`;
    console.log('[🌐] Đường dẫn file trả về:', fileUrl);

    console.log('========== KẾT THÚC ==========');

    res.status(200).json({
      message: 'Upload successful',
      url: fileUrl
    });

  } catch (err) {
    console.error('[🔥 LỖI UPLOAD]', err);
    res.status(500).json({
      message: 'Upload failed',
      error: err.message
    });
  }
};
