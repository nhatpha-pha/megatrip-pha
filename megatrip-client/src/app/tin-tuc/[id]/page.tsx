"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Layout from "../../components/Layout";
import NewsCard from "../NewsCard";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { Separator } from "../../components/ui/separator";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "../../components/ui/accordion"
import {
    ArrowLeft,
    Calendar,
    Clock,
    Eye,
    Heart,
    Share2,
    CheckCircle,
    Tag,
    TagIcon,
    Lightbulb,
} from "lucide-react";
import { useToast } from "../../hooks/use-toast";

const DEFAULT_PLACEHOLDER = "/placeholder.svg";

const formatDate = (isoDate?: string) =>
    isoDate ? new Date(isoDate).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "";

const formatReadTime = (minutes = 3) => `${minutes} phút đọc`;

const getInitials = (name = "") =>
    name
        .split(" ")
        .filter(Boolean)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .slice(-2)
        .join("");

// Dùng lại interface bạn đã có: PracticalTip, ArticleFAQ, NewsArticle

// Cách sinh động (programmatic)


// Kết quả đã flatten (ready-to-u
const allPracticalTips = [
    { title: 'Ưu tiên chuyến bay sáng', description: 'Lựa chọn khung giờ bay trước 9h giúp hạn chế trễ chuyến do mật độ khai thác cao trong kỳ nghỉ Tết.' },
    { title: 'Đặt tour trải nghiệm địa phương', description: 'Các hoạt động như làm bánh chưng, xem múa lân hay gói bánh tét thường hết chỗ sớm, nên đăng ký ngay khi chốt lịch trình.' },
    { title: 'Mang quà Tết gọn nhẹ', description: 'Ưu tiên đặc sản đóng gói chân không và chia nhỏ vào hành lý xách tay để tránh quá tải hành lý ký gửi.' },

    { title: 'Kiểm tra điều kiện đổi vé', description: 'Vé ưu đãi có điều kiện đổi hạn chế, hãy cân nhắc mua thêm gói linh hoạt nếu lịch trình chưa cố định.' },
    { title: 'Đặt dịch vụ xe trung chuyển', description: 'Các resort lớn ở Côn Đảo thường cách sân bay 12-15 km, đặt trước xe trung chuyển giúp bạn tiết kiệm thời gian sau chuyến bay.' },
    { title: 'Mang theo giấy tờ tùy thân bản gốc', description: 'Sân bay Cỏ Ống chưa hỗ trợ xác thực định danh điện tử, bạn cần mang CCCD hoặc hộ chiếu bản gốc khi làm thủ tục.' },

    { title: 'Săn mã giảm giá hàng tuần', description: 'Các ứng dụng đặt vé xe khách và khách sạn thường tung mã giảm 10-15% vào thứ Tư, hãy đặt lịch nhắc để không bỏ lỡ.' },
    { title: 'Thuê đồ tại Sa Pa', description: 'Các cửa hàng trên phố Cầu Mây cung cấp dịch vụ thuê áo khoác, gậy trekking, áo váy dân tộc với giá phải chăng, giảm tải hành lý.' },
    { title: 'Mang sẵn tiền lẻ', description: 'Chợ phiên vùng cao chủ yếu giao dịch tiền mặt, chuẩn bị tiền lẻ giúp bạn thương lượng dễ dàng và mua đặc sản nhanh hơn.' },

    { title: 'Ưu tiên mua vé online', description: 'Đặt vé trên ứng dụng chính thức của nhà xe giúp bạn chủ động chọn ghế, tránh rủi ro mua phải vé giả tại bến.' },
    { title: 'Chuẩn bị giấy tờ khi đổi vé', description: 'Nếu muốn đổi hoặc trả vé, bạn cần mang CMND/CCCD trùng với thông tin đặt vé và đến bến trước giờ khởi hành ít nhất 4 tiếng.' },
    { title: 'Sắp xếp hành lý gọn nhẹ', description: 'Xếp hành lý vào vali nhỏ hoặc balo có khóa để dễ di chuyển giữa các bến, tránh thất lạc khi xe đông khách.' },

    { title: 'Săn combo trọn gói', description: 'Các hãng lữ hành thường tung combo vé máy bay + khách sạn cho Nha Trang mỗi tháng, giúp tiết kiệm đến 3 triệu đồng.' },
    { title: 'Đặt vé cáp treo Hòn Thơm', description: 'Ở Phú Quốc, bạn nên đặt vé cáp treo và show Kiss Of The Sea trước 3 ngày để có ghế đẹp.' },
    { title: 'Chọn khu vực lưu trú', description: 'Gia đình có trẻ nhỏ nên ở khu Bãi Dài Phú Quốc để gần Safari, còn nhóm bạn trẻ có thể chọn trung tâm Nha Trang để dễ di chuyển.' },

    { title: 'Chọn vali có ngăn mở rộng', description: 'Với chuyến đi dài ngày, vali có khóa kéo mở rộng giúp bạn linh hoạt nếu mua sắm thêm quà.' },
    { title: 'Đánh dấu hành lý nổi bật', description: 'Sử dụng dây ruy băng màu hoặc thẻ hành lý cá nhân để dễ nhận diện trên băng chuyền.' },
    { title: 'Mang một túi gấp gọn', description: 'Túi tote gấp gọn hữu ích khi bạn cần thêm không gian xách tay trong lúc về.' },

    { title: 'Đặt lịch trải nghiệm food tour', description: 'Các food tour có hướng dẫn viên địa phương giúp bạn thử món đặc trưng và kể chuyện lịch sử thú vị.' },
    { title: 'Mang theo chai nước nhỏ', description: 'Đi bộ nhiều nên cần bổ sung nước thường xuyên, chai nước nhỏ dễ mang và có thể refill tại khách sạn.' },
    { title: 'Kiểm tra giờ mở cửa', description: 'Một số quán ăn gia truyền chỉ mở một khung giờ cố định, hãy tìm hiểu trước để khỏi chờ đợi.' },

    { title: 'Săn voucher trước khi đặt', description: 'Sử dụng mã thanh toán từ ví điện tử giúp tiết kiệm thêm 200.000 - 500.000 đồng cho mỗi booking.' },
    { title: 'Đọc kỹ điều khoản hoàn hủy', description: 'Một số tour khuyến mãi không hỗ trợ hoàn tiền, hãy cân nhắc mua bảo hiểm du lịch để bảo vệ quyền lợi.' },
    { title: 'Kiểm tra lịch trình chi tiết', description: 'Đảm bảo tour có đủ thời gian tự do để bạn khám phá theo sở thích, tránh lịch trình quá dày đặc.' },
];
const allFaq = [
    { question: 'Có nên tự lái xe đi Sa Pa trong dịp Tết?', answer: 'Bạn chỉ nên tự lái khi có kinh nghiệm đường đèo và kiểm tra thời tiết trước chuyến đi. Nếu trời có băng tuyết, hãy chuyển sang đi xe khách hoặc tàu hỏa để đảm bảo an toàn.' },
    { question: 'Đi du lịch Tết nên chuẩn bị tiền mặt thế nào?', answer: 'Ngoài thẻ ngân hàng, hãy chuẩn bị một khoản tiền mặt vừa đủ cho chi tiêu 2-3 ngày vì nhiều điểm du lịch miền núi chưa hỗ trợ thanh toán điện tử.' },

    { question: 'Tôi có thể mang thiết bị lặn biển lên máy bay không?', answer: 'Bạn được phép ký gửi thiết bị lặn biển nếu đáp ứng quy định về kích thước và trọng lượng. Vui lòng thông báo trước cho hãng ít nhất 24 giờ để được hỗ trợ đóng gói an toàn.' },
    { question: 'Nếu chuyến bay bị hoãn vì thời tiết thì sao?', answer: 'Vietnam Airlines sẽ thông báo qua SMS và email. Hành khách được hỗ trợ đổi chuyến miễn phí trong cùng ngày hoặc hoàn vé theo quy định nếu chuyến bay phải hủy.' },

    { question: 'Có nên đi Sa Pa tự túc hay mua tour?', answer: 'Nếu bạn rành đường và muốn linh hoạt thời gian, đi tự túc sẽ tiết kiệm hơn. Tuy nhiên, tour trọn gói phù hợp với gia đình có trẻ nhỏ vì đã bao gồm xe đưa đón, ăn uống và hướng dẫn viên.' },
    { question: 'Sa Pa tháng 12 có tuyết không?', answer: 'Không phải năm nào Sa Pa cũng có tuyết. Bạn nên theo dõi bản tin thời tiết và các nhóm săn tuyết để cập nhật tình hình trước chuyến đi.' },

    { question: 'Nếu tôi lỡ chuyến thì có được hỗ trợ?', answer: 'Bạn có thể đổi sang chuyến kế tiếp nếu còn chỗ, phí đổi dao động 10-20% giá vé. Liên hệ trực tiếp quầy hỗ trợ của nhà xe để được sắp xếp.' },
    { question: 'Trẻ em có cần mua vé riêng không?', answer: 'Trẻ em từ 6 tuổi trở lên phải mua vé riêng. Với trẻ nhỏ hơn, một người lớn được kèm một trẻ em nhưng phải đăng ký chỗ trước với nhà xe.' },

    { question: 'Nên đi Phú Quốc hay Nha Trang nếu có 4 ngày nghỉ?', answer: 'Nếu thích nghỉ dưỡng sang trọng và nhiều hoạt động giải trí, hãy chọn Phú Quốc. Nếu ưu tiên ngân sách tiết kiệm và muốn khám phá văn hóa địa phương, Nha Trang là lựa chọn hợp lý.' },
    { question: 'Có thể kết hợp hai điểm đến trong cùng chuyến đi không?', answer: 'Bạn có thể bay thẳng từ Phú Quốc tới Nha Trang thông qua các chuyến charter mùa cao điểm, tuy nhiên chi phí khá cao. Lý tưởng nhất là tách thành hai chuyến để tận hưởng trọn vẹn từng nơi.' },

    { question: 'Tôi có thể mang pin sạc dự phòng dung lượng lớn không?', answer: 'Pin sạc dự phòng dung lượng dưới 20.000 mAh được phép mang lên máy bay trong hành lý xách tay. Không được ký gửi pin.' },
    { question: 'Có nên khóa vali khi ký gửi?', answer: 'Bạn nên sử dụng khóa đạt chuẩn TSA để nhân viên an ninh có thể kiểm tra khi cần mà không làm hỏng vali.' },

    { question: 'Ăn ở vỉa hè có an toàn không?', answer: 'Bạn nên chọn quán sạch sẽ, đông khách địa phương và có nguồn nguyên liệu rõ ràng. Hạn chế những quán không có giấy phép hoặc điều kiện vệ sinh kém.' },
    { question: 'Có cần đặt chỗ trước?', answer: 'Một số quán nổi tiếng như phở Bát Đàn, bún chả Hương Liên thường đông, bạn nên đi sớm hoặc đặt trước khi có thể.' },

    { question: 'Có thể đổi tên khách sau khi đặt tour không?', answer: 'Bạn có thể đổi tên miễn phí trong vòng 48 giờ kể từ khi đặt tour. Sau thời gian này, phí đổi tên áp dụng theo chính sách của hãng hàng không.' },
    { question: 'Tour có bao gồm bảo hiểm du lịch không?', answer: 'Hầu hết tour khuyến mãi vẫn bao gồm bảo hiểm du lịch với mức đền bù tối đa 100 triệu đồng/người cho các sự cố trong hành trình.' },
];

export default function ChiTietTinTuc() {
    const params = useParams() as { id?: string };
    const id = params?.id;
    const { toast } = useToast();

    const [article, setArticle] = useState<any | null>(null);
    const [related, setRelated] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        (async () => {
            try {
                // fetch article by id (id can be _id or slug)
                const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080'}/api/admin/news/${id}`);
                if (!r.ok) {
                    setArticle(null);
                    setRelated([]);
                    setLoading(false);
                    return;
                }
                const a = await r.json();

                // normalize article fields
                const normalized = {
                    id: a._id?.$oid ?? a._id ?? a.id ?? a.slug ?? id,
                    title: a.title,
                    category: a.category,
                    categoryName:
                        a.category === "travel" ? "Cẩm nang du lịch" :
                            a.category === "promotion" ? "Ưu đãi & khuyến mãi" :
                                a.category === "company" ? "Tin công ty" :
                                    a.category === "policy" ? "Chính sách" :
                                        a.category || "Khác",
                    author: a.author || { id: "system", name: "Admin", avatar: "" },
                    publishedAt: a.publishedAt || a.createdAt,
                    readTime: a.readTime || 3,
                    views: a.views || 0,
                    likes: a.likes || 0,
                    image: a.heroImage || (typeof a.content === "string" ? extractFirstImage(a.content) : DEFAULT_PLACEHOLDER),
                    excerpt: a.summary || (typeof a.content === "string" ? stripHtml(a.content).slice(0, 300) : ""),
                    contentHtml: a.content || "",
                    featured: !!a.featured,
                    raw: a,
                };
                setArticle(normalized);

                // fetch related: try same category, excluding current id
                const q = encodeURIComponent("");
                const relRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080'}/api/admin/news?page=1&limit=6&status=published&category=${normalized.category}`);
                if (!relRes.ok) {
                    setRelated([]);
                    setLoading(false);
                    return;
                }
                const relJson = await relRes.json();
                const items = Array.isArray(relJson.data) ? relJson.data : [];
                const mapped = items
                    .map((x: any) => ({
                        id: x._id?.$oid ?? x._id ?? x.id ?? x.slug,
                        title: x.title,
                        category: x.category,
                        categoryName:
                            x.category === "travel" ? "Cẩm nang du lịch" :
                                x.category === "promotion" ? "Ưu đãi & khuyến mãi" :
                                    x.category === "company" ? "Tin công ty" :
                                        x.category === "policy" ? "Chính sách" :
                                            x.category || "Khác",
                        excerpt: x.summary || (typeof x.content === "string" ? stripHtml(x.content).slice(0, 200) : ""),
                        image: x.heroImage || (typeof x.content === "string" ? extractFirstImage(x.content) : DEFAULT_PLACEHOLDER),
                        publishedAt: x.publishedAt || x.createdAt,
                        views: x.views || 0,
                    }))
                    .filter((x: any) => String(x.id) !== String(normalized.id))
                    .slice(0, 3);
                setRelated(mapped);
            } catch (err: any) {
                console.error("Error loading article", err);
                toast?.({ title: "Lỗi tải bài viết", description: err?.message || String(err), variant: "destructive" });
                setArticle(null);
                setRelated([]);
            } finally {
                setLoading(false);
            }
        })();
    }, [id, toast]);

    if (!id) {
        return (
            <>
                <div className="container py-24">
                    <Card className="max-w-xl mx-auto text-center">
                        <CardHeader>
                            <CardTitle className="text-2xl">Không tìm thấy bài viết</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-muted-foreground">Đường dẫn không hợp lệ.</p>
                            <Button asChild>
                                <Link href="/tin-tuc">Quay lại trang tin tức</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </>
        );
    }

    if (loading) {
        return (
            <>
                <div className="container py-24">
                    <Card className="max-w-3xl mx-auto text-center p-8">Đang tải bài viết...</Card>
                </div>
            </>
        );
    }

    if (!article) {
        return (
            <>
                <div className="container py-24">
                    <Card className="max-w-xl mx-auto text-center">
                        <CardHeader>
                            <CardTitle className="text-2xl">Không tìm thấy bài viết</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-muted-foreground">Bài viết có thể đã bị xóa hoặc không tồn tại.</p>
                            <Button asChild>
                                <Link href="/tin-tuc">Quay lại trang tin tức</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </>
        );
    }

    const displayedLikes = (article.raw?.likes || 0);

    return (
        <>
            <section className="bg-gradient-to-br from-blue-50 to-indigo-50 mb-8">
                <div className="container py-10 space-y-6">
                    <Button variant="ghost" size="sm" className="inline-flex items-center gap-2" asChild>
                        <Link href="/tin-tuc">
                            <ArrowLeft className="h-4 w-4" />
                            Quay lại tin tức
                        </Link>
                    </Button>

                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                            <TagIcon className="w-3 h-3 text-gray-400" />

                            <Badge variant="secondary">{article.categoryName}</Badge>
                            {(article.raw?.tags || []).slice(0, 6).map((tag: string) => (
                                <Badge key={tag} variant="outline" className="flex items-center gap-1">
                                    <Tag className="h-3 w-3" />
                                    {tag}
                                </Badge>
                            ))}
                        </div>

                        <h1 className="text-3xl lg:text-5xl font-bold leading-tight">{article.title}</h1>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                    {article.author?.avatar ? <AvatarImage src={article.author.avatar} alt={article.author.name} /> : <AvatarFallback>{getInitials(article.author?.name)}</AvatarFallback>}
                                </Avatar>
                                <span className="font-medium text-foreground">{article.author?.name || "Admin"}</span>
                            </span>
                            <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {formatDate(article.publishedAt)}
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {formatReadTime(article.readTime)}
                            </span>
                            {/* <span className="flex items-center gap-1">
                                <Eye className="h-4 w-4" />
                                {(article.views || 0).toLocaleString("vi-VN")} lượt xem
                            </span> */}
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <Button variant="outline" size="sm" onClick={() => toast?.({ title: "Đã lưu bài viết (demo)" })}>
                                <Heart className="h-4 w-4 mr-2" />
                                Lưu bài viết ({displayedLikes})
                            </Button>
                            <Button variant="outline" size="sm" onClick={async () => {
                                try {
                                    await navigator.clipboard.writeText(window.location.href);
                                    toast?.({ title: "Đã sao chép liên kết" });
                                } catch {
                                    toast?.({ title: "Không thể sao chép liên kết", variant: "destructive" });
                                }
                            }}>
                                <Share2 className="h-4 w-4 mr-2" />
                                Chia sẻ
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            <div className="container">
                <div className="rounded-2xl overflow-hidden shadow-sm -mt-12 border bg-background">
                    <img src={article.image || DEFAULT_PLACEHOLDER} alt={article.title} className="w-full h-[320px] object-cover" />
                </div>
            </div>

            <div className="container py-12 grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
                <article className="space-y-10">
                    <div dangerouslySetInnerHTML={{ __html: article.contentHtml }} />

                    {related.length > 0 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-semibold">Bài viết liên quan</h2>
                            <div className="grid gap-6 md:grid-cols-3">
                                {related.map((ra) => (
                                    <Card key={ra.id} className="hover:shadow-md transition-shadow h-full flex flex-col">
                                        <div className="h-40 overflow-hidden">
                                            <Link prefetch={false} href={`/tin-tuc/${ra.id}`}>

                                                <img src={ra.image || DEFAULT_PLACEHOLDER} alt={ra.title} className="w-full h-full object-cover rounded-lg" />
                                            </Link>
                                        </div>
                                        <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-3">
                                            <div>
                                                <Badge variant="outline">{ra.categoryName}</Badge>
                                                <h3 className="font-semibold text-base leading-snug line-clamp-2 mt-2">
                                                    <Link href={`/tin-tuc/${ra.id}`} className="hover:text-primary">
                                                        {ra.title}
                                                    </Link>
                                                </h3>
                                                <p className="text-sm text-muted-foreground line-clamp-3 mt-1">{ra.excerpt}</p>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-muted-foreground">{formatDate(ra.publishedAt)}</span>
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={`/tin-tuc/${ra.id}`}>Đọc thêm</Link>
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}
                </article>

                {/* Sidebar can reuse existing widgets or trending list */}
                <aside className="lg:w-80 space-y-6 ml-auto">
                    <NewsSidebar />
                </aside>
            </div>
        </>
    );
}

/* small helpers */

function stripHtml(html = "") {
    return String(html).replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function extractFirstImage(html = "") {
    const m = String(html).match(/<img[^>]+src=(["'])([^"']+)\1/);
    return (m && m[2]) || DEFAULT_PLACEHOLDER;
}

/* Simple sidebar component for reuse */
function shuffle<T>(arr: T[]) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
function NewsSidebar() {
    const [tips, setTips] = useState(() => shuffle(allPracticalTips).slice(0, 5));
    const [faqs, setFaqs] = useState(() => shuffle(allFaq).slice(0, 5));

    // re-randomize only on mount
    useEffect(() => {
        setTips(shuffle(allPracticalTips).slice(0, 5));
        setFaqs(shuffle(allFaq).slice(0, 5));
    }, []);

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Đăng ký nhận tin</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">Nhận thông tin mới nhất về khuyến mãi và mẹo du lịch</p>
                    <div className="space-y-3">
                        <input className="w-full rounded border px-3 py-2" placeholder="Email của bạn" />
                        <Button className="w-full">Đăng ký</Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Mẹo hữu ích</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {tips.map((t, i) => (
                        <div key={i} className="text-sm">
                            <div className="font-medium flex items-start gap-3 mb-1" >
                                <Lightbulb className="h-5 w-5 text-amber-500 mt-0.5" />

                                {t.title}</div>
                            <div className="text-muted-foreground text-xs">{t.description}</div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Câu hỏi thường gặp</CardTitle>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible className="space-y-2">
                        {faqs.map((f, idx) => (
                            <AccordionItem value={`faq-${idx}`} key={idx}>
                                <AccordionTrigger className="w-full text-left text-sm font-medium flex justify-start px-4 py-3">
                                    {f.question}
                                </AccordionTrigger>
                                <AccordionContent className="px-4 py-3 text-sm text-muted-foreground">
                                    {f.answer}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </CardContent>
            </Card>
        </>
    );
}