'use client'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Badge } from '../components/ui/badge';
import {
  Plane,
  Bus,
  MapPin,
  Calendar as CalendarIcon,
  Users,
  ArrowUpDown,
  Plus,
  Search,
  Star,
  Hotel,
  Car,
  UtensilsCrossed,
  Gift,
  Minus
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Label } from 'recharts';

const tabs = [
  {
    id: 'flights',
    label: 'Vé máy bay',
    icon: Plane,
    active: true
  },
  {
    id: 'buses',
    label: 'Xe khách',
    icon: Bus,
    active: false
  },
  {
    id: 'tours',
    label: 'Tour du lịch',
    icon: MapPin,
    active: false
  }
];

const popularDestinations = [
  'TP. Hồ Chí Minh',
  'Hà Nội',
  'Đà Nẵng',
  'Nha Trang',
  'Đà Lạt',
  'Phú Quốc'
];

const quickActions = [
  {
    icon: MapPin,
    title: 'Tìm điểm đến',
    subtitle: 'Khám phá địa điểm mới'
  },
  {
    icon: Star,
    title: 'Ưu đãi hot',
    subtitle: 'Giảm đến 50%'
  },
  {
    icon: Users,
    title: 'Đặt nhóm',
    subtitle: 'Tiết kiệm hơn'
  }
];

const sidebarPromotions = [
  {
    id: 1,
    title: 'Giảm 30% Vé máy bay',
    subtitle: 'Áp dụng tất cả chuyến bay nội địa',
    discount: 'SAVE30',
    color: 'bg-gradient-to-r from-red-500 to-pink-500',
    icon: '✈️'
  },
  {
    id: 2,
    title: 'Tour Sapa chỉ 2.9M',
    subtitle: 'Khám phá vẻ đẹp núi rừng Tây Bắc',
    discount: 'HOT',
    color: 'bg-gradient-to-r from-green-500 to-emerald-500',
    icon: '🏔️'
  },
  {
    id: 3,
    title: 'Xe limousine giảm 25%',
    subtitle: 'Tuyến TP.HCM - Đà Lạt, Nha Trang',
    discount: 'NEW',
    color: 'bg-gradient-to-r from-blue-500 to-cyan-500',
    icon: '🚌'
  },
  {
    id: 4,
    title: 'Tết 2026 - Ưu đãi khủng',
    subtitle: 'Đặt ngay để nhận giá tốt nhất',
    discount: 'TET2025',
    color: 'bg-gradient-to-r from-orange-500 to-yellow-500',
    icon: '🧧'
  }
];


export default function TravelokaBanner() {
  const [activeTab, setActiveTab] = useState('flights');
  const [fromDate, setFromDate] = useState<Date>(new Date());
  // default return date = today + 2 days
  const defaultReturnDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d;
  })();
  const [toDate, setToDate] = useState<Date>(defaultReturnDate);
  const [passengers, setPassengers] = useState(1);
  const [tripType, setTripType] = useState('oneway');
  const [headerSolid, setHeaderSolid] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isPassengerOpen, setIsPassengerOpen] = useState(false);
  const [passengerCounts, setPassengerCounts] = useState({ adults: 1, children: 0, infants: 0 });
  const totalPassengers = passengerCounts.adults + passengerCounts.children + passengerCounts.infants;
  const [provinces, setProvinces] = useState<{ code: string, name: string }[]>([]);
  const [airports, setAirports] = useState<any[]>([]);
  // travel class for flights
  const [travelClass, setTravelClass] = useState<'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST'>('ECONOMY');
  // Thêm state cho fromProvince và toProvince
  const [fromProvince, setFromProvince] = useState<string>("");
  const [toProvince, setToProvince] = useState<string>("");

  // Thêm state cho from/to của buses và tours
  const [busFrom, setBusFrom] = useState<string>("");
  const [busTo, setBusTo] = useState<string>("");
  const [tourFrom, setTourFrom] = useState<string>("");
  const [tourTo, setTourTo] = useState<string>("");

  const router = useRouter();

  // Hàm swap
  const handleSwapProvinces = () => {
    setFromProvince(toProvince);
    setToProvince(fromProvince);
  };

  useEffect(() => {
    fetch('/provinces.json')
      .then((res) => res.json())
      .then((data) => {
        // provinces.json is an array
        setProvinces(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error('[TravelokaBanner] failed to load /provinces.json', err);
        setProvinces([]);
      });

    // load airport list from local public/airport.json (no external API)
    fetch('/airport.json')
      .then(res => res.json())
      .then(data => {
        console.log('[TravelokaBanner] /airport.json raw:', data);
        const raw = data?.airports ?? data;
        const list = Array.isArray(raw) ? raw : (raw ? Object.values(raw) : []);
        console.log('[TravelokaBanner] parsed airports:', list.length, list.slice(0, 6));
        setAirports(list);
        // optional defaults if not selected yet
        if (list.length > 0 && !fromProvince && !toProvince) {
          setFromProvince(list[0].icao);
          setToProvince(list[1]?.icao || list[0].icao);
        }
      })
      .catch((err) => {
        console.error('[TravelokaBanner] failed to load /airport.json', err);
        setAirports([]);
      });
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setHeaderSolid(window.scrollY > 400);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  
  useEffect(() => {
    if (tripType === 'roundtrip' && fromDate) {
      const returnDate = new Date(fromDate);
      returnDate.setDate(returnDate.getDate() + 3); // Ngày về = ngày đi + 3 ngày
      setToDate(returnDate);
    }
  }, [tripType, fromDate]);

  const updatePassengerCount = (type: 'adults' | 'children' | 'infants', increment: boolean) => {
    setPassengerCounts(prev => {
      let adults = prev.adults;
      let children = prev.children;
      let infants = prev.infants;

      //       adults >= 1: luôn cần ít nhất một hành khách lớn.
      //         infants ≤ adults: em bé phải đi kèm với người lớn(không thể nhiều hơn số người lớn).
      //           seated = adults + children ≤ 9: nhiều API vé(ví dụ Amadeus) giới hạn số hành khách có ghế là 9; infants thường không tính ghế.
      // Khi tăng / decrease:
      // Tăng adults có thể cho phép tăng infants sau đó; nếu adults tăng làm vượt giới hạn ghế thì giảm children để giữ seated ≤ 9.
      // Giảm adults sẽ tự động giảm infants nếu cần để giữ infants ≤ adults và giữ adults ≥ 1.
      // Tăng children chỉ cho phép khi seated < 9 để không vượt giới hạn.
      if (type === 'adults') {
        adults = Math.max(1, adults + (increment ? 1 : -1));
        // ensure infants <= adults
        if (infants > adults) infants = adults;
        // ensure seated (adults + children) <= 9
        if (adults + children > 9) {
          const overflow = adults + children - 9;
          children = Math.max(0, children - overflow);
        }
      } else if (type === 'children') {
        if (increment) {
          // adding a child: only allow if seated < 9
          if (adults + children < 9) {
            children = children + 1;
          } // otherwise ignore the increment
        } else {
          children = Math.max(0, children - 1);
        }
      } else if (type === 'infants') {
        if (increment) {
          // cannot have more infants than adults
          if (infants < adults) infants = infants + 1;
        } else {
          infants = Math.max(0, infants - 1);
        }
      }

      return { adults, children, infants };
    });
  };

  // Hàm chuyển route và truyền query
  const handleSearch = () => {
    if (activeTab === 'flights') {
      const originAirport = airports.find(a => a.icao === fromProvince || a.iata === fromProvince);
      const destAirport = airports.find(a => a.icao === toProvince || a.iata === toProvince);
      const originCode = originAirport?.iata || originAirport?.icao || fromProvince || '';
      const destCode = destAirport?.iata || destAirport?.icao || toProvince || '';

      const departureDate = fromDate ? fromDate.toISOString().split('T')[0] : '';
      const returnDate = (tripType === 'roundtrip' && toDate) ? toDate.toISOString().split('T')[0] : '';

      // Validate passenger counts per Amadeus rules and normalize state so UI reflects changes
      let adults = passengerCounts.adults || 1;
      let children = passengerCounts.children || 0;
      let infants = passengerCounts.infants || 0;

      // Normalize according to same rules before sending:
      // - infants cannot exceed adults
      if (infants > adults) infants = adults;

      // - seated = adults + children must be <= 9; reduce children first
      if (adults + children > 9) {
        const overflow = adults + children - 9;
        children = Math.max(0, children - overflow);
      }

      // - ensure adults >= 1
      adults = Math.max(1, adults);

      // Update UI state if normalization changed numbers so user sees final values
      if (adults !== passengerCounts.adults || children !== passengerCounts.children || infants !== passengerCounts.infants) {
        setPassengerCounts({ adults, children, infants });
      }

      const base: Record<string, string> = {
        originLocationCode: originCode,
        destinationLocationCode: destCode,
        adults: String(adults),
        children: String(children),
        infants: String(infants),
        travelClass: travelClass,
        nonStop: 'true',
        currencyCode: 'VND',
        includedAirlineCodes: 'VN',
        max: String(10)
      };
      const outbound = { ...base, departureDate };
      const inbound = (tripType === 'roundtrip' && returnDate) ? { ...base, originLocationCode: destCode, destinationLocationCode: originCode, departureDate: returnDate } : null;

      console.log('Outbound payload (TravelokaBanner):', outbound);
      if (inbound) console.log('Inbound payload (TravelokaBanner):', inbound);

      // const ok = typeof window !== 'undefined' ? window.confirm('Roundtrip detected. Outbound + inbound payloads logged to console. Proceed to search?') : true;
      const ok = typeof window !== 'undefined' ? window.confirm('Bạn đồng ý tiếp tục tìm kiếm chuyến bay?') : true;
      if (!ok) return;

      const payload: Record<string, string> = { ...outbound };
      if (inbound) payload.returnDate = inbound.departureDate!;
      console.log('Flight search payload (Amadeus params) Traveloka Banner:', payload);
      const qs = new URLSearchParams(payload);
      if (originCode) qs.set('from', originCode);
      if (destCode) qs.set('to', destCode);
      qs.set('total', String(totalPassengers));
      setIsSearching(true);
      router.push(`/ve-may-bay?${qs.toString()}`);
    } else if (activeTab === 'buses') {
      const payload = {
        type: 'bus',
        from: busFrom,
        to: busTo,
        departure: fromDate ? fromDate.toISOString().split('T')[0] : ''
      };
      console.log('Search clicked:', payload);
      setIsSearching(true);
      router.push(`/xe-du-lich?from=${payload.from}&to=${payload.to}&departure=${payload.departure}`);
    } else if (activeTab === 'tours') {
      const departure = fromDate ? fromDate.toISOString().split('T')[0] : '';
      // map selected province code -> name (fallback to raw value)
      const fromName = provinces.find(p => String(p.code) === (tourFrom || ''))?.name || tourFrom || '';
      const toName = provinces.find(p => String(p.code) === (tourTo || ''))?.name || tourTo || '';
      // Chỉ include params cần thiết cho tour
      const qs = new URLSearchParams({
        from: fromName || '',
        to: toName || '',
        departure
      });
      console.log('Tour search params:', Object.fromEntries(qs.entries()));
      setIsSearching(true);
      router.push(`/tour?${qs.toString()}`);
    }
  };

  return (
    <div className="relative min-h-[480px]" style={{ backgroundImage: 'url(./banner.webp)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      {/* Header Bar */}
      <div className={cn(
        "fixed top-0 left-0 w-full z-20 transition-all",
        headerSolid
          ? "bg-white text-black shadow"
          : "bg-transparent text-white"
      )}>
        <div className="container max-w-7xl mx-auto flex items-center justify-between py-3 px-4 text-sm">
          <div className="flex items-center space-x-6">
            <span className="flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              VND (₫)
            </span>
            <span>🇻🇳 Tiếng Việt</span>
            <span>Hỗ trợ</span>
            <span>Hợp tác với chúng tôi</span>
            <span>Đăng chỗ nghỉ của bạn</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>Đăng nhập</span>
            <span>Đăng ký</span>
          </div>
        </div>
      </div>

      <div className="relative z-10">
        {/* Main Content */}
        <div className="container max-w-7xl mx-auto px-4 pt-6 pb-8">
          {/* Service Tabs */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-1 bg-[hsl(var(--background))/0.1] rounded-full p-1 backdrop-blur-sm max-w-fit">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                    activeTab === tab.id
                      ? "bg-[hsl(var(--background))] text-[hsl(var(--primary))] shadow-md"
                      : "text-[hsl(var(--background))] hover:bg-[hsl(var(--background))/0.2]"
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Ưu đãi Hot Carousel */}
          <div className="mb-6">
            <h3 className="text-[hsl(var(--background))] font-semibold text-base mb-3">🔥 Thông tin nhanh</h3>
            <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
              {/* Placeholder tĩnh thay cho carousel interactive */}
              <div className="min-w-[260px] max-w-xs rounded-lg p-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-[hsl(var(--background))] shadow-lg flex-shrink-0">
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">🚀</span>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">Khám phá ưu đãi đặc biệt</h4>
                    <p className="text-xs text-[hsl(var(--background))/0.9] leading-tight">
                      Đặt vé sớm để nhận giá tốt nhất và trải nghiệm dịch vụ chất lượng cao.
                    </p>
                    <div className="mt-2 text-xs text-[hsl(var(--background))/0.8]">
                      Liên hệ hotline: 1900 6969
                    </div>
                  </div>
                </div>
              </div>
              {/* Có thể thêm 1-2 placeholder nữa nếu muốn giữ width tương tự */}
              <div className="min-w-[260px] max-w-xs rounded-lg p-3 bg-gradient-to-r from-green-500 to-emerald-500 text-[hsl(var(--background))] shadow-lg flex-shrink-0">
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">🌟</span>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">Dịch vụ khách hàng 24/7</h4>
                    <p className="text-xs text-[hsl(var(--background))/0.9] leading-tight">
                      Hỗ trợ nhanh chóng cho mọi nhu cầu đặt vé và du lịch.
                    </p>
                    <div className="mt-2 text-xs text-[hsl(var(--background))/0.8]">
                      Email: support@megatrip.com
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Search Form with Promotions Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 max-w-7xl">
            {/* Main Search Form */}
            <div className="p-0 bg-transparent shadow-none border-none rounded-none">
              {/* Flight Search Form */}
              {activeTab === 'flights' && (
                <div className="space-y-4">
                  {/* Trip Type */}
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="tripType"
                        value="oneway"
                        checked={tripType === 'oneway'}
                        onChange={(e) => setTripType(e.target.value)}
                        className="text-blue-600"
                      />
                      <span className="text-sm font-medium text-white">Một chiều</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="tripType"
                        value="roundtrip"
                        checked={tripType === 'roundtrip'}
                        onChange={(e) => setTripType(e.target.value)}
                        className="text-blue-600"
                      />
                      <span className="text-sm font-medium text-white">Khứ hồi</span>
                    </label>


                  </div>

                  {/* Search Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_1fr_1fr] gap-4 items-center">
                    {/* From */}
                    <div className="relative w-full">
                      <label className="block text-sm font-semibold text-white mb-1">Từ</label>
                      <Select value={fromProvince} onValueChange={setFromProvince}>
                        <SelectTrigger className="h-12 bg-white shadow-md text-black">
                          <SelectValue placeholder="Chọn sân bay" />
                        </SelectTrigger>
                        <SelectContent>
                          {airports.filter(a => a.icao !== toProvince).map((a) => (
                            <SelectItem key={a.icao} value={a.icao}>
                              {a.name} {a.iata ? `(${a.iata})` : `(${a.icao})`} — {a.state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Swap Button */}
                    <div className="flex items-end justify-center h-full w-full">
                      <Button variant="outline" size="icon" className="h-12 w-12 rounded-full bg-white shadow-md text-black flex items-center justify-center" onClick={handleSwapProvinces}>
                        <ArrowUpDown className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* To */}
                    <div className="relative w-full">
                      <label className="block text-sm font-semibold text-white mb-1">Đến</label>
                      <Select value={toProvince} onValueChange={setToProvince}>
                        <SelectTrigger className="h-12 bg-white shadow-md text-black">
                          <SelectValue placeholder="Chọn sân bay" />
                        </SelectTrigger>
                        <SelectContent>
                          {airports.filter(a => a.icao !== fromProvince).map((a) => (
                            <SelectItem key={a.icao} value={a.icao}>
                              {a.name} {a.iata ? `(${a.iata})` : `(${a.icao})`} — {a.state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Departure Date */}
                    <div className="relative w-full">
                      <label className="block text-sm font-semibold text-white mb-1">Ngày đi</label>
                      <Input
                        type="date"
                        className="block h-12 bg-white shadow-md text-black w-full"
                        value={fromDate ? fromDate.toISOString().split('T')[0] : ''}
                        // onChange={e => { if (e.target.value) setFromDate(new Date(e.target.value)); }}
                        onChange={e => {
                          const newDate = new Date(e.target.value);
                          setFromDate(newDate);
                          if (tripType === 'roundtrip') {
                            const returnDate = new Date(newDate);
                            returnDate.setDate(returnDate.getDate() + 3); // Ngày về = ngày đi + 3 ngày
                            setToDate(returnDate);
                          }
                        }}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>

                    {/* Return Date */}
                    {tripType === 'roundtrip' && (
                      <div className="relative w-full">
                        <label className="block text-sm font-semibold text-white mb-1">Ngày về</label>
                        <Input
                          type="date"
                          className="block h-12 bg-white shadow-md text-black w-full"
                          value={toDate ? toDate.toISOString().split('T')[0] : ''}
                          onChange={e => { if (e.target.value) setToDate(new Date(e.target.value)); }}
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                    )}
                  </div>

                  {/* Passengers and Search */}
                  <div className="flex items-end gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-semibold text-white mb-1">Số hành khách</label>
                      <Popover open={isPassengerOpen} onOpenChange={setIsPassengerOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start bg-white shadow-md text-black">
                            <Users className="mr-2 h-4 w-4" />
                            {totalPassengers} hành khách
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-4">
                          <div className="space-y-4">
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
                                  disabled={passengerCounts.adults <= 1}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="w-8 text-center">{passengerCounts.adults}</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updatePassengerCount('adults', true)}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
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
                                  disabled={passengerCounts.children <= 0}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="w-8 text-center">{passengerCounts.children}</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updatePassengerCount('children', true)}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
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
                                  disabled={passengerCounts.infants <= 0}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="w-8 text-center">{passengerCounts.infants}</span>
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

                    {/* Travel class select */}
                    <div className="w-56">
                      <Label className="block text-sm font-semibold text-white mb-1">Hạng vé</Label>
                      <Select value={travelClass} onValueChange={(v) => setTravelClass(v as any)}>
                        <SelectTrigger className="h-12 bg-white shadow-md text-black">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ECONOMY">Phổ thông</SelectItem>
                          <SelectItem value="PREMIUM_ECONOMY">Premium Economy</SelectItem>
                          <SelectItem value="BUSINESS">Thương gia</SelectItem>
                          <SelectItem value="FIRST">Hạng nhất</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button size="lg" className="h-12 px-8 bg-orange-500 hover:bg-orange-600 text-white shadow-md" onClick={handleSearch}>
                      <Search className={`mr-2 h-5 w-5 ${isSearching ? 'animate-spin' : ''}`} />
                      {isSearching ? 'Đang chuyển trang...' : 'Tìm chuyến bay'}
                    </Button>
                  </div>

                  {/* Quick Filters */}
                  {/* <div className="flex flex-wrap gap-2 pt-2">
                    <span className="text-sm font-semibold text-white">Tìm nhanh:</span>
                    <Badge
                      variant="outline"
                      className="text-white border-white hover:bg-white/40 cursor-pointer"
                    >
                      Chuyến bay giá rẻ
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-white border-white hover:bg-white/40 cursor-pointer"
                    >
                      Bay sớm
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-white border-white hover:bg-white/40 cursor-pointer"
                    >
                      Bay muộn
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-white border-white hover:bg-white/40 cursor-pointer"
                    >
                      Không baggage
                    </Badge>

                  </div> */}
                </div>
              )}

              {/* Bus Search Form */}
              {activeTab === 'buses' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="w-full">
                      <label className="block text-sm font-semibold text-white mb-1">Điểm đi</label>
                      <Select value={busFrom} onValueChange={setBusFrom}>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Chọn điểm đi" />
                        </SelectTrigger>
                        <SelectContent>
                          {provinces.filter(prov => prov.code.toString() !== busTo).map((prov) => (
                            <SelectItem key={prov.code} value={prov.code.toString()}>{prov.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="w-full">
                      <label className="block text-sm font-semibold text-white mb-1">Điểm đến</label>
                      <Select value={busTo} onValueChange={setBusTo}>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Chọn điểm đến" />
                        </SelectTrigger>
                        <SelectContent>
                          {provinces.filter(prov => prov.code.toString() !== busFrom).map((prov) => (
                            <SelectItem key={prov.code} value={prov.code.toString()}>{prov.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="w-full">
                      <label className="block text-sm font-semibold text-white mb-1">Ngày đi</label>
                      <Input
                        type="date"
                        className="block h-12 bg-white shadow-md text-black w-full"
                        value={fromDate ? fromDate.toISOString().split('T')[0] : ''}
                        onChange={e => { if (e.target.value) setFromDate(new Date(e.target.value)); }}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>

                    <Button size="lg" className="h-12 mt-6 bg-orange-500 hover:bg-orange-600 text-white" onClick={handleSearch}>
                      <Search className={`mr-2 h-5 w-5 ${isSearching ? 'animate-spin' : ''}`} />
                      {isSearching ? 'Đang chuyển trang...' : 'Tìm xe'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Tour Search Form */}
              {activeTab === 'tours' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="w-full">
                      <label className="block text-sm font-semibold text-white mb-1">Điểm khởi hành</label>
                      <Select value={tourFrom} onValueChange={setTourFrom}>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Chọn điểm khởi hành" />
                        </SelectTrigger>
                        <SelectContent>
                          {provinces.filter(prov => prov.code.toString() !== tourTo).map((prov) => (
                            <SelectItem key={prov.code} value={prov.code.toString()}>{prov.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="w-full">
                      <label className="block text-sm font-semibold text-white mb-1">Điểm đến</label>
                      <Select value={tourTo} onValueChange={setTourTo}>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Chọn điểm đến" />
                        </SelectTrigger>
                        <SelectContent>
                          {provinces.filter(prov => prov.code.toString() !== tourFrom).map((prov) => (
                            <SelectItem key={prov.code} value={prov.code.toString()}>{prov.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="w-full">
                      <label className="block text-sm font-semibold text-white mb-1">Ngày khởi hành</label>
                      <Input
                        type="date"
                        className="block h-12 bg-white shadow-md text-black w-full"
                        value={fromDate ? fromDate.toISOString().split('T')[0] : ''}
                        onChange={e => { if (e.target.value) setFromDate(new Date(e.target.value)); }}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>

                    <Button size="lg" className="h-12 mt-6 bg-orange-500 hover:bg-orange-600 text-white" onClick={handleSearch}>
                      <Search className={`mr-2 h-5 w-5 ${isSearching ? 'animate-spin' : ''}`} />
                      {isSearching ? 'Đang chuyển trang...' : 'Tìm tour'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl">
            {quickActions.map((action, index) => (
              <div
                key={index}
                className="bg-[hsl(var(--background))/0.8] backdrop-blur-sm rounded-lg p-4 text-[hsl(var(--background))] hover:bg-[hsl(var(--background))/0.2] transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="bg-[hsl(var(--background))/0.2] rounded-full p-2">
                    <action.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium">{action.title}</div>
                    <div className="text-sm text-[hsl(var(--background))/0.8]">{action.subtitle}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
