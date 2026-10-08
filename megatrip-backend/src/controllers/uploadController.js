const asyncHandler = require('express-async-handler');
const cloudinary = require('../config/cloudinary');

// Đẩy 1 buffer ảnh lên Cloudinary qua upload_stream (không qua ổ đĩa server)
const uploadBufferToCloudinary = (buffer, folder) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder, resource_type: 'image' }, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    stream.end(buffer);
  });

// POST /api/upload  (field name: "images", hỗ trợ nhiều file cùng lúc)
const uploadImages = asyncHandler(async (req, res) => {
  const files = req.files || (req.file ? [req.file] : []);

  if (!files.length) {
    res.status(400);
    throw new Error('Không có file nào được gửi lên (field name phải là "images")');
  }

  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
    res.status(500);
    throw new Error(
      'Chưa cấu hình Cloudinary — điền CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET vào file .env'
    );
  }

  const results = await Promise.all(
    files.map((file) => uploadBufferToCloudinary(file.buffer, 'megatrip'))
  );

  const data = results.map((r) => ({
    url: r.secure_url,
    secure_url: r.secure_url,
    publicId: r.public_id,
    width: r.width,
    height: r.height,
  }));

  res.status(201).json({ success: true, data });
});

module.exports = { uploadImages };
