import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  Plane,
  Bus,
  Map,
  Calendar as CalendarIcon,
  ArrowLeftRight,
  Plus,
  Minus,
  Users,
  Search,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { withSuspense } from './SuspenseWrapper';

interface PassengerCount {
  adults: number;
  children: number;
  infants: number;
}

interface SearchTabsProps {
  onSearch?: (data: any) => void;
  activeTab?: 'flight' | 'bus' | 'tour';
}

function SearchTabs({ onSearch, activeTab }: SearchTabsProps) {
  const [flightType, setFlightType] = useState<'roundtrip' | 'oneway' | 'multicity'>('oneway');
  const [passengers, setPassengers] = useState<PassengerCount>({
    adults: 1,
    children: 0,
    infants: 0,
  });
  const [flightDeparture, setFlightDeparture] = useState<Date|any>(new Date());
  const [flightReturn, setFlightReturn] = useState<Date|any>();
  const [busDeparture, setBusDeparture] = useState<Date|any>(new Date());
  const [tourDeparture, setTourDeparture] = useState<Date|any>(new Date());
  const [isPassengerOpen, setIsPassengerOpen] = useState(false);
  const [provinces, setProvinces] = useState<{ code: string, name: string }[]>([]);
  const [airports, setAirports] = useState<any[]>([]);
  // travel class for flights (Amadeus values)
  const [travelClass, setTravelClass] = useState<'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST'>('ECONOMY');
  // from/to state for each search type
  const [flightFrom, setFlightFrom] = useState<string>('');
  const [flightTo, setFlightTo] = useState<string>('');
  const [busFrom, setBusFrom] = useState<string>('');
  const [busTo, setBusTo] = useState<string>('');
  const [tourFrom, setTourFrom] = useState<string>('');
  const [tourTo, setTourTo] = useState<string>('');
  const router = useRouter();
  const searchParams = useSearchParams();

  // load airports for flight selects (only)
  useEffect(() => {
    fetch('/airport.json')
      .then((res) => res.json())
      .then((data) => {
        console.log('[SearchTabs] /airport.json raw:', data);
        const raw = data?.airports ?? data;
        const list = Array.isArray(raw) ? raw : (raw ? Object.values(raw) : []);
        console.log('[SearchTabs] parsed airports:', list.length, list.slice(0, 6));
        setAirports(list);
      })
      .catch((err) => {
        console.error('[SearchTabs] failed to load /airport.json', err);
        setAirports([]);
      });
  }, []);





  useEffect(() => {
    fetch('/provinces.json')
      .then((res) => res.json())
      .then((data) => {
        setProvinces(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error('[SearchTabs] failed to load /provinces.json', err);
        setProvinces([]);
      });
  }, []);

  // normalize helper: enforce rules
  // - adults >= 1
  // - infants <= adults
  // - seated = adults + children <= 9 (reduce children first)
  const normalizePassengers = (p: PassengerCount): PassengerCount => {
    const adults = Math.max(1, Number.isFinite(p.adults) ? p.adults : 1);
    let children = Math.max(0, Number.isFinite(p.children) ? p.children : 0);
    let infants = Math.max(0, Number.isFinite(p.infants) ? p.infants : 0);

    // infants cannot exceed adults
    if (infants > adults) infants = adults;

    // seated constraint (adults + children) <= 9
    if (adults + children > 9) {
      const overflow = adults + children - 9;
      children = Math.max(0, children - overflow);
    }

    return { adults, children, infants };
  };

  // resolve incoming code (IATA or ICAO) to the ICAO value used by our Selects.
  // - If airports list contains matching IATA, return its ICAO (so Select value matches)
  // - If it's already an ICAO present in list, return it
  // - Otherwise return the original string (fallback)
  const resolveAirportIcao = (code?: string | null) => {
    if (!code) return '';
    const key = String(code).trim();
    if (!key) return '';
    const byIata = airports.find(a => a.iata === key);
    if (byIata) return byIata.icao;
    const byIcao = airports.find(a => a.icao === key);
    if (byIcao) return byIcao.icao;
    return key;
  };

  // map incoming province name (or code) -> province.code so Select value matches options
  const mapProvinceInputToCode = (val?: string | null) => {
    if (!val) return '';
    const v = String(val).trim();
    if (!v) return '';
    if (provinces && provinces.length > 0) {
      const exact = provinces.find(p => String(p.name).toLowerCase() === v.toLowerCase());
      if (exact) return String(exact.code);
      const partial = provinces.find(p => String(p.name).toLowerCase().includes(v.toLowerCase()));
      if (partial) return String(partial.code);
    }
    // if value already looks like a numeric code, return as-is
    if (/^\d+$/.test(v)) return v;
    return v;
  };
  // If airports load after we already set flightFrom/flightTo from query (and query used IATA),
  // remap them to ICAO so the Select shows correct selection.
  useEffect(() => {
    if (!airports || airports.length === 0) return;

    // If no selection yet, default to first two airports (same logic as TravelokaBanner)
    setFlightFrom(prev => {
      if (!prev) {
        return airports[0].icao;
      }
      const foundByIata = airports.find(a => a.iata === prev);
      const foundByIcao = airports.find(a => a.icao === prev);
      return foundByIata ? foundByIata.icao : (foundByIcao ? foundByIcao.icao : prev);
    });

    setFlightTo(prev => {
      if (!prev) {
        return airports[1]?.icao || airports[0].icao;
      }
      const foundByIata = airports.find(a => a.iata === prev);
      const foundByIcao = airports.find(a => a.icao === prev);
      return foundByIata ? foundByIata.icao : (foundByIcao ? foundByIcao.icao : prev);
    });
  }, [airports]);
  useEffect(() => {
    if (flightType === "roundtrip" && !flightReturn) {
      const d = new Date();
      d.setDate(d.getDate() + 2); // hôm nay +2 ngày
      setFlightReturn(d);
    }
  }, [flightType]);
  // For flight tab: fill fields from query params if present
  useEffect(() => {
    if (!searchParams) return;

    // read all params once
    const params = Object.fromEntries(searchParams.entries());
    const from = params['from'];
    const to = params['to'];
    const departure = params['departure'] || params['date'] || params['departureDate'];
    const returnDate = params['return'] || params['returnDate'];
    const travelClassParam = params['travelClass'];

    // accept explicit total if provided
    const hasTotalParam = Object.prototype.hasOwnProperty.call(params, 'total');
    const totalVal = hasTotalParam ? parseInt(params['total'] || '0', 10) : undefined;

    // parse passenger params robustly (accept "0" values)
    const hasAdultsParam = Object.prototype.hasOwnProperty.call(params, 'adults');
    const hasChildrenParam = Object.prototype.hasOwnProperty.call(params, 'children');
    const hasInfantsParam = Object.prototype.hasOwnProperty.call(params, 'infants');

    const adultsVal = hasAdultsParam ? parseInt(params['adults'] || '0', 10) : undefined;
    const childrenVal = hasChildrenParam ? parseInt(params['children'] || '0', 10) : undefined;
    const infantsVal = hasInfantsParam ? parseInt(params['infants'] || '0', 10) : undefined;

    // Fill from/to for all relevant controls so redirect always pre-fills UI.
    // Resolve incoming code (IATA or ICAO) to ICAO for Select value.
    if (from !== undefined && from !== null && from !== '') {
      const resolvedFrom = resolveAirportIcao(String(from));
      setFlightFrom(resolvedFrom);
      setBusFrom(String(from));
      // setTourFrom(String(from));
      setTourFrom(mapProvinceInputToCode(String(from)));
    }
    if (to !== undefined && to !== null && to !== '') {
      const resolvedTo = resolveAirportIcao(String(to));
      setFlightTo(resolvedTo);
      setBusTo(String(to));
      // setTourTo(String(to));
      setTourTo(mapProvinceInputToCode(String(to)));
    }

    // Dates
    if (departure) {
      const d = new Date(departure);
      if (!Number.isNaN(d.getTime())) {
        setFlightDeparture(d);
        setBusDeparture(d);
        setTourDeparture(d);
      }
    }
    if (returnDate) {
      const r = new Date(returnDate);
      if (!Number.isNaN(r.getTime())) {
        setFlightReturn(r);
        setFlightType('roundtrip');
      }
    } else {
      setFlightType('oneway');
    }

    // Update passengers:
    // Prefer explicit breakdown (adults/children/infants) if any provided.
    // Otherwise if an explicit total is provided, apply it (assign to adults by default so total shows correctly).
    if (hasAdultsParam || hasChildrenParam || hasInfantsParam) {
      const candidate = {
        adults: adultsVal !== undefined ? Math.max(1, adultsVal) : passengers.adults,
        children: childrenVal !== undefined ? Math.max(0, childrenVal) : passengers.children,
        infants: infantsVal !== undefined ? Math.max(0, infantsVal) : passengers.infants,
      };
      setPassengers(normalizePassengers(candidate));
    } else if (hasTotalParam && totalVal !== undefined && !Number.isNaN(totalVal)) {
      // If total exists but breakdown missing, set adults = total (user can adjust later)
      setPassengers(normalizePassengers({
        adults: Math.max(1, totalVal),
        children: 0,
        infants: 0,
      }));
    }

    // travel class
    if (travelClassParam && ['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST'].includes(travelClassParam)) {
      setTravelClass(travelClassParam as any);
    }
  }, [searchParams, activeTab]);

  // Use normalized update to enforce constraints when user clicks +/-.
  const updatePassengerCount = (type: keyof PassengerCount, increment: boolean) => {
    setPassengers(prev => {
      let adults = prev.adults;
      let children = prev.children;
      let infants = prev.infants;

      if (type === 'adults') {
        adults = Math.max(1, adults + (increment ? 1 : -1));
        // after changing adults, ensure infants <= adults
        if (infants > adults) infants = adults;
        // enforce seated limit by reducing children if needed
        if (adults + children > 9) {
          const overflow = adults + children - 9;
          children = Math.max(0, children - overflow);
        }
      } else if (type === 'children') {
        if (increment) {
          // only allow if seated < 9
          if (adults + children < 9) children = children + 1;
        } else {
          children = Math.max(0, children - 1);
        }
      } else if (type === 'infants') {
        if (increment) {
          // infants cannot exceed adults
          if (infants < adults) infants = infants + 1;
        } else {
          infants = Math.max(0, infants - 1);
        }
      }

      return normalizePassengers({ adults, children, infants });
    });
  };
  useEffect(() => {
      if (!provinces || provinces.length === 0) return;
      
      setTourFrom(prev => mapProvinceInputToCode(prev));
      setTourTo(prev => mapProvinceInputToCode(prev));
  }, [provinces]);
  useEffect(() => {
    if (flightType === "roundtrip" && flightDeparture && !flightReturn) {
      const returnDate = new Date(flightDeparture);
      returnDate.setDate(returnDate.getDate() + 3); // Ngày về = ngày đi + 3 ngày
      setFlightReturn(returnDate);
    }
  }, [flightType, flightDeparture]);
  const totalPassengers = passengers.adults + passengers.children + passengers.infants;

  // Hàm chuyển route và truyền query
  const handleSearch = (type: 'flight' | 'bus' | 'tour') => {
    if (type === 'flight') {
      // resolve IATA (fallback to ICAO) for origin/destination
      const originAirport = airports.find(a => a.icao === flightFrom || a.iata === flightFrom);
      const destAirport = airports.find(a => a.icao === flightTo || a.iata === flightTo);
      const originCode = originAirport?.iata || originAirport?.icao || flightFrom || '';
      const destCode = destAirport?.iata || destAirport?.icao || flightTo || '';

      const departureDate = flightDeparture ? flightDeparture.toISOString().split('T')[0] : '';
      const returnDate = (flightType === 'roundtrip' && flightReturn) ? flightReturn.toISOString().split('T')[0] : '';

      // Normalize passengers before building payload so UI and payload match rules
      const norm = normalizePassengers(passengers);
      if (norm.adults !== passengers.adults || norm.children !== passengers.children || norm.infants !== passengers.infants) {
        setPassengers(norm);
      }
      const adults = norm.adults;
      const children = norm.children;
      const infants = norm.infants;

      const basePayload: Record<string, string> = {
        originLocationCode: originCode,
        destinationLocationCode: destCode,
        adults: String(adults),
        children: String(children),
        infants: String(infants),
        travelClass: travelClass,
        includedAirlineCodes: 'VN',
        nonStop: 'true',
        currencyCode: 'VND',
        max: String(10)
      };
      // outbound / inbound payloads
      const outboundPayload = { ...basePayload, departureDate };
      const inboundPayload = returnDate ? { ...basePayload, originLocationCode: destCode, destinationLocationCode: originCode, departureDate: returnDate } : null;

      // Log both payloads for verification before proceeding
      console.log('Outbound payload (SearchTabs):', outboundPayload);
      if (inboundPayload) console.log('Inbound payload (SearchTabs):', inboundPayload);

      // ask user to confirm before navigating (so you can inspect console)
      // const ok = typeof window !== 'undefined' ? window.confirm('Roundtrip detected. Outbound + inbound payloads logged to console. Proceed to search?') : true;
      const ok = typeof window !== 'undefined' ? window.confirm('Bạn đồng ý tiếp tục tìm kiếm chuyến bay?') : true;

      if (!ok) return;

      // Build final querystring (keep compatibility with landing page params)
      const payload: Record<string, string> = { ...outboundPayload };
      if (inboundPayload) payload.returnDate = inboundPayload.departureDate!;
      console.log('Flight search payload (Amadeus params) SearchTabs :', payload);
      const qs = new URLSearchParams(payload);
      if (originCode) qs.set('from', originCode);
      if (destCode) qs.set('to', destCode);
      const originState = originAirport?.state || '';
      const destState = destAirport?.state || '';
      if (originState) qs.set('fromState', originState);
      if (destState) qs.set('toState', destState);
      qs.set('total', String(totalPassengers));
      qs.set('adults', String(adults));
      qs.set('children', String(children));
      qs.set('infants', String(infants));
      // notify parent if provided (optional)
      if (typeof onSearch === 'function') onSearch({ type: 'flight', ...Object.fromEntries(qs.entries()) });
      router.push(`/ve-may-bay?${qs.toString()}`);
    } else if (type === 'bus') {
      // const payload = {
      //   type: 'bus',
      //   from: busFrom,
      //   to: busTo,
      //   departure: busDeparture ? busDeparture.toISOString().split('T')[0] : ''
      // };
      // console.log('Search clicked:', payload);
      // if (typeof onSearch === 'function') onSearch(payload);
      // router.push(`/xe-du-lich?from=${payload.from}&to=${payload.to}&departure=${payload.departure}`);
      const payload = {
        type: 'bus',
        from: busFrom,
        to: busTo,
        departure: busDeparture ? busDeparture.toISOString().split('T')[0] : ''
      };
      console.log('SearchTabs: bus search clicked, payload=', payload); // <-- debug
      if (typeof onSearch === 'function') {
        try { onSearch(payload); } catch (e) { console.warn('onSearch threw', e); }
      }
      router.push(`/xe-du-lich?from=${payload.from}&to=${payload.to}&departure=${payload.departure}`);
    } else if (type === 'tour') {
      // const payload = {
      //   type: 'tour',
      //   from: tourFrom,
      //   to: tourTo,
      //   departure: tourDeparture ? tourDeparture.toISOString().split('T')[0] : ''
      // };
      // console.log('Search clicked:', payload);
      // if (typeof onSearch === 'function') onSearch(payload);
      // router.push(`/tour?from=${payload.from}&to=${payload.to}&departure=${payload.departure}`);
      // send province names for tour searches (keep bus/flight unchanged)
      const departure = tourDeparture ? tourDeparture.toISOString().split('T')[0] : '';
      const fromName = provinces.find(p => String(p.code) === tourFrom)?.name || tourFrom || '';
      const toName = provinces.find(p => String(p.code) === tourTo)?.name || tourTo || '';
      const payload = {
        type: 'tour',
        from: fromName,
        to: toName,
        departure
      };
      console.log('Search clicked:', payload);
      if (typeof onSearch === 'function') onSearch(payload);
      router.push(`/tour?from=${encodeURIComponent(fromName)}&to=${encodeURIComponent(toName)}&departure=${departure}`);
    }
  };

  // Default return date = today + 2 days (formatted YYYY-MM-DD)


  return (
    <div className="w-full max-w-6xl mx-auto">
      <Tabs defaultValue={activeTab || "flight"} value={activeTab} className="w-full">


        {/* <TabsList className="grid w-full grid-cols-3 mb-1">
          <TabsTrigger value="flight" className="flex items-center space-x-2">
            <Plane className="h-4 w-4" />
            <span>Vé máy bay</span>
          </TabsTrigger>
          <TabsTrigger value="bus" className="flex items-center space-x-2">
            <Bus className="h-4 w-4" />
            <span>Xe du lịch</span>
          </TabsTrigger>
          <TabsTrigger value="tour" className="flex items-center space-x-2">
            <Map className="h-4 w-4" />
            <span>Tour</span>
          </TabsTrigger>
        </TabsList> */}

        {/* Chỉ render đúng tab content nếu có activeTab */}
        {(!activeTab || activeTab === 'flight') && (
          <TabsContent value="flight" className="space-y-4">
            <div className="bg-white rounded-lg  p-6 shadow-sm">
              {/* Flight Type */}
              <div className="flex items-center space-x-4 mb-4">

                <Label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="flightType"
                    value="oneway"
                    checked={flightType === 'oneway'}
                    onChange={() => setFlightType('oneway')}
                    className="text-primary"
                  />
                  <span>Một chiều</span>
                </Label>
                <Label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="flightType"
                    value="roundtrip"
                    checked={flightType === 'roundtrip'}
                    onChange={() => setFlightType('roundtrip')}
                    className="text-primary"
                  />
                  <span>Khứ hồi</span>
                </Label>
                {/* <Label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="flightType"
                    value="multicity"
                    checked={flightType === 'multicity'}
                    onChange={() => setFlightType('multicity')}
                    className="text-primary"
                  />
                  <span>Nhiều thành phố</span>
                </Label> */}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* From */}
                <div className="space-y-2">
                  <Label htmlFor="from">Từ</Label>
                  <Select value={flightFrom} onValueChange={setFlightFrom}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn sân bay" />
                    </SelectTrigger>
                    <SelectContent>
                      {airports.filter(a => a.icao !== flightTo).map((a) => (
                        <SelectItem key={a.icao} value={a.icao}>
                          {a.name} {a.iata ? `(${a.iata})` : `(${a.icao})`} — {a.state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* To */}
                <div className="space-y-2 relative">
                  <Label htmlFor="to">Đến</Label>
                  <Select value={flightTo} onValueChange={setFlightTo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn sân bay" />
                    </SelectTrigger>
                    <SelectContent>
                      {airports.filter(a => a.icao !== flightFrom).map((a) => (
                        <SelectItem key={a.icao} value={a.icao}>
                          {a.name} {a.iata ? `(${a.iata})` : `(${a.icao})`} — {a.state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-8 h-8 w-8 p-0"
                    onClick={() => {
                      setFlightFrom(flightTo);
                      setFlightTo(flightFrom);
                    }}
                  >
                    {/* <ArrowLeftRight className="h-4 w-4" /> */}
                  </Button>
                </div>

                {/* Departure Date */}
                <div className="space-y-2">
                  <Label>Ngày đi</Label>
                  <Input
                    type="date"
                    className="block h-12 bg-white shadow-md text-black w-full"
                    value={flightDeparture ? flightDeparture.toISOString().split('T')[0] : ''}
                    // onChange={e => setFlightDeparture(e.target.value ? new Date(e.target.value) : undefined)}
                    onChange={e => {
                      const newDate = e.target.value ? new Date(e.target.value) : undefined;
                      setFlightDeparture(newDate);
                      if (flightType === 'roundtrip' && newDate) {
                        const returnDate = new Date(newDate);
                        returnDate.setDate(returnDate.getDate() + 3); // Ngày về = ngày đi + 3 ngày
                        setFlightReturn(returnDate);
                      }
                    }}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                {/* Return Date */}
                {flightType === 'roundtrip' && (
                  <div className="space-y-2">
                    <Label>Ngày về</Label>
                    <Input
                      type="date"
                      className="block h-12 bg-white shadow-md text-black w-full"
                      value={flightReturn ? flightReturn.toISOString().split("T")[0] : ""}
                      onChange={(e) => setFlightReturn(e.target.value ? new Date(e.target.value) : undefined)}
                      min={
                        flightDeparture
                          ? flightDeparture.toISOString().split("T")[0]
                          : new Date().toISOString().split("T")[0]
                      }
                    />

                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                {/* Passengers */}
                <div className="space-y-2">
                  <Label>Số hành khách</Label>
                  <Popover open={isPassengerOpen} onOpenChange={setIsPassengerOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <Users className="mr-2 h-4 w-4" />
                        {totalPassengers} hành khách
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">Người lớn</div>
                            <div className="text-sm text-muted-foreground">≥ 18 tuổi</div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updatePassengerCount('adults', false)}
                              disabled={passengers.adults <= 1}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center">{passengers.adults}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updatePassengerCount('adults', true)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">Trẻ em</div>
                            <div className="text-sm text-muted-foreground">4-11 tuổi</div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updatePassengerCount('children', false)}
                              disabled={passengers.children <= 0}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center">{passengers.children}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updatePassengerCount('children', true)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">Em bé</div>
                            <div className="text-sm text-muted-foreground">&lt; 4 tuổi</div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updatePassengerCount('infants', false)}
                              disabled={passengers.infants <= 0}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center">{passengers.infants}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updatePassengerCount('infants', true)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Class */}
                <div className="space-y-2">
                  <Label>Hạng vé</Label>
                  <Select value={travelClass} onValueChange={(v) => setTravelClass(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ECONOMY">Phổ thông</SelectItem>
                      <SelectItem value="PREMIUM_ECONOMY">Premium Economy</SelectItem>
                      <SelectItem value="BUSINESS">Thương gia</SelectItem>
                      <SelectItem value="FIRST">Hạng nhất</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Search Button */}
                <div className="flex items-end">
                  <Button className="w-full h-10" onClick={() => handleSearch('flight')}>
                    <Search className="mr-2 h-4 w-4" />
                    Tìm chuyến bay
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        )}
        {(!activeTab || activeTab === 'bus') && (
          <TabsContent value="bus" className="space-y-4">
            <div className="bg-white rounded-lg  p-6 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bus-from">Điểm đón</Label>
                  <Select value={busFrom} onValueChange={setBusFrom}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tỉnh/Thành phố hoặc bến xe" />
                    </SelectTrigger>
                    <SelectContent>
                      {provinces.filter(prov => prov.code.toString() !== busTo).map((prov) => (
                        <SelectItem key={prov.code} value={prov.code.toString()}>{prov.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bus-to">Điểm trả</Label>
                  <Select value={busTo} onValueChange={setBusTo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tỉnh/Thành phố hoặc bến xe" />
                    </SelectTrigger>
                    <SelectContent>
                      {provinces.filter(prov => prov.code.toString() !== busFrom).map((prov) => (
                        <SelectItem key={prov.code} value={prov.code.toString()}>{prov.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ngày đi</Label>
                  <Input
                    type="date"
                    className="block h-12 bg-white shadow-md text-black w-full"
                    value={busDeparture ? busDeparture.toISOString().split("T")[0] : ""}
                    onChange={(e) =>
                      setBusDeparture(e.target.value ? new Date(e.target.value) : undefined)
                    }
                  />

                </div>
                <div className="flex items-end">
                  <Button className="w-full h-10" onClick={() => handleSearch('bus')}>
                    <Search className="mr-2 h-4 w-4" />
                    Tìm chuyến xe
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        )}
        {(!activeTab || activeTab === 'tour') && (
          <TabsContent value="tour" className="space-y-4">
            <div className="bg-white rounded-lg  p-6 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tour-from">Điểm khởi hành</Label>
                  <Select value={tourFrom} onValueChange={setTourFrom}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn điểm khởi hành" />
                    </SelectTrigger>
                    <SelectContent>
                      {provinces.filter(prov => prov.code.toString() !== tourTo).map((prov) => (
                        <SelectItem key={prov.code} value={prov.code.toString()}>{prov.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tour-to">Điểm đến</Label>
                  <Select value={tourTo} onValueChange={setTourTo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Điểm đến mong muốn" />
                    </SelectTrigger>
                    <SelectContent>
                      {provinces.filter(prov => prov.code.toString() !== tourFrom).map((prov) => (
                        <SelectItem key={prov.code} value={prov.code.toString()}>{prov.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ngày khởi hành</Label>
                  <Input
                    type="date"
                    className="block h-12 bg-white shadow-md text-black w-full"
                    value={tourDeparture ? tourDeparture.toISOString().split('T')[0] : ''}
                    onChange={e => setTourDeparture(e.target.value ? new Date(e.target.value) : undefined)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="flex items-end">
                  <Button className="w-full h-10" onClick={() => handleSearch('tour')}>
                    <Search className="mr-2 h-4 w-4" />
                    Tìm tour
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
export default withSuspense(SearchTabs);