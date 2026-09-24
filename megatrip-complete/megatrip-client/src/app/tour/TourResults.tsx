import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { Star, Heart, Map, User2, Group, UserIcon, Users, Calendar } from 'lucide-react';
import Link from 'next/link';

function TourSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardContent className="p-6">
        <div className="flex flex-col gap-4">
          <div className="h-32 w-full bg-gray-200 rounded shimmer mb-2" />
          <div className="h-5 w-1/2 bg-gray-200 rounded shimmer mb-2" />
          <div className="h-4 w-1/3 bg-gray-200 rounded shimmer mb-2" />
          <div className="h-4 w-1/4 bg-gray-200 rounded shimmer mb-2" />
          <div className="h-8 w-32 bg-gray-200 rounded shimmer mx-auto" />
        </div>
      </CardContent>
    </Card>
  );
}
function computeSuggestedOriginal(basePrice: number | undefined) {
  if (!basePrice || Number.isNaN(basePrice)) return undefined;
  const price = Number(basePrice);
  const multiplier = price < 1_000_000 ? 1.25 : price < 5_000_000 ? 1.15 : 1.10;
  const suggested = Math.round(price * multiplier / 100000) * 100000;
  // only return if suggested > basePrice to make sense as "original" price
  return suggested > price ? suggested : undefined;
}
// Add props interface
interface TourResultsProps {
  isLoading: boolean;
  sortedTours: any[]; // Define proper type if available
  favorites: any[]; // Define proper type if available
  toggleFavorite: (id: any) => void;
  formatPrice: (price: number) => string;
}
export default function TourResults({
  isLoading,
  sortedTours,
  favorites,
  toggleFavorite,
  formatPrice
}: TourResultsProps) {
  // Save a viewed tour identifier (slug or id) to localStorage (most-recent-first, max 10)
  const saveRecentTour = (tour: any) => {
    if (typeof window === 'undefined') return;
    try {
      const key = 'recentTours';
      const raw = localStorage.getItem(key);
      const list: string[] = raw ? JSON.parse(raw) : [];
      const id = tour.slug ?? String(tour.id ?? '');
      if (!id) return;
      const filtered = list.filter(x => x !== id);
      filtered.unshift(id);
      localStorage.setItem(key, JSON.stringify(filtered.slice(0, 10)));
    } catch (e) {
      // ignore
    }
  };
  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => <TourSkeleton key={i} />)}
        </div>
      ) : (
        sortedTours.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Map className="h-12 w-12 text-[hsl(var(--muted-foreground))] mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Không tìm thấy tour phù hợp</h3>
              <p className="text-[hsl(var(--muted-foreground))] mb-4">
                Vui lòng thử điều chỉnh bộ lọc hoặc thay đổi điều kiện tìm kiếm
              </p>
              <Button variant="outline">Điều chỉnh tìm kiếm</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {sortedTours.map((tour) => (
              <Card key={tour.id} className="hover:shadow-md transition-shadow group overflow-hidden">
                <div className="relative">
                  <img
                    src={tour.images[0]}
                    alt={tour.name}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3">
                    <Badge variant={tour.badgeColor as any}>{tour.badge}</Badge>
                  </div>
                  <div className="absolute top-3 right-3 flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8 w-8 p-0"
                      onClick={() => toggleFavorite(tour.id)}
                    >
                      <Heart className={`h-4 w-4 ${favorites.includes(tour.id) ? 'fill-red-500 text-red-500' : ''}`} />
                    </Button>
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <div className="flex items-center text-white text-sm">
                      <Calendar className="h-3 w-3 mr-1" />
                      {tour.duration}
                    </div>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="mb-2 mt-2">
                    <h3 className="font-semibold text-lg mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                      {tour.name}
                    </h3>
                    <div className="flex items-center text-sm text-[hsl(var(--muted-foreground))] mb-2">
                      <span className="mr-1">Từ</span>{tour.departure}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    {/* <div className="flex items-center">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                      <span className="text-sm font-medium">{tour.rating}</span> */}
                      {/* <span className="text-sm text-[hsl(var(--muted-foreground))] ml-1">({tour.reviews})</span> */}
                    {/* </div> */}
                    <div className="flex items-center text-sm text-[hsl(var(--muted-foreground))] gap-1">
                      <span className='ml-1'>

                        <Users size={12} />
                      </span>
                      <span className="mr-1"></span>{tour.maxGroup}
                    </div>
                  </div>
                  <div className="space-y-2 mb-3">
                    {/* <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
                      <span className="bg-primary/10 text-primary px-2 py-0.5 rounded">{tour.transport}</span>
                      <span className="bg-primary/10 text-primary px-2 py-0.5 rounded">KS {tour.hotel}</span>
                      <span className="bg-primary/10 text-primary px-2 py-0.5 rounded">{tour.meals}</span>
                    </div> */}
                    <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
                      {(() => {
                        const services = (tour.includes || tour.services || []);
                        const hasSpecific = tour.transport || tour.hotel || tour.meals;
                        const hasAny = hasSpecific || services.length > 0;
                        if (!hasAny) return null;
                        return (
                          <>
                            <span className="text-[hsl(var(--muted-foreground))] text-xs font-medium">Các dịch vụ:</span>
                            {hasSpecific ? (
                              <>
                                {tour.transport && <span className="bg-primary/10 text-primary px-2 py-0.5 rounded">{tour.transport}</span>}
                                {tour.hotel && <span className="bg-primary/10 text-primary px-2 py-0.5 rounded">KS {tour.hotel}</span>}
                                {tour.meals && <span className="bg-primary/10 text-primary px-2 py-0.5 rounded">{tour.meals}</span>}
                              </>
                            ) : (
                              services.slice(0, 3).map((s: string, i: number) => (
                                <span key={i} className="bg-primary/10 text-primary px-2 py-0.5 rounded">{s}</span>
                              ))
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  {/* Điểm nổi bật */}
                  {/* <div className="space-y-1 mb-3 text-xs text-[hsl(var(--muted-foreground))]">
                    <div className="line-clamp-2">Điểm nổi bật: {tour.highlights.join(' • ')}</div>
                  </div> */}
                  <div className="border-t pt-3">
                    <div className="flex items-center justify-between">
                      <div>
                        {(() => {
                          const displayedOriginal = tour.originalPrice ?? computeSuggestedOriginal(tour.priceFrom);
                          if (!displayedOriginal) return null;
                          return (
                            <div className="text-xs text-[hsl(var(--muted-foreground))] line-through">
                              {formatPrice(displayedOriginal)}
                            </div>
                          );
                        })()}
                        <div className="text-sm text-[hsl(var(--muted-foreground))]">Từ</div>
                        <div className="text-lg font-bold text-[hsl(var(--primary))]">
                          {formatPrice(tour.priceFrom)} / khách
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <Button size="sm" asChild>
                          <Link prefetch={false} href={`/tour/${tour.slug}`}
                            onClick={() => saveRecentTour(tour)}
                          >
                            Xem chi tiết
                          </Link>
                        </Button>
                        <div className="text-xs text-[hsl(var(--muted-foreground))]">
                          {tour.availableDates.length} ngày khả dụng
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      )}
    </div>
  );
}
