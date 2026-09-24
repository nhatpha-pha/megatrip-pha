"use client"
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import auth from '../../apis/auth';

function ResetPasswordPage() {
    const searchParams = useSearchParams()!;
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [token, setToken] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const e = searchParams.get('email') || '';
        const t = searchParams.get('token') || '';
        setEmail(e);
        setToken(t);
    }, [searchParams]);

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (!email || !token) return setError('Link đặt lại không hợp lệ');
        if (!password) return setError('Vui lòng nhập mật khẩu mới');
        if (password.length < 8) return setError('Mật khẩu phải có ít nhất 8 ký tự');
        if (password !== confirm) return setError('Mật khẩu không khớp');
        setLoading(true);
        try {
            await auth.resetPassword({ email, token, password });
            setSuccess('Mật khẩu đã được đặt lại. Bạn sẽ được chuyển về trang đăng nhập.');
            setTimeout(() => router.push('/dang-nhap'), 2000);
        } catch (err: any) {
            setError(err?.message || 'Lỗi khi đặt lại mật khẩu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4">Đặt lại mật khẩu</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="email" className="font-semibold">Email</Label>
                        <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                    <div>
                        <Label htmlFor="password" className="font-semibold">Mật khẩu mới</Label>
                        <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>
                    <div>
                        <Label htmlFor="confirm" className="font-semibold">Xác nhận mật khẩu</Label>
                        <Input id="confirm" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
                    </div>
                    {error && <div className="text-red-600 text-sm">{error}</div>}
                    {success && <div className="text-green-600 text-sm">{success}</div>}
                    <Button type="submit" disabled={loading} className="w-full">Đặt lại mật khẩu</Button>
                </form>
            </div>
        </div>
    );
}

export default function ResetPasswordPageWrapper() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <ResetPasswordPage />
        </Suspense>
    );
}