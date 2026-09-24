"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, Edit, Eye, Trash2, ThumbsUp, MessageSquare, Image, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Textarea } from "../../components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { DataTable, Column } from "../../components/DataTable";
import { ModalForm } from "../../components/ModalForm";
import { ConfirmModal } from "../../components/ConfirmModal";
import { useToast } from "../../components/ui/use-toast";

interface Review {
    _id: string;
    orderId: any; // populated
    productId: any; // populated
    customerId: any; // populated
    rating: number;
    comment: string;
    isVisible: boolean;
    createdAt: string;
    updatedAt: string;
    serviceName: string; // Thêm field này
}

interface ReviewFilters {
    isVisible: string;
    rating: string;
}

const ratingOptions = [
    { value: "5", label: "5 sao" },
    { value: "4", label: "4 sao" },
    { value: "3", label: "3 sao" },
    { value: "2", label: "2 sao" },
    { value: "1", label: "1 sao" },
];

export default function Reviews() {
    const [selectedReviews, setSelectedReviews] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [filters, setFilters] = useState<ReviewFilters>({
        isVisible: "all",
        rating: "all",
    });
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("view");
    const [selectedReview, setSelectedReview] = useState<Review | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [reviewToDelete, setReviewToDelete] = useState<Review | null>(null);

    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 100,
    });

    // Fetch reviews from API
    const { data: reviewsData, isLoading, error, refetch } = useQuery({
        queryKey: ["reviews", pagination.current, pagination.pageSize, searchQuery, filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.append('page', pagination.current.toString());
            params.append('limit', pagination.pageSize.toString());
            if (filters.isVisible !== 'all') params.append('isVisible', filters.isVisible);
            if (searchQuery) params.append('search', searchQuery);

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080'}/api/reviews?${params}`);
            if (!res.ok) throw new Error('Failed to fetch reviews');
            const data = await res.json();
            // Sort data để cái mới (createdAt) lên đầu
            const sortedData = data.data.sort((a: Review, b: Review) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            return {
                data: sortedData,
                pagination: {
                    total: data.total || data.data.length, // Giả sử server trả về data.total, nếu không dùng data.data.length
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                },
            };
        },
    });

    // Toggle visibility mutation
    const toggleVisibilityMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080'}/api/reviews/${id}/toggle-visibility`, {
                method: 'PATCH',
            });
            if (!res.ok) throw new Error('Failed to toggle visibility');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["reviews"] });
            toast({
                title: "Cập nhật trạng thái thành công",
            });
        },
        onError: (error: any) => {
            toast({
                title: "Lỗi khi cập nhật",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    // Delete review mutation
    const deleteReviewMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080'}/api/reviews/${id}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to delete review');
            return res.json();
        },
        onSuccess: (_, reviewId) => {
            queryClient.invalidateQueries({ queryKey: ["reviews"] });
            setDeleteModalOpen(false);
            setReviewToDelete(null);

            const review = reviewsData?.data?.find((r: Review) => r._id === reviewId);
            toast({
                title: "Đã xóa đánh giá",
                description: `Đánh giá đã được xóa`,
            });
        },
        onError: (error: any) => {
            toast({
                title: "Lỗi khi xóa đánh giá",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    // Bulk operations mutation
    const bulkActionMutation = useMutation({
        mutationFn: async ({ action, ids }: { action: string; ids: string[] }) => {
            if (action === "toggle") {
                await Promise.all(ids.map(id => fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080'}/api/reviews/${id}/toggle-visibility`, { method: 'PATCH' })));
            } else if (action === "delete") {
                await Promise.all(ids.map(id => fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080'}/api/reviews/${id}`, { method: 'DELETE' })));
            }
            return { action, ids };
        },
        onSuccess: (_, { action, ids }) => {
            queryClient.invalidateQueries({ queryKey: ["reviews"] });
            setSelectedReviews([]);
            const actionText = action === "toggle" ? "cập nhật" : "xóa";
            toast({
                title: `Thực hiện thành công`,
                description: `Đã ${actionText} ${ids.length} đánh giá`,
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
     
    const reviews = reviewsData?.data || [];
    const total = reviewsData?.pagination?.total || 0;
   
    const renderStarRating = (rating: number, size: "sm" | "lg" = "sm") => {
        const stars = [];
        const starSize = size === "sm" ? "w-4 h-4" : "w-5 h-5";

        for (let i = 1; i <= 5; i++) {
            stars.push(
                <Star
                    key={i}
                    className={`${starSize} ${i <= rating ? "text-yellow-500 fill-current" : "text-gray-300"}`}
                />
            );
        }
        return <div className="flex">{stars}</div>;
    };
    
    const columns: Column[] = [
        {
            key: "orderNumber",
            title: "Mã đơn hàng",
            render: (_, record: Review) => (
                <div className="text-sm text-gray-600">
                    {record.orderId?.orderNumber || 'N/A'}
                </div>
            ),
        },
        {
            key: "customer",
            title: "Khách hàng",
            render: (_, record: Review) => (
                <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-primary/10 text-primary">
                            {record.orderId?.customerName?.charAt(0) || 'U'}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="font-medium">{record.orderId?.customerName || 'Unknown'}</div>
                        <div className="text-sm text-gray-500">{record.orderId?.customerEmail}</div>
                        <div className="text-sm text-gray-500">{record.orderId?.customerPhone}</div>
                    </div>
                </div>
            ),
        },
        {
            key: "service",
            title: "Dịch vụ",
            render: (_, record: Review) => {
                const item = record.orderId?.items?.[0];
                const type = item?.type;
                const serviceName = record.serviceName || 'Unknown';
                let serviceType = '';
                if (type === 'tour') {
                    serviceType = 'Tour';
                } else if (type === 'bus') {
                    serviceType = 'Bus';
                } else {
                    serviceType = 'N/A';
                }
                return (
                    <div>
                        <div className="font-medium">{serviceName}</div>
                        <Badge variant="outline" className="text-xs">
                            {serviceType}
                        </Badge>
                    </div>
                );
            },
        },
        {
            key: "rating",
            title: "Đánh giá",
            sortable: true,
            render: (value, record: Review) => (
                <div>
                    {renderStarRating(value)}
                    <div className="text-sm text-gray-500 mt-1">{value}/5 sao</div>
                </div>
            ),
        },
        {
            key: "comment",
            title: "Nội dung",
            render: (_, record: Review) => (
                <div className="max-w-xs">
                    <div className="text-sm text-gray-600 truncate">{record.comment}</div>
                </div>
            ),
        },
        {
            key: "isVisible",
            title: "Trạng thái",
            sortable: true,
            render: (value, record: Review) => (
                <Badge
                    className={
                        value
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : "bg-red-100 text-red-800 hover:bg-red-100"
                    }
                >
                    {value ? "Hiển thị" : "Ẩn"}
                </Badge>
            ),
        },
        {
            key: "createdAt",
            title: "Ngày tạo",
            sortable: true,
            render: (value) => (
                <div className="text-sm">
                    <div>{new Date(value).toLocaleDateString("vi-VN")}</div>
                    <div className="text-gray-500">
                        {new Date(value).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                </div>
            ),
        },
    ];

    const handleView = (review: Review) => {
        setSelectedReview(review);
        setModalMode("view");
        setModalOpen(true);
    };

    const handleToggleVisibility = (review: Review) => {
        toggleVisibilityMutation.mutate(review._id);
    };

    const handleDelete = (review: Review) => {
        setReviewToDelete(review);
        setDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (reviewToDelete) {
            deleteReviewMutation.mutate(reviewToDelete._id);
        }
    };
    
    const bulkActions = [
        {
            label: "Chuyển trạng thái",
            action: (keys: string[]) => {
                bulkActionMutation.mutate({ action: "toggle", ids: keys });
            },
            icon: <RefreshCw className="w-4 h-4 mr-2" />,
        },
        {
            label: "Xóa",
            action: (keys: string[]) => {
                bulkActionMutation.mutate({ action: "delete", ids: keys });
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
            label: "Chuyển trạng thái",
            action: handleToggleVisibility,
            icon: <RefreshCw className="mr-2 h-4 w-4" />,
        },
        {
            label: "Xóa",
            action: handleDelete,
            icon: <Trash2 className="mr-2 h-4 w-4" />,
            variant: "destructive" as const,
        },
    ];

    const renderReviewDetails = () => {
        if (!selectedReview) return null;

        const item = selectedReview.orderId?.items?.[0];
        const type = item?.type;
        const serviceName = selectedReview.serviceName || 'Unknown';

        return (
            <div className="space-y-6">
                <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                        <Avatar className="w-12 h-12">
                            <AvatarFallback className="bg-primary/10 text-primary text-lg">
                                {selectedReview.orderId?.customerName?.charAt(0) || 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h3 className="text-lg font-semibold">{selectedReview.orderId?.customerName || 'Unknown'}</h3>
                            <p className="text-gray-500">{selectedReview.orderId?.customerEmail}</p>
                            <p className="text-gray-500">{selectedReview.orderId?.customerPhone}</p>
                            <p className="text-gray-500">Dịch vụ: {serviceName}</p>
                            <Badge variant="outline" className="text-xs mt-1">
                                {type === 'tour' ? 'Tour' : type === 'bus' ? 'Bus' : 'N/A'}
                            </Badge>
                        </div>
                    </div>
                    <div className="text-right">
                        {renderStarRating(selectedReview.rating, "lg")}
                        <p className="text-sm text-gray-500 mt-1">
                            {new Date(selectedReview.createdAt).toLocaleDateString("vi-VN")}
                        </p>
                    </div>
                </div>

                <div>
                    <p className="text-gray-900 leading-relaxed">{selectedReview.comment}</p>
                </div>

                <div className="flex space-x-2 pt-4 border-t">
                    <Button size="sm" onClick={() => handleToggleVisibility(selectedReview)}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        {selectedReview.isVisible ? "Ẩn" : "Hiển thị"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(selectedReview)}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Xóa
                    </Button>
                </div>
            </div>
        );
    };

    return (
        <div className="p-6 space-y-6 bg-gray-50">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý đánh giá</h1>
                    <p className="text-gray-600 mt-1">Quản lý đánh giá, bình luận của khách hàng</p>
                </div>
                <div className="flex items-center space-x-3">
                    {/* <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                        Làm mới
                    </Button> */}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Tổng đánh giá</p>
                                <p className="text-2xl font-bold">{total || 0}</p>
                            </div>
                            <Star className="w-8 h-8 text-primary" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Hiển thị</p>
                                <p className="text-2xl font-bold">{reviews.filter((r: Review) => r.isVisible).length}</p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Ẩn</p>
                                <p className="text-2xl font-bold">{reviews.filter((r: Review) => !r.isVisible).length}</p>
                            </div>
                            <XCircle className="w-8 h-8 text-red-500" />
                        </div>
                    </CardContent>
                </Card>
                {/* <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Điểm TB</p>
                                <p className="text-2xl font-bold">
                                    {reviews.length > 0
                                        ? (reviews.reduce((sum: number, r: Review) => sum + r.rating, 0) / reviews.length).toFixed(1)
                                        : "0.0"}
                                </p>
                            </div>
                            <Star className="w-8 h-8 text-yellow-500 fill-current" />
                        </div>
                    </CardContent>
                </Card> */}
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Danh sách đánh giá</CardTitle>
                            <CardDescription>Quản lý và kiểm duyệt đánh giá của khách hàng</CardDescription>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Select value={filters.isVisible} onValueChange={(value) => setFilters((prev) => ({ ...prev, isVisible: value }))}>
                                <SelectTrigger className="w-32">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả</SelectItem>
                                    <SelectItem value="true">Hiển thị</SelectItem>
                                    <SelectItem value="false">Ẩn</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={filters.rating} onValueChange={(value) => setFilters((prev) => ({ ...prev, rating: value }))}>
                                <SelectTrigger className="w-24">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả</SelectItem>
                                    {ratingOptions.map((rating) => (
                                        <SelectItem key={rating.value} value={rating.value}>
                                            {rating.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <DataTable
                        columns={columns}
                        data={reviews}
                        pagination={{
                            current: pagination.current,
                            pageSize: pagination.pageSize,
                            total: total,
                        }}
                        onPaginationChange={(page, pageSize) => setPagination({ current: page, pageSize })}
                        onSearch={setSearchQuery}
                        rowSelection={{
                            selectedRowKeys: selectedReviews,
                            onChange: setSelectedReviews,
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
                onOpenChange={setModalOpen}
                title="Chi tiết đánh giá"
                description="Xem thông tin chi tiết và quản lý đánh giá"
                mode="view"
                size="medium"
            >
                {renderReviewDetails()}
            </ModalForm>

            <ConfirmModal
                open={deleteModalOpen}
                onOpenChange={setDeleteModalOpen}
                title="Xóa đánh giá"
                message={`Bạn có chắc chắn muốn xóa đánh giá này? Hành động này không thể hoàn tác.`}
                type="danger"
                requireTyping={false}
                onConfirm={confirmDelete}
                confirmText="Xóa đánh giá"
                loading={deleteReviewMutation.isPending}
            />
        </div>
    );
}