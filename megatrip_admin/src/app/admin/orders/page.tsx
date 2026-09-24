"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShoppingBag, Plus, Edit, Eye, Trash2, FileText, Printer, RefreshCw, DollarSign, Package, Truck, CheckCircle, XCircle, Clock, AlertTriangle, Download } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Textarea } from "../../components/ui/textarea";
import { Separator } from "../../components/ui/separator";
import { DataTable, Column } from "../../components/DataTable";
import { ModalForm } from "../../components/ModalForm";
import { ConfirmModal } from "../../components/ConfirmModal";
import { useToast } from "../../components/ui/use-toast";

interface OrderItem {
    id: string;
    type: "tour" | "flight" | "bus";
    name: string;
    sku: string;
    image?: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
}
interface TimelineEvent {
    ts: {
        $date: {
            $numberLong: string;
        };
    };
    text: string;
    meta?: {
        ticket?: {
            $oid: string;
        };
    };
}
interface Order {
    id: string;
    orderNumber: string;
    customerId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    customerAddress: string;
    items: OrderItem[];
    subtotal: number;
    discounts: Array<{
        code: string;
        name: string;
        amount: number;
    }>;
    fees: Array<{
        name: string;
        amount: number;
    }>;
    tax: number;
    total: number;
    paymentMethod: string;
    paymentStatus: "pending" | "paid" | "failed" | "refunded";
    orderStatus: "pending" | "confirmed" | "processing" | "completed" | "cancelled";
    timeline: Array<{
        status: string;
        note?: string;
        actor: string;
        timestamp: string;
    }>;
    notes: Array<{
        id: string;
        content: string;
        author: string;
        timestamp: string;
    }>;
    createdAt: string;
    updatedAt: string;
    changeCalendar?: boolean;
    dateChangeCalendar?: string;
    // timeline: Array<TimelineEvent>;
}
// Add API_BASE at the top, assuming it's defined in your config
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
interface OrderFilters {
    paymentStatus: string;
    orderStatus: string;
    paymentMethod: string;
    dateRange?: [string, string];
    type: string;
}

const paymentMethods = [
    { value: "bank_transfer", label: "Chuyển khoản ngân hàng" },
    { value: "credit_card", label: "Thẻ tín dụng" },
    { value: "e_wallet", label: "Ví điện tử" },
    { value: "cash", label: "Tiền mặt" },
];

const orderStatuses = [
    { value: "pending", label: "Chờ xử lý", color: "yellow" },
    { value: "confirmed", label: "Đã xác nhận", color: "blue" },
    { value: "processing", label: "Đang xử lý", color: "purple" },
    { value: "completed", label: "Hoàn thành", color: "green" },
    { value: "cancelled", label: "Đã hủy", color: "red" },
];

const paymentStatuses = [
    { value: "pending", label: "Chờ thanh toán", color: "yellow" },
    { value: "paid", label: "Đã thanh toán", color: "green" },
    { value: "failed", label: "Thanh toán thất bại", color: "red" },
    { value: "refunded", label: "Đã hoàn tiền", color: "gray" },
];

const mockOrders: Order[] = [
    {
        id: "order_001",
        orderNumber: "ORD-20250912-001",
        customerId: "cust_001",
        customerName: "Nguyễn Văn A",
        customerEmail: "vana@example.com",
        customerPhone: "0901234567",
        customerAddress: "123 Đường Láng, Hà Nội",
        items: [
            { id: "item_001", type: "flight", name: "Vé máy bay SGN-HAN", sku: "FLIGHT-VN1234", quantity: 2, unitPrice: 2850000, subtotal: 5700000 },
            { id: "item_002", type: "tour", name: "Tour Hà Nội 3N2Đ", sku: "TOUR-HN32", quantity: 1, unitPrice: 5000000, subtotal: 5000000 },
        ],
        subtotal: 10700000,
        discounts: [{ code: "PROMO10", name: "Giảm 10%", amount: 1070000 }],
        fees: [{ name: "Phí dịch vụ", amount: 200000 }],
        tax: 100000,
        total: 9850000,
        paymentMethod: "credit_card",
        paymentStatus: "paid",
        orderStatus: "confirmed",
        timeline: [
            { status: "pending", actor: "System", timestamp: "2025-09-12T08:00:00.000Z" },
            { status: "confirmed", note: "Đơn hàng đã được xác nhận", actor: "Admin", timestamp: "2025-09-12T09:00:00.000Z" },
        ],
        notes: [
            { id: "note_001", content: "Khách hàng yêu cầu xuất hóa đơn VAT", author: "Admin", timestamp: "2025-09-12T09:30:00.000Z" },
        ],
        createdAt: "2025-09-12T08:00:00.000Z",
        updatedAt: "2025-09-12T09:00:00.000Z",
    },
    {
        id: "order_002",
        orderNumber: "ORD-20250912-002",
        customerId: "cust_002",
        customerName: "Trần Thị B",
        customerEmail: "thib@example.com",
        customerPhone: "0912345678",
        customerAddress: "456 Nguyễn Huệ, TP.HCM",
        items: [
            { id: "item_003", type: "bus", name: "Vé xe SGN-DAD", sku: "BUS-SD45", quantity: 1, unitPrice: 600000, subtotal: 600000 },
        ],
        subtotal: 600000,
        discounts: [],
        fees: [],
        tax: 60000,
        total: 660000,
        paymentMethod: "cash",
        paymentStatus: "pending",
        orderStatus: "pending",
        timeline: [
            { status: "pending", actor: "System", timestamp: "2025-09-12T10:00:00.000Z" },
        ],
        notes: [],
        createdAt: "2025-09-12T10:00:00.000Z",
        updatedAt: "2025-09-12T10:00:00.000Z",
    },
    {
        id: "order_003",
        orderNumber: "ORD-20250912-003",
        customerId: "cust_003",
        customerName: "Lê Văn C",
        customerEmail: "vanc@example.com",
        customerPhone: "0923456789",
        customerAddress: "789 Lê Lợi, Đà Nẵng",
        items: [
            { id: "item_004", type: "tour", name: "Tour Phú Quốc 4N3Đ", sku: "TOUR-PQ43", quantity: 2, unitPrice: 7000000, subtotal: 14000000 },
        ],
        subtotal: 14000000,
        discounts: [{ code: "SUMMER20", name: "Giảm 20%", amount: 2800000 }],
        fees: [{ name: "Phí xử lý", amount: 300000 }],
        tax: 140000,
        total: 11440000,
        paymentMethod: "e_wallet",
        paymentStatus: "paid",
        orderStatus: "completed",
        timeline: [
            { status: "pending", actor: "System", timestamp: "2025-09-11T14:00:00.000Z" },
            { status: "confirmed", actor: "Admin", timestamp: "2025-09-11T15:00:00.000Z" },
            { status: "completed", note: "Đã hoàn thành", actor: "Admin", timestamp: "2025-09-12T08:00:00.000Z" },
        ],
        notes: [],
        createdAt: "2025-09-11T14:00:00.000Z",
        updatedAt: "2025-09-12T08:00:00.000Z",
    },
    {
        id: "order_004",
        orderNumber: "ORD-20250912-004",
        customerId: "cust_004",
        customerName: "Phạm Thị D",
        customerEmail: "thid@example.com",
        customerPhone: "0934567890",
        customerAddress: "101 Hai Bà Trưng, Huế",
        items: [
            { id: "item_005", type: "flight", name: "Vé máy bay DAD-HAN", sku: "FLIGHT-VJ5678", quantity: 1, unitPrice: 1500000, subtotal: 1500000 },
        ],
        subtotal: 1500000,
        discounts: [],
        fees: [],
        tax: 150000,
        total: 1650000,
        paymentMethod: "bank_transfer",
        paymentStatus: "failed",
        orderStatus: "pending",
        timeline: [
            { status: "pending", actor: "System", timestamp: "2025-09-12T11:00:00.000Z" },
            { status: "failed", note: "Thanh toán thất bại", actor: "System", timestamp: "2025-09-12T11:30:00.000Z" },
        ],
        notes: [
            { id: "note_002", content: "Khách hàng cần hỗ trợ thanh toán", author: "Admin", timestamp: "2025-09-12T11:45:00.000Z" },
        ],
        createdAt: "2025-09-12T11:00:00.000Z",
        updatedAt: "2025-09-12T11:30:00.000Z",
    },
    {
        id: "order_005",
        orderNumber: "ORD-20250912-005",
        customerId: "cust_005",
        customerName: "Hoàng Văn E",
        customerEmail: "vane@example.com",
        customerPhone: "0945678901",
        customerAddress: "202 Trần Phú, Nha Trang",
        items: [
            { id: "item_006", type: "tour", name: "Tour Đà Lạt 3N2Đ", sku: "TOUR-DL32", quantity: 1, unitPrice: 4500000, subtotal: 4500000 },
            { id: "item_007", type: "bus", name: "Vé xe SGN-DLI", sku: "BUS-SD12", quantity: 1, unitPrice: 500000, subtotal: 500000 },
        ],
        subtotal: 5000000,
        discounts: [],
        fees: [{ name: "Phí đặt chỗ", amount: 100000 }],
        tax: 50000,
        total: 5150000,
        paymentMethod: "credit_card",
        paymentStatus: "paid",
        orderStatus: "processing",
        timeline: [
            { status: "pending", actor: "System", timestamp: "2025-09-12T12:00:00.000Z" },
            { status: "confirmed", actor: "Admin", timestamp: "2025-09-12T12:30:00.000Z" },
            { status: "processing", note: "Đang xử lý", actor: "Admin", timestamp: "2025-09-12T13:00:00.000Z" },
        ],
        notes: [],
        createdAt: "2025-09-12T12:00:00.000Z",
        updatedAt: "2025-09-12T13:00:00.000Z",
    },
    {
        id: "order_006",
        orderNumber: "ORD-20250912-006",
        customerId: "cust_006",
        customerName: "Đỗ Thị F",
        customerEmail: "thif@example.com",
        customerPhone: "0956789012",
        customerAddress: "303 Lý Thường Kiệt, Đà Nẵng",
        items: [
            { id: "item_008", type: "flight", name: "Vé máy bay SGN-DAD", sku: "FLIGHT-VJ2345", quantity: 2, unitPrice: 1600000, subtotal: 3200000 },
        ],
        subtotal: 3200000,
        discounts: [],
        fees: [],
        tax: 320000,
        total: 3520000,
        paymentMethod: "e_wallet",
        paymentStatus: "refunded",
        orderStatus: "cancelled",
        timeline: [
            { status: "pending", actor: "System", timestamp: "2025-09-12T14:00:00.000Z" },
            { status: "cancelled", note: "Khách hủy đơn", actor: "Admin", timestamp: "2025-09-12T15:00:00.000Z" },
            { status: "refunded", note: "Đã hoàn tiền", actor: "Admin", timestamp: "2025-09-12T15:30:00.000Z" },
        ],
        notes: [
            { id: "note_003", content: "Hoàn tiền do khách hủy sớm", author: "Admin", timestamp: "2025-09-12T15:30:00.000Z" },
        ],
        createdAt: "2025-09-12T14:00:00.000Z",
        updatedAt: "2025-09-12T15:30:00.000Z",
    },
    {
        id: "order_007",
        orderNumber: "ORD-20250912-007",
        customerId: "cust_007",
        customerName: "Bùi Văn G",
        customerEmail: "vang@example.com",
        customerPhone: "0967890123",
        customerAddress: "404 Nguyễn Trãi, Hà Nội",
        items: [
            { id: "item_009", type: "tour", name: "Tour Sapa 2N1Đ", sku: "TOUR-SP21", quantity: 1, unitPrice: 3000000, subtotal: 3000000 },
        ],
        subtotal: 3000000,
        discounts: [],
        fees: [],
        tax: 300000,
        total: 3300000,
        paymentMethod: "bank_transfer",
        paymentStatus: "paid",
        orderStatus: "confirmed",
        timeline: [
            { status: "pending", actor: "System", timestamp: "2025-09-12T16:00:00.000Z" },
            { status: "confirmed", actor: "Admin", timestamp: "2025-09-12T16:30:00.000Z" },
        ],
        notes: [],
        createdAt: "2025-09-12T16:00:00.000Z",
        updatedAt: "2025-09-12T16:30:00.000Z",
    },
    {
        id: "order_008",
        orderNumber: "ORD-20250912-008",
        customerId: "cust_008",
        customerName: "Ngô Thị H",
        customerEmail: "thih@example.com",
        customerPhone: "0978901234",
        customerAddress: "505 Lê Văn Sỹ, TP.HCM",
        items: [
            { id: "item_010", type: "flight", name: "Vé máy bay PQC-SGN", sku: "FLIGHT-BL6789", quantity: 1, unitPrice: 1300000, subtotal: 1300000 },
        ],
        subtotal: 1300000,
        discounts: [],
        fees: [],
        tax: 130000,
        total: 1430000,
        paymentMethod: "credit_card",
        paymentStatus: "paid",
        orderStatus: "completed",
        timeline: [
            { status: "pending", actor: "System", timestamp: "2025-09-11T09:00:00.000Z" },
            { status: "confirmed", actor: "Admin", timestamp: "2025-09-11T10:00:00.000Z" },
            { status: "completed", note: "Đã hoàn thành", actor: "Admin", timestamp: "2025-09-12T08:00:00.000Z" },
        ],
        notes: [],
        createdAt: "2025-09-11T09:00:00.000Z",
        updatedAt: "2025-09-12T08:00:00.000Z",
    },
    {
        id: "order_009",
        orderNumber: "ORD-20250912-009",
        customerId: "cust_009",
        customerName: "Vũ Văn I",
        customerEmail: "vani@example.com",
        customerPhone: "0989012345",
        customerAddress: "606 Phạm Văn Đồng, Hà Nội",
        items: [
            { id: "item_011", type: "tour", name: "Tour Hạ Long 2N1Đ", sku: "TOUR-HL21", quantity: 2, unitPrice: 3500000, subtotal: 7000000 },
        ],
        subtotal: 7000000,
        discounts: [],
        fees: [],
        tax: 700000,
        total: 7700000,
        paymentMethod: "e_wallet",
        paymentStatus: "pending",
        orderStatus: "pending",
        timeline: [
            { status: "pending", actor: "System", timestamp: "2025-09-12T17:00:00.000Z" },
        ],
        notes: [],
        createdAt: "2025-09-12T17:00:00.000Z",
        updatedAt: "2025-09-12T17:00:00.000Z",
    },
    {
        id: "order_010",
        orderNumber: "ORD-20250912-010",
        customerId: "cust_010",
        customerName: "Lý Thị K",
        customerEmail: "thik@example.com",
        customerPhone: "0990123456",
        customerAddress: "707 Nguyễn Văn Cừ, Đà Nẵng",
        items: [
            { id: "item_012", type: "flight", name: "Vé máy bay HAN-PQC", sku: "FLIGHT-VJ1234", quantity: 1, unitPrice: 1700000, subtotal: 1700000 },
            { id: "item_013", type: "tour", name: "Tour Phú Quốc 3N2Đ", sku: "TOUR-PQ32", quantity: 1, unitPrice: 6000000, subtotal: 6000000 },
        ],
        subtotal: 7700000,
        discounts: [{ code: "PROMO5", name: "Giảm 5%", amount: 385000 }],
        fees: [],
        tax: 770000,
        total: 8085000,
        paymentMethod: "bank_transfer",
        paymentStatus: "paid",
        orderStatus: "processing",
        timeline: [
            { status: "pending", actor: "System", timestamp: "2025-09-12T18:00:00.000Z" },
            { status: "confirmed", actor: "Admin", timestamp: "2025-09-12T18:30:00.000Z" },
            { status: "processing", note: "Đang xử lý", actor: "Admin", timestamp: "2025-09-12T19:00:00.000Z" },
        ],
        notes: [],
        createdAt: "2025-09-12T18:00:00.000Z",
        updatedAt: "2025-09-12T19:00:00.000Z",
    },
];

export default function Orders() {
    const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [filters, setFilters] = useState<OrderFilters>({
        paymentStatus: "all",
        orderStatus: "all",
        paymentMethod: "all",
        type: "all"
    });
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("view");
    const [selectedOrder, setSelectedOrder] = useState<Order | any>(null);
    const [refundModalOpen, setRefundModalOpen] = useState(false);
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [noteModalOpen, setNoteModalOpen] = useState(false);
    const [newNote, setNewNote] = useState("");
    const [orderDetails, setOrderDetails] = useState<any>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [isSelectingCompletable, setIsSelectingCompletable] = useState(false);
    const [isSelectingCancellable, setIsSelectingCancellable] = useState(false);
    const [refundData, setRefundData] = useState({
        amount: 0,
        reason: "",
        method: "bank_transfer",
        transactionId: ""
    });

    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
    });
    const [bulkLoading, setBulkLoading] = useState(false);
    const [bulkLoadingMessage, setBulkLoadingMessage] = useState("");


    // Thêm query để fetch tất cả orders cho stats
    const { data: allOrdersData } = useQuery({
        queryKey: ['orders-all'],
        queryFn: async () => {
            const res = await fetch(`${API_BASE}/api/orders?page=1&pageSize=10000`); // Fetch nhiều để có đủ data
            if (!res.ok) throw new Error('Failed to fetch all orders');
            const json = await res.json();
            return json.data.map((order: any) => ({
                ...order,
                id: order._id,
            }));
        },
    });

    // Fetch orders with API
    // const { data: ordersData, isLoading, error, refetch } = useQuery({
    //     queryKey: ['orders', pagination.current, pagination.pageSize, searchQuery, filters],
    //     queryFn: async () => {
    //         const params = new URLSearchParams({
    //             page: pagination.current.toString(),
    //             pageSize: pagination.pageSize.toString(),
    //         });
    //         if (searchQuery) params.append('q', searchQuery);
    //         if (filters.paymentStatus !== 'all') params.append('paymentStatus', filters.paymentStatus);
    //         if (filters.orderStatus !== 'all') params.append('orderStatus', filters.orderStatus);
    //         if (filters.paymentMethod !== 'all') params.append('paymentMethod', filters.paymentMethod);
    //         if (filters.type !== 'all') params.append('type', filters.type); // Thêm param type

    //         const res = await fetch(`${API_BASE}/api/orders?${params.toString()}`);
    //         if (!res.ok) throw new Error('Failed to fetch orders');
    //         const json = await res.json();
    //         // Map _id to id
    //         const mappedData = json.data.map((order: any) => ({
    //             ...order,
    //             id: order._id,
    //         }));
    //         return { data: mappedData, pagination: json.pagination };
    //     },
    // });
    const { data: ordersData, isLoading, error, refetch } = useQuery({
        queryKey: ['orders', pagination.current, pagination.pageSize, searchQuery, filters], // Bao gồm pagination để refetch khi đổi page
        queryFn: async () => {
            const params = new URLSearchParams({
                page: pagination.current.toString(),
                pageSize: pagination.pageSize.toString(),
            });
            if (searchQuery) params.append('q', searchQuery);
            if (filters.paymentStatus !== 'all') params.append('paymentStatus', filters.paymentStatus);
            if (filters.orderStatus !== 'all') params.append('orderStatus', filters.orderStatus);
            if (filters.paymentMethod !== 'all') params.append('paymentMethod', filters.paymentMethod);

            const res = await fetch(`${API_BASE}/api/orders?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch orders');
            const json = await res.json();

            // Map _id to id
            let data = json.data.map((order: any) => ({
                ...order,
                id: order._id,
            }));

            // Filter client-side cho type (nếu backend chưa hỗ trợ)
            if (filters.type !== 'all') {
                data = data.filter((order: any) =>
                    order.items && order.items.some((item: any) => item.type === filters.type)
                );
            }

            // Backend trả pagination info (total, current, pageSize)
            return { data, pagination: json.pagination || { total: data.length, current: pagination.current, pageSize: pagination.pageSize } };
        },
    });
    // Update order status mutation (mock implementation)
    // const updateOrderMutation = useMutation({
    //     mutationFn: async ({ id, status, note }: { id: string; status: string; note?: string }) => {
    //         const index = mockOrders.findIndex(order => order.id === id);
    //         if (index === -1) throw new Error('Order not found');

    //         mockOrders[index] = {
    //             ...mockOrders[index],
    //             orderStatus: status as any,
    //             paymentStatus: status === 'cancelled' && mockOrders[index].paymentStatus === 'paid' ? 'refunded' : mockOrders[index].paymentStatus,
    //             timeline: [
    //                 ...mockOrders[index].timeline,
    //                 { status, note, actor: 'Admin', timestamp: new Date().toISOString() },
    //             ],
    //             updatedAt: new Date().toISOString(),
    //         };
    //         return mockOrders[index];
    //     },
    //     onSuccess: () => {
    //         queryClient.invalidateQueries({ queryKey: ['orders'] });
    //         toast({
    //             title: "Cập nhật đơn hàng thành công",
    //             description: "Trạng thái đơn hàng đã được cập nhật",
    //         });
    //     },
    //     onError: (error: any) => {
    //         toast({
    //             title: "Lỗi khi cập nhật đơn hàng",
    //             description: error.message,
    //             variant: "destructive",
    //         });
    //     },
    // });

    // Update order status mutation (call API instead of mock)
    const updateOrderMutation = useMutation({
        mutationFn: async ({ id, status, note }: { id: string; status: string; note?: string }) => {
            const res = await fetch(`${API_BASE}/api/orders/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderStatus: status,
                    note: note || `Trạng thái cập nhật thành ${status}`,
                }),
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to update order');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] }); // Đảm bảo refetch full danh sách
            toast({
                title: "Cập nhật đơn hàng thành công",
                description: "Trạng thái đơn hàng đã được cập nhật",
            });
        },
        onError: (error: any) => {
            toast({
                title: "Lỗi khi cập nhật đơn hàng",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    // Refund mutation (mock implementation)
    const refundMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const index = mockOrders.findIndex(order => order.id === id);
            if (index === -1) throw new Error('Order not found');
            if (mockOrders[index].paymentStatus !== 'paid') throw new Error('Order is not eligible for refund');

            mockOrders[index] = {
                ...mockOrders[index],
                paymentStatus: 'refunded',
                orderStatus: mockOrders[index].orderStatus === 'completed' ? 'completed' : 'cancelled',
                timeline: [
                    ...mockOrders[index].timeline,
                    { status: 'refunded', note: `Hoàn tiền: ${data.reason}`, actor: 'Admin', timestamp: new Date().toISOString() },
                ],
                notes: [
                    ...mockOrders[index].notes,
                    { id: `note_${Date.now()}`, content: `Hoàn tiền: ${data.reason}`, author: 'Admin', timestamp: new Date().toISOString() },
                ],
                updatedAt: new Date().toISOString(),
            };
            return mockOrders[index];
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            setRefundModalOpen(false);
            setRefundData({ amount: 0, reason: "", method: "bank_transfer", transactionId: "" });
            toast({
                title: "Hoàn tiền thành công",
                description: "Yêu cầu hoàn tiền đã được xử lý",
            });
        },
        onError: (error: any) => {
            toast({
                title: "Lỗi khi hoàn tiền",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    // Add note mutation (mock implementation)
    const addNoteMutation = useMutation({
        mutationFn: async ({ id, note }: { id: string; note: string }) => {
            const index = mockOrders.findIndex(order => order.id === id);
            if (index === -1) throw new Error('Order not found');

            mockOrders[index] = {
                ...mockOrders[index],
                notes: [
                    ...mockOrders[index].notes,
                    { id: `note_${Date.now()}`, content: note, author: 'Admin', timestamp: new Date().toISOString() },
                ],
                updatedAt: new Date().toISOString(),
            };
            return mockOrders[index];
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            setNoteModalOpen(false);
            setNewNote("");
            toast({
                title: "Thêm ghi chú thành công",
                description: "Ghi chú đã được thêm vào đơn hàng",
            });
        },
        onError: (error: any) => {
            toast({
                title: "Lỗi khi thêm ghi chú",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const orders = ordersData?.data || [];
    const total = allOrdersData?.length || 0;

    const getStatusInfo = (status: string, type: 'order' | 'payment') => {
        const statuses = type === 'order' ? orderStatuses : paymentStatuses;
        return statuses.find(s => s.value === status) || { label: status, color: 'gray' };
    };

    const getRefundableAmount = (order: Order) => {
        if (order.paymentStatus !== 'paid') return 0;
        if (order.orderStatus === 'completed') return order.total * 0.8; // 80% refund for completed
        if (order.orderStatus === 'cancelled') return 0;
        return order.total; // Full refund for other statuses
    };
    const getTypeColor = (type: string) => {
        switch (type) {
            case 'bus': return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
            case 'tour': return 'bg-green-100 text-green-800 hover:bg-green-100';
            case 'flight': return 'bg-purple-100 text-purple-800 hover:bg-purple-100';
            default: return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
        }
    };

    const columns: Column[] = [
        {
            key: "orderNumber",
            title: "Số đơn hàng",
            sortable: true,
            render: (value, record: Order) => (
                <div>
                    <div className="font-mono font-medium">{value}</div>
                    <div className="text-sm text-gray-500">{record.id}</div>
                </div>
            ),
        },
        {
            key: "customer",
            title: "Khách hàng",
            render: (_, record: Order) => (
                <div>
                    <div className="font-medium">{record.customerName}</div>
                    <div className="text-sm text-gray-500">{record.customerEmail}</div>
                    <div className="text-xs text-gray-400">{record.customerPhone}</div>
                </div>
            ),
        },
        {
            key: "items",
            title: "Sản phẩm",
            render: (items: OrderItem[]) => (
                <div className="space-y-1">
                    {items.slice(0, 2).map((item, index) => (
                        <div key={index} className="text-sm flex items-center gap-2">
                            <span className="font-medium">{item.name}</span>
                            <Badge className={`${getTypeColor(item.type)} uppercase`}>
                                {item.type}
                            </Badge>

                            {/* <span className="text-gray-500">x{item.quantity}</span> */}
                        </div>
                    ))}
                    {items.length > 2 && (
                        <div className="text-xs text-gray-500">+{items.length - 2} sản phẩm khác</div>
                    )}
                </div>
            ),
        },
        {
            key: "total",
            title: "Tổng tiền",
            sortable: true,
            render: (value, record: Order) => (
                <div className="text-sm">
                    <div className="font-bold">
                        {new Intl.NumberFormat('vi-VN').format(value)} ₫
                    </div>
                    {/* <div className="text-gray-500">
                        {record.items.reduce((sum, item) => sum + item.quantity, 0)} sản phẩm
                    </div> */}
                </div>
            ),
        },
        {
            key: "paymentMethod",
            title: "Thanh toán",
            render: (value, record: Order) => {
                const method = paymentMethods.find(m => m.value === value);
                const paymentStatus = getStatusInfo(record.paymentStatus, 'payment');

                return (
                    <div className="text-sm">
                        <div className="font-medium">{method?.label || value}</div>
                        <Badge className={
                            paymentStatus.color === 'green' ? "bg-green-100 text-green-800 hover:bg-green-100" :
                                paymentStatus.color === 'yellow' ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" :
                                    paymentStatus.color === 'red' ? "bg-red-100 text-red-800 hover:bg-red-100" :
                                        "bg-gray-100 text-gray-800 hover:bg-gray-100"
                        }>
                            {paymentStatus.label}
                        </Badge>
                    </div>
                );
            },
        },
        {
            key: "orderStatus",
            title: "Trạng thái",
            sortable: true,
            render: (value, record: Order) => {
                const status = getStatusInfo(value, 'order');
                return (
                    <div className="flex flex-col gap-1">
                        <Badge className={
                            status.color === 'green' ? "bg-green-100 text-green-800 hover:bg-green-100" :
                                status.color === 'blue' ? "bg-blue-100 text-blue-800 hover:bg-blue-100" :
                                    status.color === 'purple' ? "bg-purple-100 text-purple-800 hover:bg-purple-100" :
                                        status.color === 'yellow' ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" :
                                            status.color === 'red' ? "bg-red-100 text-red-800 hover:bg-red-100" :
                                                "bg-gray-100 text-gray-800 hover:bg-gray-100"
                        }>
                            {status.label}
                        </Badge>
                        {record.changeCalendar && (
                            <Badge variant="secondary" className="bg-orange-100 text-orange-800 hover:bg-orange-100">
                                Đã đổi lịch
                            </Badge>
                        )}
                    </div>
                );
            },
        },
        {
            key: "createdAt",
            title: "Ngày tạo",
            sortable: true,
            render: (value) => (
                <div className="text-sm">
                    <div>{new Date(value).toLocaleDateString('vi-VN')}</div>
                    <div className="text-gray-500">
                        {new Date(value).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </div>
                </div>
            ),
        },
        {
            key: "serviceDate",
            title: "Ngày sử dụng",
            sortable: true,
            render: (value, record: any) => {
                const snap = record.metadata?.bookingDataSnapshot;
                const item = record.items?.[0];
                let serviceDate = '';
                if (item?.type === 'flight' && !record.changeCalendar) {
                    const flights = snap?.flights;
                    if (flights?.outbound && flights?.inbound) {
                        serviceDate = `${flights.outbound.date} - ${flights.inbound.date}`;
                    } else if (flights?.outbound) {
                        serviceDate = flights.outbound.date;
                    } else if (flights?.inbound) {
                        serviceDate = flights.inbound.date;
                    }
                } else {
                    const originalServiceDateRaw = snap?.details?.startDateTime ?? snap?.details?.date;
                    serviceDate = record.changeCalendar && record.dateChangeCalendar ? record.dateChangeCalendar : originalServiceDateRaw;
                    if (serviceDate) {
                        const serviceDateObj = new Date(serviceDate);
                        serviceDate = serviceDateObj.toISOString().slice(0, 10);
                    }
                }
                return <div className="text-sm">{serviceDate || '--'}</div>;
            },
        },
    ];

    const handleView = async (order: Order) => {
        setSelectedOrder(order);
        setLoadingDetails(true);
        try {
            const res = await fetch(`${API_BASE}/api/orders/${order.id}/client/details`);
            if (!res.ok) throw new Error('Failed to load order details');
            const data = await res.json();
            setOrderDetails(data);
        } catch (err) {
            console.error('Error loading order details:', err);
            setOrderDetails(null);
        } finally {
            setLoadingDetails(false);
        }
        setModalMode("view");
        setModalOpen(true);
    };

    const handleConfirmOrder = (order: Order) => {
        updateOrderMutation.mutate({
            id: order.id,
            status: "confirmed",
            note: "Đơn hàng đã được xác nhận bởi admin"
        });
    };

    const handleCompleteOrder = (order: any) => {
        // Tính ngày sử dụng từ metadata
        const snap = order.metadata?.bookingDataSnapshot;
        const item = order.items?.[0];
        let serviceDateRaw = '';
        if (item?.type === 'flight' && !order.changeCalendar) {
            const flights = snap?.flights;
            if (flights?.outbound && flights?.inbound) {
                serviceDateRaw = flights.outbound.date; // Dùng outbound để check
            } else if (flights?.outbound) {
                serviceDateRaw = flights.outbound.date;
            } else if (flights?.inbound) {
                serviceDateRaw = flights.inbound.date;
            }
        } else {
            const originalServiceDateRaw = snap?.details?.startDateTime ?? snap?.details?.date;
            serviceDateRaw = order.changeCalendar && order.dateChangeCalendar ? order.dateChangeCalendar : originalServiceDateRaw;
        }
        const serviceDate = serviceDateRaw ? new Date(serviceDateRaw) : null;

        // Ngày hiện tại (đặt giờ về 00:00:00 để so sánh theo ngày)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // So sánh chỉ ngày (không bao gồm giờ), để cho phép hoàn thành nếu dịch vụ diễn ra trong ngày
        const serviceDateOnly = serviceDate ? new Date(serviceDate.getFullYear(), serviceDate.getMonth(), serviceDate.getDate()) : null;
        const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const isPastServiceDate = !serviceDateOnly || serviceDateOnly <= todayOnly; // Thay đổi từ < thành <=

        console.log("Service date raw:", serviceDateRaw, "Parsed:", serviceDate);
        console.log("Service date only:", serviceDateOnly, "Today only:", todayOnly);
        console.log("Is past service date:", isPastServiceDate);

        // Kiểm tra nếu ngày sử dụng chưa đến (theo logic thực tế: cho phép hoàn thành nếu dịch vụ đã diễn ra trong ngày)
        if (!isPastServiceDate) {
            toast({
                title: "Không thể hoàn thành",
                description: "Đơn hàng chưa đến ngày sử dụng, không thể đánh dấu hoàn thành",
                variant: "destructive",
            });
            return; // Dừng lại, không cập nhật
        }

        // Nếu đã qua hoặc đang trong ngày, tiến hành cập nhật
        updateOrderMutation.mutate({
            id: order.id,
            status: "completed",
            note: "Đơn hàng đã hoàn thành"
        });
    };

    const handleRefund = (order: Order) => {
        const refundableAmount = getRefundableAmount(order);
        setRefundData({
            amount: refundableAmount,
            reason: "",
            method: "bank_transfer",
            transactionId: ""
        });
        setSelectedOrder(order);
        setRefundModalOpen(true);
    };

    // Cập nhật handleCancelOrder: Tự động hoàn tiền nếu paid
    const handleCancelOrder = async (order: Order) => {
        // Dùng _id nếu có, fallback orderNumber
        const orderId = order.id || order.orderNumber;
        try {
            const res = await fetch(`${API_BASE}/api/orders/${orderId}/cancel`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    note: `Đơn hàng đã bị hủy bởi admin`,
                }),
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to cancel order');
            }
            const data = await res.json();
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            toast({
                title: "Hủy đơn hàng thành công",
                description: `Đơn hàng ${order.orderNumber} đã được hủy và xử lý hoàn tiền nếu có.`,
            });
        } catch (error: any) {
            toast({
                title: "Lỗi khi hủy đơn hàng",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    // Hàm bulk cancel order (gọi route cho từng order)
    const handleBulkCancelOrder = async (keys: string[]) => {
        let successCount = 0;
        let errorCount = 0;
        for (const key of keys) {
            // key là index trong orders array, lấy order từ đó
            const index = parseInt(key);
            const order = orders[index];
            if (!order) {
                errorCount++;
                continue;
            }
            const orderId = order.id || order.orderNumber;
            try {
                const res = await fetch(`${API_BASE}/api/orders/${orderId}/cancel`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        note: `Đơn hàng đã bị hủy hàng loạt bởi admin`,
                    }),
                });
                if (res.ok) {
                    successCount++;
                } else {
                    errorCount++;
                }
            } catch (error) {
                errorCount++;
                console.error(`Failed to cancel order ${orderId}:`, error);
            }
        }
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        toast({
            title: "Hoàn thành hủy đơn hàng loạt",
            description: `Thành công: ${successCount}, Lỗi: ${errorCount}`,
            variant: errorCount > 0 ? "destructive" : "default",
        });
    };

    const handleExportInvoice = (order: Order) => {
        toast({
            title: "Đang xuất hóa đơn",
            description: `Hóa đơn ${order.orderNumber} sẽ được tải xuống`,
        });
    };

    const handlePrintInvoice = (order: Order) => {
        toast({
            title: "Đang in hóa đơn",
            description: `Hóa đơn ${order.orderNumber} đang được in`,
        });
    };

    // const getCompletableOrders = () => {
    //     return orders
    //         .map((order, index) => ({ order, index }))
    //         .filter(({ order }) => {
    //             // Kiểm tra trạng thái đơn hàng: Chọn tất cả đơn chưa hoàn thành và chưa hủy
    //             const isValidStatus = order.orderStatus !== "completed" && order.orderStatus !== "cancelled";

    //             // Kiểm tra ngày sử dụng (theo logic thực tế: cho phép nếu dịch vụ đã diễn ra trong ngày)
    //             const snap = order.metadata?.bookingDataSnapshot;
    //             const item = order.items?.[0];
    //             let isServiceDateValid = false;

    //             // Ngày hiện tại (đặt giờ về 00:00:00 để so sánh theo ngày)
    //             const today = new Date();
    //             today.setHours(0, 0, 0, 0);
    //             const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    //             if (item?.type === 'flight' && !order.changeCalendar) {
    //                 const flights = snap?.flights;
    //                 if (flights?.outbound && flights?.inbound) {
    //                     // Flight có cả outbound và inbound: Kiểm tra cả 2 ngày đều <= today
    //                     const outboundDate = new Date(flights.outbound.date);
    //                     const inboundDate = new Date(flights.inbound.date);
    //                     const outboundOnly = new Date(outboundDate.getFullYear(), outboundDate.getMonth(), outboundDate.getDate());
    //                     const inboundOnly = new Date(inboundDate.getFullYear(), inboundDate.getMonth(), inboundDate.getDate());
    //                     isServiceDateValid = outboundOnly <= todayOnly && inboundOnly <= todayOnly;
    //                 } else if (flights?.outbound) {
    //                     // Chỉ outbound
    //                     const serviceDate = new Date(flights.outbound.date);
    //                     const serviceDateOnly = new Date(serviceDate.getFullYear(), serviceDate.getMonth(), serviceDate.getDate());
    //                     isServiceDateValid = !serviceDateOnly || serviceDateOnly <= todayOnly;
    //                 } else if (flights?.inbound) {
    //                     // Chỉ inbound
    //                     const serviceDate = new Date(flights.inbound.date);
    //                     const serviceDateOnly = new Date(serviceDate.getFullYear(), serviceDate.getMonth(), serviceDate.getDate());
    //                     isServiceDateValid = !serviceDateOnly || serviceDateOnly <= todayOnly;
    //                 }
    //             } else {
    //                 // Logic cho tour/bus: Dùng serviceDateRaw như cũ
    //                 let serviceDateRaw = '';
    //                 if (item?.type === 'flight' && !order.changeCalendar) {
    //                     // Đã xử lý ở trên, không vào đây
    //                 } else {
    //                     const originalServiceDateRaw = snap?.details?.startDateTime ?? snap?.details?.date;
    //                     serviceDateRaw = order.changeCalendar && order.dateChangeCalendar ? order.dateChangeCalendar : originalServiceDateRaw;
    //                 }
    //                 const serviceDate = serviceDateRaw ? new Date(serviceDateRaw) : null;
    //                 const serviceDateOnly = serviceDate ? new Date(serviceDate.getFullYear(), serviceDate.getMonth(), serviceDate.getDate()) : null;
    //                 isServiceDateValid = !serviceDateOnly || serviceDateOnly <= todayOnly;
    //             }

    //             return isValidStatus && isServiceDateValid;
    //         })
    //         .map(({ order }) => order.id);
    // };

    // ...existing code...

    const getCompletableOrders = () => {
        // Ưu tiên dùng allOrdersData (toàn bộ data), fallback về orders (pagination hiện tại)
        const dataToCheck = allOrdersData || orders;

        return dataToCheck
            .filter((order: any) => {
                // Kiểm tra trạng thái đơn hàng: Chọn tất cả đơn chưa hoàn thành và chưa hủy
                const isValidStatus = order.orderStatus !== "completed" && order.orderStatus !== "cancelled";

                // Kiểm tra ngày sử dụng (theo logic thực tế: cho phép nếu dịch vụ đã diễn ra trong ngày)
                const snap = order.metadata?.bookingDataSnapshot;
                const item = order.items?.[0];
                let isServiceDateValid = false;

                // Ngày hiện tại (đặt giờ về 00:00:00 để so sánh theo ngày)
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

                if (item?.type === 'flight' && !order.changeCalendar) {
                    const flights = snap?.flights;
                    if (flights?.outbound && flights?.inbound) {
                        // Flight có cả outbound và inbound: Kiểm tra cả 2 ngày đều <= today
                        const outboundDate = new Date(flights.outbound.date);
                        const inboundDate = new Date(flights.inbound.date);
                        const outboundOnly = new Date(outboundDate.getFullYear(), outboundDate.getMonth(), outboundDate.getDate());
                        const inboundOnly = new Date(inboundDate.getFullYear(), inboundDate.getMonth(), inboundDate.getDate());
                        isServiceDateValid = outboundOnly <= todayOnly && inboundOnly <= todayOnly;
                    } else if (flights?.outbound) {
                        // Chỉ outbound
                        const serviceDate = new Date(flights.outbound.date);
                        const serviceDateOnly = new Date(serviceDate.getFullYear(), serviceDate.getMonth(), serviceDate.getDate());
                        isServiceDateValid = !serviceDateOnly || serviceDateOnly <= todayOnly;
                    } else if (flights?.inbound) {
                        // Chỉ inbound
                        const serviceDate = new Date(flights.inbound.date);
                        const serviceDateOnly = new Date(serviceDate.getFullYear(), serviceDate.getMonth(), serviceDate.getDate());
                        isServiceDateValid = !serviceDateOnly || serviceDateOnly <= todayOnly;
                    }
                } else {
                    // Logic cho tour/bus: Dùng serviceDateRaw như cũ
                    let serviceDateRaw = '';
                    if (item?.type === 'flight' && !order.changeCalendar) {
                        // Đã xử lý ở trên, không vào đây
                    } else {
                        const originalServiceDateRaw = snap?.details?.startDateTime ?? snap?.details?.date;
                        serviceDateRaw = order.changeCalendar && order.dateChangeCalendar ? order.dateChangeCalendar : originalServiceDateRaw;
                    }
                    const serviceDate = serviceDateRaw ? new Date(serviceDateRaw) : null;
                    const serviceDateOnly = serviceDate ? new Date(serviceDate.getFullYear(), serviceDate.getMonth(), serviceDate.getDate()) : null;
                    isServiceDateValid = !serviceDateOnly || serviceDateOnly <= todayOnly;
                }

                return isValidStatus && isServiceDateValid;
            })
            .map((order: any) => order.id);
    };

    const getCancellableOrders = () => {
        // Ưu tiên dùng allOrdersData (toàn bộ data), fallback về orders (pagination hiện tại)
        const dataToCheck = allOrdersData || orders;

        return dataToCheck
            .filter((order: any) => {
                // Kiểm tra trạng thái đơn hàng: Chọn tất cả đơn chưa hoàn thành và chưa hủy
                const isValidStatus = order.orderStatus !== "completed" && order.orderStatus !== "cancelled";

                // Kiểm tra ngày sử dụng (chọn đơn chưa qua ngày hiện tại: serviceDate > today)
                const snap = order.metadata?.bookingDataSnapshot;
                const item = order.items?.[0];
                let isServiceDateValid = false ;

                // Ngày hiện tại (đặt giờ về 00:00:00 để so sánh theo ngày)
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

                if (item?.type === 'flight' && !order.changeCalendar) {
                    const flights = snap?.flights;
                    if (flights?.outbound && flights?.inbound) {
                        // Flight có cả outbound và inbound: Kiểm tra cả 2 ngày đều > today
                        const outboundDate = new Date(flights.outbound.date);
                        const inboundDate = new Date(flights.inbound.date);
                        const outboundOnly = new Date(outboundDate.getFullYear(), outboundDate.getMonth(), outboundDate.getDate());
                        const inboundOnly = new Date(inboundDate.getFullYear(), inboundDate.getMonth(), inboundDate.getDate());
                        isServiceDateValid = outboundOnly > todayOnly && inboundOnly > todayOnly;
                    } else if (flights?.outbound) {
                        // Chỉ outbound
                        const serviceDate = new Date(flights.outbound.date);
                        const serviceDateOnly = new Date(serviceDate.getFullYear(), serviceDate.getMonth(), serviceDate.getDate());
                        isServiceDateValid = serviceDateOnly > todayOnly;
                    } else if (flights?.inbound) {
                        // Chỉ inbound
                        const serviceDate = new Date(flights.inbound.date);
                        const serviceDateOnly = new Date(serviceDate.getFullYear(), serviceDate.getMonth(), serviceDate.getDate());
                        isServiceDateValid = serviceDateOnly > todayOnly;
                    }
                } else {
                    // Logic cho tour/bus: Dùng serviceDateRaw như cũ
                    let serviceDateRaw = '';
                    if (item?.type === 'flight' && !order.changeCalendar) {
                        // Đã xử lý ở trên, không vào đây
                    } else {
                        const originalServiceDateRaw = snap?.details?.startDateTime ?? snap?.details?.date;
                        serviceDateRaw = order.changeCalendar && order.dateChangeCalendar ? order.dateChangeCalendar : originalServiceDateRaw;
                    }
                    const serviceDate = serviceDateRaw ? new Date(serviceDateRaw) : null;
                    const serviceDateOnly = serviceDate ? new Date(serviceDate.getFullYear(), serviceDate.getMonth(), serviceDate.getDate()) : null;
                    isServiceDateValid = serviceDateOnly ? serviceDateOnly > todayOnly : false;
                }

                return isValidStatus && isServiceDateValid;
            })
            .map((order: any) => order.id);
    };


    const handleSelectCancellable = () => {
        if (isSelectingCompletable) {
            toast({
                title: "Không thể chọn",
                description: "Phải hủy chọn đơn hoàn thành trước khi chuyển sang chọn các đơn hủy",
                variant: "destructive",
            });
            return;
        }
        if (isSelectingCancellable) {
            setSelectedOrders([]);
            setIsSelectingCancellable(false);
        } else {
            setSelectedOrders(getCancellableOrders());
            setIsSelectingCancellable(true);
        }
    };
     
    const handleSelectCompletable = () => {
        if (isSelectingCancellable) {
            toast({
                title: "Không thể chọn",
                description: "Phải hủy chọn đơn hủy trước khi chuyển sang chọn các đơn hoàn thành",
                variant: "destructive",
            });
            return;
        }
        if (isSelectingCompletable) {
            setSelectedOrders([]);
            setIsSelectingCompletable(false);
        } else {
            setSelectedOrders(getCompletableOrders());
            setIsSelectingCompletable(true);
        }
    };


    // Hàm tính hoàn tiền (dựa trên metadata, ví dụ cho flight)
    const calculateRefundAmount = (order: any) => {
        if (order.paymentStatus !== "paid") return 0;
        // Với flight: Trừ phạt (penalty) từ metadata.rawPricing?.outbound?.data?.flightOffers?.[0]?.price?.fees
        const penalties = order.metadata?.bookingDataSnapshot?.rawPricing?.outbound?.data?.flightOffers?.[0]?.price?.fees || [];
        const penaltyAmount = penalties.reduce((sum:any, fee:any) => sum + parseFloat(fee.amount || 0), 0);
        // Hoàn tiền = Tổng - Phạt (hoặc 0 nếu phạt > tổng)
        return Math.max(0, order.total - penaltyAmount);
    };


    // const bulkActions = [
    //     // {
    //     //     label: "Xác nhận",
    //     //     action: (keys: string[]) => {
    //     //         keys.forEach(id => {
    //     //             updateOrderMutation.mutate({ id, status: "confirmed" });
    //     //         });
    //     //     },
    //     //     icon: <CheckCircle className="w-4 h-4 mr-2" />,
    //     // },

    //     //ở đây cần 1 button để lọc những đơn nào có thể hoàn thành 
    //     // bấm 1 cái nó sẽ đánh dấu check vào những row nào mà có thể hoàn thành nha 
    //     {
    //         label: "Hoàn thành",
    //         action: async (keys: string[]) => { // keys giờ là array của id
    //             setBulkLoading(true);
    //             setBulkLoadingMessage("Đang hoàn thành đơn hàng...");
    //             try {
    //                 console.log("Bulk hoàn thành: keys =", keys);
    //                 for (const id of keys) { // Thay đổi: dùng id trực tiếp
    //                     const order = orders.find(o => o.id === id); // Tìm order bằng id
    //                     console.log("Order found:", order);
    //                     if (!order) continue;

    //                     // Tính ngày sử dụng từ metadata
    //                     const snap = order.metadata?.bookingDataSnapshot;
    //                     const originalServiceDateRaw = snap?.details?.startDateTime ?? snap?.details?.date;
    //                     const serviceDateRaw = order.changeCalendar && order.dateChangeCalendar ? order.dateChangeCalendar : originalServiceDateRaw;
    //                     const serviceDate = serviceDateRaw ? new Date(serviceDateRaw) : null;

    //                     console.log("Service date raw:", serviceDateRaw, "Parsed:", serviceDate);

    //                     // Ngày hiện tại (đặt giờ về 00:00:00 để so sánh theo ngày)
    //                     const today = new Date();
    //                     today.setHours(0, 0, 0, 0);

    //                     // So sánh chỉ ngày (không bao gồm giờ), để cho phép hoàn thành nếu dịch vụ diễn ra trong ngày
    //                     const serviceDateOnly = serviceDate ? new Date(serviceDate.getFullYear(), serviceDate.getMonth(), serviceDate.getDate()) : null;
    //                     const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    //                     const isPastServiceDate = !serviceDateOnly || serviceDateOnly <= todayOnly;

    //                     console.log("Service date only:", serviceDateOnly, "Today only:", todayOnly);
    //                     console.log("Is past service date:", isPastServiceDate);

    //                     // Kiểm tra nếu ngày sử dụng chưa đến (theo logic thực tế: cho phép nếu dịch vụ đã diễn ra trong ngày)
    //                     if (!isPastServiceDate) {
    //                         console.log("Ngày chưa đến, không cập nhật");
    //                         toast({
    //                             title: "Không thể hoàn thành",
    //                             description: `Đơn hàng ${order.orderNumber} chưa đến ngày sử dụng, không thể đánh dấu hoàn thành`,
    //                             variant: "destructive",
    //                         });
    //                         continue; // Bỏ qua đơn này, không cập nhật
    //                     }

    //                     console.log("Cập nhật đơn hàng:", order.id);
    //                     // Nếu đã qua hoặc đang trong ngày, tiến hành cập nhật
    //                     await updateOrderMutation.mutateAsync({
    //                         id: order.id,
    //                         status: "completed",
    //                         note: "Đơn hàng đã hoàn thành"
    //                     });
    //                 }
    //                 toast({
    //                     title: "Hoàn thành thành công",
    //                     description: "Đã hoàn thành các đơn hàng được chọn.",
    //                 });
    //             } catch (error) {
    //                 console.error("Bulk complete error:", error); // Thêm log để debug
    //                 toast({
    //                     title: "Lỗi khi hoàn thành",
    //                     description: error.message || "Có lỗi xảy ra khi hoàn thành đơn hàng.", // Hiển thị lỗi cụ thể
    //                     variant: "destructive",
    //                 });
    //             } finally {
    //                 setBulkLoading(false);
    //             }
    //         },
    //         icon: <Package className="w-4 h-4 mr-2" />,
    //     },
    //     {
    //         label: "Hủy đơn",
    //         action: async (keys: string[]) => { // keys giờ là array của id
    //             setBulkLoading(true);
    //             setBulkLoadingMessage("Đang hủy đơn hàng...");
    //             try {
    //                 let successCount = 0;
    //                 let errorCount = 0;
    //                 for (const id of keys) { // Thay đổi: dùng id trực tiếp
    //                     const order = orders.find(o => o.id === id); // Tìm order bằng id
    //                     if (!order) {
    //                         errorCount++;
    //                         continue;
    //                     }
    //                     const orderId = order.id || order.orderNumber;
    //                     try {
    //                         const res = await fetch(`${API_BASE}/api/orders/${orderId}/cancel`, {
    //                             method: 'PUT',
    //                             headers: {
    //                                 'Content-Type': 'application/json',
    //                             },
    //                             body: JSON.stringify({
    //                                 note: `Đơn hàng đã bị hủy hàng loạt bởi admin`,
    //                             }),
    //                         });
    //                         if (res.ok) {
    //                             successCount++;
    //                         } else {
    //                             errorCount++;
    //                         }
    //                     } catch (error) {
    //                         errorCount++;
    //                         console.error(`Failed to cancel order ${orderId}:`, error);
    //                     }
    //                 }
    //                 queryClient.invalidateQueries({ queryKey: ['orders'] });
    //                 toast({
    //                     title: "Hoàn thành hủy đơn hàng loạt",
    //                     description: `Thành công: ${successCount}, Lỗi: ${errorCount}`,
    //                     variant: errorCount > 0 ? "destructive" : "default",
    //                 });
    //             } catch (error) {
    //                 toast({
    //                     title: "Lỗi khi hủy đơn hàng",
    //                     description: "Có lỗi xảy ra khi hủy đơn hàng.",
    //                     variant: "destructive",
    //                 });
    //             } finally {
    //                 setBulkLoading(false);
    //             }
    //         },
    //         icon: <XCircle className="w-4 h-4 mr-2" />,
    //         variant: "destructive" as const,
    //     },
    // ];

    
    const bulkActions = useMemo(() => {
        if (isSelectingCompletable) {
            return [
                {
                    label: "Hoàn thành",
                    action: async (keys: string[]) => { // keys giờ là array của id
                        setBulkLoading(true);
                        setBulkLoadingMessage("Đang hoàn thành đơn hàng...");
                        try {
                            console.log("Bulk hoàn thành: keys =", keys);
                            for (const id of keys) { // Thay đổi: dùng id trực tiếp
                                const order = orders.find((o: any) => o.id === id); // Tìm order bằng id
                                console.log("Order found:", order);
                                if (!order) continue;

                                // Tính ngày sử dụng từ metadata
                                const snap = order.metadata?.bookingDataSnapshot;
                                const originalServiceDateRaw = snap?.details?.startDateTime ?? snap?.details?.date;
                                const serviceDateRaw = order.changeCalendar && order.dateChangeCalendar ? order.dateChangeCalendar : originalServiceDateRaw;
                                const serviceDate = serviceDateRaw ? new Date(serviceDateRaw) : null;

                                console.log("Service date raw:", serviceDateRaw, "Parsed:", serviceDate);

                                // Ngày hiện tại (đặt giờ về 00:00:00 để so sánh theo ngày)
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);

                                // So sánh chỉ ngày (không bao gồm giờ), để cho phép hoàn thành nếu dịch vụ diễn ra trong ngày
                                const serviceDateOnly = serviceDate ? new Date(serviceDate.getFullYear(), serviceDate.getMonth(), serviceDate.getDate()) : null;
                                const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                                const isPastServiceDate = !serviceDateOnly || serviceDateOnly <= todayOnly;

                                console.log("Service date only:", serviceDateOnly, "Today only:", todayOnly);
                                console.log("Is past service date:", isPastServiceDate);

                                // Kiểm tra nếu ngày sử dụng chưa đến (theo logic thực tế: cho phép nếu dịch vụ đã diễn ra trong ngày)
                                if (!isPastServiceDate) {
                                    console.log("Ngày chưa đến, không cập nhật");
                                    toast({
                                        title: "Không thể hoàn thành",
                                        description: `Đơn hàng ${order.orderNumber} chưa đến ngày sử dụng, không thể đánh dấu hoàn thành`,
                                        variant: "destructive",
                                    });
                                    continue; // Bỏ qua đơn này, không cập nhật
                                }

                                console.log("Cập nhật đơn hàng:", order.id);
                                // Nếu đã qua hoặc đang trong ngày, tiến hành cập nhật
                                await updateOrderMutation.mutateAsync({
                                    id: order.id,
                                    status: "completed",
                                    note: "Đơn hàng đã hoàn thành"
                                });
                            }
                            toast({
                                title: "Hoàn thành thành công",
                                description: "Đã hoàn thành các đơn hàng được chọn.",
                            });
                        } catch (error:any) {
                            console.error("Bulk complete error:", error); // Thêm log để debug
                            toast({
                                title: "Lỗi khi hoàn thành",
                                description: error.message || "Có lỗi xảy ra khi hoàn thành đơn hàng.", // Hiển thị lỗi cụ thể
                                variant: "destructive",
                            });
                        } finally {
                            setBulkLoading(false);
                        }
                    },
                    icon: <Package className="w-4 h-4 mr-2" />,
                },
            ];
        } else if (isSelectingCancellable) {
            return [
                {
                    label: "Hủy đơn",
                    action: async (keys: string[]) => { // keys giờ là array của id
                        setBulkLoading(true);
                        setBulkLoadingMessage("Đang hủy đơn hàng...");
                        try {
                            let successCount = 0;
                            let errorCount = 0;
                            for (const id of keys) { // Thay đổi: dùng id trực tiếp
                                 const order = allOrdersData?.find((o:any) => o.id === id) || orders.find((o:any) => o.id === id);
                                if (!order) {
                                    errorCount++;
                                    console.error(`Order with id ${id} not found in current or all orders list`);
                                    continue;
                                }
                                const orderId = order.id || order.orderNumber;
                                try {
                                    const res = await fetch(`${API_BASE}/api/orders/${orderId}/cancel`, {
                                        method: 'PUT',
                                        headers: {
                                            'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify({
                                            note: `Đơn hàng đã bị hủy hàng loạt bởi admin`,
                                        }),
                                    });
                                    if (res.ok) {
                                        successCount++;
                                    } else {
                                        errorCount++;
                                        console.error(`Failed to cancel order ${orderId}: HTTP ${res.status} - ${res.statusText}`);
                                        try {
                                            const errorData = await res.json();
                                            console.error('Error details:', errorData);
                                        } catch (parseError) {
                                            console.error('No error details available, parse error:', parseError);
                                        }
                                    }
                                } catch (error) {
                                    errorCount++;
                                    console.error(`Failed to cancel order ${orderId}:`, error);
                                }
                            }
                            queryClient.invalidateQueries({ queryKey: ['orders'] });
                            toast({
                                title: "Hoàn thành hủy đơn hàng loạt",
                                description: `Thành công: ${successCount}, Lỗi: ${errorCount}`,
                                variant: errorCount > 0 ? "destructive" : "default",
                            });
                        } catch (error) {
                            console.error('Bulk cancel error:', error);
                            toast({
                                title: "Lỗi khi hủy đơn hàng",
                                description: "Có lỗi xảy ra khi hủy đơn hàng.",
                                variant: "destructive",
                            });
                        } finally {
                            setBulkLoading(false);
                        }
                    },
                    icon: <XCircle className="w-4 h-4 mr-2" />,
                    variant: "destructive" as const,
                },
            ];
        } else {
            return [
                {
                    label: "Hoàn thành",
                    action: async (keys: string[]) => { // keys giờ là array của id
                        setBulkLoading(true);
                        setBulkLoadingMessage("Đang hoàn thành đơn hàng...");
                        try {
                            console.log("Bulk hoàn thành: keys =", keys);
                            for (const id of keys) { // Thay đổi: dùng id trực tiếp
                                const order = orders.find((o: any) => o.id === id); // Tìm order bằng id
                                console.log("Order found:", order);
                                if (!order) continue;

                                // Tính ngày sử dụng từ metadata
                                const snap = order.metadata?.bookingDataSnapshot;
                                const originalServiceDateRaw = snap?.details?.startDateTime ?? snap?.details?.date;
                                const serviceDateRaw = order.changeCalendar && order.dateChangeCalendar ? order.dateChangeCalendar : originalServiceDateRaw;
                                const serviceDate = serviceDateRaw ? new Date(serviceDateRaw) : null;

                                console.log("Service date raw:", serviceDateRaw, "Parsed:", serviceDate);

                                // Ngày hiện tại (đặt giờ về 00:00:00 để so sánh theo ngày)
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);

                                // So sánh chỉ ngày (không bao gồm giờ), để cho phép hoàn thành nếu dịch vụ diễn ra trong ngày
                                const serviceDateOnly = serviceDate ? new Date(serviceDate.getFullYear(), serviceDate.getMonth(), serviceDate.getDate()) : null;
                                const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                                const isPastServiceDate = !serviceDateOnly || serviceDateOnly <= todayOnly;

                                console.log("Service date only:", serviceDateOnly, "Today only:", todayOnly);
                                console.log("Is past service date:", isPastServiceDate);

                                // Kiểm tra nếu ngày sử dụng chưa đến (theo logic thực tế: cho phép nếu dịch vụ đã diễn ra trong ngày)
                                if (!isPastServiceDate) {
                                    console.log("Ngày chưa đến, không cập nhật");
                                    toast({
                                        title: "Không thể hoàn thành",
                                        description: `Đơn hàng ${order.orderNumber} chưa đến ngày sử dụng, không thể đánh dấu hoàn thành`,
                                        variant: "destructive",
                                    });
                                    continue; // Bỏ qua đơn này, không cập nhật
                                }

                                console.log("Cập nhật đơn hàng:", order.id);
                                // Nếu đã qua hoặc đang trong ngày, tiến hành cập nhật
                                await updateOrderMutation.mutateAsync({
                                    id: order.id,
                                    status: "completed",
                                    note: "Đơn hàng đã hoàn thành"
                                });
                            }
                            toast({
                                title: "Hoàn thành thành công",
                                description: "Đã hoàn thành các đơn hàng được chọn.",
                            });
                        } catch (error:any) {
                            console.error("Bulk complete error:", error); // Thêm log để debug
                            toast({
                                title: "Lỗi khi hoàn thành",
                                description: error.message || "Có lỗi xảy ra khi hoàn thành đơn hàng.", // Hiển thị lỗi cụ thể
                                variant: "destructive",
                            });
                        } finally {
                            setBulkLoading(false);
                        }
                    },
                    icon: <Package className="w-4 h-4 mr-2" />,
                },
                {
                    label: "Hủy đơn",
                    action: async (keys: string[]) => { // keys giờ là array của id
                        setBulkLoading(true);
                        setBulkLoadingMessage("Đang hủy đơn hàng...");
                        try {
                            let successCount = 0;
                            let errorCount = 0;
                            for (const id of keys) { // Thay đổi: dùng id trực tiếp
                                const order = orders.find((o: any) => o.id === id); // Tìm order bằng id
                                if (!order) {
                                    errorCount++;
                                    continue;
                                }
                                const orderId = order.id || order.orderNumber;
                                try {
                                    const res = await fetch(`${API_BASE}/api/orders/${orderId}/cancel`, {
                                        method: 'PUT',
                                        headers: {
                                            'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify({
                                            note: `Đơn hàng đã bị hủy hàng loạt bởi admin`,
                                        }),
                                    });
                                    if (res.ok) {
                                        successCount++;
                                    } else {
                                        errorCount++;
                                    }
                                } catch (error) {
                                    errorCount++;
                                    console.error(`Failed to cancel order ${orderId}:`, error);
                                }
                            }
                            queryClient.invalidateQueries({ queryKey: ['orders'] });
                            toast({
                                title: "Hoàn thành hủy đơn hàng loạt",
                                description: `Thành công: ${successCount}, Lỗi: ${errorCount}`,
                                variant: errorCount > 0 ? "destructive" : "default",
                            });
                        } catch (error) {
                            toast({
                                title: "Lỗi khi hủy đơn hàng",
                                description: "Có lỗi xảy ra khi hủy đơn hàng.",
                                variant: "destructive",
                            });
                        } finally {
                            setBulkLoading(false);
                        }
                    },
                    icon: <XCircle className="w-4 h-4 mr-2" />,
                    variant: "destructive" as const,
                },
            ];
        }
    }, [isSelectingCompletable, isSelectingCancellable, orders, updateOrderMutation, queryClient, toast]);


    const actions = [
        {
            label: "Xem chi tiết",
            action: handleView,
            icon: <Eye className="mr-2 h-4 w-4" />,
        },
        // {
        //     label: "Xác nhận",
        //     action: handleConfirmOrder,
        //     icon: <CheckCircle className="mr-2 h-4 w-4" />,
        //     condition: (order: Order) => order.orderStatus === "pending",
        // },


        // {
        //     label: "Hoàn thành",
        //     action: handleCompleteOrder,
        //     icon: <Package className="mr-2 h-4 w-4" />,
        //     condition: (order: Order) => {
        //         // Kiểm tra trạng thái đơn hàng (loại trừ "completed" để tránh nhầm lẫn)
        //         const isValidStatus = (order.orderStatus === "confirmed" || order.orderStatus === "processing") && order.orderStatus !== "completed";

        //         // Kiểm tra ngày sử dụng (theo logic thực tế: cho phép nếu dịch vụ đã diễn ra trong ngày)
        //         const snap = order.metadata?.bookingDataSnapshot;
        //         const originalServiceDateRaw = snap?.details?.startDateTime ?? snap?.details?.date;
        //         const serviceDateRaw = order.changeCalendar && order.dateChangeCalendar ? order.dateChangeCalendar : originalServiceDateRaw;
        //         const serviceDate = serviceDateRaw ? new Date(serviceDateRaw) : null;
        //         const today = new Date();
        //         today.setHours(0, 0, 0, 0);
        //         const serviceDateOnly = serviceDate ? new Date(serviceDate.getFullYear(), serviceDate.getMonth(), serviceDate.getDate()) : null;
        //         const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        //         const isServiceDateValid = !serviceDateOnly || serviceDateOnly <= todayOnly; // Thay đổi từ < thành <=

        //         return isValidStatus && isServiceDateValid;
        //     },
        // },


        // {
        //     label: "Hoàn tiền",
        //     action: handleRefund,
        //     icon: <DollarSign className="mr-2 h-4 w-4" />,
        //     condition: (order: Order) => order.paymentStatus === "paid" && order.orderStatus !== "cancelled",
        // },


        // {
        //     label: "Hủy đơn",
        //     action: handleCancelOrder,
        //     icon: <XCircle className="mr-2 h-4 w-4" />,
        //     variant: "destructive" as const,
        //     condition: (order: Order) => order.orderStatus !== "completed" && order.orderStatus !== "cancelled",
        //     tooltip: "Hủy toàn bộ đơn hàng, chuyển trạng thái vé và hoàn tiền tự động nếu đã thanh toán.",
        // },


        // {
        //     label: "Xuất hóa đơn",
        //     action: handleExportInvoice,
        //     icon: <Download className="mr-2 h-4 w-4" />,
        // },
        // {
        //     label: "In hóa đơn",
        //     action: handlePrintInvoice,
        //     icon: <Printer className="mr-2 h-4 w-4" />,
        // },
    ];
    function getPassengerTypeLabel(type: string) {
        switch (type) {
            case 'adult': return 'Người lớn';
            case 'child': return 'Trẻ em';
            case 'infant': return 'Em bé';
            default: return type;
        }
    }

    function getTicketStatusLabel(status: string) {
        switch (status) {
            case 'paid': return 'Đã thanh toán';
            case 'cancelled': return 'Đã hủy';
            case 'changed': return 'Đã đổi';
            default: return status;
        }
    }
    const renderOrderDetails = () => {
        if (!selectedOrder) return null;

        return (
            <div className="space-y-6">
                {/* Order Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold">Đơn hàng #{selectedOrder.orderNumber}</h3>
                        <p className="text-gray-500">ID: {selectedOrder.id}</p>
                    </div>
                    <div className="flex space-x-2">
                        <Badge className={
                            getStatusInfo(selectedOrder.orderStatus, 'order').color === 'green' ? "bg-green-100 text-green-800" :
                                getStatusInfo(selectedOrder.orderStatus, 'order').color === 'blue' ? "bg-blue-100 text-blue-800" :
                                    getStatusInfo(selectedOrder.orderStatus, 'order').color === 'purple' ? "bg-purple-100 text-purple-800" :
                                        getStatusInfo(selectedOrder.orderStatus, 'order').color === 'yellow' ? "bg-yellow-100 text-yellow-800" :
                                            getStatusInfo(selectedOrder.orderStatus, 'order').color === 'red' ? "bg-red-100 text-red-800" :
                                                "bg-gray-100 text-gray-800"
                        }>
                            {getStatusInfo(selectedOrder.orderStatus, 'order').label}
                        </Badge>
                        <Badge className={
                            getStatusInfo(selectedOrder.paymentStatus, 'payment').color === 'green' ? "bg-green-100 text-green-800" :
                                getStatusInfo(selectedOrder.paymentStatus, 'payment').color === 'yellow' ? "bg-yellow-100 text-yellow-800" :
                                    getStatusInfo(selectedOrder.paymentStatus, 'payment').color === 'red' ? "bg-red-100 text-red-800" :
                                        "bg-gray-100 text-gray-800"
                        }>
                            {getStatusInfo(selectedOrder.paymentStatus, 'payment').label}
                        </Badge>
                        {selectedOrder.changeCalendar && (
                            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                                Đã đổi lịch
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="flex space-x-2">
                    {selectedOrder.orderStatus === "pending" && (
                        <Button size="sm" onClick={() => handleConfirmOrder(selectedOrder)}>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Xác nhận
                        </Button>
                    )}
                    {/* {selectedOrder.paymentStatus === "paid" && selectedOrder.orderStatus !== "cancelled" && (
                        <Button size="sm" variant="outline" onClick={() => handleRefund(selectedOrder)}>
                            <DollarSign className="w-4 h-4 mr-2" />
                            Hoàn tiền
                        </Button>
                    )} */}
                    <Button size="sm" variant="outline" onClick={() => handleExportInvoice(selectedOrder)}>
                        <FileText className="w-4 h-4 mr-2" />
                        Xuất PDF
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handlePrintInvoice(selectedOrder)}>
                        <Printer className="w-4 h-4 mr-2" />
                        In hóa đơn
                    </Button>
                </div>

                <Separator />

                {/* Customer Information */}
                <div>
                    <Label className="text-sm font-medium text-gray-700">Thông tin khách hàng</Label>
                    <div className="mt-2 grid grid-cols-2 gap-4">
                        <div>
                            <div className="font-medium">{selectedOrder.customerName}</div>
                            <div className="text-sm text-gray-600">{selectedOrder.customerEmail}</div>
                            <div className="text-sm text-gray-600">{selectedOrder.customerPhone}</div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-600">{selectedOrder.customerAddress}</div>
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Order Items */}
                <div>
                    <Label className="text-sm font-medium text-gray-700">Sản phẩm đặt hàng</Label>
                    <div className="mt-2 space-y-3">
                        {selectedOrder.items.map((item:any, index:any) => (
                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                        {item.type === "tour" && <Package className="w-6 h-6 text-gray-400" />}
                                        {item.type === "flight" && <Truck className="w-6 h-6 text-gray-400" />}
                                        {item.type === "bus" && <Truck className="w-6 h-6 text-gray-400" />}
                                    </div>
                                    <div>
                                        <div className="font-medium">{item.name}</div>
                                        <div className="text-sm text-gray-500">SKU: {item.sku}</div>
                                        <div className="text-sm text-gray-500">Loại: {item.type}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-medium">
                                        {new Intl.NumberFormat('vi-VN').format(item.subtotal)} ₫
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        {new Intl.NumberFormat('vi-VN').format(item.unitPrice)} ₫ x {item.quantity}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <Separator />

                {/* Pricing Breakdown */}
                <div>
                    <Label className="text-sm font-medium text-gray-700">Chi tiết giá</Label>
                    <div className="mt-2 space-y-2">
                        <div className="flex justify-between">
                            <span>Tạm tính:</span>
                            <span>{new Intl.NumberFormat('vi-VN').format(selectedOrder.subtotal)} ₫</span>
                        </div>

                        {selectedOrder.discounts.map((discount:any, index:any) => (
                            <div key={index} className="flex justify-between text-green-600">
                                <span>Giảm giá ({discount.code}):</span>
                                <span>-{new Intl.NumberFormat('vi-VN').format(discount.amount)} ₫</span>
                            </div>
                        ))}

                        {selectedOrder.fees.map((fee:any, index:any) => (
                            <div key={index} className="flex justify-between">
                                <span>{fee.name}:</span>
                                <span>{new Intl.NumberFormat('vi-VN').format(fee.amount)} ₫</span>
                            </div>
                        ))}

                        {selectedOrder.tax > 0 && (
                            <div className="flex justify-between">
                                <span>Thuế:</span>
                                <span>{new Intl.NumberFormat('vi-VN').format(selectedOrder.tax)} ₫</span>
                            </div>
                        )}

                        <Separator />
                        <div className="flex justify-between font-bold text-lg">
                            <span>Tổng cộng:</span>
                            <span>{new Intl.NumberFormat('vi-VN').format(selectedOrder.total)} ₫</span>
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Payment Information */}
                <div>
                    <Label className="text-sm font-medium text-gray-700">Thông tin thanh toán</Label>
                    <div className="mt-2 space-y-2">
                        <div className="flex justify-between">
                            <span>Phương thức:</span>
                            <span>Banking</span>
                        </div>
                        {selectedOrder.transId && (
                            <div className="flex justify-between">
                                <span>Mã giao dịch:</span>
                                <span>{selectedOrder.transId}</span>
                            </div>
                        )}
                        {selectedOrder.zp_trans_id && (
                            <div className="flex justify-between">
                                <span>Mã giao dịch ZaloPay:</span>
                                <span>{selectedOrder.zp_trans_id}</span>
                            </div>
                        )}
                        {selectedOrder.paymentReference && (
                            <div className="flex justify-between">
                                <span>Tham chiếu thanh toán:</span>
                                <span>{selectedOrder.paymentReference}</span>
                            </div>
                        )}
                    </div>
                </div>
              

                {/* Ticket Information */}
                {loadingDetails ? (
                    <div className="text-center">Đang tải thông tin vé...</div>
                ) : orderDetails && (orderDetails.oldTickets?.length > 0 || orderDetails.tickets?.length > 0) && (
                    <div>
                        <Label className="text-sm font-medium text-gray-700">Thông tin vé</Label>
                        <div className="mt-2 space-y-4">
                            {selectedOrder.changeCalendar && selectedOrder.orderStatus !== 'cancelled' ? (
                                <>
                                    {/* Đơn đổi lịch chưa hủy: Hiển thị Vé cũ và Vé đã đổi */}
                                    {orderDetails.oldTickets && orderDetails.oldTickets.length > 0 && (
                                        <div>
                                            <h4 className="font-semibold">Vé cũ</h4>
                                            <div className="space-y-2">
                                                {orderDetails.oldTickets.filter((ticket: any) => ticket.status === 'cancelled').map((ticket: any) => (
                                                    <div key={ticket._id} className="border p-2 rounded flex justify-between items-center">
                                                        <div>
                                                            <div className="font-medium">{ticket.ticketNumber}</div>
                                                            <div className="text-sm text-muted-foreground">{ticket.passenger?.name || ''}</div>
                                                        </div>
                                                        <div className="text-sm">
                                                            <Badge variant="secondary">{getPassengerTypeLabel(ticket.ticketType)}</Badge>
                                                            <Badge className="ml-2 bg-red-100 text-red-700">{getTicketStatusLabel(ticket.status)}</Badge>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {orderDetails.tickets && orderDetails.tickets.length > 0 && (
                                        <div>
                                            <h4 className="font-semibold">Vé đã đổi</h4>
                                            <div className="space-y-2">
                                                {orderDetails.tickets.filter((ticket: any) => ticket.status === 'changed' || ticket.status === 'paid').map((ticket: any) => (
                                                    <div key={ticket._id} className="border p-2 rounded flex justify-between items-center">
                                                        <div>
                                                            <div className="font-medium">{ticket.ticketNumber}</div>
                                                            <div className="text-sm text-muted-foreground">{ticket.passenger?.name || ''}</div>
                                                        </div>
                                                        <div className="text-sm">
                                                            <Badge variant="secondary">{getPassengerTypeLabel(ticket.ticketType)}</Badge>
                                                            <Badge className="ml-2 bg-blue-100 text-blue-700">{getTicketStatusLabel(ticket.status)}</Badge>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : selectedOrder.orderStatus === 'cancelled' ? (
                                /* Đơn hủy (bao gồm vừa đổi lịch vừa hủy): Hiển thị Vé đã hủy */
                                        (() => {
                                            const allCancelledTickets = [...(orderDetails.tickets || []), ...(orderDetails.oldTickets || [])].filter((ticket) => ticket.status === 'cancelled');
                                            const uniqueTickets = allCancelledTickets.filter((ticket, index, self) => self.findIndex(t => t.ticketNumber === ticket.ticketNumber) === index);
                                            return (
                                                <div>
                                                    <h4 className="font-semibold">Vé đã hủy</h4>
                                                    <div className="space-y-2">
                                                        {uniqueTickets.map((ticket) => (
                                                            <div key={ticket._id} className="border p-2 rounded flex justify-between items-center">
                                                                <div>
                                                                    <div className="font-medium">{ticket.ticketNumber}</div>
                                                                    <div className="text-sm text-muted-foreground">{ticket.passenger?.name || ''}</div>
                                                                </div>
                                                                <div className="text-sm">
                                                                    <Badge variant="secondary">{getPassengerTypeLabel(ticket.ticketType)}</Badge>
                                                                    <Badge className="ml-2 bg-red-100 text-red-700">{getTicketStatusLabel(ticket.status)}</Badge>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })()
                            ) : (
                                /* Đơn không đổi lịch và không hủy: Hiển thị Vé bình thường */
                                orderDetails.tickets && orderDetails.tickets.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold">Vé</h4>
                                        <div className="space-y-2">
                                            {orderDetails.tickets.filter((ticket: any) => ticket.status === 'paid').map((ticket: any) => (
                                                <div key={ticket._id} className="border p-2 rounded flex justify-between items-center">
                                                    <div>
                                                        <div className="font-medium">{ticket.ticketNumber}</div>
                                                        <div className="text-sm text-muted-foreground">{ticket.passenger?.name || ''}</div>
                                                    </div>
                                                    <div className="text-sm">
                                                        <Badge variant="secondary">{getPassengerTypeLabel(ticket.ticketType)}</Badge>
                                                        <Badge className="ml-2 bg-green-100 text-green-700">{getTicketStatusLabel(ticket.status)}</Badge>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                )}

                



                {/* Change Calendar Information */}
                {selectedOrder.changeCalendar && selectedOrder.inforChangeCalendar && (
                    <div>
                        <Label className="text-sm font-medium text-gray-700">Thông tin đổi lịch</Label>
                        <div className="mt-2 space-y-2">
                            <div className="flex justify-between">
                                <span>Ngày đổi:</span>
                                <span>{selectedOrder.dateChangeCalendar}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Phí phạt:</span>
                                <span>{new Intl.NumberFormat('vi-VN').format(selectedOrder.inforChangeCalendar.penalty)} ₫</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Giá mới:</span>
                                <span>{new Intl.NumberFormat('vi-VN').format(selectedOrder.inforChangeCalendar.newPrice)} ₫</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Chênh lệch:</span>
                                <span>{new Intl.NumberFormat('vi-VN').format(selectedOrder.inforChangeCalendar.diff)} ₫</span>
                            </div>
                            {/* <div className="flex justify-between">
                                <span>Mã giao dịch đổi:</span>
                                <span>{selectedOrder.inforChangeCalendar.transId}</span>
                            </div> */}
                            <div className="flex justify-between">
                                <span>Mã đổi lịch:</span>
                                <span>{selectedOrder.inforChangeCalendar.codeChange}</span>
                            </div>
                            {selectedOrder.inforChangeCalendar.data?.note && (
                                <div>
                                    <span className="font-medium">Ghi chú:</span>
                                    <div className="text-sm text-gray-600">{selectedOrder.inforChangeCalendar.data.note}</div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <Separator />

                {/* Booking Details from Metadata */}
                {selectedOrder.metadata?.bookingDataSnapshot && (
                    <div>
                        <Label className="text-sm font-medium text-gray-700">Chi tiết đặt chỗ</Label>
                        <div className="mt-2 space-y-4">
                            {selectedOrder.metadata.bookingDataSnapshot.details && (
                                <div>
                                    <h4 className="font-medium">Thông tin chuyến</h4>
                                    <div className="space-y-1 text-sm">
                                        <div>Tuyến: {selectedOrder.metadata.bookingDataSnapshot.details.route}</div>
                                        <div>Ngày: {selectedOrder.changeCalendar && selectedOrder.dateChangeCalendar ? selectedOrder.dateChangeCalendar : selectedOrder.metadata.bookingDataSnapshot.details.date}</div>
                                        {/* <div>Giờ: {selectedOrder.metadata.bookingDataSnapshot.details.time}</div> */}
                                        {selectedOrder.metadata.bookingDataSnapshot.details.selectedPickup && (
                                            <div>Điểm đón: {selectedOrder.metadata.bookingDataSnapshot.details.selectedPickup}</div>
                                        )}
                                        {selectedOrder.metadata.bookingDataSnapshot.details.selectedDropoff && (
                                            <div>Điểm trả: {selectedOrder.metadata.bookingDataSnapshot.details.selectedDropoff}</div>
                                        )}
                                        {selectedOrder.metadata.bookingDataSnapshot.details.seats && (
                                            <div>Ghế: {selectedOrder.metadata.bookingDataSnapshot.details.seats.join(', ')}</div>
                                        )}
                                    </div>
                                </div>
                            )}
                            {selectedOrder.metadata.bookingDataSnapshot.details?.passengers && (
                                <div>
                                    <h4 className="font-medium">Hành khách</h4>
                                    <div className="space-y-2">
                                        {selectedOrder.metadata.bookingDataSnapshot.details.passengers.map((p: any, idx: number) => (
                                            <div key={idx} className="text-sm border p-2 rounded">
                                                <div>{p.title} {p.firstName} {p.lastName}</div>
                                                <div>Loại: {p.type}, Ngày sinh: {p.dateOfBirth}, Quốc tịch: {p.nationality}</div>
                                                <div>CMND/CCCD: {p.idNumber} ({p.idType})</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {/* {selectedOrder.metadata.bookingDataSnapshot.pricing && (
                                <div>
                                    <h4 className="font-medium">Giá chi tiết</h4>
                                    <div className="space-y-1 text-sm">
                                        <div>Giá cơ bản: {new Intl.NumberFormat('vi-VN').format(selectedOrder.metadata.bookingDataSnapshot.pricing.basePrice)} ₫</div>
                                        <div>Thuế: {new Intl.NumberFormat('vi-VN').format(selectedOrder.metadata.bookingDataSnapshot.pricing.taxes)} ₫</div>
                                        <div>Phụ phí: {new Intl.NumberFormat('vi-VN').format(selectedOrder.metadata.bookingDataSnapshot.pricing.addOns)} ₫</div>
                                        <div>Giảm giá: {new Intl.NumberFormat('vi-VN').format(selectedOrder.metadata.bookingDataSnapshot.pricing.discount)} ₫</div>
                                        <div>Tổng: {new Intl.NumberFormat('vi-VN').format(selectedOrder.metadata.bookingDataSnapshot.pricing.total)} ₫</div>
                                    </div>
                                </div>
                            )} */}
                        </div>
                    </div>
                )}
                <Separator />

                {/* Timeline */}
                {/* <div>
                    <Label className="text-sm font-medium text-gray-700">Lịch sử đơn hàng</Label>
                    <div className="mt-4 relative">
                        <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-300"></div>
                        <div className="space-y-6">
                            {selectedOrder.timeline.map((event, index) => (
                                <div key={index} className="relative flex items-start space-x-4">
                                    <div className="w-6 h-6 bg-blue-500 rounded-full border-4 border-white shadow-md flex items-center justify-center">
                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                    </div>
                                    <div className="flex-1 pb-4">
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-gray-900">{event.text}</span>
                                            <span className="text-sm text-gray-500">
                                                {event.ts?.$date?.$numberLong ? new Date(parseInt(event.ts.$date.$numberLong)).toLocaleString('vi-VN') : 'N/A'}
                                            </span>
                                        </div>
                                        {event.meta?.ticket && (
                                            <p className="text-sm text-gray-700 mt-1 bg-gray-50 p-2 rounded">Ticket: {event.meta.ticket.$oid}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div> */}

                {/* <Separator /> */}

                {/* Admin Notes */}
                {/* <div>
                    <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium text-gray-700">Ghi chú nội bộ</Label>
                        <Button size="sm" variant="outline" onClick={() => setNoteModalOpen(true)}>
                            Thêm ghi chú
                        </Button>
                    </div>
                    <div className="mt-2 space-y-2">
                        {selectedOrder.notes.length > 0 ? (
                            selectedOrder.notes.map((note, index) => (
                                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-sm">{note.content}</p>
                                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                                        <span>Bởi: {note.author}</span>
                                        <span>{new Date(note.timestamp).toLocaleString('vi-VN')}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-gray-500">Chưa có ghi chú nào</p>
                        )}
                    </div>
                </div> */}
            </div>
        );
    };

    return (
        <div className="p-6 space-y-6 bg-gray-50">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý đơn đặt</h1>
                    <p className="text-gray-600 mt-1">Quản lý đơn hàng, thanh toán và trạng thái đơn</p>
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
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Tổng đơn hàng</p>
                                <p className="text-2xl font-bold">{total}</p>
                            </div>
                            <ShoppingBag className="w-8 h-8 text-primary" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Chờ xử lý</p>
                                <p className="text-2xl font-bold">
                                    {allOrdersData?.filter((o: Order) => o.orderStatus === "pending").length || 0}
                                </p>
                            </div>
                            <Clock className="w-8 h-8 text-yellow-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Đã xác nhận</p>
                                <p className="text-2xl font-bold">
                                    {allOrdersData?.filter((o: Order) => o.orderStatus === "confirmed").length || 0}
                                </p>
                            </div>
                            <Clock className="w-8 h-8 text-yellow-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Hoàn thành</p>
                                <p className="text-2xl font-bold">
                                    {allOrdersData?.filter((o: Order) => o.orderStatus === "completed").length || 0}
                                </p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Doanh thu</p>
                                <p className="text-2xl font-bold">
                                    {new Intl.NumberFormat('vi-VN', {
                                        notation: 'compact',
                                        compactDisplay: 'short'
                                    }).format(
                                        allOrdersData
                                            ?.filter((o: Order) => o.paymentStatus === "paid")
                                            .reduce((sum: number, o: Order) => sum + o.total, 0) || 0
                                    )} ₫
                                </p>
                            </div>
                            <DollarSign className="w-8 h-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Table */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Danh sách đơn hàng</CardTitle>
                            {(() => {
                                const completableCount = getCompletableOrders().length;
                                const cancellableCount = getCancellableOrders().length;
                                return (
                                    <>
                                        {completableCount > 0 && (
                                            <p className="text-sm text-gray-600">Số lượng đơn có thể đánh dấu hoàn thành: {completableCount}</p>
                                        )}
                                        {cancellableCount > 0 && (
                                            <p className="text-sm text-gray-600">Số lượng đơn có thể hủy: {cancellableCount}</p>
                                        )}
                                    </>
                                );
                            })()}
                            <CardDescription>Quản lý đơn hàng, thanh toán và trạng thái

                            </CardDescription>

                            {/* <div className="mt-2 text-sm text-gray-500">
                                <p><strong>Đơn có thể hoàn thành:</strong> Các đơn có trạng thái "Đã xác nhận" hoặc "Đang xử lý" và ngày sử dụng đã qua hoặc đang trong ngày.</p>
                                <p><strong>Đơn có thể hủy:</strong> Các đơn có trạng thái khác "Hoàn thành" và "Đã hủy" và ngày sử dụng chưa qua.</p>
                            </div> */}
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                onClick={handleSelectCompletable}
                            >
                                {isSelectingCompletable ? "Hủy chọn đơn đánh dấu hoàn thành" : "Chọn đơn đánh dấu hoàn thành"}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleSelectCancellable}
                            >
                                {isSelectingCancellable ? "Hủy chọn đơn có thể hủy" : "Chọn đơn có thể hủy"}
                            </Button>

                            <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                                <SelectTrigger className="w-40">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả loại</SelectItem>
                                    <SelectItem value="flight">Flight</SelectItem>
                                    <SelectItem value="tour">Tour</SelectItem>
                                    <SelectItem value="bus">Bus</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={filters.orderStatus} onValueChange={(value) => setFilters(prev => ({ ...prev, orderStatus: value }))}>
                                <SelectTrigger className="w-40">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                                    {orderStatuses.map((status) => (
                                        <SelectItem key={status.value} value={status.value}>
                                            {status.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={filters.paymentStatus} onValueChange={(value) => setFilters(prev => ({ ...prev, paymentStatus: value }))}>
                                <SelectTrigger className="w-40">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả thanh toán</SelectItem>
                                    {paymentStatuses.map((status) => (
                                        <SelectItem key={status.value} value={status.value}>
                                            {status.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {/* <Select value={filters.paymentMethod} onValueChange={(value) => setFilters(prev => ({ ...prev, paymentMethod: value }))}>
                                <SelectTrigger className="w-40">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả phương thức</SelectItem>
                                    {paymentMethods.map((method) => (
                                        <SelectItem key={method.value} value={method.value}>
                                            {method.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select> */}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <DataTable
                        columns={columns}
                        data={orders}
                        rowKey="id"
                        pagination={{
                            current: pagination.current,
                            pageSize: pagination.pageSize,
                            total: total,
                        }}
                        onPaginationChange={(page, pageSize) =>
                            setPagination({ current: page, pageSize })
                        }
                        onSearch={setSearchQuery}
                        rowSelection={isSelectingCompletable || isSelectingCancellable ? {
                            selectedRowKeys: selectedOrders,
                            onChange: setSelectedOrders,
                            getCheckboxProps: (record) => ({
                                disabled: isSelectingCompletable ? !getCompletableOrders().includes(record.id) : !getCancellableOrders().includes(record.id),
                            }),
                        } : undefined}
                        bulkActions={bulkActions}
                        actions={actions}
                        exportable
                        onExport={() => toast({ title: "Đang xuất file...", description: "File sẽ được tải xuống sau vài giây" })}
                        loading={isLoading}
                    />
                </CardContent>
            </Card>

            {/* Order Details Modal */}
            <ModalForm
                open={modalOpen}
                onOpenChange={setModalOpen}
                title="Chi tiết đơn hàng"
                description="Xem thông tin chi tiết và quản lý đơn hàng"
                mode="view"
                size="large"
            >
                <div className="max-h-[70vh] overflow-y-auto pr-2">

                    {renderOrderDetails()}
                </div>
            </ModalForm>

            {/* Refund Modal */}
            <ModalForm
                open={refundModalOpen}
                onOpenChange={setRefundModalOpen}
                title="Hoàn tiền"
                description={`Xử lý hoàn tiền cho đơn hàng #${selectedOrder?.orderNumber}`}
                mode="edit"
                size="medium"
                onSubmit={() => {
                    if (selectedOrder) {
                        refundMutation.mutate({ id: selectedOrder.id, data: refundData });
                    }
                }}
                submitText="Xử lý hoàn tiền"
            >
                <div className="space-y-4">
                    <div>
                        <Label>Số tiền có thể hoàn</Label>
                        <p className="text-lg font-bold text-green-600">
                            {selectedOrder ? new Intl.NumberFormat('vi-VN').format(getRefundableAmount(selectedOrder)) : '0'} ₫
                        </p>
                    </div>

                    <div>
                        <Label htmlFor="refundAmount">Số tiền hoàn *</Label>
                        <Input
                            id="refundAmount"
                            type="number"
                            value={refundData.amount}
                            onChange={(e) => setRefundData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                            max={selectedOrder ? getRefundableAmount(selectedOrder) : 0}
                        />
                    </div>

                    <div>
                        <Label htmlFor="refundReason">Lý do hoàn tiền *</Label>
                        <Textarea
                            id="refundReason"
                            value={refundData.reason}
                            onChange={(e) => setRefundData(prev => ({ ...prev, reason: e.target.value }))}
                            placeholder="Nhập lý do hoàn tiền"
                            rows={3}
                        />
                    </div>

                    <div>
                        <Label htmlFor="refundMethod">Phương thức hoàn tiền</Label>
                        <Select
                            value={refundData.method}
                            onValueChange={(value) => setRefundData(prev => ({ ...prev, method: value }))}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {paymentMethods.map((method) => (
                                    <SelectItem key={method.value} value={method.value}>
                                        {method.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="transactionId">Mã giao dịch</Label>
                        <Input
                            id="transactionId"
                            value={refundData.transactionId}
                            onChange={(e) => setRefundData(prev => ({ ...prev, transactionId: e.target.value }))}
                            placeholder="Mã giao dịch hoàn tiền"
                        />
                    </div>
                </div>
            </ModalForm>

            {/* Add Note Modal */}
            <ModalForm
                open={noteModalOpen}
                onOpenChange={setNoteModalOpen}
                title="Thêm ghi chú"
                description="Thêm ghi chú nội bộ cho đơn hàng"
                mode="edit"
                size="medium"
                onSubmit={() => {
                    if (selectedOrder && newNote.trim()) {
                        addNoteMutation.mutate({ id: selectedOrder.id, note: newNote.trim() });
                    }
                }}
                submitText="Thêm ghi chú"
            >
                <div>
                    <Label htmlFor="note">Nội dung ghi chú *</Label>
                    <Textarea
                        id="note"
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Nhập ghi chú..."
                        rows={4}
                    />
                </div>
            </ModalForm>

            {/* Cancel Order Modal */}
            <ConfirmModal
                open={cancelModalOpen}
                onOpenChange={setCancelModalOpen}
                title="Hủy đơn hàng"
                message={`Bạn có chắc chắn muốn hủy đơn hàng #${selectedOrder?.orderNumber}? Hành động này không thể hoàn tác.`}
                type="danger"
                requireTyping={false}
                onConfirm={() => {
                    if (selectedOrder) {
                        updateOrderMutation.mutate({
                            id: selectedOrder.id,
                            status: "cancelled",
                            note: "Đơn hàng đã bị hủy bởi admin"
                        });
                        setCancelModalOpen(false);
                    }
                }}
                confirmText="Hủy đơn hàng"
            />
            {/* // Thêm modal loading ở cuối component, trước </div> cuối */}
            {bulkLoading && (
                <ModalForm
                    open={bulkLoading}
                    onOpenChange={() => { }} // Không cho đóng
                    title="Đang xử lý"
                    description={bulkLoadingMessage}
                    mode="view"
                    size="small"
                >
                    <div className="flex items-center justify-center py-8">
                        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
                        <span className="ml-2">Vui lòng đợi...</span>
                    </div>
                </ModalForm>
            )}
        </div>
    );
}
