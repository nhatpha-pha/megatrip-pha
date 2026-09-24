import Link from 'next/link';
import {
  Plane,
  Phone,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  Youtube,
  CreditCard,
  Smartphone,
} from 'lucide-react';

export default function Footer() {
  const paymentMethods = [
    { name: 'Visa', icon: CreditCard },
    { name: 'Mastercard', icon: CreditCard },
    { name: 'JCB', icon: CreditCard },
    { name: 'ATM', icon: CreditCard },
    { name: 'VNPay', icon: Smartphone },
    { name: 'MoMo', icon: Smartphone },
    { name: 'ZaloPay', icon: Smartphone },
  ];

  return (
    <footer className="bg-gray-900 text-gray-100">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--primary))]">
                <Plane className="h-5 w-5 text-[hsl(var(--primary-foreground))]" />
              </div>
              <span className="text-lg font-bold text-[hsl(var(--primary))]">MegaTrip</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Đặt vé máy bay, xe du lịch và tour trong nước với giá tốt nhất. 
              Dịch vụ tin cậy, thanh toán an toàn, hỗ trợ 24/7.
            </p>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <Phone className="h-4 w-4" />
                <span>Hotline: 1900 1234</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <Mail className="h-4 w-4" />
                <span>support@MegaTrip.com</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <MapPin className="h-4 w-4" />
                <span>Hà Nội & TP. Hồ Chí Minh</span>
              </div>
            </div>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Dịch vụ</h3>
            <nav className="space-y-2">
              <Link prefetch={false} 
                href="/ve-may-bay"
                className="block text-sm text-gray-400 hover:text-white transition-colors"
              >
                Vé máy bay
              </Link>
              <Link prefetch={false} 
                href="/xe-du-lich"
                className="block text-sm text-gray-400 hover:text-white transition-colors"
              >
                Xe du lịch
              </Link>
              <Link prefetch={false} 
                href="/tour"
                className="block text-sm text-gray-400 hover:text-white transition-colors"
              >
                Tour du lịch
              </Link>
              <Link prefetch={false} 
                href="/khuyen-mai"
                className="block text-sm text-gray-400 hover:text-white transition-colors"
              >
                Khuyến mãi
              </Link>
              <Link prefetch={false} 
                href="/tin-tuc"
                className="block text-sm text-gray-400 hover:text-white transition-colors"
              >
                Tin tức du lịch
              </Link>
            </nav>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Hỗ trợ</h3>
            <nav className="space-y-2">
              <Link prefetch={false} 
                href="/ho-tro"
                className="block text-sm text-gray-400 hover:text-white transition-colors"
              >
                Trung tâm hỗ trợ
              </Link>
              <Link prefetch={false} 
                href="/dieu-khoan"
                className="block text-sm text-gray-400 hover:text-white transition-colors"
              >
                Điều khoản sử dụng
              </Link>
              <Link prefetch={false} 
                href="/chinh-sach-bao-mat"
                className="block text-sm text-gray-400 hover:text-white transition-colors"
              >
                Chính sách bảo mật
              </Link>
              <Link prefetch={false} 
                href="/chinh-sach-huy-hoan"
                className="block text-sm text-gray-400 hover:text-white transition-colors"
              >
                Chính sách hủy/hoàn
              </Link>
              <Link prefetch={false} 
                href="/hoi-dap"
                className="block text-sm text-gray-400 hover:text-white transition-colors"
              >
                Câu hỏi thường gặp
              </Link>
            </nav>
          </div>

          {/* Social & Payment */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Kết nối với chúng tôi</h3>
            <div className="flex space-x-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Facebook className="h-5 w-5" />
                <span className="sr-only">Facebook</span>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Youtube className="h-5 w-5" />
                <span className="sr-only">Youtube</span>
              </a>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-medium">Phương thức thanh toán</h4>
              <div className="grid grid-cols-4 gap-2">
                {paymentMethods.map((method) => (
                  <div
                    key={method.name}
                    className="flex items-center justify-center h-8 bg-gray-800 rounded border border-gray-700 p-1"
                    title={method.name}
                  >
                    <method.icon className="h-4 w-4 text-gray-400" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-800">
        <div className="container py-4">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0">
            <p className="text-sm text-gray-400">
              © 2024 MegaTrip. Tất cả quyền được bảo lưu.
            </p>
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <span>Múi giờ: Asia/Ho_Chi_Minh</span>
              <span>•</span>
              <span>Tiền tệ: VND</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
