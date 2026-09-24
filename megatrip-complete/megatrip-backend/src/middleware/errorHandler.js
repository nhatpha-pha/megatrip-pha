// eslint-disable-next-line no-unused-vars
const notFound = (req, res, next) => {
  res.status(404).json({ message: `Không tìm thấy route: ${req.originalUrl}` });
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const status = res.statusCode && res.statusCode !== 200 ? res.statusCode : err.status || 500;
  res.status(status).json({
    message: err.message || 'Lỗi máy chủ nội bộ',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = { notFound, errorHandler };
