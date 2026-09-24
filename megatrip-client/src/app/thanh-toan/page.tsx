"use client";
import { useState, useEffect } from "react";
import { me } from '@/apis/auth';
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Layout from "../components/Layout";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Checkbox } from "../components/ui/checkbox";
import { Separator } from "../components/ui/separator";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  CreditCard,
  Shield,
  AlertCircle,
  ChevronLeft,
  Info,
  Lock,
  CheckCircle,
  Smartphone,
  Building,
  FileText,
  Clock,
  Plane,
  Users,
  Calendar,
  MapPin,
  ChevronDown,
  SeparatorVertical, // added icon for collapse
  Loader2,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { withSuspense } from "../components/SuspenseWrapper";

// Khai báo mảng phương thức thanh toán
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080";
const paymentMethods = [
  // {
  //   id: "credit_card",
  //   name: "Thẻ tín dụng/ghi nợ",
  //   description: "Visa, Mastercard, JCB",
  //   icon: CreditCard,
  //   fee: 0,
  //   instant: true,
  // },
  // {
  //   id: "atm",
  //   name: "ATM nội địa",
  //   description: "Internet Banking",
  //   icon: Building,
  //   fee: 0,
  //   instant: true,
  // },
  {
    id: "zalopay",
    name: "ZaloPay",
    description: "Ví điện tử ZaloPay",
    icon: Smartphone,
    fee: 0,
    instant: true,
  },
  // {
  //   id: "vnpay",
  //   name: "VNPay",
  //   description: "Ví điện tử VNPay",
  //   icon: Smartphone,
  //   fee: 0,
  //   instant: true,
  // },
  {
    id: "momo",
    name: "MoMo",
    description: "Ví điện tử MoMo",
    icon: Smartphone,
    fee: 0,
    instant: true,
  },

  // {
  //   id: "bank_transfer",
  //   name: "Chuyển khoản ngân hàng",
  //   description: "Xác nhận trong 15 phút",
  //   icon: Building,
  //   fee: 0,
  //   instant: false,
  // },
];

// Lấy bookingData: ưu tiên bookingKey từ query (sessionStorage), sau đó fallback sang params/localStorage hoặc demo
const getBookingData = (searchParams: URLSearchParams) => {
  // 1) nếu bookingKey (session-stored full payload)
  const bookingKey = searchParams.get("bookingKey");
  if (bookingKey && typeof window !== "undefined") {
    const raw = sessionStorage.getItem(bookingKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        // keep original key info if present
        return parsed;
      } catch {
        /* ignore */
      }
    }
  }

  // 2) Ưu tiên các param rút gọn (legacy behavior)
  const type = searchParams.get("type");
  if (type) {
    if (type === "tour") {
      // build base object
      const base = {
        type: "tour",
        details: {
          route: searchParams.get("route") || "",
          date: searchParams.get("date") || "",
          time: searchParams.get("time") || "",
          // read extra tour fields passed from chi-tiet page
          tourCode: searchParams.get("tourCode") || null,
          startDateTime: searchParams.get("startDateTime") || null,
          endDateTime: searchParams.get("endDateTime") || null,
          pickupDropoff: searchParams.get("pickupDropoff") || "", // added
        },
        pricing: {
          basePrice: Number(searchParams.get("basePrice")) || 0,
          taxes: Number(searchParams.get("taxes")) || 0,
          addOns: Number(searchParams.get("addOns")) || 0,
          discount: Number(searchParams.get("discount")) || 0,
          total: Number(searchParams.get("total")) || 0,
          perPax: Number(searchParams.get("perPax")) || 0,
        },
      };

      // parse extra fields sent from chi-tiet page
      const unitAdult = Number(searchParams.get("unitAdult")) || undefined;
      const unitChild = Number(searchParams.get("unitChild")) || undefined;
      const unitInfant = Number(searchParams.get("unitInfant")) || undefined;
      const singleRooms = Number(searchParams.get("singleRooms")) || 0;
      const singleSupplement =
        Number(searchParams.get("singleSupplement")) || 0;
      const breakdownRaw = searchParams.get("breakdown");

      // attach per-pax pricing if present
      if (unitAdult || unitChild || unitInfant) {
        (base as any).pricing.perPax = {
          adultUnit: unitAdult ?? 0,
          childUnit: unitChild ?? 0,
          infantUnit: unitInfant ?? 0,
        };
      }

      // attach single-room info
      (base as any).pricing.singleRooms = singleRooms;
      (base as any).pricing.singleSupplement = singleSupplement;

      // try parse breakdown JSON (passengers array)
      if (breakdownRaw) {
        try {
          const parsed = JSON.parse(breakdownRaw);
          if (Array.isArray(parsed)) {
            (base as any).pricing.breakdown = parsed;
            // derive counts if not provided elsewhere
            const counts = { adults: 0, children: 0, infants: 0 };
            parsed.forEach((p: any) => {
              if (p.type === "adult") counts.adults += Number(p.qty || 0);
              if (p.type === "child") counts.children += Number(p.qty || 0);
              if (p.type === "infant") counts.infants += Number(p.qty || 0);
            });
            if (!(base as any).passengers) (base as any).passengers = { counts };
            else
              (base as any).passengers.counts = { ...(base as any).passengers.counts, ...counts };
          }
        } catch (e) {
          // ignore invalid JSON
        }
      }

      return base;
    }
    if (type === "bus") {
      const unitAdult = Number(searchParams.get("unitAdult")) || undefined;
      const unitChild = Number(searchParams.get("unitChild")) || undefined;
      const unitInfant = Number(searchParams.get("unitInfant")) || undefined;
      // parse extra bus-specific params (safe JSON parse)
      const busId = searchParams.get("busId") || "";
      const busNumber = searchParams.get("busNumber") || "";
      const company = searchParams.get("company") || "";
      const selectedPickup = searchParams.get("selectedPickup") || "";
      const selectedDropoff = searchParams.get("selectedDropoff") || "";
      const departureDateIso = searchParams.get("departureDateIso") || "";
      const selectedIndex = searchParams.get("selectedIndex") || "";
      const currency = searchParams.get("currency") || "VND";

      const seatsRaw = searchParams.get("seats") || "";
      const seats = seatsRaw
        ? seatsRaw
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
        : [];

      let passengerInfo = null;
      try {
        passengerInfo = JSON.parse(searchParams.get("passengerInfo") || "null");
      } catch {
        passengerInfo = null;
      }
      let passengersArr: any[] = [];
      try {
        const p = searchParams.get("passengers");
        passengersArr = p ? JSON.parse(p) : [];
      } catch {
        passengersArr = [];
      }

      const pricing: any = {
        basePrice: Number(searchParams.get("basePrice")) || 0,
        taxes: Number(searchParams.get("taxes")) || 0,
        addOns: Number(searchParams.get("addOns")) || 0,
        discount: Number(searchParams.get("discount")) || 0,
        total: Number(searchParams.get("total")) || 0,
        // ensure seats are available under pricing for normalizedPricing
        seats: seats,
      };

      // attach explicit per-pax units if present
      if (
        typeof unitAdult !== "undefined" ||
        typeof unitChild !== "undefined" ||
        typeof unitInfant !== "undefined"
      ) {
        pricing.perPax = {
          adultUnit: unitAdult ?? 0,
          childUnit: unitChild ?? Math.round((unitAdult ?? 0) * 0.75),
          infantUnit: unitInfant ?? 0,
        };
      }
      return {
        type: "bus",
        meta: {
          busId,
          busNumber,
          company,
          departureDateIso,
          selectedIndex,
          currency,
        },
        details: {
          route: searchParams.get("route") || "",
          date: searchParams.get("date") || "",
          time: searchParams.get("time") || "",
          selectedPickup,
          selectedDropoff,
          seats,
          passengerInfo,
          passengers: passengersArr,
        },
        pricing,
      };
    }
  }

  // 3) fallback: try localStorage bookingData (older flow)
  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem("bookingData");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch { }
    }
  }

  // 4) mẫu
  return {
    type: "flight",
    details: {
      flightNumber: "VN1546",
      route: "TP.HCM → Hà Nội",
      date: "15/01/2025",
      time: "06:15 - 08:30",
      airline: "Vietnam Airlines",
      passengers: 1,
      class: "Phổ thông",
    },
    pricing: {
      basePrice: 1990000,
      taxes: 290000,
      addOns: 150000,
      discount: -200000,
      total: 2230000,
    },
  };
};

// Nhận số lượng khách từ param hoặc localStorage
const getInitialPassengers = (searchParams: URLSearchParams | null) => {
  let adults = 1,
    children = 0,
    infants = 0;
  if (searchParams?.get("adults")) adults = Number(searchParams.get("adults"));
  if (searchParams?.get("children"))
    children = Number(searchParams.get("children"));
  if (searchParams?.get("infants"))
    infants = Number(searchParams.get("infants"));
  // Nếu không có param thì lấy từ localStorage
  if (!searchParams?.get("adults") && typeof window !== "undefined") {
    const stored = window.localStorage.getItem("participants");
    if (stored) {
      try {
        const p = JSON.parse(stored);
        adults = p.adults || adults;
        children = p.children || children;
        infants = p.infants || infants;
      } catch { }
    }
  }
  const arr = [];
  for (let i = 0; i < adults; i++) {
    arr.push({
      type: "adult",
      title: "Mr",
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      nationality: "VN",
      idNumber: "",
      idType: "cccd",
    });
  }
  for (let i = 0; i < children; i++) {
    arr.push({
      type: "child",
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      nationality: "VN",
      idNumber: "",
      idType: "cccd",
    });
  }
  for (let i = 0; i < infants; i++) {
    arr.push({
      type: "infant",
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      nationality: "VN",
      idNumber: "",
      idType: "cccd",
    });
  }
  return arr;
};

function ThanhToan() {
  const router = useRouter();
  const searchParams = useSearchParams()!;
  // remember bookingKey param so we can re-save payload to sessionStorage if user edits data
  const initialBookingKey =
    typeof searchParams?.get === "function"
      ? searchParams.get("bookingKey")
      : null;
  const [bookingKey, setBookingKey] = useState<string | null>(
    initialBookingKey ?? null
  );

  const [termsModalOpen, setTermsModalOpen] = useState(false);

  // don't compute bookingData from storage during render — load on client after mount to avoid SSR/CSR mismatch
  const [bookingData, setBookingData] = useState<any>(null);
  // bookingType default; will be adjusted after bookingData is loaded
  const [bookingType, setBookingType] = useState<"flight" | "bus" | "tour">(
    "flight"
  );
  // mounted guard to ensure server/client initial render match, then hydrate with real data
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // load bookingData on client (reads session/local storage safely)
  useEffect(() => {
    try {
      const data = getBookingData(searchParams as unknown as URLSearchParams);
      setBookingData(data);
      setBookingType(data?.flight ? "flight" : data?.type ?? "flight");
    } catch (e) {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Normalized view of booking payload: support both legacy bookingData.details and new booking.flight shape
  // const normalizedDetails = (() => {
  //     if (!bookingData) return {};
  //     // prefer explicit flight / details
  //     if (bookingData.flight) return bookingData.flight;
  //     if (bookingData.details) return bookingData.details;

  //     // support booking created by chi-tiet page: booking.flights.outbound
  //     if (bookingData.flights?.outbound) {
  //         const out = bookingData.flights.outbound;
  //         // attempt to derive passenger count from bookingData.passengers.counts if present
  //         const counts = bookingData.passengers?.counts;
  //         const paxCnt = counts ? (Number(counts.adults || 0) + Number(counts.children || 0) + Number(counts.infants || 0)) : (bookingData.passengers?.length ?? 1);
  //         return {
  //             flightNumber: out.flightNumber ?? out.flightNo ?? out.number ?? '',
  //             route: out.route ?? '',
  //             date: out.date ?? '',
  //             time: out.time ?? '',
  //             airline: out.airline ?? '',
  //             passengers: paxCnt,
  //         };
  //     }

  //     // fallback
  //     return bookingData.details ?? {};
  // })();
  // ...existing code...
  // Normalized view of booking payload: support both legacy bookingData.details and new booking.flight shape
  const normalizedDetails = (() => {
    if (!bookingData) return {};

    // flight / details passthrough
    if (bookingData.flight) return bookingData.flight;
    if (bookingData.details && bookingData.type !== "tour")
      return bookingData.details;

    // TOUR: prefer explicit details, otherwise derive from bookingData.startDates/endDates
    if (
      bookingData.type === "tour" ||
      (bookingData.details &&
        (bookingData.details.tourCode || bookingData.startDates))
    ) {
      const det = bookingData.details ? { ...bookingData.details } : {};
      // tourCode: prefer explicit, else try id/_id/slug
      const tourCode =
        det.tourCode ??
        bookingData.tourCode ??
        bookingData._id?.$oid ??
        bookingData._id ??
        bookingData.id ??
        bookingData.slug ??
        null;

      // try to resolve startDateTime/endDateTime
      let startDateTime = det.startDateTime ?? det.startIso ?? null;
      let endDateTime = det.endDateTime ?? det.endIso ?? null;

      // if backend provided arrays of startDates/endDates, match by selected date (det.date) or pick first
      if (
        (!startDateTime || !endDateTime) &&
        Array.isArray(bookingData.startDates) &&
        bookingData.startDates.length
      ) {
        const selDateRaw = det.date ?? null;
        const normalize = (s: any) => {
          try {
            return new Date(s).toISOString().split("T")[0];
          } catch {
            return null;
          }
        };
        const selIso = selDateRaw ? normalize(selDateRaw) : null;
        let pickIndex = -1;
        if (selIso) {
          pickIndex = bookingData.startDates.findIndex(
            (sd: any) => normalize(sd) === selIso
          );
        }
        if (pickIndex === -1) pickIndex = 0;
        startDateTime =
          startDateTime ?? bookingData.startDates[pickIndex] ?? null;
        if (Array.isArray(bookingData.endDates))
          endDateTime = endDateTime ?? bookingData.endDates[pickIndex] ?? null;
      }

      return {
        ...det,
        tourCode,
        startDateTime,
        endDateTime,
      };
    }

    // support booking created by chi-tiet page: booking.flights.outbound
    if (bookingData.flights?.outbound) {
      const out = bookingData.flights.outbound;
      const counts = bookingData.passengers?.counts;
      const paxCnt = counts
        ? Number(counts.adults || 0) +
        Number(counts.children || 0) +
        Number(counts.infants || 0)
        : bookingData.passengers?.length ?? 1;
      return {
        flightNumber: out.flightNumber ?? out.flightNo ?? out.number ?? "",
        route: out.route ?? "",
        date: out.date ?? "",
        time: out.time ?? "",
        airline: out.airline ?? "",
        passengers: paxCnt,
      };
    }

    // fallback
    return bookingData.details ?? {};
  })();
  // ...existing code...
  const normalizedPricing = (() => {
    if (!bookingData) return {};
    const p =
      bookingData.pricing ??
      bookingData.pricingEstimate ??
      bookingData.price ??
      {};
    // normalize addOns array
    const addOnsArr = Array.isArray(p.addOns)
      ? [...p.addOns]
      : p.addOns
        ? [p.addOns]
        : [];

    // If single-room info provided (from chi-tiet page), make it an add-on so it appears in services list
    const singleRooms = Number(p.singleRooms ?? 0);
    const singleSupplement = Number(p.singleSupplement ?? 0);
    if (singleRooms > 0 && singleSupplement > 0) {
      // only add if not already present to avoid duplicate counting
      const already = addOnsArr.some(
        (a) =>
          a.source === "singleRoom" ||
          (String(a.name).toLowerCase().includes("phụ thu phòng đơn") &&
            Number(a.total ?? a.unitPrice ?? a.price ?? 0) ===
            singleRooms * singleSupplement)
      );
      if (!already) {
        addOnsArr.push({
          name: "Phụ thu phòng đơn",
          qty: singleRooms,
          unitPrice: singleSupplement,
          total: singleRooms * singleSupplement,
          source: "singleRoom",
        });
      }
    }

    // compute addOnsTotal: prefer computed sum when item list exists (prevents double-counting when explicit total already includes items)
    const addOnsComputed = addOnsArr.reduce((s: number, a: any) => {
      const unit = Number(a?.unitPrice ?? a?.price ?? 0);
      const qty = Number(a?.qty ?? 1);
      const total = Number(a?.total ?? unit * qty);
      return s + (Number.isFinite(total) ? total : 0);
    }, 0);
    const addOnsExplicit = Number(p.addOnsTotal ?? p.addOnsAmount ?? 0);
    const addOnsTotal = addOnsArr.length > 0 ? addOnsComputed : addOnsExplicit;

    const seatsArr = Array.isArray(p.seats)
      ? p.seats
      : p.seats
        ? [p.seats]
        : [];
    const seatsTotal = seatsArr.reduce(
      (s: number, sitem: any) => s + Number(sitem?.price ?? 0),
      0
    );
    const total = Number(
      p.total ??
      p.estimatedTotal ??
      p.estimatedTotalAmount ??
      p.offerTotal ??
      p.total ??
      0
    );
    return {
      ...p,
      addOns: addOnsArr,
      addOnsTotal,
      seats: seatsArr,
      seatsTotal: Number(p.seatsTotal ?? seatsTotal),
      total,
    };
  })();

  const derivedOutbound = (() => {
    const pricing = bookingData?.pricingOutbound || bookingData?.pricing || {};  // Ưu tiên pricingOutbound
    const counts = bookingData?.passengers?.counts || { adults: 0, children: 0, infants: 0 };
    return {
      adultsUnit: Number(pricing.adultsUnit || 0),
      childrenUnit: Number(pricing.childrenUnit || 0),
      infantsUnit: Number(pricing.infantsUnit || 0),
      adultsTotal: Number(pricing.adultsTotal) || (Number(pricing.adultsUnit || 0) * Number(counts.adults || 0)),
      childrenTotal: Number(pricing.childrenTotal) || (Number(pricing.childrenUnit || 0) * Number(counts.children || 0)),
      infantsTotal: Number(pricing.infantsTotal) || (Number(pricing.infantsUnit || 0) * Number(counts.infants || 0)),
      offerTotal: Number(pricing.offerTotal || 0),
    };
  })();

  const derivedInbound = (() => {
    const pricing = bookingData?.pricingInbound || bookingData?.pricing?.inboundPricing || {};  // Ưu tiên pricingInbound
    const counts = bookingData?.passengers?.counts || { adults: 0, children: 0, infants: 0 };
    return {
      adultsUnit: Number(pricing.adultsUnit || 0),
      childrenUnit: Number(pricing.childrenUnit || 0),
      infantsUnit: Number(pricing.infantsUnit || 0),
      adultsTotal: Number(pricing.adultsTotal) || (Number(pricing.adultsUnit || 0) * Number(counts.adults || 0)),
      childrenTotal: Number(pricing.childrenTotal) || (Number(pricing.childrenUnit || 0) * Number(counts.children || 0)),
      infantsTotal: Number(pricing.infantsTotal) || (Number(pricing.infantsUnit || 0) * Number(counts.infants || 0)),
      offerTotal: Number(pricing.offerTotal || 0),
    };
  })();
  const isRoundtrip = !!(bookingData?.flights?.inbound);
  // keep bookingType in sync if bookingData changes (e.g. loaded from sessionStorage)
  useEffect(() => {
    setBookingType(
      bookingData?.flight ? "flight" : bookingData?.type ?? "flight"
    );
  }, [bookingData]);

  // Reload bookingData if query/search params change (e.g. new bookingKey)
  useEffect(() => {
    try {
      const refreshed = getBookingData(
        searchParams as unknown as URLSearchParams
      );
      // only update if different reference (avoid extra renders)
      if (JSON.stringify(refreshed) !== JSON.stringify(bookingData)) {
        setBookingData(refreshed);
      }
    } catch (e) {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState("momo");
  const [needInvoice, setNeedInvoice] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // New: processing state for payment button
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // New promo code UI state
  const [promoCode, setPromoCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0); // in VND
  const [promoMessage, setPromoMessage] = useState<string | null>(null);
  const [applyingPromo, setApplyingPromo] = useState(false);

  // Auto-apply states
  const [appliedPromoAuto, setAppliedPromoAuto] = useState<any | null>(null); // promo user accepted
  const [appliedPromoSource, setAppliedPromoSource] = useState<
    "auto" | "manual" | null
  >(null);
  const [appliedPromoCandidate, setAppliedPromoCandidate] = useState<
    any | null
  >(null); // best autoApply candidate for current cart
  const [appliedPromoCandidateDiscount, setAppliedPromoCandidateDiscount] =
    useState<number>(0);
  // control suggestion visibility (allow user to "close" and reopen)
  const [showPromoSuggestion, setShowPromoSuggestion] = useState<boolean>(true);
  // info shown after user accepts an auto-applied promo (persistent message)
  const [autoAppliedInfo, setAutoAppliedInfo] = useState<{
    code?: string | null;
    title?: string;
    saved: number;
  } | null>(null);
  // multiple-candidates support (FE)
  const [appliedPromoCandidates, setAppliedPromoCandidates] = useState<
    { promo: any; discount: number }[]
  >([]);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [selectedCandidateIndex, setSelectedCandidateIndex] = useState<
    number | null
  >(null);

  // compute stacked application: fixed first, then percent on remaining
  const computeStackedForList = (
    items: { promo: any; discount?: number }[],
    baseAmount: number
  ) => {
    let remaining = baseAmount;
    let total = 0;
    const applied: any[] = [];
    // fixed first
    for (const it of items.filter((x) => x.promo.type === "fixed")) {
      const p = it.promo;
      let d = Math.min(Number(p.value || 0), remaining);
      if (p.maxDiscount && p.maxDiscount > 0) d = Math.min(d, p.maxDiscount);
      if (d <= 0) continue;
      remaining -= d;
      total += d;
      applied.push({ promo: p, discount: d });
    }
    // percent next
    for (const it of items.filter((x) => x.promo.type === "percent")) {
      const p = it.promo;
      let d = Math.floor(remaining * (Number(p.value || 0) / 100));
      if (p.maxDiscount && p.maxDiscount > 0) d = Math.min(d, p.maxDiscount);
      d = Math.min(d, remaining);
      if (d <= 0) continue;
      remaining -= d;
      total += d;
      applied.push({ promo: p, discount: d });
    }
    return { total, applied };
  };
  const computeDiscountForPromo = (promo: any, eligibleAmount: number) => {
    if (!promo) return 0;
    const minSpend = Number(promo.minSpend || 0);
    if (eligibleAmount < minSpend) return 0;
    let discount = 0;
    if (promo.type === "percent") {
      discount = Math.floor(eligibleAmount * (Number(promo.value || 0) / 100));
    } else {
      discount = Number(promo.value || 0);
    }
    discount = Math.max(0, Math.min(discount, eligibleAmount));
    if (typeof promo.maxDiscount === "number" && promo.maxDiscount > 0)
      discount = Math.min(discount, promo.maxDiscount);
    return discount;
  };

  // Auto-apply effect: find autoApply promo candidates (single best or multiple)
  useEffect(() => {
    // don't suggest auto-apply if user typed a manual code or already accepted an auto promo
    if ((promoCode && promoCode.trim().length > 0) || appliedPromoAuto) {
      setAppliedPromoCandidate(null);
      setAppliedPromoCandidateDiscount(0);
      setAppliedPromoCandidates([]);
      setShowPromoModal(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const serviceMap: Record<string, string> = {
          flight: "flights",
          bus: "buses",
          tour: "tours",
        };
        const serviceType = serviceMap[bookingType] || "all";
        const amount = Number(normalizedPricing?.total ?? 0);
        if (!amount || amount <= 0) {
          setAppliedPromoCandidate(null);
          setAppliedPromoCandidateDiscount(0);
          setAppliedPromoCandidates([]);
          return;
        }

        const params = new URLSearchParams();
        params.set("status", "active");
        params.set("pageSize", "200");
        params.set("appliesTo", serviceType);
        const res = await fetch(
          `${API_BASE}/api/promotions?${params.toString()}`
        );
        if (!res.ok) return;
        const json = await res.json();
        const list = Array.isArray(json.data) ? json.data : [];

        const candidates = list.filter(
          (p: any) =>
            p.autoApply === true &&
            p.isActiveNow === true &&
            !p.isExpired &&
            !p.isUsedUp &&
            (Array.isArray(p.appliesTo)
              ? p.appliesTo.includes("all") || p.appliesTo.includes(serviceType)
              : true)
        );

        const evaluated = candidates
          .map((p:any) => {
            const eligibleAmount = amount;
            const d = computeDiscountForPromo(p, eligibleAmount);
            return { promo: p, discount: Math.round(d) };
          })
          .filter((e:any) => e.discount > 0)
          .sort((a:any, b:any) => b.discount - a.discount); // sort desc so index 0 is best

        if (!cancelled) {
          if (evaluated.length === 0) {
            setAppliedPromoCandidates([]);
            setAppliedPromoCandidate(null);
            setAppliedPromoCandidateDiscount(0);
            if (!promoCode) setPromoMessage(null);
          } else if (evaluated.length === 1) {
            // single candidate -> keep old banner flow
            setAppliedPromoCandidates([]);
            setAppliedPromoCandidate(evaluated[0].promo);
            setAppliedPromoCandidateDiscount(evaluated[0].discount);
            setShowPromoSuggestion(true);
            setPromoMessage(
              `Đơn hàng của bạn thỏa điều kiện khuyến mãi: ${evaluated[0].promo.title ||
              evaluated[0].promo.code ||
              "Khuyến mãi tự động"
              } — bạn có muốn áp dụng?`
            );
          } else {
            // multiple candidates -> keep best as banner suggestion AND expose full list for modal
            setAppliedPromoCandidates(evaluated);
            // keep best candidate visible in banner so user still sees a suggested code
            setAppliedPromoCandidate(evaluated[0].promo);
            setAppliedPromoCandidateDiscount(evaluated[0].discount);
            setShowPromoSuggestion(true);
            setPromoMessage(
              `Đơn hàng của bạn thỏa nhiều khuyến mãi tự động — chọn mã bạn muốn áp dụng.`
            );
            // do NOT auto-open modal; show "Chọn mã khác" button on banner
          }
        }
      } catch (err) {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [normalizedPricing?.total, bookingType, promoCode, appliedPromoAuto]);
  // add this so finalTotal is available throughout the component
  const baseAmount = Number(
    normalizedPricing?.total ??
    normalizedPricing?.estimatedTotal ??
    normalizedPricing?.offerTotal ??
    bookingData?.pricing?.total ??
    0
  );
  const finalTotal = Math.max(
    0,
    Math.round(baseAmount - (discountAmount || 0))
  );
  // New: toggle states for showing details
  const [showFareDetails, setShowFareDetails] = useState<{
    outbound: boolean;
    inbound: boolean;
  }>({ outbound: false, inbound: false });
  const [showAddonsDetails, setShowAddonsDetails] = useState<{
    outbound: boolean;
    inbound: boolean;
  }>({ outbound: false, inbound: false });
  const [showTotalFareDetails, setShowTotalFareDetails] =
    useState<boolean>(false);
  const [contactInfo, setContactInfo] = useState({
    email: "",
    phone: "",
    fullName: "",
    // customerId của user nếu đã đăng nhập (sẽ gửi kèm trong order)
    customerId: null as string | null,
  });

  // If user is logged in, prefill contact info from their profile
  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    (async () => {
      try {
        const payload = await me();
        if (!payload) return;
        // payload may be typed as AxiosResponse by TS; cast to any to safely access fields
        const user = payload as any;
        const resolvedUserId =
          user?._id ?? user?.id ?? user?.userId ?? user?._id?.$oid ?? null;
        setContactInfo((prev) => ({
          ...prev,
          fullName: (user && (user.name ?? user.fullName)) ?? prev.fullName,
          email: (user && (user.email ?? user.username)) ?? prev.email,
          phone: (user && (user.phone ?? user.mobile)) ?? prev.phone,
          customerId: prev.customerId ?? resolvedUserId ?? null,
        }));
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to prefill contact from profile', err);
      }
    })();
  }, []);
  // shuttle pickup for bus flow (điểm đón trung chuyển nếu ko lấy từ bến)
  const [shuttlePickup, setShuttlePickup] = useState<string>("");

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateEmail = (e: string) => /\S+@\S+\.\S+/.test(e);
  const validatePhone = (p: string) =>
    /^\+?\d{7,15}$/.test(p.replace(/\s+/g, ""));

  const validateStep = (step: number) => {
    const next: Record<string, string> = {};
    if (step === 1) {
      if (!contactInfo.fullName || contactInfo.fullName.trim().length < 2)
        next["contact.fullName"] = "Vui lòng nhập họ và tên";
      if (!contactInfo.email || !validateEmail(contactInfo.email))
        next["contact.email"] = "Vui lòng nhập email hợp lệ";
      if (!contactInfo.phone || !validatePhone(contactInfo.phone))
        next["contact.phone"] = "Vui lòng nhập số điện thoại hợp lệ";
      passengers.forEach((p, i) => {
        if (!p.firstName || !p.firstName.trim())
          next[`passenger.${i}.firstName`] = "Bắt buộc";
        if (!p.lastName || !p.lastName.trim())
          next[`passenger.${i}.lastName`] = "Bắt buộc";
        if (!p.dateOfBirth) {
          next[`passenger.${i}.dateOfBirth`] = "Bắt buộc";
        } else {
          const age = calculateAge(p.dateOfBirth);
          if (p.type === "infant" && age > 4)
            next[`passenger.${i}.dateOfBirth`] = "Em bé phải dưới 4 tuổi";
          if (p.type === "child" && (age <= 4 || age >= 12))
            next[`passenger.${i}.dateOfBirth`] = "Trẻ em từ 5 đến 11 tuổi";
          if (p.type === "adult" && age < 12)
            next[`passenger.${i}.dateOfBirth`] = "Người lớn từ 18 tuổi trở lên";
        }
        // Kiểm tra định dạng firstName và lastName: chỉ cho phép chữ cái, dấu cách, và một số ký tự đặc biệt
        const nameRegex = /^[a-zA-ZÀ-ỹ\s'-]+$/;
        if (p.firstName && !nameRegex.test(p.firstName.trim()))
          next[`passenger.${i}.firstName`] =
            "Tên chỉ được chứa chữ cái và dấu cách";
        if (p.lastName && !nameRegex.test(p.lastName.trim()))
          next[`passenger.${i}.lastName`] =
            "Tên chỉ được chứa chữ cái và dấu cách";
        // Kiểm tra idNumber: bắt buộc cho người lớn, tùy chọn cho trẻ em và em bé
        if (p.type === "adult" && (!p.idNumber || !p.idNumber.trim())) {
          next[`passenger.${i}.idNumber`] = "Bắt buộc cho người lớn";
        } else if (p.idNumber && p.idNumber.trim()) {
          // Nếu có idNumber, kiểm tra định dạng theo idType
          if (p.idType === "cccd" && !/^\d{12}$/.test(p.idNumber.trim())) {
            next[`passenger.${i}.idNumber`] = "CCCD phải là 12 chữ số";
          } else if (
            p.idType === "cmnd" &&
            !/^\d{9}$/.test(p.idNumber.trim())
          ) {
            next[`passenger.${i}.idNumber`] = "CMND phải là 9 chữ số";
          } else if (
            p.idType === "passport" &&
            !/^[A-Z0-9]{6,9}$/.test(p.idNumber.trim().toUpperCase())
          ) {
            next[`passenger.${i}.idNumber`] =
              "Hộ chiếu phải là 6-9 ký tự chữ và số";
          }
        }
      });
    }
    if (step === 2) {
      if (selectedPayment === "credit_card") {
        if (
          !paymentInfo.cardNumber ||
          paymentInfo.cardNumber.replace(/\s+/g, "").length < 12
        )
          next["payment.cardNumber"] = "Số thẻ không hợp lệ";
        if (!paymentInfo.cardHolder || paymentInfo.cardHolder.trim().length < 2)
          next["payment.cardHolder"] = "Tên chủ thẻ bắt buộc";
        if (
          !paymentInfo.expiryDate ||
          !/^\d{2}\/?\d{2}$/.test(paymentInfo.expiryDate)
        )
          next["payment.expiryDate"] = "MM/YY";
        if (!paymentInfo.cvv || !/^\d{3,4}$/.test(paymentInfo.cvv))
          next["payment.cvv"] = "CVV 3-4 chữ số";
      }
      if (needInvoice) {
        if (!invoiceInfo.companyName || !invoiceInfo.companyName.trim())
          next["invoice.companyName"] = "Bắt buộc";
        if (!invoiceInfo.taxCode || !invoiceInfo.taxCode.trim())
          next["invoice.taxCode"] = "Bắt buộc";
        if (!invoiceInfo.address || !invoiceInfo.address.trim())
          next["invoice.address"] = "Bắt buộc";
        if (!invoiceInfo.email || !validateEmail(invoiceInfo.email))
          next["invoice.email"] = "Email không hợp lệ";
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  // Danh sách hành khách
  const [passengers, setPassengers] = useState(
    getInitialPassengers(searchParams)
  );

  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: "",
    cardHolder: "",
    expiryDate: "",
    cvv: "",
  });

  const [invoiceInfo, setInvoiceInfo] = useState({
    companyName: "",
    taxCode: "",
    address: "",
    email: "",
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const applyPromo = async () => {
    setApplyingPromo(true);
    setPromoMessage(null);
    try {
      const code = (promoCode || "").trim().toUpperCase();
      if (appliedPromoCandidate && !code) {
        // nothing to do: user clicked empty apply; bail
        setApplyingPromo(false);
        return;
      }
      // if user is applying manual code, drop auto suggestion
      if (code) {
        setAppliedPromoCandidate(null);
      }
      if (!code) {
        setPromoMessage("Vui lòng nhập mã giảm giá.");
        setApplyingPromo(false);
        return;
      }

      const payloadTotal = Number(
        normalizedPricing?.total ??
        normalizedPricing?.estimatedTotal ??
        bookingData?.pricing?.total ??
        0
      );
      const serviceMap: Record<string, string> = {
        flight: "flights",
        bus: "buses",
        tour: "tours",
      };
      const serviceType = serviceMap[bookingType] || "all";

      try {
        // fetch promotion by code (server supports GET /api/promotions/:id where id can be code)
        const probeRes = await fetch(
          `${API_BASE}/api/promotions/${encodeURIComponent(code)}`
        );
        if (probeRes.ok) {
          const promoFound = await probeRes.json().catch(() => null);
          if (promoFound) {
            const applies = Array.isArray(promoFound.appliesTo)
              ? promoFound.appliesTo
              : [];
            if (!(applies.includes("all") || applies.includes(serviceType))) {
              setPromoMessage("Mã không áp dụng cho dịch vụ này.");
              setApplyingPromo(false);
              return;
            }
          }
        }
      } catch (e) {
        // ignore probe errors and continue to validate (server will still enforce)
      }

      const res = await fetch(`${API_BASE}/api/promotions/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, serviceType, amount: payloadTotal }),
      });
      const json = await res
        .json()
        .catch(() => ({ ok: false, error: "invalid_response" }));

      if (!res.ok || !json.ok) {
        // map server error to user-friendly message
        const errCode = json.error || "server_error";
        let msg = "Mã không hợp lệ hoặc lỗi server.";
        if (errCode === "promo_not_found") msg = "Mã không tồn tại.";
        else if (
          errCode === "promo_inactive" ||
          errCode === "promo_not_started"
        )
          msg = "Mã chưa hoạt động.";
        else if (errCode === "promo_expired") msg = "Mã đã hết hạn.";
        else if (errCode === "promo_used_up") msg = "Mã đã hết lượt sử dụng.";
        else if (errCode === "not_applicable_service")
          msg = "Mã không áp dụng cho dịch vụ này.";
        else if (errCode === "min_spend_not_met") {
          const need = Number(json.requiredMinSpend || 0);
          msg = `Cần đơn tối thiểu ${formatPrice(need)} để dùng mã.`;
        }
        setPromoMessage(msg);
        setDiscountAmount(0);
        setApplyingPromo(false);
        return;
      }

      // success: server returns discount, newTotal, eligibleAmount
      const discount = Number(json.discount || 0);
      const newTotal = Number(
        json.newTotal || Math.max(0, payloadTotal - discount)
      );

      setDiscountAmount(Math.round(discount));
      setPromoMessage(
        `Áp dụng mã ${code}: -${formatPrice(Math.round(discount))}`
      );
      // Persist applied promo in UI similar to auto-apply so banner appears
      try {
        const promoObj = json.promotion ?? {  // Fix: Sử dụng json.promotion thay vì json.promo
          code,
          title: json.title ?? code,
          type: json.type ?? "fixed",
          value: json.value ?? discount,
        };
        console.log('json.promotion:', json.promotion); // Debug: Kiểm tra json.promotion
        const promoId = json.promotion?.id || json.promotion?._id || null; // Fix: Lấy từ json.promotion
        console.log('promoId extracted:', promoId); // Debug: Kiểm tra promoId
        setAppliedPromoAuto({
          ...promoObj,
          appliedDiscount: Math.round(discount),
          _id: promoId,
        });
        setAppliedPromoSource("manual");
        setAutoAppliedInfo({
          code: promoObj.code ?? code,
          title: promoObj.title ?? code,
          saved: Math.round(discount),
        });
        // lock promoCode to the applied code (keeps UI consistent)
        setPromoCode(code);

        // console log for debugging
        console.log(
          `Áp dụng mã thủ công: ${code} — Tiết kiệm ${formatPrice(
            Math.round(discount)
          )}`,
          {
            code,
            discount: Math.round(discount),
            newTotal,
            response: json,
            appliedPromoAuto: {
              ...promoObj,
              appliedDiscount: Math.round(discount),
              _id: promoId,
            },
          }
        );
      } catch (e) {
        // ignore logging errors
      }
    } catch (err) {
      console.error("applyPromo error", err);
      setPromoMessage("Lỗi khi kết nối server. Vui lòng thử lại.");
      setDiscountAmount(0);
    } finally {
      setApplyingPromo(false);
    }
  };

  const removePromo = () => {
    // if an auto promo was accepted, remove it; otherwise clear manual promo
    if (appliedPromoAuto) {
      setAppliedPromoAuto(null);
      setAppliedPromoCandidate(null);
      setAppliedPromoCandidateDiscount(0);
      setDiscountAmount(0);
      setPromoMessage(null);
      setPromoCode("");
      setAutoAppliedInfo(null); // clear persistent applied info
      setAppliedPromoSource(null);
      return;
    }
    setPromoCode("");
    setDiscountAmount(0);
    setPromoMessage(null);
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!validateStep(1)) return;
    }
    if (currentStep === 2) {
      if (!validateStep(2)) return;
    }
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      return;
    }
    // nếu đang ở bước 1 thì quay lại trang trước (history)
    try {
      router.back();
    } catch {
      // fallback: nếu không có history thì chuyển về trang chủ
      router.push("/");
    }
  };
  // Thêm hàm tính tuổi
  const calculateAge = (dob: string) => {
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };
  const handlePayment = async () => {
    setIsProcessingPayment(true);
    // validate all before proceed
    const ok1 = validateStep(1);
    const ok2 = validateStep(2);
    if (!ok1 || !ok2) {
      if (!ok1) setCurrentStep(1);
      else if (!ok2) setCurrentStep(2);
      return;
    }
    if (!agreeTerms) {
      setErrors((prev) => ({
        ...prev,
        agreeTerms: "Bạn phải đồng ý với điều khoản",
      }));
      setCurrentStep(3);
      return;
    } else {
      setErrors((prev) => {
        const c = { ...prev };
        delete c["agreeTerms"];
        return c;
      });
    }

    // persist UI state (participants & booking payload)
    let payloadToSave = null;
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem("participants", JSON.stringify(passengers));
        const detailsSnapshot = {
          ...((bookingData && bookingData.details) || {}),
          selectedPickup:
            shuttlePickup ||
            (bookingData &&
              bookingData.details &&
              bookingData.details.selectedPickup) ||
            "",
          passengers: Array.isArray(passengers)
            ? passengers.map((p) => ({
              type: p.type,
              title: p.title,
              firstName: p.firstName,
              lastName: p.lastName,
              dateOfBirth: p.dateOfBirth,
              nationality: p.nationality,
              idNumber: p.idNumber,
              idType: p.idType,
            }))
            : (bookingData &&
              bookingData.details &&
              bookingData.details.passengers) ||
            [],
          passengerInfo: {
            name:
              contactInfo.fullName ||
              (bookingData &&
                bookingData.details &&
                bookingData.details.passengerInfo &&
                bookingData.details.passengerInfo.name) ||
              "",
            phone:
              contactInfo.phone ||
              (bookingData &&
                bookingData.details &&
                bookingData.details.passengerInfo &&
                bookingData.details.passengerInfo.phone) ||
              "",
            email:
              contactInfo.email ||
              (bookingData &&
                bookingData.details &&
                bookingData.details.passengerInfo &&
                bookingData.details.passengerInfo.email) ||
              "",
            idNumber:
              (bookingData &&
                bookingData.details &&
                bookingData.details.passengerInfo &&
                bookingData.details.passengerInfo.idNumber) ||
              "",
          },
        };
        payloadToSave = {
          ...(bookingData || {}),
          details: detailsSnapshot,
          pricing: {
            ...(bookingData?.pricing || {}),
            ...(bookingData?.pricing ? {} : {}),
          },
        };
        if (bookingKey) {
          sessionStorage.setItem(bookingKey, JSON.stringify(payloadToSave));
        } else {
          const newKey = `booking_${Date.now()}_${Math.floor(
            Math.random() * 10000
          )}`;
          sessionStorage.setItem(newKey, JSON.stringify(payloadToSave));
          setBookingKey(newKey);
          try {
            const url = new URL(window.location.href);
            url.searchParams.set("bookingKey", newKey);
            window.history.replaceState({}, "", url.toString());
          } catch {
            /* ignore */
          }
        }
        setBookingData(payloadToSave);
      }
    } catch (e) {
      console.warn("Could not persist booking payload", e);
    }

    // Build order payload and create order on server before redirecting to payment
    let createdOrder = null;
    let itemName = "";
    try {
      const payloadTotal = Number(
        normalizedPricing?.total ??
        normalizedPricing?.estimatedTotal ??
        bookingData?.pricing?.total ??
        0
      );
      const finalTotal = Math.max(
        0,
        Math.round(payloadTotal - (discountAmount || 0))
      );
      const tax = Number(
        normalizedPricing?.taxes ?? normalizedPricing?.tax ?? 0
      );
      const qty = Math.max(
        1,
        passengers.length ||
        (bookingData?.passengers && bookingData.passengers.counts
          ? bookingData.passengers.counts.adults || 1
          : 1)
      );
      const totalAmount = Math.round(
        Math.max(
          0,
          Number(normalizedPricing?.total ?? bookingData?.pricing?.total ?? 0) -
          (discountAmount || 0)
        )
      );
      const perUnit = Math.round(totalAmount / Math.max(1, qty));

      // determine product id and item name for flight
      const detailItemId =
        bookingData?.meta?.id ??
        bookingData?.meta?.tourId ??
        bookingData?.meta?.busId ??
        bookingData?.meta?.flightId ??
        bookingData?.id ??
        (bookingData?._id &&
          (typeof bookingData._id === "object"
            ? bookingData._id.$oid ?? bookingData._id
            : bookingData._id)) ??
        bookingData?.details?.tourCode ??
        bookingData?.details?.tourId ??
        bookingData?.flights?.outbound?.id ??
        bookingData?.flights?.outbound?.flightNumber ??
        undefined;

      let productId = detailItemId;
      itemName =
        (bookingData?.meta &&
          (bookingData.meta.label || bookingData.meta.name)) ||
        normalizedDetails?.flightNumber ||
        normalizedDetails?.route ||
        (bookingType === "tour"
          ? "Tour"
          : bookingType === "bus"
            ? "Vé xe"
            : "Vé máy bay") ||
        bookingType;

      if (bookingType === "flight" && bookingData?.flights?.outbound) {
        const outbound = bookingData.flights.outbound;
        const inbound = bookingData.flights.inbound;
        const formatDate = (date:any) =>
          date ? date.replace(/-/g, "") : "YYYYMMDD";
        const formatTime = (time:any) =>
          time ? time.split("-")[0].replace(":", "").slice(0, 4) : "HHMM";
        const formatRoute = (dep:any, arr:any) => (dep && arr ? `${dep}-${arr}` : "");
        const outboundSegment = outbound.itineraries?.[0]?.segments?.[0];
        const outboundKey =
          outboundSegment?.carrierCode &&
            outboundSegment?.number &&
            outbound.date &&
            outbound.time &&
            outboundSegment?.departure?.iataCode &&
            outboundSegment?.arrival?.iataCode
            ? `${outboundSegment.carrierCode}${outboundSegment.number
            }_${formatDate(outbound.date)}_${formatTime(
              outbound.time
            )}_${formatRoute(
              outboundSegment.departure.iataCode,
              outboundSegment.arrival.iataCode
            )}`
            : "OUTBOUND_INVALID";

        productId = outboundKey;
        itemName = inbound
          ? `Vé khứ hồi ${formatRoute(
            outboundSegment?.departure?.iataCode,
            outboundSegment?.arrival?.iataCode
          )}`
          : `Vé một chiều ${formatRoute(
            outboundSegment?.departure?.iataCode,
            outboundSegment?.arrival?.iataCode
          )}`;

        if (
          inbound &&
          inbound.itineraries?.[0]?.segments?.[0]?.carrierCode &&
          inbound.itineraries?.[0]?.segments?.[0]?.number &&
          inbound.date &&
          inbound.time &&
          inbound.itineraries?.[0]?.segments?.[0]?.departure?.iataCode &&
          inbound.itineraries?.[0]?.segments?.[0]?.arrival?.iataCode
        ) {
          const inboundSegment = inbound.itineraries[0].segments[0];
          const inboundKey = `${inboundSegment.carrierCode}${inboundSegment.number
            }_${formatDate(inbound.date)}_${formatTime(
              inbound.time
            )}_${formatRoute(
              inboundSegment.departure.iataCode,
              inboundSegment.arrival.iataCode
            )}`;
          productId = `${outboundKey}_${inboundKey}`;
          itemName = `Vé khứ hồi ${formatRoute(
            outboundSegment?.departure?.iataCode,
            outboundSegment?.arrival?.iataCode
          )} - ${formatRoute(
            inboundSegment.departure.iataCode,
            inboundSegment.arrival.iataCode
          )}`;
        } else if (inbound) {
          console.warn(
            "Thông tin chuyến inbound không đầy đủ, xử lý như oneway:",
            inbound
          );
        }

        // Lưu originalProductId vào metadata
        payloadToSave = {
          ...payloadToSave,
          metadata: {
            ...payloadToSave?.metadata,
            originalProductId: productId,
          },
        };
      }

      const items = [
        {
          itemId: productId ?? bookingKey ?? undefined,
          productId: productId ?? undefined,
          type: bookingType,
          name: itemName,
          sku: bookingData?.meta?.sku ?? undefined,
          quantity: 1,
          unitPrice: totalAmount,
          subtotal: totalAmount,
        },
      ];
      const correctedBookingData = { ...bookingData };
      if (
        correctedBookingData.flights?.inbound?.itineraries?.[0]?.segments?.[0]
      ) {
        const seg =
          correctedBookingData.flights.inbound.itineraries[0].segments[0];
        correctedBookingData.flights.inbound.route = `${seg.departure.iataCode} → ${seg.arrival.iataCode}`;
      }

      const bookingSnapshot = {
        ...(correctedBookingData || {}),
        details:
          payloadToSave && payloadToSave.details
            ? payloadToSave.details
            : bookingData?.details || {},
        pricing: {
          ...(bookingData?.pricing || {}),
          discount: Math.round(
            discountAmount || Number(bookingData?.pricing?.discount || 0)
          ),
          total: totalAmount,
        },
      };
      const discounts = [];
      if (discountAmount && discountAmount > 0) {
        discounts.push({
          code:
            (appliedPromoAuto && appliedPromoAuto.code) || promoCode || null,
          name:
            (appliedPromoAuto && appliedPromoAuto.title) ||
            promoCode ||
            "discount",
          amount: Math.round(discountAmount),
          promotionId: appliedPromoAuto._id || null, // Luôn dùng _id
        });
      }
      console.log(
        "Checkout debug: detailItemId=",
        detailItemId,
        "bookingKey=",
        bookingKey,
        "bookingData sample=",
        {
          meta: bookingData?.meta,
          id: bookingData?.id ?? bookingData?._id,
          details: bookingData?.details,
        }
      );
      const orderPayload = {
        customerName: contactInfo.fullName || "Khách hàng",
        customerEmail: contactInfo.email || "",
        customerPhone: contactInfo.phone || "",
        customerId: contactInfo.customerId || null,
        customerAddress: "",
        items,
        subtotal: Math.round(
          Number(normalizedPricing?.total ?? bookingData?.pricing?.total ?? 0)
        ),
        discounts: discounts,
        fees: [],
        tax: Math.round(tax),
        total: totalAmount,
        paymentMethod: selectedPayment,
        paymentStatus: "pending",
        orderStatus: "pending",
        pickupDropoff: bookingData.details?.pickupDropoff || "",
        metadata: {
          bookingKey: bookingKey || null,
          bookingDataSnapshot: bookingSnapshot,
          originalProductId: payloadToSave?.metadata?.originalProductId || null,
        },
      };

      const resp = await fetch(`${API_BASE}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      if (!resp.ok) {
        const txt = await resp.text().catch(() => "");
        console.error("Order creation failed:", resp.status, txt);
        alert("Không thể tạo đơn hàng. Vui lòng thử lại.");
        return;
      }
      createdOrder = await resp.json();
      console.log("Order created:", createdOrder);
    } catch (err) {
      console.error("Error creating order:", err);
      alert("Lỗi khi tạo đơn hàng. Vui lòng thử lại.");
      return;
    }

    const paymentLabel = `Thanh toán cho đơn ${createdOrder?.orderNumber || createdOrder?._id || ""
      }`;
    const paymentDescription = paymentLabel;

    try {
      if (selectedPayment === "vnpay") {
        const resp = await fetch(
          "http://localhost:8080/vnpay/create_payment_url",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              amount:
                createdOrder?.total ??
                finalTotal ??
                normalizedPricing?.total ??
                normalizedPricing?.estimatedTotal ??
                bookingData.pricing?.total ??
                50000,
              orderInfo: paymentDescription,
              orderId: createdOrder?.orderNumber || createdOrder?._id,
              ip: "127.0.0.1",
              returnUrl: `${API_BASE}/vnpay/check-payment?orderNumber=${encodeURIComponent(
                createdOrder?.orderNumber || createdOrder?._id
              )}`,
            }),
          }
        );
        if (!resp.ok) {
          const text = await resp.text();
          console.error("VNPay create-qr failed:", resp.status, text);
          alert("Không thể tạo thanh toán VNPay. (server trả lỗi)");
          return;
        }
        let data;
        const ct = resp.headers.get("content-type") || "";
        if (ct.includes("application/json")) data = await resp.json();
        else data = await resp.text();
        const url =
          (typeof data === "string" && data) ||
          (data && (data.paymentUrl || data.data || data.url));
        if (url) {
          window.location.href = url;
          return;
        }
        alert("Không thể tạo thanh toán VNPay. (data không hợp lệ)");
        return;
      }

      if (selectedPayment === "zalopay") {
        const resp = await fetch("http://localhost:8080/zalo/payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount:
              createdOrder?.total ??
              finalTotal ??
              normalizedPricing?.total ??
              normalizedPricing?.estimatedTotal ??
              bookingData.pricing?.total ??
              50000,
            description: paymentDescription,
            orderId: createdOrder?.orderNumber || createdOrder?._id,
            app_user: contactInfo.email || "guest",
            embed_data: {
              orderNumber: createdOrder?.orderNumber || createdOrder?._id,
            },
          }),
        });
        const data = await resp.json();
        if (data && data.return_code === 1 && data.order_url) {
          window.location.href = data.order_url;
          return;
        } else {
          alert(
            "Không thể tạo thanh toán ZaloPay: " +
            (data?.return_message || "Lỗi không xác định")
          );
        }
        return;
      }

      if (selectedPayment === "momo") {
        const resp = await fetch("http://localhost:8080/momo/payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: createdOrder?.orderNumber || createdOrder?._id,
            amount:
              createdOrder?.total ??
              finalTotal ??
              normalizedPricing?.total ??
              normalizedPricing?.estimatedTotal ??
              bookingData.pricing?.total ??
              50000,
            orderInfo: paymentDescription,
            orderDescription:
              bookingType === "flight"
                ? `${paymentDescription} - Vé máy bay`
                : bookingType === "bus"
                  ? `${paymentDescription} - Vé xe`
                  : `${paymentDescription} - Tour`,
          }),
        });
        const data = await resp.json();
        if (data && data.resultCode === 0 && (data.payUrl || data.shortLink)) {
          window.location.href = data.payUrl || data.shortLink;
          return;
        } else {
          alert(
            "Không thể tạo thanh toán MoMo: " +
            (data?.message || "Lỗi không xác định")
          );
        }
        return;
      }

      if (selectedPayment === "bank_transfer") {
        router.push(
          `/chuyen-khoan?orderNumber=${encodeURIComponent(
            createdOrder?.orderNumber || createdOrder?._id
          )}${bookingKey ? `&bookingKey=${encodeURIComponent(bookingKey)}` : ""
          }`
        );
        return;
      }

      if (createdOrder?.orderNumber) {
        router.push(
          `/thanh-toan-thanh-cong?orderNumber=${encodeURIComponent(
            createdOrder.orderNumber
          )}${bookingKey ? `&bookingKey=${encodeURIComponent(bookingKey)}` : ""
          }`
        );
      } else if (createdOrder?._id) {
        router.push(
          `/thanh-toan-thanh-cong?orderId=${encodeURIComponent(
            createdOrder._id
          )}${bookingKey ? `&bookingKey=${encodeURIComponent(bookingKey)}` : ""
          }`
        );
      } else {
        router.push("/thanh-toan-thanh-cong");
      }
    } catch (err) {
      console.error("Payment flow error:", err);
      alert("Lỗi khi chuyển tới cổng thanh toán. Vui lòng thử lại.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const steps = [
    {
      number: 1,
      title: "Thông tin",
      description: "Nhập thông tin liên hệ và hành khách",
    },
    {
      number: 2,
      title: "Thanh toán",
      description: "Chọn phương thức thanh toán",
    },
    {
      number: 3,
      title: "Xác nhận",
      description: "Kiểm tra và hoàn tất đặt chỗ",
    },
  ];

  // Thêm hành khách
  const handleAddPassenger = (type: "adult" | "child" | "infant") => {
    setPassengers((prev) => [
      ...prev,
      {
        type,
        title: type === "adult" ? "Mr" : "",
        firstName: "",
        lastName: "",
        dateOfBirth: "",
        nationality: "VN",
        idNumber: "",
        idType: "cccd",
      },
    ]);
  };
  // Xóa hành khách
  const handleRemovePassenger = (index: number) => {
    setPassengers((prev) => prev.filter((_, i) => i !== index));
  };
  // Cập nhật thông tin hành khách
  const handlePassengerChange = (index: number, field: string, value: any) => {
    setPassengers((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  };

  // If bookingData contains leadPassenger / contactInfo from details page, prefill local contact and passengers
  useEffect(() => {
    try {
      if (!bookingData) return;

      // Support bus flow: bookingData.details may contain passengerInfo / passengers (sent from chi-tiet)
      const details = bookingData.details ?? bookingData;
      if (details?.passengerInfo) {
        const pi = details.passengerInfo;
        setContactInfo((prev) => ({
          fullName: prev.fullName || pi.name || "",
          email: pi.email || prev.email,
          phone: pi.phone || prev.phone,
          customerId: prev.customerId || pi.customerId || null,
        }));
        if (
          Array.isArray(details.passengers) &&
          details.passengers.length > 0
        ) {
          setPassengers(
            details.passengers.map((x: any) => ({
              type: x.type ?? "adult",
              title: x.title ?? "Mr",
              firstName: x.firstName ?? x.name ?? "",
              lastName: x.lastName ?? "",
              dateOfBirth: x.dateOfBirth ?? "",
              nationality: x.nationality ?? "VN",
              idNumber: x.idNumber ?? "",
              idType: x.idType ?? "cccd",
            }))
          );
        }
        // prefill shuttle pickup if provided from chi-tiet page
        if (pi.shuttlePickup) setShuttlePickup(pi.shuttlePickup);
      }

      const bp = bookingData.passengers ?? bookingData.passenger ?? null;
      if (!bp) return;

      // lead passenger (from details page)
      const lead = bp.leadPassenger ?? bp.lead ?? null;
      const contactFromBooking =
        bp.contactInfo ?? bookingData.contactInfo ?? null;

      if (contactFromBooking) {
        setContactInfo((prev) => ({
          fullName:
            prev.fullName ||
            `${lead?.title ? lead.title + " " : ""}${lead?.firstName ?? ""} ${lead?.lastName ?? ""
              }`.trim(),
          email: contactFromBooking.email ?? prev.email,
          phone: contactFromBooking.phone ?? prev.phone,
          customerId: prev.customerId || (contactFromBooking as any).customerId || null,
        }));
        // bookingData.contactFromBooking may contain shuttle pickup (legacy)
        if ((contactFromBooking as any).shuttlePickup)
          setShuttlePickup((contactFromBooking as any).shuttlePickup);
      } else if (lead) {
        // if there's a lead but no explicit contactInfo, populate fullName
        setContactInfo((prev) => ({
          ...prev,
          fullName: `${lead?.title ? lead.title + " " : ""}${lead?.firstName ?? ""
            } ${lead?.lastName ?? ""}`.trim(),
        }));
      }

      // build passengers array: prefer explicit passenger list -> counts -> fallback to getInitialPassengers
      if (Array.isArray(bp.list) && bp.list.length > 0) {
        // some flows may provide a list of passengers directly
        setPassengers(
          bp.list.map((x: any) => ({
            type: x.type ?? "adult",
            title: x.title ?? "Mr",
            firstName: x.firstName ?? "",
            lastName: x.lastName ?? "",
            dateOfBirth: x.dateOfBirth ?? "",
            nationality: x.nationality ?? "VN",
            idNumber: x.idNumber ?? "",
            idType: x.idType ?? "cccd",
          }))
        );
      } else if (Array.isArray(bp.passengers) && bp.passengers.length > 0) {
        // alternative naming
        setPassengers(
          bp.passengers.map((x: any) => ({
            type: x.type ?? "adult",
            title: x.title ?? "Mr",
            firstName: x.firstName ?? "",
            lastName: x.lastName ?? "",
            dateOfBirth: x.dateOfBirth ?? "",
            nationality: x.nationality ?? "VN",
            idNumber: x.idNumber ?? "",
            idType: x.idType ?? "cccd",
          }))
        );
      } else {
        const counts = bp.counts ?? { adults: 1, children: 0, infants: 0 };
        const arr: any[] = [];
        for (let i = 0; i < (counts.adults || 0); i++) {
          arr.push({
            type: "adult",
            title: "Mr",
            firstName: "",
            lastName: "",
            dateOfBirth: "",
            nationality: "VN",
            idNumber: "",
            idType: "cccd",
          });
        }
        for (let i = 0; i < (counts.children || 0); i++) {
          arr.push({
            type: "child",
            title: "",
            firstName: "",
            lastName: "",
            dateOfBirth: "",
            nationality: "VN",
            idNumber: "",
            idType: "cccd",
          });
        }
        for (let i = 0; i < (counts.infants || 0); i++) {
          arr.push({
            type: "infant",
            title: "",
            firstName: "",
            lastName: "",
            dateOfBirth: "",
            nationality: "VN",
            idNumber: "",
            idType: "cccd",
          });
        }
        // map lead onto first slot if available
        if (lead && arr.length > 0) {
          arr[0] = {
            ...arr[0],
            title: lead.title ?? arr[0].title,
            firstName: lead.firstName ?? arr[0].firstName,
            lastName: lead.lastName ?? arr[0].lastName,
            dateOfBirth: lead.dateOfBirth ?? arr[0].dateOfBirth,
            nationality: lead.nationality ?? arr[0].nationality,
            idNumber: lead.idNumber ?? arr[0].idNumber,
            idType: lead.idType ?? arr[0].idType,
          };
        }
        setPassengers(arr);
      }
    } catch (e) {
      /* ignore */
    }
  }, [bookingData]);

  // airport lookup map loaded from public/airport.json (client-side)
  const [airportsMap, setAirportsMap] = useState<Record<string, any> | null>(
    null
  );
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await fetch("/airport.json");
        if (!r.ok) return;
        const j = await r.json();
        // build lookup by IATA code for quick access (some JSON keys are ICAO)
        const byIata: Record<string, any> = {};
        Object.values(j || {}).forEach((entry: any) => {
          const iata = entry?.iata;
          if (iata && String(iata).trim())
            byIata[String(iata).toUpperCase()] = entry;
        });
        // also merge any direct iata -> entry if JSON already keyed by iata
        if (typeof j === "object") {
          Object.entries(j).forEach(([k, v]: any) => {
            const maybeIata = v && v.iata ? String(v.iata).toUpperCase() : null;
            if (maybeIata) byIata[maybeIata] = v;
          });
        }
        if (mounted) setAirportsMap(byIata);
      } catch (e) {
        /* ignore */
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const getAirportLabel = (
    iata: string | undefined | null,
    fallbackCity?: any
  ) => {
    if (!iata) return fallbackCity || "";
    const code = String(iata).toUpperCase();
    const entry = (airportsMap as any)?.[code] ?? null;
    // prefer nice city name, then state, then fallbackCity, finally iata
    if (entry) return entry.city || entry.state || fallbackCity || code;
    // some sources send IATA in city field (like "DAD"), detect and try map too
    if (
      (fallbackCity ?? "").length === 3 &&
      (airportsMap as any)?.[fallbackCity?.toUpperCase()]
    ) {
      const e2 = (airportsMap as any)[fallbackCity!.toUpperCase()];
      return e2.city || e2.state || code;
    }
    return fallbackCity || code;
  };
  return (
    <>
      {/* Breadcrumb */}
      <div className="border-b">
        <div className="container py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link prefetch={false} href="/" className="hover:text-primary">
              Trang chủ
            </Link>
            <span>/</span>
            <Link
              prefetch={false}
              href="/ve-may-bay"
              className="hover:text-primary"
            >
              Vé máy bay
            </Link>
            <span>/</span>
            <span>Thanh toán</span>
          </div>
        </div>
      </div>

      <div className="container py-6">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4 md:space-x-8">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${currentStep >= step.number
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-gray-300 text-gray-400"
                      }`}
                  >
                    {currentStep > step.number ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      step.number
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <div
                      className={`text-sm font-medium ${currentStep >= step.number
                        ? "text-primary"
                        : "text-gray-400"
                        }`}
                    >
                      {step.title}
                    </div>
                    <div className="text-xs text-muted-foreground hidden md:block">
                      {step.description}
                    </div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-12 md:w-20 h-0.5 mx-4 ${currentStep > step.number ? "bg-primary" : "bg-gray-300"
                      }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1">
            {/* Step 1: Contact & Passenger Info */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Thông tin liên hệ</CardTitle>
                    <p className="text-muted-foreground">
                      Thông tin này sẽ được sử dụng để gửi vé và xác nhận đặt
                      chỗ
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="fullName">Họ và tên *</Label>
                        <Input
                          id="fullName"
                          value={contactInfo.fullName}
                          onChange={(e) =>
                            setContactInfo((prev) => ({
                              ...prev,
                              fullName: e.target.value,
                            }))
                          }
                          placeholder="Nhập họ và tên"
                        />
                        {errors["contact.fullName"] && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors["contact.fullName"]}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="phone">Số điện thoại *</Label>
                        <Input
                          id="phone"
                          value={contactInfo.phone}
                          onChange={(e) =>
                            setContactInfo((prev) => ({
                              ...prev,
                              phone: e.target.value,
                            }))
                          }
                          placeholder="0912345678"
                        />
                        {errors["contact.phone"] && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors["contact.phone"]}
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={contactInfo.email}
                        onChange={(e) =>
                          setContactInfo((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        placeholder="email@example.com"
                      />
                      {errors["contact.email"] && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors["contact.email"]}
                        </p>
                      )}
                    </div>
                    {/* Shuttle pickup (bus only) */}
                    {false && mounted && bookingType === "bus" && (
                      <div className="md:col-span-2">
                        <Label htmlFor="shuttlePickup">
                          Điểm đón trung chuyển (nếu xa bến)
                        </Label>
                        <Input
                          id="shuttlePickup"
                          value={shuttlePickup}
                          onChange={(e) => setShuttlePickup(e.target.value)}
                          placeholder="Ví dụ: Số nhà, tên đường, khu vực (tùy chọn)"
                        />
                        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                          Nếu bạn muốn xe trung chuyển đón ở địa chỉ riêng, nhập
                          ở đây.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Thông tin hành khách</CardTitle>
                    <p className="text-muted-foreground">
                      Vui lòng điền chính xác theo giấy tờ tùy thân
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Danh sách form hành khách */}
                    {passengers.map((p, idx) => (
                      <div
                        key={idx}
                        className="border rounded-lg p-4 mb-2 relative"
                      >
                        {/* ...existing code... */}
                        <div className="mb-2">
                          <Badge
                            variant={
                              p.type === "adult"
                                ? "secondary"
                                : p.type === "child"
                                  ? "outline"
                                  : "destructive"
                            }
                          >
                            {p.type === "adult"
                              ? "Người lớn"
                              : p.type === "child"
                                ? "Trẻ em (5-11 tuổi)"
                                : "Em bé (≤4 tuổi)"}
                          </Badge>
                        </div>
                        {p.type === "adult" ? (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <Label>Danh xưng</Label>
                              <Select
                                value={p.title}
                                onValueChange={(value) =>
                                  handlePassengerChange(idx, "title", value)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Mr">Ông</SelectItem>
                                  <SelectItem value="Mrs">Bà</SelectItem>
                                  <SelectItem value="Ms">Cô</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Họ và tên đệm *</Label>
                              <Input
                                value={p.firstName}
                                onChange={(e) =>
                                  handlePassengerChange(
                                    idx,
                                    "firstName",
                                    e.target.value
                                  )
                                }
                                placeholder="VD: NGUYEN VAN"
                              />
                              {errors[`passenger.${idx}.firstName`] && (
                                <p className="text-red-500 text-xs mt-1">
                                  {errors[`passenger.${idx}.firstName`]}
                                </p>
                              )}
                            </div>
                            <div>
                              <Label>Tên *</Label>
                              <Input
                                value={p.lastName}
                                onChange={(e) =>
                                  handlePassengerChange(
                                    idx,
                                    "lastName",
                                    e.target.value
                                  )
                                }
                                placeholder="VD: AN"
                              />
                              {errors[`passenger.${idx}.lastName`] && (
                                <p className="text-red-500 text-xs mt-1">
                                  {errors[`passenger.${idx}.lastName`]}
                                </p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>Họ và tên đệm *</Label>
                              <Input
                                value={p.firstName}
                                onChange={(e) =>
                                  handlePassengerChange(
                                    idx,
                                    "firstName",
                                    e.target.value
                                  )
                                }
                                placeholder="VD: NGUYEN VAN"
                              />
                              {errors[`passenger.${idx}.firstName`] && (
                                <p className="text-red-500 text-xs mt-1">
                                  {errors[`passenger.${idx}.firstName`]}
                                </p>
                              )}
                            </div>
                            <div>
                              <Label>Tên *</Label>
                              <Input
                                value={p.lastName}
                                onChange={(e) =>
                                  handlePassengerChange(
                                    idx,
                                    "lastName",
                                    e.target.value
                                  )
                                }
                                placeholder="VD: AN"
                              />
                              {errors[`passenger.${idx}.lastName`] && (
                                <p className="text-red-500 text-xs mt-1">
                                  {errors[`passenger.${idx}.lastName`]}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                          <div>
                            <Label>Ngày sinh *</Label>
                            <Input
                              type="date"
                              value={p.dateOfBirth}
                              onChange={(e) =>
                                handlePassengerChange(
                                  idx,
                                  "dateOfBirth",
                                  e.target.value
                                )
                              }
                            />
                            {errors[`passenger.${idx}.dateOfBirth`] && (
                              <p className="text-red-500 text-xs mt-1">
                                {errors[`passenger.${idx}.dateOfBirth`]}
                              </p>
                            )}
                          </div>
                          <div>
                            <Label>Quốc tịch</Label>
                            <Select
                              value={p.nationality}
                              onValueChange={(value) =>
                                handlePassengerChange(idx, "nationality", value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="VN">Việt Nam</SelectItem>
                                <SelectItem value="US">Hoa Kỳ</SelectItem>
                                <SelectItem value="GB">Anh</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                          <div>
                            <Label>Loại giấy tờ</Label>
                            <Select
                              value={p.idType}
                              onValueChange={(value) =>
                                handlePassengerChange(idx, "idType", value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="cccd">CCCD</SelectItem>
                                <SelectItem value="cmnd">CMND</SelectItem>
                                <SelectItem value="passport">
                                  Hộ chiếu
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>
                              Số giấy tờ{" "}
                              {p.type === "adult" ? "*" : "(tùy chọn)"}
                            </Label>
                            <Input
                              value={p.idNumber}
                              onChange={(e) =>
                                handlePassengerChange(
                                  idx,
                                  "idNumber",
                                  e.target.value
                                )
                              }
                              placeholder={
                                p.type === "adult"
                                  ? "Nhập số CCCD/CMND/Hộ chiếu"
                                  : "Nhập nếu có"
                              }
                            />
                            {errors[`passenger.${idx}.idNumber`] && (
                              <p className="text-red-500 text-xs mt-1">
                                {errors[`passenger.${idx}.idNumber`]}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {/* Nút thêm hành khách */}
                    {/* <div className="flex gap-2 mt-2">
                                            <Button variant="outline" size="sm" onClick={() => handleAddPassenger('adult')}>+ Người lớn</Button>
                                            <Button variant="outline" size="sm" onClick={() => handleAddPassenger('child')}>+ Trẻ em</Button>
                                            <Button variant="outline" size="sm" onClick={() => handleAddPassenger('infant')}>+ Em bé</Button>
                                        </div> */}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Step 2: Payment Method */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Phương thức thanh toán</CardTitle>
                    <p className="text-muted-foreground">
                      Chọn phương thức thanh toán phù hợp với bạn
                    </p>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup
                      value={selectedPayment}
                      onValueChange={setSelectedPayment}
                    >
                      <div className="space-y-3">
                        {paymentMethods.map((method) => (
                          <div
                            key={method.id}
                            className={`border rounded-lg p-4 cursor-pointer transition-colors ${selectedPayment === method.id
                              ? "border-primary bg-primary/5"
                              : "hover:bg-gray-50"
                              }`}
                            onClick={() => setSelectedPayment(method.id)}
                          >
                            <div className="flex items-center space-x-3">
                              <RadioGroupItem
                                value={method.id}
                                id={method.id}
                              />
                              <method.icon className="h-5 w-5" />
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <Label
                                    htmlFor={method.id}
                                    className="font-medium cursor-pointer"
                                  >
                                    {method.name}
                                  </Label>
                                  <div className="flex items-center gap-2">
                                    {method.instant && (
                                      <Badge
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        Tức thì
                                      </Badge>
                                    )}
                                    {method.fee === 0 && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        Miễn phí
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {method.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>

                    {/* Credit Card Form */}
                    {selectedPayment === "credit_card" && (
                      <div className="mt-6 p-4 border rounded-lg bg-gray-50">
                        <h4 className="font-medium mb-4">Thông tin thẻ</h4>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="cardNumber">Số thẻ *</Label>
                            <Input
                              id="cardNumber"
                              value={paymentInfo.cardNumber}
                              onChange={(e) =>
                                setPaymentInfo((prev) => ({
                                  ...prev,
                                  cardNumber: e.target.value,
                                }))
                              }
                              placeholder="1234 5678 9012 3456"
                            />
                            {errors["payment.cardNumber"] && (
                              <p className="text-red-500 text-xs mt-1">
                                {errors["payment.cardNumber"]}
                              </p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor="cardHolder">Tên chủ thẻ *</Label>
                            <Input
                              id="cardHolder"
                              value={paymentInfo.cardHolder}
                              onChange={(e) =>
                                setPaymentInfo((prev) => ({
                                  ...prev,
                                  cardHolder: e.target.value,
                                }))
                              }
                              placeholder="NGUYEN VAN A"
                            />
                            {errors["payment.cardHolder"] && (
                              <p className="text-red-500 text-xs mt-1">
                                {errors["payment.cardHolder"]}
                              </p>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="expiryDate">Ngày hết hạn *</Label>
                              <Input
                                id="expiryDate"
                                value={paymentInfo.expiryDate}
                                onChange={(e) =>
                                  setPaymentInfo((prev) => ({
                                    ...prev,
                                    expiryDate: e.target.value,
                                  }))
                                }
                                placeholder="MM/YY"
                              />
                              {errors["payment.expiryDate"] && (
                                <p className="text-red-500 text-xs mt-1">
                                  {errors["payment.expiryDate"]}
                                </p>
                              )}
                            </div>
                            <div>
                              <Label htmlFor="cvv">CVV *</Label>
                              <Input
                                id="cvv"
                                value={paymentInfo.cvv}
                                onChange={(e) =>
                                  setPaymentInfo((prev) => ({
                                    ...prev,
                                    cvv: e.target.value,
                                  }))
                                }
                                placeholder="123"
                              />
                              {errors["payment.cvv"] && (
                                <p className="text-red-500 text-xs mt-1">
                                  {errors["payment.cvv"]}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Invoice Option */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="needInvoice"
                        checked={needInvoice}
                        onCheckedChange={(checked) => setNeedInvoice(!!checked)}
                      />
                      <div className="flex-1">
                        <Label
                          htmlFor="needInvoice"
                          className="font-medium cursor-pointer"
                        >
                          Xuất hóa đơn công ty
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Hóa đơn VAT sẽ được gửi qua email trong vòng 24h
                        </p>
                      </div>
                    </div>

                    {needInvoice && (
                      <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="companyName">Tên công ty *</Label>
                              <Input
                                id="companyName"
                                value={invoiceInfo.companyName}
                                onChange={(e) =>
                                  setInvoiceInfo((prev) => ({
                                    ...prev,
                                    companyName: e.target.value,
                                  }))
                                }
                                placeholder="Công ty TNHH ABC"
                              />
                              {errors["invoice.companyName"] && (
                                <p className="text-red-500 text-xs mt-1">
                                  {errors["invoice.companyName"]}
                                </p>
                              )}
                            </div>
                            <div>
                              <Label htmlFor="taxCode">Mã số thuế *</Label>
                              <Input
                                id="taxCode"
                                value={invoiceInfo.taxCode}
                                onChange={(e) =>
                                  setInvoiceInfo((prev) => ({
                                    ...prev,
                                    taxCode: e.target.value,
                                  }))
                                }
                                placeholder="0123456789"
                              />
                              {errors["invoice.taxCode"] && (
                                <p className="text-red-500 text-xs mt-1">
                                  {errors["invoice.taxCode"]}
                                </p>
                              )}
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="companyAddress">
                              Địa chỉ công ty *
                            </Label>
                            <Input
                              id="companyAddress"
                              value={invoiceInfo.address}
                              onChange={(e) =>
                                setInvoiceInfo((prev) => ({
                                  ...prev,
                                  address: e.target.value,
                                }))
                              }
                              placeholder="Địa chỉ trụ sở chính"
                            />
                            {errors["invoice.address"] && (
                              <p className="text-red-500 text-xs mt-1">
                                {errors["invoice.address"]}
                              </p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor="invoiceEmail">
                              Email nhận hóa đơn *
                            </Label>
                            <Input
                              id="invoiceEmail"
                              type="email"
                              value={invoiceInfo.email}
                              onChange={(e) =>
                                setInvoiceInfo((prev) => ({
                                  ...prev,
                                  email: e.target.value,
                                }))
                              }
                              placeholder="ketoan@company.com"
                            />
                            {errors["invoice.email"] && (
                              <p className="text-red-500 text-xs mt-1">
                                {errors["invoice.email"]}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Step 3: Confirmation */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Xác nhận thông tin</CardTitle>
                    <p className="text-muted-foreground">
                      Vui lòng kiểm tra lại thông tin trước khi thanh toán
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Contact Info Review */}
                    <div>
                      <h4 className="font-medium mb-2">Thông tin liên hệ</h4>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>Họ tên: {contactInfo.fullName}</div>
                        <div>Email: {contactInfo.email}</div>
                        <div>Điện thoại: {contactInfo.phone}</div>
                      </div>
                    </div>

                    <Separator />

                    {/* Passenger Info Review */}
                    <div>
                      <h4 className="font-medium mb-2">Thông tin hành khách</h4>
                      <div className="text-sm text-muted-foreground space-y-1">
                        {passengers.map((p, idx) => (
                          <div key={idx}>
                            <div>
                              Tên: {p.title} {p.firstName} {p.lastName}
                            </div>
                            <div>Ngày sinh: {p.dateOfBirth}</div>
                            <div>
                              Giấy tờ: {p.idType.toUpperCase()} - {p.idNumber}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Payment Method Review */}
                    <div>
                      <h4 className="font-medium mb-2">
                        Phương thức thanh toán
                      </h4>
                      <div className="text-sm text-muted-foreground">
                        {
                          paymentMethods.find((m) => m.id === selectedPayment)
                            ?.name
                        }
                      </div>
                    </div>

                    <Separator />

                    {/* Terms and Conditions */}
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="agreeTerms"
                          checked={agreeTerms}
                          onCheckedChange={(checked) =>
                            setAgreeTerms(!!checked)
                          }
                        />
                        <div className="flex-1">
                          <Label htmlFor="agreeTerms" className="text-sm">
                            Tôi đã đọc và đồng ý với{" "}
                            <button
                              type="button"
                              className="text-primary underline hover:text-primary/80 transition-colors p-0 m-0 inline"
                              onClick={() => setTermsModalOpen(true)}
                            >
                              Điều khoản sử dụng và Chính sách bảo mật
                            </button>
                          </Label>
                        </div>


                      </div>

                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                          <div className="text-sm">
                            <div className="font-medium text-amber-800 mb-1">
                              Lưu ý quan trọng:
                            </div>
                            <ul className="text-amber-700 space-y-1">
                              <li>
                                • Vui lòng kiểm tra kỹ thông tin trước khi thanh
                                toán
                              </li>
                              <li>
                                • Vé điện tử sẽ được gửi qua email sau khi thanh
                                toán thành công
                              </li>
                              <li>
                                • Mọi thay đổi sau khi đặt vé có thể phát sinh
                                phí
                              </li>
                              
                                <strong>Lưu ý: Vui lòng thanh toán bằng tài khoản cá nhân bạn sử dụng cố định, để thuận tiện cho việc hoàn tiền, hủy tour và thanh toán bổ sung khi đổi lịch.</strong>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>


                  </CardContent>
                </Card>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6">
              <Button variant="outline" onClick={handlePrevStep}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Quay lại
              </Button>

              {currentStep < 3 ? (
                <Button onClick={handleNextStep}>Tiếp tục</Button>
              ) : (
                <Button
                  onClick={handlePayment}
                  disabled={!agreeTerms || isProcessingPayment}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {/* <Lock className="h-4 w-4 mr-2" /> */}
                  {isProcessingPayment ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Lock className="h-4 w-4 mr-2" />
                  )}
                  {isProcessingPayment ? "Đang xử lý..." : "Thanh toán ngay"}
                </Button>
              )}
            </div>
          </div>

          {/* Sidebar - Order Summary */}
          <div className="lg:w-96">
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle>Tóm tắt đơn hàng</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Booking Details - Hiển thị theo loại booking (dùng normalizedDetails cho an toàn).
                                    Delay rendering until mounted so server/client initial markup matches and avoids hydration errors */}
                {mounted && bookingType === "flight" && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Plane className="h-4 w-4 text-primary" />
                      <span className="font-medium">Vé máy bay</span>
                    </div>
                  </div>
                )}
                {mounted && bookingType === "bus" && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-primary" />
                      <span className="font-medium">Vé xe du lịch</span>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div className="flex justify-between">
                        <span>Tuyến xe:</span>
                        <span>{normalizedDetails.route ?? "---"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ngày đi:</span>
                        <span>{normalizedDetails.date ?? "---"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Giờ xuất phát:</span>
                        <span>{normalizedDetails.time ?? "---"}</span>
                      </div>
                      {/* <div className="flex justify-between">
                                                <span>Hành khách:</span>
                                                <span>{passengers.length} người</span>
                                            </div> */}
                    </div>
                  </div>
                )}
                {mounted && bookingType === "tour" && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="font-medium">Đặt tour</span>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div className="flex justify-between">
                        <span>Mã tour:</span>
                        <span className="font-medium">
                          {normalizedDetails.tourCode ?? bookingData?.id ?? "—"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ngày giờ khởi hành:</span>
                        <span>
                          {normalizedDetails.startDateTime
                            ? new Date(
                              normalizedDetails.startDateTime
                            ).toLocaleString("vi-VN")
                            : normalizedDetails.date
                              ? `${normalizedDetails.date} ${normalizedDetails.time ?? ""
                              }`
                              : "---"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ngày giờ kết thúc:</span>
                        <span>
                          {normalizedDetails.endDateTime
                            ? new Date(
                              normalizedDetails.endDateTime
                            ).toLocaleString("vi-VN")
                            : "---"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tên tour:</span>
                        <span>{normalizedDetails.route ?? "---"}</span>
                      </div>
                    </div>
                  </div>
                )}
                <Separator />
                {/* Pricing Breakdown (dùng normalizedPricing để hiện đúng các giá trị từ booking payload) */}
                {/* Pricing: hỗ trợ nhiều shape của payload -> lấy trường phù hợp nhất từ payload (ghi nhận tất cả) */}
                {mounted ? (
                  (() => {
                    const p = normalizedPricing || {};
                    // BUS breakdown (new)
                    if (bookingType === "bus") {
                      // derive counts: prefer explicit counts in bookingData, then URL params, then local passengers array
                      const counts = {
                        adults:
                          Number(searchParams.get("adults")) ||
                          (bookingData?.passengers?.counts?.adults ?? 0) ||
                          passengers.filter((x: any) => x.type === "adult")
                            .length,
                        children:
                          Number(searchParams.get("children")) ||
                          (bookingData?.passengers?.counts?.children ?? 0) ||
                          passengers.filter((x: any) => x.type === "child")
                            .length,
                        infants:
                          Number(searchParams.get("infants")) ||
                          (bookingData?.passengers?.counts?.infants ?? 0) ||
                          passengers.filter((x: any) => x.type === "infant")
                            .length,
                      };

                      // per-pax units: prefer explicit perPax or perPax.* fields, otherwise try to infer from basePrice
                      const basePriceTotal = Number(
                        p.basePrice ?? p.total ?? 0
                      );
                      let adultUnit = Number(
                        p.perPax?.adultUnit ?? p.adultUnit ?? p.unitAdult ?? 0
                      );
                      let childUnit = Number(
                        p.perPax?.childUnit ?? p.childUnit ?? p.unitChild ?? 0
                      );
                      let infantUnit = Number(
                        p.perPax?.infantUnit ?? p.infantUnit ?? 0
                      );

                      if (!adultUnit) {
                        // try infer adultUnit given basePriceTotal and counts (assume child pays 0.75 of adult)
                        const denom = Math.max(
                          1,
                          counts.adults + counts.children * 0.75
                        );
                        adultUnit = Math.round(basePriceTotal / denom) || 0;
                      }
                      if (!childUnit) childUnit = Math.round(adultUnit * 0.75);
                      if (!infantUnit) infantUnit = 0; // infants free per UX requirement

                      const adultTotal = counts.adults * adultUnit;
                      const childTotal = counts.children * childUnit;
                      const infantTotal = counts.infants * infantUnit; // likely 0

                      const addOnsTotal = Number(
                        p.addOnsTotal ?? p.addOnsAmount ?? 0
                      );
                      const taxes = Number(
                        p.taxes ??
                        Math.round(
                          (adultTotal + childTotal + infantTotal) * 0.08
                        )
                      );
                      const discount = Number(p.discount ?? 0);
                      const computedTotal =
                        adultTotal +
                        childTotal +
                        infantTotal +
                        addOnsTotal +
                        taxes -
                        discount;
                      // seats list (display as simple comma-separated list)
                      const seatsList: string[] = Array.isArray(p.seats)
                        ? p.seats.map((s: any) => s?.number ?? String(s))
                        : Array.isArray(bookingData?.details?.seats)
                          ? bookingData.details.seats
                          : [];

                      return (
                        <>
                          <div className="mb-2 text-sm">
                            <div className="flex justify-between">
                              <span>Hành khách</span>
                              <span>
                                {counts.adults +
                                  counts.children +
                                  counts.infants}{" "}
                                người
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {counts.adults > 0 && (
                                <span>Người lớn: {counts.adults} </span>
                              )}
                              {counts.children > 0 && (
                                <span>• Trẻ em: {counts.children} </span>
                              )}
                              {counts.infants > 0 && (
                                <span>• Em bé: {counts.infants}</span>
                              )}
                            </div>
                            {/* Chỗ ngồi: hiển thị ngay dưới Hành khách */}
                            <div className="mt-2 text-sm flex justify-between">
                              <div className="text-xs text-muted-foreground">
                                Chỗ ngồi
                              </div>
                              <div className="font-medium">
                                {seatsList && seatsList.length
                                  ? seatsList.join(", ")
                                  : "Chưa chọn"}
                              </div>
                            </div>
                          </div>
                          <div className="mt-2 space-y-2 text-sm">
                            {counts.adults > 0 && (
                              <div className="flex justify-between">
                                <span>
                                  Người lớn ({counts.adults} ×{" "}
                                  {formatPrice(adultUnit)})
                                </span>
                                <span>{formatPrice(adultTotal)}</span>
                              </div>
                            )}
                            {counts.children > 0 && (
                              <div className="flex justify-between">
                                <span>
                                  Trẻ em ({counts.children} ×{" "}
                                  {formatPrice(childUnit)})
                                </span>
                                <span>{formatPrice(childTotal)}</span>
                              </div>
                            )}
                            {counts.infants > 0 && (
                              <div className="flex justify-between">
                                <span>Em bé ({counts.infants})</span>
                                <span>{formatPrice(infantTotal)}</span>
                              </div>
                            )}
                          </div>
                          <Separator />
                          <div
                            className="flex items-center justify-between text-sm cursor-pointer mt-2"
                            onClick={() => setShowAddonsDetails((prev) => ({ outbound: !prev.outbound, inbound: !prev.inbound }))}
                          >
                            <div className="font-semibold text-base">
                              {" "}
                              Tổng tiền dịch vụ{" "}
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="font-semibold text-base text-[hsl(var(--primary))]">
                                {formatPrice(addOnsTotal)}
                              </span>
                              <ChevronDown
                                className={`h-4 w-4 transition-transform ${showAddonsDetails ? "rotate-180" : ""
                                  }`}
                              />
                            </div>
                          </div>
                          {showAddonsDetails && (
                            <div className="mt-2 mb-2 p-2 bg-gray-50 rounded-md text-sm">
                              {Array.isArray(p.addOns) && p.addOns.length ? (
                                <div className="space-y-2">
                                  {p.addOns.map((a: any, idx: number) => (
                                    <div
                                      key={idx}
                                      className="flex justify-between"
                                    >
                                      <div>
                                        {a.name}
                                        {a.qty && a.qty > 1 ? ` ×${a.qty}` : ""}
                                      </div>
                                      <div>
                                        {formatPrice(
                                          Number(
                                            a.total ??
                                            Number(a.qty ?? 1) *
                                            Number(
                                              a.unitPrice ?? a.price ?? 0
                                            )
                                          )
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                  <div className="flex justify-between font-medium pt-2 border-t">
                                    <div>Tổng dịch vụ</div>
                                    <div>{formatPrice(addOnsTotal)}</div>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-muted-foreground">
                                  Không có thông tin dịch vụ thêm
                                </div>
                              )}
                            </div>
                          )}
                          <div className="flex justify-between text-sm mt-2">
                            <span>Thuế & phí</span>
                            <span>{formatPrice(taxes)}</span>
                          </div>
                          <div className="flex justify-between text-sm text-green-600">
                            <span>Giảm giá</span>
                            <span>
                              {formatPrice(
                                Number(discountAmount || discount || 0)
                              )}
                            </span>
                          </div>{" "}
                          {/* Fare subtotal (tổng giá vé trước thuế & dịch vụ) */}
                          <div className="flex justify-between font-medium mt-2">
                            <span>Tổng giá vé</span>
                            <span>
                              {formatPrice(
                                adultTotal + childTotal + infantTotal
                              )}
                            </span>
                          </div>
                          <Separator />
                          <div className="flex justify-between font-bold text-lg">
                            <span>Tổng cộng</span>
                            <span className="text-primary">
                              {formatPrice(
                                Math.max(
                                  0,
                                  Math.round(
                                    Number(computedTotal) -
                                    (discountAmount || 0)
                                  )
                                )
                              )}
                            </span>
                          </div>
                        </>
                      );
                    }
                    if (bookingType === "tour") {
                      // derive counts: prefer bookingData.passengers.counts -> pricing.breakdown -> local passengers
                      const counts =
                        bookingData?.passengers?.counts ??
                        (() => {
                          const bd =
                            p.breakdown ?? bookingData?.pricing?.breakdown;
                          if (Array.isArray(bd)) {
                            return bd.reduce(
                              (acc: any, it: any) => {
                                if (it.type === "adult")
                                  acc.adults += Number(it.qty || 0);
                                if (it.type === "child")
                                  acc.children += Number(it.qty || 0);
                                if (it.type === "infant")
                                  acc.infants += Number(it.qty || 0);
                                return acc;
                              },
                              { adults: 0, children: 0, infants: 0 }
                            );
                          }
                          // fallback to local passengers array
                          return passengers.reduce(
                            (acc: any, it: any) => {
                              if (it.type === "adult") acc.adults += 1;
                              if (it.type === "child") acc.children += 1;
                              if (it.type === "infant") acc.infants += 1;
                              return acc;
                            },
                            { adults: 0, children: 0, infants: 0 }
                          );
                        })();

                      const unitAdult = Number(
                        p.perPax?.adultUnit ??
                        p.adultUnit ??
                        p.unitAdult ??
                        bookingData?.pricing?.unitAdult ??
                        0
                      );
                      const unitChild = Number(
                        p.perPax?.childUnit ??
                        p.childUnit ??
                        p.unitChild ??
                        bookingData?.pricing?.unitChild ??
                        0
                      );
                      const unitInfant = Number(
                        p.perPax?.infantUnit ??
                        p.infantUnit ??
                        p.unitInfant ??
                        bookingData?.pricing?.unitInfant ??
                        0
                      );

                      const adultTotal = counts.adults * unitAdult;
                      const childTotal = counts.children * unitChild;
                      const infantTotal = counts.infants * unitInfant;
                      const seatsTotal = Number(p.seatsTotal ?? 0);

                      const addOnsArr = Array.isArray(p.addOns) ? p.addOns : [];
                      // normalizedPricing.addOnsTotal already avoids double counting; use it directly
                      const addOnsTotal = Number(p.addOnsTotal ?? 0);

                      // taxes: prefer explicit, otherwise compute demo 8% on fares
                      const taxes = Number(
                        p.taxes ??
                        p.taxesTotal ??
                        Math.round(
                          (adultTotal + childTotal + infantTotal) * 0.08
                        )
                      );
                      const discount = Number(p.discount ?? 0);
                      const computedTotal =
                        adultTotal +
                        childTotal +
                        infantTotal +
                        addOnsTotal +
                        seatsTotal +
                        taxes -
                        discount;
                      const preDiscount =
                        adultTotal +
                        childTotal +
                        infantTotal +
                        addOnsTotal +
                        seatsTotal +
                        taxes;

                      return (
                        <>
                          <div className="mb-2 text-sm">
                            <div className="flex justify-between">
                              <span>Hành khách</span>
                              <span>
                                {counts.adults +
                                  counts.children +
                                  counts.infants}{" "}
                                người
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {counts.adults > 0 && (
                                <span>Người lớn: {counts.adults} </span>
                              )}
                              {counts.children > 0 && (
                                <span>• Trẻ em: {counts.children} </span>
                              )}
                              {counts.infants > 0 && (
                                <span>• Em bé: {counts.infants}</span>
                              )}
                            </div>
                          </div>

                          <div className="mt-2 space-y-2 text-sm">
                            {counts.adults > 0 && (
                              <div className="flex justify-between">
                                <span>
                                  Người lớn ({counts.adults} ×{" "}
                                  {formatPrice(unitAdult)})
                                </span>
                                <span>{formatPrice(adultTotal)}</span>
                              </div>
                            )}
                            {counts.children > 0 && (
                              <div className="flex justify-between">
                                <span>
                                  Trẻ em ({counts.children} ×{" "}
                                  {formatPrice(unitChild)})
                                </span>
                                <span>{formatPrice(childTotal)}</span>
                              </div>
                            )}
                            {counts.infants > 0 && (
                              <div className="flex justify-between">
                                <span>
                                  Em bé ({counts.infants} ×{" "}
                                  {formatPrice(unitInfant)})
                                </span>
                                <span>{formatPrice(infantTotal)}</span>
                              </div>
                            )}
                          </div>

                          <Separator />

                          <div
                            className="flex items-center justify-between text-sm cursor-pointer mt-2"
                            onClick={() =>
                              setShowAddonsDetails((prev) => ({ outbound: !prev.outbound, inbound: !prev.inbound }))
                            }
                          >
                            <div className="font-semibold text-base">
                              {" "}
                              Tổng tiền dịch vụ{" "}
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="font-semibold text-base text-[hsl(var(--primary))]">
                                {formatPrice(addOnsTotal)}
                              </span>
                              <ChevronDown
                                className={`h-4 w-4 transition-transform ${showAddonsDetails ? "rotate-180" : ""
                                  }`}
                              />
                            </div>
                          </div>

                          {showAddonsDetails && (
                            <div className="mt-2 mb-2 p-2 bg-gray-50 rounded-md text-sm">
                              {addOnsArr.length > 0 ? (
                                <div className="space-y-2">
                                  {addOnsArr.map((a: any, idx: number) => (
                                    <div
                                      key={idx}
                                      className="flex justify-between"
                                    >
                                      <div>
                                        {a.name}
                                        {a.qty && a.qty > 1 ? ` ×${a.qty}` : ""}
                                      </div>
                                      <div>
                                        {formatPrice(
                                          Number(
                                            a.total ??
                                            Number(a.qty ?? 1) *
                                            Number(
                                              a.unitPrice ?? a.price ?? 0
                                            )
                                          )
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                  <div className="flex justify-between font-medium pt-2 border-t">
                                    <div>Tổng dịch vụ</div>
                                    <div>{formatPrice(addOnsTotal)}</div>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-muted-foreground">
                                  Không có thông tin dịch vụ thêm
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex justify-between text-sm mt-2">
                            <span>Thuế & phí</span>
                            <span>{formatPrice(taxes)}</span>
                          </div>
                          {/* Show pre-discount subtotal right above totals (fare + services + taxes, before promo) */}
                          <div className="flex justify-between font-medium mt-2">
                            <span>Tổng giá vé (đã cộng thuế và phí)</span>
                            <span>{formatPrice(preDiscount)}</span>
                          </div>

                          <div className="flex justify-between text-sm text-green-600">
                            <span>Giảm giá</span>
                            <span>
                              {formatPrice(
                                Number(discountAmount || discount || 0)
                              )}
                            </span>
                          </div>

                          <Separator />
                          <div className="flex justify-between font-bold text-lg">
                            <span>Tổng cộng</span>
                            {/* <span className="text-primary">{formatPrice(Math.max(0, Math.round(Number(computedTotal) - (discountAmount || 0))))}</span> */}
                            <span className="text-primary">
                              {formatPrice(
                                Math.max(
                                  0,
                                  Math.round(
                                    Number(preDiscount) - (discountAmount || 0)
                                  )
                                )
                              )}
                            </span>
                          </div>
                        </>
                      );
                    }

                    
                    const flights = bookingData?.flights ?? {};
                    const outbound = flights.outbound ?? null;
                    const inbound = flights.inbound ?? null;

                    const passengerBaseTotal = Number(
                      p.passengerBaseTotal ?? p.basePrice ?? 0
                    ); // assumed per-leg base
                    const taxesPerLeg = Number(p.taxesEstimate ?? p.taxes ?? 0); // per leg per pax (as produced by booking builder)
                    const addOnsArr = Array.isArray(p.addOns) ? p.addOns : [];
                    const seatsArr = Array.isArray(p.seats) ? p.seats : [];

                    const sumAddonsForLeg = (leg: string | null) =>
                      addOnsArr
                        .filter((a:any) => (a.leg ?? null) === leg)
                        .reduce(
                          (s: number, a: any) =>
                            s + Number(a.total ?? a.unitPrice ?? a.price ?? 0),
                          0
                        );
                    const sumSeatsForLeg = (leg: string | null) =>
                      seatsArr
                        .filter((s:any) => (s.leg ?? null) === leg)
                        .reduce(
                          (s: number, it: any) => s + Number(it.price ?? 0),
                          0
                        );

                    const renderLeg = (label: string, flight: any, legKey: "outbound" | "inbound") => {
                      const seg = flight?.itineraries?.[0]?.segments?.[0] ?? null;
                      const depCode = seg?.departure?.iataCode ?? "";
                      const arrCode = seg?.arrival?.iataCode ?? "";
                      const depLabel = getAirportLabel(depCode, seg?.departure?.city ?? "");
                      const arrLabel = getAirportLabel(arrCode, seg?.arrival?.city ?? "");

                      const addOnTotal = sumAddonsForLeg(legKey);
                      const seatsTotal = sumSeatsForLeg(legKey);
                      const counts = bookingData?.passengers?.counts || { adults: 0, children: 0, infants: 0 };

                      // Sử dụng derived cho leg cụ thể
                      const legDerived = legKey === "outbound" ? derivedOutbound : derivedInbound;
                      const base = legDerived.adultsTotal + legDerived.childrenTotal + legDerived.infantsTotal;

                      // Thuế: Dùng taxesEstimate từ bookingData.pricing (870,000 tổng, chia đều cho 2 chuyến nếu roundtrip)
                      const totalTaxes = Number(bookingData?.pricing?.taxesEstimate ?? 0);
                      const taxesPerLeg = isRoundtrip ? totalTaxes / 2 : totalTaxes;
                      const taxes = Math.round(taxesPerLeg);

                      const total = base + taxes + addOnTotal + seatsTotal;

                      return (
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{label}</span>
                            <span className="text-sm text-muted-foreground">
                              {flight?.flightNumber ?? "—"}{" "}
                              {flight?.airline ?? ""}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div className="flex justify-between">
                              <span>Tuyến:</span>
                              <span>
                                {depCode && arrCode
                                  ? `${depCode} (${depLabel}) → ${arrCode} (${arrLabel})`
                                  : flight?.route ?? "—"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Ngày:</span>
                              <span>
                                {seg?.departure?.at?.split("T")?.[0] ??
                                  flight?.date ??
                                  "—"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Giờ:</span>
                              <span>
                                {seg?.departure?.at && seg?.arrival?.at
                                  ? `${seg.departure.at
                                    .split("T")[1]
                                    ?.slice(0, 5)} - ${seg.arrival.at
                                      .split("T")[1]
                                      ?.slice(0, 5)}`
                                  : flight?.time ?? "—"}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-2 mt-2">
                             
                            {/* Giá vé với breakdown đúng */}
                            <div className="flex items-center justify-between text-sm cursor-pointer" onClick={() => setShowFareDetails((prev) => ({ ...prev, [legKey]: !prev[legKey] }))}>
                              <div className="flex items-center gap-2">
                                <span>Giá vé</span>
                                <span className="text-xs text-muted-foreground">{counts.adults + counts.children + counts.infants} người</span>
                              </div>
                              <div className="flex items-center gap-4">
                                <span>{formatPrice(base)}</span>
                                <ChevronDown className={`h-4 w-4 transition-transform ${showFareDetails[legKey] ? "rotate-180" : ""}`} />
                              </div>
                            </div>
                            {showFareDetails[legKey] && (
                              <div className="mt-2 mb-2 p-2 bg-gray-50 rounded-md text-sm">
                                {counts.adults > 0 && (
                                  <div className="flex justify-between">
                                    <div>Người lớn ({counts.adults})</div>
                                    <div>{formatPrice(legDerived.adultsTotal)}</div>
                                  </div>
                                )}
                                {counts.children > 0 && (
                                  <div className="flex justify-between">
                                    <div>Trẻ em ({counts.children})</div>
                                    <div>{formatPrice(legDerived.childrenTotal)}</div>
                                  </div>
                                )}
                                {counts.infants > 0 && (
                                  <div className="flex justify-between">
                                    <div>Em bé ({counts.infants})</div>
                                    <div>{formatPrice(legDerived.infantsTotal)}</div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Dịch vụ thêm with ChevronDown */}
                            {addOnTotal > 0 && (
                              <>
                                <div
                                  className="flex items-center justify-between text-sm cursor-pointer"
                                  onClick={() =>
                                    setShowAddonsDetails((prev) => ({
                                      ...prev,
                                      [legKey]: !prev[legKey],
                                    }))
                                  }
                                >
                                  <div>Dịch vụ thêm</div>
                                  <div className="flex items-center gap-4">
                                    <span>{formatPrice(addOnTotal)}</span>
                                    <ChevronDown
                                      className={`h-4 w-4 transition-transform ${showAddonsDetails[legKey]
                                        ? "rotate-180"
                                        : ""
                                        }`}
                                    />
                                  </div>
                                </div>
                                {showAddonsDetails[legKey] && (
                                  <div className="mt-2 mb-2 p-2 bg-gray-50 rounded-md text-sm">
                                    {addOnsArr.filter(
                                      (a:any) => (a.leg ?? null) === legKey
                                    ).length > 0 ? (
                                      <div className="space-y-2">
                                        {addOnsArr
                                          .filter(
                                            (a:any) => (a.leg ?? null) === legKey
                                          )
                                          .map((a: any, idx: number) => (
                                            <div
                                              key={idx}
                                              className="flex justify-between"
                                            >
                                              <div>
                                                {a.name}
                                                {a.qty && a.qty > 1
                                                  ? ` ×${a.qty}`
                                                  : ""}
                                              </div>
                                              <div>
                                                {formatPrice(
                                                  Number(
                                                    a.total ?? a.unitPrice ?? 0
                                                  )
                                                )}
                                              </div>
                                            </div>
                                          ))}
                                        <div className="flex justify-between font-medium pt-2 border-t">
                                          <div>Tổng dịch vụ</div>
                                          <div>{formatPrice(addOnTotal)}</div>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="text-muted-foreground">
                                        Không có dịch vụ thêm cho{" "}
                                        {label.toLowerCase()}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </>
                            )}

                            <div className="flex justify-between text-sm">
                              <span>Thuế & phí</span>
                              <span>{formatPrice(taxes)}</span>
                            </div>
                            {/* {seatsTotal > 0 && <div className="flex justify-between text-sm"><span>Phí ghế</span><span>{formatPrice(seatsTotal)}</span></div>} */}
                            <div
                              className="flex items-center justify-between text-sm cursor-pointer"
                              onClick={() =>
                                setShowFareDetails((prev) => ({
                                  ...prev,
                                  [legKey]: !prev[legKey],
                                }))
                              }
                            >
                              <div>Phí ghế</div>
                              <div className="flex items-center gap-4">
                                <span>{formatPrice(seatsTotal)}</span>
                                <ChevronDown
                                  className={`h-4 w-4 transition-transform ${showFareDetails[legKey] ? "rotate-180" : ""
                                    }`}
                                />
                              </div>
                            </div>
                            {showFareDetails[legKey] && (
                              <div className="mt-2 mb-2 p-2 bg-gray-50 rounded-md text-sm">
                                {seatsArr.filter(
                                  (s:any) => (s.leg ?? null) === legKey
                                ).length > 0 ? (
                                  <div className="space-y-2">
                                    {seatsArr
                                      .filter((s:any) => (s.leg ?? null) === legKey)
                                      .map((s: any, idx: number) => (
                                        <div
                                          key={idx}
                                          className="flex justify-between"
                                        >
                                          <div>Ghế {s.number}</div>
                                          <div>
                                            {formatPrice(Number(s.price ?? 0))}
                                          </div>
                                        </div>
                                      ))}
                                    <div className="flex justify-between font-medium pt-2 border-t">
                                      <div>Tổng phí ghế</div>
                                      <div>{formatPrice(seatsTotal)}</div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-muted-foreground">
                                    Không có ghế được chọn cho{" "}
                                    {label.toLowerCase()}
                                  </div>
                                )}
                              </div>
                            )}
                            <div className="flex justify-between font-semibold text-base mt-2">
                              <span>Tổng {label.toLowerCase()}</span>
                              <span className="text-[hsl(var(--primary))]">{formatPrice(total)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    };

                    // Grand total: prefer explicit total on payload
                    // Compute grand total as sum of outbound + inbound when available,
                    // otherwise fall back to explicit payload total fields (legacy).
                    const computeLegTotal = (
                      legKey: "outbound" | "inbound"
                    ) => {
                      const addOnTotal = sumAddonsForLeg(legKey);
                      const seatsTotal = sumSeatsForLeg(legKey);
                      const counts = bookingData?.passengers?.counts || {
                        adults: 0,
                        children: 0,
                        infants: 0,
                      };
                      const base = p.perPax
                        ? Number(p.perPax.adultUnit ?? 0) * counts.adults +
                        Number(p.perPax.childUnit ?? 0) * counts.children +
                        Number(p.perPax.infantUnit ?? 0) * counts.infants
                        : Number(p.passengerBaseTotal ?? 0);
                      const taxes = taxesPerLeg;
                      return (
                        Number(base) +
                        Number(taxes) +
                        Number(addOnTotal) +
                        Number(seatsTotal)
                      );
                    };

                    const outboundTotal = outbound
                      ? computeLegTotal("outbound")
                      : 0;
                    const inboundTotal = inbound
                      ? computeLegTotal("inbound")
                      : 0;

                    const payloadTotal = Number(
                      p.total ??
                      p.estimatedTotal ??
                      p.estimatedTotalAmount ??
                      p.offerTotal ??
                      p.estimatedTotal ??
                      0
                    );
                    const grandTotal =
                      payloadTotal > 0
                        ? payloadTotal
                        : outboundTotal + inboundTotal;

                    return (
                      <>
                        {/* Per-leg summaries */}
                        {outbound &&
                          renderLeg("Chuyến đi", outbound, "outbound")}
                        {inbound && renderLeg("Chuyến về", inbound, "inbound")}

                        <Separator />

                        {/* Tổng tiền dịch vụ*/}
                        <div
                          className="flex items-center justify-between text-sm cursor-pointer mt-2"
                          onClick={() => setShowAddonsDetails((prev) => ({ outbound: !prev.outbound, inbound: !prev.inbound }))}
                        >
                          <div className="font-semibold text-base">
                            {" "}
                            Tổng tiền dịch vụ{" "}
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-semibold text-base text-[hsl(var(--primary))]">
                              {formatPrice(Number(p.addOnsTotal ?? 0))}
                            </span>
                            <ChevronDown
                              className={`h-4 w-4 transition-transform ${showAddonsDetails ? "rotate-180" : ""
                                }`}
                            />
                          </div>
                        </div>

                        {showAddonsDetails && (
                          <div className="mt-2 mb-2 p-2 bg-gray-50 rounded-md text-sm">
                            {addOnsArr.length > 0 ? (
                              <div className="space-y-2">
                                {addOnsArr.map((a: any, idx: number) => (
                                  <div
                                    key={idx}
                                    className="flex justify-between"
                                  >
                                    <div>
                                      {a.name}
                                      {a.qty && a.qty > 1
                                        ? ` ×${a.qty}`
                                        : ""}{" "}
                                      {a.leg ? `(${a.leg})` : ""}
                                    </div>
                                    <div>
                                      {formatPrice(
                                        Number(a.total ?? a.unitPrice ?? 0)
                                      )}
                                    </div>
                                  </div>
                                ))}
                                <div className="flex justify-between font-medium pt-2 border-t">
                                  <div>Tổng dịch vụ</div>
                                  <div>
                                    {formatPrice(Number(p.addOnsTotal ?? 0))}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-muted-foreground">
                                Không có thông tin dịch vụ thêm
                              </div>
                            )}
                          </div>
                        )}
                        {/* Total fare + collapse (keeps ChevronDown style) */}
                        <div
                          className="flex items-center justify-between text-sm cursor-pointer"
                          onClick={() =>
                            setShowTotalFareDetails((prev) => !prev)
                          }
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-base">
                              Tổng giá vé
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            {/* compute displayed totals and subtract discountAmount */}
                            {(() => {
                              const p = normalizedPricing || {};
                              const payloadTotal = Number(
                                p.total ?? p.estimatedTotal ?? p.offerTotal ?? 0
                              );
                              // fallback to grandTotal computed earlier if available
                              const computedGrand = Number(
                                grandTotal ?? payloadTotal ?? 0
                              );
                              const baseTotal = Math.round(computedGrand);
                              const finalTotal = Math.max(
                                0,
                                baseTotal - (discountAmount || 0)
                              );
                              return (
                                <>
                                  <span className="font-semibold text-base text-[hsl(var(--primary))]">
                                    {formatPrice(finalTotal)}
                                  </span>
                                  <ChevronDown
                                    className={`h-4 w-4 transition-transform ${showTotalFareDetails ? "rotate-180" : ""
                                      }`}
                                  />
                                </>
                              );
                            })()}
                          </div>
                        </div>

                        {showTotalFareDetails && (
                          <div className="mt-2 mb-2 p-2 bg-gray-50 rounded-md text-sm">
                            {/* Hiện tổng theo chuyến: Chuyến đi + Chuyến về -> Tổng */}
                            <div className="space-y-2">
                              {outbound && (
                                <div className="flex justify-between">
                                  <div>Chuyến đi</div>
                                  <div>{formatPrice(outboundTotal)}</div>
                                </div>
                              )}
                              {inbound && (
                                <div className="flex justify-between">
                                  <div>Chuyến về</div>
                                  <div>{formatPrice(inboundTotal)}</div>
                                </div>
                              )}
                              <div className="flex justify-between font-medium pt-2 border-t">
                                <div>Tổng giá vé</div>
                                <div>
                                  {formatPrice(
                                    Math.max(
                                      0,
                                      Math.round(
                                        Number(
                                          grandTotal || p.estimatedTotal || 0
                                        )
                                      ) - (discountAmount || 0)
                                    )
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex justify-between text-sm text-green-600">
                          <span>Giảm giá</span>
                          <span>
                            {formatPrice(
                              Number(discountAmount || Number(p.discount || 0))
                            )}
                          </span>
                        </div>

                        <Separator />
                        <div className="flex justify-between font-bold text-lg">
                          <span>Tổng cộng</span>
                          <span className="text-primary">
                            {formatPrice(
                              Math.max(
                                0,
                                Math.round(
                                  Number(grandTotal || p.estimatedTotal || 0) -
                                  (discountAmount || 0)
                                )
                              )
                            )}
                          </span>
                        </div>
                      </>
                    );
                  })()
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Đang tải tóm tắt đơn hàng...
                  </div>
                )}
                <Separator />
                {autoAppliedInfo && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-100 rounded-md text-sm flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        {appliedPromoSource === "manual"
                          ? "Bạn đã sử dụng khuyến mãi từ việc nhập mã"
                          : "Bạn đã sử dụng khuyến mãi tự động"}
                      </div>
                      <div className="text-xs text-green-700">
                        {autoAppliedInfo.code
                          ? `Mã: ${autoAppliedInfo.code}`
                          : autoAppliedInfo.title ?? "Khuyến mãi"}{" "}
                        — Tiết kiệm {formatPrice(autoAppliedInfo.saved)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // allow user to remove the applied auto promo
                          removePromo();
                        }}
                      >
                        Bỏ
                      </Button>
                    </div>
                  </div>
                )}
                {/* Promo Code input - ADDED */}
                <div className="pt-2 pb-2">
                  {/* Suggestion headline placed above the banner */}
                  {appliedPromoCandidate && !appliedPromoAuto && !promoCode && (
                    <div className="mb-2 text-sm text-muted-foreground">
                      Đơn hàng của bạn thỏa điều kiện khuyến mãi:{" "}
                      <span className="font-medium text-[hsl(var(--primary))]">
                        {appliedPromoCandidate.title ||
                          appliedPromoCandidate.code ||
                          "Khuyến mãi tự động"}
                      </span>{" "}
                      — bạn có muốn áp dụng?
                    </div>
                  )}
                  {/* Auto-apply suggestion banner (respect showPromoSuggestion toggle) */}
                  {appliedPromoCandidate &&
                    !appliedPromoAuto &&
                    !promoCode &&
                    showPromoSuggestion && (
                      <div className="mb-3 p-3 bg-blue-50 border border-blue-100 rounded-md text-sm ">
                        <div className="mb-3">
                          <div className="font-medium">
                            Khuyến mãi tự động khả dụng
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {appliedPromoCandidate.title ||
                              appliedPromoCandidate.code ||
                              "Khuyến mãi"}{" "}
                            —{" "}
                            {appliedPromoCandidateDiscount > 0
                              ? `Tiết kiệm ${formatPrice(
                                appliedPromoCandidateDiscount
                              )}`
                              : ""}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2 flex-nowrap">
                            <Button
                              size="sm"
                              className="whitespace-nowrap"
                              onClick={() => {
                                // accept auto promo
                                setAppliedPromoAuto({
                                  ...appliedPromoCandidate,
                                  appliedDiscount:
                                    appliedPromoCandidateDiscount,
                                });
                                setDiscountAmount(
                                  appliedPromoCandidateDiscount
                                );
                                const saved = Math.round(
                                  appliedPromoCandidateDiscount || 0
                                );
                                const promoLabel =
                                  appliedPromoCandidate.title ||
                                  appliedPromoCandidate.code ||
                                  "Khuyến mãi tự động";
                                const codeVal = appliedPromoCandidate.code
                                  ? String(appliedPromoCandidate.code)
                                  : null;
                                setAutoAppliedInfo({
                                  code: codeVal,
                                  title: appliedPromoCandidate.title,
                                  saved,
                                });
                                setPromoMessage(
                                  `Đã áp dụng khuyến mãi tự động: ${promoLabel} — Tiết kiệm ${formatPrice(
                                    saved
                                  )}`
                                );
                                setPromoCode(codeVal ?? "");
                                setShowPromoSuggestion(false);
                                console.log(
                                  `Đã áp dụng khuyến mãi tự động: ${promoLabel}${codeVal ? ` (mã ${codeVal})` : ""
                                  } — Tiết kiệm ${formatPrice(saved)}`
                                );
                              }}
                            >
                              Áp dụng
                            </Button>
                            {/* new: open modal to choose other auto promos when multiple candidates available */}
                            {appliedPromoCandidates.length > 0 && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="whitespace-nowrap"
                                onClick={() => {
                                  setShowPromoModal(true);
                                }}
                              >
                                Chọn mã khác
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="whitespace-nowrap"
                              onClick={() => {
                                setShowPromoSuggestion(false);
                                setPromoMessage(null);
                              }}
                            >
                              Đóng
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                  {/* Modal for choosing other auto-apply promos */}
                  {showPromoModal && appliedPromoCandidates.length > 0 && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                      <div
                        className="absolute inset-0 bg-black opacity-40"
                        onClick={() => {
                          setShowPromoModal(false);
                          setSelectedCandidateIndex(null);
                        }}
                      />
                      <div className="bg-white rounded-lg shadow-lg max-w-xl w-full p-4 z-10">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-medium">
                            Chọn khuyến mãi tự động
                          </h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setShowPromoModal(false);
                              setSelectedCandidateIndex(null);
                            }}
                          >
                            Đóng
                          </Button>
                        </div>
                        <div className="space-y-3 max-h-72 overflow-auto">
                          {appliedPromoCandidates.map((c: any, idx: number) => {
                            const p = c.promo;
                            return (
                              <div
                                key={p._id || idx}
                                className="p-3 border rounded-md flex items-center justify-between"
                              >
                                <div>
                                  <div className="font-medium">
                                    {p.title || p.code || "Khuyến mãi"}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {p.code
                                      ? `Mã: ${p.code}`
                                      : p.type === "percent"
                                        ? `${p.value}%`
                                        : formatPrice(p.value)}
                                  </div>
                                  <div className="text-sm text-green-600 mt-1">
                                    Tiết kiệm {formatPrice(c.discount)}
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <input
                                    type="radio"
                                    name="promoPick"
                                    checked={selectedCandidateIndex === idx}
                                    onChange={() => {
                                      setSelectedCandidateIndex(idx);
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-3 p-3 border rounded-md bg-gray-50">
                          {(() => {
                            const pick =
                              selectedCandidateIndex != null
                                ? appliedPromoCandidates[selectedCandidateIndex]
                                : null;
                            if (!pick)
                              return (
                                <div className="text-sm text-muted-foreground">
                                  Chọn khuyến mãi để xem tiết kiệm.
                                </div>
                              );
                            return (
                              <div className="flex items-center justify-between">
                                <div className="text-sm">
                                  Tiết kiệm nếu áp dụng
                                </div>
                                <div className="font-medium text-[hsl(var(--primary))]">
                                  {formatPrice(Math.round(pick.discount))}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                        <div className="mt-4 flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowPromoModal(false);
                              setSelectedCandidateIndex(null);
                            }}
                          >
                            Hủy
                          </Button>
                          <Button
                            onClick={() => {
                              if (selectedCandidateIndex == null) return;
                              const pick =
                                appliedPromoCandidates[selectedCandidateIndex];
                              if (!pick) return;
                              const p = pick.promo;
                              const saved = Math.round(pick.discount || 0);
                              // apply single promo
                              setAppliedPromoAuto({
                                ...p,
                                appliedDiscount: saved,
                              });
                              setDiscountAmount(saved);
                              setAutoAppliedInfo({
                                code: p.code ?? null,
                                title: p.title ?? p.code ?? "Khuyến mãi",
                                saved,
                              });
                              setPromoMessage(
                                `Đã áp dụng khuyến mãi: ${p.title || p.code || "Khuyến mãi"
                                } — Tiết kiệm ${formatPrice(saved)}`
                              );
                              setShowPromoModal(false);
                              setSelectedCandidateIndex(null);
                              // lock manual entry if promo has code
                              if (p.code) setPromoCode(String(p.code));
                            }}
                          >
                            Áp dụng đã chọn
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  {!showPromoSuggestion &&
                    appliedPromoCandidate &&
                    !appliedPromoAuto &&
                    !promoCode && (
                      <div className="mb-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowPromoSuggestion(true);
                            setPromoMessage(
                              `Đơn hàng của bạn thỏa điều kiện khuyến mãi: ${appliedPromoCandidate.title ||
                              appliedPromoCandidate.code ||
                              "Khuyến mãi tự động"
                              } — bạn có muốn áp dụng?`
                            );
                          }}
                        >
                          Mở lại khuyến mãi tự động
                        </Button>
                      </div>
                    )}

                  <label className="text-sm font-medium block mb-2">
                    Mã giảm giá
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nhập mã (ví dụ: TOUR500, FAMILY25)"
                      value={promoCode}
                      onChange={(e) => {
                        // typing manual code should remove auto applied promo / suggestion
                        setPromoCode(e.target.value);
                        if (appliedPromoAuto) {
                          setAppliedPromoAuto(null);
                          setDiscountAmount(0);
                          setAppliedPromoSource(null);
                        }
                        if (appliedPromoCandidate) {
                          setAppliedPromoCandidate(null);
                          setAppliedPromoCandidateDiscount(0);
                        }
                      }}
                      className="flex-1"
                      disabled={!!appliedPromoAuto}
                    />
                    {appliedPromoAuto ? (
                      // label depends on how the promo was applied
                      <Button
                        variant="ghost"
                        onClick={removePromo}
                        className="whitespace-nowrap"
                      >
                        {appliedPromoSource === "manual"
                          ? "Hủy áp dụng"
                          : "Bỏ mã tự động"}
                      </Button>
                    ) : discountAmount > 0 ? (
                      <Button
                        variant="ghost"
                        onClick={removePromo}
                        className="whitespace-nowrap"
                      >
                        Xóa
                      </Button>
                    ) : (
                      <Button
                        onClick={applyPromo}
                        disabled={applyingPromo || !promoCode}
                      >
                        {applyingPromo ? "Đang áp dụng..." : "Áp dụng"}
                      </Button>
                    )}
                  </div>
                  {/* {promoMessage && (
                                        <div className={`mt-2 text-sm ${discountAmount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {promoMessage}
                                        </div>
                                    )} */}
                  {promoMessage && (
                    <div
                      className={`mt-2 text-sm ${discountAmount > 0 ? "text-green-600" : "text-red-600"
                        }`}
                    >
                      {promoMessage}
                    </div>
                  )}
                </div>

                <Separator />
                {/* Security Info */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="h-4 w-4 text-green-500" />
                    <span>Thanh toán bảo mật SSL</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span>Xác nhận tức thì</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-purple-500" />
                    <span>Vé điện tử</span>
                  </div>
                </div>
                {/* Support Info */}
                <div className="pt-4 border-t text-center">
                  <div className="text-sm font-medium mb-1">Cần hỗ trợ?</div>
                  <div className="text-sm text-primary">Hotline: 1900 1234</div>
                  <div className="text-xs text-muted-foreground">
                    Hỗ trợ 24/7
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={termsModalOpen} onOpenChange={setTermsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto z-[70] bg-white dark:bg-slate-900 rounded-md shadow-lg">
          <DialogHeader>
            <DialogTitle>Điều khoản sử dụng và Chính sách bảo mật</DialogTitle>
            <DialogDescription>
              Vui lòng đọc kỹ các điều khoản và chính sách trước khi đồng ý.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 text-sm">
            {/* Điều khoản chung */}
            <div>
              <h3 className="font-semibold text-base mb-2">1. Điều khoản chung</h3>
              <ul className="list-disc ml-5 space-y-1">
                <li>Bằng việc sử dụng dịch vụ của MegaTrip, bạn đồng ý tuân thủ các điều khoản này.</li>
                <li>MegaTrip có quyền thay đổi điều khoản bất cứ lúc nào mà không cần thông báo trước.</li>
                <li>Người dùng phải từ 18 tuổi trở lên hoặc có sự đồng ý của phụ huynh.</li>
              </ul>
            </div>

            {/* Chính sách hủy đơn (từ huy-don, cập nhật theo noterules.txt) */}
            <div>
              <h3 className="font-semibold text-base mb-2">2. Chính sách hủy đơn</h3>
              <div className="space-y-4">
                <div>
                  <strong>Máy bay:</strong> Phạt theo hãng (VN Airlines: ≥7 ngày 5%, 3-7 ngày 20%, &lt;3 ngày 50%). Thuế không hoàn. Không hủy trong 3 ngày trước giờ bay.
                </div>
                <div>
                  <strong>Xe bus:</strong>
                  <table className="w-full text-sm border-collapse border border-gray-300 mt-2">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-2 py-1 text-left">Điều kiện</th>
                        <th className="border border-gray-300 px-2 py-1 text-left">Phạt</th>
                        <th className="border border-gray-300 px-2 py-1 text-left">Hoàn tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-300 px-2 py-1">≥ 72 giờ trước giờ khởi hành</td>
                        <td className="border border-gray-300 px-2 py-1">10%</td>
                        <td className="border border-gray-300 px-2 py-1">90%</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-2 py-1">24 – 72 giờ trước</td>
                        <td className="border border-gray-300 px-2 py-1">25%</td>
                        <td className="border border-gray-300 px-2 py-1">75%</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-2 py-1">12 – &lt;24 giờ trước</td>
                        <td className="border border-gray-300 px-2 py-1">50%</td>
                        <td className="border border-gray-300 px-2 py-1">50%</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-2 py-1">&lt;12 giờ hoặc sau khi xe chạy</td>
                        <td className="border border-gray-300 px-2 py-1">100%</td>
                        <td className="border border-gray-300 px-2 py-1">Không hoàn tiền</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div>
                  <strong>Tour:</strong>
                  <table className="w-full text-sm border-collapse border border-gray-300 mt-2">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-2 py-1 text-left">Điều kiện</th>
                        <th className="border border-gray-300 px-2 py-1 text-left">Phạt</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-300 px-2 py-1">Trước 15 ngày khởi hành</td>
                        <td className="border border-gray-300 px-2 py-1">20% tổng tiền tour</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-2 py-1">7-14 ngày khởi hành</td>
                        <td className="border border-gray-300 px-2 py-1">50% tổng tiền tour</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-2 py-1">3-6 ngày khởi hành</td>
                        <td className="border border-gray-300 px-2 py-1">75% tổng tiền tour</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-2 py-1">Trong 3 ngày trước khởi hành</td>
                        <td className="border border-gray-300 px-2 py-1">100% tổng tiền tour (không hoàn)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Chính sách đổi lịch (từ doi-lich, cập nhật theo noterules.txt) */}
            <div>
              <h3 className="font-semibold text-base mb-2">3. Chính sách đổi lịch</h3>
              <ul className="list-disc ml-5 space-y-1">
                <li>Máy bay: Chỉ đổi nếu còn chỗ trống, phạt theo hãng + phí đổi 100.000 VND/khách. Không đổi trong 3 ngày trước giờ bay.</li>
                <li>
                  <strong>Xe bus:</strong>
                  <ul className="list-disc ml-5 mt-1">
                    <li>Đổi ≥ 72 giờ trước giờ khởi hành: phí 50.000đ / khách</li>
                    <li>Đổi 24 – 72 giờ trước: phí 50.000đ / khách + 25% giá vé</li>
                    <li>Đổi &lt; 24 giờ: không cho đổi</li>
                  </ul>
                </li>
                <li>
                  <strong>Tour:</strong>
                  <ul className="list-disc ml-5 mt-1">
                    <li>Trên 5 ngày: 30% giá trị tour</li>
                    <li>Từ 3 đến 5 ngày trước: 50% giá trị tour</li>
                    <li>3 ngày trước: 100% giá trị tour</li>
                  </ul>
                </li>
                <li>Đổi lịch chỉ được thực hiện 1 lần cho mỗi đơn hàng, không hoàn tiền sau khi đổi.</li>
              </ul>
            </div>

            {/* Chính sách bảo mật (từ tai-khoan) */}
            <div>
              <h3 className="font-semibold text-base mb-2">4. Chính sách bảo mật</h3>
              <ul className="list-disc ml-5 space-y-1">
                <li>Thông tin cá nhân được bảo mật theo luật Việt Nam.</li>
                <li>Chúng tôi không chia sẻ dữ liệu với bên thứ ba trừ khi có yêu cầu pháp lý.</li>
                <li>Vui lòng thanh toán bằng tài khoản cá nhân cố định để thuận tiện hoàn tiền, hủy tour và thanh toán bổ sung khi đổi lịch.</li>
              </ul>
            </div>

            {/* Quyền và nghĩa vụ */}
            <div>
              <h3 className="font-semibold text-base mb-2">5. Quyền và nghĩa vụ của người dùng</h3>
              <ul className="list-disc ml-5 space-y-1">
                <li>Cung cấp thông tin chính xác khi đặt chỗ.</li>
                <li>Thanh toán đúng hạn, không gian lận.</li>
                <li>Tuân thủ quy định của hãng vận chuyển và luật pháp.</li>
                <li>MegaTrip có quyền hủy đơn nếu phát hiện vi phạm.</li>
              </ul>
            </div>

            {/* Trách nhiệm của MegaTrip */}
            <div>
              <h3 className="font-semibold text-base mb-2">6. Trách nhiệm của MegaTrip</h3>
              <ul className="list-disc ml-5 space-y-1">
                <li>Cung cấp dịch vụ đúng như mô tả.</li>
                <li>Hỗ trợ khách hàng 24/7 qua hotline.</li>
                <li>Hoàn tiền theo chính sách nếu lỗi từ phía chúng tôi.</li>
                <li>Không chịu trách nhiệm cho sự chậm trễ do hãng vận chuyển hoặc thiên tai.</li>
              </ul>
            </div>

            {/* Điều khoản thanh toán */}
            <div>
              <h3 className="font-semibold text-base mb-2">7. Điều khoản thanh toán</h3>
              <ul className="list-disc ml-5 space-y-1">
                <li>Thanh toán qua MoMo, ZaloPay được bảo mật.</li>
                <li>Hoàn tiền trong 7-14 ngày qua tài khoản gốc.</li>
                <li>Không hoàn tiền cho đơn đã sử dụng.</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setTermsModalOpen(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default withSuspense(ThanhToan);