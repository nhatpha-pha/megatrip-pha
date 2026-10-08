const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MegaTrip API',
      version: '1.0.0',
      description:
        'API cho MegaTrip (megatrip-client + megatrip_admin). Tất cả response JSON đều bọc trong { data: ... } (trừ error).',
    },
    servers: [
      { url: 'http://localhost:' + (process.env.PORT || 8080), description: 'Local server' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: { message: { type: 'string' } },
        },
        Pagination: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            current: { type: 'integer' },
            pageSize: { type: 'integer' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            role: { type: 'string', enum: ['customer', 'admin', 'staff'] },
            isVerified: { type: 'boolean' },
          },
        },
        Tour: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            slug: { type: 'string' },
            description: { type: 'string' },
            adultPrice: { type: 'number' },
            childPrice: { type: 'number' },
            duration: { type: 'string' },
            status: { type: 'string', enum: ['active', 'hidden', 'draft'] },
            images: { type: 'array', items: { type: 'string' } },
          },
        },
        Bus: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            busCode: { type: 'string' },
            adultPrice: { type: 'number' },
            seatsTotal: { type: 'integer' },
            status: { type: 'string' },
          },
        },
        Order: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            orderNumber: { type: 'string' },
            customerName: { type: 'string' },
            total: { type: 'number' },
            paymentStatus: { type: 'string', enum: ['pending', 'paid', 'failed', 'refunded'] },
            orderStatus: {
              type: 'string',
              enum: ['pending', 'confirmed', 'processing', 'completed', 'cancelled'],
            },
          },
        },
        Promotion: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            code: { type: 'string' },
            type: { type: 'string', enum: ['percent', 'fixed'] },
            value: { type: 'number' },
            active: { type: 'boolean' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Đăng ký / đăng nhập / hồ sơ / quản lý user' },
      { name: 'Tours', description: 'Quản lý tour du lịch' },
      { name: 'Buses', description: 'Quản lý chuyến xe' },
      { name: 'Orders', description: 'Quản lý đơn hàng' },
      { name: 'Promotions', description: 'Mã khuyến mãi' },
      { name: 'Reviews', description: 'Đánh giá sản phẩm' },
      { name: 'Support', description: 'Yêu cầu hỗ trợ / ticket' },
      { name: 'News', description: 'Tin tức (admin)' },
      { name: 'Payments', description: 'VNPay / MoMo / ZaloPay' },
    ],
  },
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);
