"use client"
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import auth from '../../../apis/auth';

export default function AdminLoginPage() {
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setError('');
        if (!form.email || !form.password) return setError('Vui lòng nhập email và mật khẩu');
        setLoading(true);
        try {
            const res: any = await auth.login({ email: form.email, password: form.password });
            const token = res?.token || res?.accessToken || res?.data?.token || res?.token;
            const user = res?.user || res?.data?.user || res;
            if (!token) {
                setError('Không nhận được token từ server');
                setLoading(false);
                return;
            }
            localStorage.setItem('accessToken', token);
            if (user?.role !== 'admin' && user?.role !== 'employee') {
                localStorage.removeItem('accessToken');
                setError('Tài khoản không có quyền quản trị');
                setLoading(false);
                return;
            }
            router.push('/admin/dashboard');
        } catch (err: any) {
            setError(err?.message || 'Đăng nhập thất bại');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
            <div className="w-full max-w-md bg-white border rounded-lg p-6 shadow">
                <h2 className="text-2xl font-bold mb-4">Đăng nhập quản trị</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                    </div>
                    <div>
                        <Label htmlFor="password">Mật khẩu</Label>
                        <Input id="password" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                    </div>
                    {error && <div className="text-red-600 text-sm">{error}</div>}
                    <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</Button>
                </form>
            </div>
        </div>
    );
}
