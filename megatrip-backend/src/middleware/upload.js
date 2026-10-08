const multer = require('multer');

// Lưu file tạm trong RAM (buffer), KHÔNG ghi ra ổ đĩa server — sau đó
// controller sẽ đẩy buffer này thẳng lên Cloudinary rồi giải phóng bộ nhớ.
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Chỉ chấp nhận file ảnh (jpg, png, webp...)'));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 8 * 1024 * 1024, files: 10 }, // tối đa 8MB/ảnh, 10 ảnh/lần
});

module.exports = upload;
