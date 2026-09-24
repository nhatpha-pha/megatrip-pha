"use client"
import { useEffect, useState, useRef } from 'react';
import { ReadonlyURLSearchParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
    CheckCircle,
    Download,
    Mail,
    Phone,
    Calendar,
    Plane,
    Users,
    CreditCard,
    FileText,
    Home,
    List,
    Loader2,
} from 'lucide-react';
import VeDienTu from '../components/VeDienTu';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas-pro'; // FIX: Use html2canvas-pro
import { withSuspense } from '../components/SuspenseWrapper';

 function ThanhToanThanhCong() {
    const searchParams = useSearchParams() as ReadonlyURLSearchParams;
    const orderId: string | null = searchParams.get('orderId');
    const extraData = searchParams.get('extraData');

    const [order, setOrder] = useState<any>(null);
    const [tickets, setTickets] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<any>(null);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [isDownloadMode, setIsDownloadMode] = useState(false);
    const ticketRefs = useRef<any[]>([]);

    const loadFont = async (pdf: jsPDF, fontUrl: string, fontName: string) => {
        return new Promise<boolean>((resolve) => {
            fetch(fontUrl)
                .then(response => {
                    if (!response.ok) throw new Error('Font file not found');
                    return response.blob();
                })
                .then(blob => {
                    const reader = new FileReader();
                    reader.onload = () => {
                        const fontBase64 = (reader.result as string).split(',')[1];
                        pdf.addFileToVFS(`${fontName}.ttf`, fontBase64);
                        pdf.addFont(`${fontName}.ttf`, fontName, 'normal');
                        pdf.addFont(`${fontName}.ttf`, fontName, 'bold');
                        pdf.setFont(fontName);
                        resolve(true);
                    };
                    reader.onerror = () => {
                        pdf.setFont('times');
                        resolve(false);
                    };
                    reader.readAsDataURL(blob);
                })
                .catch(() => {
                    pdf.setFont('times');
                    resolve(false);
                });
        });
    };

    const generatePDF = async () => {
        setIsGeneratingPDF(true);
        try {
            const pdf = new jsPDF('p', 'mm', 'a4');
            let yPosition = 20;

            const fontLoaded = await loadFont(pdf, '/fonts/arialuni.ttf', 'ArialUnicodeMS');

            pdf.setFontSize(18);
            pdf.setFont(fontLoaded ? 'ArialUnicodeMS' : 'times', 'bold');
            pdf.text('MegaTrip - Hóa Đơn & Vé Điện Tử', 20, yPosition);
            yPosition += 10;
            pdf.setFontSize(12);
            pdf.setFont(fontLoaded ? 'ArialUnicodeMS' : 'times', 'normal');
            pdf.text('Địa chỉ: 123 Đường ABC, Quận XYZ, TP.HCM', 20, yPosition);
            yPosition += 5;
            pdf.text('Hotline: 1900 1234 | Email: support@MegaTrip.com', 20, yPosition);
            yPosition += 5;
            pdf.text('Website: www.MegaTrip.com', 20, yPosition);
            yPosition += 15;

            pdf.setFontSize(14);
            pdf.setFont(fontLoaded ? 'ArialUnicodeMS' : 'times', 'bold');

            if (order.changeCalendar) {
                // Handle đổi lịch
                pdf.text('Thông Tin Đổi Lịch', 20, yPosition);
                yPosition += 10;
                pdf.setFontSize(10);
                pdf.setFont(fontLoaded ? 'ArialUnicodeMS' : 'times', 'normal');
                pdf.text(`Mã đơn hàng gốc: ${order.orderNumber}`, 20, yPosition);
                yPosition += 5;
                pdf.text(`Ngày đặt gốc: ${new Date(order.createdAt).toLocaleDateString('vi-VN')}`, 20, yPosition);
                yPosition += 5;
                pdf.text(`Ngày đổi: ${order.inforChangeCalendar?.data?.changeDate || 'N/A'}`, 20, yPosition);
                yPosition += 5;
                pdf.text(`Ghi chú: ${order.inforChangeCalendar?.data?.note || 'N/A'}`, 20, yPosition);
                yPosition += 5;
                pdf.text(`Phí đổi lịch: ${formatPrice(order.inforChangeCalendar?.penalty || 0)}`, 20, yPosition);
                yPosition += 5;
                pdf.text(`Tổng thanh toán cho đổi: ${formatPrice(order.inforChangeCalendar?.totalpayforChange || 0)}`, 20, yPosition);
                yPosition += 5;
                // pdf.text(`Giá mới: ${formatPrice(order.inforChangeCalendar?.newPrice || order.total)}`, 20, yPosition);
                yPosition += 10;
            } else {
                // Handle thanh toán bình thường
                pdf.text('Thông Tin Đơn Hàng', 20, yPosition);
                yPosition += 10;
                pdf.setFontSize(10);
                pdf.setFont(fontLoaded ? 'ArialUnicodeMS' : 'times', 'normal');
                pdf.text(`Mã đơn hàng: ${order.orderNumber}`, 20, yPosition);
                yPosition += 5;
                pdf.text(`Ngày đặt: ${new Date(order.createdAt).toLocaleDateString('vi-VN')}`, 20, yPosition);
                yPosition += 5;
                pdf.text(`Khách hàng: ${order.customerName}`, 20, yPosition);
                yPosition += 5;
                pdf.text(`Email: ${order.customerEmail}`, 20, yPosition);
                yPosition += 5;
                pdf.text(`Số điện thoại: ${order.customerPhone}`, 20, yPosition);
                yPosition += 10;
            }

            const tableFont = fontLoaded ? 'ArialUnicodeMS' : 'times';
            pdf.setFont(tableFont);
            const tableColumns = ['STT', 'Tên sản phẩm', 'Số lượng', 'Đơn giá', 'Thành tiền'];
            let tableRows;
            if (order.changeCalendar) {
                // Chỉ hiện phí đổi lịch
                tableRows = [
                    [1, 'Phí đổi lịch', 1, formatPrice(order.inforChangeCalendar?.totalpayforChange || 0), formatPrice(order.inforChangeCalendar?.totalpayforChange || 0)]
                ];
            } else {
                // Hiện items bình thường
                tableRows = order.items.map((item: any, index: number) => [
                    index + 1,
                    item.name || item.itemId,
                    item.quantity,
                    formatPrice(item.unitPrice),
                    formatPrice(item.subtotal),
                ]);
            }

            try {
                autoTable(pdf, {
                    head: [tableColumns],
                    body: tableRows,
                    startY: yPosition,
                    theme: 'grid',
                    styles: { fontSize: 8, cellPadding: 2, font: tableFont },
                    headStyles: { fillColor: [41, 128, 185], textColor: 255, font: tableFont },
                    alternateRowStyles: { fillColor: [245, 245, 245] },
                });
                yPosition = (pdf as any).lastAutoTable.finalY + 10;
            } catch (e) {
                console.error('Error creating table:', e);
                pdf.setFontSize(10);
                pdf.setFont(fontLoaded ? 'ArialUnicodeMS' : 'times', 'normal');
                pdf.text('Chi tiết items:', 20, yPosition);
                yPosition += 10;
                order.items.forEach((item: any, index: number) => {
                    pdf.text(`${index + 1}. ${item.name || item.itemId} - SL: ${item.quantity} - Giá: ${formatPrice(item.unitPrice)} - Tổng: ${formatPrice(item.subtotal)}`, 20, yPosition);
                    yPosition += 5;
                });
                yPosition += 10;
            }

            pdf.setFontSize(12);
            pdf.setFont(fontLoaded ? 'ArialUnicodeMS' : 'times', 'bold');
            const totalToShow = order.changeCalendar ? (order.inforChangeCalendar?.totalpayforChange || 0) : order.total;
            pdf.text(`Tổng tiền: ${formatPrice(totalToShow)}`, 140, yPosition);
            yPosition += 5;

            pdf.line(20, yPosition, 190, yPosition);
            yPosition += 10;

            pdf.setFontSize(14);
            pdf.setFont(fontLoaded ? 'ArialUnicodeMS' : 'times', 'bold');
            pdf.text('Vé Điện Tử', 20, yPosition);
            yPosition += 10;

            for (let i = 0; i < tickets.length; i++) {
                const ticketElement :any = ticketRefs.current[i];
                console.log(`Attempting to capture ref ${i}:`, ticketElement);
                if (ticketElement ) {
                    try {
                        const canvas = await html2canvas(ticketElement, {
                            scale: 4,
                            useCORS: true,
                            allowTaint: false,
                            backgroundColor: '#ffffff',
                            logging: true,
                            width: ticketElement.scrollWidth + 10,
                            height: ticketElement.scrollHeight + 10,
                            // timeout: 10000, // Remove invalid timeout option
                            ignoreElements: (element) => element.tagName === 'SCRIPT' || element.tagName === 'STYLE',
                            onclone: (clonedDoc) => {
                                const clonedElement: any = clonedDoc.querySelector(`.ve-dien-tu-${i}`);
                                if (clonedElement) {
                                    clonedElement.style.visibility = 'visible';
                                    clonedElement.style.display = 'block';
                                    clonedElement.style.padding = '0px';
                                    clonedElement.style.border = '1px solid #000'; // Add border để force hiện
                                }
                            },
                        });
                        const imgData = canvas.toDataURL('image/png');
                        const imgWidth = 170;
                        const imgHeight = (canvas.height * imgWidth) / canvas.width;
                        if (yPosition + imgHeight > 280) {
                            pdf.addPage();
                            yPosition = 20;
                        }
                        pdf.addImage(imgData, 'PNG', 20, yPosition, imgWidth, imgHeight);
                        yPosition += imgHeight + 10;
                        console.log(`Successfully captured vé ${i + 1}`);
                    } catch (e) {
                        console.error('Error capturing VeDienTu:', e);
                        // Fallback text, update để dùng ticket data
                        pdf.setFontSize(12);
                        pdf.setFont(fontLoaded ? 'ArialUnicodeMS' : 'times', 'bold');
                        pdf.text(`Vé Điện Tử - ${tickets[i].ticketNumber || tickets[i]._id}`, 20, yPosition);
                        yPosition += 8;
                        pdf.setFontSize(10);
                        pdf.setFont(fontLoaded ? 'ArialUnicodeMS' : 'times', 'normal');

                        let passenger: any = {};
                        if (typeof tickets[i].passenger === 'string') {
                            try {
                                passenger = JSON.parse(tickets[i].passenger);
                            } catch (e) {
                                console.error('Error parsing passenger string:', e);
                                passenger = {};
                            }
                        } else if (typeof tickets[i].passenger === 'object') {
                            passenger = tickets[i].passenger || {};
                        }

                        pdf.text(`Hành khách: ${passenger.firstName || passenger.name || ''} ${passenger.lastName || ''}`, 20, yPosition);
                        yPosition += 5;
                        pdf.text(`Ngày khởi hành: ${tickets[i].travelDate || 'N/A'}`, 20, yPosition); // Dùng travelDate mới
                        yPosition += 5;
                        pdf.text(`Giờ khởi hành: ${tickets[i].travelStart ? new Date(tickets[i].travelStart).toLocaleString('vi-VN') : 'N/A'}`, 20, yPosition); // Dùng travelStart mới
                        yPosition += 5;
                        pdf.text(`Số ghế: ${tickets[i].seats?.join(', ') || 'N/A'}`, 20, yPosition);
                        yPosition += 5;
                        pdf.text(`Trạng thái: ${tickets[i].status}`, 20, yPosition);
                        yPosition += 5;
                        pdf.text(`Mã đặt chỗ: ${order.orderNumber}`, 20, yPosition);
                        yPosition += 10;
                    }
                } else {
                    console.warn(`Ref .ve-dien-tu-${i} not found`);
                    // Fallback text, update để dùng ticket data
                    pdf.setFontSize(12);
                    pdf.setFont(fontLoaded ? 'ArialUnicodeMS' : 'times', 'bold');
                    pdf.text(`Vé Điện Tử - ${tickets[i].ticketNumber || tickets[i]._id}`, 20, yPosition);
                    yPosition += 8;
                    pdf.setFontSize(10);
                    pdf.setFont(fontLoaded ? 'ArialUnicodeMS' : 'times', 'normal');

                    let passenger: any = {};
                    if (typeof tickets[i].passenger === 'string') {
                        try {
                            passenger = JSON.parse(tickets[i].passenger);
                        } catch (e) {
                            console.error('Error parsing passenger string:', e);
                            passenger = {};
                        }
                    } else if (typeof tickets[i].passenger === 'object') {
                        passenger = tickets[i].passenger || {};
                    }

                    pdf.text(`Hành khách: ${passenger.firstName || passenger.name || ''} ${passenger.lastName || ''}`, 20, yPosition);
                    yPosition += 5;
                    pdf.text(`Ngày khởi hành: ${tickets[i].travelDate || 'N/A'}`, 20, yPosition); // Dùng travelDate mới
                    yPosition += 5;
                    pdf.text(`Giờ khởi hành: ${tickets[i].travelStart ? new Date(tickets[i].travelStart).toLocaleString('vi-VN') : 'N/A'}`, 20, yPosition); // Dùng travelStart mới
                    yPosition += 5;
                    pdf.text(`Số ghế: ${tickets[i].seats?.join(', ') || 'N/A'}`, 20, yPosition);
                    yPosition += 5;
                    pdf.text(`Trạng thái: ${tickets[i].status}`, 20, yPosition);
                    yPosition += 5;
                    pdf.text(`Mã đặt chỗ: ${order.orderNumber}`, 20, yPosition);
                    yPosition += 10;
                }
            }

            const pageHeight = pdf.internal.pageSize.height;
            pdf.setFontSize(8);
            pdf.setFont(fontLoaded ? 'ArialUnicodeMS' : 'times', 'normal');
            pdf.text('Cảm ơn bạn đã sử dụng dịch vụ của MegaTrip!', 20, pageHeight - 20);
            pdf.text('Vui lòng mang theo vé điện tử khi sử dụng dịch vụ.', 20, pageHeight - 15);

            pdf.save(`hoa-don-ve-dien-tu-${order.orderNumber}.pdf`);
        }
        finally {
            setIsGeneratingPDF(false);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price);
    };

    // Thêm useEffect riêng để auto download nếu extraData === 'download'
    useEffect(() => {
        if (!isLoading && order && tickets.length > 0) {
            let shouldDownload = false;
            if (extraData) {
                try {
                    const parsed = JSON.parse(decodeURIComponent(extraData));
                    if (parsed.download) {
                        shouldDownload = true;
                        setIsDownloadMode(true);
                    }
                        
                        
                } catch (e) {
                    // Nếu không parse được, check string cũ
                    if (extraData === 'download') {
                        shouldDownload = true;
                        setIsDownloadMode(true);
                    }
                }
            }
            if (shouldDownload) {
                setTimeout(() => {
                    generatePDF();
                }, 1000);
            }
        }
    }, [isLoading, order, tickets, extraData]);

    useEffect(() => {
        if (!orderId) {
            setError('Không tìm thấy mã đơn hàng');
            setIsLoading(false);
            return;
        }

        let actualOrderId = orderId;
        if (orderId.startsWith('ORD_FORCHANGE_') && extraData) {
            try {
                const parsedExtraData = JSON.parse(decodeURIComponent(extraData));
                if (parsedExtraData.originalOrder) {
                    actualOrderId = parsedExtraData.originalOrder;
                }
            } catch (e) {
                console.error('Error parsing extraData:', e);
            }
        }

        const fetchOrderDetails = async () => {
            try {
                const response = await fetch(`http://localhost:8080/api/orders/${actualOrderId}/details`);
                if (!response.ok) throw new Error('Không thể tải thông tin đơn hàng');
                const data = await response.json();
                setOrder(data.order);
                setTickets(data.tickets || []);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrderDetails();
    }, [orderId, extraData]);

    if (isLoading) {
        return (
            <div className="container py-8">
                <div className="max-w-4xl mx-auto text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p>Đang tải thông tin đơn hàng...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container py-8">
                <div className="max-w-4xl mx-auto text-center">
                    <p className="text-red-600">{error}</p>
                    <Button asChild className="mt-4">
                        <Link href="/">Về trang chủ</Link>
                    </Button>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="container py-8">
                <div className="max-w-4xl mx-auto text-center">
                    <p>Không tìm thấy đơn hàng</p>
                    <Button asChild className="mt-4">
                        <Link href="/">Về trang chủ</Link>
                    </Button>
                </div>
            </div>
        );
    }

    // const bookingType = order.items?.[0]?.type || 'tour';
    // const bookingData = {
    //     type: bookingType,
    //     details: order.metadata?.bookingDataSnapshot?.details || {},
    //     pricing: order.metadata?.bookingDataSnapshot?.pricing || {},
    // };
    // const passengers = order.metadata?.bookingDataSnapshot?.details?.passengers || [];

    const bookingType = order.items?.[0]?.type || 'tour';
    const bookingData = {
        type: bookingType,
        details: order.metadata?.bookingDataSnapshot?.details || {},
        pricing: order.metadata?.bookingDataSnapshot?.pricing || {},
    };
    const passengers = order.metadata?.bookingDataSnapshot?.details?.passengers || [];

    // Nếu là đổi lịch flight, update bookingData.details.flights từ selectedOption trong inforChangeCalendar
    if (order.changeCalendar && bookingType === 'flight') {
        const selectedOption = order.inforChangeCalendar?.data?.meta?.selectedOption;
        if (selectedOption) {
            bookingData.details.flights = {
                outbound: {
                    flightNumber: selectedOption.flightNumber,
                    route: `${selectedOption.departure.airport} → ${selectedOption.arrival.airport}`,
                    date: selectedOption.departure.date,
                    time: selectedOption.time,
                    airline: selectedOption.airline,
                    // Thêm các field khác nếu cần, như duration, aircraft, etc.
                    duration: selectedOption.duration,
                    aircraft: selectedOption.aircraft,
                },
                inbound: null, // Giả sử one-way, hoặc thêm nếu có
            };
        }
    }
    return (
        <div className="container py-8">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                        {isDownloadMode ? (
                            <Download className="h-8 w-8 text-green-600" />
                        ) : (
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        )}
                    </div>
                    <h1 className="text-3xl font-bold text-green-600 mb-2">
                        {isDownloadMode ? 'Tải Vé Điện Tử' : (orderId!.startsWith('ORD_FORCHANGE_') ? 'Giao dịch đổi lịch thành công!' : 'Giao dịch thành công!')}
                    </h1>
                   
                    <p className="text-lg text-muted-foreground">
                        Cảm ơn bạn đã tin tưởng MegaTrip. 
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        {tickets.map((ticket, index) => {
                            let passengerObj = {};
                            try {
                                passengerObj = typeof ticket.passenger === 'string' ? JSON.parse(ticket.passenger) : ticket.passenger;
                            } catch (e) {
                                console.error('Error parsing passenger:', e);
                            }

                            return (
                                <VeDienTu
                                    key={ticket._id}
                                    ref={(el) => { ticketRefs.current[index] = el; }}
                                    className={`ve-dien-tu-${index}`}
                                    bookingType={bookingType}
                                    bookingData={bookingData}
                                    passengers={[passengerObj]}
                                    ticket={ticket}
                                    countdown={undefined}
                                    expired={false}
                                    bookingCode={order.orderNumber}
                                    status={ticket.status}
                                />
                            );
                        })}
                    </div>
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Vé điện tử</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg">
                                    <Mail className="h-4 w-4 text-green-600 mt-0.5" />
                                    <div className="text-sm">
                                        <div className="font-medium text-green-800">Email đã được gửi</div>
                                        <div className="text-green-600">{order.customerEmail}</div>
                                    </div>
                                </div>
                                <Button className="w-full" variant="outline" onClick={generatePDF} disabled={isGeneratingPDF}>
                                    {isGeneratingPDF ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Đang tải vé...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="h-4 w-4 mr-2" />
                                            Tải vé điện tử (PDF)
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Lưu ý quan trọng</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3 text-sm">
                                    {bookingType === 'flight' && (
                                        <>
                                            <div className="flex items-start gap-2">
                                                <Calendar className="h-4 w-4 text-blue-500 mt-0.5" />
                                                <div>
                                                    <div className="font-medium">Check-in online</div>
                                                    <div className="text-muted-foreground">
                                                        24h trước giờ bay trên website Vietnam Airlines
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <FileText className="h-4 w-4 text-purple-500 mt-0.5" />
                                                <div>
                                                    <div className="font-medium">Giấy tờ tùy thân</div>
                                                    <div className="text-muted-foreground">
                                                        Mang theo CCCD/CMND còn hạn khi đi máy bay
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <Plane className="h-4 w-4 text-green-500 mt-0.5" />
                                                <div>
                                                    <div className="font-medium">Có mặt tại sân bay</div>
                                                    <div className="text-muted-foreground">
                                                        Trước 2h đối với chuyến bay nội địa
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                    {bookingType === 'bus' && (
                                        <>
                                            <div className="flex items-start gap-2">
                                                <Calendar className="h-4 w-4 text-blue-500 mt-0.5" />
                                                <div>
                                                    <div className="font-medium">Giờ xuất phát</div>
                                                    <div className="text-muted-foreground">
                                                        Có mặt tại bến xe trước 30 phút
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <FileText className="h-4 w-4 text-purple-500 mt-0.5" />
                                                <div>
                                                    <div className="font-medium">Điểm đón/trả</div>
                                                    <div className="text-muted-foreground">
                                                        Kiểm tra điểm đón/trả trên vé điện tử
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <Users className="h-4 w-4 text-green-500 mt-0.5" />
                                                <div>
                                                    <div className="font-medium">Giấy tờ tùy thân</div>
                                                    <div className="text-muted-foreground">
                                                        Mang theo CCCD/CMND còn hạn
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                    {bookingType === 'tour' && (
                                        <>
                                            <div className="flex items-start gap-2">
                                                <Calendar className="h-4 w-4 text-blue-500 mt-0.5" />
                                                <div>
                                                    <div className="font-medium">Điểm tập trung</div>
                                                    <div className="text-muted-foreground">
                                                        Có mặt đúng giờ tại điểm tập trung
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <FileText className="h-4 w-4 text-purple-500 mt-0.5" />
                                                <div>
                                                    <div className="font-medium">Giấy tờ tùy thân</div>
                                                    <div className="text-muted-foreground">
                                                        Mang theo CCCD/CMND còn hạn
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <Plane className="h-4 w-4 text-green-500 mt-0.5" />
                                                <div>
                                                    <div className="font-medium">Lịch trình</div>
                                                    <div className="text-muted-foreground">
                                                        Kiểm tra lịch trình chi tiết trên email
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Thao tác nhanh</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Button variant="outline" className="w-full" asChild>
                                    <Link prefetch={false} href="/tai-khoan">
                                        <List className="h-4 w-4 mr-2" />
                                        Xem đơn hàng của tôi
                                    </Link>
                                </Button>
                                <Button variant="outline" className="w-full" asChild>
                                    <Link prefetch={false} href="/">
                                        <Home className="h-4 w-4 mr-2" />
                                        Về trang chủ
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Cần hỗ trợ?</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-green-500" />
                                        <div>
                                            <div className="font-medium">Hotline 24/7</div>
                                            <div className="text-primary">1900 1234</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-blue-500" />
                                        <div>
                                            <div className="font-medium">Email hỗ trợ</div>
                                            <div className="text-primary">support@MegaTrip.com</div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
export default withSuspense(ThanhToanThanhCong);