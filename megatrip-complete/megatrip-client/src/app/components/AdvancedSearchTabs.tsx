import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import { Slider } from '../components/ui/slider';
import {
  Plane,
  Bus,
  Map,
  Calendar as CalendarIcon,
  ArrowLeftRight,
  Plus,
  Minus,
  Users,
  Search,
  MapPin,
  Clock,
  Filter,
  Star,
  Zap,
  TrendingUp,
  Award,
  X,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface PassengerCount {
  adults: number;
  children: number;
  infants: number;
}

interface SearchFilters {
  flexible: boolean;
  priceRange: [number, number];
  duration: string;
  rating: number;
  amenities: string[];
}

const popularRoutes = {
  flight: [
    { from: 'TP.HCM', to: 'Hà Nội', price: 'từ 1.990.000₫', trend: 'up' },
    { from: 'Hà Nội', to: 'Đà Nẵng', price: 'từ 1.690.000₫', trend: 'stable' },
    { from: 'TP.HCM', to: 'Phú Quốc', price: 'từ 2.190.000₫', trend: 'down' },
    { from: 'Hà Nội', to: 'TP.HCM', price: 'từ 1.890.000₫', trend: 'up' },
  ],
  bus: [
    { from: 'TP.HCM', to: 'Đà Lạt', price: 'từ 350.000₫', trend: 'stable' },
    { from: 'Hà Nội', to: 'Sapa', price: 'từ 400.000₫', trend: 'up' },
    { from: 'TP.HCM', to: 'Nha Trang', price: 'từ 280.000₫', trend: 'down' },
    { from: 'Đà Nẵng', to: 'Hội An', price: 'từ 150.000₫', trend: 'stable' },
  ],
  tour: [
    { destination: 'Đà Nẵng - Hội An', duration: '3N2Đ', price: 'từ 3.990.000₫', trend: 'up' },
    { destination: 'Hà Nội - Sapa', duration: '4N3Đ', price: 'từ 4.590.000₫', trend: 'down' },
    { destination: 'Phú Quốc', duration: '3N2Đ', price: 'từ 5.290.000₫', trend: 'stable' },
    { destination: 'Nha Trang - Đà Lạt', duration: '4N3Đ', price: 'từ 4.190.000₫', trend: 'up' },
  ]
};

const trendingSearches = [
  'Tour Tết 2025', 'Vé máy bay giá rẻ', 'Du lịch miền Bắc', 'Phú Quốc resort',
  'Sapa mùa đông', 'Hạ Long 2N1Đ', 'Đà Nẵng - Hội An', 'Xe giường nằm VIP'
];

export default function AdvancedSearchTabs() {
  const [activeTab, setActiveTab] = useState('flight');
  const [flightType, setFlightType] = useState<'roundtrip' | 'oneway'>('roundtrip');
  const [passengers, setPassengers] = useState<PassengerCount>({
    adults: 1,
    children: 0,
    infants: 0,
  });
  const [flightDeparture, setFlightDeparture] = useState<Date>();
  const [flightReturn, setFlightReturn] = useState<Date>();
  const [busDeparture, setBusDeparture] = useState<Date>();
  const [tourDeparture, setTourDeparture] = useState<Date>();
  const [isPassengerOpen, setIsPassengerOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    flexible: false,
    priceRange: [500000, 5000000],
    duration: 'any',
    rating: 4,
    amenities: [],
  });

  const updatePassengerCount = (type: keyof PassengerCount, increment: boolean) => {
    setPassengers(prev => ({
      ...prev,
      [type]: Math.max(0, prev[type] + (increment ? 1 : -1))
    }));
  };

  const totalPassengers = passengers.adults + passengers.children + passengers.infants;

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'down': return <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />;
      default: return <Minus className="h-3 w-3 text-gray-400" />;
    }
  };

  const toggleAmenity = (amenity: string) => {
    setFilters(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Trending Searches */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-4 w-4 text-yellow-500" />
          <span className="text-sm font-medium">Tìm kiếm phổ biến:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {trendingSearches.map((search, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="cursor-pointer hover:bg-[hsl(var(--primary))] hover:text-[hsl(var(--primary-foreground))] transition-colors"
            >
              {search}
            </Badge>
          ))}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="flight" className="flex items-center space-x-2">
            <Plane className="h-4 w-4" />
            <span>Vé máy bay</span>
          </TabsTrigger>
          <TabsTrigger value="bus" className="flex items-center space-x-2">
            <Bus className="h-4 w-4" />
            <span>Xe du lịch</span>
          </TabsTrigger>
          <TabsTrigger value="tour" className="flex items-center space-x-2">
            <Map className="h-4 w-4" />
            <span>Tour</span>
          </TabsTrigger>
        </TabsList>

        {/* Flight Search */}
        <TabsContent value="flight" className="space-y-6">
          <div className="bg-white rounded-xl border shadow-sm p-6">
            {/* Flight Type and Advanced Toggle */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <Label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="flightType"
                    value="roundtrip"
                    checked={flightType === 'roundtrip'}
                    onChange={() => setFlightType('roundtrip')}
                    className="text-primary"
                  />
                  <span>Khứ hồi</span>
                </Label>
                <Label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="flightType"
                    value="oneway"
                    checked={flightType === 'oneway'}
                    onChange={() => setFlightType('oneway')}
                    className="text-primary"
                  />
                  <span>Một chiều</span>
                </Label>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Bộ lọc nâng cao
              </Button>
            </div>

            {/* Advanced Filters */}
            {showAdvanced && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={filters.flexible}
                      onCheckedChange={(checked) => setFilters(prev => ({ ...prev, flexible: checked }))}
                    />
                    <Label>Ngày linh hoạt ±3 ngày</Label>
                  </div>
                  <div>
                    <Label className="text-sm">Đánh giá tối thiểu</Label>
                    <div className="flex items-center space-x-2">
                      <Slider
                        value={[filters.rating]}
                        onValueChange={([value]) => setFilters(prev => ({ ...prev, rating: value }))}
                        max={5}
                        min={1}
                        step={0.5}
                        className="flex-1"
                      />
                      <div className="flex items-center">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">{filters.rating}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm">Khoảng giá (VND)</Label>
                    <Slider
                      value={filters.priceRange}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, priceRange: value as [number, number] }))}
                      max={10000000}
                      min={500000}
                      step={100000}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{filters.priceRange[0].toLocaleString()}₫</span>
                      <span>{filters.priceRange[1].toLocaleString()}₫</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm mb-2 block">Tiện ích mong muốn</Label>
                  <div className="flex flex-wrap gap-2">
                    {['WiFi', 'Suất ăn', 'Giải trí', 'Chọn ghế', 'Hành lý'].map((amenity) => (
                      <Badge
                        key={amenity}
                        variant={filters.amenities.includes(amenity) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleAmenity(amenity)}
                      >
                        {amenity}
                        {filters.amenities.includes(amenity) && (
                          <X className="h-3 w-3 ml-1" />
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* From */}
              <div className="space-y-2">
                <Label htmlFor="from">Từ</Label>
                <div className="relative">
                  <Input
                    id="from"
                    placeholder="Thành phố hoặc sân bay"
                    defaultValue="Hồ Chí Minh (SGN)"
                    className="pl-10"
                  />
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              {/* To */}
              <div className="space-y-2 relative">
                <Label htmlFor="to">Đến</Label>
                <div className="relative">
                  <Input
                    id="to"
                    placeholder="Thành phố hoặc sân bay"
                    defaultValue="Hà Nội (HAN)"
                    className="pl-10"
                  />
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-8 h-8 w-8 p-0"
                >
                  <ArrowLeftRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Departure Date */}
              <div className="space-y-2">
                <Label>Ngày đi</Label>
                <Input
                  type="date"
                  className="block h-12 bg-white shadow-md text-black w-full"
                  value={flightDeparture ? flightDeparture.toISOString().split('T')[0] : ''}
                  onChange={e => setFlightDeparture(e.target.value ? new Date(e.target.value) : undefined)}
                />
              </div>

              {/* Return Date */}
              {flightType === 'roundtrip' && (
                <div className="space-y-2">
                  <Label>Ngày về</Label>
                  <Input
                    type="date"
                    className="block h-12 bg-white shadow-md text-black w-full"
                    value={flightReturn ? flightReturn.toISOString().split('T')[0] : ''}
                    onChange={e => setFlightReturn(e.target.value ? new Date(e.target.value) : undefined)}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Passengers */}
              <div className="space-y-2">
                <Label>Số hành khách</Label>
                <Popover open={isPassengerOpen} onOpenChange={setIsPassengerOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <Users className="mr-2 h-4 w-4" />
                      {totalPassengers} hành khách
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-4">
                    <div className="space-y-4">
                      {/* Adults */}
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Người lớn</div>
                          <div className="text-sm text-muted-foreground">≥ 18 tuổi</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updatePassengerCount('adults', false)}
                            disabled={passengers.adults <= 1}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center">{passengers.adults}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updatePassengerCount('adults', true)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {/* Children */}
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Trẻ em</div>
                          <div className="text-sm text-muted-foreground">4-11 tuổi</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updatePassengerCount('children', false)}
                            disabled={passengers.children <= 0}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center">{passengers.children}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updatePassengerCount('children', true)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {/* Infants */}
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Em bé</div>
                          <div className="text-sm text-muted-foreground">&lt; 4 tuổi</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updatePassengerCount('infants', false)}
                            disabled={passengers.infants <= 0}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center">{passengers.infants}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updatePassengerCount('infants', true)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Class */}
              <div className="space-y-2">
                <Label>Hạng vé</Label>
                <Select defaultValue="economy">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="economy">Phổ thông</SelectItem>
                    <SelectItem value="business">Thương gia</SelectItem>
                    <SelectItem value="first">Hạng nhất</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Search Button */}
              <div className="flex items-end">
                <Button className="w-full h-10 btn-professional">
                  <Search className="mr-2 h-4 w-4" />
                  Tìm chuyến bay
                </Button>
              </div>
            </div>

            {/* Popular Routes */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Award className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">Tuyến phổ biến:</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {popularRoutes.flight.map((route, index) => (
                  <div
                    key={index}
                    className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{route.from} → {route.to}</span>
                      {getTrendIcon(route.trend)}
                    </div>
                    <span className="text-xs text-[hsl(var(--primary))]">{route.price}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Similar structure for Bus and Tour tabs with their respective features */}
        <TabsContent value="bus" className="space-y-4">
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="space-y-2">
                <Label htmlFor="bus-from">Điểm đón</Label>
                <div className="relative">
                  <Input
                    id="bus-from"
                    placeholder="Tỉnh/Thành phố hoặc bến xe"
                    defaultValue="TP. Hồ Chí Minh"
                    className="pl-10"
                  />
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bus-to">Điểm trả</Label>
                <div className="relative">
                  <Input
                    id="bus-to"
                    placeholder="Tỉnh/Thành phố hoặc bến xe"
                    defaultValue="Đà Lạt"
                    className="pl-10"
                  />
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Ngày đi</Label>
                <Input
                  type="date"
                  className="block h-12 bg-white shadow-md text-black w-full"
                  value={busDeparture ? busDeparture.toISOString().split('T')[0] : ''}
                  onChange={e => setBusDeparture(e.target.value ? new Date(e.target.value) : undefined)}
                />
              </div>
              <div className="flex items-end">
                <Button className="w-full h-10 btn-professional">
                  <Search className="mr-2 h-4 w-4" />
                  Tìm chuyến xe
                </Button>
              </div>
            </div>
            
            {/* Popular Bus Routes */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Award className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">Tuyến xe phổ biến:</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {popularRoutes.bus.map((route, index) => (
                  <div
                    key={index}
                    className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{route.from} → {route.to}</span>
                      {getTrendIcon(route.trend)}
                    </div>
                    <span className="text-xs text-[hsl(var(--primary))]">{route.price}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tour Search */}
        <TabsContent value="tour" className="space-y-4">
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="space-y-2">
                <Label htmlFor="tour-from">Điểm khởi hành</Label>
                <Select defaultValue="hcm">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hcm">TP. Hồ Chí Minh</SelectItem>
                    <SelectItem value="hanoi">Hà Nội</SelectItem>
                    <SelectItem value="danang">Đà Nẵng</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tour-to">Điểm đến</Label>
                <div className="relative">
                  <Input
                    id="tour-to"
                    placeholder="Điểm đến mong muốn"
                    defaultValue="Đà Nẵng - Hội An"
                    className="pl-10"
                  />
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Ngày khởi hành</Label>
                <Input
                  type="date"
                  className="block h-12 bg-white shadow-md text-black w-full"
                  value={tourDeparture ? tourDeparture.toISOString().split('T')[0] : ''}
                  onChange={e => setTourDeparture(e.target.value ? new Date(e.target.value) : undefined)}
                />
              </div>
              <div className="flex items-end">
                <Button className="w-full h-10 btn-professional">
                  <Search className="mr-2 h-4 w-4" />
                  Tìm tour
                </Button>
              </div>
            </div>

            {/* Popular Tours */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Award className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">Tour phổ biến:</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {popularRoutes.tour.map((tour, index) => (
                  <div
                    key={index}
                    className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{tour.destination}</span>
                      {getTrendIcon(tour.trend)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{tour.duration}</span>
                      <span className="text-xs text-[hsl(var(--primary))]">{tour.price}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
