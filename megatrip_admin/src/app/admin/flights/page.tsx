"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plane, Plus, Edit, Eye, Trash2, Filter, Download, MapPin, Clock, Users, DollarSign, RefreshCw, Calendar, Ban, AlertTriangle } from "lucide-react";
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

interface Flight {
    id: string;
    flightCode: string;
    airline: {
        id: string;
        name: string;
        logo: string;
        code: string;
    };
    fromAirport: {
        code: string;
        name: string;
        city: string;
    };
    toAirport: {
        code: string;
        name: string;
        city: string;
    };
    departureAt: string;
    arrivalAt: string;
    duration: string;
    cabinClass: string[];
    price: number;
    seatsTotal: number;
    seatsAvailable: number;
    status: "scheduled" | "cancelled" | "delayed" | "completed";
    baggageInfo: string;
    createdAt: string;
    updatedAt: string;
}

interface FlightFormData {
    flightCode: string;
    airlineId: string;
    fromAirport: string;
    toAirport: string;
    departureAt: string;
    arrivalAt: string;
    duration: string;
    cabinClass: string[];
    price: number;
    seatsTotal: number;
    seatsAvailable: number;
    baggageInfo: string;
    status: "scheduled" | "cancelled" | "delayed" | "completed";
}

interface FlightFilters {
    airline: string;
    status: string;
    route: string;
    dateRange?: [string, string];
}

const mockAirlines = [
    { id: "airline_001", name: "Vietnam Airlines", code: "VN", logo: "/placeholder.svg" },
    { id: "airline_002", name: "VietJet Air", code: "VJ", logo: "/placeholder.svg" },
    { id: "airline_003", name: "Bamboo Airways", code: "QH", logo: "/placeholder.svg" },
    { id: "airline_004", name: "Jetstar Pacific", code: "BL", logo: "/placeholder.svg" },
];

const mockAirports = [
    { code: "SGN", name: "Sân bay Tân Sơn Nhất", city: "TP.HCM" },
    { code: "HAN", name: "Sân bay Nội Bài", city: "Hà Nội" },
    { code: "DAD", name: "Sân bay Đà Nẵng", city: "Đà Nẵng" },
    { code: "CXR", name: "Sân bay Cam Ranh", city: "Nha Trang" },
    { code: "PQC", name: "Sân bay Phú Quốc", city: "Phú Quốc" },
    { code: "DLI", name: "Sân bay Liên Khương", city: "Đà Lạt" },
];

const mockFlights: Flight[] = [
    {
        id: "flight_001",
        flightCode: "VN1234",
        airline: { id: "airline_001", name: "Vietnam Airlines", code: "VN", logo: "/placeholder.svg" },
        fromAirport: { code: "SGN", name: "Sân bay Tân Sơn Nhất", city: "TP.HCM" },
        toAirport: { code: "HAN", name: "Sân bay Nội Bài", city: "Hà Nội" },
        departureAt: "2025-09-15T08:00:00.000Z",
        arrivalAt: "2025-09-15T10:15:00.000Z",
        duration: "2h 15m",
        cabinClass: ["Economy", "Business"],
        price: 2850000,
        seatsTotal: 180,
        seatsAvailable: 120,
        status: "scheduled",
        baggageInfo: "Hành lý xách tay 7kg, hành lý ký gửi 23kg",
        createdAt: "2025-09-01T10:00:00.000Z",
        updatedAt: "2025-09-01T10:00:00.000Z",
    },
    {
        id: "flight_002",
        flightCode: "VJ5678",
        airline: { id: "airline_002", name: "VietJet Air", code: "VJ", logo: "/placeholder.svg" },
        fromAirport: { code: "HAN", name: "Sân bay Nội Bài", city: "Hà Nội" },
        toAirport: { code: "DAD", name: "Sân bay Đà Nẵng", city: "Đà Nẵng" },
        departureAt: "2025-09-16T12:00:00.000Z",
        arrivalAt: "2025-09-16T13:30:00.000Z",
        duration: "1h 30m",
        cabinClass: ["Economy"],
        price: 1500000,
        seatsTotal: 150,
        seatsAvailable: 30,
        status: "scheduled",
        baggageInfo: "Hành lý xách tay 7kg",
        createdAt: "2025-09-02T09:00:00.000Z",
        updatedAt: "2025-09-02T09:00:00.000Z",
    },
    {
        id: "flight_003",
        flightCode: "QH9012",
        airline: { id: "airline_003", name: "Bamboo Airways", code: "QH", logo: "/placeholder.svg" },
        fromAirport: { code: "SGN", name: "Sân bay Tân Sơn Nhất", city: "TP.HCM" },
        toAirport: { code: "PQC", name: "Sân bay Phú Quốc", city: "Phú Quốc" },
        departureAt: "2025-09-17T14:00:00.000Z",
        arrivalAt: "2025-09-17T15:00:00.000Z",
        duration: "1h 0m",
        cabinClass: ["Economy", "Premium Economy"],
        price: 2000000,
        seatsTotal: 200,
        seatsAvailable: 50,
        status: "delayed",
        baggageInfo: "Hành lý xách tay 7kg, hành lý ký gửi 20kg",
        createdAt: "2025-09-03T11:00:00.000Z",
        updatedAt: "2025-09-10T08:00:00.000Z",
    },
    {
        id: "flight_004",
        flightCode: "BL3456",
        airline: { id: "airline_004", name: "Jetstar Pacific", code: "BL", logo: "/placeholder.svg" },
        fromAirport: { code: "DAD", name: "Sân bay Đà Nẵng", city: "Đà Nẵng" },
        toAirport: { code: "CXR", name: "Sân bay Cam Ranh", city: "Nha Trang" },
        departureAt: "2025-09-18T09:00:00.000Z",
        arrivalAt: "2025-09-18T10:00:00.000Z",
        duration: "1h 0m",
        cabinClass: ["Economy"],
        price: 1200000,
        seatsTotal: 120,
        seatsAvailable: 20,
        status: "scheduled",
        baggageInfo: "Hành lý xách tay 7kg",
        createdAt: "2025-09-04T12:00:00.000Z",
        updatedAt: "2025-09-04T12:00:00.000Z",
    },
    {
        id: "flight_005",
        flightCode: "VN7890",
        airline: { id: "airline_001", name: "Vietnam Airlines", code: "VN", logo: "/placeholder.svg" },
        fromAirport: { code: "HAN", name: "Sân bay Nội Bài", city: "Hà Nội" },
        toAirport: { code: "DLI", name: "Sân bay Liên Khương", city: "Đà Lạt" },
        departureAt: "2025-09-19T10:00:00.000Z",
        arrivalAt: "2025-09-19T11:45:00.000Z",
        duration: "1h 45m",
        cabinClass: ["Economy", "Business", "First"],
        price: 3500000,
        seatsTotal: 250,
        seatsAvailable: 180,
        status: "scheduled",
        baggageInfo: "Hành lý xách tay 12kg, hành lý ký gửi 32kg",
        createdAt: "2025-09-05T14:00:00.000Z",
        updatedAt: "2025-09-05T14:00:00.000Z",
    },
    {
        id: "flight_006",
        flightCode: "VJ2345",
        airline: { id: "airline_002", name: "VietJet Air", code: "VJ", logo: "/placeholder.svg" },
        fromAirport: { code: "SGN", name: "Sân bay Tân Sơn Nhất", city: "TP.HCM" },
        toAirport: { code: "DAD", name: "Sân bay Đà Nẵng", city: "Đà Nẵng" },
        departureAt: "2025-09-20T15:00:00.000Z",
        arrivalAt: "2025-09-20T16:30:00.000Z",
        duration: "1h 30m",
        cabinClass: ["Economy"],
        price: 1600000,
        seatsTotal: 150,
        seatsAvailable: 10,
        status: "cancelled",
        baggageInfo: "Hành lý xách tay 7kg",
        createdAt: "2025-09-06T09:00:00.000Z",
        updatedAt: "2025-09-10T10:00:00.000Z",
    },
    {
        id: "flight_007",
        flightCode: "QH4567",
        airline: { id: "airline_003", name: "Bamboo Airways", code: "QH", logo: "/placeholder.svg" },
        fromAirport: { code: "CXR", name: "Sân bay Cam Ranh", city: "Nha Trang" },
        toAirport: { code: "HAN", name: "Sân bay Nội Bài", city: "Hà Nội" },
        departureAt: "2025-09-21T11:00:00.000Z",
        arrivalAt: "2025-09-21T12:45:00.000Z",
        duration: "1h 45m",
        cabinClass: ["Economy", "Premium Economy"],
        price: 2200000,
        seatsTotal: 200,
        seatsAvailable: 150,
        status: "scheduled",
        baggageInfo: "Hành lý xách tay 7kg, hành lý ký gửi 20kg",
        createdAt: "2025-09-07T11:00:00.000Z",
        updatedAt: "2025-09-07T11:00:00.000Z",
    },
    {
        id: "flight_008",
        flightCode: "BL6789",
        airline: { id: "airline_004", name: "Jetstar Pacific", code: "BL", logo: "/placeholder.svg" },
        fromAirport: { code: "PQC", name: "Sân bay Phú Quốc", city: "Phú Quốc" },
        toAirport: { code: "SGN", name: "Sân bay Tân Sơn Nhất", city: "TP.HCM" },
        departureAt: "2025-09-22T13:00:00.000Z",
        arrivalAt: "2025-09-22T14:00:00.000Z",
        duration: "1h 0m",
        cabinClass: ["Economy"],
        price: 1300000,
        seatsTotal: 120,
        seatsAvailable: 90,
        status: "completed",
        baggageInfo: "Hành lý xách tay 7kg",
        createdAt: "2025-09-08T12:00:00.000Z",
        updatedAt: "2025-09-08T12:00:00.000Z",
    },
    {
        id: "flight_009",
        flightCode: "VN9012",
        airline: { id: "airline_001", name: "Vietnam Airlines", code: "VN", logo: "/placeholder.svg" },
        fromAirport: { code: "DLI", name: "Sân bay Liên Khương", city: "Đà Lạt" },
        toAirport: { code: "SGN", name: "Sân bay Tân Sơn Nhất", city: "TP.HCM" },
        departureAt: "2025-09-23T16:00:00.000Z",
        arrivalAt: "2025-09-23T17:00:00.000Z",
        duration: "1h 0m",
        cabinClass: ["Economy", "Business"],
        price: 2800000,
        seatsTotal: 180,
        seatsAvailable: 100,
        status: "scheduled",
        baggageInfo: "Hành lý xách tay 7kg, hành lý ký gửi 23kg",
        createdAt: "2025-09-09T10:00:00.000Z",
        updatedAt: "2025-09-09T10:00:00.000Z",
    },
    {
        id: "flight_010",
        flightCode: "VJ1234",
        airline: { id: "airline_002", name: "VietJet Air", code: "VJ", logo: "/placeholder.svg" },
        fromAirport: { code: "HAN", name: "Sân bay Nội Bài", city: "Hà Nội" },
        toAirport: { code: "PQC", name: "Sân bay Phú Quốc", city: "Phú Quốc" },
        departureAt: "2025-09-24T07:00:00.000Z",
        arrivalAt: "2025-09-24T09:15:00.000Z",
        duration: "2h 15m",
        cabinClass: ["Economy"],
        price: 1700000,
        seatsTotal: 150,
        seatsAvailable: 80,
        status: "scheduled",
        baggageInfo: "Hành lý xách tay 7kg",
        createdAt: "2025-09-10T08:00:00.000Z",
        updatedAt: "2025-09-10T08:00:00.000Z",
    },
];

const cabinClassOptions = [
    { value: "Economy", label: "Economy" },
    { value: "Premium Economy", label: "Premium Economy" },
    { value: "Business", label: "Business" },
    { value: "First", label: "First Class" }
];

export default function Flights() {
    const [selectedFlights, setSelectedFlights] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [filters, setFilters] = useState<FlightFilters>({
        airline: "all",
        status: "all",
        route: "all"
    });
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create");
    const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [flightToDelete, setFlightToDelete] = useState<Flight | null>(null);
    const [formData, setFormData] = useState<FlightFormData>({
        flightCode: "",
        airlineId: "",
        fromAirport: "",
        toAirport: "",
        departureAt: "",
        arrivalAt: "",
        duration: "",
        cabinClass: ["Economy"],
        price: 0,
        seatsTotal: 0,
        seatsAvailable: 0,
        baggageInfo: "",
        status: "scheduled"
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [isFormDirty, setIsFormDirty] = useState(false);

    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
    });

    // Fetch flights with mock data
    const { data: flightsData, isLoading, error, refetch } = useQuery({
        queryKey: ['flights', pagination.current, pagination.pageSize, searchQuery, filters],
        queryFn: async () => {
            const filteredFlights = mockFlights.filter((flight) => {
                const matchesSearch = flight.flightCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    flight.airline.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    flight.fromAirport.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    flight.toAirport.city.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesAirline = filters.airline === 'all' || flight.airline.id === filters.airline;
                const matchesStatus = filters.status === 'all' || flight.status === filters.status;
                const matchesRoute = filters.route === 'all' ||
                    `${flight.fromAirport.code}-${flight.toAirport.code}` === filters.route;
                return matchesSearch && matchesAirline && matchesStatus && matchesRoute;
            });

            const start = (pagination.current - 1) * pagination.pageSize;
            const end = start + pagination.pageSize;
            const paginatedFlights = filteredFlights.slice(start, end);

            return {
                data: paginatedFlights,
                pagination: {
                    total: filteredFlights.length,
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                },
            };
        },
    });

    // Create flight mutation (mock implementation)
    const createFlightMutation = useMutation({
        mutationFn: async (data: FlightFormData) => {
            const airline = mockAirlines.find(a => a.id === data.airlineId);
            const fromAirport = mockAirports.find(a => a.code === data.fromAirport);
            const toAirport = mockAirports.find(a => a.code === data.toAirport);

            if (!airline || !fromAirport || !toAirport) {
                throw new Error("Invalid airline or airport");
            }

            const newFlight: Flight = {
                id: `flight_${Date.now()}`,
                flightCode: data.flightCode,
                airline,
                fromAirport,
                toAirport,
                departureAt: data.departureAt,
                arrivalAt: data.arrivalAt,
                duration: data.duration,
                cabinClass: data.cabinClass,
                price: data.price,
                seatsTotal: data.seatsTotal,
                seatsAvailable: data.seatsAvailable,
                status: data.status,
                baggageInfo: data.baggageInfo,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            mockFlights.push(newFlight);
            return newFlight;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['flights'] });
            setModalOpen(false);
            resetForm();
            toast({
                title: "Thêm chuyến bay thành công",
                description: "Chuyến bay mới đã được thêm vào hệ thống",
            });
        },
        onError: (error: any) => {
            toast({
                title: "Lỗi khi thêm chuyến bay",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    // Update flight mutation (mock implementation)
    const updateFlightMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<FlightFormData> }) => {
            const index = mockFlights.findIndex(flight => flight.id === id);
            if (index === -1) throw new Error('Flight not found');

            const airline = mockAirlines.find(a => a.id === data.airlineId) || mockFlights[index].airline;
            const fromAirport = mockAirports.find(a => a.code === data.fromAirport) || mockFlights[index].fromAirport;
            const toAirport = mockAirports.find(a => a.code === data.toAirport) || mockFlights[index].toAirport;

            mockFlights[index] = {
                ...mockFlights[index],
                ...data,
                airline,
                fromAirport,
                toAirport,
                updatedAt: new Date().toISOString(),
            };
            return mockFlights[index];
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['flights'] });
            setModalOpen(false);
            resetForm();
            toast({
                title: "Cập nhật chuyến bay thành công",
                description: "Thông tin chuyến bay đã được cập nhật",
            });
        },
        onError: (error: any) => {
            toast({
                title: "Lỗi khi cập nhật chuyến bay",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    // Delete flight mutation (mock implementation)
    const deleteFlightMutation = useMutation({
        mutationFn: async (id: string) => {
            const index = mockFlights.findIndex(flight => flight.id === id);
            if (index === -1) throw new Error('Flight not found');
            const deletedFlight = mockFlights.splice(index, 1)[0];
            return deletedFlight;
        },
        onSuccess: (_, flightId) => {
            queryClient.invalidateQueries({ queryKey: ['flights'] });
            setDeleteModalOpen(false);
            setFlightToDelete(null);

            const flight = flightsData?.data?.find((f: Flight) => f.id === flightId);
            toast({
                title: "Đã xóa chuyến bay",
                description: `Chuyến bay ${flight?.flightCode} đã được xóa thành công`,
                action: (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            toast({
                                title: "Khôi phục thành công",
                                description: "Chuyến bay đã được khôi phục",
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
                title: "Lỗi khi xóa chuyến bay",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    // Bulk operations mutation (mock implementation)
    const bulkActionMutation = useMutation({
        mutationFn: async ({ action, ids }: { action: string; ids: string[] }) => {
            ids.forEach(id => {
                const index = mockFlights.findIndex(flight => flight.id === id);
                if (index !== -1) {
                    if (action === 'delete') {
                        mockFlights.splice(index, 1);
                    } else if (action === 'activate') {
                        mockFlights[index].status = 'scheduled';
                    } else if (action === 'cancel') {
                        mockFlights[index].status = 'cancelled';
                    }
                }
            });
            return { success: true };
        },
        onSuccess: (_, { action, ids }) => {
            queryClient.invalidateQueries({ queryKey: ['flights'] });
            setSelectedFlights([]);
            const actionText = action === 'activate' ? 'kích hoạt' : action === 'cancel' ? 'hủy' : 'xóa';
            toast({
                title: `Thực hiện thành công`,
                description: `Đã ${actionText} ${ids.length} chuyến bay`,
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

    const flights = flightsData?.data || [];
    const total = flightsData?.pagination?.total || 0;

    // Form validation
    const validateForm = (data: FlightFormData): Record<string, string> => {
        const errors: Record<string, string> = {};

        if (!data.flightCode.trim()) {
            errors.flightCode = "Bạn phải nhập mã chuyến bay";
        } else if (!/^[A-Z]{2}\d{3,4}$/.test(data.flightCode)) {
            errors.flightCode = "Mã chuyến bay không hợp lệ (ví dụ: VN1234)";
        }

        if (!data.airlineId) {
            errors.airlineId = "Bạn phải chọn hãng hàng không";
        }

        if (!data.fromAirport) {
            errors.fromAirport = "Bạn phải chọn sân bay đi";
        }

        if (!data.toAirport) {
            errors.toAirport = "Bạn phải chọn sân bay đến";
        }

        if (data.fromAirport === data.toAirport) {
            errors.toAirport = "Sân bay đến phải khác sân bay đi";
        }

        if (!data.departureAt) {
            errors.departureAt = "Bạn phải chọn giờ khởi hành";
        }

        if (!data.arrivalAt) {
            errors.arrivalAt = "Bạn phải chọn giờ đến";
        }

        if (data.departureAt && data.arrivalAt && new Date(data.arrivalAt) <= new Date(data.departureAt)) {
            errors.arrivalAt = "Giờ đến phải sau giờ khởi hành";
        }

        if (data.price <= 0) {
            errors.price = "Giá vé phải lớn hơn 0";
        }

        if (data.seatsTotal <= 0) {
            errors.seatsTotal = "Số ghế phải lớn hơn 0";
        }

        if (data.seatsAvailable < 0) {
            errors.seatsAvailable = "Số ghế có sẵn không được âm";
        }

        if (data.seatsAvailable > data.seatsTotal) {
            errors.seatsAvailable = "Số ghế có sẵn không được lớn hơn tổng số ghế";
        }

        if (data.cabinClass.length === 0) {
            errors.cabinClass = "Bạn phải chọn ít nhất một hạng ghế";
        }

        return errors;
    };

    const resetForm = () => {
        setFormData({
            flightCode: "",
            airlineId: "",
            fromAirport: "",
            toAirport: "",
            departureAt: "",
            arrivalAt: "",
            duration: "",
            cabinClass: ["Economy"],
            price: 0,
            seatsTotal: 0,
            seatsAvailable: 0,
            baggageInfo: "",
            status: "scheduled"
        });
        setFormErrors({});
        setIsFormDirty(false);
    };

    const handleFormChange = (field: keyof FlightFormData, value: any) => {
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

    const columns: Column[] = [
        {
            key: "flightCode",
            title: "Mã chuyến bay",
            sortable: true,
            render: (value, record: Flight) => (
                <div>
                    <div className="font-mono font-medium">{value}</div>
                    <div className="text-sm text-gray-500">{record.id}</div>
                </div>
            ),
        },
        {
            key: "airline",
            title: "Hãng bay",
            render: (value, record: Flight) => (
                <div className="flex items-center space-x-2">
                    <img
                        src={value.logo}
                        alt={value.name}
                        className="w-8 h-8 rounded object-cover"
                    />
                    <div>
                        <div className="font-medium">{value.name}</div>
                        <div className="text-sm text-gray-500">{value.code}</div>
                    </div>
                </div>
            ),
        },
        {
            key: "route",
            title: "Tuyến bay",
            render: (_, record: Flight) => (
                <div className="text-sm">
                    <div className="flex items-center space-x-2 font-medium">
                        <span className="font-mono">{record.fromAirport.code}</span>
                        <Plane className="w-4 h-4 text-gray-400" />
                        <span className="font-mono">{record.toAirport.code}</span>
                    </div>
                    <div className="text-gray-500">
                        {record.fromAirport.city} → {record.toAirport.city}
                    </div>
                </div>
            ),
        },
        {
            key: "schedule",
            title: "Lịch bay",
            sortable: true,
            render: (_, record: Flight) => (
                <div className="text-sm">
                    <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="font-medium">
                            {new Date(record.departureAt).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </span>
                        <span className="text-gray-500">→</span>
                        <span>
                            {new Date(record.arrivalAt).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </span>
                    </div>
                    <div className="text-gray-500">
                        {new Date(record.departureAt).toLocaleDateString('vi-VN')}
                    </div>
                    <div className="text-xs text-gray-400">{record.duration}</div>
                </div>
            ),
        },
        {
            key: "cabinClass",
            title: "Hạng ghế",
            render: (value: string[]) => (
                <div className="space-y-1">
                    {value.map((cls, index) => (
                        <Badge
                            key={index}
                            variant="outline"
                            className="text-xs block w-fit"
                        >
                            {cls}
                        </Badge>
                    ))}
                </div>
            ),
        },
        {
            key: "price",
            title: "Giá vé",
            sortable: true,
            render: (value) => (
                <div className="text-sm">
                    <div className="flex items-center font-medium">
                        <DollarSign className="w-3 h-3 mr-1" />
                        {new Intl.NumberFormat('vi-VN').format(value)} ₫
                    </div>
                </div>
            ),
        },
        {
            key: "seats",
            title: "Ghế",
            render: (_, record: Flight) => (
                <div className="text-sm">
                    <div className="flex items-center">
                        <Users className="w-3 h-3 mr-1" />
                        <span className="font-medium">{record.seatsAvailable}</span>
                        <span className="text-gray-500">/{record.seatsTotal}</span>
                    </div>
                    <div className={`text-xs ${record.seatsAvailable <= record.seatsTotal * 0.2 ? 'text-red-600' :
                        record.seatsAvailable <= record.seatsTotal * 0.5 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                        {record.seatsAvailable} chỗ trống
                    </div>
                </div>
            ),
        },
        {
            key: "status",
            title: "Trạng thái",
            sortable: true,
            render: (value) => (
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
            ),
        },
    ];

    const handleView = (flight: Flight) => {
        setSelectedFlight(flight);
        setModalMode("view");
        setModalOpen(true);
    };

    const handleEdit = (flight: Flight) => {
        setSelectedFlight(flight);
        setFormData({
            flightCode: flight.flightCode,
            airlineId: flight.airline.id,
            fromAirport: flight.fromAirport.code,
            toAirport: flight.toAirport.code,
            departureAt: flight.departureAt.slice(0, 16),
            arrivalAt: flight.arrivalAt.slice(0, 16),
            duration: flight.duration,
            cabinClass: flight.cabinClass,
            price: flight.price,
            seatsTotal: flight.seatsTotal,
            seatsAvailable: flight.seatsAvailable,
            baggageInfo: flight.baggageInfo,
            status: flight.status
        });
        setModalMode("edit");
        setModalOpen(true);
        setIsFormDirty(false);
    };

    const handleDelete = (flight: Flight) => {
        setFlightToDelete(flight);
        setDeleteModalOpen(true);
    };

    const handleAdd = () => {
        setSelectedFlight(null);
        resetForm();
        setModalMode("create");
        setModalOpen(true);
    };

    const handleSubmit = () => {
        const errors = validateForm(formData);
        setFormErrors(errors);

        if (Object.keys(errors).length > 0) {
            toast({
                title: "Lỗi validation",
                description: "Vui lòng kiểm tra lại thông tin nhập vào",
                variant: "destructive",
            });
            return;
        }

        if (modalMode === "create") {
            createFlightMutation.mutate(formData);
        } else if (modalMode === "edit" && selectedFlight) {
            updateFlightMutation.mutate({ id: selectedFlight.id, data: formData });
        }
    };

    const confirmDelete = () => {
        if (flightToDelete) {
            const bookedSeats = flightToDelete.seatsTotal - flightToDelete.seatsAvailable;
            if (bookedSeats > 0) {
                toast({
                    title: "Không thể xóa chuyến bay",
                    description: "Chuyến bay này có đặt chỗ. Vui lòng hủy chuyến bay thay vì xóa.",
                    variant: "destructive",
                });
                return;
            }
            deleteFlightMutation.mutate(flightToDelete.id);
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
            label: "Hủy chuyến",
            action: (keys: string[]) => {
                bulkActionMutation.mutate({ action: 'cancel', ids: keys });
            },
            icon: <Ban className="w-4 h-4 mr-2" />,
            variant: "default" as const, // Change to "default"
        },
        {
            label: "Xóa",
            action: (keys: string[]) => {
                bulkActionMutation.mutate({ action: 'delete', ids: keys });
            },
            icon: <Trash2 className="w-4 h-4 mr-2" />,
            variant: "destructive" as const,
        },
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
            label: "Xóa",
            action: handleDelete,
            icon: <Trash2 className="mr-2 h-4 w-4" />,
            variant: "destructive" as const,
        },
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
        return createFlightMutation.isPending || updateFlightMutation.isPending;
    };

    const renderFlightForm = () => {
        if (modalMode === "view" && selectedFlight) {
            return (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <Label className="text-sm font-medium text-gray-700">Mã chuyến bay</Label>
                                <p className="mt-1 font-mono text-lg font-bold">{selectedFlight.flightCode}</p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-700">Hãng hàng không</Label>
                                <div className="mt-1 flex items-center space-x-2">
                                    <img
                                        src={selectedFlight.airline.logo}
                                        alt={selectedFlight.airline.name}
                                        className="w-8 h-8 rounded"
                                    />
                                    <span className="font-medium">{selectedFlight.airline.name}</span>
                                </div>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-700">Tuyến bay</Label>
                                <div className="mt-1 space-y-1">
                                    <div className="flex items-center space-x-2">
                                        <span className="font-mono font-bold">{selectedFlight.fromAirport.code}</span>
                                        <Plane className="w-4 h-4 text-gray-400" />
                                        <span className="font-mono font-bold">{selectedFlight.toAirport.code}</span>
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        {selectedFlight.fromAirport.name} → {selectedFlight.toAirport.name}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <Label className="text-sm font-medium text-gray-700">Lịch bay</Label>
                                <div className="mt-1 space-y-1">
                                    <p className="font-medium">
                                        {new Date(selectedFlight.departureAt).toLocaleString('vi-VN')} →{" "}
                                        {new Date(selectedFlight.arrivalAt).toLocaleString('vi-VN')}
                                    </p>
                                    <p className="text-sm text-gray-600">Thời gian bay: {selectedFlight.duration}</p>
                                </div>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-700">Giá vé</Label>
                                <p className="mt-1 text-lg font-bold text-green-600">
                                    {new Intl.NumberFormat('vi-VN').format(selectedFlight.price)} ₫
                                </p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-700">Ghế ngồi</Label>
                                <p className="mt-1">
                                    {selectedFlight.seatsAvailable} / {selectedFlight.seatsTotal} ghế còn trống
                                </p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <Label className="text-sm font-medium text-gray-700">Hạng ghế</Label>
                        <div className="mt-1 flex space-x-2">
                            {selectedFlight.cabinClass.map((cls, index) => (
                                <Badge key={index} variant="outline">{cls}</Badge>
                            ))}
                        </div>
                    </div>

                    <div>
                        <Label className="text-sm font-medium text-gray-700">Thông tin hành lý</Label>
                        <p className="mt-1 text-gray-900">{selectedFlight.baggageInfo}</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="flightCode">Mã chuyến bay *</Label>
                        <Input
                            id="flightCode"
                            value={formData.flightCode}
                            onChange={(e) => handleFormChange('flightCode', e.target.value.toUpperCase())}
                            placeholder="VN1234"
                            className={`font-mono ${formErrors.flightCode ? "border-red-500" : ""}`}
                        />
                        {formErrors.flightCode && (
                            <p className="text-sm text-red-500 mt-1">{formErrors.flightCode}</p>
                        )}
                    </div>
                    <div>
                        <Label htmlFor="airline">Hãng hàng không *</Label>
                        <Select
                            value={formData.airlineId}
                            onValueChange={(value) => handleFormChange('airlineId', value)}
                        >
                            <SelectTrigger className={formErrors.airlineId ? "border-red-500" : ""}>
                                <SelectValue placeholder="Chọn hãng hàng không" />
                            </SelectTrigger>
                            <SelectContent>
                                {mockAirlines.map((airline) => (
                                    <SelectItem key={airline.id} value={airline.id}>
                                        <div className="flex items-center space-x-2">
                                            <img src={airline.logo} alt={airline.name} className="w-6 h-6 rounded" />
                                            <span>{airline.name} ({airline.code})</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {formErrors.airlineId && (
                            <p className="text-sm text-red-500 mt-1">{formErrors.airlineId}</p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="fromAirport">Sân bay đi *</Label>
                        <Select
                            value={formData.fromAirport}
                            onValueChange={(value) => handleFormChange('fromAirport', value)}
                        >
                            <SelectTrigger className={formErrors.fromAirport ? "border-red-500" : ""}>
                                <SelectValue placeholder="Chọn sân bay đi" />
                            </SelectTrigger>
                            <SelectContent>
                                {mockAirports.map((airport) => (
                                    <SelectItem key={airport.code} value={airport.code}>
                                        {airport.code} - {airport.name} ({airport.city})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {formErrors.fromAirport && (
                            <p className="text-sm text-red-500 mt-1">{formErrors.fromAirport}</p>
                        )}
                    </div>
                    <div>
                        <Label htmlFor="toAirport">Sân bay đến *</Label>
                        <Select
                            value={formData.toAirport}
                            onValueChange={(value) => handleFormChange('toAirport', value)}
                        >
                            <SelectTrigger className={formErrors.toAirport ? "border-red-500" : ""}>
                                <SelectValue placeholder="Chọn sân bay đến" />
                            </SelectTrigger>
                            <SelectContent>
                                {mockAirports.map((airport) => (
                                    <SelectItem key={airport.code} value={airport.code}>
                                        {airport.code} - {airport.name} ({airport.city})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {formErrors.toAirport && (
                            <p className="text-sm text-red-500 mt-1">{formErrors.toAirport}</p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <Label htmlFor="departureAt">Giờ khởi hành *</Label>
                        <Input
                            id="departureAt"
                            type="datetime-local"
                            value={formData.departureAt}
                            onChange={(e) => {
                                handleFormChange('departureAt', e.target.value);
                                if (formData.arrivalAt) {
                                    const duration = calculateDuration(e.target.value, formData.arrivalAt);
                                    if (duration) handleFormChange('duration', duration);
                                }
                            }}
                            className={formErrors.departureAt ? "border-red-500" : ""}
                        />
                        {formErrors.departureAt && (
                            <p className="text-sm text-red-500 mt-1">{formErrors.departureAt}</p>
                        )}
                    </div>
                    <div>
                        <Label htmlFor="arrivalAt">Giờ đến *</Label>
                        <Input
                            id="arrivalAt"
                            type="datetime-local"
                            value={formData.arrivalAt}
                            onChange={(e) => {
                                handleFormChange('arrivalAt', e.target.value);
                                if (formData.departureAt) {
                                    const duration = calculateDuration(formData.departureAt, e.target.value);
                                    if (duration) handleFormChange('duration', duration);
                                }
                            }}
                            className={formErrors.arrivalAt ? "border-red-500" : ""}
                        />
                        {formErrors.arrivalAt && (
                            <p className="text-sm text-red-500 mt-1">{formErrors.arrivalAt}</p>
                        )}
                    </div>
                    <div>
                        <Label htmlFor="duration">Thời gian bay</Label>
                        <Input
                            id="duration"
                            value={formData.duration}
                            onChange={(e) => handleFormChange('duration', e.target.value)}
                            placeholder="2h 15m"
                            readOnly
                        />
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <Label htmlFor="price">Giá vé (VNĐ) *</Label>
                        <Input
                            id="price"
                            type="number"
                            value={formData.price || ""}
                            onChange={(e) => handleFormChange('price', parseInt(e.target.value) || 0)}
                            placeholder="2850000"
                            className={formErrors.price ? "border-red-500" : ""}
                        />
                        {formErrors.price && (
                            <p className="text-sm text-red-500 mt-1">{formErrors.price}</p>
                        )}
                    </div>
                    <div>
                        <Label htmlFor="seatsTotal">Tổng số ghế *</Label>
                        <Input
                            id="seatsTotal"
                            type="number"
                            value={formData.seatsTotal || ""}
                            onChange={(e) => {
                                const total = parseInt(e.target.value) || 0;
                                handleFormChange('seatsTotal', total);
                                if (modalMode === "create" && formData.seatsAvailable === 0) {
                                    handleFormChange('seatsAvailable', total);
                                }
                            }}
                            placeholder="180"
                            className={formErrors.seatsTotal ? "border-red-500" : ""}
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
                            onChange={(e) => handleFormChange('seatsAvailable', parseInt(e.target.value) || 0)}
                            placeholder="45"
                            className={formErrors.seatsAvailable ? "border-red-500" : ""}
                        />
                        {formErrors.seatsAvailable && (
                            <p className="text-sm text-red-500 mt-1">{formErrors.seatsAvailable}</p>
                        )}
                    </div>
                </div>

                <div>
                    <Label>Hạng ghế *</Label>
                    <div className="mt-2 space-y-2">
                        {cabinClassOptions.map((option) => (
                            <div key={option.value} className="flex items-center space-x-2">
                                <Checkbox
                                    id={option.value}
                                    checked={formData.cabinClass.includes(option.value)}
                                    onCheckedChange={(checked) => {
                                        if (checked) {
                                            handleFormChange('cabinClass', [...formData.cabinClass, option.value]);
                                        } else {
                                            handleFormChange('cabinClass', formData.cabinClass.filter(c => c !== option.value));
                                        }
                                    }}
                                />
                                <Label htmlFor={option.value}>{option.label}</Label>
                            </div>
                        ))}
                    </div>
                    {formErrors.cabinClass && (
                        <p className="text-sm text-red-500 mt-1">{formErrors.cabinClass}</p>
                    )}
                </div>

                <div>
                    <Label htmlFor="baggageInfo">Thông tin hành lý</Label>
                    <Textarea
                        id="baggageInfo"
                        value={formData.baggageInfo}
                        onChange={(e) => handleFormChange('baggageInfo', e.target.value)}
                        placeholder="Hành lý xách tay 7kg, hành lý ký gửi 23kg"
                        rows={3}
                    />
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
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý chuyến bay</h1>
                    <p className="text-gray-600 mt-1">Quản lý lịch bay, giá vé và thông tin chuyến bay</p>
                </div>
                <div className="flex items-center space-x-3">
                    {/* <Button
                        variant="outline"
                        onClick={() => refetch()}
                        disabled={isLoading}
                        className="hover:bg-primary-600 hover:text-white"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Làm mới
                    </Button> */}
                    <Button onClick={handleAdd} className="bg-primary hover:bg-primary-600">
                        <Plus className="w-4 h-4 mr-2" />
                        Thêm chuyến bay
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Tổng chuyến bay</p>
                                <p className="text-2xl font-bold">{total || 0}</p>
                            </div>
                            <Plane className="w-8 h-8 text-primary" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Đang hoạt động</p>
                                <p className="text-2xl font-bold">{flights.filter((f: Flight) => f.status === "scheduled").length}</p>
                            </div>
                            <Eye className="w-8 h-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Sắp hết chỗ</p>
                                <p className="text-2xl font-bold">
                                    {flights.filter((f: Flight) => f.seatsAvailable <= f.seatsTotal * 0.2).length}
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
                                <p className="text-sm text-gray-600">Doanh thu TB</p>
                                <p className="text-2xl font-bold">{flights.length > 0 ? new Intl.NumberFormat('vi-VN').format(
                                    flights.reduce((sum: number, f: Flight) => sum + f.price, 0) / flights.length
                                ) : '0'} ₫</p>
                            </div>
                            <DollarSign className="w-8 h-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Danh sách chuyến bay</CardTitle>
                            <CardDescription>Quản lý thông tin và lịch trình chuyến bay</CardDescription>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Select value={filters.airline} onValueChange={(value) => setFilters(prev => ({ ...prev, airline: value }))}>
                                <SelectTrigger className="w-40">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả hãng bay</SelectItem>
                                    {mockAirlines.map((airline) => (
                                        <SelectItem key={airline.id} value={airline.id}>
                                            {airline.name}
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
                            <Select value={filters.route} onValueChange={(value) => setFilters(prev => ({ ...prev, route: value }))}>
                                <SelectTrigger className="w-36">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả tuyến</SelectItem>
                                    {mockAirports.flatMap(from =>
                                        mockAirports
                                            .filter(to => to.code !== from.code)
                                            .map(to => (
                                                <SelectItem key={`${from.code}-${to.code}`} value={`${from.code}-${to.code}`}>
                                                    {from.city} → {to.city}
                                                </SelectItem>
                                            ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <DataTable
                        columns={columns}
                        data={flights}
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
                            selectedRowKeys: selectedFlights,
                            onChange: setSelectedFlights,
                        }}
                        bulkActions={bulkActions}
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
                    modalMode === "create" ? "Thêm chuyến bay mới" :
                        modalMode === "edit" ? "Chỉnh sửa chuyến bay" :
                            "Chi tiết chuyến bay"
                }
                description={
                    modalMode === "create" ? "Tạo lịch bay mới trong hệ thống" :
                        modalMode === "edit" ? "Cập nhật thông tin chuyến bay" :
                            "Xem thông tin chi tiết chuyến bay"
                }
                mode={modalMode}
                size="medium"
                onSubmit={handleSubmit}
                submitDisabled={isSubmitDisabled()}
                submitText={modalMode === "create" ? "Thêm chuyến bay" : "Cập nhật"}
                cancelText="Hủy"
            >
                <div className="max-h-[70vh] overflow-y-auto pr-2">

                    {renderFlightForm()}
                </div>
            </ModalForm>

            <ConfirmModal
                open={deleteModalOpen}
                onOpenChange={setDeleteModalOpen}
                title="Xóa chuyến bay"
                message={`Bạn có chắc chắn muốn xóa chuyến bay "${flightToDelete?.flightCode}"?${flightToDelete && (flightToDelete.seatsTotal - flightToDelete.seatsAvailable) > 0 ? ' Chuyến bay này có đặt chỗ.' : ''}`}
                type="danger"
                requireTyping={true}
                typingText={flightToDelete && (flightToDelete.seatsTotal - flightToDelete.seatsAvailable) > 0 ? "FORCE_DELETE" : "DELETE"}
                onConfirm={confirmDelete}
                confirmText="Xóa chuyến bay"
                loading={deleteFlightMutation.isPending}
            />
        </div>
    );
}