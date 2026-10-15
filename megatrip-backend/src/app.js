const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const tourRoutes = require('./routes/tourRoutes');
const busRoutes = require('./routes/busRoutes');
const orderRoutes = require('./routes/orderRoutes');
const promotionRoutes = require('./routes/promotionRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const supportRoutes = require('./routes/supportRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const newsRoutes = require('./routes/newsRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const statsRoutes = require('./routes/statsRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();

// CORS_ORIGIN: danh sách domain frontend, cách nhau bởi dấu phẩy. Hỗ trợ "*" và wildcard "*.vercel.app".
const corsOrigins = (process.env.CORS_ORIGIN || '*')
  .split(',')
  .map((s) => s.trim().replace(/\/$/, ''))
  .filter(Boolean);
const isOriginAllowed = (origin) => {
  if (!origin) return true; // gọi server-to-server, Postman, Swagger cùng domain...
  if (corsOrigins.includes('*')) return true;
  let host = '';
  try { host = new URL(origin).hostname; } catch (e) { return false; }
  return corsOrigins.some((o) => (o.startsWith('*.') ? host.endsWith(o.slice(1)) : o === origin));
};
app.set('trust proxy', 1); // chạy sau proxy của Render/Railway
app.use(
  cors({
    origin: (origin, cb) => cb(null, isOriginAllowed(origin)),
    credentials: true,
  })
);
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

app.get('/', (req, res) => res.json({ message: 'MegaTrip API đang chạy' }));
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// Swagger UI: http://localhost:<PORT>/api-docs
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'MegaTrip API Docs',
  })
);
// JSON thuần của spec, hữu ích để import vào Postman/Insomnia
app.get('/api-docs.json', (req, res) => res.json(swaggerSpec));

app.use('/api/auth', authRoutes);
app.use('/api/tours', tourRoutes);
app.use('/api/buses', busRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/admin/news', newsRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/news', newsRoutes); // alias public

// Payment: mount cả ở root (khớp code hiện tại của frontend) lẫn dưới /api/payments
app.use('/', paymentRoutes);
app.use('/api/payments', paymentRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
