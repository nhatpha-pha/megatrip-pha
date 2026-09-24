"use client"
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
    Plane,
    Filter,
    ArrowRight,
    ChevronDown,
    ChevronUp,
    Shield,
    CreditCard,
    RefreshCw,
    X,
    CheckCircle,
    AlertTriangle,
    Info,
    Gift,
    Utensils,
    Tv,
    Battery,
    Headphones,
    Luggage,
    Wifi,
} from 'lucide-react';
import FlightResults from './FlightResults';
import { useSearchParams } from 'next/navigation';
import cleanExpiredFlightCaches from '../../lib/cacheCleaner';
import { withSuspense } from '../components/SuspenseWrapper';

const airlines = [
    { code: 'VN', name: 'Vietnam Airlines', logo: '/placeholder.svg' },
    { code: 'VJ', name: 'VietJet Air', logo: '/placeholder.svg' },

    { code: 'QH', name: 'Bamboo Airways', logo: '/placeholder.svg' },
];

const sampleFlights = [
    {
        id: 1,
        airline: 'Vietnam Airlines',
        flightNumber: 'VN1546',
        departure: { time: '06:15', airport: 'SGN', city: 'TP.HCM', date: '2024-06-01' },
        arrival: { time: '08:30', airport: 'HAN', city: 'Hà Nội', date: '2024-06-01' },
        duration: '2h 15m',
        aircraft: 'Airbus A321-100/200',
        price: 1990000,
        originalPrice: 2490000,
        class: 'Phổ thông',
        baggage: {
            handbag: { weight: '7kg', pieces: '56x36x23cm', unit: '' },
            checkin: { weight: '23kg', pieces: 1 }
        },
        amenities: {
            wifi: { available: true, free: false, price: '50.000đ' },
            meal: { included: true, type: 'Bữa ăn nóng' },
            entertainment: { available: true, screens: 'Màn hình cá nhân' },
            power: { available: true, type: 'USB & Ổ cắm điện' },
            priority: false
        },
        policies: {
            cancellable: true,
            cancellationFee: '500.000đ',
            changeable: true,
            changeFee: '300.000đ',
            refundable: 'Hoàn 80% nếu hủy trước 24h'
        },
        availableSeats: 12,
        discount: 20,
        promotions: [
            { code: 'SAVE30', description: 'Giảm thêm 300K cho vé bay nội địa', valid: '31/12/2024' },
            { code: 'STUDENT', description: 'Ưu đãi sinh viên giảm 15%', valid: '28/02/2025' }
        ],
        benefits: [
            'Tích lũy miles Bông Sen Vàng',
            'Ưu tiên check-in online',
            'Chọn chỗ ngồi miễn phí (hạng phổ thông)',
            'Bảo hiểm chuyến bay'
        ],
        raw: undefined // Add raw property
    },
    {
        id: 2,
        airline: 'VietJet Air',
        flightNumber: 'VJ142',
        departure: { time: '08:45', airport: 'SGN', city: 'TP.HCM', date: '2024-06-01' },
        arrival: { time: '11:00', airport: 'HAN', city: 'Hà Nội', date: '2024-06-01' },
        duration: '2h 15m',
        aircraft: 'Airbus A320',
        price: 1690000,
        class: 'Phổ thông',
        baggage: {
            handbag: { weight: '7kg', size: '56x36x23cm', unit: '' },
            checkin: { weight: '20kg', pieces: 1, unit: '' },
        },
        amenities: {
            wifi: { available: true, free: true },
            meal: { included: false, available: true, price: 'Từ 85.000đ' },
            entertainment: { available: false },
            power: { available: false },
            priority: false
        },
        policies: {
            cancellable: false,
            changeable: true,
            changeFee: '500.000đ + Chênh lệch giá vé',
            refundable: 'Không hoàn tiền'
        },
        availableSeats: 8,
        promotions: [
            { code: 'VIETJET50', description: 'Mã giảm 50K cho lần đặt đầu', valid: '15/01/2025' }
        ],
        benefits: [
            'Check-in online miễn phí',
            'Thay đổi thông tin hành khách',
            'Mua thêm dịch vụ sau khi đặt vé'
        ]
    },
    {
        id: 3,
        airline: 'Bamboo Airways',
        flightNumber: 'QH1402',
        departure: { time: '14:30', airport: 'SGN', city: 'TP.HCM', date: '2024-06-01' },
        arrival: { time: '16:50', airport: 'HAN', city: 'Hà Nội', date: '2024-06-01' },
        duration: '2h 20m',
        aircraft: 'Boeing 787',
        price: 2290000,
        class: 'Phổ thông Plus',
        baggage: {
            handbag: { weight: '10kg', size: '56x36x23cm', unit: '' },
            checkin: { weight: '23kg', pieces: 1 ,unit: '' },
        },
        amenities: {
            wifi: { available: true, free: true },
            meal: { included: true, type: 'Bữa ăn cao cấp' },
            entertainment: { available: true, screens: 'Màn hình HD 10 inch' },
            power: { available: true, type: 'USB-C & Ổ cắm điện' },
            priority: true
        },
        policies: {
            cancellable: true,
            cancellationFee: '300.000đ',
            changeable: true,
            changeFee: '200.000đ',
            refundable: 'Hoàn 85% nếu hủy trước 48h'
        },
        availableSeats: 15,
        promotions: [
            { code: 'BAMBOO100', description: 'Giảm 100K cho vé Bamboo Premium', valid: '31/01/2025' }
        ],
        benefits: [
            'Ưu tiên check-in & lên máy bay',
            'Chỗ ngồi rộng rãi (pitch 32-34 inch)',
            'Suất ăn cao cấp miễn phí',
            'Đổi lịch bay linh hoạt'
        ]
    },

];

function VeMayBay() {
    const router = useRouter();
    const [showFilters, setShowFilters] = useState(true);
    const [priceRange, setPriceRange] = useState([1000000, 3000000]);
    const [minPriceBound, setMinPriceBound] = useState<number>(1000000);
    const [maxPriceBound, setMaxPriceBound] = useState<number>(3000000);
    const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState('price-asc');
    const [expandedFlight, setExpandedFlight] = useState<number | null>(null);
    const [hasSearched, setHasSearched] = useState(false);
    const [showPromotions, setShowPromotions] = useState(true);
    const [selectedRoute, setSelectedRoute] = useState<{ from: string, to: string, price?: string } | null>(null);
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [searchForm, setSearchForm] = useState({
        from: 'TP.HCM (SGN)',
        to: 'Hà Nội (HAN)'
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingFlights, setIsLoadingFlights] = useState(false);
    const [apiFlights, setApiFlights] = useState<any[]>([]); // mapped flights returned from Amadeus (legacy single-leg pointer)
    // Per-leg results for roundtrip flows (cached separately by leg)
    const [outboundFlights, setOutboundFlights] = useState<any[]>([]);
    const [inboundFlights, setInboundFlights] = useState<any[]>([]);
    const searchParams = useSearchParams();
    const [roundtripMode, setRoundtripMode] = useState(true);
    const [tripStep, setTripStep] = useState<'outbound' | 'inbound'>('outbound');
    const [selectedOutbound, setSelectedOutbound] = useState<typeof sampleFlights[number] | null>(null);
    const [selectedInbound, setSelectedInbound] = useState<typeof sampleFlights[number] | null>(null);
    const [showReview, setShowReview] = useState(false);
    const [pricingLoadingRT, setPricingLoadingRT] = useState(false);
    // Map of flightId -> pricing/offer data returned by pricing API (used by detail panel)
    const [pricingByFlight, setPricingByFlight] = useState<Record<string, any>>({});
    const [showOutboundDetailsModal, setShowOutboundDetailsModal] = useState(false);
    const [showInboundDetailsModal, setShowInboundDetailsModal] = useState(false);
    // THÊM STATES MỚI TỪ CODE TRƯỚC ĐỂ HỖ TRỢ LOADING PER FLIGHT VÀ SEATMAP
    const [pricingLoadingByFlight, setPricingLoadingByFlight] = useState<Record<string, boolean>>({});
    const setPricingLoadingFor = (key: string, v: boolean) => setPricingLoadingByFlight(prev => ({ ...prev, [key]: v }));
    const [seatmapData, setSeatmapData] = useState<any | null>(null);
    const [seatmapDeckIndex, setSeatmapDeckIndex] = useState(0);
    const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
    const [seatmapOpenForFlightId, setSeatmapOpenForFlightId] = useState<string | number | null>(null);
    const cardRefs = useRef(new Map<string, HTMLDivElement | null>()); // Để handle click outside expanded

    // THÊM USEEFFECT CHO CLICK OUTSIDE EXPANDED (từ code trước)
    // useEffect(() => {
    //     const handleClickOutside = (event: MouseEvent) => {
    //         if (expandedFlight && cardRefs.current.size > 0) {
    //             let clickedOutside = true;
    //             cardRefs.current.forEach((ref, id) => {
    //                 if (ref && ref.contains(event.target as Node)) {
    //                     clickedOutside = false;
    //                 }
    //             });
    //             if (clickedOutside) {
    //                 setExpandedFlight(null);
    //             }
    //         }
    //     };

    //     document.addEventListener('click', handleClickOutside);
    //     return () => {
    //         document.removeEventListener('click', handleClickOutside);
    //     };
    // }, [expandedFlight]);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            let isOutside = true;
            cardRefs.current.forEach((ref) => {
                if (ref && ref.contains(event.target as Node)) {
                    isOutside = false;
                }
            });

            if (isOutside && expandedFlight !== null) {
                setExpandedFlight(null);
                setPricingLoadingByFlight({}); // Reset loading để tránh state cũ
            }
        };

        document.addEventListener('mousedown', handleClickOutside); // Sử dụng mousedown để bắt click sớm hơn
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [expandedFlight, setExpandedFlight]);
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price);
    };

    // Format ISO date string to readable vi-VN date (fallback to original string if invalid)
    const formatDateReadable = (d?: string) => {
        if (!d) return '';
        const dt = new Date(d);
        if (Number.isNaN(dt.getTime())) return d;
        return dt.toLocaleDateString('vi-VN');
    };

    // Return day offset (arrivalDate - departureDate) in days (0, 1, 2, ...)
    const getDayOffset = (dep?: string, arr?: string) => {
        if (!dep || !arr) return 0;
        try {
            const a = new Date(arr);
            const b = new Date(dep);
            const diff = Math.round((a.setHours(0, 0, 0, 0) - b.setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24));
            return Number.isFinite(diff) ? diff : 0;
        } catch {
            return 0;
        }
    };

    const getAmenityIcon = (amenity: string) => {
        switch (amenity) {
            case 'wifi': return <Wifi className="h-4 w-4" />;
            case 'meal': return <Utensils className="h-4 w-4" />;
            case 'entertainment': return <Tv className="h-4 w-4" />;
            case 'power': return <Battery className="h-4 w-4" />;
            default: return null;
        }
    };

    // Generate additional flights for selected route
    const generateRouteFlights = () => {
        if (!selectedRoute) return [];

        const basePrice = selectedRoute.price ? parseInt(selectedRoute.price.replace(/[^\d]/g, '')) : 1690000;
        // Lấy ngày đang chọn, nếu chưa chọn thì lấy ngày hôm nay
        const date = selectedDate || new Date().toISOString().split('T')[0];

        return [
            {
                ...sampleFlights[0],
                id: 999,
                departure: { time: '06:15', airport: 'SGN', city: selectedRoute.from, date },
                arrival: { time: '08:30', airport: 'HAN', city: selectedRoute.to, date },
                price: basePrice,
                originalPrice: basePrice + 300000,
                airline: 'VietJet Air',
                flightNumber: 'VJ142',
                discount: 15,
                availableSeats: 12,
            },
            {
                ...sampleFlights[0],
                id: 998,
                departure: { time: '08:45', airport: 'SGN', city: selectedRoute.from, date },
                arrival: { time: '11:00', airport: 'HAN', city: selectedRoute.to, date },
                price: basePrice + 200000,
                airline: 'Vietnam Airlines',
                flightNumber: 'VN1546',
                availableSeats: 8,
            },
            {
                ...sampleFlights[0],
                id: 997,
                departure: { time: '14:30', airport: 'SGN', city: selectedRoute.from, date },
                arrival: { time: '16:50', airport: 'HAN', city: selectedRoute.to, date },
                price: basePrice + 600000,
                airline: 'Bamboo Airways',
                flightNumber: 'QH1402',
                class: 'Phổ thông Plus',
                availableSeats: 15,
            }
        ];
    };

    // Helper: convert ISO duration (e.g. PT2H10M) => '2h 10m'
    const convertDuration = (iso: string | undefined) => {
        if (!iso) return '';
        const matchH = iso.match(/(\d+)H/);
        const matchM = iso.match(/(\d+)M/);
        const h = matchH ? `${matchH[1]}h` : '';
        const m = matchM ? `${matchM[1]}m` : '';
        return [h, m].filter(Boolean).join(' ');
    };

    // Map Amadeus response 'offer' -> local sampleFlight-like object (handles multi-segment itineraries)
    const mapOfferToFlight = (offer: any, dictionaries: any, idx: number) => {
        const itineraries = offer.itineraries || [];
        // flatten segments from first itinerary (most offers are single-itinerary)
        const firstItin = itineraries[0] || {};
        const segments = firstItin.segments || [];
        const firstSeg = segments[0] || {};
        const lastSeg = segments[segments.length - 1] || firstSeg;

        const depAt: string = firstSeg.departure?.at || '';
        const arrAt: string = lastSeg.arrival?.at || '';
        const depDate = depAt.split('T')[0] || '';
        const arrDate = arrAt.split('T')[0] || '';
        const depTime = depAt.split('T')[1]?.slice(0, 5) || '';
        const arrTime = arrAt.split('T')[1]?.slice(0, 5) || '';

        // airline: prefer validatingAirlineCodes or segment carrier
        const carrier = (offer.validatingAirlineCodes && offer.validatingAirlineCodes[0]) || firstSeg.carrierCode || '';
        const airlineName = dictionaries?.carriers?.[carrier] || carrier || 'Unknown';

        // aircraft: combine segment aircraft names or pick first
        const aircraftCodes = [...new Set(segments.map((s: any) => s.aircraft?.code).filter(Boolean))];
        const aircraft = aircraftCodes.map((c: any) => dictionaries?.aircraft?.[c] || c).join(' / ') || '';

        // stops
        const stopsCount = Math.max(0, segments.length - 1);
        const stopsText = stopsCount === 0 ? 'Bay thẳng' : `${stopsCount} dừng`;

        // cabin(s) from travelerPricings -> join per-segment cabin info
        const traveler = offer.travelerPricings?.[0] || {};
        const cabins = (traveler.fareDetailsBySegment || []).map((f: any) => f.cabin).filter(Boolean);
        const cabinText = cabins.length > 0 ? cabins.join('/') : (traveler.travelerType || '');

        // baggage: try to read includedCheckedBags quantity/weight and includedCabinBags
        const fareSeg = traveler.fareDetailsBySegment?.[0] || {};
        const includedChecked = fareSeg.includedCheckedBags;
        const includedCabin = fareSeg.includedCabinBags;
        const checkin = {
            pieces: includedChecked?.quantity ?? undefined,
            weight: includedChecked?.weight ?? undefined,
            unit: includedChecked?.weightUnit ?? (includedChecked?.quantity ? undefined : undefined)
        };
        const handbag = {
            pieces: includedCabin?.quantity ?? undefined,
            weight: includedCabin?.weight ?? undefined,
            unit: includedCabin?.weightUnit ?? (includedCabin?.quantity ? undefined : undefined)
        };

        // price and currency (use total/grandTotal as provided)
        const priceStr = String(offer.price?.total || offer.price?.grandTotal || '0');
        const currency = offer.price?.currency || 'VND';
        const priceNumeric = Number(priceStr) || 0;
        // if currency isn't VND keep numeric as-is (formatting will show currency)

        // Attempt to read amenities/policies from the offer or raw payload (some suppliers embed these)
        const readAmenities = () => {
            // check many possible places where amenity info can appear
            const candCandidates = [
                offer.amenities,
                offer.raw?.amenities,
                offer.extensions?.amenities,
                offer.meta?.amenities,
                offer.included?.['aircraft-cabin-amenities'],
                offer.raw?.included?.['aircraft-cabin-amenities'],
                offer.seatmap?.aircraftCabinAmenities,
                offer.raw?.seatmap?.aircraftCabinAmenities,
                // some sellers attach a 'services' array
                Array.isArray(offer.services) ? offer.services.find((s: any) => s.type === 'AMENITY' || s.type === 'SERVICE') : null,
                // fallback: sometimes wrapped under data/included
                offer.data?.included?.['aircraft-cabin-amenities'] ?? offer.data?.included
            ].filter(Boolean);

            if (candCandidates.length === 0) return null;

            // prefer first meaningful candidate
            const cand = candCandidates[0];

            // Normalization helpers — many sources use different shapes
            const bool = (v: any) => !!v;
            const str = (v: any) => (v === undefined || v === null) ? undefined : String(v);

            // wifi may be boolean or object
            const wifi = (() => {
                if (cand.wifi !== undefined) {
                    if (typeof cand.wifi === 'object') return { available: bool(cand.wifi.available), free: !!cand.wifi.free, price: cand.wifi.price ?? cand.wifi.fee };
                    return { available: bool(cand.wifi) };
                }
                if (cand['wifi']) return { available: true };
                if (cand.seat?.wifi || cand.seat?.medias) return { available: true };
                return { available: false };
            })();

            // meal can be object or boolean or array
            const meal = (() => {
                if (cand.meal !== undefined) {
                    if (typeof cand.meal === 'object') {
                        return {
                            included: !!cand.meal.included,
                            available: cand.meal.available !== undefined ? !!cand.meal.available : !!cand.meal,
                            price: cand.meal.price ?? cand.meal.fee ?? undefined,
                            type: cand.meal.type ?? cand.meal.name ?? undefined
                        };
                    }
                    return { included: !!cand.meal, available: !!cand.meal };
                }
                // seatmap food hints
                if (cand.food || (cand.seat && cand.seat.food)) {
                    const f = cand.food ?? cand.seat?.food;
                    return { included: !!f.included, available: !!f, price: f.price ?? undefined, type: f.type ?? undefined };
                }
                return { included: false, available: false };
            })();

            // entertainment: may be boolean or object with screens/media info
            const entertainment = (() => {
                if (cand.entertainment !== undefined) {
                    if (typeof cand.entertainment === 'object') return { available: !!cand.entertainment.available, screens: cand.entertainment.screens ?? cand.entertainment.count ?? undefined };
                    return { available: !!cand.entertainment };
                }
                if (cand.seat?.medias || cand.medias) return { available: true, screens: (cand.seat?.medias?.length ?? cand.medias?.length) || undefined };
                return { available: false };
            })();

            // power / charging
            const power = (() => {
                if (cand.power !== undefined) {
                    if (typeof cand.power === 'object') return { available: !!cand.power.available, type: cand.power.type ?? cand.power.powerType ?? undefined, isChargeable: !!cand.power.isChargeable };
                    return { available: !!cand.power };
                }
                if (cand.seat?.power || cand.powerType) return { available: true, type: cand.powerType ?? (cand.seat?.power?.type) ?? undefined };
                return { available: false };
            })();

            const priority = !!(cand.priority || cand.priorityBoarding || cand.priorityService);

            return {
                wifi,
                meal,
                entertainment,
                power,
                priority
            };
        };

        const readPolicies = () => {
            const cand = offer.policies || offer.raw?.policies || offer.policy || offer.extensions?.policies || offer.meta?.policies || null;
            if (!cand) return null;
            // normalize minimal expected fields
            return {
                cancellable: !!cand.cancellable,
                changeable: !!cand.changeable,
                refundable: cand.refundable ?? cand.refund ?? cand.note ?? (cand.cancellable ? 'Xem điều khoản hãng' : 'Không hoàn tiền, không đổi lịch'),
                cancellationFee: cand.cancellationFee ?? cand.cancellation_fee ?? cand.cancellation ?? undefined,
                changeFee: cand.changeFee ?? cand.change_fee ?? undefined,
                // keep raw copy for debugging
                _raw: cand
            };
        };

        const detectedAmenities = readAmenities();
        const detectedPolicies = readPolicies();

        return {
            id: String(offer.id) || `offer-${idx}`,
            airline: airlineName,
            airlineCode: carrier,
            flightNumber: `${firstSeg.carrierCode || ''}${firstSeg.number || ''}`,
            departure: { time: depTime, airport: firstSeg.departure?.iataCode || '', city: firstSeg.departure?.iataCode || '', date: depDate },
            arrival: { time: arrTime, airport: lastSeg.arrival?.iataCode || '', city: lastSeg.arrival?.iataCode || '', date: arrDate },
            duration: convertDuration(firstItin.duration),
            aircraft,
            price: priceNumeric,
            currency,
            originalPrice: priceNumeric + 300000,
            class: cabinText || 'ECONOMY',
            baggage: {
                handbag,
                checkin
            },
            // Ensure these arrays exist so UI can safely iterate
            benefits: offer.benefits || [],
            promotions: offer.promotions || [],
            // prefer detected amenities/policies when available (VJ or other suppliers)
            amenities: detectedAmenities ?? {
                wifi: { available: false },
                meal: { included: false, available: true, price: 'Từ 120.000đ' },
                entertainment: { available: false },
                power: { available: false },
                priority: false
            },
            policies: detectedPolicies ?? {
                cancellable: false,
                changeable: false,
                refundable: 'Không hoàn tiền, không đổi lịch'
            },
            availableSeats: offer.numberOfBookableSeats || 0,
            stopsCount,
            stopsText,
            raw: offer // keep raw for debugging if needed
        };
    };

    // Thêm helper cache (canonical key từ searchParams; lưu mapped results để tái sử dụng)
    const CACHE_PREFIX = 'mt_flight_offers_cache_v1';
    const CACHE_TTL_MS = 30 * 60 * 1000; // 30 phút

    // Gọi shared cleaner khi component mount để chạy cleanup ngay và tránh "declared but never read"
    useEffect(() => {
        try { cleanExpiredFlightCaches(); } catch (e) { /* ignore */ }
    }, []);

    // Track current cache key + whether cached results are expired (older than TTL)
    const [currentCacheKey, setCurrentCacheKey] = useState<string | null>(null);
    const [cacheExpired, setCacheExpired] = useState(false);

    function makeCacheKeyFromParams(paramsObj: Record<string, string | undefined>) {
        // canonicalize: sort keys so order query ko tạo key khác
        const entries = Object.entries(paramsObj)
            .filter(([_, v]) => v !== undefined && v !== null && String(v) !== '')
            .map(([k, v]) => [k, String(v)]);
        entries.sort((a, b) => a[0].localeCompare(b[0]));
        return entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
    }

    function getCache(key: string) {
        try {
            const raw = localStorage.getItem(`${CACHE_PREFIX}::${key}`);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (!parsed || !parsed.timestamp) return null;
            return parsed;
        } catch {
            return null;
        }
    }

    function setCache(key: string, payload: any) {
        try {
            const item = { timestamp: Date.now(), data: payload };
            localStorage.setItem(`${CACHE_PREFIX}::${key}`, JSON.stringify(item));
        } catch {
            // ignore storage errors
        }
    }

    function removeCache(key: string) {
        try {
            localStorage.removeItem(`${CACHE_PREFIX}::${key}`);
        } catch {
            // ignore
        }
    }

    // Reusable function to fetch offers and update state (callable from refresh button)
    const fetchAmadeusOffers = async () => {
        const q = searchParams ? Object.fromEntries(searchParams.entries()) : {};
        const origin = q['originLocationCode'] || q['from'] || q['origin'] || q['fromLocationCode'];
        const destination = q['destinationLocationCode'] || q['to'] || q['destination'];
        const departure = q['departureDate'] || q['departure'] || q['date'];
        const returnDate = q['returnDate'] || q['return'];
        if (!origin || !destination || !departure) return;

        setIsLoading(true);
        // clear previous legs while loading
        setApiFlights([]);
        setOutboundFlights([]);
        setInboundFlights([]);
        try {
            // get token once and reuse for both legs
            const tokenRes = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    grant_type: 'client_credentials',
                    client_id: process.env.NEXT_PUBLIC_AMADEUS_CLIENT_ID || '',
                    client_secret: process.env.NEXT_PUBLIC_AMADEUS_CLIENT_SECRET || ''
                })
            });
            const tokenJson = await tokenRes.json();
            const token = tokenJson.access_token;
            if (!token) throw new Error('No token from Amadeus');

            const legs: { origin: string; destination: string; departureDate: string | undefined }[] = [
                { origin, destination, departureDate: departure }
            ];
            if (returnDate) legs.push({ origin: destination, destination: origin, departureDate: returnDate });

            const perLegResults: any[][] = [];
            for (const leg of legs) {
                const cacheParams: Record<string, string | undefined> = {
                    originLocationCode: leg.origin,
                    destinationLocationCode: leg.destination,
                    departureDate: leg.departureDate,
                    adults: q['adults'] || '1',
                    children: q['children'] || '0',
                    infants: q['infants'] || '0',
                    travelClass: q['travelClass'] || undefined,
                    nonStop: q['nonStop'] || undefined,
                    currencyCode: q['currencyCode'] || undefined,
                    includedAirlineCodes: q['includedAirlineCodes'] || undefined
                };
                const cacheKey = makeCacheKeyFromParams(cacheParams);

                // try cache-first for this leg
                const cached = getCache(cacheKey);
                if (cached && cached.timestamp && Array.isArray(cached.data)) {
                    perLegResults.push(cached.data);
                    continue;
                }

                const params = new URLSearchParams();
                params.set('originLocationCode', leg.origin);
                params.set('destinationLocationCode', leg.destination);
                if (leg.departureDate) params.set('departureDate', leg.departureDate);
                params.set('adults', q['adults'] || '1');
                params.set('children', q['children'] || '0');
                params.set('infants', q['infants'] || '0');
                if (q['travelClass']) params.set('travelClass', q['travelClass']);
                params.set('includedAirlineCodes', q['includedAirlineCodes'] || 'VN');
                params.set('currencyCode', q['currencyCode'] || 'VND');
                params.set('nonStop', q['nonStop'] || 'true');
                params.set('max', q['max'] || '5');

                const offersRes = await fetch(`https://test.api.amadeus.com/v2/shopping/flight-offers?${params.toString()}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const offersJson = await offersRes.json();
                const dicts = offersJson.dictionaries || {};
                const data = offersJson.data || [];
                const mapped = data.map((o: any, i: number) => mapOfferToFlight(o, dicts, i));


                // Nếu không có chuyến bay từ API, dùng sample data để test UI
                if (mapped.length === 0) {
                    console.log('No flights found from Amadeus');
                    setApiFlights([]); // Đảm bảo rỗng
                    setHasSearched(true);
                    setShowPromotions(false);
                    setIsLoading(false);
                    setIsLoadingFlights(false);
                    return; // Dừng không fetch tiếp
                }

                // adjust priceRange if necessary (preserve existing logic)
                if (mapped.length > 0) {
                    const prices = mapped.map((m: any) => Number(m.price) || 0).filter(Boolean);
                    if (prices.length > 0) {
                        const minP = Math.min(...prices);
                        const maxP = Math.max(...prices);
                        const anyInCurrentRange = prices.some((p: any) => p >= priceRange[0] && p <= priceRange[1]);
                        if (!anyInCurrentRange) {
                            setPriceRange([Math.max(0, minP - 100000), maxP + 100000]);
                        }
                    }
                }

                perLegResults.push(mapped);
                try { if (mapped.length > 0) setCache(cacheKey, mapped); } catch { }
            }

            // assign per-leg results: outbound = leg0, inbound = leg1 (if present)
            const outbound = perLegResults[0] || [];
            const inbound = perLegResults[1] || [];
            setOutboundFlights(outbound);
            setInboundFlights(inbound);
            // for initial view, show outbound list (apiFlights kept as legacy pointer used elsewhere)
            setApiFlights(outbound);

            // --- NEW: also save a combined cache entry (outbound + inbound) when this was a roundtrip
            // This helps other tabs/old logic that look up a single canonical key containing returnDate.
            try {
                if (returnDate) {
                    // Save wrapped structure to avoid id collisions and allow deterministic extraction later
                    const combinedCacheParams: Record<string, string | undefined> = {
                        originLocationCode: origin,
                        destinationLocationCode: destination,
                        departureDate: departure,
                        returnDate: returnDate,
                        adults: q['adults'] || '1',
                        children: q['children'] || '0',
                        infants: q['infants'] || '0',
                        travelClass: q['travelClass'] || undefined,
                        nonStop: q['nonStop'] || undefined,
                        currencyCode: q['currencyCode'] || undefined,
                        includedAirlineCodes: q['includedAirlineCodes'] || undefined
                    };
                    const combinedKey = makeCacheKeyFromParams(combinedCacheParams);
                    const wrapped = { outbound, inbound };
                    if ((outbound && outbound.length) || (inbound && inbound.length)) {
                        setCache(combinedKey, wrapped);
                        setCurrentCacheKey(combinedKey);
                        console.log('[Cache] saved combined (wrapped) cache for key', combinedKey);
                    }
                }
            } catch (e) {
                // ignore caching errors
            }
        } catch (err) {
            console.error('Amadeus fetch error', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch Amadeus token + flight offers when URL query changes (SearchTabs pushes query)
    useEffect(() => {
        const q = searchParams ? Object.fromEntries(searchParams.entries()) : {};
        const origin = q['originLocationCode'] || q['from'] || q['origin'] || q['fromLocationCode'];
        const destination = q['destinationLocationCode'] || q['to'] || q['destination'];
        const departure = q['departureDate'] || q['departure'] || q['date'];
        if (!origin || !destination || !departure) {
            return;
        }

        // build canonical param object used for cache key (only relevant params)
        const cacheParams: Record<string, string | undefined> = {
            originLocationCode: origin,
            destinationLocationCode: destination,
            departureDate: departure,
            returnDate: q['returnDate'] || q['return'],
            adults: q['adults'] || '1',
            children: q['children'] || '0',
            infants: q['infants'] || '0',
            travelClass: q['travelClass'] || undefined,
            nonStop: q['nonStop'] || undefined,
            currencyCode: q['currencyCode'] || undefined,
            includedAirlineCodes: q['includedAirlineCodes'] || undefined
        };
        const cacheKey = makeCacheKeyFromParams(cacheParams);
        setCurrentCacheKey(cacheKey);

        // If this is a roundtrip search, prefer checking per-leg caches (outbound/inbound)
        const returnDate = cacheParams.returnDate;
        if (returnDate) {
            // --- NEW: try combined cache first (supports wrapped { outbound,inbound } or legacy flat array)
            try {
                const combinedCached = getCache(cacheKey);
                if (combinedCached && combinedCached.timestamp) {
                    const ageMs = Date.now() - combinedCached.timestamp;
                    const stored = combinedCached.data;
                    // wrapped shape { outbound: [], inbound: [] }
                    if (stored && typeof stored === 'object' && (Array.isArray(stored.outbound) || Array.isArray(stored.inbound))) {
                        const outboundList = Array.isArray(stored.outbound) ? stored.outbound : [];
                        const inboundList = Array.isArray(stored.inbound) ? stored.inbound : [];
                        // update priceRange to include both legs (merge with current range)
                        try {
                            const prices = [...outboundList, ...inboundList].map((m: any) => Number(m.price) || 0).filter(Boolean);
                            if (prices.length > 0) {
                                const minP = Math.min(...prices);
                                const maxP = Math.max(...prices);
                                const anyInCurrentRange = prices.some((p: number) => p >= priceRange[0] && p <= priceRange[1]);
                                if (!anyInCurrentRange) {
                                    setPriceRange([Math.max(0, Math.min(priceRange[0], minP) - 100000), Math.max(priceRange[1], maxP) + 100000]);
                                }
                            }
                        } catch { /* ignore */ }

                        if (ageMs <= CACHE_TTL_MS) {
                            setOutboundFlights(outboundList);
                            setInboundFlights(inboundList);
                            setApiFlights(outboundList);
                            setHasSearched(true);
                            setShowPromotions(false);
                            setIsLoading(false);
                            setIsLoadingFlights(false);
                            setCacheExpired(false);
                            return;
                        }
                        // stale: still populate but mark expired
                        setOutboundFlights(outboundList);
                        setInboundFlights(inboundList);
                        setApiFlights(outboundList);
                        setHasSearched(true);
                        setShowPromotions(false);
                        setIsLoading(false);
                        setCacheExpired(true);
                        setIsLoadingFlights(false); // Thêm: load xong
                        return;
                    }

                    // legacy flat-array combined cache -> split by dates
                    if (Array.isArray(stored)) {
                        const combinedData: any[] = stored;
                        const outboundList = combinedData.filter(f => String(f.departure?.date || '') === String(cacheParams.departureDate || ''));
                        const inboundList = combinedData.filter(f => String(f.departure?.date || '') === String(cacheParams.returnDate || ''));
                        try {
                            const prices = [...outboundList, ...inboundList].map((m: any) => Number(m.price) || 0).filter(Boolean);
                            if (prices.length > 0) {
                                const minP = Math.min(...prices);
                                const maxP = Math.max(...prices);
                                const anyInCurrentRange = prices.some((p: number) => p >= priceRange[0] && p <= priceRange[1]);
                                if (!anyInCurrentRange) {
                                    setPriceRange([Math.max(0, Math.min(priceRange[0], minP) - 100000), Math.max(priceRange[1], maxP) + 100000]);
                                }
                            }
                        } catch { /* ignore */ }

                        if (ageMs <= CACHE_TTL_MS) {
                            setOutboundFlights(outboundList);
                            setInboundFlights(inboundList);
                            setApiFlights(outboundList);
                            setHasSearched(true);
                            setShowPromotions(false);
                            setIsLoading(false);
                            setCacheExpired(false);
                            setIsLoadingFlights(false); // Thêm: load xong
                            return;
                        }
                        setOutboundFlights(outboundList);
                        setInboundFlights(inboundList);
                        setApiFlights(outboundList);
                        setHasSearched(true);
                        setShowPromotions(false);
                        setIsLoading(false);
                        setCacheExpired(true);
                        setIsLoadingFlights(false); // Thêm: load xong
                        return;
                    }
                }
            } catch (e) {
                // ignore combined-cache read errors and fallback to per-leg logic
            }

            const outboundParams: Record<string, string | undefined> = {
                originLocationCode: cacheParams.originLocationCode,
                destinationLocationCode: cacheParams.destinationLocationCode,
                departureDate: cacheParams.departureDate,
                adults: cacheParams.adults,
                children: cacheParams.children,
                infants: cacheParams.infants,
                travelClass: cacheParams.travelClass,
                nonStop: cacheParams.nonStop,
                currencyCode: cacheParams.currencyCode,
                includedAirlineCodes: cacheParams.includedAirlineCodes
            };
            const inboundParams: Record<string, string | undefined> = {
                originLocationCode: cacheParams.destinationLocationCode,
                destinationLocationCode: cacheParams.originLocationCode,
                departureDate: cacheParams.returnDate,
                adults: cacheParams.adults,
                children: cacheParams.children,
                infants: cacheParams.infants,
                travelClass: cacheParams.travelClass,
                nonStop: cacheParams.nonStop,
                currencyCode: cacheParams.currencyCode,
                includedAirlineCodes: cacheParams.includedAirlineCodes
            };

            const outboundKey = makeCacheKeyFromParams(outboundParams);
            const inboundKey = makeCacheKeyFromParams(inboundParams);

            const outboundCached = getCache(outboundKey);
            const inboundCached = getCache(inboundKey);

            let anyExpired = false;

            // If we have outbound cached data (fresh or stale), show it immediately as the initial list
            if (outboundCached && outboundCached.timestamp && Array.isArray(outboundCached.data)) {
                const ageMs = Date.now() - outboundCached.timestamp;
                // --- NEW: update priceRange from cached outbound prices (same logic as when fetching) ---
                try {
                    const prices = (outboundCached.data as any[]).map(m => Number(m.price) || 0).filter(Boolean);
                    if (prices.length > 0) {
                        const minP = Math.min(...prices);
                        const maxP = Math.max(...prices);
                        const anyInCurrentRange = prices.some(p => p >= priceRange[0] && p <= priceRange[1]);
                        if (!anyInCurrentRange) {
                            setPriceRange([Math.max(0, minP - 100000), maxP + 100000]);
                        }
                    }
                } catch { /* ignore price compute errors */ }

                if (ageMs <= CACHE_TTL_MS) {
                    setOutboundFlights(outboundCached.data);
                    setApiFlights(outboundCached.data); // show outbound first
                } else {
                    // stale: remove stored entry but keep showing stale data in UI and mark expired
                    try { removeCache(outboundKey); } catch { }
                    setOutboundFlights(outboundCached.data);
                    setApiFlights(outboundCached.data);
                    anyExpired = true;
                }
                setHasSearched(true);
                setShowPromotions(false);
                setIsLoadingFlights(false);
                setIsLoading(false);
            }

            // If inbound cached, populate inboundFlights (but do not automatically switch UI)
            if (inboundCached && inboundCached.timestamp && Array.isArray(inboundCached.data)) {
                const ageMs = Date.now() - inboundCached.timestamp;
                // also update priceRange using inbound prices as a best-effort (optional)
                try {
                    const prices = (inboundCached.data as any[]).map(m => Number(m.price) || 0).filter(Boolean);
                    if (prices.length > 0) {
                        const minP = Math.min(...prices);
                        const maxP = Math.max(...prices);
                        const anyInCurrentRange = prices.some(p => p >= priceRange[0] && p <= priceRange[1]);
                        if (!anyInCurrentRange) {
                            setPriceRange([Math.max(0, Math.min(priceRange[0], minP) - 100000), Math.max(priceRange[1], maxP) + 100000]);
                        }
                    }
                } catch { /* ignore */ }

                if (ageMs <= CACHE_TTL_MS) {
                    setInboundFlights(inboundCached.data);
                } else {
                    try { removeCache(inboundKey); } catch { }
                    setInboundFlights(inboundCached.data);
                    anyExpired = true;
                }
            }

            if (anyExpired) {
                // mark expired so "Làm mới" UI shows up
                setCacheExpired(true);
            }

            // If we had outbound cached (even stale) we stop here and do NOT fetch both legs immediately.
            // This enables the UX: show outbound list fast; fetch inbound only when user selects outbound.
            if (outboundCached && outboundCached.timestamp && Array.isArray(outboundCached.data)) {
                return;
            }

            // No outbound cache -> fetch both legs now
            fetchAmadeusOffers();
            return;
        }

        // Non-roundtrip flow: look for single-key cache as before
        const cached = getCache(cacheKey);
        if (cached && cached.timestamp && Array.isArray(cached.data)) {
            try {
                const prices = (cached.data as any[]).map(m => Number(m.price) || 0).filter(Boolean);
                if (prices.length > 0) {
                    const minP = Math.min(...prices);
                    const maxP = Math.max(...prices);
                    const anyInCurrentRange = prices.some(p => p >= priceRange[0] && p <= priceRange[1]);
                    if (!anyInCurrentRange) {
                        setPriceRange([Math.max(0, minP - 100000), maxP + 100000]);
                    }
                }
            } catch { /* ignore */ }

            const ageMs = Date.now() - cached.timestamp;
            console.log('[Cache] found cache for key', cacheKey, `age ${Math.round(ageMs / 1000)}s`);
            if (ageMs <= CACHE_TTL_MS) {
                setApiFlights(cached.data);
                setHasSearched(true);
                setShowPromotions(false);
                setIsLoading(false);
                setCacheExpired(false);
                setIsLoadingFlights(false); // Thêm: load xong
                return;
            }
            try { removeCache(cacheKey); } catch { }
            setApiFlights(cached.data);
            setHasSearched(true);
            setShowPromotions(false);
            setIsLoading(false);
            setCacheExpired(true);
            setIsLoadingFlights(false); // Thêm: load xong
            return;
        }

        // No cache -> fetch now
        fetchAmadeusOffers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams ? searchParams.toString() : '']);

    // Handler invoked by "Làm mới" button in UI when cache is expired
    const handleRefreshCachedResults = async () => {
        if (currentCacheKey) {
            try { removeCache(currentCacheKey); } catch { }
        }
        setCacheExpired(false);
        await fetchAmadeusOffers();
    };

    const routeFlights = selectedRoute ? generateRouteFlights() : [];
    // Decide which set of flights to show:
    // - If roundtripMode: show outboundFlights when choosing outbound, inboundFlights when choosing inbound.
    // - Otherwise behave as before (apiFlights or generated/sample).
    // let legFlights: any[] = [];
    // if (roundtripMode) {
    //     legFlights = tripStep === 'outbound' ? (outboundFlights.length ? outboundFlights : apiFlights) : (inboundFlights.length ? inboundFlights : []);
    //     // fallback to generated/sample if no API flights for this leg
    //     if (!legFlights || legFlights.length === 0) {
    //         legFlights = selectedRoute ? [...routeFlights, ...sampleFlights] : sampleFlights;
    //     }
    // } else {
    //     legFlights = apiFlights && apiFlights.length > 0 ? apiFlights : (selectedRoute ? [...routeFlights, ...sampleFlights] : sampleFlights);
    // }

    // const allFlights = legFlights;

    let legFlights: any[] = [];
    if (roundtripMode) {
        legFlights = tripStep === 'outbound' ? (outboundFlights.length ? outboundFlights : []) : (inboundFlights.length ? inboundFlights : []);
    } else {
        legFlights = apiFlights && apiFlights.length > 0 ? apiFlights : [];
    }

    const allFlights = legFlights; // Chỉ dùng data từ API, không có fake data
    const [selectedDepartureTime, setSelectedDepartureTime] = useState<string>('');
    const filteredFlights = allFlights.filter(flight => {
        const price = Number(flight?.price) || 0;
        const matchesPrice = price >= priceRange[0] && price <= priceRange[1];
        const matchesAirline = selectedAirlines.length === 0 || selectedAirlines.includes(flight.airline);

        // Filter by departure time
        let matchesTime = true;
        if (selectedDepartureTime) {
            const [start, end] = selectedDepartureTime.split('-').map(t => {
                const [h, m] = t.split(':').map(Number);
                return h * 60 + m; // Convert to minutes
            });
            const flightTime = flight.departure?.time;
            if (flightTime) {
                const [h, m] = flightTime.split(':').map(Number);
                const flightMinutes = h * 60 + m;
                matchesTime = flightMinutes >= start && flightMinutes < end;
            } else {
                matchesTime = false;
            }
        }

        // If route is selected, prioritize matching routes
        if (selectedRoute) {
            const matchesRoute =
                flight.departure.city === selectedRoute.from &&
                flight.arrival.city === selectedRoute.to;
            return matchesPrice && matchesAirline && matchesTime && matchesRoute;
        }

        return matchesPrice && matchesAirline && matchesTime;
    });

    const sortedFlights = [...filteredFlights].sort((a, b) => {
        // If route selected, show generated route flights first
        if (selectedRoute) {
            const aIsRoute = a.id >= 997;
            const bIsRoute = b.id >= 997;
            if (aIsRoute && !bIsRoute) return -1;
            if (!aIsRoute && bIsRoute) return 1;
        }

        switch (sortBy) {
            case 'price-asc': return a.price - b.price;
            case 'price-desc': return b.price - a.price;
            case 'departure-asc': return a.departure.time.localeCompare(b.departure.time);
            case 'departure-desc': return b.departure.time.localeCompare(a.departure.time);
            case 'arrival-desc': return b.arrival.time.localeCompare(a.arrival.time);
            case 'duration': return a.duration.localeCompare(b.duration);
            default: return 0;
        }
    });
    useEffect(() => {
        try {
            const prices = allFlights
                .map(f => Number((f && f.price) ?? 0))
                .filter(p => Number.isFinite(p) && p > 0);
            if (prices.length === 0) return;
            const minP = Math.min(...prices);
            const maxP = Math.max(...prices);
            const roundedMin = Math.max(0, Math.floor(minP / 100000) * 100000);
            const roundedMax = Math.ceil(maxP / 100000) * 100000;

            setMinPriceBound(roundedMin);
            setMaxPriceBound(roundedMax);

            setPriceRange(prev => {
                const low = Math.max(roundedMin, Math.min(prev[0], roundedMax));
                const high = Math.max(roundedMin, Math.min(prev[1], roundedMax));
                // if clamped range has no flights inside, expand to full bounds
                const any = prices.some(p => p >= low && p <= high);
                return any ? [low, high] : [roundedMin, roundedMax];
            });
        } catch {
            // ignore
        }
    }, [allFlights]);

    const handleSearch = () => {
        setHasSearched(true);
        setShowPromotions(false);
        setIsLoadingFlights(true); // Thêm: bắt đầu load
        setIsLoading(true);
        // setTimeout(() => setIsLoading(false), 3000);
    };

    const handleRouteSelect = (from: string, to: string, price?: string) => {
        // Update search form
        setSearchForm({ from, to });
        // Set selected route
        setSelectedRoute({ from, to, price });
        // Trigger search
        setHasSearched(true);
        setShowPromotions(false);
        // Set default date to today + 1
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setSelectedDate(tomorrow.toISOString().split('T')[0]);
    };

    const [copied, setCopied] = useState<{ [code: string]: boolean }>({});

    const handleCopy = (code: string) => {
        navigator.clipboard.writeText(code).then(() => {
            setCopied(prev => ({ ...prev, [code]: true }));
            setTimeout(() => setCopied(prev => ({ ...prev, [code]: false })), 2000);
        });
    };

    function CardSkeleton() {
        return (
            <Card className="animate-pulse">
                <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 rounded bg-gray-200 shimmer" />
                                <div className="h-4 w-32 bg-gray-200 rounded shimmer" />
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-center">
                                    <div className="h-4 w-12 bg-gray-200 rounded shimmer mx-auto mb-2" />
                                    <div className="h-3 w-16 bg-gray-200 rounded shimmer mx-auto" />
                                </div>
                                <div className="flex-1 text-center">
                                    <div className="h-3 w-20 bg-gray-200 rounded shimmer mx-auto mb-2" />
                                </div>
                                <div className="text-center">
                                    <div className="h-4 w-12 bg-gray-200 rounded shimmer mx-auto mb-2" />
                                    <div className="h-3 w-16 bg-gray-200 rounded shimmer mx-auto" />
                                </div>
                            </div>
                        </div>
                        <div className="lg:text-right space-y-2">
                            <div className="h-5 w-24 bg-gray-200 rounded shimmer mx-auto mb-2" />
                            <div className="h-8 w-32 bg-gray-200 rounded shimmer mx-auto" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

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

    // Detect roundtrip mode from query (returnDate)
    useEffect(() => {
        if (!searchParams) return;
        const params = Object.fromEntries(searchParams.entries());
        setRoundtripMode(!!params['returnDate']);
    }, [searchParams]);

    // Reset state when mode changes
    useEffect(() => {
        setTripStep('outbound');
        setSelectedOutbound(null);
        setSelectedInbound(null);
        setShowReview(false);
    }, [roundtripMode, selectedRoute, selectedDate]);

    // Tổng giá vé khứ hồi
    const totalRoundtripPrice = () => {
        return (selectedOutbound?.price || 0) + (selectedInbound?.price || 0);
    };
    function RoundtripSelectCardSkeleton() {
        return (
            <Card className="mb-4 bg-[hsl(var(--card))] border border-[hsl(var(--muted))] animate-pulse">
                <CardHeader className="py-3 bg-[hsl(var(--card))] border-b border-[hsl(var(--muted))]">
                    <div className="h-5 w-32 bg-gray-200 rounded shimmer" />
                </CardHeader>
                <CardContent className="p-0">
                    {/* Outbound Skeleton */}
                    <div className="border-l-4 border-[hsl(var(--primary))]">
                        <div className="px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-7 w-7 rounded-md bg-gray-200 shimmer" />
                                <div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-20 bg-gray-200 rounded shimmer" />
                                        <div className="h-3 w-16 bg-gray-200 rounded shimmer" />
                                    </div>
                                    <div className="h-4 w-40 bg-gray-200 rounded shimmer mt-1" />
                                </div>
                            </div>
                            <div className="h-4 w-16 bg-gray-200 rounded shimmer" />
                        </div>
                        <div className="px-4 pb-3">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded bg-gray-200 shimmer" />
                                <div>
                                    <div className="h-4 w-32 bg-gray-200 rounded shimmer mb-1" />
                                    <div className="h-3 w-48 bg-gray-200 rounded shimmer" />
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-center">
                                    <div className="h-6 w-16 bg-gray-200 rounded shimmer mx-auto mb-1" />
                                    <div className="h-3 w-12 bg-gray-200 rounded shimmer mx-auto mb-1" />
                                    <div className="h-3 w-20 bg-gray-200 rounded shimmer mx-auto" />
                                </div>
                                <div className="flex-1 text-center">
                                    <div className="h-3 w-16 bg-gray-200 rounded shimmer mx-auto mb-2" />
                                    <div className="h-px bg-gray-200 shimmer" />
                                </div>
                                <div className="text-center">
                                    <div className="h-6 w-16 bg-gray-200 rounded shimmer mx-auto mb-1" />
                                    <div className="h-3 w-12 bg-gray-200 rounded shimmer mx-auto mb-1" />
                                    <div className="h-3 w-20 bg-gray-200 rounded shimmer mx-auto" />
                                </div>
                            </div>
                            <div className="mt-3 h-10 bg-gray-200 rounded shimmer" />
                            <div className="mt-2 h-4 w-32 bg-gray-200 rounded shimmer ml-auto" />
                        </div>
                    </div>

                    {/* Inbound Skeleton */}
                    <div className="border-l-4 border-[hsl(var(--primary))]">
                        <div className="px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-7 w-7 rounded-md bg-gray-200 shimmer" />
                                <div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-20 bg-gray-200 rounded shimmer" />
                                        <div className="h-3 w-16 bg-gray-200 rounded shimmer" />
                                    </div>
                                    <div className="h-4 w-40 bg-gray-200 rounded shimmer mt-1" />
                                </div>
                            </div>
                            <div className="h-4 w-16 bg-gray-200 rounded shimmer" />
                        </div>
                        <div className="px-4 pb-3">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded bg-gray-200 shimmer" />
                                <div>
                                    <div className="h-4 w-32 bg-gray-200 rounded shimmer mb-1" />
                                    <div className="h-3 w-48 bg-gray-200 rounded shimmer" />
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-center">
                                    <div className="h-6 w-16 bg-gray-200 rounded shimmer mx-auto mb-1" />
                                    <div className="h-3 w-12 bg-gray-200 rounded shimmer mx-auto mb-1" />
                                    <div className="h-3 w-20 bg-gray-200 rounded shimmer mx-auto" />
                                </div>
                                <div className="flex-1 text-center">
                                    <div className="h-3 w-16 bg-gray-200 rounded shimmer mx-auto mb-2" />
                                    <div className="h-px bg-gray-200 shimmer" />
                                </div>
                                <div className="text-center">
                                    <div className="h-6 w-16 bg-gray-200 rounded shimmer mx-auto mb-1" />
                                    <div className="h-3 w-12 bg-gray-200 rounded shimmer mx-auto mb-1" />
                                    <div className="h-3 w-20 bg-gray-200 rounded shimmer mx-auto" />
                                </div>
                            </div>
                            <div className="mt-3 h-10 bg-gray-200 rounded shimmer" />
                            <div className="mt-2 h-4 w-32 bg-gray-200 rounded shimmer ml-auto" />
                        </div>
                    </div>

                    {/* Button Skeleton */}
                    <div className="px-4 py-3">
                        <div className="h-10 bg-gray-200 rounded shimmer" />
                    </div>
                </CardContent>
            </Card>
        );
    }
    // Card chọn chuyến bay cho roundtrip
    function RoundtripSelectCard() {
        // Read state names from URL if present, fallback to searchForm values
        const params = searchParams ? Object.fromEntries(searchParams.entries()) : {};
        const fromState = params['fromState'] || '';
        const toState = params['toState'] || '';

        const outboundRoute = fromState && toState
            ? `${fromState} → ${toState}`
            : (selectedRoute ? `${selectedRoute.from} → ${selectedRoute.to}` : `${searchForm.from} → ${searchForm.to}`);

        const inboundRoute = fromState && toState
            ? `${toState} → ${fromState}`
            : (selectedRoute ? `${selectedRoute.to} → ${selectedRoute.from}` : `${searchForm.to} → ${searchForm.from}`);

        // Determine outbound/inbound dates (prefer selected flight, then URL params, then selectedDate)
        const depParam = params['departureDate'] || params['departure'] || params['date'] || selectedDate || '';
        const retParam = params['returnDate'] || params['return'] || '';

        const outboundRawDate = selectedOutbound?.departure?.date || depParam || selectedDate || '';
        const inboundRawDate = selectedInbound?.departure?.date || retParam || selectedDate || '';

        const formatDate = (d: string) => {
            if (!d) return '';
            const dt = new Date(d);
            if (Number.isNaN(dt.getTime())) return d; // fallback to raw
            return dt.toLocaleDateString('vi-VN');
        };

        const outboundDateText = formatDate(outboundRawDate);
        const inboundDateText = formatDate(inboundRawDate);

        return (
            <Card className="mb-4 bg-[hsl(var(--card))] border border-[hsl(var(--muted))]">
                <CardHeader className="py-3 bg-[hsl(var(--card))] border-b border-[hsl(var(--muted))]">
                    <CardTitle className="text-base flex items-center gap-2 text-[hsl(var(--primary))]">
                        <Plane className="h-4 w-4 text-[hsl(var(--primary))]" /> Chuyến bay của bạn
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {/* Outbound */}
                    <div className="border-l-4 border-[hsl(var(--primary))]">
                        <div className="px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-7 w-7 rounded-md bg-[hsl(var(--primary))] text-white text-sm font-bold flex items-center justify-center">1</div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <div className="text-xs text-[hsl(var(--muted-foreground))]">Chuyến đi</div>
                                        {outboundDateText && <div className="text-xs text-[hsl(var(--muted-foreground))]">• {outboundDateText}</div>}
                                    </div>
                                    <div className="text-sm text-[hsl(var(--primary))] font-semibold">
                                        {outboundRoute}
                                    </div>
                                </div>
                            </div>
                            {selectedOutbound && (
                                <div className="text-sm">
                                    <button
                                        className="text-[hsl(var(--primary))] text-sm hover:underline"
                                        onClick={() => setShowOutboundDetailsModal(true)}
                                    >
                                        Chi tiết
                                    </button>
                                </div>
                            )}
                        </div>

                        {selectedOutbound ? (
                            <div className="px-4 pb-0">
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded bg-white/70 flex items-center justify-center text-sm font-semibold">
                                            {selectedOutbound.airline.split(' ').map(s => s[0]).slice(0, 2).join('')}
                                        </div>
                                        <div>
                                            <div className="font-medium">{selectedOutbound.airline}</div>
                                            <div className="text-xs text-[hsl(var(--muted-foreground))]">{selectedOutbound.flightNumber} • {selectedOutbound.aircraft}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 mt-3">
                                    <div className="text-center">
                                        <div className="font-bold text-lg">{selectedOutbound.departure.time}</div>
                                        <div className="text-sm text-[hsl(var(--muted-foreground))]">{selectedOutbound.departure.airport}</div>
                                        <div className="text-xs text-[hsl(var(--muted-foreground))]">{selectedOutbound.departure.city}</div>
                                    </div>

                                    <div className="flex-1 text-center">
                                        <div className="text-sm text-[hsl(var(--muted-foreground))] mb-1">{selectedOutbound.duration}</div>
                                        <div className="flex items-center">
                                            <div className="flex-1 h-px bg-gray-300"></div>
                                            <ArrowRight className="h-4 w-4 mx-2 text-gray-400" />
                                            <div className="flex-1 h-px bg-gray-300"></div>
                                        </div>
                                    </div>

                                    <div className="text-center">
                                        <div className="font-bold text-lg">{selectedOutbound.arrival.time}</div>
                                        <div className="text-sm text-[hsl(var(--muted-foreground))]">{selectedOutbound.arrival.airport}</div>
                                        <div className="text-xs text-[hsl(var(--muted-foreground))]">{selectedOutbound.arrival.city}</div>
                                    </div>
                                </div>

                                <div className="mt-3">
                                    <Button
                                        className="w-full"
                                        onClick={() => {
                                            if (tripStep === 'outbound') {
                                                setTripStep('inbound'); // Lưu và quay về inbound
                                            } else {
                                                setTripStep('outbound'); // Đổi chuyến đi
                                            }
                                        }}
                                    >
                                        {tripStep === 'outbound' ? 'Lưu chuyến đi' : 'Đổi chuyến đi'}
                                    </Button>
                                </div>
                                <div className="mt-2 text-right text font-bold text-orange-600">
                                    Giá tiền: {formatPrice(selectedOutbound.price)}/khách
                                </div>
                            </div>
                        ) : (
                            <div className="px-4 pb-3">
                                {/* <div className="text-sm text-[hsl(var(--muted-foreground))]">Chưa chọn chuyến đi</div> */}
                            </div>
                        )}
                    </div>

                    {/* Inbound */}
                    <div className="border-l-4 border-[hsl(var(--primary))]">
                        <div className="px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-7 w-7 rounded-md bg-[hsl(var(--primary))] text-white text-sm font-bold flex items-center justify-center">2</div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <div className="text-xs text-[hsl(var(--muted-foreground))]">Chuyến về</div>
                                        {inboundDateText && <div className="text-xs text-[hsl(var(--muted-foreground))]">• {inboundDateText}</div>}
                                    </div>
                                    <div className="text-sm text-[hsl(var(--primary))] font-semibold">
                                        {inboundRoute}
                                    </div>
                                </div>
                            </div>
                            {selectedInbound && (
                                <div className="text-sm">
                                    <button
                                        className="text-[hsl(var(--primary))] text-sm hover:underline"
                                        onClick={() => setShowInboundDetailsModal(true)}
                                    >
                                        Chi tiết
                                    </button>
                                </div>
                            )}
                        </div>

                        {selectedInbound ? (
                            <div className="px-4 pb-0">
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded bg-white/70 flex items-center justify-center text-sm font-semibold">
                                            {selectedInbound.airline.split(' ').map(s => s[0]).slice(0, 2).join('')}
                                        </div>
                                        <div>
                                            <div className="font-medium">{selectedInbound.airline}</div>
                                            <div className="text-xs text-[hsl(var(--muted-foreground))]">{selectedInbound.flightNumber} • {selectedInbound.aircraft}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 mt-3">
                                    <div className="text-center">
                                        <div className="font-bold text-lg">{selectedInbound.departure.time}</div>
                                        <div className="text-sm text-[hsl(var(--muted-foreground))]">{selectedInbound.departure.airport}</div>
                                        <div className="text-xs text-[hsl(var(--muted-foreground))]">{selectedInbound.departure.city}</div>
                                    </div>

                                    <div className="flex-1 text-center">
                                        <div className="text-sm text-[hsl(var(--muted-foreground))] mb-1">{selectedInbound.duration}</div>
                                        <div className="flex items-center">
                                            <div className="flex-1 h-px bg-gray-300"></div>
                                            <ArrowRight className="h-4 w-4 mx-2 text-gray-400" />
                                            <div className="flex-1 h-px bg-gray-300"></div>
                                        </div>
                                    </div>

                                    <div className="text-center">
                                        <div className="font-bold text-lg">{selectedInbound.arrival.time}</div>
                                        <div className="text-sm text-[hsl(var(---muted-foreground))]">{selectedInbound.arrival.airport}</div>
                                        <div className="text-xs text-[hsl(var(--muted-foreground))]">{selectedInbound.arrival.city}</div>
                                    </div>
                                </div>

                                <div className="mt-2 text-right text font-bold text-orange-600">
                                    Giá tiền: {formatPrice(selectedInbound.price)}/khách
                                </div>
                            </div>
                        ) : (
                            <div className="px-4 pb-3">
                                {/* <div className="text-sm text-[hsl(var(--muted-foreground))]">Chưa chọn chuyến về</div> */}
                            </div>
                        )}
                    </div>

                    {/* Nút Chọn xong nếu cả hai đã chọn */}
                    {selectedOutbound && selectedInbound && (
                        <div className="px-4 py-3">
                            <Button className="w-full" onClick={() => setShowReview(true)}>
                                Chọn xong
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    }

    // --- NEW: helpers để pricing/seatmap + cache (tương thích với FlightResults) ---
    const CACHE_KEY = 'amadeus_pricing_cache_v1';

    // Make a stable composite cache key from flight id and payload signature
    const makePricingCacheKey = (flightOfferPayload: any, flightId?: any) => {
        const sig = computeSignatureForPayload(flightOfferPayload) ?? 'nosig';
        const idPart = String(flightId ?? flightOfferPayload?.id ?? 'unknown');
        return `${idPart}::${sig}`;
    };

    const loadCacheFromStorage = () => {
        try {
            if (typeof window === 'undefined') return {};
            const raw = localStorage.getItem(CACHE_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    };
    const saveCacheToStorage = (cache: Record<string, any>) => {
        try {
            if (typeof window === 'undefined') return;
            localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
        } catch { /* ignore */ }
    };

    const sanitizeOfferForSignature = (offer: any) => {
        if (!offer) return {};
        try {
            const itins = (offer.itineraries || []).map((it: any) => ({
                duration: it.duration,
                segments: (it.segments || []).map((s: any) => ({
                    departure: { iataCode: s.departure?.iataCode, at: s.departure?.at },
                    arrival: { iataCode: s.arrival?.iataCode, at: s.arrival?.at },
                    carrierCode: s.carrierCode, number: s.number, aircraft: s.aircraft?.code
                }))
            }));
            return {
                id: offer.id ?? null,
                price: offer.price ? { total: offer.price.total, currency: offer.price.currency } : null,
                numberOfBookableSeats: offer.numberOfBookableSeats ?? null,
                itineraries: itins,
                lastTicketingDate: offer.lastTicketingDate ?? null
            };
        } catch {
            return {};
        }
    };

    const djb2Hex = (str: string) => {
        let h = 5381;
        for (let i = 0; i < str.length; i++) {
            h = ((h << 5) + h) + str.charCodeAt(i);
            h = h & 0xffffffff;
        }
        return (h >>> 0).toString(16).padStart(8, '0');
    };

    const computeSignatureForPayload = (payload: any) => {
        try {
            const cleaned = sanitizeOfferForSignature(payload);
            const s = JSON.stringify(cleaned);
            return djb2Hex(s);
        } catch {
            return null;
        }
    };

    const fetchAmadeusTokenSimple = async () => {
        const tokenRes = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: process.env.NEXT_PUBLIC_AMADEUS_CLIENT_ID || '',
                client_secret: process.env.NEXT_PUBLIC_AMADEUS_CLIENT_SECRET || ''
            })
        });
        const tokenJson = await tokenRes.json();
        return tokenJson.access_token;
    };

    const constructFallbackOfferForPage = (flight: any) => {
        const depDate = flight.departure?.date || '';
        const arrDate = flight.arrival?.date || '';
        return {
            type: 'flight-offer',
            id: String(flight.id),
            source: 'TEST',
            numberOfBookableSeats: flight.availableSeats ?? 0,
            itineraries: [
                {
                    duration: `PT0H0M`,
                    segments: [
                        {
                            departure: {
                                iataCode: flight.departure?.airport || flight.departure?.city || '',
                                at: depDate && flight.departure?.time ? `${depDate}T${flight.departure.time}:00` : undefined
                            },
                            arrival: {
                                iataCode: flight.arrival?.airport || flight.arrival?.city || '',
                                at: arrDate && flight.arrival?.time ? `${arrDate}T${flight.arrival.time}:00` : undefined
                            },
                            carrierCode: flight.airlineCode || (flight.airline ? String(flight.airline).slice(0, 2).toUpperCase() : 'XX'),
                            number: flight.flightNumber?.replace(/\D/g, '') || '0',
                            aircraft: { code: '' }
                        }
                    ]
                }
            ],
            price: {
                currency: flight.currency || 'VND',
                total: String(flight.price ?? 0)
            }
        };
    };

    // const handlePriceOfferSingle = async (flight: any) => {
    //     if (!flight) return null;
    //     const flightOfferPayload = flight.raw ? flight.raw : constructFallbackOfferForPage(flight);
    //     const key = String(flight.id ?? flightOfferPayload.id ?? 'unknown');
    //     const signature = computeSignatureForPayload(flightOfferPayload);

    //     // check cache
    //     try {
    //         const stored = loadCacheFromStorage();
    //         if (stored && stored.pricing && stored.pricing[key] && stored.signatures && signature && stored.signatures[key] === signature) {
    //             console.log(`[pricing-cache] hit for key=${key}`);
    //             return { fromCache: true, key, signature, pricing: stored.pricing[key], seatmap: stored.seatmap?.[key] ?? null };
    //         }
    //     } catch (e) {
    //         console.warn('Cache read error', e);
    //     }

    //     // not cached or signature mismatch -> fetch pricing + seatmap and persist
    //     try {
    //         const token = await fetchAmadeusTokenSimple();
    //         if (!token) throw new Error('No access token from Amadeus');

    //         const pricingBody = { data: { type: 'flight-offers-pricing', flightOffers: [flightOfferPayload] } };
    //         const includeList = ['credit-card-fees', 'bags', 'other-services', 'detailed-fare-rules'];
    //         const forceClass = true;
    //         const pricingUrl = `https://test.api.amadeus.com/v1/shopping/flight-offers/pricing?include=${encodeURIComponent(includeList.join(','))}&forceClass=${forceClass}`;
    //         const pricingRes = await fetch(pricingUrl, {
    //             method: 'POST',
    //             headers: {
    //                 Authorization: `Bearer ${token}`,
    //                 'Content-Type': 'application/vnd.amadeus+json'
    //             },
    //             body: JSON.stringify(pricingBody)
    //         });
    //         const pricingJson = await pricingRes.json();

    //         const seatmapBody = { data: [flightOfferPayload] };
    //         const seatmapUrl = 'https://test.api.amadeus.com/v1/shopping/seatmaps';
    //         const seatRes = await fetch(seatmapUrl, {
    //             method: 'POST',
    //             headers: {
    //                 Authorization: `Bearer ${token}`,
    //                 'Content-Type': 'application/vnd.amadeus+json'
    //             },
    //             body: JSON.stringify(seatmapBody)
    //         });
    //         const seatJson = await seatRes.json();
    //         const normalizedSeat = Array.isArray(seatJson) ? seatJson[0] : (seatJson?.data?.[0] ?? seatJson);

    //         // persist into localStorage cache (merge with existing)
    //         try {
    //             const existing = loadCacheFromStorage();
    //             const merged = {
    //                 pricing: { ...(existing.pricing || {}), [key]: pricingJson },
    //                 seatmap: { ...(existing.seatmap || {}), [key]: normalizedSeat },
    //                 signatures: { ...(existing.signatures || {}), [key]: signature ?? null },
    //                 ts: Date.now()
    //             };
    //             saveCacheToStorage(merged);
    //             console.log(`[pricing-cache] saved for key=${key}`);
    //         } catch (e) {
    //             console.warn('Cache write error', e);
    //         }

    //         return { fromCache: false, key, signature, pricing: pricingJson, seatmap: normalizedSeat };
    //     } catch (err) {
    //         console.error('Pricing/Seatmap error', err);
    //         return null;
    //     }
    // };
    const handlePriceOfferSingle = async (flight: any) => {
        if (!flight) return null;
        const flightOfferPayload = flight.raw ? flight.raw : constructFallbackOfferForPage(flight);
        const signature = computeSignatureForPayload(flightOfferPayload);
        const key = makePricingCacheKey(flightOfferPayload, flight.id);

        // Kiểm tra cache
        try {
            const stored = loadCacheFromStorage();
            if (stored && stored.pricing && stored.pricing[key] && stored.signatures && signature && stored.signatures[key] === signature) {
                console.log(`[pricing-cache] HIT: Tìm thấy dữ liệu trong cache cho key=${key} signature=${signature}`);
                return { fromCache: true, key, signature, pricing: stored.pricing[key], seatmap: stored.seatmap?.[key] ?? null };
            } else {
                console.log(`[pricing-cache] MISS: Không tìm thấy hoặc cache không hợp lệ cho key=${key} signature=${signature}, tiến hành fetch API`);
            }
        } catch (e) {
            console.warn('[pricing-cache] Lỗi khi đọc cache', e);
        }

        // Fetch API nếu cache miss
        try {
            console.log(`[pricing-cache] Bắt đầu fetch pricing/seatmap cho key=${key} signature=${signature}`);
            const token = await fetchAmadeusTokenSimple();
            if (!token) throw new Error('No access token from Amadeus');

            const pricingBody = { data: { type: 'flight-offers-pricing', flightOffers: [flightOfferPayload] } };
            const includeList = ['credit-card-fees', 'bags', 'other-services', 'detailed-fare-rules'];
            const forceClass = true;
            const pricingUrl = `https://test.api.amadeus.com/v1/shopping/flight-offers/pricing?include=${encodeURIComponent(includeList.join(','))}&forceClass=${forceClass}`;
            const pricingRes = await fetch(pricingUrl, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/vnd.amadeus+json'
                },
                body: JSON.stringify(pricingBody)
            });
            const pricingJson = await pricingRes.json();

            const seatmapBody = { data: [flightOfferPayload] };
            const seatmapUrl = 'https://test.api.amadeus.com/v1/shopping/seatmaps';
            const seatRes = await fetch(seatmapUrl, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/vnd.amadeus+json'
                },
                body: JSON.stringify(seatmapBody)
            });
            const seatJson = await seatRes.json();
            const normalizedSeat = Array.isArray(seatJson) ? seatJson[0] : (seatJson?.data?.[0] ?? seatJson);

            // Lưu vào cache
            try {
                const existing = loadCacheFromStorage();
                const merged = {
                    pricing: { ...(existing.pricing || {}), [key]: pricingJson },
                    seatmap: { ...(existing.seatmap || {}), [key]: normalizedSeat },
                    signatures: { ...(existing.signatures || {}), [key]: signature ?? null },
                    ts: Date.now()
                };
                saveCacheToStorage(merged);
                console.log(`[pricing-cache] LƯU: Đã lưu dữ liệu mới vào cache cho key=${key} signature=${signature}`);
            } catch (e) {
                console.warn('[pricing-cache] Lỗi khi lưu cache', e);
            }

            return { fromCache: false, key, signature, pricing: pricingJson, seatmap: normalizedSeat };
        } catch (err) {
            console.error('[pricing-cache] Lỗi khi fetch pricing/seatmap', err);
            return null;
        }
    };
    // handler cho nút "Tiếp tục" (roundtrip) - gọi pricing/seatmap cho cả outbound + inbound
    const handleContinueClick = async () => {
        try {
            if (!selectedOutbound || !selectedInbound) {
                console.warn('Outbound or inbound missing, nothing to price');
                return;
            }
            setPricingLoadingRT(true);
            console.log('Start pricing both legs...');
            const outRes = await handlePriceOfferSingle(selectedOutbound);
            console.log('Outbound pricing result:', outRes);
            const inRes = await handlePriceOfferSingle(selectedInbound);
            console.log('Inbound pricing result:', inRes);
            console.log('Both legs processed.');

            // --- NEW: when both legs priced, create a combined wrapper cache entry and navigate to detail page ---
            try {
                if (outRes && inRes && outRes.key && inRes.key) {
                    // Compose combined id using separator "__"
                    const combinedKey = `${outRes.key}__${inRes.key}`;

                    // load existing cache and add a small wrapper entry referencing both pricing keys
                    const existing = loadCacheFromStorage() || {};
                    existing.pricing = existing.pricing || {};
                    // do not duplicate existing keys; store lightweight wrapper object
                    existing.pricing[combinedKey] = {
                        wrapper: true,
                        outboundKey: outRes.key,
                        inboundKey: inRes.key,
                        ts: Date.now()
                    };
                    saveCacheToStorage(existing);
                    console.log('[pricing-cache] saved roundtrip wrapper for', combinedKey);

                    // navigate to detail page for this combined key (detail page will detect wrapper and load both legs)
                    router.push(`/ve-may-bay/${encodeURIComponent(combinedKey)}`);
                }
            } catch (e) {
                console.warn('[pricing-cache] failed to save combined wrapper or navigate', e);
            }
        } finally {
            setPricingLoadingRT(false);
        }
    };

    // Helper: parse refundable value from traveler or offer objects.
    // Returns { amount: number | null, raw: string | null }
    const parseRefundable = (obj: any) => {
        if (!obj) return { amount: null, raw: null };
        const cand = obj?.price?.refundableTaxes ?? obj?.price?.refundableTaxesAmount ?? obj?.refundableTaxes ?? obj?.refundableTaxesAmount ?? null;
        if (cand == null) return { amount: null, raw: null };
        const raw = cand;
        const num = Number(String(cand).replace(/[^\d.-]/g, ''));
        if (Number.isFinite(num) && num !== 0) return { amount: num, raw: String(raw) };
        if (String(raw).trim() !== '') return { amount: Number.isFinite(num) ? num : 0, raw: String(raw) };
        return { amount: null, raw: null };
    };

    // New helper: safely read "included" objects that may live at pricing.included or pricing.data.included
    const getIncluded = (pricing: any, key: string) => {
        if (!pricing) return undefined;
        if (pricing.included && pricing.included[key]) return pricing.included[key];
        if (pricing.data && pricing.data.included && pricing.data.included[key]) return pricing.data.included[key];
        return undefined;
    };

    // Helper: detect whether any refundable amount exists (traveler-level, offer-level or policy fallback)
    const detectAnyRefundable = (pricing: any, offer: any, flightObj: any) => {
        try {
            const travelerPricings = offer?.travelerPricings ?? [];
            if (Array.isArray(travelerPricings) && travelerPricings.length > 0) {
                for (const t of travelerPricings) {
                    const pr = parseRefundable(t);
                    if (pr.amount != null && pr.amount > 0) return true;
                }
            }
            const po = parseRefundable(offer);
            if (po.amount != null && po.amount > 0) return true;
            const policy = pricing?.data?.policies ?? pricing?.policies ?? flightObj?.policies ?? {};
            if (policy?.cancellable) return true;
            return false;
        } catch (e) {
            return false;
        }
    };

    // Helper: detect whether fare rules allow changes (look into included detailed-fare-rules PENALTIES text)
    const detectChangeable = (pricing: any, offer: any) => {
        try {
            const included = pricing?.included ?? pricing?.data?.included ?? {};
            const detailedFareRules = included?.['detailed-fare-rules'] ?? {};
            const travelerPricings = offer?.travelerPricings ?? [];
            const fareBasis = travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.fareBasis ?? travelerPricings?.[0]?.fareBasis ?? null;
            const rule = Object.values(detailedFareRules).find((fr: any) => (fareBasis && fr?.fareBasis === fareBasis) || !!fr);
            const penalty = (rule as any)?.fareNotes?.descriptions?.find((desc: any) => desc.descriptionType === 'PENALTIES');
            if (!penalty?.text) return false;
            const txt = String(penalty.text).toUpperCase();
            return txt.includes('CHANGE') || txt.includes('CHANGES ANY TIME') || txt.includes('CHANGES');
        } catch (e) {
            return false;
        }
    };
    const cacheInit = (() => {
        try {
            const full = loadCacheFromStorage();
            return {
                pricing: full.pricing || {},
                seatmap: full.seatmap || {},
                signatures: full.signatures || {}
            };
        } catch {
            return { pricing: {}, seatmap: {}, signatures: {} };
        }
    })();
    const [seatmapByFlight, setSeatmapByFlight] = useState<Record<string, any>>(cacheInit.seatmap);
    // state for signatures per flight
    const [signaturesByFlight, setSignaturesByFlight] = useState<Record<string, string | null>>(cacheInit.signatures);
    // --- NEW: populate state from cache for a given key ---
    const populateFromCache = (key: string) => {
        try {
            const stored = loadCacheFromStorage();
            if (!stored) return false;
            if (stored.pricing && stored.pricing[key]) {
                setPricingByFlight(prev => ({ ...prev, [key]: stored.pricing[key] }));
            }
            if (stored.seatmap && stored.seatmap[key]) {
                setSeatmapByFlight(prev => ({ ...prev, [key]: stored.seatmap[key] }));
                setSeatmapData(stored.seatmap[key]);
            }
            setSeatmapDeckIndex(0);
            setSelectedSeat(null);
            setSeatmapOpenForFlightId(key);
            setSignaturesByFlight(prev => ({ ...prev, [key]: stored.signatures?.[key] }));
            return true;
        } catch (e) {
            console.warn('populateFromCache error', e);
            return false;
        }
    };
    const shouldUseLocalAmenities = (flight: any) => {
        try {
            const raw = flight?.raw ?? null;
            const hasAmenities = Boolean(flight?.amenities || raw?.amenities);
            const hasPolicies = Boolean(flight?.policies || raw?.policies);
            // If the flight (or embedded raw payload) already contains amenities or policies,
            // use the local data and skip the remote pricing/seatmap call. Otherwise fetch.
            return hasAmenities || hasPolicies;
        } catch {
            return false;
        }
    };
    // Thêm trạng thái mới
    const [pendingExpandFlight, setPendingExpandFlight] = useState<string | null>(null);
    const [showEmptyDebounce, setShowEmptyDebounce] = useState(false);
    useEffect(() => {
        let t: any = null;
        if (hasSearched && allFlights.length === 0) {
            setShowEmptyDebounce(true);
            t = setTimeout(() => setShowEmptyDebounce(false), 1500);
        } else {
            setShowEmptyDebounce(false);
        }
        return () => { if (t) clearTimeout(t); };
    }, [hasSearched, allFlights.length]);

    // base API (config bằng NEXT_PUBLIC_API_BASE hoặc fallback)
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
    // Thêm state cho promotions
    const [promotions, setPromotions] = useState<any[]>([]);
    const [promotionsLoading, setPromotionsLoading] = useState(false);
    const [promotionsError, setPromotionsError] = useState<string | null>(null);

    useEffect(() => {
        // load promotions applicable to flights
        const loadPromos = async () => {
            try {
                setPromotionsLoading(true);
                setPromotionsError(null);
                const url = `${API_BASE}/api/promotions?status=active&appliesTo=flights&page=1&pageSize=10`;
                const r = await fetch(url);
                if (!r.ok) {
                    const text = await r.text().catch(() => '');
                    throw new Error(`Server lỗi ${r.status}${text ? `: ${text}` : ''}`);
                }
                const json = await r.json();
                const list = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
                setPromotions(list);
            } catch (err: any) {
                setPromotions([]);
                setPromotionsError(String(err?.message || err || 'Không thể tải khuyến mãi'));
            } finally {
                setPromotionsLoading(false);
            }
        };
        loadPromos();
    }, [API_BASE]);
    return (
        <>
            {isLoading && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60">
                    <div className="bg-white/95 rounded-lg p-6 flex flex-col items-center gap-4 shadow-lg max-w-xs mx-4">
                        <img src="/flight_loading_vikas-singh.gif" alt="Đang tìm chuyến bay" className="w-36 h-36 object-contain" />
                        <div className="text-center">
                            <div className="font-semibold text-lg">Đang tìm chuyến bay ...</div>
                            <div className="text-sm text-[hsl(var(--muted-foreground))] mt-1">Vui lòng đợi trong giây lát…</div>
                        </div>
                    </div>
                </div>
            )}
            {/* Search Section */}
            <div className="relative min-h-[480px]" style={{ backgroundImage: 'url(./banner-may-bay.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>

                <div className="container">

                    <div className="absolute inset-x-0 top-[calc(100%/1.3)] -translate-y-1/2">
                        <div className="w-full max-w-6xl mx-auto" style={{
                            background: 'linear-gradient(90deg, rgba(0,17,30,0.6) 0%, rgba(0,0,0,0) 100%)',
                            paddingBottom: '7px', paddingLeft: '18px', marginBottom: '-10px', borderTopLeftRadius: '10px'

                        }}>
                            <h1 className="pt-4 text-2xl lg:text-3xl font-bold mb-2 text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.1)]">
                                Tìm vé máy bay
                            </h1>
                            <p className="font-bold mb-2 text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.1)]">Đặt vé máy bay nội địa với giá tốt nhất</p>
                        </div>
                        <SearchTabs onSearch={handleSearch} activeTab="flight" />
                    </div>
                </div>
            </div>

            {/* Vouchers & Promotions Section */}
            <section className={`pt-16 py-8 bg-gray-50 ${hasSearched && !showPromotions ? 'hidden' : ''}`}>
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
                            {promotionsLoading ? (
                                [0, 1, 2].map(i => (
                                    <Card key={i} className="animate-pulse">
                                        <CardContent className="p-4">
                                            <div className="h-6 w-24 bg-gray-200 rounded mb-2" />
                                            <div className="h-4 w-40 bg-gray-200 rounded mb-2" />
                                            <div className="h-3 w-20 bg-gray-200 rounded" />
                                        </CardContent>
                                    </Card>
                                ))
                            ) : promotionsError ? (
                                <Card className="col-span-3 text-center">
                                    <CardContent>
                                        <div className="text-sm text-red-600 mb-2">Không tải được khuyến mãi</div>
                                        <div className="text-xs text-[hsl(var(--muted-foreground))] mb-3">{promotionsError}</div>
                                        <Button onClick={() => {
                                            setPromotionsError(null);
                                            setPromotionsLoading(true);
                                            fetch(`${API_BASE}/api/promotions?status=active&appliesTo=flights&page=1&pageSize=10`)
                                                .then(r => r.ok ? r.json() : Promise.reject(r))
                                                .catch(e => setPromotionsError(String(e?.message || e)))
                                                .finally(() => setPromotionsLoading(false));
                                        }}>Thử lại</Button>
                                    </CardContent>
                                </Card>
                            ) : promotions.length === 0 ? (
                                <div className="col-span-3 text-sm text-[hsl(var(--muted-foreground))]">Hiện không có khuyến mãi cho chuyến bay</div>
                            ) : (
                                promotions.slice(0, 3).map((p: any, idx: number) => {
                                    const colors = [
                                        'from-red-500 to-pink-500',
                                        'from-blue-500 to-cyan-500',
                                        'from-green-500 to-emerald-500'
                                    ];
                                    const color = colors[idx % colors.length];
                                    return (
                                        <Card key={p.id || p._id || p.code} className={`bg-gradient-to-r ${color} text-white`}>
                                            <CardContent className="p-4">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <div className="text-lg font-bold text-white"><span>Code  : </span> {p.code ?? `PROMO-${p._id?.slice?.(0, 6)}`}</div>
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
                                    )
                                })
                            )}
                        </div>
                    </div>

                    {/* Popular Routes
                    // <div className="mb-8">
                    //     <h2 className="text-xl font-bold mb-4 text-[hsl(var(--primary))]">✈️ Tuyến bay phổ biến</h2>
                    //     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    //         <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleRouteSelect('TP.HCM', 'Hà Nội', '1.690.000₫')}>
                    //             <CardContent className="p-4 text-center">
                    //                 <div className="text-sm font-medium">TP.HCM → Hà Nội</div>
                    //                 <div className="text-xs text-[hsl(var(--muted-foreground))]">từ 1.690.000₫</div>
                    //                 <Badge variant="secondary" className="mt-2 text-xs">Phổ biến</Badge>
                    //             </CardContent>
                    //         </Card>

                    //         <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleRouteSelect('TP.HCM', 'Đà Nẵng', '1.590.000₫')}>
                    //             <CardContent className="p-4 text-center">
                    //                 <div className="text-sm font-medium">TP.HCM → Đà Nẵng</div>
                    //                 <div className="text-xs text-[hsl(var(--muted-foreground))]">từ 1.590.000₫</div>
                    //                 <Badge variant="secondary" className="mt-2 text-xs">Giá tốt</Badge>
                    //             </CardContent>
                    //         </Card>

                    //         <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleRouteSelect('Hà Nội', 'Đà Nẵng', '1.490.000₫')}>
                    //             <CardContent className="p-4 text-center">
                    //                 <div className="text-sm font-medium">Hà Nội → Đà Nẵng</div>
                    //                 <div className="text-xs text-[hsl(var(--muted-foreground))]">từ 1.490.000₫</div>
                    //                 <Badge variant="secondary" className="mt-2 text-xs">Sale 30%</Badge>
                    //             </CardContent>
                    //         </Card>

                    //         <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleRouteSelect('TP.HCM', 'Nha Trang', '1.390.000₫')}>
                    //             <CardContent className="p-4 text-center">
                    //                 <div className="text-sm font-medium">TP.HCM → Nha Trang</div>
                    //                 <div className="text-xs text-[hsl(var(--muted-foreground))]">từ 1.390.000₫</div>
                    //                 <Badge variant="secondary" className="mt-2 text-xs">Hot</Badge>
                    //             </CardContent>
                    //         </Card>
                    //     </div>
                    // </div>

                    {/* Great Deals */}
                    {/* <div className="mb-8">
                        <h2 className="text-xl font-bold mb-4 text-[hsl(var(--primary))]">🔥 Vé máy bay giá tốt</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <Card className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="font-medium">VietJet Air</div>
                                            <div className="text-sm text-[hsl(var(--muted-foreground))]">TP.HCM → Hà Nội</div>
                                        </div>
                                        <Badge variant="destructive">-25%</Badge>
                                    </div>
                                    <div className="text-sm text-[hsl(var(--muted-foreground))] mb-2">06:15 → 08:30</div>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <div className="text-lg font-bold text-[hsl(var(--primary))]">1.690.000₫</div>
                                            <div className="text-xs text-[hsl(var(--muted-foreground))] line-through">2.250.000₫</div>
                                        </div>
                                        <Button size="sm">Chọn</Button>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="font-medium">Bamboo Airways</div>
                                            <div className="text-sm text-[hsl(var(--muted-foreground))]">TP.HCM → Đà Nẵng</div>
                                        </div>
                                        <Badge variant="destructive">-20%</Badge>
                                    </div>
                                    <div className="text-sm text-[hsl(var(--muted-foreground))] mb-2">14:30 → 16:50</div>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <div className="text-lg font-bold text-[hsl(var(--primary))]">1.590.000₫</div>
                                            <div className="text-xs text-[hsl(var(--muted-foreground))] line-through">1.990.000₫</div>
                                        </div>
                                        <Button size="sm">Chọn</Button>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="font-medium">Vietnam Airlines</div>
                                            <div className="text-sm text-[hsl(var(--muted-foreground))]">Hà Nội → Đà Nẵng</div>
                                        </div>
                                        <Badge variant="destructive">-30%</Badge>
                                    </div>
                                    <div className="text-sm text-[hsl(var(--muted-foreground))] mb-2">08:45 → 10:20</div>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <div className="text-lg font-bold text-[hsl(var(--primary))]">1.490.000₫</div>
                                            <div className="text-xs text-[hsl(var(--muted-foreground))] line-through">2.130.000₫</div>
                                        </div>
                                        <Button size="sm">Chọn</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>  */}
                </div>
            </section>

            {/* Toggle Promotions Button */}
            {hasSearched && (
                <section className={hasSearched ? "py-4 bg-white border-b mt-14" : "py-4 bg-white border-b mt-14"}>
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
                                        Ẩn ưu đãi & tuyến phổ biến
                                    </>
                                ) : (
                                    <>
                                        <ChevronDown className="h-4 w-4" />
                                        Hiện ưu đãi & tuyến phổ biến
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </section>
            )}

            {/* Date Selector */}
            {hasSearched && selectedRoute && (
                <section className="py-6 bg-[hsl(var(--blue-50))]">
                    <div className="container">
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold mb-2">
                                {selectedRoute.from} → {selectedRoute.to}
                            </h3>
                            <div className="text-sm text-[hsl(var(--muted-foreground))]">
                                Chọn ngày để xem giá tốt nhất
                            </div>
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {Array.from({ length: 7 }, (_, i) => {
                                const date = new Date();
                                date.setDate(date.getDate() + i);
                                const dateStr = date.toISOString().split('T')[0];
                                const dayName = date.toLocaleDateString('vi-VN', { weekday: 'short' });
                                const dayMonth = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

                                // Mock prices for different dates
                                const prices = ['1.424.000', '1.575.000', '1.151.000', '966.000', '764.000', '1.234.000', '1.456.000'];
                                const price = prices[i] + ' VND';

                                return (
                                    <div
                                        key={dateStr}
                                        onClick={() => setSelectedDate(dateStr)}
                                        className={`flex-shrink-0 p-3 rounded-lg cursor-pointer transition-colors min-w-[120px] text-center ${selectedDate === dateStr
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-white hover:bg-blue-100'
                                            }`}
                                    >
                                        <div className="text-sm font-medium">{dayName} {dayMonth}</div>
                                        <div className="text-xs mt-1">{price}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}

            {/* Results Section */}
            <section className="py-8">
                <div className="container">
                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* Filters Sidebar */}
                        <div className={`lg:w-80 ${showFilters ? 'block' : 'hidden lg:block'}`}>
                            {/* Hiện card chọn chuyến bay nếu là roundtrip */}
                            {/* {roundtripMode && <RoundtripSelectCard />} */}
                            {roundtripMode && (isLoading ? <RoundtripSelectCardSkeleton /> : <RoundtripSelectCard />)}
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
                                                    onValueChange={setPriceRange}
                                                    max={maxPriceBound}
                                                    min={minPriceBound}
                                                    step={20000}
                                                    className="mb-3"
                                                />
                                                <div className="flex justify-between text-sm text-[hsl(var(--muted-foreground))]">
                                                    <span>{formatPrice(priceRange[0])}</span>
                                                    <span>{formatPrice(priceRange[1])}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* <Separator /> */}

                                        {/* Airlines */}
                                        {/* <div>
                                            <Label className="text-sm font-medium mb-3 block text-[hsl(var(--primary))]">Hãng hàng không</Label>
                                            <div className="space-y-3">
                                                {airlines.map((airline) => (
                                                    <div key={airline.code} className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={airline.code}
                                                            checked={selectedAirlines.includes(airline.name)}
                                                            onCheckedChange={(checked) => {
                                                                if (checked) {
                                                                    setSelectedAirlines([...selectedAirlines, airline.name]);
                                                                } else {
                                                                    setSelectedAirlines(selectedAirlines.filter(a => a !== airline.name));
                                                                }
                                                            }}
                                                        />
                                                        <label htmlFor={airline.code} className="text-sm cursor-pointer">
                                                            {airline.name}
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div> */}

                                        <Separator />

                                        {/* Departure Time */}
                                        <div>
                                            <Label className="text-sm font-medium mb-3 block text-[hsl(var(--primary))]">Giờ khởi hành</Label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <Button
                                                    variant={selectedDepartureTime === '06:00-12:00' ? 'default' : 'outline'}
                                                    size="sm"
                                                    className="text-xs"
                                                    onClick={() => setSelectedDepartureTime(selectedDepartureTime === '06:00-12:00' ? '' : '06:00-12:00')}
                                                >
                                                    Sáng sớm<br />06:00 - 12:00
                                                </Button>
                                                <Button
                                                    variant={selectedDepartureTime === '12:00-18:00' ? 'default' : 'outline'}
                                                    size="sm"
                                                    className="text-xs"
                                                    onClick={() => setSelectedDepartureTime(selectedDepartureTime === '12:00-18:00' ? '' : '12:00-18:00')}
                                                >
                                                    Chiều<br />12:00 - 18:00
                                                </Button>
                                                <Button
                                                    variant={selectedDepartureTime === '18:00-24:00' ? 'default' : 'outline'}
                                                    size="sm"
                                                    className="text-xs"
                                                    onClick={() => setSelectedDepartureTime(selectedDepartureTime === '18:00-24:00' ? '' : '18:00-24:00')}
                                                >
                                                    Tối<br />18:00 - 24:00
                                                </Button>
                                                <Button
                                                    variant={selectedDepartureTime === '00:00-06:00' ? 'default' : 'outline'}
                                                    size="sm"
                                                    className="text-xs"
                                                    onClick={() => setSelectedDepartureTime(selectedDepartureTime === '00:00-06:00' ? '' : '00:00-06:00')}
                                                >
                                                    Đêm<br />00:00 - 06:00
                                                </Button>
                                            </div>
                                        </div>

                                        <Separator />

                                        {/* Quick Filters */}
                                        {/* <div>
                                            <Label className="text-sm font-medium mb-3 block text-[hsl(var(--primary))]">Bộ lọc nhanh</Label>
                                            <div className="space-y-2">
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox id="refundable" />
                                                    <label htmlFor="refundable" className="text-sm cursor-pointer">
                                                        Có hoàn hủy
                                                    </label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox id="changeable" />
                                                    <label htmlFor="changeable" className="text-sm cursor-pointer">
                                                        Có thể đổi
                                                    </label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox id="baggage" />
                                                    <label htmlFor="baggage" className="text-sm cursor-pointer">
                                                        Hành lý ký gửi
                                                    </label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox id="wifi" />
                                                    <label htmlFor="wifi" className="text-sm cursor-pointer">
                                                        Có WiFi
                                                    </label>
                                                </div>
                                            </div>
                                        </div> */}
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
                                        {(() => {
                                            const q = searchParams ? Object.fromEntries(searchParams.entries()) : {};
                                            const rawFrom = selectedRoute?.from || q['from'] || q['origin'] || searchForm.from;
                                            const rawTo = selectedRoute?.to || q['to'] || q['destination'] || searchForm.to;
                                            const depIso = selectedDate || q['departureDate'] || q['departure'] || q['date'] || '';
                                            const retIso = q['returnDate'] || q['return'] || '';

                                            // try to show airport codes if form value contains "(CODE)"
                                            const extractCode = (v?: string) => {
                                                if (!v) return '';
                                                const s = String(v);
                                                const m = s.match(/\(([^)]+)\)/);
                                                return m ? m[1] : s;
                                            };
                                            const from = extractCode(rawFrom);
                                            const to = extractCode(rawTo);

                                            if (!hasSearched) {
                                                return ``;
                                            }

                                            // If roundtrip, show only the current leg's header according to tripStep
                                            if (roundtripMode && depIso && retIso) {
                                                if (tripStep === 'outbound') {
                                                    return `Kết quả tìm kiếm cho chuyến bay ${from} → ${to} • ${formatDateReadable(depIso)}`;
                                                } else {
                                                    return `Kết quả tìm kiếm cho chuyến bay ${to} → ${from} • ${formatDateReadable(retIso)}`;
                                                }
                                            }

                                            // Oneway / single date
                                            const dateText = depIso ? ` • ${formatDateReadable(depIso)}` : '';
                                            return `Kết quả tìm kiếm cho chuyến bay ${from} → ${to}${dateText}`;
                                        })()}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="sort" className="text-sm">Sắp xếp:</Label>
                                    <Select value={sortBy} onValueChange={setSortBy}>
                                        <SelectTrigger className="w-[200px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="price-asc">Giá tăng dần</SelectItem>
                                            <SelectItem value="price-desc">Giá giảm dần</SelectItem>
                                            <SelectItem value="departure-asc">Giờ đi sớm nhất</SelectItem>
                                            <SelectItem value="departure-desc">Giờ đi muộn nhất</SelectItem>
                                            <SelectItem value="arrival-desc">Giờ đến muộn nhất</SelectItem>
                                            <SelectItem value="duration">Thời gian bay</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Flight Results */}
                            <div className="space-y-4">
                                {cacheExpired && (
                                    <Card className="mb-4 border-yellow-300 bg-yellow-50">
                                        <CardContent className="p-4 flex items-center justify-between">
                                            <div>
                                                <div className="font-medium">Kết quả tìm kiếm của bạn đã hết hạn</div>
                                                <div className="text-sm text-[hsl(var(--muted-foreground))]">
                                                    Vui lòng làm mới để xem giá và tình trạng sẵn có mới nhất.
                                                </div>
                                            </div>
                                            <div>
                                                <Button onClick={handleRefreshCachedResults}>Làm mới</Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}




                                {isLoading ? (
                                    Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)
                                ) : allFlights.length === 0 ? (
                                    showEmptyDebounce || isLoadingFlights ? (
                                        Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)
                                    ) : hasSearched ? (
                                        <Card className="text-center py-12">
                                            <CardContent>
                                                 <Plane className="h-12 w-12 text-red-500 mx-auto mb-4" />
                                                <h3 className="text-lg font-medium mb-2 text-red-600">Không tìm thấy chuyến bay phù hợp</h3>
                                                <p className="text-red-500 mb-4">
                                                    Vui lòng thử điều chỉnh bộ lọc hoặc thay đổi ngày bay
                                                </p>
                                                <Button variant="outline">Điều chỉnh tìm kiếm</Button>
                                            </CardContent>
                                        </Card>
                                    ) : (
                                        <Card className="text-center py-12">
                                            <CardContent>
                                                <Plane className="h-12 w-12 text-[hsl(var(--muted-foreground))] mx-auto mb-4" />
                                                <h3 className="text-lg font-medium mb-2">Hãy nhập thông tin và tìm kiếm</h3>
                                                <p className="text-[hsl(var(--muted-foreground))] mb-4">
                                                    Sử dụng thanh tìm kiếm ở trên để tìm chuyến bay phù hợp
                                                </p>
                                            </CardContent>
                                        </Card>
                                    )
                                ) : roundtripMode ? (
                                    sortedFlights
                                        .filter(flight => {
                                            if (tripStep === 'outbound') {
                                                if (!selectedRoute) return true;
                                                return flight.departure.city === selectedRoute.from && flight.arrival.city === selectedRoute.to;
                                            } else {
                                                if (!selectedRoute) return true;
                                                return flight.departure.city === selectedRoute.to && flight.arrival.city === selectedRoute.from;
                                            }
                                        })
                                        .map(flight => (
                                            <Card
                                                key={flight.id}
                                                className={`hover:shadow-md transition-shadow ${((tripStep === 'outbound' && selectedOutbound?.id === flight.id) || (tripStep === 'inbound' && selectedInbound?.id === flight.id)) ? 'ring-2 ring-blue-500' : ''}`}
                                                ref={(el: any) => cardRefs.current.set(flight.id, el)}
                                            >
                                                <CardContent className="p-6">
                                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                                        {/* Flight Info */}
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-3">
                                                                <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center">
                                                                    <Plane className="h-4 w-4" />
                                                                </div>
                                                                <div>
                                                                    <div className="font-medium">{flight.airline}</div>
                                                                    <div className="text-sm text-[hsl(var(--muted-foreground))]">
                                                                        {flight.flightNumber} • {flight.aircraft}
                                                                    </div>
                                                                </div>
                                                                {flight.discount && (
                                                                    <Badge variant="destructive">-{flight.discount}%</Badge>
                                                                )}
                                                                {flight.amenities.priority && (
                                                                    <Badge className="bg-purple-100 text-purple-800">Priority</Badge>
                                                                )}
                                                            </div>

                                                            <div className="flex items-center gap-6">
                                                                <div className="text-center">
                                                                    <div className="font-bold text-lg">{flight.departure.time}</div>
                                                                    <div className="text-sm text-[hsl(var(--muted-foreground))]">
                                                                        {flight.departure.airport}
                                                                    </div>
                                                                    <div className="text-xs text-[hsl(var(--muted-foreground))]">
                                                                        {flight.departure.city}
                                                                    </div>
                                                                </div>
                                                                <div className="flex-1 text-center">
                                                                    <div className="text-sm text-[hsl(var(--muted-foreground))] mb-1">
                                                                        {flight.duration}
                                                                    </div>
                                                                    <div className="flex items-center">
                                                                        <div className="flex-1 h-px bg-gray-300"></div>
                                                                        <ArrowRight className="h-4 w-4 mx-2 text-gray-400" />
                                                                        <div className="flex-1 h-px bg-gray-300"></div>
                                                                    </div>
                                                                    <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                                                                        Bay thẳng
                                                                    </div>
                                                                </div>
                                                                <div className="text-center">
                                                                    <div className="font-bold text-lg">{flight.arrival.time}</div>
                                                                    <div className="text-sm text-[hsl(var(--muted-foreground))]">
                                                                        {flight.arrival.airport}
                                                                    </div>
                                                                    <div className="text-xs text-[hsl(var(--muted-foreground))]">
                                                                        {flight.arrival.city}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Quick amenities */}
                                                            <div className="flex items-center gap-4 mt-3">
                                                                {flight.amenities.wifi.available && (
                                                                    <div className="flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))]">
                                                                        <Wifi className="h-3 w-3" />
                                                                        {flight.amenities.wifi.free ? 'WiFi miễn phí' : 'WiFi có phí'}
                                                                    </div>
                                                                )}
                                                                {flight.amenities.meal.included && (
                                                                    <div className="flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))]">
                                                                        <Utensils className="h-3 w-3" />
                                                                        Bữa ăn
                                                                    </div>
                                                                )}
                                                                <div className="flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))]">
                                                                    <Luggage className="h-3 w-3" />
                                                                    {flight.baggage.checkin.weight} • {flight.baggage.checkin.pieces ?? `kiện`}
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-3 mt-3 text-sm text-[hsl(var(--muted-foreground))]">
                                                                <div className="inline-flex items-center gap-1">
                                                                    <span className="px-2 py-1 bg-slate-100 rounded text-xs">
                                                                        {flight.stopsText || 'Bay thẳng'}
                                                                    </span>
                                                                </div>
                                                                <div className="inline-flex items-center gap-1">
                                                                    <span className="text-xs text-muted-foreground">Hạng</span>
                                                                    <div className="px-2 py-0.5 bg-slate-50 rounded text-xs font-medium">
                                                                        {flight.class}
                                                                    </div>
                                                                </div>
                                                                <div className="inline-flex items-center gap-1">
                                                                    <Luggage className="h-3 w-3" />
                                                                    <div className="text-xs">
                                                                        {flight.baggage.checkin?.pieces
                                                                            ? `${flight.baggage.checkin.pieces} kiện`
                                                                            : flight.baggage.checkin?.weight
                                                                                ? `${flight.baggage.checkin.weight}${flight.baggage.checkin.unit ?? ''}`
                                                                                : 'Ký gửi: -'}
                                                                    </div>
                                                                </div>
                                                                <div className="inline-flex items-center gap-1">
                                                                    <div className="text-xs">
                                                                        {flight.baggage?.handbag?.pieces
                                                                            ? `Xách tay: ${flight.baggage.handbag.pieces} kiện`
                                                                            : flight.baggage?.handbag?.weight
                                                                                ? `Xách tay: ${flight.baggage.handbag.weight}${flight.baggage.handbag.unit ?? ''}`
                                                                                : 'Xách tay: Không có thông tin'}
                                                                    </div>
                                                                </div>
                                                                <div className="ml-auto text-right text-xs">
                                                                    <div>
                                                                        Số ghế: <span className="font-medium">{flight.availableSeats ?? '-'}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Price & Action */}
                                                        <div className="lg:text-right space-y-2">
                                                            <div>
                                                                {flight.originalPrice && (
                                                                    <div className="text-sm text-[hsl(var(--muted-foreground))] line-through">
                                                                        {formatPrice(flight.originalPrice)}
                                                                    </div>
                                                                )}
                                                                <div className="text-xl font-bold text-[hsl(var(--primary))]">
                                                                    {formatPrice(flight.price)}
                                                                </div>
                                                                <div className="text-xs text-[hsl(var(--muted-foreground))]">
                                                                    Giá cho 1 khách
                                                                </div>
                                                            </div>
                                                            <div className="space-y-1 text-[hsl(var(--muted-foreground))]">
                                                                <Button
                                                                    className="w-full lg:w-auto"
                                                                    onClick={async () => {
                                                                        const flightOfferPayload = flight.raw ? flight.raw : constructFallbackOfferForPage(flight);
                                                                        const signature = computeSignatureForPayload(flightOfferPayload);
                                                                        const key = makePricingCacheKey(flightOfferPayload, flight.id);
                                                                        setPricingLoadingFor(key, true);
                                                                        const stored = loadCacheFromStorage();
                                                                        const hasCachedAndMatchingSig = stored && stored.pricing && stored.pricing[key] && stored.signatures && signature && stored.signatures[key] === signature;
                                                                        if (hasCachedAndMatchingSig) {
                                                                            populateFromCache(key);
                                                                        } else {
                                                                            await handlePriceOfferSingle(flight);
                                                                            populateFromCache(key);
                                                                        }
                                                                        setPricingLoadingFor(key, false);
                                                                        if (tripStep === 'outbound') {
                                                                            setSelectedOutbound(flight);
                                                                            const q = searchParams ? Object.fromEntries(searchParams.entries()) : {};
                                                                            const returnDate = q['returnDate'] || q['return'];
                                                                            if (returnDate && inboundFlights.length === 0) {
                                                                                await fetchAmadeusOffers();
                                                                            }
                                                                            setTripStep('inbound');
                                                                            setExpandedFlight(null);
                                                                        } else if (tripStep === 'inbound') {
                                                                            setSelectedInbound(flight);
                                                                            setShowReview(true);
                                                                            setExpandedFlight(null);
                                                                        }
                                                                    }}
                                                                    disabled={
                                                                        pricingLoadingByFlight[makePricingCacheKey(flight.raw ? flight.raw : constructFallbackOfferForPage(flight), flight.id)] ||
                                                                        (tripStep === 'outbound' && selectedOutbound?.id === flight.id) ||
                                                                        (tripStep === 'inbound' && selectedInbound?.id === flight.id)
                                                                    }
                                                                >
                                                                    {pricingLoadingByFlight[makePricingCacheKey(flight.raw ? flight.raw : constructFallbackOfferForPage(flight), flight.id)]
                                                                        ? 'Đang lấy thông tin...'
                                                                        : tripStep === 'outbound'
                                                                            ? selectedOutbound?.id === flight.id
                                                                                ? 'Đã chọn'
                                                                                : 'Chọn chuyến đi'
                                                                            : selectedInbound?.id === flight.id
                                                                                ? 'Đã chọn'
                                                                                : 'Chọn chuyến về'}
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={async () => {
                                                                        const flightOfferPayload = flight.raw ? flight.raw : constructFallbackOfferForPage(flight);
                                                                        const signature = computeSignatureForPayload(flightOfferPayload);
                                                                        const key = makePricingCacheKey(flightOfferPayload, flight.id);
                                                                        const opening = expandedFlight !== flight.id;
                                                                        if (opening) {
                                                                            setPendingExpandFlight(key);
                                                                            setPricingLoadingFor(key, true);
                                                                            const stored = loadCacheFromStorage();
                                                                            const hasCachedAndMatchingSig = stored && stored.pricing && stored.pricing[key] && stored.signatures && signature && stored.signatures[key] === signature;
                                                                            if (hasCachedAndMatchingSig) {
                                                                                populateFromCache(key);
                                                                                setExpandedFlight(flight.id);
                                                                                setPendingExpandFlight(null);
                                                                                setPricingLoadingFor(key, false);
                                                                                return;
                                                                            }
                                                                            if (shouldUseLocalAmenities(flight)) {
                                                                                const minimal = { data: flight.raw ?? flightOfferPayload };
                                                                                setPricingByFlight(prev => ({ ...prev, [key]: minimal }));
                                                                                setSignaturesByFlight(prev => ({ ...prev, [key]: signature }));
                                                                            }
                                                                            const res = await handlePriceOfferSingle(flight);
                                                                            if (res) {
                                                                                populateFromCache(res.key);
                                                                            }
                                                                            setExpandedFlight(flight.id);
                                                                            setPendingExpandFlight(null);
                                                                            setPricingLoadingFor(key, false);
                                                                        } else {
                                                                            setExpandedFlight(null);
                                                                            setPendingExpandFlight(null);
                                                                        }
                                                                    }}
                                                                    className="w-full lg:w-auto text-xs"
                                                                >
                                                                    Chi tiết
                                                                    {expandedFlight === flight.id ? (
                                                                        <ChevronUp className="ml-1 h-3 w-3" />
                                                                    ) : (
                                                                        <ChevronDown className="ml-1 h-3 w-3" />
                                                                    )}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Expandable Details with Tabs */}
                                                    {expandedFlight === flight.id && (
                                                        <>
                                                            <Separator className="my-4" />
                                                            {(() => {
                                                                const flightOfferPayload = flight.raw ? flight.raw : constructFallbackOfferForPage(flight);
                                                                const key = makePricingCacheKey(flightOfferPayload, flight.id);
                                                                const isPricingLoading = Boolean(pricingLoadingByFlight[key]);
                                                                return isPricingLoading ? (
                                                                    <div className="my-2">
                                                                        <CardSkeleton />
                                                                    </div>
                                                                ) : (
                                                                    <Tabs defaultValue="details" className="w-full">
                                                                        <TabsList className="grid w-full grid-cols-5">
                                                                            <TabsTrigger
                                                                                value="details"
                                                                                onClick={(e) => e.stopPropagation()}
                                                                            >
                                                                                Chi tiết
                                                                            </TabsTrigger>
                                                                            <TabsTrigger
                                                                                value="benefits"
                                                                                onClick={(e) => e.stopPropagation()}
                                                                            >
                                                                                Lợi ích đi kèm
                                                                            </TabsTrigger>
                                                                            <TabsTrigger
                                                                                value="refund"
                                                                                onClick={(e) => e.stopPropagation()}
                                                                            >
                                                                                Hoàn vé
                                                                            </TabsTrigger>
                                                                            <TabsTrigger
                                                                                value="change"
                                                                                onClick={(e) => e.stopPropagation()}
                                                                            >
                                                                                Đổi lịch
                                                                            </TabsTrigger>
                                                                            <TabsTrigger
                                                                                value="detailsCharge"
                                                                                onClick={(e) => e.stopPropagation()}
                                                                            >
                                                                                Chi tiết vé
                                                                            </TabsTrigger>
                                                                        </TabsList>
                                                                        <div className="mt-4">
                                                                            <TabsContent value="details" className="space-y-4">
                                                                                {(() => {
                                                                                    const pricing = pricingByFlight[key] ?? {};
                                                                                    const seatmap = seatmapByFlight?.[key] ?? seatmapData ?? {};
                                                                                    const offerFromPricing = pricing?.data?.flightOffers?.[0] ?? (Array.isArray(pricing?.data) ? pricing.data[0] : pricing?.data ?? pricing ?? null);
                                                                                    const travelerForDetails = offerFromPricing?.travelerPricings?.[0] ?? offerFromPricing?.travelerPricings?.[0];
                                                                                    const parsedRefundForDetails = parseRefundable(travelerForDetails ?? offerFromPricing);
                                                                                    // const refundForDetails = parsedRefundForDetails.amount != null ? parsedRefundForDetails.raw ?? parsedRefundForDetails.amount : null;
                                                                                    const traveler = pricing?.data?.travelerPricings?.[0] ?? pricing?.travelerPricings?.[0] ?? travelerForDetails;
                                                                                    const fareSeg = traveler?.fareDetailsBySegment?.[0] ?? traveler?.fareDetails?.[0];
                                                                                    const checkedQty = fareSeg?.includedCheckedBags?.quantity ?? flight.baggage?.checkin?.pieces;
                                                                                    const checkedWeight = fareSeg?.includedCheckedBags?.weight ?? flight.baggage?.checkin?.weight;
                                                                                    const cabinQty = fareSeg?.includedCabinBags?.quantity ?? flight.baggage?.handbag?.pieces;
                                                                                    const cabAmenities = seatmap?.aircraftCabinAmenities || {};
                                                                                    const wifiRaw = cabAmenities?.wifi ?? cabAmenities?.seat?.wifi ?? flight.amenities?.wifi;
                                                                                    const wifiInfo = wifiRaw ? (typeof wifiRaw === 'object' ? wifiRaw : { available: !!wifiRaw }) : { available: false };
                                                                                    const mealRaw = cabAmenities?.food ?? cabAmenities?.seat?.food ?? flight.amenities?.meal;
                                                                                    const mealInfo = mealRaw ? (typeof mealRaw === 'object' ? mealRaw : { available: !!mealRaw }) : { included: false, available: false };
                                                                                    const entertainmentRaw = cabAmenities?.seat?.medias ?? cabAmenities?.medias ?? flight.amenities?.entertainment;
                                                                                    const entertainmentInfo = entertainmentRaw ? (Array.isArray(entertainmentRaw) ? { available: entertainmentRaw.length > 0, screens: entertainmentRaw.length } : (typeof entertainmentRaw === 'object' ? entertainmentRaw : { available: !!entertainmentRaw })) : { available: false };
                                                                                    const powerRaw = cabAmenities?.power ?? flight.amenities?.power;
                                                                                    const powerInfo = powerRaw ? (typeof powerRaw === 'object' ? powerRaw : { available: !!powerRaw }) : { available: false };
                                                                                    const includedFareRules = getIncluded(pricing, 'detailed-fare-rules');
                                                                                    const includedBags = getIncluded(pricing, 'bags');
                                                                                    const creditCardFees = getIncluded(pricing, 'credit-card-fees');
                                                                                    const segment = offerFromPricing?.itineraries?.[0]?.segments?.[0] ?? {};
                                                                                    const lastTicketingDate = offerFromPricing?.lastTicketingDate ?? offerFromPricing?.lastTicketingDate ?? null;
                                                                                    const fareTypes = offerFromPricing?.pricingOptions?.fareType ?? offerFromPricing?.pricingOptions?.fareType ?? [];
                                                                                    const validatingAirlines = offerFromPricing?.validatingAirlineCodes ?? offerFromPricing?.validatingAirlineCodes ?? [];
                                                                                    const bookingRequirements = pricing?.data?.bookingRequirements ?? pricing?.bookingRequirements ?? offerFromPricing?.bookingRequirements ?? null;
                                                                                    const fareRuleSnippet = (() => {
                                                                                        try {
                                                                                            if (!includedFareRules) return null;
                                                                                            const firstKey = Object.keys(includedFareRules)[0];
                                                                                            const rule = includedFareRules[firstKey];
                                                                                            const desc = rule?.fareNotes?.descriptions?.[0]?.text ?? rule?.fareNotes?.descriptions?.[0]?.text;
                                                                                            return desc ? (String(desc).slice(0, 1000) + (String(desc).length > 1000 ? '…' : '')) : rule?.name ?? null;
                                                                                        } catch (e) {
                                                                                            return null;
                                                                                        }
                                                                                    })();
                                                                                    return (
                                                                                        <div className="space-y-4">
                                                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                                                                <div>
                                                                                                    <h4 className="font-medium mb-3">Hành lý</h4>
                                                                                                    <div className="space-y-2 text-sm">
                                                                                                        <div className="flex items-center gap-2">
                                                                                                            <Luggage className="h-4 w-4 text-blue-500" />
                                                                                                            <div>
                                                                                                                <div className="font-medium">Xách tay</div>
                                                                                                                <div className="text-muted-foreground">
                                                                                                                    {cabinQty ?? (flight.baggage?.handbag?.pieces ?? '-')}{flight.baggage?.handbag?.unit ?? ''}
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                        <div className="flex items-center gap-2">
                                                                                                            <Luggage className="h-4 w-4 text-green-500" />
                                                                                                            <div>
                                                                                                                <div className="font-medium">Ký gửi</div>
                                                                                                                <div className="text-muted-foreground">
                                                                                                                    {checkedQty ?? checkedWeight ?? '-'}{checkedWeight ? (fareSeg?.includedCheckedBags?.weightUnit ?? flight.baggage?.checkin?.unit ?? '') : ''}
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                        {includedBags && (
                                                                                                            <div className="text-xs text-[hsl(var(--muted-foreground))] mt-2">
                                                                                                                Gói hành lý thêm có thể đặt:
                                                                                                                <div className="mt-1">
                                                                                                                    {Object.keys(includedBags).map((k) => {
                                                                                                                        const b = includedBags[k];
                                                                                                                        return (
                                                                                                                            <div key={k}>
                                                                                                                                {b.name} • {b.quantity ?? '-'} • {b.price?.amount ? `${Number(b.price.amount).toLocaleString()} ${b.price.currencyCode ?? ''}` : 'Miễn phí'}
                                                                                                                            </div>
                                                                                                                        );
                                                                                                                    })}
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        )}
                                                                                                    </div>
                                                                                                </div>
                                                                                                <div>
                                                                                                    <h4 className="font-medium mb-3">Tiện ích</h4>
                                                                                                    <div className="space-y-2 text-sm">
                                                                                                        <div className="flex items-center gap-2">
                                                                                                            <Wifi className="h-4 w-4" />
                                                                                                            <div>
                                                                                                                {wifiInfo.available ? (
                                                                                                                    wifiInfo.free === true || wifiInfo.included === true ? (
                                                                                                                        <div className="text-muted-foreground">WiFi: Miễn phí</div>
                                                                                                                    ) : wifiInfo.price ? (
                                                                                                                        <div className="text-muted-foreground">WiFi: {String(wifiInfo.price)}</div>
                                                                                                                    ) : (
                                                                                                                        <div className="text-muted-foreground">WiFi: Có phí</div>
                                                                                                                    )
                                                                                                                ) : <span className="text-muted-foreground">Không có WiFi</span>}
                                                                                                            </div>
                                                                                                        </div>
                                                                                                        <div className="flex items-center gap-2">
                                                                                                            <Utensils className="h-4 w-4" />
                                                                                                            <div>
                                                                                                                {mealInfo.available || mealInfo.included ? (
                                                                                                                    mealInfo.included === true || mealInfo.free === true ? (
                                                                                                                        <div className="text-muted-foreground">Bữa ăn miễn phí{mealInfo.type ? ` • ${mealInfo.type}` : ''}</div>
                                                                                                                    ) : mealInfo.price ? (
                                                                                                                        <div className="text-muted-foreground">Bữa ăn có phí • {String(mealInfo.price)}</div>
                                                                                                                    ) : (
                                                                                                                        <div className="text-muted-foreground">Bữa ăn có phí</div>
                                                                                                                    )
                                                                                                                ) : <span className="text-muted-foreground">Không có thông tin bữa ăn</span>}
                                                                                                            </div>
                                                                                                        </div>
                                                                                                        {entertainmentInfo.available && (
                                                                                                            <div className="flex items-center gap-2">
                                                                                                                <Tv className="h-4 w-4" />
                                                                                                                <div className="text-muted-foreground">Giải trí • {entertainmentInfo.screens ?? '-'}</div>
                                                                                                            </div>
                                                                                                        )}
                                                                                                        {powerInfo.available && (
                                                                                                            <div className="flex items-center gap-2">
                                                                                                                <Battery className="h-4 w-4" />
                                                                                                                <div className="text-muted-foreground">{powerInfo.powerType ?? (powerInfo.available ? 'Có ổ sạc' : '')}</div>
                                                                                                            </div>
                                                                                                        )}
                                                                                                    </div>
                                                                                                </div>
                                                                                                <div>
                                                                                                    <h4 className="font-medium mb-3">Thông tin chuyến bay</h4>
                                                                                                    <div className="space-y-2 text-sm">
                                                                                                        <div><span className="font-medium">Máy bay:</span> {flight.flightNumber} • {flight.aircraft}</div>
                                                                                                        <div><span className="font-medium">Hạng vé:</span> {(traveler?.fareOption) ?? flight.class}</div>
                                                                                                        <div><span className="font-medium">Còn lại:</span> {offerFromPricing?.numberOfBookableSeats ?? flight.availableSeats ?? (seatmap?.availableSeatsCounters?.[0]?.value) ?? '-'} ghế</div>
                                                                                                        {segment?.co2Emissions && (
                                                                                                            <div><span className="font-medium">CO₂ (ước tính):</span> {segment.co2Emissions.map((c: any) => `${c.weight}${c.weightUnit} (${c.cabin ?? '-'})`).join(', ')}</div>
                                                                                                        )}
                                                                                                        {lastTicketingDate && <div><span className="font-medium">Last ticketing:</span> {lastTicketingDate}</div>}
                                                                                                        {fareTypes.length > 0 && <div><span className="font-medium">Fare type:</span> {fareTypes.join(', ')}</div>}
                                                                                                        {validatingAirlines.length > 0 && <div><span className="font-medium">Validating:</span> {validatingAirlines.join(', ')}</div>}
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                            {bookingRequirements && (
                                                                                                <div>
                                                                                                    <h4 className="font-medium mb-2">Yêu cầu đặt chỗ</h4>
                                                                                                    <div className="text-sm text-[hsl(var(--muted-foreground))]">
                                                                                                        {bookingRequirements.emailAddressRequired ? <div>Yêu cầu email</div> : null}
                                                                                                        {bookingRequirements.mobilePhoneNumberRequired ? <div>Yêu cầu số điện thoại</div> : null}
                                                                                                        {Array.isArray(bookingRequirements.travelerRequirements) && bookingRequirements.travelerRequirements.length > 0 && (
                                                                                                            <div className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                                                                                                                Một số hành khách cần ngày sinh: {bookingRequirements.travelerRequirements.map((r: any) => r.travelerId).join(', ')}
                                                                                                            </div>
                                                                                                        )}
                                                                                                    </div>
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    );
                                                                                })()}
                                                                            </TabsContent>
                                                                            <TabsContent value="benefits" className="space-y-3">
                                                                                <div className="space-y-3">
                                                                                    {(() => {
                                                                                        const key = makePricingCacheKey(flight.raw ? flight.raw : constructFallbackOfferForPage(flight), flight.id);
                                                                                        const p = pricingByFlight[key] ?? {};
                                                                                        const offer = p?.data?.flightOffers?.[0] ?? (Array.isArray(p?.data) ? p.data[0] : (p?.data ?? p ?? null));
                                                                                        const anyRefundable = detectAnyRefundable(p, offer, flight);
                                                                                        const changeable = detectChangeable(p, offer);
                                                                                        return (
                                                                                            <>
                                                                                                <div className="flex items-center gap-3">
                                                                                                    {anyRefundable ? <Shield className="h-5 w-5 text-green-500" /> : <X className="h-5 w-5 text-red-500" />}
                                                                                                    <div className="text-sm font-medium">
                                                                                                        {anyRefundable ? 'Có thể hoàn vé' : 'Không thể hoàn vé'}
                                                                                                    </div>
                                                                                                </div>
                                                                                                <div className="flex items-center gap-3">
                                                                                                    {changeable ? <RefreshCw className="h-5 w-5 text-green-500" /> : <X className="h-5 w-5 text-red-500" />}
                                                                                                    <div className="text-sm font-medium">
                                                                                                        {changeable ? 'Có thể đổi lịch' : 'Không thể đổi lịch'}
                                                                                                    </div>
                                                                                                </div>
                                                                                            </>
                                                                                        );
                                                                                    })()}
                                                                                </div>
                                                                            </TabsContent>
                                                                            <TabsContent value="refund" className="space-y-3">
                                                                                {(() => {
                                                                                    const key = makePricingCacheKey(flight.raw ? flight.raw : constructFallbackOfferForPage(flight), flight.id);
                                                                                    const p = pricingByFlight[key] ?? {};
                                                                                    const offer = p?.data?.flightOffers?.[0] ?? (Array.isArray(p?.data) ? p.data[0] : p?.data ?? p ?? null);
                                                                                    const travelerPricings = offer?.travelerPricings ?? [];
                                                                                    const policy = p?.data?.policies ?? p?.policies ?? flight.policies ?? {};
                                                                                    const anyRefundable = detectAnyRefundable(p, offer, flight);
                                                                                    const refundDeadlineText = (() => {
                                                                                        const keys = [
                                                                                            "refundBeforeDays",
                                                                                            "refundableBeforeDays",
                                                                                            "refundableBeforeHours",
                                                                                            "refundDeadlineHours",
                                                                                            "refundBeforeHours",
                                                                                        ];
                                                                                        for (const k of keys) {
                                                                                            const v = policy?.[k];
                                                                                            if (v != null) {
                                                                                                const num = Number(v);
                                                                                                if (isFinite(num)) {
                                                                                                    if (k.toLowerCase().includes("hour")) {
                                                                                                        const days = Math.ceil(num / 24);
                                                                                                        return `Hoàn trước khoảng ${num} giờ (~${days} ngày)`;
                                                                                                    }
                                                                                                    return `Hoàn trước ${num} ngày`;
                                                                                                }
                                                                                            }
                                                                                        }
                                                                                        return "Hoàn trước 24 giờ (mặc định nếu hãng không cung cấp thông tin cụ thể)";
                                                                                    })();
                                                                                    return (
                                                                                        <div className="space-y-4">
                                                                                            <div className="flex items-center gap-2" style={{ marginBottom: '-7px' }}>
                                                                                                {anyRefundable || policy?.cancellable ? (
                                                                                                    <Shield className="h-5 w-5 text-green-500" />
                                                                                                ) : (
                                                                                                    <X className="h-5 w-5 text-red-500" />
                                                                                                )}
                                                                                                <span className="text-base font-semibold">
                                                                                                    {anyRefundable || policy?.cancellable
                                                                                                        ? "Có thể hoàn vé"
                                                                                                        : "Không thể hoàn vé"}
                                                                                                </span>
                                                                                            </div>
                                                                                            <Tabs defaultValue="policy" className="w-full">
                                                                                                <div className="flex gap-6">
                                                                                                    <TabsList className="flex flex-col w-64 gap-3 bg-transparent border-none shadow-none p-0" style={{ marginTop: '74px' }}>
                                                                                                        <TabsTrigger
                                                                                                            value="policy"
                                                                                                            className="w-full justify-start rounded-lg border text-left px-4 py-3 transition-colors data-[state=active]:border-blue-500 data-[state=active]:font-semibold data-[state=active]:text-black data-[state=active]:bg-white data-[state=inactive]:border-gray-200 data-[state=inactive]:text-gray-700 hover:bg-gray-50"
                                                                                                            onClick={(e) => e.stopPropagation()}
                                                                                                        >
                                                                                                            Chính sách hoàn vé của bạn
                                                                                                        </TabsTrigger>
                                                                                                        <TabsTrigger
                                                                                                            value="estimate"
                                                                                                            className="w-full justify-start rounded-lg border text-left px-4 py-3 transition-colors data-[state=active]:border-blue-500 data-[state=active]:font-semibold data-[state=active]:text-black data-[state=active]:bg-white data-[state=inactive]:border-gray-200 data-[state=inactive]:text-gray-700 hover:bg-gray-50"
                                                                                                            onClick={(e) => e.stopPropagation()}
                                                                                                        >
                                                                                                            Giá trị hoàn lại ước tính
                                                                                                        </TabsTrigger>
                                                                                                        <TabsTrigger
                                                                                                            value="procedure"
                                                                                                            className="w-full justify-start rounded-lg border text-left px-4 py-3 transition-colors data-[state=active]:border-blue-500 data-[state=active]:font-semibold data-[state=active]:text-black data-[state=active]:bg-white data-[state=inactive]:border-gray-200 data-[state=inactive]:text-gray-700 hover:bg-gray-50"
                                                                                                            onClick={(e) => e.stopPropagation()}
                                                                                                        >
                                                                                                            Quy trình hoàn lại vé
                                                                                                        </TabsTrigger>
                                                                                                    </TabsList>
                                                                                                    <div className="flex-1">
                                                                                                        <TabsContent value="policy" className="space-y-2 text-sm">
                                                                                                            <div className="text-[hsl(var(--muted-foreground))] space-y-2">
                                                                                                                <div>Hoàn vé được áp dụng cho:</div>
                                                                                                                <ul className="list-disc pl-5 space-y-1">
                                                                                                                    <li>Tự hủy (thay đổi kế hoạch)</li>
                                                                                                                    <li>Đau ốm (bao gồm dương tính COVID-19)</li>
                                                                                                                    <li>Hãng hàng không hủy chuyến bay</li>
                                                                                                                    <li>Hãng hàng không dời lịch</li>
                                                                                                                    <li>Đặt trùng chuyến</li>
                                                                                                                    <li>Mang thai</li>
                                                                                                                    <li>Hành khách tử vong</li>
                                                                                                                </ul>
                                                                                                                <div className="mt-2">
                                                                                                                    Ghi chú hãng/điều khoản:{" "}
                                                                                                                    {policy?.notes ?? "Không có thông tin bổ sung"}
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        </TabsContent>
                                                                                                        <TabsContent value="estimate" className="space-y-3 text-sm">
                                                                                                            {travelerPricings.length === 0 ? (
                                                                                                                <div className="text-[hsl(var(--muted-foreground))]">
                                                                                                                    Chưa có dữ liệu giá. Bấm &quot;Chọn chuyến bay&quot; để kiểm giá.
                                                                                                                </div>
                                                                                                            ) : (
                                                                                                                <div className="space-y-3">
                                                                                                                    <div className="text-[hsl(var(--muted-foreground))] font-medium">
                                                                                                                        Giá trị hoàn lại ước tính theo từng loại hành khách:
                                                                                                                    </div>
                                                                                                                    <div className="space-y-2">
                                                                                                                        {travelerPricings.map((t: any, idx: number) => {
                                                                                                                            const pr = parseRefundable(t);
                                                                                                                            return (
                                                                                                                                <div key={idx} className="p-3 border rounded-lg shadow-sm bg-white">
                                                                                                                                    <div className="flex items-center justify-between">
                                                                                                                                        <span className="font-semibold">
                                                                                                                                            {t.travelerType ?? `Hành khách ${idx + 1}`}
                                                                                                                                            {t.travelerId ? ` (${t.travelerId})` : ""}
                                                                                                                                        </span>
                                                                                                                                        {t.fareOption && (
                                                                                                                                            <span className="text-xs text-[hsl(var(--muted-foreground))]">
                                                                                                                                                {t.fareOption}
                                                                                                                                            </span>
                                                                                                                                        )}
                                                                                                                                    </div>
                                                                                                                                    <div className="mt-2 text-sm">
                                                                                                                                        • Giá được hoàn ước tính:{" "}
                                                                                                                                        <span className="font-semibold">
                                                                                                                                            {pr.amount != null
                                                                                                                                                ? `${pr.amount.toLocaleString()} ${t?.price?.currency ?? offer?.price?.currency ?? "VND"}`
                                                                                                                                                : "-"}
                                                                                                                                        </span>
                                                                                                                                    </div>
                                                                                                                                </div>
                                                                                                                            );
                                                                                                                        })}
                                                                                                                    </div>
                                                                                                                    <div className="space-y-1">
                                                                                                                        <div className="text-sm">{refundDeadlineText}</div>
                                                                                                                        <div className="text-xs text-[hsl(var(--muted-foreground))] italic">
                                                                                                                            Lưu ý: đây là giá trị ước tính; phí xử lý và chính sách hãng có thể ảnh hưởng số thực tế được hoàn.
                                                                                                                        </div>
                                                                                                                    </div>
                                                                                                                </div>
                                                                                                            )}
                                                                                                        </TabsContent>
                                                                                                        <TabsContent value="procedure" className="space-y-3 text-sm">
                                                                                                            <div className="space-y-2">
                                                                                                                <div className="font-medium">Hướng dẫn quy trình hoàn vé</div>
                                                                                                                <ol className="list-decimal pl-5 space-y-2 text-[hsl(var(--muted-foreground))]">
                                                                                                                    <li>Đăng nhập tài khoản hoặc mở email xác nhận.</li>
                                                                                                                    <li>Kiểm tra chính sách hoàn vé trong “Chi tiết vé”.</li>
                                                                                                                    <li>Liên hệ tổng đài hoặc trang &quot;Quản lý đặt chỗ&quot;.</li>
                                                                                                                    <li>Gửi lý do & chứng từ cần thiết (giấy khám, xác nhận hủy...).</li>
                                                                                                                    <li>Chờ xử lý (thường 7–14 ngày làm việc).</li>
                                                                                                                    <li>Nhận tiền hoàn qua phương thức thanh toán ban đầu hoặc theo thỏa thuận.</li>
                                                                                                                </ol>
                                                                                                            </div>
                                                                                                        </TabsContent>
                                                                                                    </div>
                                                                                                </div>
                                                                                            </Tabs>
                                                                                        </div>
                                                                                    );
                                                                                })()}
                                                                            </TabsContent>
                                                                            <TabsContent value="change" className="space-y-3">
                                                                                {(() => {
                                                                                    const key = makePricingCacheKey(flight.raw ? flight.raw : constructFallbackOfferForPage(flight), flight.id);
                                                                                    const p = pricingByFlight[key] ?? {};
                                                                                    const offer = p?.data?.flightOffers?.[0] ?? (Array.isArray(p?.data) ? p.data[0] : (p?.data ?? p ?? null));
                                                                                    const changeable = detectChangeable(p, offer);
                                                                                    const changeFee = changeable ? '720.000 VND + Chênh lệch giá vé' : 'Không đổi lịch';
                                                                                    return (
                                                                                        <div className="space-y-4">
                                                                                            <div className="flex items-center gap-2">
                                                                                                {changeable ? (
                                                                                                    <RefreshCw className="h-5 w-5 text-green-500" />
                                                                                                ) : (
                                                                                                    <X className="h-5 w-5 text-red-500" />
                                                                                                )}
                                                                                                <span className="text-base font-semibold">
                                                                                                    {changeable ? 'Có thể đổi lịch' : 'Không thể đổi lịch'}
                                                                                                </span>
                                                                                            </div>
                                                                                            <div className="text-sm text-[hsl(var(--muted-foreground))]">
                                                                                                <div>Phí đổi lịch: {changeFee}</div>
                                                                                                {changeable && (
                                                                                                    <div className="mt-2">
                                                                                                        Lưu ý:
                                                                                                        <ul className="list-disc pl-5 space-y-1">
                                                                                                            <li>Phí đổi là 720.000 VND (30 USD) mỗi hành khách, có thể giảm cho trẻ em/em bé.</li>
                                                                                                            <li>Chênh lệch giá vé sẽ được thu thêm nếu hành trình mới có giá cao hơn.</li>
                                                                                                            <li>Liên hệ hãng để xác nhận thời hạn đổi và điều kiện cụ thể.</li>
                                                                                                        </ul>
                                                                                                    </div>
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                })()}
                                                                            </TabsContent>
                                                                            <TabsContent value="detailsCharge" className="space-y-3">
                                                                                {(() => {
                                                                                    const key = makePricingCacheKey(flight.raw ? flight.raw : constructFallbackOfferForPage(flight), flight.id);
                                                                                    const p = pricingByFlight[key] ?? {};
                                                                                    const offer = p?.data?.flightOffers?.[0] ?? (Array.isArray(p?.data) ? p.data[0] : (p?.data ?? p ?? null)) ?? p ?? null;
                                                                                    const travelerPricings = offer?.travelerPricings ?? offer?.travelerPricings ?? [];
                                                                                    const offerPrice = offer?.price ?? null;
                                                                                    const fees = offerPrice?.fees ?? offer?.price?.fees ?? [];
                                                                                    const includedCCFees = getIncluded(p, 'credit-card-fees');
                                                                                    if (!offer || travelerPricings.length === 0) {
                                                                                        return (
                                                                                            <div className="text-sm text-[hsl(var(--muted-foreground))]">
                                                                                                Chưa có thông tin chi tiết giá. Vui lòng bấm &quot;Chọn chuyến bay&quot; để kiểm giá.
                                                                                            </div>
                                                                                        );
                                                                                    }
                                                                                    const currency = offer?.price?.currency ?? travelerPricings[0]?.price?.currency ?? '';
                                                                                    return (
                                                                                        <div className="space-y-3">
                                                                                            {travelerPricings.map((t: any, i: number) => {
                                                                                                const price = t?.price ?? {};
                                                                                                const total = price?.total ?? price?.grandTotal ?? '-';
                                                                                                const base = price?.base ?? '-';
                                                                                                const taxes = price?.taxes ?? [];
                                                                                                const refundableTaxes = price?.refundableTaxes ?? null;
                                                                                                const fareDetails = t?.fareDetailsBySegment ?? [];
                                                                                                return (
                                                                                                    <div key={i} className="p-3 border rounded">
                                                                                                        <div className="flex justify-between items-center">
                                                                                                            <div className="text-sm font-medium">
                                                                                                                {t.travelerType ?? `Hành khách ${i + 1}`} {t.travelerId ? `(${t.travelerId})` : ''}
                                                                                                            </div>
                                                                                                            <div className="text-sm text-[hsl(var(--muted-foreground))]">{t.fareOption ?? ''}</div>
                                                                                                        </div>
                                                                                                        <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                                                                                                            <div>
                                                                                                                <div className="text-xs text-[hsl(var(--muted-foreground))]">Tổng</div>
                                                                                                                <div className="font-semibold">
                                                                                                                    {total !== '-' ? `${Number(total).toLocaleString()} ${currency}` : '-'}
                                                                                                                </div>
                                                                                                            </div>
                                                                                                            <div>
                                                                                                                <div className="text-xs text-[hsl(var(--muted-foreground))]">Giá cơ sở</div>
                                                                                                                <div>{base !== '-' ? `${Number(base).toLocaleString()} ${currency}` : '-'}</div>
                                                                                                            </div>
                                                                                                            <div>
                                                                                                                <div className="text-xs text-[hsl(var(--muted-foreground))]">Thuế & phí</div>
                                                                                                                <div className="text-xs text-[hsl(var(--muted-foreground))]">
                                                                                                                    {taxes.length > 0 ? taxes.map((tx: any) => `${tx.code}:${tx.amount}`).join(', ') : '-'}
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                        {refundableTaxes && (
                                                                                                            <div className="text-xs text-[hsl(var(--muted-foreground))] mt-2">Refundable taxes: {refundableTaxes}</div>
                                                                                                        )}
                                                                                                        <div className="mt-3">
                                                                                                            <div className="text-xs font-medium mb-1">Chi tiết theo segment</div>
                                                                                                            <div className="space-y-1 text-xs text-[hsl(var(--muted-foreground))]">
                                                                                                                {fareDetails.length === 0 && <div>Không có thông tin theo segment.</div>}
                                                                                                                {fareDetails.map((fd: any, idx: number) => (
                                                                                                                    <div key={idx} className="p-2 bg-gray-50 rounded">
                                                                                                                        <div>Segment: <span className="font-medium">{fd.segmentId ?? fd.segment?.id ?? idx}</span></div>
                                                                                                                        <div>Cabin: {fd.cabin ?? '-'}</div>
                                                                                                                        <div>Fare basis: {fd.fareBasis ?? '-'}</div>
                                                                                                                        <div>Class: {fd.class ?? fd.bookingClass ?? '-'}</div>
                                                                                                                        <div>Included checked bags: {fd.includedCheckedBags?.quantity ?? fd.includedCheckedBags?.weight ?? '-'}</div>
                                                                                                                    </div>
                                                                                                                ))}
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                );
                                                                                            })}
                                                                                        </div>
                                                                                    );
                                                                                })()}
                                                                            </TabsContent>
                                                                        </div>
                                                                    </Tabs>
                                                                );
                                                            })()}
                                                        </>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        ))
                                ) : (
                                    <FlightResults
                                        isLoading={isLoading}
                                        sortedFlights={sortedFlights}
                                        hasSearched={hasSearched}
                                        expandedFlight={expandedFlight}
                                        setExpandedFlight={setExpandedFlight}
                                        formatPrice={formatPrice}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Review Side Panel */}
            {roundtripMode && showReview && selectedOutbound && selectedInbound && (
                <div className="fixed inset-0 z-50">
                    {/* overlay: when closing review, clear inbound selection so it's not persisted */}
                    <div className="absolute inset-0 bg-black/30" onClick={() => { setShowReview(false) }} />
                    <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl animate-in slide-in-from-right duration-200">
                        <Card className="flex flex-col h-full space-y-3  ">
                            <CardHeader className="flex flex-row items-center justify-between py-4 px-4">
                                <CardTitle className="text-base">Xem lại chuyến bay của bạn</CardTitle>
                                <Button variant="ghost" size="sm" onClick={() => { setShowReview(false) }}>Đóng</Button>
                            </CardHeader>
                            <CardContent className="flex flex-col h-full space-y-3 px-4 pb-4">
                                {/* OUTBOUND */}
                                <Card className="p-3">
                                    <div className="flex justify-between items-center mb-1">
                                        <div className="text-md font-medium">
                                            <span className='inline-flex items-center px-2 py-1 bg-sky-100 text-sky-700 text-xs font-medium rounded mr-2'>Khởi hành</span>
                                            {selectedOutbound.departure.city} → {selectedOutbound.arrival.city}
                                            {selectedOutbound.departure?.date && (
                                                <span className="text-xs text-[hsl(var(--muted-foreground))]"> • {formatDateReadable(selectedOutbound.departure.date)}</span>
                                            )}
                                        </div>
                                        <button
                                            className="text-[hsl(var(--primary))] text-sm hover:underline"
                                            onClick={() => setShowOutboundDetailsModal(true)}
                                        >
                                            Chi tiết
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded bg-white/70 flex items-center justify-center text-sm font-semibold">
                                                {selectedOutbound.airline.split(' ').map((s: string) => s[0]).slice(0, 2).join('')}
                                            </div>
                                            <div>
                                                <div className="font-medium">{selectedOutbound.airline}</div>
                                                <div className="text-xs text-[hsl(var(--muted-foreground))]">{selectedOutbound.flightNumber} • {selectedOutbound.aircraft}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6 mt-3">
                                        <div className="text-center">
                                            <div className="font-bold text-lg">{selectedOutbound.departure.time}</div>
                                            <div className="text-sm text-[hsl(var(--muted-foreground))]">{selectedOutbound.departure.airport}</div>
                                            <div className="text-xs text-[hsl(var(--muted-foreground))]">{selectedOutbound.departure.city}</div>
                                        </div>

                                        <div className="flex-1 text-center">
                                            <div className="text-sm text-[hsl(var(--muted-foreground))] mb-1">{selectedOutbound.duration}</div>
                                            <div className="flex items-center">
                                                <div className="flex-1 h-px bg-gray-300"></div>
                                                <ArrowRight className="h-4 w-4 mx-2 text-gray-400" />
                                                <div className="flex-1 h-px bg-gray-300"></div>
                                            </div>
                                            <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Bay thẳng</div>
                                        </div>

                                        <div className="text-center">
                                            <div className="font-bold text-lg">{selectedOutbound.arrival.time}</div>
                                            <div className="text-sm text-[hsl(var(--muted-foreground))]">{selectedOutbound.arrival.airport}</div>
                                            <div className="text-xs text-[hsl(var(--muted-foreground))]">{selectedOutbound.arrival.city}</div>
                                        </div>
                                    </div>
                                    {/* Add price display here */}
                                    <div className="mt-2 text-right text font-bold text-orange-600">
                                        Giá tiền : {formatPrice(selectedOutbound.price)}/khách
                                    </div>
                                </Card>

                                {/* INBOUND */}
                                <Card className="p-3">
                                    <div className="flex justify-between items-center mb-1">
                                        <div className="text-sm font-medium">
                                            <span className='inline-flex items-center px-2 py-1 bg-sky-100 text-sky-700 text-md font-medium rounded mr-2'>Chuyến về</span>
                                            {selectedInbound.departure.city} → {selectedInbound.arrival.city}
                                            {selectedInbound.departure?.date && (
                                                <span className="text-xs text-[hsl(var(--muted-foreground))]"> • {formatDateReadable(selectedInbound.departure.date)}</span>
                                            )}
                                        </div>
                                        <button
                                            className="text-[hsl(var(--primary))] text-sm hover:underline"
                                            onClick={() => setShowInboundDetailsModal(true)}
                                        >
                                            Chi tiết
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded bg-white/70 flex items-center justify-center text-sm font-semibold">
                                                {selectedInbound.airline.split(' ').map((s: string) => s[0]).slice(0, 2).join('')}
                                            </div>
                                            <div>
                                                <div className="font-medium">{selectedInbound.airline}</div>
                                                <div className="text-xs text-[hsl(var(--muted-foreground))]">{selectedInbound.flightNumber} • {selectedInbound.aircraft}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6 mt-3">
                                        <div className="text-center">
                                            <div className="font-bold text-lg">{selectedInbound.departure.time}</div>
                                            <div className="text-sm text-[hsl(var(--muted-foreground))]">{selectedInbound.departure.airport}</div>
                                            <div className="text-xs text-[hsl(var(--muted-foreground))]">{selectedInbound.departure.city}</div>
                                        </div>
                                        <div className="flex-1 text-center">
                                            <div className="text-sm text-[hsl(var(--muted-foreground))] mb-1">{selectedInbound.duration}</div>
                                            <div className="flex items-center">
                                                <div className="flex-1 h-px bg-gray-300"></div>
                                                <ArrowRight className="h-4 w-4 mx-2 text-gray-400" />
                                                <div className="flex-1 h-px bg-gray-300"></div>
                                            </div>
                                            <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Bay thẳng</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="font-bold text-lg">{selectedInbound.arrival.time}</div>
                                            <div className="text-sm text-[hsl(var(--muted-foreground))]">{selectedInbound.arrival.airport}</div>
                                            <div className="text-xs text-[hsl(var(--muted-foreground))]">{selectedInbound.arrival.city}</div>
                                        </div>
                                    </div>
                                    {/* Add price display here */}
                                    <div className="mt-2 text-right text font-bold text-orange-600">
                                        Giá tiền : {formatPrice(selectedInbound.price)}/khách
                                    </div>
                                </Card>

                                {/* Tổng giá + nút tiếp tục */}
                                <div className="flex items-center justify-between pt-2 mt-auto border-t">
                                    <div className="text-lg font-bold text-[hsl(var(--primary))]">
                                        Tổng Tiền: {formatPrice(totalRoundtripPrice())}
                                    </div>
                                    <Button
                                        size="lg"
                                        disabled={pricingLoadingRT}
                                        onClick={handleContinueClick}
                                    >
                                        {pricingLoadingRT ? 'Đang tải thông tin' : 'Tiếp tục'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}



            {/* Modal chi tiết chuyến bay đi (Outbound) */}
            {selectedOutbound && showOutboundDetailsModal && (
                <div className="fixed inset-0 z-50">
                    {/* overlay */}
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setShowOutboundDetailsModal(false)}
                    />
                    {/* modal panel */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl p-4">
                        <Card>
                            <CardHeader className="flex items-center justify-between py-3 px-4">
                                <div className="flex items-center gap-2">
                                    <div className="font-semibold">Chi tiết chuyến bay đi</div>
                                    <div className="text-sm text-[hsl(var(--muted-foreground))]">{selectedOutbound.airline}</div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setShowOutboundDetailsModal(false)}>
                                    <X />
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-3 p-4">
                                {(() => {
                                    const flight = selectedOutbound;
                                    const flightOfferPayload = flight.raw ? flight.raw : constructFallbackOfferForPage(flight);
                                    const signature = computeSignatureForPayload(flightOfferPayload);
                                    const key = makePricingCacheKey(flightOfferPayload, flight.id);
                                    const isPricingLoading = Boolean(pricingLoadingByFlight[key]);
                                    if (isPricingLoading) {
                                        return (
                                            <div className="space-y-4 animate-pulse">
                                                <div className="h-6 w-3/4 bg-gray-200 rounded" />
                                                <div className="h-4 w-full bg-gray-200 rounded" />
                                                <div className="h-4 w-2/3 bg-gray-200 rounded" />
                                                <div className="h-20 w-full bg-gray-200 rounded" />
                                            </div>
                                        );
                                    }
                                    return (
                                        <>
                                            <div className='flex justify-between'>
                                                <div className="text-md font-medium mb-3">
                                                    <span className="inline-flex items-center px-2 py-1 bg-sky-100 text-sky-700 text-xs font-medium rounded mr-2">Chuyến đi</span>
                                                    {flight.departure.city} → {flight.arrival.city}
                                                    {flight.departure?.date && (
                                                        <span className="text-xs text-[hsl(var(--muted-foreground))]"> • {formatDateReadable(flight.departure.date)}</span>
                                                    )}
                                                </div>
                                                <div className="text-xl font-bold text-[hsl(var(--primary))]">{formatPrice(flight.price)}/khách</div>
                                            </div>

                                            <div className="flex items-center gap-6 mt-3">
                                                <div className="text-center">
                                                    <div className="font-bold text-lg">{flight.departure.time}</div>
                                                    <div className="text-sm text-[hsl(var(--muted-foreground))]">{flight.departure.airport}</div>
                                                    <div className="text-xs text-[hsl(var(--muted-foreground))]">{flight.departure.city}</div>
                                                </div>
                                                <div className="flex-1 text-center">
                                                    <div className="text-sm text-[hsl(var(--muted-foreground))] mb-1">{flight.duration}</div>
                                                    <div className="flex items-center">
                                                        <div className="flex-1 h-px bg-gray-300"></div>
                                                        <ArrowRight className="h-4 w-4 mx-2 text-gray-400" />
                                                        <div className="flex-1 h-px bg-gray-300"></div>
                                                    </div>
                                                    <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Bay thẳng</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="font-bold text-lg">{flight.arrival.time}</div>
                                                    <div className="text-sm text-[hsl(var(--muted-foreground))]">{flight.arrival.airport}</div>
                                                    <div className="text-xs text-[hsl(var(--muted-foreground))]">{flight.arrival.city}</div>
                                                </div>
                                            </div>

                                            <Tabs defaultValue="details" className="w-full">
                                                <TabsList className="grid w-full grid-cols-5">
                                                    <TabsTrigger
                                                        value="details"
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // NGĂN EVENT BUBBLING
                                                        }}
                                                    >
                                                        Chi tiết
                                                    </TabsTrigger>
                                                    <TabsTrigger
                                                        value="benefits"
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // NGĂN EVENT BUBBLING
                                                        }}
                                                    >
                                                        Lợi ích đi kèm
                                                    </TabsTrigger>
                                                    <TabsTrigger
                                                        value="refund"
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // NGĂN EVENT BUBBLING
                                                        }}
                                                    >
                                                        Hoàn vé
                                                    </TabsTrigger>
                                                    <TabsTrigger
                                                        value="change"
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // NGĂN EVENT BUBBLING
                                                        }}
                                                    >
                                                        Đổi lịch
                                                    </TabsTrigger>
                                                    <TabsTrigger
                                                        value="detailsCharge"
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // NGĂN EVENT BUBBLING
                                                        }}
                                                    >
                                                        Chi tiết vé
                                                    </TabsTrigger>
                                                </TabsList>
                                                <div className="mt-4">
                                                    <TabsContent value="details" className="space-y-4">
                                                        {(() => {
                                                            const pricing = pricingByFlight[key] ?? {};
                                                            const seatmap = seatmapByFlight?.[key] ?? seatmapData ?? {};
                                                            const offerFromPricing = pricing?.data?.flightOffers?.[0] ?? (Array.isArray(pricing?.data) ? pricing.data[0] : pricing?.data ?? pricing ?? null);
                                                            const travelerForDetails = offerFromPricing?.travelerPricings?.[0] ?? offerFromPricing?.travelerPricings?.[0];
                                                            const parsedRefundForDetails = parseRefundable(travelerForDetails ?? offerFromPricing);
                                                            // const refundForDetails = parsedRefundForDetails.amount != null ? parsedRefundForDetails.raw ?? parsedRefundForDetails.amount : null;

                                                            const traveler = pricing?.data?.travelerPricings?.[0] ?? pricing?.travelerPricings?.[0] ?? travelerForDetails;
                                                            const fareSeg = traveler?.fareDetailsBySegment?.[0] ?? traveler?.fareDetails?.[0];
                                                            const checkedQty = fareSeg?.includedCheckedBags?.quantity ?? flight.baggage?.checkin?.pieces;
                                                            const checkedWeight = fareSeg?.includedCheckedBags?.weight ?? flight.baggage?.checkin?.weight;
                                                            const cabinQty = fareSeg?.includedCabinBags?.quantity ?? flight.baggage?.handbag?.pieces;

                                                            const cabAmenities = seatmap?.aircraftCabinAmenities || {};
                                                            const wifiRaw = cabAmenities?.wifi ?? cabAmenities?.seat?.wifi ?? flight.amenities?.wifi;
                                                            const wifiInfo = wifiRaw ? (typeof wifiRaw === 'object' ? wifiRaw : { available: !!wifiRaw }) : { available: false };

                                                            const mealRaw = cabAmenities?.food ?? cabAmenities?.seat?.food ?? flight.amenities?.meal;
                                                            const mealInfo = mealRaw ? (typeof mealRaw === 'object' ? mealRaw : { available: !!mealRaw }) : { included: false, available: false };

                                                            const entertainmentRaw = cabAmenities?.seat?.medias ?? cabAmenities?.medias ?? flight.amenities?.entertainment;
                                                            const entertainmentInfo = entertainmentRaw ? (Array.isArray(entertainmentRaw) ? { available: entertainmentRaw.length > 0, screens: entertainmentRaw.length } : (typeof entertainmentRaw === 'object' ? entertainmentRaw : { available: !!entertainmentRaw })) : { available: false };

                                                            const powerRaw = cabAmenities?.power ?? flight.amenities?.power;
                                                            const powerInfo = powerRaw ? (typeof powerRaw === 'object' ? powerRaw : { available: !!powerRaw }) : { available: false };

                                                            const includedFareRules = getIncluded(pricing, 'detailed-fare-rules');
                                                            const includedBags = getIncluded(pricing, 'bags');
                                                            const creditCardFees = getIncluded(pricing, 'credit-card-fees');

                                                            const segment = offerFromPricing?.itineraries?.[0]?.segments?.[0] ?? {};
                                                            const lastTicketingDate = offerFromPricing?.lastTicketingDate ?? offerFromPricing?.lastTicketingDate ?? null;
                                                            const fareTypes = offerFromPricing?.pricingOptions?.fareType ?? offerFromPricing?.pricingOptions?.fareType ?? [];
                                                            const validatingAirlines = offerFromPricing?.validatingAirlineCodes ?? offerFromPricing?.validatingAirlineCodes ?? [];
                                                            const bookingRequirements = pricing?.data?.bookingRequirements ?? pricing?.bookingRequirements ?? offerFromPricing?.bookingRequirements ?? null;

                                                            const fareRuleSnippet = (() => {
                                                                try {
                                                                    if (!includedFareRules) return null;
                                                                    const firstKey = Object.keys(includedFareRules)[0];
                                                                    const rule = includedFareRules[firstKey];
                                                                    const desc = rule?.fareNotes?.descriptions?.[0]?.text ?? rule?.fareNotes?.descriptions?.[0]?.text;
                                                                    return desc ? (String(desc).slice(0, 1000) + (String(desc).length > 1000 ? '…' : '')) : rule?.name ?? null;
                                                                } catch (e) {
                                                                    return null;
                                                                }
                                                            })();

                                                            return (
                                                                <div className="space-y-4">
                                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                                        <div>
                                                                            <h4 className="font-medium mb-3">Hành lý</h4>
                                                                            <div className="space-y-2 text-sm">
                                                                                <div className="flex items-center gap-2">
                                                                                    <Luggage className="h-4 w-4 text-blue-500" />
                                                                                    <div>
                                                                                        <div className="font-medium">Xách tay</div>
                                                                                        <div className="text-muted-foreground">
                                                                                            {cabinQty ?? (flight.baggage?.handbag?.pieces ?? '-')}{flight.baggage?.handbag?.unit ?? ''}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex items-center gap-2">
                                                                                    <Luggage className="h-4 w-4 text-green-500" />
                                                                                    <div>
                                                                                        <div className="font-medium">Ký gửi</div>
                                                                                        <div className="text-muted-foreground">
                                                                                            {checkedQty ?? checkedWeight ?? '-'}{checkedWeight ? (fareSeg?.includedCheckedBags?.weightUnit ?? flight.baggage?.checkin?.unit ?? '') : ''}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                                {includedBags && (
                                                                                    <div className="text-xs text-[hsl(var(--muted-foreground))] mt-2">
                                                                                        Gói hành lý thêm có thể đặt:
                                                                                        <div className="mt-1">
                                                                                            {Object.keys(includedBags).map((k) => {
                                                                                                const b = includedBags[k];
                                                                                                return (
                                                                                                    <div key={k}>
                                                                                                        {b.name} • {b.quantity ?? '-'} • {b.price?.amount ? `${Number(b.price.amount).toLocaleString()} ${b.price.currencyCode ?? ''}` : 'Miễn phí'}
                                                                                                    </div>
                                                                                                );
                                                                                            })}
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        <div>
                                                                            <h4 className="font-medium mb-3">Tiện ích</h4>
                                                                            <div className="space-y-2 text-sm">
                                                                                <div className="flex items-center gap-2">
                                                                                    <Wifi className="h-4 w-4" />
                                                                                    <div>
                                                                                        {wifiInfo.available ? (
                                                                                            wifiInfo.free === true || wifiInfo.included === true ? (
                                                                                                <div className="text-muted-foreground">WiFi: Miễn phí</div>
                                                                                            ) : wifiInfo.price ? (
                                                                                                <div className="text-muted-foreground">WiFi: {String(wifiInfo.price)}</div>
                                                                                            ) : (
                                                                                                <div className="text-muted-foreground">WiFi: Có phí</div>
                                                                                            )
                                                                                        ) : <span className="text-muted-foreground">Không có WiFi</span>}
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex items-center gap-2">
                                                                                    <Utensils className="h-4 w-4" />
                                                                                    <div>
                                                                                        {mealInfo.available || mealInfo.included ? (
                                                                                            mealInfo.included === true || mealInfo.free === true ? (
                                                                                                <div className="text-muted-foreground">Bữa ăn miễn phí{mealInfo.type ? ` • ${mealInfo.type}` : ''}</div>
                                                                                            ) : mealInfo.price ? (
                                                                                                <div className="text-muted-foreground">Bữa ăn có phí • {String(mealInfo.price)}</div>
                                                                                            ) : (
                                                                                                <div className="text-muted-foreground">Bữa ăn có phí</div>
                                                                                            )
                                                                                        ) : <span className="text-muted-foreground">Không có thông tin bữa ăn</span>}
                                                                                    </div>
                                                                                </div>
                                                                                {entertainmentInfo.available && (
                                                                                    <div className="flex items-center gap-2">
                                                                                        <Tv className="h-4 w-4" />
                                                                                        <div className="text-muted-foreground">Giải trí • {entertainmentInfo.screens ?? '-'}</div>
                                                                                    </div>
                                                                                )}
                                                                                {powerInfo.available && (
                                                                                    <div className="flex items-center gap-2">
                                                                                        <Battery className="h-4 w-4" />
                                                                                        <div className="text-muted-foreground">{powerInfo.powerType ?? (powerInfo.available ? 'Có ổ sạc' : '')}</div>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        <div>
                                                                            <h4 className="font-medium mb-3">Thông tin chuyến bay</h4>
                                                                            <div className="space-y-2 text-sm">
                                                                                <div><span className="font-medium">Máy bay:</span>
                                                                                    {/* {seatmap?.aircraft?.code ?? segment?.aircraft?.code ?? flight.aircraft} */}
                                                                                    {flight.flightNumber} • {flight.aircraft}
                                                                                </div>
                                                                                <div><span className="font-medium">Hạng vé:</span> {(traveler?.fareOption) ?? flight.class}</div>
                                                                                <div><span className="font-medium">Còn lại:</span> {offerFromPricing?.numberOfBookableSeats ?? flight.availableSeats ?? (seatmap?.availableSeatsCounters?.[0]?.value) ?? '-'} ghế</div>
                                                                                {segment?.co2Emissions && (
                                                                                    <div><span className="font-medium">CO₂ (ước tính):</span> {segment.co2Emissions.map((c: any) => `${c.weight}${c.weightUnit} (${c.cabin ?? '-'})`).join(', ')}</div>
                                                                                )}
                                                                                {lastTicketingDate && <div><span className="font-medium">Last ticketing:</span> {lastTicketingDate}</div>}
                                                                                {fareTypes.length > 0 && <div><span className="font-medium">Fare type:</span> {fareTypes.join(', ')}</div>}
                                                                                {validatingAirlines.length > 0 && <div><span className="font-medium">Validating:</span> {validatingAirlines.join(', ')}</div>}
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* {fareRuleSnippet && (
                                                                        <div>
                                                                            <h4 className="font-medium mb-2">Tóm tắt điều khoản vé</h4>
                                                                            <div className="text-sm text-[hsl(var(--muted-foreground))] whitespace-pre-wrap">
                                                                                {fareRuleSnippet}
                                                                            </div>
                                                                        </div>
                                                                    )} */}

                                                                    {bookingRequirements && (
                                                                        <div>
                                                                            <h4 className="font-medium mb-2">Yêu cầu đặt chỗ</h4>
                                                                            <div className="text-sm text-[hsl(var(--muted-foreground))]">
                                                                                {bookingRequirements.emailAddressRequired ? <div>Yêu cầu email</div> : null}
                                                                                {bookingRequirements.mobilePhoneNumberRequired ? <div>Yêu cầu số điện thoại</div> : null}
                                                                                {Array.isArray(bookingRequirements.travelerRequirements) && bookingRequirements.travelerRequirements.length > 0 && (
                                                                                    <div className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                                                                                        Một số hành khách cần ngày sinh: {bookingRequirements.travelerRequirements.map((r: any) => r.travelerId).join(', ')}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })()}
                                                    </TabsContent>

                                                    <TabsContent value="benefits" className="space-y-3">
                                                        <div className="space-y-3">
                                                            {(() => {
                                                                const p = pricingByFlight[key] ?? {};
                                                                const offer = p?.data?.flightOffers?.[0] ?? (Array.isArray(p?.data) ? p.data[0] : (p?.data ?? p ?? null));
                                                                const anyRefundable = detectAnyRefundable(p, offer, flight);
                                                                const changeable = detectChangeable(p, offer);

                                                                return (
                                                                    <>
                                                                        <div className="flex items-center gap-3">
                                                                            {anyRefundable ? <Shield className="h-5 w-5 text-green-500" /> : <X className="h-5 w-5 text-red-500" />}
                                                                            <div className="text-sm font-medium">
                                                                                {anyRefundable ? 'Có thể hoàn vé' : 'Không thể hoàn vé'}
                                                                            </div>
                                                                        </div>

                                                                        <div className="flex items-center gap-3">
                                                                            {changeable ? <RefreshCw className="h-5 w-5 text-green-500" /> : <X className="h-5 w-5 text-red-500" />}
                                                                            <div className="text-sm font-medium">
                                                                                {changeable ? 'Có thể đổi lịch' : 'Không thể đổi lịch'}
                                                                            </div>
                                                                        </div>
                                                                    </>
                                                                );
                                                            })()}
                                                        </div>
                                                    </TabsContent>

                                                    <TabsContent value="refund" className="space-y-3">
                                                        {(() => {
                                                            const p = pricingByFlight[key] ?? {};
                                                            const offer = p?.data?.flightOffers?.[0] ?? (Array.isArray(p?.data) ? p.data[0] : p?.data ?? p ?? null);
                                                            const travelerPricings = offer?.travelerPricings ?? [];
                                                            const policy = p?.data?.policies ?? p?.policies ?? flight.policies ?? {};
                                                            const anyRefundable = detectAnyRefundable(p, offer, flight);
                                                            const refundDeadlineText = (() => {
                                                                const keys = [
                                                                    "refundBeforeDays",
                                                                    "refundableBeforeDays",
                                                                    "refundableBeforeHours",
                                                                    "refundDeadlineHours",
                                                                    "refundBeforeHours",
                                                                ];
                                                                for (const k of keys) {
                                                                    const v = policy?.[k];
                                                                    if (v != null) {
                                                                        const num = Number(v);
                                                                        if (isFinite(num)) {
                                                                            if (k.toLowerCase().includes("hour")) {
                                                                                const days = Math.ceil(num / 24);
                                                                                return `Hoàn trước khoảng ${num} giờ (~${days} ngày)`;
                                                                            }
                                                                            return `Hoàn trước ${num} ngày`;
                                                                        }
                                                                    }
                                                                }
                                                                return "Hoàn trước 24 giờ (mặc định nếu hãng không cung cấp thông tin cụ thể)";
                                                            })();

                                                            return (
                                                                <div className="space-y-4">
                                                                    {/* Trạng thái hoàn vé */}
                                                                    <div className="flex items-center gap-2" style={{ marginBottom: '-7px' }}>
                                                                        {anyRefundable || policy?.cancellable ? (
                                                                            <Shield className="h-5 w-5 text-green-500" />
                                                                        ) : (
                                                                            <X className="h-5 w-5 text-red-500" />
                                                                        )}
                                                                        <span className="text-base font-semibold">
                                                                            {anyRefundable || policy?.cancellable
                                                                                ? "Có thể hoàn vé"
                                                                                : "Không thể hoàn vé"}
                                                                        </span>
                                                                    </div>

                                                                    {/* Tabs dạng vertical */}
                                                                    <Tabs defaultValue="policy" className="w-full">
                                                                        <div className="flex gap-6">
                                                                            <TabsList className="flex flex-col w-64 gap-3 bg-transparent border-none shadow-none p-0" style={{ marginTop: '74px' }}>
                                                                                <TabsTrigger
                                                                                    value="policy"
                                                                                    className="w-full justify-start rounded-lg border text-left px-4 py-3 transition-colors data-[state=active]:border-blue-500 data-[state=active]:font-semibold data-[state=active]:text-black data-[state=active]:bg-white data-[state=inactive]:border-gray-200 data-[state=inactive]:text-gray-700 hover:bg-gray-50"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation(); // NGĂN EVENT BUBBLING
                                                                                    }}
                                                                                >
                                                                                    Chính sách hoàn vé của bạn
                                                                                </TabsTrigger>
                                                                                <TabsTrigger
                                                                                    value="estimate"
                                                                                    className="w-full justify-start rounded-lg border text-left px-4 py-3 transition-colors data-[state=active]:border-blue-500 data-[state=active]:font-semibold data-[state=active]:text-black data-[state=active]:bg-white data-[state=inactive]:border-gray-200 data-[state=inactive]:text-gray-700 hover:bg-gray-50"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation(); // NGĂN EVENT BUBBLING
                                                                                    }}
                                                                                >
                                                                                    Giá trị hoàn lại ước tính
                                                                                </TabsTrigger>
                                                                                <TabsTrigger
                                                                                    value="procedure"
                                                                                    className="w-full justify-start rounded-lg border text-left px-4 py-3 transition-colors data-[state=active]:border-blue-500 data-[state=active]:font-semibold data-[state=active]:text-black data-[state=active]:bg-white data-[state=inactive]:border-gray-200 data-[state=inactive]:text-gray-700 hover:bg-gray-50"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation(); // NGĂN EVENT BUBBLING
                                                                                    }}
                                                                                >
                                                                                    Quy trình hoàn lại vé
                                                                                </TabsTrigger>
                                                                            </TabsList>
                                                                            <div className="flex-1">
                                                                                <TabsContent value="policy" className="space-y-2 text-sm">
                                                                                    <div className="text-[hsl(var(--muted-foreground))] space-y-2">
                                                                                        <div>Hoàn vé được áp dụng cho:</div>
                                                                                        <ul className="list-disc pl-5 space-y-1">
                                                                                            <li>Tự hủy (thay đổi kế hoạch)</li>
                                                                                            <li>Đau ốm (bao gồm dương tính COVID-19)</li>
                                                                                            <li>Hãng hàng không hủy chuyến bay</li>
                                                                                            <li>Hãng hàng không dời lịch</li>
                                                                                            <li>Đặt trùng chuyến</li>
                                                                                            <li>Mang thai</li>
                                                                                            <li>Hành khách tử vong</li>
                                                                                        </ul>
                                                                                        <div className="mt-2">
                                                                                            Ghi chú hãng/điều khoản:{" "}
                                                                                            {policy?.notes ?? "Không có thông tin bổ sung"}
                                                                                        </div>
                                                                                    </div>
                                                                                </TabsContent>

                                                                                <TabsContent value="estimate" className="space-y-3 text-sm">
                                                                                    {travelerPricings.length === 0 ? (
                                                                                        <div className="text-[hsl(var(--muted-foreground))]">
                                                                                            Chưa có dữ liệu giá. Bấm &quot;Chọn chuyến bay&quot; để kiểm giá.
                                                                                        </div>
                                                                                    ) : (
                                                                                        <div className="space-y-3">
                                                                                            <div className="text-[hsl(var(--muted-foreground))] font-medium">
                                                                                                Giá trị hoàn lại ước tính theo từng loại hành khách:
                                                                                            </div>
                                                                                            <div className="space-y-2">
                                                                                                {travelerPricings.map((t: any, idx: number) => {
                                                                                                    const pr = parseRefundable(t);
                                                                                                    return (
                                                                                                        <div key={idx} className="p-3 border rounded-lg shadow-sm bg-white">
                                                                                                            <div className="flex items-center justify-between">
                                                                                                                <span className="font-semibold">
                                                                                                                    {t.travelerType ?? `Hành khách ${idx + 1}`}
                                                                                                                    {t.travelerId ? ` (${t.travelerId})` : ""}
                                                                                                                </span>
                                                                                                                {t.fareOption && (
                                                                                                                    <span className="text-xs text-[hsl(var(--muted-foreground))]">
                                                                                                                        {t.fareOption}
                                                                                                                    </span>
                                                                                                                )}
                                                                                                            </div>
                                                                                                            <div className="mt-2 text-sm">
                                                                                                                • Giá được hoàn ước tính:{" "}
                                                                                                                <span className="font-semibold">
                                                                                                                    {pr.amount != null
                                                                                                                        ? `${pr.amount.toLocaleString()} ${t?.price?.currency ?? offer?.price?.currency ?? "VND"}`
                                                                                                                        : "-"}
                                                                                                                </span>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    );
                                                                                                })}
                                                                                            </div>
                                                                                            <div className="space-y-1">
                                                                                                <div className="text-sm">{refundDeadlineText}</div>
                                                                                                <div className="text-xs text-[hsl(var(--muted-foreground))] italic">
                                                                                                    Lưu ý: đây là giá trị ước tính; phí xử lý và chính sách hãng có thể ảnh hưởng số thực tế được hoàn.
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    )}
                                                                                </TabsContent>

                                                                                <TabsContent value="procedure" className="space-y-3 text-sm">
                                                                                    <div className="space-y-2">
                                                                                        <div className="font-medium">Hướng dẫn quy trình hoàn vé</div>
                                                                                        <ol className="list-decimal pl-5 space-y-2 text-[hsl(var(--muted-foreground))]">
                                                                                            <li>Đăng nhập tài khoản hoặc mở email xác nhận.</li>
                                                                                            <li>Kiểm tra chính sách hoàn vé trong “Chi tiết vé”.</li>
                                                                                            <li>Liên hệ tổng đài hoặc trang &quot;Quản lý đặt chỗ&quot;.</li>
                                                                                            <li>Gửi lý do & chứng từ cần thiết (giấy khám, xác nhận hủy...).</li>
                                                                                            <li>Chờ xử lý (thường 7–14 ngày làm việc).</li>
                                                                                            <li>Nhận tiền hoàn qua phương thức thanh toán ban đầu hoặc theo thỏa thuận.</li>
                                                                                        </ol>
                                                                                    </div>
                                                                                </TabsContent>
                                                                            </div>
                                                                        </div>
                                                                    </Tabs>
                                                                </div>
                                                            );
                                                        })()}
                                                    </TabsContent>

                                                    <TabsContent value="change" className="space-y-3">
                                                        {(() => {
                                                            const p = pricingByFlight[key] ?? {};
                                                            const offer = p?.data?.flightOffers?.[0] ?? (Array.isArray(p?.data) ? p.data[0] : (p?.data ?? p ?? null));
                                                            const changeable = detectChangeable(p, offer);
                                                            const changeFee = changeable ? '720.000 VND + Chênh lệch giá vé' : 'Không đổi lịch';

                                                            return (
                                                                <div className="space-y-4">
                                                                    <div className="flex items-center gap-2">
                                                                        {changeable ? (
                                                                            <RefreshCw className="h-5 w-5 text-green-500" />
                                                                        ) : (
                                                                            <X className="h-5 w-5 text-red-500" />
                                                                        )}
                                                                        <span className="text-base font-semibold">
                                                                            {changeable ? 'Có thể đổi lịch' : 'Không thể đổi lịch'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="text-sm text-[hsl(var(--muted-foreground))]">
                                                                        <div>Phí đổi lịch: {changeFee}</div>
                                                                        {changeable && (
                                                                            <div className="mt-2">
                                                                                Lưu ý:
                                                                                <ul className="list-disc pl-5 space-y-1">
                                                                                    <li>Phí đổi là 720.000 VND (30 USD) mỗi hành khách, có thể giảm cho trẻ em/em bé.</li>
                                                                                    <li>Chênh lệch giá vé sẽ được thu thêm nếu hành trình mới có giá cao hơn.</li>
                                                                                    <li>Liên hệ hãng để xác nhận thời hạn đổi và điều kiện cụ thể.</li>
                                                                                </ul>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })()}
                                                    </TabsContent>

                                                    <TabsContent value="detailsCharge" className="space-y-3">
                                                        {(() => {
                                                            const p = pricingByFlight[key] ?? {};
                                                            const offer = p?.data?.flightOffers?.[0] ?? (Array.isArray(p?.data) ? p.data[0] : (p?.data ?? p ?? null)) ?? p ?? null;
                                                            const travelerPricings = offer?.travelerPricings ?? offer?.travelerPricings ?? [];
                                                            const offerPrice = offer?.price ?? null;
                                                            const fees = offerPrice?.fees ?? offer?.price?.fees ?? [];
                                                            const includedCCFees = getIncluded(p, 'credit-card-fees');

                                                            if (!offer || travelerPricings.length === 0) {
                                                                return (
                                                                    <div className="text-sm text-[hsl(var(--muted-foreground))]">
                                                                        Chưa có thông tin chi tiết giá. Vui lòng bấm &quot;Chọn chuyến bay&quot; để kiểm giá.
                                                                    </div>
                                                                );
                                                            }

                                                            const currency = offer?.price?.currency ?? travelerPricings[0]?.price?.currency ?? '';

                                                            return (
                                                                <div className="space-y-3">
                                                                    {/* {fees && fees.length > 0 && (
                                                                        <div className="p-3 border rounded">
                                                                            <div className="text-sm font-medium mb-2">Phí & lệ phí</div>
                                                                            <div className="text-xs text-[hsl(var(--muted-foreground))]">
                                                                                {fees.map((f: any, idx: number) => (
                                                                                    <div key={idx}>{f.type ?? f.code ?? 'FEE'}: {f.amount ?? f.price ?? '-'} {currency}</div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )} */}

                                                                    {/* {includedCCFees && (
                                                                        <div className="p-3 border rounded">
                                                                            <div className="text-sm font-medium mb-2">Phí thẻ tín dụng</div>
                                                                            <div className="text-xs text-[hsl(var(--muted-foreground))]">
                                                                                {Object.keys(includedCCFees).map((k) => {
                                                                                    const c = includedCCFees[k];
                                                                                    return <div key={k}>{c.brand}: {c.amount} {c.currency}</div>;
                                                                                })}
                                                                            </div>
                                                                        </div>
                                                                    )} */}

                                                                    {travelerPricings.map((t: any, i: number) => {
                                                                        const price = t?.price ?? {};
                                                                        const total = price?.total ?? price?.grandTotal ?? '-';
                                                                        const base = price?.base ?? '-';
                                                                        const taxes = price?.taxes ?? [];
                                                                        const refundableTaxes = price?.refundableTaxes ?? null;
                                                                        const fareDetails = t?.fareDetailsBySegment ?? [];

                                                                        return (
                                                                            <div key={i} className="p-3 border rounded">
                                                                                <div className="flex justify-between items-center">
                                                                                    <div className="text-sm font-medium">
                                                                                        {t.travelerType ?? `Hành khách ${i + 1}`} {t.travelerId ? `(${t.travelerId})` : ''}
                                                                                    </div>
                                                                                    <div className="text-sm text-[hsl(var(--muted-foreground))]">{t.fareOption ?? ''}</div>
                                                                                </div>

                                                                                <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                                                                                    <div>
                                                                                        <div className="text-xs text-[hsl(var(--muted-foreground))]">Tổng</div>
                                                                                        <div className="font-semibold">
                                                                                            {total !== '-' ? `${Number(total).toLocaleString()} ${currency}` : '-'}
                                                                                        </div>
                                                                                    </div>
                                                                                    <div>
                                                                                        <div className="text-xs text-[hsl(var(--muted-foreground))]">Giá cơ sở</div>
                                                                                        <div>{base !== '-' ? `${Number(base).toLocaleString()} ${currency}` : '-'}</div>
                                                                                    </div>
                                                                                    <div>
                                                                                        <div className="text-xs text-[hsl(var(--muted-foreground))]">Thuế & phí</div>
                                                                                        <div className="text-xs text-[hsl(var(--muted-foreground))]">
                                                                                            {taxes.length > 0 ? taxes.map((tx: any) => `${tx.code}:${tx.amount}`).join(', ') : '-'}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>

                                                                                {refundableTaxes && (
                                                                                    <div className="text-xs text-[hsl(var(--muted-foreground))] mt-2">Refundable taxes: {refundableTaxes}</div>
                                                                                )}

                                                                                <div className="mt-3">
                                                                                    <div className="text-xs font-medium mb-1">Chi tiết theo segment</div>
                                                                                    <div className="space-y-1 text-xs text-[hsl(var(--muted-foreground))]">
                                                                                        {fareDetails.length === 0 && <div>Không có thông tin theo segment.</div>}
                                                                                        {fareDetails.map((fd: any, idx: number) => (
                                                                                            <div key={idx} className="p-2 bg-gray-50 rounded">
                                                                                                <div>Segment: <span className="font-medium">{fd.segmentId ?? fd.segment?.id ?? idx}</span></div>
                                                                                                <div>Cabin: {fd.cabin ?? '-'}</div>
                                                                                                <div>Fare basis: {fd.fareBasis ?? '-'}</div>
                                                                                                <div>Class: {fd.class ?? fd.bookingClass ?? '-'}</div>
                                                                                                <div>Included checked bags: {fd.includedCheckedBags?.quantity ?? fd.includedCheckedBags?.weight ?? '-'}</div>
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            );
                                                        })()}
                                                    </TabsContent>
                                                </div>
                                            </Tabs>
                                            <div className="flex justify-end">
                                                <Button onClick={() => setShowOutboundDetailsModal(false)}>Đóng</Button>
                                            </div>
                                        </>
                                    );
                                })()}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {/* Modal chi tiết chuyến bay về (Inbound) */}
            {selectedInbound && showInboundDetailsModal && (
                <div className="fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setShowInboundDetailsModal(false)} />
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl p-4">
                        <Card>
                            <CardHeader className="flex items-center justify-between py-3 px-4">
                                <div className="flex items-center gap-2">
                                    <div className="font-semibold">Chi tiết chuyến bay về</div>
                                    <div className="text-sm text-[hsl(var(--muted-foreground))]">{selectedInbound.airline}</div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setShowInboundDetailsModal(false)}>
                                    <X />
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-3 p-4">
                                {(() => {
                                    const flight = selectedInbound;
                                    const flightOfferPayload = flight.raw ? flight.raw : constructFallbackOfferForPage(flight);
                                    const signature = computeSignatureForPayload(flightOfferPayload);
                                    const key = makePricingCacheKey(flightOfferPayload, flight.id);
                                    const isPricingLoading = Boolean(pricingLoadingByFlight[key]);
                                    if (isPricingLoading) {
                                        return (
                                            <div className="space-y-4 animate-pulse">
                                                <div className="h-6 w-3/4 bg-gray-200 rounded" />
                                                <div className="h-4 w-full bg-gray-200 rounded" />
                                                <div className="h-4 w-2/3 bg-gray-200 rounded" />
                                                <div className="h-20 w-full bg-gray-200 rounded" />
                                            </div>
                                        );
                                    }
                                    return (
                                        <>
                                            <div className='flex justify-between'>
                                                <div className="text-md font-medium mb-3">
                                                    <span className="inline-flex items-center px-2 py-1 bg-sky-100 text-sky-700 text-xs font-medium rounded mr-2">Chuyến về</span>
                                                    {flight.departure.city} → {flight.arrival.city}
                                                    {flight.departure?.date && (
                                                        <span className="text-xs text-[hsl(var(--muted-foreground))]"> • {formatDateReadable(flight.departure.date)}</span>
                                                    )}
                                                </div>
                                                <div className="text-xl font-bold text-[hsl(var(--primary))]">{formatPrice(flight.price)}/khách</div>
                                            </div>

                                            <div className="flex items-center gap-6 mt-3">
                                                <div className="text-center">
                                                    <div className="font-bold text-lg">{flight.departure.time}</div>
                                                    <div className="text-sm text-[hsl(var(--muted-foreground))]">{flight.departure.airport}</div>
                                                    <div className="text-xs text-[hsl(var(--muted-foreground))]">{flight.departure.city}</div>
                                                </div>
                                                <div className="flex-1 text-center">
                                                    <div className="text-sm text-[hsl(var(--muted-foreground))] mb-1">{flight.duration}</div>
                                                    <div className="flex items-center">
                                                        <div className="flex-1 h-px bg-gray-300"></div>
                                                        <ArrowRight className="h-4 w-4 mx-2 text-gray-400" />
                                                        <div className="flex-1 h-px bg-gray-300"></div>
                                                    </div>
                                                    <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Bay thẳng</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="font-bold text-lg">{flight.arrival.time}</div>
                                                    <div className="text-sm text-[hsl(var(--muted-foreground))]">{flight.arrival.airport}</div>
                                                    <div className="text-xs text-[hsl(var(--muted-foreground))]">{flight.arrival.city}</div>
                                                </div>
                                            </div>

                                            <Tabs defaultValue="details" className="w-full">
                                                <TabsList className="grid w-full grid-cols-5">
                                                    <TabsTrigger
                                                        value="details"
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // NGĂN EVENT BUBBLING
                                                        }}
                                                    >
                                                        Chi tiết
                                                    </TabsTrigger>
                                                    <TabsTrigger
                                                        value="benefits"
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // NGĂN EVENT BUBBLING
                                                        }}
                                                    >
                                                        Lợi ích đi kèm
                                                    </TabsTrigger>
                                                    <TabsTrigger
                                                        value="refund"
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // NGĂN EVENT BUBBLING
                                                        }}
                                                    >
                                                        Hoàn vé
                                                    </TabsTrigger>
                                                    <TabsTrigger
                                                        value="change"
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // NGĂN EVENT BUBBLING
                                                        }}
                                                    >
                                                        Đổi lịch
                                                    </TabsTrigger>
                                                    <TabsTrigger
                                                        value="detailsCharge"
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // NGĂN EVENT BUBBLING
                                                        }}
                                                    >
                                                        Chi tiết vé
                                                    </TabsTrigger>
                                                </TabsList>
                                                <div className="mt-4">
                                                    <TabsContent value="details" className="space-y-4">
                                                        {(() => {
                                                            const pricing = pricingByFlight[key] ?? {};
                                                            const seatmap = seatmapByFlight?.[key] ?? seatmapData ?? {};
                                                            const offerFromPricing = pricing?.data?.flightOffers?.[0] ?? (Array.isArray(pricing?.data) ? pricing.data[0] : pricing?.data ?? pricing ?? null);
                                                            const travelerForDetails = offerFromPricing?.travelerPricings?.[0] ?? offerFromPricing?.travelerPricings?.[0];
                                                            const parsedRefundForDetails = parseRefundable(travelerForDetails ?? offerFromPricing);
                                                            // const refundForDetails = parsedRefundForDetails.amount != null ? parsedRefundForDetails.raw ?? parsedRefundForDetails.amount : null;

                                                            const traveler = pricing?.data?.travelerPricings?.[0] ?? pricing?.travelerPricings?.[0] ?? travelerForDetails;
                                                            const fareSeg = traveler?.fareDetailsBySegment?.[0] ?? traveler?.fareDetails?.[0];
                                                            const checkedQty = fareSeg?.includedCheckedBags?.quantity ?? flight.baggage?.checkin?.pieces;
                                                            const checkedWeight = fareSeg?.includedCheckedBags?.weight ?? flight.baggage?.checkin?.weight;
                                                            const cabinQty = fareSeg?.includedCabinBags?.quantity ?? flight.baggage?.handbag?.pieces;

                                                            const cabAmenities = seatmap?.aircraftCabinAmenities || {};
                                                            const wifiRaw = cabAmenities?.wifi ?? cabAmenities?.seat?.wifi ?? flight.amenities?.wifi;
                                                            const wifiInfo = wifiRaw ? (typeof wifiRaw === 'object' ? wifiRaw : { available: !!wifiRaw }) : { available: false };

                                                            const mealRaw = cabAmenities?.food ?? cabAmenities?.seat?.food ?? flight.amenities?.meal;
                                                            const mealInfo = mealRaw ? (typeof mealRaw === 'object' ? mealRaw : { available: !!mealRaw }) : { included: false, available: false };

                                                            const entertainmentRaw = cabAmenities?.seat?.medias ?? cabAmenities?.medias ?? flight.amenities?.entertainment;
                                                            const entertainmentInfo = entertainmentRaw ? (Array.isArray(entertainmentRaw) ? { available: entertainmentRaw.length > 0, screens: entertainmentRaw.length } : (typeof entertainmentRaw === 'object' ? entertainmentRaw : { available: !!entertainmentRaw })) : { available: false };

                                                            const powerRaw = cabAmenities?.power ?? flight.amenities?.power;
                                                            const powerInfo = powerRaw ? (typeof powerRaw === 'object' ? powerRaw : { available: !!powerRaw }) : { available: false };

                                                            const includedFareRules = getIncluded(pricing, 'detailed-fare-rules');
                                                            const includedBags = getIncluded(pricing, 'bags');
                                                            const creditCardFees = getIncluded(pricing, 'credit-card-fees');

                                                            const segment = offerFromPricing?.itineraries?.[0]?.segments?.[0] ?? {};
                                                            const lastTicketingDate = offerFromPricing?.lastTicketingDate ?? offerFromPricing?.lastTicketingDate ?? null;
                                                            const fareTypes = offerFromPricing?.pricingOptions?.fareType ?? offerFromPricing?.pricingOptions?.fareType ?? [];
                                                            const validatingAirlines = offerFromPricing?.validatingAirlineCodes ?? offerFromPricing?.validatingAirlineCodes ?? [];
                                                            const bookingRequirements = pricing?.data?.bookingRequirements ?? pricing?.bookingRequirements ?? offerFromPricing?.bookingRequirements ?? null;

                                                            const fareRuleSnippet = (() => {
                                                                try {
                                                                    if (!includedFareRules) return null;
                                                                    const firstKey = Object.keys(includedFareRules)[0];
                                                                    const rule = includedFareRules[firstKey];
                                                                    const desc = rule?.fareNotes?.descriptions?.[0]?.text ?? rule?.fareNotes?.descriptions?.[0]?.text;
                                                                    return desc ? (String(desc).slice(0, 1000) + (String(desc).length > 1000 ? '…' : '')) : rule?.name ?? null;
                                                                } catch (e) {
                                                                    return null;
                                                                }
                                                            })();

                                                            return (
                                                                <div className="space-y-4">
                                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                                        <div>
                                                                            <h4 className="font-medium mb-3">Hành lý</h4>
                                                                            <div className="space-y-2 text-sm">
                                                                                <div className="flex items-center gap-2">
                                                                                    <Luggage className="h-4 w-4 text-blue-500" />
                                                                                    <div>
                                                                                        <div className="font-medium">Xách tay</div>
                                                                                        <div className="text-muted-foreground">
                                                                                            {cabinQty ?? (flight.baggage?.handbag?.pieces ?? '-')}{flight.baggage?.handbag?.unit ?? ''}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex items-center gap-2">
                                                                                    <Luggage className="h-4 w-4 text-green-500" />
                                                                                    <div>
                                                                                        <div className="font-medium">Ký gửi</div>
                                                                                        <div className="text-muted-foreground">
                                                                                            {checkedQty ?? checkedWeight ?? '-'}{checkedWeight ? (fareSeg?.includedCheckedBags?.weightUnit ?? flight.baggage?.checkin?.unit ?? '') : ''}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                                {includedBags && (
                                                                                    <div className="text-xs text-[hsl(var(--muted-foreground))] mt-2">
                                                                                        Gói hành lý thêm có thể đặt:
                                                                                        <div className="mt-1">
                                                                                            {Object.keys(includedBags).map((k) => {
                                                                                                const b = includedBags[k];
                                                                                                return (
                                                                                                    <div key={k}>
                                                                                                        {b.name} • {b.quantity ?? '-'} • {b.price?.amount ? `${Number(b.price.amount).toLocaleString()} ${b.price.currencyCode ?? ''}` : 'Miễn phí'}
                                                                                                    </div>
                                                                                                );
                                                                                            })}
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        <div>
                                                                            <h4 className="font-medium mb-3">Tiện ích</h4>
                                                                            <div className="space-y-2 text-sm">
                                                                                <div className="flex items-center gap-2">
                                                                                    <Wifi className="h-4 w-4" />
                                                                                    <div>
                                                                                        {wifiInfo.available ? (
                                                                                            wifiInfo.free === true || wifiInfo.included === true ? (
                                                                                                <div className="text-muted-foreground">WiFi: Miễn phí</div>
                                                                                            ) : wifiInfo.price ? (
                                                                                                <div className="text-muted-foreground">WiFi: {String(wifiInfo.price)}</div>
                                                                                            ) : (
                                                                                                <div className="text-muted-foreground">WiFi: Có phí</div>
                                                                                            )
                                                                                        ) : <span className="text-muted-foreground">Không có WiFi</span>}
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex items-center gap-2">
                                                                                    <Utensils className="h-4 w-4" />
                                                                                    <div>
                                                                                        {mealInfo.available || mealInfo.included ? (
                                                                                            mealInfo.included === true || mealInfo.free === true ? (
                                                                                                <div className="text-muted-foreground">Bữa ăn miễn phí{mealInfo.type ? ` • ${mealInfo.type}` : ''}</div>
                                                                                            ) : mealInfo.price ? (
                                                                                                <div className="text-muted-foreground">Bữa ăn có phí • {String(mealInfo.price)}</div>
                                                                                            ) : (
                                                                                                <div className="text-muted-foreground">Bữa ăn có phí</div>
                                                                                            )
                                                                                        ) : <span className="text-muted-foreground">Không có thông tin bữa ăn</span>}
                                                                                    </div>
                                                                                </div>
                                                                                {entertainmentInfo.available && (
                                                                                    <div className="flex items-center gap-2">
                                                                                        <Tv className="h-4 w-4" />
                                                                                        <div className="text-muted-foreground">Giải trí • {entertainmentInfo.screens ?? '-'}</div>
                                                                                    </div>
                                                                                )}
                                                                                {powerInfo.available && (
                                                                                    <div className="flex items-center gap-2">
                                                                                        <Battery className="h-4 w-4" />
                                                                                        <div className="text-muted-foreground">{powerInfo.powerType ?? (powerInfo.available ? 'Có ổ sạc' : '')}</div>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        <div>
                                                                            <h4 className="font-medium mb-3">Thông tin chuyến bay</h4>
                                                                            <div className="space-y-2 text-sm">
                                                                                <div><span className="font-medium">Máy bay:</span>
                                                                                    {/* {seatmap?.aircraft?.code ?? segment?.aircraft?.code ?? flight.aircraft} */}
                                                                                    {flight.flightNumber} • {flight.aircraft}
                                                                                </div>
                                                                                <div><span className="font-medium">Hạng vé:</span> {(traveler?.fareOption) ?? flight.class}</div>
                                                                                <div><span className="font-medium">Còn lại:</span> {offerFromPricing?.numberOfBookableSeats ?? flight.availableSeats ?? (seatmap?.availableSeatsCounters?.[0]?.value) ?? '-'} ghế</div>
                                                                                {segment?.co2Emissions && (
                                                                                    <div><span className="font-medium">CO₂ (ước tính):</span> {segment.co2Emissions.map((c: any) => `${c.weight}${c.weightUnit} (${c.cabin ?? '-'})`).join(', ')}</div>
                                                                                )}
                                                                                {lastTicketingDate && <div><span className="font-medium">Last ticketing:</span> {lastTicketingDate}</div>}
                                                                                {fareTypes.length > 0 && <div><span className="font-medium">Fare type:</span> {fareTypes.join(', ')}</div>}
                                                                                {validatingAirlines.length > 0 && <div><span className="font-medium">Validating:</span> {validatingAirlines.join(', ')}</div>}
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* {fareRuleSnippet && (
                                                                        <div>
                                                                            <h4 className="font-medium mb-2">Tóm tắt điều khoản vé</h4>
                                                                            <div className="text-sm text-[hsl(var(--muted-foreground))] whitespace-pre-wrap">
                                                                                {fareRuleSnippet}
                                                                            </div>
                                                                        </div>
                                                                    )} */}

                                                                    {bookingRequirements && (
                                                                        <div>
                                                                            <h4 className="font-medium mb-2">Yêu cầu đặt chỗ</h4>
                                                                            <div className="text-sm text-[hsl(var(--muted-foreground))]">
                                                                                {bookingRequirements.emailAddressRequired ? <div>Yêu cầu email</div> : null}
                                                                                {bookingRequirements.mobilePhoneNumberRequired ? <div>Yêu cầu số điện thoại</div> : null}
                                                                                {Array.isArray(bookingRequirements.travelerRequirements) && bookingRequirements.travelerRequirements.length > 0 && (
                                                                                    <div className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                                                                                        Một số hành khách cần ngày sinh: {bookingRequirements.travelerRequirements.map((r: any) => r.travelerId).join(', ')}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })()}
                                                    </TabsContent>

                                                    <TabsContent value="benefits" className="space-y-3">
                                                        <div className="space-y-3">
                                                            {(() => {
                                                                const p = pricingByFlight[key] ?? {};
                                                                const offer = p?.data?.flightOffers?.[0] ?? (Array.isArray(p?.data) ? p.data[0] : (p?.data ?? p ?? null));
                                                                const anyRefundable = detectAnyRefundable(p, offer, flight);
                                                                const changeable = detectChangeable(p, offer);

                                                                return (
                                                                    <>
                                                                        <div className="flex items-center gap-3">
                                                                            {anyRefundable ? <Shield className="h-5 w-5 text-green-500" /> : <X className="h-5 w-5 text-red-500" />}
                                                                            <div className="text-sm font-medium">
                                                                                {anyRefundable ? 'Có thể hoàn vé' : 'Không thể hoàn vé'}
                                                                            </div>
                                                                        </div>

                                                                        <div className="flex items-center gap-3">
                                                                            {changeable ? <RefreshCw className="h-5 w-5 text-green-500" /> : <X className="h-5 w-5 text-red-500" />}
                                                                            <div className="text-sm font-medium">
                                                                                {changeable ? 'Có thể đổi lịch' : 'Không thể đổi lịch'}
                                                                            </div>
                                                                        </div>
                                                                    </>
                                                                );
                                                            })()}
                                                        </div>
                                                    </TabsContent>

                                                    <TabsContent value="refund" className="space-y-3">
                                                        {(() => {
                                                            const p = pricingByFlight[key] ?? {};
                                                            const offer = p?.data?.flightOffers?.[0] ?? (Array.isArray(p?.data) ? p.data[0] : p?.data ?? p ?? null);
                                                            const travelerPricings = offer?.travelerPricings ?? [];
                                                            const policy = p?.data?.policies ?? p?.policies ?? flight.policies ?? {};
                                                            const anyRefundable = detectAnyRefundable(p, offer, flight);
                                                            const refundDeadlineText = (() => {
                                                                const keys = [
                                                                    "refundBeforeDays",
                                                                    "refundableBeforeDays",
                                                                    "refundableBeforeHours",
                                                                    "refundDeadlineHours",
                                                                    "refundBeforeHours",
                                                                ];
                                                                for (const k of keys) {
                                                                    const v = policy?.[k];
                                                                    if (v != null) {
                                                                        const num = Number(v);
                                                                        if (isFinite(num)) {
                                                                            if (k.toLowerCase().includes("hour")) {
                                                                                const days = Math.ceil(num / 24);
                                                                                return `Hoàn trước khoảng ${num} giờ (~${days} ngày)`;
                                                                            }
                                                                            return `Hoàn trước ${num} ngày`;
                                                                        }
                                                                    }
                                                                }
                                                                return "Hoàn trước 24 giờ (mặc định nếu hãng không cung cấp thông tin cụ thể)";
                                                            })();

                                                            return (
                                                                <div className="space-y-4">
                                                                    {/* Trạng thái hoàn vé */}
                                                                    <div className="flex items-center gap-2" style={{ marginBottom: '-7px' }}>
                                                                        {anyRefundable || policy?.cancellable ? (
                                                                            <Shield className="h-5 w-5 text-green-500" />
                                                                        ) : (
                                                                            <X className="h-5 w-5 text-red-500" />
                                                                        )}
                                                                        <span className="text-base font-semibold">
                                                                            {anyRefundable || policy?.cancellable
                                                                                ? "Có thể hoàn vé"
                                                                                : "Không thể hoàn vé"}
                                                                        </span>
                                                                    </div>

                                                                    {/* Tabs dạng vertical */}
                                                                    <Tabs defaultValue="policy" className="w-full">
                                                                        <div className="flex gap-6">
                                                                            <TabsList className="flex flex-col w-64 gap-3 bg-transparent border-none shadow-none p-0" style={{ marginTop: '74px' }}>
                                                                                <TabsTrigger
                                                                                    value="policy"
                                                                                    className="w-full justify-start rounded-lg border text-left px-4 py-3 transition-colors data-[state=active]:border-blue-500 data-[state=active]:font-semibold data-[state=active]:text-black data-[state=active]:bg-white data-[state=inactive]:border-gray-200 data-[state=inactive]:text-gray-700 hover:bg-gray-50"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation(); // NGĂN EVENT BUBBLING
                                                                                    }}
                                                                                >
                                                                                    Chính sách hoàn vé của bạn
                                                                                </TabsTrigger>
                                                                                <TabsTrigger
                                                                                    value="estimate"
                                                                                    className="w-full justify-start rounded-lg border text-left px-4 py-3 transition-colors data-[state=active]:border-blue-500 data-[state=active]:font-semibold data-[state=active]:text-black data-[state=active]:bg-white data-[state=inactive]:border-gray-200 data-[state=inactive]:text-gray-700 hover:bg-gray-50"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation(); // NGĂN EVENT BUBBLING
                                                                                    }}
                                                                                >
                                                                                    Giá trị hoàn lại ước tính
                                                                                </TabsTrigger>
                                                                                <TabsTrigger
                                                                                    value="procedure"
                                                                                    className="w-full justify-start rounded-lg border text-left px-4 py-3 transition-colors data-[state=active]:border-blue-500 data-[state=active]:font-semibold data-[state=active]:text-black data-[state=active]:bg-white data-[state=inactive]:border-gray-200 data-[state=inactive]:text-gray-700 hover:bg-gray-50"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation(); // NGĂN EVENT BUBBLING
                                                                                    }}
                                                                                >
                                                                                    Quy trình hoàn lại vé
                                                                                </TabsTrigger>
                                                                            </TabsList>
                                                                            <div className="flex-1">
                                                                                <TabsContent value="policy" className="space-y-2 text-sm">
                                                                                    <div className="text-[hsl(var(--muted-foreground))] space-y-2">
                                                                                        <div>Hoàn vé được áp dụng cho:</div>
                                                                                        <ul className="list-disc pl-5 space-y-1">
                                                                                            <li>Tự hủy (thay đổi kế hoạch)</li>
                                                                                            <li>Đau ốm (bao gồm dương tính COVID-19)</li>
                                                                                            <li>Hãng hàng không hủy chuyến bay</li>
                                                                                            <li>Hãng hàng không dời lịch</li>
                                                                                            <li>Đặt trùng chuyến</li>
                                                                                            <li>Mang thai</li>
                                                                                            <li>Hành khách tử vong</li>
                                                                                        </ul>
                                                                                        <div className="mt-2">
                                                                                            Ghi chú hãng/điều khoản:{" "}
                                                                                            {policy?.notes ?? "Không có thông tin bổ sung"}
                                                                                        </div>
                                                                                    </div>
                                                                                </TabsContent>

                                                                                <TabsContent value="estimate" className="space-y-3 text-sm">
                                                                                    {travelerPricings.length === 0 ? (
                                                                                        <div className="text-[hsl(var(--muted-foreground))]">
                                                                                            Chưa có dữ liệu giá. Bấm &quot;Chọn chuyến bay&quot; để kiểm giá.
                                                                                        </div>
                                                                                    ) : (
                                                                                        <div className="space-y-3">
                                                                                            <div className="text-[hsl(var(--muted-foreground))] font-medium">
                                                                                                Giá trị hoàn lại ước tính theo từng loại hành khách:
                                                                                            </div>
                                                                                            <div className="space-y-2">
                                                                                                {travelerPricings.map((t: any, idx: number) => {
                                                                                                    const pr = parseRefundable(t);
                                                                                                    return (
                                                                                                        <div key={idx} className="p-3 border rounded-lg shadow-sm bg-white">
                                                                                                            <div className="flex items-center justify-between">
                                                                                                                <span className="font-semibold">
                                                                                                                    {t.travelerType ?? `Hành khách ${idx + 1}`}
                                                                                                                    {t.travelerId ? ` (${t.travelerId})` : ""}
                                                                                                                </span>
                                                                                                                {t.fareOption && (
                                                                                                                    <span className="text-xs text-[hsl(var(--muted-foreground))]">
                                                                                                                        {t.fareOption}
                                                                                                                    </span>
                                                                                                                )}
                                                                                                            </div>
                                                                                                            <div className="mt-2 text-sm">
                                                                                                                • Giá được hoàn ước tính:{" "}
                                                                                                                <span className="font-semibold">
                                                                                                                    {pr.amount != null
                                                                                                                        ? `${pr.amount.toLocaleString()} ${t?.price?.currency ?? offer?.price?.currency ?? "VND"}`
                                                                                                                        : "-"}
                                                                                                                </span>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    );
                                                                                                })}
                                                                                            </div>
                                                                                            <div className="space-y-1">
                                                                                                <div className="text-sm">{refundDeadlineText}</div>
                                                                                                <div className="text-xs text-[hsl(var(--muted-foreground))] italic">
                                                                                                    Lưu ý: đây là giá trị ước tính; phí xử lý và chính sách hãng có thể ảnh hưởng số thực tế được hoàn.
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    )}
                                                                                </TabsContent>

                                                                                <TabsContent value="procedure" className="space-y-3 text-sm">
                                                                                    <div className="space-y-2">
                                                                                        <div className="font-medium">Hướng dẫn quy trình hoàn vé</div>
                                                                                        <ol className="list-decimal pl-5 space-y-2 text-[hsl(var(--muted-foreground))]">
                                                                                            <li>Đăng nhập tài khoản hoặc mở email xác nhận.</li>
                                                                                            <li>Kiểm tra chính sách hoàn vé trong “Chi tiết vé”.</li>
                                                                                            <li>Liên hệ tổng đài hoặc trang &quot;Quản lý đặt chỗ&quot;.</li>
                                                                                            <li>Gửi lý do & chứng từ cần thiết (giấy khám, xác nhận hủy...).</li>
                                                                                            <li>Chờ xử lý (thường 7–14 ngày làm việc).</li>
                                                                                            <li>Nhận tiền hoàn qua phương thức thanh toán ban đầu hoặc theo thỏa thuận.</li>
                                                                                        </ol>
                                                                                    </div>
                                                                                </TabsContent>
                                                                            </div>
                                                                        </div>
                                                                    </Tabs>
                                                                </div>
                                                            );
                                                        })()}
                                                    </TabsContent>

                                                    <TabsContent value="change" className="space-y-3">
                                                        {(() => {
                                                            const p = pricingByFlight[key] ?? {};
                                                            const offer = p?.data?.flightOffers?.[0] ?? (Array.isArray(p?.data) ? p.data[0] : (p?.data ?? p ?? null));
                                                            const changeable = detectChangeable(p, offer);
                                                            const changeFee = changeable ? '720.000 VND + Chênh lệch giá vé' : 'Không đổi lịch';

                                                            return (
                                                                <div className="space-y-4">
                                                                    <div className="flex items-center gap-2">
                                                                        {changeable ? (
                                                                            <RefreshCw className="h-5 w-5 text-green-500" />
                                                                        ) : (
                                                                            <X className="h-5 w-5 text-red-500" />
                                                                        )}
                                                                        <span className="text-base font-semibold">
                                                                            {changeable ? 'Có thể đổi lịch' : 'Không thể đổi lịch'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="text-sm text-[hsl(var(--muted-foreground))]">
                                                                        <div>Phí đổi lịch: {changeFee}</div>
                                                                        {changeable && (
                                                                            <div className="mt-2">
                                                                                Lưu ý:
                                                                                <ul className="list-disc pl-5 space-y-1">
                                                                                    <li>Phí đổi là 720.000 VND (30 USD) mỗi hành khách, có thể giảm cho trẻ em/em bé.</li>
                                                                                    <li>Chênh lệch giá vé sẽ được thu thêm nếu hành trình mới có giá cao hơn.</li>
                                                                                    <li>Liên hệ hãng để xác nhận thời hạn đổi và điều kiện cụ thể.</li>
                                                                                </ul>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })()}
                                                    </TabsContent>

                                                    <TabsContent value="detailsCharge" className="space-y-3">
                                                        {(() => {
                                                            const p = pricingByFlight[key] ?? {};
                                                            const offer = p?.data?.flightOffers?.[0] ?? (Array.isArray(p?.data) ? p.data[0] : (p?.data ?? p ?? null)) ?? p ?? null;
                                                            const travelerPricings = offer?.travelerPricings ?? offer?.travelerPricings ?? [];
                                                            const offerPrice = offer?.price ?? null;
                                                            const fees = offerPrice?.fees ?? offer?.price?.fees ?? [];
                                                            const includedCCFees = getIncluded(p, 'credit-card-fees');

                                                            if (!offer || travelerPricings.length === 0) {
                                                                return (
                                                                    <div className="text-sm text-[hsl(var(--muted-foreground))]">
                                                                        Chưa có thông tin chi tiết giá. Vui lòng bấm &quot;Chọn chuyến bay&quot; để kiểm giá.
                                                                    </div>
                                                                );
                                                            }

                                                            const currency = offer?.price?.currency ?? travelerPricings[0]?.price?.currency ?? '';

                                                            return (
                                                                <div className="space-y-3">
                                                                    {/* {fees && fees.length > 0 && (
                                                                        <div className="p-3 border rounded">
                                                                            <div className="text-sm font-medium mb-2">Phí & lệ phí</div>
                                                                            <div className="text-xs text-[hsl(var(--muted-foreground))]">
                                                                                {fees.map((f: any, idx: number) => (
                                                                                    <div key={idx}>{f.type ?? f.code ?? 'FEE'}: {f.amount ?? f.price ?? '-'} {currency}</div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {includedCCFees && (
                                                                        <div className="p-3 border rounded">
                                                                            <div className="text-sm font-medium mb-2">Phí thẻ tín dụng</div>
                                                                            <div className="text-xs text-[hsl(var(--muted-foreground))]">
                                                                                {Object.keys(includedCCFees).map((k) => {
                                                                                    const c = includedCCFees[k];
                                                                                    return <div key={k}>{c.brand}: {c.amount} {c.currency}</div>;
                                                                                })}
                                                                            </div>
                                                                        </div>
                                                                    )} */}

                                                                    {travelerPricings.map((t: any, i: number) => {
                                                                        const price = t?.price ?? {};
                                                                        const total = price?.total ?? price?.grandTotal ?? '-';
                                                                        const base = price?.base ?? '-';
                                                                        const taxes = price?.taxes ?? [];
                                                                        const refundableTaxes = price?.refundableTaxes ?? null;
                                                                        const fareDetails = t?.fareDetailsBySegment ?? [];

                                                                        return (
                                                                            <div key={i} className="p-3 border rounded">
                                                                                <div className="flex justify-between items-center">
                                                                                    <div className="text-sm font-medium">
                                                                                        {t.travelerType ?? `Hành khách ${i + 1}`} {t.travelerId ? `(${t.travelerId})` : ''}
                                                                                    </div>
                                                                                    <div className="text-sm text-[hsl(var(--muted-foreground))]">{t.fareOption ?? ''}</div>
                                                                                </div>

                                                                                <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                                                                                    <div>
                                                                                        <div className="text-xs text-[hsl(var(--muted-foreground))]">Tổng</div>
                                                                                        <div className="font-semibold">
                                                                                            {total !== '-' ? `${Number(total).toLocaleString()} ${currency}` : '-'}
                                                                                        </div>
                                                                                    </div>
                                                                                    <div>
                                                                                        <div className="text-xs text-[hsl(var(--muted-foreground))]">Giá cơ sở</div>
                                                                                        <div>{base !== '-' ? `${Number(base).toLocaleString()} ${currency}` : '-'}</div>
                                                                                    </div>
                                                                                    <div>
                                                                                        <div className="text-xs text-[hsl(var(--muted-foreground))]">Thuế & phí</div>
                                                                                        <div className="text-xs text-[hsl(var(--muted-foreground))]">
                                                                                            {taxes.length > 0 ? taxes.map((tx: any) => `${tx.code}:${tx.amount}`).join(', ') : '-'}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>

                                                                                {refundableTaxes && (
                                                                                    <div className="text-xs text-[hsl(var(--muted-foreground))] mt-2">Refundable taxes: {refundableTaxes}</div>
                                                                                )}

                                                                                <div className="mt-3">
                                                                                    <div className="text-xs font-medium mb-1">Chi tiết theo segment</div>
                                                                                    <div className="space-y-1 text-xs text-[hsl(var(--muted-foreground))]">
                                                                                        {fareDetails.length === 0 && <div>Không có thông tin theo segment.</div>}
                                                                                        {fareDetails.map((fd: any, idx: number) => (
                                                                                            <div key={idx} className="p-2 bg-gray-50 rounded">
                                                                                                <div>Segment: <span className="font-medium">{fd.segmentId ?? fd.segment?.id ?? idx}</span></div>
                                                                                                <div>Cabin: {fd.cabin ?? '-'}</div>
                                                                                                <div>Fare basis: {fd.fareBasis ?? '-'}</div>
                                                                                                <div>Class: {fd.class ?? fd.bookingClass ?? '-'}</div>
                                                                                                <div>Included checked bags: {fd.includedCheckedBags?.quantity ?? fd.includedCheckedBags?.weight ?? '-'}</div>
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            );
                                                        })()}
                                                    </TabsContent>
                                                </div>
                                            </Tabs>
                                            <div className="flex justify-end">
                                                <Button onClick={() => setShowInboundDetailsModal(false)}>Đóng</Button>
                                            </div>
                                        </>
                                    );
                                })()}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}


        </>
    );
}
export default withSuspense(VeMayBay);
