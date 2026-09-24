"use client"
import PlaceholderPage from '../components/PlaceholderPage';
import { ShoppingCart } from 'lucide-react';

export default function Page() {
  return (
    <PlaceholderPage
      title="Giỏ hàng"
      description="Xem lại các dịch vụ đã chọn và tiến hành thanh toán"
      icon={ShoppingCart}
    />
  );
}
