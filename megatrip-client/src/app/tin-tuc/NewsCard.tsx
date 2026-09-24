// ...existing code...
import Link from "next/link";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Clock, Calendar, User, Eye } from "lucide-react";

type Article = {
    id: string;
    title: string;
    image: string;
    excerpt?: string;
    category?: string;
    categoryName?: string;
    publishDate?: string;
    author?: string;
    views?: number;
    featured?: boolean;
    readTime?: string;
    likes?: number;
};

const CATEGORY_LABELS: Record<string, string> = {
    company: "Tin công ty",
    promotion: "Ưu đãi & khuyến mãi",
    travel: "Cẩm nang du lịch",
    policy: "Chính sách",
};

export default function NewsCard({ article, featured = false }: { article: Article; featured?: boolean }) {
    const categoryLabel = article.category === "travel" ? CATEGORY_LABELS.travel : (CATEGORY_LABELS[article.category || ""] || article.categoryName || article.category || "Khác");

    if (featured) {
        return (
            <Card className="mb-6 overflow-hidden hover:shadow-lg transition-shadow">
                <div className="md:flex">
                    <div className="md:w-1/2">
                        <Link prefetch={false} href={`/tin-tuc/${article.id}`}>

                            <img src={article.image} alt={article.title} className="w-full h-64 md:h-full object-cover" />
                        </Link>
                    </div>
                    <div className="md:w-1/2 p-6 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Badge variant="secondary">{categoryLabel}</Badge>
                                <Badge variant="destructive">Nổi bật</Badge>
                            </div>
                            <h3 className="text-xl font-bold mb-3 hover:text-primary transition-colors">
                                <Link prefetch={false} href={`/tin-tuc/${article.id}`}>{article.title}</Link>
                            </h3>
                            <p className="text-muted-foreground mb-4 line-clamp-3">{article.excerpt}</p>
                        </div>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <div className="flex items-center gap-4">
                                <span className="flex items-center"><User className="h-3 w-3 mr-1" />{article.author}</span>
                                <span className="flex items-center"><Calendar className="h-3 w-3 mr-1" />{article.publishDate}</span>
                                {/* <span className="flex items-center"><Clock className="h-3 w-3 mr-1" />{article.readTime}</span> */}
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-muted-foreground flex items-center"><Eye className="h-3 w-3 mr-1" />{(article.views || 0).toLocaleString()}</span>
                                <Button size="sm" asChild><Link prefetch={false} href={`/tin-tuc/${article.id}`}>Đọc thêm</Link></Button>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        );
    }

    // regular compact card
    return (
        <Card className="hover:shadow-md transition-shadow">
            <div className="md:flex">
                <div className="md:w-1/3">
                    <Link prefetch={false} href={`/tin-tuc/${article.id}`}>

                        <img src={article.image} alt={article.title} className="w-full h-48 md:h-full object-cover" />
                    </Link>
                </div>
                <div className="md:w-2/3 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{categoryLabel}</Badge>
                    </div>
                    <h3 className="text-lg font-semibold mb-2 hover:text-primary transition-colors">
                        <Link prefetch={false} href={`/tin-tuc/${article.id}`}>{article.title}</Link>
                    </h3>
                    <p className="text-muted-foreground mb-3 line-clamp-2">{article.excerpt}</p>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center"><User className="h-3 w-3 mr-1" />{article.author}</span>
                            <span className="flex items-center"><Calendar className="h-3 w-3 mr-1" />{article.publishDate}</span>
                            {/* <span className="flex items-center"><Clock className="h-3 w-3 mr-1" />{article.readTime}</span> */}
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground flex items-center"><Eye className="h-3 w-3 mr-1" />{(article.views || 0).toLocaleString()}</span>
                            <Button variant="outline" size="sm" asChild><Link prefetch={false} href={`/tin-tuc/${article.id}`}>Đọc thêm</Link></Button>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}
// ...existing code...