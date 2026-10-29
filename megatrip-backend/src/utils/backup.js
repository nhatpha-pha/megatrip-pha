// Sao lưu toàn bộ database ra file JSON (không cần cài thêm công cụ).
// Chạy:  npm run backup      -> tạo thư mục megatrip-backend/backups/<thời-gian>/ , mỗi collection 1 file .json
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const mongo = mongoose.mongo;
const EJSON = (mongo.BSON && mongo.BSON.EJSON) || mongo.EJSON;

(async () => {
  if (!EJSON) throw new Error('Không tìm thấy EJSON trong thư viện mongodb — hãy dùng mongodump thay thế.');
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/megatrip';
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  console.log(`[Backup] Đã kết nối: ${mongoose.connection.host} / database "${db.databaseName}"`);

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dir = path.join(__dirname, '..', '..', 'backups', stamp);
  fs.mkdirSync(dir, { recursive: true });

  const collections = await db.listCollections({}, { nameOnly: true }).toArray();
  let total = 0;
  for (const { name } of collections) {
    if (name.startsWith('system.')) continue;
    const docs = await db.collection(name).find({}).toArray();
    // EJSON giữ nguyên kiểu ObjectId / Date để khôi phục không bị sai dữ liệu
    fs.writeFileSync(path.join(dir, `${name}.json`), EJSON.stringify(docs, undefined, 2, { relaxed: false }));
    console.log(`  - ${name}: ${docs.length} bản ghi`);
    total += docs.length;
  }
  console.log(`[Backup] Xong: ${total} bản ghi -> ${dir}`);
  await mongoose.disconnect();
  process.exit(0);
})().catch((e) => {
  console.error('[Backup] Lỗi:', e.message);
  process.exit(1);
});
