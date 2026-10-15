"use client"
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Separator } from '../../components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Calendar } from '../../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { Textarea } from '../../components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Progress } from '../../components/ui/progress';
import {
    Map,
    Star,
    Users,
    Calendar as CalendarIcon,
    MapPin,
    ChevronLeft,
    Timer,
    PlusCircle,
    Info,
    AlertCircle,
    Plane,
    Hotel,
    Utensils,
    Camera,
    Heart,
    Share2,
    Phone,
    Clock,
    CheckCircle,
    XCircle,
    Plus,
    Minus,
    ThumbsUp,
    ThumbsDown,
    Send,
    Flag,
    ImageIcon,
    PlayCircle,
    MoreHorizontal,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useRouter } from 'next/navigation';
import { log } from 'console';
import { toast } from 'sonner';

// Sample tour data with enhanced information
const tourDetails = {
    id: "1",
    name: 'Đà Nẵng - Hội An - Bà Nà Hills 3N2Đ',
    departure: 'TP. Hồ Chí Minh',
    destinations: ['Đà Nẵng', 'Hội An', 'Bà Nà Hills'],
    duration: '3 ngày 2 đêm',
    maxGroup: 35,
    priceFrom: 3990000,
    // originalPrice sẽ được tính ngay sau khi object tạo (nếu BE không cung cấp)
    originalPrice: undefined,
    rating: 4.8,
    reviews: 245,
    description: `Tour Đà Nẵng - Hội An - Bà Nà Hills 3N2Đ là hành trình khám phá vẻ đẹp miền Trung Việt Nam với những điểm đến nổi tiếng nhất. Bạn sẽ được trải nghiệm Cầu Vàng Bà Nà Hills - kỳ quan mới của thế giới, khám phá phố cổ Hội An - di sản văn hóa thế giới, thưởng thức ẩm thực đặc sắc và tắm biển tại bãi biển Mỹ Khê xinh đẹp.`,
    images: [
        { url: 'https://media-cdn-v2.laodong.vn/Storage/NewsPortal/2022/2/26/1017919/Sun-World-Ba-Na-Hill-01.jpg', title: 'Sun World Ba Na Hills', type: 'image' },
        { url: 'https://centralvietnamguide.com/wp-content/uploads/2022/02/ba-na-hill-station_2-1024x683.jpg', title: 'Ba Na Hill Station', type: 'image' },
        { url: 'https://vietnam.travel/sites/default/files/inline-images/shutterstock_1346056832.jpg', title: 'Cầu Vàng Bà Nà', type: 'image' },
        { url: 'https://impresstravel.com/wp-content/uploads/2020/02/Ba-Na-Hill-e1577003905738.jpg', title: 'Bà Nà Hill 1', type: 'image' },
        { url: 'https://impresstravel.com/wp-content/uploads/2020/02/Ba-Na-Hill-e1577003905738.jpg', title: 'Bà Nà Hill 2', type: 'image' },
        { url: '/placeholder.svg', title: 'Video tour overview', type: 'video' },
        { url: '/placeholder.svg', title: 'Khách sạn 4 sao', type: 'image' },
    ],
    includes: ['Vé máy bay khứ hồi', 'Khách sạn 4*', '6 bữa ăn', 'Vé tham quan', 'HDV tiếng Việt', 'Bảo hiểm du lịch'],
    excludes: ['Chi phí cá nhân', 'Tiền tip HDV, tài xế', 'Đồ uống có cồn', 'Vé tham quan ngoài chương trình'],
    highlights: ['Cầu Vàng Bà Nà Hills', 'Phố cổ Hội An', 'Bãi biển Mỹ Khê', 'Chùa Cầu Nhật Bản'],
    attractions: [
        {
            name: 'Bà Nà Hills',
            description: 'Khu du lịch nổi tiếng với Cầu Vàng và làng Pháp cổ kính',
            duration: '1 ngày',
            highlights: ['Cầu Vàng', 'Làng Pháp', 'Cáp treo', 'Chùa Linh Ứng']
        },
        {
            name: 'Phố cổ Hội An',
            description: 'Di sản văn hóa thế giới với kiến trúc cổ độc đáo',
            duration: '1 ngày',
            highlights: ['Chùa Cầu', 'Nhà cổ', 'Đèn lồng', 'Ẩm thực địa phương']
        },
        {
            name: 'Ngũ Hành Sơn',
            description: 'Quần thể 5 ngọn núi đá vôi với động thiêng liêng',
            duration: 'Nửa ngày',
            highlights: ['Động Huyền Không', 'Chùa Tam Thai', 'Làng đá Non Nước']
        }
    ],
    availableDates: [
        { date: '2025-01-15', available: 12, price: 3990000, status: 'available' },
        { date: '2025-01-22', available: 8, price: 4190000, status: 'filling' },
        { date: '2025-01-29', available: 15, price: 3990000, status: 'available' },
        { date: '2025-02-05', available: 20, price: 4390000, status: 'available' },
        { date: '2025-02-12', available: 5, price: 4590000, status: 'limited' },
        { date: '2025-02-19', available: 18, price: 4190000, status: 'available' },
        { date: '2025-02-26', available: 0, price: 4590000, status: 'soldout' },
        { date: '2025-03-05', available: 25, price: 3990000, status: 'available' },
    ],
    itinerary: [
        {
            day: 1,
            title: 'TP.HCM - Đà Nẵng - Bà Nà Hills',
            activities: [
                'Tập trung sân bay Tân Sơn Nhất, bay đến Đà Nẵng',
                'Ăn trưa tại nhà hàng địa phương',
                'Tham quan Bà Nà Hills - Cầu Vàng',
                'Trải nghiệm cáp treo dài nhất thế giới',
                'Check-in khách sạn, nghỉ ngơi',
            ],
            meals: ['Sáng', 'Trưa', 'Tối'],
            accommodation: 'Khách sạn 4* Đà Nẵng',
            transport: 'Xe du lịch',
        },
        {
            day: 2,
            title: 'Đà Nẵng - Hội An',
            activities: [
                'Ăn sáng tại khách sạn',
                'Tham quan Ngũ Hành Sơn',
                'Ăn trưa tại Hội An',
                'Khám phá phố cổ Hội An',
                'Chùa Cầu Nhật Bản',
                'Mua sắm đèn lồng và đặc sản địa phương',
            ],
            meals: ['Sáng', 'Trưa', 'Tối'],
            accommodation: 'Khách sạn 4* Hội An',
            transport: 'Xe du lịch',
        },
        {
            day: 3,
            title: 'Hội An - Đà Nẵng - TP.HCM',
            activities: [
                'Ăn sáng tại khách sạn',
                'Tự do tắm biển Cửa Đại',
                'Mua sắm tại chợ Hội An',
                'Ăn trưa tại nhà hàng',
                'Ra sân bay Đà Nẵng, bay về TP.HCM',
            ],
            meals: ['Sáng', 'Trưa'],
            accommodation: 'Không',
            transport: 'Xe du lịch',
        },
    ],
    pricing: {
        adult: 3990000,
        child: 3190000,
        infant: 990000,
        singleSupplement: 800000,
    },
    policies: {
        cancellation: {
            'Trước 15 ngày': '20% tổng tiền tour',
            '7-14 ngày': '50% tổng tiền tour',
            '3-6 ngày': '75% tổng tiền tour',
            'Trong 2 ngày': '100% tổng tiền tour',
        },
        children: 'Dưới 4 tuổi: 25% giá tour người lớn (không ghế máy bay, chung giường). 4-11 tuổi: 80% giá tour người lớn.',
        documents: 'CCCD/CMND còn hạn ít nhất 6 tháng. Trẻ em dưới 14 tuổi: Giấy khai sinh.',
        megatrip: `Megatrip hủy trước 3 ngày do không đủ số lượng hành khách: Hoàn tiền 100%. Hoàn trả phần còn lại trong 14 ngày làm việc (trừ cuối tuần, lễ Tết). Đến trễ hoặc tự ý rời tour: mất 100%.`,
        reschedule: {
            rules: {
                'Từ 3 đến 5 ngày trước': '50% giá trị tour',
                '3 ngày trước': '100% giá trị tour.',
                // '2 ngày trước': '50% giá trị tour.',
            },
            notes: 'Chịu chi phí chênh lệch (nếu có). Chỉ chuyển 1 lần, phải tham gia trong 60 ngày. Không áp dụng lễ/Tết. Chuyển cho người khác: miễn phí (trừ vé máy bay theo hãng). Bảo lưu khoản thanh toán: 6 tháng; sau đó từ bỏ, không hoàn.'
        }
    },
    reviews1: {
        overall: 4.8,
        breakdown: {
            service: 4.9,
            value: 4.7,
            cleanliness: 4.8,
            location: 4.9,
            amenities: 4.6
        },
        distribution: {
            5: 75,
            4: 15,
            3: 8,
            2: 2,
            1: 0
        },
        comments: [
            {
                id: 1,
                user: {
                    name: 'Nguyễn Văn A',
                    avatar: '/placeholder.svg',
                    verified: true,
                    trips: 5
                },
                rating: 5,
                date: '2024-12-15',
                title: 'Tour tuyệt vời, HDV nhiệt tình',
                content: 'Tour được tổ chức rất tốt, lịch trình hợp lý. HDV nhiệt tình, am hiểu về địa phương. Cầu Vàng thật sự đẹp như trong ảnh. Khách sạn sạch sẽ, ăn uống ngon. Sẽ giới thiệu cho bạn bè.',
                helpful: 15,
                photos: ['/placeholder.svg', '/placeholder.svg'],
                response: {
                    from: 'MegaTrip',
                    content: 'Cảm ơn anh/chị đã chia sẻ. Chúng tôi rất vui khi anh/chị hài lòng với tour. Hẹn gặp lại trong những chuyến đi tiếp theo!'
                }
            },
            {
                id: 2,
                user: {
                    name: 'Trần Thị B',
                    avatar: '/placeholder.svg',
                    verified: true,
                    trips: 12
                },
                rating: 4,
                date: '2024-12-10',
                title: 'Đẹp nhưng hơi vội',
                content: 'Các điểm tham quan đều rất đẹp, đặc biệt là Hội An về đêm. Tuy nhiên lịch trình hơi dày, ít thời gian tự do. Ăn uống ở Hội An rất ngon. Chụp ảnh check-in nhiều.',
                helpful: 8,
                photos: []
            },
            {
                id: 3,
                user: {
                    name: 'Lê Văn C',
                    avatar: '/placeholder.svg',
                    verified: false,
                    trips: 2
                },
                rating: 5,
                date: '2024-12-05',
                title: 'Giá trị tốt cho tiền bỏ ra',
                content: 'So với giá tiền thì tour này khá ổn. Khách sạn ok, xe đời mới. Bà Nà Hills hơi đông nhưng cảnh đẹp. HDV hướng dẫn tận tình.',
                helpful: 5,
                photos: ['/placeholder.svg']
            }
        ]
    },
    startLocation: {
        type: 'Point',
        address: 'Đà lạt',
        pickupDropoff: 'Bến xe ngã 4 vũng tàu'
    }
};
// helper: compute reasonable original price (suggested) based on base price
function computeSuggestedOriginal(basePrice: number | undefined) {
    if (!basePrice || Number.isNaN(basePrice)) return undefined;
    // tiered markup: nhỏ -> lớn hơn, cao -> ít markup
    const price = Number(basePrice);
    const multiplier = price < 1_000_000 ? 1.25 : price < 5_000_000 ? 1.15 : 1.10;
    // round to nearest 100k for nicer display
    const suggested = Math.round(price * multiplier / 100000) * 100000;
    return suggested;
}
// simple helper to strip HTML
function stripHtml(html = '') {
    return (html || '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim();
}
// NEW: local date helper that returns YYYY-MM-DD for a Date in local timezone
function toLocalYMD(d?: Date | null) {
    if (!d) return null;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export default function ChiTietTour() {
    const router = useRouter();
    const { id } = useParams() as { id: string };

    const [dbLoaded, setDbLoaded] = useState(false); // dùng để re-render sau khi merge dữ liệu từ BE

    // Helper: convert possible DB date formats to ISO YYYY-MM-DD
    const toIsoDate = (d: any) => {
        if (!d) return null;
        const raw = d.$date ?? d;
        const dt = new Date(raw);
        if (isNaN(dt.getTime())) return null;
        return dt.toISOString().split('T')[0];
    };

    function toLocalYMDT(d?: Date | null) {
        if (!d) return null;
        return d.toLocaleString('sv-SE').replace(' ', 'T'); // e.g., "2025-12-13T04:05:00"
    }


    // Map server tour doc -> client tour shape (partial, only fields we need)
    function mapDbTourToClient(db: any) {
        if (!db) return {};
        const images = Array.isArray(db.images) && db.images.length
            ? db.images.map((img: any) => (typeof img === 'string' ? { url: img, title: '', type: 'image' } : { url: img.url || img, title: img.title || '', type: img.type || 'image' }))
            : tourDetails.images;

        const startDates = Array.isArray(db.startDates) ? db.startDates : (db.startDates || []);
        const endDates = Array.isArray(db.endDates) ? db.endDates : (db.endDates || []);
        const availableDates = startDates.map((sd: any, idx: number) => {
            const rawStart = sd.$date ?? sd;
            const rawEnd = endDates?.[idx] ? (endDates[idx].$date ?? endDates[idx]) : null;
            // Fix: Use local YYYY-MM-DDTHH:mm:ss instead of UTC ISO
            const startDateObj = rawStart ? new Date(rawStart) : null;
            const startIso = startDateObj ? toLocalYMDT(startDateObj) : null;  // Local YYYY-MM-DDTHH:mm:ss
            const endIso = rawEnd ? toLocalYMDT(new Date(rawEnd)) : null;  // Local YYYY-MM-DDTHH:mm:ss
            const date = startIso ? startIso.split('T')[0] : toIsoDate(sd);  // Keep date as YYYY-MM-DD for compatibility
            // Use Vietnam timezone (UTC+7) for date comparison
            const now = new Date();
            const vnNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
            const vnToday = new Date(vnNow.getFullYear(), vnNow.getMonth(), vnNow.getDate()); // start of today in VN time
            // consider "đã khởi hành" when start date is before or on today (VN time)
            const startDate = startIso ? new Date(startIso) : null;
            const startDateOnly = startDate ? new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()) : null;
            const isPast = startDateOnly ? (startDateOnly <= vnToday) : false;
            return {
                date,
                startIso,  // Now local YYYY-MM-DD
                endIso,    // Now local YYYY-MM-DD
                isPast,
                available: (sd.available ?? sd.seats ?? 20),
                price: db.adultPrice ?? db.priceFrom ?? tourDetails.priceFrom,
                status: (sd.available === 0 || sd.seats === 0) ? 'soldout' : (sd.available <= 5 || sd.seats <= 5 ? 'limited' : 'available')
            };
        });
        // derive meals based on start time of first startDate (use local hour)
        const getMealsForHour = (hour: number | null) => {
            if (hour === null || hour === undefined) return null;
            if (hour < 7) return ['Sáng', 'Trưa', 'Tối'];
            if (hour >= 7 && hour < 12) return ['Trưa', 'Tối'];
            if (hour >= 12 && hour < 18) return ['Tối'];
            return [];
        };
        let mealsByStart: string[] | null = null;
        if (startDates && startDates.length) {
            try {
                const raw = startDates[0].$date ?? startDates[0];
                const dt = new Date(raw);
                // use local hour so timezone-aware decision (Vietnam UTC+7 example)
                const hour = isNaN(dt.getTime()) ? null : dt.getHours();
                mealsByStart = getMealsForHour(hour);
            } catch (e) {
                mealsByStart = null;
            }
        }
        // services list normalization + try extract accommodation from services
        const servicesList = Array.isArray(db.services) ? db.services : (db.services ? [db.services] : []);
        const servicesLower = servicesList.map((s: any) => String(s).toLowerCase());
        const svcHotelIdx = servicesLower.findIndex((s: any) => s.includes('khách sạn') || s.includes('khach san') || s.includes('hotel'));
        const svcResortIdx = servicesLower.findIndex((s: any) => s.includes('resort'));
        const serviceAccommodation = svcHotelIdx !== -1 ? servicesList[svcHotelIdx] : (svcResortIdx !== -1 ? servicesList[svcResortIdx] : null);

        // itinerary: ensure each day has meals, accommodation, transport (fallback to tour-level fields)
        // const rawItinerary = db.itinerary && Array.isArray(db.itinerary) ? db.itinerary : tourDetails.itinerary;
        // const itinerary = rawItinerary.map((it: any) => ({
        //     day: it.day ?? it.dayNumber ?? 0,
        //     title: it.title || it.name || '',
        //     activities: it.activities || it.activitiesList || it.schedule || [],
        //     // LẤY description từ BE (có thể là HTML) và strip HTML trước khi dùng
        //     description: stripHtml(it.description || it.address || ''),
        //     meals: it.meals || (db.meals ? (Array.isArray(db.meals) ? db.meals : [db.meals]) : []),
        //     accommodation: it.accommodation || db.hotel || db.accommodation || 'Không',
        //     transport: it.transport || db.transport || 'Xe du lịch'
        // }));
        const rawItinerary = db.itinerary && Array.isArray(db.itinerary) ? db.itinerary : tourDetails.itinerary;
        const itinerary = rawItinerary.map((it: any, idx: number) => {
            const fallbackDay = tourDetails.itinerary?.[idx] || {};
            const mealsFromDb = db.meals ? (Array.isArray(db.meals) ? db.meals : [db.meals]) : null;
            return {
                day: it.day ?? it.dayNumber ?? 0,
                title: it.title || it.name || '',
                activities: it.activities || it.activitiesList || it.schedule || [],
                // LẤY description từ BE (có thể là HTML) và strip HTML trước khi dùng
                description: it.description || it.address || '',
                // ưu tiên meals ở item, rồi meals ở tour-level, rồi sample tourDetails tương ứng ngày,
                // nếu vẫn không có thì suy ra từ giờ khởi hành (mealsByStart)
                meals: it.meals ?? mealsFromDb ?? fallbackDay.meals ?? mealsByStart ?? [],
                // accommodation: ưu tiên item, sau đó tìm trong services (khách sạn > resort), rồi db fields, rồi sample day
                accommodation: it.accommodation ?? serviceAccommodation ?? db.hotel ?? db.accommodation ?? fallbackDay.accommodation ?? 'Không',
                transport: it.transport ?? db.transport ?? fallbackDay.transport ?? 'Xe du lịch'
            };
        });
        return {
            startDates: startDates,
            endDates: endDates,
            id: db._id?.$oid ?? db._id ?? db.id ?? tourDetails.id,
            name: db.name || tourDetails.name,
            departure: db.departureFrom || db.startLocation?.address || db.departure || tourDetails.departure,
            destinations: db.destinations || db.destination ? (Array.isArray(db.destinations) ? db.destinations : [db.destination || db.destinations]) : tourDetails.destinations,
            duration: typeof db.duration === 'number' ? `${db.duration} ngày ${Math.max(0, db.duration - 1)} đêm` : db.duration || tourDetails.duration,
            maxGroup: db.maxGroupSize ?? db.maxGroup ?? tourDetails.maxGroup,
            priceFrom: db.adultPrice ?? db.priceFrom ?? tourDetails.priceFrom,
            // originalPrice: db.originalPrice ?? tourDetails.originalPrice,
            // nếu BE không cung cấp originalPrice thì gợi ý dựa trên priceFrom/adultPrice
            originalPrice: db.originalPrice ?? computeSuggestedOriginal(db.adultPrice ?? db.priceFrom ?? tourDetails.priceFrom) ?? tourDetails.originalPrice,
            rating: db.ratingsAverage ?? db.rating ?? tourDetails.rating,
            reviews: db.ratingsQuantity ?? tourDetails.reviews,
            description: db.description || tourDetails.description,
            images,
            includes: db.includes || db.services || tourDetails.includes,
            excludes: db.excludes || tourDetails.excludes,
            highlights: db.highlights || tourDetails.highlights,
            attractions: db.attractions || tourDetails.attractions,
            availableDates: availableDates.length ? availableDates : tourDetails.availableDates,
            itinerary,
            startLocation: db.startLocation,
            pricing: {
                adult: db.adultPrice ?? tourDetails.pricing.adult,
                child: db.childPrice ?? tourDetails.pricing.child,
                infant: db.infantPrice ?? tourDetails.pricing.infant,
                singleSupplement: db.singleSupplement ?? tourDetails.pricing.singleSupplement,
            },
            // keep policies & reviews from sample for now (BE will provide later)
            policies: db.policies ?? tourDetails.policies,
            reviews1: db.reviews ?? tourDetails.reviews,
        };
    }

    useEffect(() => {
        let mounted = true;
        if (!id) return;
        async function fetchBySlug() {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080'}/api/tours/slug/${id}`);
                if (!res.ok) {
                    console.warn('Tour by slug fetch failed', res.status);
                    return;
                }
                const json = await res.json();
                const db = json.data ?? json.tour ?? json; // tolerate different BE shapes
                if (!db) return;

                const mapped = mapDbTourToClient(db);

                // Merge mapped into sample tourDetails but preserve policies & reviews from sample if BE not ready
                const keepPolicies = tourDetails.policies;
                const keepReviews = tourDetails.reviews;
                Object.assign(tourDetails, mapped);
                // ensure policies/reviews kept when BE doesn't provide
                tourDetails.policies = db.policies ? mapped.policies : keepPolicies;
                tourDetails.reviews = db.reviews ? mapped.reviews : keepReviews;

                if (mounted) setDbLoaded(true); // trigger re-render
            } catch (err) {
                console.error('Fetch tour by slug error', err);
            }
        }
        fetchBySlug();

        return () => { mounted = false; };
    }, [id]);

    const [selectedDate, setSelectedDate] = useState<Date>();
    const [participants, setParticipants] = useState({
        adults: 1,
        children: 0,
        infants: 0,
    });
    const [singleRooms, setSingleRooms] = useState(0);
    const [isLiked, setIsLiked] = useState(false);
    const [activeImage, setActiveImage] = useState(0);
    const [showAllImages, setShowAllImages] = useState(false);
    const [newReview, setNewReview] = useState({
        rating: 5,
        title: '',
        content: ''
    });
    const [showImageModal, setShowImageModal] = useState(false);
    const [modalImageIndex, setModalImageIndex] = useState(0);


    const isLoggedIn = () => {
        return !!localStorage.getItem('accessToken');
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const time = date.toLocaleString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
        });
        return `${time} ${day}/${month}`;
    };

    const getStatusBadge = (status: string, available: number) => {
        switch (status) {
            case 'available':
                return <Badge className="bg-green-100 text-green-800">Còn {available} chỗ</Badge>;
            case 'filling':
                return <Badge className="bg-yellow-100 text-yellow-800">Sắp đầy</Badge>;
            case 'limited':
                return <Badge className="bg-orange-100 text-orange-800">Còn ít chỗ</Badge>;
            case 'soldout':
                return <Badge variant="destructive">Hết chỗ</Badge>;
            default:
                return null;
        }
    };

    const updateParticipantCount = (type: keyof typeof participants, increment: boolean) => {
        const avail = getCurrentAvailable();
        const max = (typeof avail === 'number' && !Number.isNaN(avail)) ? Math.max(0, avail) : Infinity;

        setParticipants(prev => {
            const next = { ...prev };
            if (increment) {
                if (type === 'infants') {
                    // allow at most 1 infant per adult
                    if (prev.infants >= prev.adults) return prev;
                    next.infants = prev.infants + 1;
                    return next;
                }
                // for adults/children check seat-consuming total (infants don't consume seats)
                const seatTotal = prev.adults + prev.children;
                if (seatTotal >= max) return prev; // cannot increase beyond available seats
                next[type] = Math.max(0, prev[type] + 1);
                return next;
            } else {
                // decrement
                if (type === 'adults') {
                    const newAdults = Math.max(1, prev.adults - 1);
                    next.adults = newAdults;
                    // reduce infants if they now exceed adults
                    if (next.infants > newAdults) next.infants = newAdults;
                } else if (type === 'children') {
                    next.children = Math.max(0, prev.children - 1);
                } else if (type === 'infants') {
                    next.infants = Math.max(0, prev.infants - 1);
                }
                return next;
            }
        });
    };

    const updateSingleRooms = (increment: boolean) => {
        // setSingleRooms(prev => Math.max(0, prev + (increment ? 1 : -1)));
        setSingleRooms(prev => {
            const maxRooms = Math.max(1, participants.adults); // đảm bảo >=1
            const next = prev + (increment ? 1 : -1);
            return Math.max(0, Math.min(next, maxRooms));
        });
    };

    const calculateTotal = () => {
        const unitPrices = getUnitPrices();
        const adultTotal = participants.adults * unitPrices.adult;
        const childTotal = participants.children * unitPrices.child;
        const infantTotal = participants.infants * unitPrices.infant;
        const singleSupplementTotal = singleRooms * tourDetails.pricing.singleSupplement;
        return adultTotal + childTotal + infantTotal + singleSupplementTotal;
    };

    // return unit prices (adult uses selected date price if available)
    const getUnitPrices = () => {
        const sel = getSelectedDateInfo();
        return {
            adult: sel?.price ?? tourDetails.pricing.adult,
            child: tourDetails.pricing.child,
            infant: tourDetails.pricing.infant,
        };
    };

    // const getSelectedDateInfo = () => {
    //     if (!selectedDate) return null;
    //     const dateStr = selectedDate.toISOString().split('T')[0];
    //     return tourDetails.availableDates.find(d => d.date === dateStr);
    // };
    const getSelectedDateInfo = () => {
        if (!selectedDate) return null;
        const dateStr = toLocalYMD(selectedDate);
        return tourDetails.availableDates.find(d => d.date === dateStr);
    };
    const totalParticipants = participants.adults + participants.children + participants.infants;
    const [slotInfo, setSlotInfo] = useState<{ dateIso?: string, capacity?: number, reserved?: number, available?: number } | null>(null);

    const [reviews, setReviews] = useState<any[]>([]);

    const fetchReviews = async (productId: string) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080'}/api/reviews/product/${productId}`);
            if (res.ok) {
                const json = await res.json();
                setReviews(json.data || []);
            }
        } catch (e) {
            console.error('Failed to fetch reviews', e);
        }
    };
    useEffect(() => {
        let mounted = true;
        if (!id) return;
        async function fetchBySlug() {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080'}/api/tours/slug/${id}`);
                if (!res.ok) {
                    console.warn('Tour by slug fetch failed', res.status);
                    return;
                }
                const json = await res.json();
                const db = json.data ?? json.tour ?? json; // tolerate different BE shapes
                if (!db) return;

                const mapped = mapDbTourToClient(db);
                // DEBUG: log comparison of each startDate vs current time (ISO, ms, now, isPast)
                if (Array.isArray(mapped.startDates)) {
                    const now = new Date();
                    const vnNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
                    const vnNowString = vnNow.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' });
                    const vnNowMs = vnNow.getTime();
                    console.log('[tour page] startDates comparison start', { vnNowString, vnNowMs });
                    mapped.startDates.forEach((sd: any, i: number) => {
                        const raw = sd.$date ?? sd;
                        const iso = raw ? new Date(raw).toISOString() : null;
                        const ms = iso ? new Date(iso).getTime() : NaN;
                        const isPast = Number.isFinite(ms) ? (ms <= vnNowMs) : null;
                        console.log(`[tour page] startDates[${i}]`, { raw, iso, ms, vnNowMs, isPast });
                    });
                    console.log('[tour page] startDates comparison end');
                }
                else {
                    console.log("fuck");

                }
                // fetch slot info for each start date and merge into mapped.availableDates
                const TOUR_SERVICE = (process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080');
                async function fetchSlotForDate(tourId: string, dateIso: string) {
                    try {
                        const r = await fetch(`${TOUR_SERVICE}/api/tours/${encodeURIComponent(tourId)}/slots/${encodeURIComponent(dateIso)}`);
                        if (!r.ok) return null;
                        const j = await r.json();
                        return j.data?.slot ?? j.slot ?? j;
                    } catch (e) {
                        return null;
                    }
                }

                // collect dates to query (from mapped.availableDates -> .date)
                const tourId = String(mapped.id || id);
                const dates = (mapped.availableDates || []).map((d: any) => d.date).filter(Boolean);
                const slotResults = await Promise.all(dates.map((dt: string) => fetchSlotForDate(tourId, dt)));

                // merge slot info into mapped.availableDates
                mapped.availableDates = (mapped.availableDates || []).map((d: any) => {
                    const slot = slotResults.find((s: any) => s && String(s.dateIso) === String(d.date));
                    if (slot) {
                        // prefer full datetime from DB (d.startIso). If slot.dateIso is only YYYY-MM-DD,
                        // prefer any explicit startIso from BE; if slot.dateIso is YYYY-MM-DD use local start-of-day
                        const startIsoCandidate = d.startIso ?? (slot.dateIso && slot.dateIso.length === 10 ? `${slot.dateIso}T00:00:00` : slot.dateIso) ?? null;
                        let isPast = false;
                        if (startIsoCandidate) {
                            const startMs = Number(new Date(startIsoCandidate).getTime());
                            if (!Number.isNaN(startMs)) {
                                // Use Vietnam timezone (UTC+7) for date comparison
                                const now = new Date();
                                const vnNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
                                const vnToday = new Date(vnNow.getFullYear(), vnNow.getMonth(), vnNow.getDate()); // start of today in VN time
                                const startDate = new Date(startIsoCandidate);
                                const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
                                isPast = startDateOnly <= vnToday;
                            }
                        } else {
                            isPast = !!d.isPast;
                        }
                        console.log('[tour page] merge slot', { dDate: d.date, slotDateIso: slot.dateIso, startIsoCandidate, startMs: startIsoCandidate ? new Date(startIsoCandidate).getTime() : null, now: Date.now(), vnNow: new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }), isPast });
                        return { ...d, startIso: startIsoCandidate, isPast, capacity: slot.capacity ?? d.capacity, reserved: slot.reserved ?? 0, available: (typeof slot.available === 'number' ? slot.available : ((slot.capacity ?? d.capacity) - (slot.reserved ?? 0))) };
                    }
                    return d;
                });

                // set default selectedDate to first available (not soldout) if none chosen
                // if (!selectedDate) {
                //     const firstAvailable = mapped.availableDates.find((x: any) => !x.isPast && ((x.available ?? 0) > 0) && x.status !== 'soldout');
                //     if (firstAvailable) setSelectedDate(new Date(firstAvailable.startIso ?? `${firstAvailable.date}T00:00:00`));
                // }
                if (!selectedDate) {
                    const firstAvailable = mapped.availableDates.find((x: any) => !x.isPast && ((x.available ?? 0) > 0) && x.status !== 'soldout');
                    if (firstAvailable) {
                        // build a local-midnight Date from date part to avoid UTC shift
                        const datePart = (firstAvailable.startIso ?? firstAvailable.date).split('T')[0];
                        const [yy, mm, dd] = datePart.split('-').map((n: string) => Number(n));
                        if (!Number.isNaN(yy) && !Number.isNaN(mm) && !Number.isNaN(dd)) {
                            setSelectedDate(new Date(yy, mm - 1, dd));
                        } else {
                            setSelectedDate(new Date(firstAvailable.date));
                        }
                    }
                }
                // Merge mapped into sample tourDetails but preserve policies & reviews from sample if BE not ready
                const keepPolicies = tourDetails.policies;
                const keepReviews = tourDetails.reviews;
                Object.assign(tourDetails, mapped);
                // ensure policies/reviews kept when BE doesn't provide
                tourDetails.policies = db.policies ? mapped.policies : keepPolicies;
                tourDetails.reviews = db.reviews ? mapped.reviews : keepReviews;

                if (mounted) setDbLoaded(true); // trigger re-render

                // Fetch reviews only if tour data is successfully loaded
                fetchReviews(tourDetails.id);
            } catch (err) {
                console.error('Fetch tour by slug error', err);
            }
        }
        fetchBySlug();




        return () => { mounted = false; };
    }, [id]);

    const overallRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : 0;
    const distribution = [5, 4, 3, 2, 1].map(star => ({ star, count: reviews.filter(r => r.rating === star).length }));
    const getCurrentAvailable = () => {
        // if (slotInfo && typeof slotInfo.available === 'number') return slotInfo.available;
        // const sel = getSelectedDateInfo();
        // return sel?.available ?? null;
        // prefer explicit slotInfo.available (if you set slotInfo elsewhere)
        // prefer explicit slotInfo.available (if you set slotInfo elsewhere)
        const selRaw = (slotInfo && typeof slotInfo.available === 'number') ? slotInfo : getSelectedDateInfo();
        if (!selRaw) return null;
        // narrow/cast to any to handle the two possible shapes returned by BE / local data
        const sel: any = selRaw;
        // prefer backend-provided available
        if (typeof sel.available === 'number') return Math.max(0, sel.available);
        // fallback compute from capacity - reserved (reserved should be sum of confirmed pax)
        const capacity = Number(sel.capacity ?? sel.seats ?? 0) || 0;
        const reserved = Number(sel.reserved ?? 0) || 0;
        if (capacity > 0) return Math.max(0, capacity - reserved);
        return null;
    };
    // format selectedDate as dd/MM/yyyy
    const formatDateShort = (d?: Date | null) => {
        if (!d) return '';
        return d.toLocaleDateString('vi-VN');
    };

    // When selected date or availability changes, ensure participants do not exceed available seats
    useEffect(() => {
        const avail = getCurrentAvailable();
        if (avail == null) return;
        const max = Number(avail);
        setParticipants(prev => {
            // count only seat-consuming pax (adults + children). infants DO NOT consume seat.
            const seatCount = prev.adults + prev.children;
            if (seatCount <= max && prev.infants <= prev.adults) return prev;
            // reduce children first, then adults (preserve at least 1 adult if possible)
            let remain = max;
            const adults = Math.min(prev.adults, Math.max(1, remain));
            remain -= adults;
            const children = Math.min(prev.children, Math.max(0, remain));
            // Ensure infants do not exceed adults (1 infant per adult)
            const infants = Math.min(prev.infants, adults);
            return { adults, children, infants };
        });
    }, [selectedDate, slotInfo, tourDetails.availableDates]);
    return (
        <>
            {/* Breadcrumb */}
            <div className="border-b">
                <div className="container py-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Link prefetch={false} href="/" className="hover:text-primary">Trang chủ</Link>
                        <span>/</span>
                        <Link prefetch={false} href="/tour" className="hover:text-primary">Tour</Link>
                        <span>/</span>
                        <span>Chi tiết tour</span>
                    </div>
                </div>
            </div>
            <div className="container  py-6">
                {/* Back Button */}
                <Button variant="outline" asChild className="w-fit mb-4">
                    <Link prefetch={false} href="/tour">
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Quay lại danh sách tour
                    </Link>
                </Button>
                {/* Tour Header with Enhanced Image Gallery */}
                <Card>
                    <CardContent className="p-0">
                        <div className="grid grid-cols-1">
                            {/* Enhanced Image Gallery */}
                            <div className="relative">
                                <div className="relative h-80 md:h-[480px]">
                                    <img
                                        src={tourDetails.images[activeImage].url}
                                        alt={tourDetails.images[activeImage].title}
                                        className="w-full h-full object-cover cursor-pointer"
                                        onClick={() => { setModalImageIndex(activeImage); setShowImageModal(true); }}
                                    />
                                    {/* Tour Info Overlay */}

                                    {/* Sale badge, like, share, gallery button giữ nguyên */}
                                    <div className="absolute top-4 left-4">
                                        <Badge variant="destructive">Sale 20%</Badge>
                                    </div>
                                    <div className="absolute top-4 right-4 flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => setIsLiked(!isLiked)}
                                        >
                                            <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                                        </Button>
                                        <Button size="sm" variant="secondary">
                                            <Share2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="absolute bottom-4 right-4">
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => setShowAllImages(true)}
                                        >
                                            <ImageIcon className="h-4 w-4 mr-1" />
                                            {tourDetails.images.length} ảnh
                                        </Button>
                                    </div>
                                </div>
                                {/* Image Thumbnails */}
                                <div className="flex gap-2 p-4 overflow-x-auto">
                                    {tourDetails.images.slice(0, 5).map((image, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setActiveImage(index)}
                                            className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 ${activeImage === index ? 'border-primary' : 'border-transparent'}`}
                                        >
                                            <img
                                                src={image.url}
                                                alt={image.title}
                                                className="w-full h-full object-cover"
                                            />
                                            {image.type === 'video' && (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <PlayCircle className="h-4 w-4 text-white" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                    {tourDetails.images.length > 5 && (
                                        <button
                                            onClick={() => setShowAllImages(true)}
                                            className="flex-shrink-0 w-16 h-16 rounded bg-gray-100 flex items-center justify-center text-xs"
                                        >
                                            {tourDetails.images.length - 5}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Tour Info */}
                            <div className="p-6">
                                <h1 className="text-2xl lg:text-3xl font-bold mb-3">{tourDetails.name}</h1>

                                <div className="space-y-3 mb-2">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <MapPin className="h-4 w-4" />
                                        <span>Khởi hành từ  {tourDetails.departure} -  {tourDetails.destinations.map((destination, index) => (
                                            <span key={index}>
                                                {destination}
                                            </span>
                                        ))}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Timer className="h-4 w-4" />
                                        <span>{tourDetails.duration}</span>
                                    </div>
                                    {/* <div className="flex items-center gap-2 text-muted-foreground">
                                        <Users className="h-4 w-4" />
                                        <span>Tối đa {tourDetails.maxGroup} khách</span>
                                    </div> */}
                                </div>

                                <div className="flex items-center gap-3 mb-4">
                                    <div className="flex items-center">
                                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                                        <span className="font-medium">{tourDetails.rating}</span>
                                    </div>
                                    {/* <span className="text-muted-foreground">({tourDetails.reviews1?.comments.length} đánh giá)</span> */}
                                </div>

                                <div className="space-y-2">
                                    {tourDetails.originalPrice && (
                                        <div className="text-lg text-muted-foreground line-through">
                                            {formatPrice(tourDetails.originalPrice)}
                                        </div>
                                    )}
                                    <div className="flex gap-2 text-2xl lg:text-3xl font-bold text-[hsl(var(--primary))]">
                                        Từ {formatPrice(tourDetails.priceFrom)}

                                    </div>
                                    <div className="text-sm text-muted-foreground">Giá cho 1 người lớn</div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="container py-6">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Main Content */}
                    <div className="flex-1 space-y-6">




                        {/* Available Dates Calendar */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Lịch khởi hành & Giá tour1212</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {tourDetails.availableDates.map((dateInfo, index) => {
                                        const isSelected = selectedDate && (dateInfo.date === toLocalYMD(selectedDate));
                                        const seats = Number(dateInfo.available ?? 0);
                                        const isSoldOut = seats <= 0 || dateInfo.status === 'soldout';
                                        return (
                                            <div
                                                key={index}
                                                className={`p-3 rounded-lg cursor-pointer transition-colors relative border ${isSoldOut
                                                    || (dateInfo as any).isPast
                                                    ? 'bg-[hsl(var(--muted))] cursor-not-allowed opacity-60'
                                                    : isSelected
                                                        ? 'border-2 border-[hsl(var(--primary))] bg-primary/10 ring-2 ring-[hsl(var(--primary))]'
                                                        : 'border hover:bg-[hsl(var(--primary))/0.05] hover:border-[hsl(var(--primary))]'
                                                    }`}
                                                onClick={() => {
                                                    if (!isSoldOut && !(dateInfo as any).isPast) {
                                                        const datePart = ((dateInfo as any).startIso ?? dateInfo.date).split('T')[0];
                                                        const [yy, mm, dd] = datePart.split('-').map((n: string) => Number(n));
                                                        if (!Number.isNaN(yy) && !Number.isNaN(mm) && !Number.isNaN(dd)) {
                                                            setSelectedDate(new Date(yy, mm - 1, dd));
                                                        } else {
                                                            setSelectedDate(new Date((dateInfo as any).startIso ?? dateInfo.date));
                                                        }
                                                    }
                                                }}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="text-sm font-medium">{formatDate((dateInfo as any).startIso || dateInfo.date)}</div>
                                                    {isSelected && <CheckCircle className="h-4 w-4 text-[hsl(var(--primary))] ml-2" />}
                                                </div>
                                                <div className="text-xs text-[hsl(var(--primary))] font-semibold">{formatPrice(dateInfo.price)}</div>
                                                <div className="mt-1">
                                                    <div className="flex items-center gap-2">
                                                        {(dateInfo as any).isPast
                                                            ? <Badge variant="destructive">Đã khởi hành</Badge>
                                                            : (isSoldOut
                                                                ? <Badge variant="destructive">Hết chỗ</Badge>
                                                                : getStatusBadge(dateInfo.status, dateInfo.available)
                                                            )
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Tour Overview */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Giới thiệu tour</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div>
                                    <div
                                        className="text-muted-foreground leading-relaxed prose prose-sm max-w-none text-center"
                                        dangerouslySetInnerHTML={{
                                            __html: tourDetails.description.replace(
                                                /<img/g,
                                                '<img style="display: block; margin: 20px auto; max-width: 100%; height: auto;"'
                                            )
                                        }}
                                    />
                                    <style jsx>{`
                                         img {
                                            display: block;
                                            margin: 20px auto;
                                            max-width: 100%;
                                            height: auto;
                                            text-align: center;
                                        }
                                    `}</style>
                                </div>

                                <Separator />

                                {/* <div>
                                    <h3 className="text-lg font-semibold mb-3">Điểm nổi bật (fake data)</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {tourDetails.highlights.map((highlight, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                                <span className="text-sm">{highlight}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div> */}

                                <Separator />

                                {/* Chưa xử lý */}
                                {/* <div>
                                    <h3 className="text-lg font-semibold mb-3">Điểm đến</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {tourDetails.destinations.map((destination, index) => (
                                            <Badge key={index} variant="secondary">
                                                {destination}
                                            </Badge>
                                        ))}
                                    </div>
                                </div> */}
                            </CardContent>
                        </Card>

                        {/* Itinerary */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Lịch trình chi tiết</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Accordion type="multiple" className="w-full">
                                    {tourDetails.itinerary.map((day) => (
                                        <AccordionItem key={day.day} value={`day-${day.day}`}>
                                            <AccordionTrigger>
                                                <div className="text-left">
                                                    <div className="font-semibold">Ngày {day.day}: {day.title}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        Bữa ăn: {day.meals.join(', ')} • Nghỉ: {day.accommodation}
                                                    </div>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <div className="space-y-4">
                                                    {(day as any).description && (
                                                        <div
                                                            className="text-sm text-muted-foreground leading-relaxed prose prose-sm max-w-none"
                                                            dangerouslySetInnerHTML={{
                                                                __html: (day as any).description.replace(
                                                                    /<img/g,
                                                                    '<img style="display: block; margin: 20px auto; max-width: 100%; height: auto;"'
                                                                )
                                                            }}
                                                        />
                                                    )}
                                                    <div>
                                                        <h4 className="font-medium mb-2">Hoạt động</h4>
                                                        <ul className="space-y-1">
                                                            {day.activities.map((activity, index) => (
                                                                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                                                                    <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                                                                    {activity}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                                        <div className="flex items-center gap-2">
                                                            <Utensils className="h-4 w-4 text-orange-500" />
                                                            <span>Bữa ăn: {day.meals.join(', ')}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Hotel className="h-4 w-4 text-blue-500" />
                                                            <span>Nghỉ: {day.accommodation}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Plane className="h-4 w-4 text-green-500" />
                                                            <span>Di chuyển: {day.transport}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            </CardContent>
                        </Card>

                        {/* Attractions */}
                        {/* <Card>
                            <CardHeader>
                                <CardTitle>Các điểm tham quan (fake data chua có db)</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {tourDetails.attractions.map((attraction, index) => (
                                    <Card key={index}>
                                        <CardContent className="p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-semibold">{attraction.name}</h4>
                                                <Badge variant="outline">{attraction.duration}</Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground mb-3">{attraction.description}</p>
                                            <div className="flex flex-wrap gap-1">
                                                {attraction.highlights.map((highlight, idx) => (
                                                    <Badge key={idx} variant="secondary" className="text-xs">
                                                        {highlight}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </CardContent>
                        </Card> */}

                        {/* Included/Excluded */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Dịch vụ bao gồm</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="text-lg font-semibold mb-3 text-[hsl(var(--success))]">Bao gồm</h3>
                                        <div className="space-y-2">
                                            {tourDetails.includes.map((item, index) => (
                                                <div key={index} className="flex items-start gap-2">
                                                    <CheckCircle className="h-4 w-4 text-[hsl(var(--success))] mt-0.5" />
                                                    <span className="text-sm">{item}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-semibold mb-3 text-[hsl(var(--destructive))]">Không bao gồm</h3>
                                        <div className="space-y-2">
                                            {tourDetails.excludes.map((item, index) => (
                                                <div key={index} className="flex items-start gap-2">
                                                    <XCircle className="h-4 w-4 text-[hsl(var(--destructive))] mt-0.5" />
                                                    <span className="text-sm">{item}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Policies */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Chính sách tour</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Cancellation rules */}
                                <div>
                                    <h3 className="text-lg font-semibold mb-3">Chính sách hủy tour</h3>
                                    <div className="space-y-2">
                                        {Object.entries(tourDetails.policies.cancellation).map(([time, fee]) => (
                                            <div key={time} className="flex justify-between p-2 bg-[hsl(var(--muted))] rounded">
                                                <span className="text-sm">{time}</span>
                                                <span className="text-sm font-medium">{fee}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Megatrip specific cancellation */}
                                {tourDetails.policies.megatrip && (
                                    <div>
                                        <h3 className="text-lg font-semibold mb-3">Megatrip hủy do không đủ khách</h3>
                                        <p className="text-sm text-muted-foreground">{tourDetails.policies.megatrip}</p>
                                    </div>
                                )}

                                {/* Reschedule / đổi lịch */}
                                {tourDetails.policies.reschedule && (
                                    <div>
                                        <h3 className="text-lg font-semibold mb-3">Chính sách đổi lịch (chuyển tour)</h3>
                                        <div className="space-y-2">
                                            {Object.entries(tourDetails.policies.reschedule.rules).map(([k, v]) => (
                                                <div key={k} className="flex justify-between p-2 bg-[hsl(var(--muted))] rounded">
                                                    <span className="text-sm">{k}</span>
                                                    <span className="text-sm font-medium">{v}</span>
                                                </div>
                                            ))}
                                        </div>
                                        {tourDetails.policies.reschedule.notes && (
                                            <p className="text-sm text-muted-foreground mt-2">{tourDetails.policies.reschedule.notes}</p>
                                        )}
                                    </div>
                                )}

                                <div>
                                    <h3 className="text-lg font-semibold mb-3">Trẻ em</h3>
                                    <p className="text-sm text-muted-foreground">{tourDetails.policies.children}</p>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold mb-3">Giấy tờ cần thiết</h3>
                                    <p className="text-sm text-muted-foreground">{tourDetails.policies.documents}</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Reviews */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Đánh giá từ khách hàng</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Rating Overview */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <div className="text-center">
                                            <div className="text-4xl font-bold text-primary mb-2">{overallRating}</div>
                                            <div className="flex justify-center mb-2">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        className={`h-5 w-5 ${i < Math.floor(overallRating as any)
                                                            ? 'fill-yellow-400 text-yellow-400'
                                                            : 'text-gray-300'
                                                            }`}
                                                    />
                                                ))}
                                            </div>
                                            <div className="text-sm text-muted-foreground">Dựa trên {reviews.length} đánh giá</div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">

                                        {Object.entries(distribution.reduce((acc: Record<number, number>, d) => ({ ...acc, [d.star]: d.count }), {})).reverse().map(([stars, count]) => (
                                            <div key={stars} className="flex items-center gap-2">
                                                <span className="text-sm w-8">{stars}★</span>
                                                <Progress value={reviews.length > 0 ? (count / reviews.length) * 100 : 0} className="flex-1" />
                                                <span className="text-sm text-muted-foreground w-8">{reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <Separator />

                                {/* Detailed Ratings */}
                                {tourDetails.reviews1.breakdown && (
                                    <div>
                                        <h4 className="font-semibold mb-3">Đánh giá chi tiết</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                            {Object.entries(tourDetails.reviews1.breakdown).map(([category, rating]) => (
                                                <div key={category} className="text-center">
                                                    <div className="font-medium text-primary">{rating}</div>
                                                    <div className="text-xs text-muted-foreground capitalize">{category}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <Separator />

                                {/* Write Review */}
                                <div>
                                    <h4 className="text-sm font-semibold mb-3 italic">Hãy gửi đánh giá của bạn kèm theo phản hồi ở đơn hàng khi đã trải nghiệm nhé !</h4>
                                    {/* <div className="space-y-4">
                                        <div>
                                            <Label className="text-sm font-medium">Đánh giá tổng thể</Label>
                                            <div className="flex gap-1 mt-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => setNewReview(prev => ({ ...prev, rating: i + 1 }))}
                                                    >
                                                        <Star
                                                            className={`h-5 w-5 ${i < newReview.rating
                                                                ? 'fill-yellow-400 text-yellow-400'
                                                                : 'text-gray-300'
                                                                }`}
                                                        />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <Label htmlFor="review-title">Tiêu đề</Label>
                                            <Input
                                                id="review-title"
                                                placeholder="Tóm tắt trải nghiệm của bạn"
                                                value={newReview.title}
                                                onChange={(e) => setNewReview(prev => ({ ...prev, title: e.target.value }))}
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="review-content">Nội dung đánh giá</Label>
                                            <Textarea
                                                id="review-content"
                                                placeholder="Chia sẻ chi tiết về trải nghiệm tour của bạn..."
                                                rows={4}
                                                value={newReview.content}
                                                onChange={(e) => setNewReview(prev => ({ ...prev, content: e.target.value }))}
                                            />
                                        </div>

                                        <Button>
                                            <Send className="h-4 w-4 mr-2" />
                                            Gửi đánh giá
                                        </Button>
                                    </div> */}
                                </div>

                                <Separator />

                                {/* Reviews List */}
                                <div className="space-y-4">
                                    <h4 className="font-semibold">Đánh giá từ khách hàng</h4>
                                    {reviews.map((review) => (
                                        <Card key={review._id}>
                                            <CardContent className="p-4">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-10 w-10">
                                                            <AvatarImage src="" />
                                                            <AvatarFallback>{review.orderId?.customerName?.charAt(0) || 'U'}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium">{review.orderId?.customerName || 'Anonymous'}</span>
                                                                <Badge variant="secondary">Đã trải nghiệm</Badge>
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                Đã gửi • {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* <Button variant="ghost" size="sm">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button> */}
                                                </div>

                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="flex">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star
                                                                key={i}
                                                                className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                                            />
                                                        ))}
                                                    </div>
                                                    <span className="font-medium">Đánh giá</span>
                                                </div>

                                                <p className="text-sm text-muted-foreground mb-3">{review.comment}</p>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar - Booking */}
                    <div className="lg:w-96">
                        <Card className="sticky top-20">
                            <CardHeader>
                                <CardTitle>Đặt tour</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Date Selection */}
                                <div >
                                    <Label className="text-base font-medium block mb-2">Chọn ngày khởi hành</Label>
                                    {/* Không cho click mở popover nữa, chỉ hiển thị ngày đã chọn */}
                                    <div className={cn(
                                        "w-full justify-start text-left font-normal flex items-center border rounded-md px-3 py-2 h-10 bg-white",
                                        !selectedDate && "text-muted-foreground"
                                    )}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {selectedDate ? (
                                            <div className="flex flex-col">
                                                <span className="font-medium">{formatDateShort(selectedDate)}</span>
                                            </div>
                                        ) : (
                                            <span>Chọn ngày</span>
                                        )}
                                    </div>
                                    {selectedDate && getSelectedDateInfo() && (
                                        <div className="  p-2 bg-[hsl(var(--success))/0.1] rounded text-sm">
                                            <div className="flex justify-between">
                                                {/* <span>Còn {getSelectedDateInfo()?.available} chỗ</span> */}
                                                <span>Còn {getCurrentAvailable() ?? getSelectedDateInfo()?.available ?? 0} chỗ</span>
                                                <span className="font-medium">{formatPrice(getSelectedDateInfo()?.price || 0)}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Participants */}
                                <div>
                                    <Label className="text-base font-medium mb-3 block">Số lượng khách</Label>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="font-medium">Người lớn</div>
                                                <div className="text-sm text-muted-foreground">≥ 18 tuổi</div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => updateParticipantCount('adults', false)}
                                                    disabled={participants.adults <= 1}
                                                >
                                                    <Minus className="h-4 w-4" />
                                                </Button>
                                                <span className="w-8 text-center">{participants.adults}</span>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    // onClick={() => updateParticipantCount('adults', true)}
                                                    onClick={() => updateParticipantCount('adults', true)}
                                                    disabled={(participants.adults + participants.children + participants.infants) >= (getCurrentAvailable() ?? Infinity)}
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
                                                    onClick={() => updateParticipantCount('children', false)}
                                                    disabled={participants.children <= 0}
                                                >
                                                    <Minus className="h-4 w-4" />
                                                </Button>
                                                <span className="w-8 text-center">{participants.children}</span>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => updateParticipantCount('children', true)}
                                                    disabled={(participants.adults + participants.children + participants.infants) >= (getCurrentAvailable() ?? Infinity)}
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
                                                    onClick={() => updateParticipantCount('infants', false)}
                                                    disabled={participants.infants <= 0}
                                                >
                                                    <Minus className="h-4 w-4" />
                                                </Button>
                                                <span className="w-8 text-center">{participants.infants}</span>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => updateParticipantCount('infants', true)}
                                                    // disable if infants already equal to adults (infant = adult rule)
                                                    disabled={participants.infants >= participants.adults}

                                                >
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Single Room Supplement */}
                                <div>
                                    <Label className="text-base font-medium   block">Phụ thu phòng đơn</Label>
                                    <div className="text-xs text-muted-foreground mb-2 text-shadow-gray-200">
                                        <i>
                                            Phụ thu phòng đơn dành cho khách đi một mình hoặc có nhu cầu sử dụng phòng đơn. Số phòng đơn ≤ số người lớn.
                                        </i>                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-medium">Số phòng đơn</div>
                                            <div className="text-sm text-muted-foreground">+{formatPrice(tourDetails.pricing.singleSupplement)}/phòng</div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => updateSingleRooms(false)}
                                                disabled={singleRooms <= 0}
                                            >
                                                <Minus className="h-4 w-4" />
                                            </Button>
                                            <span className="w-8 text-center">{singleRooms}</span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => updateSingleRooms(true)}
                                                disabled={singleRooms >= Math.max(1, participants.adults)}
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* Pricing Breakdown */}
                                <div className="space-y-2">
                                    {(() => {
                                        const unit = getUnitPrices();
                                        return (
                                            <>
                                                <div className="flex justify-between">
                                                    <span>Người lớn ({participants.adults} × {formatPrice(unit.adult)})</span>
                                                    <span>{formatPrice(participants.adults * unit.adult)}</span>
                                                </div>

                                                {participants.children > 0 && (
                                                    <div className="flex justify-between">
                                                        <span>Trẻ em ({participants.children} × {formatPrice(unit.child)})</span>
                                                        <span>{formatPrice(participants.children * unit.child)}</span>
                                                    </div>
                                                )}

                                                {participants.infants > 0 && (
                                                    <div className="flex justify-between">
                                                        <span>Em bé ({participants.infants} × {formatPrice(unit.infant)})</span>
                                                        <span>{formatPrice(participants.infants * unit.infant)}</span>
                                                    </div>
                                                )}
                                            </>
                                        );
                                    })()}



                                    {singleRooms > 0 && (
                                        <div className="flex justify-between">
                                            <span>Phụ thu phòng đơn ({singleRooms})</span>
                                            <span>{formatPrice(singleRooms * tourDetails.pricing.singleSupplement)}</span>
                                        </div>
                                    )}

                                    <Separator />

                                    <div className="flex justify-between font-bold text-lg">
                                        <span>Tổng cộng</span>
                                        <span className="text-primary">{formatPrice(calculateTotal())}</span>
                                    </div>

                                    <div className="text-xs text-muted-foreground">
                                        Tổng {totalParticipants} khách • Giá đã bao gồm thuế và phí
                                    </div>
                                </div>

                                <Separator />

                                {/* Important Notes */}
                                <div className="space-y-2">
                                    <div className="flex items-start gap-2">
                                        <AlertCircle className="h-4 w-4 text-[hsl(var(--warning))] mt-0.5" />
                                        <div className="text-xs text-[hsl(var(--muted-foreground))]">Giá tour có thể thay đổi tùy theo ngày khởi hành</div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <Info className="h-4 w-4 text-[hsl(var(--primary))] mt-0.5" />
                                        <div className="text-xs text-[hsl(var(--muted-foreground))]">Tour sẽ được xác nhận sau khi thanh toán</div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="space-y-2 ">
                                    <Button className="w-full" size="lg" disabled={!selectedDate}
                                        onClick={() => {
                                            // Kiểm tra đăng nhập trước
                                            if (!isLoggedIn()) {
                                                toast.info('Bạn chưa đăng nhập. Đang chuyển sang trang đăng nhập...');
                                                // Thêm delay 2.5 giây trước khi chuyển hướng
                                                setTimeout(() => {
                                                    router.push(`/dang-nhap?redirect=${encodeURIComponent(window.location.pathname)}`);
                                                }, 2500); // 2.5 giây
                                                return;
                                            }

                                            if (!selectedDate) return;
                                            const selectedDateInfo = getSelectedDateInfo();
                                            const unit = getUnitPrices();
                                            const basePrice = (participants.adults * unit.adult) + (participants.children * unit.child) + (participants.infants * unit.infant) + (singleRooms * tourDetails.pricing.singleSupplement);
                                            const taxes = Math.round(basePrice * 0.08); // demo: 8% thuế
                                            const addOns = 0; // tour chưa có dịch vụ thêm
                                            const discount = tourDetails.originalPrice ? basePrice - calculateTotal() : 0;
                                            const total = basePrice + taxes + addOns - discount;

                                            // breakdown per passenger type
                                            const passengers: any[] = [];
                                            if (participants.adults > 0) passengers.push({ type: 'adult', qty: participants.adults, unit: unit.adult, total: participants.adults * unit.adult });
                                            if (participants.children > 0) passengers.push({ type: 'child', qty: participants.children, unit: unit.child, total: participants.children * unit.child });
                                            if (participants.infants > 0) passengers.push({ type: 'infant', qty: participants.infants, unit: unit.infant, total: participants.infants * unit.infant });

                                            const params = new URLSearchParams();
                                            params.set('type', 'tour');
                                            params.set('route', tourDetails.name);
                                            params.set('date', selectedDateInfo?.date || '');
                                            params.set('time', '');
                                            params.set('basePrice', String(basePrice));
                                            params.set('taxes', String(taxes));
                                            params.set('addOns', String(addOns));
                                            params.set('discount', String(discount));
                                            params.set('total', String(total));
                                            params.set('adults', String(participants.adults));
                                            params.set('children', String(participants.children));
                                            params.set('infants', String(participants.infants));
                                            // additional requested fields
                                            params.set('unitAdult', String(unit.adult));
                                            params.set('unitChild', String(unit.child));
                                            params.set('unitInfant', String(unit.infant));
                                            params.set('singleRooms', String(singleRooms));
                                            params.set('singleSupplement', String(tourDetails.pricing.singleSupplement));
                                            params.set('breakdown', JSON.stringify(passengers));

                                            // Attach tour code and explicit start/end datetimes so thanh-toan can show them clearly
                                            // tourCode: use db id or fallback to generated id
                                            const tourCode = String(tourDetails.id ?? id ?? '');
                                            params.set('tourCode', tourCode);
                                            const startLocation = tourDetails.startLocation;
                                            params.set('pickupDropoff', startLocation?.pickupDropoff || "");
                                            // prefer exact ISO start/end from availableDates (mapDbTourToClient now saves startIso/endIso)
                                            const startIso = (selectedDateInfo as any)?.startIso ?? (selectedDateInfo?.date ? `${selectedDateInfo.date}T00:00:00` : '');
                                            // Fix: startIso is now local YYYY-MM-DD, so use it directly
                                            params.set('startDateTime', startIso);  // Local YYYY-MM-DD
                                            // prefer exact endIso if present, otherwise compute fallback end-of-day by duration
                                            let endIso = (selectedDateInfo as any)?.endIso ?? '';
                                            if (!endIso) {
                                                try {
                                                    const startDate = new Date(startIso);
                                                    // Assume tour duration is in days, add to start date
                                                    const durationDays = parseInt(tourDetails.duration) || 1;
                                                    const endDate = new Date(startDate);
                                                    endDate.setDate(startDate.getDate() + durationDays - 1); // End on last day
                                                    endIso = toLocalYMD(endDate);  // Local YYYY-MM-DD
                                                } catch (e) {
                                                    endIso = startIso; // Fallback
                                                }
                                            }
                                            params.set('endDateTime', endIso);  // Local YYYY-MM-DD
                                            router.push(`/thanh-toan?${params.toString()}`);
                                        }}>
                                        Đặt tour ngay
                                    </Button>
                                    {/* <Button variant="outline" className="w-full" disabled={!selectedDate}>
                                        <PlusCircle className="h-4 w-4 mr-2" />
                                        Thêm vào giỏ hàng
                                    </Button> */}
                                </div>

                                {/* Contact */}
                                <div className="pt-4 border-t text-center">
                                    <div className="text-sm font-medium mb-1">Cần tư vấn?</div>
                                    <div className="flex items-center justify-center gap-1 text-sm text-primary">
                                        <Phone className="h-3 w-3" />
                                        <span>1900 1234</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div >

            {/* Image Modal */}
            {
                showImageModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setShowImageModal(false)}>
                        <div className="relative max-w-3xl w-full" onClick={e => e.stopPropagation()}>
                            <button className="absolute top-2 right-2 bg-white rounded-full p-1 shadow" onClick={() => setShowImageModal(false)}>
                                <XCircle className="h-6 w-6 text-black" />
                            </button>
                            <img
                                src={tourDetails.images[modalImageIndex].url}
                                alt={tourDetails.images[modalImageIndex].title}
                                className="w-full max-h-[80vh] object-contain rounded"
                            />
                            <div className="text-center text-white mt-2">{tourDetails.images[modalImageIndex].title}</div>
                        </div>
                    </div>
                )
            }
        </>
    );
}
