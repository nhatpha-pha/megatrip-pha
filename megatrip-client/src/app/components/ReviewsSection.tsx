import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Progress } from '../components/ui/progress';
import {
  Star,
  Quote,
  ThumbsUp,
  MessageSquare,
  Users,
  Award,
  TrendingUp,
  MapPin,
  Calendar,
  Camera,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  Play,
  CheckCircle,
  Verified,
} from 'lucide-react';

interface Review {
  id: number;
  user: {
    name: string;
    avatar: string;
    location: string;
    verified: boolean;
    reviewCount: number;
    memberSince: string;
  };
  rating: number;
  title: string;
  content: string;
  date: string;
  service: 'flight' | 'tour' | 'bus';
  serviceName: string;
  helpful: number;
  images?: string[];
  hasVideo?: boolean;
  tags: string[];
  travelWith: string;
}

interface SocialProof {
  metric: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  trend: 'up' | 'down' | 'stable';
}

const reviews: Review[] = [
  {
    id: 1,
    user: {
      name: 'Nguyễn Minh Anh',
      avatar: '/placeholder.svg',
      location: 'TP.HCM',
      verified: true,
      reviewCount: 47,
      memberSince: '2020',
    },
    rating: 5,
    title: 'Chuyến bay tuyệt vời, dịch vụ hoàn hảo!',
    content: 'Tôi đã đặt vé máy bay qua MegaTrip và hoàn toàn hài lòng. Quy trình đặt vé nhanh chóng, giá cả cạnh tranh và hỗ trợ khách hàng rất nhiệt tình. Chuyến bay đúng giờ, phi hành đoàn thân thiện. Chắc chắn sẽ sử dụng lại dịch vụ này.',
    date: '2024-12-25',
    service: 'flight',
    serviceName: 'VN1546 TP.HCM - Hà Nội',
    helpful: 23,
    images: ['/placeholder.svg', '/placeholder.svg'],
    tags: ['Đúng giờ', 'Giá tốt', 'Dịch vụ tốt'],
    travelWith: 'Gia đình',
  },
  {
    id: 2,
    user: {
      name: 'Trần Hoàng Nam',
      avatar: '/placeholder.svg',
      location: 'Hà Nội',
      verified: true,
      reviewCount: 23,
      memberSince: '2021',
    },
    rating: 5,
    title: 'Tour Đà Nẵng - Hội An tuyệt vời!',
    content: 'Tour 3N2Đ Đà Nẵng - Hội An thật sự tuyệt vời. Lịch trình hợp lý, hướng dẫn viên nhiệt tình và am hiểu. Khách sạn sạch sẽ, ăn uống ngon. Đặc biệt là được trải nghiệm Cầu Vàng Bà Nà Hills và phố cổ Hội An về đêm rất lãng mạn. Cảm ơn MegaTrip!',
    date: '2024-12-20',
    service: 'tour',
    serviceName: 'Tour Đà Nẵng - Hội An 3N2Đ',
    helpful: 31,
    hasVideo: true,
    images: ['/placeholder.svg', '/placeholder.svg', '/placeholder.svg'],
    tags: ['HDV tốt', 'Lịch trình hay', 'Đáng tiền'],
    travelWith: 'Bạn bè',
  },
  {
    id: 3,
    user: {
      name: 'Lê Thị Hương',
      avatar: '/placeholder.svg',
      location: 'Đà Nẵng',
      verified: false,
      reviewCount: 8,
      memberSince: '2023',
    },
    rating: 4,
    title: 'Xe giường nằm thoải mái',
    content: 'Đặt xe TP.HCM - Đà Lạt qua MegaTrip. Xe sạch sẽ, giường nằm thoải mái, có wifi và nước miễn phí. Tài xế lái xe an toàn. Tuy nhiên xe khởi hành hơi trễ 15 phút so với lịch trình. Nhìn chung vẫn hài lòng với dịch vụ.',
    date: '2024-12-18',
    service: 'bus',
    serviceName: 'Phương Trang TP.HCM - Đà Lạt',
    helpful: 15,
    tags: ['Thoải mái', 'Sạch sẽ', 'An toàn'],
    travelWith: 'Một mình',
  },
  {
    id: 4,
    user: {
      name: 'Phạm Văn Đức',
      avatar: '/placeholder.svg',
      location: 'Cần Thơ',
      verified: true,
      reviewCount: 35,
      memberSince: '2019',
    },
    rating: 5,
    title: 'App rất tiện lợi, đặt vé nhanh',
    content: 'Sử dụng MegaTrip đã 2 năm, rất hài lòng. Giao diện app dễ sử dụng, thông tin rõ ràng, thanh toán an toàn. Mỗi lần đặt vé đều nhận được xác nhận nhanh chóng. Team hỗ trợ phản hồi nhanh khi có thắc mắc. Đã giới thiệu cho nhiều bạn bè.',
    date: '2024-12-15',
    service: 'flight',
    serviceName: ' TP.HCM - Đà Nẵng',
    helpful: 42,
    tags: ['App tốt', 'Hỗ trợ nhanh', 'Tin cậy'],
    travelWith: 'Công việc',
  },
];

const socialProofMetrics: SocialProof[] = [
  {
    metric: 'Khách hàng hài lòng',
    value: '98.7%',
    icon: Star,
    description: 'Từ hơn 250,000 đánh giá',
    trend: 'up',
  },
  {
    metric: 'Đánh giá 5 sao',
    value: '94.2%',
    icon: ThumbsUp,
    description: 'Trên tổng số đánh giá',
    trend: 'up',
  },
  {
    metric: 'Tỷ lệ đặt lại',
    value: '87%',
    icon: Users,
    description: 'Khách hàng quay lại sử dụng',
    trend: 'stable',
  },
  {
    metric: 'Phản hồi tích cực',
    value: '99.1%',
    icon: MessageSquare,
    description: 'Về chất lượng dịch vụ',
    trend: 'up',
  },
];

const topReviewers = [
  {
    name: 'Nguyễn Travel Expert',
    avatar: '/placeholder.svg',
    reviews: 127,
    helpfulVotes: 1540,
    badge: 'Top Reviewer',
    location: 'TP.HCM',
  },
  {
    name: 'Minh Adventure',
    avatar: '/placeholder.svg',
    reviews: 89,
    helpfulVotes: 890,
    badge: 'Travel Guide',
    location: 'Hà Nội',
  },
  {
    name: 'Linh Wanderlust',
    avatar: '/placeholder.svg',
    reviews: 76,
    helpfulVotes: 645,
    badge: 'Explorer',
    location: 'Đà Nẵng',
  },
];

export default function ReviewsSection() {
  const [currentReview, setCurrentReview] = useState(0);
  const [filter, setFilter] = useState('all');

  const filteredReviews = reviews.filter(review => 
    filter === 'all' || review.service === filter
  );

  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length,
    percentage: (reviews.filter(r => r.rating === rating).length / reviews.length) * 100
  }));

  const nextReview = () => {
    setCurrentReview((prev) => (prev + 1) % filteredReviews.length);
  };

  const prevReview = () => {
    setCurrentReview((prev) => (prev - 1 + filteredReviews.length) % filteredReviews.length);
  };

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'flight': return '✈️';
      case 'tour': return '🗺️';
      case 'bus': return '🚌';
      default: return '⭐';
    }
  };

  const renderStars = (rating: number, size: 'sm' | 'lg' = 'sm') => {
    const starSize = size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';
    return Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        className={`${starSize} ${
          index < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <section className="py-16 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container">
        {/* Section Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-blue-100 text-blue-800">
            <Star className="h-3 w-3 mr-1" />
            Đánh giá từ khách hàng
          </Badge>
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Trải nghiệm thực tế từ khách hàng
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Hơn 250,000 đánh giá chân thực từ khách hàng đã sử dụng dịch vụ
          </p>
        </div>

        {/* Social Proof Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {socialProofMetrics.map((metric, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-center mb-3">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <metric.icon className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-[hsl(var(--primary))] mb-1">
                  {metric.value}
                </div>
                <div className="text-sm font-medium mb-1">{metric.metric}</div>
                <div className="text-xs text-muted-foreground">
                  {metric.description}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Review Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-400" />
                  Tổng quan đánh giá
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-6">
                  <div className="text-4xl font-bold mb-2">{averageRating.toFixed(1)}</div>
                  <div className="flex justify-center mb-2">
                    {renderStars(Math.round(averageRating), 'lg')}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Từ {reviews.length.toLocaleString()} đánh giá
                  </div>
                </div>
                
                <div className="space-y-3">
                  {ratingDistribution.map((dist) => (
                    <div key={dist.rating} className="flex items-center gap-3">
                      <div className="flex items-center gap-1 w-12">
                        <span className="text-sm">{dist.rating}</span>
                        <Star className="h-3 w-3 text-yellow-400" />
                      </div>
                      <Progress value={dist.percentage} className="flex-1" />
                      <span className="text-sm text-muted-foreground w-8">
                        {dist.count}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Reviewers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-orange-500" />
                  Top Reviewers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topReviewers.map((reviewer, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={reviewer.avatar} />
                        <AvatarFallback>{reviewer.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{reviewer.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {reviewer.badge}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {reviewer.reviews} đánh giá • {reviewer.helpfulVotes} hữu ích
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Reviews */}
          <div className="lg:col-span-2">
            {/* Filter Tabs */}
            <div className="flex items-center gap-2 mb-6">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                Tất cả
              </Button>
              <Button
                variant={filter === 'flight' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('flight')}
              >
                ✈️ Vé máy bay
              </Button>
              <Button
                variant={filter === 'tour' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('tour')}
              >
                🗺️ Tour
              </Button>
              <Button
                variant={filter === 'bus' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('bus')}
              >
                🚌 Xe du lịch
              </Button>
            </div>

            {/* Featured Review Carousel */}
            <div className="relative mb-8">
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  {filteredReviews.length > 0 && (
                    <div className="p-6">
                      <div className="flex items-start gap-4 mb-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={filteredReviews[currentReview].user.avatar} />
                          <AvatarFallback>
                            {filteredReviews[currentReview].user.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">
                              {filteredReviews[currentReview].user.name}
                            </span>
                            {filteredReviews[currentReview].user.verified && (
                              <Verified className="h-4 w-4 text-blue-500" />
                            )}
                            <Badge variant="secondary" className="text-xs">
                              {filteredReviews[currentReview].user.reviewCount} đánh giá
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {filteredReviews[currentReview].user.location} • 
                            Thành viên từ {filteredReviews[currentReview].user.memberSince}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 mb-1">
                            {renderStars(filteredReviews[currentReview].rating)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {filteredReviews[currentReview].date}
                          </div>
                        </div>
                      </div>

                      <h3 className="font-semibold mb-2">
                        {filteredReviews[currentReview].title}
                      </h3>
                      
                      <p className="text-muted-foreground mb-4 leading-relaxed">
                        {filteredReviews[currentReview].content}
                      </p>

                      <div className="flex items-center gap-4 mb-4">
                        <Badge variant="outline" className="text-xs">
                          {getServiceIcon(filteredReviews[currentReview].service)}{' '}
                          {filteredReviews[currentReview].serviceName}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Du lịch cùng: {filteredReviews[currentReview].travelWith}
                        </span>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {filteredReviews[currentReview].tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      {/* Images */}
                      {filteredReviews[currentReview].images && (
                        <div className="flex gap-2 mb-4">
                          {filteredReviews[currentReview].images?.slice(0, 3).map((image, index) => (
                            <div
                              key={index}
                              className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100"
                            >
                              <img
                                src={image}
                                alt="Review"
                                className="w-full h-full object-cover"
                              />
                              {index === 0 && filteredReviews[currentReview].hasVideo && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                  <Play className="h-6 w-6 text-white" />
                                </div>
                              )}
                            </div>
                          ))}
                          {filteredReviews[currentReview].images && 
                           filteredReviews[currentReview].images.length > 3 && (
                            <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center text-xs">
                              +{filteredReviews[currentReview].images.length - 3}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm">
                          <ThumbsUp className="h-4 w-4 mr-1" />
                          Hữu ích ({filteredReviews[currentReview].helpful})
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Phản hồi
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Share2 className="h-4 w-4 mr-1" />
                          Chia sẻ
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Navigation */}
              {filteredReviews.length > 1 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute left-4 top-1/2 transform -translate-y-1/2"
                    onClick={prevReview}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute right-4 top-1/2 transform -translate-y-1/2"
                    onClick={nextReview}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>

            {/* View All Reviews */}
            <div className="text-center">
              <Button variant="outline" size="lg">
                Xem tất cả {reviews.length.toLocaleString()} đánh giá
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
