"use client"
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { Separator } from '../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
    Percent,
    Filter,
    Calendar,
    Copy,
    Check,
    Clock,
    Plane,
    Bus,
    Map,
    Gift,
    Star,
    Users,
    Tag,
    AlertCircle,
} from 'lucide-react';
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
const promotionCategories = [
    { id: 'all', name: 'Tất cả', count: 24 },
    { id: 'flight', name: 'Vé máy bay', count: 8, icon: Plane },
    { id: 'bus', name: 'Xe du lịch', count: 6, icon: Bus },
    { id: 'tour', name: 'Tour', count: 10, icon: Map },
];

const featuredPromotions = [
    {
        id: 1,
        title: 'MEGA SALE TẾT 2025',
        subtitle: 'Giảm đến 50% cho tất cả dịch vụ',
        description: 'Chương trình khuyến mãi lớn nhất trong năm dành cho kỳ nghỉ Tết ',
        discount: '50%',
        validFrom: '01/01/2025',
        validTo: '15/02/2025',
        image: '/placeholder.svg',
        featured: true,
        category: 'all',
        minOrder: 2000000,
        maxDiscount: 1000000,
    },
    {
        id: 2,
        title: 'BAY TIẾT KIỆM',
        subtitle: 'Vé máy bay chỉ từ 99.000đ',
        description: 'Đặt vé sớm - Tiết kiệm nhiều với hàng ngàn chuyến bay giá rẻ',
        discount: '30%',
        validFrom: '01/01/2025',
        validTo: '31/01/2025',
        image: '/placeholder.svg',
        featured: true,
        category: 'flight',
        minOrder: 1000000,
        maxDiscount: 500000,
    },
    {
        id: 3,
        title: 'DU LỊCH MIỀN BẮC',
        subtitle: 'Tour Sapa - Hạ Long giá shock',
        description: 'Khám phá vẻ đẹp miền Bắc với mức giá ưu đãi đặc biệt chưa từng có',
        discount: '25%',
        validFrom: '05/01/2025',
        validTo: '28/02/2025',
        image: '/placeholder.svg',
        featured: true,
        category: 'tour',
        minOrder: 3000000,
        maxDiscount: 800000,
    },
];

const voucherCodes = [
    {
        id: 1,
        code: 'FLIGHT30',
        title: 'Giảm 300K cho vé bay',
        description: 'Áp dụng cho tất cả chuyến bay nội địa',
        discount: '300.000₫',
        type: 'fixed',
        category: 'flight',
        validTo: '31/01/2025',
        minOrder: 1500000,
        usageLimit: 1000,
        maxDiscount: 300000,
        usageCount: 156,
        terms: 'Áp dụng cho vé máy bay nội địa. Không áp dụng cùng với ưu đãi khác.',
    },
    {
        id: 2,
        code: 'TOUR25',
        title: 'Giảm 25% Tour du lịch',
        description: 'Áp dụng cho tất cả tour trong nước',
        discount: '25%',
        type: 'percent',
        category: 'tour',
        validTo: '15/02/2025',
        minOrder: 2000000,
        maxDiscount: 1000000,
        usageLimit: 500,
        usageCount: 89,
        terms: 'Áp dụng cho tour từ 3 ngày trở lên. Giảm tối đa 1.000.000₫.',
    },
    {
        id: 3,
        code: 'BUS20',
        title: 'Giảm 20% xe du lịch',
        description: 'Áp dụng cho tuyến TP.HCM - Đà Lạt',
        discount: '20%',
        type: 'percent',
        category: 'bus',
        validTo: '28/01/2025',
        minOrder: 500000,
        maxDiscount: 200000,
        usageLimit: 200,
        usageCount: 45,
        terms: 'Chỉ áp dụng cho xe giường nằm và limousine.',
    },
    {
        id: 4,
        code: 'FIRST100',
        title: 'Ưu đãi khách hàng mới',
        description: 'Giảm 100K cho đơn hàng đầu tiên',
        discount: '100.000₫',
        type: 'fixed',
        category: 'all',
        validTo: '31/12/2025',
        minOrder: 800000,
        usageLimit: 10000,
        maxDiscount: 100000,
        usageCount: 2341,
        terms: 'Chỉ áp dụng cho khách hàng lần đầu đặt dịch vụ.',
    },
    {
        id: 5,
        code: 'WEEKEND15',
        title: 'Giảm 15% cuối tuần',
        description: 'Áp dụng cho các chuyến đi cuối tuần',
        discount: '15%',
        type: 'percent',
        category: 'all',
        validTo: '30/06/2025',
        minOrder: 1000000,
        maxDiscount: 300000,
        usageLimit: 1500,
        usageCount: 678,
        terms: 'Áp dụng cho ngày khởi hành thứ 7, chủ nhật.',
    },
    {
        id: 6,
        code: 'GROUP10',
        title: 'Ưu đãi nhóm từ 10 người',
        description: 'Giảm thêm 10% cho đoàn từ 10 người',
        discount: '10%',
        type: 'percent',
        category: 'tour',
        validTo: '31/03/2025',
        minOrder: 5000000,
        maxDiscount: 500000,
        usageLimit: 100,
        usageCount: 23,
        terms: 'Áp dụng cho tour có từ 10 khách trở lên trong cùng một booking.',
    },
];

export default function KhuyenMai() {
    const [activeCategory, setActiveCategory] = useState('all');
    const [promotions, setPromotions] = useState<any[]>([]);
    const [loadingPromos, setLoadingPromos] = useState(false);
    const [promoError, setPromoError] = useState<string | null>(null);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('newest');

    const copyToClipboard = async (code: string) => {
        try {
            await navigator.clipboard.writeText(code);
            setCopiedCode(code);
            setTimeout(() => setCopiedCode(null), 2000);
        } catch (err) {
            console.error('Failed to copy: ', err);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price);
    };
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoadingPromos(true);
                const params = new URLSearchParams();
                params.set('status', 'active');
                params.set('pageSize', '1000');
                const res = await fetch(`${API_BASE}/api/promotions?${params.toString()}`);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const json = await res.json();
                const list = Array.isArray(json.data) ? json.data : [];
                const fmt = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

                const mapped = list.map((p: any, idx: number) => {
                    // map server promo -> local voucher shape used in this component
                    // normalize appliesTo values (handle plural forms from API)
                    const rawApplies = Array.isArray(p.appliesTo) && p.appliesTo.length ? p.appliesTo[0] : (p.appliesTo || 'all');
                    const normalize = (v: string) => {
                        if (!v) return 'all';
                        const s = String(v).toLowerCase();
                        if (s === 'buses' || s === 'bus') return 'bus';
                        if (s === 'tours' || s === 'tour') return 'tour';
                        if (s === 'flights' || s === 'flight') return 'flight';
                        if (s === 'all' || s === 'any') return 'all';
                        return s;
                    };
                    const category = normalize(rawApplies);
                    const validToIso = p.validTo || p.expiresAt || p.expireAt || p.to || p.endDate || null;
                    const validTo = validToIso ? (() => {
                        const d = new Date(validToIso);
                        const dd = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
                        return dd;
                    })() : (p.validTo || '');

                    return {
                        id: p._id ?? p.id ?? `promo_${idx}`,
                        code: p.code ?? '',
                        title: p.title ?? p.name ?? p.code ?? '',
                        description: p.description ?? '',
                        discount: p.type === 'percent' ? `${p.value}%` : (p.value ? fmt.format(Number(p.value)) : ''),
                        type: p.type ?? 'fixed',
                        category: category,
                        validTo: validTo,
                        minOrder: Number(p.minSpend ?? p.minOrder ?? 0),
                        maxDiscount: Number(p.maxDiscount ?? p.value ?? 0),
                        usageLimit: Number(p.maxUses ?? p.usageLimit ?? 0),
                        usageCount: Number(p.usedCount ?? p.usageCount ?? 0),
                        terms: p.terms ?? p.description ?? '',
                    };
                });

                if (!cancelled) {
                    setPromotions(mapped);
                    setPromoError(null);
                }
            } catch (err: any) {
                if (!cancelled) setPromoError(String(err?.message ?? err));
            } finally {
                if (!cancelled) setLoadingPromos(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);
    const getDaysLeft = (validTo: string) => {
        const today = new Date();
        const endDate = new Date(validTo.split('/').reverse().join('-'));
        const diffTime = endDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    // use fetched promotions when available, otherwise fallback to static voucherCodes
    const sourceVouchers = promotions.length ? promotions : voucherCodes;
    const filteredVouchers = sourceVouchers.filter(voucher => {
        const matchesCategory = activeCategory === 'all' || (voucher.category ?? 'all') === activeCategory;
        const matchesSearch = (voucher.title || '').toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
            (voucher.code || '').toString().toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    // derive counts for tabs
    const counts = {
        all: sourceVouchers.length,
        flight: sourceVouchers.filter(v => (v.category ?? 'all') === 'flight').length,
        bus: sourceVouchers.filter(v => (v.category ?? 'all') === 'bus').length,
        tour: sourceVouchers.filter(v => (v.category ?? 'all') === 'tour').length,
    };

    const sortedVouchers = [...filteredVouchers].sort((a, b) => {
        switch (sortBy) {
            case 'newest': return b.id - a.id;
            case 'ending': return getDaysLeft(a.validTo) - getDaysLeft(b.validTo);
            case 'popular': return b.usageCount - a.usageCount;
            case 'discount': {
                const aDiscount = a.type === 'percent' ? parseInt(a.discount) :
                    parseInt(a.discount.replace(/\D/g, ''));
                const bDiscount = b.type === 'percent' ? parseInt(b.discount) :
                    parseInt(b.discount.replace(/\D/g, ''));
                return bDiscount - aDiscount;
            }
            default: return 0;
        }
    });

    return (
        <>
            {loadingPromos && <div className="container text-sm text-muted-foreground py-2">Đang tải khuyến mãi...</div>}
            {promoError && <div className="container text-sm text-red-600 py-2">Lỗi tải khuyến mãi: {promoError}</div>}
            {/* Hero Section */}
            <section className="bg-gradient-to-br from-red-50 to-orange-50 py-12">
                <div className="container">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl lg:text-4xl font-bold mb-4" style={{ color: 'hsl(var(--destructive))' }}>
                            🔥 Khuyến mãi Hot - Ưu đãi khủng! 🔥
                        </h1>
                        <p className="text-lg text-muted-foreground">
                            Tiết kiệm đến 50% với hàng trăm mã giảm giá và chương trình ưu đãi hấp dẫn
                        </p>
                    </div>

                    {/* Featured Promotions */}
                    {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {featuredPromotions.map((promo) => (
                            <Card key={promo.id} className="overflow-hidden hover:shadow-lg transition-shadow border-red-200">
                                <div
                                    className="h-32 bg-cover bg-center relative"
                                    style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${promo.image})` }}
                                >
                                    <div className="absolute inset-0 flex items-center justify-center text-white text-center">
                                        <div>
                                            <div className="text-2xl font-bold mb-1">{promo.title}</div>
                                            <div className="text-sm">{promo.subtitle}</div>
                                        </div>
                                    </div>
                                    <Badge className="absolute top-2 right-2" style={{ background: 'hsl(var(--destructive))', color: 'hsl(var(--destructive-foreground))' }}>
                                        -{promo.discount}
                                    </Badge>
                                </div>
                                <CardContent className="p-4">
                                    <p className="text-sm text-muted-foreground mb-3">{promo.description}</p>
                                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                                        <span>📅 {promo.validFrom} - {promo.validTo}</span>
                                    </div>
                                    <Button className="w-full" size="sm" asChild>
                                        <Link prefetch={false} href="/khuyen-mai">
                                            Xem chi tiết
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div> */}
                </div>
            </section>

            {/* Voucher Codes Section */}
            <section className="py-12">
                <div className="container">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl lg:text-3xl font-bold">Mã giảm giá</h2>
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <Input
                                    placeholder="Tìm mã giảm giá..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-64"
                                />
                            </div>
                            <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger className="w-40">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="newest">Mới nhất</SelectItem>
                                    <SelectItem value="ending">Sắp hết hạn</SelectItem>
                                    <SelectItem value="popular">Phổ biến nhất</SelectItem>
                                    <SelectItem value="discount">Giảm giá cao nhất</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Category Tabs */}
                    <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mb-8">
                        <TabsList className="grid w-full grid-cols-4">
                            {promotionCategories.map((category) => (
                                <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-2">
                                    {category.icon && <category.icon className="h-4 w-4" />}
                                    {category.name} ({(counts as any)[category.id] ?? 0})
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>

                    {/* Voucher Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sortedVouchers.map((voucher) => {
                            const daysLeft = getDaysLeft(voucher.validTo);
                            const isExpiringSoon = daysLeft <= 7;
                            const usagePercent = (voucher.usageCount / voucher.usageLimit) * 100;

                            return (
                                <Card key={voucher.id} className={`relative hover:shadow-md transition-shadow ${isExpiringSoon ? 'border-orange-200' : ''}`}>
                                    {isExpiringSoon && (
                                        <Badge variant="destructive" className="absolute -top-2 left-4 z-10">
                                            <Clock className="h-3 w-3 mr-1" />
                                            <span className='text-white' >Còn {daysLeft} ngày</span>
                                        </Badge>
                                    )}

                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <CardTitle className="text-lg mb-1">{voucher.title}</CardTitle>
                                                <p className="text-sm text-muted-foreground">{voucher.description}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-bold" style={{ color: 'hsl(var(--destructive))' }}>
                                                    {voucher.type === 'percent'
                                                        ? `-${voucher.discount}` // e.g. -20%
                                                        : `-${formatPrice(voucher.maxDiscount ?? 0)}` // fixed amount
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>

                                    <CardContent>
                                        {/* Voucher Code */}
                                        <div className="bg-gray-50 rounded-lg p-3 mb-4">
                                            {voucher.code ? (
                                                <>
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <Label className="text-xs text-muted-foreground">Mã giảm giá</Label>
                                                            <div className="font-mono font-bold text-lg text-primary">
                                                                {voucher.code}
                                                            </div>
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => copyToClipboard(voucher.code)}
                                                            className="shrink-0"
                                                        >
                                                            {copiedCode === voucher.code ? (
                                                                <>
                                                                    <Check className="h-4 w-4 mr-1" />
                                                                    Đã sao chép
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Copy className="h-4 w-4 mr-1" />
                                                                    Sao chép
                                                                </>
                                                            )}
                                                        </Button>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-2">
                                                        Sao chép mã này để dán vào ô mã giảm giá khi thanh toán nhé.
                                                    </p>
                                                </>
                                            ) : (
                                                <div>
                                                    {/* <Label className="text-xs text-muted-foreground">Áp dụng tự động</Label> */}
                                                    <div className="text-sm font-medium">
                                                        Khuyến mãi này sẽ được hiển thị khi thanh toán giá trị đơn hàng ≥ {formatPrice(voucher.minOrder)}.
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Usage Progress */}
                                        <div className="mb-4">
                                            <div className="flex items-center justify-between text-sm mb-1">
                                                <span className="text-muted-foreground">Đã sử dụng</span>
                                                <span className="font-medium">{voucher.usageCount}/{voucher.usageLimit}</span>
                                            </div>
                                            <div className="w-full rounded-full h-2" style={{ background: 'hsl(var(--muted))' }}>
                                                <div
                                                    className="h-2 rounded-full transition-all"
                                                    style={{ width: `${Math.min(usagePercent, 100)}%`, background: 'hsl(var(--primary))' }}
                                                ></div>
                                            </div>
                                        </div>

                                        {/* Details */}
                                        <div className="space-y-2 text-sm text-muted-foreground">
                                            <div className="flex items-center justify-between">
                                                <span>Đơn tối thiểu:</span>
                                                <span className="font-medium">{formatPrice(voucher.minOrder)}</span>
                                            </div>
                                            {voucher.maxDiscount && (
                                                <>
                                                    {/* show discount label depending on type */}
                                                    {voucher.type === 'fixed' ? (
                                                        // fixed: show max fixed discount in VND
                                                        <div className="flex items-center justify-between">
                                                            <span>Giảm tối đa:</span>
                                                            <span className="font-medium">{formatPrice(voucher.maxDiscount ?? 0)}</span>
                                                        </div>
                                                    ) : (
                                                        // percent: show percent value
                                                        <div className="flex items-center justify-between">
                                                            <span>Giảm:</span>
                                                            <span className="font-medium">{voucher.discount}</span>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                            <div className="flex items-center justify-between">
                                                <span>Hết hạn:</span>
                                                <span className={`font-medium ${isExpiringSoon ? '' : ''}`} style={isExpiringSoon ? { color: 'hsl(var(--warning))' } : {}}>
                                                    {voucher.validTo}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Terms */}
                                        {/* <div className="mt-4 p-3 rounded-lg" style={{ background: 'hsl(var(--info-foreground))' }}>
                                            <div className="flex items-start gap-2">
                                                <AlertCircle className="h-4 w-4" style={{ color: 'hsl(var(--info))' }} />
                                                <p className="text-xs" style={{ color: 'hsl(var(--info))' }}>{voucher.terms}</p>
                                            </div>
                                        </div> */}

                                        {/* Action Button */}
                                        {/* <Button className="w-full mt-4" size="sm">
                                            <Gift className="h-4 w-4 mr-2" />
                                            Lưu mã và đặt ngay
                                        </Button> */}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    {sortedVouchers.length === 0 && (
                        <Card className="text-center py-12">
                            <CardContent>
                                <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-medium mb-2">Không tìm thấy mã giảm giá</h3>
                                <p className="text-muted-foreground mb-4">
                                    Vui lòng thử tìm kiếm với từ khóa khác hoặc chọn danh mục khác
                                </p>
                                <Button variant="outline" onClick={() => {
                                    setSearchTerm('');
                                    setActiveCategory('all');
                                }}>
                                    Xóa bộ lọc
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </section >

            {/* Tips Section */}
            <section className="py-12 bg-gray-50" >
                <div className="container">
                    <h2 className="text-2xl font-bold text-center mb-8">Mẹo tiết kiệm khi đặt dịch vụ</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            {
                                icon: '📅',
                                title: 'Đặt sớm',
                                description: 'Đặt trước 2-3 tháng để có giá tốt nhất'
                            },
                            {
                                icon: '🔔',
                                title: 'Theo dõi khuyến mãi',
                                description: 'Bật thông báo để không bỏ lỡ ưu đãi'
                            },
                            {
                                icon: '👥',
                                title: 'Đi nhóm',
                                description: 'Booking nhóm để được giảm giá thêm'
                            },
                            {
                                icon: '📱',
                                title: 'Ứng dụng mobile',
                                description: 'Dùng app để nhận ưu đãi độc quyền'
                            }
                        ].map((tip, index) => (
                            <Card key={index} className="text-center">
                                <CardContent className="p-6">
                                    <div className="text-3xl mb-3">{tip.icon}</div>
                                    <h3 className="font-semibold mb-2">{tip.title}</h3>
                                    <p className="text-sm text-muted-foreground">{tip.description}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>
        </>
    );
}
