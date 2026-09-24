"use client"
import { useState, useEffect } from 'react';
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
    Bus,
    Filter,
    ArrowRight,
    Clock,
    Wifi,
    Coffee,
    Star,
    Users,
    MapPin,
    ChevronDown,
    ChevronUp,
    Armchair,
    Bed,
    Shield,
    Map,
} from 'lucide-react';
import BusResults from './BusResults';

const busCompanies = [
    { name: 'Phương Trang', rating: 4.5 },
    { name: 'Sinh Tourist', rating: 4.3 },
    { name: 'Hoàng Long', rating: 4.4 },
    { name: 'Thành Bưởi', rating: 4.2 },
    { name: 'Mai Linh Express', rating: 4.1 },
];

const sampleBuses = [
    {
        id: 1,
        company: 'Phương Trang',
        route: 'TP.HCM - Đà Lạt',
        type: 'Giường nằm VIP',
        departure: { time: '22:30', location: 'Bến xe Miền Đông' },
        arrival: { time: '05:00+1', location: 'Bến xe Đà Lạt' },
        duration: '6h 30m',
        distance: '308km',
        price: 350000,
        originalPrice: 420000,
        seats: 32,
        availableSeats: 8,
        amenities: ['wifi', 'blanket', 'water', 'toilet', 'entertainment'],
        rating: 4.5,
        reviews: 1250,
        images: ['/placeholder.svg'],
        busNumber: 'PT-001',
        discount: 17,
        cancellable: true,
        pickup: ['Bến xe Miền Đông', 'Ngã Tư Bình Phước', 'Ngã Tư An Sương'],
        dropoff: ['Bến xe Đà Lạt', 'Chợ Đà Lạt', 'Ga Đà Lạt'],
    },
    {
        id: 2,
        company: 'Sinh Tourist',
        route: 'TP.HCM - Đà Lạt',
        type: 'Ghế ngồi',
        departure: { time: '23:00', location: 'Bến xe Miền Đông' },
        arrival: { time: '06:00+1', location: 'Bến xe Đà Lạt' },
        duration: '7h 00m',
        distance: '308km',
        price: 280000,

        seats: 45,
        availableSeats: 12,
        amenities: ['wifi', 'water', 'toilet'],
        rating: 4.3,
        reviews: 890,
        images: ['/placeholder.svg'],
        busNumber: 'ST-205',
        cancellable: false,
        pickup: ['Bến xe Miền Đông', 'Ngã Tư Bình Phước'],
        dropoff: ['Bến xe Đà Lạt', 'Chợ Đà Lạt'],
    },
    {
        id: 3,
        company: 'Hoàng Long',
        route: 'TP.HCM - Đà Lạt',
        type: 'Giường nằm',
        departure: { time: '21:45', location: 'Bến xe Miền Đông' },
        arrival: { time: '04:30+1', location: 'Bến xe Đà Lạt' },
        duration: '6h 45m',
        distance: '308km',
        price: 320000,
        seats: 40,
        availableSeats: 5,
        amenities: ['wifi', 'blanket', 'water', 'toilet'],
        rating: 4.4,
        reviews: 650,
        images: ['/placeholder.svg'],
        busNumber: 'HL-158',
        cancellable: true,
        pickup: ['Bến xe Miền Đông', 'Chùa Hạnh Phúc'],
        dropoff: ['Bến xe Đà Lạt'],
    },
    {
        id: 4,
        company: 'Mai Linh Express',
        route: 'TP.HCM - Đà Lạt',
        type: 'Limousine VIP',
        departure: { time: '23:30', location: 'Ga Sài Gòn' },
        arrival: { time: '06:15+1', location: 'Trung tâm Đà Lạt' },
        duration: '6h 45m',
        distance: '308km',
        price: 450000,
        seats: 22,
        availableSeats: 3,
        amenities: ['wifi', 'massage', 'blanket', 'snack', 'water', 'toilet', 'entertainment'],
        rating: 4.7,
        reviews: 320,
        images: ['/placeholder.svg'],
        busNumber: 'ML-VIP01',
        cancellable: true,
        pickup: ['Ga Sài Gòn', 'Quận 1', 'Quận 3'],
        dropoff: ['Trung tâm Đà Lạt', 'Chợ Đà Lạt'],
    },
];

export default function XeDuLich() {
    const [showFilters, setShowFilters] = useState(true);
    const [priceRange, setPriceRange] = useState([200000, 500000]);
    const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState('price-asc');
    const [showDetails, setShowDetails] = useState<number | null>(null);
    const [hasSearched, setHasSearched] = useState(false);
    const [showPromotions, setShowPromotions] = useState(true);
    const [selectedRoute, setSelectedRoute] = useState<{ from: string, to: string, price?: string } | null>(null);
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [fetchedBuses, setFetchedBuses] = useState<any[]>([]); // dữ liệu từ server

    // New: API fetch state (when fetch attempted and error, don't fallback to sample)
    const [fetchAttempted, setFetchAttempted] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);


    // base API (config bằng NEXT_PUBLIC_API_BASE hoặc fallback)
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
    // Promotions for bus
    const [promotions, setPromotions] = useState<any[]>([]);
    const [promotionsLoading, setPromotionsLoading] = useState(false);
    const [promotionsError, setPromotionsError] = useState<string | null>(null);

    useEffect(() => {
        // load promotions applicable to bus
        const loadPromos = async () => {
            try {
                setPromotionsLoading(true);
                setPromotionsError(null);
                const url = `${API_BASE}/api/promotions?status=active&appliesTo=buses&page=1&pageSize=10`;
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
    // helper: parse MongoDB extended JSON number wrappers into JS Number
    const parseNumber = (v: any): number => {
        if (v == null) return 0;
        if (typeof v === 'number') return v;
        if (typeof v === 'string') {
            const n = Number(v);
            return Number.isFinite(n) ? n : 0;
        }
        if (typeof v === 'object') {
            if ('$numberInt' in v) return Number(v['$numberInt']);
            if ('$numberLong' in v) return Number(v['$numberLong']);
            if ('$numberDecimal' in v) return Number(v['$numberDecimal']);
            if ('$numberDouble' in v) return Number(v['$numberDouble']);
            // sometimes price is nested like { $numberInt: "600" }
            // fallback: try to extract any numeric-looking property
            for (const key of Object.keys(v)) {
                const candidate = v[key];
                const n = Number(candidate);
                if (Number.isFinite(n)) return n;
            }
        }
        return 0;
    };

    // helper: parse MongoDB extended JSON date wrappers into JS Date
    const parseDate = (v: any): Date | null => {
        if (!v && v !== 0) return null;
        if (v instanceof Date) return v;
        if (typeof v === 'string') {
            const d = new Date(v);
            return isNaN(d.getTime()) ? null : d;
        }
        if (typeof v === 'number') {
            const d = new Date(v);
            return isNaN(d.getTime()) ? null : d;
        }
        if (typeof v === 'object') {
            // common mongo extended forms
            if ('$date' in v) {
                const dv = v['$date'];
                if (typeof dv === 'object' && dv !== null && ('$numberLong' in dv)) {
                    const t = Number(dv['$numberLong']);
                    return isNaN(t) ? null : new Date(t);
                }
                if (typeof dv === 'string') {
                    const d = new Date(dv);
                    return isNaN(d.getTime()) ? null : d;
                }
                if (typeof dv === 'number') {
                    const d = new Date(dv);
                    return isNaN(d.getTime()) ? null : d;
                }
            }
            // sometimes date is stored directly as { $numberLong: "..." }
            if ('$numberLong' in v) {
                const t = Number(v['$numberLong']);
                return isNaN(t) ? null : new Date(t);
            }
        }
        return null;
    };

    // fetch buses từ server (client-facing endpoint)
    const fetchBuses = async (from?: string, to?: string, departure?: string) => {
        try {
            setIsLoading(true);
            setFetchError(null);
            const params = new URLSearchParams();
            if (from) params.append('from', from);
            if (to) params.append('to', to);
            if (departure) params.append('departure', departure);
            // page & pageSize defaults (client listing)
            params.append('page', '1');
            params.append('pageSize', '50');
            // request only scheduled trips for client listing
            params.append('status', 'scheduled');
            // only add query string when there are meaningful params (avoid trailing '?')
            const qs = params.toString();
            const url = qs ? `${API_BASE}/api/buses/client/buses?${qs}` : `${API_BASE}/api/buses/client/buses`;

            // Log the outgoing request for debugging
            console.log('fetchBuses -> requesting', { url, from, to, departure });

            const res = await fetch(url);
            if (!res.ok) {
                const text = await res.text();
                // console.warn('fetchBuses non-ok', { status: res.status, body: text });
                // setFetchedBuses([]);
                // setIsLoading(false);
                // return;
                const msg = `Server lỗi ${res.status}${text ? `: ${text}` : ''}`;
                console.warn('fetchBuses non-ok', { status: res.status, body: text });
                setFetchedBuses([]);
                setFetchError(msg);
                return;
            }
            const json = await res.json();
            // Log full response for debugging, including relaxed flag
            console.log('fetchBuses -> raw response json:', json);

            // server trả { data: [...] , pagination: ... } hoặc mảng trực tiếp
            const list = Array.isArray(json) ? json : (Array.isArray(json.data) ? json.data : []);

            // normalize server objects to client UI shape
            const normalizeServerBus = (b: any, idx: number) => {
                // robustly extract first departure/arrival date from possibly extended json
                const departureRaw = b.departureAt ?? (Array.isArray(b.departureDates) && b.departureDates[0]) ?? null;
                const arrivalRaw = b.arrivalAt ?? (Array.isArray(b.arrivalDates) && b.arrivalDates[0]) ?? null;
                const departureDate = parseDate(departureRaw);
                const arrivalDate = parseDate(arrivalRaw);

                const fmtTime = (dAny: any) => {
                    const d = parseDate(dAny) ?? null;
                    if (!d) return '00:00';
                    try {
                        return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                    } catch (e) {
                        const iso = d.toISOString();
                        return iso.slice(11, 16);
                    }
                };

                const routeFromName = b.routeFrom?.city || b.routeFrom?.name || String(b.routeFrom?.code || '');
                const routeToName = b.routeTo?.city || b.routeTo?.name || String(b.routeTo?.code || '');

                // parse numeric fields that might be wrapped by mongo extjson
                // Prefer explicit adultPrice/childPrice from server. Fallback to legacy price when needed.
                const adultPriceNum = parseNumber(b.adultPrice ?? b.price ?? b.pricePerSeat ?? b.price_total);
                const childPriceNum = parseNumber(b.childPrice ?? Math.round(adultPriceNum * 0.75));
                const infantPriceNum = parseNumber(b.infantPrice ?? Math.round(adultPriceNum * 0.2));
                const priceNum = adultPriceNum; // keep legacy "price" meaning = adultPrice
                const seatsTotal = parseNumber(b.seatsTotal ?? b.seats ?? b.totalSeats);
                const seatsAvailable = parseNumber(b.seatsAvailable ?? b.availableSeats ?? b.seats_free);

                // amenities normalization
                const amenitiesArr = Array.isArray(b.amenities)
                    ? b.amenities
                    : (typeof b.amenities === 'string' ? b.amenities.split(',').map((s: string) => s.trim()).filter(Boolean) : (b.amenity_list || []));

                return {
                    // id used as key in UI
                    id: b._id?.['$oid'] || b._id || b.busCode || b.id || `srv-${idx}`,
                    // company: b.operator?.name || b.company || (b.operator && b.operator.id) || (b.busCode || 'Nhà xe'),
                    // keep structured operator info so filters can match by id / name / code
                    operatorId: b.operator?.id || b.operator?.code || null,
                    operatorCode: b.operator?.code || null,
                    company: b.operator?.name || b.company || (b.operator && b.operator.id) || (b.busCode || 'Nhà xe'),
                    route: (b.route && typeof b.route === 'string') ? b.route : `${routeFromName} - ${routeToName}`.trim(),
                    // include structured routeFrom/routeTo so client filters can match codes/cities/names
                    routeFrom: b.routeFrom || null,
                    routeTo: b.routeTo || null,
                    // type: Array.isArray(b.busType) ? (b.busType[0] || 'Ghế') : (b.type || (b.busType || 'Ghế ngồi')),
                    // keep original busType array plus a fallback `type` string for display
                    busTypeArray: Array.isArray(b.busType) ? b.busType : (b.busType ? [b.busType] : (b.type ? [b.type] : [])),
                    type: Array.isArray(b.busType) ? (b.busType[0] || 'Ghế') : (b.type || 'Ghế ngồi'),
                    departure: {
                        time: (b.departure && b.departure.time) || fmtTime(departureDate),
                        location: (b.departure && b.departure.location) || routeFromName || ''
                    },
                    arrival: {
                        time: (b.arrival && b.arrival.time) || fmtTime(arrivalDate),
                        location: (b.arrival && b.arrival.location) || routeToName || ''
                    },
                    duration: b.duration || '',
                    distance: b.distance || '',
                    // canonical price fields
                    adultPrice: adultPriceNum,
                    childPrice: childPriceNum,
                    infantPrice: infantPriceNum,
                    // legacy `price` kept for UI compatibility (= adultPrice)
                    price: priceNum,
                    originalPrice: parseNumber(b.originalPrice ?? b.listPrice ?? b.price_before_discount) || undefined,
                    seats: seatsTotal,
                    availableSeats: seatsAvailable,
                    amenities: amenitiesArr,
                    rating: b.rating || (b.operator && b.operator.rating) || 0,
                    reviews: b.reviews || 0,
                    images: b.images || ['/placeholder.svg'],
                    busNumber: b.busCode || b.busNumber || '',
                    discount: b.discount || undefined,
                    cancellable: !!b.cancellable,
                    pickup: b.pickup || b.pickupPoints || [],
                    dropoff: b.dropoff || b.dropoffPoints || []
                };
            };

            const normalized = list.map((b: any, i: number) => normalizeServerBus(b, i));
            setFetchedBuses(normalized);
            setFetchError(null);
            // Adjust client priceRange immediately so newly-fetched buses aren't filtered out on first render.
            try {
                if (Array.isArray(normalized) && normalized.length > 0) {
                    const prices = normalized.map((x: any) => Number(x.price || 0)).filter(p => Number.isFinite(p) && p > 0);
                    if (prices.length > 0) {
                        const minP = Math.min(...prices);
                        const maxP = Math.max(...prices);
                        const [curMin, curMax] = priceRange;
                        // expand only when necessary (don't shrink user's current range)
                        if (minP < curMin || maxP > curMax) {
                            const pad = Math.max(20000, Math.floor((maxP - minP) * 0.1));
                            const newMin = Math.max(0, Math.min(curMin, minP - pad));
                            const newMax = Math.max(curMax, maxP + pad);
                            setPriceRange([newMin, newMax]);
                            console.log('fetchBuses -> expanded priceRange to include server prices', { newMin, newMax, minP, maxP });
                        }
                    }
                }
            } catch (e) {
                console.warn('fetchBuses priceRange expand failed', e);
            }

            // Log response summary so we can see if there's data
            console.log('fetchBuses -> normalized response', {
                totalReturned: normalized.length,
                sample: normalized.length ? normalized.slice(0, 3) : []
            });
            if (normalized.length === 0) {
                console.warn('fetchBuses -> empty list returned from server, full response:', json);
            }
            setFetchedBuses(normalized);
        } catch (err:any) {
            const msg = String(err?.message || err || 'Không thể kết nối tới server');
            console.error('fetchBuses error', err);
            setFetchedBuses([]);
            setFetchError(msg);
        } finally {
            setFetchAttempted(true);
            setIsLoading(false);
        }
    };

    // If the page is loaded with ?from=&to=&departure=... then automatically run the search.
    useEffect(() => {
        try {
            if (typeof window === 'undefined') return;
            const params = new URLSearchParams(window.location.search);
            const qFrom = params.get('from') || params.get('From') || params.get('FROM') || '';
            const qTo = params.get('to') || params.get('To') || params.get('TO') || '';
            const qDeparture = params.get('departure') || params.get('date') || params.get('departureDate') || '';

            if (qFrom || qTo || qDeparture) {
                // set UI to reflect incoming params
                if (qFrom || qTo) {
                    setSelectedRoute({
                        from: qFrom || selectedRoute?.from || '',
                        to: qTo || selectedRoute?.to || '',
                        price: selectedRoute?.price
                    });
                }
                if (qDeparture) setSelectedDate(qDeparture);

                // call the same handler used by SearchTabs to keep behavior consistent
                handleSearch({ from: qFrom || undefined, to: qTo || undefined, departure: qDeparture || undefined });
            }
        } catch (e) {
            console.warn('initial search params parse failed', e);
        }
    }, []);

    // If server returns buses outside current priceRange, expand the range so results are visible.
    useEffect(() => {
        if (!Array.isArray(fetchedBuses) || fetchedBuses.length === 0) return;
        try {
            const prices = fetchedBuses.map(b => Number(b.price || 0)).filter(p => Number.isFinite(p));
            if (prices.length === 0) return;
            const minP = Math.min(...prices);
            const maxP = Math.max(...prices);

            // only adjust if current range would filter out all results or not include the returned prices
            const [curMin, curMax] = priceRange;
            const needsExpand = (minP < curMin) || (maxP > curMax);
            if (needsExpand) {
                // small padding and clamp
                const pad = Math.max(20000, Math.floor((maxP - minP) * 0.1));
                const newMin = Math.max(0, Math.min(minP - pad, curMin));
                const newMax = Math.max(curMax, maxP + pad);
                setPriceRange([newMin, newMax]);
                console.log('Adjusted priceRange to include server prices', { newMin, newMax, minP, maxP });
            }
        } catch (e) {
            console.warn('priceRange adjust failed', e);
        }
    }, [fetchedBuses]);
    useEffect(() => {
        try {
            if (typeof window === 'undefined') return;
            const params = new URLSearchParams(window.location.search);
            const hasQuery = params.has('from') || params.has('to') || params.has('departure') || params.has('date') || params.has('departureDate');
            if (!hasQuery) {
                // fetch default listing (no filters) so page shows server data on initial load
                fetchBuses().catch(err => console.warn('initial fetchBuses failed', err));
            }
        } catch (e) {
            console.warn('initial fetch (no-params) failed', e);
        }
    }, []);
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price);
    };

    const getTypeIcon = (type: string) => {
        if (type.includes('Giường nằm')) return <Bed className="h-4 w-4" />;
        if (type.includes('Ghế ngồi')) return <Armchair className="h-4 w-4" />;
        return <Bus className="h-4 w-4" />;
    };

    const getAmenityIcon = (amenity: string) => {
        switch (amenity) {
            case 'wifi': return <Wifi className="h-4 w-4" />;
            case 'water': return '💧';
            case 'blanket': return '🛏️';
            case 'toilet': return '🚽';
            case 'entertainment': return '📺';
            case 'massage': return '💆';
            case 'snack': return '🍪';
            default: return '•';
        }
    };

    // Generate additional buses for selected route
    const generateRouteBuses = () => {
        if (!selectedRoute) return [];

        const basePrice = selectedRoute.price ? parseInt(selectedRoute.price.replace(/[^\d]/g, '')) : 280000;

        return [
            {
                ...sampleBuses[0],
                id: 999,
                route: `${selectedRoute.from} - ${selectedRoute.to}`,
                price: basePrice,
                originalPrice: basePrice + 70000,
                company: 'Phương Trang',
                type: 'Giường nằm VIP',
                departure: { time: '22:30', location: `Bến xe ${selectedRoute.from}` },
                arrival: { time: '05:00+1', location: `Bến xe ${selectedRoute.to}` },
                discount: 15,
                availableSeats: 8,
                busNumber: 'PT-Premium',
            },
            {
                ...sampleBuses[0],
                id: 998,
                route: `${selectedRoute.from} - ${selectedRoute.to}`,
                price: basePrice + 40000,
                company: 'Sinh Tourist',
                type: 'Ghế ngồi',
                departure: { time: '23:00', location: `Bến xe ${selectedRoute.from}` },
                arrival: { time: '06:30+1', location: `Bến xe ${selectedRoute.to}` },
                availableSeats: 12,
                busNumber: 'ST-Comfort',
            },
            {
                ...sampleBuses[0],
                id: 997,
                route: `${selectedRoute.from} - ${selectedRoute.to}`,
                price: basePrice + 70000,
                company: 'Hoàng Long',
                type: 'Giường nằm',
                departure: { time: '21:45', location: `Bến xe ${selectedRoute.from}` },
                arrival: { time: '04:30+1', location: `Bến xe ${selectedRoute.to}` },
                availableSeats: 5,
                busNumber: 'HL-Express',
            }
        ];
    };

    // const routeBuses = selectedRoute ? generateRouteBuses() : [];
    // // nếu server trả dữ liệu dùng nó, ngược lại fallback về sampleBuses / generated
    // const sourceBuses = (Array.isArray(fetchedBuses) && fetchedBuses.length > 0)
    //     ? fetchedBuses
    //     : (selectedRoute ? [...routeBuses, ...sampleBuses] : sampleBuses);

    const routeBuses = selectedRoute ? generateRouteBuses() : [];
    // New logic:
    // - If server returned data -> use it
    // - If a fetch was attempted and failed or returned empty -> do NOT fallback to sample; show no-data / error UI
    // - If no fetch attempted yet (initial dev mode) -> keep sample fallback for local dev convenience
    let sourceBuses: any[] = [];
    if (Array.isArray(fetchedBuses) && fetchedBuses.length > 0) {
        sourceBuses = fetchedBuses;
    } else if (!fetchAttempted) {
        sourceBuses = selectedRoute ? [...routeBuses, ...sampleBuses] : sampleBuses;
    } else {
        // fetchAttempted && no server data -> empty list (UI will show "no data" or error)
        sourceBuses = [];
    }
    // const filteredBuses = sourceBuses.filter(bus => {
    //     const matchesPrice = bus.price >= priceRange[0] && bus.price <= priceRange[1];
    //     const matchesCompany = selectedCompanies.length === 0 || selectedCompanies.includes(bus.company);
    //     const matchesType = selectedTypes.length === 0 || selectedTypes.includes(bus.type);
    const filteredBuses = sourceBuses.filter(bus => {
        const matchesPrice = bus.price >= priceRange[0] && bus.price <= priceRange[1];

        // Company filter: allow matching by selected label against operator name/id/code or displayed company
        const matchesCompany = selectedCompanies.length === 0 || selectedCompanies.some(sel => {
            const s = String(sel || '').toLowerCase();
            if (!s) return false;
            if (bus.company && String(bus.company).toLowerCase() === s) return true;
            if (bus.operatorId && String(bus.operatorId).toLowerCase() === s) return true;
            if (bus.operatorCode && String(bus.operatorCode).toLowerCase() === s) return true;
            // partial contains match to be more forgiving
            if (bus.company && String(bus.company).toLowerCase().includes(s)) return true;
            return false;
        });

        // Type filter: match against busTypeArray (server) or fallback type string
        const matchesType = selectedTypes.length === 0 || selectedTypes.some(sel => {
            const s = String(sel || '').toLowerCase();
            if (!s) return false;
            if (Array.isArray(bus.busTypeArray) && bus.busTypeArray.some((t: any) => String(t || '').toLowerCase().includes(s))) return true;
            if (bus.type && String(bus.type).toLowerCase().includes(s)) return true;
            return false;
        });
        // If route is selected, try several heuristics rather than strict string equality:
        // - match exact display route
        // - match if route string contains the provided values
        // - match routeFrom.routeTo codes (useful when query uses numeric codes like from=1&to=56)
        if (selectedRoute) {
            const fromVal = String(selectedRoute.from || '').trim();
            const toVal = String(selectedRoute.to || '').trim();
            const displayRoute = `${selectedRoute.from} - ${selectedRoute.to}`;

            const matchesRoute =
                // exact display text (legacy)
                (bus.route === displayRoute) ||
                // substring match in route description
                (!!bus.route && fromVal && bus.route.includes(fromVal)) ||
                (!!bus.route && toVal && bus.route.includes(toVal)) ||
                // structured match against normalized fields
                (!!bus.routeFrom && fromVal && String(bus.routeFrom.code || bus.routeFrom.city || bus.routeFrom.name).includes(fromVal)) ||
                (!!bus.routeTo && toVal && String(bus.routeTo.code || bus.routeTo.city || bus.routeTo.name).includes(toVal));

            return matchesPrice && matchesCompany && matchesType && matchesRoute;
        }

        return matchesPrice && matchesCompany && matchesType;
    });

    const sortedBuses = [...filteredBuses].sort((a, b) => {
        // If route selected, show generated route buses first
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
            case 'rating': return b.rating - a.rating;
            case 'duration': return a.duration.localeCompare(b.duration);
            default: return 0;
        }
    });

    // handleSearch now accepts optional payload from SearchTabs { type, from, to, departure, price }
    const handleSearch = (payload?: { type?: string, from?: string, to?: string, departure?: string, price?: string }) => {
        console.log('handleSearch called with payload:', payload);
        setHasSearched(true);
        setShowPromotions(false);
        setIsLoading(true);

        // prefer payload values when provided (SearchTabs likely passes these)
        const from = payload?.from ?? selectedRoute?.from ?? '';
        const to = payload?.to ?? selectedRoute?.to ?? '';
        const departure = payload?.departure ?? selectedDate ?? '';

        // if payload provided, update selectedRoute / selectedDate so other UI reflects user input
        if (payload?.from || payload?.to) {
            setSelectedRoute({
                from: payload?.from ?? selectedRoute?.from ?? '',
                to: payload?.to ?? selectedRoute?.to ?? '',
                price: payload?.price ?? selectedRoute?.price
            });
        }
        if (payload?.departure) {
            setSelectedDate(payload.departure);
        }

        console.log('handleSearch will call fetchBuses with', { from, to, departure });
        fetchBuses(from, to, departure).finally(() => {
            setTimeout(() => setIsLoading(false), 200);
        });
    };

    const handleRouteSelect = (from: string, to: string, price?: string) => {
        setSelectedRoute({ from, to, price });
        setHasSearched(true);
        setShowPromotions(false);
        setIsLoading(true);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().split('T')[0];
        setSelectedDate(dateStr);
        // gọi API ngay sau khi đặt ngày
        fetchBuses(from, to, dateStr).finally(() => setIsLoading(false));
    };

    const busTypes = [...new Set(sampleBuses.map(bus => bus.type))];

    // dynamic: load companies and bus types from public JSON files
    const [busCompaniesData, setBusCompaniesData] = useState<{ id?: string; name: string; short_name?: string; rating?: number }[]>(
        []
    );
    const [busTypeCategories, setBusTypeCategories] = useState<any[]>([]);
    const [expandedTypeIds, setExpandedTypeIds] = useState<Record<string, boolean>>({});

    useEffect(() => {
        // load companies
        fetch('/nhaxekhach.json').then(r => {
            if (!r.ok) throw new Error('Failed to load companies');
            return r.json();
        }).then((j) => {
            setBusCompaniesData(Array.isArray(j) ? j : []);
        }).catch(() => {
            // fallback to minimal inline list if file not available
            setBusCompaniesData([
                { name: 'Phương Trang', short_name: 'Phương Trang', rating: 4.5 },
                { name: 'Sinh Tourist', short_name: 'Sinh Tourist', rating: 4.3 },
                { name: 'Hoàng Long', short_name: 'Hoàng Long', rating: 4.4 },
            ]);
        });

        // load bus type categories (parents -> subtypes)
        fetch('/dsloaixevexere.json').then(r => {
            if (!r.ok) throw new Error('Failed to load types');
            return r.json();
        }).then((j) => {
            setBusTypeCategories(Array.isArray(j) ? j : []);
        }).catch(() => {
            // keep empty if not available
            setBusTypeCategories([]);
        });
    }, []);


    // optional small UI debug flag
    const dataSourceLabel = (Array.isArray(fetchedBuses) && fetchedBuses.length > 0) ? `Server (${fetchedBuses.length})` : 'Fallback sample';

    const [copied, setCopied] = useState<{ [code: string]: boolean }>({});

    const handleCopy = (code: string) => {
        navigator.clipboard.writeText(code).then(() => {
            setCopied(prev => ({ ...prev, [code]: true }));
            setTimeout(() => setCopied(prev => ({ ...prev, [code]: false })), 2000);
        });
    };

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

    return (
        <>
            {/* Search Section */}
            <div className="relative min-h-[480px]" style={{ backgroundImage: 'url(./banner-xe-ve.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>

                <div className="container">

                    <div className="absolute inset-x-0 top-[calc(100%/1.2)] -translate-y-1/2">
                        <div className="w-full max-w-6xl mx-auto" style={{
                            background: 'linear-gradient(90deg, rgba(0,17,30,0.6) 0%, rgba(0,0,0,0) 100%)',
                            paddingBottom: '7px', paddingLeft: '18px', marginBottom: '-10px', borderTopLeftRadius: '10px'

                        }}>
                            <h1 className="pt-4 text-2xl lg:text-3xl font-bold mb-2 text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.1)]">
                                Tìm vé xe
                            </h1>
                            <p className="font-bold mb-2 text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.1)]">Đặt vé xe với giá tốt nhất</p>
                        </div>
                        <SearchTabs onSearch={handleSearch} activeTab="bus" />
                    </div>
                </div>
            </div>

            {/* Vouchers & Promotions Section */}
            <section className={`py-8 bg-gray-50 ${hasSearched && !showPromotions ? 'hidden' : ''}`}>
                <div className="container">
                    {/* Vouchers (from server: only promotions that apply to 'bus') */}
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
                                            fetch(`${API_BASE}/api/promotions?status=active&appliesTo=bus&page=1&pageSize=10`)
                                                .then(r => r.ok ? r.json() : Promise.reject(r))
                                                .then(j => setPromotions(Array.isArray(j.data) ? j.data : []))
                                                .catch(e => setPromotionsError(String(e?.message || e)))
                                                .finally(() => setPromotionsLoading(false));
                                        }}>Thử lại</Button>
                                    </CardContent>
                                </Card>
                            ) : promotions.length === 0 ? (
                                <div className="col-span-3 text-sm text-[hsl(var(--muted-foreground))]">Hiện không có khuyến mãi cho chuyến xe</div>
                            ) : (
                                // show only first 3 promotions
                                            promotions.slice(0, 3).map((p: any, idx: number) => {
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
                                                        <div className="text-lg font-bold text-white"> <span>Code : </span> {p.code ?? `PROMO-${p._id?.slice?.(0, 6)}`}</div>
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


                    {/* Popular Routes */}
                    {/* <div className="mb-8">
                        <h2 className="text-xl font-bold mb-4 text-[hsl(var(--primary))]">🚌 Tuyến xe phổ biến</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleRouteSelect('TP.HCM', 'Đà Lạt', '280.000₫')}>
                                <CardContent className="p-4 text-center">
                                    <div className="text-sm font-medium">TP.HCM → Đà Lạt</div>
                                    <div className="text-xs text-[hsl(var(--muted-foreground))]">từ 280.000₫</div>
                                    <Badge variant="secondary" className="mt-2 text-xs">Phổ biến</Badge>
                                </CardContent>
                            </Card>

                            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleRouteSelect('TP.HCM', 'Nha Trang', '350.000₫')}>
                                <CardContent className="p-4 text-center">
                                    <div className="text-sm font-medium">TP.HCM → Nha Trang</div>
                                    <div className="text-xs text-[hsl(var(--muted-foreground))]">từ 350.000₫</div>
                                    <Badge variant="secondary" className="mt-2 text-xs">Hot</Badge>
                                </CardContent>
                            </Card>

                            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleRouteSelect('Hà Nội', 'Sapa', '400.000₫')}>
                                <CardContent className="p-4 text-center">
                                    <div className="text-sm font-medium">Hà Nội → Sapa</div>
                                    <div className="text-xs text-[hsl(var(--muted-foreground))]">từ 400.000₫</div>
                                    <Badge variant="secondary" className="mt-2 text-xs">Sale 20%</Badge>
                                </CardContent>
                            </Card>

                            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleRouteSelect('TP.HCM', 'Cần Thơ', '180.000₫')}>
                                <CardContent className="p-4 text-center">
                                    <div className="text-sm font-medium">TP.HCM → Cần Thơ</div>
                                    <div className="text-xs text-[hsl(var(--muted-foreground))]">từ 180.000₫</div>
                                    <Badge variant="secondary" className="mt-2 text-xs">Giá tốt</Badge>
                                </CardContent>
                            </Card>
                        </div>
                    </div> */}

                    {/* Great Bus Deals */}
                    {/* <div className="mb-8">
                        <h2 className="text-xl font-bold mb-4 text-[hsl(var(--primary))]">🔥 Xe giá tốt</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <Card className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="font-medium">Phương Trang</div>
                                            <div className="text-sm text-[hsl(var(--muted-foreground))]">TP.HCM → Đà Lạt • Giường nằm VIP</div>
                                        </div>
                                        <Badge variant="destructive">-17%</Badge>
                                    </div>
                                    <div className="text-sm text-[hsl(var(--muted-foreground))] mb-2">⭐ 4.5 (1250 đánh giá)</div>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <div className="text-lg font-bold text-[hsl(var(--primary))]">{formatPrice(350000)}</div>
                                            <div className="text-xs text-[hsl(var(--muted-foreground))] line-through">{formatPrice(420000)}</div>
                                        </div>
                                        <Button size="sm">Chọn xe</Button>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="font-medium">Sinh Tourist</div>
                                            <div className="text-sm text-[hsl(var(--muted-foreground))]">TP.HCM → Nha Trang • Ghế ngồi</div>
                                        </div>
                                        <Badge variant="destructive">-20%</Badge>
                                    </div>
                                    <div className="text-sm text-[hsl(var(--muted-foreground))] mb-2">⭐ 4.3 (890 đánh giá)</div>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <div className="text-lg font-bold text-[hsl(var(--primary))]">{formatPrice(350000)}</div>
                                            <div className="text-xs text-[hsl(var(--muted-foreground))] line-through">{formatPrice(438000)}</div>
                                        </div>
                                        <Button size="sm">Chọn xe</Button>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="font-medium">Hoàng Long</div>
                                            <div className="text-sm text-[hsl(var(--muted-foreground))]">Hà Nội → Sapa • Giường nằm</div>
                                        </div>
                                        <Badge variant="destructive">-25%</Badge>
                                    </div>
                                    <div className="text-sm text-[hsl(var(--muted-foreground))] mb-2">⭐ 4.4 (650 đánh giá)</div>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <div className="text-lg font-bold text-[hsl(var(--primary))]">{formatPrice(400000)}</div>
                                            <div className="text-xs text-[hsl(var(--muted-foreground))] line-through">{formatPrice(533000)}</div>
                                        </div>
                                        <Button size="sm">Chọn xe</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div> */}
                </div>
            </section>

            {/* Date Selector
            {hasSearched && selectedRoute && (
                <section className="py-6 bg-[hsl(var(--orange-50))]">
                    <div className="container">
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold mb-2">
                                {selectedRoute.from} → {selectedRoute.to}
                            </h3>
                            <div className="text-sm text-[hsl(var(--muted-foreground))]">
                                Chọn ngày khởi hành
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
                                const prices = ['280.000', '320.000', '250.000', '350.000', '300.000', '280.000', '400.000'];
                                const price = prices[i] + ' VND';

                                return (
                                    <div
                                        key={dateStr}
                                        onClick={() => setSelectedDate(dateStr)}
                                        className={`flex-shrink-0 p-3 rounded-lg cursor-pointer transition-colors min-w-[120px] text-center ${selectedDate === dateStr
                                            ? 'bg-orange-600 text-white'
                                            : 'bg-white hover:bg-orange-100'
                                            }`}
                                    >
                                        <div className="text-sm font-medium">{dayName} {dayMonth}</div>
                                        <div className="text-xs mt-1">{price}</div>
                                        <div className="text-xs text-[hsl(var(--muted-foreground))]">Còn 8 chỗ</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )} */}

            {/* Toggle Promotions Button */}
            {hasSearched && (
                <section className={hasSearched ? "py-4 bg-white border-b mt-7" : "py-4 bg-white border-b mt-7"}>

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

            {/* Results Section */}
            <section className="py-8">
                <div className="container">
                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* Filters Sidebar */}
                        <div className={`lg:w-80 ${showFilters ? 'block' : 'hidden lg:block'}`}>
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
                                                    max={500000}
                                                    min={200000}
                                                    step={20000}
                                                    className="mb-3"
                                                />
                                                <div className="flex justify-between text-sm text-[hsl(var(--muted-foreground))]">
                                                    <span>{formatPrice(priceRange[0])}</span>
                                                    <span>{formatPrice(priceRange[1])}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <Separator />

                                        {/* Bus Companies (loaded from /public/nhaxekhach.json) */}
                                        <div>
                                            <Label className="text-sm font-medium mb-3 block text-[hsl(var(--primary))]">Nhà xe</Label>
                                            <div className="space-y-3" style={{ height: '20vh', overflowY: 'auto' }}>
                                                {busCompaniesData.map((company) => {
                                                    const key = company.id || company.short_name || company.name;
                                                    const label = company.short_name || company.name;
                                                    return (
                                                        <div key={key} className="flex items-center justify-between">
                                                            <div className="flex items-center space-x-2">
                                                                <Checkbox
                                                                    id={String(key)}
                                                                    checked={selectedCompanies.includes(String(label))}
                                                                    onCheckedChange={(checked) => {
                                                                        if (checked) {
                                                                            setSelectedCompanies(prev => [...prev, String(label)]);
                                                                        } else {
                                                                            setSelectedCompanies(prev => prev.filter(c => c !== String(label)));
                                                                        }
                                                                    }}
                                                                />
                                                                <label htmlFor={String(key)} className="text-sm cursor-pointer">
                                                                    {label}
                                                                </label>
                                                            </div>
                                                            {/* <div className="flex items-center text-xs text-[hsl(var(--muted-foreground))]">
                                                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                                                                {company.rating ?? '—'}
                                                            </div> */}
                                                        </div>
                                                    );
                                                })}
                                                {busCompaniesData.length === 0 && (
                                                    <div className="text-sm text-[hsl(var(--muted-foreground))]">Không có dữ liệu nhà xe</div>
                                                )}
                                            </div>
                                        </div>

                                        <Separator />

                                        {/* Bus Types (parent -> subtypes from /public/dsloaixevexere.json) */}
                                        <div>
                                            <Label className="text-sm font-medium mb-3 block text-[hsl(var(--primary))]">Loại xe</Label>
                                            <div className="space-y-2">
                                                {busTypeCategories.length === 0 && (
                                                    <div className="text-sm text-[hsl(var(--muted-foreground))]">Không có dữ liệu loại xe</div>
                                                )}
                                                {busTypeCategories.map((cat: any) => {
                                                    const cid = cat.id || cat.name;
                                                    const isOpen = !!expandedTypeIds[cid];
                                                    return (
                                                        <div key={cid} className="border rounded p-2">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="text-sm font-medium">{cat.name}</div>
                                                                </div>
                                                                <div>
                                                                    <button type="button" onClick={() => setExpandedTypeIds(prev => ({ ...prev, [cid]: !prev[cid] }))} className="text-xs text-[hsl(var(--muted-foreground))]">
                                                                        {isOpen ? 'Ẩn' : 'Xem'} {Array.isArray(cat.subtypes) ? `(${cat.subtypes.length})` : ''}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            {isOpen && Array.isArray(cat.subtypes) && (
                                                                <div className="mt-2 space-y-2">
                                                                    {cat.subtypes.map((st: any) => {
                                                                        const label = st.name || st.id;
                                                                        const value = label;
                                                                        const sid = `${cid}::${st.id || label}`;
                                                                        return (
                                                                            <div key={sid} className="flex items-center space-x-2">
                                                                                <Checkbox
                                                                                    id={sid}
                                                                                    checked={selectedTypes.includes(value)}
                                                                                    onCheckedChange={(checked) => {
                                                                                        setSelectedTypes(prev => {
                                                                                            if (checked) return [...prev, value];
                                                                                            return prev.filter(x => x !== value);
                                                                                        });
                                                                                    }}
                                                                                />
                                                                                <label htmlFor={sid} className="text-sm cursor-pointer flex items-center gap-1">
                                                                                    {getTypeIcon(st.name || '')}
                                                                                    <span>{label}</span>
                                                                                </label>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* <Separator /> */}

                                        {/* Departure Time */}
                                        {/* <div>
                                            <Label className="text-sm font-medium mb-3 block text-[hsl(var(--primary))]">Giờ khởi hành</Label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <Button variant="outline" size="sm" className="text-xs">Tối<br />18:00 - 24:00</Button>
                                                <Button variant="outline" size="sm" className="text-xs">Đêm<br />00:00 - 06:00</Button>
                                            </div>
                                        </div> */}

                                        {/* <Separator /> */}

                                        {/* Quick Filters */}
                                        {/* <div>
                                            <Label className="text-sm font-medium mb-3 block text-[hsl(var(--primary))]">Bộ lọc nhanh</Label>
                                            <div className="space-y-2">
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox id="wifi" />
                                                    <label htmlFor="wifi" className="text-sm cursor-pointer">
                                                        Có WiFi
                                                    </label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox id="toilet" />
                                                    <label htmlFor="toilet" className="text-sm cursor-pointer">
                                                        Có WC
                                                    </label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox id="refundable" />
                                                    <label htmlFor="refundable" className="text-sm cursor-pointer">
                                                        Có hoàn hủy
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
                                    <div>
                                        <p className="text-sm text-[hsl(var(--muted-foreground))]">
                                            Tìm thấy {sortedBuses.length} chuyến xe
                                        </p>
                                        <p className="text-xs text-[hsl(var(--muted-foreground))]">Nguồn dữ liệu: {dataSourceLabel}</p>
                                    </div>
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
                                            <SelectItem value="rating">Đánh giá cao nhất</SelectItem>
                                            <SelectItem value="duration">Thời gian ngắn nhất</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Bus Results */}
                            {/* <BusResults
                                isLoading={isLoading}
                                sortedBuses={sortedBuses}
                                showDetails={showDetails}
                                setShowDetails={setShowDetails}
                                formatPrice={formatPrice}
                                getTypeIcon={getTypeIcon}
                                getAmenityIcon={getAmenityIcon}
                                selectedDate={selectedDate}
                            /> */}
                            {fetchAttempted && fetchError ? (
                                <Card className="text-center py-12">
                                    <CardContent>
                                        <Map className="h-12 w-12 text-red-500 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium mb-2 text-red-600">Lỗi khi tải dữ liệu</h3>
                                        <p className="text-[hsl(var(--muted-foreground))] mb-4">{fetchError}</p>
                                        <div className="flex justify-center gap-2">
                                            <Button onClick={() => {
                                                setIsLoading(true);
                                                setFetchError(null);
                                                fetchBuses(selectedRoute?.from, selectedRoute?.to, selectedDate)
                                                    .finally(() => setIsLoading(false));
                                            }}>Thử lại</Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <BusResults
                                    isLoading={isLoading}
                                    sortedBuses={sortedBuses}
                                    showDetails={showDetails}
                                    setShowDetails={setShowDetails}
                                    formatPrice={formatPrice}
                                    getTypeIcon={getTypeIcon}
                                    getAmenityIcon={getAmenityIcon}
                                    selectedDate={selectedDate}
                                />
                            )}
                            
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
