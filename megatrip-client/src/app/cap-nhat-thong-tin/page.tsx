"use client"
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { User, MapPin, Phone, Calendar } from 'lucide-react';
import auth from '../../apis/auth';

export default function CapNhatThongTin() {
    const [form, setForm] = useState({
        name: '',
        address: '',
        phone: '',
        dob: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [checked, setChecked] = useState(false);
    const router = useRouter();

    // Check if user is logged in and needs profile update
    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            router.replace('/dang-nhap');
            return;
        }

        // Check if profile is already complete
        const checkProfile = async () => {
            try {
                const userProfile: any = await auth.me();
                const hasCompleteProfile = userProfile.name && userProfile.address && userProfile.phone;
                if (hasCompleteProfile) {
                    router.replace('/');
                    return;
                }
            } catch (err) {
                // If can't get profile, stay on this page
            }
            setChecked(true);
        };

        checkProfile();
    }, [router]); if (!checked) return null;

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        if (!form.name || !form.address || !form.phone || !form.dob) {
            setError('Vui lòng nhập đầy đủ thông tin');
            setLoading(false);
            return;
        }

        try {
            await auth.updateProfile({
                name: form.name,
                address: form.address,
                phone: form.phone,
                dob: form.dob
            });
            setSuccess('Cập nhật thông tin thành công!');

            // Update localStorage with new user info
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            const updatedUser = { ...currentUser, ...form };
            localStorage.setItem('user', JSON.stringify(updatedUser));

            // Redirect to home after successful update
            setTimeout(() => {
                router.push('/');
            }, 2000);
        } catch (err: any) {
            setError(err?.message || 'Cập nhật thất bại. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative" style={{ background: 'url(/bg_signInUp.jpeg) center/cover no-repeat' }}>
            {/* Logo góc trên trái */}
            <div className="absolute top-0 left-0 z-20 p-6">
                <span className="font-extrabold text-2xl lg:text-2xl" style={{ color: 'hsl(var(--primary))' }}>MegaTrip</span>
            </div>

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/30 z-10"></div>

            <div className="relative z-10 w-full max-w-6xl flex flex-col lg:flex-row items-center justify-between h-full">
                {/* Slogan bên trái */}
                <div className="hidden lg:flex flex-1 items-center justify-center h-full">
                    <div className="text-white text-5xl font-extrabold leading-tight text-left drop-shadow-xl">
                        Hoàn thiện hồ sơ,<br />
                        Trải nghiệm tốt hơn.
                    </div>
                </div>

                {/* Form bên phải */}
                <div className="w-full max-w-md mx-auto lg:mr-16">
                    <div className="mb-4 flex justify-start lg:justify-start">
                        <Link href="/" className="text-base font-semibold" style={{ color: 'hsl(var(--primary))' }}>← Trở về trang chủ</Link>
                    </div>
                    <Card className="shadow-2xl rounded-3xl border-0 bg-white/95 backdrop-blur-lg" style={{ borderColor: 'hsl(var(--primary))', boxShadow: '0 8px 32px hsl(var(--primary-200) / 0.15)' }}>
                        <CardHeader className="pb-2 text-center">
                            <CardTitle className="text-2xl font-bold mb-1" style={{ color: 'hsl(var(--primary))' }}>Cập nhật thông tin cá nhân</CardTitle>
                            <p className="text-sm text-muted-foreground">Vui lòng hoàn thiện thông tin để sử dụng dịch vụ tốt hơn</p>
                        </CardHeader>
                        <CardContent className="pt-2 pb-6">
                            <form className="space-y-5" onSubmit={handleSubmit}>
                                <div>
                                    <Label htmlFor="name" className="font-semibold flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        Họ và tên
                                    </Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        value={form.name}
                                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                        placeholder="Nhập họ và tên"
                                        className="rounded-full focus-ring bg-[hsl(var(--muted))] border border-[hsl(var(--primary))] focus:border-[hsl(var(--primary))]"
                                        required
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="phone" className="font-semibold flex items-center gap-2">
                                        <Phone className="h-4 w-4" />
                                        Số điện thoại
                                    </Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        value={form.phone}
                                        onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                                        placeholder="Ví dụ: +84901234567"
                                        className="rounded-full focus-ring bg-[hsl(var(--muted))] border border-[hsl(var(--primary))] focus:border-[hsl(var(--primary))]"
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="dob" className="font-semibold flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        Ngày sinh
                                    </Label>
                                    <Input
                                        id="dob"
                                        type="date"
                                        value={form.dob}
                                        onChange={e => setForm(f => ({ ...f, dob: e.target.value }))}
                                        className="rounded-full focus-ring bg-[hsl(var(--muted))] border border-[hsl(var(--primary))] focus:border-[hsl(var(--primary))]"
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="address" className="font-semibold flex items-center gap-2">
                                        <MapPin className="h-4 w-4" />
                                        Địa chỉ
                                    </Label>
                                    <Input
                                        id="address"
                                        type="text"
                                        value={form.address}
                                        onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                                        placeholder="Nhập địa chỉ"
                                        className="rounded-full focus-ring bg-[hsl(var(--muted))] border border-[hsl(var(--primary))] focus:border-[hsl(var(--primary))]"
                                        required
                                    />
                                </div>
                                {error && <div className="text-red-600 text-sm text-center">{error}</div>}
                                {success && <div className="text-green-600 text-sm text-center">{success}</div>}
                                <Button
                                    type="submit"
                                    className="w-full mt-2 rounded-full font-semibold text-lg py-2"
                                    style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', border: '1px solid hsl(var(--primary))' }}
                                    disabled={loading}
                                >
                                    {loading ? 'Đang cập nhật...' : 'Cập nhật thông tin'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}