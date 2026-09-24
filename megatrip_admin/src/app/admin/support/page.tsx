"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    MessageSquare,
    Plus,
    Eye,
    MessageCircle,
    Clock,
    CheckCircle,
    AlertCircle,
    User,
    Calendar,
    Filter,
    Search,
    Tag,
    Send,
    Paperclip,
    Star,
    Trash,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Textarea } from "../../components/ui/textarea";
import { Separator } from "../../components/ui/separator";
import { DataTable, Column } from "../../components/DataTable";
import { ModalForm } from "../../components/ModalForm";
import { ConfirmModal } from "../../components/ConfirmModal";
import { useToast } from "../../components/ui/use-toast";

interface SupportTicket {
    id: string;
    title: string;
    content: string;
    customerId: string;
    customerName: string;
    customerEmail: string;
    customerAvatar?: string;
    category: "technical" | "billing" | "account" | "general" | "complaint" | "cancel";
    priority: "low" | "medium" | "high" | "urgent";
    status: "new" | "open" | "pending" | "resolved" | "closed";
    assignedTo?: string;
    assignedToName?: string;
    createdAt: string;
    updatedAt: string;
    closedAt?: string;
    tags: string[];
    attachments: string[];
    responses: TicketResponse[];
    satisfaction?: 1 | 2 | 3 | 4 | 5;
    orderId?: string;
    serviceType?: "flight" | "bus" | "tour";
}

interface TicketResponse {
    id: string;
    content: string;
    isInternal: boolean;
    authorId: string;
    authorName: string;
    authorType: "customer" | "admin";
    createdAt: string;
    attachments: string[];
}

interface TicketFormData {
    title: string;
    content: string;
    customerId?: string;
    category: "technical" | "billing" | "account" | "general" | "complaint";
    priority: "low" | "medium" | "high" | "urgent";
    assignedTo?: string;
    tags: string[];
    isInternal?: boolean;
}

interface TicketFilters {
    status: string;
    priority: string;
    category: string;
    assignedTo: string;
    dateRange?: [string, string];
}

const mockCustomers = [
    { id: "cust_001", name: "Nguyễn Văn An", email: "an.nguyen@example.com" },
    { id: "cust_002", name: "Trần Thị Bình", email: "binh.tran@example.com" },
    { id: "cust_003", name: "Lê Minh Châu", email: "chau.le@example.com" },
    { id: "cust_004", name: "Phạm Quốc Dũng", email: "dung.pham@example.com" },
    { id: "cust_005", name: "Hoàng Thị Mai", email: "mai.hoang@example.com" },
    { id: "cust_006", name: "Đỗ Văn Hùng", email: "hung.do@example.com" },
    { id: "cust_007", name: "Vũ Thị Lan", email: "lan.vu@example.com" },
    { id: "cust_008", name: "Ngô Minh Tuấn", email: "tuan.ngo@example.com" },
    { id: "cust_009", name: "Bùi Thị Hương", email: "huong.bui@example.com" },
    { id: "cust_010", name: "Trương Văn Nam", email: "nam.truong@example.com" },
    { id: "cust_011", name: "Lý Thị Hoa", email: "hoa.ly@example.com" },
    { id: "cust_012", name: "Nguyễn Thành Đạt", email: "dat.nguyen@example.com" },
    { id: "cust_013", name: "Trần Văn Khoa", email: "khoa.tran@example.com" },
    { id: "cust_014", name: "Phạm Thị Ngọc", email: "ngoc.pham@example.com" },
    { id: "cust_015", name: "Đặng Minh Quang", email: "quang.dang@example.com" },
];

const mockAdmins = [
    { id: "admin_001", name: "Trần Văn Hùng" },
    { id: "admin_002", name: "Nguyễn Thị Mai" },
    { id: "admin_003", name: "Lê Văn Nam" },
    { id: "admin_004", name: "Hoàng Thị Lan" },
    { id: "admin_005", name: "Vũ Minh Tuấn" },
];

const mockTickets: SupportTicket[] = [
    {
        id: "TICKET001",
        title: "Không nhận được vé máy bay",
        content: "Tôi đã đặt vé máy bay Hà Nội → TP.HCM nhưng chưa nhận được email xác nhận.",
        customerId: "cust_001",
        customerName: "Nguyễn Văn An",
        customerEmail: "an.nguyen@example.com",
        customerAvatar: "https://example.com/avatars/an.jpg",
        category: "billing",
        priority: "urgent",
        status: "new",
        assignedTo: "admin_001",
        assignedToName: "Trần Văn Hùng",
        createdAt: "2025-09-01T08:00:00.000Z",
        updatedAt: "2025-09-01T08:00:00.000Z",
        tags: ["billing", "urgent"],
        attachments: [],
        responses: [],
        orderId: "ORDER001",
        serviceType: "flight",
    },
    {
        id: "TICKET002",
        title: "Yêu cầu đổi lịch tour Hạ Long",
        content: "Tôi muốn đổi ngày khởi hành tour Hạ Long 3N2Đ sang 2024-01-20.",
        customerId: "cust_003",
        customerName: "Lê Minh Châu",
        customerEmail: "chau.le@example.com",
        customerAvatar: "https://example.com/avatars/chau.jpg",
        category: "general",
        priority: "medium",
        status: "open",
        assignedTo: undefined,
        assignedToName: undefined,
        createdAt: "2025-09-02T10:00:00.000Z",
        updatedAt: "2025-09-02T10:00:00.000Z",
        tags: ["tour", "schedule"],
        attachments: [],
        responses: [
            {
                id: "RESP001",
                content: "Chúng tôi sẽ kiểm tra lịch và liên hệ lại trong 24h.",
                isInternal: false,
                authorId: "admin_001",
                authorName: "Trần Văn Hùng",
                authorType: "admin",
                createdAt: "2025-09-02T12:00:00.000Z",
                attachments: [],
            },
        ],
        orderId: "ORDER002",
        serviceType: "tour",
    },
    {
        id: "TICKET003",
        title: "Khiếu nại về chuyến xe TP.HCM → Đà Lạt",
        content: "Tài xế lái xe không an toàn, xe không sạch sẽ như quảng cáo.",
        customerId: "cust_006",
        customerName: "Đỗ Văn Hùng",
        customerEmail: "hung.do@example.com",
        customerAvatar: "",
        category: "complaint",
        priority: "high",
        status: "pending",
        assignedTo: "admin_002",
        assignedToName: "Nguyễn Thị Mai",
        createdAt: "2025-09-03T09:00:00.000Z",
        updatedAt: "2025-09-03T09:00:00.000Z",
        tags: ["complaint", "bus"],
        attachments: ["https://example.com/attachments/bus_complaint.jpg"],
        responses: [],
        orderId: "ORDER003",
        serviceType: "bus",
    },
    {
        id: "TICKET004",
        title: "Lỗi hệ thống khi đặt vé máy bay",
        content: "Khi thanh toán vé máy bay SGN-PQC, hệ thống báo lỗi 500.",
        customerId: "cust_008",
        customerName: "Ngô Minh Tuấn",
        customerEmail: "tuan.ngo@example.com",
        customerAvatar: "",
        category: "technical",
        priority: "urgent",
        status: "open",
        assignedTo: "admin_001",
        assignedToName: "Trần Văn Hùng",
        createdAt: "2025-09-04T11:00:00.000Z",
        updatedAt: "2025-09-04T11:00:00.000Z",
        tags: ["technical", "flight"],
        attachments: [],
        responses: [
            {
                id: "RESP002",
                content: "Đội kỹ thuật đang kiểm tra. Vui lòng cung cấp thêm thông tin giao dịch.",
                isInternal: false,
                authorId: "admin_001",
                authorName: "Trần Văn Hùng",
                authorType: "admin",
                createdAt: "2025-09-04T12:30:00.000Z",
                attachments: [],
            },
            {
                id: "RESP003",
                content: "Ghi chú nội bộ: Kiểm tra log server lúc 11:00.",
                isInternal: true,
                authorId: "admin_001",
                authorName: "Trần Văn Hùng",
                authorType: "admin",
                createdAt: "2025-09-04T12:45:00.000Z",
                attachments: [],
            },
        ],
        orderId: "ORDER004",
        serviceType: "flight",
    },
    {
        id: "TICKET005",
        title: "Hỏi về chính sách hoàn vé tour Phú Quốc",
        content: "Tôi muốn biết chính sách hoàn vé cho tour Phú Quốc 4N3Đ.",
        customerId: "cust_004",
        customerName: "Phạm Quốc Dũng",
        customerEmail: "dung.pham@example.com",
        customerAvatar: "",
        category: "general",
        priority: "low",
        status: "resolved",
        assignedTo: "admin_002",
        assignedToName: "Nguyễn Thị Mai",
        createdAt: "2025-09-05T14:00:00.000Z",
        updatedAt: "2025-09-06T10:00:00.000Z",
        closedAt: "2025-09-06T10:00:00.000Z",
        tags: ["tour", "refund"],
        attachments: [],
        responses: [
            {
                id: "RESP004",
                content: "Chính sách hoàn vé: Hoàn 100% nếu hủy trước 7 ngày.",
                isInternal: false,
                authorId: "admin_002",
                authorName: "Nguyễn Thị Mai",
                authorType: "admin",
                createdAt: "2025-09-06T09:00:00.000Z",
                attachments: [],
            },
        ],
        orderId: "ORDER005",
        serviceType: "tour",
        satisfaction: 4,
    },
    {
        id: "TICKET006",
        title: "Tài khoản không đăng nhập được",
        content: "Tôi không thể đăng nhập vào tài khoản, báo lỗi 'Sai mật khẩu'.",
        customerId: "cust_005",
        customerName: "Hoàng Thị Mai",
        customerEmail: "mai.hoang@example.com",
        customerAvatar: "https://example.com/avatars/mai.jpg",
        category: "account",
        priority: "medium",
        status: "closed",
        assignedTo: "admin_001",
        assignedToName: "Trần Văn Hùng",
        createdAt: "2025-09-06T15:00:00.000Z",
        updatedAt: "2025-09-07T09:00:00.000Z",
        closedAt: "2025-09-07T09:00:00.000Z",
        tags: ["account", "login"],
        attachments: [],
        responses: [
            {
                id: "RESP005",
                content: "Vui lòng thử đặt lại mật khẩu qua email.",
                isInternal: false,
                authorId: "admin_001",
                authorName: "Trần Văn Hùng",
                authorType: "admin",
                createdAt: "2025-09-06T16:00:00.000Z",
                attachments: [],
            },
            {
                id: "RESP006",
                content: "Đã đặt lại mật khẩu, vấn đề giải quyết.",
                isInternal: false,
                authorId: "cust_005",
                authorName: "Hoàng Thị Mai",
                authorType: "customer",
                createdAt: "2025-09-07T08:00:00.000Z",
                attachments: [],
            },
        ],
        satisfaction: 5,
    },
    {
        id: "TICKET007",
        title: "Chuyến xe Đà Nẵng → Hội An trễ giờ",
        content: "Xe khởi hành muộn 1 tiếng, không được báo trước.",
        customerId: "cust_009",
        customerName: "Bùi Thị Hương",
        customerEmail: "huong.bui@example.com",
        customerAvatar: "https://example.com/avatars/huong.jpg",
        category: "complaint",
        priority: "high",
        status: "pending",
        assignedTo: undefined,
        assignedToName: undefined,
        createdAt: "2025-09-07T10:00:00.000Z",
        updatedAt: "2025-09-07T10:00:00.000Z",
        tags: ["bus", "delay"],
        attachments: [],
        responses: [],
        orderId: "ORDER006",
        serviceType: "bus",
    },
    {
        id: "TICKET008",
        title: "Hỏi về tiện ích tour Hạ Long",
        content: "Tour Hạ Long 3N2Đ có bao gồm ăn uống không?",
        customerId: "cust_007",
        customerName: "Vũ Thị Lan",
        customerEmail: "lan.vu@example.com",
        customerAvatar: "https://example.com/avatars/lan.jpg",
        category: "general",
        priority: "low",
        status: "resolved",
        assignedTo: "admin_002",
        assignedToName: "Nguyễn Thị Mai",
        createdAt: "2025-09-08T12:00:00.000Z",
        updatedAt: "2025-09-08T14:00:00.000Z",
        closedAt: "2025-09-08T14:00:00.000Z",
        tags: ["tour", "inquiry"],
        attachments: [],
        responses: [
            {
                id: "RESP007",
                content: "Tour bao gồm 3 bữa ăn mỗi ngày, chi tiết đã gửi qua email.",
                isInternal: false,
                authorId: "admin_002",
                authorName: "Nguyễn Thị Mai",
                authorType: "admin",
                createdAt: "2025-09-08T13:00:00.000Z",
                attachments: [],
            },
        ],
        orderId: "ORDER007",
        serviceType: "tour",
        satisfaction: 4,
    },
    {
        id: "TICKET009",
        title: "Lỗi thanh toán vé máy bay",
        content: "Thanh toán vé Hà Nội → TP.HCM thất bại, tiền đã bị trừ.",
        customerId: "cust_002",
        customerName: "Trần Thị Bình",
        customerEmail: "binh.tran@example.com",
        customerAvatar: "",
        category: "billing",
        priority: "urgent",
        status: "open",
        assignedTo: "admin_001",
        assignedToName: "Trần Văn Hùng",
        createdAt: "2025-09-09T09:00:00.000Z",
        updatedAt: "2025-09-09T09:00:00.000Z",
        tags: ["billing", "payment"],
        attachments: ["https://example.com/attachments/payment_error.jpg"],
        responses: [],
        orderId: "ORDER008",
        serviceType: "flight",
    },
    {
        id: "TICKET010",
        title: "Yêu cầu hủy tour Phú Quốc",
        content: "Tôi muốn hủy tour Phú Quốc 4N3Đ do lịch trình thay đổi.",
        customerId: "cust_010",
        customerName: "Trương Văn Nam",
        customerEmail: "nam.truong@example.com",
        customerAvatar: "",
        category: "general",
        priority: "medium",
        status: "pending",
        assignedTo: undefined,
        assignedToName: undefined,
        createdAt: "2025-09-10T11:00:00.000Z",
        updatedAt: "2025-09-10T11:00:00.000Z",
        tags: ["tour", "cancellation"],
        attachments: [],
        responses: [],
        orderId: "ORDER009",
        serviceType: "tour",
    },
    {
        id: "TICKET011",
        title: "Hỏi về lịch trình tour Đà Nẵng",
        content: "Tour Đà Nẵng 3N2Đ có đi Bà Nà Hills không?",
        customerId: "cust_011",
        customerName: "Lý Thị Hoa",
        customerEmail: "hoa.ly@example.com",
        customerAvatar: "https://example.com/avatars/hoa.jpg",
        category: "general",
        priority: "low",
        status: "resolved",
        assignedTo: "admin_003",
        assignedToName: "Lê Văn Nam",
        createdAt: "2025-09-11T09:00:00.000Z",
        updatedAt: "2025-09-11T10:00:00.000Z",
        closedAt: "2025-09-11T10:00:00.000Z",
        tags: ["tour", "inquiry"],
        attachments: [],
        responses: [
            {
                id: "RESP008",
                content: "Tour có bao gồm Bà Nà Hills, chi tiết lịch trình đã gửi qua email.",
                isInternal: false,
                authorId: "admin_003",
                authorName: "Lê Văn Nam",
                authorType: "admin",
                createdAt: "2025-09-11T09:30:00.000Z",
                attachments: [],
            },
        ],
        orderId: "ORDER010",
        serviceType: "tour",
        satisfaction: 5,
    },
    {
        id: "TICKET012",
        title: "Lỗi hiển thị vé máy bay trên app",
        content: "Vé máy bay SGN-HAN không hiển thị trong mục 'Vé của tôi' trên ứng dụng.",
        customerId: "cust_012",
        customerName: "Nguyễn Thành Đạt",
        customerEmail: "dat.nguyen@example.com",
        customerAvatar: "",
        category: "technical",
        priority: "high",
        status: "open",
        assignedTo: "admin_004",
        assignedToName: "Hoàng Thị Lan",
        createdAt: "2025-09-11T12:00:00.000Z",
        updatedAt: "2025-09-11T12:00:00.000Z",
        tags: ["technical", "flight", "app"],
        attachments: [],
        responses: [],
        orderId: "ORDER011",
        serviceType: "flight",
    },
    {
        id: "TICKET013",
        title: "Khiếu nại về dịch vụ xe buýt",
        content: "Xe buýt từ Hà Nội → Hải Phòng không có điều hòa, nhân viên không thân thiện.",
        customerId: "cust_013",
        customerName: "Trần Văn Khoa",
        customerEmail: "khoa.tran@example.com",
        customerAvatar: "",
        category: "complaint",
        priority: "high",
        status: "pending",
        assignedTo: "admin_005",
        assignedToName: "Vũ Minh Tuấn",
        createdAt: "2025-09-11T14:00:00.000Z",
        updatedAt: "2025-09-11T14:00:00.000Z",
        tags: ["complaint", "bus"],
        attachments: ["https://example.com/attachments/bus_issue.jpg"],
        responses: [],
        orderId: "ORDER012",
        serviceType: "bus",
    },
    {
        id: "TICKET014",
        title: "Yêu cầu đổi vé máy bay",
        content: "Tôi muốn đổi vé máy bay từ SGN-DAD sang ngày 2024-02-15.",
        customerId: "cust_014",
        customerName: "Phạm Thị Ngọc",
        customerEmail: "ngoc.pham@example.com",
        customerAvatar: "https://example.com/avatars/ngoc.jpg",
        category: "general",
        priority: "medium",
        status: "open",
        assignedTo: undefined,
        assignedToName: undefined,
        createdAt: "2025-09-12T08:00:00.000Z",
        updatedAt: "2025-09-12T08:00:00.000Z",
        tags: ["flight", "change"],
        attachments: [],
        responses: [
            {
                id: "RESP009",
                content: "Chúng tôi đang kiểm tra khả năng đổi vé, sẽ phản hồi sớm.",
                isInternal: false,
                authorId: "admin_004",
                authorName: "Hoàng Thị Lan",
                authorType: "admin",
                createdAt: "2025-09-12T09:00:00.000Z",
                attachments: [],
            },
        ],
        orderId: "ORDER013",
        serviceType: "flight",
    },
    {
        id: "TICKET015",
        title: "Hỏi về phương thức thanh toán",
        content: "Tôi có thể thanh toán tour Huế bằng thẻ tín dụng không?",
        customerId: "cust_015",
        customerName: "Đặng Minh Quang",
        customerEmail: "quang.dang@example.com",
        customerAvatar: "",
        category: "general",
        priority: "low",
        status: "resolved",
        assignedTo: "admin_003",
        assignedToName: "Lê Văn Nam",
        createdAt: "2025-09-12T10:00:00.000Z",
        updatedAt: "2025-09-12T11:00:00.000Z",
        closedAt: "2025-09-12T11:00:00.000Z",
        tags: ["tour", "payment"],
        attachments: [],
        responses: [
            {
                id: "RESP010",
                content: "Có, tour Huế chấp nhận thanh toán bằng thẻ tín dụng. Vui lòng kiểm tra email để biết thêm chi tiết.",
                isInternal: false,
                authorId: "admin_003",
                authorName: "Lê Văn Nam",
                authorType: "admin",
                createdAt: "2025-09-12T10:30:00.000Z",
                attachments: [],
            },
        ],
        orderId: "ORDER014",
        serviceType: "tour",
        satisfaction: 4,
    },
    {
        id: "TICKET016",
        title: "Lỗi hệ thống đặt vé xe buýt",
        content: "Khi đặt vé xe TP.HCM → Vũng Tàu, hệ thống báo lỗi 'Không tìm thấy chuyến'.",
        customerId: "cust_002",
        customerName: "Trần Thị Bình",
        customerEmail: "binh.tran@example.com",
        customerAvatar: "",
        category: "technical",
        priority: "urgent",
        status: "open",
        assignedTo: "admin_004",
        assignedToName: "Hoàng Thị Lan",
        createdAt: "2025-09-12T12:00:00.000Z",
        updatedAt: "2025-09-12T12:00:00.000Z",
        tags: ["technical", "bus"],
        attachments: [],
        responses: [],
        orderId: "ORDER015",
        serviceType: "bus",
    },
    {
        id: "TICKET017",
        title: "Khiếu nại về hướng dẫn viên tour",
        content: "Hướng dẫn viên tour Sapa không nhiệt tình, thiếu thông tin.",
        customerId: "cust_011",
        customerName: "Lý Thị Hoa",
        customerEmail: "hoa.ly@example.com",
        customerAvatar: "https://example.com/avatars/hoa.jpg",
        category: "complaint",
        priority: "high",
        status: "pending",
        assignedTo: "admin_005",
        assignedToName: "Vũ Minh Tuấn",
        createdAt: "2025-09-12T13:00:00.000Z",
        updatedAt: "2025-09-12T13:00:00.000Z",
        tags: ["complaint", "tour"],
        attachments: [],
        responses: [],
        orderId: "ORDER016",
        serviceType: "tour",
    },
    {
        id: "TICKET018",
        title: "Yêu cầu kiểm tra trạng thái đặt vé",
        content: "Tôi đã đặt vé máy bay HAN-SGN, muốn kiểm tra trạng thái xác nhận.",
        customerId: "cust_012",
        customerName: "Nguyễn Thành Đạt",
        customerEmail: "dat.nguyen@example.com",
        customerAvatar: "",
        category: "general",
        priority: "medium",
        status: "open",
        assignedTo: "admin_003",
        assignedToName: "Lê Văn Nam",
        createdAt: "2025-09-12T14:00:00.000Z",
        updatedAt: "2025-09-12T14:00:00.000Z",
        tags: ["flight", "status"],
        attachments: [],
        responses: [
            {
                id: "RESP011",
                content: "Vé của bạn đã được xác nhận, thông tin đã gửi qua email.",
                isInternal: false,
                authorId: "admin_003",
                authorName: "Lê Văn Nam",
                authorType: "admin",
                createdAt: "2025-09-12T14:30:00.000Z",
                attachments: [],
            },
        ],
        orderId: "ORDER017",
        serviceType: "flight",
    },
    {
        id: "TICKET019",
        title: "Lỗi đăng ký tài khoản mới",
        content: "Tôi không nhận được email xác minh khi đăng ký tài khoản.",
        customerId: "cust_013",
        customerName: "Trần Văn Khoa",
        customerEmail: "khoa.tran@example.com",
        customerAvatar: "",
        category: "account",
        priority: "medium",
        status: "open",
        assignedTo: "admin_001",
        assignedToName: "Trần Văn Hùng",
        createdAt: "2025-09-12T15:00:00.000Z",
        updatedAt: "2025-09-12T15:00:00.000Z",
        tags: ["account", "registration"],
        attachments: [],
        responses: [],
        orderId: "ORDER018",
        serviceType: undefined,
    },
    {
        id: "TICKET020",
        title: "Hỏi về ưu đãi tour Nha Trang",
        content: "Tour Nha Trang 4N3Đ có ưu đãi gì cho nhóm trên 5 người không?",
        customerId: "cust_015",
        customerName: "Đặng Minh Quang",
        customerEmail: "quang.dang@example.com",
        customerAvatar: "",
        category: "general",
        priority: "low",
        status: "resolved",
        assignedTo: "admin_002",
        assignedToName: "Nguyễn Thị Mai",
        createdAt: "2025-09-12T16:00:00.000Z",
        updatedAt: "2025-09-12T17:00:00.000Z",
        closedAt: "2025-09-12T17:00:00.000Z",
        tags: ["tour", "discount"],
        attachments: [],
        responses: [
            {
                id: "RESP012",
                content: "Nhóm trên 5 người được giảm 10%. Chi tiết đã gửi qua email.",
                isInternal: false,
                authorId: "admin_002",
                authorName: "Nguyễn Thị Mai",
                authorType: "admin",
                createdAt: "2025-09-12T16:30:00.000Z",
                attachments: [],
            },
        ],
        orderId: "ORDER019",
        serviceType: "tour",
        satisfaction: 4,
    },
];
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080";

// map server ticket -> SupportTicket (UI)
function mapApiTicketToSupportTicket(t: any): SupportTicket {
    const id = t.ticketNumber || t._id || String(t.id || t._id || "").toString();
    const customerId = t.customerId || t.customer || null;
    // derive customer name/email from payload or fallback to mockCustomers
    let customerName = t.customerName || (t.customer && t.customer.name) || "";
    let customerEmail = t.customerEmail || (t.customer && t.customer.email) || "";
    if (!customerName && customerId) {
        const c = mockCustomers.find(c => c.id === customerId);
        if (c) {
            customerName = c.name;
            customerEmail = c.email;
        }
    }
    const messages = Array.isArray(t.messages) ? t.messages.map((m: any, idx: number) => ({
        id: m._id || `MSG${idx}`,
        content: m.text || m.text || "",
        isInternal: (m.authorType === 'agent' || m.authorType === 'admin') ? true : false,
        authorId: m.authorId || null,
        authorName: m.authorName || (m.authorId ? (mockAdmins.find(a => a.id === m.authorId)?.name) : customerName) || "",
        authorType: m.authorType === 'admin' ? 'admin' : 'customer',
        createdAt: m.createdAt || m.ts || new Date().toISOString(),
        attachments: Array.isArray(m.attachments) ? m.attachments : []
    })) : [];

    const responses = (t.responses && Array.isArray(t.responses)) ? t.responses.map((r: any, idx: number) => ({
        id: r._id || `RESP${idx}`,
        content: r.text || r.content || "",
        isInternal: !!r.isInternal,
        authorId: r.authorId || (r.author && r.author.id) || "agent",
        authorName: r.authorName || r.author?.name || mockAdmins[0]?.name || "Agent",
        authorType: r.authorType === 'admin' ? 'admin' : 'customer',
        createdAt: r.createdAt || new Date().toISOString(),
        attachments: Array.isArray(r.attachments) ? r.attachments : []
    })) : messages; // fallback use messages as responses

    // map refundInfo if backend provided it
    const refundInfo = t.refundInfo ? {
        orderRef: t.refundInfo.orderRef ?? null,
        transId: t.refundInfo.transId ?? null,
        zp_trans_id: t.refundInfo.zp_trans_id ?? null,
        paymentReference: t.refundInfo.paymentReference ?? null,
        airlinePenalty: Number(t.refundInfo.airlinePenalty || 0),
        taxes: Number(t.refundInfo.taxes || 0),
        platformFee: Number(t.refundInfo.platformFee || 0),
        refundAmount: Number(t.refundInfo.refundAmount || 0),
        currency: t.refundInfo.currency || 'VND'
    } : undefined;

    return {
        id,
        title: t.title || t.description || (t.messages && t.messages[0] && t.messages[0].text) || "Ticket",
        content: t.description || (t.messages && t.messages[0] && t.messages[0].text) || "",
        customerId,
        customerName: customerName || "",
        customerEmail: customerEmail || "",
        customerAvatar: t.customerAvatar || "",
        category: (t.type || t.category) || "general",
        priority: t.priority || "medium",
        status: t.status || "new",
        assignedTo: t.assignee?.id || t.assignedTo || undefined,
        assignedToName: t.assignee?.name || t.assignedToName || undefined,
        createdAt: t.createdAt || t.created_at || new Date().toISOString(),
        updatedAt: t.updatedAt || t.updated_at || new Date().toISOString(),
        closedAt: t.closedAt || null,
        tags: Array.isArray(t.tags) ? t.tags : (t.metadata?.tags || []),
        attachments: Array.isArray(t.attachments) ? t.attachments : [],
        responses,
        satisfaction: t.satisfaction || undefined,
        orderId: t.orderRef || (refundInfo && refundInfo.orderRef) || t.orderId || undefined,
        serviceType: t.serviceType || undefined,
        // attach refundInfo for UI to read (cast to any where needed)
        ...(refundInfo ? { refundInfo } : {})
    };
}
const Support: React.FC = () => {
    const [modalOpen, setModalOpen] = useState(false);
    const [editTicket, setEditTicket] = useState<SupportTicket | null>(null);
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [confirmAssignment, setConfirmAssignment] = useState<{
        ticketId: string;
        newAssignedTo: string;
    } | null>(null);
    const [filters, setFilters] = useState<TicketFilters>({
        status: "all",
        priority: "all",
        category: "all",
        assignedTo: "all",
    });
    const [searchTerm, setSearchTerm] = useState("");
    const [responseContent, setResponseContent] = useState("");
    const [isInternal, setIsInternal] = useState(false);
    const [isProcessingResponse, setIsProcessingResponse] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 100,
        total: mockTickets.length,
    });

    const { toast } = useToast();
    const queryClient = useQueryClient();

    // replace tickets queryFn to call API with fallback to mockTickets
    const { data: tickets = { data: [], total: 0 }, isLoading } = useQuery({
        queryKey: ["tickets", filters, searchTerm, pagination],
        queryFn: async () => {
            try {
                const qs = new URLSearchParams();
                qs.set("page", String(pagination.current));
                qs.set("pageSize", String(pagination.pageSize));
                if (filters.status && filters.status !== "all") qs.set("status", filters.status);
                if (filters.category && filters.category !== "all") qs.set("type", filters.category);
                if (filters.assignedTo && filters.assignedTo !== "all") qs.set("assignedTo", filters.assignedTo);
                if (searchTerm) qs.set("q", searchTerm);
                const url = `${API_BASE}/api/support?${qs.toString()}`;
                const res = await fetch(url);
                if (!res.ok) throw new Error(`server ${res.status}`);
                const json = await res.json();
                // server returns { ok: true, data: [...], pagination: { total, page, pageSize } }
                const payload = Array.isArray(json.data) ? json.data : (json.data?.data || []);
                const mapped = payload.map(mapApiTicketToSupportTicket);
                const total = (json.pagination && json.pagination.total) || (json.total) || mapped.length;
                return { data: mapped, total };
            } catch (err) {
                console.warn("Support API fetch failed, using mockTickets", err);
                // fallback: filter mockTickets similarly
                const filteredTickets = mockTickets.filter((ticket) => {
                    const matchesSearch =
                        ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        ticket.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        ticket.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        ticket.id.toLowerCase().includes(searchTerm.toLowerCase());

                    const matchesStatus = filters.status === "all" || ticket.status === filters.status;
                    const matchesPriority = filters.priority === "all" || ticket.priority === filters.priority;
                    const matchesCategory = filters.category === "all" || ticket.category === filters.category;
                    const matchesAssignedTo =
                        filters.assignedTo === "all" ||
                        (filters.assignedTo === "unassigned" && !ticket.assignedTo) ||
                        ticket.assignedTo === filters.assignedTo;

                    return matchesSearch && matchesStatus && matchesPriority && matchesCategory && matchesAssignedTo;
                });

                const start = (pagination.current - 1) * pagination.pageSize;
                const end = start + pagination.pageSize;
                return {
                    data: filteredTickets.slice(start, end),
                    total: filteredTickets.length,
                };
            }
        },
    });

    // Fetch admins
    const { data: admins = [] } = useQuery({
        queryKey: ["admins"],
        queryFn: async () => mockAdmins,
    });

    // Fetch customers
    const { data: customers = [] } = useQuery({
        queryKey: ["customers"],
        queryFn: async () => mockCustomers,
    });

    // Create ticket mutation
    // Mutations: call server endpoints, fallback to mock behavior on error
    const createTicketMutation = useMutation({
        mutationFn: async (data: TicketFormData) => {
            try {
                const res = await fetch(`${API_BASE}/api/support`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        customerId: data.customerId,
                        serviceType: data.category === "complaint" ? "bus" : (data.category === "billing" || data.category === "technical" ? "flight" : "tour"),
                        type: data.category,
                        title: data.title,
                        description: data.content,
                        message: data.content,
                        orderRef: data.tags && data.tags.length ? data.tags[0] : undefined
                    }),
                });
                if (!res.ok) {
                    const txt = await res.text().catch(() => "");
                    throw new Error(txt || `status ${res.status}`);
                }
                const json = await res.json();
                const ticket = json.ticket || json.data || json;
                return mapApiTicketToSupportTicket(ticket);
            } catch (err) {
                // fallback: create locally (mock)
                const newTicket: SupportTicket = {
                    id: `TICKET${mockTickets.length + 1}`.padStart(8, "0"),
                    title: data.title,
                    content: data.content,
                    customerId: data.customerId || mockCustomers[0].id,
                    customerName: mockCustomers.find((c) => c.id === data.customerId)?.name || mockCustomers[0].name,
                    customerEmail: mockCustomers.find((c) => c.id === data.customerId)?.email || mockCustomers[0].email,
                    customerAvatar: "",
                    category: data.category,
                    priority: data.priority,
                    status: "new",
                    assignedTo: data.assignedTo,
                    assignedToName: mockAdmins.find((a) => a.id === data.assignedTo)?.name,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    tags: data.tags,
                    attachments: [],
                    responses: [],
                    orderId: undefined,
                    serviceType: undefined,
                };
                mockTickets.push(newTicket);
                return newTicket;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tickets"] });
            setModalOpen(false);
            resetForm();
            toast({ title: "Tạo ticket thành công", description: "Ticket mới đã được tạo" });
        },
        onError: (error: any) => {
            toast({ title: "Lỗi khi tạo ticket", description: String(error?.message || "error"), variant: "destructive" });
        },
    });

    const updateTicketMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            try {
                const res = await fetch(`${API_BASE}/api/support/${encodeURIComponent(id)}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        status: data.category === undefined ? undefined : undefined,
                        title: data.title,
                        description: data.content,
                        assignee: data.assignedTo ? { id: data.assignedTo, name: mockAdmins.find(a => a.id === data.assignedTo)?.name } : undefined,
                        metadata: {}
                    }),
                });
                if (!res.ok) throw new Error(`status ${res.status}`);
                const json = await res.json();
                const ticket = json.ticket || json;
                return mapApiTicketToSupportTicket(ticket);
            } catch (err) {
                // fallback update mock
                const index = mockTickets.findIndex(t => t.id === id);
                if (index === -1) throw err;
                mockTickets[index] = { ...mockTickets[index], ...data, updatedAt: new Date().toISOString() } as any;
                return mockTickets[index];
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tickets"] });
            setModalOpen(false);
            setEditTicket(null);
            resetForm();
            toast({ title: "Cập nhật ticket thành công", description: "Thông tin ticket đã được cập nhật" });
        },
        onError: (error: any) => {
            toast({ title: "Lỗi khi cập nhật ticket", description: String(error?.message || "error"), variant: "destructive" });
        },
    });

    // Add response mutation
    const addResponseMutation = useMutation({
        mutationFn: async ({ ticketId, content, isInternal }: { ticketId: string; content: string; isInternal: boolean }) => {
            try {
                const res = await fetch(`${API_BASE}/api/support/${encodeURIComponent(ticketId)}/messages`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    // body: JSON.stringify({ text: content, authorType: isInternal ? "agent" : "customer", authorId: "admin_001" }),
                    body: JSON.stringify({ text: content, authorType: "admin", authorId: "admin_001" }),
                });
                if (!res.ok) throw new Error(`status ${res.status}`);
                const json = await res.json();
                return json.message || json;
            } catch (err) {
                // fallback: append to mock
                const index = mockTickets.findIndex(t => t.id === ticketId);
                if (index === -1) throw err;
                const newResp: TicketResponse = {
                    id: `RESP${mockTickets[index].responses.length + 1}`.padStart(8, "0"),
                    content,
                    isInternal,
                    authorId: "admin_001",
                    authorName: "Admin",
                    authorType: "admin",
                    createdAt: new Date().toISOString(),
                    attachments: [],
                };
                mockTickets[index].responses.push(newResp);
                mockTickets[index].updatedAt = new Date().toISOString();
                return newResp;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tickets"] });
            setResponseContent("");
            setIsInternal(false);
            toast({ title: "Phản hồi thành công", description: "Phản hồi đã được gửi" });
        },
        onError: (err: any) => {
            toast({ title: "Lỗi khi thêm phản hồi", description: String(err?.message || 'error'), variant: "destructive" });
        }
    });

    // Delete ticket mutation
    // const deleteTicketMutation = useMutation({
    //     mutationFn: async (id: string) => {
    //         try {
    //             // server does not provide hard delete; mark closed via PUT
    //             const res = await fetch(`${API_BASE}/api/support/${encodeURIComponent(id)}`, {
    //                 method: "PUT",
    //                 headers: { "Content-Type": "application/json" },
    //                 body: JSON.stringify({ status: "closed" }),
    //             });
    //             if (!res.ok) throw new Error(`status ${res.status}`);
    //             const json = await res.json();
    //             return json.ticket || json;
    //         } catch (err) {
    //             const index = mockTickets.findIndex(t => t.id === id);
    //             if (index === -1) throw err;
    //             mockTickets.splice(index, 1);
    //             return { ok: true };
    //         }
    //     },
    //     onSuccess: () => {
    //         queryClient.invalidateQueries({ queryKey: ["tickets"] });
    //         setDeleteId(null);
    //         toast({ title: "Xóa ticket thành công", description: "Ticket đã được đóng/xóa" });
    //     },
    //     onError: (err: any) => {
    //         toast({ title: "Lỗi khi xóa ticket", description: String(err?.message || 'error'), variant: "destructive" });
    //     }
    // });

    const deleteTicketMutation = useMutation({
        mutationFn: async (id: string) => {
            try {
                // call DELETE endpoint on server
                const res = await fetch(`${API_BASE}/api/support/${encodeURIComponent(id)}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                });
                if (!res.ok) {
                    const txt = await res.text().catch(() => '');
                    throw new Error(txt || `status ${res.status}`);
                }
                const json = await res.json();
                // server returns { ok: true, id: ... } or the deleted ticket
                return json;
            } catch (err) {
                // fallback: remove from mockTickets
                const index = mockTickets.findIndex(t => t.id === id);
                if (index === -1) throw err;
                mockTickets.splice(index, 1);
                return { ok: true };
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tickets"] });
            setDeleteId(null);
            toast({ title: "Xóa ticket thành công", description: "Ticket đã được đóng/xóa" });
        },
        onError: (err: any) => {
            toast({ title: "Lỗi khi xóa ticket", description: String(err?.message || 'error'), variant: "destructive" });
        }
    });

    const resetForm = () => {
        setEditTicket(null);
    };

    const handleEdit = (ticket: SupportTicket) => {
        setEditTicket(ticket);
        setModalOpen(true);
    };

    const handleView = (ticket: SupportTicket) => {
        setSelectedTicket(ticket);
        setViewModalOpen(true);
    };

    const handleDelete = (id: string) => {
        // quick confirm + call mutation immediately to avoid ConfirmModal issues
        console.log('handleDelete called', id);
        if (!confirm('Bạn có chắc chắn muốn xóa ticket này?')) return;
        deleteTicketMutation.mutate(id);
        // keep deleteId for compatibility with existing ConfirmModal state if needed
        setDeleteId(id);
    };

    const handleStatusChange = (ticketId: string, status: string) => {
        updateTicketMutation.mutate({
            id: ticketId,
            data: { status: status as any },
        });
    };

    // const handleAssignmentChange = (ticketId: string, assignedTo: string) => {
    //     updateTicketMutation.mutate({
    //         id: ticketId,
    //         data: {
    //             assignedTo: assignedTo === "unassigned" ? undefined : assignedTo,
    //             assignedToName:
    //                 assignedTo === "unassigned"
    //                     ? undefined
    //                     : admins.find((a) => a.id === assignedTo)?.name || "",
    //         },
    //     });
    // };

    // const handleAddResponse = () => {
    //     if (!selectedTicket || !responseContent.trim()) return;

    //     addResponseMutation.mutate({
    //         ticketId: selectedTicket.id,
    //         content: responseContent.trim(),
    //         isInternal,
    //     });
    // };

    // Send support email mutation
    const sendSupportEmailMutation = useMutation({
        mutationFn: async ({ ticketId, email, responseDetails }: { ticketId: string; email: string; responseDetails: any }) => {
            const res = await fetch(`${API_BASE}/api/support/send-response-email`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ticketId, email, responseDetails }),
            });
            if (!res.ok) throw new Error(`status ${res.status}`);
            return res.json();
        },
        onSuccess: () => {
            toast({ title: "Mail hỗ trợ đã gửi", description: "Email phản hồi đã được gửi cho khách hàng" });
        },
        onError: (err: any) => {
            toast({ title: "Lỗi gửi mail", description: String(err?.message || 'error'), variant: "destructive" });
        }
    });
    const handleAddResponse = async () => {
        console.log("handleAddResponse started");
        if (!selectedTicket || !responseContent.trim()) return;
        setIsProcessingResponse(true);
        const ticketId = selectedTicket.id;
        const isCancel = selectedTicket.category === "cancel";

        try {
            if (isCancel && (selectedTicket as any).refundInfo) {
                const refundInfo = (selectedTicket as any).refundInfo;
                // const amount = 10000;
                const amount = refundInfo.refundAmount; // Sử dụng số tiền hoàn dự kiến từ refundInfo


                let refundResult: any = null;

                if (amount > 0) {
                    if (refundInfo.transId) {
                        const refundBody = {
                            orderId: `REFUND_${refundInfo.orderRef || ticketId}_${Date.now().toString().slice(-6)}`,
                            amount,
                            transId: refundInfo.transId,
                            description: `Hoàn tiền đơn hàng ${refundInfo.orderRef || ticketId}`,
                        };
                        const momoResp = await fetch("http://localhost:8080/momo/refund", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(refundBody),
                        });
                        if (!momoResp.ok) {
                            const txt = await momoResp.text().catch(() => "");
                            throw new Error(`Refund (momo) lỗi: ${momoResp.status} ${txt}`);
                        }
                        refundResult = await momoResp.json();
                    } else if (refundInfo.zp_trans_id) {
                        const zaloBody = {
                            zp_trans_id: refundInfo.zp_trans_id,
                            amount,
                            description: `Khách hàng hủy đơn ${refundInfo.orderRef || ticketId}`,
                        };
                        const zaloResp = await fetch("http://localhost:8080/zalo/refund", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(zaloBody),
                        });
                        if (!zaloResp.ok) {
                            const txt = await zaloResp.text().catch(() => "");
                            throw new Error(`Refund (zalo) lỗi: ${zaloResp.status} ${txt}`);
                        }
                        refundResult = await zaloResp.json();
                    } else {
                        toast({ title: "Thiếu thông tin giao dịch", description: "Không có transId hoặc zp_trans_id để thực hiện refund." });
                        return;
                    }
                } else {
                    refundResult = { message: "Không cần hoàn tiền (số tiền = 0)" };
                }
                await Promise.all([
                    fetch(`${API_BASE}/api/support/${encodeURIComponent(ticketId)}/messages`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            text: `Xử lý hoàn tiền:\n${responseContent.trim()}\n\nKết quả refund: ${JSON.stringify(refundResult)}`,
                            authorType: "admin",
                            authorId: "admin_001",
                        }),
                    }),
                    fetch(`${API_BASE}/api/support/${encodeURIComponent(ticketId)}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            status: "resolved",
                            metadata: { refundResult, handledBy: "admin_001" },
                        }),
                    }),
                ]);

                const orderRef = refundInfo.orderRef;
                if (orderRef) {
                    try {
                        // Fetch current order metadata to merge
                        const currentOrderResp = await fetch(`${API_BASE}/api/orders/${encodeURIComponent(orderRef)}`);
                        let currentMetadata = {};
                        if (currentOrderResp.ok) {
                            const currentOrder = await currentOrderResp.json();
                            currentMetadata = currentOrder.metadata || {};
                        }

                        // Merge metadata
                        const updatedMetadata = {
                            ...currentMetadata,
                            refundHandledBy: ticketId,
                            refundResult,
                        };

                        await fetch(`${API_BASE}/api/orders/${encodeURIComponent(orderRef)}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                paymentStatus: "refunded",
                                orderStatus: "cancelled",
                                transId: refundInfo.transId || null,
                                zp_trans_id: refundInfo.zp_trans_id || null,
                                metadata: updatedMetadata,
                            }),
                        });
                    } catch (e) {
                        console.warn("Update order after refund failed", e);
                    }
                }

                toast({ title: "Hoàn tiền đã xử lý", description: `Kết quả: ${refundResult?.message || "OK"}` });
                queryClient.invalidateQueries({ queryKey: ["tickets"] });
            } else {
                // Thêm response
                await addResponseMutation.mutateAsync({
                    ticketId,
                    content: responseContent.trim(),
                    isInternal,
                });

                // Gửi mail hỗ trợ nếu không internal
                if (!isInternal) {
                    await sendSupportEmailMutation.mutateAsync({
                        ticketId,
                        email: selectedTicket.customerEmail,
                        responseDetails: {
                            ticketId: selectedTicket.id,
                            title: selectedTicket.title,
                            response: responseContent.trim(),
                        }
                    });
                }
            }


            console.log("About to close modal");
            // Đóng modal và reset state sau khi thành công
            setViewModalOpen(false);
            setSelectedTicket(null);
            setResponseContent("");
            setIsInternal(false);
            console.log("Modal closed and state reset");
        } catch (err: any) {
            console.error("handleAddResponse error", err);
            toast({ title: "Lỗi khi xử lý", description: String(err?.message || err), variant: "destructive" });
        } finally {
            setIsProcessingResponse(false);
        }
    };
    const getStatusBadge = (status: string) => {
        const variants = {
            new: "bg-blue-100 text-blue-800",
            open: "bg-green-100 text-green-800",
            pending: "bg-yellow-100 text-yellow-800",
            resolved: "bg-purple-100 text-purple-800",
            closed: "bg-gray-100 text-gray-800",
        };

        const labels = {
            new: "Mới",
            open: "Đang xử lý",
            pending: "Chờ phản hồi",
            resolved: "Đã giải quyết",
            closed: "Đã đóng",
        };

        return (
            <Badge className={variants[status as keyof typeof variants]}>
                {labels[status as keyof typeof labels]}
            </Badge>
        );
    };

    const getPriorityBadge = (priority: string) => {
        const variants = {
            low: "bg-gray-100 text-gray-800",
            medium: "bg-blue-100 text-blue-800",
            high: "bg-orange-100 text-orange-800",
            urgent: "bg-red-100 text-red-800",
        };

        const labels = {
            low: "Thấp",
            medium: "Trung bình",
            high: "Cao",
            urgent: "Khẩn cấp",
        };

        return (
            <Badge className={variants[priority as keyof typeof variants]}>
                {labels[priority as keyof typeof labels]}
            </Badge>
        );
    };

    const getCategoryLabel = (category: string) => {
        const labels = {
            technical: "Kỹ thuật",
            billing: "Thanh toán",
            account: "Tài khoản",
            general: "Chung",
            complaint: "Khiếu nại",
            cancel: "Hủy Đơn",
        };
        return labels[category as keyof typeof labels] || category;
    };

    const columns: Column[] = [
        {
            key: "title",
            title: "Ticket",
            sortable: true,
            render: (value, record) => (
                <div>
                    <div className="font-medium">{record.title}</div>
                    <div className="text-sm text-gray-500">#{record.id}</div>
                </div>
            ),
        },
        {
            key: "customerName",
            title: "Khách hàng",
            sortable: true,
            render: (value, record) => (
                <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={record.customerAvatar} />
                        <AvatarFallback>{record.customerName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="font-medium">{record.customerName}</div>
                        <div className="text-sm text-gray-500">{record.customerEmail}</div>
                    </div>
                </div>
            ),
        },
        {
            key: "category",
            title: "Loại",
            sortable: true,
            render: (value) => getCategoryLabel(value),
        },
        {
            key: "priority",
            title: "Ưu tiên",
            sortable: true,
            render: (value) => getPriorityBadge(value),
        },
        {
            key: "status",
            title: "Trạng thái",
            sortable: true,
            render: (value) => getStatusBadge(value),
        },
        // Người xử lý
        // {
        //     key: "assignedToName",
        //     title: "Người xử lý",
        //     render: (_value, record) => (
        //         <Select
        //             value={record.assignedTo ?? "unassigned"}
        //             onValueChange={(value) => {
        //                 handleAssignmentChange(record.id, value);
        //             }}
        //         >
        //             <SelectTrigger className="w-40">
        //                 <SelectValue
        //                     placeholder="Chọn phân công"
        //                 // Hiển thị đúng label theo giá trị select
        //                 >
        //                     {
        //                         record.assignedTo
        //                             ? admins.find((a) => a.id === record.assignedTo)?.name || "Chưa phân công"
        //                             : "Chưa phân công"
        //                     }
        //                 </SelectValue>
        //             </SelectTrigger>
        //             <SelectContent>
        //                 <SelectItem value="unassigned">Chưa phân công</SelectItem>
        //                 {admins.map((admin: any) => (
        //                     <SelectItem key={admin.id} value={admin.id}>
        //                         {admin.name}
        //                     </SelectItem>
        //                 ))}
        //             </SelectContent>
        //         </Select>
        //     ),
        // },
        {
            key: "createdAt",
            title: "Ngày tạo",
            sortable: true,
            render: (value) => new Date(value).toLocaleDateString("vi-VN"),
        },
        {
            key: "actions",
            title: "Thao tác",
            render: (_value, record) => (
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleView(record)}
                        title="Xem chi tiết"
                        type="button"
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Select
                        value={record.status}
                        onValueChange={(value) => handleStatusChange(record.id, value)}
                    >
                        <SelectTrigger className="w-32">
                            <SelectValue placeholder="Trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="new">Mới</SelectItem>
                            <SelectItem value="open">Đang xử lý</SelectItem>
                            <SelectItem value="pending">Chờ phản hồi</SelectItem>
                            <SelectItem value="resolved">Đã giải quyết</SelectItem>
                            <SelectItem value="closed">Đã đóng</SelectItem>
                        </SelectContent>
                    </Select>
                    {/* <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(record.id)}
                        title="Xóa"
                        type="button"
                    >
                        <Trash className="h-4 w-4" />
                    </Button> */}
                </div>
            ),
        },
    ];
    const formatVND = (n?: number | null) =>
        typeof n === "number" ? n.toLocaleString("vi-VN") + " ₫" : "-";
    return (
        <div className="p-6 space-y-6 bg-gray-50">
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Chăm sóc khách hàng</h1>
                        <p className="text-gray-600">Quản lý ticket hỗ trợ khách hàng</p>
                    </div>
                    {/* <Button onClick={() => setModalOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Tạo ticket mới
                    </Button> */}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Ticket mới</CardTitle>
                            <MessageSquare className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {tickets.data?.filter((t: SupportTicket) => t.status === "new").length || 0}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Đang xử lý</CardTitle>
                            <Clock className="h-4 w-4 text-orange-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {tickets.data?.filter((t: SupportTicket) => t.status === "open").length || 0}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Đã giải quyết</CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {tickets.data?.filter((t: SupportTicket) => t.status === "resolved").length || 0}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Bộ lọc</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Tìm kiếm ticket..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <Select
                                value={filters.status}
                                onValueChange={(value) => setFilters({ ...filters, status: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Trạng thái" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                                    <SelectItem value="new">Mới</SelectItem>
                                    <SelectItem value="open">Đang xử lý</SelectItem>
                                    <SelectItem value="pending">Chờ phản hồi</SelectItem>
                                    <SelectItem value="resolved">Đã giải quyết</SelectItem>
                                    <SelectItem value="closed">Đã đóng</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select
                                value={filters.priority}
                                onValueChange={(value) => setFilters({ ...filters, priority: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Ưu tiên" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả ưu tiên</SelectItem>
                                    <SelectItem value="low">Thấp</SelectItem>
                                    <SelectItem value="medium">Trung bình</SelectItem>
                                    <SelectItem value="high">Cao</SelectItem>
                                    <SelectItem value="urgent">Khẩn cấp</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select
                                value={filters.category}
                                onValueChange={(value) => setFilters({ ...filters, category: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Loại" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả loại</SelectItem>
                                    <SelectItem value="technical">Kỹ thuật</SelectItem>
                                    <SelectItem value="billing">Thanh toán</SelectItem>
                                    <SelectItem value="account">Tài khoản</SelectItem>
                                    <SelectItem value="general">Chung</SelectItem>
                                    <SelectItem value="complaint">Khiếu nại</SelectItem>
                                    <SelectItem value="cancel">Hủy Đơn</SelectItem>
                                </SelectContent>
                            </Select>
                            {/* <Select
                                value={filters.assignedTo}
                                onValueChange={(value) => setFilters({ ...filters, assignedTo: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Người xử lý" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả</SelectItem>
                                    <SelectItem value="unassigned">Chưa phân công</SelectItem>
                                    {admins.map((admin: any) => (
                                        <SelectItem key={admin.id} value={admin.id}>
                                            {admin.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select> */}
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setFilters({
                                        status: "all",
                                        priority: "all",
                                        category: "all",
                                        assignedTo: "all",
                                    });
                                    setSearchTerm("");
                                    setPagination({ current: 1, pageSize: 10, total: mockTickets.length });
                                }}
                            >
                                <Filter className="h-4 w-4 mr-2" />
                                Xóa bộ lọc
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Danh sách ticket ({tickets.total || 0})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {tickets.data?.length === 0 && !isLoading ? (
                            <div className="text-center py-4 text-gray-500">
                                Không tìm thấy ticket nào phù hợp với bộ lọc.
                            </div>
                        ) : (
                            <DataTable
                                columns={columns}
                                data={tickets.data || []}
                                rowKey="id"
                                pagination={{
                                    current: pagination.current,
                                    pageSize: pagination.pageSize,
                                    total: tickets.total || 0,
                                    showSizeChanger: true,
                                }}
                                onPaginationChange={(page, pageSize) => {
                                    setPagination({
                                        current: page,
                                        pageSize,
                                        total: tickets.total || 0,
                                    });
                                }}
                                loading={isLoading}
                            />
                        )}
                    </CardContent>
                </Card>

                <ModalForm
                    open={viewModalOpen}
                    onOpenChange={(open) => {
                        if (!open) {
                            setViewModalOpen(false);
                            setSelectedTicket(null);
                            setResponseContent("");
                            setIsInternal(false);
                        } else {
                            setViewModalOpen(true);
                        }
                    }}
                    title="Chi tiết ticket"
                    size="large"
                    mode="view"
                >
                    {selectedTicket && (
                        <div className="max-h-[70vh] overflow-y-auto pr-2">
                            <div className="space-y-6">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold">{selectedTicket.title}</h3>
                                        <p className="text-sm text-gray-500">#{selectedTicket.id}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {getStatusBadge(selectedTicket.status)}
                                        {getPriorityBadge(selectedTicket.priority)}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={selectedTicket.customerAvatar} />
                                        <AvatarFallback>{selectedTicket.customerName?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="font-medium">{selectedTicket.customerName}</div>
                                        <div className="text-sm text-gray-500">{selectedTicket.customerEmail}</div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="font-medium">Loại:</span> {getCategoryLabel(selectedTicket.category)}
                                    </div>
                                    <div>
                                        <span className="font-medium">Người xử lý:</span> {selectedTicket.assignedToName || "Chưa phân công"}
                                    </div>
                                    <div>
                                        <span className="font-medium">Ngày tạo:</span>{" "}
                                        {new Date(selectedTicket.createdAt).toLocaleString("vi-VN")}
                                    </div>
                                    <div>
                                        <span className="font-medium">Cập nhật:</span>{" "}
                                        {new Date(selectedTicket.updatedAt).toLocaleString("vi-VN")}
                                    </div>
                                </div>
                                {selectedTicket.tags.length > 0 && (
                                    <div>
                                        <span className="font-medium text-sm">Tags:</span>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {selectedTicket.tags.map((tag, index) => (
                                                <Badge key={index} variant="secondary" className="text-xs">
                                                    <Tag className="h-3 w-3 mr-1" />
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <h4 className="font-medium mb-2">Nội dung gốc:</h4>
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <p className="whitespace-pre-wrap">{selectedTicket.content}</p>
                                    </div>
                                </div>
                                <Separator />
                                {/* <div>
                                    <h4 className="font-medium mb-4">Lịch sử trả lời ({selectedTicket.responses.length})</h4>
                                    <div className="space-y-4 max-h-60 overflow-y-auto">
                                        {selectedTicket.responses.map((response) => (
                                            <div
                                                key={response.id}
                                                className={`p-4 rounded-lg ${response.authorType === "admin"
                                                    ? response.isInternal
                                                        ? "bg-yellow-50 border-l-4 border-yellow-400"
                                                        : "bg-blue-50 border-l-4 border-blue-400"
                                                    : "bg-gray-50 border-l-4 border-gray-400"
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">{response.authorName}</span>
                                                        <Badge variant={response.authorType === "admin" ? "default" : "secondary"}>
                                                            {response.authorType === "admin" ? "Admin" : "Khách hàng"}
                                                        </Badge>
                                                        {response.isInternal && (
                                                            <Badge variant="destructive" className="text-xs">
                                                                Nội bộ
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <span className="text-sm text-gray-500">
                                                        {new Date(response.createdAt).toLocaleString("vi-VN")}
                                                    </span>
                                                </div>
                                                <p className="whitespace-pre-wrap">{response.content}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div> */}
                                <Separator />
                                <div>
                                    {selectedTicket && (
                                        <>
                                            {/*
                                If this is a cancel request show handler UI and refund details.
                                Otherwise show normal reply UI.
                            */}
                                            {(() => {
                                                const isCancel = selectedTicket.category === "cancel";
                                                return (
                                                    <>
                                                        <h4 className="font-medium mb-4">{isCancel ? "Xử lý yêu cầu" : "Thêm phản hồi"}</h4>

                                                        {/* show refund / cancel details for cancel tickets */}
                                                        {isCancel && (selectedTicket as any).refundInfo && (
                                                            <div className="mb-4 p-3 bg-gray-50 rounded">
                                                                <div className="font-medium mb-2">Chi tiết hoàn / hủy</div>
                                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                                    <div>
                                                                        <span className="font-medium">Order:</span>{" "}
                                                                        {selectedTicket.orderId ?? "-"}
                                                                    </div>
                                                                    <div>
                                                                        <span className="font-medium">TransId:</span>{" "}
                                                                        {(selectedTicket as any).refundInfo?.transId ?? "-"}
                                                                    </div>
                                                                    <div>
                                                                        <span className="font-medium">zp_trans_id:</span>{" "}
                                                                        {(selectedTicket as any).refundInfo?.zp_trans_id ?? "-"}
                                                                    </div>
                                                                    <div>
                                                                        <span className="font-medium">Phí phạt:</span>{" "}
                                                                        {formatVND((selectedTicket as any).refundInfo?.airlinePenalty)}
                                                                    </div>
                                                                    <div>
                                                                        <span className="font-medium">Thuế/Phí không hoàn:</span>{" "}
                                                                        {formatVND((selectedTicket as any).refundInfo?.taxes)}
                                                                    </div>
                                                                    <div>
                                                                        <span className="font-medium">Phí nền tảng:</span>{" "}
                                                                        {formatVND((selectedTicket as any).refundInfo?.platformFee)}
                                                                    </div>
                                                                    <div>
                                                                        <span className="font-medium">Hoàn dự kiến:</span>{" "}
                                                                        {formatVND((selectedTicket as any).refundInfo?.refundAmount)}
                                                                    </div>
                                                                    <div>
                                                                        <span className="font-medium">Tiền tệ:</span>{" "}
                                                                        {(selectedTicket as any).refundInfo?.currency ?? "VND"}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="space-y-4">
                                                            <Textarea
                                                                value={responseContent}
                                                                onChange={(e) => setResponseContent(e.target.value)}
                                                                placeholder={isCancel ? "Ghi rõ kết quả xử lý (ví dụ: chấp nhận hoàn, yêu cầu thêm thông tin...)" : "Nhập phản hồi..."}
                                                                rows={4}
                                                            />
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center space-x-2">
                                                                    <input
                                                                        type="checkbox"
                                                                        id="isInternal"
                                                                        checked={isInternal}
                                                                        onChange={(e) => setIsInternal(e.target.checked)}
                                                                        className="rounded"
                                                                    />
                                                                    <Label htmlFor="isInternal">Ghi chú nội bộ (không gửi cho khách hàng)</Label>
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    {!isCancel && selectedTicket.status !== "resolved" && selectedTicket.status !== "closed" && (
                                                                        <Button
                                                                            onClick={handleAddResponse}
                                                                            disabled={!responseContent.trim() || addResponseMutation.isPending || isProcessingResponse}
                                                                            variant="outline"
                                                                        >
                                                                            {addResponseMutation.isPending ? "Đang gửi..." : "Gửi phản hồi (gửi mail)"}
                                                                        </Button>
                                                                    )}
                                                                    {isCancel && selectedTicket.status !== "resolved" && selectedTicket.status !== "closed" && (
                                                                        <Button
                                                                            onClick={handleAddResponse}
                                                                            disabled={!responseContent.trim() || addResponseMutation.isPending || isProcessingResponse}
                                                                            variant="destructive"
                                                                        >
                                                                            {isProcessingResponse ? "Đang xử lý hoàn tiền..." : "Xử lý hoàn tiền (gửi mail)"}
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </>
                                                );
                                            })()}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </ModalForm>

                {/* <ConfirmModal
                    isOpen={!!deleteId}
                    onClose={() => setDeleteId(null)}
                    onConfirm={() => {
                        const idToDelete = deleteId;
                        if (idToDelete) {
                            // invoke mutation with captured id before clearing state
                            deleteTicketMutation.mutate(idToDelete);
                            setDeleteId(null);
                        }
                    }}
                    title="Xóa ticket"
                    description="Bạn có chắc chắn muốn xóa ticket này? Hành động này không thể hoàn tác."
                    loading={deleteTicketMutation.isPending}
                /> */}
            </div>
        </div>
    );
};

export default Support;