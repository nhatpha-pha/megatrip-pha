"use client"
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Layout from '../../../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Textarea } from '../../../components/ui/textarea';
import { Separator } from '../../../components/ui/separator';
import { Input } from '../../../components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '../../../components/ui/dialog';
import { AlertTriangle, ArrowLeft, CreditCard, DollarSign, FileText, Info, Plane, ChevronRight, Bus, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { me } from '@/apis/auth';

interface Booking {
    id: string;
    type: 'flight' | 'bus' | 'tour';
    status: 'confirmed' | 'completed' | 'cancelled' | 'pending';
    bookingDate: string; // YYYY-MM-DD
    serviceDate: string; // YYYY-MM-DD
    title: string;
    details: string;
    passengers: number;
    total: number;
}

const SAMPLE_BOOKINGS: Booking[] = [
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
    },
    { id: 'TRV123456790', type: 'flight', status: 'confirmed', bookingDate: '2025-01-10', serviceDate: '2025-06-10', title: 'TP.HCM - Nha Trang', details: 'VJ221 • 08:00 - 09:10', passengers: 1, total: 900000 },
    { id: 'TRV123456791', type: 'flight', status: 'pending', bookingDate: '2025-02-01', serviceDate: '2025-07-01', title: 'HN - Đà Lạt', details: 'VN330 • 12:00 - 13:30', passengers: 2, total: 1800000 },
    { id: 'TRV123456792', type: 'bus', status: 'confirmed', bookingDate: '2025-03-05', serviceDate: '2025-08-15', title: 'Xe Sài Gòn - Vũng Tàu', details: 'Ghế ngồi thường • 07:00', passengers: 3, total: 450000 },
    { id: 'TRV123456793', type: 'tour', status: 'cancelled', bookingDate: '2024-09-12', serviceDate: '2024-10-01', title: 'Tour Sapa 2N1Đ', details: 'Khách sạn 3* • 2 khách', passengers: 2, total: 3200000 },
    { id: 'TRV123456794', type: 'bus', status: 'completed', bookingDate: '2024-08-01', serviceDate: '2024-09-01', title: 'Xe Đà Nẵng - Hội An', details: 'Ghế ngồi • 10:00', passengers: 2, total: 200000 },
    { id: 'TRV123456795', type: 'flight', status: 'cancelled', bookingDate: '2024-07-15', serviceDate: '2024-08-20', title: 'HN - TP.HCM', details: 'VJ110 • 20:00 - 21:30', passengers: 1, total: 1200000 },
    { id: 'TRV123456796', type: 'tour', status: 'confirmed', bookingDate: '2025-04-01', serviceDate: '2025-09-10', title: 'Tour Miền Tây 3N2Đ', details: 'Khách sạn 3* • 4 khách', passengers: 4, total: 8400000 },
];

function formatPrice(v: number) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);
}

function ServiceIcon({ type }: { type: Booking['type'] }) {
    if (type === 'flight') return <Plane className="h-4 w-4" />;
    if (type === 'bus') return <Bus className="h-4 w-4" />;
    if (type === 'tour') return <MapPin className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
}

const AIRLINE_POLICIES = {
    VN: { name: 'Vietnam Airlines', tiers: [{ minDays: 7, feeRate: 0.05 }, { minDays: 3, feeRate: 0.2 }, { minDays: 0, feeRate: 0.5 }], nonRefundableTaxPerPax: 50000, platformFee: 15000 },
    VJ: { name: 'VietJet Air', tiers: [{ minDays: 7, feeRate: 0.1 }, { minDays: 3, feeRate: 0.3 }, { minDays: 0, feeRate: 0.6 }], nonRefundableTaxPerPax: 60000, platformFee: 20000 },
    QH: { name: 'Bamboo Airways', tiers: [{ minDays: 7, feeRate: 0.08 }, { minDays: 3, feeRate: 0.25 }, { minDays: 0, feeRate: 0.55 }], nonRefundableTaxPerPax: 50000, platformFee: 15000 },
};

function useBookingFromRoute(): Booking | null {
    const params = useParams() as any;
    const id = params?.id as string | undefined;
    return SAMPLE_BOOKINGS.find((b) => b.id === id) ?? null;
}

function useRouteId() {
    const params = useParams() as any;
    return params?.id as string | undefined;
}

export default function HuyDonPage() {

    const router = useRouter();

    const [reason, setReason] = useState('');
    const [note, setNote] = useState('');
    const [refundMethod, setRefundMethod] = useState('');
    const [agreePolicy, setAgreePolicy] = useState(false);
    const [bankName, setBankName] = useState('');
    const [bankAccountName, setBankAccountName] = useState('');
    const [bankAccountNumber, setBankAccountNumber] = useState('');
    const [cardLast4, setCardLast4] = useState('');
    const [walletId, setWalletId] = useState('');
    const [otpOpen, setOtpOpen] = useState(false);
    const [otp, setOtp] = useState('');
    const id = useRouteId();
    const [order, setOrder] = useState<any | null>(null);
    const [loadingOrder, setLoadingOrder] = useState(false);
    const [customerId, setCustomerId] = useState<string | null>(null);
    // derive booking view-model from fetched order (fallback to sample if not found)
    // derive booking view-model from fetched order (fallback to sample if not found)
    const booking = useMemo<Booking | null>(() => {
        if (!order) {
            // fallback: try sample by id
            const s = SAMPLE_BOOKINGS.find(b => b.id === id) ?? null;
            return s;
        }
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
        // Nếu đã đổi lịch, dùng dateChangeCalendar thay vì date gốc
        const serviceDateRaw = order.changeCalendar && order.dateChangeCalendar
            ? order.dateChangeCalendar
            : (snap?.details?.startDateTime ?? snap?.details?.date ?? order.createdAt);
        let serviceDate = serviceDateRaw ? new Date(serviceDateRaw).toISOString().slice(0, 10) : '';

        // Nếu là flight, lấy ngày từ flights (giữ nguyên logic)
        if (item?.type === 'flight') {
            const flights = snap?.flights;
            if (flights?.outbound && flights?.inbound) {
                serviceDate = `${flights.outbound.date} - ${flights.inbound.date}`;
            } else if (flights?.outbound) {
                serviceDate = flights.outbound.date;
            } else if (flights?.inbound) {
                serviceDate = flights.inbound.date;
            }
        }

        return {
            id: order.orderNumber || order._id,
            type: item?.type || 'tour',
            status: order.orderStatus || order.status || 'pending',
            bookingDate: order.createdAt ? new Date(order.createdAt).toISOString().slice(0, 10) : '',
            serviceDate,
            title: item?.name || snap?.details?.route || 'Đặt dịch vụ',
            details: item ? `${item.name} • x${item.quantity}` : (snap?.details?.route || ''),
            passengers: pax,
            total: Number(order.total || 0),
        } as Booking;
    }, [order, id]);

    // Thêm useEffect để load customerId từ API me()
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const payload: any = await me();
                const resolvedUserId = payload?._id ?? payload?.id ?? payload?.userId ?? payload?._id?.$oid ?? null;
                setCustomerId(resolvedUserId);
            } catch (err) {
                console.error('Failed to load profile (me):', err);
            }
        };
        fetchProfile();
    }, []);
    // fetch order details by id (supports orderNumber lookup at backend)
    useEffect(() => {
        let mounted = true;
        if (!id) return;
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
        (async () => {
            setLoadingOrder(true);
            try {
                const res = await fetch(`${API_BASE}/api/orders/${encodeURIComponent(id)}`);
                if (!res.ok) {
                    // try search by orderNumber endpoint if your backend uses different route
                    setOrder(null);
                    return;
                }
                const json = await res.json();
                // backend may return { data: order } or order directly
                const o = json.data ?? json;
                if (mounted) setOrder(o);
            } catch (e) {
                console.warn('fetch order failed', e);
                if (mounted) setOrder(null);
            } finally {
                if (mounted) setLoadingOrder(false);
            }
        })();
        return () => { mounted = false; };
    }, [id]);
    const airlineCode = useMemo(() => {
        if (!booking || booking.type !== 'flight') return 'GEN';
        const m = booking.details.match(/^([A-Z]{2})\d+/);
        return m?.[1] ?? 'GEN';
    }, [booking]);

    const policy = useMemo(() => {
        if (!booking) return { canCancel: false, message: 'Không tìm thấy đơn hàng.' } as const;
        if (booking.status !== 'confirmed') return { canCancel: false, message: 'Chỉ hủy được đơn đã xác nhận.' } as const;
        const today = new Date();
        const serviceDateObj = new Date(booking.serviceDate + 'T00:00:00');
        const isPast = serviceDateObj.getFullYear() < today.getFullYear() ||
            (serviceDateObj.getFullYear() === today.getFullYear() && serviceDateObj.getMonth() < today.getMonth()) ||
            (serviceDateObj.getFullYear() === today.getFullYear() && serviceDateObj.getMonth() === today.getMonth() && serviceDateObj.getDate() < today.getDate());
        if (isPast) return { canCancel: false, message: 'Đơn đã qua ngày sử dụng.' } as const;
        const diffDays = Math.ceil((serviceDateObj.getTime() - today.getTime()) / (24 * 3600 * 1000));
        const diffHours = Math.ceil((serviceDateObj.getTime() - today.getTime()) / (3600 * 1000));

        // Bus cancellation policy
        if (booking.type === 'bus') {
            let feeRate = 1.0;
            if (diffHours >= 72) feeRate = 0.1;
            else if (diffHours >= 24) feeRate = 0.25;
            else if (diffHours >= 12) feeRate = 0.5;
            const tiers = [
                { minHours: 72, feeRate: 0.1 },
                { minHours: 24, feeRate: 0.25 },
                { minHours: 12, feeRate: 0.5 },
                { minHours: 0, feeRate: 1.0 }
            ];
            const tier = tiers.find(t => diffHours >= t.minHours) ?? tiers[tiers.length - 1];
            const busPolicy = { name: 'Chính sách hủy xe', tiers, nonRefundableTaxPerPax: 0, platformFee: 0 };
            return { canCancel: true, diffHours, busPolicy, tier } as const;
        }

        // Tour cancellation policy
        if (booking.type === 'tour') {
            const tiers = [
                { minDays: 15, feeRate: 0.20 },
                { minDays: 7, feeRate: 0.50 },
                { minDays: 3, feeRate: 0.75 },
                { minDays: 0, feeRate: 1.00 }
            ];
            const tier = tiers.find(t => diffDays >= t.minDays) ?? tiers[tiers.length - 1];
            const tourPolicy = { name: 'Chính sách hủy tour', tiers, nonRefundableTaxPerPax: 0, platformFee: 0 };
            return { canCancel: true, diffDays, tourPolicy, tier } as const;
        }

        // Fallback: existing airline/flight policy
        const airlinePolicy = (AIRLINE_POLICIES as any)[airlineCode] ?? { name: 'Nhà vận chuyển', tiers: [{ minDays: 7, feeRate: 0.08 }, { minDays: 3, feeRate: 0.25 }, { minDays: 0, feeRate: 0.55 }], nonRefundableTaxPerPax: 50000, platformFee: 15000 };
        const tier = airlinePolicy.tiers.find((t: any) => diffDays >= t.minDays) ?? airlinePolicy.tiers[airlinePolicy.tiers.length - 1];
        return { canCancel: true, diffDays, airlinePolicy, tier } as const;
    }, [booking, airlineCode]);

    const breakdown = useMemo(() => {
        if (!booking || !(policy as any).canCancel) return null;
        const paxCount = booking.passengers;
        const baseAmount = booking.total;
        const tierRate = (policy as any).tier.feeRate as number;
        const penalty = Math.round(baseAmount * tierRate);
        const taxes = ((policy as any).airlinePolicy?.nonRefundableTaxPerPax || (policy as any).busPolicy?.nonRefundableTaxPerPax || (policy as any).tourPolicy?.nonRefundableTaxPerPax || 0) * paxCount;
        const platformFee = (policy as any).airlinePolicy?.platformFee || (policy as any).busPolicy?.platformFee || (policy as any).tourPolicy?.platformFee || 0;
        const totalFees = penalty + taxes + platformFee;
        const refund = Math.max(0, baseAmount - totalFees);
        return { paxCount, baseAmount, penalty, taxes, platformFee, refund, tierRate };
    }, [booking, policy]);
    // validate refund method - MUST be declared unconditionally (before any early return)
    const validMethod = useMemo(() => {
        if (!refundMethod) return false;
        if (refundMethod === 'bank') return !!(bankName && bankAccountName && bankAccountNumber);
        if (refundMethod === 'card') return !!(cardLast4.length === 4);
        if (refundMethod === 'wallet') return !!walletId;
        return false;
    }, [refundMethod, bankName, bankAccountName, bankAccountNumber, cardLast4, walletId]);

    if (!booking) {
        return (
            <>
                <div className="container py-6">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2 text-red-600">
                                <AlertTriangle className="h-4 w-4" />
                                <span>Không tìm thấy đơn hàng.</span>
                            </div>
                            <Button className="mt-4" asChild>
                                <Link href="/tai-khoan">Quay lại tài khoản</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </>
        );
    }

    // const validMethod = useMemo(() => {
    //     if (!refundMethod) return false;
    //     if (refundMethod === 'bank') return !!(bankName && bankAccountName && bankAccountNumber);
    //     if (refundMethod === 'card') return !!(cardLast4.length === 4);
    //     if (refundMethod === 'wallet') return !!walletId;
    //     return false;
    // }, [refundMethod, bankName, bankAccountName, bankAccountNumber, cardLast4, walletId]);

    function saveRequest() {
        const id = 'RQ-' + Date.now();
        const req = {
            id,
            type: 'refund',
            bookingId: booking!.id,
            title: booking!.title,
            status: 'submitted',
            createdAt: new Date().toISOString(),
            amountRefund: breakdown?.refund || 0,
            method: refundMethod === 'wallet' ? `Ví (${walletId})` : refundMethod === 'card' ? `Thẻ **** ${cardLast4}` : refundMethod === 'bank' ? `Ngân hàng ${bankName}` : undefined,
            details: {
                airline: (policy as any).airlinePolicy?.name,
                tierRate: breakdown?.tierRate,
                airlinePenalty: (breakdown as any)?.airlinePenalty,
                taxes: breakdown?.taxes,
                platformFee: breakdown?.platformFee,
                note,
                reason,
            },
        } as any;
        try {
            const arr = JSON.parse(localStorage.getItem('userRequests') || '[]');
            arr.push(req);
            localStorage.setItem('userRequests', JSON.stringify(arr));
        } catch {
            localStorage.setItem('userRequests', JSON.stringify([req]));
        }
        return id;
    }

    const submitCancelRequest = async () => {
        if (!reason) {
            toast.error('Vui lòng chọn lý do.');
            return;
        }

        const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
        const payload = {
            customerId: customerId || order?.customerId || '64e65e8d3d5e2b0c8a3e9f12', // Ưu tiên customerId từ me()
            customerName: order?.customerName || order?.customerName || order?.customer?.name || '',
            customerEmail: order?.customerEmail || order?.customerEmail || order?.customer?.email || '',
            customerPhone: order?.customerPhone || order?.customerPhone || order?.customer?.phone || '',
            serviceType: booking.type,
            type: 'cancel', // support category for cancellation/refund
            title: `Yêu cầu hủy - ${booking.title} (${booking.id})`,
            description: `${reason}${note ? '\n\nGhi chú: ' + note : ''}`,
            orderRef: order ? (order.orderNumber || order._id) : booking.id,
            transId: order?.transId || null,
            zp_trans_id: order?.zp_trans_id || null,
            paymentReference: order?.paymentReference || null,
            // pass fee breakdown so support/backend knows amounts to refund
            airlinePenalty: (breakdown as any)?.airlinePenalty || 0,
            taxes: (breakdown as any)?.taxes || 0,
            platformFee: (breakdown as any)?.platformFee || 0,
            refundAmount: (breakdown as any)?.refund || 0,
            currency: 'VND',
            message: `${reason}${note ? '\n\n' + note : ''}`
        };

        try {
            const resp = await fetch(`${API_BASE}/api/support`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!resp.ok) {
                const txt = await resp.text().catch(() => '');
                toast.error(`Gửi yêu cầu thất bại: Lỗi server: ${resp.status} ${txt}`);
                return;
            }
            const json = await resp.json();
            const ticket = json.ticket || json.data || json;
            toast.success(`Yêu cầu đã gửi: Mã yêu cầu: ${ticket?.ticketNumber || ticket?.id || '–'}`);
            if (typeof window !== 'undefined') window.history.replaceState({ activeTab: 'requests' }, '');
            router.push('/tai-khoan');
        } catch (err) {
            console.error('submitCancelRequest error', err);
            toast.error('Lỗi mạng: Không thể kết nối tới server. Vui lòng thử lại.');
        }
    };

    return (
        <>
            <div className="container py-6">
                <div className="mb-4">
                    <Button variant="ghost" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Quay lại
                    </Button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Hủy đơn & Hoàn tiền</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 rounded bg-primary/10">
                                        <ServiceIcon type={booking.type} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold">{booking.title}</h3>
                                            <Badge variant="secondary">{booking.id}</Badge>
                                            <span className="ml-2 text-xs text-muted-foreground rounded px-2 py-0.5 border">{booking.type === 'flight' ? 'Máy bay' : booking.type === 'bus' ? 'Xe' : 'Tour'}</span>
                                        </div>
                                        <div className="text-sm text-muted-foreground">{booking.details}</div>
                                        <div className="text-sm text-muted-foreground">Ngày sử dụng: {booking.serviceDate}</div>
                                        <div className="text-sm text-muted-foreground">Số khách: {booking.passengers}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-muted-foreground">Tổng tiền</div>
                                        <div className="text-xl font-bold text-primary">{formatPrice(booking.total)}</div>
                                    </div>
                                </div>
                                <Separator />

                                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                                    <div>
                                        <Label>Lý do hủy</Label>
                                        <Select value={reason} onValueChange={setReason}>
                                            <SelectTrigger className="mt-1">
                                                <SelectValue placeholder="Chọn lý do" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="change-plan">Thay đổi kế hoạch</SelectItem>
                                                <SelectItem value="illness">Sức khỏe không đảm bảo</SelectItem>
                                                <SelectItem value="schedule">Không phù hợp thời gian</SelectItem>
                                                <SelectItem value="document">Thiếu giấy tờ</SelectItem>
                                                <SelectItem value="other">Lý do khác</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                </div>

                                {refundMethod === 'bank' && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div>
                                            <Label>Ngân hàng</Label>
                                            <Input className="mt-1" value={bankName} onChange={(e) => setBankName(e.target.value)} />
                                        </div>
                                        <div>
                                            <Label>Chủ tài khoản</Label>
                                            <Input className="mt-1" value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value)} />
                                        </div>
                                        <div>
                                            <Label>Số tài khoản</Label>
                                            <Input className="mt-1" value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} />
                                        </div>
                                    </div>
                                )}
                                {refundMethod === 'card' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <Label>4 số cuối thẻ đã thanh toán</Label>
                                            <Input className="mt-1" value={cardLast4} onChange={(e) => setCardLast4(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))} placeholder="1234" />
                                        </div>
                                    </div>
                                )}
                                {refundMethod === 'wallet' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <Label>ID ví/Email/SĐT ví</Label>
                                            <Input className="mt-1" value={walletId} onChange={(e) => setWalletId(e.target.value)} />
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <Label>Ghi chú</Label>
                                    <Textarea className="mt-1" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ghi rõ thông tin nếu cần bổ sung" />
                                </div>

                                <div className="p-3 rounded border bg-amber-50 text-amber-900 flex items-start gap-2">
                                    <Info className="h-4 w-4 mt-0.5" />
                                    <div className="text-sm">
                                        {booking.type === 'bus' ? (
                                            <>
                                                <div className="font-medium">Chính sách hủy xe</div>
                                                {(policy as any).canCancel ? (
                                                    <>
                                                        <div className="mt-1">Còn {(policy as any).diffHours} giờ đến giờ khởi hành</div>
                                                        <div className="mt-2">
                                                            <div className="text-xs font-medium">Bảng phí hủy (tính theo % tổng tiền)</div>
                                                            <ul className="list-disc ml-4 mt-1 space-y-1">
                                                                <li>≥ 72 giờ trước: Phí 10% {((policy as any).tier?.minHours === 72) && <span className="ml-1 text-[11px] px-1 py-0.5 rounded bg-amber-200 text-amber-900">Áp dụng</span>}</li>
                                                                <li>24-72 giờ trước: Phí 25% {((policy as any).tier?.minHours === 24) && <span className="ml-1 text-[11px] px-1 py-0.5 rounded bg-amber-200 text-amber-900">Áp dụng</span>}</li>
                                                                <li>12- &lt; 24 giờ trước: Phí 50% {((policy as any).tier?.minHours === 12) && <span className="ml-1 text-[11px] px-1 py-0.5 rounded bg-amber-200 text-amber-900">Áp dụng</span>}</li>
                                                                <li>&lt; 12 giờ hoặc sau khi xe chạy: Không hoàn {((policy as any).tier?.minHours === 0) && <span className="ml-1 text-[11px] px-1 py-0.5 rounded bg-amber-200 text-amber-900">Áp dụng</span>}</li>
                                                            </ul>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="mt-1">{(policy as any).message}</div>
                                                )}
                                            </>
                                        ) : booking.type === 'tour' ? (
                                            <>
                                                <div className="font-medium">Chính sách hủy tour</div>
                                                {(policy as any).canCancel ? (
                                                    <>
                                                        <div className="mt-1">Còn {(policy as any).diffDays} ngày đến ngày khởi hành</div>
                                                        <div className="mt-2">
                                                            <div className="text-xs font-medium">Bảng phí hủy (tính theo % tổng tiền tour)</div>
                                                            <ul className="list-disc ml-4 mt-1 space-y-1">
                                                                <li>Trước 15 ngày: Phí 20% {((policy as any).tier?.minDays === 15) && <span className="ml-1 text-[11px] px-1 py-0.5 rounded bg-amber-200 text-amber-900">Áp dụng</span>}</li>
                                                                <li>7-14 ngày trước: Phí 50% {((policy as any).tier?.minDays === 7) && <span className="ml-1 text-[11px] px-1 py-0.5 rounded bg-amber-200 text-amber-900">Áp dụng</span>}</li>
                                                                <li>3-6 ngày trước: Phí 75% {((policy as any).tier?.minDays === 3) && <span className="ml-1 text-[11px] px-1 py-0.5 rounded bg-amber-200 text-amber-900">Áp dụng</span>}</li>
                                                                <li>Trong 3 ngày trước: Phí 100% {((policy as any).tier?.minDays === 0) && <span className="ml-1 text-[11px] px-1 py-0.5 rounded bg-amber-200 text-amber-900">Áp dụng</span>}</li>
                                                            </ul>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="mt-1">{(policy as any).message}</div>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                <div className="font-medium">Chính sách hoàn tiền theo nhà vận chuyển</div>
                                                {(policy as any).canCancel ? (
                                                    <>
                                                        <div className="mt-1">Nhà vận chuyển: {(policy as any).airlinePolicy.name} • {(policy as any).diffDays === 0 ? 'Hôm nay là ngày sử dụng' : `Còn ${(policy as any).diffDays} ngày đến ngày sử dụng`}</div>
                                                        <div className="mt-2">
                                                            <div className="text-xs font-medium">Bảng phí</div>
                                                            <ul className="list-disc ml-4 mt-1 space-y-1">
                                                                {((policy as any).airlinePolicy.tiers as { minDays: number; feeRate: number }[]).map((t: any, idx: number) => {
                                                                    const nextMinDays = ((policy as any).airlinePolicy.tiers as { minDays: number; feeRate: number }[])[idx + 1]?.minDays;
                                                                    const rangeText = nextMinDays ? `${nextMinDays}-${t.minDays} ngày trước` : `Trong ${t.minDays + 1} ngày trước`;
                                                                    return (
                                                                        <li key={idx}>
                                                                            {rangeText} giờ bay: Phí {Math.round(t.feeRate * 100)}%
                                                                            {t.feeRate === (policy as any).tier.feeRate && <span className="ml-1 text-[11px] px-1 py-0.5 rounded bg-amber-200 text-amber-900">Áp dụng</span>}
                                                                        </li>
                                                                    );
                                                                })}
                                                            </ul>
                                                            <div className="text-xs mt-1">Thuế/Phí không hoàn: {formatPrice((policy as any).airlinePolicy.nonRefundableTaxPerPax)} mỗi hành khách • Phí nền tảng: {formatPrice((policy as any).airlinePolicy.platformFee)}</div>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="mt-1">{(policy as any).message}</div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input id="agree" type="checkbox" className="h-4 w-4" checked={agreePolicy} onChange={(e) => setAgreePolicy(e.target.checked)} />
                                    <Label htmlFor="agree" className="text-sm">Tôi đã đọc và đồng ý với chính sách hủy/hoàn tiền</Label>
                                </div>

                                <div className="flex gap-2">
                                    <Button onClick={() => router.back()} variant="outline">Hủy</Button>
                                    <Button onClick={submitCancelRequest} disabled={!agreePolicy || !reason}>
                                        <DollarSign className="h-4 w-4 mr-1" />
                                        Gửi yêu cầu
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Tóm tắt hoàn tiền</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span>Số hành khách</span>
                                    <span className="font-medium">{booking.passengers}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span>Tổng giá áp dụng</span>
                                    <span className="font-medium">{formatPrice(breakdown?.baseAmount ?? booking.total)}</span>
                                </div>
                                {(policy as any).canCancel && breakdown && (
                                    <>

                                        <div className="flex items-center justify-between text-sm">
                                            <span>Phí phạt ({Math.round(breakdown.tierRate * 100)}%)</span>
                                            <span className="font-medium text-red-600">- {formatPrice(breakdown.penalty)}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span>Thuế/Phí không hoàn</span>
                                            <span className="font-medium text-red-600">- {formatPrice(breakdown.taxes)}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span>Phí nền tảng</span>
                                            <span className="font-medium text-red-600">- {formatPrice(breakdown.platformFee)}</span>
                                        </div>
                                        <Separator />
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium">Hoàn dự kiến</span>
                                            <span className="text-lg font-bold text-green-600">{formatPrice(breakdown.refund)}</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-2">
                                            Tiền sẽ được hoàn lại về tài khoản mà khách hàng đã sử dụng để thanh toán (ví dụ: thẻ/ngân hàng/ ví). Vui lòng đảm bảo thông tin thanh toán đã chính xác tại nơi đặt để nhận hoàn.
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>


        </>
    );
}