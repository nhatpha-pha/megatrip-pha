import { useState, useEffect } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Users,
  MapPin,
  Plane,
  Star,
  TrendingUp,
  Clock,
  Shield,
  Award,
  Globe,
  Calendar,
  CreditCard,
  HeadphonesIcon,
} from 'lucide-react';

interface LiveStat {
  id: string;
  label: string;
  value: number;
  unit: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
  description: string;
  isLive?: boolean;
}

// Chỉnh lại các class màu cho số liệu, icon, text
const initialStats: LiveStat[] = [
  {
    id: 'customers',
    label: 'Khách hàng đã phục vụ',
    value: 2547832,
    unit: '',
    icon: Users,
    color: 'text-[hsl(var(--primary))]',
    trend: 'up',
    trendValue: 127,
    description: 'Khách hàng mới trong 24h qua',
    isLive: true,
  },
  {
    id: 'destinations',
    label: 'Điểm đến phủ sóng',
    value: 547,
    unit: '',
    icon: MapPin,
    color: 'text-[hsl(var(--success))]',
    trend: 'up',
    trendValue: 3,
    description: 'Điểm đến mới được thêm',
    isLive: false,
  },
  {
    id: 'bookings_today',
    label: 'Đặt chỗ hôm nay',
    value: 1834,
    unit: '',
    icon: Calendar,
    color: 'text-[hsl(var(--accent))]',
    trend: 'up',
    trendValue: 89,
    description: 'Tăng so với hôm qua',
    isLive: true,
  },
  {
    id: 'satisfaction',
    label: 'Khách hàng hài lòng',
    value: 98.7,
    unit: '%',
    icon: Star,
    color: 'text-[hsl(var(--warning))]',
    trend: 'up',
    trendValue: 0.3,
    description: 'Tăng trong tháng này',
    isLive: false,
  },
  {
    id: 'response_time',
    label: 'Thời gian phản hồi',
    value: 2.4,
    unit: 'phút',
    icon: HeadphonesIcon,
    color: 'text-[hsl(var(--accent))]',
    trend: 'down',
    trendValue: 0.6,
    description: 'Cải thiện so với tháng trước',
    isLive: true,
  },
  {
    id: 'savings',
    label: 'Tiết kiệm trung bình',
    value: 847000,
    unit: '₫',
    icon: CreditCard,
    color: 'text-[hsl(var(--destructive))]',
    trend: 'up',
    trendValue: 23000,
    description: 'So với giá thị trường',
    isLive: false,
  },
];

const achievementBadges = [
  {
    title: 'Nền tảng du lịch #1',
    subtitle: 'Việt Nam 2024',
    icon: Award,
    color: 'bg-gradient-to-r from-yellow-400 to-yellow-600',
  },
  {
    title: 'Chứng nhận ISO 27001',
    subtitle: 'Bảo mật thông tin',
    icon: Shield,
    color: 'bg-gradient-to-r from-green-400 to-green-600',
  },
  {
    title: 'Best Customer Service',
    subtitle: 'Travel Awards 2024',
    icon: HeadphonesIcon,
    color: 'bg-gradient-to-r from-blue-400 to-blue-600',
  },
  {
    title: 'Trusted by 2.5M+',
    subtitle: 'Verified customers',
    icon: Users,
    color: 'bg-gradient-to-r from-purple-400 to-purple-600',
  },
];

export default function LiveStats() {
  const [stats, setStats] = useState(initialStats);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isClient, setIsClient] = useState(false);

  // Simulate live updates
  useEffect(() => {
    setIsClient(true);
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      
      setStats(prevStats => 
        prevStats.map(stat => {
          if (!stat.isLive) return stat;
          
          const randomIncrease = Math.floor(Math.random() * 3) + 1;
          
          switch (stat.id) {
            case 'customers':
              return {
                ...stat,
                value: stat.value + randomIncrease,
                trendValue: stat.trendValue + randomIncrease,
              };
            case 'bookings_today':
              return {
                ...stat,
                value: stat.value + Math.floor(Math.random() * 2),
              };
            case 'response_time':
              const change = (Math.random() - 0.5) * 0.1;
              return {
                ...stat,
                value: Math.max(1.0, Math.min(5.0, stat.value + change)),
              };
            default:
              return stat;
          }
        })
      );
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number, unit: string) => {
    if (unit === '₫') {
      return new Intl.NumberFormat('vi-VN').format(num);
    }
    
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toFixed(unit === '%' ? 1 : 0);
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return 'text-[hsl(var(--success))]';
      case 'down': return 'text-[hsl(var(--destructive))]';
      case 'stable': return 'text-[hsl(var(--muted-foreground))]';
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return '↗';
      case 'down': return '↘';
      case 'stable': return '→';
    }
  };

  return (
    <div className="space-y-8">
      {/* Live Statistics Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Thống kê trực tiếp</h2>
            <p className="text-muted-foreground">Cập nhật theo thời gian thực</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-muted-foreground">
              Cập nhật lúc {isClient ? currentTime.toLocaleTimeString('vi-VN') : '--:--:--'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map((stat) => (
            <Card key={stat.id} className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
              {stat.isLive && (
                <div className="absolute top-3 right-3">
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                    LIVE
                  </Badge>
                </div>
              )}
              
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg bg-gray-50 ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <div className={`text-sm font-medium ${getTrendColor(stat.trend)}`}>
                    {getTrendIcon(stat.trend)} {stat.trendValue}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-3xl font-bold">
                    {formatNumber(stat.value, stat.unit)}
                    <span className="text-lg font-normal text-muted-foreground ml-1">
                      {stat.unit}
                    </span>
                  </div>
                  
                  <div className="text-sm font-medium text-gray-900">
                    {stat.label}
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    {stat.description}
                  </div>
                </div>

                {/* Animated progress bar for live stats */}
                {stat.isLive && (
                  <div className="mt-4 h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"
                      style={{ width: '70%' }}
                    ></div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Achievement Badges */}
      <div>
        <h3 className="text-xl font-bold mb-4">Chứng nhận & Giải thưởng</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {achievementBadges.map((badge, index) => (
            <Card key={index} className="relative overflow-hidden group hover:scale-105 transition-transform duration-300">
              <CardContent className="p-4">
                <div className={`w-12 h-12 rounded-lg ${badge.color} flex items-center justify-center mb-3 text-white`}>
                  <badge.icon className="h-6 w-6" />
                </div>
                <div className="text-sm font-semibold mb-1">{badge.title}</div>
                <div className="text-xs text-muted-foreground">{badge.subtitle}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Trust Indicators */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold mb-2">Tại sao chọn MegaTrip?</h3>
          <p className="text-muted-foreground">Những con số chứng minh chất lượng dịch vụ</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-3xl font-bold text-[hsl(var(--primary))] mb-2">15+</div>
            <div className="text-sm text-muted-foreground">Năm kinh nghiệm</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-[hsl(var(--success))] mb-2">24/7</div>
            <div className="text-sm text-muted-foreground">Hỗ trợ khách hàng</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-[hsl(var(--accent))] mb-2">100%</div>
            <div className="text-sm text-muted-foreground">Bảo mật thanh toán</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-[hsl(var(--warning))] mb-2">5M+</div>
            <div className="text-sm text-muted-foreground">Chuyến đi thành công</div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>Bảo mật SSL</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              <span>Chứng nhận quốc tế</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span>Đối tác toàn cầu</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
