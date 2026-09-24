import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';
import AdvancedSearchTabs from '../components/AdvancedSearchTabs';
import {
  Star,
  Users,
  MapPin,
  Clock,
  Shield,
  Award,
  TrendingUp,
  Globe,
  Plane,
  ChevronRight,
  PlayCircle,
  Heart,
  Camera,
} from 'lucide-react';

const banners = [
  {
    id: 1,
    title: 'Khám phá Việt Nam',
    subtitle: 'Từ núi rừng đến biển cả',
    description: 'Trải nghiệm những điểm đến tuyệt vời nhất với dịch vụ 5 sao',
    image: '/placeholder.svg',
    cta: 'Khám phá ngay',
    category: 'Điểm đến',
    discount: 'Tiết kiệm đến 40%',
  },
  {
    id: 2,
    title: 'Bay thông minh, tiết kiệm',
    subtitle: 'Vé máy bay giá tốt nhất',
    description: 'So sánh giá từ hàng trăm hãng hàng không trong tích tắc',
    image: '/placeholder.svg',
    cta: 'Tìm vé ngay',
    category: 'Vé máy bay',
    discount: 'Từ 99.000₫',
  },
  {
    id: 3,
    title: 'Tour cao cấp 2025',
    subtitle: 'Trải nghiệm đỉnh cao',
    description: 'Hành trình được thiết kế riêng với dịch vụ VIP',
    image: '/placeholder.svg',
    cta: 'Xem tour',
    category: 'Tour VIP',
    discount: 'Early Bird -30%',
  },
];

const liveStats = [
  { label: 'Khách hàng tin tưởng', value: '2.5M+', icon: Users, color: 'text-blue-600' },
  { label: 'Điểm đến', value: '500+', icon: MapPin, color: 'text-green-600' },
  { label: 'Đối tác tin cậy', value: '10K+', icon: Shield, color: 'text-purple-600' },
  { label: 'Đánh giá 5 sao', value: '98%', icon: Star, color: 'text-yellow-600' },
];

const trustIndicators = [
  { icon: Shield, text: 'Bảo mật thanh toán SSL' },
  { icon: Award, text: 'Giải thưởng "Best Travel Platform 2024"' },
  { icon: Clock, text: 'Hỗ trợ 24/7' },
  { icon: TrendingUp, text: 'Giá tốt nhất đảm bảo' },
];

const popularDestinations = [
  { name: 'Hà Nội', image: '/placeholder.svg', deals: '120+ deals', trending: true },
  { name: 'Đà Nẵng', image: '/placeholder.svg', deals: '89+ deals', hot: true },
  { name: 'Phú Quốc', image: '/placeholder.svg', deals: '156+ deals', new: true },
  { name: 'Sapa', image: '/placeholder.svg', deals: '67+ deals', trending: true },
  { name: 'Hạ Long', image: '/placeholder.svg', deals: '98+ deals', hot: true },
  { name: 'Hội An', image: '/placeholder.svg', deals: '134+ deals', trending: true },
];

export default function EnhancedHero() {
  const [currentBanner, setCurrentBanner] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="absolute top-20 right-20 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
      <div className="absolute top-40 left-20 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>

      <div className="container relative py-12 lg:py-20">
        {/* Trust Indicators Bar */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            {trustIndicators.map((indicator, index) => (
              <div key={index} className="flex items-center gap-2">
                <indicator.icon className="h-4 w-4" />
                <span>{indicator.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main Hero Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          {/* Left Column - Text Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <Badge variant="secondary" className="mb-4">
                <Globe className="h-3 w-3 mr-1" />
                #1 Nền tảng du lịch Việt Nam
              </Badge>
              
              <h1 className="text-4xl lg:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent leading-tight">
                Du lịch thông minh
                <br />
                <span className="text-gray-900">cùng MegaTrip</span>
              </h1>
              
              <p className="text-xl text-muted-foreground leading-relaxed">
                Khám phá thế giới với hơn <strong>2.5 triệu</strong> khách hàng tin tưởng. 
                Tìm kiếm, so sánh và đặt vé máy bay, khách sạn, tour du lịch tốt nhất với giá ưu đãi.
              </p>
            </div>

            {/* Live Statistics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {liveStats.map((stat, index) => (
                <div key={index} className="text-center p-3 rounded-lg bg-white/50 backdrop-blur-sm border">
                  <stat.icon className={`h-6 w-6 mx-auto mb-2 ${stat.color}`} />
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Plane className="h-5 w-5 mr-2" />
                Bắt đầu hành trình
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => setIsVideoPlaying(true)}
                className="border-2"
              >
                <PlayCircle className="h-5 w-5 mr-2" />
                Xem video giới thiệu
              </Button>
            </div>
          </div>

          {/* Right Column - Interactive Banner */}
          <div className="relative">
            <div className="relative h-96 lg:h-[500px] rounded-2xl overflow-hidden shadow-2xl">
              {banners.map((banner, index) => (
                <div
                  key={banner.id}
                  className={`absolute inset-0 transition-all duration-1000 transform ${
                    index === currentBanner 
                      ? 'opacity-100 scale-100' 
                      : 'opacity-0 scale-105'
                  }`}
                  style={{
                    backgroundImage: `linear-gradient(135deg, rgba(0,0,0,0.4), rgba(0,0,0,0.2)), url(${banner.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  <div className="absolute inset-0 flex flex-col justify-end p-8 text-white">
                    <Badge variant="secondary" className="w-fit mb-3">
                      {banner.category}
                    </Badge>
                    <h3 className="text-3xl font-bold mb-2">{banner.title}</h3>
                    <p className="text-lg mb-2 opacity-90">{banner.subtitle}</p>
                    <p className="text-sm mb-4 opacity-80">{banner.description}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="destructive" className="text-lg px-3 py-1">
                        {banner.discount}
                      </Badge>
                      <Button variant="secondary">
                        {banner.cta}
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Banner Navigation */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                {banners.map((_, index) => (
                  <button
                    key={index}
                    className={`w-3 h-3 rounded-full transition-all ${
                      index === currentBanner 
                        ? 'bg-white scale-125' 
                        : 'bg-white/50 hover:bg-white/75'
                    }`}
                    onClick={() => setCurrentBanner(index)}
                  />
                ))}
              </div>

              {/* Floating Action */}
              <div className="absolute top-4 right-4">
                <Button size="sm" variant="secondary" className="rounded-full">
                  <Heart className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Floating Cards */}
            <div className="absolute -top-4 -left-4 bg-white rounded-lg shadow-lg p-3 animate-float">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-medium">Vừa đặt thành công</div>
                  <div className="text-xs text-muted-foreground">Tour Đà Nẵng 3N2Đ</div>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-4 -right-4 bg-white rounded-lg shadow-lg p-3 animate-float animation-delay-2000">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <Star className="h-4 w-4 text-white fill-white" />
                </div>
                <div>
                  <div className="text-sm font-medium">4.9/5 ★★★★★</div>
                  <div className="text-xs text-muted-foreground">245,000+ đánh giá</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Search Section */}
        <div className="relative">
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 shadow-xl border">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold mb-2">Tìm kiếm chuyến đi hoàn hảo</h2>
              <p className="text-muted-foreground">So sánh giá từ hàng nghìn nhà cung cấp trong một lần tìm kiếm</p>
            </div>
            <AdvancedSearchTabs />
            
            {/* Quick Access Destinations */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Điểm đến phổ biến</h3>
                <Button variant="ghost" size="sm">
                  Xem tất cả
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {popularDestinations.map((dest, index) => (
                  <div
                    key={index}
                    className="relative group cursor-pointer"
                  >
                    <div 
                      className="aspect-square rounded-lg bg-cover bg-center relative overflow-hidden"
                      style={{ backgroundImage: `url(${dest.image})` }}
                    >
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors"></div>
                      <div className="absolute inset-0 flex flex-col justify-end p-3">
                        <div className="text-white text-sm font-medium">{dest.name}</div>
                        <div className="text-white/80 text-xs">{dest.deals}</div>
                      </div>
                      
                      {/* Badges */}
                      {dest.trending && (
                        <Badge className="absolute top-2 right-2 text-xs bg-red-500">
                          Trending
                        </Badge>
                      )}
                      {dest.hot && (
                        <Badge className="absolute top-2 right-2 text-xs bg-orange-500">
                          Hot
                        </Badge>
                      )}
                      {dest.new && (
                        <Badge className="absolute top-2 right-2 text-xs bg-green-500">
                          New
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Social Proof Section */}
        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground mb-4">Được tin tưởng bởi hàng triệu khách hàng trên toàn quốc</p>
          <div className="flex items-center justify-center gap-8 opacity-60">
            {/* Partner logos would go here */}
            <div className="text-2xl font-bold">Vietnam Airlines</div>
            <div className="text-2xl font-bold">VietJet</div>
            <div className="text-2xl font-bold">Bamboo Airways</div>
            
          </div>
        </div>
      </div>

      {/* Video Modal */}
      {isVideoPlaying && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-lg max-w-4xl w-full aspect-video">
            <button
              onClick={() => setIsVideoPlaying(false)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              <XIcon className="h-6 w-6" />
            </button>
            <div className="w-full h-full bg-gray-900 rounded-lg flex items-center justify-center">
              <PlayCircle className="h-16 w-16 text-white" />
              <span className="ml-4 text-white">Video sẽ được tải ở đây</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// Add CheckCircle and XIcon components if not available
const CheckCircle = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);
