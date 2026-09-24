"use client"
import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import auth from '../../apis/auth';
import Link from 'next/link';
import { Input } from '../components/ui/input';

export default function QuenMatKhau() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (!email) return setError('Vui lòng nhập đúng email');
        setLoading(true);
        try {
            await auth.forgotPassword({ email });
            setSuccess('Nếu email tồn tại, chúng tôi đã gửi liên kết đặt lại mật khẩu.');
        } catch (err: any) {
            setError(err?.message || 'Lỗi khi gửi yêu cầu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4">Quên mật khẩu</h2>
                <p className="text-sm mb-4">Nhập email liên kết với tài khoản. Chúng tôi sẽ gửi liên kết đặt lại mật khẩu.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="email" className="font-semibold">Email</Label>
                        <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                    {error && <div className="text-red-600 text-sm">{error}</div>}
                    {success && <div className="text-green-600 text-sm">{success}</div>}
                    <Button type="submit" disabled={loading} className="w-full">Gửi liên kết</Button>
                </form>
                <div className="mt-4 text-sm">
                    <Link href="/dang-nhap" className="text-primary underline">Quay lại đăng nhập</Link>
                </div>
            </div>
        </div>
    );
}
