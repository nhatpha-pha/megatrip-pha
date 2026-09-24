"use client";
import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bus, Plus, Edit, Eye, Trash2, Filter, Download, MapPin, Clock, Users, DollarSign, RefreshCw, Calendar, Ban, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Textarea } from "../../components/ui/textarea";
import { Checkbox } from "../../components/ui/checkbox";
import { DataTable, Column } from "../../components/DataTable";
import { ModalForm } from "../../components/ModalForm";
import { ConfirmModal } from "../../components/ConfirmModal";
import { useToast } from "../../components/ui/use-toast";

// --- Add API base (points to port 7700 by default) ---
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';

interface BusRoute {
    id: string;
    busCode: string;
    operator: {
        id: string;
        name: string;
        logo: string;
        code: string;
    };
    routeFrom: {
        code: string;
        name: string;
        city: string;
    };
    routeTo: {
        code: string;
        name: string;
        city: string;
    };
    departureAt: string;
    arrivalAt: string;
    duration: string;
    busType: string[];
    adultPrice: number;
    childPrice?: number;
    seatsTotal: number;
    seatsAvailable: number;
    status: "scheduled" | "cancelled" | "delayed" | "completed";
    amenities: string;
    createdAt: string;
    updatedAt: string;
}

interface BusFormData {
    busCode: string;
    operatorId: string;
    routeFrom: string;
    routeTo: string;
    // preserve single departureAt for backward compatibility (first date)
    departureAt: string;
    // new: multiple departure dates
    departureDates?: string[];
    // new: multiple arrival dates (paired by index with departureDates)
    arrivalDates?: string[];
    arrivalAt: string;
    duration: string;
    busType: string[];
    adultPrice: number;
    childPrice?: number;
    seatsTotal: number;
    seatsAvailable: number;
    amenities: string;
    status: "scheduled" | "cancelled" | "delayed" | "completed";
}

interface BusFilters {
    operator: string;
    status: string;
    route: string;
    dateRange?: [string, string];
}

const mockOperators = [
    { id: "op_001", name: "Phương Trang", code: "PT", logo: "/placeholder.svg" },
    { id: "op_002", name: "Hoàng Long", code: "HL", logo: "/placeholder.svg" },
    { id: "op_003", name: "Mai Linh", code: "ML", logo: "/placeholder.svg" },
    { id: "op_004", name: "Thanh Bưởi", code: "TB", logo: "/placeholder.svg" },
];

const mockStations = [
    { code: "SGN_MB", name: "Bến xe Miền Đông", city: "TP.HCM" },
    { code: "SGN_MT", name: "Bến xe Miền Tây", city: "TP.HCM" },
    { code: "HAN_MB", name: "Bến xe Mỹ Đình", city: "Hà Nội" },
    { code: "HAN_GL", name: "Bến xe Gia Lâm", city: "Hà Nội" },
    { code: "DAD_BX", name: "Bến xe Đà Nẵng", city: "Đà Nẵng" },
    { code: "HUE_BX", name: "Bến xe Huế", city: "Huế" },
];

const busTypeOptions = [
    { value: "Ghế ngồi", label: "Ghế ngồi" },
    { value: "Giường nằm", label: "Giường nằm" },
    { value: "Limousine", label: "Limousine" },
    { value: "VIP", label: "VIP" }
];

// --- New: amenities options (value = stored key, label = display text) ---
const amenitiesOptions = [
    { value: "wifi", label: "Wi‑Fi miễn phí trên xe" },
    { value: "water", label: "Nước uống miễn phí" },
    { value: "blanket", label: "Chăn đắp" },
    { value: "toilet", label: "Nhà vệ sinh trên xe" },
    { value: "entertainment", label: "Màn hình giải trí / TV" },
    { value: "massage", label: "Ghế massage" },
    { value: "snack", label: "Đồ ăn nhẹ / Snack" }
];

// --- New helper: safe collect all subtypes without flatMap ---
const getAllSubtypes = (data: any) => {
    // returns [] if data is not an array
    if (!Array.isArray(data)) return [];
    const result: any[] = [];
    for (const cat of data) {
        if (cat && Array.isArray(cat.subtypes)) {
            for (const s of cat.subtypes) result.push(s);
        }
    }
    return result;
};

// --- small helper: read provinces data exposed to module helpers ---
const getGlobalProvinces = () => {
    if (typeof globalThis !== 'undefined') return (globalThis as any).__PROVINCES_DATA;
    return undefined;
};

// --- New helper: parse route select value into object { code, name, city } ---
const parseRouteValue = (value: string) => {
    // value may be "PROV_CODE||Station Name" (when loaded from provincesData)
    if (!value) return null;
    if (typeof value !== 'string') return null;

    const provinces = getGlobalProvinces();

    // try prov||station format
    const parts = value.split('||');
    if (parts.length === 2) {
        const provCode = parts[0];
        const stationName = parts[1];
        // use exposed provinces if available
        if (Array.isArray(provinces)) {
            const prov = provinces.find((p: any) => String(p.code) === String(provCode) || p.name === provCode);
            if (prov && Array.isArray(prov.bus_stations)) {
                const st = prov.bus_stations.find((s: any) => s.name === stationName);
                if (st) {
                    // IMPORTANT: set city to the province "name" as requested
                    return {
                        code: provCode,
                        name: st.name,
                        city: prov.name || ''
                    };
                }
            }
        }
        // fallback: try to find station in mockStations by name
        const m = mockStations.find(s => s.name === stationName || s.code === stationName);
        if (m) return { code: m.code, name: m.name, city: m.city };
        // fallback generic
        return { code: provCode, name: stationName, city: '' };
    }

    // otherwise value might be a simple code like "SGN_MB"
    const ms = mockStations.find(s => s.code === value);
    if (ms) return { code: ms.code, name: ms.name, city: ms.city };
    // try provinces list search
    if (Array.isArray(provinces)) {
        for (const prov of provinces) {
            if (Array.isArray(prov.bus_stations)) {
                const st = prov.bus_stations.find((s: any) => s.name === value || s.code === value);
                if (st) {
                    return { code: prov.code || value, name: st.name, city: prov.name || '' };
                }
            }
        }
    }
    return { code: value, name: value, city: '' };
};

// --- New helper: format a route object into the Select value used by the UI ---
const formatRouteSelectValue = (routeObj: any) => {
    // routeObj may be { code, name, city } or a simple code string
    if (!routeObj) return "";
    if (typeof routeObj === "string") return routeObj;

    const provinces = getGlobalProvinces();
    const code = routeObj.code || "";
    const name = routeObj.name || "";

    // prefer provinces data provCode||stationName when possible
    if (Array.isArray(provinces)) {
        for (const prov of provinces) {
            if (!Array.isArray(prov.bus_stations)) continue;
            const found = prov.bus_stations.find((s: any) => {
                return s.name === name || s.name === code || s.code === name || s.code === code;
            });
            if (found) {
                return `${prov.code}||${found.name}`;
            }
        }
    }

    // fallback to mockStations by code or name
    const ms = mockStations.find(s => s.code === code || s.name === name || s.code === name || s.name === code);
    if (ms) return ms.code;

    // fallback to use code if present, otherwise name
    return code || name || "";
};



export default function Buses() {
    const [selectedBuses, setSelectedBuses] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [filters, setFilters] = useState<BusFilters>({
        operator: "all",
        status: "all",
        route: "all"
    });
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create");
    const [selectedBus, setSelectedBus] = useState<BusRoute | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [busToDelete, setBusToDelete] = useState<BusRoute | null>(null);
    const [formData, setFormData] = useState<BusFormData>({
        busCode: "",
        operatorId: "",
        routeFrom: "",
        routeTo: "",
        departureAt: "",
        // initialize empty array of departure dates
        departureDates: [],
        // new
        arrivalDates: [],
        arrivalAt: "",
        duration: "",
        busType: ["Ghế ngồi"],
        adultPrice: 0,
        childPrice: 0,
        seatsTotal: 0,
        seatsAvailable: 0,
        amenities: "",
        status: "scheduled"
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [isFormDirty, setIsFormDirty] = useState(false);
    const [selectedSubtypeId, setSelectedSubtypeId] = useState<string>("");
    // New: store selected subtype layout and constructed seatMap
    const [selectedLayout, setSelectedLayout] = useState<any | null>(null);
    const [seatMap, setSeatMap] = useState<any[] | null>(null);

    // --- New state: selected amenities (checkboxes) ---
    const [amenitiesSelected, setAmenitiesSelected] = useState<string[]>([]);

    // New: recurrence mode state
    const [recurrenceMode, setRecurrenceMode] = useState<"single" | "weekly" | "monthly" | "weekday_of_month">("single");
    // weekday 0=Sunday .. 6=Saturday (Vietnamese view: T2..CN map when rendering)
    const [recurrenceWeekday, setRecurrenceWeekday] = useState<number>(1); // default Monday (T2)

    // track whether applyRecurrence produced a schedule (at least one departure with arrival)
    const [recurrenceApplied, setRecurrenceApplied] = useState<boolean>(false);

    // --- INSERT: helpers for recurrence generation ---
    // format Date -> local input 'YYYY-MM-DDTHH:mm'
    const toLocalInput = (d: Date) => {
        const tzOffset = d.getTimezoneOffset() * 60000;
        return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
    };

    // build a JS Date from a 'YYYY-MM-DDTHH:mm' local string reliably
    const parseLocalInput = (isoLocal: string) => {
        if (!isoLocal) return null;
        const [datePart, timePart] = isoLocal.split('T');
        if (!datePart) return null;
        const [y, m, day] = datePart.split('-').map(Number);
        const [hh = 0, mm = 0] = (timePart || '').split(':').map(Number);
        return new Date(y, (m || 1) - 1, day || 1, hh || 0, mm || 0, 0, 0);
    };
    // Hàm mới: Luôn convert theo múi giờ VN (+7 UTC)
    const toVNLocalString = (d: Date) => {
        if (!d || isNaN(d.getTime())) return "";
        const vnTime = new Date(d.getTime() + 7 * 60 * 60 * 1000); // Thêm 7 giờ để chuyển sang múi giờ VN
        const year = vnTime.getUTCFullYear();
        const month = String(vnTime.getUTCMonth() + 1).padStart(2, '0');
        const day = String(vnTime.getUTCDate()).padStart(2, '0');
        const hour = String(vnTime.getUTCHours()).padStart(2, '0');
        const minute = String(vnTime.getUTCMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hour}:${minute}`;
    };

    const parseVNLocalString = (str: string | undefined) => {
        if (!str) return null;
        const [date, time] = str.split('T');
        if (!date || !time) return null;
        const [y, m, day] = date.split('-').map(Number);
        const [hh = 0, mm = 0] = time.split(':').map(Number);
        // Trừ 7 giờ để chuyển từ VN sang UTC
        return new Date(Date.UTC(y, m - 1, day, hh - 7, mm));
    };

    // NEW helper: convert a local 'YYYY-MM-DDTHH:mm' value to ISO (Z) string if possible
    // Cập nhật localToIso để dùng parseVNLocalString
    const localToIso = (localStr: string) => {
        return localStr; // Gửi chuỗi VN local trực tiếp
    };

    // Cập nhật generateConsecutiveDays để dùng toVNLocalString
    const generateConsecutiveDays = (startIsoLocal: string, daysCount: number) => {
        const start = parseVNLocalString(startIsoLocal);
        if (!start) return [];
        const result: string[] = [];
        for (let i = 0; i < daysCount; i++) {
            const dd = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
            result.push(toVNLocalString(dd));
        }
        return result;
    };

    // Generate all occurrences of a given weekday within the same calendar month as start (>= start)
    const generateWeekdayInMonth = (startIsoLocal: string, weekday: number) => {
        const start = parseVNLocalString(startIsoLocal);
        if (!start) return [];
        const year = start.getFullYear();
        const month = start.getMonth();
        const result: string[] = [];
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let d = 1; d <= daysInMonth; d++) {
            const dt = new Date(year, month, d, start.getHours(), start.getMinutes());
            if (dt.getDay() === weekday && dt.getTime() >= start.getTime()) {
                result.push(toVNLocalString(dt));
            }
        }
        return result;
    };

    // Apply recurrence based on selected mode and the current first date in formData
    const applyRecurrence = () => {
        const firstDep = (formData.departureDates && formData.departureDates.length) ? formData.departureDates[0] : formData.departureAt;
        const firstArr = (formData.arrivalDates && formData.arrivalDates.length) ? formData.arrivalDates[0] : formData.arrivalAt;

        if (!firstDep) {
            toast({ title: "Thiếu ngày bắt đầu", description: "Vui lòng chọn ngày khởi hành đầu tiên trước khi áp dụng", variant: "destructive" });
            return;
        }

        let generatedDeps: string[] = [];
        if (recurrenceMode === "weekly") {
            generatedDeps = generateConsecutiveDays(firstDep, 7);
        } else if (recurrenceMode === "monthly") {
            generatedDeps = generateConsecutiveDays(firstDep, 30);
        } else if (recurrenceMode === "weekday_of_month") {
            generatedDeps = generateWeekdayInMonth(firstDep, recurrenceWeekday);
        } else {
            generatedDeps = Array.isArray(formData.departureDates) && formData.departureDates.length ? formData.departureDates : (formData.departureAt ? [formData.departureAt] : []);
        }

        // Build arrivalDates by preserving time delta between firstArr and firstDep (if firstArr exists).
        let generatedArrs: string[] = [];
        if (firstArr) {
            const depDate = parseLocalInput(firstDep);
            const arrDate = parseLocalInput(firstArr);
            if (depDate && arrDate) {
                const deltaMs = arrDate.getTime() - depDate.getTime();
                for (const dIso of generatedDeps) {
                    const d = parseLocalInput(dIso);
                    if (d) {
                        const arr = new Date(d.getTime() + deltaMs);
                        generatedArrs.push(toLocalInput(arr));
                    } else {
                        generatedArrs.push(""); // placeholder if parse failed
                    }
                }
            } else {
                // fallback: use same arrival string for all
                generatedArrs = generatedDeps.map(() => firstArr);
            }
        } else {
            // no first arrival specified: keep arrivalDates empty
            generatedArrs = [];
        }

        if (!generatedDeps || generatedDeps.length === 0) {
            toast({ title: "Không có ngày nào được tạo", description: "Vui lòng kiểm tra ngày bắt đầu hoặc loại lặp", variant: "destructive" });
            setRecurrenceApplied(false);
            return;
        }

        handleFormChange('departureDates' as any, generatedDeps);
        // set canonical departureAt = first generated (local input)
        handleFormChange('departureAt' as any, generatedDeps[0]);

        // set arrivalDates and canonical arrivalAt if any were generated
        if (generatedArrs.length) {
            handleFormChange('arrivalDates' as any, generatedArrs);
            handleFormChange('arrivalAt' as any, generatedArrs[0]);
            // mark applied only when we have at least one generated arrival (so Clear can be used)
            setRecurrenceApplied(true);
        } else {
            // if no arrivals were generated, do not mark as applied for Clear visibility
            setRecurrenceApplied(false);
        }

        setIsFormDirty(true);
        toast({ title: "Đã tạo ngày khởi hành", description: `Tạo ${generatedDeps.length} ngày theo chế độ ${recurrenceMode}` });
    };
    // --- END INSERT ---

    // New: reset schedule (clear departure/arrival lists + canonical times) with confirm
    const handleResetSchedule = () => {
        if (!confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch khởi hành và giờ đến? Hành động này sẽ xóa departureDates, arrivalDates và giờ tương ứng.")) {
            return;
        }

        // clear schedule-related fields
        setFormData(prev => ({
            ...prev,
            departureDates: [],
            arrivalDates: [],
            departureAt: "",
            arrivalAt: "",
            duration: ""
        }));

        // remove schedule-related errors
        setFormErrors(prev => {
            const next: Record<string, string> = { ...prev };
            Object.keys(next).forEach(k => {
                if (k === 'departureAt' || k === 'arrivalAt' || k.startsWith('departureDates_') || k.startsWith('arrivalDates_')) {
                    delete next[k];
                }
            });
            return next;
        });

        // mark dirty so save is possible (you can set false if you prefer)
        setIsFormDirty(true);
        // hide Clear button after reset
        setRecurrenceApplied(false);

        toast({ title: "Đã đặt lại lịch", description: "Lịch khởi hành và giờ đến đã được xóa", variant: "default" });
    };

    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
    });
    const [originalBus, setOriginalBus] = useState<BusRoute | null>(null);
    const [originalDepartureDates, setOriginalDepartureDates] = useState<string[]>([]);
    const [hasBookings, setHasBookings] = useState<boolean>(false);
    const [loadingHasBookings, setLoadingHasBookings] = useState(false);
    // Fetch buses from server API
    const { data: busesData, isLoading, error, refetch } = useQuery({
        queryKey: ['buses', pagination.current, pagination.pageSize, searchQuery, filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.set('page', String(pagination.current));
            params.set('pageSize', String(pagination.pageSize));
            if (searchQuery) params.set('search', searchQuery);
            if (filters.operator) params.set('operator', filters.operator);
            if (filters.status) params.set('status', filters.status);
            if (filters.route) params.set('route', filters.route);

            // Thêm sorting để item mới nhất ở đầu
            params.set('sortBy', 'createdAt');
            params.set('sortOrder', 'desc');

            const res = await fetch(`${API_BASE}/api/buses?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch buses');
            return res.json();
        },

    });

    // --- Add data fetch for operators and stations (provinces) ---
    const { data: operatorsData, isLoading: operatorsLoading } = useQuery({
        queryKey: ['operators'],
        queryFn: async () => {
            // load local JSON from public folder
            const res = await fetch('/nhaxekhach.json');
            if (!res.ok) throw new Error('Failed to load operators (local json)');
            return res.json();
        },
    });

    const { data: provincesData, isLoading: provincesLoading } = useQuery({
        queryKey: ['provinces_with_stations'],
        queryFn: async () => {
            // load local JSON from public folder
            const res = await fetch('/cac_ben_xe_bus_sau_sat_nhap.json');
            if (!res.ok) throw new Error('Failed to load stations (local json)');
            return res.json();
        },
    });
    // expose loaded provinces to module-scoped helpers so they can read prov.name as city
    useEffect(() => {
        if (typeof globalThis !== 'undefined') {
            (globalThis as any).__PROVINCES_DATA = provincesData;
        }
    }, [provincesData]);

    // --- Stronger validation ---
    // const validateForm = (data: BusFormData, fieldsToValidate?: string[]): Record<string, string> => {
    //     const errors: Record<string, string> = {};

    //     const shouldValidate = (field: string) => !fieldsToValidate || fieldsToValidate.includes(field);



    //     // busCode: required, uppercase alnum/_- 3-12 chars
    //     if (shouldValidate('busCode')) {
    //         if (!data.busCode || !data.busCode.trim()) {
    //             errors.busCode = "Bạn phải nhập mã tuyến xe";
    //         } else {
    //             const code = data.busCode.trim().toUpperCase();
    //             const re = /^[A-Z0-9_-]{3,12}$/;
    //             if (!re.test(code)) errors.busCode = "Mã tuyến không hợp lệ (3-12 ký tự A-Z, 0-9, _ hoặc -)";
    //         }
    //     }

    //     // operator: must exist in loaded operators (if available)
    //     if (shouldValidate('operatorId')) {
    //         if (!data.operatorId) {
    //             errors.operatorId = "Bạn phải chọn nhà xe";
    //         } else if (operatorsData && Array.isArray(operatorsData)) {
    //             const foundOp = operatorsData.find((o: any) => o.id === data.operatorId);
    //             if (!foundOp) errors.operatorId = "Nhà xe không tồn tại";
    //         }
    //     }

    //     // routeFrom / routeTo: required and must map to a station
    //     if (shouldValidate('routeFrom')) {
    //         if (!data.routeFrom) {
    //             errors.routeFrom = "Bạn phải chọn điểm đi";
    //         } else {
    //             const parsedFrom = parseRouteValue(data.routeFrom);
    //             if (!parsedFrom || !parsedFrom.name) errors.routeFrom = "Điểm đi không hợp lệ";
    //         }
    //     }
    //     if (shouldValidate('routeTo')) {
    //         if (!data.routeTo) {
    //             errors.routeTo = "Bạn phải chọn điểm đến";
    //         } else {
    //             const parsedTo = parseRouteValue(data.routeTo);
    //             if (!parsedTo || !parsedTo.name) errors.routeTo = "Điểm đến không hợp lệ";
    //         }
    //         // Ensure they are different
    //         if (data.routeFrom && data.routeTo && data.routeFrom === data.routeTo) {
    //             errors.routeTo = "Điểm đến phải khác điểm đi";
    //         }
    //     }

    //     // departureDates: require at least one, each valid and not in past
    //     if (shouldValidate('departureDates') || shouldValidate('departureAt')) {
    //         const now = new Date();
    //         if (!Array.isArray(data.departureDates) || data.departureDates.length === 0) {
    //             errors.departureAt = "Bạn phải chọn ít nhất một ngày khởi hành";
    //         } else {
    //             const seen = new Set<string>();
    //             for (let i = 0; i < data.departureDates.length; i++) {
    //                 const d = data.departureDates[i];
    //                 if (!d || isNaN(new Date(d).getTime())) {
    //                     errors[`departureDates_${i}`] = `Ngày khởi hành thứ ${i + 1} không hợp lệ`;
    //                 } else {
    //                     const dt = new Date(d);
    //                     if (dt < now) {
    //                         errors[`departureDates_${i}`] = `Ngày khởi hành thứ ${i + 1} không được ở quá khứ`;
    //                     }
    //                     const key = dt.toISOString();
    //                     if (seen.has(key)) {
    //                         errors[`departureDates_${i}`] = `Ngày khởi hành trùng lặp`;
    //                     }
    //                     seen.add(key);
    //                 }
    //             }
    //         }
    //     }

    //     // arrivalAt validation: must be valid and after earliest departure
    //     if (shouldValidate('arrivalAt') || shouldValidate('arrivalDates')) {
    //         if (!data.arrivalAt) {
    //             errors.arrivalAt = "Bạn phải chọn giờ đến";
    //         } else if (isNaN(new Date(data.arrivalAt).getTime())) {
    //             errors.arrivalAt = "Giờ đến không hợp lệ";
    //         } else {
    //             const earliest = Array.isArray(data.departureDates) && data.departureDates.length ? new Date(data.departureDates.slice().sort()[0]) : (data.departureAt ? new Date(data.departureAt) : null);
    //             if (earliest && new Date(data.arrivalAt) <= earliest) {
    //                 errors.arrivalAt = "Giờ đến phải sau giờ xuất phát (với tất cả ngày khởi hành)";
    //             }
    //         }
    //     }

    //     // numeric checks
    //     if (shouldValidate('adultPrice') || shouldValidate('price')) {
    //         if (typeof data.adultPrice !== 'number' || isNaN(data.adultPrice) || data.adultPrice <= 0) {
    //             errors.adultPrice = "Giá vé phải là số lớn hơn 0";
    //         }
    //     }
    //     if (shouldValidate('seatsTotal')) {
    //         if (!Number.isInteger(data.seatsTotal) || data.seatsTotal <= 0) {
    //             errors.seatsTotal = "Chọn loại xe để hiện thị tổng số ghế nhé ";
    //         }
    //     }
    //     if (shouldValidate('seatsAvailable')) {
    //         if (!Number.isInteger(data.seatsAvailable) || data.seatsAvailable < 0) {
    //             errors.seatsAvailable = "Số ghế có sẵn phải là số nguyên không âm";
    //         } else if (data.seatsAvailable > data.seatsTotal) {
    //             errors.seatsAvailable = "Số ghế có sẵn không được lớn hơn tổng số ghế";
    //         }
    //     }

    //     // busType must have at least one entry
    //     if (shouldValidate('busType')) {
    //         if (!Array.isArray(data.busType) || data.busType.length === 0) {
    //             errors.busType = "Bạn phải chọn ít nhất một loại xe";
    //         }
    //     }

    //     // No strict requirement for amenities (checkboxes) — optional

    //     // arrivalDates: if present, must pair with departures and be after each corresponding departure
    //     if (shouldValidate('arrivalDates') || shouldValidate('arrivalAt')) {
    //         if (Array.isArray(data.arrivalDates) && data.arrivalDates.length > 0) {
    //             for (let i = 0; i < (data.departureDates || []).length; i++) {
    //                 const dep = data.departureDates?.[i];
    //                 const arr = data.arrivalDates?.[i];
    //                 if (!arr || isNaN(new Date(arr).getTime())) {
    //                     errors[`arrivalDates_${i}`] = `Giờ đến thứ ${i + 1} không hợp lệ`;
    //                 } else if (dep && !isNaN(new Date(dep).getTime())) {
    //                     if (new Date(arr) <= new Date(dep)) {
    //                         errors[`arrivalDates_${i}`] = `Giờ đến thứ ${i + 1} phải sau giờ xuất phát tương ứng`;
    //                     }
    //                 }
    //             }
    //         } else {
    //             // fallback to single arrivalAt check (existing)
    //             if (!data.arrivalAt) {
    //                 errors.arrivalAt = "Bạn phải chọn giờ đến";
    //             } else if (isNaN(new Date(data.arrivalAt).getTime())) {
    //                 errors.arrivalAt = "Giờ đến không hợp lệ";
    //             } else {
    //                 const earliest = Array.isArray(data.departureDates) && data.departureDates.length ? new Date(data.departureDates.slice().sort()[0]) : (data.departureAt ? new Date(data.departureAt) : null);
    //                 if (earliest && new Date(data.arrivalAt) <= earliest) {
    //                     errors.arrivalAt = "Giờ đến phải sau giờ xuất phát (với tất cả ngày khởi hành)";
    //                 }
    //             }
    //         }
    //     }

    //     return errors;
    // };
    // Form validation
    const validateForm = useCallback((data: BusFormData, modalMode: string, originalDepartureDates: string[] = [], changedFields?: string[]): Record<string, string> => {
        const errors: Record<string, string> = {};

        // Chỉ validate nếu changedFields không được cung cấp hoặc trường này trong changedFields (chỉ cho edit)
        const shouldValidate = (field: string) => modalMode === "edit" && (!changedFields || changedFields.includes(field));

        // Thêm check: Nếu edit, có bookings, và departureDates thay đổi -> block
        if (modalMode === "edit" && hasBookings && originalDepartureDates.length > 0) {
            const currentDeps = Array.isArray(data.departureDates) ? data.departureDates : (data.departureAt ? [data.departureAt] : []);
            if (JSON.stringify(originalDepartureDates) !== JSON.stringify(currentDeps)) {
                errors.departureAt = "Không thể thay đổi ngày khởi hành vì đã có người đặt chỗ. ";
            }
        }

        // Cho create: luôn validate tất cả required fields, không dùng shouldValidate
        if (modalMode === "create") {
            // busCode: bỏ validate vì tự động tạo
            // if (!data.busCode || !data.busCode.trim()) {
            //     errors.busCode = "Bạn phải nhập mã tuyến xe";
            // } else {
            //     const code = data.busCode.trim().toUpperCase();
            //     const re = /^[A-Z0-9_-]{3,12}$/;
            //     if (!re.test(code)) errors.busCode = "Mã tuyến không hợp lệ (3-12 ký tự A-Z, 0-9, _ hoặc -)";
            // }

            if (!data.operatorId) {
                errors.operatorId = "Bạn phải chọn nhà xe";
            } else if (operatorsData && Array.isArray(operatorsData)) {
                const foundOp = operatorsData.find((o: any) => o.id === data.operatorId);
                if (!foundOp) errors.operatorId = "Nhà xe không tồn tại";
            }

            if (!data.routeFrom || !data.routeFrom.trim()) {
                errors.routeFrom = "Bạn phải chọn điểm đi";
            } else {
                const parsedFrom = parseRouteValue(data.routeFrom);
                if (!parsedFrom || !parsedFrom.name || !parsedFrom.code) errors.routeFrom = "Điểm đi không hợp lệ";
            }

            if (!data.routeTo || !data.routeTo.trim()) {
                errors.routeTo = "Bạn phải chọn điểm đến";
            } else {
                const parsedTo = parseRouteValue(data.routeTo);
                if (!parsedTo || !parsedTo.name || !parsedTo.code) errors.routeTo = "Điểm đến không hợp lệ";
            }

            if (data.routeFrom && data.routeTo && data.routeFrom === data.routeTo) {
                errors.routeTo = "Điểm đến phải khác điểm đi";
            }

            const now = new Date();
            if (!Array.isArray(data.departureDates) || data.departureDates.length === 0) {
                errors.departureAt = "Bạn phải chọn ít nhất một ngày khởi hành";
            } else {
                const seen = new Set<string>();
                for (let i = 0; i < data.departureDates.length; i++) {
                    const d = data.departureDates[i];
                    const dt = parseVNLocalString(d);
                    if (!dt || isNaN(dt.getTime())) {
                        errors[`departureDates_${i}`] = `Ngày khởi hành thứ ${i + 1} không hợp lệ`;
                    } else {
                        if (dt < now) {
                            errors[`departureDates_${i}`] = `Ngày khởi hành thứ ${i + 1} không được ở quá khứ`;
                        }
                        const key = dt.toISOString();
                        if (seen.has(key)) {
                            errors[`departureDates_${i}`] = `Ngày khởi hành trùng lặp`;
                        }
                        seen.add(key);
                    }
                }
            }

            const arrDate = parseVNLocalString(data.arrivalAt);
            if (!arrDate || isNaN(arrDate.getTime())) {
                errors.arrivalAt = "Giờ đến không hợp lệ";
            } else {
                const earliestDep = Array.isArray(data.departureDates) && data.departureDates.length ? parseVNLocalString(data.departureDates.slice().sort()[0]) : (data.departureAt ? parseVNLocalString(data.departureAt) : null);
                if (earliestDep && arrDate <= earliestDep) {
                    errors.arrivalAt = "Giờ đến phải sau giờ xuất phát (với tất cả ngày khởi hành)";
                }
            }

            if (typeof data.adultPrice !== 'number' || isNaN(data.adultPrice) || data.adultPrice <= 0) {
                errors.adultPrice = "Giá vé người lớn không được để trống và phải là số lớn hơn 0";
            }

            if (typeof data.childPrice !== 'number' || isNaN(data.childPrice) || data.childPrice <= 0) {
                errors.childPrice = "Giá vé trẻ em không được để trống và phải là số lớn hơn 0";
            }
            if (typeof data.childPrice === 'number' && data.childPrice > data.adultPrice) {
                errors.childPrice = "Giá trẻ em không được lớn hơn giá người lớn";
            }

            if (!Number.isInteger(data.seatsTotal) || data.seatsTotal <= 0) {
                errors.seatsTotal = "Chọn loại xe để hiện thị tổng số ghế nhé ";
            }

            if (!Number.isInteger(data.seatsAvailable) || data.seatsAvailable < 0) {
                errors.seatsAvailable = "Số ghế có sẵn phải là số nguyên không âm";
            }

            if (data.seatsAvailable > data.seatsTotal) {
                errors.seatsAvailable = "Số ghế có sẵn không được lớn hơn tổng số ghế";
            }

            if (!Array.isArray(data.busType) || data.busType.length === 0) {
                errors.busType = "Bạn phải chọn ít nhất một loại xe";
            }

            // arrivalDates: if present, must pair with departures and be after each corresponding departure
            if (Array.isArray(data.arrivalDates) && data.arrivalDates.length > 0) {
                for (let i = 0; i < (data.departureDates || []).length; i++) {
                    const dep = data.departureDates?.[i];
                    const arr = data.arrivalDates?.[i];
                    const depDate = parseVNLocalString(dep);
                    const arrDate = parseVNLocalString(arr);
                    if (!arrDate || isNaN(arrDate.getTime())) {
                        errors[`arrivalDates_${i}`] = `Giờ đến thứ ${i + 1} không hợp lệ`;
                    } else if (depDate && arrDate <= depDate) {
                        errors[`arrivalDates_${i}`] = `Giờ đến thứ ${i + 1} phải sau giờ xuất phát tương ứng`;
                    }
                }
            }
        } else {
            // Cho edit: dùng shouldValidate (chỉ validate changed fields)
            if (shouldValidate('busCode')) {
                if (!data.busCode || !data.busCode.trim()) {
                    errors.busCode = "Bạn phải nhập mã tuyến xe";
                } else {
                    const code = data.busCode.trim().toUpperCase();
                    const re = /^[A-Z0-9_-]{3,12}$/;
                    if (!re.test(code)) errors.busCode = "Mã tuyến không hợp lệ (3-12 ký tự A-Z, 0-9, _ hoặc -)";
                }
            }

            if (shouldValidate('operatorId')) {
                if (!data.operatorId) {
                    errors.operatorId = "Bạn phải chọn nhà xe";
                } else if (operatorsData && Array.isArray(operatorsData)) {
                    const foundOp = operatorsData.find((o: any) => o.id === data.operatorId);
                    if (!foundOp) errors.operatorId = "Nhà xe không tồn tại";
                }
            }

            // routeFrom / routeTo: required and must map to a station
            // Validate cả hai nếu một trong hai thay đổi (do check phụ thuộc)
            const routeChanged = changedFields && (changedFields.includes('routeFrom') || changedFields.includes('routeTo'));
            if (shouldValidate('routeFrom') || routeChanged) {
                if (!data.routeFrom || !data.routeFrom.trim()) {
                    errors.routeFrom = "Bạn phải chọn điểm đi";
                } else {
                    const parsedFrom = parseRouteValue(data.routeFrom);
                    if (!parsedFrom || !parsedFrom.name || !parsedFrom.code) errors.routeFrom = "Điểm đi không hợp lệ";
                }
            }
            if (shouldValidate('routeTo') || routeChanged) {
                if (!data.routeTo || !data.routeTo.trim()) {
                    errors.routeTo = "Bạn phải chọn điểm đến";
                } else {
                    const parsedTo = parseRouteValue(data.routeTo);
                    if (!parsedTo || !parsedTo.name || !parsedTo.code) errors.routeTo = "Điểm đến không hợp lệ";
                }
                // Ensure they are different (chỉ check nếu cả hai được validate)
                if (data.routeFrom && data.routeTo && data.routeFrom === data.routeTo) {
                    errors.routeTo = "Điểm đến phải khác điểm đi";
                }
            }

            // departureDates: require at least one, each valid and not in past (chỉ nếu thay đổi)
            if (shouldValidate('departureDates')) {
                const now = new Date();
                if (!Array.isArray(data.departureDates) || data.departureDates.length === 0) {
                    errors.departureAt = "Bạn phải chọn ít nhất một ngày khởi hành";
                } else {
                    const seen = new Set<string>();
                    for (let i = 0; i < data.departureDates.length; i++) {
                        const d = data.departureDates[i];
                        const dt = parseVNLocalString(d);
                        if (!dt || isNaN(dt.getTime())) {
                            errors[`departureDates_${i}`] = `Ngày khởi hành thứ ${i + 1} không hợp lệ`;
                        } else {
                            // Chỉ check ngày quá khứ nếu là create hoặc ngày đã thay đổi
                            const isChanged = modalMode === "create" || !originalDepartureDates[i] || originalDepartureDates[i] !== d;
                            if (isChanged && dt < now) {
                                errors[`departureDates_${i}`] = `Ngày khởi hành thứ ${i + 1} không được ở quá khứ`;
                            }
                            const key = dt.toISOString();
                            if (seen.has(key)) {
                                errors[`departureDates_${i}`] = `Ngày khởi hành trùng lặp`;
                            }
                            seen.add(key);
                        }
                    }
                }
            }

            // arrivalAt validation: must be valid and after earliest departure
            if (shouldValidate('arrivalAt') || shouldValidate('arrivalDates')) {
                const arrDate = parseVNLocalString(data.arrivalAt);
                if (!arrDate || isNaN(arrDate.getTime())) {
                    errors.arrivalAt = "Giờ đến không hợp lệ";
                } else {
                    const earliestDep = Array.isArray(data.departureDates) && data.departureDates.length ? parseVNLocalString(data.departureDates.slice().sort()[0]) : (data.departureAt ? parseVNLocalString(data.departureAt) : null);
                    if (earliestDep && arrDate <= earliestDep) {
                        errors.arrivalAt = "Giờ đến phải sau giờ xuất phát (với tất cả ngày khởi hành)";
                    }
                }
            }

            // numeric checks
            if (shouldValidate('adultPrice')) {
                if (typeof data.adultPrice !== 'number' || isNaN(data.adultPrice) || data.adultPrice <= 0) {
                    errors.adultPrice = "Giá vé người lớn phải là số lớn hơn 0";
                }
            }
            if (shouldValidate('childPrice')) {
                if (typeof data.childPrice !== 'number' || isNaN(data.childPrice) || data.childPrice <= 0) {
                    errors.childPrice = "Giá vé trẻ em phải là số lớn hơn 0";
                }
                if (typeof data.childPrice === 'number' && data.childPrice > data.adultPrice) {
                    errors.childPrice = "Giá trẻ em không được lớn hơn giá người lớn";
                }
            }
            if (shouldValidate('seatsTotal')) {
                if (!Number.isInteger(data.seatsTotal) || data.seatsTotal <= 0) {
                    errors.seatsTotal = "Chọn loại xe để hiện thị tổng số ghế nhé ";
                }
            }
            if (shouldValidate('seatsAvailable')) {
                if (!Number.isInteger(data.seatsAvailable) || data.seatsAvailable < 0) {
                    errors.seatsAvailable = "Số ghế có sẵn phải là số nguyên không âm";
                } else if (data.seatsAvailable > data.seatsTotal) {
                    errors.seatsAvailable = "Số ghế có sẵn không được lớn hơn tổng số ghế";
                }
            }

            // busType must have at least one entry
            if (shouldValidate('busType')) {
                if (!Array.isArray(data.busType) || data.busType.length === 0) {
                    errors.busType = "Bạn phải chọn ít nhất một loại xe";
                }
            }

            // arrivalDates: if present, must pair with departures and be after each corresponding departure
            if (shouldValidate('arrivalDates') || shouldValidate('arrivalAt')) {
                if (Array.isArray(data.arrivalDates) && data.arrivalDates.length > 0) {
                    for (let i = 0; i < (data.departureDates || []).length; i++) {
                        const dep = data.departureDates?.[i];
                        const arr = data.arrivalDates?.[i];
                        const depDate = parseVNLocalString(dep);
                        const arrDate = parseVNLocalString(arr);
                        if (!arrDate || isNaN(arrDate.getTime())) {
                            errors[`arrivalDates_${i}`] = `Giờ đến thứ ${i + 1} không hợp lệ`;
                        } else if (depDate && arrDate <= depDate) {
                            errors[`arrivalDates_${i}`] = `Giờ đến thứ ${i + 1} phải sau giờ xuất phát tương ứng`;
                        }
                    }
                } else {
                    // fallback to single arrivalAt check (existing)
                    const arrDate = parseVNLocalString(data.arrivalAt);
                    if (!arrDate || isNaN(arrDate.getTime())) {
                        errors.arrivalAt = "Giờ đến không hợp lệ";
                    } else {
                        const earliestDep = Array.isArray(data.departureDates) && data.departureDates.length ? parseVNLocalString(data.departureDates.slice().sort()[0]) : (data.departureAt ? parseVNLocalString(data.departureAt) : null);
                        if (earliestDep && arrDate <= earliestDep) {
                            errors.arrivalAt = "Giờ đến phải sau giờ xuất phát (với tất cả ngày khởi hành)";
                        }
                    }
                }
            }
        }

        return errors;
    }, []);
    useEffect(() => {
        const errors = validateForm(formData, modalMode, originalDepartureDates);
        setFormErrors(errors);
    }, [formData, modalMode, originalDepartureDates, validateForm]);

    // --- New: fetch vehicle categories (loaixe) ---
    const { data: loaixeData, isLoading: loaixeLoading } = useQuery({
        queryKey: ['loaixe'],
        queryFn: async () => {
            // load local JSON from public folder
            const res = await fetch('/dsloaixevexere.json');
            if (!res.ok) throw new Error('Failed to load vehicle types (local json)');
            return res.json();
        },
    });

    // Create bus mutation -> POST /api/buses
    const createBusMutation = useMutation({
        mutationFn: async (data: BusFormData) => {
            const payload: any = { ...data };
            // operatorId -> create operator object with minimal info (frontend keeps mockOperators)
            const op = (operatorsData || mockOperators).find((o: any) => o.id === data.operatorId);
            if (op) payload.operator = { id: op.id, name: op.name, logo: (op.logo || '/placeholder.svg'), code: (op.code || op.short_name || '') };
            const parsedFrom = parseRouteValue(data.routeFrom);
            if (parsedFrom) payload.routeFrom = parsedFrom;
            else payload.routeFrom = mockStations.find(s => s.code === data.routeFrom) || { code: data.routeFrom };

            const parsedTo = parseRouteValue(data.routeTo);
            if (parsedTo) payload.routeTo = parsedTo;
            else payload.routeTo = mockStations.find(s => s.code === data.routeTo) || { code: data.routeTo };

            // --- New: set departureDates array (normalize to ISO/Z) ---
            payload.departureDates = (data as any).departureDates && Array.isArray((data as any).departureDates)
                ? (data as any).departureDates.map((s: string) => localToIso(s))
                : ((data as any).departureAt ? [localToIso((data as any).departureAt)] : []);
            // --- New: normalize arrivalDates (ISO/Z) ---
            payload.arrivalDates = (data as any).arrivalDates && Array.isArray((data as any).arrivalDates)
                ? (data as any).arrivalDates.map((s: string) => localToIso(s))
                : ((data as any).arrivalAt ? [localToIso((data as any).arrivalAt)] : []);

            // compute duration from first pair when present
            if (payload.departureDates.length && payload.arrivalDates.length) {
                payload.duration = calculateDuration(payload.departureDates[0], payload.arrivalDates[0]);
            }

            // Important: DO NOT send scalar departureAt/arrivalAt to backend anymore.
            // Remove them if present to avoid duplication.
            delete payload.departureAt;
            delete payload.arrivalAt;

            const subtype = getAllSubtypes(loaixeData).find((s: any) => s.id === selectedSubtypeId);
            if (subtype) {
                payload.busType = [subtype.name];
                // set total seats from seat_capacity (user wanted seat_capacity => Tổng số ghế)
                if (typeof subtype.seat_capacity === 'number') payload.seatsTotal = subtype.seat_capacity;
            }
            // set amenities string from selected checkboxes
            payload.amenities = amenitiesSelected.length ? amenitiesSelected.join(', ') : (payload.amenities || '');
            payload.seatMap = seatMap && seatMap.length ? seatMap : undefined;

            // DEBUG: log payload so we can inspect what will be sent when creating a bus
            console.log('[Buses] createBus payload (arrays only):', payload);

            // convert price fields names for backend
            if (typeof payload.adultPrice !== 'undefined') payload.adultPrice = Number(payload.adultPrice);
            if (typeof payload.childPrice !== 'undefined') payload.childPrice = Number(payload.childPrice);
            // remove legacy price if present
            delete payload.price;

            const res = await fetch(`${API_BASE}/api/buses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                throw new Error(j.error || 'Failed to create');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['buses'] });
            setModalOpen(false);
            resetForm();
            toast({ title: "Thêm tuyến xe thành công", description: "Tuyến xe mới đã được thêm vào hệ thống" });
        },
        onError: (error: any) => {
            toast({ title: "Lỗi khi thêm tuyến xe", description: error.message, variant: "destructive" });
        }
    });

    // Update bus mutation -> PUT /api/buses/:id
    const updateBusMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<BusFormData> }) => {
            const payload: any = { ...data }; // Bắt đầu với tất cả data

            // So sánh và chỉ gửi các trường đã thay đổi
            if (originalBus) {
                const changedFields: string[] = [];
                Object.keys(data).forEach(key => {
                    const originalValue = (originalBus as any)[key];
                    const newValue = (data as any)[key];
                    // So sánh sâu (bao gồm arrays/objects)
                    if (JSON.stringify(originalValue) !== JSON.stringify(newValue)) {
                        changedFields.push(key);
                    }
                });
                console.log('[Buses] Changed fields:', changedFields); // Log để kiểm tra
                // Chỉ giữ lại các trường đã thay đổi
                const partialPayload: any = {};
                changedFields.forEach(key => partialPayload[key] = payload[key]);
                // Ghi đè payload với partialPayload
                Object.keys(payload).forEach(key => delete payload[key]); // Xóa tất cả
                Object.assign(payload, partialPayload); // Chỉ thêm changed fields
            }

            // Xử lý payload như cũ (operator, route, dates, etc.) - nhưng chỉ cho các trường đã thay đổi
            if ((data as any).operatorId && payload.operatorId) {  // Chỉ xử lý nếu trường này có trong payload
                const op = (operatorsData || mockOperators).find((o: any) => o.id === (data as any).operatorId);
                if (op) payload.operator = { id: op.id, name: op.name, logo: (op.logo || '/placeholder.svg'), code: (op.code || op.short_name || '') };
            }
            if ((data as any).routeFrom && payload.routeFrom) {
                const parsedFromUp = parseRouteValue((data as any).routeFrom);
                payload.routeFrom = parsedFromUp || mockStations.find(s => s.code === (data as any).routeFrom) || { code: (data as any).routeFrom };
            }
            if ((data as any).routeTo && payload.routeTo) {
                const parsedToUp = parseRouteValue((data as any).routeTo);
                payload.routeTo = parsedToUp || mockStations.find(s => s.code === (data as any).routeTo) || { code: (data as any).routeTo };
            }

            // Normalize departureDates/arrivalDates to ISO/Z - chỉ nếu chúng có trong payload
            if ((data as any).departureDates && Array.isArray((data as any).departureDates) && payload.departureDates) {
                payload.departureDates = (data as any).departureDates.map((s: string) => localToIso(s));
            }
            if ((data as any).arrivalDates && Array.isArray((data as any).arrivalDates) && payload.arrivalDates) {
                payload.arrivalDates = (data as any).arrivalDates.map((s: string) => localToIso(s));
            }
            if ((data as any).departureAt && !(payload.departureDates && payload.departureDates.length) && payload.departureAt) {
                payload.departureDates = [localToIso((data as any).departureAt)];
            }
            if ((data as any).arrivalAt && !(payload.arrivalDates && payload.arrivalDates.length) && payload.arrivalAt) {
                payload.arrivalDates = [localToIso((data as any).arrivalAt)];
            }

            delete payload.departureAt;
            delete payload.arrivalAt;

            if (payload.departureDates && payload.departureDates.length && payload.arrivalDates && payload.arrivalDates.length) {
                payload.duration = calculateDuration(payload.departureDates[0], payload.arrivalDates[0]);
            }
            const allSubtypes = getAllSubtypes(loaixeData);
            let subtypeUpd;
            if (selectedSubtypeId) {
                subtypeUpd = allSubtypes.find((s: any) => s.id === selectedSubtypeId);
            } else {
                const firstTypeName = payload.busType && payload.busType[0];
                subtypeUpd = firstTypeName ? allSubtypes.find((s: any) => s.name === firstTypeName) : undefined;
            }
            if (subtypeUpd && payload.busType) {
                payload.busType = [subtypeUpd.name];
                if (typeof subtypeUpd.seat_capacity === 'number') payload.seatsTotal = subtypeUpd.seat_capacity;
            }
            if (amenitiesSelected && amenitiesSelected.length && payload.amenities) {
                payload.amenities = amenitiesSelected.join(', ');
            }
            payload.seatMap = seatMap && seatMap.length ? seatMap : undefined;

            if (typeof payload.adultPrice !== 'undefined' && payload.adultPrice !== null) payload.adultPrice = Number(payload.adultPrice);
            if (typeof payload.childPrice !== 'undefined' && payload.childPrice !== null) payload.childPrice = Number(payload.childPrice);
            delete payload.price;

            console.log('[Buses] updateBus payload (only changed fields):', JSON.stringify(payload, null, 2));

            const res = await fetch(`${API_BASE}/api/buses/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                throw new Error(j.error || 'Failed to update');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['buses'] });
            setModalOpen(false);
            resetForm();
            setOriginalBus(null); // Reset originalBus sau update
            toast({ title: "Cập nhật tuyến xe thành công", description: "Thông tin tuyến xe đã được cập nhật" });
        },
        onError: (error: any) => {
            toast({ title: "Lỗi khi cập nhật tuyến xe", description: error.message, variant: "destructive" });
        }
    });

    // Delete bus mutation -> DELETE /api/buses/:id
    const deleteBusMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`${API_BASE}/api/buses/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                throw new Error(j.error || 'Failed to delete');
            }
            return res.json();
        },
        onSuccess: (_, busId) => {
            queryClient.invalidateQueries({ queryKey: ['buses'] });
            setDeleteModalOpen(false);
            setBusToDelete(null);
            toast({
                title: "Đã xóa tuyến xe",
                description: `Tuyến xe đã được xóa thành công`,
            });
        },
        onError: (error: any) => {
            toast({ title: "Lỗi khi xóa tuyến xe", description: error.message, variant: "destructive" });
        }
    });

    // Bulk operations -> POST /api/buses/bulk
    const bulkActionMutation = useMutation({
        mutationFn: async ({ action, ids }: { action: string; ids: string[] }) => {
            const res = await fetch(`${API_BASE}/api/buses/bulk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, ids }),
            });
            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                throw new Error(j.error || 'Bulk action failed');
            }
            return res.json();
        },
        onSuccess: (_, { action, ids }) => {
            queryClient.invalidateQueries({ queryKey: ['buses'] });
            setSelectedBuses([]);
            const actionText = action === 'activate' ? 'kích hoạt' : action === 'cancel' ? 'hủy' : 'xóa';
            toast({ title: `Thực hiện thành công`, description: `Đã ${actionText} ${ids.length} tuyến xe` });
        },
        onError: (error: any) => {
            toast({ title: "Lỗi khi thực hiện thao tác", description: error.message, variant: "destructive" });
        }
    });

    // Normalize incoming bus documents: ensure `id` exists (use `_id` when returned by Mongo)
    const rawBuses = busesData?.data || [];
    const buses = Array.isArray(rawBuses) ? rawBuses.map((b: any) => {
        const id = b.id || b._id || (b._id ? String(b._id) : undefined);
        return {
            ...b,
            id,
            // ensure routeFrom/routeTo always exist to avoid undefined errors in UI/delete flow
            routeFrom: b.routeFrom || (b.route && b.route.from) || { code: b.routeFrom?.code || '', name: b.routeFrom?.name || '', city: b.routeFrom?.city || '' },
            routeTo: b.routeTo || (b.route && b.route.to) || { code: b.routeTo?.code || '', name: b.routeTo?.name || '', city: b.routeTo?.city || '' },
            // ensure operator always exist to avoid undefined errors in UI
            operator: b.operator || { id: '', name: '', logo: '/placeholder.svg', code: '' },
        };
    }) : [];
    const total = busesData?.pagination?.total || 0;
    // Thêm bộ lọc client-side để đảm bảo hoạt động
    const filteredBuses = buses.filter((bus) => {
        if (filters.operator !== "all" && bus.operator.id !== filters.operator) return false;
        if (filters.status !== "all" && bus.status !== filters.status) return false;
        if (searchQuery && !bus.busCode.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    


    const resetForm = () => {
        setFormData({
            busCode: "",
            operatorId: "",
            routeFrom: "",
            routeTo: "",
            departureAt: "",
            departureDates: [],
            arrivalDates: [],
            arrivalAt: "",
            duration: "",
            busType: ["Ghế ngồi"],
            adultPrice: 0,
            childPrice: 0,
            seatsTotal: 0,
            seatsAvailable: 0,
            amenities: "",
            status: "scheduled"
        });
        setFormErrors({});
        setIsFormDirty(false);
        setSelectedSubtypeId("");
        setAmenitiesSelected([]);
        // also clear recurrence applied flag when form resets/closed
        setRecurrenceApplied(false);
    };

    const handleFormChange = (field: keyof BusFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setIsFormDirty(true);

        if (formErrors[field]) {
            setFormErrors(prev => ({ ...prev, [field]: "" }));
        }
    };

    const calculateDuration = (departure: string, arrival: string): string => {
        if (!departure || !arrival) return "";

        const depTime = new Date(departure);
        const arrTime = new Date(arrival);
        const diffMs = arrTime.getTime() - depTime.getTime();

        if (diffMs <= 0) return "";

        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        return `${hours}h ${minutes}m`;
    };

    // helper: current local datetime suitable for <input type="datetime-local" />
    const isoLocalNow = () => {
        const d = new Date();
        // convert to local ISO without seconds: YYYY-MM-DDTHH:mm
        const tzOffset = d.getTimezoneOffset() * 60000;
        return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
    };
    // Thêm hàm lấy ngày mai dưới dạng local string
    const getTomorrowLocal = () => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return toLocalInput(d);
    };

    // Helper: build seat map from a subtype.layout
    const buildSeatMapFromLayout = (layout: any) => {
        if (!layout || !Array.isArray(layout.rows)) return [];
        const seats: any[] = [];
        for (const row of layout.rows) {
            if (!Array.isArray(row.seats)) continue;
            for (const s of row.seats) {
                seats.push({
                    seatId: s.seat_id || s.id || `${row.row_index}-${(s.label || s.seat_id)}`,
                    label: s.label || s.seat_id || '',
                    type: s.type || 'seat',
                    pos: s.pos || null,
                    status: 'available' // initial
                });
            }
        }
        return seats;
    };

    // New: generate seatMap and mark N random seats as booked (bookedCount)
    const generateSeatMapWithBooked = (layout: any, bookedCount: number) => {
        const map = buildSeatMapFromLayout(layout);
        if (!map.length) return map;
        const availableIndices = map.map((_, i) => i);
        // shuffle indices
        for (let i = availableIndices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [availableIndices[i], availableIndices[j]] = [availableIndices[j], availableIndices[i]];
        }
        const toBook = Math.min(bookedCount, map.length);
        for (let k = 0; k < toBook; k++) {
            map[availableIndices[k]].status = 'booked';
        }
        return map;
    };

    const columns: Column[] = [
        {
            key: "busCode",
            title: "Mã tuyến",
            sortable: true,
            render: (value, record: BusRoute) => (
                <div>
                    <div className="font-mono font-medium">{value}</div>
                    <div className="text-sm text-gray-500">{record.id}</div>
                </div>
            ),
        },
        {
            key: "operator",
            title: "Nhà xe",
            render: (value, record: BusRoute) => {
                // Thêm kiểm tra an toàn để tránh lỗi nếu operator undefined
                const op = value || { name: '', code: '' };
                return (
                    <div className="flex items-center space-x-2">
                        <div>
                            <div className="font-medium">{op.name}</div>
                            <div className="text-sm text-gray-500">{op.code}</div>
                        </div>
                    </div>
                );
            },
        },
        {
            key: "route",
            title: "Tuyến đường",
            render: (_, record: BusRoute) => (
                <div className="text-sm">
                    <div className="flex items-center space-x-2 font-medium">
                        <span className="font-mono">{record.routeFrom.code}</span>
                        <Bus className="w-4 h-4 text-gray-400" />
                        <span className="font-mono">{record.routeTo.code}</span>
                    </div>
                    <div className="text-gray-500">
                        {record.routeFrom.city} → {record.routeTo.city}
                    </div>
                </div>
            ),
        },
        // {
        //     key: "schedule",
        //     title: "Lịch trình",
        //     sortable: true,
        //     render: (_, record: BusRoute) => (
        //         <div className="text-sm">
        //             <div className="flex items-center space-x-1">
        //                 <Clock className="w-3 h-3 text-gray-400" />
        //                 <span className="font-medium">
        //                     {new Date(record.departureAt).toLocaleTimeString('vi-VN', {
        //                         hour: '2-digit',
        //                         minute: '2-digit'
        //                     })}
        //                 </span>
        //                 <span className="text-gray-500">→</span>
        //                 <span>
        //                     {new Date(record.arrivalAt).toLocaleTimeString('vi-VN', {
        //                         hour: '2-digit',
        //                         minute: '2-digit'
        //                     })}
        //                 </span>
        //             </div>
        //             <div className="text-gray-500">
        //                 {new Date(record.departureAt).toLocaleDateString('vi-VN')}
        //             </div>
        //             <div className="text-xs text-gray-400">{record.duration}</div>
        //         </div>
        //     ),
        // },
        {
            key: "busType",
            title: "Loại xe",
            render: (value: string[]) => (
                <div className="space-y-1">
                    {value.map((type, index) => (
                        <Badge
                            key={index}
                            variant="outline"
                            className="text-xs block w-fit"
                        >
                            {type}
                        </Badge>
                    ))}
                </div>
            ),
        },
        {
            key: "price",
            title: "Giá vé",
            sortable: true,
            render: (_, record: BusRoute) => (
                <div className="flex flex-col">
                    <div className="flex items-center font-medium">
                        <DollarSign className="w-3 h-3 mr-1" />
                        Người lớn: {new Intl.NumberFormat('vi-VN').format(record.adultPrice || 0)} ₫
                    </div>
                    <div className="text-sm text-gray-500">
                        Trẻ em: {new Intl.NumberFormat('vi-VN').format(record.childPrice || 0)} ₫
                    </div>
                </div>
            ),
        },
        // {
        //     key: "seats",
        //     title: "Ghế",
        //     render: (_, record: BusRoute) => (
        //         <div className="text-sm">
        //             <div className="flex items-center">
        //                 <Users className="w-3 h-3 mr-1" />
        //                 <span className="font-medium">{record.seatsAvailable}</span>
        //                 <span className="text-gray-500">/{record.seatsTotal}</span>
        //             </div>
        //             <div className={`text-xs ${record.seatsAvailable <= record.seatsTotal * 0.2 ? 'text-red-600' :
        //                 record.seatsAvailable <= record.seatsTotal * 0.5 ? 'text-yellow-600' : 'text-green-600'
        //                 }`}>
        //                 {record.seatsAvailable} chỗ trống
        //             </div>
        //         </div>
        //     ),
        // },
        {
            key: "status",
            title: "Trạng thái",
            sortable: true,
            render: (value, record: BusRoute) => {
                const now = new Date();
                const depDates = Array.isArray((record as any).departureDates) && (record as any).departureDates.length
                    ? (record as any).departureDates.map((d: string) => new Date(d))
                    : (record.departureAt ? [new Date(record.departureAt)] : []);
                const allPast = depDates.every((d: any) => d < now);

                return (
                    <div className="flex items-center space-x-2">
                        <Badge className={
                            value === "scheduled" ? "bg-green-100 text-green-800 hover:bg-green-100" :
                                value === "cancelled" ? "bg-red-100 text-red-800 hover:bg-red-100" :
                                    value === "delayed" ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" :
                                        "bg-gray-100 text-gray-800 hover:bg-gray-100"
                        }>
                            {value === "scheduled" ? "Đã lên lịch" :
                                value === "cancelled" ? "Đã hủy" :
                                    value === "delayed" ? "Hoãn" : "Hoàn thành"}
                        </Badge>
                        {allPast && value === "scheduled" && (
                            <>
                                <Badge className="bg-red-600 text-white font-bold animate-pulse shadow-lg">Chuyến xe đã qua</Badge>  {/* Thêm animate-pulse và shadow để nổi bật */}
                                <Button
                                    size="sm"
                                    onClick={() => bulkActionMutation.mutate({ action: 'update_status_by_dates', ids: [record.id] })}
                                    disabled={bulkActionMutation.isPending}
                                    className="bg-red-500 hover:bg-red-600 text-white font-semibold shadow-md hover:shadow-lg transition-all"  // Màu đỏ nổi bật, thêm shadow và transition
                                >
                                    {bulkActionMutation.isPending ? "Đang cập nhật..." : "Cập nhật"}
                                </Button>
                            </>
                        )}
                    </div>
                );
            },
        },
    ];

    const handleView = (bus: BusRoute) => {
        setSelectedBus(bus);
        setModalMode("view");
        setModalOpen(true);
    };

    const handleEdit = (bus: BusRoute) => {
        setSelectedBus(bus);
        setOriginalBus(bus); // Lưu giá trị ban đầu để so sánh
        setOriginalDepartureDates(Array.isArray((bus as any).departureDates) && (bus as any).departureDates.length
            ? (bus as any).departureDates.map((d: string) => toVNLocalString(new Date(d))) // Thay toLocalInput bằng toVNLocalString
            : (bus.departureAt ? [toVNLocalString(new Date(bus.departureAt))] : [])); // Thay toLocalInput
        setFormData({
            busCode: bus.busCode,
            operatorId: bus.operator.id,
            routeFrom: formatRouteSelectValue(bus.routeFrom),
            routeTo: formatRouteSelectValue(bus.routeTo),
            departureAt: bus.departureAt ? toVNLocalString(new Date(bus.departureAt)) : "", // Thay toLocalInput
            departureDates: Array.isArray((bus as any).departureDates) && (bus as any).departureDates.length
                ? (bus as any).departureDates.map((d: string) => toVNLocalString(new Date(d))) // Thay toLocalInput
                : (bus.departureAt ? [toVNLocalString(new Date(bus.departureAt))] : []), // Thay toLocalInput
            arrivalDates: Array.isArray((bus as any).arrivalDates) && (bus as any).arrivalDates.length
                ? (bus as any).arrivalDates.map((d: string) => toVNLocalString(new Date(d))) // Thay toLocalInput
                : (bus.arrivalAt ? [toVNLocalString(new Date(bus.arrivalAt))] : []), // Thay toLocalInput
            arrivalAt: bus.arrivalAt ? toVNLocalString(new Date(bus.arrivalAt)) : "", // Thay toLocalInput
            duration: bus.duration,
            busType: bus.busType,
            adultPrice: (bus as any).adultPrice ?? (bus as any).price ?? 0,
            childPrice: (bus as any).childPrice ?? 0,
            seatsTotal: bus.seatsTotal,
            seatsAvailable: bus.seatsAvailable,
            amenities: bus.amenities || "",
            status: bus.status
        });
        setModalMode("edit");
        setModalOpen(true);
        setIsFormDirty(false);
        const existingTypeName = bus.busType && bus.busType[0];
        if (existingTypeName && Array.isArray(loaixeData)) {
            const found = getAllSubtypes(loaixeData).find((s: any) => s.name === existingTypeName);
            if (found) setSelectedSubtypeId(found.id);
        }
        setAmenitiesSelected(
            Array.isArray(bus.amenities)
                ? bus.amenities.map(s => String(s).trim()).filter(Boolean)
                : (bus.amenities || "").split(',').map(s => s.trim()).filter(Boolean)
        );

        setLoadingHasBookings(true); // Thêm: bắt đầu loading
        // Fetch slots để check bookings
        fetch(`${API_BASE}/api/buses/bus-slots/${bus.id}`)
            .then(res => res.json())
            .then(data => {
                console.log('Fetched bus-slots data:', data); // Giữ log
                const slots = data?.dateBookings || [];
                const hasAnyBookings = slots.some((slot: any) => {
                    const userBookings = (slot.logSeatBooked || []).filter((log: any) => {
                        const isUser = log.reservationId; // Chỉ cần reservationId (bỏ customerId)
                        const isActive = log.status === 'confirm' || log.status === 'confirmed';
                        const notCancelled = !log.cancelledAt || log.cancelledAt == null || log.cancelledAt === undefined;
                        console.log('Log entry:', log, 'isUser:', isUser, 'isActive:', isActive, 'notCancelled:', notCancelled); // Giữ debug
                        return isUser && isActive && notCancelled;
                    });
                    console.log('slot dateIso:', slot.dateIso, 'userBookings length:', userBookings.length); // Giữ log
                    return userBookings.length > 0;
                });
                console.log('hasAnyBookings:', hasAnyBookings); // Giữ log
                setHasBookings(hasAnyBookings);
            })
            .catch(err => {
                console.error('Error fetching slots:', err); // Đã có
                setHasBookings(false);
            })
            .finally(() => {
                setLoadingHasBookings(false); // Thêm: kết thúc loading
            });
    };

    const handleDelete = (bus: BusRoute) => {
        setBusToDelete(bus);
        setDeleteModalOpen(true);
    };

    const handleAdd = () => {
        // Log a template of the data that will be used for a new bus (use local object to avoid setState async)
        const templateNewBus = {
            busCode: "",
            operatorId: "",
            routeFrom: "",
            routeTo: "",
            departureAt: "",
            departureDates: [],
            arrivalAt: "",
            arrivalDates: [],
            duration: "",
            busType: ["Ghế ngồi"],
            price: 0,
            seatsTotal: 0,
            seatsAvailable: 0,
            amenities: "",
            status: "scheduled"
        };
        console.log('[Buses] handleAdd: opening create modal - templateNewBus:', templateNewBus);
        console.log('[Buses] handleAdd: selectedSubtypeId:', selectedSubtypeId, 'amenitiesSelected:', amenitiesSelected, 'seatMap:', seatMap);

        setSelectedBus(null);
        resetForm();
        setModalMode("create");
        setModalOpen(true);
        

        // Tự động tạo busCode ngẫu nhiên dựa trên thời gian hiện tại
        const generateBusCode = () => {
            const timestamp = Date.now().toString().slice(-6); // Lấy 6 số cuối của timestamp để giảm trùng lặp
            return 'BUS' + timestamp;
        };
        setFormData(prev => ({ ...prev, busCode: generateBusCode() }));
    };

    const handleSubmit = () => {
        let fieldsToValidate: string[] | undefined;
        const changedFields: string[] = [];
        if (modalMode === "edit" && originalBus) {
            // Calculate changed fields based on originalBus
            Object.keys(formData).forEach(key => {
                const originalValue = (originalBus as any)[key];
                const newValue = (formData as any)[key];
                if (JSON.stringify(originalValue) !== JSON.stringify(newValue)) {
                    changedFields.push(key);
                }
            });
            fieldsToValidate = changedFields;
            console.log('[handleSubmit] Changed fields:', changedFields);

            // If no changes, do not proceed with validation or submission
            if (changedFields.length === 0) {
                toast({ title: "Không có thay đổi", description: "Không có trường nào được thay đổi để cập nhật." });
                return;
            }
        }

        const errors = validateForm(formData, modalMode, originalDepartureDates, fieldsToValidate);
        setFormErrors(errors);

        if (Object.keys(errors).length > 0) {
            const errorMessages = Object.values(errors).filter(Boolean);
            toast({
                title: "Lỗi validation",
                description: errorMessages.length > 0 ? errorMessages.join('; ') : "Vui lòng kiểm tra lại thông tin nhập vào",
                variant: "destructive",
            });
            return;
        }

        // ensure formData.departureDates not empty when sending, and normalize to ISO/Z
        const dataToSend = { ...formData } as any;
        const depsRaw = (formData.departureDates && formData.departureDates.length) ? formData.departureDates : (formData.departureAt ? [formData.departureAt] : []);
        dataToSend.departureDates = depsRaw.filter(Boolean);

        // ensure arrivalDates are present and normalized
        const arrsRaw = (formData.arrivalDates && formData.arrivalDates.length) ? formData.arrivalDates : (formData.arrivalAt ? [formData.arrivalAt] : []);
        dataToSend.arrivalDates = arrsRaw.filter(Boolean);

        // Remove scalar fields to avoid duplication
        delete dataToSend.departureAt;
        delete dataToSend.arrivalAt;
        // ensure price mapping -> adultPrice/childPrice (backend expects adultPrice/childPrice)
        if (typeof dataToSend.adultPrice !== 'undefined') dataToSend.adultPrice = Number(dataToSend.adultPrice);
        if (typeof dataToSend.childPrice !== 'undefined') dataToSend.childPrice = Number(dataToSend.childPrice);
        delete dataToSend.price;

        // compute duration from first pair (if both present)
        if (dataToSend.departureDates.length && dataToSend.arrivalDates.length) {
            dataToSend.duration = calculateDuration(dataToSend.departureDates[0], dataToSend.arrivalDates[0]);
        }

        // Log the exact payload that will be sent to the server
        console.log('[Buses] handleSubmit -> dataToSend (arrays only):', JSON.stringify(dataToSend, null, 2));

        if (modalMode === "create") {
            createBusMutation.mutate(dataToSend);
        } else if (modalMode === "edit" && selectedBus) {
            updateBusMutation.mutate({ id: selectedBus.id, data: dataToSend });
        }
    };

    const confirmDelete = () => {
        if (!busToDelete) return;
        // ConfirmModal already forces typing "DELETE" or "FORCE_DELETE" when there are bookings.
        // Proceed with deletion when user confirms.
        deleteBusMutation.mutate(busToDelete.id);
    };
    // Immediately call DELETE /api/buses/:id (no confirm) and refresh list
    const handleForceDeleteApi = async (id: string) => {
        try {
            const res = await fetch(`${API_BASE}/api/buses/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                throw new Error(j.error || 'Failed to delete');
            }
            toast({ title: "Đã xóa tuyến xe", description: `ID: ${id}` });
            queryClient.invalidateQueries({ queryKey: ['buses'] });
        } catch (err: any) {
            toast({ title: "Lỗi khi xóa tuyến xe", description: err.message || String(err), variant: "destructive" });
        }
    };
    const bulkActions = [
        {
            label: "Kích hoạt",
            action: (keys: string[]) => {
                bulkActionMutation.mutate({ action: 'activate', ids: keys });
            },
            icon: <Eye className="w-4 h-4 mr-2" />,
        },
        {
            label: "Hủy tuyến",
            action: (keys: string[]) => {
                bulkActionMutation.mutate({ action: 'cancel', ids: keys });
            },
            icon: <Ban className="w-4 h-4 mr-2" />,
            variant: "secondary" as const,
        },
        // {
        //     label: "Xóa",
        //     action: (keys: string[]) => {
        //         bulkActionMutation.mutate({ action: 'delete', ids: keys });
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
        // {
        //     label: "Xóa",
        //     action: handleDelete,
        //     icon: <Trash2 className="mr-2 h-4 w-4" />,
        //     variant: "destructive" as const,
        // },
        // {
        //     label: "Xóa ngay",
        //     action: (bus: BusRoute) => handleForceDeleteApi(bus.id),
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
        if (!isFormDirty) return true;
        return createBusMutation.isPending || updateBusMutation.isPending;
    };
    const getStationLabel = (value: string, provincesDataParam?: any[], mockStationsParam?: any[]) => {
        if (!value) return "";
        const provinces = provincesDataParam || getGlobalProvinces();
        const mock = mockStationsParam || mockStations;

        // provCode||Station Name format
        const parts = String(value).split('||');
        if (parts.length === 2) {
            const provCode = parts[0];
            const stationName = parts[1];
            if (Array.isArray(provinces)) {
                const prov = provinces.find((p: any) => String(p.code) === String(provCode) || p.name === provCode);
                if (prov && Array.isArray(prov.bus_stations)) {
                    const st = prov.bus_stations.find((s: any) => s.name === stationName);
                    if (st) return `${st.name}${st.address ? ' - ' + st.address : ''}`;
                }
            }
            // fallback to mock stations by name
            const m = mock.find(s => s.name === stationName || s.code === stationName);
            if (m) return `${m.name}${m.address ? ' - ' + m.address : ''}`;
            return stationName;
        }

        // otherwise try find by code or name in mockStations or provinces
        const ms = mock.find(s => s.code === value || s.name === value);
        if (ms) return `${ms.name}${ms.address ? ' - ' + ms.address : ''}`;
        if (Array.isArray(provinces)) {
            for (const prov of provinces) {
                if (Array.isArray(prov.bus_stations)) {
                    const st = prov.bus_stations.find((s: any) => s.name === value || s.code === value);
                    if (st) return `${st.name}${st.address ? ' - ' + st.address : ''}`;
                }
            }
        }
        return String(value);
    };
    const { data: busSlotsData, isLoading: slotsLoading } = useQuery({
        queryKey: ['busSlots', selectedBus?.id],
        queryFn: async () => {
            if (!selectedBus?.id) return null;
            const res = await fetch(`${API_BASE}/api/buses/bus-slots/${selectedBus.id}`);
            if (!res.ok) throw new Error('Failed to fetch bus slots');
            return res.json();
        },
        enabled: modalOpen && modalMode === "view" && !!selectedBus?.id,
    });
    const renderBusForm = () => {
        if (modalMode === "view" && selectedBus) {
            // Render schedule using arrays (departureDates / arrivalDates) if available,
            // otherwise fall back to single departureAt/arrivalAt.
            const depArray: string[] = Array.isArray((selectedBus as any).departureDates) && (selectedBus as any).departureDates.length
                ? (selectedBus as any).departureDates
                : (selectedBus.departureAt ? [(selectedBus as any).departureAt] : []);
            const arrArray: string[] = Array.isArray((selectedBus as any).arrivalDates) && (selectedBus as any).arrivalDates.length
                ? (selectedBus as any).arrivalDates
                : (selectedBus.arrivalAt ? [(selectedBus as any).arrivalAt] : []);

            return (
                <div className="space-y-6" >
                    <div className="grid grid-cols-2 gap-6">
                        {/* <div className="space-y-4"> */}
                        <div className="space-y-4 " >

                            <div>
                                <Label className="text-sm font-medium text-gray-700">Mã tuyến xe</Label>
                                <p className="mt-1 font-mono text-lg font-bold">{selectedBus.busCode}</p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-700">Nhà xe</Label>
                                <div className="mt-1 flex items-center space-x-2">
                                    <img
                                        src={selectedBus.operator.logo}
                                        alt={selectedBus.operator.name}
                                        className="w-8 h-8 rounded"
                                    />
                                    <span className="font-medium">{selectedBus.operator.name}</span>
                                </div>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-700">Tuyến đường</Label>
                                <div className="mt-1 space-y-1">
                                    <div className="flex items-center space-x-2">
                                        <span className="font-mono font-bold">{selectedBus.routeFrom.code}</span>
                                        <Bus className="w-4 h-4 text-gray-400" />
                                        <span className="font-mono font-bold">{selectedBus.routeTo.code}</span>
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        {selectedBus.routeFrom.name} → {selectedBus.routeTo.name}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-gray-700">Giá vé</Label>
                                    <p className="mt-1 text-lg font-bold text-green-600">
                                        Người lớn: {new Intl.NumberFormat('vi-VN').format((selectedBus as any).adultPrice ?? (selectedBus as any).price ?? 0)} ₫
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Trẻ em: {new Intl.NumberFormat('vi-VN').format((selectedBus as any).childPrice ?? 0)} ₫
                                    </p>
                                </div>
                                {/* <div>
                                    <Label className="text-sm font-medium text-gray-700">Ghế ngồi</Label>
                                    <p className="mt-1">
                                        {selectedBus.seatsAvailable} / {selectedBus.seatsTotal} ghế còn trống
                                    </p>
                                </div> */}
                                <div>
                                    <Label className="text-sm font-medium text-gray-700">Loại xe</Label>
                                    <div className="mt-1 flex space-x-2">
                                        {selectedBus.busType.map((type, index) => (
                                            <Badge key={index} variant="outline">{type}</Badge>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-sm font-medium text-gray-700">Tiện ích</Label>
                                    <p className="mt-1 text-gray-900">{Array.isArray(selectedBus.amenities) ? selectedBus.amenities.join(', ') : selectedBus.amenities}</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4" style={{ height: '70vh', overflowY: 'auto' }}>
                            <div>
                                <Label className="text-sm font-medium text-gray-700">Lịch trình</Label>
                                <div className="mt-1 space-y-2">
                                    {depArray.length ? (
                                        depArray.map((dep, i) => {
                                            const arr = arrArray[i];
                                            const depDate = dep ? new Date(dep) : null;
                                            const arrDate = arr ? new Date(arr) : null;
                                            const duration = (dep && arr) ? calculateDuration(dep, arr) : (selectedBus.duration || "");

                                            // Trong renderBusForm, ngoài loop
                                            console.log('selectedBus.id:', selectedBus.id, 'busSlotsData:', busSlotsData);

                                            // Trong loop của depArray.map
                                            const dateIso = dep ? dep.split('T')[0] : null; // Thay đổi: dùng dep.split thay vì new Date().toISOString()
                                            const slotEntry = busSlotsData?.dateBookings?.find((d: any) => d.dateIso === dateIso);

                                            console.log(`Chuyến ${i + 1}, dep: ${dep}, dateIso: ${dateIso}, slotEntry found: ${!!slotEntry}`);

                                            let slotsAvailable = selectedBus.seatsAvailable;
                                            let slotsTotal = selectedBus.seatsTotal;
                                            if (slotEntry) {
                                                if (Array.isArray(slotEntry.seatmapFill)) {
                                                    const bookedCount = slotEntry.seatmapFill.filter((s: any) => s.status === 'booked').length;
                                                    slotsAvailable = (slotEntry.seatsTotal || selectedBus.seatsTotal) - bookedCount;
                                                    slotsTotal = slotEntry.seatsTotal || selectedBus.seatsTotal;
                                                    console.log(`Chuyến ${i + 1}, bookedCount: ${bookedCount}, slotsAvailable calculated: ${slotsAvailable}`);
                                                } else if (typeof slotEntry.seatsAvailable === 'number') {
                                                    slotsAvailable = slotEntry.seatsAvailable;
                                                    slotsTotal = slotEntry.seatsTotal || selectedBus.seatsTotal;
                                                    console.log(`Chuyến ${i + 1}, slotsAvailable from slotEntry: ${slotsAvailable}`);
                                                }
                                            } else {
                                                console.log(`Chuyến ${i + 1}, no slotEntry, using selectedBus.seatsAvailable: ${slotsAvailable}`);
                                            }

                                            return (
                                                <div key={i} className="bg-gray-50 p-3 rounded">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <div className="text-sm text-gray-500">Chuyến #{i + 1}</div>
                                                            <div className="font-medium">
                                                                Giờ đi : {depDate ? depDate.toLocaleDateString('vi-VN') : '---'}{" "}
                                                                <span className="text-gray-600">•</span>{" "}
                                                                <span className="font-mono">{depDate ? depDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '---'}</span>
                                                            </div>
                                                            <div className="text-sm text-gray-500 mt-1">
                                                                Giờ đến : {arrDate ? `${arrDate.toLocaleDateString('vi-VN')} • ${arrDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}` : 'Giờ đến chưa được đặt'}
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-sm text-gray-500">Thời gian di chuyển</div>
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
                    </div>


                </div>
            );
        }

        return (
            <div className="space-y-4 " style={{ height: '70vh', overflowY: 'auto' }}>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="busCode">Mã tuyến xe *</Label>
                        <Input
                            id="busCode"
                            value={formData.busCode}
                            onChange={(e) => handleFormChange('busCode', e.target.value.toUpperCase())}
                            placeholder="BUS123456"
                            className={`font-mono ${formErrors.busCode ? "border-red-500" : ""}`}
                            disabled={true} // Disabled luôn để không sửa
                        />
                        {modalMode === "create" && (
                            <p className="text-sm text-gray-500 mt-1">Mã tuyến xe được tự động tạo</p>
                        )}
                        {formErrors.busCode && (
                            <p className="text-sm text-red-500 mt-1">{formErrors.busCode}</p>
                        )}
                    </div>
                    <div>
                        <Label htmlFor="operator">Nhà xe *</Label>
                        <Select
                            value={formData.operatorId}
                            onValueChange={(value) => handleFormChange('operatorId', value)}
                        >
                            <SelectTrigger className={formErrors.operatorId ? "border-red-500" : ""}>
                                <SelectValue placeholder="Chọn nhà xe" />
                            </SelectTrigger>
                            <SelectContent>
                                {(operatorsData && Array.isArray(operatorsData) ? operatorsData : mockOperators).map((operator: any) => (
                                    <SelectItem key={operator.id} value={operator.id}>
                                        <div className="flex items-center space-x-2">
                                            {/* <img src={operator.logo || '/placeholder.svg'} alt={operator.name} className="w-6 h-6 rounded" /> */}
                                            <span>{operator.name} {operator.code ? `(${operator.code})` : ''}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {formErrors.operatorId && (
                            <p className="text-sm text-red-500 mt-1">{formErrors.operatorId}</p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="routeFrom">Điểm đi *</Label>
                        <Select
                            value={formData.routeFrom}
                            onValueChange={(value) => handleFormChange('routeFrom', value)}
                        >
                            <SelectTrigger className={formErrors.routeFrom ? "border-red-500" : ""}>
                                <SelectValue placeholder="Chọn điểm đi" />
                            </SelectTrigger>
                            <SelectContent>
                                {Array.isArray(provincesData) ? (
                                    provincesData.map((prov: any) => (
                                        <div key={prov.code}>
                                            <div className="px-3 py-1 text-sm font-semibold text-gray-700">{prov.name}</div>
                                            {Array.isArray(prov.bus_stations) && prov.bus_stations.map((st: any, idx: number) => (
                                                <SelectItem key={prov.code + '|' + idx} value={`${prov.code}||${st.name}`}>
                                                    {st.name} {st.address ? `- ${st.address}` : ''}
                                                </SelectItem>
                                            ))}
                                        </div>
                                    ))
                                ) : (
                                    mockStations.map((station) => (
                                        <SelectItem key={station.code} value={station.code}>
                                            {station.code} - {station.name} ({station.city})
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                        {formErrors.routeFrom && (
                            <p className="text-sm text-red-500 mt-1">{formErrors.routeFrom}</p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="routeTo">Điểm đến *</Label>
                        <Select
                            value={formData.routeTo}
                            onValueChange={(value) => handleFormChange('routeTo', value)}
                        >
                            <SelectTrigger className={formErrors.routeTo ? "border-red-500" : ""}>
                                <SelectValue placeholder="Chọn điểm đến" />
                            </SelectTrigger>
                            <SelectContent>
                                {(() => {
                                    // exclude the province selected in routeFrom from routeTo options
                                    const selFrom = parseRouteValue(formData.routeFrom);
                                    const excludeProvCode = selFrom?.code ? String(selFrom.code) : null;
                                    const excludeProvName = selFrom?.city || null;

                                    if (Array.isArray(provincesData)) {
                                        return provincesData.map((prov: any) => {
                                            // skip whole province if it matches selected "from" province
                                            if ((excludeProvCode && String(prov.code) === String(excludeProvCode)) ||
                                                (excludeProvName && prov.name === excludeProvName)) {
                                                return null;
                                            }
                                            return (
                                                <div key={prov.code}>
                                                    <div className="px-3 py-1 text-sm font-semibold text-gray-700">{prov.name}</div>
                                                    {Array.isArray(prov.bus_stations) && prov.bus_stations.map((st: any, idx: number) => (
                                                        <SelectItem key={prov.code + '|' + idx} value={`${prov.code}||${st.name}`}>
                                                            {st.name} {st.address ? `- ${st.address}` : ''}
                                                        </SelectItem>
                                                    ))}
                                                </div>
                                            );
                                        });
                                    }

                                    // fallback: mockStations filter by city/code/name
                                    return mockStations
                                        .filter(s => {
                                            if (!selFrom) return true;
                                            if (excludeProvName && s.city === excludeProvName) return false;
                                            if (excludeProvCode && (s.code === excludeProvCode || String(s.code) === String(excludeProvCode))) return false;
                                            return true;
                                        })
                                        .map((station) => (
                                            <SelectItem key={station.code} value={station.code}>
                                                {station.code} - {station.name} ({station.city})
                                            </SelectItem>
                                        ));
                                })()}
                            </SelectContent>
                        </Select>
                        {formErrors.routeTo && (
                            <p className="text-sm text-red-500 mt-1">{formErrors.routeTo}</p>
                        )}
                    </div>
                </div>

                {/* Replace single departureAt input with multi-date UI */}
                <div className="grid grid-cols-3 gap-4">

                    <div className="col-span-2">
                        <Label>Lịch khởi hành *</Label>

                        {/* Thêm thông báo nếu disabled */}
                        {hasBookings && modalMode === "edit" && (
                            <div className="text-sm text-red-500 mt-1">
                                Không thể thay đổi ngày khởi hành vì đã có người đặt chỗ.
                            </div>
                        )}

                        {/* Recurrence controls */}
                        <div className="flex items-center space-x-2 mb-2">
                            <Select value={recurrenceMode} onValueChange={(v) => setRecurrenceMode(v as any)} disabled={hasBookings && modalMode === "edit"}>
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
                                <Select value={String(recurrenceWeekday)} onValueChange={(v) => setRecurrenceWeekday(parseInt(v, 10))} disabled={hasBookings && modalMode === "edit"}>
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
                                <Button onClick={applyRecurrence} disabled={hasBookings && modalMode === "edit"}>
                                    Áp dụng
                                </Button>

                                {recurrenceApplied && (
                                    <Button
                                        onClick={handleResetSchedule}
                                        className="bg-primary-100 text-red-600 hover:bg-red-100 hover:text-red-700 flex items-center gap-1 text-sm"
                                        disabled={hasBookings && modalMode === "edit"}
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
                                                d="M6 18L18 6M6  6l12 12"
                                            />
                                        </svg>
                                        Clear
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="mt-2 space-y-2">
                            {(formData.departureDates && formData.departureDates.length ? formData.departureDates : [formData.departureAt || ""]).map((d, idx) => {
                                const arrVal = (formData.arrivalDates && formData.arrivalDates[idx]) || "";
                                return (
                                    <div key={idx} className="flex items-center space-x-2">
                                        <div className="flex-1">
                                            <Label className="text-xs">Xuất phát #{idx + 1}</Label>
                                            <Input
                                                type="datetime-local"
                                                value={d || ""}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    const deps = Array.isArray(formData.departureDates) ? formData.departureDates.slice() : [];
                                                    if (idx >= deps.length) deps.push(val); else deps[idx] = val;
                                                    // update departureDates
                                                    handleFormChange('departureDates' as any, deps);
                                                    // keep canonical departureAt in sync with first date
                                                    if (idx === 0) handleFormChange('departureAt', val);

                                                    // ensure arrivalDates has a corresponding entry
                                                    const arrs = Array.isArray(formData.arrivalDates) ? formData.arrivalDates.slice() : [];
                                                    if (!arrs[idx]) {
                                                        // try to compute default arrival using delta from first pair if available
                                                        const firstDep = (formData.departureDates && formData.departureDates[0]) || formData.departureAt;
                                                        const firstArr = (formData.arrivalDates && formData.arrivalDates[0]) || formData.arrivalAt;
                                                        let defaultArr = "";
                                                        if (firstDep && firstArr) {
                                                            const baseDep = parseVNLocalString(firstDep); // Thay parseLocalInput
                                                            const baseArr = parseVNLocalString(firstArr); // Thay parseLocalInput
                                                            if (baseDep && baseArr) {
                                                                const delta = baseArr.getTime() - baseDep.getTime();
                                                                const thisDep = parseVNLocalString(val) || parseVNLocalString(firstDep); // Thay parseLocalInput
                                                                if (thisDep) defaultArr = toVNLocalString(new Date(thisDep.getTime() + delta)); // Thay toLocalInput
                                                            }
                                                        }
                                                        if (!defaultArr) {
                                                            // fallback: +6 hours
                                                            const thisDep = parseVNLocalString(val); // Thay parseLocalInput
                                                            defaultArr = thisDep ? toVNLocalString(new Date(thisDep.getTime() + 6 * 3600000)) : ""; // Thay toLocalInput
                                                        }
                                                        arrs[idx] = defaultArr;
                                                        handleFormChange('arrivalDates' as any, arrs);
                                                        if (idx === 0) handleFormChange('arrivalAt', arrs[0] || "");
                                                    }
                                                }}
                                                min={getTomorrowLocal()}
                                                className={formErrors[`departureDates_${idx}`] ? "border-red-500" : ""}
                                                disabled={hasBookings || loadingHasBookings}
                                            />
                                        </div>

                                        <div className="flex-1">
                                            <Label className="text-xs">Giờ đến #{idx + 1}</Label>
                                            <Input
                                                type="datetime-local"
                                                value={arrVal || ""}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    const arrs = Array.isArray(formData.arrivalDates) ? formData.arrivalDates.slice() : [];
                                                    if (idx >= arrs.length) arrs.push(val); else arrs[idx] = val;
                                                    handleFormChange('arrivalDates' as any, arrs);
                                                    if (idx === 0) handleFormChange('arrivalAt', val);

                                                    // recompute duration for canonical pair (first)
                                                    const firstDep = (formData.departureDates && formData.departureDates.length) ? formData.departureDates[0] : formData.departureAt;
                                                    const firstArr = (arrs && arrs.length) ? arrs[0] : formData.arrivalAt;
                                                    if (firstDep && firstArr) {
                                                        const duration = calculateDuration(firstDep, firstArr);
                                                        if (duration) handleFormChange('duration', duration);
                                                    }
                                                }}
                                                min={(formData.departureDates && formData.departureDates.length && formData.departureDates[idx]) ? formData.departureDates[idx] : getTomorrowLocal()}
                                                className={formErrors[`arrivalDates_${idx}`] ? "border-red-500" : ""}
                                                disabled={hasBookings && modalMode === "edit"}
                                            />
                                        </div>

                                        <div className="flex items-end" style={{ marginTop: 'auto' }}>
                                            <Button variant="outline" onClick={() => {
                                                const deps = Array.isArray(formData.departureDates) ? formData.departureDates.slice() : [];
                                                const arrs = Array.isArray(formData.arrivalDates) ? formData.arrivalDates.slice() : [];
                                                // if using fallback single departureAt, convert first then remove
                                                if (!deps.length && formData.departureAt) deps.push(formData.departureAt);
                                                deps.splice(idx, 1);
                                                arrs.splice(idx, 1);
                                                handleFormChange('departureDates' as any, deps);
                                                handleFormChange('arrivalDates' as any, arrs);
                                                // ensure canonical fields sync
                                                handleFormChange('departureAt', (deps[0] || ""));
                                                handleFormChange('arrivalAt', (arrs[0] || ""));
                                            }}
                                                disabled={hasBookings && modalMode === "edit"}
                                            >
                                                Xóa
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                            {/* <div>
                                <Button variant="ghost" onClick={() => {
                                    // add an empty row — user will fill datetime themselves
                                    const deps = Array.isArray(formData.departureDates) ? formData.departureDates.slice() : [];
                                    const arrs = Array.isArray(formData.arrivalDates) ? formData.arrivalDates.slice() : [];
                                    const newDep = ""; // do not prefill
                                    deps.push(newDep);
                                    // only compute default arrival when we can (and newDep is not empty).
                                    // For empty newDep we keep arrival empty so user can input it.
                                    let newArr = "";
                                    const firstDep = (formData.departureDates && formData.departureDates[0]) || formData.departureAt;
                                    const firstArr = (formData.arrivalDates && formData.arrivalDates[0]) || formData.arrivalAt;
                                    if (newDep && firstDep && firstArr) {
                                        const baseDep = parseVNLocalString(firstDep); // Thay parseLocalInput
                                        const baseArr = parseVNLocalString(firstArr); // Thay parseLocalInput
                                        if (baseDep && baseArr) {
                                            const delta = baseArr.getTime() - baseDep.getTime();
                                            const thisDep = parseVNLocalString(newDep); // Thay parseLocalInput
                                            if (thisDep) newArr = toVNLocalString(new Date(thisDep.getTime() + delta)); // Thay toLocalInput
                                        }
                                    }
                                    // if still empty, leave newArr = "" (no auto-fill)
                                    arrs.push(newArr);
                                    handleFormChange('departureDates' as any, deps);
                                    handleFormChange('arrivalDates' as any, arrs);
                                    // set canonical only when first entries are non-empty
                                    if (deps.length === 1 && deps[0]) handleFormChange('departureAt', deps[0]);
                                    if (arrs.length === 1 && arrs[0]) handleFormChange('arrivalAt', arrs[0]);
                                }}
                                    disabled={hasBookings && modalMode === "edit"}>
                                    Thêm ngày khởi hành
                                </Button>
                            </div> */}
                        </div>
                    </div>

                    {/* <div>
                        <Label htmlFor="arrivalAt">Giờ đến *</Label>
                        <Input
                            id="arrivalAt"
                            type="datetime-local"
                            value={formData.arrivalAt}
                            onChange={(e) => {
                                handleFormChange('arrivalAt', e.target.value);
                                // compute duration using first departure if available
                                const firstDep = (formData.departureDates && formData.departureDates.length) ? formData.departureDates[0] : formData.departureAt;
                                if (firstDep) {
                                    const duration = calculateDuration(firstDep, e.target.value);
                                    if (duration) handleFormChange('duration', duration);
                                }
                            }}
                            // min = earliest departure if exists, else now
                            min={(formData.departureDates && formData.departureDates.length && formData.departureDates[0]) ? formData.departureDates[0] : isoLocalNow()}
                            className={formErrors.arrivalAt ? "border-red-500" : ""}
                        />
                        {formErrors.arrivalAt && (
                            <p className="text-sm text-red-500 mt-1">{formErrors.arrivalAt}</p>
                        )}
                    </div> */}

                    <div>
                        <Label htmlFor="duration" className="mt-2 block">Thời gian di chuyển</Label>
                        <Input
                            id="duration"
                            value={formData.duration}
                            onChange={(e) => handleFormChange('duration', e.target.value)}
                            placeholder="6h 30m"
                            readOnly
                        />
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    {/* Ghi chú cho người dùng về hai trường 'Tổng số ghế' và 'Ghế có sẵn' */}
                    <div className="col-span-3">
                        <p className="text-sm text-gray-500 mb-2">
                            Lưu ý: &quot;Tổng số ghế&quot; và &quot;Ghế có sẵn&quot; được tự động thiết lập từ loại xe / layout đã chọn.
                            Người dùng không thể nhập thủ công. Để thay đổi, hãy chọn loại xe khác hoặc chỉnh layout.
                        </p>
                    </div>
                    <div>
                        <Label htmlFor="adultPrice">Giá vé - Người lớn (VNĐ) *</Label>
                        <Input
                            id="adultPrice"
                            type="number"
                            value={formData.adultPrice || ""}
                            onChange={(e) => handleFormChange('adultPrice', parseInt(e.target.value) || 0)}
                            placeholder="350000"
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
                        <Label htmlFor="childPrice">Giá vé - Trẻ em (VNĐ)</Label>
                        <Input
                            id="childPrice"
                            type="number"
                            value={formData.childPrice || ""}
                            onChange={(e) => handleFormChange('childPrice', parseInt(e.target.value) || 0)}
                            placeholder="200000"
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
                        <Label htmlFor="seatsTotal">Tổng số ghế *</Label>
                        <Input
                            id="seatsTotal"
                            type="number"
                            value={formData.seatsTotal || ""}
                            // seatsTotal is auto-set from selected subtype / layout — disable manual edits
                            disabled
                            readOnly
                            placeholder="Tự động đặt từ loại xe / layout"
                            className={formErrors.seatsTotal ? "border-red-500 bg-gray-50" : "bg-gray-50"}
                            aria-disabled="true"
                        />
                        {formErrors.seatsTotal && (
                            <p className="text-sm text-red-500 mt-1">{formErrors.seatsTotal}</p>
                        )}
                    </div>
                    <div>
                        <Label htmlFor="seatsAvailable">Ghế có sẵn *</Label>
                        <Input
                            id="seatsAvailable"
                            type="number"
                            value={formData.seatsAvailable || ""}
                            // seatsAvailable is derived from seatsTotal / default booked — disable manual edits
                            disabled
                            readOnly
                            placeholder="Tự động tính từ loại xe / layout"
                            className={formErrors.seatsAvailable ? "border-red-500 bg-gray-50" : "bg-gray-50"}
                            aria-disabled="true"
                        />
                        {formErrors.seatsAvailable && (
                            <p className="text-sm text-red-500 mt-1">{formErrors.seatsAvailable}</p>
                        )}
                    </div>
                </div>

                <div>
                    <Label>Loại xe *</Label>
                    <div className="mt-2">
                        <Select value={selectedSubtypeId}
                            onValueChange={(val) => {
                            setSelectedSubtypeId(val);
                            // find subtype by id to set formData.busType and seatsTotal
                            const subtypeSel = getAllSubtypes(loaixeData).find((s: any) => s.id === val);
                            if (subtypeSel) {
                                setSelectedLayout(subtypeSel.layout || null);
                                handleFormChange('busType', [subtypeSel.name]);
                                if (typeof subtypeSel.seat_capacity === 'number') {
                                    const cap = subtypeSel.seat_capacity;
                                    handleFormChange('seatsTotal', cap);
                                    // default: mark ~10% as already booked (so seatsAvailable < seatsTotal)
                                    const bookedDefault = Math.max(1, Math.floor(cap * 0.1));
                                    const avail = Math.max(0, cap - bookedDefault);
                                    handleFormChange('seatsAvailable', avail);
                                    // build seatMap and set booked seats
                                    const map = generateSeatMapWithBooked(subtypeSel.layout, bookedDefault);
                                    setSeatMap(map);
                                } else {
                                    handleFormChange('seatsTotal', 0);
                                    setSeatMap(null);
                                }
                            } else {
                                handleFormChange('busType', []);
                                setSelectedLayout(null);
                                setSeatMap(null);
                                handleFormChange('seatsTotal', 0);
                            }
                            setIsFormDirty(true);
                            }}
                            disabled={hasBookings && modalMode === "edit"}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Chọn loại xe (chọn 1 loại con)" />
                            </SelectTrigger>
                            <SelectContent>
                                {/*
                     Prefer categories from loaixeData when it contains subtypes.
                     Otherwise try a flat list from getAllSubtypes(loaixeData).
                     Only if both are empty do we fallback to busTypeOptions.
                   */}
                                {Array.isArray(loaixeData) && loaixeData.length > 0 && loaixeData.some((c: any) => Array.isArray(c.subtypes) && c.subtypes.length > 0) ? (
                                    loaixeData.map((cat: any) => (
                                        <div key={cat.id || cat.name}>
                                            <div className="px-3 py-1 text-sm font-semibold text-gray-700">{cat.name}</div>
                                            {Array.isArray(cat.subtypes) && cat.subtypes.map((s: any) => (
                                                <SelectItem key={s.id || s.name} value={s.id || s.name}>
                                                    {s.name} {s.seat_capacity ? `- ${s.seat_capacity} chỗ` : ''}
                                                </SelectItem>
                                            ))}
                                        </div>
                                    ))
                                ) : (() => {
                                    const flat = getAllSubtypes(loaixeData);
                                    if (flat && flat.length > 0) {
                                        return flat.map((s: any) => (
                                            <SelectItem key={s.id || s.name} value={s.id || s.name}>
                                                {s.name} {s.seat_capacity ? `- ${s.seat_capacity} chỗ` : ''}
                                            </SelectItem>
                                        ));
                                    }
                                    // final fallback: small static list
                                    return busTypeOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ));
                                })()}
                            </SelectContent>
                        </Select>
                        {formErrors.busType && (
                            <p className="text-sm text-red-500 mt-1">{formErrors.busType}</p>
                        )}
                        {hasBookings && modalMode === "edit" && (
                            <p className="text-sm text-red-500 mt-1">Không thể thay đổi loại xe vì đã có người đặt chỗ.</p>
                        )}
                        <p className="text-sm text-gray-500 mt-2">Chọn 1 loại xe / Tổng số ghế sẽ được đặt từ seat_capacity (nếu có). Ghế có sẵn giữ nguyên.</p>
                    </div>
                </div>

                {/* --- Replace Textarea with amenities checkboxes --- */}
                <div>
                    <Label>Tiện ích</Label>
                    <div className="mt-2 space-y-2">
                        {amenitiesOptions.map((opt) => {
                            const checked = amenitiesSelected.includes(opt.value);
                            return (
                                <div key={opt.value} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={opt.value}
                                        checked={checked}
                                        // Trong onCheckedChange của Checkbox amenities
                                        onCheckedChange={(c) => {
                                            const newAmenities = c ? [...amenitiesSelected, opt.value] : amenitiesSelected.filter(a => a !== opt.value);
                                            setAmenitiesSelected(newAmenities);
                                            handleFormChange('amenities', newAmenities.join(', ')); // Sync formData.amenities
                                            setIsFormDirty(true);
                                            // clear errors if any
                                            if (formErrors['amenities']) {
                                                setFormErrors(prev => ({ ...prev, amenities: "" }));
                                            }
                                        }}
                                    />
                                    <Label htmlFor={opt.value}>{opt.label}</Label>
                                </div>
                            );
                        })}
                    </div>
                    <p className="text-sm text-gray-500 mt-2">Chọn các tiện ích có sẵn trên tuyến.</p>
                </div>

                <div>
                    <Label htmlFor="status">Trạng thái</Label>
                    <Select
                        value={formData.status}
                        onValueChange={(value) => handleFormChange('status', value)}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="scheduled">Đã lên lịch</SelectItem>
                            <SelectItem value="cancelled">Đã hủy</SelectItem>
                            <SelectItem value="delayed">Hoãn</SelectItem>
                            <SelectItem value="completed">Hoàn thành</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        );
    };

    return (
        <div className="p-6 space-y-6 bg-gray-50">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý vé xe</h1>
                    <p className="text-gray-600 mt-1">Quản lý tuyến xe, lịch trình và thông tin vé xe</p>
                </div>
                <div className="flex items-center space-x-3">
                    {/* <Button
                        variant="outline"
                        onClick={() => refetch()}
                        disabled={isLoading}
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Làm mới
                    </Button> */}
                    <Button onClick={handleAdd} className="bg-primary hover:bg-primary-600">
                        <Plus className="w-4 h-4 mr-2" />
                        Thêm tuyến xe
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Tổng tuyến xe</p>
                                <p className="text-2xl font-bold">{total || 0}</p>
                            </div>
                            <Bus className="w-8 h-8 text-primary" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Đang hoạt động</p>
                                <p className="text-2xl font-bold">{buses.filter((b: BusRoute) => b.status === "scheduled").length}</p>
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
                                    {buses.filter((b: BusRoute) => b.seatsAvailable <= b.seatsTotal * 0.2).length}

                                </p>
                            </div>
                            <Users className="w-8 h-8 text-orange-500" />
                        </div>
                    </CardContent>
                </Card> */}
                {/* <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Doanh thu TB</p>
                                <p className="text-2xl font-bold">1.8M</p>
                            </div>
                            <DollarSign className="w-8 h-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card> */}
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Danh sách tuyến xe</CardTitle>
                            <CardDescription>Quản lý thông tin và lịch trình tuyến xe</CardDescription>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Select value={filters.operator} onValueChange={(value) => setFilters(prev => ({ ...prev, operator: value }))}>
                                <SelectTrigger className="w-40">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả nhà xe</SelectItem>
                                    {(operatorsData && Array.isArray(operatorsData) ? operatorsData : mockOperators).map((operator: any) => (
                                        <SelectItem key={operator.id} value={operator.id}>
                                            <div className="flex items-center space-x-2">
                                                <span>{operator.name} {operator.code ? `(${operator.code})` : ''}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                                <SelectTrigger className="w-36">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                                    <SelectItem value="scheduled">Đã lên lịch</SelectItem>
                                    <SelectItem value="cancelled">Đã hủy</SelectItem>
                                    <SelectItem value="delayed">Hoãn</SelectItem>
                                    <SelectItem value="completed">Hoàn thành</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* <DataTable
                        columns={columns}
                        data={buses}
                        pagination={{
                            current: pagination.current,
                            pageSize: pagination.pageSize,
                            total: total,
                        }}
                        onPaginationChange={(page, pageSize) =>
                            setPagination({ current: page, pageSize })
                        }
                        onSearch={setSearchQuery}
                        rowSelection={{
                            selectedRowKeys: selectedBuses,
                            onChange: setSelectedBuses,
                        }}
                        // bulkActions={bulkActions}
                        actions={actions}
                        exportable
                        onExport={() => toast({ title: "Đang xuất file...", description: "File sẽ được tải xuống sau vài giây" })}
                        loading={isLoading}
                    /> */}
                    <DataTable
                        columns={columns}
                        data={buses}  // Sử dụng buses trực tiếp từ API
                        pagination={{
                            current: pagination.current,
                            pageSize: pagination.pageSize,
                            total: total,  // Sử dụng total từ API
                        }}
                        onPaginationChange={(page, pageSize) =>
                            setPagination({ current: page, pageSize })
                        }
                        onSearch={setSearchQuery}
                        rowSelection={{
                            selectedRowKeys: selectedBuses,
                            onChange: setSelectedBuses,
                        }}
                        // bulkActions={bulkActions}
                        actions={actions}
                        exportable
                        onExport={() => toast({ title: "Đang xuất file...", description: "File sẽ được tải xuống sau vài giây" })}
                        loading={isLoading}
                    />
                </CardContent>
            </Card>

            <ModalForm
                open={modalOpen}
                onOpenChange={handleModalClose}
                title={
                    modalMode === "create" ? "Thêm tuyến xe mới" :
                        modalMode === "edit" ? "Chỉnh sửa tuyến xe" :
                            "Chi tiết tuyến xe"
                }
                description={
                    modalMode === "create" ? "Tạo tuyến xe mới trong hệ thống" :
                        modalMode === "edit" ? "Xem chi tiết và cập nhật thông tin tuyến xe" :
                            "Xem thông tin chi tiết tuyến xe"
                }
                mode={modalMode}
                size="medium"
                onSubmit={handleSubmit}
                submitDisabled={isSubmitDisabled()}
                submitText={modalMode === "create" ? "Thêm tuyến xe" : "Cập nhật"}
                cancelText="Hủy"
            >
                {renderBusForm()}
            </ModalForm>

            <ConfirmModal
                open={deleteModalOpen}
                onOpenChange={setDeleteModalOpen}
                title="Xóa tuyến xe"
                message={`Bạn có chắc chắn muốn xóa tuyến xe &quot;${busToDelete?.busCode}&quot;?${busToDelete && (busToDelete.seatsTotal - busToDelete.seatsAvailable) > 0 ? ' Tuyến xe này có đặt chỗ.' : ''}`}
                type="danger"
                requireTyping={true}
                // typingText={busToDelete && (busToDelete.seatsTotal - busToDelete.seatsAvailable) > 0 ? "FORCE_DELETE" : "DELETE"}
                typingText={busToDelete ? "FORCE_DELETE" : "DELETE"}

                onConfirm={confirmDelete}
                confirmText="Xóa tuyến xe"
                loading={deleteBusMutation.isPending}
            />
        </div>
    );
}
