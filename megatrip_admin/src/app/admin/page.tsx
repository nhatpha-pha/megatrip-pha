import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/admin/dashboard');
}

// import { useState } from "react";
// import {
//   TrendingUp,
//   TrendingDown,
//   Users,
//   Plane,
//   ShoppingBag,
//   DollarSign,
//   Calendar,
//   Clock,
//   AlertCircle,
//   Download,
//   Filter,
//   Eye,
//   MoreHorizontal,
//   MapPin,
//   Bus,
//   Star
// } from "lucide-react";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
// import { Badge } from "../components/ui/badge";
// import { Button } from "../components/ui/button";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "../components/ui/select";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "../components/ui/dropdown-menu";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow
// } from "../components/ui/table";
// import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// const kpiData = [
//   {
//     title: "Tổng doanh thu",
//     value: "12,450,000,000",
//     unit: "VNĐ",
//     change: "+18.2%",
//     trend: "up",
//     icon: DollarSign,
//     period: "so với tháng trước"
//   },
//   {
//     title: "Tổng đơn hàng",
//     value: "3,847",
//     unit: "đơn",
//     change: "+12.5%",
//     trend: "up",
//     icon: ShoppingBag,
//     period: "so với tháng trước"
//   },
//   {
//     title: "Khách hàng mới",
//     value: "1,284",
//     unit: "người",
//     change: "+8.1%",
//     trend: "up",
//     icon: Users,
//     period: "trong tháng này"
//   },
//   {
//     title: "Dịch vụ đang bán",
//     value: "456",
//     unit: "dịch vụ",
//     change: "-2.3%",
//     trend: "down",
//     icon: Plane,
//     period: "so với tháng trước"
//   }
// ];

// const revenueData = [
//   { month: 'T1', total: 8500000000, flights: 4200000000, tours: 2800000000, buses: 1500000000 },
//   { month: 'T2', total: 9200000000, flights: 4600000000, tours: 3100000000, buses: 1500000000 },
//   { month: 'T3', total: 10100000000, flights: 5100000000, tours: 3200000000, buses: 1800000000 },
//   { month: 'T4', total: 11200000000, flights: 5600000000, tours: 3700000000, buses: 1900000000 },
//   { month: 'T5', total: 10800000000, flights: 5300000000, tours: 3600000000, buses: 1900000000 },
//   { month: 'T6', total: 12450000000, flights: 6200000000, tours: 4050000000, buses: 2200000000 },
// ];

// const serviceDistribution = [
//   { name: 'Vé máy bay', value: 6200000000, color: '#1E88E5' },
//   { name: 'Tour du lịch', value: 4050000000, color: '#FFC107' },
//   { name: 'Vé xe khách', value: 2200000000, color: '#4CAF50' },
// ];

// const topServices = [
//   {
//     id: "SV001",
//     name: "TP.HCM → Hà Nội",
//     type: "flight",
//     bookings: 456,
//     revenue: "6,200,000,000",
//     trend: "up",
//     growth: "+15%"
//   },
//   {
//     id: "SV002",
//     name: "Tour Hạ Long 3N2Đ",
//     type: "tour",
//     bookings: 234,
//     revenue: "4,050,000,000",
//     trend: "up",
//     growth: "+22%"
//   },
//   {
//     id: "SV003",
//     name: "TP.HCM → Đà Lạt",
//     type: "bus",
//     bookings: 342,
//     revenue: "2,200,000,000",
//     trend: "up",
//     growth: "+8%"
//   },
//   {
//     id: "SV004",
//     name: "Hà Nội → Đà Nẵng",
//     type: "flight",
//     bookings: 187,
//     revenue: "1,850,000,000",
//     trend: "down",
//     growth: "-5%"
//   },
//   {
//     id: "SV005",
//     name: "Tour Phú Quốc 4N3Đ",
//     type: "tour",
//     bookings: 156,
//     revenue: "1,560,000,000",
//     trend: "up",
//     growth: "+18%"
//   }
// ];

// const recentActivities = [
//   {
//     id: "ACT001",
//     type: "order",
//     message: "Đơn hàng #DH12345 vừa được thanh toán",
//     customer: "Nguyễn Văn An",
//     amount: "2,850,000 VNĐ",
//     time: "2 phút trước",
//     urgent: false
//   },
//   {
//     id: "ACT002",
//     type: "support",
//     message: "Yêu cầu hỗ trợ từ khách hàng cần xử lý",
//     customer: "Trần Thị Bình",
//     amount: null,
//     time: "5 phút trước",
//     urgent: true
//   },
//   {
//     id: "ACT003",
//     type: "order",
//     message: "Đơn hàng #DH12346 đã được xác nhận",
//     customer: "Lê Minh Cường",
//     amount: "1,200,000 VNĐ",
//     time: "12 phút trước",
//     urgent: false
//   },
//   {
//     id: "ACT004",
//     type: "system",
//     message: "Backup dữ liệu đã hoàn thành",
//     customer: "Hệ thống",
//     amount: null,
//     time: "1 giờ trước",
//     urgent: false
//   }
// ];

// const getServiceIcon = (type: string) => {
//   switch (type) {
//     case "flight":
//       return <Plane className="w-4 h-4" />;
//     case "bus":
//       return <Bus className="w-4 h-4" />;
//     case "tour":
//       return <MapPin className="w-4 h-4" />;
//     default:
//       return null;
//   }
// };

// const getServiceType = (type: string) => {
//   switch (type) {
//     case "flight":
//       return "Chuyến bay";
//     case "bus":
//       return "Vé xe";
//     case "tour":
//       return "Tour du lịch";
//     default:
//       return type;
//   }
// };

// const getTrendIcon = (trend: string) => {
//   return trend === "up" ? (
//     <TrendingUp className="w-4 h-4 text-green-600" />
//   ) : (
//     <TrendingDown className="w-4 h-4 text-red-600" />
//   );
// };

// const formatCurrency = (value: number) => {
//   return new Intl.NumberFormat('vi-VN').format(value);
// };

// export default function Dashboard() {
//   const [dateRange, setDateRange] = useState("30d");
//   const [serviceFilter, setServiceFilter] = useState("all");

//   return (
//     <div className="p-6 space-y-6 bg-gray-50">
//       {/* Page header */}
//       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900">Dashboard tổng quan</h1>
//           <p className="text-gray-600 mt-1">
//             Theo dõi hiệu suất kinh doanh và hoạt động hệ thống
//           </p>
//         </div>
//         <div className="flex items-center space-x-3">
//           <Select value={dateRange} onValueChange={setDateRange}>
//             <SelectTrigger className="w-40 bg-white">
//               <SelectValue />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="7d">7 ngày qua</SelectItem>
//               <SelectItem value="30d">30 ngày qua</SelectItem>
//               <SelectItem value="90d">3 tháng qua</SelectItem>
//               <SelectItem value="1y">1 năm qua</SelectItem>
//             </SelectContent>
//           </Select>
//           <Button variant="outline" size="sm">
//             <Download className="w-4 h-4 mr-2" />
//             Xuất báo cáo
//           </Button>
//         </div>
//       </div>

//       {/* KPI Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         {kpiData.map((kpi, index) => (
//           <Card key={index} className="hover:shadow-lg transition-shadow">
//             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//               <CardTitle className="text-sm font-medium text-gray-600">
//                 {kpi.title}
//               </CardTitle>
//               <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
//                 <kpi.icon className="h-5 w-5 text-primary" />
//               </div>
//             </CardHeader>
//             <CardContent>
//               <div className="text-2xl font-bold text-gray-900">
//                 {kpi.value}
//                 <span className="text-sm font-normal text-gray-500 ml-1">{kpi.unit}</span>
//               </div>
//               <div className="flex items-center space-x-2 text-xs mt-2">
//                 {getTrendIcon(kpi.trend)}
//                 <span className={kpi.trend === "up" ? "text-green-600" : "text-red-600"}>
//                   {kpi.change}
//                 </span>
//                 <span className="text-gray-500">{kpi.period}</span>
//               </div>
//             </CardContent>
//           </Card>
//         ))}
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//         {/* Revenue Chart */}
//         <Card className="lg:col-span-2">
//           <CardHeader>
//             <div className="flex items-center justify-between">
//               <div>
//                 <CardTitle>Biểu đồ doanh thu</CardTitle>
//                 <CardDescription>Doanh thu theo từng loại dịch vụ qua các tháng</CardDescription>
//               </div>
//               <Select value={serviceFilter} onValueChange={setServiceFilter}>
//                 <SelectTrigger className="w-36 bg-white">
//                   <SelectValue />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="all">Tất cả</SelectItem>
//                   <SelectItem value="flights">Vé máy bay</SelectItem>
//                   <SelectItem value="tours">Tour du lịch</SelectItem>
//                   <SelectItem value="buses">Vé xe</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>
//           </CardHeader>
//           <CardContent>
//             <ResponsiveContainer width="100%" height={350}>
//               <BarChart data={revenueData}>
//                 <CartesianGrid strokeDasharray="3 3" />
//                 <XAxis dataKey="month" />
//                 <YAxis tickFormatter={(value) => `${formatCurrency(value / 1000000000)}B`} />
//                 <Tooltip
//                   formatter={(value: number) => [`${formatCurrency(value)} VNĐ`, ""]}
//                   labelFormatter={(label) => `Tháng ${label}`}
//                 />
//                 <Legend />
//                 <Bar dataKey="flights" stackId="a" fill="#1E88E5" name="Vé máy bay" />
//                 <Bar dataKey="tours" stackId="a" fill="#FFC107" name="Tour du lịch" />
//                 <Bar dataKey="buses" stackId="a" fill="#4CAF50" name="Vé xe" />
//               </BarChart>
//             </ResponsiveContainer>
//           </CardContent>
//         </Card>

//         {/* Service Distribution */}
//         <Card>
//           <CardHeader>
//             <CardTitle>Phân bổ doanh thu</CardTitle>
//             <CardDescription>Tỷ lệ doanh thu theo loại dịch vụ</CardDescription>
//           </CardHeader>
//           <CardContent>
//             <ResponsiveContainer width="100%" height={350}>
//               <PieChart>
//                 <Pie
//                   data={serviceDistribution}
//                   cx="50%"
//                   cy="50%"
//                   innerRadius={60}
//                   outerRadius={120}
//                   paddingAngle={5}
//                   dataKey="value"
//                 >
//                   {serviceDistribution.map((entry, index) => (
//                     <Cell key={`cell-${index}`} fill={entry.color} />
//                   ))}
//                 </Pie>
//                 <Tooltip formatter={(value: number) => `${formatCurrency(value)} VNĐ`} />
//                 <Legend />
//               </PieChart>
//             </ResponsiveContainer>
//           </CardContent>
//         </Card>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         {/* Top Services */}
//         <Card>
//           <CardHeader>
//             <CardTitle>Top 5 dịch vụ bán chạy</CardTitle>
//             <CardDescription>Dựa trên số lượt đặt và doanh thu</CardDescription>
//           </CardHeader>
//           <CardContent>
//             <div className="space-y-4">
//               {topServices.map((service, index) => (
//                 <div key={service.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
//                   <div className="flex items-center space-x-3">
//                     <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
//                       {getServiceIcon(service.type)}
//                     </div>
//                     <div>
//                       <div className="font-medium text-gray-900">{service.name}</div>
//                       <div className="text-sm text-gray-500">{getServiceType(service.type)}</div>
//                     </div>
//                   </div>
//                   <div className="text-right">
//                     <div className="font-medium text-gray-900">{service.bookings} lượt đặt</div>
//                     <div className="text-sm text-gray-500">{service.revenue} VNĐ</div>
//                     <div className={`text-xs flex items-center ${service.trend === "up" ? "text-green-600" : "text-red-600"
//                       }`}>
//                       {getTrendIcon(service.trend)}
//                       <span className="ml-1">{service.growth}</span>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </CardContent>
//         </Card>

//         {/* Recent Activities */}
//         <Card>
//           <CardHeader>
//             <CardTitle>Hoạt động gần đây</CardTitle>
//             <CardDescription>Thông báo và cập nhật mới nhất</CardDescription>
//           </CardHeader>
//           <CardContent>
//             <div className="space-y-4">
//               {recentActivities.map((activity) => (
//                 <div key={activity.id} className={`flex items-start space-x-3 p-3 rounded-lg ${activity.urgent ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50'
//                   }`}>
//                   <div className={`w-2 h-2 rounded-full mt-2 ${activity.urgent ? 'bg-orange-500' : 'bg-primary'
//                     }`} />
//                   <div className="flex-1 min-w-0">
//                     <p className="text-sm text-gray-900">{activity.message}</p>
//                     <div className="flex items-center justify-between mt-1">
//                       <p className="text-xs text-gray-500">{activity.customer}</p>
//                       {activity.amount && (
//                         <span className="text-xs font-medium text-green-600">{activity.amount}</span>
//                       )}
//                     </div>
//                     <div className="flex items-center text-xs text-gray-500 mt-1">
//                       <Clock className="w-3 h-3 mr-1" />
//                       {activity.time}
//                     </div>
//                   </div>
//                   {activity.urgent && (
//                     <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
//                       Khẩn cấp
//                     </Badge>
//                   )}
//                 </div>
//               ))}
//             </div>
//             <div className="mt-4">
//               <Button variant="outline" className="w-full">
//                 <Eye className="w-4 h-4 mr-2" />
//                 Xem tất cả hoạt động
//               </Button>
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Quick Stats Summary */}
//       <Card>
//         <CardHeader>
//           <CardTitle>Tóm tắt nhanh hôm nay</CardTitle>
//           <CardDescription>Các chỉ số quan trọng trong ngày</CardDescription>
//         </CardHeader>
//         <CardContent>
//           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//             <div className="text-center p-4 bg-blue-50 rounded-lg">
//               <div className="text-2xl font-bold text-blue-600">147</div>
//               <div className="text-sm text-blue-600">Đơn hàng mới</div>
//             </div>
//             <div className="text-center p-4 bg-green-50 rounded-lg">
//               <div className="text-2xl font-bold text-green-600">95%</div>
//               <div className="text-sm text-green-600">Tỷ lệ thanh toán</div>
//             </div>
//             <div className="text-center p-4 bg-yellow-50 rounded-lg">
//               <div className="text-2xl font-bold text-yellow-600">23</div>
//               <div className="text-sm text-yellow-600">Hỗ trợ chờ xử lý</div>
//             </div>
//             <div className="text-center p-4 bg-purple-50 rounded-lg">
//               <div className="text-2xl font-bold text-purple-600">4.8</div>
//               <div className="text-sm text-purple-600">Đánh giá trung bình</div>
//             </div>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }
