import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Star } from 'lucide-react';
import { toast } from 'sonner';
// import { DialogOverlay } from '@radix-ui/react-dialog'; // nếu không dùng thì nên bỏ

type BookingLite = {
    id: string;
    title: string;
    type?: string;
    productId?: string;
};

interface OrderReviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    booking: BookingLite | null;
    customerId: string | null;
    onSubmit: (data: { rating: number; comment: string }) => void;
}

export default function OrderReviewDialog({ open, onOpenChange, booking, customerId, onSubmit }: OrderReviewDialogProps) {
    const [rating, setRating] = useState<number>(5);
    const [hover, setHover] = useState<number | null>(null);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        if (open) {
            setRating(5);
            setHover(null);
            setComment('');
        }
    }, [open]);

    const stars = [1, 2, 3, 4, 5];
    const effective = hover ?? rating;
    const handleSubmit = async () => {
        if (!booking || !rating || !comment.trim()) return;

        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080'}/api/reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: (booking as any).orderObjectId,
                    productId: booking.productId,
                    customerId: customerId || '64e65e8d3d5e2b0c8a3e9f12', // Fallback nếu null
                    rating,
                    comment
                })
            });

            if (res.ok) {
                // Thành công: đóng dialog và reset
                onOpenChange(false);
                setRating(5);
                setComment('');
                toast.success('Cảm ơn bạn đã chia sẻ trải nghiệm.'); // Sử dụng Sonner toast
            } else {
                // Lỗi từ server
                toast.error('Có lỗi xảy ra khi gửi đánh giá.'); // Sử dụng Sonner toast
            }
        } catch (error) {
            // Lỗi network
            toast.error('Có lỗi xảy ra khi gửi đánh giá.'); // Sử dụng Sonner toast
        } finally {
            setLoading(false);
        }
    };
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-white">
                <DialogHeader>
                    <DialogTitle>Đánh giá đơn hàng</DialogTitle>
                    <DialogDescription>
                        {booking ? (
                            <span>
                                {booking.title} • Mã đơn: <span className="font-medium">{booking.id}</span>
                            </span>
                        ) : (
                            '—'
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <Label className="mb-2 block">Mức độ hài lòng</Label>
                        <div className="flex items-center gap-2">
                            {stars.map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    aria-label={`Chọn ${s} sao`}
                                    onMouseEnter={() => setHover(s)}
                                    onMouseLeave={() => setHover(null)}
                                    onClick={() => setRating(s)}
                                    className="p-1"
                                >
                                    <Star
                                        className={`h-6 w-6 ${s <= effective ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                                    />
                                </button>
                            ))}
                            <span className="ml-2 text-sm text-muted-foreground">{effective}/5</span>
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="review" className="mb-2 block">
                            Nhận xét của bạn
                        </Label>
                        <Textarea
                            id="review"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Chia sẻ trải nghiệm của bạn về dịch vụ"
                        />
                        <div className="mt-1 text-xs text-muted-foreground">
                            Nhận xét giúp chúng tôi cải thiện chất lượng dịch vụ.
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Hủy
                    </Button>

                    <Button
                        onClick={handleSubmit} // ✅ Gọi handleSubmit trực tiếp
                        disabled={loading || rating === 0 || comment.trim().length === 0}
                    >
                        {loading ? 'Đang gửi...' : 'Gửi đánh giá'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
