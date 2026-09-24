// Helper để trả response đồng nhất { data, pagination } giống format frontend đang kỳ vọng
const paginated = (res, { data, total, page = 1, pageSize = 10 }) => {
  res.json({
    data,
    pagination: {
      total,
      current: Number(page),
      pageSize: Number(pageSize),
    },
  });
};

module.exports = { paginated };
