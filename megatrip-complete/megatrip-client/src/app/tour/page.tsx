"use client"
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Layout from '../components/Layout';
import SearchTabs from '../components/SearchTabs';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { Slider } from '../components/ui/slider';
import { Separator } from '../components/ui/separator';
import {
    Map,
    Filter,
    Star,
    Calendar,
    Users,
    MapPin,
    Clock,
    Plane,
    Hotel,
    Utensils,
    Camera,
    Mountain,
    Waves,
    Building,
    Heart,
    Share2,
    ChevronUp,
    ChevronDown,
    Torus,
} from 'lucide-react';
import TourResults from './TourResults';
import { withSuspense } from '../components/SuspenseWrapper';

const tourCategories = [
    { name: 'Biển đảo', icon: Waves, count: 45 },
    { name: 'Núi rừng', icon: Mountain, count: 32 },
    { name: 'Thành phố', icon: Building, count: 28 },
    { name: 'Văn hóa', icon: Camera, count: 22 },
];
// -- MAPPING HELPERS: convert DB document -> FE list shape
function stripHtml(html: string) {
    return (html || '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim();
}
function toIsoDate(obj: any) {
    if (!obj) return null;
    const d = obj.$date ?? obj;
    const date = new Date(d);
    return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
}

const sampleTours = [
    {
        id: 1,
        name: 'Đà Nẵng - Hội An - Bà Nà Hills 3N2Đ',
        departure: 'TP. Hồ Chí Minh',
        destinations: ['Đà Nẵng', 'Hội An', 'Bà Nà Hills'],
        duration: '3 ngày 2 đêm',
        maxGroup: 35,
        priceFrom: 3990000,
        rating: 4.8,
        reviews: 245,
        images: ['/placeholder.svg', '/placeholder.svg', '/placeholder.svg'],
        includes: ['Vé máy bay', 'Khách sạn 4*', '6 bữa ăn', 'Vé tham quan', 'HDV tiếng Việt'],
        highlights: ['Cầu Vàng Bà Nà', 'Phố cổ Hội An', 'Bãi biển Mỹ Khê'],
        availableDates: ['15/01/2025', '22/01/2025', '29/01/2025'],
        category: 'Biển đảo',
        badge: 'Sale 20%',
        badgeColor: 'destructive',
        featured: true,
        transport: 'Máy bay',
        hotel: '4 sao',
        meals: '6 bữa',
    },
    {
        id: 2,
        name: 'Hà Nội - Sapa - Fansipan 4N3Đ',
        departure: 'Hà Nội',
        destinations: ['Sapa', 'Fansipan', 'Bản Cát Cát'],
        duration: '4 ngày 3 đêm',
        maxGroup: 20,
        priceFrom: 4590000,
        rating: 4.9,
        reviews: 182,
        images: ['/placeholder.svg', '/placeholder.svg', '/placeholder.svg'],
        includes: ['Xe limousine', 'Khách sạn 3*', '8 bữa ăn', 'Cáp treo Fansipan', 'HDV địa phương'],
        highlights: ['Đỉnh Fansipan', 'Ruộng bậc thang', 'Bản làng dân tộc'],
        availableDates: ['18/01/2025', '25/01/2025', '01/02/2025'],
        category: 'Núi rừng',
        badge: 'Hot',
        badgeColor: 'default',
        featured: true,
        transport: 'Xe limousine',
        hotel: '3 sao',
        meals: '8 bữa',
    },
    {
        id: 3,
        name: 'Phú Quốc Thiên Đường Biển 3N2Đ',
        departure: 'TP. Hồ Chí Minh',
        destinations: ['Phú Quốc', 'Hòn Thơm', 'Bãi Sao'],
        duration: '3 ngày 2 đêm',
        maxGroup: 30,
        priceFrom: 5290000,
        rating: 4.7,
        reviews: 328,
        images: ['/placeholder.svg', '/placeholder.svg', '/placeholder.svg'],
        includes: ['Vé máy bay', 'Resort 5*', '6 bữa ăn', 'Tour 4 đảo', 'Cáp treo Hòn Thơm'],
        highlights: ['Cáp treo Hòn Thơm', 'Safari Phú Quốc', 'Bãi Sao tuyệt đẹp'],
        availableDates: ['20/01/2025', '27/01/2025', '03/02/2025'],
        category: 'Biển đảo',
        badge: 'Mới',
        badgeColor: 'secondary',
        transport: 'Máy bay',
        hotel: '5 sao',
        meals: '6 bữa',
    },
    {
        id: 4,
        name: 'Nha Trang - Đà Lạt Romantic 4N3Đ',
        departure: 'TP. Hồ Chí Minh',
        destinations: ['Nha Trang', 'Đà Lạt', 'Thác Elephant'],
        duration: '4 ngày 3 đêm',
        maxGroup: 25,
        priceFrom: 4190000,
        rating: 4.6,
        reviews: 156,
        images: ['/placeholder.svg', '/placeholder.svg', '/placeholder.svg'],
        includes: ['Xe limousine', 'Khách sạn 4*', '8 bữa ăn', 'Tour 4 đảo', 'Vé tham quan'],
        highlights: ['Tour 4 đảo Nha Trang', 'Thành phố ngàn hoa', 'Thác Elephant hùng vĩ'],
        availableDates: ['16/01/2025', '23/01/2025', '30/01/2025'],
        category: 'Thành phố',
        badge: 'Sale 15%',
        badgeColor: 'destructive',
        transport: 'Xe limousine',
        hotel: '4 sao',
        meals: '8 bữa',
    },
    {
        id: 5,
        name: 'Cần Thơ - Miệt Vườn Sông Nước 2N1Đ',
        departure: 'TP. Hồ Chí Minh',
        destinations: ['Cần Thơ', 'Chợ nổi Cái Răng', 'Vườn trái cây'],
        duration: '2 ngày 1 đêm',
        maxGroup: 40,
        priceFrom: 1890000,
        rating: 4.4,
        reviews: 89,
        images: ['/placeholder.svg', '/placeholder.svg'],
        includes: ['Xe du lịch', 'Khách sạn 3*', '4 bữa ăn', 'Thuyền miệt vườn', 'HDV'],
        highlights: ['Chợ nổi Cái Răng', 'Vườn trái cây miệt vườn', 'Ẩm thực sông nước'],
        availableDates: ['19/01/2025', '26/01/2025', '02/02/2025'],
        category: 'Văn hóa',
        transport: 'Xe du lịch',
        hotel: '3 sao',
        meals: '4 bữa',
    },
    {
        id: 6,
        name: 'Hạ Long - Ninh Bình 3N2Đ',
        departure: 'Hà Nội',
        destinations: ['Vịnh Hạ Long', 'Ninh Bình', 'Tràng An'],
        duration: '3 ngày 2 đêm',
        maxGroup: 28,
        priceFrom: 3590000,
        rating: 4.7,
        reviews: 210,
        images: ['/placeholder.svg', '/placeholder.svg', '/placeholder.svg'],
        includes: ['Xe limousine', 'Du thuyền 4*', '6 bữa ăn', 'Thuyền Tràng An', 'HDV'],
        highlights: ['Du thuyền qua đêm Hạ Long', 'Động Thiên Cung', 'Tràng An Ninh Bình'],
        availableDates: ['17/01/2025', '24/01/2025', '31/01/2025'],
        category: 'Biển đảo',
        badge: 'Bán chạy',
        badgeColor: 'default',
        transport: 'Xe limousine',
        hotel: '4 sao',
        meals: '6 bữa',
    },
];

function FilterSidebarSkeleton() {
    return (
        <Card className="sticky top-20 bg-[hsl(var(--card))] border border-[hsl(var(--muted))] animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div className="h-5 w-24 bg-gray-200 rounded shimmer" />
                <div className="h-8 w-8 bg-gray-200 rounded shimmer" />
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="h-4 w-32 bg-gray-200 rounded shimmer mb-2" />
                <div className="h-6 w-full bg-gray-200 rounded shimmer mb-2" />
                <div className="h-4 w-20 bg-gray-200 rounded shimmer mb-2" />
                <div className="h-4 w-24 bg-gray-200 rounded shimmer mb-2" />
                <div className="h-4 w-32 bg-gray-200 rounded shimmer mb-2" />
                <div className="h-4 w-16 bg-gray-200 rounded shimmer mb-2" />
                <div className="h-4 w-28 bg-gray-200 rounded shimmer mb-2" />
                <div className="h-4 w-24 bg-gray-200 rounded shimmer mb-2" />
                <div className="h-4 w-20 bg-gray-200 rounded shimmer mb-2" />
                <div className="h-4 w-32 bg-gray-200 rounded shimmer mb-2" />
            </CardContent>
        </Card>
    );
}
function mapDbTourToList(db: any) {
    const id = db._id?.$oid ?? db._id ?? String(Math.random());
    const images = Array.isArray(db.images) && db.images.length ? db.images : ['/placeholder.svg'];
    // Use Vietnam timezone (UTC+7) for date comparison
    const now = new Date();
    // Get VN date components correctly
    const vnDateStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }); // YYYY-MM-DD format
    const [vnYear, vnMonth, vnDay] = vnDateStr.split('-').map(Number);
    const vnToday = new Date(vnYear, vnMonth - 1, vnDay); // Create date at start of VN day
    const availableDates = (db.startDates || []).map((d: any) => {
        const dateStr = toIsoDate(d);
        const dateObj = dateStr ? new Date(dateStr) : null;
        const isPast = dateObj && dateObj <= vnToday;
        return {
            date: dateStr,
            price: db.adultPrice ?? 0,
            available: 20,
            status: 'available',
            isPast: !!isPast
        };
    });

    const durationStr =
        typeof db.duration === 'number'
            ? `${db.duration} ngày ${db.duration > 1 ? `${db.duration - 1} đêm` : 'đêm'}`
            : (db.duration ?? '');

    return {
        id,
        name: db.name,
        slug: db.slug,
        departure: db.departureFrom || db.startLocation?.address || '',
        destinations: db.destination ? [db.destination] : (db.destinations || []),
        duration: durationStr,
        maxGroup: db.maxGroupSize ?? 0,
        priceFrom: db.adultPrice ?? 0,
        rating: db.ratingsAverage ?? 0,
        reviews: db.ratingsQuantity ?? 0,
        images,
        includes: db.services || [],
        highlights: db.highlights || [],
        availableDates,
        category: db.category || '',
        badge: db.highlight ? 'Nổi bật' : 'Mới',
        badgeColor: db.highlight ? 'destructive' : 'default',
        featured: !!db.featured,
        transport: db.transport || '',
        hotel: db.hotel || '',
        meals: db.meals || '',
        isVisible: db.isVisible ?? true,
    };
}



 function Tour() {
    const searchParams = useSearchParams();
    const [showFilters, setShowFilters] = useState(true);
    const [priceRange, setPriceRange] = useState([200000, 10000000]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    // const [selectedDurations, setSelectedDurations] = useState<string[]>([]);
    // const [selectedDepartures, setSelectedDepartures] = useState<string[]>([]);
    // selectedDurations stores numeric days (1..7+)
    const [selectedDurations, setSelectedDurations] = useState<number[]>([]);
    // departures loaded from public/provinces.json (use province.name)
    const [selectedDepartures, setSelectedDepartures] = useState<string[]>([]);
    const [provincesList, setProvincesList] = useState<string[]>([]);

    // duration options (value = days)
    const durationOptions = [
        { value: 1, label: "1 ngày 0 đêm" },
        { value: 2, label: "2 ngày 1 đêm" },
        { value: 3, label: "3 ngày 2 đêm" },
        { value: 4, label: "4 ngày 3 đêm" },
        { value: 5, label: "5 ngày 4 đêm" },
        { value: 6, label: "6 ngày 5 đêm" },
        { value: 7, label: "7 ngày 6 đêm" },
    ];

    // load provinces for "Điểm khởi hành"
    useEffect(() => {
        fetch('/provinces.json').then(r => {
            if (!r.ok) throw new Error('Failed to load provinces');
            return r.json();
        }).then((j) => {
            if (Array.isArray(j)) {
                // use the province.name as shown to users
                const names = j.map((p: any) => String(p.name).trim()).filter(Boolean);
                setProvincesList(names);
            }
        }).catch(() => {
            // fallback from sample tours if file not available
            setProvincesList(Array.from(new Set(sampleTours.map(t => t.departure))).slice(0, 20));
        });
    }, []);
    const [sortBy, setSortBy] = useState('featured');
    const [favorites, setFavorites] = useState<number[]>([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [showPromotions, setShowPromotions] = useState(true);
    const [selectedTour, setSelectedTour] = useState<{ destination: string, price?: string } | null>(null);
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    // Promotions for tours
    const [tourPromotions, setTourPromotions] = useState<any[]>([]);
    const [tourPromotionsLoading, setTourPromotionsLoading] = useState(false);
    const [tourPromotionsError, setTourPromotionsError] = useState<string | null>(null);
    const PROM_API_BASE = 'http://localhost:8080';

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                setTourPromotionsLoading(true);
                setTourPromotionsError(null);
                const url = `${PROM_API_BASE}/api/promotions?status=active&appliesTo=tours&page=1&pageSize=3`;
                const r = await fetch(url);
                if (!r.ok) throw new Error(`Server lỗi ${r.status}`);
                const j = await r.json();
                const list = Array.isArray(j.data) ? j.data : (Array.isArray(j) ? j : []);
                if (mounted) setTourPromotions(list);
            } catch (err: any) {
                if (mounted) {
                    setTourPromotions([]);
                    setTourPromotionsError(String(err?.message || err));
                }
            } finally {
                if (mounted) setTourPromotionsLoading(false);
            }
        };
        load();
        return () => { mounted = false; };
    }, []);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price);
    };

    const toggleFavorite = (tourId: number) => {
        setFavorites(prev =>
            prev.includes(tourId)
                ? prev.filter(id => id !== tourId)
                : [...prev, tourId]
        );
    };

    // Generate additional tours for selected destination
    // state for API tours
    const [apiTours, setApiTours] = useState<any[]>([]);
    const API_BASE_TOUR = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
    const [fetchAttempted, setFetchAttempted] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    // Define fetchTours function at component level
    async function fetchTours() {
        try {
            setIsLoading(true);
            setFetchError(null);
            // forward query params (from/to/departure etc.) to backend
            const base = API_BASE_TOUR; // use central API_BASE
            const qs = searchParams ? String(searchParams.toString()) : '';
            const url = qs ? `${base}/api/tours?${qs}` : `${base}/api/tours`;
            console.log('[Tour.page] fetching', url);
            const res = await fetch(url);
            if (!res.ok) {
                const text = await res.text();
                const msg = `Server lỗi ${res.status}${text ? `: ${text}` : ''}`;
                console.warn('fetchTours non-ok', { status: res.status, body: text });
                setFetchError(msg);
                return;
            }
            const json = await res.json();
            const data = Array.isArray(json.data) ? json.data : (json.data || []);
            const mapped = data.map(mapDbTourToList);
            setApiTours(mapped);
            setFetchError(null);
        } catch (err: any) {
            const msg = String(err?.message || err || 'Không thể kết nối tới server');
            console.error('Fetch tours error', err);
            setApiTours([]);
            setFetchError(msg);
        } finally {
            setFetchAttempted(true);
            setIsLoading(false);
        }
    }
    useEffect(() => {
        let mounted = true;
        // reset attempt flag so UI shows correct state for new search
        setFetchAttempted(false);
        // call fetchTours whenever search params change (so /tour?from=.. triggers API)
        (async () => {
            await fetchTours();
        })();
        return () => { mounted = false; };
    }, [searchParams ? String(searchParams.toString()) : '']);

    // const destinationTours = selectedTour ? generateDestinationTours() : [];
    // const allTours = selectedTour ? [...destinationTours, ...sampleTours] : sampleTours;
    const destinationTours = selectedTour ? selectedTour.destination : [];
    const baseTours = apiTours; // Chỉ dùng API, không fallback sampleTours
    const allTours = selectedTour ? [...destinationTours, ...baseTours] : baseTours;
    // const filteredTours = allTours.filter(tour => {
    //     const matchesPrice = tour.priceFrom >= priceRange[0] && tour.priceFrom <= priceRange[1];
    //     const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(tour.category);
    //     const matchesDuration = selectedDurations.length === 0 || selectedDurations.includes(tour.duration);
    //     const matchesDeparture = selectedDepartures.length === 0 || selectedDepartures.includes(tour.departure);
    const getDurationDays = (tour: any) => {
        if (typeof tour.duration === 'number' && !Number.isNaN(tour.duration)) return Math.max(1, Math.floor(tour.duration));
        if (typeof tour.duration === 'string') {
            const m = tour.duration.match(/(\d+)/);
            if (m) return Number(m[1]);
        }
        // try fallback fields
        if (typeof tour.durationDays === 'number') return tour.durationDays;
        return undefined;
    };
    const filteredTours = allTours.filter(tour => {
        const matchesPrice = tour.priceFrom >= priceRange[0] && tour.priceFrom <= priceRange[1];
        const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(tour.category);
        // duration: compare numeric days
        const tourDays = getDurationDays(tour);
        const matchesDuration = selectedDurations.length === 0 || (typeof tourDays === 'number' && selectedDurations.includes(tourDays));
        // departure: flexible partial match between tour.departure / departureFrom and selected province name
        const rawDeparture = (tour.departure || tour.departureFrom || '').toString().trim();
        const matchesDeparture = selectedDepartures.length === 0 || selectedDepartures.some(sel => {
            const a = String(sel || '').toLowerCase();
            const b = String(rawDeparture || '').toLowerCase();
            if (!a || !b) return false;
            // allow contains both ways to handle "Thành phố Hà Nội" vs "Hà Nội"
            return a === b || a.includes(b) || b.includes(a);
        });
        // If tour destination is selected, prioritize matching tours
        if (selectedTour) {
            const matchesDestination = tour.name.toLowerCase().includes(selectedTour.destination.toLowerCase());
            const matchesVisible = tour.isVisible !== false;
            return matchesPrice && matchesCategory && matchesDuration && matchesDeparture && matchesDestination && matchesVisible;
        }

        const matchesVisible = tour.isVisible !== false;
        return matchesPrice && matchesCategory && matchesDuration && matchesDeparture && matchesVisible;
    });

    const sortedTours = [...filteredTours].sort((a, b) => {
        // If tour selected, show generated destination tours first
        if (selectedTour) {
            const aIsDestination = a.id >= 997;
            const bIsDestination = b.id >= 997;
            if (aIsDestination && !bIsDestination) return -1;
            if (!aIsDestination && bIsDestination) return 1;
        }

        switch (sortBy) {
            case 'price-asc': return a.priceFrom - b.priceFrom;
            case 'price-desc': return b.priceFrom - a.priceFrom;
            case 'rating': return b.rating - a.rating;
            case 'duration': return a.duration.localeCompare(b.duration);
            case 'featured': return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
            default: return 0;
        }
    });

    const handleSearch = () => {
        setHasSearched(true);
        setShowPromotions(false);
        setIsLoading(true);
        setTimeout(() => setIsLoading(false), 2000);
    };

    const handleTourSelect = (destination: string, price?: string) => {
        setSelectedTour({ destination, price });
        setHasSearched(true);
        setShowPromotions(false);
        setIsLoading(true);
        setTimeout(() => setIsLoading(false), 2000);
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        setSelectedDate(nextWeek.toISOString().split('T')[0]);
    };

    // const durations = [...new Set(sampleTours.map(tour => tour.duration))];
    // const departures = [...new Set(sampleTours.map(tour => tour.departure))];
    // helpers to detect tour duration in days (support API numeric duration or string)


    // UI options
    const durations = durationOptions.map(d => d.label);
    const departures = provincesList.length ? provincesList : [...new Set(sampleTours.map(tour => tour.departure))];

    const [copied, setCopied] = useState<{ [code: string]: boolean }>({});

    const handleCopy = (code: string) => {
        navigator.clipboard.writeText(code).then(() => {
            setCopied(prev => ({ ...prev, [code]: true }));
            setTimeout(() => setCopied(prev => ({ ...prev, [code]: false })), 2000);
        });
    };
    return (
        <>
            {/* Search Section */}
            <div className="relative min-h-[480px]" style={{ backgroundImage: 'url(./banner-tour.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>

                <div className="container">

                    <div className="absolute inset-x-0 top-[calc(100%/1.2)] -translate-y-1/2">
                        <div className="w-full max-w-6xl mx-auto" style={{
                            background: 'linear-gradient(90deg, rgba(0,17,30,0.6) 0%, rgba(0,0,0,0) 100%)',
                            paddingBottom: '7px', paddingLeft: '18px', marginBottom: '-10px', borderTopLeftRadius: '10px'

                        }}>
                            <h1 className="pt-4 text-2xl lg:text-3xl font-bold mb-2 text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.1)]">
                                Khám phá tour lý tưởng
                            </h1>
                            <p className="font-bold mb-2 text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.1)]">Trải nghiệm chuyến đi tuyệt vời với giá tốt nhất</p>
                        </div>
                        <SearchTabs onSearch={handleSearch} activeTab="tour" />
                    </div>
                </div>
            </div>

            {/* Categories */}
            {/* <section className="py-6 border-b mt-9">
                <div className="container">
                    <div className="flex items-center gap-4 overflow-x-auto">
                        <span className="text-sm font-medium whitespace-nowrap">Danh mục:</span>
                        {tourCategories.map((category) => (
                            <Button
                                key={category.name}
                                variant={selectedCategories.includes(category.name) ? "default" : "outline"}
                                size="sm"
                                onClick={() => {
                                    if (selectedCategories.includes(category.name)) {
                                        setSelectedCategories(selectedCategories.filter(c => c !== category.name));
                                    } else {
                                        setSelectedCategories([...selectedCategories, category.name]);
                                    }
                                }}
                                className="whitespace-nowrap"
                            >
                                <category.icon className="h-4 w-4 mr-2" />
                                {category.name} ({category.count})
                            </Button>
                        ))}
                    </div>
                </div>
            </section> */}

            {/* Vouchers & Promotions Section */}
            <section className={`py-8 bg-gray - 50 ${hasSearched && !showPromotions ? 'hidden' : ''} `}>
                <div className="container">
                    {/* Vouchers */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold">🎫 Voucher & Mã giảm giá</h2>
                            <Button variant="outline" size="sm" asChild>
                                <Link prefetch={false} href="/khuyen-mai">Xem tất cả</Link>
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {tourPromotionsLoading ? (
                                [0, 1, 2].map(i => (
                                    <Card key={i} className="animate-pulse">
                                        <CardContent className="p-4">
                                            <div className="h-6 w-24 bg-gray-200 rounded mb-2" />
                                            <div className="h-4 w-40 bg-gray-200 rounded mb-2" />
                                            <div className="h-3 w-20 bg-gray-200 rounded" />
                                        </CardContent>
                                    </Card>
                                ))
                            ) : tourPromotionsError ? (
                                <Card className="col-span-3 text-center">
                                    <CardContent>
                                        <div className="text-sm text-red-600 mb-2">Không tải được khuyến mãi</div>
                                        <div className="text-xs text-[hsl(var(--muted-foreground))] mb-3">{tourPromotionsError}</div>
                                    </CardContent>
                                </Card>
                            ) : tourPromotions.length === 0 ? (
                                // keep original hardcoded cards/colors when no promos from server
                                <>
                                    <Card className="col-span-3 text-center">
                                        <CardContent>
                                            <div className="text-sm text-[hsl(var(--muted-foreground))] mb-2">Hiện không có khuyến mãi cho tour</div>
                                        </CardContent>
                                    </Card>
                                </>
                            ) : (
                                // show up to 3 server promotions but keep card color scheme
                                tourPromotions.slice(0, 3).map((p: any, idx: number) => {
                                    const colors = [
                                        'from-purple-500 to-indigo-500',
                                        'from-orange-500 to-red-500',
                                        'from-teal-500 to-green-500'
                                    ];
                                    const color = colors[idx % colors.length];
                                    return (
                                        <Card key={p.id || p._id || p.code} className={`bg-gradient-to-r ${color} text-white`}>
                                            <CardContent className="p-4">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <div className="text-lg font-bold text-white"><span>Code : </span> {p.code ?? `PROMO-${String(p._id || '').slice(0, 6)}`}</div>
                                                        <div className="text-sm opacity-90 text-white"><span>Tên : </span>{p.title}</div>
                                                        {p.code && <div className="text-xs opacity-75 text-white">Áp dụng từ {formatPrice(p.minSpend || 0)} VND</div>}

                                                        <div className="text-xs opacity-75 mt-1 text-white">{p.validTo ? `HSD: ${new Date(p.validTo).toLocaleDateString('vi-VN')}` : ''}</div>
                                                    </div>
                                                    {p.code ? (
                                                        <Button size="sm" variant="secondary" className="text-red-600" onClick={() => {
                                                            const code = p.code || '';
                                                            if (code) handleCopy(code);
                                                        }}>
                                                            {copied[p.code] ? 'Đã copy!' : 'Copy mã'}
                                                        </Button>
                                                    ) : (
                                                        <div className="text-xs opacity-75 mt-1 text-white">
                                                            Tự động áp dụng khi thanh toán từ {formatPrice(p.minSpend || 0)} VND
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Popular Tours */}
                    {/* <div className="mb-8">
                        <h2 className="text-xl font-bold mb-4 text-[hsl(var(--primary))]">🏝️ Tour phổ biến</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleTourSelect('Đà Nẵng - Hội An', '3.990.000₫')}>
                                <CardContent className="p-4 text-center">
                                    <div className="text-sm font-medium">Đà Nẵng - Hội An</div>
                                    <div className="text-xs text-[hsl(var(--muted-foreground))]">từ 3.990.000₫</div>
                                    <Badge variant="secondary" className="mt-2 text-xs">Phổ biến</Badge>
                                </CardContent>
                            </Card>

                            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleTourSelect('Sapa - Fansipan', '4.590.000₫')}>
                                <CardContent className="p-4 text-center">
                                    <div className="text-sm font-medium">Sapa - Fansipan</div>
                                    <div className="text-xs text-[hsl(var(--muted-foreground))]">từ 4.590.000₫</div>
                                    <Badge variant="secondary" className="mt-2 text-xs">Hot</Badge>
                                </CardContent>
                            </Card>

                            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleTourSelect('Phú Quốc', '5.290.000₫')}>
                                <CardContent className="p-4 text-center">
                                    <div className="text-sm font-medium">Phú Quốc</div>
                                    <div className="text-xs text-[hsl(var(--muted-foreground))]">từ 5.290.000₫</div>
                                    <Badge variant="secondary" className="mt-2 text-xs">Sale 20%</Badge>
                                </CardContent>
                            </Card>

                            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleTourSelect('Nha Trang - Đà Lạt', '4.190.000₫')}>
                                <CardContent className="p-4 text-center">
                                    <div className="text-sm font-medium">Nha Trang - Đà Lạt</div>
                                    <div className="text-xs text-[hsl(var(--muted-foreground))]">từ 4.190.000₫</div>
                                    <Badge variant="secondary" className="mt-2 text-xs">Mới</Badge>
                                </CardContent>
                            </Card>
                        </div>
                    </div> */}

                    {/* Great Tour Deals */}
                    {/* <div className="mb-8">
                        <h2 className="text-xl font-bold mb-4 text-[hsl(var(--primary))]">🔥 Tour giá tốt</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <Card className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="font-medium">Đà Nẵng - Hội An - Bà Nà</div>
                                            <div className="text-sm text-[hsl(var(--muted-foreground))]">3N2Đ • Khởi hành TP.HCM</div>
                                        </div>
                                        <Badge variant="destructive">-20%</Badge>
                                    </div>
                                    <div className="text-sm text-[hsl(var(--muted-foreground))] mb-2">⭐ 4.8 (245 đánh giá)</div>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <div className="text-lg font-bold text-[hsl(var(--primary))]">3.990.000₫</div>
                                            <div className="text-xs text-[hsl(var(--muted-foreground))] line-through">4.990.000₫</div>
                                        </div>
                                        <Button size="sm">Chọn tour</Button>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="font-medium">Sapa - Fansipan</div>
                                            <div className="text-sm text-[hsl(var(--muted-foreground))]">4N3Đ • Khởi hành Hà Nội</div>
                                        </div>
                                        <Badge variant="destructive">-15%</Badge>
                                    </div>
                                    <div className="text-sm text-[hsl(var(--muted-foreground))] mb-2">⭐ 4.9 (182 đánh giá)</div>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <div className="text-lg font-bold text-[hsl(var(--primary))]">4.590.000₫</div>
                                            <div className="text-xs text-[hsl(var(--muted-foreground))] line-through">5.400.000₫</div>
                                        </div>
                                        <Button size="sm">Chọn tour</Button>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="font-medium">Phú Quốc Thiên Đường</div>
                                            <div className="text-sm text-[hsl(var(--muted-foreground))]">3N2Đ • Khởi hành TP.HCM</div>
                                        </div>
                                        <Badge variant="destructive">-25%</Badge>
                                    </div>
                                    <div className="text-sm text-[hsl(var(--muted-foreground))] mb-2">⭐ 4.7 (328 đánh giá)</div>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <div className="text-lg font-bold text-[hsl(var(--primary))]">5.290.000₫</div>
                                            <div className="text-xs text-[hsl(var(--muted-foreground))] line-through">7.050.000₫</div>
                                        </div>
                                        <Button size="sm">Chọn tour</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div> */}
                </div>
            </section>

            {/* Date Selector */}
            {hasSearched && selectedTour && (
                <section className="py-6 bg-[hsl(var(--green-50))]">
                    <div className="container">
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold mb-2">
                                Tour {selectedTour.destination}
                            </h3>
                            <div className="text-sm text-[hsl(var(--muted-foreground))]">
                                Chọn ngày khởi hành phù hợp
                            </div>
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {Array.from({ length: 6 }, (_, i) => {
                                const date = new Date();
                                date.setDate(date.getDate() + (i * 7) + 7); // Weekly departures
                                const dateStr = date.toISOString().split('T')[0];
                                const dayMonth = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

                                // Mock prices for different dates
                                const prices = ['3.990.000', '4.190.000', '3.790.000', '4.590.000', '3.590.000', '4.290.000'];
                                const price = prices[i] + ' VND';

                                return (
                                    <div
                                        key={dateStr}
                                        onClick={() => setSelectedDate(dateStr)}
                                        className={`flex - shrink - 0 p - 3 rounded - lg cursor - pointer transition - colors min - w - [140px] text - center ${selectedDate === dateStr
                                            ? 'bg-green-600 text-white'
                                            : 'bg-white hover:bg-green-100'
                                            } `}
                                    >
                                        <div className="text-sm font-medium">Tuần {dayMonth}</div>
                                        <div className="text-xs mt-1">{price}</div>
                                        <div className="text-xs text-[hsl(var(--muted-foreground))]">Còn 12 chỗ</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}

            {/* Toggle Promotions Button */}
            {hasSearched && (
                <section className={hasSearched ? "py-4 bg-white border-b " : "py-4 bg-white border-b mt-14"}>

                    <div className="container">
                        <div className="flex justify-center">
                            <Button
                                variant="outline"
                                onClick={() => setShowPromotions(!showPromotions)}
                                className="flex items-center gap-2"
                            >
                                {showPromotions ? (
                                    <>
                                        <ChevronUp className="h-4 w-4" />
                                        Ẩn ưu đãi & tour phổ biến
                                    </>
                                ) : (
                                    <>
                                        <ChevronDown className="h-4 w-4" />
                                        Hiện ưu đãi & tour phổ biến
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </section>
            )}

            {/* Results Section */}
            <section className="py-8">
                <div className="container">
                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* Filters Sidebar */}
                        <div className={`lg: w - 80 ${showFilters ? 'block' : 'hidden lg:block'} `}>
                            {isLoading ? <FilterSidebarSkeleton /> : (
                                <Card className="sticky top-20 bg-[hsl(var(--card))] border border-[hsl(var(--muted))]">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                                        <CardTitle className="text-lg text-[hsl(var(--primary))] font-bold">Bộ lọc</CardTitle>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setShowFilters(!showFilters)}
                                            className="lg:hidden"
                                        >
                                            <Filter className="h-4 w-4" />
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {/* Price Range */}
                                        <div>
                                            <Label className="text-sm font-medium mb-3 block text-[hsl(var(--primary))]">Khoảng giá</Label>
                                            <div className="px-2">
                                                <Slider
                                                    value={priceRange}
                                                    onValueChange={setPriceRange} // Remove để không cho thay đổi
                                                    max={1000000}
                                                    min={200000}
                                                    step={10000}
                                                    // disabled // Thêm disabled để khóa Slider
                                                    className="mb-3"
                                                />
                                                <div className="flex justify-between text-sm text-[hsl(var(--muted-foreground))]">
                                                    <span>{formatPrice(priceRange[0])}</span>
                                                    <span>{formatPrice(priceRange[1])}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <Separator />

                                        {/* Duration */}
                                        {/* Duration */}
                                        <div>
                                            <Label className="text-sm font-medium mb-3 block text-[hsl(var(--primary))]">Thời lượng</Label>
                                            <div className="space-y-3">
                                                {durationOptions.map((opt) => (
                                                    <div key={opt.value} className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`dur-${opt.value}`}
                                                            checked={selectedDurations.includes(opt.value)}
                                                            onCheckedChange={(checked) => {
                                                                setSelectedDurations(prev => {
                                                                    const found = prev.includes(opt.value);
                                                                    if (checked && !found) return [...prev, opt.value];
                                                                    if (!checked && found) return prev.filter(d => d !== opt.value);
                                                                    return prev;
                                                                });
                                                            }}
                                                        />
                                                        <label htmlFor={`dur-${opt.value}`} className="text-sm cursor-pointer">
                                                            {opt.label}
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <Separator />

                                        {/* Departure */}
                                        <div>
                                            <Label className="text-sm font-medium mb-3 block text-[hsl(var(--primary))]">Điểm khởi hành</Label>
                                            <div className="space-y-3 max-h-48 overflow-auto pr-2">
                                                {departures.map((departure) => (
                                                    <div key={departure} className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`dep-${departure}`}
                                                            checked={selectedDepartures.includes(departure)}
                                                            onCheckedChange={(checked) => {
                                                                setSelectedDepartures(prev => {
                                                                    const found = prev.includes(departure);
                                                                    if (checked && !found) return [...prev, departure];
                                                                    if (!checked && found) return prev.filter(d => d !== departure);
                                                                    return prev;
                                                                });
                                                            }}
                                                        />
                                                        <label htmlFor={`dep-${departure}`} className="text-sm cursor-pointer">
                                                            {departure}
                                                        </label>
                                                    </div>
                                                ))}
                                                {departures.length === 0 && <div className="text-sm text-[hsl(var(--muted-foreground))]">Không có dữ liệu</div>}
                                            </div>
                                        </div>

                                        <Separator />

                                        {/* Features */}
                                        <div>
                                            <Label className="text-sm font-medium mb-3 block text-[hsl(var(--primary))]">Tiện ích</Label>
                                            <div className="space-y-2">
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox id="flight" />
                                                    <label htmlFor="flight" className="text-sm cursor-pointer flex items-center">
                                                        <Plane className="h-3 w-3 mr-1" />
                                                        Bao gồm vé máy bay
                                                    </label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox id="hotel4" />
                                                    <label htmlFor="hotel4" className="text-sm cursor-pointer flex items-center">
                                                        <Hotel className="h-3 w-3 mr-1" />
                                                        Khách sạn 4-5 sao
                                                    </label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox id="meals" />
                                                    <label htmlFor="meals" className="text-sm cursor-pointer flex items-center">
                                                        <Utensils className="h-3 w-3 mr-1" />
                                                        Bữa ăn đầy đủ
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Results */}
                        <div className="flex-1">
                            {/* Controls */}
                            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
                                <div className="flex items-center gap-4">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowFilters(!showFilters)}
                                        className="lg:hidden"
                                    >
                                        <Filter className="h-4 w-4 mr-2" />
                                        Bộ lọc
                                    </Button>
                                    <p className="text-sm text-[hsl(var(--muted-foreground))]">
                                        Tìm thấy {sortedTours.length} tour
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="sort" className="text-sm">Sắp xếp:</Label>
                                    <Select value={sortBy} onValueChange={setSortBy}>
                                        <SelectTrigger className="w-[200px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="featured">Nổi bật</SelectItem>
                                            <SelectItem value="price-asc">Giá tăng dần</SelectItem>
                                            <SelectItem value="price-desc">Giá giảm dần</SelectItem>
                                            <SelectItem value="rating">Đánh giá cao nhất</SelectItem>
                                            <SelectItem value="duration">Thời lượng</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            {fetchAttempted && fetchError ? (
                                <Card className="text-center py-12">
                                    <CardContent>
                                        <Map className="h-12 w-12 text-[hsl(var(--muted-foreground))] mx-auto mb-4" />
                                        <h3 className="text-lg font-medium mb-2">Không tìm thấy tour phù hợp!! Lỗi kết nối DB</h3>
                                        {/* <p className="text-[hsl(var(--muted-foreground))] mb-4">
                                            Vui lòng thử điều chỉnh bộ lọc hoặc thay đổi điều kiện tìm kiếm
                                        </p>
                                        <Button variant="outline">Điều chỉnh tìm kiếm</Button> */}
                                    </CardContent>
                                </Card>
                            ) : (

                                <TourResults
                                    isLoading={isLoading}
                                    sortedTours={sortedTours}
                                    favorites={favorites}
                                    toggleFavorite={toggleFavorite}
                                    formatPrice={formatPrice}
                                />
                            )}

                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
export default withSuspense(Tour);
