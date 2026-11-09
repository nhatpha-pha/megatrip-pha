// Tiện ích dùng chung cho các API danh sách của trang admin.
// Trang admin gửi "all" (hoặc chuỗi rỗng) cho các bộ lọc "Tất cả" -> phải coi là KHÔNG lọc.
const isAll = (v) => v === undefined || v === null || String(v).trim() === '' || String(v).trim().toLowerCase() === 'all';
const clean = (v) => (isAll(v) ? undefined : String(v).trim());
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const paging = (query, defaultSize = 10) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const pageSize = Math.min(Math.max(Number(query.pageSize || query.limit) || defaultSize, 1), 10000);
  return { page, pageSize };
};
const parseIds = (body) => (Array.isArray(body && body.ids) ? body.ids.filter(Boolean) : []);
module.exports = { isAll, clean, escapeRegex, paging, parseIds };
