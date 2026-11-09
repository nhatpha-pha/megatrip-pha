"use client"
import { useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import auth from '../../apis/auth';
import Link from 'next/link';
import { Input } from '../components/ui/input';

type Step = 1 | 2 | 3 | 4; // 1: email, 2: OTP, 3: mật khẩu mới, 4: xong

const RESEND_SECONDS = 60;
const STEP_LABELS = ['Email', 'Mã OTP', 'Mật khẩu mới'];

export default function QuenMatKhau() {
    const [step, setStep] = useState<Step>(1);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [resetToken, setResetToken] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    useEffect(() => {
        if (cooldown <= 0) return;
        const t = setTimeout(() => setCooldown(c => c - 1), 1000);
        return () => clearTimeout(t);
    }, [cooldown]);

    const run = async (fn: () => Promise<void>) => {
        setError('');
        setLoading(true);
        try {
            await fn();
        } catch (err: any) {
            setError(err?.message || 'Có lỗi xảy ra, vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const sendOtp = (e?: any) => {
        e?.preventDefault();
        if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Vui lòng nhập đúng email');
        run(async () => {
            await auth.forgotPassword({ email });
            setOtp('');
            setCooldown(RESEND_SECONDS);
            setStep(2);
        });
    };

    const verifyOtp = (e: any) => {
        e.preventDefault();
        if (!/^\d{6}$/.test(otp)) return setError('Mã OTP gồm 6 chữ số.');
        run(async () => {
            const data: any = await auth.verifyOtp({ email, otp });
            setResetToken(data.resetToken);
            setStep(3);
        });
    };

    const resetPassword = (e: any) => {
        e.preventDefault();
        if (password.length < 8) return setError('Mật khẩu cần ít nhất 8 ký tự.');
        if (password !== confirm) return setError('Mật khẩu nhập lại không khớp.');
        run(async () => {
            await auth.resetPassword({ email, resetToken, newPassword: password });
            setStep(4);
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="w-full max-w-md" aria-live="polite">
                <h2 className="text-2xl font-bold mb-4">Quên mật khẩu</h2>

                {step < 4 && (
                    <ol className="flex gap-2 mb-6 text-sm" aria-label="Các bước">
                        {STEP_LABELS.map((label, i) => (
                            <li
                                key={label}
                                aria-current={step === i + 1 ? 'step' : undefined}
                                className={`flex-1 pt-2 border-t-4 ${
                                    step >= i + 1 ? 'border-primary font-semibold' : 'border-gray-200 text-gray-500'
                                }`}
                            >
                                {label}
                            </li>
                        ))}
                    </ol>
                )}

                {step === 1 && (
                    <form onSubmit={sendOtp} className="space-y-4" noValidate>
                        <p className="text-sm">Nhập email liên kết với tài khoản. Chúng tôi sẽ gửi mã OTP để xác nhận.</p>
                        <div>
                            <Label htmlFor="email" className="font-semibold">Email</Label>
                            <Input id="email" type="email" autoComplete="email" autoFocus value={email}
                                onChange={e => setEmail(e.target.value.trim())} required />
                        </div>
                        {error && <div className="text-red-600 text-sm" role="alert">{error}</div>}
                        <Button type="submit" disabled={loading} className="w-full">
                            {loading ? 'Đang gửi...' : 'Gửi mã OTP'}
                        </Button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={verifyOtp} className="space-y-4" noValidate>
                        <p className="text-sm">
                            Mã OTP đã được gửi tới <strong>{email}</strong>. Mã có hiệu lực trong 5 phút.
                        </p>
                        <div>
                            <Label htmlFor="otp" className="font-semibold">Mã OTP</Label>
                            <Input id="otp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} autoFocus
                                className="text-center text-xl tracking-[0.5em]" value={otp}
                                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} />
                        </div>
                        {error && <div className="text-red-600 text-sm" role="alert">{error}</div>}
                        <Button type="submit" disabled={loading} className="w-full">
                            {loading ? 'Đang kiểm tra...' : 'Xác nhận mã'}
                        </Button>
                        <div className="flex justify-between text-sm">
                            <button type="button" className="text-primary underline"
                                onClick={() => { setError(''); setStep(1); }}>
                                Đổi email
                            </button>
                            <button type="button" className="text-primary underline disabled:text-gray-400 disabled:no-underline"
                                disabled={cooldown > 0 || loading} onClick={sendOtp}>
                                {cooldown > 0 ? `Gửi lại mã sau ${cooldown}s` : 'Gửi lại mã'}
                            </button>
                        </div>
                    </form>
                )}

                {step === 3 && (
                    <form onSubmit={resetPassword} className="space-y-4" noValidate>
                        <p className="text-sm">Đặt mật khẩu mới cho tài khoản {email}.</p>
                        <div>
                            <Label htmlFor="password" className="font-semibold">Mật khẩu mới</Label>
                            <Input id="password" type="password" autoComplete="new-password" autoFocus value={password}
                                onChange={e => setPassword(e.target.value)} />
                        </div>
                        <div>
                            <Label htmlFor="confirm" className="font-semibold">Nhập lại mật khẩu</Label>
                            <Input id="confirm" type="password" autoComplete="new-password" value={confirm}
                                onChange={e => setConfirm(e.target.value)} />
                        </div>
                        {error && <div className="text-red-600 text-sm" role="alert">{error}</div>}
                        <Button type="submit" disabled={loading} className="w-full">
                            {loading ? 'Đang lưu...' : 'Lưu mật khẩu mới'}
                        </Button>
                    </form>
                )}

                {step === 4 && (
                    <div className="space-y-4">
                        <div className="text-green-600 text-sm">
                            Mật khẩu đã được đổi. Bạn có thể đăng nhập bằng mật khẩu mới.
                        </div>
                        <Button asChild className="w-full">
                            <Link href="/dang-nhap">Đăng nhập</Link>
                        </Button>
                    </div>
                )}

                {step < 4 && (
                    <div className="mt-4 text-sm">
                        <Link href="/dang-nhap" className="text-primary underline">Quay lại đăng nhập</Link>
                    </div>
                )}
            </div>
        </div>
    );
}
