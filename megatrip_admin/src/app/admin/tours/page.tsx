"use client";
import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, Plus, Edit, Eye, Trash2, Calendar, DollarSign, Users, Star, Upload, RefreshCw, Globe, Settings, Copy, ExternalLink, Save, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Textarea } from "../../components/ui/textarea";
import { Switch } from "../../components/ui/switch";
import { Checkbox } from "../../components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { DataTable, Column } from "../../components/DataTable";
import { ModalForm } from "../../components/ModalForm";
import { ConfirmModal } from "../../components/ConfirmModal";
import { ImageUploader } from "../../components/ImageUploader";
import { RichTextEditor } from "../../components/RichTextEditor";
import { useToast } from "../../components/ui/use-toast";
import dynamic from "next/dynamic";
import { Separator } from "@/app/components/ui/separator";
const JoditEditorWrapper = dynamic(() => import("../../components/JoditEditorWrapper"), { ssr: false });
import { GoogleGenerativeAI } from '@google/generative-ai';
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
interface Tour {
    id: string;
    name: string;
    slug: string;
    description: string;
    departureFrom: string;
    destination: string;
    startDate: string;
    endDate: string;
    startDates?: string[];
    endDates?: string[];
    duration: string;
    difficulty?: "easy" | "medium" | "difficult";
    adultPrice: number;
    childPrice?: number;
    infantPrice?: number;
    maxGroupSize: number;
    seatsBooked: number;
    minBooking: number;
    status: "active" | "hidden" | "draft";
    highlight: boolean;
    isVisible: boolean;
    categoryId: string;
    tags: string[];
    images: string[];
    videoUrl?: string;
    itinerary: Array<{
        dayNumber: number;
        title: string;
        details: string;
    }>;
    // inclusions: string[];
    // exclusions: string[];
    services: string[]; // merged inclusions/exclusions -> services
    pickupPoints: string[];
    startLocation?: {
        type?: string; // "Point"
        address?: string;
        pickupDropoff?: string; // required by BE
    };
    cancellationPolicy?: string;
    ratingsAverage: number;
    ratingsQuantity: number;
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
    createdAt: string;
    updatedAt: string;
    isCompleted: boolean;
}

interface TourFormData {
    name: string;
    slug: string;
    description: string;
    departureFrom: string;
    destination: string;
    startDate: string;
    endDate: string;
    startDates?: string[];
    endDates?: string[];
    duration: string | number;
    difficulty: "easy" | "medium" | "difficult";
    adultPrice: number;
    childPrice: number;
    infantPrice: number;
    maxGroupSize: number;
    minBooking: number;
    categoryId: string;
    tags: string[];
    images: string[];
    videoUrl: string;
    itinerary: Array<{
        day: number;
        address: string;
        description: string;
        image?: string;
    }>;
    // inclusions: string[];
    // exclusions: string[];
    services: string[]; // checkbox list
    // pickupPoints: string[];
    // startLocation for admin input (bind to BE.startLocation)
    startLocation?: {
        type?: string;
        address?: string;
        pickupDropoff?: string;
    };
    cancellationPolicy: string;
    status: "active" | "hidden" | "draft";
    highlight: boolean;
    isVisible: boolean;
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string;
    durationDisplay: string;
    pickupPoints?: string[];
    
}

interface TourFilters {
    visibility: string;
    category: string;
    priceRange?: [number, number];
    dateRange?: [string, string];
}
const durationOptions = [
    { value: 1, label: "1 ngày 0 đêm" },
    { value: 2, label: "2 ngày 1 đêm" },
    { value: 3, label: "3 ngày 2 đêm" },
    { value: 4, label: "4 ngày 3 đêm" },
    { value: 5, label: "5 ngày 4 đêm" },
    { value: 6, label: "6 ngày 5 đêm" },
    { value: 7, label: "7 ngày 6 đêm" },
];
const mockCategories = [
    { id: "cat_001", name: "Tour biển đảo" },
    { id: "cat_002", name: "Tour núi non" },
    { id: "cat_003", name: "Tour thành phố" },
    { id: "cat_004", name: "Tour văn hóa" },
];

// Mock data
const mockTours: Tour[] = [
    // {
    //     id: "tour_001",
    //     name: "Du thuyền Vịnh Hạ Long 3N2Đ",

    //     slug: "du-thuyen-vinh-ha-long-3n2d",
    //     description: "Trải nghiệm du thuyền sang trọng, khám phá các hang động và thưởng thức ẩm thực địa phương.",
    //     departureFrom: "Hà Nội",
    //     destination: "Vịnh Hạ Long",
    //     startDate: "2025-10-01",
    //     endDate: "2025-10-03",
    //     duration: "3 ngày 2 đêm",
    //     adultPrice: 6500000,
    //     childPrice: 4500000,
    //     infantPrice: 1500000,
    //     maxGroupSize: 30,
    //     seatsBooked: 20,
    //     minBooking: 2,
    //     status: "active",
    //     highlight: true,
    //     isVisible: true,
    //     categoryId: "cat_001",
    //     tags: ["du thuyền", "biển đảo", "sang trọng"],
    //     images: [
    //         "https://example.com/images/halong1.jpg",
    //         "https://example.com/images/halong2.jpg",
    //     ],
    //     videoUrl: "https://youtube.com/watch?v=abc123",
    //     itinerary: [
    //         {
    //             dayNumber: 1,
    //             title: "Khởi hành và khám phá hang Sửng Sốt",
    //             details: "Đón khách tại Hà Nội, di chuyển đến Vịnh Hạ Long, tham quan hang Sửng Sốt.",
    //         },
    //         {
    //             dayNumber: 2,
    //             title: "Chèo thuyền kayak và làng chài",
    //             details: "Tham gia chèo thuyền kayak và khám phá làng chài nổi trên vịnh.",
    //         },
    //         {
    //             dayNumber: 3,
    //             title: "Tham quan đảo Titop và trở về",
    //             details: "Thăm đảo Titop, tắm biển và trở về Hà Nội.",
    //         },
    //     ],
    //     services: ["hướng dẫn viên", "resort 4 sao", "xe đưa đón"],
    //     pickupPoints: ["Hà Nội", "Hải Phòng"],
    //     cancellationPolicy: "Hủy trước 7 ngày: hoàn 100%. Hủy trước 3 ngày: hoàn 50%.",
    //     ratingsAverage: 4.8,
    //     ratingsQuantity: 120,
    //     metaTitle: "Du thuyền Vịnh Hạ Long 3N2Đ",
    //     metaDescription: "Trải nghiệm du thuyền 5 sao tại Vịnh Hạ Long với hành trình 3 ngày 2 đêm.",
    //     metaKeywords: "du thuyền, vịnh hạ long, tour biển đảo",
    //     createdAt: "2025-09-01T10:00:00Z",
    //     updatedAt: "2025-09-10T15:30:00Z",
    // }

];
const DEFAULT_CANCELLATION_POLICY = `
        CHÍNH SÁCH ĐẶT TOUR

        1. Thanh toán & đặt cọc
        - Khách đặt tour cần **đặt cọc tối thiểu 30% giá tour hoặc 1.000.000đ/người** (tùy mức nào cao hơn).
        - Phần còn lại thanh toán trước ngày khởi hành 5 ngày.

        2. Hủy tour bởi khách hàng
        - Trước 15 ngày: mất phí 30% tổng giá trị tour.
        - Trước 7 – 14 ngày: mất phí 50%.
        - Trước 3 – 6 ngày: mất phí 70%.
        - Trong 48h trước ngày khởi hành: mất phí 100%.

        3. Chuyển / đổi tour
        - Trước 7 ngày: miễn phí.
        - Trong vòng 7 ngày: tính phí như hủy tour.

        4. Hủy tour bởi công ty
        - Nếu tour **không đủ số lượng khách trước ngày khởi hành 3 ngày** → hoàn tiền 100% cho khách.
        - Nếu tour bị hủy do công ty (khác lý do thiên tai, bất khả kháng) → khách có quyền chọn chuyển tour khác hoặc hoàn tiền 100%.

        5. Trường hợp bất khả kháng
        - Thiên tai, dịch bệnh, khủng bố, biểu tình… có thể ảnh hưởng lịch trình.
        - Công ty sẽ thông báo sớm nhất và đảm bảo quyền lợi tối đa cho khách.

        6. Tranh chấp
        - Các bên ưu tiên thương lượng, hòa giải.
        - Nếu không đạt được thỏa thuận, tranh chấp sẽ được giải quyết theo **pháp luật Việt Nam**.
        `;
const SERVICE_OPTIONS = [
    "hướng dẫn viên",
    "khách sạn 2 sao",
    "khách sạn 3 sao",
    "resort 4 sao",
    "homestay",
    "bảo hiểm du lịch",
    "vé máy bay",
    "xe đưa đón",
    "tàu hỏa",
];
interface Province {
    name: string;
    code: number;
    division_type?: string;
    codename?: string;
    phone_code?: number;
    wards?: any[];
}
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
export default function Tours() {
    const [selectedTours, setSelectedTours] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [filters, setFilters] = useState<TourFilters>({
        visibility: "all",
        category: "all",
    });
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create");
    const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [tourToDelete, setTourToDelete] = useState<Tour | null>(null);
    const [activeTab, setActiveTab] = useState("basic");
    const [formData, setFormData] = useState<TourFormData>({
        name: "",
        slug: "",
        description: "",
        departureFrom: "",
        destination: "",
        startDate: "",
        endDate: "",
        startDates: [],
        endDates: [],
        duration: "",
        difficulty: "easy",
        adultPrice: 0,
        childPrice: 0,
        infantPrice: 0,
        maxGroupSize: 40,
        minBooking: 1,
        categoryId: "",
        tags: [],
        images: [],
        videoUrl: "",
        itinerary: [],
        // inclusions: [],
        // exclusions: [],
        services: [], // new checkbox-backed field
        // pickupPoints: [],
        startLocation: { type: "Point", address: "", pickupDropoff: "" },
        // set default cancellation policy text here
        cancellationPolicy: DEFAULT_CANCELLATION_POLICY,
        status: "draft",
        highlight: false,
        isVisible: true,
        metaTitle: "",
        metaDescription: "",
        metaKeywords: "",
        durationDisplay: "",
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [isFormDirty, setIsFormDirty] = useState(false);
    const [recurrenceMode, setRecurrenceMode] = useState<"single" | "weekly" | "monthly" | "weekday_of_month">("single");
    const [recurrenceWeekday, setRecurrenceWeekday] = useState<number>(1);
    const [recurrenceApplied, setRecurrenceApplied] = useState<boolean>(false);

    const { toast } = useToast();
    const queryClient = useQueryClient();


    const [pagination, setPagination] = useState<any>({
        current: 1,
        pageSize: 10,
    } );

    // new: provinces state + selectedDeparture
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [provincesLoading, setProvincesLoading] = useState(false);
    const [selectedDeparture, setSelectedDeparture] = useState<string>("");

    // load provinces.json from /provinces.json (public)
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setProvincesLoading(true);
                const res = await fetch('/provinces.json');
                if (!res.ok) throw new Error('Không thể tải danh sách tỉnh/thành');
                const data = await res.json();
                if (mounted && Array.isArray(data)) setProvinces(data);
            } catch (err) {
                console.error('Load provinces failed', err);
            } finally {
                if (mounted) setProvincesLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, []);
    // Data    loading state (try real API, fallback to mock)
    const [tours, setTours] = useState<Tour[]>(mockTours);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<any>(null);
    const [originalTour, setOriginalTour] = useState<Tour | null>(null);
    // Thêm state loading cho updateVisibility (nếu chưa có)
    const [updatingVisibility, setUpdatingVisibility] = useState<string | null>(null);
    const [hasBookings, setHasBookings] = useState<boolean>(false);
    const [aiLoading, setAiLoading] = useState<Record<number, boolean>>({}); // Track loading cho từng ngày
    const [aiLoadingDescription, setAiLoadingDescription] = useState(false);
    // Add state for total stats
    const [totalTours, setTotalTours] = useState(0);
    const [totalVisible, setTotalVisible] = useState(0);
    // add compress helpers (insert near top of file after imports)
    async function compressDataUriClient(dataUri: string, maxWidth = 1600, quality = 0.8): Promise<string> {
        return new Promise((resolve) => {
            try {
                const img = new Image() ;
                img.onload = () => {
                    const scale = Math.min(1, maxWidth / img.width);
                    const w = Math.max(1, Math.floor(img.width * scale));
                    const h = Math.max(1, Math.floor(img.height * scale));
                    const canvas = document.createElement("canvas");
                    canvas.width = w;
                    canvas.height = h;
                    const ctx = canvas.getContext("2d");
                    if (!ctx) return resolve(dataUri);
                    ctx.drawImage(img, 0, 0, w, h);
                    const mime = dataUri.match(/^data:(image\/[a-zA-Z]+);base64,/)?.[1] || "image/jpeg";
                    try {
                        const out = canvas.toDataURL(mime, quality);
                        resolve(out);
                    } catch {
                        resolve(dataUri);
                    }
                };
                img.onerror = () => resolve(dataUri);
                img.src = dataUri;
            } catch {
                resolve(dataUri);
            }
        });
    }

    async function compressEmbeddedImagesInHtmlClient(html: string, maxWidth = 1600, quality = 0.8) {
        if (!html || typeof html !== "string") return html;
        const regex = /<img[^>]+src=(["'])(data:[^"'>]+)\1[^>]*>/g;
        const seen = new Map<string, Promise<string>>();
        let m;
        const replacements: Array<Promise<void>> = [];
        while ((m = regex.exec(html)) !== null) {
            const dataUri = m[2];
            if (!dataUri || !dataUri.startsWith("data:")) continue;
            if (!seen.has(dataUri)) {
                seen.set(dataUri, compressDataUriClient(dataUri, maxWidth, quality));
            }
            replacements.push((async () => {
                const compressed = await seen.get(dataUri)!;
                html = html.split(dataUri).join(compressed);
            })());
        }
        await Promise.all(replacements);
        return html;
    }
    // map server tour -> UI Tour
    const mapServerTour = (t: any): Tour => {
        const toLocal = (iso?: string | null) => (iso ? toLocalInput(new Date(iso)) : "");
        const startDatesLocal = Array.isArray(t.startDates) ? t.startDates.map((d: string) => toLocal(d)) : (t.startDate ? [toLocal(t.startDate)] : []);
        const endDatesLocal = Array.isArray(t.endDates) ? t.endDates.map((d: string) => toLocal(d)) : (t.endDate ? [toLocal(t.endDate)] : []);
        const durationDisplay = (startDatesLocal[0] && endDatesLocal[0]) ? calculateDuration(startDatesLocal[0], endDatesLocal[0]) : (typeof t.duration === "number" ? `${t.duration} ngày ${Math.max(0, t.duration - 1)} đêm` : (t.duration || ""));
        const now = new Date();
        const isCompleted = Array.isArray(t.startDates) && t.startDates.length > 0 && t.startDates.every((d: string) => new Date(d) < now);
        return {
            id: t._id || t.id,
            name: t.name || "",
            slug: t.slug || "",
            description: t.description || "",
            departureFrom: t.departureFrom || "",
            destination: t.destination || "",
            startDate: startDatesLocal[0] || toLocal(t.startDate),
            endDate: endDatesLocal[0] || toLocal(t.endDate),
            startDates: startDatesLocal,
            endDates: endDatesLocal,
            duration: durationDisplay,
            difficulty: t.difficulty,
            adultPrice: Number(t.adultPrice || 0),
            childPrice: t.childPrice !== undefined ? Number(t.childPrice) : undefined,
            infantPrice: t.infantPrice !== undefined ? Number(t.infantPrice) : undefined,
            maxGroupSize: Number(t.maxGroupSize || 1),
            seatsBooked: Number(t.seatsBooked || 0),
            minBooking: Number(t.minBooking || 1),
            status: t.status || (t.isVisible ? "active" : "hidden"),
            highlight: Boolean(t.highlight),
            isVisible: Boolean(t.isVisible),
            categoryId: t.categoryId || "",
            tags: Array.isArray(t.tags) ? t.tags : [],
            images: Array.isArray(t.images) ? t.images : [],
            videoUrl: t.videoUrl || "",
            itinerary: Array.isArray(t.itinerary) ? t.itinerary : [],
            services: Array.isArray(t.services) ? t.services : [],
            pickupPoints: Array.isArray(t.pickupPoints) ? t.pickupPoints : [],
            startLocation: t.startLocation || undefined,
            cancellationPolicy: t.cancellationPolicy || "",
            ratingsAverage: Number(t.ratingsAverage || 0),
            ratingsQuantity: Number(t.ratingsQuantity || 0),
            metaTitle: t.metaTitle || "",
            metaDescription: t.metaDescription || "",
            metaKeywords: t.metaKeywords || "",
            createdAt: t.createdAt || t.created_at || new Date().toISOString(),
            updatedAt: t.updatedAt || t.updated_at || new Date().toISOString(),
            isCompleted,
        } as any;
    };


    // Sửa hàm updateVisibility
    const updateVisibility = async (id: string, isVisible: boolean) => {
        setUpdatingVisibility(id); // Set loading
        try {
            const res = await fetch(`${API_BASE}/api/tours/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isVisible }),
            });
            if (!res.ok) throw new Error('Failed to update visibility');

            // Cập nhật local state
            setTours(prev => prev.map(t => t.id === id ? { ...t, isVisible } : t));
            toast({ title: 'Cập nhật trạng thái thành công' });
        } catch (err) {
            toast({ title: 'Lỗi cập nhật trạng thái', variant: 'destructive' });
        } finally {
            setUpdatingVisibility(null); // Clear loading
        }
    };


    useEffect(() => {
        let mounted = true;
        const load = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Build query params for server-side filtering and pagination
                const params = new URLSearchParams({
                    page: pagination.current.toString(),
                    pageSize: pagination.pageSize.toString(),
                });
                if (filters.visibility !== "all") {
                    params.append("visibility", filters.visibility);
                }
                if (filters.category !== "all") {
                    params.append("category", filters.category);
                }
                if (searchQuery.trim()) {
                    params.append("search", searchQuery.trim());
                }
                // admin endpoint returns paginated and filtered tours
                const res = await fetch(`${API_BASE}/api/tours/admin?${params.toString()}`);
                if (!mounted) return;
                if (!res.ok) {
                    console.warn("Fetch /api/tours/admin failed:", res.status);
                    setError({ status: res.status });
                    return;
                }
                const body = await res.json().catch(() => null);
                const data = body?.data || body;
                const total = body?.total || 0;
                if (Array.isArray(data)) {
                    setTours(data.map(mapServerTour));
                    setPagination((prev: any) => ({ ...prev, total }));
                } else {
                    console.info("No tours returned from API");
                    setTours([]);
                    setPagination((prev: any) => ({ ...prev, total: 0 }));
                }
            } catch (err) {
                console.error("Error fetching admin tours:", err);
                setError(err);
            } finally {
                if (mounted) setIsLoading(false);
            }
        };
        load();
        return () => { mounted = false; };
    }, [pagination.current, pagination.pageSize, filters.visibility, filters.category, searchQuery]);

    const filteredTours = tours
        .filter((tour) => {
            // Debug: Log filter visibility (giữ lại để debug)


            if (filters.visibility !== "all") {
                const expected = filters.visibility === "true";
                if (tour.isVisible !== expected) {
                    console.log(`[DEBUG] Tour ${tour.name} filtered out because isVisible ${tour.isVisible} !== ${expected}`);
                    return false;
                }
            }
            if (filters.category !== "all" && tour.categoryId !== filters.category) return false;
            if (searchQuery && !tour.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            return true;
        });

    const toursData = {
        data: tours,  // Use tours directly
        pagination: {
            total: pagination.total,
        },
    };

    const refetch = () => {
        // Trigger re-fetch by updating a dummy state or re-running useEffect
        // Since useEffect depends on pagination, filters, searchQuery, we can force a re-run
        setTours([]); // Temporarily clear to show loading
        // The useEffect will re-run automatically due to dependencies
    };

    const toLocalInput = (d: Date) => {
        const tzOffset = d.getTimezoneOffset() * 60000;
        return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
    };

    // const parseLocalInput = (isoLocal: string) => {
    //     if (!isoLocal) return null;
    //     const [datePart, timePart] = isoLocal.split('T');
    //     if (!datePart) return null;
    //     const [y, m, day] = datePart.split('-').map(Number);
    //     const [hh = 0, mm = 0] = (timePart || '').split(':').map(Number);
    //     return new Date(y, (m || 1) - 1, day || 1, hh || 0, mm || 0, 0, 0);
    // };
    const parseLocalInput = (isoLocal?: string | null): Date | null => {
        if (!isoLocal) return null;
        const parts = isoLocal.split(/[-T:]/).map(p => parseInt(p, 10));
        if (parts.length < 3 || parts.some(isNaN)) return null;
        const [y, m, d, hh = 0, mm = 0, ss = 0] = parts;
        return new Date(y, m - 1, d, hh, mm, ss);
    };

    // returns true if isoLocal (datetime-local string) is strictly in the past compared to now (local)
    const isPastLocal = (isoLocal?: string | null) => {
        if (!isoLocal) return true;
        const dt = parseLocalInput(isoLocal);
        if (!dt) return true;
        const now = new Date();
        return dt.getTime() < now.getTime();
    };

    const localToIso = (localStr?: string | null) => {
        const d = parseLocalInput(localStr);
        return d ? d.toISOString() : null;
    }

    const generateConsecutiveDays = (startIsoLocal: string, daysCount: number) => {
        const start = parseLocalInput(startIsoLocal);
        if (!start) return [];
        const result: string[] = [];
        for (let i = 0; i < daysCount; i++) {
            const dd = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
            const isoLocal = toLocalInput(dd);
            // skip past dates
            if (!isPastLocal(isoLocal)) result.push(isoLocal);
        }
        return result;
    };

    const generateWeekdayInMonth = (startIsoLocal: string, weekday: number) => {
        const start = parseLocalInput(startIsoLocal);
        if (!start) return [];
        const year = start.getFullYear();
        const month = start.getMonth();
        const result: string[] = [];
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let d = 1; d <= daysInMonth; d++) {
            const dt = new Date(year, month, d, start.getHours(), start.getMinutes());
            if (dt.getDay() === weekday && dt.getTime() >= start.getTime()) {
                const isoLocal = toLocalInput(dt);
                // skip past dates
                if (!isPastLocal(isoLocal)) result.push(isoLocal);
            }
        }
        return result;
    };

    const parseDurationToDays = (durationStr?: string | number, startIso?: string, endIso?: string): number => {
        const msPerDay = 24 * 60 * 60 * 1000;
        // Nếu có start và end, tính số ngày = số khoảng 24h (BE convention)
        if (startIso && endIso) {
            const s = parseLocalInput(startIso);
            const e = parseLocalInput(endIso);
            if (s && e && e.getTime() >= s.getTime()) {
                const diffMs = e.getTime() - s.getTime();
                const diffDays = Math.round(diffMs / msPerDay); // số khoảng 24h
                return Math.max(1, diffDays);
            }
        }

        // Nếu duration là số, trả về số ngày
        if (typeof durationStr === "number" && !isNaN(durationStr)) {
            return Math.max(1, Math.floor(durationStr));
        }

        // Nếu duration là chuỗi, parse các định dạng (hiển thị user-facing like "2 ngày 1 đêm")
        if (typeof durationStr === "string" && durationStr.trim()) {
            const vnMatch = durationStr.match(/(\d+)\s*ngày/i);
            if (vnMatch) return Math.max(1, parseInt(vnMatch[1], 10));

            const compactMatch = durationStr.match(/(\d+)\s*[Nn]/);
            if (compactMatch) return Math.max(1, parseInt(compactMatch[1], 10));

            const simpleNum = durationStr.match(/^\s*(\d+)\s*$/);
            if (simpleNum) return Math.max(1, parseInt(simpleNum[1], 10));
        }

        return 1;
    };

    // Đảm bảo itinerary có đúng số ngày; giữ nội dung hiện có nếu có, tạo rỗng nếu cần
    const ensureItineraryLength = (days: number, existing: TourFormData["itinerary"]): TourFormData["itinerary"] => {
        const n = Math.max(0, Math.floor(days));
        const next: TourFormData["itinerary"] = [];
        for (let i = 0; i < n; i++) {
            const existingDay = existing && existing[i];
            if (existingDay) {
                // normalize legacy keys if any (support older data)
                const dayVal = (existingDay as any).day ?? (existingDay as any).dayNumber ?? (i + 1);
                const addressVal = (existingDay as any).address ?? (existingDay as any).title ?? "";
                const descVal = (existingDay as any).description ?? (existingDay as any).details ?? "";
                next.push({ ...existingDay, day: dayVal, address: addressVal, description: descVal });
            } else {
                next.push({ day: i + 1, address: "", description: "" });
            }
        }
        return next;
    };

    // Đổi: thêm helper lấy số ngày mong đợi dựa vào duration hoặc start/end
    const getExpectedItineraryDays = () => {
        const firstStart = (formData.startDates && formData.startDates.length) ? formData.startDates[0] : formData.startDate;
        const firstEnd = (formData.endDates && formData.endDates.length) ? formData.endDates[0] : formData.endDate;
        // parseDurationToDays sẽ trả về 0 nếu không thể xác định
        return parseDurationToDays(formData.duration || undefined, firstStart, firstEnd);
    };

    // const applyRecurrence = () => {
    //     const firstStart = (formData.startDates && formData.startDates.length) ? formData.startDates[0] : formData.startDate;
    //     const firstEnd = (formData.endDates && formData.endDates.length) ? formData.endDates[0] : formData.endDate;

    //     if (!firstStart) {
    //         toast({ title: "Thiếu ngày bắt đầu", description: "Vui lòng chọn ngày khởi hành đầu tiên trước khi áp dụng", variant: "destructive" });
    //         return;
    //     }

    //     let generatedStarts: string[] = [];
    //     if (recurrenceMode === "weekly") {
    //         generatedStarts = generateConsecutiveDays(firstStart, 7);
    //     } else if (recurrenceMode === "monthly") {
    //         generatedStarts = generateConsecutiveDays(firstStart, 30);
    //     } else if (recurrenceMode === "weekday_of_month") {
    //         generatedStarts = generateWeekdayInMonth(firstStart, recurrenceWeekday);
    //     } else {
    //         generatedStarts = Array.isArray(formData.startDates) && formData.startDates.length ? formData.startDates : (formData.startDate ? [formData.startDate] : []);
    //     }

    //     // filter out any generated start dates that are in the past (defensive)
    //     generatedStarts = generatedStarts.filter(s => !isPastLocal(s));

    //     let generatedEnds: string[] = [];
    //     if (firstEnd) {
    //         const startDate = parseLocalInput(firstStart);
    //         const endDate = parseLocalInput(firstEnd);
    //         if (startDate && endDate) {
    //             const deltaMs = endDate.getTime() - startDate.getTime();
    //             for (const dIso of generatedStarts) {
    //                 const d = parseLocalInput(dIso);
    //                 if (d) {
    //                     const end = new Date(d.getTime() + deltaMs);
    //                     // ensure corresponding end is not before its start
    //                     const endLocal = toLocalInput(end);
    //                     if (isPastLocal(endLocal) && end.getTime() < new Date().getTime()) {
    //                         // keep it only if end is not before now — otherwise push empty so validation will catch it
    //                         generatedEnds.push(endLocal);
    //                     } else {
    //                         generatedEnds.push(endLocal);
    //                     }
    //                 } else {
    //                     generatedEnds.push("");
    //                 }
    //             }
    //         } else {
    //             generatedEnds = generatedStarts.map(() => firstEnd);
    //         }
    //     } else {
    //         generatedEnds = [];
    //     }

    //     if (!generatedStarts || generatedStarts.length === 0) {
    //         toast({ title: "Không có ngày nào được tạo", description: "Vui lòng kiểm tra ngày bắt đầu hoặc loại lặp", variant: "destructive" });
    //         setRecurrenceApplied(false);
    //         return;
    //     }

    //     handleFormChange('startDates' as any, generatedStarts);
    //     handleFormChange('startDate' as any, generatedStarts[0]);

    //     if (generatedEnds.length) {
    //         handleFormChange('endDates' as any, generatedEnds);
    //         handleFormChange('endDate' as any, generatedEnds[0]);
    //         setRecurrenceApplied(true);
    //     } else {
    //         setRecurrenceApplied(false);
    //     }

    //     setIsFormDirty(true);
    //     toast({ title: "Đã tạo ngày khởi hành", description: `Tạo ${generatedStarts.length} ngày theo chế độ ${recurrenceMode}` });
    // };


    const applyRecurrence = () => {
        const firstStart = (formData.startDates && formData.startDates.length) ? formData.startDates[0] : formData.startDate;
        const firstEnd = (formData.endDates && formData.endDates.length) ? formData.endDates[0] : formData.endDate;

        if (!firstStart) {
            toast({ title: "Thiếu ngày bắt đầu", description: "Vui lòng chọn ngày khởi hành đầu tiên trước khi áp dụng", variant: "destructive" });
            return;
        }

        // Tạo danh sách startDates theo recurrence mode
        let generatedStarts: string[] = [];
        if (recurrenceMode === "weekly") {
            generatedStarts = generateConsecutiveDays(firstStart, 7);
        } else if (recurrenceMode === "monthly") {
            generatedStarts = generateConsecutiveDays(firstStart, 30);
        } else if (recurrenceMode === "weekday_of_month") {
            generatedStarts = generateWeekdayInMonth(firstStart, recurrenceWeekday);
        } else {
            generatedStarts = Array.isArray(formData.startDates) && formData.startDates.length
                ? formData.startDates
                : (formData.startDate ? [formData.startDate] : []);
        }

        // Lọc các ngày start trong quá khứ
        generatedStarts = generatedStarts.filter(s => !isPastLocal(s));

        if (!generatedStarts || generatedStarts.length === 0) {
            toast({ title: "Không có ngày nào được tạo", description: "Vui lòng kiểm tra ngày bắt đầu hoặc loại lặp", variant: "destructive" });
            setRecurrenceApplied(false);
            return;
        }

        // Tính duration từ firstStart và firstEnd (nếu có), hoặc mặc định "2 ngày 1 đêm" -> duration = 1
        let duration: number;
        if (firstStart && firstEnd) {
            duration = parseDurationToDays(formData.duration, firstStart, firstEnd);
        } else {
            // Mặc định duration = 1 cho "2 ngày 1 đêm" nếu không có endDate
            duration = parseDurationToDays(formData.duration) || 1;
        }

        // Tính endDates dựa trên startDates + duration
        const msPerDay = 24 * 60 * 60 * 1000;
        const generatedEnds: string[] = generatedStarts.map(dIso => {
            const startDate = parseLocalInput(dIso);
            if (startDate) {
                // use the numeric 'duration' computed above (avoid reading formData.duration which may be display string)
                const numericDuration = duration || 1;
                // match BE: end - start === numericDuration * 24h
                const endDate = new Date(startDate.getTime() + numericDuration * msPerDay);
                return toLocalInput(endDate);
            }
            return "";
        });

        // Tạo chuỗi duration hiển thị thân thiện (VD: "2 ngày 1 đêm")
        const displayDuration = firstStart && generatedEnds[0]
            ? calculateDuration(firstStart, generatedEnds[0])
            : `${duration} ngày ${Math.max(0, duration - 1)} đêm`;

        handleFormChange('startDates' as any, generatedStarts);
        handleFormChange('startDate' as any, generatedStarts[0]);
        handleFormChange('endDates' as any, generatedEnds);
        handleFormChange('endDate' as any, generatedEnds[0]);
        // store numeric duration and human-friendly string separately
        handleFormChange('duration' as any, duration);
        handleFormChange('durationDisplay' as any, displayDuration);

        // Đồng bộ itinerary với duration
        const updatedItinerary = ensureItineraryLength(duration, formData.itinerary || []);
        handleFormChange('itinerary', updatedItinerary);

        setRecurrenceApplied(true);
        setIsFormDirty(true);
        toast({
            title: "Đã tạo ngày khởi hành",
            description: `Tạo ${generatedStarts.length} ngày với thời lượng ${displayDuration}`,
        });
    };
    const handleResetSchedule = () => {
        if (!confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch khởi hành và giờ đến? Hành động này sẽ xóa startDates, endDates và giờ tương ứng.")) {
            return;
        }

        setFormData(prev => ({
            ...prev,
            startDates: [],
            endDates: [],
            startDate: "",
            endDate: "",
            duration: ""
        }));

        setFormErrors(prev => {
            const next: Record<string, string> = { ...prev };
            Object.keys(next).forEach(k => {
                if (k === 'startDate' || k === 'endDate' || k.startsWith('startDates_') || k.startsWith('endDates_')) {
                    delete next[k];
                }
            });
            return next;
        });

        setIsFormDirty(true);
        setRecurrenceApplied(false);

        toast({ title: "Đã đặt lại lịch", description: "Lịch khởi hành và giờ đến đã được xóa", variant: "default" });
    };
    // Convert Tour to TourFormData for comparison
    const convertTourToFormData = (tour: Tour): TourFormData => {
        return {
            name: tour.name,
            slug: tour.slug,
            description: tour.description,
            departureFrom: tour.departureFrom,
            destination: tour.destination,
            startDate: tour.startDate,
            endDate: tour.endDate,
            startDates: tour.startDates || [],
            endDates: tour.endDates || [],
            duration: tour.duration,
            difficulty: tour.difficulty || "easy",
            adultPrice: tour.adultPrice,
            childPrice: tour.childPrice ?? 0,
            infantPrice: tour.infantPrice ?? 0,
            maxGroupSize: tour.maxGroupSize,
            minBooking: tour.minBooking,
            categoryId: tour.categoryId,
            tags: tour.tags,
            images: tour.images,
            videoUrl: tour.videoUrl || "",
            itinerary: tour.itinerary.map(it => ({
                day: it.dayNumber,
                address: it.title,
                description: it.details,
                image: undefined,
            })),
            services: tour.services,
            startLocation: tour.startLocation,
            cancellationPolicy: tour.cancellationPolicy || DEFAULT_CANCELLATION_POLICY,
            status: tour.status,
            highlight: tour.highlight,
            isVisible: tour.isVisible,
            metaTitle: tour.metaTitle || "",
            metaDescription: tour.metaDescription || "",
            metaKeywords: tour.metaKeywords || "",
            durationDisplay: typeof tour.duration === "number" ? `${tour.duration} ngày ${Math.max(0, tour.duration - 1)} đêm` : (tour.duration || ""),
        };
    };
    // Normalize payload so it matches BE schema exactly
    function normalizePayloadForBE(data: TourFormData) {
        const msPerDay = 24 * 60 * 60 * 1000;

        const toIsoAuto = (s?: string | null) => {
            if (!s) return null;
            // try parse as local "YYYY-MM-DDTHH:mm" using existing helper
            const p = parseLocalInput(s);
            if (p) {
                p.setHours(p.getHours() + 7); // chuẩn GMT+7
                return p.toISOString();
            }
            const d = new Date(s);
            if (!isNaN(d.getTime())) {
                d.setHours(d.getHours() + 7); // chuẩn GMT+7
                return d.toISOString();
            }
            return null;
        };

        // gather start / end inputs (support single or array UI fields)
        const startsLocal = (data.startDates && data.startDates.length) ? data.startDates.slice() : (data.startDate ? [data.startDate] : []);
        const endsLocal = (data.endDates && data.endDates.length) ? data.endDates.slice() : (data.endDate ? [data.endDate] : []);

        const startDatesIso = startsLocal.map(s => toIsoAuto(s)).filter(Boolean) as string[];
        const endDatesIsoProvided = endsLocal.map(e => toIsoAuto(e)).filter(Boolean) as string[];

        // determine numeric duration (days)
        let numericDuration = 0;
        if (startDatesIso.length && endDatesIsoProvided.length) {
            const s = new Date(startDatesIso[0]);
            const e = new Date(endDatesIsoProvided[0]);
            if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
                numericDuration = Math.max(1, Math.round((e.getTime() - s.getTime()) / msPerDay));
            }
        }

        if (!numericDuration) {
            if (typeof (data.duration as any) === "number" && !isNaN(data.duration as any)) {
                numericDuration = Math.max(1, Math.floor(data.duration as any));
            } else if (typeof data.duration === "string") {
                const m = data.duration.match(/(\d+)/);
                numericDuration = m ? Math.max(1, Number(m[1])) : 0;
            }
        }

        // final fallback to 1 day
        if (!numericDuration) numericDuration = 1;

        // Normalize endDates to exact start + duration*24h (BE requires exact equality)
        const endDatesIso = startDatesIso.map(si => {
            const sDate = new Date(si);
            return new Date(sDate.getTime() + numericDuration * msPerDay).toISOString();
        });

        // map & normalize itinerary: enforce day numbers, trim/pad to numericDuration
        const rawItin = Array.isArray(data.itinerary) ? data.itinerary.slice() : [];
        const normalizedItin: Array<{ day: number; address: string; description: string; image?: string }> = [];
        for (let i = 0; i < numericDuration; i++) {
            const existing = rawItin[i] || rawItin.find((it: any) => (it as any).day === i + 1) || null;
            if (existing) {
                const dayVal = (existing as any).day ?? (existing as any).dayNumber ?? (i + 1);
                normalizedItin.push({
                    day: Number(dayVal) || (i + 1),
                    address: (existing as any).address ?? (existing as any).title ?? "",
                    description: (existing as any).description ?? (existing as any).details ?? "",
                    image: (existing as any).image ?? undefined,
                });
            } else {
                normalizedItin.push({ day: i + 1, address: "", description: "" });
            }
        }

        // price relationships validation
        if (typeof data.childPrice === "number" && typeof data.adultPrice === "number" && data.childPrice > data.adultPrice) {
            throw new Error("childPrice must be <= adultPrice");
        }
        if (typeof data.infantPrice === "number" && typeof data.childPrice === "number" && data.infantPrice > data.childPrice) {
            throw new Error("infantPrice must be <= childPrice");
        }

        // ensure startLocation has pickupDropoff (BE requires it)
        const startLocationPayload = data.startLocation && data.startLocation.pickupDropoff
            ? {
                type: data.startLocation.type ?? "Point",
                address: data.startLocation.address ?? "",
                pickupDropoff: String(data.startLocation.pickupDropoff).trim()
            }
            : {
                type: "Point",
                address: data.startLocation?.address ?? "",
                pickupDropoff: (data.departureFrom ? String(data.departureFrom).trim() : "")
            };

        // Build payload containing ONLY fields expected by BE
        const payload: any = {
            name: String(data.name || "").trim(),
            slug: data.slug || undefined,
            description: (typeof data.description === "string" && data.description.trim()) ? data.description : undefined,
            departureFrom: data.departureFrom || undefined,
            destination: data.destination || undefined,
            adultPrice: Number(data.adultPrice || 0),
            childPrice: typeof data.childPrice === "number" ? Number(data.childPrice) : undefined,
            infantPrice: typeof data.infantPrice === "number" ? Number(data.infantPrice) : undefined,
            duration: Number(numericDuration),
            maxGroupSize: Number(data.maxGroupSize || 1),
            difficulty: data.difficulty || "easy",
            images: Array.isArray(data.images) ? data.images : [],
            services: Array.isArray(data.services) ? data.services : [],
            startLocation: startLocationPayload,
            startDates: startDatesIso,
            endDates: endDatesIso,
            itinerary: normalizedItin,
            isVisible: Boolean(data.isVisible),
            highlight: Boolean(data.highlight),
        };

        // remove undefined keys
        Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);

        return payload;
    }
    // Create tour mutation
    const createTourMutation = useMutation({
        mutationFn: async (payload: any) => {
            // compress embedded images in description & itinerary (client-side)
            try {
                if (payload.description) {
                    payload.description = await compressEmbeddedImagesInHtmlClient(payload.description, 1600, 0.8);
                }
                if (Array.isArray(payload.itinerary)) {
                    for (let i = 0; i < payload.itinerary.length; i++) {
                        const d = payload.itinerary[i];
                        if (d && d.description && typeof d.description === "string" && d.description.startsWith("data:") || /<img[^>]+src=(["'])(data:[^"'>]+)\1/.test(d.description)) {
                            payload.itinerary[i].description = await compressEmbeddedImagesInHtmlClient(d.description, 1600, 0.8);
                        }
                    }
                }
            } catch (err) {
                console.warn("Client-side compression failed:", err);
            }

            console.log('[DEBUG] Sending POST /api/tours with payload:', payload);
            const res = await fetch(`${API_BASE}/api/tours`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                let text;
                try { text = await res.json(); } catch { text = await res.text(); }
                const msg = (text && (text.message || text.error || JSON.stringify(text))) || `Create failed (${res.status})`;
                throw new Error(msg);
            }
            const body = await res.json();
            console.log('[DEBUG] POST /api/tours response:', body);
            return body.data || body;
        },
        onSuccess: (createdTour: any) => {
            // update local UI list (convert numeric duration -> display string)
            const displayDuration = (createdTour.startDates?.[0] && createdTour.endDates?.[0]) ? calculateDuration(
                toLocalInput(new Date(createdTour.startDates[0])),
                toLocalInput(new Date(createdTour.endDates[0]))
            ) : `${createdTour.duration} ngày ${Math.max(0, createdTour.duration - 1)} đêm`;

            const newTour: Tour = {
                ...createdTour,
                id: createdTour._id || createdTour.id || `tour_${Math.random().toString(36).slice(2, 9)}`,
                duration: displayDuration as any,
                seatsBooked: createdTour.seatsBooked ?? 0,
                ratingsAverage: createdTour.ratingsAverage ?? 0,
                ratingsQuantity: createdTour.ratingsQuantity ?? 0,
                createdAt: createdTour.createdAt ?? new Date().toISOString(),
                updatedAt: createdTour.updatedAt ?? new Date().toISOString(),
            } as any;

            // Thêm tour mới và sort lại theo createdAt descending (mới nhất trước)
            setTours(prev => {
                const newList = [...prev, newTour];
                return newList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            });
            queryClient.invalidateQueries({ queryKey: ["tours"] });
            setModalOpen(false);
            resetForm();
            toast({ title: "Tạo tour thành công", description: "Tour mới đã được tạo và lưu" });
        },
        onError: (error: any) => {
            console.error('[DEBUG] createTourMutation error:', error);
            toast({
                title: "Lỗi khi tạo tour",
                description: error?.message || "Lỗi khi gọi API",
                variant: "destructive",
            });
        },
    });



    // Update tour mutation
    const updateTourMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<TourFormData> }) => {
            // compress embedded images in description & itinerary (client-side)
            try {
                if (data.description) {
                    (data as any).description = await compressEmbeddedImagesInHtmlClient(data.description as string, 1600, 0.8);
                }
                if (Array.isArray((data as any).itinerary)) {
                    for (let i = 0; i < (data as any).itinerary.length; i++) {
                        const d = (data as any).itinerary[i];
                        if (d && d.description && typeof d.description === "string" && (d.description.startsWith("data:") || /<img[^>]+src=(["'])(data:[^"'>]+)\1/.test(d.description))) {
                            (data as any).itinerary[i].description = await compressEmbeddedImagesInHtmlClient(d.description, 1600, 0.8);
                        }
                    }
                }
            } catch (err) {
                console.warn("Client-side compression failed:", err);
            }

            console.log("[DEBUG] Sending PUT /api/tours/" + id, data);
            const res = await fetch(`${API_BASE}/api/tours/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                let text;
                try { text = await res.json(); } catch { text = await res.text(); }
                const msg = (text && (text.message || text.error || JSON.stringify(text))) || `Update failed (${res.status})`;
                throw new Error(msg);
            }
            const body = await res.json();
            // return updated tour from server
            return body.data || body;
        },
        onSuccess: (updatedTour: any) => {
            // sync local list with server-updated tour
            const id = updatedTour._id || updatedTour.id;
            setTours((prev) =>
                prev.map((tour) =>
                    tour.id === id ? {
                        ...tour,
                        ...updatedTour,
                        duration: (updatedTour.startDates?.[0] && updatedTour.endDates?.[0]) ? calculateDuration(
                            toLocalInput(new Date(updatedTour.startDates[0])),
                            toLocalInput(new Date(updatedTour.endDates[0]))
                        ) : `${updatedTour.duration} ngày ${Math.max(0, updatedTour.duration - 1)} đêm`,

                        updatedAt: updatedTour.updatedAt ?? new Date().toISOString()
                    } : tour
                )
            );
            queryClient.invalidateQueries({ queryKey: ["tours"] });
            setModalOpen(false);
            resetForm();
            toast({
                title: "Cập nhật tour thành công",
                description: "Thông tin tour đã được cập nhật",
            });
        },
        onError: (error: any) => {
            toast({
                title: "Lỗi khi cập nhật tour",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    // Delete tour mutation
    const deleteTourMutation = useMutation({
        mutationFn: async (id: string) => {
            console.log("[DEBUG] Sending DELETE /api/tours/" + id);
            const res = await fetch(`${API_BASE}/api/tours/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) {
                let text;
                try { text = await res.json(); } catch { text = await res.text(); }
                const msg = (text && (text.message || text.error || JSON.stringify(text))) || `Delete failed (${res.status})`;
                throw new Error(msg);
            }
            const body = await res.json().catch(() => null);
            return { id, body };
        },
        onSuccess: (_result, tourId) => {
            // remove from UI
            setTours((prev) => prev.filter((tour) => tour.id !== tourId));
            queryClient.invalidateQueries({ queryKey: ["tours"] });
            setDeleteModalOpen(false);
            setTourToDelete(null);

            toast({
                title: "Đã xóa tour",
                description: `Tour đã được xóa thành công`,
                action: (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            toast({
                                title: "Khôi phục không khả dụng",
                                description: "Không thể hoàn tác sau khi xóa trên server",
                            });
                        }}
                    >
                        Hoàn tác
                    </Button>
                ),
            });
        },
        onError: (error: any) => {
            toast({
                title: "Lỗi khi xóa tour",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    // Bulk operations mutation
    const bulkActionMutation = useMutation({
        mutationFn: async ({ action, ids }: { action: string; ids: string[] }) => {
            setTours((prev) =>
                prev.map((tour) =>
                    ids.includes(tour.id)
                        ? {
                            ...tour,
                            status:
                                action === "publish" ? "active" : action === "unpublish" ? "hidden" : tour.status,
                        }
                        : tour
                )
            );
            if (action === "delete") {
                setTours((prev) => prev.filter((tour) => !ids.includes(tour.id)));
            }
            return { action, ids };
        },
        onSuccess: (_, { action, ids }) => {
            queryClient.invalidateQueries({ queryKey: ["tours"] });
            setSelectedTours([]);
            const actionText = action === "publish" ? "xuất bản" : action === "unpublish" ? "ẩn" : "xóa";
            toast({
                title: `Thực hiện thành công`,
                description: `Đã ${actionText} ${ids.length} tour`,
            });
        },
        onError: (error: any) => {
            toast({
                title: "Lỗi khi thực hiện thao tác",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const total = tours.length;

    // Form validation
    const validateForm = (data: TourFormData, modalMode: string, originalTour: Tour | null = null): Record<string, string> => {
        const errors: Record<string, string> = {};

        if (!data.name.trim()) {
            errors.name = "Bạn phải nhập tên tour";
        }


        if (!data.description || !data.description.trim()) {
            errors.description = "Bạn phải nhập mô tả chi tiết";
        }
        // if (!data.categoryId) {
        //     errors.categoryId = "Bạn phải chọn danh mục";
        // }

        if (!data.departureFrom.trim()) {
            errors.departureFrom = "Bạn phải nhập điểm khởi hành";
        }
        if (!data.startLocation || !String(data.startLocation.pickupDropoff || "").trim()) {
            errors.pickupDropoff = "Bạn phải nhập điểm đón chính ";
        }

        if (!data.destination.trim()) {
            errors.destination = "Bạn phải nhập điểm đến";
        }
        if (!data.startLocation || !String(data.startLocation.address || "").trim()) {
            errors.startLocationAddress = "Bạn phải nhập địa chỉ điểm đón";
        }

        if (modalMode === "edit" && hasBookings && originalTour) {
            const originalStarts = Array.isArray(originalTour.startDates)
                ? originalTour.startDates.map(date => toLocalInput(new Date(date)))
                : [toLocalInput(new Date(originalTour.startDate))];
            const currentStarts = Array.isArray(data.startDates) ? data.startDates : [data.startDate];
            if (JSON.stringify(originalStarts) !== JSON.stringify(currentStarts)) {
                errors.startDate = "Không thể thay đổi ngày khởi hành vì đã có người đặt chỗ. ";
            }
        }

        // startDates: require at least one, each valid and not in past (chỉ nếu thay đổi)
        const now = new Date();
        if (!Array.isArray(data.startDates) || data.startDates.length === 0) {
            errors.startDate = "Bạn phải chọn ít nhất một ngày bắt đầu";
        } else {
            const seen = new Set<string>();
            for (let i = 0; i < data.startDates.length; i++) {
                const d = data.startDates[i];
                const dt = parseLocalInput(d);
                if (!d || !dt || isNaN(dt.getTime())) {
                    errors[`startDates_${i}`] = `Ngày bắt đầu thứ ${i + 1} không hợp lệ`;
                } else {
                    // Chỉ check ngày quá khứ nếu là create hoặc ngày đã thay đổi
                    let isChanged = modalMode === "create";  // <-- Changed from const to let
                    if (modalMode === "edit" && originalTour) {
                        const originalStarts = Array.isArray(originalTour.startDates)
                            ? originalTour.startDates.map(date => toLocalInput(new Date(date)))
                            : [toLocalInput(new Date(originalTour.startDate))];
                        if (originalStarts[i] !== d) {
                            isChanged = true;  // <-- Now this reassignment works
                        }
                    }
                    if (isChanged && dt.getTime() < now.getTime()) {
                        errors[`startDates_${i}`] = `Ngày bắt đầu thứ ${i + 1} không được ở quá khứ`;
                    }
                    const key = dt.toISOString();
                    if (seen.has(key)) {
                        errors[`startDates_${i}`] = `Ngày bắt đầu trùng lặp`;
                    }
                    seen.add(key);
                }
            }
        }

        if (Array.isArray(data.endDates) && data.endDates.length > 0) {
            for (let i = 0; i < (data.startDates || []).length; i++) {
                const start = data.startDates?.[i];
                const end = data.endDates?.[i];
                const startDt = start ? parseLocalInput(start) : null;
                const endDt = end ? parseLocalInput(end) : null;
                if (!end || !endDt || isNaN(endDt.getTime())) {
                    errors[`endDates_${i}`] = `Ngày kết thúc thứ ${i + 1} không hợp lệ`;
                } else if (start && startDt && !isNaN(startDt.getTime())) {
                    if (endDt.getTime() <= startDt.getTime()) {
                        errors[`endDates_${i}`] = `Ngày kết thúc thứ ${i + 1} phải sau ngày bắt đầu tương ứng`;
                    }
                }
            }
        } else {
            if (!data.endDate) {
                errors.endDate = "Bạn phải chọn ngày kết thúc";
            } else if (isNaN(new Date(data.endDate).getTime())) {
                errors.endDate = "Ngày kết thúc không hợp lệ";
            } else {
                const earliestRaw = Array.isArray(data.startDates) && data.startDates.length ? data.startDates.slice().sort()[0] : (data.startDate ? data.startDate : null);
                const earliest = earliestRaw ? parseLocalInput(earliestRaw) : null;
                const endDt = parseLocalInput(data.endDate);
                if (earliest && endDt && endDt.getTime() <= earliest.getTime()) {
                    errors.endDate = "Ngày kết thúc phải sau ngày bắt đầu (với tất cả ngày khởi hành)";
                }
            }
        }

        if (!data.adultPrice || data.adultPrice <= 0) {
            errors.adultPrice = "Giá người lớn phải là số lớn hơn 0 và không được để trống";
        }

        if (!data.childPrice || data.childPrice <= 0) {
            errors.childPrice = "Giá trẻ em (≥5 tuổi) phải là số lớn hơn 0 và không được để trống";
        }

        if (!data.infantPrice || data.infantPrice <= 0) {
            errors.infantPrice = "Giá em bé (<5 tuổi) phải là số lớn hơn 0 và không được để trống";
        }

        // Giữ nguyên các check so sánh giá
        if (typeof data.childPrice === "number" && typeof data.adultPrice === "number" && data.childPrice > data.adultPrice) {
            errors.childPrice = "Giá trẻ em phải không lớn hơn giá người lớn";
        }
        if (typeof data.infantPrice === "number" && typeof data.childPrice === "number" && data.infantPrice > data.childPrice) {
            errors.infantPrice = "Giá em bé phải không lớn hơn giá trẻ em";
        }

        // if (data.maxGroupSize < 1) {
        //     errors.maxGroupSize = "Số chỗ tối đa phải ít nhất là 1";
        // }

        if (data.minBooking < 1) {
            errors.minBooking = "Số booking tối thiểu phải ít nhất là 1";
        }

        // if (data.images.length === 0) {
        //     errors.images = "Bạn phải tải lên ít nhất 1 hình ảnh";
        // }

        // if (data.videoUrl && !isValidVideoUrl(data.videoUrl)) {
        //     errors.videoUrl = "URL video không hợp lệ (chỉ hỗ trợ YouTube/Vimeo)";
        // }

        return errors;
    };

    useEffect(() => {
        const errors = validateForm(formData, modalMode, originalTour);
        setFormErrors(errors);
    }, [formData, modalMode, originalTour]);
    // Add useEffect to fetch total stats

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Build query params for current filters and search
                const params = new URLSearchParams({
                    page: '1',
                    pageSize: '1',
                });
                if (filters.visibility !== "all") {
                    params.append("visibility", filters.visibility);
                }
                if (filters.category !== "all") {
                    params.append("category", filters.category);
                }
                if (searchQuery.trim()) {
                    params.append("search", searchQuery.trim());
                }
                // Fetch total tours (filtered)
                const resTotal = await fetch(`${API_BASE}/api/tours/admin?${params.toString()}`);
                if (resTotal.ok) {
                    const body = await resTotal.json();
                    setTotalTours(body.total || 0);
                }
                // Fetch total visible tours (filtered + visibility=true)
                params.set("visibility", "true");
                const resVisible = await fetch(`${API_BASE}/api/tours/admin?${params.toString()}`);
                if (resVisible.ok) {
                    const body = await resVisible.json();
                    setTotalVisible(body.total || 0);
                }
            } catch (err) {
                console.error('Error fetching stats:', err);
            }
        };
        fetchStats();
    }, [filters.visibility, filters.category, searchQuery]);

    const isValidVideoUrl = (url: string): boolean => {
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
        const vimeoRegex = /^(https?:\/\/)?(www\.)?vimeo\.com\/.+/;
        return youtubeRegex.test(url) || vimeoRegex.test(url);
    };

    const calculateDuration = (start: string, end: string): string => {
        if (!start || !end) return "";

        const startTime = parseLocalInput(start) || new Date(start);
        const endTime = parseLocalInput(end) || new Date(end);
        const diffMs = endTime.getTime() - startTime.getTime();
        if (diffMs <= 0) return "";

        const msPerDay = 24 * 60 * 60 * 1000;
        const diffDays = Math.round(diffMs / msPerDay); // số khoảng 24h
        const days = Math.max(1, diffDays); // ví dụ diffDays=2 => 2 ngày
        const nights = Math.max(0, diffDays - 1); // nights = days - 1

        return `${days} ngày ${nights} đêm`;
    };


    const isoLocalNow = () => {
        const d = new Date();
        const tzOffset = d.getTimezoneOffset() * 60000;
        return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
    };

    // Thêm hàm lấy ngày mai dưới dạng local string
    const getTomorrowLocal = () => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return toLocalInput(d);
    };

    const resetForm = () => {
        setFormData({
            name: "",
            slug: "",
            description: "",
            departureFrom: "",
            destination: "",
            startDate: "",
            endDate: "",
            startDates: [],
            endDates: [],
            duration: "",
            difficulty: "easy",
            adultPrice: 0,
            childPrice: 0,
            infantPrice: 0,
            maxGroupSize: 40,
            minBooking: 1,
            categoryId: "",
            tags: [],
            images: [],
            videoUrl: "",
            itinerary: [],
            services: [], // ensure services always defined
            pickupPoints: [],
            // restore default cancellation policy on reset
            cancellationPolicy: DEFAULT_CANCELLATION_POLICY,
            status: "draft",
            highlight: false,
            isVisible: true,
            metaTitle: "",
            metaDescription: "",
            metaKeywords: "",
            durationDisplay: "",
        });
        setFormErrors({});
        setIsFormDirty(false);
        setActiveTab("basic");
        setRecurrenceApplied(false);
    };

    const handleFormChange = (field: keyof TourFormData, value: any) => {
        setIsFormDirty(true);

        // compute next state synchronously so we can derive duration/itinerary reliably
        setFormData((prev) => {
            const next: any = { ...prev, [field]: value };

            // Auto-generate slug from name if user types name
            if (field === "name" && value) {
                const slug = value
                    .toLowerCase()
                    .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, "a")
                    .replace(/[èéẹẻẽêềếệểễ]/g, "e")
                    .replace(/[ìíịỉĩ]/g, "i")
                    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, "o")
                    .replace(/[ùúụủũưừứựửữ]/g, "u")
                    .replace(/[ỳýỵỷỹ]/g, "y")
                    .replace(/đ/g, "d")
                    .replace(/[^a-z0-9\s-]/g, "")
                    .replace(/\s+/g, "-")
                    .replace(/-+/g, "-")
                    .trim("-");
                // only auto-set slug if empty or derived from previous title
                if (!prev.slug || prev.slug === "" || prev.slug === (prev.name || "").toLowerCase().replace(/\s+/g, "-")) {
                    next.slug = slug;
                }
            }

            // Determine first start/end after this change
            const firstStart = (next.startDates && next.startDates.length) ? next.startDates[0] : next.startDate;
            const firstEnd = (next.endDates && next.endDates.length) ? next.endDates[0] : next.endDate;

            // If we have both start and end, compute duration and adjust itinerary
            if (firstStart && firstEnd) {
                // compute display string and numeric days separately
                const computedDisplay = calculateDuration(firstStart, firstEnd);
                const days = parseDurationToDays(computedDisplay, firstStart, firstEnd);
                // store numeric duration (days) and human-friendly string separately
                next.duration = days; // numeric days for logic / select
                next.durationDisplay = computedDisplay; // string for UI
                if (days > 0) {
                    next.itinerary = ensureItineraryLength(days, next.itinerary || []);
                }
            } else {
                // if only duration changed explicitly, still allow updating itinerary
                if (field === "duration") {
                    const days = parseDurationToDays(value, firstStart, firstEnd);
                    if (days > 0) {
                        next.itinerary = ensureItineraryLength(days, next.itinerary || []);
                    }
                    // when user changes duration select, value will be numeric days
                    next.duration = typeof value === "number" ? value : days;
                    next.durationDisplay = typeof value === "string" ? String(value) : `${next.duration} ngày ${Math.max(0, next.duration - 1)} đêm`;
                }
            }

            return next;
        });

        // Clear error for this field
        if (formErrors[field]) {
            setFormErrors((prev) => ({ ...prev, [field]: "" }));
        }
    };

    const addItineraryDay = () => {
        const newDay = {
            day: formData.itinerary.length + 1,
            address: "",
            description: "",
        };
        handleFormChange("itinerary", [...formData.itinerary, newDay]);
    };

    const updateItineraryDay = (index: number, field: "address" | "description", value: string) => {
        const updatedItinerary = [...formData.itinerary];
        updatedItinerary[index] = { ...updatedItinerary[index], [field]: value };
        handleFormChange("itinerary", updatedItinerary);
    };

    const removeItineraryDay = (index: number) => {
        const updatedItinerary = formData.itinerary.filter((_, i) => i !== index);
        const renumberedItinerary = updatedItinerary.map((day, i) => ({
            ...day,
            day: i + 1,
        }));
        handleFormChange("itinerary", renumberedItinerary);
    };

    const duplicateItineraryDay = (index: number) => {
        const dayToCopy = formData.itinerary[index];
        const newDay = {
            ...dayToCopy,
            day: formData.itinerary.length + 1,
            address: `${(dayToCopy as any).address || (dayToCopy as any).title || ""} (sao chép)`,
            description: (dayToCopy as any).description || (dayToCopy as any).details || "",
        };
        handleFormChange("itinerary", [...formData.itinerary, newDay]);
    };

    const columns: Column[] = [
        {
            key: "images",
            title: "Ảnh",
            width: "w-16",
            render: (images: string[]) => (
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                    {images.length > 0 ? (
                        <img src={images[0]} alt="Tour" className="w-full h-full object-cover" />
                    ) : (
                        <MapPin className="w-6 h-6 text-gray-400" />
                    )}
                </div>
            ),
        },
        {
            key: "id",
            title: "Mã tour",
            sortable: true,
            render: (value) => <span className="font-mono text-sm">{value}</span>,
        },
        {
            key: "name",
            title: "Tên tour",
            sortable: true,
            filterable: true,
            render: (value, record: Tour) => (
                <div className="max-w-xs">
                    <div className="font-medium truncate">{value}</div>
                    <div className="text-sm text-gray-500">
                        {record.departureFrom} → {record.destination}
                    </div>
                    <div className="text-xs text-gray-400">{record.duration}</div>
                </div>
            ),
        },
        // {
        //     key: "schedule",
        //     title: "Lịch trình",
        //     sortable: true,
        //     render: (_, record: Tour) => (
        //         <div className="text-sm">
        //             <div className="flex items-center">
        //                 <Calendar className="w-3 h-3 mr-1" />
        //                 {new Date(record.startDate).toLocaleDateString("vi-VN")}
        //             </div>
        //             <div className="text-gray-500">
        //                 đến {new Date(record.endDate).toLocaleDateString("vi-VN")}
        //             </div>
        //         </div>
        //     ),
        // },
        {
            key: "priceAdult",
            title: "Giá",
            sortable: true,
            render: (value, record: Tour) => (
                <div className="text-sm">
                    <div className="font-medium flex items-center">
                        <DollarSign className="w-3 h-3 mr-1" />
                        {new Intl.NumberFormat("vi-VN").format(record.adultPrice)} ₫
                    </div>
                    {record.childPrice && (
                        <div className="text-gray-500 text-xs">
                            Trẻ em: {new Intl.NumberFormat("vi-VN").format(record.childPrice)} ₫
                        </div>
                    )}
                    {record.infantPrice && (
                        <div className="text-gray-500 text-xs">
                            Trẻ sơ sinh: {new Intl.NumberFormat("vi-VN").format(record.infantPrice)} ₫
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: "seats",
            title: "Chỗ",
            sortable: true,
            render: (_, record: Tour) => (
                <div className="text-sm">
                    {/* <div className="flex items-center">
                        <Users className="w-3 h-3 mr-1" />
                        {record.seatsBooked}/{record.maxGroupSize}
                    </div> */}
                    <div
                        className={`text-xs ${record.maxGroupSize - record.seatsBooked <= record.maxGroupSize * 0.2
                            ? "text-orange-600"
                            : record.maxGroupSize - record.seatsBooked <= record.maxGroupSize * 0.5
                                ? "text-yellow-600"
                                : "text-green-600"
                            }`}
                    >
                        {record.maxGroupSize - record.seatsBooked} chỗ
                    </div>
                </div>
            ),
        },
        // {
        //     key: "ratingsAverage",
        //     title: "Đánh giá",
        //     sortable: true,
        //     render: (value, record: Tour) => (
        //         <div className="text-sm">
        //             <div className="flex items-center">
        //                 <Star className="w-3 h-3 mr-1 text-yellow-500 fill-current" />
        //                 {value}
        //             </div>
        //             <div className="text-gray-500 text-xs">{record.ratingsQuantity} đánh giá</div>
        //         </div>
        //     ),
        // },
        {
            key: "isVisible",
            title: "Trạng thái",
            sortable: true,
            render: (value: boolean, record: Tour) => {
                if (record.isCompleted && value) {
                    return (
                        <div className="flex items-center space-x-2">
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Hiện Hành</Badge>
                            <Badge className="bg-red-600 text-white font-bold animate-pulse shadow-lg">Tour đã qua</Badge>
                            <Button size="sm"
                                className="bg-red-500 hover:bg-red-600 text-white font-semibold shadow-md hover:shadow-lg transition-all"
                                onClick={() => updateVisibility(record.id, false)}
                                disabled={updatingVisibility === record.id} // Disable khi loading
                            >
                                {updatingVisibility === record.id ? "Đang cập nhật..." : "Cập nhật"}
                            </Button>
                        </div>
                    );
                }
                return (
                    <Badge className={value ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-gray-100 text-gray-800 hover:bg-gray-100"}>
                        {value ? "Hiện Hành" : "Ẩn"}
                    </Badge>
                );
            },
        },
        {
            key: "highlight",
            title: "Nổi bật",
            render: (value: boolean) => (
                value ? <Star className="w-4 h-4 text-yellow-500 fill-current" /> : null
            ),
        },
    ];

    const handleView = (tour: Tour) => {
        setSelectedTour(tour);
        setModalMode("view");
        setModalOpen(true);
    };

    const handleEdit = (tour: Tour) => {
        setSelectedTour(tour);
        setOriginalTour(tour);
        setFormData({
            name: tour.name,
            slug: tour.slug,
            description: tour.description,
            departureFrom: tour.departureFrom,
            destination: tour.destination,
            // convert stored ISO dates into local "YYYY-MM-DDTHH:MM" so datetime-local inputs
            // will enforce both date and time (min/validation) properly
            startDate: tour.startDate ? toLocalInput(new Date(tour.startDate)) : "",
            endDate: tour.endDate ? toLocalInput(new Date(tour.endDate)) : "",
            startDates: Array.isArray(tour.startDates)
                ? tour.startDates.map((d: string) => toLocalInput(new Date(d)))
                : (tour.startDate ? [toLocalInput(new Date(tour.startDate))] : []),
            endDates: Array.isArray(tour.endDates)
                ? tour.endDates.map((d: string) => toLocalInput(new Date(d)))
                : (tour.endDate ? [toLocalInput(new Date(tour.endDate))] : []),
            duration: tour.duration,
            difficulty: (tour as any).difficulty ?? "easy",
            adultPrice: (tour as any).adultPrice ?? (tour as any).priceAdult ?? 0,
            childPrice: (tour as any).childPrice ?? (tour as any).priceChild ?? 0,
            infantPrice: (tour as any).infantPrice ?? (tour as any).priceBaby ?? 0,
            maxGroupSize: (tour as any).maxGroupSize ?? (tour as any).seatsTotal ?? 1,
            minBooking: tour.minBooking,
            categoryId: tour.categoryId,
            tags: tour.tags,
            images: tour.images,
            videoUrl: tour.videoUrl || "",
            // normalize incoming itinerary (support legacy keys)
            itinerary: Array.isArray(tour.itinerary)
                ? tour.itinerary.map((it: any, idx: number) => ({
                    day: it.day ?? it.dayNumber ?? (idx + 1),
                    address: it.address ?? it.title ?? "",
                    description: it.description ?? it.details ?? "",
                    image: it.image,
                }))
                : [],
            services: (tour as any).services ?? [], // new checkbox-backed field
            // pickupPoints: tour.pickupPoints,
            startLocation: tour.startLocation
                ? { type: tour.startLocation.type || "Point", address: tour.startLocation.address || "", pickupDropoff: tour.startLocation.pickupDropoff || "" }
                : { type: "Point", address: "", pickupDropoff: tour.departureFrom || "" },
            cancellationPolicy: tour.cancellationPolicy || "",
            status: tour.status,
            highlight: tour.highlight,
            isVisible: tour.isVisible,
            metaTitle: tour.metaTitle || "",
            metaDescription: tour.metaDescription || "",
            metaKeywords: tour.metaKeywords || "",
            durationDisplay: typeof tour.duration === "number" ? `${tour.duration} ngày ${Math.max(0, tour.duration - 1)} đêm` : (tour.duration || ""),
        });
        setModalMode("edit");
        setModalOpen(true);
        setIsFormDirty(false);

        // Fetch slots để check nếu có bookings
        fetch(`${API_BASE}/api/tours/${tour.id}/slots`)
            .then(res => res.json())
            .then(data => {
                const slots = data?.slots || [];
                const hasAnyBookings = slots.some((slot: any) => (slot.reserved || 0) > 0);
                setHasBookings(hasAnyBookings);
            })
            .catch(err => {
                console.error('Error fetching slots:', err);
                setHasBookings(false); // Mặc định không có bookings nếu lỗi
            });
    };

    const handleDelete = (tour: Tour) => {
        setTourToDelete(tour);
        setDeleteModalOpen(true);
    };

    const handleAdd = () => {
        setSelectedTour(null);
        resetForm();
        setModalMode("create");
        setModalOpen(true);
    };

    // const handleSubmit = () => {
    //     const errors = validateForm(formData);
    //     setFormErrors(errors);

    //     if (Object.keys(errors).length > 0) {
    //         toast({
    //             title: "Lỗi validation",
    //             description: "Vui lòng kiểm tra lại thông tin nhập vào",
    //             variant: "destructive",
    //         });
    //         return;
    //     }

    //     const dataToSend = { ...formData } as any;
    //     const startsRaw = (formData.startDates && formData.startDates.length) ? formData.startDates : (formData.startDate ? [formData.startDate] : []);
    //     dataToSend.startDates = startsRaw.map((s: string) => localToIso(s)).filter(Boolean);

    //     const endsRaw = (formData.endDates && formData.endDates.length) ? formData.endDates : (formData.endDate ? [formData.endDate] : []);
    //     dataToSend.endDates = endsRaw.map((s: string) => localToIso(s)).filter(Boolean);

    //     delete dataToSend.startDate;
    //     delete dataToSend.endDate;

    //     // if (dataToSend.startDates.length && dataToSend.endDates.length) {
    //     //     dataToSend.duration = calculateDuration(dataToSend.startDates[0], dataToSend.endDates[0]);
    //     // }
    //     // send numeric duration (days) to BE while keeping UI formData.duration as human-friendly string
    //     dataToSend.duration = parseDurationToDays(formData.duration, dataToSend.startDates?.[0], dataToSend.endDates?.[0]);
    //     if (modalMode === "create") {
    //         createTourMutation.mutate({ ...dataToSend, status: "active" });
    //     } else if (modalMode === "edit" && selectedTour) {
    //         updateTourMutation.mutate({ id: selectedTour.id, data: dataToSend });
    //     }
    // };

    // ...existing code...
    const handleSubmit = () => {
        console.log("[DEBUG] handleSubmit called, modalMode =", modalMode);
        const errors = validateForm(formData, modalMode, originalTour);
        setFormErrors(errors);
        console.log("[DEBUG] validateForm returned errors:", errors);

        if (Object.keys(errors).length > 0) {
            console.warn("[DEBUG] Validation failed - showing toast and returning", errors);
            const errorMessages = Object.values(errors).filter(Boolean);
            toast({
                title: "Lỗi validation",
                description: errorMessages.length > 0 ? errorMessages.join('; ') : "Vui lòng kiểm tra lại thông tin nhập vào",
                variant: "destructive",
            });
            return;
        }

        const dataToSend = { ...formData } as any;
        const startsRaw = (formData.startDates && formData.startDates.length) ? formData.startDates : (formData.startDate ? [formData.startDate] : []);
        dataToSend.startDates = startsRaw.map((s: string) => localToIso(s)).filter(Boolean);
        const endsRaw = (formData.endDates && formData.endDates.length) ? formData.endDates : (formData.endDate ? [formData.endDate] : []);
        dataToSend.endDates = endsRaw.map((s: string) => localToIso(s)).filter(Boolean);
        delete dataToSend.startDate;
        delete dataToSend.endDate;
        dataToSend.duration = parseDurationToDays(formData.duration, dataToSend.startDates?.[0], dataToSend.endDates?.[0]);

        console.log("[DEBUG] prepared dataToSend (before normalize):", dataToSend);

        // --- DEBUG: normalize payload for BE and log it for inspection ---
        let normalized: any = null;
        try {
            normalized = normalizePayloadForBE(dataToSend);
            console.groupCollapsed("[DEBUG] normalized payload (for BE)");
            console.log(normalized);
            console.trace("[DEBUG] normalizePayloadForBE trace");
            console.groupEnd();
        } catch (err: any) {
            console.error("[DEBUG] Lỗi khi chuẩn hóa payload trước khi gửi:", err?.message || err, err);
            toast({
                title: "Lỗi chuẩn hóa dữ liệu",
                description: err?.message || "Kiểm tra console để biết chi tiết",
                variant: "destructive",
            });
            return;
        }
        // --- END DEBUG ---

        console.debug("[DEBUG] final payload to send (normalized):", normalized);

        let payloadToSend = normalized;
        if (modalMode === "edit" && originalTour) {
            const originalFormData = convertTourToFormData(originalTour);
            const changedFields: any = {};
            for (const key in formData) {
                const k = key as keyof TourFormData;
                if (JSON.stringify(formData[k]) !== JSON.stringify(originalFormData[k])) {
                    changedFields[k] = formData[k];
                }
            }
            // Filter normalized to only include changed keys
            payloadToSend = Object.keys(changedFields).reduce((acc, key) => {
                if (key in normalized) acc[key] = normalized[key];
                return acc;
            }, {} as any);
        }

        // Use normalized payload when mutating so what we log is what we'll actually send
        try {
            if (modalMode === "create") {
                console.log("[DEBUG] calling createTourMutation.mutate");
                createTourMutation.mutate({ ...payloadToSend, status: "active" });
            } else if (modalMode === "edit" && selectedTour) {
                console.log("[DEBUG] calling updateTourMutation.mutate for id:", selectedTour.id);
                updateTourMutation.mutate({ id: selectedTour.id, data: payloadToSend });
            }
        } catch (err) {
            console.error("[DEBUG] Unexpected error while calling mutate:", err);
            toast({
                title: "Lỗi nội bộ",
                description: (err as any)?.message || "Kiểm tra console",
                variant: "destructive",
            });
        }
    };
    // ...existing code...
    const handleSaveDraft = () => {
        if (modalMode === "create") {
            createTourMutation.mutate({ ...formData, status: "draft" });
        } else if (modalMode === "edit" && selectedTour) {
            updateTourMutation.mutate({ id: selectedTour.id, data: { ...formData, status: "draft" } });
        }
    };

    const handlePreview = () => {
        window.open(`/tours/${formData.slug}`, "_blank");
    };

    const confirmDelete = () => {
        if (tourToDelete) {
            if (tourToDelete.seatsBooked > 0) {
                toast({
                    title: "Không thể xóa tour",
                    description: "Tour này có đơn hàng đã thanh toán. Vui lòng ẩn tour thay vì xóa.",
                    variant: "destructive",
                });
                return;
            }
            deleteTourMutation.mutate(tourToDelete.id);
        }
    };

    const bulkActions = [
        {
            label: "Xuất bản",
            action: (keys: string[]) => {
                bulkActionMutation.mutate({ action: "publish", ids: keys });
            },
            icon: <Eye className="w-4 h-4 mr-2" />,
        },
        {
            label: "Ẩn",
            action: (keys: string[]) => {
                bulkActionMutation.mutate({ action: "unpublish", ids: keys });
            },
            icon: <Eye className="w-4 h-4 mr-2" />,
            variant: "secondary" as const,
        },
        // {
        //     label: "Xóa",
        //     action: (keys: string[]) => {
        //         bulkActionMutation.mutate({ action: "delete", ids: keys });
        //     },
        //     icon: <Trash2 className="w-4 h-4 mr-2" />,
        //     variant: "destructive" as const,
        // },
    ];

    const actions = [
        {
            label: "Xem chi tiết",
            action: handleView,
            icon: <Eye className="mr-2 h-4 w-4" />,
        },
        {
            label: "Chỉnh sửa",
            action: handleEdit,
            icon: <Edit className="mr-2 h-4 w-4" />,
        },
        {
            label: "Sao chép",
            action: (tour: Tour) => {
                const duplicatedTour = {
                    ...tour,
                    name: `${tour.name} (sao chép)`,
                    slug: `${tour.slug}-copy`,
                    status: "draft" as const,
                };
                delete (duplicatedTour as any).id;
                setFormData(duplicatedTour as any);
                setModalMode("create");
                setModalOpen(true);
            },
            icon: <Copy className="mr-2 h-4 w-4" />,
        },
        // {
        //     label: "Xóa",
        //     action: handleDelete,
        //     icon: <Trash2 className="mr-2 h-4 w-4" />,
        //     variant: "destructive" as const,
        // },
    ];

    const handleModalClose = () => {
        if (isFormDirty && modalMode !== "view") {
            if (confirm("Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn đóng?")) {
                setModalOpen(false);
                resetForm();
            }
        } else {
            setModalOpen(false);
            resetForm();
        }
    };

    const isSubmitDisabled = () => {
        if (modalMode === "view") return true;
        return createTourMutation.isPending || updateTourMutation.isPending;
    };

    // Thêm query để fetch tour slots khi view mode
    const { data: tourSlotsData, isLoading: slotsLoading } = useQuery({
        queryKey: ['tourSlots', selectedTour?.id],
        queryFn: async () => {
            if (!selectedTour?.id) return null;
            const res = await fetch(`${API_BASE}/api/tours/${selectedTour.id}/slots`);
            if (!res.ok) throw new Error('Failed to fetch tour slots');
            const data = await res.json();
            console.log('tourSlotsData từ API:', data);  // Thêm log này
            return data;
        },
        enabled: modalOpen && modalMode === "view" && !!selectedTour?.id,
    });
    const renderTourForm = () => {
        if (modalMode === "view" && selectedTour) {
            const startArray: string[] = Array.isArray(selectedTour.startDates) && selectedTour.startDates.length
                ? selectedTour.startDates
                : (selectedTour.startDate ? [selectedTour.startDate] : []);
            const endArray: string[] = Array.isArray(selectedTour.endDates) && selectedTour.endDates.length
                ? selectedTour.endDates
                : (selectedTour.endDate ? [selectedTour.endDate] : []);

            return (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold">{selectedTour.name}</h3>
                                <div className="flex items-center mt-2">
                                    <Star className="w-4 h-4 text-yellow-500 fill-current mr-1" />
                                    <span>
                                        {selectedTour.ratingsAverage} ({selectedTour.ratingsQuantity} đánh giá)
                                    </span>
                                </div>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-700">Tuyến</Label>
                                <p className="mt-1">
                                    {selectedTour.departureFrom} → {selectedTour.destination}
                                </p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-700">Thời gian</Label>
                                <p className="mt-1">{selectedTour.duration}</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm font-medium text-gray-700">Giá người lớn</Label>
                                    <p className="mt-1 font-bold text-green-600">
                                        {new Intl.NumberFormat("vi-VN").format(selectedTour.adultPrice)} ₫
                                    </p>
                                </div>
                                {selectedTour.childPrice !== undefined && (
                                    <div>
                                        <Label className="text-sm font-medium text-gray-700">Giá trẻ em (≥5 tuổi)</Label>
                                        <p className="mt-1 font-bold text-green-600">
                                            {new Intl.NumberFormat("vi-VN").format(selectedTour.childPrice || 0)} ₫
                                        </p>
                                    </div>
                                )}
                                {selectedTour.infantPrice !== undefined && (
                                    <div>
                                        <Label className="text-sm font-medium text-gray-700">Giá em bé (&lt;5 tuổi)</Label>
                                        <p className="mt-1 font-bold text-green-600">
                                            {new Intl.NumberFormat("vi-VN").format(selectedTour.infantPrice || 0)} ₫
                                        </p>
                                    </div>
                                )}
                            </div>
                            {/* <div>
                                <Label className="text-sm font-medium text-gray-700">Số chỗ</Label>
                                <p className="mt-1">
                                    {selectedTour.seatsBooked}/{selectedTour.maxGroupSize} đã đặt
                                </p>
                            </div> */}
                        </div>
                    </div>

                    <div>
                        <Label className="text-sm font-medium text-gray-700">Mô tả</Label>
                        <p className="mt-1 text-gray-900">{selectedTour.description}</p>
                    </div>

                    <div className="space-y-4"
                    // style={{ height: '70vh', overflowY: 'auto' }}
                    >
                        <div>
                            <Label className="text-sm font-medium text-gray-700">Lịch trình</Label>
                            <div className="mt-1 space-y-2">
                                {startArray.length ? (
                                    startArray.map((start, i) => {
                                        const end = endArray[i];
                                        const startDate = start ? new Date(start) : null;
                                        const endDate = end ? new Date(end) : null;
                                        const duration = (start && end) ? calculateDuration(start, end) : (selectedTour.duration || "");

                                        // Tìm slot cho ngày này
                                        const dateIso = startDate ? startDate.toISOString().split('T')[0] : null;
                                        const slotEntry = tourSlotsData?.slots?.find((d: any) => d.dateIso === dateIso);
                                        const slotsAvailable = slotEntry ? slotEntry.capacity - (slotEntry.reserved || 0) : selectedTour.maxGroupSize - (selectedTour.seatsBooked || 0);
                                        const slotsTotal = slotEntry ? slotEntry.capacity : selectedTour.maxGroupSize;

                                        return (
                                            <div key={i} className="bg-gray-50 p-3 rounded">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="text-sm text-gray-500">Chuyến #{i + 1}</div>
                                                        <div className="font-medium">
                                                            Bắt đầu : {startDate ? startDate.toLocaleDateString('vi-VN') : '---'}{" "}
                                                            <span className="text-gray-600">•</span>{" "}
                                                            <span className="font-mono">{startDate ? startDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '---'}</span>
                                                        </div>
                                                        <div className="text-sm text-gray-500 mt-1">
                                                            Kết thúc : {endDate ? `${endDate.toLocaleDateString('vi-VN')} • ${endDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}` : 'Kết thúc chưa được đặt'}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-sm text-gray-500">Thời gian</div>
                                                        <div className="font-medium">{duration || '—'}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-sm text-gray-500">Số slot</div>
                                                        <div className="font-medium">{slotsAvailable} / {slotsTotal}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-sm text-gray-600">Không có lịch trình</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* <div>
                        <Label className="text-sm font-medium text-gray-700">Lịch trình chi tiết</Label>
                        <div className="mt-2 space-y-3">
                            {selectedTour.itinerary.map((day, index) => (
                                <div key={index} className="border rounded-lg p-3">
                                    <h4 className="font-medium">
                                        Ngày {day.dayNumber}: {day.title}
                                    </h4>
                                    <p className="mt-1 text-sm text-gray-600">{day.details}</p>
                                </div>
                            ))}
                        </div>
                    </div> */}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="text-sm font-medium text-gray-700">Dịch vụ</Label>
                            <ul className="mt-1 text-sm list-disc list-inside">
                                {selectedTour.services && selectedTour.services.length ? (
                                    selectedTour.services.map((item, index) => (
                                        <li key={index} className="text-green-600">
                                            {item}
                                        </li>
                                    ))
                                ) : (
                                    <li className="text-gray-500">Không có dịch vụ nào được chọn</li>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="basic">Thông tin cơ bản</TabsTrigger>
                    <TabsTrigger value="pricing">Giá & Chỗ</TabsTrigger>
                    <TabsTrigger value="itinerary">Lịch trình</TabsTrigger>
                    <TabsTrigger value="media">Media</TabsTrigger>
                    {/* <TabsTrigger value="seo">SEO</TabsTrigger> */}
                    <TabsTrigger value="settings">Cài đặt</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4 mt-6">
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <Label htmlFor="name">Tên tour *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => handleFormChange("name", e.target.value)}
                                placeholder="Du thuyền Vịnh Hạ Long 3N2Đ"
                                className={formErrors.name ? "border-red-500" : ""}
                            />
                            {formErrors.name && (
                                <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>
                            )}
                        </div>

                    </div>
                    <div className="space-y-4 mb-10">
                        <div className="flex justify-between items-center">
                            <Label className="text-xl font-semibold text-gray-900" htmlFor="description">Mô tả chi tiết</Label>
                            {/* Nút tạo gợi ý AI, chỉ hiện khi đã chọn điểm khởi hành, điểm đến, và thời lượng */}
                            {/* {formData.departureFrom && formData.destination  && ( */}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={async () => {
                                        setAiLoadingDescription(true);
                                        try {
                                            const durationText = formData.durationDisplay || `${formData.duration} ngày ${Math.max(0, (formData.duration as number) - 1)} đêm`;
                                            const prompt = `Bạn là trợ lý du lịch chuyên nghiệp. Tạo mô tả chi tiết, hấp dẫn cho tour du lịch từ ${formData.departureFrom} đến ${formData.destination}, thời lượng ${durationText}.

Yêu cầu:
- Giới thiệu về chuyến đi, điểm nổi bật ở điểm khởi hành, điểm đến, và trên đường đi.
- Mô tả danh lam thắng cảnh, vẻ đẹp tự nhiên, văn hóa, ẩm thực đặc trưng.
- Khoảng 300-500 từ, tự nhiên, dùng emoji phù hợp.
- Lý do nên đi tour này, nhưng không đề cập đến lịch trình cụ thể.

Trả về mô tả trực tiếp, không cần format đặc biệt.`;

                                            const result = await model.generateContent(prompt);
                                            const aiDescription = result.response.text();
                                            handleFormChange("description", aiDescription); // Set vào description
                                            toast({ title: "Đã tạo gợi ý", description: "Mô tả đã được cập nhật từ AI" });
                                        } catch (error) {
                                            console.error('AI generate error:', error);
                                            toast({ title: "Lỗi tạo gợi ý", description: "Không thể tạo mô tả từ AI, vui lòng thử lại", variant: "destructive" });
                                        } finally {
                                            setAiLoadingDescription(false);
                                        }
                                    }}
                                disabled={aiLoadingDescription || !(formData.departureFrom && formData.destination )}
                                >
                                    {aiLoadingDescription ? "Đang tạo..." : "Tạo gợi ý AI"}
                                </Button>
                            {/* )} */}
                        </div>
                        <JoditEditorWrapper
                            value={formData.description}
                            onChange={(newContent) => handleFormChange("description", newContent)}
                            placeholder="Mô tả chi tiết tour ..."
                        />
                        {formErrors.description && (
                            <p className="text-sm text-red-500 mt-1">{formErrors.description}</p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="slug">Slug</Label>
                        <Input
                            id="slug"
                            value={formData.slug}
                            onChange={(e) => handleFormChange("slug", e.target.value)}
                            placeholder="du-thuyen-vinh-ha-long-3n2d"
                        />
                        <p className="text-xs text-gray-500 mt-1">Nếu để trống sẽ tự động tạo từ tiêu đề</p>
                    </div>



                    {/* <div>
                        <Label htmlFor="categoryId">Danh mục *</Label>
                        <Select
                            value={formData.categoryId}
                            onValueChange={(value) => handleFormChange("categoryId", value)}
                        >
                            <SelectTrigger className={formErrors.categoryId ? "border-red-500" : ""}>
                                <SelectValue placeholder="Chọn danh mục" />
                            </SelectTrigger>
                            <SelectContent>
                                {mockCategories.map((category) => (
                                    <SelectItem key={category.id} value={category.id}>
                                        {category.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {formErrors.categoryId && (
                            <p className="text-sm text-red-500 mt-1">{formErrors.categoryId}</p>
                        )}
                    </div> */}

                    {/* <div>
                        <Label htmlFor="tags">Tags</Label>
                        <Input
                            id="tags"
                            value={formData.tags.join(", ")}
                            onChange={(e) =>
                                handleFormChange(
                                    "tags",
                                    e.target.value
                                        .split(",")
                                        .map((tag) => tag.trim())
                                        .filter(Boolean)
                                )
                            }
                            placeholder="thiên nhiên, du thuyền, gia đình"
                        />
                    </div> */}
                </TabsContent>

                <TabsContent value="pricing" className="space-y-4 mt-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="departureFrom">Điểm khởi hành *</Label>
                            <Select
                                value={formData.departureFrom || ""}
                                onValueChange={(value) => {
                                    handleFormChange("departureFrom", value);
                                    setSelectedDeparture(value);
                                    // if destination equals new departure, clear destination
                                    if (formData.destination === value) handleFormChange("destination", "");
                                }}
                            >
                                <SelectTrigger className={formErrors.departureFrom ? "border-red-500" : ""}>
                                    <SelectValue placeholder={provincesLoading ? "Đang tải..." : "Chọn điểm khởi hành"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {provincesLoading ? (
                                        <SelectItem value="">{/* loading placeholder */}Đang tải ...</SelectItem>
                                    ) : (
                                        provinces.map((p) => (
                                            <SelectItem key={String(p.code)} value={p.name}>
                                                {p.name}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                            {formErrors.departureFrom && (
                                <p className="text-sm text-red-500 mt-1">{formErrors.departureFrom}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="destination">Điểm đến *</Label>
                            <Select
                                value={formData.destination || ""}
                                onValueChange={(value) => handleFormChange("destination", value)}
                            >
                                <SelectTrigger className={formErrors.destination ? "border-red-500" : ""}>
                                    <SelectValue placeholder={provincesLoading ? "Đang tải..." : "Chọn điểm đến"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {provincesLoading ? (
                                        <SelectItem value="">{/* loading */}Đang tải ...</SelectItem>
                                    ) : (
                                        provinces
                                            .filter((p) => p.name !== selectedDeparture)
                                            .map((p) => (
                                                <SelectItem key={String(p.code)} value={p.name}>
                                                    {p.name}
                                                </SelectItem>
                                            ))
                                    )}
                                </SelectContent>
                            </Select>
                            {formErrors.destination && (
                                <p className="text-sm text-red-500 mt-1">{formErrors.destination}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                            <Label>Lịch khởi hành *</Label>

                            {/* Thêm thông báo nếu disabled */}
                            {hasBookings && modalMode === "edit" && (
                                <div className="text-sm text-red-500 mt-1">
                                    Không thể thay đổi ngày khởi hành vì đã có người đặt chỗ.
                                </div>
                            )}

                            <div className="flex items-center space-x-2 mb-2">
                                <Select
                                    value={recurrenceMode}
                                    onValueChange={(v) => setRecurrenceMode(v as any)}
                                    disabled={hasBookings && modalMode === "edit"} // Disable nếu có bookings
                                >
                                    <SelectTrigger className="flex-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="single">Chỉ ngày được chọn</SelectItem>
                                        <SelectItem value="weekly">Tạo theo 1 tuần (7 ngày liên tiếp)</SelectItem>
                                        <SelectItem value="monthly">Tạo theo 1 tháng (30 ngày liên tiếp)</SelectItem>
                                        <SelectItem value="weekday_of_month">Chọn 1 ngày trong mỗi tuần của tháng</SelectItem>
                                    </SelectContent>
                                </Select>

                                {recurrenceMode === "weekday_of_month" && (
                                    <Select
                                        value={String(recurrenceWeekday)}
                                        onValueChange={(v) => setRecurrenceWeekday(parseInt(v, 10))}
                                        disabled={hasBookings && modalMode === "edit"} // Disable nếu có bookings
                                    >
                                        <SelectTrigger className="w-40">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">Thứ 2</SelectItem>
                                            <SelectItem value="2">Thứ 3</SelectItem>
                                            <SelectItem value="3">Thứ 4</SelectItem>
                                            <SelectItem value="4">Thứ 5</SelectItem>
                                            <SelectItem value="5">Thứ 6</SelectItem>
                                            <SelectItem value="6">Thứ 7</SelectItem>
                                            <SelectItem value="0">Chủ nhật</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}

                                <div className="flex items-center space-x-2">
                                    <Button
                                        onClick={applyRecurrence}
                                        disabled={hasBookings && modalMode === "edit"} // Disable nếu có bookings
                                    >
                                        Áp dụng
                                    </Button>
                                    {recurrenceApplied && (
                                        <Button
                                            onClick={handleResetSchedule}
                                            className="bg-primary-100 text-red-600 hover:bg-red-100 hover:text-red-700 flex items-center gap-1 text-1 text-sm"
                                            disabled={hasBookings && modalMode === "edit"} // Disable nếu có bookings
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-4 w-4"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M6 18L18 6M6 6l12 12"
                                                />
                                            </svg>
                                            Clear
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <div className="mt-2 space-y-2">
                                {(formData.startDates && formData.startDates.length ? formData.startDates : [formData.startDate || ""]).map((d, idx) => {
                                    const endVal = (formData.endDates && formData.endDates[idx]) || "";
                                    return (
                                        <div key={idx} className="flex items-center space-x-2">
                                            <div className="flex-1">
                                                <Label className="text-xs">Bắt đầu #{idx + 1}</Label>
                                                <Input
                                                    type="datetime-local"
                                                    value={d || ""}
                                                    onChange={(e) => {
                                                        const msPerDay = 24 * 60 * 60 * 1000;
                                                        const val = e.target.value;
                                                        const starts = Array.isArray(formData.startDates) ? formData.startDates.slice() : [];
                                                        if (idx >= starts.length) starts.push(val); else starts[idx] = val;
                                                        handleFormChange('startDates' as any, starts);
                                                        if (idx === 0) handleFormChange('startDate', val);

                                                        const ends = Array.isArray(formData.endDates) ? formData.endDates.slice() : [];

                                                        // compute numericDuration consistently
                                                        const firstStartCand = (formData.startDates && formData.startDates[0]) || formData.startDate;
                                                        const firstEndCand = (formData.endDates && formData.endDates[0]) || formData.endDate;
                                                        const numericDuration = parseDurationToDays(formData.duration, firstStartCand, firstEndCand) || 1;

                                                        const thisStart = parseLocalInput(val);
                                                        if (thisStart) {
                                                            const defaultEndLocal = toLocalInput(new Date(thisStart.getTime() + numericDuration * msPerDay));
                                                            ends[idx] = defaultEndLocal;
                                                            handleFormChange('endDates' as any, ends);
                                                            if (idx === 0) handleFormChange('endDate', ends[0] || "");
                                                        }
                                                    }}
                                                    min={getTomorrowLocal()}
                                                    className={`w-full ${formErrors[`startDates_${idx}`] ? "border-red-500" : ""}`}
                                                    disabled={hasBookings && modalMode === "edit"} // Disable nếu có bookings
                                                />
                                            </div>

                                            <div className="flex-1">
                                                <Label className="text-xs">Kết thúc #{idx + 1}</Label>
                                                <Input
                                                    type="datetime-local"
                                                    value={endVal || ""}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        const ends = Array.isArray(formData.endDates) ? formData.endDates.slice() : [];
                                                        if (idx >= ends.length) ends.push(val); else ends[idx] = val;
                                                        handleFormChange('endDates' as any, ends);
                                                        if (idx === 0) handleFormChange('endDate', val);

                                                        const firstStart = (formData.startDates && formData.startDates.length) ? formData.startDates[0] : formData.startDate;
                                                        const firstEnd = (ends && ends.length) ? ends[0] : formData.endDate;
                                                        if (firstStart && firstEnd) {
                                                            const duration = calculateDuration(firstStart, firstEnd);
                                                            if (duration) handleFormChange('duration', duration);
                                                        }
                                                    }}
                                                    min={(formData.startDates && formData.startDates.length && formData.startDates[idx]) ? formData.startDates[idx] : getTomorrowLocal()}
                                                    className={formErrors[`endDates_${idx}`] ? "border-red-500" : ""}
                                                    disabled={hasBookings && modalMode === "edit"} // Disable nếu có bookings
                                                />
                                            </div>

                                            <div className="flex items-end" style={{ marginTop: 'auto' }}>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => {
                                                        // ... existing onClick logic ...
                                                    }}
                                                    disabled={hasBookings && modalMode === "edit"} // Disable nếu có bookings
                                                >
                                                    Xóa
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                                {/* <div>
                                    <Button variant="ghost" onClick={() => {
                                        const starts = Array.isArray(formData.startDates) ? formData.startDates.slice() : [];
                                        const ends = Array.isArray(formData.endDates) ? formData.endDates.slice() : [];
                                        const newStart = "";
                                        starts.push(newStart);
                                        let newEnd = "";
                                        const firstStart = (formData.startDates && formData.startDates[0]) || formData.startDate;
                                        const firstEnd = (formData.endDates && formData.endDates[0]) || formData.endDate;
                                        if (newStart && firstStart && firstEnd) {
                                            const baseStart = parseLocalInput(firstStart);
                                            const baseEnd = parseLocalInput(firstEnd);
                                            if (baseStart && baseEnd) {
                                                const delta = baseEnd.getTime() - baseStart.getTime();
                                                const thisStart = parseLocalInput(newStart);
                                                if (thisStart) newEnd = toLocalInput(new Date(thisStart.getTime() + delta));
                                            }
                                        }
                                        ends.push(newEnd);
                                        handleFormChange('startDates' as any, starts);
                                        handleFormChange('endDates' as any, ends);
                                        if (starts.length === 1 && starts[0]) handleFormChange('startDate', starts[0]);
                                        if (ends.length === 1 && ends[0]) handleFormChange('endDate', ends[0]);

                                    }}
                                        disabled={hasBookings && modalMode === "edit"} // Disable nếu có bookings
                                    >Thêm ngày khởi hành</Button>
                                </div> */}
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="duration" className="mt-2 block">Thời lượng </Label>

                            { /* disable select until user đã chọn ít nhất 1 start date */}
                            <select
                                className="mt-1 block w-full rounded-md border px-3 py-2"
                                value={String(
                                    parseDurationToDays(
                                        // parseDurationToDays handles number/string/display
                                        (formData.duration as any) || formData.durationDisplay || "",
                                        formData.startDates?.[0],
                                        formData.endDates?.[0]
                                    ) || 1
                                )}
                                onChange={(e) => {
                                    const days = Math.max(1, Number(e.target.value) || 1);
                                    // store numeric duration
                                    handleFormChange("duration" as any, days);

                                    // update display (optional)
                                    const display = `${days} ngày ${Math.max(0, days - 1)} đêm`;
                                    handleFormChange("durationDisplay" as any, display);

                                    // recompute endDates from existing startDates using BE convention (end = start + days*24h)
                                    const msPerDay = 24 * 60 * 60 * 1000;
                                    const starts = Array.isArray(formData.startDates) && formData.startDates.length
                                        ? formData.startDates.slice()
                                        : (formData.startDate ? [formData.startDate] : []);

                                    const newEnds = starts.map(s => {
                                        const sd = parseLocalInput(s);
                                        return sd ? toLocalInput(new Date(sd.getTime() + days * msPerDay)) : "";
                                    });
                                    handleFormChange("endDates" as any, newEnds);
                                    handleFormChange("endDate" as any, newEnds[0] || "");
                                }}
                                disabled={
                                    !(
                                        (Array.isArray(formData.startDates) && formData.startDates.length && formData.startDates.some(Boolean))
                                        || Boolean(formData.startDate)
                                    )
                                }
                            >
                                {durationOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>

                            { /* helper text when no start chosen */}
                            {!(
                                (Array.isArray(formData.startDates) && formData.startDates.length && formData.startDates.some(Boolean))
                                || Boolean(formData.startDate)
                            ) && (
                                    <p className="text-xs text-gray-500 mt-1">Vui lòng chọn ngày bắt đầu trước khi chọn thời lượng</p>
                                )}
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <Label htmlFor="priceAdult">Giá người lớn (VNĐ) *</Label>
                            <Input
                                id="adultPrice"
                                type="number"
                                value={formData.adultPrice || ""}
                                onChange={(e) => handleFormChange("adultPrice", parseInt(e.target.value) || 0)}
                                placeholder="3500000"
                                className={formErrors.adultPrice ? "border-red-500" : ""}
                                disabled={hasBookings && modalMode === "edit"}
                            />
                            {hasBookings && modalMode === "edit" && (
                                <p className="text-sm text-red-500 mt-1">Không thể thay đổi giá vé vì đã có người đặt chỗ.</p>
                            )}
                            {formErrors.adultPrice && (
                                <p className="text-sm text-red-500 mt-1">{formErrors.adultPrice}</p>
                            )}
                        </div>
                        <div>
                            <Label htmlFor="childPrice">Giá trẻ em (≥5 tuổi)</Label>
                            <Input
                                id="childPrice"
                                type="number"
                                value={formData.childPrice || ""}
                                onChange={(e) => handleFormChange("childPrice", parseInt(e.target.value) || 0)}
                                placeholder="2800000"
                                className={formErrors.childPrice ? "border-red-500" : ""}
                                disabled={hasBookings && modalMode === "edit"}
                            />
                            {hasBookings && modalMode === "edit" && (
                                <p className="text-sm text-red-500 mt-1">Không thể thay đổi giá vé vì đã có người đặt chỗ.</p>
                            )}
                            {formErrors.childPrice && (
                                <p className="text-sm text-red-500 mt-1">{formErrors.childPrice}</p>
                            )}
                        </div>
                        <div>
                            <Label htmlFor="infantPrice">Giá em bé (&lt;5 tuổi)</Label>
                            <Input
                                id="infantPrice"
                                type="number"
                                value={formData.infantPrice || ""}
                                onChange={(e) => handleFormChange("infantPrice", parseInt(e.target.value) || 0)}
                                placeholder="1000000"
                                className={formErrors.infantPrice ? "border-red-500" : ""}
                                disabled={hasBookings && modalMode === "edit"}
                            />
                            {hasBookings && modalMode === "edit" && (
                                <p className="text-sm text-red-500 mt-1">Không thể thay đổi giá vé vì đã có người đặt chỗ.</p>
                            )}
                            {formErrors.infantPrice && (
                                <p className="text-sm text-red-500 mt-1">{formErrors.infantPrice}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <Label htmlFor="maxGroupSize">Số chỗ tối đa *</Label>
                            <Input
                                id="maxGroupSize"
                                type="number"
                                value={formData.maxGroupSize || ""}
                                onChange={(e) => handleFormChange("maxGroupSize", parseInt(e.target.value) || 1)}
                                placeholder="40"
                                className={formErrors.maxGroupSize ? "border-red-500" : ""}
                            />
                            {formErrors.maxGroupSize && (
                                <p className="text-sm text-red-500 mt-1">{formErrors.maxGroupSize}</p>
                            )}
                        </div>
                        {/* <div>
                            <Label htmlFor="minBooking">Số booking tối thiểu *</Label>
                            <Input
                                id="minBooking"
                                type="number"
                                value={formData.minBooking || ""}
                                onChange={(e) => handleFormChange("minBooking", parseInt(e.target.value) || 1)}
                                placeholder="1"
                                className={formErrors.minBooking ? "border-red-500" : ""}
                            />
                            {formErrors.minBooking && (
                                <p className="text-sm text-red-500 mt-1">{formErrors.minBooking}</p>
                            )}
                        </div> */}
                    </div>

                    {/* <div>
                        <Label htmlFor="pickupPoints">Điểm đón</Label>
                        <Input
                            id="pickupPoints"
                            value={formData.pickupPoints.join(", ")}
                            onChange={(e) =>
                                handleFormChange(
                                    "pickupPoints",
                                    e.target.value
                                        .split(",")
                                        .map((point) => point.trim())
                                        .filter(Boolean)
                                )
                            }
                            placeholder="Hà Nội, Hải Phòng"
                        />
                    </div> */}
                    <div>
                        <Label htmlFor="startLocationPickup">Điểm đón</Label>
                        <Input
                            id="startLocationPickup"
                            value={(formData.startLocation && formData.startLocation.pickupDropoff) || ""}
                            onChange={(e) =>
                                handleFormChange("startLocation", {
                                    ...(formData.startLocation || { type: "Point", address: "", pickupDropoff: "" }),
                                    pickupDropoff: e.target.value,
                                } as any)
                            }
                            placeholder="Ví dụ: Bến xe Mỹ Đình"
                            className={formErrors.pickupDropoff ? "border-red-500" : ""}
                        />
                        {formErrors.pickupDropoff && <p className="text-sm text-red-500 mt-1">{formErrors.pickupDropoff}</p>}
                        <p className="text-xs text-gray-500 mt-1">Bắt buộc nhập — sẽ gửi lên BE ở startLocation.pickupDropoff</p>
                    </div>

                    <div className="mt-2">
                        <Label htmlFor="startLocationAddress">Địa chỉ điểm đón </Label>
                        <Input
                            id="startLocationAddress"
                            value={(formData.startLocation && formData.startLocation.address) || ""}
                            onChange={(e) =>
                                handleFormChange("startLocation", {
                                    ...(formData.startLocation || { type: "Point", address: "", pickupDropoff: "" }),
                                    address: e.target.value,
                                } as any)
                            }
                            placeholder="Địa chỉ chi tiết"
                        />
                        {formErrors.startLocationAddress && <p className="text-sm text-red-500 mt-1">{formErrors.startLocationAddress}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <Label>Dịch vụ (chọn các mục áp dụng)</Label>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                {SERVICE_OPTIONS.map((opt) => {
                                    const checked = Array.isArray(formData.services) && formData.services.includes(opt);
                                    return (
                                        <label key={opt} className="flex items-center space-x-2">
                                            <Checkbox
                                                checked={checked}
                                                onCheckedChange={(c) => {
                                                    const next = formData.services ? formData.services.slice() : [];
                                                    if (c) {
                                                        if (!next.includes(opt)) next.push(opt);
                                                    } else {
                                                        const idx = next.indexOf(opt);
                                                        if (idx >= 0) next.splice(idx, 1);
                                                    }
                                                    handleFormChange("services" as any, next);
                                                }}
                                            />
                                            <span className="text-sm">{opt}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="cancellationPolicy">Chính sách hủy tour</Label>
                        <Textarea
                            id="cancellationPolicy"
                            value={formData.cancellationPolicy}
                            onChange={(e) => handleFormChange("cancellationPolicy", e.target.value)}
                            placeholder="Mô tả chính sách hủy tour và hoàn tiền"
                            rows={3}
                        />
                    </div>
                </TabsContent>
                <TabsContent value="itinerary" className="space-y-4 mt-6">


                    <Separator />
                    {/* NOTE: show mapping info if we can/can't derive number of days */}
                    {(() => {
                        const expected = getExpectedItineraryDays();
                        if (expected === 0) {
                            return (
                                <div className="text-sm text-gray-500 mb-2">
                                    Không thể tự động xác định số ngày cho lịch trình chi tiết.
                                    Vui lòng đảm bảo đã đặt Ngày bắt đầu & Ngày kết thúc cho chuyến đầu tiên
                                    hoặc có trường Thời lượng hợp lệ để hệ thống tự map số ngày.
                                </div>
                            );
                        }
                        if (formData.itinerary.length !== expected) {
                            return (
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm text-yellow-600">
                                        Số ngày lịch trình hiện tại: {formData.itinerary.length} — mong đợi theo thời lượng: {expected} ngày.
                                    </p>
                                    <div className="flex items-center space-x-2">
                                        {/* <Button
                                            size="sm"
                                            onClick={() => {
                                                const nextIt = ensureItineraryLength(expected, formData.itinerary || []);
                                                handleFormChange("itinerary", nextIt);
                                            }}
                                        >
                                            Đồng bộ với thời lượng
                                        </Button> */}
                                    </div>
                                </div>
                            );
                        }
                        return null;
                    })()}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <Label className="text-xl font-semibold text-gray-900">Lịch trình chi tiết <span className="text-gray-500">{formData.itinerary.length} ngày theo thời lượng tour </span></Label>
                            {/* <Button onClick={addItineraryDay} size="sm">
                                 <Plus className="w-4 h-4 mr-2" />
                                 Thêm ngày
                             </Button> */}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                    // Kiểm tra nếu itinerary rỗng
                                    if (!formData.itinerary || formData.itinerary.length === 0) {
                                        toast({ title: "Không có lịch trình", description: "Vui lòng thêm ngày vào lịch trình trước", variant: "destructive" });
                                        return;
                                    }

                                    // Set loading cho tất cả ngày
                                    const allIndices = formData.itinerary.map((_, idx) => idx);
                                    setAiLoading(prev => {
                                        const next = { ...prev };
                                        allIndices.forEach(idx => next[idx] = true);
                                        return next;
                                    });

                                    try {
                                        // Loop qua tất cả ngày và tạo gợi ý
                                        const updatedItinerary = [...formData.itinerary];
                                        for (let index = 0; index < formData.itinerary.length; index++) {
                                            const day = formData.itinerary[index];
                                            const dayNumber = (day as any).day ?? index + 1;
                                            const existingAddress = (day as any).address ?? (day as any).title ?? "";

                                            // Prompt để tạo cả tiêu đề và chi tiết cho ngày
                                            const prompt = `Bạn là trợ lý du lịch chuyên nghiệp. Tạo gợi ý hoàn chỉnh cho ngày ${dayNumber} của tour du lịch ${formData.duration} ngày từ ${formData.departureFrom} đến ${formData.destination}.

${existingAddress ? `Tiêu đề hiện tại: "${existingAddress}". Bạn có thể giữ hoặc cải thiện tiêu đề này.` : 'Tạo tiêu đề hấp dẫn cho ngày này.'}

Yêu cầu:
- Tiêu đề: Ngắn gọn, hấp dẫn (ví dụ: "Khám phá hang Sửng Sốt và làng chài nổi").
- Chi tiết: Mô tả đầy đủ hoạt động, điểm tham quan, trải nghiệm trong ngày. Khoảng 200-300 từ, tự nhiên, dùng emoji phù hợp.

Trả về định dạng JSON: {"title": "Tiêu đề", "description": "Chi tiết mô tả"}`;

                                            const result = await model.generateContent(prompt);
                                            const responseText = result.response.text();

                                            // Parse JSON từ AI response
                                            let aiData;
                                            try {
                                                aiData = JSON.parse(responseText);
                                            } catch {
                                                // Nếu không parse được, fallback: tách thủ công (giả sử format "Title: ... Description: ...")
                                                const titleMatch = responseText.match(/title["\s:]+([^"\n]+)/i) || responseText.match(/^([^\n]+)/);
                                                const descMatch = responseText.match(/description["\s:]+(.+)/is);
                                                aiData = {
                                                    title: titleMatch ? titleMatch[1].trim() : `Ngày ${dayNumber}: ${existingAddress || 'Khám phá điểm đến'}`,
                                                    description: descMatch ? descMatch[1].trim() : responseText.replace(/title["\s:]+[^"\n]*/i, '').trim()
                                                };
                                            }

                                            // Update itinerary
                                            updatedItinerary[index] = {
                                                ...updatedItinerary[index],
                                                address: aiData.title,
                                                description: aiData.description
                                            };
                                        }

                                        // Update formData với tất cả ngày đã được tạo
                                        handleFormChange("itinerary", updatedItinerary);
                                        toast({ title: "Đã tạo gợi ý cho tất cả ngày", description: `Đã cập nhật ${formData.itinerary.length} ngày từ AI` });
                                    } catch (error) {
                                        console.error('AI generate error:', error);
                                        toast({ title: "Lỗi tạo gợi ý", description: "Không thể tạo mô tả từ AI, vui lòng thử lại", variant: "destructive" });
                                    } finally {
                                        // Clear loading cho tất cả ngày
                                        setAiLoading(prev => {
                                            const next = { ...prev };
                                            allIndices.forEach(idx => next[idx] = false);
                                            return next;
                                        });
                                    }
                                }}
                                disabled={Object.values(aiLoading).some(Boolean)}
                                style={{ display: formData.duration || formData.durationDisplay ? 'inline-flex' : 'none' }}
                            >
                                {Object.values(aiLoading).some(Boolean) ? "Đang tạo..." : "Tạo gợi ý AI cho tất cả lịch trình"}
                            </Button>
                        </div>
                        {formData.itinerary.map((day, index) => (
                            <div key={index} className="border rounded-lg p-4 space-y-4">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-medium">Ngày {(day as any).day ?? (day as any).dayNumber ?? index + 1}</h4>
                                    <div className="flex space-x-2">
                                        {/* <Button
                                             variant="outline"
                                             size="sm"
                                             onClick={() => duplicateItineraryDay(index)}
                                         >
                                             <Copy className="w-4 h-4 mr-2" />
                                             Sao chép
                                         </Button> */}
                                        {/* <Button
                                             variant="destructive"
                                             size="sm"
                                             onClick={() => removeItineraryDay(index)}
                                         >
                                             <Trash2 className="w-4 h-4 mr-2" />
                                             Xóa
                                         </Button> */}
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor={`itinerary-address-${index}`}>Tiêu đề / Địa điểm</Label>
                                    <Input
                                        id={`itinerary-address-${index}`}
                                        value={(day as any).address ?? (day as any).title ?? ""}
                                        onChange={(e) => updateItineraryDay(index, "address", e.target.value)}
                                        placeholder="Ví dụ: Khám phá hang Sửng Sốt"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor={`itinerary-description-${index}`}>Chi tiết</Label>
                                    <JoditEditorWrapper
                                        value={(day as any).description ?? (day as any).details ?? ""}
                                        onChange={(newContent) => updateItineraryDay(index, "description", newContent)}
                                        placeholder="Mô tả chi tiết ngày này"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="media" className="space-y-4 mt-6">
                    <div>
                        <Label>Hình ảnh tour * (tối thiểu 1, tối đa 10)</Label>
                        <div className="mt-2">
                            <ImageUploader
                                value={formData.images || []}
                                onChange={(files) => handleFormChange("images", files)}
                                maxFiles={10}
                                maxSizePerFile={5}
                                hint="Kích thước tối đa 5MB/file, khuyến nghị 1920×1080"
                                className={formErrors.images ? "border-red-500" : ""}
                            />
                        </div>
                        {formErrors.images && (
                            <p className="text-sm text-red-500 mt-1">{formErrors.images}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                            Ảnh đầu tiên sẽ được sử dụng làm ảnh bìa
                        </p>
                    </div>

                    <div>
                        <Label htmlFor="videoUrl">Video URL (YouTube/Vimeo)</Label>
                        <Input
                            id="videoUrl"
                            value={formData.videoUrl}
                            onChange={(e) => handleFormChange("videoUrl", e.target.value)}
                            placeholder="https://youtube.com/watch?v=..."
                            className={formErrors.videoUrl ? "border-red-500" : ""}
                        />
                        {formErrors.videoUrl && (
                            <p className="text-sm text-red-500 mt-1">{formErrors.videoUrl}</p>
                        )}
                    </div>
                </TabsContent>

                {/* <TabsContent value="seo" className="space-y-4 mt-6">
                    <div>
                        <Label htmlFor="metaTitle">Meta Title</Label>
                        <Input
                            id="metaTitle"
                            value={formData.metaTitle}
                            onChange={(e) => handleFormChange("metaTitle", e.target.value)}
                            placeholder="Title cho SEO (khuyến nghị 50-60 ký tự)"
                            maxLength={60}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            {formData.metaTitle.length}/60 ký tự
                        </p>
                    </div>

                    <div>
                        <Label htmlFor="metaDescription">Meta Description</Label>
                        <Textarea
                            id="metaDescription"
                            value={formData.metaDescription}
                            onChange={(e) => handleFormChange("metaDescription", e.target.value)}
                            placeholder="Mô tả cho SEO (khuyến nghị 150-160 ký tự)"
                            rows={3}
                            maxLength={160}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            {formData.metaDescription.length}/160 ký tự
                        </p>
                    </div>

                    <div>
                        <Label htmlFor="metaKeywords">Meta Keywords</Label>
                        <Input
                            id="metaKeywords"
                            value={formData.metaKeywords}
                            onChange={(e) => handleFormChange("metaKeywords", e.target.value)}
                            placeholder="keyword1, keyword2, keyword3"
                        />
                    </div>
                </TabsContent> */}

                <TabsContent value="settings" className="space-y-4 mt-6">
                    <div>
                        <Label htmlFor="status">Trạng thái</Label>
                        <Select
                            value={formData.status}
                            onValueChange={(value) => handleFormChange("status", value)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">Hoạt động</SelectItem>
                                <SelectItem value="hidden">Ẩn</SelectItem>
                                <SelectItem value="draft">Bản nháp</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Switch
                            id="highlight"
                            checked={formData.highlight}
                            onCheckedChange={(checked) => handleFormChange("highlight", checked)}
                        />
                        <Label htmlFor="highlight">Tour nổi bật</Label>
                    </div>

                    <div>
                        {/* <Label htmlFor="visibility">Khả năng hiển thị</Label>
                        <Select
                            value={formData.visibility}
                            onValueChange={(value) => handleFormChange("visibility", value)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="public">Công khai</SelectItem>
                                <SelectItem value="private">Riêng tư</SelectItem>
                            </SelectContent>
                        </Select> */}
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="isVisible"
                                checked={formData.isVisible}
                                onCheckedChange={(checked) => handleFormChange("isVisible", checked)}
                            />
                            <Label htmlFor="isVisible">Hiển thị ra client</Label>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        );
    };

    return (
        <div className="p-6 space-y-6 bg-gray-50">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý tour</h1>
                    <p className="text-gray-600 mt-1">Quản lý các tour du lịch và lịch trình</p>
                </div>
                <div className="flex items-center space-x-3">
                    {/* <Button
                        variant="outline"
                        onClick={() => refetch()}
                        disabled={isLoading}
                        className="hover:bg-primary-600 hover:text-white"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                        Làm mới
                    </Button> */}
                    <Button onClick={handleAdd} className="bg-primary hover:bg-primary-600">
                        <Plus className="w-4 h-4 mr-2" />
                        Thêm tour mới
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Tổng tour</p>
                                <p className="text-2xl font-bold">{totalTours}</p>
                            </div>
                            <MapPin className="w-8 h-8 text-primary" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Đang bán</p>
                                <p className="text-2xl font-bold">{totalVisible}</p>
                            </div>
                            <Eye className="w-8 h-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
                {/* <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Sắp hết chỗ</p>
                                <p className="text-2xl font-bold">
                                    {tours.filter((t: Tour) => t.maxGroupSize - t.seatsBooked <= t.maxGroupSize * 0.2).length}
                                </p>
                            </div>
                            <Users className="w-8 h-8 text-orange-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Đánh giá TB</p>
                                <p className="text-2xl font-bold">
                                    {tours.length > 0 ? (tours.reduce((sum, t) => sum + t.ratingsAverage, 0) / tours.length).toFixed(1) : '0.0'}
                                </p>
                            </div>
                            <Star className="w-8 h-8 text-yellow-500" />
                        </div>
                    </CardContent>
                </Card> */}
            </div>

            {/* Main Table */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Danh sách tour</CardTitle>
                            <CardDescription>Quản lý thông tin và trạng thái tour du lịch</CardDescription>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Select
                                value={filters.visibility}
                                onValueChange={(value) => setFilters((prev) => ({ ...prev, visibility: value }))}
                            >
                                <SelectTrigger className="w-40">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả</SelectItem>
                                    <SelectItem value="true">Hiện hành</SelectItem>
                                    <SelectItem value="false">Ẩn</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* <DataTable
                        columns={columns}
                        data={tours}
                        pagination={{
                            current: pagination.current,
                            pageSize: pagination.pageSize,
                            total: total,
                        }}
                        onPaginationChange={(page, pageSize) => setPagination({ current: page, pageSize })}
                        onSearch={setSearchQuery}
                        rowSelection={{
                            selectedRowKeys: selectedTours,
                            onChange: setSelectedTours,
                        }}
                        // bulkActions={bulkActions}
                        actions={actions}
                        exportable
                        onExport={() =>
                            toast({ title: "Đang xuất file...", description: "File sẽ được tải xuống sau vài giây" })
                        }
                        loading={isLoading}
                    /> */}
                    <DataTable
                        columns={columns}
                        data={tours}  // Change from filteredTours to tours
                        pagination={{
                            current: pagination.current,
                            pageSize: pagination.pageSize,
                            total: pagination.total,  // Use pagination.total from server
                        }}
                        onPaginationChange={(page, pageSize) => setPagination({ current: page, pageSize })}
                        onSearch={setSearchQuery}
                        rowSelection={{
                            selectedRowKeys: selectedTours,
                            onChange: setSelectedTours,
                        }}
                        // bulkActions={bulkActions}
                        actions={actions}
                        exportable
                        onExport={() =>
                            toast({ title: "Đang xuất file...", description: "File sẽ được tải xuống sau vài giây" })
                        }
                        loading={isLoading}
                    />
                </CardContent>
            </Card>

            {/* Tour Modal */}
            <ModalForm
                open={modalOpen}
                onOpenChange={handleModalClose}
                title={
                    modalMode === "create"
                        ? "Tạo tour mới"
                        : modalMode === "edit"
                            ? "Chỉnh sửa tour"
                            : "Chi tiết tour"
                }
                description={
                    modalMode === "create"
                        ? "Tạo tour du lịch mới với đầy đủ thông tin"
                        : modalMode === "edit"
                            ? "Cập nhật thông tin tour du lịch"
                            : "Xem thông tin chi tiết tour du lịch"
                }
                mode={modalMode}
                size="full"
                onSubmit={handleSubmit}
                submitDisabled={isSubmitDisabled()}
                submitText={modalMode === "create" ? "Tạo & Xuất bản" : "Cập nhật"}
                cancelText="Hủy"
            // extraActions={
            //     modalMode !== "view"
            //         ? [
            //             {
            //                 text: "Lưu nháp",
            //                 onClick: handleSaveDraft,
            //                 variant: "outline" as const,
            //                 icon: <Save className="w-4 h-4 mr-2" />,
            //             },
            //             {
            //                 text: "Xem trước",
            //                 onClick: handlePreview,
            //                 variant: "outline" as const,
            //                 icon: <ExternalLink className="w-4 h-4 mr-2" />,
            //             },
            //         ]
            //         : undefined
            // }
            >
                <div className="max-h-[60vh] overflow-y-auto pr-2">
                    {renderTourForm()}
                </div>
            </ModalForm>

            {/* Delete Confirmation */}
            <ConfirmModal
                open={deleteModalOpen}
                onOpenChange={setDeleteModalOpen}
                title="Xóa tour"
                message={`Bạn có chắc chắn muốn xóa tour "${tourToDelete?.name}"?${tourToDelete?.seatsBooked ? " Tour này có đơn hàng đã đặt." : ""
                    }`}
                type="danger"
                requireTyping={true}
                typingText={tourToDelete?.seatsBooked ? "FORCE_DELETE" : "DELETE"}
                onConfirm={confirmDelete}
                confirmText="Xóa tour"
                loading={deleteTourMutation.isPending}
            />
        </div>
    );
}
