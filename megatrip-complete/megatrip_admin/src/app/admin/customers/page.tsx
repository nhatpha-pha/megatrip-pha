"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Plus, Edit, Eye, Trash2, UserCheck, Mail, Phone, Calendar, CreditCard, Filter, FileDown, Upload, Ban, RefreshCw } from "lucide-react";
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
// image/avatar upload removed from admin
import { useToast } from "../../components/ui/use-toast";
import api from '../../../apis/auth';

interface Customer {
    id: string;
    key?: string; 
    name: string;
    email: string;
    phone: string;
    // avatar removed from admin list
    avatar?: string;
    type: "VIP" | "Normal";
    status: "active" | "blocked";
    registeredAt: string;
    totalOrders: number;
    totalSpent: number;
    lastOrderAt?: string;
    address?: string;
    notes?: string;
    isVerified?: boolean;
}

interface CustomerFormData {
    name: string;
    email: string;
    phone: string;
    password?: string;
    address: string;
    notes: string;
    status: "active" | "blocked";
    type: "VIP" | "Normal";
    // avatar removed from admin form
    avatar?: string;
    sendInviteEmail?: boolean;
    isVerified?: boolean;
}

interface CustomerFilters {
    status: string;
    type: string;
    dateRange?: [string, string];
}

const mockCustomers: Customer[] = [
    {
        id: "cus_001",
        key: "cus_001",
        name: "Nguyễn Văn An",
        email: "an.nguyen@example.com",
        phone: "0901234567",
        avatar: "/avatars/an.jpg",
        type: "VIP",
        status: "active",
        registeredAt: "2025-01-15T10:00:00.000Z",
        totalOrders: 12,
        totalSpent: 7200000,
        lastOrderAt: "2025-09-10T14:30:00.000Z",
        address: "123 Lê Lợi, Q1, TP.HCM",
        notes: "Khách hàng thân thiết, thường xuyên đặt vé VIP",
    },
    {
        id: "cus_002",
        key: "cus_002",
        name: "Trần Thị Bình",
        email: "binh.tran@example.com",
        phone: "0912345678",
        avatar: "/avatars/binh.jpg",
        type: "Normal",
        status: "active",
        registeredAt: "2025-03-22T09:00:00.000Z",
        totalOrders: 5,
        totalSpent: 2500000,
        lastOrderAt: "2025-08-20T11:00:00.000Z",
        address: "45 Nguyễn Huệ, Huế",
        notes: "Thích đặt vé ghế ngồi",
    },
    {
        id: "cus_003",
        key: "cus_003",
        name: "Lê Minh Châu",
        email: "chau.le@example.com",
        phone: "0923456789",
        avatar: "/avatars/chau.jpg",
        type: "Normal",
        status: "blocked",
        registeredAt: "2025-05-10T15:00:00.000Z",
        totalOrders: 3,
        totalSpent: 1500000,
        lastOrderAt: "2025-07-15T10:00:00.000Z",
        address: "78 Trần Phú, Đà Nẵng",
        notes: "Tài khoản bị khóa do vi phạm chính sách",
    },
    {
        id: "cus_004",
        key: "cus_004",
        name: "Phạm Quốc Đạt",
        email: "dat.pham@example.com",
        phone: "0934567890",
        avatar: "/avatars/dat.jpg",
        type: "VIP",
        status: "active",
        registeredAt: "2025-02-18T12:00:00.000Z",
        totalOrders: 15,
        totalSpent: 9500000,
        lastOrderAt: "2025-09-05T16:00:00.000Z",
        address: "56 Nguyễn Trãi, Hà Nội",
        notes: "Khách hàng ưu tiên, đặt vé Limousine",
    },
    {
        id: "cus_005",
        key: "cus_005",
        name: "Hoàng Thị Mai",
        email: "mai.hoang@example.com",
        phone: "0945678901",
        avatar: "/avatars/mai.jpg",
        type: "Normal",
        status: "active",
        registeredAt: "2025-06-01T08:00:00.000Z",
        totalOrders: 8,
        totalSpent: 4000000,
        lastOrderAt: "2025-09-01T09:00:00.000Z",
        address: "12 Phạm Văn Đồng, Đà Nẵng",
        notes: "",
    },
    {
        id: "cus_006",
        key: "cus_006",
        name: "Vũ Văn Hùng",
        email: "hung.vu@example.com",
        phone: "0956789012",
        avatar: "/avatars/hung.jpg",
        type: "Normal",
        status: "blocked",
        registeredAt: "2025-04-12T11:00:00.000Z",
        totalOrders: 2,
        totalSpent: 1000000,
        lastOrderAt: "2025-06-20T13:00:00.000Z",
        address: "34 Lê Duẩn, TP.HCM",
        notes: "Tài khoản bị khóa do không thanh toán",
    },
    {
        id: "cus_007",
        key: "cus_007",
        name: "Đỗ Thị Lan",
        email: "lan.do@example.com",
        phone: "0967890123",
        avatar: "/avatars/lan.jpg",
        type: "VIP",
        status: "active",
        registeredAt: "2025-07-05T14:00:00.000Z",
        totalOrders: 10,
        totalSpent: 6000000,
        lastOrderAt: "2025-09-08T15:00:00.000Z",
        address: "89 Hai Bà Trưng, Hà Nội",
        notes: "Khách hàng tiềm năng",
    },
    {
        id: "cus_008",
        key: "cus_008",
        name: "Bùi Minh Tuấn",
        email: "tuan.bui@example.com",
        phone: "0978901234",
        avatar: "/avatars/tuan.jpg",
        type: "Normal",
        status: "active",
        registeredAt: "2025-08-15T10:00:00.000Z",
        totalOrders: 4,
        totalSpent: 2000000,
        lastOrderAt: "2025-09-02T12:00:00.000Z",
        address: "23 Nguyễn Văn Cừ, Huế",
        notes: "",
    },
    {
        id: "cus_009",
        key: "cus_009",
        name: "Ngô Thị Hà",
        email: "ha.ngo@example.com",
        phone: "0989012345",
        avatar: "/avatars/ha.jpg",
        type: "VIP",
        status: "active",
        registeredAt: "2025-01-25T09:00:00.000Z",
        totalOrders: 20,
        totalSpent: 12000000,
        lastOrderAt: "2025-09-11T17:00:00.000Z",
        address: "67 Trần Hưng Đạo, TP.HCM",
        notes: "Khách hàng thân thiết, ưu tiên hỗ trợ",
    },
    {
        id: "cus_010",
        key: "cus_010",
        name: "Trương Văn Long",
        email: "long.truong@example.com",
        phone: "0990123456",
        avatar: "/avatars/long.jpg",
        type: "Normal",
        status: "active",
        registeredAt: "2025-09-01T08:00:00.000Z",
        totalOrders: 1,
        totalSpent: 500000,
        lastOrderAt: "2025-09-01T08:00:00.000Z",
        address: "45 Lý Thường Kiệt, Đà Nẵng",
        notes: "Khách hàng mới",
    },
];

export default function Customers() {
    const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [filters, setFilters] = useState<CustomerFilters>({
        status: "all",
        type: "all"
    });
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create");
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
    const [formData, setFormData] = useState<CustomerFormData>({
        name: "",
        email: "",
        phone: "",
        address: "",
        notes: "",
        status: "active",
        type: "Normal",
        sendInviteEmail: false,
        isVerified: false
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [isFormDirty, setIsFormDirty] = useState(false);

    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
    });

    // Fetch customers from API (filter role === 'user')
    const { data: customersData, isLoading, error, refetch } = useQuery({
        queryKey: ['customers', pagination.current, pagination.pageSize, searchQuery, filters],
        queryFn: async () => {
            const res: any = await api.listUsers({ page: pagination.current, limit: pagination.pageSize, q: searchQuery });
            // res should be { users, total, page, limit } or { data: { users, total } }
            const dataObj = res?.data || res || {};
            const usersRaw = dataObj.users || [];
            const users = usersRaw.filter((u: any) => u.role === 'user');
            const total = dataObj.total || 0;

            // fetch aggregated order stats for displayed users
            try {
                const ids = users.map((u: any) => String(u._id || u.id));
                const statsRes: any = ids.length ? await api.getUserOrderStats(ids) : null;
                // const statsMap = statsRes?.data?.data || statsRes?.data || {};
                // console.log("b:", statsMap);
                return {
                    data: users.map((u: any) => {
                        const idStr = String(u._id || u.id);
                        const s = statsRes && statsRes[idStr] ? statsRes[idStr] : null;
                        return {
                            key: idStr,
                            id: idStr,
                            name: u.name || '',
                            email: u.email || '',
                            phone: u.phone || '',
                            avatar: (u.avatar || '') as string,
                            type: 'Normal' as any,
                            status: u.isVerified ? 'active' as any : 'blocked' as any,
                            isVerified: Boolean(u.isVerified),
                            registeredAt: u.createdAt || u.created_at || new Date().toISOString(),
                            totalOrders: s ? (s.totalOrders || 0) : 0,
                            totalSpent: s ? (s.totalSpent || 0) : 0,
                            lastOrderAt: s ? s.lastOrderAt : undefined,
                            address: u.address || '',
                            notes: ''
                        };
                    }),
                    pagination: {
                        total,
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                    }
                };
            } catch (e) {
                // if stats fetch fails, return users with zeroed stats
                return {
                    data: users.map((u: any) => ({
                        key: String(u._id || u.id),
                        id: String(u._id || u.id),
                        name: u.name || '',
                        email: u.email || '',
                        phone: u.phone || '',
                        avatar: (u.avatar || '') as string,
                        type: 'Normal' as any,
                        status: u.isVerified ? 'active' as any : 'blocked' as any,
                        isVerified: Boolean(u.isVerified),
                        registeredAt: u.createdAt || u.created_at || new Date().toISOString(),
                        totalOrders: 0,
                        totalSpent: 0,
                        lastOrderAt: undefined,
                        address: u.address || '',
                        notes: ''
                    })),
                    pagination: {
                        total,
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                    }
                };
            }
        }
    });

    // Create customer (API)
    const createCustomerMutation = useMutation({
        mutationFn: async (data: CustomerFormData) => {
            const payload: any = {
                name: data.name,
                email: data.email,
                password: data.password || Math.random().toString(36).slice(-8),
                role: 'user',
                phone: data.phone,
                address: data.address,
                // admin can set status via formData.status (active => isVerified=true)
                isVerified: data.status === 'active',
            };
            const res: any = await api.adminCreateUser(payload);
            return res;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            setModalOpen(false);
            resetForm();
            toast({
                title: "Thêm khách hàng thành công",
                description: "Khách hàng mới đã được thêm vào hệ thống",
            });
        },
        onError: (error: any) => {
            toast({
                title: "Lỗi khi thêm khách hàng",
                description: error.message || String(error),
                variant: "destructive",
            });
        },
    });

    // Update customer mutation (mock implementation)
    const updateCustomerMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<CustomerFormData> }) => {
            const payload: any = {};
            if (data.name !== undefined) payload.name = data.name;
            if (data.phone !== undefined) payload.phone = data.phone;
            if (data.address !== undefined) payload.address = data.address;
            if (data.password) payload.password = data.password;
            // map form status to isVerified if provided
            if (data.status !== undefined) payload.isVerified = data.status === 'active';
            const res: any = await api.adminUpdateUser(id, payload);
            return res;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            setModalOpen(false);
            resetForm();
            toast({
                title: "Cập nhật khách hàng thành công",
                description: "Thông tin khách hàng đã được cập nhật",
            });
        },
        onError: (error: any) => {
            toast({
                title: "Lỗi khi cập nhật khách hàng",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    // Delete customer (API)
    const deleteCustomerMutation = useMutation({
        mutationFn: async (id: string) => {
            const res: any = await api.adminDeleteUser(id);
            return res;
        },
        onSuccess: (_, customerId) => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            setDeleteModalOpen(false);
            setCustomerToDelete(null);
            const customer = customersData?.data?.find((c: Customer) => c.id === customerId);
            toast({
                title: "Đã xóa khách hàng",
                description: `Khách hàng ${customer?.name} đã được xóa thành công`,
                action: (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            toast({
                                title: "Khôi phục thành công",
                                description: "Khách hàng đã được khôi phục",
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
                title: "Lỗi khi xóa khách hàng",
                description: error.message || String(error),
                variant: "destructive",
            });
        },
    });

    // Bulk operations mutation (delete supported via API; block/unblock not implemented server-side)
    const bulkActionMutation = useMutation({
        mutationFn: async ({ action, ids }: { action: string; ids: string[] }) => {
            if (action === 'delete') {
                await Promise.all(ids.map(id => api.adminDeleteUser(id)));
                return { success: true };
            }
            if (action === 'block') {
                await Promise.all(ids.map(id => api.adminUpdateUser(id, { isVerified: false } as any)));
                return { success: true };
            }
            if (action === 'unblock') {
                await Promise.all(ids.map(id => api.adminUpdateUser(id, { isVerified: true } as any)));
                return { success: true };
            }
            throw new Error('Hành động không hợp lệ');
        },
        onSuccess: (_, { action, ids }) => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            setSelectedCustomers([]);
            const actionText = action === 'block' ? 'khóa' : action === 'unblock' ? 'mở khóa' : 'xóa';
            toast({
                title: `Thực hiện thành công`,
                description: `Đã ${actionText} ${ids.length} khách hàng`,
            });
        },
        onError: (error: any) => {
            toast({
                title: "Lỗi khi thực hiện thao tác",
                description: error.message || String(error),
                variant: "destructive",
            });
        },
    });

    const customers = customersData?.data || [];
    const total = customersData?.pagination?.total || 0;

    // Form validation
    const validateForm = (data: CustomerFormData): Record<string, string> => {
        const errors: Record<string, string> = {};

        if (!data.name.trim()) {
            errors.name = "Bạn phải nhập họ tên";
        }

        if (!data.email.trim()) {
            errors.email = "Bạn phải nhập email";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            errors.email = "Email không hợp lệ";
        }

        if (!data.phone.trim()) {
            errors.phone = "Bạn phải nhập số điện thoại";
        } else if (!/^0\d{9,10}$/.test(data.phone)) {
            errors.phone = "Số điện thoại không hợp lệ (ví dụ: 0901234567)";
        }

        if (modalMode === "create" && !data.password) {
            errors.password = "Bạn phải nhập mật khẩu";
        } else if (data.password && data.password.length < 8) {
            errors.password = "Mật khẩu phải có ít nhất 8 ký tự";
        }

        return errors;
    };

    const resetForm = () => {
        setFormData({
            name: "",
            email: "",
            phone: "",
            address: "",
            notes: "",
            status: "active",
            type: "Normal",
            sendInviteEmail: false
        });
        setFormErrors({});
        setIsFormDirty(false);
    };

    const handleFormChange = (field: keyof CustomerFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setIsFormDirty(true);

        if (formErrors[field]) {
            setFormErrors(prev => ({ ...prev, [field]: "" }));
        }
    };

    const columns: Column[] = [
        {
            key: "id",
            title: "Mã KH",
            sortable: true,
            render: (value) => <span className="font-mono text-sm">{value}</span>,
        },
        {
            key: "name",
            title: "Họ tên",
            sortable: true,
            filterable: true,
            render: (value, record: Customer) => (
                <div>
                    <div className="font-medium">{value}</div>
                    <div className="text-sm text-gray-500">{record.email}</div>
                </div>
            ),
        },
        {
            key: "phone",
            title: "Số điện thoại",
            filterable: true,
        },
        {
            key: "type",
            title: "Loại",
            sortable: true,
            render: (value) => (
                <Badge className={value === "VIP" ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" : "bg-gray-100 text-gray-800 hover:bg-gray-100"}>
                    {value}
                </Badge>
            ),
        },
        {
            key: "registeredAt",
            title: "Ngày đăng ký",
            sortable: true,
            render: (value) => new Date(value).toLocaleDateString('vi-VN'),
        },
        {
            key: "totalOrders",
            title: "Số đơn",
            sortable: true,
            render: (value, record: Customer) => (
                <div className="text-center">
                    <div className="font-medium">{value}</div>
                    <div className="text-xs text-gray-500">
                        {new Intl.NumberFormat('vi-VN').format(record.totalSpent)} ₫
                    </div>
                </div>
            ),
        },
        {
            key: "status",
            title: "Trạng thái",
            sortable: true,
            render: (value, record: any) => (
                <Badge className={record.isVerified
                    ? "bg-green-100 text-green-800 hover:bg-green-100"
                    : "bg-red-100 text-red-800 hover:bg-red-100"
                }>
                    {record.isVerified ? "Hoạt động" : "Bị khóa"}
                </Badge>
            ),
        },
    ];

    const handleView = (customer: Customer) => {
        setSelectedCustomer(customer);
        setModalMode("view");
        setModalOpen(true);
    };

    const handleEdit = (customer: Customer) => {
        setSelectedCustomer(customer);
        setFormData({
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            address: customer.address || "",
            notes: customer.notes || "",
            status: customer.status,
            type: customer.type,
            sendInviteEmail: false
        });
        setModalMode("edit");
        setModalOpen(true);
        setIsFormDirty(false);
    };

    const handleDelete = (customer: Customer) => {
        setCustomerToDelete(customer);
        setDeleteModalOpen(true);
    };

    const handleAdd = () => {
        setSelectedCustomer(null);
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
            createCustomerMutation.mutate(formData);
        } else if (modalMode === "edit" && selectedCustomer) {
            updateCustomerMutation.mutate({ id: selectedCustomer.id, data: formData });
        }
    };

    const confirmDelete = () => {
        if (customerToDelete) {
            deleteCustomerMutation.mutate(customerToDelete.id);
        }
    };

    const bulkActions = [
        {
            label: "Kích hoạt",
            action: (keys: string[]) => {
                bulkActionMutation.mutate({ action: 'unblock', ids: keys });
            },
            icon: <UserCheck className="w-4 h-4 mr-2" />,
        },
        {
            label: "Khóa tài khoản",
            action: (keys: string[]) => {
                bulkActionMutation.mutate({ action: 'block', ids: keys });
            },
            icon: <Ban className="w-4 h-4 mr-2" />,
            variant: "default" as const,
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

    const getModalTitle = () => {
        switch (modalMode) {
            case "create": return "Thêm khách hàng mới";
            case "edit": return "Chỉnh sửa khách hàng";
            case "view": return "Chi tiết khách hàng";
            default: return "";
        }
    };

    const getModalDescription = () => {
        switch (modalMode) {
            case "create": return "Nhập thông tin khách hàng mới";
            case "edit": return "Cập nhật thông tin khách hàng";
            case "view": return "Xem thông tin chi tiết khách hàng";
            default: return "";
        }
    };

    const renderCustomerForm = () => {
        if (modalMode === "view" && selectedCustomer) {
            return (
                <div className="space-y-6">
                    <div className="flex items-center space-x-4">
                        <div>
                            <h3 className="text-lg font-semibold">{selectedCustomer.name}</h3>
                            <p className="text-gray-500">{selectedCustomer.email}</p>
                            <div className="flex items-center space-x-2 mt-1">
                                <Badge className={selectedCustomer.type === "VIP" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800"}>
                                    {selectedCustomer.type}
                                </Badge>
                                <Badge className={selectedCustomer.status === "active"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }>
                                    {selectedCustomer.status === "active" ? "Hoạt động" : "Bị khóa"}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-4">
                            <div>
                                <Label className="text-sm font-medium text-gray-700">Số điện thoại</Label>
                                <div className="flex items-center mt-1">
                                    <Phone className="w-4 h-4 text-gray-400 mr-2" />
                                    {selectedCustomer.phone}
                                </div>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-700">Ngày đăng ký</Label>
                                <div className="flex items-center mt-1">
                                    <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                                    {new Date(selectedCustomer.registeredAt).toLocaleDateString('vi-VN')}
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <Label className="text-sm font-medium text-gray-700">Tổng đơn hàng</Label>
                                <div className="flex items-center mt-1">
                                    <CreditCard className="w-4 h-4 text-gray-400 mr-2" />
                                    {selectedCustomer.totalOrders} đơn
                                </div>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-700">Tổng chi tiêu</Label>
                                <div className="flex items-center mt-1">
                                    <CreditCard className="w-4 h-4 text-gray-400 mr-2" />
                                    {new Intl.NumberFormat('vi-VN').format(selectedCustomer.totalSpent)} ₫
                                </div>
                            </div>
                        </div>
                    </div>

                    {selectedCustomer.address && (
                        <div>
                            <Label className="text-sm font-medium text-gray-700">Địa chỉ</Label>
                            <p className="mt-1 text-gray-900">{selectedCustomer.address}</p>
                        </div>
                    )}

                    {selectedCustomer.notes && (
                        <div>
                            <Label className="text-sm font-medium text-gray-700">Ghi chú</Label>
                            <p className="mt-1 text-gray-900">{selectedCustomer.notes}</p>
                        </div>
                    )}

                    {/* <div>
                        <Label className="text-sm font-medium text-gray-700">Đơn hàng gần đây</Label>
                        <div className="mt-2 text-sm text-gray-500">
                            Chức năng này sẽ được triển khai khi module Đơn hàng hoàn thành
                        </div>
                    </div> */}
                </div>
            );
        }

        return (
            <div className="space-y-4">
                {/* Avatar upload removed from admin form */}

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="name">Họ tên *</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => handleFormChange('name', e.target.value)}
                            placeholder="Nguyễn Văn A"
                            className={formErrors.name ? "border-red-500" : ""}
                        />
                        {formErrors.name && (
                            <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>
                        )}
                    </div>
                    <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleFormChange('email', e.target.value)}
                            placeholder="abc@domain.com"
                            disabled={modalMode === "edit"}
                            className={formErrors.email ? "border-red-500" : ""}
                        />
                        {formErrors.email && (
                            <p className="text-sm text-red-500 mt-1">{formErrors.email}</p>
                        )}
                        {modalMode === "edit" && (
                            <p className="text-xs text-gray-500 mt-1">Email không thể thay đổi</p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="phone">Số điện thoại *</Label>
                        <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => handleFormChange('phone', e.target.value)}
                            placeholder="0901234567"
                            className={formErrors.phone ? "border-red-500" : ""}
                        />
                        {formErrors.phone && (
                            <p className="text-sm text-red-500 mt-1">{formErrors.phone}</p>
                        )}
                    </div>
                    <div>
                        <Label htmlFor="type">Loại khách hàng</Label>
                        <Select
                            value={formData.type}
                            onValueChange={(value) => handleFormChange('type', value)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Normal">Normal</SelectItem>
                                <SelectItem value="VIP">VIP</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {modalMode === "create" && (
                    <div>
                        <Label htmlFor="password">Mật khẩu *</Label>
                        <Input
                            id="password"
                            type="password"
                            value={formData.password || ""}
                            onChange={(e) => handleFormChange('password', e.target.value)}
                            placeholder="Mật khẩu ít nhất 8 ký tự"
                            className={formErrors.password ? "border-red-500" : ""}
                        />
                        {formErrors.password && (
                            <p className="text-sm text-red-500 mt-1">{formErrors.password}</p>
                        )}
                        {/* <div className="flex items-center space-x-2 mt-2">
                            <Checkbox
                                id="sendInvite"
                                checked={formData.sendInviteEmail}
                                onCheckedChange={(checked) => handleFormChange('sendInviteEmail', checked)}
                            />
                            <Label htmlFor="sendInvite" className="text-sm">
                                Gửi email mời đăng nhập
                            </Label>
                        </div> */}
                    </div>
                )}

                <div>
                    <Label htmlFor="address">Địa chỉ</Label>
                    <Textarea
                        id="address"
                        value={formData.address}
                        onChange={(e) => handleFormChange('address', e.target.value)}
                        placeholder="123 Lê Lợi, Q1, TP.HCM"
                        rows={2}
                    />
                </div>

                <div>
                    <Label htmlFor="notes">Ghi chú</Label>
                    <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => handleFormChange('notes', e.target.value)}
                        placeholder="Ghi chú về khách hàng"
                        rows={3}
                    />
                </div>

                {modalMode === "edit" && (
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
                                <SelectItem value="active">Hoạt động</SelectItem>
                                <SelectItem value="blocked">Bị khóa</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>
        );
    };

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
        return createCustomerMutation.isPending || updateCustomerMutation.isPending;
    };

    return (
        <div className="p-6 space-y-6 bg-gray-50">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý người dùng</h1>
                    <p className="text-gray-600 mt-1">Quản lý thông tin và hoạt động của khách hàng</p>
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
                        Thêm khách hàng
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Tổng khách hàng</p>
                                <p className="text-2xl font-bold">{total || 0}</p>
                            </div>
                            <Users className="w-8 h-8 text-primary" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Khách VIP</p>
                                <p className="text-2xl font-bold">{customers.filter((c: Customer) => c.type === "VIP").length}</p>
                            </div>
                            <UserCheck className="w-8 h-8 text-yellow-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Hoạt động</p>
                                <p className="text-2xl font-bold">{customers.filter((c: Customer) => c.status === "active").length}</p>
                            </div>
                            <UserCheck className="w-8 h-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Mới tháng này</p>
                                <p className="text-2xl font-bold">{customers.filter((c: Customer) => new Date(c.registeredAt).getMonth() === new Date().getMonth()).length}</p>
                            </div>
                            <Plus className="w-8 h-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Danh sách khách hàng</CardTitle>
                            <CardDescription>Quản lý thông tin và trạng thái khách hàng</CardDescription>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                                <SelectTrigger className="w-40">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                                    <SelectItem value="active">Hoạt động</SelectItem>
                                    <SelectItem value="blocked">Bị khóa</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                                <SelectTrigger className="w-32">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả loại</SelectItem>
                                    <SelectItem value="VIP">VIP</SelectItem>
                                    <SelectItem value="Normal">Normal</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <DataTable
                        columns={columns}
                        data={customers}
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
                            selectedRowKeys: selectedCustomers,
                            onChange: setSelectedCustomers,
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
                title={getModalTitle()}
                description={getModalDescription()}
                mode={modalMode}
                size="medium"
                onSubmit={handleSubmit}
                submitDisabled={isSubmitDisabled()}
                submitText={modalMode === "create" ? "Thêm khách hàng" : "Cập nhật"}
                cancelText="Hủy"
            >
                {/* Bọc phần form bằng div scroll */}
                <div className="max-h-[70vh] overflow-y-auto pr-2">
                    {renderCustomerForm()}
                </div>
            </ModalForm>

            <ConfirmModal
                open={deleteModalOpen}
                onOpenChange={setDeleteModalOpen}
                title="Xóa khách hàng"
                message={`Bạn có chắc chắn muốn xóa khách hàng "${customerToDelete?.name}"? Hành động này sẽ ảnh hưởng đến các đơn hàng liên quan.`}
                type="danger"
                requireTyping={true}
                typingText="DELETE"
                onConfirm={confirmDelete}
                confirmText="Xóa khách hàng"
            />
        </div>
    );
}