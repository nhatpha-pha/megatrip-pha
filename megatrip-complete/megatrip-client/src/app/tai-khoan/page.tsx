"use client"
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import * as Tooltip from "@radix-ui/react-tooltip";
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Separator } from '../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import {
    User,
    Edit,
    Settings,
    FileText,
    CreditCard,
    Bell,
    MapPin,
    Phone,
    Mail,
    Calendar,
    Plane,
    Bus,
    Map as MapIcon,
    Eye,
    Download,
    Star,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Users,
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@radix-ui/react-dialog';
import { DialogFooter, DialogHeader } from '../components/ui/dialog';
import Modal, { ModalContent, ModalDescription, ModalFooter, ModalHeader, ModalTitle } from '../components/ui/Modal';
import OrderReviewDialog from '../components/OrderReviewDialog';
import { me, updateProfile } from '@/apis/auth';
import Protected from '../components/Protected';
import { toast } from 'sonner';
import { useSearchParams } from 'next/navigation';
import { withSuspense } from '../components/SuspenseWrapper';

const FAKE_CUSTOMER_ID = '64e65e8d3d5e2b0c8a3e9f12';
// Sample user data
const userData = {
    profile: {
        name: 'Nguyễn Văn An',
        email: 'nguyenvanan@email.com',
        phone: '0912345678',
        dateOfBirth: '1990-05-15',
        gender: 'male',
        address: '123 Nguyễn Huệ, Qu���n 1, TP.HCM',
        avatar: '/placeholder.svg',
        memberSince: '2023-01-15',
        verified: true,
    },
    bookings: [
        {
            id: 'TRV123456789',
            type: 'flight',
            status: 'confirmed',
            bookingDate: (() => { const d = new Date(); d.setDate(d.getDate() - 2); return d.toISOString().slice(0, 10); })(),
            serviceDate: (() => { const d = new Date(); d.setDate(d.getDate() + 15); return d.toISOString().slice(0, 10); })(),
            title: 'Chuyến bay TP.HCM - Hà Nội',
            details: 'VN1546 • 06:15 - 08:30',
            passengers: 2,
            total: 4460000,
            canCancel: true,
            canChange: true,
        },
        { id: 'TRV123456790', type: 'flight', status: 'confirmed', bookingDate: '2025-01-10', serviceDate: '2025-06-10', title: 'TP.HCM - Nha Trang', details: 'VJ221 • 08:00 - 09:10', passengers: 1, total: 900000, canCancel: true, canChange: true },
        { id: 'TRV123456791', type: 'flight', status: 'pending', bookingDate: '2025-02-01', serviceDate: '2025-07-01', title: 'HN - Đà Lạt', details: 'VN330 • 12:00 - 13:30', passengers: 2, total: 1800000 },
        {
            id: 'TRV123456792',
            type: 'bus',
            status: 'confirmed',
            bookingDate: '2025-03-05',
            serviceDate: '2025-08-15',
            title: 'Xe Sài Gòn - Vũng Tàu',
            details: 'Ghế ngồi thường • 07:00',
            passengers: 3,
            total: 450000,
            canCancel: true,
            canChange: true,
        },
        {
            id: 'TRV123456787',
            type: 'bus',
            status: 'confirmed',
            bookingDate: '2024-10-15',
            serviceDate: '2025-12-20',
            title: 'Xe TP.HCM - Đà Lạt',
            details: 'Giường nằm VIP • 22:30',
            passengers: 2,
            total: 700000,
            canCancel: true,
            canChange: true,
        },
        {
            id: 'TRV123456788',
            type: 'tour',
            status: 'confirmed',
            bookingDate: '2024-11-20',
            serviceDate: '2025-12-05',
            title: 'Tour Đà Nẵng - Hội An 3N2Đ',
            details: 'Khách sạn 4* • 4 khách',
            passengers: 4,
            total: 15960000,
            canReview: true,
            rating: 5,
            canCancel: true,
            canChange: true,
        },
        { id: 'TRV123456793', type: 'tour', status: 'cancelled', bookingDate: '2024-09-12', serviceDate: '2024-10-01', title: 'Tour Sapa 2N1Đ', details: 'Khách sạn 3* • 2 khách', passengers: 2, total: 3200000 },
        { id: 'TRV123456794', type: 'bus', status: 'completed', bookingDate: '2024-08-01', serviceDate: '2024-09-01', title: 'Xe Đà Nẵng - Hội An', details: 'Ghế ngồi • 10:00', passengers: 2, total: 200000 },
        { id: 'TRV123456795', type: 'flight', status: 'cancelled', bookingDate: '2024-07-15', serviceDate: '2024-08-20', title: 'HN - TP.HCM', details: 'VJ110 • 20:00 - 21:30', passengers: 1, total: 1200000 },
        { id: 'TRV123456796', type: 'tour', status: 'confirmed', bookingDate: '2025-04-01', serviceDate: '2025-09-10', title: 'Tour Miền Tây 3N2Đ', details: 'Khách sạn 3* • 4 khách', passengers: 4, total: 8400000, canCancel: true, canChange: true },
    ],
    savedTravelers: [
        {
            id: 1,
            name: 'Nguyễn Văn An',
            idType: 'cccd',
            idNumber: '123456789012',
            dateOfBirth: '1990-05-15',
            relationship: 'Bản thân',
        },
        {
            id: 2,
            name: 'Nguyễn Thị Bình',
            idType: 'cccd',
            idNumber: '123456789013',
            dateOfBirth: '1992-03-20',
            relationship: 'Vợ/Chồng',
        },
        {
            id: 3,
            name: 'Nguyễn Văn Cường',
            idType: 'cccd',
            idNumber: '123456789014',
            dateOfBirth: '2015-08-10',
            relationship: 'Con',
        },
    ],
    notifications: [
        {
            id: 1,
            type: 'booking_confirmed',
            title: 'Đặt chỗ thành công',
            message: 'Vé máy bay TRV123456789 đã được xác nhận',
            date: '2024-12-28 14:30',
            read: false,
        },
        {
            id: 2,
            type: 'price_alert',
            title: 'Cảnh báo giá vé',
            message: 'Giá vé TP.HCM - Đà Nẵng đã giảm 20%',
            date: '2024-12-27 09:15',
            read: true,
        },
        {
            id: 3,
            type: 'promotion',
            title: 'Khuyến mãi mới',
            message: 'Giảm 30% cho tour miền Bắc trong tháng 1',
            date: '2024-12-26 16:00',
            read: true,
        },
    ]
};

type RequestItem = {
    id: string;
    type: 'refund' | 'change';
    bookingId: string;
    title: string;
    status: 'submitted' | 'processing' | 'approved' | 'rejected';
    createdAt: string;
    amountRefund?: number;
    extraPay?: number;
    method?: string;
    details?: any;
};

function getRequests(): RequestItem[] {
    try {
        const raw = localStorage.getItem('userRequests');
        const arr = raw ? JSON.parse(raw) : [];
        if (Array.isArray(arr)) return arr.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        return [];
    } catch {
        return [];
    }
}

function RequestsTab({ formatPrice, customerId }: { formatPrice: (n: number) => string, customerId: string }) {
    const [items, setItems] = useState<RequestItem[]>(getRequests());
    const [detailOpen, setDetailOpen] = useState(false);
    const [selected, setSelected] = useState<RequestItem | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const openDetail = (r: RequestItem) => { setSelected(r); setDetailOpen(true); };

    async function loadSupport() {
        setLoading(true);
        setError(null);
        try {
            const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
            const res = await fetch(`${base}/api/support?customerId=${encodeURIComponent(customerId)}&page=1&pageSize=50`);
            if (!res.ok) throw new Error(String(res.status));
            const json = await res.json();
            // server returns { ok: true, data: [...] } or { data: [...] }
            const arr = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
            const mapped: RequestItem[] = (arr || []).map((t: any) => {
                const refund = t.refundInfo || {};
                const type = t.type === 'cancel' ? 'refund' : (t.type === 'change' ? 'change' : 'refund');
                const statusMap: Record<string, RequestItem['status']> = {
                    new: 'submitted',
                    open: 'processing',
                    pending: 'processing',
                    resolved: 'approved',
                    closed: 'rejected'
                };
                return {
                    id: t.ticketNumber || t._id || String(Math.random()).slice(2, 10),
                    type,
                    bookingId: refund.orderRef || t.metadata?.orderRef || '',
                    title: t.title || (refund.orderRef ? `Yêu cầu ${refund.orderRef}` : 'Yêu cầu hỗ trợ'),
                    status: statusMap[t.status] || 'submitted',
                    createdAt: t.createdAt || t.createdAt || new Date().toISOString(),
                    amountRefund: Number(refund.refundAmount || 0),
                    extraPay: undefined,
                    method: refund.paymentReference || refund.transId || refund.zp_trans_id || undefined,
                    details: refund || t.metadata || {}
                };
            });
            if (mapped.length) setItems(mapped);
            else setItems(getRequests()); // fallback to localStorage if empty
        } catch (err: any) {
            console.error('Failed to load support requests:', err);
            setError(err?.message || 'load_failed');
            setItems(getRequests());
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        // load on mount
        if (customerId) loadSupport();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [customerId]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Yêu cầu đã gửi</h1>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={loadSupport} disabled={loading}>{loading ? 'Đang tải...' : 'Làm mới'}</Button>
                    {error && <div className="text-sm text-red-500">{error}</div>}
                </div>
            </div>

            {items.length === 0 ? (
                <Card>
                    <CardContent className="p-6 text-sm text-muted-foreground">Chưa có yêu cầu nào.</CardContent>
                </Card>
            ) : (
                <div className="max-h-[64vh] overflow-y-auto space-y-4 pr-2">
                    {items.map((r) => (
                        <Card key={r.id} className="hover:shadow-sm cursor-pointer" onClick={() => openDetail(r)}>
                            <CardContent className="p-4 flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 rounded bg-primary/10">
                                        {r.type === 'refund' ? <XCircle className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <div className="font-medium">{r.title}</div>
                                            <Badge variant="secondary">{r.bookingId}</Badge>
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-0.5">Mã yêu cầu: {r.id} • Ngày {new Date(r.createdAt).toLocaleString('vi-VN')}</div>
                                        <div className="text-sm mt-1">
                                            {r.type === 'refund' && (
                                                <span>Hoàn dự kiến: <span className="font-medium text-green-600">{formatPrice(r.amountRefund || 0)}</span></span>
                                            )}
                                            {r.type === 'change' && (
                                                <span>
                                                    {typeof r.extraPay === 'number' && r.extraPay > 0 ? (
                                                        <>Thanh toán thêm: <span className="font-medium text-primary">{formatPrice(r.extraPay)}</span></>
                                                    ) : (
                                                        <>Hoàn lại: <span className="font-medium text-green-600">{formatPrice(Math.abs(r.extraPay || 0))}</span></>
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right space-y-1">
                                    <Badge className={
                                        r.status === 'approved' ? 'text-green-700 bg-green-50 border-green-200' :
                                            r.status === 'processing' ? 'text-amber-700 bg-amber-50 border-amber-200' :
                                                r.status === 'rejected' ? 'text-red-700 bg-red-50 border-red-200' : 'text-blue-700 bg-blue-50 border-blue-200'
                                    }>
                                        {r.status === 'submitted' && 'Đã gửi'}
                                        {r.status === 'processing' && 'Đang duyệt'}
                                        {r.status === 'approved' && 'Phê duyệt'}
                                        {r.status === 'rejected' && 'Từ chối'}
                                    </Badge>
                                    {r.method && <div className="text-xs text-muted-foreground">Phương thức: {r.method}</div>}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Modal open={detailOpen} onOpenChange={setDetailOpen}>
                <ModalContent>
                    <ModalHeader>
                        <ModalTitle>Chi tiết yêu cầu</ModalTitle>
                        <ModalDescription>
                            {selected ? (
                                <span>
                                    {selected.type === 'refund' ? 'Yêu cầu hủy đơn (hoàn tiền)' : 'Yêu cầu đổi lịch'} • Mã: {selected.id}
                                </span>
                            ) : '—'}
                        </ModalDescription>
                    </ModalHeader>
                    {selected && (
                        <div className="p-4 space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="font-medium">{selected.title}</div>
                                <Badge variant="secondary">{selected.bookingId}</Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">Tạo lúc: {new Date(selected.createdAt).toLocaleString('vi-VN')}</div>

                            <Separator />

                            {selected.type === 'refund' && (
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center justify-between">
                                        <span>Hoàn dự kiến</span>
                                        <span className="font-semibold text-green-600">{formatPrice(selected.amountRefund || 0)}</span>
                                    </div>
                                    {selected.method && (
                                        <div className="flex items-center justify-between">
                                            <span>Phương thức nhận</span>
                                            <span className="font-medium">{selected.method}</span>
                                        </div>
                                    )}
                                    {selected.details && (
                                        <div className="mt-2">
                                            <div className="text-xs font-medium">Chi tiết tính</div>
                                            <ul className="list-disc ml-4 mt-1 space-y-1 text-xs">
                                                {/* <li>Nhà vận chuyển: {selected.details.airline || '—'}</li> */}
                                                {'tierRate' in selected.details && <li>Tỷ lệ phạt: {Math.round((selected.details.tierRate || 0) * 100)}%</li>}
                                                {'airlinePenalty' in selected.details && <li>Phí phạt hãng: {formatPrice(selected.details.airlinePenalty || 0)}</li>}
                                                {'taxes' in selected.details && <li>Thuế/Phí không hoàn: {formatPrice(selected.details.taxes || 0)}</li>}
                                                {'platformFee' in selected.details && <li>Phí nền tảng: {formatPrice(selected.details.platformFee || 0)}</li>}
                                                {selected.details.reason && <li>Lý do: {selected.details.reason}</li>}
                                                {selected.details.note && <li>Ghi chú: {selected.details.note}</li>}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}

                            {selected.type === 'change' && (
                                <div className="space-y-2 text-sm">
                                    {selected.details && (
                                        <>
                                            <div className="flex items-center justify-between">
                                                <span>Ngày mới</span>
                                                <span className="font-medium">{selected.details.newDate}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span>Giờ</span>
                                                <span className="font-medium">{selected.details.time}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span>Số khách</span>
                                                <span className="font-medium">{selected.details.passengers}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span>Chênh lệch giá</span>
                                                <span className={(selected.details.fareDiff || 0) >= 0 ? 'font-medium text-orange-600' : 'font-medium text-green-600'}>
                                                    {(selected.details.fareDiff || 0) >= 0 ? '+' : '-'}{formatPrice(Math.abs(selected.details.fareDiff || 0))}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span>Phí đổi lịch/khách</span>
                                                <span className="font-medium">{formatPrice(selected.details.changeFeePerPax || 0)}</span>
                                            </div>
                                            <Separator />
                                            <div className="flex items-center justify-between">
                                                <span>{(selected.extraPay || 0) > 0 ? 'Thanh toán thêm' : 'Hoàn lại'}</span>
                                                <span className={(selected.extraPay || 0) > 0 ? 'text-primary font-semibold' : 'text-green-600 font-semibold'}>
                                                    {formatPrice(Math.abs(selected.extraPay || 0))}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    <ModalFooter>
                        <Button variant="outline" onClick={() => setDetailOpen(false)}>Đóng</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

        </div>
    );
}

function mapOrderToBooking(order: any) {
    const snap = order.metadata?.bookingDataSnapshot;
    const item = Array.isArray(order.items) && order.items[0] ? order.items[0] : null;
    const pax = (() => {
        if (snap?.passengers?.counts) {
            const c = snap.passengers.counts;
            return Number(c.adults || 0) + Number(c.children || 0) + Number(c.infants || 0);
        }
        if (Array.isArray(snap?.details?.passengers)) return snap.details.passengers.length;
        if (item?.quantity) return Number(item.quantity) || 1;
        return 1;
    })();
    // compute serviceDate and days until service
    const originalServiceDateRaw = snap?.details?.startDateTime ?? snap?.details?.date;
    const serviceDateRaw = order.changeCalendar && order.dateChangeCalendar ? order.dateChangeCalendar : originalServiceDateRaw;
    let serviceDate = serviceDateRaw;

    // Nếu là flight và chưa đổi lịch, lấy ngày từ flights
    if (item?.type === 'flight' && !order.changeCalendar) {
        const flights = snap?.flights;
        if (flights?.outbound && flights?.inbound) {
            serviceDate = `${flights.outbound.date} - ${flights.inbound.date}`;
        } else if (flights?.outbound) {
            serviceDate = flights.outbound.date;
        } else if (flights?.inbound) {
            serviceDate = flights.inbound.date;
        }
    }

    // Sau khi set serviceDate
    const serviceDateObj = serviceDate ? new Date(serviceDate.split(' - ')[0]) : (order.createdAt ? new Date(order.createdAt) : null);
    const daysUntilService = serviceDateObj ? Math.ceil((Date.UTC(serviceDateObj.getFullYear(), serviceDateObj.getMonth(), serviceDateObj.getDate()) - Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())) / (1000 * 60 * 60 * 24)) : null;

    const paymentStatus = order.paymentStatus || 'pending';
    // cancel only when paymentStatus === 'paid'
    const canCancel = paymentStatus === 'paid';
    // allow change only when daysUntilService is defined and > 3, and not already changed
    // const canChange = (typeof daysUntilService === 'number' ? (daysUntilService > 3) : false) && !order.changeCalendar;
    const canChange = (() => {
        const flights = snap?.flights;
        if (item?.type === 'flight' && flights?.outbound && flights?.inbound) {
            return false; // Không cho đổi lịch flight khứ hồi
        }
        return (typeof daysUntilService === 'number' ? (daysUntilService > 3) : false) && !order.changeCalendar;
    })();
    const canReview = (order.orderStatus === 'confirmed' || order.orderStatus === 'completed');

    return {
        orderObjectId: order._id,
        id: order.orderNumber || order._id,
        productId: item?.productId || item?.itemId || '',
        type: item?.type || 'tour',
        status: order.orderStatus || order.status || 'pending',
        paymentStatus,
        bookingDate: order.createdAt ? new Date(order.createdAt).toISOString().slice(0, 10) : '',
        serviceDate,
        daysUntilService,
        title: item?.name || snap?.details?.route || 'Đặt dịch vụ',
        details: item ? `${item.name} • x${item.quantity}` : (snap?.details?.route || ''),
        passengers: pax,
        total: Number(order.total || 0),
        canCancel,
        canChange,
        canReview,
        refunded: order.refundedAmount || 0,
        rating: null,
        changeCalendar: order.changeCalendar,
        hasRefundRequest: order.hasRefundRequest || false,
    };
}



function TaiKhoan() {
    const searchParams: any = useSearchParams();
    const [activeTab, setActiveTab] = useState<string>('overview');
    // Thêm state cho customerId
    const [customerId, setCustomerId] = useState<string | null>(null);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [changePasswordData, setChangePasswordData] = useState({ currentPassword: '', newPassword: '' });
    const [changingPassword, setChangingPassword] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState(userData.profile);
    const [bookings, setBookings] = useState<any>(null);
    const [loadingBookings, setLoadingBookings] = useState(false);
    const [bookingsError, setBookingsError] = useState(null);
    const [memberSinceDate, setMemberSinceDate] = useState<string>('');
    useEffect(() => {
        // Try to read a possible navigation state (if any) without relying on react-router
        try {
            const state = (typeof window !== 'undefined' && window.history && window.history.state) ? window.history.state : undefined;
            const tab = state && (state as any).activeTab;
            if (tab) setActiveTab(tab);
        } catch {
            // ignore if anything fails
        }
    }, []);
    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab) setActiveTab(tab);
    }, [searchParams]);
    // Minimal auth check + load real profile into the existing `userData` object.
    // We purposely mutate the `userData.profile` object (keeps changes minimal) and
    // bump `version` to force a re-render so the UI updates.
    const [version, setVersion] = useState(0);
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const token = localStorage.getItem('accessToken');
        if (!token) {
            // if no token, redirect to login (minimal change: use location)
            window.location.href = '/dang-nhap';
            return;
        }

        const fetchProfile = async () => {
            try {
                const payload: any = await me();
                // map fields...
                userData.profile.name = payload.name ?? userData.profile.name;
                userData.profile.email = payload.email ?? userData.profile.email;
                userData.profile.phone = payload.phone ?? userData.profile.phone;
                userData.profile.address = payload.address ?? userData.profile.address;
                userData.profile.dateOfBirth = payload.dob ? new Date(payload.dob).toISOString().slice(0, 10) : userData.profile.dateOfBirth;
                // don't override avatar/memberSince/verified unless provided
                if (payload.avatar) userData.profile.avatar = payload.avatar;
                if (payload.createdAt) {
                    userData.profile.memberSince = payload.createdAt;
                    setMemberSinceDate(new Date(payload.createdAt).toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' }));
                }// Use createdAt for memberSince
                if (payload.role) userData.profile.verified = payload.role === 'user' ? true : userData.profile.verified;
                // Thêm: Lấy customerId
                const resolvedUserId = payload?._id ?? payload?.id ?? payload?.userId ?? payload?._id?.$oid ?? null;
                console.log('Resolved customerId from me():', resolvedUserId); // Log để kiểm tra
                setCustomerId(resolvedUserId);
                // trigger re-render
                setVersion(v => v + 1);
            } catch (err) {
                console.error('Failed to load profile (me):', err);
            }
        };

        fetchProfile();
    }, []);

    // sync edit form when we update the profile
    useEffect(() => {
        try {
            setEditForm && setEditForm(userData.profile);
        } catch { }
    }, [version]);


    // ...existing code...

    // Hàm gọi API đổi mật khẩu
    const handleChangePassword = async () => {
        console.log('handleChangePassword called'); // Log khi hàm được gọi
        if (!changePasswordData.currentPassword || !changePasswordData.newPassword) {
            console.log('Validation fail: input rỗng');
            toast.error('Vui lòng nhập đầy đủ thông tin');
            return;
        }
        if (changePasswordData.newPassword.length < 8) {
            console.log('Validation fail: mật khẩu <8 ký tự');
            toast.error('Mật khẩu mới phải có ít nhất 8 ký tự');
            return;
        }
        console.log('Validation pass, calling API'); // Log trước API call
        setChangingPassword(true);
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080'}/api/auth/me/password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    currentPassword: changePasswordData.currentPassword,
                    newPassword: changePasswordData.newPassword,
                }),
            });
            const data = await response.json();
            console.log('API response:', response.status, data); // Log response
            if (response.ok) {
                console.log('API success, closing modal');
                toast.success('Đổi mật khẩu thành công');
                setShowChangePassword(false);
                setChangePasswordData({ currentPassword: '', newPassword: '' });
            } else {
                console.error('API error:', data);
                toast.error(data.message || 'Đổi mật khẩu thất bại');
            }
        } catch (error) {
            console.error('Fetch error:', error);
            toast.error('Lỗi kết nối, vui lòng thử lại');
        } finally {
            setChangingPassword(false);
        }
    };

    // ...existing code...

    useEffect(() => {
        console.log('showChangePassword changed:', showChangePassword);
    }, [showChangePassword]);
    // ...existing code...

    useEffect(() => {
        let mounted = true;
        async function loadBookings() {
            setLoadingBookings(true);
            setBookingsError(null);
            try {
                console.log('Using customerId for loadBookings:', customerId || FAKE_CUSTOMER_ID); // Log để kiểm tra
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080'}/api/orders/customer/${encodeURIComponent(customerId || FAKE_CUSTOMER_ID)}?page=1&pageSize=50`);
                if (!res.ok) throw new Error(`${res.status}`);
                const json = await res.json();
                const data = Array.isArray(json.data) ? json.data : (json.data?.data || []);
                const mapped = data.map(mapOrderToBooking);
                if (mounted) setBookings(mapped);
            } catch (err: any) {
                console.error('Failed to load bookings:', err);
                if (mounted) setBookingsError(err.message || 'load_failed');
            } finally {
                if (mounted) setLoadingBookings(false);
            }
        }
        loadBookings();
        return () => { mounted = false; };
    }, [customerId]);

    const displayBookings = Array.isArray(bookings) ? bookings : [];
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return 'text-green-600 bg-green-50 border-green-200';
            case 'completed': return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'cancelled': return 'text-red-600 bg-red-50 border-red-200';
            case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'confirmed': return 'Đã xác nhận';
            case 'completed': return 'Đã hoàn thành';
            case 'cancelled': return 'Đã hủy';
            case 'pending': return 'Chờ xác nhận';
            default: return status;
        }
    };

    const getServiceIcon = (type: string) => {
        switch (type) {
            case 'flight': return <Plane className="h-4 w-4" />;
            case 'bus': return <Bus className="h-4 w-4" />;
            case 'tour': return <MapIcon className="h-4 w-4" />;
            default: return <FileText className="h-4 w-4" />;
        }
    };

    const handleSaveProfile = () => {
        // Handle profile update
        (async () => {
            try {
                // basic validation
                const payload = {
                    name: editForm.name,
                    address: editForm.address,
                    phone: editForm.phone,
                    dob: editForm.dateOfBirth,
                };
                // call API
                await updateProfile(payload as any);
                // update local userData and re-render
                userData.profile.name = editForm.name;
                userData.profile.email = editForm.email;
                userData.profile.phone = editForm.phone;
                userData.profile.address = editForm.address;
                userData.profile.dateOfBirth = editForm.dateOfBirth;
                setVersion(v => v + 1);
                toast('Cập nhật thông tin thành công');
                setIsEditing(false);
            } catch (err: any) {
                console.error('Update profile failed', err);
                toast.error ? toast.error('Cập nhật thất bại') : toast('Cập nhật thất bại');
            }
        })();
    };
    // Thêm state cho modal
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderDetails, setOrderDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    const [reviewOpen, setReviewOpen] = useState(false);
    const [reviewBooking, setReviewBooking] = useState<any>(null);
    const [statusFilter, setStatusFilter] = useState<string>('all');
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
    // Function mở modal chi tiết
    const openOrderDetail = async (orderId: string) => {
        setLoadingDetails(true);
        setDetailModalOpen(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080'}/api/orders/${orderId}/client/details`);
            if (!res.ok) throw new Error('Failed to load order details');
            const data = await res.json();
            setOrderDetails(data);
            console.log('Loaded order details:', data);
        } catch (err) {
            console.error('Error loading order details:', err);
            setOrderDetails(null);
        } finally {
            setLoadingDetails(false);
        }
    };

    function getTravelDateForFlight(ticket: any) {
        let date = ticket.travelDate;
        if (ticket.type === 'flight') {
            const leg = getLegFromUniq(ticket.uniq);
            if (leg === 'Chuyến đi (Outbound)') {
                date = ticket.reservationInfo?.flights?.outbound?.date || ticket.travelDate;
            } else if (leg === 'Chuyến về (Inbound)') {
                date = ticket.reservationInfo?.flights?.inbound?.date || ticket.travelDate;
            }
        }
        // Chỉ lấy phần date nếu có 'T'
        if (date && typeof date === 'string' && date.includes('T')) {
            return date.split('T')[0];
        }
        return date;
    }
    function getLegFromUniq(uniq: string) {
        if (uniq?.includes('outbound')) return 'Chuyến đi (Outbound)';
        if (uniq?.includes('inbound')) return 'Chuyến về (Inbound)';
        return 'Chuyến bay';
    }
    // Thêm function để lấy giờ xuất phát cho flight đã đổi lịch
    function getDepartureTimeForChangedFlight(ticket: any, orderDetails: any) {
        if (ticket.type === 'flight') {
            // Kiểm tra nếu là vé cũ (có trong oldTickets)
            const isOldTicket = orderDetails?.oldTickets?.some((o: any) => o._id === ticket._id);
            if (isOldTicket) {
                // Vé cũ: luôn dùng reservationInfo, dựa trên leg từ uniq
                const isOutbound = ticket.uniq?.includes('outbound');
                const leg = isOutbound ? 'outbound' : 'inbound';
                const time = ticket.reservationInfo?.flights?.[leg]?.time;
                if (time) {
                    const parts = time.split(' - ');
                    return parts[0] || time;
                }
            } else {
                // Vé mới: ưu tiên selectedOption nếu có changeCalendar
                if (orderDetails?.order?.changeCalendar && orderDetails?.order?.inforChangeCalendar?.data?.meta?.selectedOption?.departure?.time) {
                    return orderDetails.order.inforChangeCalendar.data.meta.selectedOption.departure.time;
                }
                // Fallback to reservationInfo, dựa trên leg từ uniq
                const isOutbound = ticket.uniq?.includes('outbound');
                const leg = isOutbound ? 'outbound' : 'inbound';
                const time = ticket.reservationInfo?.flights?.[leg]?.time;
                if (time) {
                    const parts = time.split(' - ');
                    return parts[0] || time;
                }
            }
        }
        // Cho tour, ưu tiên startDateTime từ reservationInfo.details
        if (ticket.type === 'tour') {
            const startDateTime = ticket.reservationInfo?.details?.startDateTime;
            if (startDateTime) {
                try {
                    const dt = new Date(startDateTime.replace('Z', ''));
                    if (!isNaN(dt.getTime())) {
                        return dt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                    }
                } catch { }
            }
        }
        // Fallback cho bus và các loại khác
        if (!ticket.travelStart) return "";
        try {
            if (ticket.travelStart.includes('T')) {
                const dt = new Date(ticket.travelStart.replace('Z', ''));
                if (!isNaN(dt.getTime())) {
                    return dt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                }
            } else {
                return ticket.travelStart;
            }
        } catch {
            return ticket.travelStart;
        }
        return "";
    }
    return (
        <Protected>
            <>
                <div className="container py-6">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Sidebar */}
                        <div className="lg:w-80">
                            <Card>
                                <CardContent className="p-6">
                                    {/* User Info */}
                                    <div className="text-center mb-6">
                                        <Avatar className="w-20 h-20 mx-auto mb-4">
                                            <AvatarImage src={userData.profile.avatar} />
                                            <AvatarFallback className="text-lg">
                                                {userData.profile.name.split(' ').map(n => n[0]).join('')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <h2 className="text-xl font-bold">{userData.profile.name}</h2>
                                        <p className="text-muted-foreground">{userData.profile.email}</p>
                                        {userData.profile.verified && (
                                            <Badge variant="secondary" className="mt-2">
                                                <CheckCircle className="h-3 w-3 mr-1" />
                                                Đã xác thực
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Navigation */}
                                    <nav className="space-y-2">
                                        <Button
                                            variant={activeTab === 'overview' ? 'default' : 'ghost'}
                                            className="w-full justify-start"
                                            onClick={() => setActiveTab('overview')}
                                        >
                                            <User className="h-4 w-4 mr-2" />
                                            Tổng quan
                                        </Button>
                                        <Button
                                            variant={activeTab === 'bookings' ? 'default' : 'ghost'}
                                            className="w-full justify-start"
                                            onClick={() => setActiveTab('bookings')}
                                        >
                                            <FileText className="h-4 w-4 mr-2" />
                                            Đơn hàng của tôi
                                        </Button>
                                        {/* <Button
                                            variant={activeTab === 'travelers' ? 'default' : 'ghost'}
                                            className="w-full justify-start"
                                            onClick={() => setActiveTab('travelers')}
                                        >
                                            <Users className="h-4 w-4 mr-2" />
                                            Hành khách thường đi
                                        </Button> */}
                                        <Button
                                            variant={activeTab === 'requests' ? 'default' : 'ghost'}
                                            className="w-full justify-start"
                                            onClick={() => setActiveTab('requests')}
                                        >
                                            <FileText className="h-4 w-4 mr-2" />
                                            Yêu cầu đã gửi
                                        </Button>
                                        {/* <Button
                                            variant={activeTab === 'notifications' ? 'default' : 'ghost'}
                                            className="w-full justify-start"
                                            onClick={() => setActiveTab('notifications')}
                                        >
                                            <Bell className="h-4 w-4 mr-2" />
                                            Thông báo
                                        </Button> */}
                                        <Button
                                            variant={activeTab === 'settings' ? 'default' : 'ghost'}
                                            className="w-full justify-start"
                                            onClick={() => setActiveTab('settings')}
                                        >
                                            <Settings className="h-4 w-4 mr-2" />
                                            Cài đặt
                                        </Button>
                                    </nav>

                                    <Separator className="my-6" />

                                    {/* Quick Stats */}
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">Tổng đơn hàng</span>
                                            <span className="font-medium">{displayBookings.length}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">Đã hoàn thành</span>
                                            <span className="font-medium">
                                                {displayBookings.filter((b: any) => b.status === 'completed').length}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">Thành viên từ</span>
                                            <span className="font-medium">{memberSinceDate}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Main Content */}
                        <div className="flex-1">
                            {/* Overview Tab */}
                            {activeTab === 'overview' && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h1 className="text-2xl font-bold">Tổng quan tài khoản</h1>
                                    </div>

                                    {/* Profile Card */}
                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between">
                                            <CardTitle>Thông tin cá nhân</CardTitle>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setIsEditing(!isEditing)}
                                            >
                                                <Edit className="h-4 w-4 mr-2" />
                                                {isEditing ? 'Hủy' : 'Chỉnh sửa'}
                                            </Button>
                                        </CardHeader>
                                        <CardContent>
                                            {isEditing ? (
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <Label htmlFor="name">Họ và tên</Label>
                                                            <Input
                                                                id="name"
                                                                value={editForm.name}
                                                                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label htmlFor="phone">Số điện thoại</Label>
                                                            <Input
                                                                id="phone"
                                                                value={editForm.phone}
                                                                onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label htmlFor="email">Email</Label>
                                                            <Input
                                                                id="email"
                                                                type="email"
                                                                value={editForm.email}
                                                                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label htmlFor="dateOfBirth">Ngày sinh</Label>
                                                            <Input
                                                                id="dateOfBirth"
                                                                type="date"
                                                                value={editForm.dateOfBirth}
                                                                onChange={(e) => setEditForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="address">Địa chỉ</Label>
                                                        <Input
                                                            id="address"
                                                            value={editForm.address}
                                                            onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                                                        />
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button onClick={handleSaveProfile}>Lưu thay đổi</Button>
                                                        <Button variant="outline" onClick={() => setIsEditing(false)}>Hủy</Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-3">
                                                        <div className="flex items-center gap-2">
                                                            <User className="h-4 w-4 text-muted-foreground" />
                                                            <span className="text-sm text-muted-foreground">Họ và tên:</span>
                                                            <span className="font-medium">{userData.profile.name}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Mail className="h-4 w-4 text-muted-foreground" />
                                                            <span className="text-sm text-muted-foreground">Email:</span>
                                                            <span className="font-medium">{userData.profile.email}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Phone className="h-4 w-4 text-muted-foreground" />
                                                            <span className="text-sm text-muted-foreground">Điện thoại:</span>
                                                            <span className="font-medium">{userData.profile.phone}</span>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                                            <span className="text-sm text-muted-foreground">Ngày sinh:</span>
                                                            <span className="font-medium">{userData.profile.dateOfBirth}</span>
                                                        </div>
                                                        <div className="flex items-start gap-2">
                                                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                                            <span className="text-sm text-muted-foreground">Địa chỉ:</span>
                                                            <span className="font-medium">{userData.profile.address}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Recent Bookings */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Đơn hàng gần đây</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {loadingBookings ? (
                                                <div className="text-center">Đang tải...</div>
                                            ) : displayBookings.length === 0 ? (
                                                <div className="text-center text-muted-foreground">Chưa có đơn hàng</div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {displayBookings.slice(0, 3).map((booking: any) => (
                                                        <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-2 bg-primary/10 rounded">
                                                                    {getServiceIcon(booking.type)}
                                                                </div>
                                                                <div>
                                                                    <div className="font-medium">{booking.title}</div>
                                                                    <div className="text-sm text-muted-foreground">{booking.details}</div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <Badge className={getStatusColor(booking.status)}>
                                                                    {getStatusText(booking.status)}
                                                                </Badge>
                                                                {booking.changeCalendar && booking.status !== 'cancelled' && (
                                                                    <>
                                                                        <Badge variant="secondary">Đã đổi lịch</Badge>
                                                                        {/* <span className="text-xs text-muted-foreground">
                                                                    Đã đổi lịch từ {booking.originalServiceDate || 'N/A'} qua {booking.serviceDate}
                                                                </span> */}
                                                                    </>
                                                                )}
                                                                <div className="text-sm text-muted-foreground mt-1">
                                                                    {formatPrice(booking.total)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            <Button variant="outline" className="w-full mt-4" onClick={() => setActiveTab('bookings')}>
                                                Xem tất cả đơn hàng
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}

                            {/* Bookings Tab */}
                            {activeTab === 'bookings' && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h1 className="text-2xl font-bold">Đơn hàng của tôi</h1>

                                        <div className="flex gap-2">
                                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                                <SelectTrigger className="w-40">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">Tất cả</SelectItem>
                                                    <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                                                    <SelectItem value="completed">Đã hoàn thành</SelectItem>
                                                    <SelectItem value="cancelled">Đã hủy</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* Note ở đây */}
                                    <div className="text-sm w-full text-muted-foreground italic ">
                                        <strong>Lưu ý:</strong> Nút &quot;Hủy đơn&quot; sẽ bị vô hiệu hóa nếu đã gửi yêu cầu hoàn. Nút &quot;Đổi lịch&quot; sẽ bị vô hiệu hóa nếu đã đổi lịch trước đó hoặc chuyến sắp khởi hành (trong 3 ngày).
                                    </div>
                                    {loadingBookings ? (
                                        <div className="text-center">Đang tải...</div>
                                    ) : displayBookings.length === 0 ? (
                                        <div className="text-center text-muted-foreground">Chưa có đơn hàng</div>
                                    ) : (
                                        <div className="max-h-[64vh] overflow-y-auto space-y-4 pr-2">
                                            {/* {userData.bookings.map((booking) => ( */}
                                            {(() => {
                                                const filteredBookings = displayBookings.filter((booking: any) =>
                                                    statusFilter === 'all' || booking.status === statusFilter
                                                );
                                                return filteredBookings.map((booking: any) => (

                                                    <Card key={booking.id}>
                                                        <CardContent className="p-6">
                                                            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                                                                <div className="flex items-start gap-4">
                                                                    <div className="p-3 bg-primary/10 rounded-lg">
                                                                        {getServiceIcon(booking.type)}
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <div className="flex items-start gap-2 mb-2">
                                                                            <h3 className="font-semibold">{booking.title}</h3>
                                                                            <Badge className={getStatusColor(booking.status)}>
                                                                                {getStatusText(booking.status)}
                                                                            </Badge>
                                                                            {booking.changeCalendar && booking.status !== 'cancelled' && (
                                                                                <Badge variant="secondary">Đã đổi lịch</Badge>
                                                                            )}
                                                                        </div>
                                                                        <div className="text-sm text-muted-foreground space-y-1">
                                                                            <div>Mã đơn hàng: {booking.id}</div>
                                                                            {/* <div>Chi tiết: {booking.details}</div> */}
                                                                            <div>Ngày đặt: {booking.bookingDate}</div>
                                                                            {/* <div>Ngày sử dụng: {booking.serviceDate}</div> */}
                                                                            <div>
                                                                                <strong>Ngày sử dụng:</strong> {booking.serviceDate.includes('T') ? booking.serviceDate.split('T')[0] : booking.serviceDate}
                                                                            </div>

                                                                            {/* <div>Số khách: {booking.passengers}</div> */}
                                                                            {/* {booking.refunded && (
                                                                        <div className="text-green-600">Đã hoàn: {formatPrice(booking.refunded)}</div>
                                                                    )} */}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="text-right space-y-2">
                                                                    <div className="text-xl font-bold text-primary">
                                                                        {formatPrice(booking.total)}
                                                                    </div>
                                                                    <div className="flex flex-col gap-2">
                                                                        <Button size="sm" variant="outline" onClick={() => openOrderDetail(booking.id)}>
                                                                            <Eye className="h-3 w-3 mr-1" />
                                                                            Xem chi tiết
                                                                        </Button>
                                                                        {booking.paymentStatus === 'paid' && booking.status !== 'completed' && booking.status !== 'cancelled' && (
                                                                            booking.hasRefundRequest ? (
                                                                                <Tooltip.Provider>
                                                                                    <Tooltip.Root>
                                                                                        <Tooltip.Trigger asChild>
                                                                                            <Button
                                                                                                disabled
                                                                                                variant={'outline'}
                                                                                                className="flex items-center border rounded px-2 py-1 text-sm opacity-50 cursor-not-allowed"
                                                                                            >
                                                                                                <XCircle className="h-3 w-3 mr-1" />
                                                                                                Hủy đơn
                                                                                            </Button>
                                                                                        </Tooltip.Trigger>
                                                                                        <Tooltip.Portal>
                                                                                            <Tooltip.Content
                                                                                                className="rounded bg-gray-800 px-2 py-1 text-xs text-white shadow-lg"
                                                                                                sideOffset={5}
                                                                                            >
                                                                                                Đã gửi yêu cầu hoàn
                                                                                            </Tooltip.Content>
                                                                                        </Tooltip.Portal>
                                                                                    </Tooltip.Root>
                                                                                </Tooltip.Provider>
                                                                            ) : (() => {
                                                                                const serviceDateObj = new Date(booking.serviceDate);
                                                                                const today = new Date();
                                                                                const isPast = serviceDateObj.getFullYear() < today.getFullYear() ||
                                                                                    (serviceDateObj.getFullYear() === today.getFullYear() && serviceDateObj.getMonth() < today.getMonth()) ||
                                                                                    (serviceDateObj.getFullYear() === today.getFullYear() && serviceDateObj.getMonth() === today.getMonth() && serviceDateObj.getDate() < today.getDate());
                                                                                return isPast;
                                                                            })() ? (
                                                                                <Tooltip.Provider>
                                                                                    <Tooltip.Root>
                                                                                        <Tooltip.Trigger asChild>
                                                                                            <Button
                                                                                                disabled
                                                                                                variant={'outline'}
                                                                                                className="flex items-center border rounded px-2 py-1 text-sm opacity-50 cursor-not-allowed"
                                                                                            >
                                                                                                <XCircle className="h-3 w-3 mr-1" />
                                                                                                Hủy đơn
                                                                                            </Button>
                                                                                        </Tooltip.Trigger>
                                                                                        <Tooltip.Portal>
                                                                                            <Tooltip.Content
                                                                                                className="rounded bg-gray-800 px-2 py-1 text-xs text-white shadow-lg"
                                                                                                sideOffset={5}
                                                                                            >
                                                                                                Ngày sử dụng đã qua
                                                                                            </Tooltip.Content>
                                                                                        </Tooltip.Portal>
                                                                                    </Tooltip.Root>
                                                                                </Tooltip.Provider>
                                                                            ) : (
                                                                                <Button size="sm" variant="outline" asChild>
                                                                                    <a href={`/tai-khoan/huy-don/${booking.id}`}>
                                                                                        <XCircle className="h-3 w-3 mr-1" />
                                                                                        Hủy đơn
                                                                                    </a>
                                                                                </Button>
                                                                            )
                                                                        )}
                                                                        {/* Always render change button but disable with tooltip when not allowed */}
                                                                        {booking.status !== 'completed' && booking.status !== 'cancelled' && (
                                                                            booking.canChange ? (
                                                                                <Button size="sm" variant="outline" asChild>
                                                                                    <a href={`/tai-khoan/doi-lich/${booking.id}`}>
                                                                                        <Edit className="h-3 w-3 mr-1" />
                                                                                        Đổi lịch
                                                                                    </a>
                                                                                </Button>
                                                                            ) : (
                                                                                <Tooltip.Provider>
                                                                                    <Tooltip.Root>
                                                                                        <Tooltip.Trigger asChild>
                                                                                            <Button
                                                                                                disabled
                                                                                                variant={'outline'}
                                                                                                className="flex items-center border rounded px-2 py-1 text-sm opacity-50 cursor-not-allowed"
                                                                                            >
                                                                                                <Edit className="h-3 w-3 mr-1" />
                                                                                                Đổi lịch
                                                                                            </Button>
                                                                                        </Tooltip.Trigger>
                                                                                        <Tooltip.Portal>
                                                                                            <Tooltip.Content
                                                                                                className="rounded bg-gray-800 px-2 py-1 text-xs text-white shadow-lg"
                                                                                                sideOffset={5}
                                                                                            >
                                                                                                {booking.daysUntilService <= 3 ? 'Khả dụng trước ngày sử dụng 3 ngày' : 'Đơn hàng đã đổi lịch'}
                                                                                            </Tooltip.Content>
                                                                                        </Tooltip.Portal>
                                                                                    </Tooltip.Root>
                                                                                </Tooltip.Provider>
                                                                            )
                                                                        )}

                                                                        {booking.status === 'completed' && (
                                                                            <Button size="sm" variant="outline" onClick={() => {
                                                                                setReviewBooking(booking);
                                                                                setReviewOpen(true);
                                                                            }}>
                                                                                <Star className="h-3 w-3 mr-1" />
                                                                                Đánh giá
                                                                            </Button>
                                                                        )}
                                                                        {booking.status === 'confirmed' && (
                                                                            <Button
                                                                                size="sm"
                                                                                onClick={() => {
                                                                                    const extraData = JSON.stringify({ download: true });
                                                                                    window.open(`/thanh-toan-thanh-cong?orderId=${booking.id}&extraData=${encodeURIComponent(extraData)}`, '_blank');
                                                                                }}
                                                                            >
                                                                                <Download className="h-3 w-3 mr-1" />
                                                                                Tải vé
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))


                                            })()}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Requests Tab */}
                            {activeTab === 'requests' && (
                                <RequestsTab formatPrice={formatPrice} customerId={customerId || FAKE_CUSTOMER_ID} />
                            )}

                            {/* Travelers Tab */}
                            {activeTab === 'travelers' && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h1 className="text-2xl font-bold">Hành khách thường đi</h1>
                                        <Button>
                                            <Users className="h-4 w-4 mr-2" />
                                            Thêm hành khách
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {userData.savedTravelers.map((traveler) => (
                                            <Card key={traveler.id}>
                                                <CardContent className="p-4">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h3 className="font-semibold">{traveler.name}</h3>
                                                        <Button size="sm" variant="ghost">
                                                            <Edit className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                    <div className="space-y-2 text-sm text-muted-foreground">
                                                        <div>Giấy tờ: {traveler.idType.toUpperCase()} - {traveler.idNumber}</div>
                                                        <div>Ngày sinh: {traveler.dateOfBirth}</div>
                                                        <div>Mối quan hệ: {traveler.relationship}</div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Notifications Tab */}
                            {activeTab === 'notifications' && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h1 className="text-2xl font-bold">Thông báo</h1>
                                        <Button variant="outline" size="sm">
                                            Đánh dấu đã đọc tất cả
                                        </Button>
                                    </div>

                                    <div className="space-y-3">
                                        {userData.notifications.map((notification) => (
                                            <Card key={notification.id} className={!notification.read ? 'border-primary/50' : ''}>
                                                <CardContent className="p-4">
                                                    <div className="flex items-start gap-3">
                                                        <div className={`p-2 rounded-full ${!notification.read ? 'bg-primary/10' : 'bg-gray-100'}`}>
                                                            <Bell className="h-4 w-4" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <h4 className="font-medium">{notification.title}</h4>
                                                                <span className="text-xs text-muted-foreground">{notification.date}</span>
                                                            </div>
                                                            <p className="text-sm text-muted-foreground">{notification.message}</p>
                                                            {!notification.read && (
                                                                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Settings Tab */}
                            {activeTab === 'settings' && (
                                <div className="space-y-6">
                                    <h1 className="text-2xl font-bold">Cài đặt</h1>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Bảo mật tài khoản</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="font-medium">Đổi mật khẩu</div>
                                                    <div className="text-sm text-muted-foreground">Cập nhật mật khẩu để bảo mật tài khoản</div>
                                                </div>
                                                <Button onClick={() => setShowChangePassword(true)}>Đổi mật khẩu</Button>
                                            </div>
                                            <Separator />
                                            {/* <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="font-medium">Xác thực 2 bước</div>
                                                    <div className="text-sm text-muted-foreground">Tăng cường bảo mật với OTP</div>
                                                </div>
                                                <Button variant="outline">Thiết lập</Button>
                                            </div> */}
                                        </CardContent>
                                    </Card>

                                    {/* <Card>
                                        <CardHeader>
                                            <CardTitle>Thông báo</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="font-medium">Email thông báo</div>
                                                    <div className="text-sm text-muted-foreground">Nhận thông báo qua email</div>
                                                </div>
                                                <input type="checkbox" defaultChecked className="toggle" />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="font-medium">SMS thông báo</div>
                                                    <div className="text-sm text-muted-foreground">Nhận thông báo qua SMS</div>
                                                </div>
                                                <input type="checkbox" defaultChecked className="toggle" />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="font-medium">Cảnh báo giá vé</div>
                                                    <div className="text-sm text-muted-foreground">Thông báo khi giá vé thay đổi</div>
                                                </div>
                                                <input type="checkbox" className="toggle" />
                                            </div>
                                        </CardContent>
                                    </Card> */}

                                    {/* <Card>
                                        <CardHeader>
                                            <CardTitle>Khác</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <Button variant="outline" className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50">
                                                Xóa tài khoản
                                            </Button>
                                        </CardContent>
                                    </Card> */}
                                </div>
                            )}
                        </div>
                    </div>
                </div >




                <Modal open={detailModalOpen} onOpenChange={setDetailModalOpen} size="lg">
                    <ModalContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <ModalHeader>
                            <ModalTitle>Chi tiết đơn hàng {(selectedOrder as any)?.id}</ModalTitle>
                            <ModalDescription>
                                {(orderDetails as any)?.order && (
                                    <div className="space-y-2">
                                        {/* Tags */}
                                        <div className="flex gap-2">
                                            {(orderDetails as any).order.paymentStatus === 'paid' && <Badge className="bg-green-100 text-green-700">Đã thanh toán</Badge>}
                                            {(orderDetails as any).order.orderStatus === 'cancelled' && <Badge className="bg-red-100 text-red-700">Đã hủy</Badge>}
                                            {(orderDetails as any).order.changeCalendar && <Badge className="bg-blue-100 text-blue-700">Đã đổi lịch</Badge>}
                                        </div>
                                        {/* Note đổi lịch */}
                                        {/* Note đổi lịch */}
                                        {(orderDetails as any).order.changeCalendar && (
                                            <div className="text-sm text-muted-foreground italic">
                                                Bạn đã đổi lịch từ ngày {
                                                    (orderDetails as any).order.items?.[0]?.type === 'flight'
                                                        ? (orderDetails as any).order.metadata?.bookingDataSnapshot?.flights?.outbound?.date
                                                        : (orderDetails as any).order.metadata?.bookingDataSnapshot?.details?.date
                                                } sang ngày {(orderDetails as any).order.dateChangeCalendar}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </ModalDescription>
                        </ModalHeader>
                        <div className="p-4 space-y-4">
                            {loadingDetails ? (
                                <div className="text-center">Đang tải...</div>
                            ) : orderDetails ? (
                                <>

                                    {/* Thông tin cơ bản */}
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div><strong>Mã đơn:</strong> {(orderDetails as any)?.order.orderNumber}</div>
                                        <div><strong>Tổng tiền:</strong> {formatPrice((orderDetails as any).order.total)}</div>
                                        <div><strong>Ngày đặt:</strong> {new Date((orderDetails as any).order.createdAt).toLocaleDateString('vi-VN')}</div>
                                        {/* <div><strong>Ngày sử dụng12:</strong> {(() => {
                                            const snap = orderDetails.order.metadata?.bookingDataSnapshot;
                                            const originalServiceDateRaw = snap?.details?.startDateTime ?? snap?.details?.date;
                                            const serviceDateRaw = orderDetails.order.changeCalendar && orderDetails.order.dateChangeCalendar ? orderDetails.order.dateChangeCalendar : originalServiceDateRaw;
                                            const serviceDateObj = serviceDateRaw ? new Date(serviceDateRaw) : null;
                                            return serviceDateObj ? serviceDateObj.toISOString().slice(0, 10) : '--';
                                        })()}</div> */}
                                        <div><strong>Ngày sử dụng:</strong> {(() => {
                                            const snap = (orderDetails as any).order.metadata?.bookingDataSnapshot;
                                            const item = (orderDetails as any).order.items?.[0];
                                            let serviceDate = '';
                                            if (item?.type === 'flight' && !(orderDetails as any).order.changeCalendar) {
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
                                                serviceDate = (orderDetails as any).order.changeCalendar && (orderDetails as any).order.dateChangeCalendar ? (orderDetails as any).order.dateChangeCalendar : originalServiceDateRaw;
                                                if (serviceDate) {
                                                    const serviceDateObj = new Date(serviceDate);
                                                    serviceDate = serviceDateObj.toISOString().slice(0, 10);
                                                }
                                            }
                                            return serviceDate || '--';
                                        })()}</div>
                                        <div><strong>Trạng thái:</strong> {getStatusText((orderDetails as any).order.orderStatus)}</div>
                                        {/* Pickup / Dropoff details (tour or bus) */}
                                        {(() => {
                                            const snap = (orderDetails as any).order.metadata?.bookingDataSnapshot;
                                            const d = snap?.details || snap?.meta || {};
                                            if (!d) return null;
                                            return (
                                                <div className=" grid grid-cols-1 gap-2 text-sm">
                                                    {d.pickupDropoff && (
                                                        <div><strong>Pickup/Dropoff:</strong> {d.pickupDropoff}</div>
                                                    )}
                                                    {d.selectedPickup && (
                                                        <div><strong>Điểm đón:</strong> {d.selectedPickup}</div>
                                                    )}
                                                    {d.selectedDropoff && (
                                                        <div><strong>Điểm trả:</strong> {d.selectedDropoff}</div>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    {/* Thông tin hành khách */}
                                    {(orderDetails as any).order.metadata?.bookingDataSnapshot?.details?.passengers && (
                                        <div>
                                            <h4 className="font-semibold mb-2">Thông tin hành khách</h4>
                                            <div className="space-y-2">
                                                {(orderDetails as any).order.metadata.bookingDataSnapshot.details.passengers.map((passenger: any, index: number) => (
                                                    <div key={index} className="border p-3 rounded">
                                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                                            <div><strong>Họ tên:</strong> {passenger.title ? `${passenger.title} ` : ''}{passenger.firstName} {passenger.lastName}</div>
                                                            <div><strong>Loại:</strong> {getPassengerTypeLabel(passenger.type)}</div>
                                                            <div><strong>Ngày sinh:</strong> {passenger.dateOfBirth}</div>
                                                            <div><strong>CMND/CCCD:</strong> {passenger.idNumber}</div>
                                                            <div><strong>Quốc tịch:</strong> {passenger.nationality}</div>
                                                            <div><strong>Loại giấy tờ:</strong> {passenger.idType}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Breakdown vé */}
                                    <div className="space-y-4">
                                        {(orderDetails as any).oldTickets && (orderDetails as any).oldTickets.length > 0 && (
                                            <div>
                                                <h4 className="font-semibold">Vé cũ</h4>
                                                <div className="space-y-2">
                                                    {(orderDetails as any).oldTickets.map((ticket: any) => (
                                                        <div key={ticket._id} className="border p-2 rounded flex justify-between items-center">
                                                            <div>
                                                                <div className="font-medium">{ticket.productId}</div>
                                                                <div className="font-medium">{ticket.ticketNumber}</div>

                                                                <div className="text-sm text-muted-foreground">
                                                                    <span className='text-sm font-bold'>Họ và tên hành khách : </span>
                                                                    {ticket.passenger ? (() => { try { return JSON.parse(ticket.passenger).name } catch { return ticket.passenger } })() : ''}
                                                                </div>
                                                                <div className="text-xs text-muted-foreground mt-1">Ngày sử dụng: {getTravelDateForFlight(ticket)}</div>
                                                                <div className="text-xs text-muted-foreground mt-1">Giờ xuất phát : <span>{getDepartureTimeForChangedFlight(ticket, orderDetails)}</span></div>
                                                                {/* Thêm chuyến và ghế nếu là flight */}
                                                                {ticket.type === 'flight' && (
                                                                    <>
                                                                        <div className="text-xs text-muted-foreground">Chuyến: {getLegFromUniq(ticket.uniq)}</div>
                                                                    </>
                                                                )}
                                                                <div className="text-xs text-muted-foreground">Ghế: {ticket.seats && ticket.seats.length > 0 ? ticket.seats.join(', ') : 'Tùy chọn'}</div>
                                                            </div>
                                                            <div className="text-sm">
                                                                <Badge variant="secondary">{getPassengerTypeLabel(ticket.ticketType)}</Badge>
                                                                <Badge className="ml-2 bg-green-100 text-green-700">{getTicketStatusLabel(ticket.status)}</Badge>
                                                                <div className="text-xs mt-1">{formatPrice(Number(ticket.price || 0))}</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {(orderDetails as any).tickets && (orderDetails as any).tickets.length > 0 && (
                                            <div>
                                                <h4 className="font-semibold">{(orderDetails as any).oldTickets?.length > 0 ? 'Vé đã đổi' : 'Vé'}</h4>
                                                <div className="space-y-2">
                                                    {(
                                                        // Chỉ show vé mới (không phải vé cũ)
                                                        (orderDetails as any).tickets.filter((t: any) => !(orderDetails as any).oldTickets?.some((o: any) => o._id === t._id))
                                                    ).map((ticket: any) => (
                                                        <div key={ticket._id} className="border p-2 rounded flex justify-between items-center">
                                                            <div>
                                                                <div className="font-medium">{ticket.productId}</div>
                                                                <div className="font-medium">{ticket.ticketNumber}</div>

                                                                <div className="text-sm text-muted-foreground">
                                                                    <span className='text-sm font-bold'>Họ và tên hành khách : </span>
                                                                    {ticket.passenger ? (() => { try { return JSON.parse(ticket.passenger).name } catch { return ticket.passenger } })() : ''}
                                                                </div>
                                                                {/* <div className="text-xs text-muted-foreground mt-1">Ngày sử dụng: {ticket.travelDate}</div> */}
                                                                <div className="text-xs text-muted-foreground mt-1">Ngày sử dụng: {getTravelDateForFlight(ticket)}</div>
                                                                {/* <div className="text-xs text-muted-foreground mt-1">Giờ xuất phát : <span>{ticket.travelStart ? new Date(ticket.travelStart).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ""}</span></div> */}
                                                                <div className="text-xs text-muted-foreground mt-1">Giờ xuất phát : <span>{getDepartureTimeForChangedFlight(ticket, orderDetails)}</span></div>

                                                                {/* Thêm chuyến và ghế nếu là flight */}
                                                                {ticket.type === 'flight' && (
                                                                    <>
                                                                        <div className="text-xs text-muted-foreground">Chuyến: {getLegFromUniq(ticket.uniq)}</div>
                                                                    </>
                                                                )}
                                                                <div className="text-xs text-muted-foreground">Ghế: {ticket.seats && ticket.seats.length > 0 ? ticket.seats.join(', ') : 'Tùy chọn'}</div>
                                                            </div>
                                                            <div className="text-sm">
                                                                <Badge variant="secondary">{getPassengerTypeLabel(ticket.ticketType)}</Badge>
                                                                <Badge className="ml-2 bg-green-100 text-green-700">{getTicketStatusLabel(ticket.status)}</Badge>
                                                                <div className="text-xs mt-1">{formatPrice(Number(ticket.price || 0))}</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="text-center text-red-500">Không thể tải chi tiết đơn hàng</div>
                            )}
                        </div>
                        <ModalFooter>
                            <Button variant="outline" onClick={() => setDetailModalOpen(false)}>Đóng</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>

                <OrderReviewDialog
                    open={reviewOpen}
                    onOpenChange={(o) => { setReviewOpen(o); if (!o) setReviewBooking(null); }}
                    booking={reviewBooking}
                    customerId={customerId}
                    onSubmit={({ rating, comment }) => {
                        if (!reviewBooking) return;
                        setBookings((prev: any[]) => prev.map(b => (b as any).id === (reviewBooking as any).id ? { ...(b as any), canReview: false, rating, review: comment } : b));
                        setReviewOpen(false);
                        setReviewBooking(null);
                        toast('Cảm ơn bạn đã chia sẻ trải nghiệm.');
                    }}
                />

                <Modal open={showChangePassword} onOpenChange={setShowChangePassword}>
                    <ModalContent>
                        <ModalHeader>
                            <ModalTitle>Đổi mật khẩu</ModalTitle>
                            <ModalDescription>
                                Nhập mật khẩu hiện tại và mật khẩu mới để cập nhật.
                            </ModalDescription>
                        </ModalHeader>
                        <div className="p-4 space-y-4">
                            <div>
                                <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
                                <Input
                                    id="currentPassword"
                                    type="password"
                                    value={changePasswordData.currentPassword}
                                    onChange={(e) => setChangePasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                                    placeholder="Nhập mật khẩu hiện tại"
                                />
                            </div>
                            <div>
                                <Label htmlFor="newPassword">Mật khẩu mới</Label>
                                <Input
                                    id="newPassword"
                                    type="password"
                                    value={changePasswordData.newPassword}
                                    onChange={(e) => setChangePasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                                    placeholder="Nhập mật khẩu mới (ít nhất 8 ký tự)"
                                />
                            </div>
                        </div>
                        <ModalFooter>
                            <Button variant="outline" onClick={() => setShowChangePassword(false)}>Hủy</Button>
                            <Button onClick={handleChangePassword} disabled={changingPassword}>
                                {changingPassword ? 'Đang đổi...' : 'Đổi mật khẩu'}
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            </>
        </Protected>
    );
}

export default withSuspense(TaiKhoan);