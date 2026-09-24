"use client"
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Separator } from '../components/ui/separator';
import {
    Newspaper,
    Search,
    Calendar,
    Clock,
    User,
    Eye,
    Heart,
    Share2,
    TrendingUp,
    MapPin,
    Plane,
    Coffee,
    Camera,
} from 'lucide-react';
import NewsCard from './NewsCard';

const DEFAULT_PLACEHOLDER = '/placeholder.svg';

export default function TinTuc() {
    const [articles, setArticles] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [favorites, setFavorites] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const res = await fetch('http://localhost:8080/api/admin/news?page=1&limit=1000&status=published');
                if (!res.ok) {
                    console.warn('Failed to fetch news', res.status);
                    setArticles([]);
                    setLoading(false);
                    return;
                }
                const json = await res.json();
                const items = Array.isArray(json.data) ? json.data : [];
                const mapped = items.map((a: any) => {
                    const id = a._id?.$oid ?? a._id ?? a.id ?? a.slug ?? String(Math.random());
                    let image = a.heroImage || a.image || DEFAULT_PLACEHOLDER;
                    if (!image && typeof a.content === 'string') {
                        const m = a.content.match(/<img[^>]+src=(["'])([^"']+)\1/);
                        if (m && m[2]) image = m[2];
                    }
                    return {
                        id,
                        title: a.title || 'Untitled',
                        category: a.category || 'uncategorized',
                        categoryName: a.category || 'Khác',
                        excerpt: a.summary || (typeof a.content === 'string' ? a.content.replace(/<[^>]+>/g, '').slice(0, 200) : ''),
                        image,
                        featured: !!a.featured,
                        author: a.author?.name || 'Admin',
                        publishDate: a.publishedAt ? (new Date(a.publishedAt)).toLocaleDateString('vi-VN') : (a.createdAt ? (new Date(a.createdAt)).toLocaleDateString('vi-VN') : ''),
                        readTime: a.readTime || '',
                        views: a.views || 0,
                        likes: a.likes || 0,
                        tags: a.tags || [],
                        raw: a,
                    };
                });
                setArticles(mapped);
            } catch (err) {
                console.warn('Error loading news', err);
                setArticles([]);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // derive categories with counts from fetched articles
    const categories = useMemo(() => {
        const map = new Map<string, { name: string; count: number }>();
        map.set('all', { name: 'Tất cả', count: articles.length });
        for (const a of articles) {
            const key = a.category || 'uncategorized';
            const existing = map.get(key);
            const label = key === 'travel' ? 'Cẩm nang du lịch' :
                key === 'promotion' ? 'Khuyến mãi' :
                    key === 'company' ? 'Tin công ty' :
                        key === 'policy' ? 'Chính sách' :
                            (a.categoryName || key);
            if (existing) {
                existing.count += 1;
            } else {
                map.set(key, { name: label, count: 1 });
            }
        }
        return Array.from(map.entries()).map(([id, v]) => ({ id, name: v.name, count: v.count }));
    }, [articles]);

    const toggleFavorite = (articleId: number) => {
        setFavorites(prev =>
            prev.includes(articleId) ? prev.filter(id => id !== articleId) : [...prev, articleId]
        );
    };

    const filteredArticles = useMemo(() => {
        return articles.filter(article => {
            const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
            const q = searchTerm.trim().toLowerCase();
            const matchesSearch = !q || (
                article.title.toLowerCase().includes(q) ||
                article.excerpt.toLowerCase().includes(q) ||
                article.tags.some((t: string) => t.toLowerCase().includes(q))
            );
            return matchesCategory && matchesSearch;
        });
    }, [articles, selectedCategory, searchTerm]);

    const sortedArticles = useMemo(() => {
        const copy = [...filteredArticles];
        copy.sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                    return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
                case 'oldest':
                    return new Date(a.publishDate).getTime() - new Date(b.publishDate).getTime();
                case 'popular':
                    return (b.views || 0) - (a.views || 0);
                case 'liked':
                    return (b.likes || 0) - (a.likes || 0);
                default:
                    return 0;
            }
        });
        return copy;
    }, [filteredArticles, sortBy]);

    const featuredNews = useMemo(() => articles.filter(a => !!a.featured), [articles]);
    const regularNews = useMemo(() => sortedArticles.filter(a => !a.featured), [sortedArticles]);

    return (
        <>
            {/* Hero Section */}
            <section className="bg-gradient-to-br from-blue-50 to-indigo-50 py-12">
                <div className="container">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl lg:text-4xl font-bold mb-4">Tin tức du lịch</h1>
                        <p className="text-lg text-muted-foreground">
                            Cập nhật những thông tin mới nhất về du lịch, khuyến mãi và mẹo hay
                        </p>
                    </div>

                    {/* Search Bar */}
                    <div className="max-w-2xl mx-auto">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                placeholder="Tìm kiếm tin tức, mẹo du lịch..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 h-12"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Categories */}
            <section className="py-6 border-b">
                <div className="container">
                    <div className="flex items-center gap-4 overflow-x-auto">
                        <span className="text-sm font-medium whitespace-nowrap">Chuyên mục:</span>
                        {categories.map((category) => (
                            <Button
                                key={category.id}
                                variant={selectedCategory === category.id ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectedCategory(category.id)}
                                className="whitespace-nowrap"
                            >
                                {category.name} ({category.count})
                            </Button>
                        ))}
                    </div>
                </div>
            </section>

            <div className="container py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Main Content */}
                    <div className="flex-1">
                        {/* Featured Articles */}
                        {featuredNews.length > 0 && (
                            <section className="mb-12">
                                <h2 className="text-2xl font-bold mb-6 flex items-center">
                                    <TrendingUp className="h-6 w-6 mr-2 text-red-500" />
                                    Tin nổi bật
                                </h2>

                                {/* Main Featured Article */}
                                {featuredNews[0] && <NewsCard article={featuredNews[0]} featured />}

                                {/* Secondary Featured Articles */}
                                {featuredNews.length > 1 && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {featuredNews.slice(1, 3).map((article) => (
                                            <NewsCard key={article.id} article={article} />
                                        ))}
                                    </div>
                                )}
                            </section>
                        )}

                        {/* Regular Articles */}
                        <section>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold">Tất cả tin tức</h2>
                                <Select value={sortBy} onValueChange={setSortBy}>
                                    <SelectTrigger className="w-48">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="newest">Mới nhất</SelectItem>
                                        <SelectItem value="oldest">Cũ nhất</SelectItem>
                                        <SelectItem value="popular">Xem nhiều nhất</SelectItem>
                                        <SelectItem value="liked">Yêu thích nhất</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-6">
                                {loading && <Card className="text-center p-8"><CardContent>Đang tải...</CardContent></Card>}
                                {!loading && regularNews.map((article) => (
                                    <NewsCard key={article.id} article={article} />
                                ))}
                            </div>

                            {sortedArticles.length === 0 && !loading && (
                                <Card className="text-center py-12">
                                    <CardContent>
                                        <Newspaper className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                        <h3 className="text-lg font-medium mb-2">Không tìm thấy bài viết</h3>
                                        <p className="text-muted-foreground mb-4">
                                            Vui lòng thử tìm kiếm với từ khóa khác hoặc chọn chuyên mục khác
                                        </p>
                                        <Button variant="outline" onClick={() => {
                                            setSearchTerm('');
                                            setSelectedCategory('all');
                                        }}>
                                            Xóa bộ lọc
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}
                        </section>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:w-80 space-y-6">
                        {/* Newsletter Signup */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Đăng ký nhận tin</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Nhận thông tin mới nhất về khuyến mãi và mẹo du lịch
                                </p>
                                <div className="space-y-3">
                                    <Input placeholder="Email của bạn" type="email" />
                                    <Button className="w-full">
                                        Đăng ký ngay
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Popular Tags */}
                        {/* <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Thẻ phổ biến</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {Array.from(new Set(articles.flatMap(a => a.tags || []))).slice(0, 12).map((tag) => (
                                        <Badge key={tag} variant="secondary" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card> */}

                        {/* Quick Stats */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Thống kê</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Tổng bài viết</span>
                                    <span className="font-medium">{articles.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Tin nổi bật</span>
                                    <span className="font-medium">{featuredNews.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Lượt xem</span>
                                    <span className="font-medium">{articles.reduce((s, a) => s + (a.views || 0), 0).toLocaleString()}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}