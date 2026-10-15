"use client"
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Checkbox } from '../../components/ui/checkbox';
import { Separator } from '../../components/ui/separator';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
    Plane,
    ArrowRight,
    Clock,
    Luggage,
    Wifi,
    Coffee,
    Star,
    Calendar,
    Users,
    CreditCard,
    Shield,
    AlertCircle,
    ChevronLeft,
    MapPin,
    Timer,
    PlusCircle,
    Info,
    Minus,
    Plus,
} from 'lucide-react';
import { toast } from 'sonner';


// same cache key used in FlightResults
const CACHE_KEY = 'amadeus_pricing_cache_v1';

const loadCacheFromStorage = () => {
    try {
        if (typeof window === 'undefined') return {};
        const raw = localStorage.getItem(CACHE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }

};


// Sample flight data - normally would come from API based on ID
const flightDetails = {
    id: 1,
    airline: 'Vietnam Airlines',
    flightNumber: 'VN1546',
    departure: { time: '06:15', airport: 'SGN', city: 'TP.HCM', terminal: 'Terminal 1' },
    arrival: { time: '08:30', airport: 'HAN', city: 'Hà Nội', terminal: 'Terminal 1' },
    duration: '2h 15m',
    aircraft: 'Airbus A321',
    date: '15/01/2025',
    price: 1990000,
    originalPrice: 2490000,
    class: 'Phổ thông',
    baggage: { handbag: '7kg', checkin: '23kg' },
    amenities: ['wifi', 'meal', 'entertainment'],
    cancellable: true,
    changeable: true,
    availableSeats: 12,
    discount: 20,
    fareRules: {
        basic: { price: 1990000, changeFee: 500000, cancelFee: 1000000, baggage: '23kg' },
        standard: { price: 2190000, changeFee: 200000, cancelFee: 500000, baggage: '23kg', seatSelection: true },
        flex: { price: 2490000, changeFee: 0, cancelFee: 0, baggage: '30kg', seatSelection: true, priority: true },
    }
};

const addOnServices = [
    // {
    //     id: 'baggage_10',
    //     name: 'Hành lý ký gửi thêm 10kg',
    //     price: 200000,
    //     description: 'Thêm 10kg hành lý ký gửi (tối đa 33kg)',
    // },
    // {
    //     id: 'seat_selection',
    //     name: 'Chọn chỗ ngồi',
    //     price: 150000,
    //     description: 'Chọn chỗ ngồi yêu thích trên máy bay',
    // },
    {
        id: 'meal_upgrade',
        name: 'Nâng cấp suất ăn',
        price: 300000,
        description: 'Suất ăn cao cấp với nhiều lựa chọn',
    },
    {
        id: 'priority_checkin',
        name: 'Check-in ưu tiên',
        price: 100000,
        description: 'Check-in nhanh chóng tại sân bay',
    },
    {
        id: 'travel_insurance',
        name: 'Bảo hiểm du lịch',
        price: 250000,
        description: 'Bảo hiểm toàn diện cho chuyến đi',
    },
];

export default function ChiTietVeMayBay() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id ?? null;

    const [isLoadingSeatmap, setIsLoadingSeatmap] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // --- ADDED: mapped state for easier UI ---
    const [bookedSeatsByLeg, setBookedSeatsByLeg] = useState<{
        outbound: string[];
        inbound: string[];
    }>({ outbound: [], inbound: [] });
    const [cachedPricing, setCachedPricing] = useState<any | null>(null);
    const [cachedSeatmap, setCachedSeatmap] = useState<any | null>(null);
    const [mappedOffer, setMappedOffer] = useState<any | null>(null);
    const [seatmapSummary, setSeatmapSummary] = useState<any | null>(null);

    // --- NEW: roundtrip and per-leg cached pricing state (prevent ReferenceError) ---
    const [isRoundtrip, setIsRoundtrip] = useState<boolean>(false);
    const [selectedLeg, setSelectedLeg] = useState<'outbound' | 'inbound'>('outbound');
    const [outboundCachedPricing, setOutboundCachedPricing] = useState<any | null>(null);
    const [inboundCachedPricing, setInboundCachedPricing] = useState<any | null>(null);

    // --- NEW: parsed seatmaps / amenities per leg (used to switch UI between outbound/inbound) ---
    const [parsedSeatmaps, setParsedSeatmaps] = useState<Record<string, any[]>>({});
    const [parsedAmenitiesByLeg, setParsedAmenitiesByLeg] = useState<Record<string, any>>({});
    const [markedSeatRows, setMarkedSeatRows] = useState<Array<{ row: string; seats: any[] }>>([]);
    // --- NEW: small helper to extract a usable flight-offer object from pricing payloads ---
    // --- NEW: helper to extract a usable flight-offer object from pricing payloads (improved) ---
    const extractOfferFromPricing = (pricing: any) => {
        if (!pricing) return null;
        try {
            let offer = null;
            console.log('pricing in extractOfferFromPricing:', pricing);
            console.log('pricing.type:', pricing?.type);
            console.log('pricing.data:', pricing?.data);

            // Check if pricing is already an offer
            if (pricing?.type === 'flight-offer') {
                offer = pricing;
            }
            // Standard Amadeus response
            else if (pricing?.data?.flightOffers?.[0]) {
                offer = pricing.data.flightOffers[0];
            }
            // Fallback: pricing.data as array
            else if (Array.isArray(pricing?.data) && pricing.data.length > 0) {
                offer = pricing.data[0];
            }
            // Fallback: pricing.data as object
            else if (pricing?.data && typeof pricing.data === 'object' && !Array.isArray(pricing.data)) {
                offer = pricing.data;
            }
            // Fallback: pricing itself
            else if (pricing && typeof pricing === 'object' && !pricing.data) {
                offer = pricing;
            }

            console.log('offer:', offer);
            console.log('offer.itineraries:', offer?.itineraries);
            console.log('offer.itineraries[0]:', offer?.itineraries?.[0]);
            console.log('segments:', offer?.itineraries?.[0]?.segments);
            return offer ?? null;
        } catch (e) {
            console.warn('extractOfferFromPricing error:', e);
            return null;
        }
    };

    const isLoggedIn = () => {
        return !!localStorage.getItem('accessToken');
    };
    // --- NEW: helper to parse a seatmap payload into rows/summary/amenities and suggest free seats ---
    const parseSeatmap = (raw: any) => {
        try {
            const decks = raw?.decks ?? [];
            const allSeats: any[] = [];
            for (const d of decks) {
                for (const s of (d.seats ?? [])) {
                    const seatNum = s.number ?? '';
                    const rowMatch = String(seatNum).match(/\d+/);
                    const row = rowMatch ? rowMatch[0] : '0';

                    let travEntry: any = null;
                    if (Array.isArray(s.travelerPricing) && s.travelerPricing.length > 0) travEntry = s.travelerPricing[0];
                    else if (s.travelerPricing && typeof s.travelerPricing === 'object') travEntry = s.travelerPricing;

                    const availability = travEntry?.seatAvailabilityStatus ?? 'UNKNOWN';
                    const priceRaw = travEntry?.price?.total ?? travEntry?.price?.amount ?? null;
                    const price = priceRaw != null ? Number(String(priceRaw).replace(/[^\d.-]/g, '')) : 0;
                    const currency = travEntry?.price?.currency ?? travEntry?.price?.currencyCode ?? 'VND';
                    const characteristics = s.characteristicsCodes ?? s.characteristics ?? [];

                    allSeats.push({
                        id: seatNum,
                        number: seatNum,
                        row,
                        availability,
                        price: Number.isFinite(price) ? price : 0,
                        currency: currency ?? 'VND',
                        coords: s.coordinates ?? null,
                        characteristics,
                        raw: s
                    });
                }
            }

            const rowsMap: Record<string, any[]> = {};
            allSeats.forEach(s => {
                rowsMap[s.row] = rowsMap[s.row] ?? [];
                rowsMap[s.row].push(s);
            });
            const rows = Object.keys(rowsMap)
                .map(r => ({ row: r, seats: rowsMap[r].sort((a, b) => a.number.localeCompare(b.number)) }))
                .sort((a, b) => Number(a.row) - Number(b.row));

            const summary = {
                aircraftCode: raw?.aircraft?.code ?? raw?.data?.aircraft?.code ?? null,
                availableSeatsCounters: raw?.availableSeatsCounters ?? raw?.data?.availableSeatsCounters ?? null,
                rawSeatmap: raw
            };

            const amenities = raw?.aircraftCabinAmenities ?? null;

            // Suggest free seats: AVAILABLE, price === 0, NOT marked CH
            const freeSeats = allSeats.filter(s => {
                const chars = (s.characteristics ?? []).map((c: string) => String(c).toUpperCase());
                const hasCH = chars.includes('CH');
                const priceIsZero = Number(s.price || 0) === 0;
                return s.availability === 'AVAILABLE' && priceIsZero && !hasCH;
            });

            return { rows, summary, amenities, freeSeats };
        } catch (e) {
            console.warn('parseSeatmap error', e);
            return { rows: [], summary: null, amenities: null, freeSeats: [] };
        }
    };

    // dynamic add-ons: static fallback + any included resources from pricing (bags, credit-card-fees, other-services, detailed-fare-rules, ...)
    const [dynamicAddOnServices, setDynamicAddOnServices] = useState<typeof addOnServices>(addOnServices);
    // seatmap UI state
    const [seatRows, setSeatRows] = useState<Array<{ row: string; seats: any[] }>>([]);
    // const [selectedSeats, setSelectedSeats] = useState<any[]>([]);
    // convenience: aircraft amenities loaded from seatmap
    const [aircraftAmenities, setAircraftAmenities] = useState<any | null>(null);
    // seatmap ref + instruction banner for UX when seat-selection addon enabled
    const seatmapRef = useRef<HTMLElement | null>(null);
    const [showSeatSelectionInstruction, setShowSeatSelectionInstruction] = useState(false);

    // Số lượng khách từng loại (moved up so useEffect can reference participants safely)
    const [participants, setParticipants] = useState({
        adults: 1,
        children: 0,
        infants: 0,
    });
    const [selectedFare, setSelectedFare] = useState('basic');
    const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);

    // per-addOn flag: true = mua cho tất cả hành khách, false = chỉ 1 (khi người dùng xác nhận)
    const [addOnPerPassenger, setAddOnPerPassenger] = useState<Record<string, number>>({});
    // prevent duplicate confirmations / re-entrant calls for same add-on
    const addOnProcessingRef = useRef<Record<string, boolean>>({});
    // New state for per-leg add-ons and seats
    const [selectedAddOnsByLeg, setSelectedAddOnsByLeg] = useState<{
        outbound: string[];
        inbound: string[];
    }>({ outbound: [], inbound: [] });

    const [selectedSeatsByLeg, setSelectedSeatsByLeg] = useState<{
        outbound: any[];
        inbound: any[];
    }>({ outbound: [], inbound: [] });
    const [passengerInfo, setPassengerInfo] = useState({
        title: 'Mr',
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        nationality: 'VN',
        idNumber: '',
        idType: 'cccd',
    });
    const [contactInfo, setContactInfo] = useState({
        email: '',
        phone: '',
        address: '',
    });

    // Hàm helper để mark occupied seats (chỉ cho leg cụ thể)
    // Hàm helper để mark occupied seats (chỉ cho leg cụ thể)
    const markOccupiedSeats = (rows: any[], leg: 'outbound' | 'inbound') => {
        console.log(`🔍 [ChiTietMayBay] Mark OCCUPIED cho leg: ${leg}`);
        console.log(`🔍 [ChiTietMayBay] bookedSeatsByLeg[${leg}]:`, bookedSeatsByLeg[leg]); // Bây giờ có thể có dữ liệu từ vé


        // Sửa: Log tất cả ghế có price > 0 (bỏ 'CH' để debug)
        const paidSeats = rows.flatMap((r: any) => r.seats.filter((s: any) => s.price > 0));
        console.log(`🔍 [${leg}] Ghế trả phí (price > 0):`, paidSeats.map(s => ({ number: s.number, price: s.price, availability: s.availability, characteristics: s.characteristics })));
        console.log(`🔍 [${leg}] Ghế trả phí có trong bookedSeatsByLeg[${leg}]:`, paidSeats.filter(s => bookedSeatsByLeg[leg].includes(s.number)).map(s => s.number));

        // Thêm log tổng availability
        const allSeats = rows.flatMap(r => r.seats);
        const availableCount = allSeats.filter(s => s.availability === 'AVAILABLE').length;
        const occupiedCount = allSeats.filter(s => s.availability === 'OCCUPIED').length;
        const blockedCount = allSeats.filter(s => s.availability === 'BLOCKED').length;
        console.log(`📊 [${leg}] Tổng ghế: ${allSeats.length}, AVAILABLE: ${availableCount}, OCCUPIED: ${occupiedCount}, BLOCKED: ${blockedCount}`);


        const markedRows = rows.map(row => ({
            ...row,
            seats: row.seats.map((seat: any) => {
                const isOccupiedFromBooking = bookedSeatsByLeg[leg].includes(seat.number); // Có thể true nếu có vé match
                if (isOccupiedFromBooking) {
                    console.log(`✅ [ChiTietMayBay] Ghế ${seat.number} được mark OCCUPIED (từ bookedSeatsByLeg - vé đã đặt)`);
                }
                return {
                    ...seat,
                    availability: isOccupiedFromBooking ? 'OCCUPIED' : seat.availability, // Thêm OCCUPIED từ vé nếu match
                };
            }),
        }));
        const occupiedFromAmadeus = markedRows.flatMap((r: any) => r.seats.filter((s: any) => s.availability === 'OCCUPIED' && !bookedSeatsByLeg[leg].includes(s.number)).map((s: any) => s.number));
        const occupiedFromBooking = bookedSeatsByLeg[leg];
        console.log(`🔍 [ChiTietMayBay] Ghế OCCUPIED từ Amadeus:`, occupiedFromAmadeus);
        console.log(`🔍 [ChiTietMayBay] Ghế OCCUPIED từ vé đã đặt:`, occupiedFromBooking);
        console.log(`🔍 [ChiTietMayBay] Tổng ghế OCCUPIED sau mark:`, markedRows.flatMap((r: any) => r.seats.filter((s: any) => s.availability === 'OCCUPIED').map((s: any) => s.number))); // Từ Amadeus + vé nếu có

        // Thêm log tổng hợp cho từng chuyến
        const totalOccupiedFromAmadeus = occupiedFromAmadeus.length;
        const totalOccupiedFromBooking = occupiedFromBooking.length;
        const totalOccupiedFinal = markedRows.flatMap((r: any) => r.seats.filter((s: any) => s.availability === 'OCCUPIED')).length;
        console.log(`📊 [${leg.toUpperCase()}] Tổng ghế OCCUPIED từ Amadeus: ${totalOccupiedFromAmadeus}`);
        console.log(`📊 [${leg.toUpperCase()}] Tổng ghế OCCUPIED từ vé đã đặt: ${totalOccupiedFromBooking}`);
        console.log(`📊 [${leg.toUpperCase()}] Tổng ghế OCCUPIED cuối cùng: ${totalOccupiedFinal}`);

        return markedRows;
    };



    // add: validation state for lead passenger + contact
    const [passengerErrors, setPassengerErrors] = useState<Record<string, string>>({});
    const [contactErrors, setContactErrors] = useState<Record<string, string>>({});

    const validateLeadPassengerAndContact = () => {
        const pErr: Record<string, string> = {};
        const cErr: Record<string, string> = {};

        if (!passengerInfo.firstName.trim()) pErr.firstName = 'Họ và tên đệm bắt buộc';
        if (!passengerInfo.lastName.trim()) pErr.lastName = 'Tên bắt buộc';
        if (!passengerInfo.dateOfBirth) pErr.dateOfBirth = 'Ngày sinh bắt buộc';
        else {
            const dob = new Date(passengerInfo.dateOfBirth);
            if (isNaN(dob.getTime()) || dob > new Date()) pErr.dateOfBirth = 'Ngày sinh không hợp lệ';
        }
        if (!passengerInfo.idNumber.trim()) pErr.idNumber = 'Số giấy tờ bắt buộc';
        else if (passengerInfo.idType === 'cccd' && !/^\d{12}$/.test(passengerInfo.idNumber)) pErr.idNumber = 'CCCD phải có 12 chữ số';

        if (!contactInfo.email.trim()) cErr.email = 'Email liên hệ bắt buộc';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactInfo.email)) cErr.email = 'Email không hợp lệ';
        if (!contactInfo.phone.trim()) cErr.phone = 'Số điện thoại liên hệ bắt buộc';
        else if (!/^\d{10,11}$/.test(contactInfo.phone)) cErr.phone = 'Số điện thoại không hợp lệ';

        setPassengerErrors(pErr);
        setContactErrors(cErr);

        return Object.keys(pErr).length === 0 && Object.keys(cErr).length === 0;
    };

    useEffect(() => {
        if (!id) return;
        try {
            const lookupId = decodeURIComponent(String(id));
            const stored = loadCacheFromStorage();
            console.log('[Flight detail] id=', lookupId, 'cache present:', Boolean(stored));


            // Thêm kiểm tra lỗi trong pricing
            const checkPricingForErrors = (pricing: any) => {
                if (pricing && pricing.errors && Array.isArray(pricing.errors)) {
                    const hasSystemError = pricing.errors.some((err: any) =>
                        err.code === 141 &&
                        err.title === "SYSTEM ERROR HAS OCCURRED" &&
                        err.detail === "Unknown error" &&
                        err.status === 500
                    );
                    if (hasSystemError) {
                        return "Rất tiếc, hệ thống đối tác đang gặp sự cố tạm thời nên chuyến bay này không thể hiển thị. Bạn vui lòng chọn chuyến bay khác hoặc thử lại sau ít phút. Chúng tôi xin lỗi vì sự bất tiện này.";
                    }
                }
                return null;
            };

            let derivedParticipants = { adults: 1, children: 0, infants: 0 };

            // Hàm helper để lấy số lượng hành khách từ pricing
            const deriveParticipants = (pricing: any) => {
                const offer = extractOfferFromPricing(pricing);
                const tps = Array.isArray(offer?.travelerPricings) ? offer.travelerPricings : [];
                if (tps.length > 0) {
                    const adults = tps.filter((t: any) => String(t?.travelerType ?? '').toUpperCase().startsWith('ADULT')).length;
                    const children = tps.filter((t: any) => /CHILD/i.test(String(t?.travelerType ?? ''))).length;
                    const infants = tps.filter((t: any) => /INFANT/i.test(String(t?.travelerType ?? ''))).length;
                    return { adults, children, infants };
                }
                return null;
            };

            if (lookupId.includes('__')) {
                const [outKey, inKey] = lookupId.split('__');
                const outPricing = stored?.pricing?.[outKey] ?? null;
                const inPricing = stored?.pricing?.[inKey] ?? null;
                console.log('[Flight detail] roundtrip wrapper detected, outKey=', outKey, 'inKey=', inKey);


                // Kiểm tra lỗi cho outbound và inbound
                const outError = checkPricingForErrors(outPricing);
                const inError = checkPricingForErrors(inPricing);
                if (outError || inError) {
                    setError(outError || inError);
                    return; // Ngăn xử lý tiếp
                }

                setIsRoundtrip(true);
                setOutboundCachedPricing(outPricing);
                setInboundCachedPricing(inPricing);
                if (outPricing) setCachedPricing(outPricing);
                else if (inPricing) setCachedPricing(inPricing);

                // Lấy số lượng hành khách từ cả hai chặng và đảm bảo nhất quán
                const outParticipants = deriveParticipants(outPricing);
                const inParticipants = deriveParticipants(inPricing);
                if (outParticipants && inParticipants) {
                    // Kiểm tra sự nhất quán
                    if (
                        outParticipants.adults !== inParticipants.adults ||
                        outParticipants.children !== inParticipants.children ||
                        outParticipants.infants !== inParticipants.infants
                    ) {
                        console.warn('Participant counts mismatch between outbound and inbound', outParticipants, inParticipants);
                    }
                    // Lấy số lượng từ outbound (ưu tiên) hoặc inbound
                    derivedParticipants = outParticipants || inParticipants;
                } else if (outParticipants) {
                    derivedParticipants = outParticipants;
                } else if (inParticipants) {
                    derivedParticipants = inParticipants;
                }

                // Cập nhật seatmaps
                if (stored?.seatmap?.[outKey]) {
                    const rawOut = stored.seatmap[outKey];
                    setCachedSeatmap((prev: any) => ({ ...(prev || {}), outbound: rawOut }));
                    const parsedOut = parseSeatmap(rawOut);
                    setParsedSeatmaps((prev: any) => ({ ...(prev || {}), outbound: parsedOut.rows }));
                    setParsedAmenitiesByLeg((prev: any) => ({ ...(prev || {}), outbound: parsedOut.amenities }));
                    setSeatmapSummary(parsedOut.summary);
                    setAircraftAmenities(parsedOut.amenities);
                    setSeatRows(parsedOut.rows);
                    // Mark occupied seats for outbound
                    if (parsedOut.rows.length > 0) {
                        const markedRows = markOccupiedSeats(parsedOut.rows, 'outbound');
                        setSeatRows(markedRows);
                    }
                }
                if (stored?.seatmap?.[inKey]) {
                    const rawIn = stored.seatmap[inKey];
                    setCachedSeatmap((prev: any) => ({ ...(prev || {}), inbound: rawIn }));
                    const parsedIn = parseSeatmap(rawIn);
                    setParsedSeatmaps((prev: any) => ({ ...(prev || {}), inbound: parsedIn.rows }));
                    setParsedAmenitiesByLeg((prev: any) => ({ ...(prev || {}), inbound: parsedIn.amenities }));
                }
            } else {
                const pricing = stored?.pricing?.[lookupId];
                const pricingError = checkPricingForErrors(pricing);
                if (pricingError) {
                    setError(pricingError);
                    return; // Ngăn xử lý tiếp
                }
                if (stored?.pricing?.[lookupId]) {
                    setCachedPricing(stored.pricing[lookupId]);
                    const offer = extractOfferFromPricing(stored.pricing[lookupId]);
                    const tps = Array.isArray(offer?.travelerPricings) ? offer.travelerPricings : [];
                    if (tps.length > 0) {
                        derivedParticipants = {
                            adults: tps.filter((t: any) => String(t?.travelerType ?? '').toUpperCase().startsWith('ADULT')).length,
                            children: tps.filter((t: any) => /CHILD/i.test(String(t?.travelerType ?? ''))).length,
                            infants: tps.filter((t: any) => /INFANT/i.test(String(t?.travelerType ?? ''))).length,
                        };
                    }
                    setMappedOffer({
                        numberOfBookableSeats: offer?.numberOfBookableSeats ?? null,
                        total: offer?.price?.total ?? null,
                        currency: offer?.price?.currency ?? 'VND',
                        travelerPricingsCount: tps.length,
                        validatingAirlines: offer?.validatingAirlineCodes ?? [],
                        lastTicketingDate: offer?.lastTicketingDate ?? null,
                        rawOffer: offer,
                    });
                }
                if (stored?.seatmap?.[lookupId]) {
                    const raw = stored.seatmap[lookupId];
                    setCachedSeatmap(raw);
                    const parsed = parseSeatmap(raw);
                    setSeatRows(parsed.rows);
                    // Mark occupied seats
                    if (parsed.rows.length > 0) {
                        const markedRows = markOccupiedSeats(parsed.rows, 'outbound');
                        setSeatRows(markedRows);
                    }
                    setParsedSeatmaps((prev) => ({ ...(prev || {}), outbound: parsed.rows }));
                    setParsedAmenitiesByLeg((prev) => ({ ...(prev || {}), outbound: parsed.amenities }));
                    setSeatmapSummary(parsed.summary);
                    setAircraftAmenities(parsed.amenities);
                }
            }


            // Cập nhật participants chỉ khi khác với trạng thái hiện tại
            const totalCurrent = participants.adults + participants.children + participants.infants;
            const totalDerived = derivedParticipants.adults + derivedParticipants.children + derivedParticipants.infants;
            if (totalDerived > 0 && totalDerived !== totalCurrent) {
                setParticipants({
                    adults: Math.max(1, derivedParticipants.adults || 1),
                    children: derivedParticipants.children || 0,
                    infants: derivedParticipants.infants || 0,
                });
            }

            // Xử lý add-ons
            let inc: any = {};
            if (lookupId.includes('__')) {
                const [outKey, inKey] = lookupId.split('__');
                inc = {
                    ...(stored.pricing?.[outKey]?.included ?? {}),
                    ...(stored.pricing?.[inKey]?.included ?? {}),
                };
            } else {
                inc = stored.pricing?.[lookupId]?.included ?? {};
            }
            const includedAddOns: any[] = [];
            for (const [key, val] of Object.entries(inc || {})) {
                if (key === 'detailed-fare-rules' || key === 'credit-card-fees') continue;
                if (Array.isArray(val)) {
                    val.forEach((entry, idx) => {
                        const price = entry?.price?.amount ?? entry?.amount ?? null;
                        const currency = entry?.price?.currencyCode ?? entry?.price?.currency ?? 'VND';
                        const qty = entry?.quantity ?? null;
                        const baseName = entry?.name ?? `${key} ${idx + 1}`;
                        const name = key === 'bags' && qty ? `${baseName} (${qty} kiện)` : baseName;
                        let desc = entry?.description ?? entry?.text ?? (entry?.fareNotes?.descriptions?.[0]?.text ?? key);
                        if (key === 'bags') {
                            const qtyNote = qty ? `Số kiện: ${qty}` : '';
                            desc = [qtyNote, desc].filter(Boolean).join('\n');
                        }
                        includedAddOns.push({
                            id: `${key}_${idx}`,
                            name,
                            price: price != null ? Number(String(price).replace(/[^\d.-]/g, '')) : 0,
                            currency: currency ?? 'VND',
                            description: desc ? String(desc).slice(0, 300) : key,
                            raw: entry,
                            sourceKey: key,
                        });
                    });
                } else if (typeof val === 'object') {
                    if (val) {
                        Object.entries(val).forEach(([subKey, entry]: any, idx) => {
                            if (!entry) return;
                            const price = entry?.price?.amount ?? entry?.amount ?? entry?.amount?.value ?? null;
                            const currency = entry?.price?.currencyCode ?? entry?.price?.currency ?? entry?.currency ?? 'VND';
                            const qty = entry?.quantity ?? null;
                            let name = entry?.name ?? entry?.brand ?? `${key} ${subKey}`;
                            let desc = entry?.fareNotes?.descriptions?.[0]?.text ?? entry?.text ?? entry?.description ?? key;
                            if (key === 'bags') {
                                name = entry?.name ? `${entry.name}${qty ? ` (${qty} kiện)` : ''}` : `${key} ${subKey}${qty ? ` (${qty} kiện)` : ''}`;
                                const qtyNote = qty ? `Số kiện: ${qty}` : '';
                                desc = [qtyNote, desc].filter(Boolean).join('\n');
                            }
                            includedAddOns.push({
                                id: `${key}_${subKey}`,
                                name,
                                price: price != null ? Number(String(price).replace(/[^\d.-]/g, '')) : 0,
                                currency: currency ?? 'VND',
                                description: desc ? String(desc).slice(0, 300) : key,
                                raw: entry,
                                sourceKey: key,
                            });
                        });
                    }
                }
            }
            setDynamicAddOnServices([...addOnServices, ...includedAddOns.filter(ia => !addOnServices.some(s => s.id === ia.id))]);
        } catch (e) {
            console.warn('Error loading cached pricing/seatmap', e);
            setError("Có lỗi xảy ra khi tải dữ liệu chuyến bay. Vui lòng thử lại.");
        }
    }, [id]);
    // ...existing code...

    useEffect(() => {
        if (!id) return;
        const fetchAndMatchTickets = async () => {
            try {
                setIsLoadingSeatmap(true);
                // Log ngày của flight hiện tại từ pricing
                console.log(`🔍 [ChiTietMayBay] Ngày flight outbound:`, outboundCachedPricing ? extractOfferFromPricing(outboundCachedPricing)?.itineraries?.[0]?.segments?.[0]?.departure?.at?.split('T')?.[0] : cachedPricing ? extractOfferFromPricing(cachedPricing)?.itineraries?.[0]?.segments?.[0]?.departure?.at?.split('T')?.[0] : 'Không có');
                if (isRoundtrip && inboundCachedPricing) {
                    console.log(`🔍 [ChiTietMayBay] Ngày flight inbound:`, extractOfferFromPricing(inboundCachedPricing)?.itineraries?.[0]?.segments?.[0]?.departure?.at?.split('T')?.[0] || 'Không có');
                }

                // Fetch tickets: chỉ lấy flight tickets với status paid/changed
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080'}/api/tickets?type=flight&status=paid&status=changed`);
                if (!response.ok) return;
                const { data: tickets } = await response.json();

                const outboundBooked: string[] = [];
                const inboundBooked: string[] = [];

                // Hàm helper để so khớp flight info (sửa: bỏ segTime để match linh hoạt hơn)
                function matchFlight(segment: any, ticketFlight: any) {
                    const segCarrier = segment?.carrierCode;
                    const tickCarrier = ticketFlight?.airline;
                    const segFlightNum = segment?.carrierCode + segment?.number;
                    const tickFlightNum = ticketFlight?.flightNumber;
                    const segDepIata = segment?.departure?.iataCode;
                    const tickDepIata = ticketFlight?.depIata;
                    const segArrIata = segment?.arrival?.iataCode;
                    const tickArrIata = ticketFlight?.arrIata;
                    const segDate = segment?.departure?.at?.split('T')?.[0];
                    const tickDate = ticketFlight?.date;
                    // Bỏ segTime check để tránh bỏ sót match
                    // const segTime = segment?.departure?.at?.includes(ticketFlight?.time?.split(' - ')?.[0]?.trim());

                    const match = (
                        segCarrier === tickCarrier &&
                        segFlightNum === tickFlightNum &&
                        segDepIata === tickDepIata &&
                        segArrIata === tickArrIata &&
                        segDate === tickDate
                        // && segTime  // Bỏ này
                    );
                    if (match) {
                        console.log('✅ Matched flight segment:', segment, 'with ticket flight:', ticketFlight);
                    } else {
                        console.log('❌ No match for segment:', segment, 'and ticket flight:', ticketFlight);
                    }
                    return match;
                }

                // Duyệt tickets và match
                tickets.forEach((ticket: any) => {
                    console.log('🔍 Checking ticket:', ticket.ticketNumber, 'status:', ticket.status, 'uniq:', ticket.uniq);
                    const resInfo = ticket.reservationInfo || {};
                    console.log('🔍 reservationInfo:', resInfo); // Log đầy đủ reservationInfo
                    const outboundFlight = resInfo.flights?.outbound;
                    const inboundFlight = resInfo.flights?.inbound;
                    console.log('🔍 outboundFlight:', outboundFlight); // Log outboundFlight
                    console.log('🔍 inboundFlight:', inboundFlight); // Log inboundFlight

                    // Lấy leg từ uniq hoặc pricing.seats
                    const uniqParts = (ticket.uniq || '').split('::');
                    const legFromUniq = uniqParts.includes('outbound') ? 'outbound' : uniqParts.includes('inbound') ? 'inbound' : null;
                    const legFromPricing = ticket.pricing?.seats?.[0]?.leg || null;
                    let hasMatch = false;

                    // const legsToCheck: Array<'outbound' | 'inbound'> = [];
                    // if (legFromPricing) legsToCheck.push(legFromPricing);
                    // if (legFromUniq && !legsToCheck.includes(legFromUniq as any)) legsToCheck.push(legFromUniq as any);
                    // if (outboundFlight && !legsToCheck.includes('outbound')) legsToCheck.push('outbound');
                    // if (inboundFlight && !legsToCheck.includes('inbound')) legsToCheck.push('inbound');

                    // // Nếu không có legsToCheck, thử match với tất cả legs có thể
                    // if (legsToCheck.length === 0) {
                    //     legsToCheck.push('outbound');
                    //     if (isRoundtrip) legsToCheck.push('inbound');
                    // }

                    // legsToCheck.forEach((leg) => {
                    //     const ticketFlight = leg === 'outbound' ? outboundFlight : (inboundFlight || outboundFlight);
                    //     if (!ticketFlight) return;

                    //     ticketFlight.airline = ticketFlight.flightNumber.slice(0, 2).toUpperCase();
                    //     // Thêm set depIata và arrIata từ itineraries
                    //     ticketFlight.depIata = ticketFlight.itineraries?.[0]?.segments?.[0]?.departure?.iataCode;
                    //     ticketFlight.arrIata = ticketFlight.itineraries?.[0]?.segments?.[0]?.arrival?.iataCode;

                    //     console.log(`🔍 [${leg}] ticketFlight fields: carrier=${ticketFlight.airline}, flightNum=${ticketFlight.flightNumber}, depIata=${ticketFlight.depIata}, arrIata=${ticketFlight.arrIata}, date=${ticketFlight.date}, time=${ticketFlight.time}`); // Log các trường match từ ticketFlight

                    //     const pricingToUse = leg === 'outbound' ? (outboundCachedPricing || cachedPricing) : (inboundCachedPricing || cachedPricing);
                    //     console.log(`🔍 [${leg}] pricingToUse:`, pricingToUse); // Log debug pricingToUse
                    //     const offer = extractOfferFromPricing(pricingToUse);
                    //     console.log(`🔍 [${leg}] offer:`, offer); // Log debug offer

                    //     const itineraryIndex = leg === 'outbound' ? 0 : (offer?.itineraries?.length > 1 ? 1 : 0);
                    //     const segment = offer?.itineraries?.[itineraryIndex]?.segments?.[0];
                    //     console.log(`🔍 [${leg}] segment:`, segment); // Log debug segment
                    //     console.log(`🔍 [${leg}] segment fields: carrier=${segment?.carrierCode}, flightNum=${segment?.carrierCode + segment?.number}, depIata=${segment?.departure?.iataCode}, arrIata=${segment?.arrival?.iataCode}, date=${segment?.departure?.at?.split('T')?.[0]}, time=${segment?.departure?.at}`); // Log các trường match từ segment

                    //     const didMatch = segment ? matchFlight(segment, ticketFlight) : false;

                    //     // if (didMatch && (ticket.status === 'paid' || ticket.status === 'changed')) {
                    //     //     hasMatch = true;
                    //     //     // Nếu match, lấy tất cả ghế từ ticket (không phụ thuộc leg cụ thể)
                    //     //     const ticketSeats = ticket.seats ?? [];
                    //     //     if (Array.isArray(ticketSeats) && ticketSeats.length > 0) {
                    //     //         // Sửa: Thêm vào leg cụ thể đang match, không phải selectedLeg
                    //     //         if (leg === 'outbound') {
                    //     //             outboundBooked.push(...ticketSeats);
                    //     //         } else {
                    //     //             inboundBooked.push(...ticketSeats);
                    //     //         }
                    //     //         console.log(`➕ [MATCHED - ${leg}] Added all seats from ticket ${ticket.ticketNumber} for leg ${leg}:`, ticketSeats);
                    //     //     } else {
                    //     //         // Fallback: pricing.seats
                    //     //         const pricingSeats = ticket.pricing?.seats ?? [];
                    //     //         const allSeats = pricingSeats.map((s: any) => s.number);
                    //     //         if (leg === 'outbound') {
                    //     //             outboundBooked.push(...allSeats);
                    //     //         } else {
                    //     //             inboundBooked.push(...allSeats);
                    //     //         }
                    //     //         console.log(`➕ [MATCHED - ${leg}] Added all seats from ticket ${ticket.ticketNumber} pricing for leg ${leg}:`, allSeats);
                    //     //     }
                    //     // }
                    //     if (didMatch && (ticket.status === 'paid' || ticket.status === 'changed')) {
                    //         hasMatch = true;
                    //         const ticketSeats = ticket.seats ?? [];
                    //         if (Array.isArray(ticketSeats) && ticketSeats.length > 0) {
                    //             // Sửa: Nếu !isRoundtrip, luôn dùng 'outbound'
                    //             const legToUse = !isRoundtrip ? 'outbound' : leg;  // leg là từ ticket
                    //             if (legToUse === 'outbound') {
                    //                 outboundBooked.push(...ticketSeats);
                    //             } else {
                    //                 inboundBooked.push(...ticketSeats);
                    //             }
                    //             console.log(`➕ [MATCHED - ${legToUse}] Added all seats from ticket ${ticket.ticketNumber} for leg ${legToUse}:`, ticketSeats);
                    //         } else {
                    //             // Sửa: Filter pricingSeats theo legToUse nếu có field leg
                    //             const pricingSeats = ticket.pricing?.seats ?? [];
                    //             const filteredSeats = pricingSeats.filter((s: any) => !s.leg || s.leg === legToUse);  // Nếu không có leg, giữ nguyên
                    //             const allSeats = filteredSeats.map((s: any) => s.number);
                    //             const legToUse = !isRoundtrip ? 'outbound' : leg;
                    //             if (legToUse === 'outbound') {
                    //                 outboundBooked.push(...allSeats);
                    //             } else {
                    //                 inboundBooked.push(...allSeats);
                    //             }
                    //             console.log(`➕ [MATCHED - ${legToUse}] Added all seats from ticket ${ticket.ticketNumber} pricing for leg ${legToUse}:`, allSeats);
                    //         }
                    //     }
                    // });

                    // const legsToCheck = isRoundtrip ? ['outbound', 'inbound'] : ['outbound'];
                    const legsToCheck = ['outbound', 'inbound'];


                    // Bỏ logic legFromUniq, legFromPricing, outboundFlight, inboundFlight check
                    // Chỉ dựa trên match với pricing của chuyến hiện tại

                    // Sau đó, trong loop:
                    for (const leg of legsToCheck) {
                        const ticketFlight = leg === 'outbound' ? outboundFlight : (inboundFlight || outboundFlight);
                        if (!ticketFlight) continue;

                        ticketFlight.airline = ticketFlight.flightNumber.slice(0, 2).toUpperCase();
                        // Thêm set depIata và arrIata từ itineraries
                        ticketFlight.depIata = ticketFlight.itineraries?.[0]?.segments?.[0]?.departure?.iataCode;
                        ticketFlight.arrIata = ticketFlight.itineraries?.[0]?.segments?.[0]?.arrival?.iataCode;

                        console.log(`🔍 [${leg}] ticketFlight fields: carrier=${ticketFlight.airline}, flightNum=${ticketFlight.flightNumber}, depIata=${ticketFlight.depIata}, arrIata=${ticketFlight.arrIata}, date=${ticketFlight.date}, time=${ticketFlight.time}`); // Log các trường match từ ticketFlight

                        const pricingToUse = leg === 'outbound' ? (outboundCachedPricing || cachedPricing) : (inboundCachedPricing || cachedPricing);
                        console.log(`🔍 [${leg}] pricingToUse:`, pricingToUse); // Log debug pricingToUse
                        const offer = extractOfferFromPricing(pricingToUse);
                        console.log(`🔍 [${leg}] offer:`, offer); // Log debug offer

                        const itineraryIndex = leg === 'outbound' ? 0 : (offer?.itineraries?.length > 1 ? 1 : 0);
                        const segment = offer?.itineraries?.[itineraryIndex]?.segments?.[0];
                        console.log(`🔍 [${leg}] segment:`, segment); // Log debug segment
                        console.log(`🔍 [${leg}] segment fields: carrier=${segment?.carrierCode}, flightNum=${segment?.carrierCode + segment?.number}, depIata=${segment?.departure?.iataCode}, arrIata=${segment?.arrival?.iataCode}, date=${segment?.departure?.at?.split('T')?.[0]}, time=${segment?.departure?.at}`); // Log các trường match từ segment

                        const didMatch = segment ? matchFlight(segment, ticketFlight) : false;

                        if (didMatch && (ticket.status === 'paid' || ticket.status === 'changed')) {
                            hasMatch = true;
                            const ticketSeats = ticket.seats ?? [];
                            if (Array.isArray(ticketSeats) && ticketSeats.length > 0) {
                                // Sửa: Nếu !isRoundtrip, luôn dùng 'outbound'
                                const legToUse = !isRoundtrip ? 'outbound' : leg;  // leg là từ ticket
                                if (legToUse === 'outbound') {
                                    outboundBooked.push(...ticketSeats);
                                } else {
                                    inboundBooked.push(...ticketSeats);
                                }
                                console.log(`➕ [MATCHED - ${legToUse}] Added all seats from ticket ${ticket.ticketNumber} for leg ${legToUse}:`, ticketSeats);
                            } else {
                                // Sửa: Filter pricingSeats theo legToUse nếu có field leg
                                const pricingSeats = ticket.pricing?.seats ?? [];
                                const filteredSeats = pricingSeats.filter((s: any) => !s.leg || s.leg === legToUse);  // Nếu không có leg, giữ nguyên
                                const allSeats = filteredSeats.map((s: any) => s.number);
                                const legToUse = !isRoundtrip ? 'outbound' : leg;
                                if (legToUse === 'outbound') {
                                    outboundBooked.push(...allSeats);
                                } else {
                                    inboundBooked.push(...allSeats);
                                }
                                console.log(`➕ [MATCHED - ${legToUse}] Added all seats from ticket ${ticket.ticketNumber} pricing for leg ${legToUse}:`, allSeats);
                            }
                        }
                    }
                    if (!hasMatch) {
                        console.log(`➖ No match for ticket ${ticket.ticketNumber}`);
                    }
                });

                setBookedSeatsByLeg({
                    outbound: [...new Set(outboundBooked)],
                    inbound: [...new Set(inboundBooked)],
                });
                if (seatRows.length > 0) {
                    const markedRows = markOccupiedSeats(seatRows, selectedLeg);
                    setSeatRows(markedRows);
                    setMarkedSeatRows(markedRows);
                }

                // Thêm log tổng cho cả hai chuyến
                console.log('📊 Tổng bookedSeatsByLeg (ghế từ vé đã đặt):', bookedSeatsByLeg);
                console.log('📊 Tổng ghế booked outbound:', bookedSeatsByLeg.outbound.length);
                console.log('📊 Tổng ghế booked inbound:', bookedSeatsByLeg.inbound.length);

                console.log('✅ Final bookedSeatsByLeg (including paid and changed):', { outbound: [...new Set(outboundBooked)], inbound: [...new Set(inboundBooked)] });
                setIsLoadingSeatmap(false);
            } catch (e) {
                console.warn('Error fetching/matching tickets', e);
                setIsLoadingSeatmap(false);
            }
        };

        fetchAndMatchTickets();
    }, [id, cachedPricing, inboundCachedPricing, selectedLeg]);
    // ...existing code...


    // const markedSeatRows = useMemo(() => markOccupiedSeats(seatRows, selectedLeg), [seatRows, selectedLeg]);

    // MOVE: formatPrice must be defined before we derive/display prices
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price);
    };

    // --- NEW: derive normalized fields from cached pricing for direct mapping into UI ---
    const normalizedOffer = (() => {
        if (isRoundtrip) {
            const chosenPricing = selectedLeg === 'outbound' ? outboundCachedPricing ?? cachedPricing : inboundCachedPricing ?? cachedPricing;
            return extractOfferFromPricing(chosenPricing) ?? null;
        }
        return mappedOffer?.rawOffer ?? null;
    })();
    const priceRaw = normalizedOffer?.price?.total ?? cachedPricing?.price?.total ?? flightDetails.price;
    const priceNumber = Number(String(priceRaw).replace(/[^\d.-]/g, '')) || Number(flightDetails.price);
    const currency = normalizedOffer?.price?.currency ?? cachedPricing?.price?.currency ?? 'VND';
    const displayPrice = currency === 'VND' ? formatPrice(priceNumber) : `${priceNumber.toLocaleString()} ${currency}`;

    // fare / baggage from traveler pricing if available
    const traveler = normalizedOffer?.travelerPricings?.[0] ?? null;
    const fareSeg = traveler?.fareDetailsBySegment?.[0] ?? traveler?.fareDetails?.[0] ?? null;
    const displayCabin = fareSeg?.includedCabinBags?.quantity ?? fareSeg?.includedCabinBags?.weight ?? flightDetails.baggage.handbag;
    const displayChecked = fareSeg?.includedCheckedBags?.quantity ?? fareSeg?.includedCheckedBags?.weight ?? flightDetails.baggage.checkin;

    // bookable seats
    const numberOfBookableSeats = normalizedOffer?.numberOfBookableSeats ?? mappedOffer?.numberOfBookableSeats ?? flightDetails.availableSeats;

    // simple refundable detection
    const parseRefundable = (obj: any) => {
        if (!obj) return false;
        const cand = obj?.price?.refundableTaxes ?? obj?.price?.refundableTaxesAmount ?? obj?.refundableTaxes ?? obj?.refundableTaxesAmount ?? null;
        if (cand == null) return false;
        const num = Number(String(cand).replace(/[^\d.-]/g, ''));
        return Number.isFinite(num) && num > 0;
    };
    const policyObj = cachedPricing?.data?.policies ?? cachedPricing?.policies ?? null;
    const isRefundable = (Array.isArray(normalizedOffer?.travelerPricings) && normalizedOffer.travelerPricings.some(parseRefundable)) || parseRefundable(normalizedOffer) || Boolean(policyObj?.cancellable) || flightDetails.cancellable;

    // changeable detection (basic): scan included detailed-fare-rules text for "CHANGE"
    const included = cachedPricing?.included ?? cachedPricing?.data?.included ?? {};
    const detailedFareRules = included?.['detailed-fare-rules'] ?? {};
    let isChangeable = flightDetails.changeable;
    try {
        for (const r of Object.values(detailedFareRules || {})) {
            const notes = (r as any)?.fareNotes?.descriptions ?? [];
            for (const n of notes) {
                if (String(n?.text ?? '').toUpperCase().includes('CHANGE')) {
                    isChangeable = true;
                    break;
                }
            }
            if (isChangeable) break;
        }
    } catch (e) { /* ignore */ }

    const totalParticipants = participants.adults + participants.children + participants.infants;
    const addOnClickRef = useRef(false); // Theo dõi trạng thái click

    // const toggleAddOn = (addOnId: string) => {
    //     if (addOnClickRef.current) return; // prevent rapid double-invokes
    //     addOnClickRef.current = true;

    //     try {
    //         const currentlySelected = selectedAddOns.includes(addOnId);

    //         // If currently selected -> remove immediately
    //         if (currentlySelected) {
    //             setSelectedAddOns(prev => prev.filter(id => id !== addOnId));
    //             setAddOnPerPassenger(prevFlags => {
    //                 const copy = { ...prevFlags };
    //                 delete copy[addOnId];
    //                 return copy;
    //             });
    //             if (addOnId === 'seat_selection') setShowSeatSelectionInstruction(false);
    //             return;
    //         }

    //         // Not selected -> determine per-passenger behavior (call confirm once if needed)
    //         const total = participants.adults + participants.children + participants.infants;
    //         let perPassenger = false;

    //         if (addOnId === 'seat_selection') {
    //             // seat selection: show instruction and scroll
    //             setShowSeatSelectionInstruction(true);
    //             if (seatmapRef.current && typeof seatmapRef.current.scrollIntoView === 'function') {
    //                 try { seatmapRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch { /* ignore */ }
    //             }
    //         } else if (addOnId === 'travel_insurance') {
    //             // always per passenger
    //             perPassenger = true;
    //         } else if (total > 1) {
    //             // ask user once (synchronous) and use answer
    //             const ok = window.confirm(`Bạn có ${total} hành khách. Bạn muốn mua dịch vụ này cho tất cả ${total} hành khách? (OK = tất cả, Cancel = chỉ 1)`);
    //             perPassenger = !!ok;
    //         }

    //         // apply decision to state (single update per state)
    //         setAddOnPerPassenger(prevFlags => ({ ...prevFlags, [addOnId]: perPassenger }));
    //         setSelectedAddOns(prev => [...prev, addOnId]);
    //     } finally {
    //         // small timeout to allow event loop to finish before releasing lock
    //         setTimeout(() => { addOnClickRef.current = false; }, 0);
    //     }
    // };
    // Hàm cập nhật số lượng khách


    const toggleAddOn = (addOnId: string) => {
        if (addOnClickRef.current) return;
        addOnClickRef.current = true;

        try {
            const leg = selectedLeg; // 'outbound' or 'inbound'
            const currentlySelected = selectedAddOnsByLeg[leg].includes(addOnId);

            if (currentlySelected) {
                setSelectedAddOnsByLeg((prev) => ({
                    ...prev,
                    [leg]: prev[leg].filter((id) => id !== addOnId),
                }));
                setAddOnPerPassenger((prevFlags) => {
                    const copy = { ...prevFlags };
                    delete copy[addOnId]; // Xóa khỏi state
                    return copy;
                });
                if (addOnId === "seat_selection") setShowSeatSelectionInstruction(false);
                return;
            }

            // Chỉ tính adults + children, bỏ infants
            const total = participants.adults + participants.children;
            let qty = 1; // Mặc định 1

            if (addOnId === "seat_selection") {
                setShowSeatSelectionInstruction(true);
                if (seatmapRef.current && typeof seatmapRef.current.scrollIntoView === "function") {
                    try {
                        seatmapRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
                    } catch {
                        /* ignore */
                    }
                }
            } else if (addOnId === "travel_insurance") {
                qty = total; // Mặc định tất cả adults + children
            } else if (total > 1) {
                // Hỏi số lượng cụ thể cho adults + children
                const input = window.prompt(
                    `Bạn có ${total} hành khách (người lớn + trẻ em). Bạn muốn mua dịch vụ này cho bao nhiêu hành khách? (1-${total})`,
                    total.toString() // Mặc định là tất cả
                );
                if (input === null) return; // Người dùng cancel
                const num = parseInt(input, 10);
                if (isNaN(num) || num < 1 || num > total) {
                    alert("Số lượng không hợp lệ. Vui lòng nhập số từ 1 đến " + total + ".");
                    return;
                }
                qty = num;
            }

            setAddOnPerPassenger((prevFlags) => ({ ...prevFlags, [addOnId]: qty }));
            setSelectedAddOnsByLeg((prev) => ({
                ...prev,
                [leg]: [...prev[leg], addOnId],
            }));
        } finally {
            setTimeout(() => {
                addOnClickRef.current = false;
            }, 0);
        }
    };

    const updateParticipantCount = (type: keyof typeof participants, increment: boolean) => {
        setParticipants(prev => ({
            ...prev,
            [type]: Math.max(type === 'adults' ? 1 : 0, prev[type] + (increment ? 1 : -1))
        }));
    };
    // Tính tổng tiền
    // const calculateTotal = () => {
    //     const adultUnit = derived.adultsUnit || parseNumberSafe(normalizedOffer?.price?.total ?? flightDetails.fareRules[selectedFare].price);
    //     const childUnit = derived.childrenUnit || Math.round(adultUnit * 0.75);
    //     const infantUnit = derived.infantsUnit || Math.round(adultUnit * 0.2);

    //     const adultTotal = adultUnit * participants.adults;
    //     const childTotal = childUnit * participants.children;
    //     const infantTotal = infantUnit * participants.infants;

    //     const addOnTotal = (leg: 'outbound' | 'inbound') =>
    //         selectedAddOnsByLeg[leg].reduce((total, addOnId) => {
    //             const addOn = dynamicAddOnServices.find((service) => service.id === addOnId);
    //             if (!addOn) return total;
    //             const qty = addOnPerPassenger[addOnId] || 1; // Sử dụng số lượng từ state
    //             return total + (addOn.price || 0) * qty;
    //         }, 0);

    //     const seatTotal = (leg: 'outbound' | 'inbound') =>
    //         selectedSeatsByLeg[leg].reduce((sum, s) => sum + (s.price || 0), 0);

    //     const outboundTotal = adultTotal + childTotal + infantTotal + addOnTotal('outbound') + seatTotal('outbound');
    //     const inboundTotal = isRoundtrip ? adultTotal + childTotal + infantTotal + addOnTotal('inbound') + seatTotal('inbound') : 0;

    //     return outboundTotal + inboundTotal;
    // };



    // compute only extras (add-ons + seat fees) to be added on top of derived.offerTotal when present
    // const computeExtras = () => {
    //     const addOnTotal = selectedAddOns.reduce((total, addOnId) => {
    //         const addOn = dynamicAddOnServices.find(service => service.id === addOnId);
    //         if (!addOn) return total;
    //         const per = addOnPerPassenger[addOnId] ?? false;
    //         const qty = per ? (participants.adults + participants.children + participants.infants) : 1;
    //         return total + ((addOn?.price || 0) * qty);
    //     }, 0);
    //     const seatSelectedTotal = selectedSeats.reduce((sum: number, s: any) => sum + (s.price || 0), 0);
    //     return addOnTotal + seatSelectedTotal;
    // };

    const getAmenityIcon = (amenity: string) => {
        switch (amenity) {
            case 'wifi': return <Wifi className="h-4 w-4" />;
            case 'meal': return <Coffee className="h-4 w-4" />;
            case 'entertainment': return <Star className="h-4 w-4" />;
            default: return null;
        }
    };

    const handleFareChange = (value: string) => {
        setSelectedFare(value);
        console.log('Chọn hạng vé:', value);
    };

    // --- CHANGED: toggleSeat with confirm-on-change and confirm-on-paid logic ---
    // const toggleSeat = (seat: any) => {
    //     if (!seat || seat.availability !== 'AVAILABLE') return;

    //     const exists = selectedSeats.find(s => s.id === seat.id);
    //     if (exists) {
    //         // deselect
    //         setSelectedSeats(prev => prev.filter(s => s.id !== seat.id));
    //         return;
    //     }

    //     // detect paid seat: require CH AND numeric price
    //     const chars = (seat.characteristics ?? []).map((c: string) => String(c).toUpperCase());
    //     const hasCH = chars.includes('CH');
    //     const explicitPrice = Number(seat.price || 0) > 0;
    //     const isPaidSeat = hasCH && explicitPrice;
    //     const max = participants.adults + participants.children + participants.infants;

    //     // if selecting a paid seat, ask user confirm
    //     if (isPaidSeat) {
    //         const msgPrice = seat.currency && seat.currency !== 'VND' ? `${seat.price.toLocaleString()} ${seat.currency}` : formatPrice(seat.price);
    //         const ok = window.confirm(`Ghế ${seat.number} có phí ${msgPrice}. Bạn xác nhận chọn ghế này và chấp nhận trả phí?`);
    //         if (!ok) return;
    //     }
    //     // if already selected max seats, ask to replace first selected seat
    //     if (selectedSeats.length >= max && max > 0) {
    //         const toReplace = selectedSeats[0];
    //         const ok = window.confirm(`Bạn đã chọn đủ ${max} ghế. Thay thế ghế ${toReplace.number} bằng ghế ${seat.number}?`);
    //         if (!ok) return;
    //         setSelectedSeats(prev => [...prev.slice(1), seat]);
    //         return;
    //     }

    //     // normal add
    //     setSelectedSeats(prev => [...prev, seat]);
    // };
    const toggleSeat = (seat: any) => {
        if (!seat || seat.availability !== "AVAILABLE") return;

        const leg = selectedLeg;
        const exists = selectedSeatsByLeg[leg].find((s) => s.id === seat.id);

        if (exists) {
            setSelectedSeatsByLeg((prev) => ({
                ...prev,
                [leg]: prev[leg].filter((s) => s.id !== seat.id),
            }));
            return;
        }

        const chars = (seat.characteristics ?? []).map((c: string) => String(c).toUpperCase());
        const hasCH = chars.includes("CH");
        const explicitPrice = Number(seat.price || 0) > 0;
        const isPaidSeat = hasCH && explicitPrice;
        const max = participants.adults + participants.children;

        if (isPaidSeat) {
            const msgPrice =
                seat.currency && seat.currency !== "VND"
                    ? `${seat.price.toLocaleString()} ${seat.currency}`
                    : formatPrice(seat.price);
            const ok = window.confirm(
                `Ghế ${seat.number} có phí ${msgPrice}. Bạn xác nhận chọn ghế này và chấp nhận trả phí?`
            );
            if (!ok) return;
        }

        if (selectedSeatsByLeg[leg].length >= max && max > 0) {
            const toReplace = selectedSeatsByLeg[leg][0];
            const ok = window.confirm(
                `Bạn đã chọn đủ ${max} ghế cho ${leg === 'outbound' ? 'chuyến đi' : 'chuyến về'}. Thay thế ghế ${toReplace.number} bằng ghế ${seat.number}?`
            );
            if (!ok) return;
            setSelectedSeatsByLeg((prev) => ({
                ...prev,
                [leg]: [...prev[leg].slice(1), seat],
            }));
            return;
        }

        setSelectedSeatsByLeg((prev) => ({
            ...prev,
            [leg]: [...prev[leg], seat],
        }));
    };
    {/* Component Legend nhỏ gọn */ }
    function Legend({ color, label }: { color: string; label: string }) {
        return (
            <div className="flex items-center gap-1">
                <div className={`w-4 h-4 rounded ${color}`}></div>
                <span>{label}</span>
            </div>
        );
    }
    // Thêm vào trước return (...)
    const renderSeatGroup = (row: any, seatLetters: string[]) => {
        return row.seats
            .filter((s: any) => seatLetters.includes(s.number.replace(/^\d+/, '')))
            .map((s: any) => {
                const seatLetter = s.number.replace(/^\d+/, '');
                const chars = (s.characteristics || []).map((c: string) => c.toUpperCase());
                const isSelected = selectedSeatsByLeg[selectedLeg].some((ss) => ss.id === s.id);
                const hasCH = chars.includes('CH');
                const explicitPrice = Number(s.price || 0) > 0;
                const isPaid = hasCH && explicitPrice;
                const isFree = !isPaid && Number(s.price || 0) === 0;

                let seatType: string | null = null;
                if (chars.includes('E')) seatType = 'exit';
                else if (chars.includes('W') || seatLetter === 'A' || seatLetter === 'K') seatType = 'window';
                else if (chars.includes('A') || ['C', 'D', 'F', 'G'].includes(seatLetter)) seatType = 'aisle';
                else seatType = 'middle';

                const baseUnavailable = 'bg-gray-200 text-gray-400 border border-gray-300 cursor-not-allowed';
                const baseSelected = 'bg-blue-600 text-white shadow-md scale-105 ring-2 ring-blue-600';
                const baseFree = 'bg-white border border-gray-300 hover:bg-gray-50 cursor-pointer';
                const basePaid = 'bg-yellow-50 border border-yellow-400 hover:bg-yellow-100 cursor-pointer ring-1 ring-yellow-200';
                const baseOccupied = 'bg-red-200 text-red-400 border border-red-300 cursor-not-allowed';

                const btnClass =
                    s.availability === 'OCCUPIED'
                        ? baseOccupied
                        : s.availability !== 'AVAILABLE'
                            ? baseUnavailable
                            : isSelected
                                ? baseSelected
                                : isPaid
                                    ? basePaid
                                    : baseFree;

                const title = `${s.number} • ${seatType.toUpperCase()} • ${s.availability}${s.price ? ` • ${s.currency} ${s.price.toLocaleString()}` : isFree ? ' • Miễn phí' : ''
                    }`;

                const seatTypeLabel: Record<string, string> = {
                    window: 'W',
                    aisle: 'A',
                    exit: 'EX',
                    middle: 'M',
                };

                return (
                    <div key={s.id} className="relative">
                        <button
                            title={title}
                            onClick={() => toggleSeat(s)}
                            className={`${btnClass} w-10 h-10 rounded-md text-xs flex flex-col items-center justify-center transition-all duration-150 relative`}
                        >
                            <span className="font-semibold">{s.number}</span>
                            {!isFree && s.price > 0 && s.availability === 'AVAILABLE' && (
                                <span className="text-[8px] text-yellow-700 mt-0.5"></span>
                            )}
                        </button>
                        {(hasCH && explicitPrice) && s.availability === 'AVAILABLE' && (
                            <div className="absolute -top-2 -right-2 bg-yellow-100 text-[10px] px-1 rounded border border-yellow-200 whitespace-nowrap z-10">
                                {s.currency && s.currency !== 'VND'
                                    ? `${s.price.toLocaleString()} ${s.currency}`
                                    : formatPrice(s.price)}
                            </div>
                        )}
                        {seatType && s.availability === 'AVAILABLE' && (
                            <div className="absolute -bottom-3 left-0 text-[10px] text-gray-500">
                                <span className="inline-block px-1 py-0.5 bg-gray-100 rounded font-medium">
                                    {seatTypeLabel[seatType] ?? seatType}
                                </span>
                            </div>
                        )}
                    </div>
                );
            });
    };



    // useEffect(() => {
    //     const max = participants.adults + participants.children;
    //     const legs = isRoundtrip ? ['outbound', 'inbound'] : ['outbound'];
    //     legs.forEach((leg) => {
    //         const currentSeats = selectedSeatsByLeg[leg] || [];
    //         if (currentSeats.length > max) {
    //             setSelectedSeatsByLeg((prev) => ({
    //                 ...prev,
    //                 [leg]: prev[leg].slice(0, max),
    //             }));
    //             return;
    //         }
    //         if (currentSeats.length < max && parsedSeatmaps[leg]?.length > 0) {
    //             const alreadyIds = new Set(currentSeats.map((s) => s.id));
    //             const allSeats = parsedSeatmaps[leg].flatMap((r) => r.seats || []);
    //             const freeSeats = allSeats.filter((s) => {
    //                 const chars = (s.characteristics ?? []).map((c) => String(c).toUpperCase());
    //                 const hasCH = chars.includes('CH');
    //                 const priceIsZero = Number(s.price || 0) === 0;
    //                 return s.availability === 'AVAILABLE' && priceIsZero && !hasCH && !alreadyIds.has(s.id);
    //             });
    //             if (freeSeats.length > 0) {
    //                 const need = Math.min(max - currentSeats.length, freeSeats.length);
    //                 setSelectedSeatsByLeg((prev) => ({
    //                     ...prev,
    //                     [leg]: [...prev[leg], ...freeSeats.slice(0, need)],
    //                 }));
    //             }
    //         }
    //         // Cập nhật seatRows sau khi chọn ghế
    //         if (parsedSeatmaps[leg]?.length > 0) {
    //             const markedRows = markOccupiedSeats(parsedSeatmaps[leg], leg);
    //             setSeatRows(markedRows);
    //             setMarkedSeatRows(markedRows);
    //         }
    //     });
    // }, [participants.adults, participants.children, parsedSeatmaps, isRoundtrip, bookedSeatsByLeg]);

    // --- NEW: safe number parser + derive traveler-level pricing when available ---

    useEffect(() => {
        setSelectedSeatsByLeg((prev) => ({
            outbound: prev.outbound.filter(s => !bookedSeatsByLeg.outbound.includes(s.number)),
            inbound: prev.inbound.filter(s => !bookedSeatsByLeg.inbound.includes(s.number)),
        }));
    }, [bookedSeatsByLeg]);


    useEffect(() => {
        const max = participants.adults + participants.children;
        const legs = isRoundtrip ? ['outbound', 'inbound'] : ['outbound'];
        legs.forEach((leg) => {
            // Remove ghế đã booked khỏi selectedSeatsByLeg - nhưng bookedSeatsByLeg luôn rỗng
            const currentSeats = selectedSeatsByLeg[leg as keyof typeof selectedSeatsByLeg].filter((s: any) => !bookedSeatsByLeg[leg as keyof typeof bookedSeatsByLeg].includes(s.number));
            setSelectedSeatsByLeg((prev) => ({
                ...prev,
                [leg]: currentSeats,
            }));

            if (currentSeats.length > max) {
                setSelectedSeatsByLeg((prev) => ({
                    ...prev,
                    [leg]: prev[leg as keyof typeof prev].slice(0, max),
                }));
                return;
            }
            if (currentSeats.length < max && parsedSeatmaps[leg]?.length > 0) {
                const alreadyIds = new Set(currentSeats.map((s: any) => s.id));
                const allSeats = parsedSeatmaps[leg].flatMap((r: any) => r.seats || []);
                const freeSeats = allSeats.filter((s: any) => {
                    const chars = (s.characteristics ?? []).map((c: any) => String(c).toUpperCase());
                    const hasCH = chars.includes('CH');
                    const priceIsZero = Number(s.price || 0) === 0;
                    // Thêm check: loại bỏ ghế đã booked - nhưng luôn false
                    const isBooked = bookedSeatsByLeg[leg as keyof typeof bookedSeatsByLeg].includes(s.number);
                    return s.availability === 'AVAILABLE' && priceIsZero && !hasCH && !alreadyIds.has(s.id) && !isBooked;
                });
                if (freeSeats.length > 0) {
                    const need = Math.min(max - currentSeats.length, freeSeats.length);
                    setSelectedSeatsByLeg((prev) => ({
                        ...prev,
                        [leg]: [...prev[leg as keyof typeof prev], ...freeSeats.slice(0, need)],
                    }));
                }
            }
            // Cập nhật seatRows sau khi chọn ghế
            if (parsedSeatmaps[leg]?.length > 0) {
                const markedRows = markOccupiedSeats(parsedSeatmaps[leg], leg as 'outbound' | 'inbound');
                setSeatRows(markedRows);
                setMarkedSeatRows(markedRows);
            }
        });
    }, [participants.adults, participants.children, parsedSeatmaps, isRoundtrip, bookedSeatsByLeg]);


    const parseNumberSafe = (v: any) => {
        if (v == null) return 0;
        const n = Number(String(v).replace(/[^\d.-]/g, ''));
        return Number.isFinite(n) ? n : 0;
    };

    const travelerPricings = normalizedOffer?.travelerPricings
        ?? cachedPricing?.data?.flightOffers?.[0]?.travelerPricings
        ?? cachedPricing?.travelerPricings
        ?? [];

    // derived summary used by UI / calculateTotal
    const derived: {
        adultsCount: number;
        childrenCount: number;
        infantsCount: number;
        adultsTotal: number;
        childrenTotal: number;
        infantsTotal: number;
        adultsUnit: number;
        childrenUnit: number;
        infantsUnit: number;
        offerTotal: number;
    } = {
        adultsCount: 0,
        childrenCount: 0,
        infantsCount: 0,
        adultsTotal: 0,
        childrenTotal: 0,
        infantsTotal: 0,
        adultsUnit: 0,
        childrenUnit: 0,
        infantsUnit: 0,
        offerTotal: parseNumberSafe(normalizedOffer?.price?.total ?? cachedPricing?.price?.total ?? 0)
    };

    if (Array.isArray(travelerPricings) && travelerPricings.length > 0) {
        for (const t of travelerPricings) {
            const typ = String(t?.travelerType ?? '').toUpperCase();
            const amount = parseNumberSafe(t?.price?.total ?? t?.price?.grandTotal ?? t?.price?.amount ?? 0);
            if (typ.includes('ADULT')) {
                derived.adultsCount += 1;
                derived.adultsTotal += amount;
            } else if (typ.includes('CHILD')) {
                derived.childrenCount += 1;
                derived.childrenTotal += amount;
            } else if (typ.includes('INFANT')) {
                derived.infantsCount += 1;
                derived.infantsTotal += amount;
            } else {
                derived.adultsCount += 1;
                derived.adultsTotal += amount;
            }
        }
        derived.adultsUnit = derived.adultsCount > 0 ? derived.adultsTotal / derived.adultsCount : 0;
        derived.childrenUnit = derived.childrenCount > 0 ? derived.childrenTotal / derived.childrenCount : 0;
        derived.infantsUnit = derived.infantsCount > 0 ? derived.infantsTotal / derived.infantsCount : 0;
        if (!derived.offerTotal || derived.offerTotal === 0) {
            derived.offerTotal = derived.adultsTotal + derived.childrenTotal + derived.infantsTotal;
        }
    } else {
        // fallback: approximate per-unit from priceNumber / totalParticipants
        const pax = Math.max(1, totalParticipants);
        const avg = Math.round((derived.offerTotal || priceNumber) / pax);
        derived.adultsUnit = avg;
        derived.childrenUnit = Math.round(avg * 0.75);
        derived.infantsUnit = Math.round(avg * 0.2);
        derived.adultsCount = participants.adults;
        derived.childrenCount = participants.children;
        derived.infantsCount = participants.infants;
        derived.adultsTotal = derived.adultsUnit * derived.adultsCount;
        derived.childrenTotal = derived.childrenUnit * derived.childrenCount;
        derived.infantsTotal = derived.infantsUnit * derived.infantsCount;
    }

    // --- NEW: tổng add-ons và seat fees để hiển thị cùng pricing khi có offerTotal ---
    const addOnTotalForDisplay = selectedAddOns.reduce((total, addOnId) => {
        const addOn = dynamicAddOnServices.find(s => s.id === addOnId);
        if (!addOn) return total;
        const per = addOnPerPassenger[addOnId] ?? false;
        const qty = per ? totalParticipants : 1;
        return total + ((Number(addOn.price) || 0) * qty);
    }, 0);

    const seatSelectedTotalForDisplay = selectedSeatsByLeg[selectedLeg].reduce((t, s) => t + (Number(s.price) || 0), 0);

    // const totalCombined = (derived.offerTotal && derived.offerTotal > 0)
    //     ? (Number(derived.offerTotal || 0) + addOnTotalForDisplay + seatSelectedTotalForDisplay)
    //     : calculateTotal();
    const derivedOutbound = (() => {
        const pricing = outboundCachedPricing || cachedPricing;
        const offer = extractOfferFromPricing(pricing);
        const travelerPricings = offer?.travelerPricings ?? pricing?.data?.flightOffers?.[0]?.travelerPricings ?? pricing?.travelerPricings ?? [];
        const result: any = {
            adultsCount: 0, childrenCount: 0, infantsCount: 0,
            adultsTotal: 0, childrenTotal: 0, infantsTotal: 0,
            adultsUnit: 0, childrenUnit: 0, infantsUnit: 0,
            offerTotal: parseNumberSafe(offer?.price?.total ?? pricing?.price?.total ?? 0)
        };
        if (Array.isArray(travelerPricings) && travelerPricings.length > 0) {
            for (const t of travelerPricings) {
                const typ = String(t?.travelerType ?? '').toUpperCase();
                const amount = parseNumberSafe(t?.price?.total ?? t?.price?.grandTotal ?? t?.price?.amount ?? 0);
                if (typ.includes('ADULT')) { result.adultsCount += 1; result.adultsTotal += amount; }
                else if (typ.includes('CHILD')) { result.childrenCount += 1; result.childrenTotal += amount; }
                else if (typ.includes('INFANT')) { result.infantsCount += 1; result.infantsTotal += amount; }
                else { result.adultsCount += 1; result.adultsTotal += amount; }
            }
            result.adultsUnit = result.adultsCount > 0 ? result.adultsTotal / result.adultsCount : 0;
            result.childrenUnit = result.childrenCount > 0 ? result.childrenTotal / result.childrenCount : 0;
            result.infantsUnit = result.infantsCount > 0 ? result.infantsTotal / result.infantsCount : 0;
            if (!result.offerTotal || result.offerTotal === 0) {
                result.offerTotal = result.adultsTotal + result.childrenTotal + result.infantsTotal;
            }
        } else {
            const pax = Math.max(1, totalParticipants);
            const avg = Math.round((result.offerTotal || priceNumber) / pax);
            result.adultsUnit = avg;
            result.childrenUnit = Math.round(avg * 0.75);
            result.infantsUnit = Math.round(avg * 0.2);
            result.adultsCount = participants.adults;
            result.childrenCount = participants.children;
            result.infantsCount = participants.infants;
            result.adultsTotal = result.adultsUnit * result.adultsCount;
            result.childrenTotal = result.childrenUnit * result.childrenCount;
            result.infantsTotal = result.infantsUnit * result.infantsCount;
        }
        return result;
    })();

    const derivedInbound = (() => {
        if (!inboundCachedPricing) return derivedOutbound; // Fallback nếu không có inbound
        const pricing = inboundCachedPricing;
        const offer = extractOfferFromPricing(pricing);
        const travelerPricings = offer?.travelerPricings ?? pricing?.data?.flightOffers?.[0]?.travelerPricings ?? pricing?.travelerPricings ?? [];
        const result: any = {
            adultsCount: 0, childrenCount: 0, infantsCount: 0,
            adultsTotal: 0, childrenTotal: 0, infantsTotal: 0,
            adultsUnit: 0, childrenUnit: 0, infantsUnit: 0,
            offerTotal: parseNumberSafe(offer?.price?.total ?? pricing?.price?.total ?? 0)
        };
        if (Array.isArray(travelerPricings) && travelerPricings.length > 0) {
            for (const t of travelerPricings) {
                const typ = String(t?.travelerType ?? '').toUpperCase();
                const amount = parseNumberSafe(t?.price?.total ?? t?.price?.grandTotal ?? t?.price?.amount ?? 0);
                if (typ.includes('ADULT')) { result.adultsCount += 1; result.adultsTotal += amount; }
                else if (typ.includes('CHILD')) { result.childrenCount += 1; result.childrenTotal += amount; }
                else if (typ.includes('INFANT')) { result.infantsCount += 1; result.infantsTotal += amount; }
                else { result.adultsCount += 1; result.adultsTotal += amount; }
            }
            result.adultsUnit = result.adultsCount > 0 ? result.adultsTotal / result.adultsCount : 0;
            result.childrenUnit = result.childrenCount > 0 ? result.childrenTotal / result.childrenCount : 0;
            result.infantsUnit = result.infantsCount > 0 ? result.infantsTotal / result.infantsCount : 0;
            if (!result.offerTotal || result.offerTotal === 0) {
                result.offerTotal = result.adultsTotal + result.childrenTotal + result.infantsTotal;
            }
        } else {
            const pax = Math.max(1, totalParticipants);
            const avg = Math.round((result.offerTotal || priceNumber) / pax);
            result.adultsUnit = avg;
            result.childrenUnit = Math.round(avg * 0.75);
            result.infantsUnit = Math.round(avg * 0.2);
            result.adultsCount = participants.adults;
            result.childrenCount = participants.children;
            result.infantsCount = participants.infants;
            result.adultsTotal = result.adultsUnit * result.adultsCount;
            result.childrenTotal = result.childrenUnit * result.childrenCount;
            result.infantsTotal = result.infantsUnit * result.infantsCount;
        }
        return result;
    })();

    const calculateTotal = () => {
        const outboundAdultUnit = derivedOutbound.adultsUnit || parseNumberSafe(outboundCachedPricing?.price?.total ?? (flightDetails as any).fareRules[selectedFare].price);
        const outboundChildUnit = derivedOutbound.childrenUnit || Math.round(outboundAdultUnit * 0.75);
        const outboundInfantUnit = derivedOutbound.infantsUnit || Math.round(outboundAdultUnit * 0.2);

        const inboundAdultUnit = isRoundtrip && inboundCachedPricing ? (derivedInbound.adultsUnit || parseNumberSafe(inboundCachedPricing.price?.total ?? (flightDetails as any).fareRules[selectedFare].price)) : 0;
        const inboundChildUnit = isRoundtrip && inboundCachedPricing ? (derivedInbound.childrenUnit || Math.round(inboundAdultUnit * 0.75)) : 0;
        const inboundInfantUnit = isRoundtrip && inboundCachedPricing ? (derivedInbound.infantsUnit || Math.round(inboundAdultUnit * 0.2)) : 0;

        const outboundAdultTotal = outboundAdultUnit * participants.adults;
        const outboundChildTotal = outboundChildUnit * participants.children;
        const outboundInfantTotal = outboundInfantUnit * participants.infants;

        const inboundAdultTotal = inboundAdultUnit * participants.adults;
        const inboundChildTotal = inboundChildUnit * participants.children;
        const inboundInfantTotal = inboundInfantUnit * participants.infants;

        const addOnTotal = (leg: 'outbound' | 'inbound') =>
            selectedAddOnsByLeg[leg].reduce((total, addOnId) => {
                const addOn = dynamicAddOnServices.find((service) => service.id === addOnId);
                if (!addOn) return total;
                const qty = addOnPerPassenger[addOnId] || 1;
                return total + (addOn.price || 0) * qty;
            }, 0);

        const seatTotal = (leg: 'outbound' | 'inbound') =>
            selectedSeatsByLeg[leg].reduce((sum, s) => sum + (s.price || 0), 0);

        const outboundTotal = outboundAdultTotal + outboundChildTotal + outboundInfantTotal + addOnTotal('outbound') + seatTotal('outbound');
        const inboundTotal = isRoundtrip ? inboundAdultTotal + inboundChildTotal + inboundInfantTotal + addOnTotal('inbound') + seatTotal('inbound') : 0;

        return outboundTotal + inboundTotal;
    };
    const totalCombined = calculateTotal();
    // --- NEW: when user switches selectedLeg show parsed seatmap/amenities/pricing for that leg if available ---

    // useEffect(() => {
    //     if (seatRows.length > 0) {
    //         const markedRows = markOccupiedSeats(seatRows, selectedLeg);
    //         setMarkedSeatRows(markedRows);
    //         console.log('🔄 Updated markedSeatRows for leg:', selectedLeg, 'seats:', markedRows.flatMap(r => r.seats.filter(s => s.availability === 'OCCUPIED').map(s => s.number)));
    //     }
    // }, [bookedSeatsByLeg, selectedLeg, seatRows]);

    // ...existing code...


    useEffect(() => {
        if (!isRoundtrip) return;
        setIsLoadingSeatmap(true);
        const leg = selectedLeg;
        console.log('🔄 Switching to leg:', leg); // Thêm log debug selectedLeg
        // Reset seatRows trước khi load mới
        setSeatRows([]);
        const parsed = parsedSeatmaps[leg] || [];

        if (parsed.length === 0 && cachedSeatmap && cachedSeatmap[leg]) {
            // Parse on the fly nếu có cachedSeatmap[leg]
            const raw = cachedSeatmap[leg];
            const parsedOnFly = parseSeatmap(raw);
            const markedRows = markOccupiedSeats(parsedOnFly.rows, leg);
            setSeatRows(markedRows);
            setMarkedSeatRows(markedRows);
            setAircraftAmenities(parsedOnFly.amenities);
        } else if (parsed.length === 0 && cachedSeatmap) {
            // Backup: Nếu không có cachedSeatmap[leg], thử dùng cachedSeatmap của leg kia
            const otherLeg = leg === 'outbound' ? 'inbound' : 'outbound';
            if (cachedSeatmap[otherLeg]) {
                console.warn(`⚠️ Backup: Dùng seatmap của ${otherLeg} cho ${leg} (có thể không chính xác)`);
                const raw = cachedSeatmap[otherLeg];
                const parsedOnFly = parseSeatmap(raw);
                const markedRows = markOccupiedSeats(parsedOnFly.rows, leg); // Vẫn mark theo leg hiện tại
                setSeatRows(markedRows);
                setMarkedSeatRows(markedRows);
                setAircraftAmenities(parsedOnFly.amenities);
            } else {
                // Không có data nào, set rỗng
                const markedRows: any[] = [];
                setSeatRows(markedRows);
                setMarkedSeatRows(markedRows);
            }
        } else {
            // Luôn mark, ngay cả nếu parsed rỗng (để log đúng leg và set seatRows = [])
            const markedRows = parsed.length > 0 ? markOccupiedSeats(parsed, leg) : [];
            setSeatRows(markedRows);
            setMarkedSeatRows(markedRows);
        }

        const amen = parsedAmenitiesByLeg[leg] ?? cachedSeatmap?.[leg]?.aircraftCabinAmenities ?? null;
        if (amen) setAircraftAmenities(amen);

        // Fix: Luôn set cachedPricing dựa trên leg, kể cả null (để tránh giữ giá trị cũ)
        setCachedPricing(leg === "outbound" ? outboundCachedPricing : inboundCachedPricing);
        setIsLoadingSeatmap(false);
    }, [selectedLeg, cachedSeatmap, outboundCachedPricing, inboundCachedPricing, isRoundtrip, bookedSeatsByLeg]);

    // airport lookup map loaded from public/airport.json (client-side)
    const [airportsMap, setAirportsMap] = useState<Record<string, any> | null>(null);
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const r = await fetch('/airport.json');
                if (!r.ok) return;
                const j = await r.json();
                // build lookup by IATA code for quick access (some JSON keys are ICAO)
                const byIata: Record<string, any> = {};
                Object.values(j || {}).forEach((entry: any) => {
                    const iata = entry?.iata;
                    if (iata && String(iata).trim()) byIata[String(iata).toUpperCase()] = entry;
                });
                // also merge any direct iata -> entry if JSON already keyed by iata
                if (typeof j === 'object') {
                    Object.entries(j).forEach(([k, v]: any) => {
                        const maybeIata = (v && v.iata) ? String(v.iata).toUpperCase() : null;
                        if (maybeIata) byIata[maybeIata] = v;
                    });
                }
                if (mounted) setAirportsMap(byIata);
            } catch (e) { /* ignore */ }
        })();
        return () => { mounted = false; };
    }, []);

    const getAirportLabel = (iata: string | undefined | null, fallbackCity?: string) => {
        if (!iata) return fallbackCity || '';
        const code = String(iata).toUpperCase();
        const entry = airportsMap?.[code] ?? null;
        // prefer nice city name, then state, then fallbackCity, finally iata
        if (entry) return entry.city || entry.state || fallbackCity || code;
        // some sources send IATA in city field (like "DAD"), detect and try map too
        if ((fallbackCity ?? '').length === 3 && airportsMap?.[(fallbackCity as any)?.toUpperCase()]) {
            const e2 = airportsMap[(fallbackCity as any)!.toUpperCase()];
            return e2.city || e2.state || code;
        }
        return fallbackCity || code;
    };

    // Thêm: Tính derived riêng cho outbound và inbound

    return (
        <>
            {error && (
                <div className="container py-6">
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                        <AlertCircle className="h-5 w-5 inline mr-2" />
                        {error}
                    </div>
                    <Button variant="outline" asChild className="mt-4">
                        <Link prefetch={false} href="/ve-may-bay">
                            Quay lại tìm kiếm chuyến bay
                        </Link>
                    </Button>
                </div>
            )}
            {!error && (

                <>

                    {/* Breadcrumb */}
                    <div className="border-b">
                        <div className="container py-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Link prefetch={false} href="/" className="hover:text-primary">Trang chủ</Link>
                                <span>/</span>
                                <Link prefetch={false} href="/ve-may-bay" className="hover:text-primary">Vé máy bay</Link>
                                <span>/</span>
                                <span>Chi tiết chuyến bay</span>
                            </div>
                        </div>
                    </div>

                    <div className="container py-6">
                        {/* --- NEW: Roundtrip leg tabs (minimal, only affects leg selection/display) --- */}
                        {isRoundtrip && (
                            <div className="mb-4 flex items-center gap-3">
                                <div className="inline-flex rounded-md bg-[hsl(var(--muted))]/5 p-1">
                                    <button
                                        onClick={() => setSelectedLeg('outbound')}
                                        className={`px-4 py-1 rounded-md ${selectedLeg === 'outbound' ? 'bg-white shadow-sm text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))]'}`}
                                    >
                                        Chuyến đi
                                        <div className="text-xs text-[hsl(var(--muted-foreground))]">
                                            {(() => {
                                                const o = extractOfferFromPricing(outboundCachedPricing) ?? mappedOffer?.rawOffer ?? null;
                                                const p = o?.price?.total ?? cachedPricing?.price?.total ?? null;
                                                if (p) return (currency === 'VND' ? formatPrice(Number(String(p).replace(/[^\d.-]/g, ''))) : `${p} ${currency}`);
                                                return null;
                                            })()}
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => setSelectedLeg('inbound')}
                                        disabled={!inboundCachedPricing && !cachedSeatmap?.inbound && !parsedSeatmaps?.inbound}
                                        className={`px-4 py-1 rounded-md ${selectedLeg === 'inbound' ? 'bg-white shadow-sm text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))]'} ${(!inboundCachedPricing && !cachedSeatmap?.inbound && !parsedSeatmaps?.inbound) ? 'opacity-40 cursor-not-allowed' : ''}`}
                                    >
                                        Chuyến về
                                        <div className="text-xs text-[hsl(var(--muted-foreground))]">
                                            {(() => {
                                                const i = extractOfferFromPricing(inboundCachedPricing) ?? null;
                                                const p = i?.price?.total ?? null;
                                                if (p) return (currency === 'VND' ? formatPrice(Number(String(p).replace(/[^\d.-]/g, ''))) : `${p} ${currency}`);
                                                return null;
                                            })()}
                                        </div>
                                    </button>
                                </div>

                                {/* quick indicator which leg is shown */}
                                <div className="text-sm text-[hsl(var(--muted-foreground))] ml-2">
                                    Hiển thị: {selectedLeg === 'outbound' ? 'Chuyến đi' : 'Chuyến về'}
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col lg:flex-row gap-8">
                            {/* Main Content */}
                            <div className="flex-1 space-y-6">
                                {/* Back Button */}
                                <Button variant="outline" asChild className="w-fit">
                                    <Link prefetch={false} href="/ve-may-bay">
                                        <ChevronLeft className="h-4 w-4 mr-2" />
                                        Quay lại kết quả tìm kiếm
                                    </Link>
                                </Button>

                                {/* Flight Details */}
                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded bg-[hsl(var(--primary))/0.1] flex items-center justify-center">
                                                    <Plane className="h-5 w-5 text-[hsl(var(--primary))]" />
                                                </div>
                                                <div>
                                                    <div className="text-xl">
                                                        {isRoundtrip
                                                            ? (selectedLeg === 'outbound'
                                                                ? extractOfferFromPricing(outboundCachedPricing)?.validatingAirlineCodes?.[0] ?? flightDetails.airline
                                                                : extractOfferFromPricing(inboundCachedPricing)?.validatingAirlineCodes?.[0] ?? flightDetails.airline)
                                                            : extractOfferFromPricing(cachedPricing)?.validatingAirlineCodes?.[0] ?? flightDetails.airline}
                                                    </div>
                                                    <div className="text-sm text-[hsl(var(--muted-foreground))] font-normal">
                                                        {isRoundtrip
                                                            ? (selectedLeg === 'outbound'
                                                                ? `${extractOfferFromPricing(outboundCachedPricing)?.itineraries?.[0]?.segments?.[0]?.carrierCode ?? flightDetails.airline}${extractOfferFromPricing(outboundCachedPricing)?.itineraries?.[0]?.segments?.[0]?.number ?? flightDetails.flightNumber} • ${extractOfferFromPricing(outboundCachedPricing)?.itineraries?.[0]?.segments?.[0]?.aircraft?.code ?? flightDetails.aircraft}`
                                                                : `${extractOfferFromPricing(inboundCachedPricing)?.itineraries?.[0]?.segments?.[0]?.carrierCode ?? flightDetails.airline}${extractOfferFromPricing(inboundCachedPricing)?.itineraries?.[0]?.segments?.[0]?.number ?? flightDetails.flightNumber} • ${extractOfferFromPricing(inboundCachedPricing)?.itineraries?.[0]?.segments?.[0]?.aircraft?.code ?? flightDetails.aircraft}`)
                                                            : `${extractOfferFromPricing(cachedPricing)?.itineraries?.[0]?.segments?.[0]?.carrierCode ?? flightDetails.airline}${extractOfferFromPricing(cachedPricing)?.itineraries?.[0]?.segments?.[0]?.number ?? flightDetails.flightNumber} • ${extractOfferFromPricing(cachedPricing)?.itineraries?.[0]?.segments?.[0]?.aircraft?.code ?? flightDetails.aircraft}`}
                                                    </div>
                                                </div>
                                            </CardTitle>
                                            {/* {flightDetails.discount && (
                                        <Badge variant="destructive" className="text-lg">-{flightDetails.discount}%</Badge>
                                    )} */}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {/* Flight Route */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="text-center">
                                                { /* prefer times from pricing itineraries if present */}
                                                <div className="text-2xl font-bold">{normalizedOffer?.itineraries?.[0]?.segments?.[0]?.departure?.at?.split('T')?.[1]?.slice(0, 5) ?? flightDetails.departure.time}</div>
                                                <div className="text-lg font-medium">{normalizedOffer?.itineraries?.[0]?.segments?.[0]?.departure?.iataCode ?? flightDetails.departure.airport}</div>
                                                {/* <div className="text-sm text-[hsl(var(--muted-foreground))]">{flightDetails.departure.city}</div> */}
                                                <div className="text-xs text-[hsl(var(--muted-foreground))]">{/* departure terminal */} Terminal {normalizedOffer?.itineraries?.[0]?.segments?.[0]?.departure?.terminal ?? flightDetails.departure.terminal}</div>
                                                <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{normalizedOffer?.itineraries?.[0]?.segments?.[0]?.departure?.at?.split('T')?.[0] ?? flightDetails.date}</div>
                                            </div>

                                            <div className="flex flex-col items-center justify-center">
                                                <div className="text-sm text-[hsl(var(--muted))] mb-2">{normalizedOffer?.itineraries?.[0]?.duration ?? flightDetails.duration}</div>
                                                <div className="flex items-center w-full">
                                                    <div className="flex-1 h-px bg-[hsl(var(--muted))]"></div>
                                                    <ArrowRight className="h-5 w-5 mx-2 text-[hsl(var(--muted-foreground))]" />
                                                    <div className="flex-1 h-px bg-[hsl(var(--muted))]"></div>
                                                </div>
                                                <div className="text-xs text-[hsl(var(--muted-foreground))] mt-2">Bay thẳng</div>
                                            </div>

                                            <div className="text-center">
                                                <div className="text-2xl font-bold">{normalizedOffer?.itineraries?.[0]?.segments?.[0]?.arrival?.at?.split('T')?.[1]?.slice(0, 5) ?? flightDetails.arrival.time}</div>
                                                <div className="text-lg font-medium">{normalizedOffer?.itineraries?.[0]?.segments?.[0]?.arrival?.iataCode ?? flightDetails.arrival.airport}</div>
                                                {/* <div className="text-sm text-[hsl(var(--muted-foreground))]">{flightDetails.arrival.city}</div> */}
                                                <div className="text-xs text-[hsl(var(--muted-foreground))]">{/* arrival terminal */} Terminal {normalizedOffer?.itineraries?.[0]?.segments?.slice(-1)[0]?.arrival?.terminal ?? flightDetails.arrival.terminal}</div>
                                                <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{normalizedOffer?.itineraries?.[0]?.segments?.[0]?.arrival?.at?.split('T')?.[0] ?? flightDetails.date}</div>

                                            </div>
                                        </div>

                                        <Separator />

                                        {/* Flight Info */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div>
                                                <h4 className="font-medium mb-2">Hành lý</h4>
                                                <div className="space-y-1 text-sm text-[hsl(var(--muted-foreground))]">
                                                    <div className="flex items-center gap-2">
                                                        <Luggage className="h-4 w-4" />
                                                        {/*                                                Xách tay: {flightDetails.baggage.handbag} */}
                                                        {/* -                                                Xách tay: {displayCabin} */}
                                                        Xách tay: {displayCabin}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Luggage className="h-4 w-4" />
                                                        {/*                                                Ký gửi: {flightDetails.baggage.checkin} */}
                                                        {/* -                                                Ký gửi: {displayChecked} */}
                                                        Ký gửi: {displayChecked}
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="font-medium mb-2">Tiện ích</h4>
                                                <div className="text-sm text-[hsl(var(--muted-foreground))]">
                                                    {/* load from aircraftAmenities if present */}
                                                    {aircraftAmenities?.seat && (
                                                        <div>Khoảng cách ghế: {aircraftAmenities.seat.legSpace}{aircraftAmenities.seat.spaceUnit ? ` ${aircraftAmenities.seat.spaceUnit}` : ''}</div>
                                                    )}
                                                    {aircraftAmenities?.food && (
                                                        <div>Suất ăn: {aircraftAmenities.food.isChargeable ? 'Có tính phí' : 'Miễn phí'}</div>
                                                    )}
                                                    {aircraftAmenities?.beverage && (
                                                        <div>Đồ uống: {aircraftAmenities.beverage.isChargeable ? 'Có tính phí' : 'Miễn phí'}</div>
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="font-medium mb-2">Điều kiện vé</h4>
                                                <div className="space-y-1 text-sm text-[hsl(var(--muted-foreground))]">

                                                    <div>{isRefundable ? '✓ Có hoàn hủy' : '✗ Không hoàn hủy'}</div>
                                                    <div>{isChangeable ? '✓ Có thể đổi' : '✗ Không thể đổi'}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>


                                {/* Add-on Services */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Dịch vụ bổ sung</CardTitle>
                                        <p className="text-[hsl(var(--muted-foreground))]">
                                            Nâng cao trải nghiệm bay của bạn với các dịch vụ thêm
                                        </p>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {dynamicAddOnServices.map((service: any) => (
                                                <div
                                                    key={service.id}
                                                    className={`border rounded-lg p-4 transition-colors ${selectedAddOnsByLeg[selectedLeg].includes(service.id)
                                                        ? 'border-primary bg-[hsl(var(--primary))/0.05]'
                                                        : 'hover:bg-[hsl(var(--muted))]'
                                                        }`}
                                                    onClick={() => toggleAddOn(service.id)}
                                                >
                                                    <div className="flex items-start space-x-3">
                                                        <Checkbox
                                                            checked={selectedAddOnsByLeg[selectedLeg].includes(service.id)}
                                                            onClick={(e) => e.stopPropagation()}
                                                            onCheckedChange={() => toggleAddOn(service.id)}
                                                        />
                                                        <div className="flex-1">
                                                            <div className="flex items-center justify-between">
                                                                <h4 className="font-medium">{service.name}</h4>
                                                                <span className="font-bold text-[hsl(var(--primary))]">
                                                                    {service.currency && service.currency !== 'VND'
                                                                        ? `${Number(service.price).toLocaleString()} ${service.currency}`
                                                                        : formatPrice(Number(service.price))}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                                                                {service.description ?? (service.raw ? JSON.stringify(service.raw).slice(0, 200) : '')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                                {/* Seatmap (showable, compact) */}
                                <div ref={(el) => { seatmapRef.current = el as HTMLElement | null; }} className="shadow-lg rounded-2xl bg-white p-5">
                                    {/* Header */}
                                    <div className="mb-4">
                                        <h2 className="text-lg font-semibold flex items-center gap-2">
                                            🪑 Sơ đồ chỗ ngồi
                                        </h2>
                                    </div>

                                    {/* Info banner */}
                                    {showSeatSelectionInstruction && (
                                        <div className="bg-blue-50 border border-blue-200 text-blue-700 text-sm p-3 rounded-lg mb-4">
                                            Bạn đã bật &quot;Chọn chỗ ngồi&quot;. Nhấp vào sơ đồ bên dưới để chọn tối đa {totalParticipants} ghế.
                                        </div>
                                    )}

                                    {/* Empty state */}
                                    {seatRows.length === 0 && (
                                        <div className="text-center text-gray-500 text-sm py-6 border rounded-xl">
                                            Không có dữ liệu sơ đồ ghế
                                        </div>
                                    )}

                                    {isLoadingSeatmap ? (
                                        <div className="text-center text-gray-500 text-sm py-6 border rounded-xl">
                                            Đang tải sơ đồ ghế...
                                        </div>
                                    ) : (
                                        <>
                                            {/* Cockpit */}
                                            <div className="flex justify-center mb-3">
                                                <div className="bg-gray-800 text-white text-xs font-semibold px-5 py-1.5 rounded-t-xl shadow-inner">
                                                    ✈ Buồng lái
                                                </div>
                                            </div>

                                            {/* Seat map */}
                                            <div className="space-y-3 flex flex-col items-center">
                                                {/** column layout: letters with aisles after C and F */}
                                                {markedSeatRows.map((row) => {
                                                    const letters = ['A', 'B', 'C', '_aisle', 'D', 'E', 'F', '_aisle', 'G', 'H', 'K'];
                                                    // map seats by letter for quick lookup
                                                    const seatMap: Record<string, any> = {};
                                                    row.seats.forEach((s: any) => {
                                                        const letter = String(s.number || '').replace(/^\d+/, '') || '';
                                                        seatMap[letter] = s;
                                                    });

                                                    // NEW: detect if any seat in this row will render a top price badge (CH + explicit price)
                                                    const rowHasTopBadge = row.seats.some((s: any) => {
                                                        const charsUp = (s.characteristics ?? []).map((c: string) => String(c).toUpperCase());
                                                        const hasCH = charsUp.includes('CH');
                                                        const explicitPrice = Number(s.price || 0) > 0;
                                                        return hasCH && explicitPrice;
                                                    });

                                                    return (
                                                        // NOTE: added conditional padding-top when rowHasTopBadge to avoid price badge overlap
                                                        <div key={row.row} className={`grid grid-cols-[44px_repeat(11,44px)] items-center gap-2 relative ${rowHasTopBadge ? 'pt-4' : ''}`}>
                                                            {/* row number column */}
                                                            <div className="w-11 text-center font-bold text-sm">{row.row}</div>

                                                            {/* seats + aisles columns */}
                                                            {letters.map((col: string, idx) => {
                                                                if (col === '_aisle') {
                                                                    return (
                                                                        <div key={idx} className="h-10 flex items-center justify-center">
                                                                            <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center" >
                                                                                <span className='text-[10px] text-gray-500 space-x-1'>Lối đi</span>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                }

                                                                const s = seatMap[col];
                                                                if (!s) {
                                                                    // empty seat placeholder (align grid)
                                                                    return <div key={idx} className="w-11 h-11" />;
                                                                }

                                                                const isSelected = !!selectedSeatsByLeg[selectedLeg].find(ss => ss.id === s.id);
                                                                const unavailable = s.availability !== 'AVAILABLE';


                                                                // detect paid seats: MUST have "CH" AND a numeric price (parsed to s.price)
                                                                const charsUp = (s.characteristics ?? []).map((c: string) => String(c).toUpperCase());
                                                                const hasCH = charsUp.includes('CH');
                                                                const explicitPrice = Number(s.price || 0) > 0;
                                                                const isPaid = hasCH && explicitPrice; // require BOTH
                                                                const isFree = !isPaid && Number(s.price || 0) === 0;

                                                                // determine seat type badge
                                                                let seatType = 'M';
                                                                if (charsUp.includes('EXIT') || charsUp.includes('EXIT_ROW')) seatType = 'EX';
                                                                else if (charsUp.includes('GALLEY') || charsUp.includes('GAL')) seatType = 'GAL';
                                                                else if (charsUp.includes('AISLE') || ['C', 'D', 'F', 'G'].includes(col)) seatType = 'A';
                                                                else if (charsUp.includes('WINDOW') || ['A', 'K', 'F'].includes(col)) seatType = 'W';

                                                                const baseUnavailable = 'bg-gray-200 text-gray-400 border border-gray-300 cursor-not-allowed';
                                                                const baseSelected = 'bg-[hsl(var(--primary))] text-white shadow-md';
                                                                const baseFree = 'bg-white border border-gray-300 hover:bg-gray-50 cursor-pointer';
                                                                const basePaid = 'bg-yellow-50 border border-yellow-400 hover:bg-yellow-100 cursor-pointer ring-1 ring-yellow-200';

                                                                const base = unavailable
                                                                    ? baseUnavailable
                                                                    : isSelected
                                                                        ? baseSelected
                                                                        : isPaid
                                                                            ? basePaid
                                                                            : baseFree;

                                                                return (
                                                                    <div key={idx} className="relative flex items-center justify-center">
                                                                        <button
                                                                            title={`${s.number} • ${hasCH ? 'CH (có thể tính phí)' : 'Miễn phí'} • ${s.availability}${explicitPrice ? ` • ${s.currency} ${s.price.toLocaleString()}` : ''}`}
                                                                            onClick={() => toggleSeat(s)}
                                                                            className={`${base} w-11 h-11 rounded-md text-xs flex items-center justify-center transition`}
                                                                        >
                                                                            <div className="flex flex-col items-center">
                                                                                <span className="font-semibold text-xs leading-none">{s.number}</span>
                                                                                {/* quick cue inside seat: explicit price => currency symbol; CH present but no explicit price => "CH" */}
                                                                                {explicitPrice && s.price > 0 && s.availability === 'AVAILABLE' && (
                                                                                    <span className="text-[10px] text-yellow-700 mt-0.5"></span>
                                                                                )}
                                                                                {!explicitPrice && hasCH && s.availability === 'AVAILABLE' && (
                                                                                    <span className="text-[9px] text-yellow-700 mt-0.5 font-semibold">CH</span>
                                                                                )}
                                                                            </div>
                                                                        </button>

                                                                        {/* price badge: show amount only when CH present AND explicit price exists */}
                                                                        {(hasCH && explicitPrice) && s.availability === 'AVAILABLE' && (
                                                                            <div className="absolute -top-2 -right-2 bg-yellow-100 text-[10px] px-1 rounded border border-yellow-200 z-20 whitespace-nowrap">
                                                                                {s.currency && s.currency !== 'VND' ? `${s.price.toLocaleString()} ${s.currency}` : formatPrice(s.price)}
                                                                            </div>
                                                                        )}

                                                                        {/* seat type tag bottom-left */}
                                                                        <div className="absolute -bottom-3 left-0 text-[10px] text-gray-600">
                                                                            <span className="inline-block px-1 py-0.5 bg-gray-100 rounded font-medium">{seatType}</span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}

                                                            {/* exit indicator for certain rows (if any seat has EXIT char) */}
                                                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                                                {row.seats.some((s: any) => (s.characteristics ?? []).some((c: string) => /EXIT/i.test(String(c)))) && (
                                                                    <div className="text-xs text-red-600 font-semibold">🛟 Exit</div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            {/* Legend */}
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-gray-600 mt-6">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 rounded bg-[hsl(var(--primary))] border border-[hsl(var(--primary))]"></div>
                                                    <div>Đang chọn</div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 rounded border bg-white border-gray-300"></div>
                                                    <div>Ghế trống (AVAILABLE)</div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 rounded bg-yellow-50 border border-yellow-400 flex items-center justify-center text-[10px]"></div>
                                                    <div>Ghế trả phí (CH hoặc có giá)</div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 rounded bg-gray-200 border border-gray-300"></div>
                                                    <div>Không khả dụng / Đã đặt</div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 rounded border bg-white flex items-center justify-center text-[10px]">W</div>
                                                    <div>Cửa sổ (Window)</div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 rounded border bg-white flex items-center justify-center text-[10px]">A</div>
                                                    <div>Hàng lối (Aisle)</div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 rounded border bg-white flex items-center justify-center text-[10px]">EX</div>
                                                    <div>Cửa thoát hiểm</div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 rounded border bg-white flex items-center justify-center text-[10px]">GAL</div>
                                                    <div>Galley</div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 rounded bg-red-200 border border-red-300"></div>
                                                    <div>Ghế đã đặt (Occupied)</div>
                                                </div>
                                            </div>

                                        </>
                                    )}

                                    <p className="text-xs text-gray-500 mt-2">
                                        Ghế miễn phí sẽ tự gán nếu còn đủ cho {participants.adults + participants.children} khách. (em bé sẽ ngồi cùng người lớn)
                                    </p>
                                </div>

                                {/* Passenger Information */}
                                {/* <Card>
                                    <CardHeader>
                                        <CardTitle>Thông tin hành khách</CardTitle>
                                        <p className="text-red-600">
                                            Vui lòng điền chính xác thông tin theo giấy tờ tùy thân và thông tin liên hệ
                                        </p>
                                    </CardHeader>
                                    <CardContent>
                                        <Tabs defaultValue="passenger" className="w-full">
                                            <TabsList>
                                                <TabsTrigger value="passenger">Hành khách</TabsTrigger>
                                                <TabsTrigger value="contact">Thông tin liên hệ</TabsTrigger>
                                            </TabsList>

                                            <TabsContent value="passenger" className="space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div>
                                                        <Label htmlFor="title">Danh xưng</Label>
                                                        <Select value={passengerInfo.title} onValueChange={(value) => setPassengerInfo(prev => ({ ...prev, title: value }))}>
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="Mr">Ông</SelectItem>
                                                                <SelectItem value="Mrs">Bà</SelectItem>
                                                                <SelectItem value="Ms">Cô</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="firstName">Họ và tên đệm</Label>
                                                        <Input id="firstName" value={passengerInfo.firstName} onChange={(e) => setPassengerInfo(prev => ({ ...prev, firstName: e.target.value }))} placeholder="VD: NGUYEN VAN" />
                                                        {passengerErrors.firstName && (
                                                            <div className="text-xs text-red-600 mt-1">{passengerErrors.firstName}</div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="lastName">Tên</Label>
                                                        <Input id="lastName" value={passengerInfo.lastName} onChange={(e) => setPassengerInfo(prev => ({ ...prev, lastName: e.target.value }))} placeholder="VD: AN" />
                                                        {passengerErrors.lastName && (
                                                            <div className="text-xs text-red-600 mt-1">{passengerErrors.lastName}</div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <Label htmlFor="dateOfBirth">Ngày sinh</Label>
                                                        <Input id="dateOfBirth" type="date"
                                                            className="block h-12 bg-white shadow-md text-black w-full"
                                                            value={passengerInfo.dateOfBirth} onChange={(e) => setPassengerInfo(prev => ({ ...prev, dateOfBirth: e.target.value }))} />
                                                        {passengerErrors.dateOfBirth && (
                                                            <div className="text-xs text-red-600 mt-1">{passengerErrors.dateOfBirth}</div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="nationality">Quốc tịch</Label>
                                                        <Select value={passengerInfo.nationality} onValueChange={(value) => setPassengerInfo(prev => ({ ...prev, nationality: value }))}>
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="VN">Việt Nam</SelectItem>
                                                                <SelectItem value="US">Hoa Kỳ</SelectItem>
                                                                <SelectItem value="GB">Anh</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <Label htmlFor="idType">Loại giấy tờ</Label>
                                                        <Select value={passengerInfo.idType} onValueChange={(value) => setPassengerInfo(prev => ({ ...prev, idType: value }))}>
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="cccd">CCCD</SelectItem>
                                                                <SelectItem value="cmnd">CMND</SelectItem>
                                                                <SelectItem value="passport">Hộ chiếu</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="idNumber">Số giấy tờ</Label>
                                                        <Input id="idNumber" value={passengerInfo.idNumber} onChange={(e) => setPassengerInfo(prev => ({ ...prev, idNumber: e.target.value }))} placeholder="Nhập số CCCD/CMND/Hộ chiếu" />
                                                        {passengerErrors.idNumber && (
                                                            <div className="text-xs text-red-600 mt-1">{passengerErrors.idNumber}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </TabsContent>

                                            <TabsContent value="contact" className="space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <Label htmlFor="email">Email *</Label>
                                                        <Input id="email" type="email" value={contactInfo.email} onChange={(e) => setContactInfo(prev => ({ ...prev, email: e.target.value }))} placeholder="email@example.com" />
                                                        {contactErrors.email && (
                                                            <div className="text-xs text-red-600 mt-1">{contactErrors.email}</div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="phone">Số điện thoại *</Label>
                                                        <Input id="phone" value={contactInfo.phone} onChange={(e) => setContactInfo(prev => ({ ...prev, phone: e.target.value }))} placeholder="0912345678" />
                                                        {contactErrors.phone && (
                                                            <div className="text-xs text-red-600 mt-1">{contactErrors.phone}</div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div>
                                                    <Label htmlFor="address">Địa chỉ</Label>
                                                    <Input id="address" value={contactInfo.address} onChange={(e) => setContactInfo(prev => ({ ...prev, address: e.target.value }))} placeholder="Địa chỉ liên hệ" />
                                                </div>
                                            </TabsContent>
                                        </Tabs>
                                    </CardContent>
                                </Card> */}
                            </div>

                            {/* Sidebar - Booking Summary */}
                            <div className="lg:w-96">
                                <Card className="sticky top-20">
                                    <CardHeader>
                                        <CardTitle>Đặt vé máy bay</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {/* Outbound Flight */}
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-medium">Chuyến đi</span>
                                                <span className="text-sm text-[hsl(var(--muted-foreground))]">
                                                    {extractOfferFromPricing(outboundCachedPricing || cachedPricing)?.itineraries?.[0]?.segments?.[0]?.carrierCode ?? flightDetails.airline}
                                                    {extractOfferFromPricing(outboundCachedPricing || cachedPricing)?.itineraries?.[0]?.segments?.[0]?.number ?? flightDetails.flightNumber}
                                                </span>
                                            </div>
                                            <div className="text-sm text-[hsl(var(--muted-foreground))]">
                                                {/* {`${extractOfferFromPricing(outboundCachedPricing || cachedPricing)?.itineraries?.[0]?.segments?.[0]?.departure?.iataCode ?? flightDetails.departure.airport} (${flightDetails.departure.city}) → ${extractOfferFromPricing(outboundCachedPricing || cachedPricing)?.itineraries?.[0]?.segments?.[0]?.arrival?.iataCode ?? flightDetails.arrival.airport} (${flightDetails.arrival.city})`} */}
                                                {(() => {
                                                    const seg = extractOfferFromPricing(outboundCachedPricing || cachedPricing)?.itineraries?.[0]?.segments?.[0] ?? null;
                                                    const depCode = seg?.departure?.iataCode ?? flightDetails.departure.airport;
                                                    const arrCode = seg?.arrival?.iataCode ?? flightDetails.arrival.airport;
                                                    const depLabel = getAirportLabel(depCode, seg?.departure?.city ?? flightDetails.departure.city);
                                                    const arrLabel = getAirportLabel(arrCode, seg?.arrival?.city ?? flightDetails.arrival.city);
                                                    return `${depCode} (${depLabel}) → ${arrCode} (${arrLabel})`;
                                                })()}
                                                <br />
                                                {extractOfferFromPricing(outboundCachedPricing || cachedPricing)?.itineraries?.[0]?.segments?.[0]?.departure?.at?.split('T')?.[0] ?? flightDetails.date} • {extractOfferFromPricing(outboundCachedPricing || cachedPricing)?.itineraries?.[0]?.segments?.[0]?.departure?.at?.split('T')?.[1]?.slice(0, 5) ?? flightDetails.departure.time} - {extractOfferFromPricing(outboundCachedPricing || cachedPricing)?.itineraries?.[0]?.segments?.[0]?.arrival?.at?.split('T')?.[1]?.slice(0, 5) ?? flightDetails.arrival.time}
                                            </div>
                                            <div className="space-y-1 mt-2">
                                                <div className="flex justify-between">
                                                    <span>Người lớn ({participants.adults})</span>
                                                    <span>{currency === 'VND' ? formatPrice(Math.round(derivedOutbound.adultsUnit * participants.adults)) : `${Math.round(derivedOutbound.adultsUnit * participants.adults).toLocaleString()} ${currency}`}</span>
                                                </div>
                                                {participants.children > 0 && (
                                                    <div className="flex justify-between">
                                                        <span>Trẻ em ({participants.children})</span>
                                                        <span>{currency === 'VND' ? formatPrice(Math.round(derivedOutbound.childrenUnit * participants.children)) : `${Math.round(derivedOutbound.childrenUnit * participants.children).toLocaleString()} ${currency}`}</span>
                                                    </div>
                                                )}
                                                {participants.infants > 0 && (
                                                    <div className="flex justify-between">
                                                        <span>Em bé ({participants.infants})</span>
                                                        <span>{currency === 'VND' ? formatPrice(Math.round(derivedOutbound.infantsUnit * participants.infants)) : `${Math.round(derivedOutbound.infantsUnit * participants.infants).toLocaleString()} ${currency}`}</span>
                                                    </div>
                                                )}
                                                {selectedAddOnsByLeg.outbound.length > 0 && (
                                                    <div className="space-y-1">
                                                        {selectedAddOnsByLeg.outbound.map((addOnId) => {
                                                            const addOn: any = dynamicAddOnServices.find((service) => service.id === addOnId);
                                                            if (!addOn) return null;
                                                            const qty = addOnPerPassenger[addOnId] || 1; // Lấy số lượng
                                                            return (
                                                                <div key={addOnId} className="flex justify-between text-sm">
                                                                    <span>{addOn.name} ({qty})</span>
                                                                    <span>{addOn.currency && addOn.currency !== 'VND' ? `${(addOn.price * qty).toLocaleString()} ${addOn.currency}` : formatPrice(addOn.price * qty)}</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                                {selectedSeatsByLeg.outbound.length > 0 && (
                                                    <div className="space-y-1">
                                                        {selectedSeatsByLeg.outbound.map((s) => (
                                                            <div key={s.id} className="flex justify-between text-sm">
                                                                <span>Ghế {s.number}</span>
                                                                <span>{s.currency && s.currency !== 'VND' ? `${s.price.toLocaleString()} ${s.currency}` : formatPrice(s.price || 0)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                <div className="flex justify-between font-semibold text-base mt-2">
                                                    <span>Tổng chuyến đi</span>
                                                    <span className="text-[hsl(var(--primary))]">
                                                        {(() => {
                                                            const base = derivedOutbound.adultsUnit * participants.adults + derivedOutbound.childrenUnit * participants.children + derivedOutbound.infantsUnit * participants.infants;
                                                            const addOns = selectedAddOnsByLeg.outbound.reduce((sum, id) => {
                                                                const addOn = dynamicAddOnServices.find((s) => s.id === id);
                                                                if (!addOn) return sum;
                                                                // Sửa: Sử dụng giá trị số thực tế của addOnPerPassenger[id], không phải logic boolean
                                                                const qty = addOnPerPassenger[id] || 1;
                                                                return sum + (addOn.price * qty);
                                                            }, 0);
                                                            const seats = selectedSeatsByLeg.outbound.reduce((sum, s) => sum + (s.price || 0), 0);
                                                            const total = base + addOns + seats;
                                                            return currency === 'VND' ? formatPrice(total) : `${total.toLocaleString()} ${currency}`;
                                                        })()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <Separator />
                                        {/* Inbound Flight */}
                                        {isRoundtrip && inboundCachedPricing && (
                                            <>
                                                <div>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="font-medium">Chuyến về</span>
                                                        <span className="text-sm text-[hsl(var(--muted-foreground))]">
                                                            {/* {extractOfferFromPricing(inboundCachedPricing)?.itineraries?.[0]?.segments?.[0]?.carrierCode ?? flightDetails.airline}
                                                    {extractOfferFromPricing(inboundCachedPricing)?.itineraries?.[0]?.segments?.[0]?.number ?? flightDetails.flightNumber} */}
                                                            {extractOfferFromPricing(inboundCachedPricing)?.itineraries?.[0]?.segments?.[0]?.carrierCode ?? flightDetails.airline}
                                                            {extractOfferFromPricing(inboundCachedPricing)?.itineraries?.[0]?.segments?.[0]?.number ?? flightDetails.flightNumber}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm text-[hsl(var(--muted-foreground))]">
                                                        {/* {`${extractOfferFromPricing(inboundCachedPricing)?.itineraries?.[0]?.segments?.[0]?.arrival?.iataCode ?? flightDetails.arrival.airport} (${flightDetails.arrival.city}) → ${extractOfferFromPricing(inboundCachedPricing)?.itineraries?.[0]?.segments?.[0]?.departure?.iataCode ?? flightDetails.departure.airport} (${flightDetails.departure.city})`}
                                                <br />
                                                {extractOfferFromPricing(inboundCachedPricing)?.itineraries?.[0]?.segments?.[0]?.departure?.at?.split('T')?.[0] ?? flightDetails.date} • {extractOfferFromPricing(inboundCachedPricing)?.itineraries?.[0]?.segments?.[0]?.departure?.at?.split('T')?.[1]?.slice(0, 5) ?? flightDetails.departure.time} - {extractOfferFromPricing(inboundCachedPricing)?.itineraries?.[0]?.segments?.[0]?.arrival?.at?.split('T')?.[1]?.slice(0, 5) ?? flightDetails.arrival.time} */}
                                                        {/* {`${extractOfferFromPricing(inboundCachedPricing)?.itineraries?.[0]?.segments?.[0]?.departure?.iataCode ?? flightDetails.departure.airport} (${extractOfferFromPricing(inboundCachedPricing)?.itineraries?.[0]?.segments?.[0]?.departure?.iataCode ? flightDetails.departure.city : flightDetails.departure.city}) → ${extractOfferFromPricing(inboundCachedPricing)?.itineraries?.[0]?.segments?.[0]?.arrival?.iataCode ?? flightDetails.arrival.airport} (${extractOfferFromPricing(inboundCachedPricing)?.itineraries?.[0]?.segments?.[0]?.arrival?.iataCode ? flightDetails.arrival.city : flightDetails.arrival.city})`}
                                                <br />
                                                {extractOfferFromPricing(inboundCachedPricing)?.itineraries?.[0]?.segments?.[0]?.departure?.at?.split('T')?.[0] ?? flightDetails.date} • {extractOfferFromPricing(inboundCachedPricing)?.itineraries?.[0]?.segments?.[0]?.departure?.at?.split('T')?.[1]?.slice(0, 5) ?? flightDetails.departure.time} - {extractOfferFromPricing(inboundCachedPricing)?.itineraries?.[0]?.segments?.[0]?.arrival?.at?.split('T')?.[1]?.slice(0, 5) ?? flightDetails.arrival.time} */}
                                                        {(() => {
                                                            const seg = extractOfferFromPricing(inboundCachedPricing)?.itineraries?.[0]?.segments?.[0] ?? null;
                                                            const depCode = seg?.departure?.iataCode ?? flightDetails.arrival.airport;
                                                            const depCity = getAirportLabel(depCode, seg?.departure?.city ?? flightDetails.arrival.city);
                                                            const arrCode = seg?.arrival?.iataCode ?? flightDetails.departure.airport;
                                                            const arrCity = getAirportLabel(arrCode, seg?.arrival?.city ?? flightDetails.departure.city);
                                                            // return `${depCode} (${depCity}) → ${arrCode} (${arrCity})`;
                                                            return `${depCode} (${depCity}) → ${arrCode} (${arrCity})`;

                                                        })()}
                                                        <br />
                                                        {(() => {
                                                            const seg = extractOfferFromPricing(inboundCachedPricing)?.itineraries?.[0]?.segments?.[0] ?? null;
                                                            const date = seg?.departure?.at?.split('T')?.[0] ?? flightDetails.date;
                                                            const depTime = seg?.departure?.at ? seg.departure.at.split('T')[1]?.slice(0, 5) : flightDetails.departure.time;
                                                            const arrTime = seg?.arrival?.at ? seg.arrival.at.split('T')[1]?.slice(0, 5) : flightDetails.arrival.time;
                                                            return `${date} • ${depTime} - ${arrTime}`;
                                                        })()}
                                                    </div>
                                                    <div className="space-y-1 mt-2">
                                                        <div className="flex justify-between">
                                                            <span>Người lớn ({participants.adults})</span>
                                                            <span>{currency === 'VND' ? formatPrice(Math.round(derivedInbound.adultsUnit * participants.adults)) : `${Math.round(derivedInbound.adultsUnit * participants.adults).toLocaleString()} ${currency}`}</span>
                                                        </div>
                                                        {participants.children > 0 && (
                                                            <div className="flex justify-between">
                                                                <span>Trẻ em ({participants.children})</span>
                                                                <span>{currency === 'VND' ? formatPrice(Math.round(derivedInbound.childrenUnit * participants.children)) : `${Math.round(derivedInbound.childrenUnit * participants.children).toLocaleString()} ${currency}`}</span>
                                                            </div>
                                                        )}
                                                        {participants.infants > 0 && (
                                                            <div className="flex justify-between">
                                                                <span>Em bé ({participants.infants})</span>
                                                                <span>{currency === 'VND' ? formatPrice(Math.round(derivedInbound.infantsUnit * participants.infants)) : `${Math.round(derivedInbound.infantsUnit * participants.infants).toLocaleString()} ${currency}`}</span>
                                                            </div>
                                                        )}
                                                        {selectedAddOnsByLeg.inbound.length > 0 && (
                                                            <div className="space-y-1">
                                                                {selectedAddOnsByLeg.inbound.map((addOnId) => {
                                                                    const addOn: any = dynamicAddOnServices.find((service) => service.id === addOnId);
                                                                    if (!addOn) return null;
                                                                    const qty = addOnPerPassenger[addOnId] || 1; // Sử dụng số lượng từ state
                                                                    return (
                                                                        <div key={addOnId} className="flex justify-between text-sm">
                                                                            <span>{addOn.name} ({qty})</span>
                                                                            <span>{addOn.currency && addOn.currency !== 'VND' ? `${(addOn.price * qty).toLocaleString()} ${addOn.currency}` : formatPrice(addOn.price * qty)}</span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                        {selectedSeatsByLeg.inbound.length > 0 && (
                                                            <div className="space-y-1">
                                                                {selectedSeatsByLeg.inbound.map((s) => (
                                                                    <div key={s.id} className="flex justify-between text-sm">
                                                                        <span>Ghế {s.number}</span>
                                                                        <span>{s.currency && s.currency !== 'VND' ? `${s.price.toLocaleString()} ${s.currency}` : formatPrice(s.price || 0)}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                        <div className="flex justify-between font-semibold text-base mt-2">
                                                            <span>Tổng chuyến về</span>
                                                            <span className="text-[hsl(var(--primary))]">
                                                                {(() => {
                                                                    const base = derivedInbound.adultsUnit * participants.adults + derivedInbound.childrenUnit * participants.children + derivedInbound.infantsUnit * participants.infants;
                                                                    const addOns = selectedAddOnsByLeg.inbound.reduce((sum, id) => {
                                                                        const addOn = dynamicAddOnServices.find((s) => s.id === id);
                                                                        if (!addOn) return sum;
                                                                        const qty = addOnPerPassenger[id] || 1;  // Sửa tương tự
                                                                        return sum + (addOn.price * qty);
                                                                    }, 0);
                                                                    const seats = selectedSeatsByLeg.inbound.reduce((sum, s) => sum + (s.price || 0), 0);
                                                                    const total = base + addOns + seats;
                                                                    return currency === 'VND' ? formatPrice(total) : `${total.toLocaleString()} ${currency}`;
                                                                })()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Separator />
                                            </>
                                        )}
                                        {/* Grand Total */}
                                        <div className="flex justify-between font-bold text-lg">
                                            <span>Tổng cộng</span>
                                            <span className="text-[hsl(var(--primary))]">
                                                {currency === 'VND' ? formatPrice(Math.round(calculateTotal())) : `${Math.round(calculateTotal()).toLocaleString()} ${currency}`}
                                            </span>
                                        </div>
                                        <div className="text-xs text-[hsl(var(--muted-foreground))]">
                                            Tổng {totalParticipants} khách • Giá đã bao gồm thuế và phí
                                        </div>
                                        <Separator />
                                        {/* Important Notes */}
                                        <div className="space-y-2">
                                            <div className="flex items-start gap-2">
                                                <AlertCircle className="h-4 w-4 text-[hsl(var(--warning))] mt-0.5" />
                                                <div className="text-xs text-[hsl(var(--muted-foreground))]">
                                                    Giá vé có thể thay đổi trong quá trình đặt chỗ
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <Info className="h-4 w-4 text-[hsl(var(--primary))] mt-0.5" />
                                                <div className="text-xs text-[hsl(var(--muted-foreground))]">
                                                    Vé sẽ được giữ chỗ trong 15 phút
                                                </div>
                                            </div>
                                        </div>
                                        {/* Action Buttons */}
                                        <div className="space-y-2 pt-4">
                                            {/* <Button
                                        className="w-full"
                                        size="lg"
                                        onClick={() => {
                                            if (!validateLeadPassengerAndContact()) {
                                                window.scrollTo({ top: 200, behavior: "smooth" });
                                                alert("Vui lòng điền đầy đủ thông tin hành khách và liên hệ trước khi tiếp tục.");
                                                return;
                                            }

                                            const paxCount = participants.adults + participants.children + participants.infants;
                                            const pricingPerPax = {
                                                adultUnit: Math.round(derived.adultsUnit || flightDetails.fareRules[selectedFare].price),
                                                childUnit: Math.round(derived.childrenUnit || Math.round(flightDetails.fareRules[selectedFare].price * 0.75)),
                                                infantUnit: Math.round(derived.infantsUnit || Math.round(flightDetails.fareRules[selectedFare].price * 0.2)),
                                            };
                                            const paxTotals = {
                                                adultsTotal: pricingPerPax.adultUnit * participants.adults,
                                                childrenTotal: pricingPerPax.childUnit * participants.children,
                                                infantsTotal: pricingPerPax.infantUnit * participants.infants,
                                            };

                                            const addOnsDetailed = {
                                                outbound: selectedAddOnsByLeg.outbound.map((id) => {
                                                    const svc = dynamicAddOnServices.find((s) => s.id === id) ?? { id, name: id, price: 0 };
                                                    const per = addOnPerPassenger[id] ?? false;
                                                    const qty = per ? paxCount : 1;
                                                    return { id: svc.id, name: svc.name, unitPrice: Number(svc.price) || 0, qty, total: (Number(svc.price) || 0) * qty, perPassenger: per, leg: "outbound" };
                                                }),
                                                inbound: selectedAddOnsByLeg.inbound.map((id) => {
                                                    const svc = dynamicAddOnServices.find((s) => s.id === id) ?? { id, name: id, price: 0 };
                                                    const per = addOnPerPassenger[id] ?? false;
                                                    const qty = per ? paxCount : 1;
                                                    return { id: svc.id, name: svc.name, unitPrice: Number(svc.price) || 0, qty, total: (Number(svc.price) || 0) * qty, perPassenger: per, leg: "inbound" };
                                                }),
                                            };

                                            const seatsDetailed = {
                                                outbound: selectedSeatsByLeg.outbound.map((s) => ({
                                                    id: s.id,
                                                    number: s.number,
                                                    price: Number(s.price) || 0,
                                                    currency: s.currency || currency || "VND",
                                                    leg: "outbound",
                                                })),
                                                inbound: selectedSeatsByLeg.inbound.map((s) => ({
                                                    id: s.id,
                                                    number: s.number,
                                                    price: Number(s.price) || 0,
                                                    currency: s.currency || currency || "VND",
                                                    leg: "inbound",
                                                })),
                                            };

                                            const taxesEstimate = (() => {
                                                const offerTotal = parseNumberSafe(normalizedOffer?.price?.total ?? cachedPricing?.price?.total ?? 0);
                                                if (offerTotal && offerTotal > 0) {
                                                    const paxSum = (paxTotals.adultsTotal || 0) + (paxTotals.childrenTotal || 0) + (paxTotals.infantsTotal || 0);
                                                    const t = Math.max(0, Math.round(offerTotal - paxSum));
                                                    return t || 290000 * paxCount;
                                                }
                                                return 290000 * paxCount;
                                            })();

                                            const addOnsTotal = addOnsDetailed.outbound.reduce((s, a) => s + a.total, 0) + addOnsDetailed.inbound.reduce((s, a) => s + a.total, 0);
                                            const seatsTotal = seatsDetailed.outbound.reduce((s, a) => s + a.price, 0) + seatsDetailed.inbound.reduce((s, a) => s + a.price, 0);
                                            const passengerBaseTotal = paxTotals.adultsTotal + paxTotals.childrenTotal + paxTotals.infantsTotal;
                                            const estimatedTotal = passengerBaseTotal * (isRoundtrip ? 2 : 1) + taxesEstimate * (isRoundtrip ? 2 : 1) + addOnsTotal + seatsTotal;

                                            const buildFlight = (pricing: any, isInbound: boolean = false) => {
                                                const offerSeg = extractOfferFromPricing(pricing)?.itineraries?.[0]?.segments?.[0] ?? null;
                                                const dep = offerSeg?.departure ?? null;
                                                const arr = offerSeg?.arrival ?? null;
                                                const carrier = offerSeg?.carrierCode ?? offerSeg?.operating?.carrierCode ?? null;
                                                const number = offerSeg?.number ?? null;
                                                const flightNumberStr = carrier && number ? `${carrier}${number}` : flightDetails.flightNumber;
                                                const airlineName = (extractOfferFromPricing(pricing)?.validatingAirlineCodes && extractOfferFromPricing(pricing)?.validatingAirlineCodes[0]) || flightDetails.airline;
                                                const routeStr = isInbound
                                                    ? `${arr?.iataCode ?? flightDetails.arrival.airport} → ${dep?.iataCode ?? flightDetails.departure.airport}`
                                                    : `${dep?.iataCode ?? flightDetails.departure.airport} → ${arr?.iataCode ?? flightDetails.arrival.airport}`;
                                                const dateStr = dep?.at?.split("T")?.[0] ?? flightDetails.date;
                                                const timeStr = dep?.at && arr?.at
                                                    ? `${dep.at.split("T")[1]?.slice(0, 5)} - ${arr.at.split("T")[1]?.slice(0, 5)}`
                                                    : `${flightDetails.departure.time} - ${flightDetails.arrival.time}`;

                                                return {
                                                    id: extractOfferFromPricing(pricing)?.id ?? flightDetails.id,
                                                    flightNumber: flightNumberStr,
                                                    airline: airlineName,
                                                    route: routeStr,
                                                    date: dateStr,
                                                    time: timeStr,
                                                    itineraries: extractOfferFromPricing(pricing)?.itineraries ?? null,
                                                    currency,
                                                };
                                            };

                                            const booking = {
                                                source: "megatrip-client",
                                                flights: {
                                                    outbound: buildFlight(outboundCachedPricing || cachedPricing),
                                                    inbound: isRoundtrip && inboundCachedPricing ? buildFlight(inboundCachedPricing, true) : null,
                                                },
                                                passengers: {
                                                    counts: { ...participants },
                                                    contactInfo,
                                                    leadPassenger: passengerInfo,
                                                },
                                                pricing: {
                                                    perPax: pricingPerPax,
                                                    paxTotals,
                                                    taxesEstimate,
                                                    addOns: [...addOnsDetailed.outbound, ...addOnsDetailed.inbound],
                                                    seats: [...seatsDetailed.outbound, ...seatsDetailed.inbound],
                                                    passengerBaseTotal,
                                                    addOnsTotal,
                                                    seatsTotal,
                                                    estimatedTotal,
                                                    offerTotal: derived.offerTotal || null,
                                                },
                                                rawPricing: {
                                                    outbound: outboundCachedPricing ?? cachedPricing ?? null,
                                                    inbound: inboundCachedPricing ?? null,
                                                },
                                                timestamp: Date.now(),
                                            };

                                            try {
                                                const bookingKey = `booking_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
                                                sessionStorage.setItem(bookingKey, JSON.stringify(booking));
                                                router.push(`/thanh-toan?bookingKey=${encodeURIComponent(bookingKey)}`);
                                            } catch (e) {
                                                console.error("Lỗi lưu booking", e);
                                                alert("Không thể lưu dữ liệu thanh toán. Vui lòng thử lại.");
                                            }
                                        }}
                                    >
                                        Tiếp tục thanh toán
                                    </Button> */}

                                            <Button
                                                className="w-full"
                                                size="lg"
                                                onClick={() => {

                                                    if (!isLoggedIn()) {
                                                        toast.info('Bạn chưa đăng nhập. Đang chuyển sang trang đăng nhập...');
                                                        // Thêm delay 2.5 giây trước khi chuyển hướng
                                                        setTimeout(() => {
                                                            router.push(`/dang-nhap?redirect=${encodeURIComponent(window.location.pathname)}`);
                                                        }, 2500); // 2.5 giây
                                                        return;
                                                    }

                                                    // if (!validateLeadPassengerAndContact()) {
                                                    //     window.scrollTo({ top: 200, behavior: "smooth" });
                                                    //     alert("Vui lòng điền đầy đủ thông tin hành khách và liên hệ trước khi tiếp tục.");
                                                    //     return;
                                                    // }

                                                    // Hàm dọn dẹp booking cũ
                                                    const cleanOldBookings = () => {
                                                        Object.keys(sessionStorage).forEach(key => {
                                                            if (key.startsWith('booking_')) {
                                                                try {
                                                                    const data = JSON.parse(sessionStorage.getItem(key) || '{}');
                                                                    const isCurrentFlight = data.flights?.outbound?.id === id;
                                                                    const isExpired = Date.now() - (data.timestamp || 0) > 15 * 60 * 1000; // Hết hạn sau 15 phút
                                                                    if (isCurrentFlight && isExpired) {
                                                                        sessionStorage.removeItem(key);
                                                                    }
                                                                } catch (e) {
                                                                    console.warn('Lỗi khi dọn dẹp booking cũ:', e);
                                                                }
                                                            }
                                                        });
                                                    };

                                                    // Hàm lấy bookingKey hiện có
                                                    const getExistingBookingKey = () => {
                                                        for (const key of Object.keys(sessionStorage)) {
                                                            if (key.startsWith('booking_')) {
                                                                try {
                                                                    const data = JSON.parse(sessionStorage.getItem(key) || '{}');
                                                                    if (
                                                                        data.flights?.outbound?.id === id &&
                                                                        Date.now() - (data.timestamp || 0) <= 15 * 60 * 1000 // Còn hạn trong 15 phút
                                                                    ) {
                                                                        return key;
                                                                    }
                                                                } catch (e) {
                                                                    console.warn('Lỗi khi kiểm tra bookingKey:', e);
                                                                }
                                                            }
                                                        }
                                                        return null;
                                                    };

                                                    // Tính toán dữ liệu booking
                                                    const paxCount = participants.adults + participants.children + participants.infants;
                                                    const pricingPerPax = {
                                                        adultUnit: Math.round(derived.adultsUnit || (flightDetails as any).fareRules[selectedFare].price),
                                                        childUnit: Math.round(derived.childrenUnit || Math.round((flightDetails as any).fareRules[selectedFare].price * 0.75)),
                                                        infantUnit: Math.round(derived.infantsUnit || Math.round((flightDetails as any).fareRules[selectedFare].price * 0.2)),
                                                    };
                                                    const paxTotals = {
                                                        adultsTotal: pricingPerPax.adultUnit * participants.adults,
                                                        childrenTotal: pricingPerPax.childUnit * participants.children,
                                                        infantsTotal: pricingPerPax.infantUnit * participants.infants,
                                                    };

                                                    const addOnsDetailed = {
                                                        outbound: selectedAddOnsByLeg.outbound.map((id) => {
                                                            const svc = dynamicAddOnServices.find((s) => s.id === id) ?? { id, name: id, price: 0 };
                                                            const qty = addOnPerPassenger[id] || 1; // Sử dụng số lượng
                                                            return { id: svc.id, name: svc.name, unitPrice: Number(svc.price) || 0, qty, total: (Number(svc.price) || 0) * qty, perPassenger: qty > 1, leg: "outbound" }; // perPassenger có thể giữ boolean nếu cần, nhưng qty là chính
                                                        }),
                                                        inbound: selectedAddOnsByLeg.inbound.map((id) => {
                                                            const svc = dynamicAddOnServices.find((s) => s.id === id) ?? { id, name: id, price: 0 };
                                                            const qty = addOnPerPassenger[id] || 1;
                                                            return { id: svc.id, name: svc.name, unitPrice: Number(svc.price) || 0, qty, total: (Number(svc.price) || 0) * qty, perPassenger: qty > 1, leg: "inbound" };
                                                        }),
                                                    };

                                                    const seatsDetailed = {
                                                        outbound: selectedSeatsByLeg.outbound.map((s) => ({
                                                            id: s.id,
                                                            number: s.number,
                                                            price: Number(s.price) || 0,
                                                            currency: s.currency || currency || "VND",
                                                            leg: "outbound",
                                                        })),
                                                        inbound: selectedSeatsByLeg.inbound.map((s) => ({
                                                            id: s.id,
                                                            number: s.number,
                                                            price: Number(s.price) || 0,
                                                            currency: s.currency || currency || "VND",
                                                            leg: "inbound",
                                                        })),
                                                    };

                                                    const taxesEstimate = (() => {
                                                        const offerTotal = parseNumberSafe(normalizedOffer?.price?.total ?? cachedPricing?.price?.total ?? 0);
                                                        if (offerTotal && offerTotal > 0) {
                                                            const paxSum = (paxTotals.adultsTotal || 0) + (paxTotals.childrenTotal || 0) + (paxTotals.infantsTotal || 0);
                                                            const t = Math.max(0, Math.round(offerTotal - paxSum));
                                                            return t || 290000 * paxCount;
                                                        }
                                                        return 290000 * paxCount;
                                                    })();

                                                    const addOnsTotal = addOnsDetailed.outbound.reduce((s, a) => s + a.total, 0) + addOnsDetailed.inbound.reduce((s, a) => s + a.total, 0);
                                                    const seatsTotal = seatsDetailed.outbound.reduce((s, a) => s + a.price, 0) + seatsDetailed.inbound.reduce((s, a) => s + a.price, 0);
                                                    const passengerBaseTotal = paxTotals.adultsTotal + paxTotals.childrenTotal + paxTotals.infantsTotal;
                                                    const estimatedTotal = passengerBaseTotal * (isRoundtrip ? 2 : 1) + taxesEstimate * (isRoundtrip ? 2 : 1) + addOnsTotal + seatsTotal;

                                                    // const buildFlight = (pricing: any, isInbound: boolean = false) => {
                                                    //     const offerSeg = extractOfferFromPricing(pricing)?.itineraries?.[0]?.segments?.[0] ?? null;
                                                    //     const dep = offerSeg?.departure ?? null;
                                                    //     const arr = offerSeg?.arrival ?? null;
                                                    //     const carrier = offerSeg?.carrierCode ?? offerSeg?.operating?.carrierCode ?? null;
                                                    //     const number = offerSeg?.number ?? null;
                                                    //     const flightNumberStr = carrier && number ? `${carrier}${number}` : flightDetails.flightNumber;
                                                    //     const airlineName = (extractOfferFromPricing(pricing)?.validatingAirlineCodes && extractOfferFromPricing(pricing)?.validatingAirlineCodes[0]) || flightDetails.airline;
                                                    //     const routeStr = isInbound
                                                    //         ? `${arr?.iataCode ?? flightDetails.arrival.airport} → ${dep?.iataCode ?? flightDetails.departure.airport}`
                                                    //         : `${dep?.iataCode ?? flightDetails.departure.airport} → ${arr?.iataCode ?? flightDetails.arrival.airport}`;
                                                    //     const dateStr = dep?.at?.split("T")?.[0] ?? flightDetails.date;
                                                    //     const timeStr = dep?.at && arr?.at
                                                    //         ? `${dep.at.split("T")[1]?.slice(0, 5)} - ${arr.at.split("T")[1]?.slice(0, 5)}`
                                                    //         : `${flightDetails.departure.time} - ${flightDetails.arrival.time}`;

                                                    //     return {
                                                    //         id: extractOfferFromPricing(pricing)?.id ?? flightDetails.id,
                                                    //         flightNumber: flightNumberStr,
                                                    //         airline: airlineName,
                                                    //         route: routeStr,
                                                    //         date: dateStr,
                                                    //         time: timeStr,
                                                    //         itineraries: extractOfferFromPricing(pricing)?.itineraries ?? null,
                                                    //         currency,
                                                    //     };
                                                    // };
                                                    const buildFlight = (pricing: any, isInbound: boolean = false) => {
                                                        const offerSeg = extractOfferFromPricing(pricing)?.itineraries?.[0]?.segments?.[0] ?? null;
                                                        const dep = offerSeg?.departure ?? null;
                                                        const arr = offerSeg?.arrival ?? null;
                                                        const carrier = offerSeg?.carrierCode ?? offerSeg?.operating?.carrierCode ?? null;
                                                        const number = offerSeg?.number ?? null;
                                                        const flightNumberStr = carrier && number ? `${carrier}${number}` : flightDetails.flightNumber;
                                                        const airlineName = (extractOfferFromPricing(pricing)?.validatingAirlineCodes && extractOfferFromPricing(pricing)?.validatingAirlineCodes[0]) || flightDetails.airline;
                                                        // Sửa: routeStr luôn là dep → arr
                                                        const routeStr = `${dep?.iataCode} → ${arr?.iataCode}`;
                                                        const dateStr = dep?.at?.split("T")?.[0] ?? flightDetails.date;
                                                        const timeStr = dep?.at && arr?.at
                                                            ? `${dep.at.split("T")[1]?.slice(0, 5)} - ${arr.at.split("T")[1]?.slice(0, 5)}`
                                                            : `${flightDetails.departure.time} - ${flightDetails.arrival.time}`;

                                                        return {
                                                            id: extractOfferFromPricing(pricing)?.id ?? flightDetails.id,
                                                            flightNumber: flightNumberStr,
                                                            airline: airlineName,
                                                            route: routeStr,
                                                            date: dateStr,
                                                            time: timeStr,
                                                            itineraries: extractOfferFromPricing(pricing)?.itineraries ?? null,
                                                            currency,
                                                        };
                                                    };

                                                    const booking = {
                                                        source: "megatrip-client",
                                                        flights: {
                                                            outbound: buildFlight(outboundCachedPricing || cachedPricing),
                                                            inbound: isRoundtrip && inboundCachedPricing ? buildFlight(inboundCachedPricing, true) : null,
                                                        },
                                                        passengers: {
                                                            counts: { ...participants },
                                                            contactInfo,
                                                            leadPassenger: passengerInfo,
                                                        },
                                                        pricingOutbound: derivedOutbound,  // Thêm: Lưu pricing riêng cho outbound
                                                        pricingInbound: derivedInbound,    // Thêm: Lưu pricing riêng cho inbound
                                                        pricing: {  // Giữ lại pricing tổng hợp nếu cần (cho backward compatibility)
                                                            perPax: pricingPerPax,
                                                            paxTotals,
                                                            taxesEstimate,
                                                            addOns: [...addOnsDetailed.outbound, ...addOnsDetailed.inbound],
                                                            seats: [...seatsDetailed.outbound, ...seatsDetailed.inbound],
                                                            passengerBaseTotal,
                                                            addOnsTotal,
                                                            seatsTotal,
                                                            estimatedTotal,
                                                            offerTotal: derived.offerTotal || null,
                                                        },
                                                        rawPricing: {
                                                            outbound: outboundCachedPricing ?? cachedPricing ?? null,
                                                            inbound: inboundCachedPricing ?? null,
                                                        },
                                                        timestamp: Date.now(),
                                                    };

                                                    try {
                                                        // Dọn dẹp booking cũ
                                                        cleanOldBookings();
                                                        // Lấy bookingKey hiện có hoặc tạo mới
                                                        let bookingKey = getExistingBookingKey();
                                                        if (!bookingKey) {
                                                            bookingKey = `booking_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
                                                        }
                                                        // Lưu booking vào sessionStorage
                                                        sessionStorage.setItem(bookingKey, JSON.stringify(booking));
                                                        // Chuyển hướng
                                                        router.push(`/thanh-toan?bookingKey=${encodeURIComponent(bookingKey)}`);
                                                    } catch (e) {
                                                        console.error("Lỗi lưu booking", e);
                                                        alert("Không thể lưu dữ liệu thanh toán. Vui lòng thử lại.");
                                                    }
                                                }}
                                            >
                                                Tiếp tục thanh toán
                                            </Button>
                                            {/* <Button variant="outline" className="w-full">
                                        <PlusCircle className="h-4 w-4 mr-2" />
                                        Thêm vào giỏ hàng
                                    </Button> */}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}