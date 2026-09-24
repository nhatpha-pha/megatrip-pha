"use client";

import { useEffect } from "react";
import { startLoading, stopLoading } from "../app/lib/nprogress";
import { ReactNode, useState } from "react";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import "./globals.css";
import { usePathname } from "next/navigation";
import cleanExpiredFlightCaches from "@/lib/cacheCleaner";
import Chatbot from "./components/Chatbot";
import { Toaster, toast } from 'sonner'
interface LayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";

  // Hàm lấy title động theo route
  const getTitle = () => {
    if (pathname === "/") return "MegaTrip - Đặt vé máy bay, xe du lịch, tour giá tốt";
    if (pathname.startsWith("/ve-may-bay")) return "Vé máy bay giá rẻ | MegaTrip";
    if (pathname.startsWith("/xe-du-lich")) return "Xe du lịch | MegaTrip";
    if (pathname.startsWith("/tour")) return "Tour du lịch | MegaTrip";
    if (pathname.startsWith("/khuyen-mai")) return "Khuyến mãi | MegaTrip";
    if (pathname.startsWith("/tin-tuc")) return "Tin tức du lịch | MegaTrip";
    if (pathname.startsWith("/gio-hang")) return "Giỏ hàng | MegaTrip";
    if (pathname.startsWith("/thanh-toan")) return "Thanh toán | MegaTrip";
    if (pathname.startsWith("/tai-khoan")) return "Tài khoản của tôi | MegaTrip";
    if (pathname.startsWith("/ho-tro")) return "Hỗ trợ khách hàng | MegaTrip";
    if (pathname.startsWith("/dang-nhap")) return "Đăng nhập | MegaTrip";
    if (pathname.startsWith("/dang-ky")) return "Đăng ký | MegaTrip";
    if (pathname.startsWith("/thanh-toan-thanh-cong")) return "Đặt chỗ thành công | MegaTrip";
    return "MegaTrip";
  };

  useEffect(() => {
    startLoading();
    const timer = setTimeout(() => stopLoading(), 400); // loading ngắn khi đổi route
    return () => clearTimeout(timer);
  }, [pathname]);

  const hideLayout = pathname === '/dang-nhap' || pathname === '/dang-ky';
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      cleanExpiredFlightCaches();
    }, 5 * 60 * 1000);
    return () => clearInterval(cleanupInterval);
  }, []);
  return (
    <html lang="vi">
      <head>
        <title>{getTitle()}</title>
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="shortcut icon" href="/favicon.ico" />
        {/* ...có thể thêm meta tags khác ở đây nếu muốn... */}
      </head>
      <body>
        {hideLayout ? (
          <main className="min-h-screen">{children}</main>
        ) : (
          <div className="min-h-screen flex flex-col">
            <Toaster />
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        )}
        <Chatbot />

      </body>

    </html>
  );
}
