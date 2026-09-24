"use client"
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  Users,
  MapPin,
  Plane,
  Bus,
  Settings,
  Building2,
  Tag,
  ShoppingBag,
  Star,
  HeadphonesIcon,
  Cog,
  Search,
  Bell,
  User,
  LogOut,
  UserCheck,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
  Newspaper
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import auth from '../../apis/auth';
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Badge } from "../components/ui/badge";
import { cn } from "../lib/utils";
import NProgressBar from "../components/NProgressBar";
import { Toaster } from "../components/ui/toaster";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Thống kê & Báo cáo', href: '/admin/reports', icon: BarChart3 },
  { name: 'Quản lý người dùng', href: '/admin/customers', icon: Users },
  { name: 'Quản lý tour', href: '/admin/tours', icon: MapPin },
  // { name: 'Quản lý chuyến bay', href: '/admin/flights', icon: Plane },
  { name: 'Quản lý vé xe', href: '/admin/buses', icon: Bus },
  { name: 'Quản lý đơn đặt', href: '/admin/orders', icon: ShoppingBag },
  // { name: 'Quản lý dịch vụ', href: '/admin/services', icon: Settings },
  { name: 'Quản lý tin tức', href: '/admin/news', icon: Newspaper },
  { name: 'Quản lý khuyến mãi', href: '/admin/promotions', icon: Tag },
  { name: 'Quản lý đánh giá', href: '/admin/reviews', icon: Star },
  { name: 'Chăm sóc khách hàng', href: '/admin/support', icon: HeadphonesIcon },
  // { name: 'Cài đặt hệ thống', href: '/admin/system-settings', icon: Cog },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [user, setUser] = useState<any | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const hasToken = typeof window !== 'undefined' ? !!localStorage.getItem('accessToken') : false;

  const getBreadcrumb = (visibleNav: typeof navigation) => {
    const currentNav = visibleNav.find(nav => nav.href === pathname);
    return currentNav ? currentNav.name : 'Dashboard';
  };

  useEffect(() => {
    // If no token at all, redirect immediately to login to prevent unauthenticated access
    if (pathname !== '/admin/login') {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!token) {
        router.replace('/admin/login');
        return;
      }
    }

    // Skip auth check for login page
    if (pathname === '/admin/login') {
      setAuthChecked(true);
      return;
    }

    const check = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
        if (!token) {
          router.push('/admin/login');
          return;
        }
        const meRes: any = await auth.me();
        // Allow both 'admin' and 'employee' roles to access admin UI.
        if (!meRes || (meRes.role !== 'admin' && meRes.role !== 'employee')) {
          localStorage.removeItem('accessToken');
          router.push('/admin/login');
          return;
        }
        setUser(meRes);
      } catch (err) {
        localStorage.removeItem('accessToken');
        router.push('/admin/login');
      } finally {
        setAuthChecked(true);
      }
    };
    check();
  }, [pathname, router]);

  // Nếu đang ở trang admin (không phải /admin/login) và chưa check auth xong hoặc không có token -> hiện spinner
  if (pathname !== '/admin/login' && (!authChecked || !hasToken)) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4">
            <svg className="animate-spin h-10 w-10 text-primary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
          </div>
          <div className="text-gray-700">Đang kiểm tra quyền truy cập...</div>
        </div>
      </div>
    );
  }

  // Nếu đang ở trang login admin, chỉ render nội dung con (không render chrome của admin)
  if (pathname === '/admin/login') {
    return (
      <main className="min-h-[calc(100vh-4rem)]">
        {children}
        <Toaster />
      </main>
    );
  }

  return (
    <>
      <NProgressBar />
      <div className="min-h-screen bg-gray-50">
        {/* Mobile sidebar backdrop */}
        <div
          className={cn(
            "fixed inset-0 z-40 lg:hidden",
            sidebarOpen ? "block" : "hidden"
          )}
        >
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={() => setSidebarOpen(false)}
          />
        </div>

        {/* Mobile sidebar */}
        <div className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-primary shadow-xl transform transition-transform lg:hidden",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="flex h-16 items-center justify-between px-4 border-b border-primary-600">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <Plane className="w-5 h-5 text-primary" />
              </div>
              <span className="text-lg font-semibold text-white">MegatripAdmin</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
              className="text-white hover:bg-primary-600"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1">
            {(user?.role === 'employee' ? navigation.filter(n => ['/admin/orders','/admin/support'].includes(n.href)) : navigation).map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  prefetch={true}
                  className={cn(
                    "group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all",
                    isActive
                      ? "bg-white text-primary shadow-sm"
                      : "text-primary-100 hover:bg-primary-600 hover:text-white"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon
                    className={cn(
                      "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                      isActive ? "text-primary" : "text-primary-100 group-hover:text-white"
                    )}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Desktop sidebar */}
          <div className={cn(
            "hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col lg:bg-primary lg:shadow-xl lg:transition-all lg:duration-300",
            sidebarCollapsed ? "lg:w-16" : "lg:w-64"
          )}>
          <div className="flex h-16 items-center justify-between px-4 border-b border-primary-600">
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <Plane className="w-5 h-5 text-primary" />
                </div>
                <span className="text-lg font-semibold text-white">MegatripAdmin</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-white hover:bg-primary-600"
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </Button>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {(user?.role === 'employee' ? navigation.filter(n => ['/admin/orders','/admin/support'].includes(n.href)) : navigation).map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  prefetch={true}
                  className={cn(
                    "group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all",
                    isActive
                      ? "bg-white text-primary shadow-sm"
                      : "text-primary-100 hover:bg-primary-600 hover:text-white"
                  )}
                  title={sidebarCollapsed ? item.name : undefined}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5 flex-shrink-0 transition-colors",
                      sidebarCollapsed ? "mx-auto" : "mr-3",
                      isActive ? "text-primary" : "text-primary-100 group-hover:text-white"
                    )}
                  />
                  {!sidebarCollapsed && item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Main content */}
        <div className={cn(
          "lg:transition-all lg:duration-300",
          sidebarCollapsed ? "lg:pl-16" : "lg:pl-64"
        )}>
          {/* Header */}
          <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
            <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
              <div className="flex items-center space-x-4">
                {/* Mobile menu button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="w-5 h-5" />
                </Button>

                {/* Breadcrumb */}
                <div className="hidden sm:block">
                  <nav className="flex" aria-label="Breadcrumb">
                    <ol className="inline-flex items-center space-x-1 md:space-x-3">
                      <li className="inline-flex items-center">
                        <span className="text-sm font-medium text-gray-500">
                          Trang chủ
                        </span>
                      </li>
                      <li>
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="ml-1 text-sm font-medium text-gray-900 md:ml-2">
                            {getBreadcrumb(user ? (user.role === 'employee' ? navigation.filter(n => ['/admin/orders','/admin/support'].includes(n.href)) : navigation) : navigation)}
                          </span>
                        </div>
                      </li>
                    </ol>
                  </nav>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {/* Search */}
                {/* <div className="relative hidden md:block w-64">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    className="pl-10 bg-gray-50 border-gray-200 focus:bg-white"
                    placeholder="Tìm kiếm toàn cục..."
                    type="search"
                  />
                </div> */}

                {/* Quick Add Button */}
                {/* <Button size="sm" className="bg-primary hover:bg-primary-600">
                  <Plus className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Thêm mới</span>
                </Button> */}

                {/* Notifications */}
                {/* <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-5 h-5" />
                  <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 text-xs bg-red-500 text-white border-2 border-white">
                    5
                  </Badge>
                </Button> */}

                {/* User menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full group">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-black group-hover:text-white transition-colors" />
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user?.name || 'Quản trị viên'}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user?.email || '---'}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {/* <DropdownMenuItem className="bg-white hover:bg-primary hover:text-white focus:bg-primary focus:text-white transition-colors">
                      <UserCheck className="mr-2 h-4 w-4" />
                      <span>Hồ sơ cá nhân</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="bg-white hover:bg-primary hover:text-white focus:bg-primary focus:text-white transition-colors">
                      <Cog className="mr-2 h-4 w-4" />
                      <span>Cài đặt</span>
                    </DropdownMenuItem> */}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="bg-white hover:bg-primary hover:text-white focus:bg-primary focus:text-white transition-colors"
                      onSelect={() => {
                        try { localStorage.removeItem('accessToken'); } catch (e) { }
                        router.push('/admin/login');
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Đăng xuất</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {/* Main content area */}
          <main className="min-h-[calc(100vh-4rem)]">
            {children}
            <Toaster />
          </main>

          {/* Footer */}
          <footer className="bg-white border-t border-gray-200 px-4 py-4">
            <div className="flex justify-between items-center text-sm text-gray-500">
              <p>© 2024 MegatripAdmin. Phiên bản 2.1.0</p>
              <p>Hệ thống quản trị du lịch thương mại điện tử</p>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}
