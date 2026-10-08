require('dotenv').config();
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const User = require('../models/User');
const Tour = require('../models/Tour');
const Bus = require('../models/Bus');
const Order = require('../models/Order');
const Promotion = require('../models/Promotion');
const Review = require('../models/Review');
const Ticket = require('../models/Ticket');
const News = require('../models/News');

const tours = [
  {
    name: 'Đà Lạt Mộng Mơ 3N2Đ',
    slug: 'da-lat-mong-mo-3n2d',
    description:
      'Khám phá thành phố ngàn hoa với các điểm đến nổi tiếng: Hồ Xuân Hương, Thung lũng Tình Yêu, Quảng trường Lâm Viên, chợ đêm Đà Lạt.',
    departureFrom: 'TP. Hồ Chí Minh',
    destination: 'Đà Lạt',
    startDates: ['2026-11-15', '2026-11-22', '2026-11-29'],
    duration: '3 ngày 2 đêm',
    difficulty: 'easy',
    adultPrice: 2590000,
    childPrice: 1890000,
    maxGroupSize: 35,
    status: 'active',
    highlight: true,
    isVisible: true,
    images: ['https://images.unsplash.com/photo-1583417319070-4a69db38a482'],
    itinerary: [
      { dayNumber: 1, title: 'TP.HCM - Đà Lạt', details: 'Khởi hành từ TP.HCM, nhận phòng khách sạn, tham quan chợ đêm.' },
      { dayNumber: 2, title: 'Khám phá Đà Lạt', details: 'Thung lũng Tình Yêu, Thiền viện Trúc Lâm, hồ Tuyền Lâm.' },
      { dayNumber: 3, title: 'Đà Lạt - TP.HCM', details: 'Tham quan Quảng trường Lâm Viên, mua đặc sản, về lại TP.HCM.' },
    ],
  },
  {
    name: 'Phú Quốc Biển Xanh Cát Trắng 4N3Đ',
    slug: 'phu-quoc-bien-xanh-cat-trang-4n3d',
    description:
      'Tận hưởng kỳ nghỉ biển đảo với Vinpearl Safari, cáp treo Hòn Thơm, chợ đêm Phú Quốc và lặn ngắm san hô.',
    departureFrom: 'TP. Hồ Chí Minh',
    destination: 'Phú Quốc',
    startDates: ['2026-11-20', '2026-12-05'],
    duration: '4 ngày 3 đêm',
    difficulty: 'easy',
    adultPrice: 5990000,
    childPrice: 4290000,
    maxGroupSize: 30,
    status: 'active',
    highlight: true,
    isVisible: true,
    images: ['https://images.unsplash.com/photo-1540541338287-41700207dee6'],
    itinerary: [
      { dayNumber: 1, title: 'TP.HCM - Phú Quốc', details: 'Bay ra đảo, nhận phòng resort, tắm biển Bãi Sao.' },
      { dayNumber: 2, title: 'Cáp treo Hòn Thơm', details: 'Trải nghiệm cáp treo vượt biển dài nhất thế giới, công viên nước Aquatopia.' },
      { dayNumber: 3, title: 'Lặn ngắm san hô', details: 'Tour 4 đảo, lặn ngắm san hô, câu cá cùng ngư dân.' },
      { dayNumber: 4, title: 'Phú Quốc - TP.HCM', details: 'Mua sắm đặc sản, tiễn đoàn ra sân bay.' },
    ],
  },
  {
    name: 'Sapa Mây Ngàn 2N1Đ',
    slug: 'sapa-may-ngan-2n1d',
    description: 'Chinh phục đỉnh Fansipan bằng cáp treo, bản Cát Cát, thác Bạc giữa núi rừng Tây Bắc.',
    departureFrom: 'Hà Nội',
    destination: 'Sapa',
    startDates: ['2026-11-18', '2026-11-25'],
    duration: '2 ngày 1 đêm',
    difficulty: 'medium',
    adultPrice: 1890000,
    childPrice: 1390000,
    maxGroupSize: 25,
    status: 'active',
    highlight: false,
    isVisible: true,
    images: ['https://images.unsplash.com/photo-1528127269322-539801943592'],
    itinerary: [
      { dayNumber: 1, title: 'Hà Nội - Sapa', details: 'Di chuyển lên Sapa, tham quan bản Cát Cát, thác Bạc.' },
      { dayNumber: 2, title: 'Chinh phục Fansipan', details: 'Cáp treo lên đỉnh Fansipan, về lại Hà Nội.' },
    ],
  },
  {
    name: 'Hạ Long Vịnh Ngọc 2N1Đ',
    slug: 'ha-long-vinh-ngoc-2n1d',
    description: 'Du thuyền ngắm vịnh Hạ Long, hang Sửng Sốt, làng chài Cửa Vạn, chèo kayak giữa kỳ quan thiên nhiên.',
    departureFrom: 'Hà Nội',
    destination: 'Hạ Long',
    startDates: ['2026-11-21', '2026-11-28'],
    duration: '2 ngày 1 đêm',
    difficulty: 'easy',
    adultPrice: 2190000,
    childPrice: 1590000,
    maxGroupSize: 28,
    status: 'active',
    highlight: false,
    isVisible: true,
    images: ['https://images.unsplash.com/photo-1528127269322-539801943592'],
    itinerary: [
      { dayNumber: 1, title: 'Hà Nội - Hạ Long', details: 'Lên du thuyền, tham quan hang Sửng Sốt, chèo kayak.' },
      { dayNumber: 2, title: 'Ngắm bình minh - Hà Nội', details: 'Tập Thái Cực Quyền trên boong tàu, về lại Hà Nội.' },
    ],
  },
];

const buses = [
  {
    busCode: 'MT-HCM-DL-01',
    operator: { name: 'MegaTrip Limousine', code: 'MTL' },
    routeFrom: { code: 'SGN', name: 'Bến xe Miền Đông', city: 'TP. Hồ Chí Minh' },
    routeTo: { code: 'DL', name: 'Bến xe Đà Lạt', city: 'Đà Lạt' },
    departureAt: '21:00',
    arrivalAt: '05:00',
    departureDates: ['2026-11-15', '2026-11-16', '2026-11-17'],
    duration: '8 giờ',
    busType: ['Limousine 22 chỗ'],
    adultPrice: 320000,
    childPrice: 250000,
    seatsTotal: 22,
    status: 'active',
    amenities: ['Wifi', 'Nước uống', 'Chăn đắp'],
  },
  {
    busCode: 'MT-HN-SP-01',
    operator: { name: 'MegaTrip Sleeper Bus', code: 'MTS' },
    routeFrom: { code: 'HN', name: 'Bến xe Mỹ Đình', city: 'Hà Nội' },
    routeTo: { code: 'SP', name: 'Bến xe Sapa', city: 'Sapa' },
    departureAt: '22:30',
    arrivalAt: '04:30',
    departureDates: ['2026-11-18', '2026-11-19'],
    duration: '6 giờ',
    busType: ['Giường nằm 34 chỗ'],
    adultPrice: 280000,
    childPrice: 220000,
    seatsTotal: 34,
    status: 'active',
    amenities: ['Wifi', 'Nước uống'],
  },
  {
    busCode: 'MT-HCM-VT-01',
    operator: { name: 'MegaTrip Limousine', code: 'MTL' },
    routeFrom: { code: 'SGN', name: 'Bến xe Miền Đông', city: 'TP. Hồ Chí Minh' },
    routeTo: { code: 'VT', name: 'Bến xe Vũng Tàu', city: 'Vũng Tàu' },
    departureAt: '07:00',
    arrivalAt: '09:30',
    departureDates: ['2026-11-15', '2026-11-16'],
    duration: '2.5 giờ',
    busType: ['Limousine 9 chỗ'],
    adultPrice: 180000,
    childPrice: 140000,
    seatsTotal: 9,
    status: 'active',
    amenities: ['Wifi'],
  },
];

const promotions = [
  {
    code: 'MEGA50',
    title: 'Giảm 50.000đ cho đơn từ 2 triệu',
    description: 'Áp dụng cho mọi loại hình đặt tour/xe từ 2.000.000đ trở lên.',
    type: 'fixed',
    value: 50000,
    minSpend: 2000000,
    appliesTo: ['tours', 'buses'],
    validFrom: new Date('2026-10-01'),
    validTo: new Date('2026-12-31'),
    active: true,
  },
  {
    code: 'TOUR10',
    title: 'Giảm 10% cho tour bất kỳ',
    description: 'Giảm tối đa 500.000đ khi đặt bất kỳ tour nào trên MegaTrip.',
    type: 'percent',
    value: 10,
    minSpend: 0,
    appliesTo: ['tours'],
    validFrom: new Date('2026-10-01'),
    validTo: new Date('2026-11-30'),
    active: true,
  },
  {
    code: 'WELCOME20',
    title: 'Chào mừng khách hàng mới - giảm 20%',
    description: 'Dành cho đơn hàng đầu tiên, giảm tối đa 300.000đ.',
    type: 'percent',
    value: 20,
    minSpend: 500000,
    appliesTo: ['tours', 'buses'],
    validFrom: new Date('2026-09-01'),
    validTo: new Date('2026-12-31'),
    active: true,
  },
];

const news = [
  {
    title: 'MegaTrip ra mắt loạt tour mùa đông 2026',
    slug: 'megatrip-ra-mat-loat-tour-mua-dong-2026',
    category: 'Khuyến mãi',
    status: 'published',
    author: { name: 'MegaTrip Team' },
    summary: 'Nhiều tour hấp dẫn với giá ưu đãi dành riêng cho mùa đông năm nay.',
    content: 'Nội dung chi tiết về chương trình tour mùa đông 2026 của MegaTrip...',
    featured: true,
    publishedAt: new Date(),
  },
  {
    title: 'Kinh nghiệm du lịch Phú Quốc tự túc',
    slug: 'kinh-nghiem-du-lich-phu-quoc-tu-tuc',
    category: 'Cẩm nang',
    status: 'published',
    author: { name: 'MegaTrip Team' },
    summary: 'Tổng hợp kinh nghiệm ăn-chơi-ở tại đảo ngọc Phú Quốc.',
    content: 'Nội dung chi tiết kinh nghiệm du lịch Phú Quốc...',
    featured: false,
    publishedAt: new Date(),
  },
  {
    title: '5 lý do nên đặt tour Đà Lạt vào tháng 12',
    slug: '5-ly-do-nen-dat-tour-da-lat-thang-12',
    category: 'Cẩm nang',
    status: 'published',
    author: { name: 'MegaTrip Team' },
    summary: 'Thời tiết se lạnh, hoa dã quỳ nở rộ - mùa đẹp nhất để đến Đà Lạt.',
    content: 'Nội dung chi tiết 5 lý do nên đặt tour Đà Lạt...',
    featured: false,
    publishedAt: new Date(),
  },
];

const customersSeed = [
  { name: 'Nguyễn Văn An', email: 'nguyenvanan@gmail.com', phone: '0901234567', address: '12 Lê Lợi, Q.1, TP.HCM' },
  { name: 'Trần Thị Bình', email: 'tranthibinh@gmail.com', phone: '0912345678', address: '45 Nguyễn Huệ, Q.1, TP.HCM' },
  { name: 'Lê Hoàng Cường', email: 'lehoangcuong@gmail.com', phone: '0923456789', address: '78 Trần Hưng Đạo, Hà Nội' },
];

(async () => {
  await connectDB();

  // ===== 1. Khách hàng mẫu =====
  const customerDocs = [];
  for (const c of customersSeed) {
    let user = await User.findOne({ email: c.email });
    if (!user) {
      const hashed = await bcrypt.hash('123456', 10);
      user = await User.create({ ...c, password: hashed, role: 'customer', isVerified: true });
      console.log(`Đã tạo khách hàng mẫu: ${c.email} / mật khẩu: 123456`);
    }
    customerDocs.push(user);
  }

  // ===== 2. Tours =====
  let tourDocs = await Tour.find();
  if (tourDocs.length === 0) {
    tourDocs = await Tour.insertMany(tours);
    console.log(`Đã thêm ${tours.length} tour mẫu`);
  } else {
    console.log(`Bỏ qua tour (đã có ${tourDocs.length} tour trong DB)`);
  }

  // ===== 3. Buses =====
  let busDocs = await Bus.find();
  if (busDocs.length === 0) {
    busDocs = await Bus.insertMany(buses);
    console.log(`Đã thêm ${buses.length} chuyến xe mẫu`);
  } else {
    console.log(`Bỏ qua xe (đã có ${busDocs.length} chuyến trong DB)`);
  }

  // ===== 4. Promotions =====
  const promoCount = await Promotion.countDocuments();
  if (promoCount === 0) {
    await Promotion.insertMany(promotions);
    console.log(`Đã thêm ${promotions.length} mã khuyến mãi mẫu`);
  } else {
    console.log(`Bỏ qua khuyến mãi (đã có ${promoCount} mã trong DB)`);
  }

  // ===== 5. News =====
  const newsCount = await News.countDocuments();
  if (newsCount === 0) {
    await News.insertMany(news);
    console.log(`Đã thêm ${news.length} bài tin tức mẫu`);
  } else {
    console.log(`Bỏ qua tin tức (đã có ${newsCount} bài trong DB)`);
  }

  // ===== 6. Orders (gắn với khách hàng + tour/bus thật) =====
  const orderCount = await Order.countDocuments();
  if (orderCount === 0 && tourDocs.length && busDocs.length && customerDocs.length) {
    const sampleOrders = [
      {
        orderNumber: 'MT00000001',
        customerId: customerDocs[0]._id,
        customerName: customerDocs[0].name,
        customerEmail: customerDocs[0].email,
        customerPhone: customerDocs[0].phone,
        items: [
          {
            type: 'tour',
            name: tourDocs[0].name,
            quantity: 2,
            unitPrice: tourDocs[0].adultPrice,
            subtotal: tourDocs[0].adultPrice * 2,
          },
        ],
        subtotal: tourDocs[0].adultPrice * 2,
        total: tourDocs[0].adultPrice * 2,
        paymentMethod: 'cod',
        paymentStatus: 'paid',
        orderStatus: 'completed',
        timeline: [
          { status: 'pending', note: 'Đơn hàng được tạo', actor: customerDocs[0].name, timestamp: new Date(Date.now() - 86400000 * 5) },
          { status: 'completed', note: 'Hoàn tất chuyến đi', actor: 'admin', timestamp: new Date(Date.now() - 86400000) },
        ],
      },
      {
        orderNumber: 'MT00000002',
        customerId: customerDocs[1]._id,
        customerName: customerDocs[1].name,
        customerEmail: customerDocs[1].email,
        customerPhone: customerDocs[1].phone,
        items: [
          {
            type: 'bus',
            name: `${busDocs[0].routeFrom.city} - ${busDocs[0].routeTo.city}`,
            quantity: 1,
            unitPrice: busDocs[0].adultPrice,
            subtotal: busDocs[0].adultPrice,
          },
        ],
        subtotal: busDocs[0].adultPrice,
        total: busDocs[0].adultPrice,
        paymentMethod: 'vnpay',
        paymentStatus: 'paid',
        orderStatus: 'confirmed',
        timeline: [{ status: 'confirmed', note: 'Đơn hàng được xác nhận', actor: 'admin', timestamp: new Date() }],
      },
      {
        orderNumber: 'MT00000003',
        customerId: customerDocs[2]._id,
        customerName: customerDocs[2].name,
        customerEmail: customerDocs[2].email,
        customerPhone: customerDocs[2].phone,
        items: [
          {
            type: 'tour',
            name: tourDocs[1].name,
            quantity: 1,
            unitPrice: tourDocs[1].adultPrice,
            subtotal: tourDocs[1].adultPrice,
          },
        ],
        subtotal: tourDocs[1].adultPrice,
        total: tourDocs[1].adultPrice,
        paymentMethod: 'momo',
        paymentStatus: 'pending',
        orderStatus: 'pending',
        timeline: [{ status: 'pending', note: 'Đơn hàng được tạo, chờ thanh toán', actor: customerDocs[2].name, timestamp: new Date() }],
      },
    ];
    const orderDocs = await Order.insertMany(sampleOrders);
    console.log(`Đã thêm ${sampleOrders.length} đơn hàng mẫu`);

    // ===== 7. Reviews (gắn với đơn hàng đã hoàn tất) =====
    const reviewCount = await Review.countDocuments();
    if (reviewCount === 0) {
      await Review.insertMany([
        {
          orderId: orderDocs[0]._id,
          productId: tourDocs[0]._id,
          productType: 'tour',
          customerId: customerDocs[0]._id,
          rating: 5,
          comment: 'Chuyến đi tuyệt vời, hướng dẫn viên nhiệt tình, lịch trình hợp lý!',
          serviceName: tourDocs[0].name,
          isVisible: true,
        },
        {
          productId: tourDocs[1]._id,
          productType: 'tour',
          customerId: customerDocs[1]._id,
          rating: 4,
          comment: 'Resort đẹp, đồ ăn ngon, chỉ tiếc thời gian hơi ngắn.',
          serviceName: tourDocs[1].name,
          isVisible: true,
        },
      ]);
      console.log('Đã thêm 2 đánh giá mẫu');
    }
  } else {
    console.log(`Bỏ qua đơn hàng (đã có ${orderCount} đơn trong DB)`);
  }

  // ===== 8. Support tickets =====
  const ticketCount = await Ticket.countDocuments();
  if (ticketCount === 0 && customerDocs.length) {
    await Ticket.insertMany([
      {
        title: 'Hỏi về chính sách đổi lịch tour',
        content: 'Tôi muốn đổi ngày khởi hành tour Đà Lạt sang tuần sau, có được không?',
        customerId: customerDocs[0]._id,
        customerName: customerDocs[0].name,
        customerEmail: customerDocs[0].email,
        category: 'general',
        priority: 'medium',
        status: 'open',
        responses: [
          {
            content: 'Chào anh/chị, MegaTrip hỗ trợ đổi lịch miễn phí trước 3 ngày khởi hành ạ.',
            authorType: 'admin',
            authorName: 'Admin',
          },
        ],
      },
      {
        title: 'Chưa nhận được email xác nhận đơn hàng',
        content: 'Tôi đã thanh toán nhưng chưa thấy email xác nhận đơn MT00000002.',
        customerId: customerDocs[1]._id,
        customerName: customerDocs[1].name,
        customerEmail: customerDocs[1].email,
        category: 'technical',
        priority: 'high',
        status: 'new',
      },
    ]);
    console.log('Đã thêm 2 ticket hỗ trợ mẫu');
  } else {
    console.log(`Bỏ qua ticket (đã có ${ticketCount} ticket trong DB)`);
  }

  console.log('\n✅ Hoàn tất seed toàn bộ dữ liệu mẫu!');
  console.log('   Tài khoản khách hàng mẫu (mật khẩu chung: 123456):');
  customersSeed.forEach((c) => console.log(`   - ${c.email}`));
  process.exit(0);
})();
