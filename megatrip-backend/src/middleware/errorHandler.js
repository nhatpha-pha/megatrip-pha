// eslint-disable-next-line no-unused-vars
const notFound = (req, res, next) => {
  res.status(404).json({ message: `Không tìm thấy route: ${req.originalUrl}` });
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let status = res.statusCode && res.statusCode !== 200 ? res.statusCode : err.status || 500;
  let message = err.message || 'Lỗi máy chủ nội bộ';

  // Biến các lỗi Mongoose/MongoDB thường gặp thành thông báo dễ hiểu (400 thay vì 500)
  if (err.code === 11000) {
    status = 400;
    const keys = Object.keys(err.keyValue || {});
    message = `Giá trị đã tồn tại${keys.length ? `: ${keys.map((k) => `${k} = ${err.keyValue[k]}`).join(', ')}` : ''}`;
  } else if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors || {}).map((e) => e.message).join('; ') || message;
  } else if (err.name === 'CastError') {
    status = 400;
    message = `Giá trị không hợp lệ cho trường "${err.path}"`;
  }

  // `error` được giữ cho các trang admin đọc j.error (ngoài message)
  res.status(status).json({
    message,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = { notFound, errorHandler };
