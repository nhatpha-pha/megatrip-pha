"use client"
import { useState } from "react";
import {
    Plus,
    Search,
    Filter,
    Download,
    Edit,
    Trash2,
    Plane,
    Bus,
    MapPin,
    Calendar,
    Users,
    DollarSign,
    MoreHorizontal
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "../../components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../../components/ui/select";

const services = [
    {
        id: "DV001",
        name: "Hà Nội → TP.HCM",
        type: "flight",
        departure: "Hà Nội",
        destination: "TP.HCM",
        date: "2024-01-15",
        time: "08:30",
        price: "2,850,000",
        seats: 180,
        available: 45,
        partner: "Vietnam Airlines",
        status: "active",
        amenities: ["Wifi", "Suất ăn", "Hành lý 23kg"]
    },
    {
        id: "DV002",
        name: "TP.HCM → Đà Lạt",
        type: "bus",
        departure: "TP.HCM",
        destination: "Đà Lạt",
        date: "2024-01-15",
        time: "22:00",
        price: "450,000",
        seats: 45,
        available: 12,
        partner: "Phương Trang",
        status: "active",
        amenities: ["Wifi", "Ghế nằm", "Nước uống"]
    },
    {
        id: "DV003",
        name: "Tour Hạ Long 3N2Đ",
        type: "tour",
        departure: "Hà Nội",
        destination: "Vịnh Hạ Long",
        date: "2024-01-18",
        time: "07:00",
        price: "3,500,000",
        seats: 25,
        available: 8,
        partner: "Saigon Tourist",
        status: "active",
        amenities: ["Khách sạn 4*", "Xe đưa đón", "Hướng dẫn viên"]
    },
    {
        id: "DV004",
        name: "Đà Nẵng → Hội An",
        type: "bus",
        departure: "Đà Nẵng",
        destination: "Hội An",
        date: "2024-01-16",
        time: "14:30",
        price: "150,000",
        seats: 28,
        available: 0,
        partner: "Hoàng Long",
        status: "inactive",
        amenities: ["Wifi", "Điều hòa"]
    },
    {
        id: "DV005",
        name: "Tour Phú Quốc 4N3Đ",
        type: "tour",
        departure: "TP.HCM",
        destination: "Phú Quốc",
        date: "2024-01-20",
        time: "06:00",
        price: "5,200,000",
        seats: 20,
        available: 3,
        partner: "Vietravel",
        status: "active",
        amenities: ["Resort 5*", "Vé máy bay", "Tour khám phá"]
    }
];

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
            return "Chuyến xe";
        case "tour":
            return "Tour du lịch";
        default:
            return type;
    }
};

const getStatusBadge = (status: string) => {
    switch (status) {
        case "active":
            return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Hoạt động</Badge>;
        case "inactive":
            return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Tạm dừng</Badge>;
        default:
            return <Badge>Không xác định</Badge>;
    }
};

export default function Services() {
    const [searchTerm, setSearchTerm] = useState("");
    const [serviceType, setServiceType] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");

    const filteredServices = services.filter(service => {
        const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            service.departure.toLowerCase().includes(searchTerm.toLowerCase()) ||
            service.destination.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = serviceType === "all" || service.type === serviceType;
        const matchesStatus = statusFilter === "all" || service.status === statusFilter;

        return matchesSearch && matchesType && matchesStatus;
    });

    return (
        <div className="p-6 space-y-6">
            {/* Page header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Quản lý dịch vụ</h1>
                    <p className="text-muted-foreground mt-1">
                        Quản lý chuyến bay, chuyến xe và tour du lịch
                    </p>
                </div>
                <Button className="bg-primary hover:bg-primary-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm dịch vụ mới
                </Button>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Tổng dịch vụ</p>
                                <p className="text-2xl font-bold">{services.length}</p>
                            </div>
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <MapPin className="w-5 h-5 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Đang hoạt động</p>
                                <p className="text-2xl font-bold">{services.filter(s => s.status === 'active').length}</p>
                            </div>
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <Users className="w-5 h-5 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Chuyến bay</p>
                                <p className="text-2xl font-bold">{services.filter(s => s.type === 'flight').length}</p>
                            </div>
                            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                <Plane className="w-5 h-5 text-orange-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Tour du lịch</p>
                                <p className="text-2xl font-bold">{services.filter(s => s.type === 'tour').length}</p>
                            </div>
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                <MapPin className="w-5 h-5 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters and search */}
            <Card>
                <CardHeader>
                    <CardTitle>Danh sách dịch vụ</CardTitle>
                    <CardDescription>Quản lý tất cả dịch vụ du lịch trong hệ thống</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <Input
                                placeholder="Tìm kiếm theo tên, điểm đi, điểm đến..."
                                className="pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Select value={serviceType} onValueChange={setServiceType}>
                            <SelectTrigger className="w-full sm:w-[180px] bg-white">
                                <SelectValue placeholder="Loại dịch vụ" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover text-popover-foreground">
                                <SelectItem value="all">Tất cả loại</SelectItem>
                                <SelectItem value="flight">Chuyến bay</SelectItem>
                                <SelectItem value="bus">Chuyến xe</SelectItem>
                                <SelectItem value="tour">Tour du lịch</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="Trạng thái" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover text-popover-foreground">
                                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                                <SelectItem value="active">Hoạt động</SelectItem>
                                <SelectItem value="inactive">Tạm dừng</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline">
                            <Download className="w-4 h-4 mr-2" />
                            Xuất Excel
                        </Button>
                    </div>

                    {/* Services table */}
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Mã & Tên dịch vụ</TableHead>
                                    <TableHead>Loại hình</TableHead>
                                    <TableHead>Tuyến đường</TableHead>
                                    <TableHead>Thời gian</TableHead>
                                    <TableHead>Giá vé</TableHead>
                                    <TableHead>Chỗ trống</TableHead>
                                    <TableHead>Đối tác</TableHead>
                                    <TableHead>Trạng thái</TableHead>
                                    <TableHead className="text-right">Thao tác</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredServices.map((service) => (
                                    <TableRow key={service.id}>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">{service.id}</div>
                                                <div className="text-sm text-muted-foreground">{service.name}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center space-x-2">
                                                {getServiceIcon(service.type)}
                                                <span>{getServiceType(service.type)}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                <div>{service.departure} → {service.destination}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                <div className="flex items-center space-x-1">
                                                    <Calendar className="w-3 h-3" />
                                                    <span>{new Date(service.date).toLocaleDateString('vi-VN')}</span>
                                                </div>
                                                <div className="text-muted-foreground">{service.time}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center space-x-1">
                                                <DollarSign className="w-3 h-3" />
                                                <span className="font-medium">{service.price}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                <div className={`font-medium ${service.available === 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                    {service.available}/{service.seats}
                                                </div>
                                                <div className="text-muted-foreground">
                                                    {service.available === 0 ? 'Hết chỗ' : `${service.available} chỗ trống`}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">{service.partner}</div>
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(service.status)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                                                    <DropdownMenuItem>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Chỉnh sửa
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="text-red-600">
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Xóa dịch vụ
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {filteredServices.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            Không tìm thấy dịch vụ nào phù hợp với tiêu chí tìm kiếm.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
