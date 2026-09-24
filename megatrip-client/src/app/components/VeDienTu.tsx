// components/VeDienTu.tsx
import React from 'react';
import {
    CreditCard,
    CheckCircle,
    FileText,
    Plane,
    Users,
    Smartphone,
    Shield,
    MapPin,
    Clock,
} from 'lucide-react';
import { Badge } from '../components/ui/badge';

interface VeDienTuProps {
    bookingType: string;
    bookingData: any;
    passengers: any[];
    ticket: any;
    countdown?: number;
    expired?: boolean;
    bookingCode: string;
    status: string;
    className?: string;
}

const VeDienTu = React.forwardRef<HTMLDivElement, VeDienTuProps>(({ bookingType, bookingData, passengers, ticket, countdown, expired, bookingCode, status, className }, ref) => {
    const flightBenefits = [
        { label: 'Quyền sử dụng phòng chờ', icon: <Users className="h-4 w-4 text-blue-600" /> },
        { label: 'Màn hình giải trí', icon: <CheckCircle className="h-4 w-4 text-blue-600" /> },
        { label: 'Bữa ăn nhẹ', icon: <FileText className="h-4 w-4 text-blue-600" /> },
    ];
    const flightBaggage = [
        { label: 'Hành lý ký gửi', value: '40kg' },
        { label: 'Hành lý xách tay', value: '12kg' },
    ];
    const busBenefits = [
        { label: 'Nước uống miễn phí', icon: <CheckCircle className="h-4 w-4 text-green-600" /> },
        { label: 'Wifi trên xe', icon: <Smartphone className="h-4 w-4 text-green-600" /> },
        { label: 'Ghế ngả', icon: <Users className="h-4 w-4 text-green-600" /> },
    ];
    const tourBenefits = [
        { label: 'Hướng dẫn viên chuyên nghiệp', icon: <Users className="h-4 w-4 text-purple-600" /> },
        { label: 'Bảo hiểm du lịch', icon: <Shield className="h-4 w-4 text-purple-600" /> },
    ];
    function getFlightCode() {
        if (bookingData.details.flightCode) return bookingData.details.flightCode;
        if (bookingData.details.airline) {
            const prefix = bookingData.details.airline.replace(/\s/g, '');
            return prefix + Math.floor(100 + Math.random() * 900);
        }
        return 'VN' + Math.floor(100 + Math.random() * 900);
    }
    function getArrival() {
        return '09:30 Th 6, 06/06/2025';
    }
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
    console.log('bookingData:', bookingData);
    console.log('ticket:', ticket);
    console.log('passengers:', passengers);

    function getTicketLeg(ticket: any) {
        if (ticket?.uniq?.includes('outbound')) return 'outbound';
        if (ticket?.uniq?.includes('inbound')) return 'inbound';
        return null;
    }

    function getTicketSeats(ticket: any, bookingData: any) {
        if (ticket?.seats && ticket.seats.length > 0) {
            return ticket.seats.join(', ');
        }
        const leg = getTicketLeg(ticket);
        if (leg && bookingData?.pricing?.seats) {
            const filteredSeats = bookingData.pricing.seats
                .filter((s: any) => s.leg === leg)
                .map((s: any) => s.number);
            return filteredSeats.length > 0 ? filteredSeats.join(', ') : '';
        }
        return '';
    }
    function getFlightBenefits(pricing: any) {
        const addOns = pricing?.addOns || [];
        if (addOns.length === 0) {
            return flightBenefits;
        }
        return addOns.map((addon: any) => ({
            label: addon.name || addon.id || 'Quyền lợi không xác định',
            icon: <CheckCircle className="h-4 w-4 text-blue-600" />,
        }));
    }
    return (
        <div ref={ref} className={`bg-white rounded-2xl shadow-lg border relative overflow-hidden max-w-5xl mx-auto mb-8 ${className || ''}`}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between px-8 pt-6 pb-2 border-b bg-gradient-to-r from-blue-50 to-white relative">
                <div className="flex-1 flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-xl font-bold text-blue-700">
                        <CreditCard className="h-6 w-6 text-blue-500" /> Vé Điện Tử
                    </div>
                    <div className="bg-white border rounded-lg px-4 py-2 flex flex-col items-center shadow-sm justify-center"
                        style={{ margin: '2px auto' }}
                    >
                        <div className="text-xs text-gray-400 mb-1">MÃ VÉ</div>
                        <div className="font-mono text-2xl tracking-widest text-black">{ticket?.ticketNumber}</div>
                        <div className="mt-1"><span className="block w-24 h-6 bg-[repeating-linear-gradient(90deg,#222_0_2px,transparent_2px_6px)] rounded-sm"></span></div>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-gray-500 text-sm">Trạng thái:</span>
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${ticket?.status === 'cancelled' ? 'bg-red-100 text-red-600' : ticket?.status === 'changed' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{getTicketStatusLabel(ticket?.status || status)}</span>
                        <span className="text-gray-500 text-sm">Loại hành khách:</span>
                        <Badge >{getPassengerTypeLabel(ticket?.ticketType || passengers[0]?.type)}</Badge>
                    </div>
                </div>
                <div className="flex flex-col items-center gap-2 mt-4 md:mt-0 min-w-[140px]">
                </div>
            </div>
            <div className="p-6 bg-white space-y-6">
                <div className="space-y-4">
                    <div className="rounded-xl border bg-white p-4">
                        <div className="flex items-center gap-2 mb-3 text-blue-700 font-semibold text-base">
                            <Users className="h-5 w-5" /> Thông Tin Hành Khách
                        </div>
                        <div className="grid gap-3">
                            {passengers.map((p: any, idx: number) => (
                                <div key={idx} className="rounded-lg border bg-blue-50 p-3 flex flex-col gap-1">
                                    <div className="flex items-center gap-2 font-medium text-base">
                                        <span>Họ và tên hành khách : </span><span>{p.name || `${p.firstName || ''} ${p.lastName || ''}`}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div>Ngày Sinh: <span className="font-semibold">{p.dob || p.dateOfBirth || '--'}</span></div>
                                        <div>CMND/CCCD: <span className="font-semibold">{p.idNumber || '--'}</span></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        {bookingType === 'flight' && (
                            <div className="rounded-xl border bg-blue-50 p-4">
                                <div className="flex items-center gap-2 mb-3 text-blue-700 font-semibold text-base">
                                    <Plane className="h-5 w-5" /> Thông Tin Chuyến Bay
                                </div>
                                <div className="text-sm space-y-2">
                                    {(() => {
                                        const leg = getTicketLeg(ticket);
                                        const seats = getTicketSeats(ticket, bookingData);
                                        // Dùng bookingData.details.flights nếu có (cho change), else ticket.reservationInfo.flights
                                        const outboundFlight = bookingData.details.flights?.outbound || ticket?.reservationInfo?.flights?.outbound;
                                        return (
                                            <>
                                                {(leg === 'outbound' || leg === null) && outboundFlight && (
                                                    <div className="border-b pb-2">
                                                        <div className="font-medium text-blue-700">Chuyến đi (Outbound)</div>
                                                        <div className="flex justify-between"><span className="text-gray-500">Mã chuyến bay:</span><span className="font-medium">{outboundFlight.flightNumber}</span></div>
                                                        <div className="flex justify-between"><span className="text-gray-500">Tuyến:</span><span className="font-medium">{outboundFlight.route}</span></div>
                                                        <div className="flex justify-between"><span className="text-gray-500">Ngày:</span><span>{outboundFlight.date}</span></div>
                                                        <div className="flex justify-between"><span className="text-gray-500">Giờ:</span><span>{outboundFlight.time}</span></div>
                                                        <div className="flex justify-between"><span className="text-gray-500">Hãng:</span><span>{outboundFlight.airline}</span></div>
                                                        {seats && (
                                                            <div className="flex justify-between"><span className="text-gray-500">Ghế:</span><span className="font-medium">{seats}</span></div>
                                                        )}
                                                    </div>
                                                )}
                                                {(leg === 'inbound' || leg === null) && (bookingData.details.flights?.inbound || ticket?.reservationInfo?.flights?.inbound) && (
                                                    <div className={(leg as any) === 'outbound' ? 'pt-2' : ''}>
                                                        <div className="font-medium text-blue-700">Chuyến về (Inbound)</div>
                                                        <div className="flex justify-between"><span className="text-gray-500">Mã chuyến bay:</span><span className="font-medium">{bookingData.details.flights?.inbound?.flightNumber || ticket.reservationInfo.flights.inbound.flightNumber}</span></div>
                                                        <div className="flex justify-between"><span className="text-gray-500">Tuyến:</span><span className="font-medium">{bookingData.details.flights?.inbound?.route || ticket.reservationInfo.flights.inbound.route}</span></div>
                                                        <div className="flex justify-between"><span className="text-gray-500">Ngày:</span><span>{bookingData.details.flights?.inbound?.date || ticket.reservationInfo.flights.inbound.date}</span></div>
                                                        <div className="flex justify-between"><span className="text-gray-500">Giờ:</span><span>{bookingData.details.flights?.inbound?.time || ticket.reservationInfo.flights.inbound.time}</span></div>
                                                        <div className="flex justify-between"><span className="text-gray-500">Hãng:</span><span>{bookingData.details.flights?.inbound?.airline || ticket.reservationInfo.flights.inbound.airline}</span></div>
                                                        {seats && (
                                                            <div className="flex justify-between"><span className="text-gray-500">Ghế:</span><span className="font-medium">{seats}</span></div>
                                                        )}
                                                    </div>
                                                )}
                                            </>
                                        );
                                    })()}
                                    {!bookingData.details.flights?.outbound && !ticket?.reservationInfo?.flights?.outbound && (
                                        <div className="text-gray-500">Không có thông tin chuyến bay.</div>
                                    )}
                                </div>
                            </div>
                        )}
                        {bookingType === 'bus' && (
                            <div className="rounded-xl border bg-green-50 p-4">
                                <div className="flex items-center gap-2 mb-3 text-green-700 font-semibold text-base">
                                    <Users className="h-5 w-5" /> Thông Tin Chuyến Xe
                                </div>
                                <div className="text-sm space-y-1">
                                    <div className="flex justify-between"><span className="text-gray-500">Tuyến:</span><span className="font-medium">{bookingData.details.route}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-500">Ngày đi:</span><span>{ticket.travelDate}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-500">Giờ xuất phát:</span><span>{ticket.travelStart ? new Date(ticket.travelStart).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : bookingData.details.time}</span></div>
                                    <div className="text-xs text-muted-foreground">
                                        Ghế: {ticket.seats && ticket.seats.length > 0 ? ticket.seats.join(', ') : 'Chưa có'}
                                    </div>
                                </div>
                            </div>
                        )}
                        {bookingType === 'tour' && (
                            <div className="rounded-xl border bg-purple-50 p-4">
                                <div className="flex items-center gap-2 mb-3 text-purple-700 font-semibold text-base">
                                    <MapPin className="h-5 w-5" /> Thông Tin Tour
                                </div>
                                <div className="text-sm space-y-1">
                                    <div className="flex justify-between"><span className="text-gray-500">Tên tour:</span><span className="font-medium">{bookingData.details.route}</span></div>
                                    {(() => {
                                        const startDateTime = ticket?.reservationInfo?.details?.startDateTime || bookingData.details.startDateTime;
                                        const time = startDateTime ? new Date(startDateTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';
                                        const date = ticket?.travelDate ? (ticket.travelDate.includes('T') ? ticket.travelDate.split('T')[0] : ticket.travelDate) : bookingData.details.date;
                                        return (
                                            <div className="flex justify-between"><span className="text-gray-500">Ngày khởi hành:</span><span>{time} {date}</span></div>
                                        );
                                    })()}
                                    <div className="flex justify-between"><span className="text-gray-500">Giá vé:</span><span className="font-medium">{ticket?.price ? `${ticket.price.toLocaleString()} ${ticket.currency}` : '--'}</span></div>
                                    {bookingData.details.guide && <div className="flex justify-between"><span className="text-gray-500">Hướng dẫn viên:</span><span>{bookingData.details.guide}</span></div>}
                                </div>
                            </div>
                        )}
                    </div>

                    {(bookingType === 'flight' || bookingType === 'bus' || bookingType === 'tour') && (
                        <div className={`rounded-xl border p-4 ${bookingType === 'flight' ? 'bg-blue-50' : bookingType === 'bus' ? 'bg-green-50' : 'bg-purple-50'}`}>
                            <div className={`flex items-center gap-2 mb-2 font-semibold text-base ${bookingType === 'flight' ? 'text-blue-700' : bookingType === 'bus' ? 'text-green-700' : 'text-purple-700'}`}>
                                <Users className="h-5 w-5" />{bookingType === 'flight' ? 'Quyền lợi' : bookingType === 'bus' ? 'Tiện ích' : 'Quyền lợi'}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {(bookingType === 'flight' ? getFlightBenefits(bookingData.pricing) : bookingType === 'bus' ? busBenefits : tourBenefits).map((b: any, i:any) => (
                                    <span key={i} className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${bookingType === 'flight' ? 'bg-blue-100 text-blue-700' : bookingType === 'bus' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>{b.icon}{b.label}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 relative">
                <div className="w-6 h-6 bg-white rounded-full border border-gray-200 -ml-3"></div>
                <div className="flex-1 border-t border-dashed border-gray-300 mx-2"></div>
                <div className="w-6 h-6 bg-white rounded-full border border-gray-200 -mr-3"></div>
            </div>
        </div>
    );
});

VeDienTu.displayName = 'VeDienTu';
export default VeDienTu;