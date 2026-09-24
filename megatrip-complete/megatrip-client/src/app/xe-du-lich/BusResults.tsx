import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { Bus, ArrowRight, Star, ChevronUp, ChevronDown, MapPin } from 'lucide-react';
import Link from 'next/link';
import { JSX } from 'react';

function BusSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded bg-gray-200 shimmer" />
              <div className="h-4 w-32 bg-gray-200 rounded shimmer" />
            </div>
            <div className="flex items-center gap-6">
              <div className="h-4 w-16 bg-gray-200 rounded shimmer" />
              <div className="h-4 w-20 bg-gray-200 rounded shimmer" />
              <div className="h-4 w-16 bg-gray-200 rounded shimmer" />
            </div>
          </div>
          <div className="lg:text-right space-y-2">
            <div className="h-5 w-24 bg-gray-200 rounded shimmer mx-auto mb-2" />
            <div className="h-8 w-32 bg-gray-200 rounded shimmer mx-auto" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
interface BusResultsProps {
  isLoading: boolean;
  sortedBuses: any[];
  showDetails: number | null;
  setShowDetails: (id: number | null) => void;
  formatPrice: (p: number) => string;
  getTypeIcon: (t: string) => JSX.Element;
  getAmenityIcon: (a: string) => JSX.Element | string;
  selectedDate?: string; // YYYY-MM-DD from parent (optional)
}

export default function BusResults({
  isLoading,
  sortedBuses,
  showDetails,
  setShowDetails,
  formatPrice,
  getTypeIcon, getAmenityIcon, selectedDate
}: BusResultsProps) {
  return (
    <div className="space-y-4">
      {isLoading ? (
        Array.from({ length: 3 }).map((_, i) => <BusSkeleton key={i} />)
      ) : (
        sortedBuses.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Bus className="h-12 w-12 text-[hsl(var(--muted-foreground))] mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Không tìm thấy chuyến xe phù hợp</h3>
              <p className="text-[hsl(var(--muted-foreground))] mb-4">
                Vui lòng thử điều chỉnh bộ lọc hoặc thay đổi tuyến đường
              </p>
              <Button variant="outline">Điều chỉnh tìm kiếm</Button>
            </CardContent>
          </Card>
        ) : (
          sortedBuses.map((bus) => (
            <Card key={bus.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Bus Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                        {getTypeIcon(bus.type)}
                      </div>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {bus.company}
                          <div className="flex items-center text-sm text-[hsl(var(--muted-foreground))]">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                            {bus.rating} ({bus.reviews})
                          </div>
                        </div>
                        <div className="text-sm text-[hsl(var(--muted-foreground))]">
                          {bus.busNumber} • {bus.type}
                        </div>
                      </div>
                      {bus.discount && (
                        <Badge variant="destructive">-{bus.discount}%</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="font-bold text-lg">{bus.departure.time}</div>
                        <div className="text-sm text-[hsl(var(--muted-foreground))]">{bus.departure.location}</div>
                      </div>
                      <div className="flex-1 text-center">
                        <div className="text-sm text-[hsl(var(--muted-foreground))] mb-1">{bus.duration}</div>
                        <div className="flex items-center">
                          <div className="flex-1 h-px bg-gray-300"></div>
                          <ArrowRight className="h-4 w-4 mx-2 text-gray-400" />
                          <div className="flex-1 h-px bg-gray-300"></div>
                        </div>
                        <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{bus.distance}</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-lg">{bus.arrival.time}</div>
                        <div className="text-sm text-[hsl(var(--muted-foreground))]">{bus.arrival.location}</div>
                      </div>
                    </div>
                    {/* Amenities */}
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-sm text-[hsl(var(--muted-foreground))]">Tiện ích:</span>
                      <div className="flex gap-1">
                        {bus.amenities.map((amenity:any, index:any) => (
                          <span key={index} className="text-sm" title={amenity}>
                            {getAmenityIcon(amenity)}
                          </span>
                        ))}

                      </div>
                    </div>
                  </div>
                  {/* Price & Action */}
                  <div className="lg:text-right space-y-2">
                    <div>
                      {bus.originalPrice && (
                        <div className="text-sm text-[hsl(var(--muted-foreground))] line-through">
                          {formatPrice(bus.originalPrice)}
                        </div>
                      )}
                      <div className="text-xl font-bold text-[hsl(var(--primary))]">
                        {formatPrice(bus.adultPrice ?? bus.price ?? 0)}
                      </div>
                      <div className="text-xs text-[hsl(var(--muted-foreground))]">
                        Trẻ em: {formatPrice(bus.childPrice ?? Math.round((bus.adultPrice ?? bus.price ?? 0) * 0.75))}
                      </div>
                      <div className="text-xs text-[hsl(var(--muted-foreground))]">Còn {bus.availableSeats} ghế</div>
                    </div>
                    <div className="space-y-1 text-[hsl(var(--muted-foreground))]">
                      <Button className="w-full lg:w-auto" asChild>
                        <Link
                          prefetch={false}
                          href={`/xe-du-lich/${bus.id}${(selectedDate || bus.date) ? `?date=${encodeURIComponent(selectedDate || bus.date)}` : ''}`}
                        >
                          Chọn chuyến xe
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowDetails(showDetails === bus.id ? null : bus.id)}
                        className="w-full lg:w-auto text-xs"
                      >
                        Chi tiết
                        {showDetails === bus.id ?
                          <ChevronUp className="ml-1 h-3 w-3" /> :
                          <ChevronDown className="ml-1 h-3 w-3" />
                        }
                      </Button>
                    </div>
                  </div>
                </div>
                {/* Expandable Details */}
                {showDetails === bus.id && (
                  <>
                    <Separator className="my-4" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <h4 className="font-medium mb-2">Điểm đón</h4>
                        <div className="space-y-1 text-[hsl(var(--muted-foreground))]">
                          {(
                            // prefer explicit pickup array, otherwise fallback to routeFrom.name if available
                            (Array.isArray(bus.pickup) && bus.pickup.length > 0)
                              ? bus.pickup
                              : (bus.routeFrom && bus.routeFrom.name ? [bus.routeFrom.name] : [])
                          ).map((location:any, index:any) => (
                            <div key={index} className="flex items-start gap-1">
                              <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                              {location}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Điểm trả</h4>
                        <div className="space-y-1 text-[hsl(var(--muted-foreground))]">
                          {(
                            // prefer explicit dropoff array, otherwise fallback to routeTo.name if available
                            (Array.isArray(bus.dropoff) && bus.dropoff.length > 0)
                              ? bus.dropoff
                              : (bus.routeTo && bus.routeTo.name ? [bus.routeTo.name] : [])
                          ).map((location:any, index:any) => (
                            <div key={index} className="flex items-start gap-1">
                              <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                              {location}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Điều kiện vé</h4>
                        <div className="space-y-1 text-xs text-[hsl(var(--muted-foreground))]">
                          <div>{bus.cancellable ? '✓ Có hoàn hủy' : '✗ Không hoàn hủy'}</div>
                          <div>Tổng {bus.seats} ghế</div>
                          <div>Còn {bus.availableSeats} ghế trống</div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))
        )
      )}
    </div>
  );
}
