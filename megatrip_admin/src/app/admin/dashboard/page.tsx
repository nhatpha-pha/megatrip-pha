"use client"
import { useState, useEffect } from "react";
import {
    TrendingUp,
    TrendingDown,
    Users,
    Plane,
    ShoppingBag,
    DollarSign,
    Calendar,
    Clock,
    AlertCircle,
    Download,
    Filter,
    Eye,
    MoreHorizontal,
    MapPin,
    Bus,
    Star,
    Loader
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../../components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "../../components/ui/table";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Xóa mock data, thay bằng state
// const kpiData = [...]; // Removed
// const revenueData = [...]; // Removed
// const serviceDistribution = [...]; // Removed
// const topServices = [...]; // Removed
// const recentActivities = [...]; // Removed

const getServiceIcon = (type: string) => {
    switch (type) {
        case "flight":
            return <Plane className="w-4 h-4" />;
        case "bus":
            return <Bus className="w-4 h-4" />;
        case "tour":
            return <MapPin className="w-4 h-4" />;
        default:
            return null;
    }
};

const getServiceType = (type: string) => {
    switch (type) {
        case "flight":
            return "Chuyến bay";
        case "bus":
            return "Vé xe";
        case "tour":
            return "Tour du lịch";
        default:
            return type;
    }
};

const getTrendIcon = (trend: string) => {
    return trend === "up" ? (
        <TrendingUp className="w-4 h-4 text-green-600" />
    ) : (
        <TrendingDown className="w-4 h-4 text-red-600" />
    );
};

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN').format(value);
};
// Add interface for KPIItem
interface KPIItem {
    title: string;
    value: string;
    unit: string;
    change: string;
    trend: "up" | "down";
    icon: React.ComponentType<{ className?: string }>;
    period: string;
}
export default function Dashboard() {
    const [dateRange, setDateRange] = useState("today");
    const [serviceFilter, setServiceFilter] = useState("all");

    // States cho data từ API
    const [kpiData, setKpiData] = useState<KPIItem[]>([]);
    const [revenueData, setRevenueData] = useState([]);
    const [serviceDistribution, setServiceDistribution] = useState([]);
    const [topServices, setTopServices] = useState([]);
    const [recentActivities, setRecentActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalOrders, setTotalOrders] = useState(0);


    // Hàm tính start/end từ dateRange theo giờ VN
    const getDateRange = (range: string) => {
        const now = new Date();
        const vnOffset = 7 * 60 * 60 * 1000; // Offset +7 giờ cho VN
        let start: Date;
        switch (range) {
            case "7d":
                start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case "30d":
                start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case "90d":
                start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            case "1y":
                start = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
                break;
            case "today":
                start = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Từ 00:00 hôm nay
                break;
            default:
                start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }
        // Chuyển start/end sang giờ VN trước khi gửi
        start = new Date(start.getTime() + vnOffset);
        const end = new Date(now.getTime() + vnOffset);
        return { start: start.toISOString(), end: end.toISOString() };
    };

    // Fetch data từ API
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const { start, end } = getDateRange(dateRange);

                // Fetch dashboard stats
                const dashboardRes = await fetch(`http://localhost:8080/api/stats/dashboard?start=${start}&end=${end}`);
                const dashboardData = await dashboardRes.json();

                // Tính KPI từ dashboardData
                const totalRevenue = dashboardData.totalRevenue || 0;
                const totalOrdersValue = dashboardData.totalOrders || 0;
                setTotalOrders(totalOrdersValue);
                const revenueChange = dashboardData.revenueComparison?.changePercent || 0;
                const newKpiData: KPIItem[] = [
                    {
                        title: "Tổng doanh thu",
                        value: formatCurrency(totalRevenue),
                        unit: "VNĐ",
                        change: `${revenueChange > 0 ? '+' : ''}${revenueChange}%`,
                        trend: revenueChange > 0 ? "up" : "down",
                        icon: DollarSign,
                        period: "so với kỳ trước"
                    },
                    {
                        title: "Tổng đơn hàng",
                        value: totalOrdersValue.toString(),
                        unit: "đơn",
                        change: "+12.5%", // Placeholder, có thể tính từ data nếu có
                        trend: "up",
                        icon: ShoppingBag,
                        period: "so với tháng trước"
                    },
                    
                    {
                        title: "Dịch vụ đang bán",
                        value: (dashboardData.totalProducts?.tours || 0) + (dashboardData.totalProducts?.buses || 0),
                        unit: "dịch vụ",
                        change: "-2.3%",
                        trend: "down",
                        icon: Plane,
                        period: "so với tháng trước"
                    }
                ];
                setKpiData(newKpiData);

                // Fetch revenue stats
                const revenueRes = await fetch(`http://localhost:8080/api/stats/revenue?start=${start}&end=${end}`);
                const revenueStats = await revenueRes.json();
                setRevenueData(revenueStats.revenueOverTime || []);
                setServiceDistribution(revenueStats.revenueByType?.map((item: any) => ({
                    name: item._id === 'flight' ? 'Vé máy bay' : item._id === 'tour' ? 'Tour du lịch' : 'Vé xe khách',
                    value: item.revenue,
                    color: item._id === 'flight' ? '#1E88E5' : item._id === 'tour' ? '#FFC107' : '#4CAF50'
                })) || []);

                // Fetch product stats
                const productRes = await fetch(`http://localhost:8080/api/stats/products?start=${start}&end=${end}`);
                const productStats = await productRes.json();
                setTopServices(productStats.topBookedProducts?.slice(0, 5).map((item: any) => ({
                    id: item._id,
                    name: item.name,
                    type: item.type,
                    bookings: item.bookings,
                    revenue: formatCurrency(item.revenue),
                    trend: "up", // Placeholder
                    growth: "+15%" // Placeholder
                })) || []);

                // Fetch activities
                const activitiesRes = await fetch(`http://localhost:8080/api/stats/activities?start=${start}&end=${end}`);
                const activitiesData = await activitiesRes.json();
                setRecentActivities(activitiesData.activities || []);

            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [dateRange]);

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center">
                <Loader className="animate-spin w-6 h-6 mr-2" />
                Đang tải dữ liệu...
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 bg-gray-50">
            {/* Page header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard tổng quan</h1>
                    <p className="text-gray-600 mt-1">
                        Theo dõi hiệu suất kinh doanh và hoạt động hệ thống
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    <Select value={dateRange} onValueChange={setDateRange}>
                        <SelectTrigger className="w-40 bg-white">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7d">7 ngày qua</SelectItem>
                            <SelectItem value="30d">30 ngày qua</SelectItem>
                            <SelectItem value="90d">3 tháng qua</SelectItem>
                            <SelectItem value="1y">1 năm qua</SelectItem>
                            <SelectItem value="today">Ngày hôm nay</SelectItem>
                        </SelectContent>
                    </Select>
                    {/* <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Xuất báo cáo
                    </Button> */}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {kpiData.map((kpi:any, index) => (
                    <Card key={index} className="hover:shadow-lg transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">
                                {kpi.title}
                            </CardTitle>
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                <kpi.icon className="h-5 w-5 text-primary" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900">
                                {kpi.value}
                                <span className="text-sm font-normal text-gray-500 ml-1">{kpi.unit}</span>
                            </div>
                            {/* <div className="flex items-center space-x-2 text-xs mt-2">
                                {getTrendIcon(kpi.trend)}
                                <span className={kpi.trend === "up" ? "text-green-600" : "text-red-600"}>
                                    {kpi.change}
                                </span>
                                <span className="text-gray-500">{kpi.period}</span>
                            </div> */}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Chart */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Biểu đồ doanh thu</CardTitle>
                                <CardDescription>Doanh thu theo từng loại dịch vụ qua các tháng</CardDescription>
                            </div>
                            {/* <Select value={serviceFilter} onValueChange={setServiceFilter}>
                                <SelectTrigger className="w-36 bg-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả</SelectItem>
                                    <SelectItem value="flights">Vé máy bay</SelectItem>
                                    <SelectItem value="tours">Tour du lịch</SelectItem>
                                    <SelectItem value="buses">Vé xe</SelectItem>
                                </SelectContent>
                            </Select> */}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={revenueData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="period" />
                                <YAxis tickFormatter={(value) => `${formatCurrency(value / 1000000000)}B`} />
                                <Tooltip
                                    formatter={(value: number) => [`${formatCurrency(value)} VNĐ`, ""]}
                                    labelFormatter={(label) => `Tháng ${label}`}
                                />
                                <Legend />
                                <Bar dataKey="flight" stackId="a" fill="#1E88E5" name="Vé máy bay" />
                                <Bar dataKey="tour" stackId="a" fill="#FFC107" name="Tour du lịch" />
                                <Bar dataKey="bus" stackId="a" fill="#4CAF50" name="Vé xe" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Service Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle>Phân bổ doanh thu</CardTitle>
                        <CardDescription>Tỷ lệ doanh thu theo loại dịch vụ</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={350}>
                            <PieChart>
                                <Pie
                                    data={serviceDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={120}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {serviceDistribution.map((entry:any, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => `${formatCurrency(value)} VNĐ`} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Services */}
                <Card>
                    <CardHeader>
                        <CardTitle>Top 5 dịch vụ bán chạy</CardTitle>
                        <CardDescription>Dựa trên số lượt đặt và doanh thu</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {topServices.map((service:any, index) => (
                                <div key={service.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                            {getServiceIcon(service.type)}
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900">{service.name}</div>
                                            <div className="text-sm text-gray-500">{getServiceType(service.type)}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {/* <div className="font-medium text-gray-900">{service.bookings} lượt đặt</div>
                                        <div className="text-sm text-gray-500">{service.revenue} VNĐ</div>
                                        <div className={`text-xs flex items-center ${service.trend === "up" ? "text-green-600" : "text-red-600"
                                            }`}>
                                            {getTrendIcon(service.trend)}
                                            <span className="ml-1">{service.growth}</span>
                                        </div> */}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Activities */}
                <Card>
                    <CardHeader>
                        <CardTitle>Hoạt động gần đây</CardTitle>
                        <CardDescription>Thông báo và cập nhật mới nhất</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentActivities.map((activity:any) => (
                                <div key={activity.id} className={`flex items-start space-x-3 p-3 rounded-lg ${activity.urgent ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50'
                                    }`}>
                                    {/* Thêm icon cho loại dịch vụ nếu là order */}
                                    {(activity.type === 'order' || activity.type === 'cancelled') && activity.serviceType && (
                                        <div className="w-4 h-4 mt-1">
                                            {getServiceIcon(activity.serviceType)}
                                        </div>
                                    )}
                                    <div className={`w-2 h-2 rounded-full mt-2 ${activity.urgent ? 'bg-orange-500' : 'bg-primary'
                                        }`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-900">{activity.message}</p>
                                        <div className="flex items-center justify-between mt-1">
                                            <p className="text-xs text-gray-500">{activity.customer}</p>
                                            {activity.amount && (
                                                <span className="text-xs font-medium text-green-600">{activity.amount}</span>
                                            )}
                                        </div>
                                        <div className="flex items-center text-xs text-gray-500 mt-1">
                                            <Clock className="w-3 h-3 mr-1" />
                                            {activity.time}
                                        </div>
                                    </div>
                                    {activity.urgent && (
                                        <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
                                            Khẩn cấp
                                        </Badge>
                                    )}
                                </div>
                            ))}
                        </div>
                        {/* <div className="mt-4">
                            <Button variant="outline" className="w-full">
                                <Eye className="w-4 h-4 mr-2" />
                                Xem tất cả hoạt động
                            </Button>
                        </div> */}
                    </CardContent>
                </Card>
            </div>

            {/* Quick Stats Summary */}
            <Card>
                <CardHeader>
                    <CardTitle>Tóm tắt nhanh hôm nay</CardTitle>
                    <CardDescription>Các chỉ số quan trọng trong ngày</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">{totalOrders}</div>
                            <div className="text-sm text-blue-600">Đơn hàng mới</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">95%</div>
                            <div className="text-sm text-green-600">Tỷ lệ thanh toán</div>
                        </div>
                        <div className="text-center p-4 bg-yellow-50 rounded-lg">
                            <div className="text-2xl font-bold text-yellow-600">23</div>
                            <div className="text-sm text-yellow-600">Hỗ trợ chờ xử lý</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <div className="text-2xl font-bold text-purple-600">4.8</div>
                            <div className="text-sm text-purple-600">Đánh giá trung bình</div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}