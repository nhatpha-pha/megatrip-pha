import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  Plus
} from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Badge } from "./ui/badge";
import { cn } from "../lib/utils";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Thống kê & Báo cáo', href: '/reports', icon: BarChart3 },
  { name: 'Quản lý người dùng', href: '/customers', icon: Users },
  { name: 'Quản lý tour', href: '/tours', icon: MapPin },
  { name: 'Quản lý chuyến bay', href: '/flights', icon: Plane },
  { name: 'Quản lý vé xe', href: '/buses', icon: Bus },
  { name: 'Quản lý dịch vụ', href: '/services', icon: Settings },
  { name: 'Quản lý khuyến mãi', href: '/promotions', icon: Tag },
  { name: 'Quản lý đơn đặt', href: '/orders', icon: ShoppingBag },
  { name: 'Quản lý đánh giá', href: '/reviews', icon: Star },
  { name: 'Chăm sóc khách hàng', href: '/support', icon: HeadphonesIcon },
  { name: 'Cài đặt hệ thống', href: '/system-settings', icon: Cog },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const getBreadcrumb = () => {
    const currentNav = navigation.find(nav => nav.href === pathname);
    return currentNav ? currentNav.name : 'Dashboard';
  };

  return (
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
            <span className="text-lg font-semibold text-white">MegaTripAdmin</span>
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
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
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
                    "mr-3 h-5 w-5 flex-shrink-0",
                    isActive ? "text-primary" : "text-primary-100"
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
              <span className="text-lg font-semibold text-white">MegaTripAdmin</span>
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
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
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
                    "h-5 w-5 flex-shrink-0",
                    sidebarCollapsed ? "mx-auto" : "mr-3",
                    isActive ? "text-primary" : "text-primary-100"
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
                          {getBreadcrumb()}
                        </span>
                      </div>
                    </li>
                  </ol>
                </nav>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative hidden md:block w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  className="pl-10 bg-gray-50 border-gray-200 focus:bg-white"
                  placeholder="Tìm kiếm toàn cục..."
                  type="search"
                />
              </div>

              {/* Quick Add Button */}
              <Button size="sm" className="bg-primary hover:bg-primary-600">
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Thêm mới</span>
              </Button>

              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 text-xs bg-red-500 text-white border-2 border-white">
                  5
                </Badge>
              </Button>

              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full bg-primary">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">Nguyễn Văn Admin</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        admin@travelcompany.vn
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <UserCheck className="mr-2 h-4 w-4" />
                    <span>Hồ sơ cá nhân</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Cog className="mr-2 h-4 w-4" />
                    <span>Cài đặt</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
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
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 px-4 py-4">
          <div className="flex justify-between items-center text-sm text-gray-500">
            <p>© 2024 MegaTripAdmin. Phiên bản 2.1.0</p>
            <p>Hệ thống quản trị du lịch thương mại điện tử</p>
          </div>
        </footer>
      </div>
    </div>
  );
}