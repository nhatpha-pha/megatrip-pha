"use client"
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuLink,
} from './ui/navigation-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './ui/sheet';
import {
  Search,
  ShoppingCart,
  Bell,
  User,
  Menu,
  Plane,
  Bus,
  Map,
  Percent,
  Newspaper,
  HelpCircle,
} from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();
  const pathname = usePathname()!;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // check token on client
    try {
      const token = localStorage.getItem('accessToken');
      setIsLoggedIn(!!token);
    } catch (e) {
      setIsLoggedIn(false);
    }
  }, []);

  const handleLogout = () => {
    try {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
    } catch (e) {
      // ignore
    }
    try {
      // clear cookie so middleware won't redirect
      document.cookie = 'accessToken=; path=/; max-age=0';
    } catch (e) {
      // ignore
    }
    setIsLoggedIn(false);
    router.push('/');
  };

  return (
    <header className={`sticky top-0 z-50 w-full  bg-white transition-shadow ${scrolled ? 'shadow-2xl' : ''}`}>
      <div className="2xl:container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--primary))]">
              <Plane className="h-5 w-5 text-[hsl(var(--primary-foreground))]" />
            </div>
            <span className="text-xl font-bold text-[hsl(var(--primary))]">MegaTrip</span>
          </Link>

          {/* Desktop Navigation */}
          <NavigationMenu className="hidden lg:flex">
            <NavigationMenuList className="flex space-x-6">
              <NavigationMenuItem>
                <Link
                  href="/"
                  className={`flex items-center space-x-1 text-sm font-medium transition-colors ${pathname === '/' ? 'text-[hsl(var(--primary))] font-bold' : 'text-foreground hover:text-primary'} px-3 py-2 rounded-md`}
                  onClick={(e) => {
                    if (pathname === '/') {
                      e.preventDefault();
                      window.location.reload();
                    }
                  }}
                >
                  Trang chủ
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link
                  href="/ve-may-bay"
                  className={`flex items-center space-x-1 text-sm font-medium transition-colors ${pathname.startsWith('/ve-may-bay') ? 'text-[hsl(var(--primary))] font-bold' : 'text-foreground hover:text-primary'} px-3 py-2 rounded-md`}
                  onClick={(e) => {
                    if (pathname.startsWith('/ve-may-bay')) {
                      e.preventDefault();
                      window.location.href = '/ve-may-bay';
                    }
                  }}
                >
                  <Plane className="h-4 w-4" />
                  <span>Vé máy bay</span>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link
                  href="/xe-du-lich"
                  className={`flex items-center space-x-1 text-sm font-medium transition-colors ${pathname.startsWith('/xe-du-lich') ? 'text-[hsl(var(--primary))] font-bold' : 'text-foreground hover:text-primary'} px-3 py-2 rounded-md`}
                  onClick={(e) => {
                    if (pathname.startsWith('/xe-du-lich')) {
                      e.preventDefault();
                      window.location.href = '/xe-du-lich';
                    }
                  }}
                >
                  <Bus className="h-4 w-4" />
                  <span>Xe du lịch</span>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link
                  href="/tour"
                  className={`flex items-center space-x-1 text-sm font-medium transition-colors ${pathname.startsWith('/tour') ? 'text-[hsl(var(--primary))] font-bold' : 'text-foreground hover:text-primary'} px-3 py-2 rounded-md`}
                  onClick={(e) => {
                    if (pathname.startsWith('/tour')) {
                      e.preventDefault();
                      window.location.href = '/tour';
                    }
                  }}
                >
                  <Map className="h-4 w-4" />
                  <span>Tour</span>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link
                  href="/khuyen-mai"
                  className={`flex items-center space-x-1 text-sm font-medium transition-colors ${pathname.startsWith('/khuyen-mai') ? 'text-[hsl(var(--primary))] font-bold' : 'text-foreground hover:text-primary'} px-3 py-2 rounded-md`}
                  onClick={(e) => {
                    if (pathname.startsWith('/khuyen-mai')) {
                      e.preventDefault();
                      window.location.href = '/khuyen-mai';
                    }
                  }}
                >
                  <Percent className="h-4 w-4" />
                  <span>Khuyến mãi</span>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link
                  href="/tin-tuc"
                  className={`flex items-center space-x-1 text-sm font-medium transition-colors ${pathname.startsWith('/tin-tuc') ? 'text-[hsl(var(--primary))] font-bold' : 'text-foreground hover:text-primary'} px-3 py-2 rounded-md`}
                  onClick={(e) => {
                    if (pathname.startsWith('/tin-tuc')) {
                      e.preventDefault();
                      window.location.href = '/tin-tuc';
                    }
                  }}
                >
                  <Newspaper className="h-4 w-4" />
                  <span>Tin tức</span>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link
                  href="/ho-tro"
                  className={`flex items-center space-x-1 text-sm font-medium transition-colors ${pathname.startsWith('/ho-tro') ? 'text-[hsl(var(--primary))] font-bold' : 'text-foreground hover:text-primary'} px-3 py-2 rounded-md`}
                  onClick={(e) => {
                    if (pathname.startsWith('/ho-tro')) {
                      e.preventDefault();
                      window.location.href = '/ho-tro';
                    }
                  }}
                >
                  <HelpCircle className="h-4 w-4" />
                  <span>Hỗ trợ</span>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          {/* Search Bar - Desktop */}
          {/* <div className="hidden md:flex items-center space-x-2 flex-1 max-w-xl mx-6">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm nhanh..."
                className="pl-10"
                onClick={() => setIsSearchOpen(true)}
              />
            </div>
          </div> */}

          {/* Right side icons */}
          <div className="flex items-center space-x-2">
            {/* Mobile search */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsSearchOpen(true)}
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* Cart */}
            <Button variant="ghost" size="sm" asChild>
              <Link href="/tai-khoan?tab=bookings">
                <ShoppingCart className="h-5 w-5" />
                <span className="sr-only">Giỏ hàng</span>
              </Link>
            </Button>

            {/* Notifications */}
            {/* <Button variant="ghost" size="sm">
              <Bell className="h-5 w-5" />
              <span className="sr-only">Thông báo</span>
            </Button> */}

            {/* User Account */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <User className="h-5 w-5" />
                  <span className="sr-only">Tài khoản</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isLoggedIn ? (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/tai-khoan">Tài khoản của bạn</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout}>Đăng xuất</DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/dang-nhap">Đăng nhập</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dang-ky">Đăng ký</Link>
                    </DropdownMenuItem>

                  </>
                )}


              </DropdownMenuContent>

            </DropdownMenu>

            {/* Mobile menu */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px] bg-white">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col space-y-4 mt-4">
                  <Link
                    href="/"
                    className={`flex items-center space-x-2 transition-colors ${pathname === '/' ? 'text-[hsl(var(--primary))] font-bold' : 'text-foreground hover:text-primary'} px-3 py-2 rounded-md`}
                    onClick={(e) => {
                      setIsSheetOpen(false);
                      if (pathname === '/') {
                        e.preventDefault();
                        window.location.reload();
                      }
                    }}
                  >
                    <span>Trang chủ</span>
                  </Link>
                  <Link
                    href="/ve-may-bay"
                    className={`flex items-center space-x-2 transition-colors ${pathname.startsWith('/ve-may-bay') ? 'text-[hsl(var(--primary))] font-bold' : 'text-foreground hover:text-primary'} px-3 py-2 rounded-md`}
                    onClick={(e) => {
                      setIsSheetOpen(false);
                      if (pathname.startsWith('/ve-may-bay')) {
                        e.preventDefault();
                        window.location.href = '/ve-may-bay';
                      }
                    }}
                  >
                    <Plane className="h-4 w-4" />
                    <span>Vé máy bay</span>
                  </Link>
                  <Link
                    href="/xe-du-lich"
                    className={`flex items-center space-x-2 transition-colors ${pathname.startsWith('/xe-du-lich') ? 'text-[hsl(var(--primary))] font-bold' : 'text-foreground hover:text-primary'} px-3 py-2 rounded-md`}
                    onClick={(e) => {
                      setIsSheetOpen(false);
                      if (pathname.startsWith('/xe-du-lich')) {
                        e.preventDefault();
                        window.location.href = '/xe-du-lich';
                      }
                    }}
                  >
                    <Bus className="h-4 w-4" />
                    <span>Xe du lịch</span>
                  </Link>
                  <Link
                    href="/tour"
                    className={`flex items-center space-x-2 transition-colors ${pathname.startsWith('/tour') ? 'text-[hsl(var(--primary))] font-bold' : 'text-foreground hover:text-primary'} px-3 py-2 rounded-md`}
                    onClick={(e) => {
                      setIsSheetOpen(false);
                      if (pathname.startsWith('/tour')) {
                        e.preventDefault();
                        window.location.href = '/tour';
                      }
                    }}
                  >
                    <Map className="h-4 w-4" />
                    <span>Tour</span>
                  </Link>
                  <Link
                    href="/khuyen-mai"
                    className={`flex items-center space-x-2 transition-colors ${pathname.startsWith('/khuyen-mai') ? 'text-[hsl(var(--primary))] font-bold' : 'text-foreground hover:text-primary'} px-3 py-2 rounded-md`}
                    onClick={(e) => {
                      setIsSheetOpen(false);
                      if (pathname.startsWith('/khuyen-mai')) {
                        e.preventDefault();
                        window.location.href = '/khuyen-mai';
                      }
                    }}
                  >
                    <Percent className="h-4 w-4" />
                    <span>Khuyến mãi</span>
                  </Link>
                  <Link
                    href="/tin-tuc"
                    className={`flex items-center space-x-2 transition-colors ${pathname.startsWith('/tin-tuc') ? 'text-[hsl(var(--primary))] font-bold' : 'text-foreground hover:text-primary'} px-3 py-2 rounded-md`}
                    onClick={(e) => {
                      setIsSheetOpen(false);
                      if (pathname.startsWith('/tin-tuc')) {
                        e.preventDefault();
                        window.location.href = '/tin-tuc';
                      }
                    }}
                  >
                    <Newspaper className="h-4 w-4" />
                    <span>Tin tức</span>
                  </Link>
                  <Link
                    href="/ho-tro"
                    className={`flex items-center space-x-2 transition-colors ${pathname.startsWith('/ho-tro') ? 'text-[hsl(var(--primary))] font-bold' : 'text-foreground hover:text-primary'} px-3 py-2 rounded-md`}
                    onClick={(e) => {
                      setIsSheetOpen(false);
                      if (pathname.startsWith('/ho-tro')) {
                        e.preventDefault();
                        window.location.href = '/ho-tro';
                      }
                    }}
                  >
                    <HelpCircle className="h-4 w-4" />
                    <span>Hỗ trợ</span>
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
