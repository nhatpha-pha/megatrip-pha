// Khôi phục dữ liệu từ thư mục sao lưu do `npm run backup` tạo ra.
// Chạy:  npm run restore -- backups/<thư-mục>
// Mỗi bản ghi được ghi theo _id (có thì cập nhật, chưa có thì thêm) nên chạy lại nhiều lần vẫn an toàn.
// Thêm --drop để xoá sạch collection trước khi khôi phục.
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const mongo = mongoose.mongo;
const EJSON = (mongo.BSON && mongo.BSON.EJSON) || mongo.EJSON;

(async () => {
  const args = process.argv.slice(2);
  const drop = args.includes('--drop');
  const folder = args.find((a) => !a.startsWith('--'));
  if (!folder) throw new Error('Thiếu đường dẫn thư mục. Ví dụ: npm run restore -- backups/2026-10-20T10-00-00-000Z');
  const dir = path.resolve(folder);
  if (!fs.existsSync(dir)) throw new Error(`Không tìm thấy thư mục: ${dir}`);
  if (!EJSON) throw new Error('Không tìm thấy EJSON trong thư viện mongodb — hãy dùng mongorestore thay thế.');

  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/megatrip');
  const db = mongoose.connection.db;
  console.log(`[Restore] Đã kết nối: ${mongoose.connection.host} / database "${db.databaseName}"`);

  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    const name = path.basename(file, '.json');
    const docs = EJSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    const col = db.collection(name);
    if (drop) await col.deleteMany({});
    if (docs.length) {
      await col.bulkWrite(docs.map((d) => ({ replaceOne: { filter: { _id: d._id }, replacement: d, upsert: true } })));
    }
    console.log(`  - ${name}: ${docs.length} bản ghi`);
  }
  console.log('[Restore] Hoàn tất.');
  await mongoose.disconnect();
  process.exit(0);
})().catch((e) => {
  console.error('[Restore] Lỗi:', e.message);
  process.exit(1);
});
