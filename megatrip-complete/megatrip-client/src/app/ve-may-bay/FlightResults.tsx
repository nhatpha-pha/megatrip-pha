import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Plane, ArrowRight, Wifi, Utensils, Luggage, Tv, Battery, Shield, X, RefreshCw, Gift, ChevronUp, ChevronDown, CheckCircle } from 'lucide-react';

function CardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded bg-gray-200 shimmer" />
              <div className="h-4 w-32 bg-gray-200 rounded shimmer" />
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="h-4 w-12 bg-gray-200 rounded shimmer mx-auto mb-2" />
                <div className="h-3 w-16 bg-gray-200 rounded shimmer mx-auto" />
              </div>
              <div className="flex-1 text-center">
                <div className="h-3 w-20 bg-gray-200 rounded shimmer mx-auto mb-2" />
              </div>
              <div className="text-center">
                <div className="h-4 w-12 bg-gray-200 rounded shimmer mx-auto mb-2" />
                <div className="h-3 w-16 bg-gray-200 rounded shimmer mx-auto" />
              </div>
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

export default function FlightResults({
  isLoading,
  sortedFlights,
  hasSearched,
  expandedFlight,
  setExpandedFlight,
  formatPrice
}: any) {
  const router = useRouter();

  // per-flight pricing loading state so one click doesn't disable whole list
  const [pricingLoadingByFlight, setPricingLoadingByFlight] = useState<Record<string, boolean>>({});
  const setPricingLoadingFor = (key: string, v: boolean) => setPricingLoadingByFlight(prev => ({ ...prev, [key]: v }));

  // seatmap state
  const [seatmapData, setSeatmapData] = useState<any | null>(null);
  const [seatmapDeckIndex, setSeatmapDeckIndex] = useState(0);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [seatmapOpenForFlightId, setSeatmapOpenForFlightId] = useState<string | number | null>(null);

  // small persistent cache key (bump version if structure changes)
  const CACHE_KEY = 'amadeus_pricing_cache_v1';

  // helper: load/save cache from localStorage
  const loadCacheFromStorage = () => {
    try {
      if (typeof window === 'undefined') return {};
      const raw = localStorage.getItem(CACHE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };
  const saveCacheToStorage = (cache: Record<string, any>) => {
    try {
      if (typeof window === 'undefined') return;
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch { /* ignore */ }
  };

  // --- NEW: signature helpers to uniquely identify saved pricing/seatmap version ---
  const sanitizeOfferForSignature = (offer: any) => {
    if (!offer) return {};
    try {
      const itins = (offer.itineraries || []).map((it: any) => ({
        duration: it.duration,
        segments: (it.segments || []).map((s: any) => ({
          departure: { iataCode: s.departure?.iataCode, at: s.departure?.at },
          arrival: { iataCode: s.arrival?.iataCode, at: s.arrival?.at },
          carrierCode: s.carrierCode, number: s.number, aircraft: s.aircraft?.code
        }))
      }));
      return {
        id: offer.id ?? null,
        price: offer.price ? { total: offer.price.total, currency: offer.price.currency } : null,
        numberOfBookableSeats: offer.numberOfBookableSeats ?? null,
        itineraries: itins,
        lastTicketingDate: offer.lastTicketingDate ?? null
      };
    } catch {
      return {};
    }
  };

  // small deterministic djb2 -> hex
  const djb2Hex = (str: string) => {
    let h = 5381;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) + h) + str.charCodeAt(i);
      h = h & 0xffffffff;
    }
    return (h >>> 0).toString(16).padStart(8, '0');
  };

  const computeSignatureForPayload = (payload: any) => {
    try {
      const cleaned = sanitizeOfferForSignature(payload);
      const s = JSON.stringify(cleaned);
      return djb2Hex(s);
    } catch {
      return null;
    }
  };

  // Composite cache key helper (id::signature) to avoid collisions when different payloads share numeric id
  const makePricingCacheKey = (flightOfferPayload: any, flightId?: any) => {
    const sig = computeSignatureForPayload(flightOfferPayload) ?? 'nosig';
    const idPart = String(flightId ?? flightOfferPayload?.id ?? 'unknown');
    return `${idPart}::${sig}`;
  };

  // store pricing & seatmap responses per flight id so we can populate existing Tabs
  // initialize from localStorage when available
  const cacheInit = (() => {
    try {
      const full = loadCacheFromStorage();
      return {
        pricing: full.pricing || {},
        seatmap: full.seatmap || {},
        signatures: full.signatures || {}
      };
    } catch {
      return { pricing: {}, seatmap: {}, signatures: {} };
    }
  })();

  const [pricingByFlight, setPricingByFlight] = useState<Record<string, any>>(cacheInit.pricing);
  const [seatmapByFlight, setSeatmapByFlight] = useState<Record<string, any>>(cacheInit.seatmap);
  // state for signatures per flight
  const [signaturesByFlight, setSignaturesByFlight] = useState<Record<string, string | null>>(cacheInit.signatures);
  // UI navigation/loading state used when navigating to detail page
  const [navigating, setNavigating] = useState(false);
  // Helper: parse refundable value from traveler or offer objects.
  // Returns { amount: number | null, raw: string | null }
  const parseRefundable = (obj: any) => {
    if (!obj) return { amount: null, raw: null };
    const cand = obj?.price?.refundableTaxes ?? obj?.price?.refundableTaxesAmount ?? obj?.refundableTaxes ?? obj?.refundableTaxesAmount ?? null;
    if (cand == null) return { amount: null, raw: null };
    const raw = cand;
    const num = Number(String(cand).replace(/[^\d.-]/g, ''));
    if (Number.isFinite(num) && num !== 0) return { amount: num, raw: String(raw) };
    if (String(raw).trim() !== '') return { amount: Number.isFinite(num) ? num : 0, raw: String(raw) };
    return { amount: null, raw: null };
  };

  // New helper: safely read "included" objects that may live at pricing.included or pricing.data.included
  const getIncluded = (pricing: any, key: string) => {
    if (!pricing) return undefined;
    if (pricing.included && pricing.included[key]) return pricing.included[key];
    if (pricing.data && pricing.data.included && pricing.data.included[key]) return pricing.data.included[key];
    // Some responses might put included resources flat under pricing?.included or pricing?.data?.included
    return undefined;
  };

  // Helper: detect whether any refundable amount exists (traveler-level, offer-level or policy fallback)
  const detectAnyRefundable = (pricing: any, offer: any, flightObj: any) => {
    try {
      const travelerPricings = offer?.travelerPricings ?? [];
      if (Array.isArray(travelerPricings) && travelerPricings.length > 0) {
        for (const t of travelerPricings) {
          const pr = parseRefundable(t);
          if (pr.amount != null && pr.amount > 0) return true;
        }
      }
      const po = parseRefundable(offer);
      if (po.amount != null && po.amount > 0) return true;
      const policy = pricing?.data?.policies ?? pricing?.policies ?? flightObj?.policies ?? {};
      if (policy?.cancellable) return true;
      return false;
    } catch (e) {
      return false;
    }
  };

  // Helper: detect whether fare rules allow changes (look into included detailed-fare-rules PENALTIES text)
  const detectChangeable = (pricing: any, offer: any) => {
    try {
      const included = pricing?.included ?? pricing?.data?.included ?? {};
      const detailedFareRules = included?.['detailed-fare-rules'] ?? {};
      const travelerPricings = offer?.travelerPricings ?? [];
      const fareBasis = travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.fareBasis ?? travelerPricings?.[0]?.fareBasis ?? null;
      const rule = Object.values(detailedFareRules).find((fr: any) => (fareBasis && fr?.fareBasis === fareBasis) || !!fr);
      const penalty = (rule as any)?.fareNotes?.descriptions?.find((desc: any) => desc.descriptionType === 'PENALTIES');
      if (!penalty?.text) return false;
      const txt = String(penalty.text).toUpperCase();
      // match typical phrases - be permissive
      return txt.includes('CHANGE') || txt.includes('CHANGES ANY TIME') || txt.includes('CHANGES');
    } catch (e) {
      return false;
    }
  };

  const fetchAmadeusToken = useCallback(async () => {
    const tokenRes = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: process.env.NEXT_PUBLIC_AMADEUS_CLIENT_ID || '',
        client_secret: process.env.NEXT_PUBLIC_AMADEUS_CLIENT_SECRET || ''
      })
    });
    const tokenJson = await tokenRes.json();
    return tokenJson.access_token;
  }, []);

  const constructFallbackOffer = (flight: any) => {
    const depDate = flight.departure?.date || '';
    const arrDate = flight.arrival?.date || '';
    return {
      type: 'flight-offer',
      id: String(flight.id),
      source: 'TEST',
      numberOfBookableSeats: flight.availableSeats ?? 0,
      itineraries: [
        {
          duration: `PT0H0M`,
          segments: [
            {
              departure: {
                iataCode: flight.departure?.airport || flight.departure?.city || '',
                at: depDate && flight.departure?.time ? `${depDate}T${flight.departure.time}:00` : undefined
              },
              arrival: {
                iataCode: flight.arrival?.airport || flight.arrival?.city || '',
                at: arrDate && flight.arrival?.time ? `${arrDate}T${flight.arrival.time}:00` : undefined
              },
              carrierCode: flight.airlineCode || (flight.airline ? String(flight.airline).slice(0, 2).toUpperCase() : 'XX'),
              number: flight.flightNumber?.replace(/\D/g, '') || '0',
              aircraft: { code: '' }
            }
          ]
        }
      ],
      price: {
        currency: flight.currency || 'VND',
        total: String(flight.price ?? 0)
      }
    };
  };

  // NEW helper: populate state from cache for a given key
  const populateFromCache = (key: string) => {
    try {
      const stored = loadCacheFromStorage();
      if (!stored) return false;
      if (stored.pricing && stored.pricing[key]) {
        setPricingByFlight(prev => ({ ...prev, [key]: stored.pricing[key] }));
      }
      if (stored.seatmap && stored.seatmap[key]) {
        setSeatmapByFlight(prev => ({ ...prev, [key]: stored.seatmap[key] }));
        setSeatmapData(stored.seatmap[key]);
      }
      setSeatmapDeckIndex(0);
      setSelectedSeat(null);
      setSeatmapOpenForFlightId(key);
      setSignaturesByFlight(prev => ({ ...prev, [key]: stored.signatures?.[key] }));
      return true;
    } catch (e) {
      console.warn('populateFromCache error', e);
      return false;
    }
  };

  const handlePriceOffer = useCallback(async (flight: any) => {
    const flightOfferPayload = flight.raw ? flight.raw : constructFallbackOffer(flight);
    const signature = computeSignatureForPayload(flightOfferPayload);
    const key = makePricingCacheKey(flightOfferPayload, flight.id);

    // 1) check cache first, only accept if signature matches
    try {
      const stored = loadCacheFromStorage();
      if (stored && stored.pricing && stored.pricing[key] && stored.signatures && signature && stored.signatures[key] === signature) {
        // populate from cache and expand details without calling API
        setPricingByFlight(prev => ({ ...prev, [key]: stored.pricing[key] }));
        if (stored.seatmap && stored.seatmap[key]) {
          setSeatmapByFlight(prev => ({ ...prev, [key]: stored.seatmap[key] }));
          setSeatmapData(stored.seatmap[key]);
        }
        setSeatmapDeckIndex(0);
        setSelectedSeat(null);
        setSeatmapOpenForFlightId(key);
        setExpandedFlight(flight.id ?? flightOfferPayload.id ?? null);
        setSignaturesByFlight(prev => ({ ...prev, [key]: stored.signatures[key] }));
        return { fromCache: true, key, signature, pricing: stored.pricing[key], seatmap: stored.seatmap?.[key] ?? null };
      }
    } catch (e) {
      console.warn('Cache read error', e);
    }

    // 2) not cached or signature mismatch -> perform pricing + seatmap fetch
    try {
      setPricingLoadingFor(key, true);
      const token = await fetchAmadeusToken();
      if (!token) throw new Error('No access token from Amadeus');

      // pricing request (existing body)
      const pricingBody = {
        data: {
          type: 'flight-offers-pricing',
          flightOffers: [flightOfferPayload]
        }
      };

      const includeList = ['credit-card-fees', 'bags', 'other-services', 'detailed-fare-rules'];
      const forceClass = true;
      const pricingUrl = `https://test.api.amadeus.com/v1/shopping/flight-offers/pricing?include=${encodeURIComponent(includeList.join(','))}&forceClass=${forceClass}`;
      const pricingRes = await fetch(pricingUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/vnd.amadeus+json'
        },
        body: JSON.stringify(pricingBody)
      });

      const pricingJson = await pricingRes.json();
      // seatmaps request (existing)
      const seatmapBody = { data: [flightOfferPayload] };
      const seatmapUrl = 'https://test.api.amadeus.com/v1/shopping/seatmaps';
      const seatRes = await fetch(seatmapUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/vnd.amadeus+json'
        },
        body: JSON.stringify(seatmapBody)
      });
      const seatJson = await seatRes.json();

      // normalize seatmap
      const normalizedSeat = Array.isArray(seatJson) ? seatJson[0] : (seatJson?.data?.[0] ?? seatJson);

      // store in state
      setPricingByFlight(prev => ({ ...prev, [key]: pricingJson }));
      setSeatmapByFlight(prev => ({ ...prev, [key]: normalizedSeat }));
      setSeatmapData(seatJson);
      setSeatmapDeckIndex(0);
      setSelectedSeat(null);
      setSeatmapOpenForFlightId(key);
      setExpandedFlight(flight.id ?? flightOfferPayload.id ?? null);

      // compute signature for saved payload (use original payload)
      const sigToSave = signature ?? computeSignatureForPayload(flightOfferPayload) ?? null;

      // persist into localStorage cache (merge with existing), also store signature map
      try {
        const existing = loadCacheFromStorage();
        const merged = {
          pricing: { ...(existing.pricing || {}), [key]: pricingJson },
          seatmap: { ...(existing.seatmap || {}), [key]: normalizedSeat },
          signatures: { ...(existing.signatures || {}), [key]: sigToSave },
          ts: Date.now()
        };
        saveCacheToStorage(merged);
        setSignaturesByFlight(prev => ({ ...prev, [key]: sigToSave }));
      } catch (e) {
        console.warn('Cache write error', e);
      }

      // feedback unchanged
      // alert('Pricing & seatmaps response logged to console');

      return { fromCache: false, key, signature: sigToSave, pricing: pricingJson, seatmap: normalizedSeat };
    } catch (err) {
      console.error('Pricing/Seatmap error', err);
      alert('Pricing/Seatmap error — see console for details');
      return null;
    } finally {
      setPricingLoadingFor(key, false);
    }
  }, [fetchAmadeusToken]);

  // Helper: decide whether we can skip pricing/seatmap fetch and use embedded amenities/policies
  const shouldUseLocalAmenities = (flight: any) => {
    try {
      const raw = flight?.raw ?? null;
      const hasAmenities = Boolean(flight?.amenities || raw?.amenities);
      const hasPolicies = Boolean(flight?.policies || raw?.policies);
      // If the flight (or embedded raw payload) already contains amenities or policies,
      // use the local data and skip the remote pricing/seatmap call. Otherwise fetch.
      return hasAmenities || hasPolicies;
    } catch {
      return false;
    }
  };

  const cardRefs = useRef(new Map<string, HTMLDivElement | null>());

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target instanceof Node)) return;

      // Use composedPath so clicks originating from portals/shadow DOM (Tabs, popovers, svgs, etc.)
      // are detected as inside the card when appropriate.
      const path: any[] = (event as any).composedPath ? (event as any).composedPath() : (event as any).path || [event.target];

      // If any node in the event path is inside a flight card (has data-flight-card-id), don't close.
      for (const node of path) {
        if (!(node instanceof Element)) continue;
        if (node.closest && node.closest('[data-flight-card-id]')) {
          return;
        }
      }

      // Fallback: check refs map (handles cases where composedPath doesn't include the exact element)
      let isOutside = true;
      cardRefs.current.forEach((ref) => {
        if (ref && ref.contains(event.target as Node)) {
          isOutside = false;
        }
        // Also if composedPath includes the ref element
        if (ref && path.includes(ref)) {
          isOutside = false;
        }
      });

      if (isOutside && expandedFlight !== null) {
        setExpandedFlight(null);
        setPricingLoadingByFlight({}); // keep previous behavior
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [expandedFlight, setExpandedFlight]);
  return (
    <div className="space-y-4">
      {navigating && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60">
          <div className="bg-white/95 rounded-lg p-6 flex flex-col items-center gap-4 shadow-lg max-w-xs mx-4">
            <img src="/flight_loading_vikas-singh.gif" alt="Đang lấy vé" className="w-36 h-36 object-contain" />
            <div className="text-center">
              <div className="font-semibold text-lg">Đang lấy vé...</div>
              <div className="text-sm text-[hsl(var(--muted-foreground))] mt-1">Vui lòng đợi trong giây lát</div>
            </div>
          </div>
        </div>
      )}
      {isLoading ? (
        Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)
      ) : (
        sortedFlights.length === 0 && hasSearched ? (
          <Card className="text-center py-12">
            <CardContent>
              <Plane className="h-12 w-12 text-[hsl(var(--muted-foreground))] mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Không tìm thấy chuyến bay phù hợp</h3>
              <p className="text-[hsl(var(--muted-foreground))] mb-4">
                Vui lòng thử điều chỉnh bộ lọc hoặc thay đổi ngày bay
              </p>
              <Button variant="outline">Điều chỉnh tìm kiếm</Button>
            </CardContent>
          </Card>
        ) : (
          sortedFlights.map((flight: any) => (
            // compute stable pricing cache key for this flight so buttons/flags can reference pricingLoadingByFlight[key]
            (() => {
              const flightOfferPayload = flight.raw ? flight.raw : constructFallbackOffer(flight);
              const signature = computeSignatureForPayload(flightOfferPayload);
              const key = makePricingCacheKey(flightOfferPayload, flight.id);
              const isPricingLoading = Boolean(pricingLoadingByFlight[key]);

              return (
                <Card key={flight.id}
                  data-flight-card-id={String(flight.id)}
                  className="hover:shadow-md transition-shadow"
                  ref={(el: any) => cardRefs.current.set(flight.id, el)}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Flight Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center">
                            <Plane className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-medium">{flight.airline}</div>
                            <div className="text-sm text-[hsl(var(--muted-foreground))]">{flight.flightNumber} • {flight.aircraft}</div>
                          </div>
                          {flight.discount && (
                            <Badge variant="destructive">-{flight.discount}%</Badge>
                          )}
                          {flight.amenities.priority && (
                            <Badge className="bg-purple-100 text-purple-800">Priority</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <div className="font-bold text-lg">{flight.departure.time}</div>
                            <div className="text-sm text-[hsl(var(--muted-foreground))]">{flight.departure.airport}</div>
                            <div className="text-xs text-[hsl(var(--muted-foreground))]">{flight.departure.city}</div>
                          </div>
                          <div className="flex-1 text-center">
                            <div className="text-sm text-[hsl(var(--muted-foreground))] mb-1">{flight.duration}</div>
                            <div className="flex items-center">
                              <div className="flex-1 h-px bg-gray-300"></div>
                              <ArrowRight className="h-4 w-4 mx-2 text-gray-400" />
                              <div className="flex-1 h-px bg-gray-300"></div>
                            </div>
                            <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Bay thẳng</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-lg">{flight.arrival.time}</div>
                            <div className="text-sm text-[hsl(var(--muted-foreground))]">{flight.arrival.airport}</div>
                            <div className="text-xs text-[hsl(var(--muted-foreground))]">{flight.arrival.city}</div>
                          </div>
                        </div>
                        {/* Quick amenities */}
                        <div className="flex items-center gap-3 mt-3 text-sm text-[hsl(var(--muted-foreground))]">
                          {/* Stops / direct */}
                          <div className="inline-flex items-center gap-1">
                            <span className="px-2 py-1 bg-slate-100 rounded text-xs">{flight.stopsText || 'Bay thẳng'}</span>
                          </div>

                          {/* Class / cabin */}
                          <div className="inline-flex items-center gap-1">
                            <span className="text-xs text-muted-foreground">Hạng</span>
                            <div className="px-2 py-0.5 bg-slate-50 rounded text-xs font-medium">{flight.class}</div>
                          </div>

                          {/* Baggage */}
                          <div className="inline-flex items-center gap-1">
                            <Luggage className="h-3 w-3" />
                            <div className="text-xs">
                              {flight.baggage.checkin?.pieces ? `${flight.baggage.checkin.pieces} kiện` :
                                flight.baggage.checkin?.weight ? `${flight.baggage.checkin.weight}${flight.baggage.checkin.unit ?? ''}` :
                                  'Ký gửi: -'}
                            </div>
                          </div>

                          {/* Cabin bag */}
                          <div className="inline-flex items-center gap-1">
                            <div className="text-xs">
                              {flight.baggage?.handbag?.pieces ? `Xách tay: ${flight.baggage.handbag.pieces} kiện` :
                                flight.baggage?.handbag?.weight ? `Xách tay: ${flight.baggage.handbag.weight}${flight.baggage.handbag.unit ?? ''}` :
                                  'Xách tay: Không có thông tin'}
                            </div>
                          </div>

                          {/* Seats available */}
                          <div className="ml-auto text-right text-xs">
                            <div>Số ghế: <span className="font-medium">{flight.availableSeats ?? '-'}</span></div>
                          </div>
                        </div>
                      </div>
                      {/* Price & Action */}
                      <div className="lg:text-right space-y-2">
                        <div>
                          {flight.originalPrice && (
                            <div className="text-sm text-[hsl(var(--muted-foreground))] line-through">
                              {formatPrice(flight.originalPrice)}
                            </div>
                          )}
                          <div className="text-xl font-bold text-[hsl(var(--primary))]">
                            {/* price respects currency returned by API; formatPrice expects VND number, if other currency show raw */}
                            {flight.currency === 'VND' ? formatPrice(flight.price) : `${flight.price.toLocaleString()} ${flight.currency}`}
                          </div>
                          <div className="text-xs text-[hsl(var(--muted-foreground))]">Giá cho 1 khách</div>
                        </div>
                        <div className="space-y-1 text-[hsl(var(--muted-foreground))]">
                          <Button
                            className="w-full lg:w-auto"
                            onClick={async () => {
                              // use precomputed key/flightOfferPayload from outer closure
                              // quick cache check: must exist and signature must match
                              const stored = loadCacheFromStorage();
                              const hasCachedAndMatchingSig = stored && stored.pricing && stored.pricing[key] && stored.signatures && signature && stored.signatures[key] === signature;

                              // if (hasCachedAndMatchingSig) {
                              //   // populate and proceed without fetching
                              //   populateFromCache(key);
                              //   console.log('Selected flight (from cache)', flight.id);
                              //   // navigate to details page after ensuring state populated
                              //   router.push(`/ve-may-bay/${key}`);
                              //   return;
                              // }

                              if (hasCachedAndMatchingSig) {
                                // populate and proceed without fetching
                                populateFromCache(key);
                                console.log('Selected flight (from cache)', flight.id);
                                // navigate to details page after ensuring state populated
                                try {
                                  setNavigating(true);
                                  // router.push returns a promise in app router — catch to reset if navigation fails
                                  await router.push(`/ve-may-bay/${key}`);
                                } catch (e) {
                                  setNavigating(false);
                                  console.warn('Navigation failed', e);
                                }
                                return;
                              }

                              // not cached or signature mismatch -> fetch then proceed
                              setPricingLoadingFor(key, true);
                              const res = await handlePriceOffer(flight);
                              setPricingLoadingFor(key, false);

                              if (res) {
                                // populateFromCache(res.key);
                                // console.log('Selected flight (after fetch)', flight.id);
                                // // navigate to details page
                                // router.push(`/ve-may-bay/${res.key}`);
                                populateFromCache(res.key);
                                console.log('Selected flight (after fetch)', flight.id);
                                try {
                                  setNavigating(true);
                                  await router.push(`/ve-may-bay/${res.key}`);
                                } catch (e) {
                                  setNavigating(false);
                                  console.warn('Navigation failed', e);
                                }
                              } else {
                                console.warn('Could not retrieve pricing for selection');
                              }
                            }}
                            disabled={isPricingLoading}
                          >
                            {isPricingLoading ? 'Đang chờ chi tiết' : 'Chọn chuyến bay'}
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            // prevent document mousedown handler from running for this button click
                            onMouseDownCapture={(e) => e.stopPropagation()}
                            onTouchStartCapture={(e) => e.stopPropagation()}
                            onClick={async () => {
                              const opening = expandedFlight !== flight.id;
                              if (opening) {
                                // Before expanding, check cache+signature and avoid fetch if valid
                                // use closure key/signature computed above
                                const stored = loadCacheFromStorage();
                                const hasCachedAndMatchingSig = stored && stored.pricing && stored.pricing[key] && stored.signatures && signature && stored.signatures[key] === signature;

                                // expand UI immediately
                                setExpandedFlight(flight.id);

                                if (hasCachedAndMatchingSig) {
                                  populateFromCache(key);
                                  return;
                                }

                                // If flight already has amenities/policies (VJ), show local amenities immediately
                                // but still trigger pricing+seatmap fetch in background so refund/change logic can rely on real pricing.
                                if (shouldUseLocalAmenities(flight)) {
                                  const minimal = { data: flight.raw ?? flightOfferPayload };
                                  setPricingByFlight(prev => ({ ...prev, [key]: minimal }));
                                  // ensure seatmap state cleared for this key while we fetch real seatmap
                                  setSeatmapByFlight(prev => ({ ...prev }));
                                  setSeatmapData(null);
                                  setSignaturesByFlight(prev => ({ ...prev, [key]: signature }));

                                  // Trigger background fetch so refund/change tabs can update when ready.
                                  // handlePriceOffer will set per-key loading state so skeleton appears.
                                  handlePriceOffer(flight).catch((e) => {
                                    console.warn('Background pricing error', e);
                                  });

                                  return;
                                }

                                // otherwise trigger pricing+seatmap fetch and expand when done (show skeleton while awaiting)
                                await handlePriceOffer(flight);
                              } else {
                                setExpandedFlight(null);
                              }
                            }}
                            className="w-full lg:w-auto text-xs"
                          >
                            Chi tiết
                            {expandedFlight === flight.id ?
                              <ChevronUp className="ml-1 h-3 w-3" /> :
                              <ChevronDown className="ml-1 h-3 w-3" />
                            }
                          </Button>
                        </div>
                      </div>
                    </div>
                    {/* Expandable Details with Tabs */}
                    {expandedFlight === flight.id && (
                      <>
                        <Separator className="my-4" />
                        {/* Show skeleton while pricing/seatmap loading for this flight */}
                        {isPricingLoading ? (
                          <div className="my-2">
                            <CardSkeleton />
                          </div>
                        ) : (
                          <>
                            <div onMouseDownCapture={(e) => e.stopPropagation()} onTouchStartCapture={(e) => e.stopPropagation()}>

                              <Tabs defaultValue="details" className="w-full">
                                <TabsList className="grid w-full grid-cols-5">
                                  <TabsTrigger value="details">Chi tiết</TabsTrigger>
                                  <TabsTrigger value="benefits">Lợi ích đi kèm</TabsTrigger>
                                  <TabsTrigger value="refund">Hoàn vé</TabsTrigger>
                                  <TabsTrigger value="change">Đổi lịch</TabsTrigger>
                                  <TabsTrigger value="detailsCharge">Chi tiết vé</TabsTrigger>
                                </TabsList>
                                <div className="mt-4">
                                  {/* DETAILS: prefer data from pricingByFlight/seatmapByFlight, fallback to flight props */}
                                  <TabsContent value="details" className="space-y-4">
                                    {(() => {
                                      // const key = String(flight.id);  <-- removed
                                      const pricing = pricingByFlight[key] ?? pricingByFlight[String(flight.id)];
                                      const seatmap = seatmapByFlight[key] ?? seatmapByFlight[String(flight.id)];

                                      // normalize pricing wrapper to access traveler pricings easily
                                      const offerFromPricing =
                                        pricing?.data?.flightOffers?.[0] ??
                                        (Array.isArray(pricing?.data) ? pricing.data[0] : (pricing?.data ?? pricing ?? null));

                                      const travelerForDetails = offerFromPricing?.travelerPricings?.[0] ?? offerFromPricing?.travelerPricings?.[0];
                                      const parsedRefundForDetails = parseRefundable(travelerForDetails ?? offerFromPricing);
                                      // const refundForDetails = parsedRefundForDetails.amount != null ? parsedRefundForDetails.raw ?? parsedRefundForDetails.amount : null;

                                      // Bags / fare details
                                      const traveler = pricing?.data?.travelerPricings?.[0] ?? pricing?.travelerPricings?.[0] ?? travelerForDetails;
                                      const fareSeg = traveler?.fareDetailsBySegment?.[0] ?? traveler?.fareDetails?.[0];
                                      const checkedQty = fareSeg?.includedCheckedBags?.quantity ?? flight.baggage?.checkin?.pieces;
                                      const checkedWeight = fareSeg?.includedCheckedBags?.weight ?? flight.baggage?.checkin?.weight;
                                      const cabinQty = fareSeg?.includedCabinBags?.quantity ?? flight.baggage?.handbag?.pieces;

                                      // Amenities from seatmap if present
                                      const cabAmenities = seatmap?.aircraftCabinAmenities || {};
                                      const wifiRaw = cabAmenities?.wifi ?? cabAmenities?.seat?.wifi ?? flight.amenities?.wifi;
                                      const wifiInfo = wifiRaw
                                        ? (typeof wifiRaw === 'object' ? wifiRaw : { available: !!wifiRaw })
                                        : { available: false };

                                      const mealRaw = cabAmenities?.food ?? cabAmenities?.seat?.food ?? flight.amenities?.meal;
                                      const mealInfo = mealRaw
                                        ? (typeof mealRaw === 'object' ? mealRaw : { available: !!mealRaw })
                                        : { included: false, available: false };

                                      const entertainmentRaw = cabAmenities?.seat?.medias ?? cabAmenities?.medias ?? flight.amenities?.entertainment;
                                      const entertainmentInfo = entertainmentRaw
                                        ? (Array.isArray(entertainmentRaw) ? { available: entertainmentRaw.length > 0, screens: entertainmentRaw.length } : (typeof entertainmentRaw === 'object' ? entertainmentRaw : { available: !!entertainmentRaw }))
                                        : { available: false };

                                      const powerRaw = cabAmenities?.power ?? flight.amenities?.power;
                                      const powerInfo = powerRaw
                                        ? (typeof powerRaw === 'object' ? powerRaw : { available: !!powerRaw })
                                        : { available: false };

                                      // INCLUDED resources (detailed fare rules, bags, credit-card-fees)
                                      const includedFareRules = getIncluded(pricing, 'detailed-fare-rules');
                                      const includedBags = getIncluded(pricing, 'bags');
                                      const creditCardFees = getIncluded(pricing, 'credit-card-fees');

                                      // other top-level pieces
                                      const segment = offerFromPricing?.itineraries?.[0]?.segments?.[0] ?? {};
                                      const lastTicketingDate = offerFromPricing?.lastTicketingDate ?? offerFromPricing?.lastTicketingDate ?? null;
                                      const fareTypes = offerFromPricing?.pricingOptions?.fareType ?? offerFromPricing?.pricingOptions?.fareType ?? [];
                                      const validatingAirlines = offerFromPricing?.validatingAirlineCodes ?? offerFromPricing?.validatingAirlineCodes ?? [];
                                      const bookingRequirements = pricing?.data?.bookingRequirements ?? pricing?.bookingRequirements ?? offerFromPricing?.bookingRequirements ?? null;

                                      // small helper to pick a fare rule snippet
                                      const fareRuleSnippet = (() => {
                                        try {
                                          if (!includedFareRules) return null;
                                          // includedFareRules might be an object keyed by segment/fare id
                                          const firstKey = Object.keys(includedFareRules)[0];
                                          const rule = includedFareRules[firstKey];
                                          const desc = rule?.fareNotes?.descriptions?.[0]?.text ?? rule?.fareNotes?.descriptions?.[0]?.text;
                                          return desc ? (String(desc).slice(0, 1000) + (String(desc).length > 1000 ? '…' : '')) : rule?.name ?? null;
                                        } catch (e) {
                                          return null;
                                        }
                                      })();

                                      return (
                                        <div className="space-y-4">
                                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                              <h4 className="font-medium mb-3">Hành lý</h4>
                                              <div className="space-y-2 text-sm">
                                                <div className="flex items-center gap-2">
                                                  <Luggage className="h-4 w-4 text-blue-500" />
                                                  <div>
                                                    <div className="font-medium">Xách tay</div>
                                                    <div className="text-muted-foreground">
                                                      {cabinQty ?? (flight.baggage?.handbag?.pieces ?? '-')}{flight.baggage?.handbag?.unit ?? ''}
                                                    </div>
                                                  </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                  <Luggage className="h-4 w-4 text-green-500" />
                                                  <div>
                                                    <div className="font-medium">Ký gửi</div>
                                                    <div className="text-muted-foreground">
                                                      {checkedQty ?? checkedWeight ?? '-'}{checkedWeight ? (fareSeg?.includedCheckedBags?.weightUnit ?? flight.baggage?.checkin?.unit ?? '') : ''}
                                                    </div>
                                                  </div>
                                                </div>
                                                {/* If pricing included "bags" resource, show bookable add-ons/prices */}
                                                {includedBags && (
                                                  <div className="text-xs text-[hsl(var(--muted-foreground))] mt-2">
                                                    Gói hành lý thêm có thể đặt:
                                                    <div className="mt-1">
                                                      {Object.keys(includedBags).map((k) => {
                                                        const b = includedBags[k];
                                                        return (
                                                          <div key={k}>
                                                            {b.name} • {b.quantity ?? '-'} • {b.price?.amount ? `${Number(b.price.amount).toLocaleString()} ${b.price.currencyCode ?? ''}` : 'Miễn phí'}
                                                          </div>
                                                        );
                                                      })}
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            </div>

                                            <div>
                                              <h4 className="font-medium mb-3">Tiện ích</h4>
                                              <div className="space-y-2 text-sm">
                                                <div className="flex items-center gap-2">
                                                  <Wifi className="h-4 w-4" />
                                                  <div>
                                                    {wifiInfo && wifiInfo.available ? (
                                                      // prefer explicit flags: free / included / price
                                                      wifiInfo.free === true || wifiInfo.included === true ? (
                                                        <div className="text-muted-foreground">WiFi: Miễn phí</div>
                                                      ) : wifiInfo.price ? (
                                                        <div className="text-muted-foreground">WiFi: {String(wifiInfo.price)}</div>
                                                      ) : (
                                                        <div className="text-muted-foreground">WiFi: Có phí</div>
                                                      )
                                                    ) : <span className="text-muted-foreground">Không có WiFi</span>}
                                                  </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                  <Utensils className="h-4 w-4" />
                                                  <div>
                                                    {mealInfo && (mealInfo.available || mealInfo.included) ? (
                                                      mealInfo.included === true || mealInfo.free === true ? (
                                                        <div className="text-muted-foreground">Bữa ăn miễn phí{mealInfo.type ? ` • ${mealInfo.type}` : ''}</div>
                                                      ) : mealInfo.price ? (
                                                        <div className="text-muted-foreground">Bữa ăn có phí • {String(mealInfo.price)}</div>
                                                      ) : (
                                                        <div className="text-muted-foreground">Bữa ăn có phí</div>
                                                      )
                                                    ) : <span className="text-muted-foreground">Không có thông tin bữa ăn</span>}
                                                  </div>
                                                </div>
                                                {entertainmentInfo.available && (
                                                  <div className="flex items-center gap-2">
                                                    <Tv className="h-4 w-4" />
                                                    <div className="text-muted-foreground">Giải trí • {entertainmentInfo.screens ?? '-'}</div>
                                                  </div>
                                                )}
                                                {powerInfo && (powerInfo.powerType || powerInfo.available) && (
                                                  <div className="flex items-center gap-2">
                                                    <Battery className="h-4 w-4" />
                                                    <div className="text-muted-foreground">{powerInfo.powerType ?? (powerInfo.available ? 'Có ổ sạc' : '')}</div>
                                                  </div>
                                                )}
                                                {/* {refundForDetails && (
                                                <div className="flex items-center gap-2">
                                                  <Shield className="h-4 w-4 text-green-600" />
                                                  <div className="text-muted-foreground">
                                                    Giá trị hoàn lại ước tính: {parsedRefundForDetails.amount != null ? `${parsedRefundForDetails.amount.toLocaleString()} ${offerFromPricing?.price?.currency ?? 'VND'}` : String(parsedRefundForDetails.raw)}
                                                  </div>
                                                </div>
                                              )} */}
                                              </div>
                                            </div>

                                            <div>
                                              <h4 className="font-medium mb-3">Thông tin chuyến bay</h4>
                                              <div className="space-y-2 text-sm">
                                                <div><span className="font-medium">Máy bay:</span>
                                                  {/* {seatmap?.aircraft?.code ?? segment?.aircraft?.code ?? flight.aircraft} */}
                                                  {flight.flightNumber} • {flight.aircraft}
                                                </div>
                                                <div><span className="font-medium">Hạng vé:</span> {(traveler?.fareOption) ?? flight.class}</div>
                                                <div><span className="font-medium">Còn lại:</span> {offerFromPricing?.numberOfBookableSeats ?? pricing?.data?.flightOffers?.[0]?.numberOfBookableSeats ?? flight.availableSeats ?? (seatmap?.availableSeatsCounters?.[0]?.value) ?? '-'} ghế</div>
                                                {/* <div><span className="font-medium">Stops:</span> {segment?.numberOfStops ?? '-'}</div> */}
                                                {segment?.co2Emissions && (
                                                  <div><span className="font-medium">CO₂ (ước tính):</span> {segment.co2Emissions.map((c: any) => `${c.weight}${c.weightUnit} (${c.cabin ?? '-'})`).join(', ')}</div>
                                                )}
                                                {lastTicketingDate && <div><span className="font-medium">Last ticketing:</span> {lastTicketingDate}</div>}
                                                {fareTypes.length > 0 && <div><span className="font-medium">Fare type:</span> {fareTypes.join(', ')}</div>}
                                                {validatingAirlines.length > 0 && <div><span className="font-medium">Validating:</span> {validatingAirlines.join(', ')}</div>}
                                              </div>
                                            </div>
                                          </div>

                                          {/* Fare rule snippet : Tóm tắt điều khoản vé */}
                                          {/* {fareRuleSnippet && (
                                          <div>
                                            <h4 className="font-medium mb-2">Tóm tắt điều khoản vé</h4>
                                            <div className="text-sm text-[hsl(var(--muted-foreground))] whitespace-pre-wrap">
                                              {fareRuleSnippet}
                                            </div>
                                          </div>
                                        )} */}

                                          {/* Booking requirements - Yêu cầu đặt chỗ*/}
                                          {bookingRequirements && (
                                            <div>
                                              <h4 className="font-medium mb-2">Yêu cầu đặt chỗ</h4>
                                              <div className="text-sm text-[hsl(var(--muted-foreground))]">
                                                {bookingRequirements.emailAddressRequired ? <div>Yêu cầu email</div> : null}
                                                {bookingRequirements.mobilePhoneNumberRequired ? <div>Yêu cầu số điện thoại</div> : null}
                                                {Array.isArray(bookingRequirements.travelerRequirements) && bookingRequirements.travelerRequirements.length > 0 && (
                                                  <div className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                                                    Một số hành khách cần ngày sinh: {bookingRequirements.travelerRequirements.map((r: any) => r.travelerId).join(', ')}
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })()}
                                  </TabsContent>

                                  <TabsContent value="benefits" className="space-y-3">
                                    <div className="space-y-3">
                                      {(() => {
                                        const p = pricingByFlight[key] ?? pricingByFlight[String(flight.id)];
                                        const offer = p?.data?.flightOffers?.[0] ?? (Array.isArray(p?.data) ? p.data[0] : (p?.data ?? p ?? null));
                                        const anyRefundable = detectAnyRefundable(p, offer, flight);
                                        const changeable = detectChangeable(p, offer);

                                        return (
                                          <>
                                            <div className="flex items-center gap-3">
                                              {anyRefundable ? <Shield className="h-5 w-5 text-green-500" /> : <X className="h-5 w-5 text-red-500" />}
                                              <div className="text-sm font-medium">
                                                {anyRefundable ? 'Có thể hoàn vé' : 'Không thể hoàn vé'}
                                              </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                              {changeable ? <RefreshCw className="h-5 w-5 text-green-500" /> : <X className="h-5 w-5 text-red-500" />}
                                              <div className="text-sm font-medium">
                                                {changeable ? 'Có thể đổi lịch' : 'Không thể đổi lịch'}
                                              </div>
                                            </div>
                                          </>
                                        );
                                      })()}
                                    </div>
                                  </TabsContent>

                                  <TabsContent value="refund" className="space-y-3">
                                    {(() => {
                                      const p = pricingByFlight[key] ?? pricingByFlight[String(flight.id)];
                                      const offer =
                                        p?.data?.flightOffers?.[0] ??
                                        (Array.isArray(p?.data) ? p.data[0] : p?.data ?? p ?? null);
                                      const travelerPricings =
                                        offer?.travelerPricings ?? offer?.travelerPricings ?? [];
                                      const policy = p?.data?.policies ?? p?.policies ?? flight.policies ?? {};

                                      const anyRefundable = detectAnyRefundable(p, offer, flight);

                                      const refundDeadlineText = (() => {
                                        const keys = [
                                          "refundBeforeDays",
                                          "refundableBeforeDays",
                                          "refundableBeforeHours",
                                          "refundDeadlineHours",
                                          "refundBeforeHours",
                                        ];
                                        for (const k of keys) {
                                          const v = policy?.[k];
                                          if (v != null) {
                                            const num = Number(v);
                                            if (isFinite(num)) {
                                              if (k.toLowerCase().includes("hour")) {
                                                const days = Math.ceil(num / 24);
                                                return `Hoàn trước khoảng ${num} giờ (~${days} ngày)`;
                                              }
                                              return `Hoàn trước ${num} ngày`;
                                            }
                                          }
                                        }
                                        return "Hoàn trước 24 giờ (mặc định nếu hãng không cung cấp thông tin cụ thể)";
                                      })();

                                      return (
                                        <div className="space-y-4">
                                          {/* Trạng thái hoàn vé */}
                                          <div className="flex items-center gap-2" style={{ marginBottom: '-7px' }}>
                                            {anyRefundable || policy?.cancellable ? (
                                              <Shield className="h-5 w-5 text-green-500" />
                                            ) : (
                                              <X className="h-5 w-5 text-red-500" />
                                            )}
                                            <span className="text-base font-semibold">
                                              {anyRefundable || policy?.cancellable
                                                ? "Có thể hoàn vé"
                                                : "Không thể hoàn vé"}
                                            </span>
                                          </div>

                                          {/* Tabs dạng vertical */}
                                          <Tabs defaultValue="policy" className="w-full">
                                            <div className="flex gap-6">
                                              {/* Tab list bên trái */}
                                              <TabsList className="flex flex-col w-64 gap-3 bg-transparent border-none shadow-none p-0"
                                                style={{ marginTop: '74px' }}
                                              >
                                                <TabsTrigger
                                                  value="policy"
                                                  className="w-full justify-start rounded-lg border text-left px-4 py-3 transition-colors
                                                data-[state=active]:border-blue-500 data-[state=active]:font-semibold
                                                data-[state=active]:text-black data-[state=active]:bg-white
                                                data-[state=inactive]:border-gray-200 data-[state=inactive]:text-gray-700
                                                hover:bg-gray-50"
                                                >
                                                  Chính sách hoàn vé của bạn
                                                </TabsTrigger>

                                                <TabsTrigger
                                                  value="estimate"
                                                  className="w-full justify-start rounded-lg border text-left px-4 py-3 transition-colors
                                                data-[state=active]:border-blue-500 data-[state=active]:font-semibold
                                                data-[state=active]:text-black data-[state=active]:bg-white
                                                data-[state=inactive]:border-gray-200 data-[state=inactive]:text-gray-700
                                                hover:bg-gray-50"
                                                >
                                                  Giá trị hoàn lại ước tính
                                                </TabsTrigger>

                                                <TabsTrigger
                                                  value="procedure"
                                                  className="w-full justify-start rounded-lg border text-left px-4 py-3 transition-colors
                                                    data-[state=active]:border-blue-500 data-[state=active]:font-semibold
                                                    data-[state=active]:text-black data-[state=active]:bg-white
                                                    data-[state=inactive]:border-gray-200 data-[state=inactive]:text-gray-700
                                                    hover:bg-gray-50"
                                                >
                                                  Quy trình hoàn lại vé
                                                </TabsTrigger>
                                              </TabsList>
                                              {/* Nội dung bên phải */}
                                              <div className="flex-1">
                                                <TabsContent value="policy" className="space-y-2 text-sm">
                                                  <div className="text-[hsl(var(--muted-foreground))] space-y-2">
                                                    <div>Hoàn vé được áp dụng cho:</div>
                                                    <ul className="list-disc pl-5 space-y-1">
                                                      <li>Tự hủy (thay đổi kế hoạch)</li>
                                                      <li>Đau ốm (bao gồm dương tính COVID-19)</li>
                                                      <li>Hãng hàng không hủy chuyến bay</li>
                                                      <li>Hãng hàng không dời lịch</li>
                                                      <li>Đặt trùng chuyến</li>
                                                      <li>Mang thai</li>
                                                      <li>Hành khách tử vong</li>
                                                    </ul>
                                                    <div className="mt-2">
                                                      Ghi chú hãng/điều khoản:{" "}
                                                      {policy?.notes ?? "Không có thông tin bổ sung"}
                                                    </div>
                                                  </div>
                                                </TabsContent>

                                                <TabsContent value="estimate" className="space-y-3 text-sm">
                                                  {travelerPricings.length === 0 ? (
                                                    <div className="text-[hsl(var(--muted-foreground))]">
                                                      Chưa có dữ liệu giá. Bấm &quot;Chọn chuyến bay&quot; để kiểm giá.
                                                    </div>
                                                  ) : (
                                                    <div className="space-y-3">
                                                      {/* Tiêu đề */}
                                                      <div className="text-[hsl(var(--muted-foreground))] font-medium">
                                                        Giá trị hoàn lại ước tính theo từng loại hành khách:
                                                      </div>

                                                      {/* Danh sách traveler */}
                                                      <div className="space-y-2">
                                                        {travelerPricings.map((t: any, idx: number) => {
                                                          const pr = parseRefundable(t);
                                                          return (
                                                            <div key={idx} className="p-3 border rounded-lg shadow-sm bg-white">
                                                              <div className="flex items-center justify-between">
                                                                <span className="font-semibold">
                                                                  {t.travelerType ?? `Hành khách ${idx + 1}`}
                                                                  {t.travelerId ? ` (${t.travelerId})` : ""}
                                                                </span>
                                                                {t.fareOption && (
                                                                  <span className="text-xs text-[hsl(var(--muted-foreground))]">
                                                                    {t.fareOption}
                                                                  </span>
                                                                )}
                                                              </div>

                                                              <div className="mt-2 text-sm">
                                                                • Giá được hoàn ước tính:{" "}
                                                                <span className="font-semibold">
                                                                  {pr.amount != null
                                                                    ? `${pr.amount.toLocaleString()} ${t?.price?.currency ?? offer?.price?.currency ?? "VND"
                                                                    }`
                                                                    : "-"}
                                                                </span>
                                                              </div>
                                                            </div>
                                                          );
                                                        })}
                                                      </div>

                                                      {/* Refund deadline + lưu ý gom chung một lần */}
                                                      <div className="space-y-1">
                                                        <div className="text-sm">{refundDeadlineText}</div>
                                                        <div className="text-xs text-[hsl(var(--muted-foreground))] italic">
                                                          Lưu ý: đây là giá trị ước tính; phí xử lý và chính sách hãng có thể ảnh
                                                          hưởng số thực tế được hoàn.
                                                        </div>
                                                      </div>
                                                    </div>
                                                  )}
                                                </TabsContent>



                                                <TabsContent value="procedure" className="space-y-3 text-sm">
                                                  <div className="space-y-2">
                                                    <div className="font-medium">Hướng dẫn quy trình hoàn vé</div>
                                                    <ol className="list-decimal pl-5 space-y-2 text-[hsl(var(--muted-foreground))]">
                                                      <li>Đăng nhập tài khoản hoặc mở email xác nhận.</li>
                                                      <li>Kiểm tra chính sách hoàn vé trong “Chi tiết vé”.</li>
                                                      <li>Liên hệ tổng đài hoặc trang &quot;Quản lý đặt chỗ&quot;.</li>
                                                      <li>
                                                        Gửi lý do & chứng từ cần thiết (giấy khám, xác nhận hủy...).
                                                      </li>
                                                      <li>Chờ xử lý (thường 7–14 ngày làm việc).</li>
                                                      <li>
                                                        Nhận tiền hoàn qua phương thức thanh toán ban đầu hoặc theo
                                                        thỏa thuận.
                                                      </li>
                                                    </ol>
                                                  </div>
                                                </TabsContent>
                                              </div>
                                            </div>
                                          </Tabs>
                                        </div>
                                      );
                                    })()}
                                  </TabsContent>

                                  {/* Tab Đổi lịch */}
                                  <TabsContent value="change" className="space-y-3">
                                    {(() => {
                                      const p = pricingByFlight[key] ?? pricingByFlight[String(flight.id)];
                                      const offer = p?.data?.flightOffers?.[0] ?? (Array.isArray(p?.data) ? p.data[0] : (p?.data ?? p ?? null));
                                      const changeable = detectChangeable(p, offer);
                                      const changeFee = changeable ? '720.000 VND + Chênh lệch giá vé' : 'Không đổi lịch';

                                      return (
                                        <div className="space-y-4">
                                          <div className="flex items-center gap-2">
                                            {changeable ? (
                                              <RefreshCw className="h-5 w-5 text-green-500" />
                                            ) : (
                                              <X className="h-5 w-5 text-red-500" />
                                            )}
                                            <span className="text-base font-semibold">
                                              {changeable ? 'Có thể đổi lịch' : 'Không thể đổi lịch'}
                                            </span>
                                          </div>
                                          <div className="text-sm text-[hsl(var(--muted-foreground))]">
                                            <div>Phí đổi lịch: {changeFee}</div>
                                            {changeable && (
                                              <div className="mt-2">
                                                Lưu ý:
                                                <ul className="list-disc pl-5 space-y-1">
                                                  <li>Phí đổi là 720.000 VND (30 USD) mỗi hành khách, có thể giảm cho trẻ em/em bé.</li>
                                                  <li>Chênh lệch giá vé sẽ được thu thêm nếu hành trình mới có giá cao hơn.</li>
                                                  <li>Liên hệ hãng để xác nhận thời hạn đổi và điều kiện cụ thể.</li>
                                                </ul>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })()}
                                  </TabsContent>

                                  {/* CHI TIẾT VÉ: show travelerPricings from normalized pricing response */}
                                  <TabsContent value="detailsCharge" className="space-y-3">
                                    {(() => {
                                      const p = pricingByFlight[key] ?? pricingByFlight[String(flight.id)];
                                      const offer =
                                        p?.data?.flightOffers?.[0] ??
                                        (Array.isArray(p?.data) ? p.data[0] : (p?.data ?? p ?? null)) ??
                                        p ?? null;

                                      const travelerPricings = offer?.travelerPricings ?? offer?.travelerPricings ?? [];
                                      // Also collect fees and credit-card-fees if available
                                      // Use `offer` (normalized above) — do not reference undefined `offerFromPricing`
                                      const offerPrice = offer?.price ?? null;
                                      const fees = offerPrice?.fees ?? offer?.price?.fees ?? [];
                                      const includedCCFees = getIncluded(p, 'credit-card-fees');

                                      if (!offer || travelerPricings.length === 0) {
                                        return (
                                          <div className="text-sm text-[hsl(var(--muted-foreground))]">
                                            Chưa có thông tin chi tiết giá. Vui lòng bấm &quot;Chọn chuyến bay&quot; để kiểm giá.
                                          </div>
                                        );
                                      }

                                      const currency = offer?.price?.currency ?? travelerPricings[0]?.price?.currency ?? '';

                                      return (
                                        <div className="space-y-3">
                                          { /* fees summary - Phí & lệ phí*/}

                                          {/* {fees && fees.length > 0 && (
                                          <div className="p-3 border rounded">
                                            <div className="text-sm font-medium mb-2">Phí & lệ phí</div>
                                            <div className="text-xs text-[hsl(var(--muted-foreground))]">
                                              {fees.map((f: any, idx: number) => (
                                                <div key={idx}>{f.type ?? f.code ?? 'FEE'}: {f.amount ?? f.price ?? '-'} {currency}</div>
                                              ))}
                                            </div>
                                          </div>
                                        )} */}

                                          {/* credit card fees (included resource) - Phí thẻ tín dụng */}

                                          {/* {includedCCFees && (
                                          <div className="p-3 border rounded">
                                            <div className="text-sm font-medium mb-2">Phí thẻ tín dụng</div>
                                            <div className="text-xs text-[hsl(var(--muted-foreground))]">
                                              {Object.keys(includedCCFees).map((k) => {
                                                const c = includedCCFees[k];
                                                return <div key={k}>{c.brand}: {c.amount} {c.currency}</div>;
                                              })}
                                            </div>
                                          </div>
                                        )} */}

                                          {travelerPricings.map((t: any, i: number) => {
                                            const price = t?.price ?? {};
                                            const total = price?.total ?? price?.grandTotal ?? '-';
                                            const base = price?.base ?? '-';
                                            const taxes = price?.taxes ?? [];
                                            const refundableTaxes = price?.refundableTaxes ?? null;
                                            const fareDetails = t?.fareDetailsBySegment ?? [];

                                            return (
                                              <div key={i} className="p-3 border rounded">
                                                <div className="flex justify-between items-center">
                                                  <div className="text-sm font-medium">
                                                    {t.travelerType ?? `Hành khách ${i + 1}`} {t.travelerId ? `(${t.travelerId})` : ''}
                                                  </div>
                                                  <div className="text-sm text-[hsl(var(--muted-foreground))]">{t.fareOption ?? ''}</div>
                                                </div>

                                                <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                                                  <div>
                                                    <div className="text-xs text-[hsl(var(--muted-foreground))]">Tổng</div>
                                                    <div className="font-semibold">
                                                      {total !== '-' ? `${Number(total).toLocaleString()} ${currency}` : '-'}
                                                    </div>
                                                  </div>
                                                  <div>
                                                    <div className="text-xs text-[hsl(var(--muted-foreground))]">Giá cơ sở</div>
                                                    <div>{base !== '-' ? `${Number(base).toLocaleString()} ${currency}` : '-'}</div>
                                                  </div>
                                                  <div>
                                                    <div className="text-xs text-[hsl(var(--muted-foreground))]">Thuế & phí</div>
                                                    <div className="text-xs text-[hsl(var(--muted-foreground))]">
                                                      {taxes.length > 0 ? taxes.map((tx: any) => `${tx.code}:${tx.amount}`).join(', ') : '-'}
                                                    </div>
                                                  </div>
                                                </div>

                                                {refundableTaxes && (
                                                  <div className="text-xs text-[hsl(var(--muted-foreground))] mt-2">Refundable taxes: {refundableTaxes}</div>
                                                )}

                                                <div className="mt-3">
                                                  <div className="text-xs font-medium mb-1">Chi tiết theo segment</div>
                                                  <div className="space-y-1 text-xs text-[hsl(var(--muted-foreground))]">
                                                    {fareDetails.length === 0 && <div>Không có thông tin theo segment.</div>}
                                                    {fareDetails.map((fd: any, idx: number) => (
                                                      <div key={idx} className="p-2 bg-gray-50 rounded">
                                                        <div>Segment: <span className="font-medium">{fd.segmentId ?? fd.segment?.id ?? idx}</span></div>
                                                        <div>Cabin: {fd.cabin ?? '-'}</div>
                                                        <div>Fare basis: {fd.fareBasis ?? '-'}</div>
                                                        <div>Class: {fd.class ?? fd.bookingClass ?? '-'}</div>
                                                        <div>Included checked bags: {fd.includedCheckedBags?.quantity ?? fd.includedCheckedBags?.weight ?? '-'}</div>
                                                      </div>
                                                    ))}
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      );
                                    })()}
                                  </TabsContent>

                                </div>
                              </Tabs>
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })()
          ))
        )
      )}
    </div>
  );
}