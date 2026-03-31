"use client";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, Link } from "@/navigation";
import { useCartStore } from "@/stores/cartStore";
import { formatPrice, DELIVERY_FEE, FULFILLMENT_UZ, computePlatformFee, LAUNCH_CITY_NAME, LAUNCH_CITY_LABEL } from "@/lib/utils";
import { CheckCircle, CreditCard, MapPin, Package, ArrowRight, ChevronLeft, Map, Navigation, Store, Truck, Sparkles } from "lucide-react";
import { GlobalLoader } from "@/components/Loader";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";

type Step = 1 | 2 | 3;

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCartStore();
  const t = useTranslations("checkout");
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");
  
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [cities, setCities] = useState<{ id: number; name: string }[]>([]);

  // Structured address formulation
  const [delivery, setDelivery] = useState({
    recipientName: session?.user?.name || "",
    recipientPhone: session?.user?.phone || "",
    cityId: "",
    street: "",
    apartment: "",
    entrance: "",
    floor: "",
    intercom: "",
    deliveryDate: "",
    deliveryTimeOnly: "",
    deliveryTime: "",
    note: "",
    greetingText: "",
    greetingUrl: "",
  });
  const [fulfillmentType, setFulfillmentType] = useState<"pickup" | "shop_delivery">("shop_delivery");
  const [shopInfo, setShopInfo] = useState<{
    name?: string;
    address?: string | null;
    city_name?: string | null;
    delivery_fee?: number | null;
    pickup_available?: number | null;
    shop_delivery_available?: number | null;
    default_preparation_time?: string | null;
    pickup_instructions?: string | null;
  } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("p2p_transfer");
  const [walletBalance, setWalletBalance] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [gettingLocation, setGettingLocation] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [couponApplying, setCouponApplying] = useState(false);
  const [couponMessage, setCouponMessage] = useState("");
  const [pickedLocation, setPickedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<"idle" | "loading" | "ok" | "fallback">("idle");
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [greetingUploading, setGreetingUploading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/kirish?redirect=/buyurtma");
    fetch("/api/categories").then(r => r.json()).then(d => {
      const loadedCities = d.cities || [];
      setCities(loadedCities);
      const launchCity = loadedCities.find((c: { id: number; name: string }) => c.name === LAUNCH_CITY_NAME);
      if (launchCity) {
        setDelivery((p) => ({ ...p, cityId: String(launchCity.id) }));
      }
    });
    if (session?.user?.name) setDelivery(p => ({ ...p, recipientName: session.user.name }));
  }, [status, session]);

  useEffect(() => {
    if (!session?.user?.id) return;
    fetch("/api/wallet")
      .then((r) => r.json())
      .then((d) => setWalletBalance(Number(d.balance || 0)))
      .catch(() => {});
  }, [session]);

  useEffect(() => {
    const shopId = items[0]?.shopId;
    if (!shopId) {
      setShopInfo(null);
      return;
    }
    fetch(`/api/shops/${shopId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.success && d.shop) setShopInfo(d.shop);
      })
      .catch(() => setShopInfo(null));
  }, [items]);

  useEffect(() => {
    if (!shopInfo) return;
    const pickupOk = shopInfo.pickup_available !== 0;
    const delOk = shopInfo.shop_delivery_available !== 0;
    if (!pickupOk && delOk) setFulfillmentType("shop_delivery");
    else if (!delOk && pickupOk) setFulfillmentType("pickup");
  }, [shopInfo]);

  useEffect(() => {
    if (items.length === 0 && status === "authenticated") router.push("/katalog");
  }, [items, status]);

  useEffect(() => {
    if (!couponCode.trim()) return;
    // Cart content changed after applying coupon; require re-apply.
    setAppliedDiscount(0);
    setCouponMessage("Savat o'zgardi. Promo kodni qayta qo'llang.");
  }, [items, couponCode]);

  const shopDeliveryFee =
    typeof shopInfo?.delivery_fee === "number" && !Number.isNaN(shopInfo.delivery_fee)
      ? shopInfo.delivery_fee
      : DELIVERY_FEE;

  const validateDelivery = () => {
    const e: Record<string, string> = {};
    if (!delivery.recipientName) e.recipientName = `${t("recipientName")} majburiy`;
    if (!delivery.recipientPhone) e.recipientPhone = `${t("recipientPhone")} majburiy`;
    if (fulfillmentType === "shop_delivery") {
      if (!delivery.street) e.street = `${t("street")} majburiy`;
      if (!delivery.cityId) e.cityId = `${t("city")} majburiy`;
      if (!delivery.deliveryDate) e.deliveryDate = "Yetkazib berish sanasi majburiy";
      if (!delivery.deliveryTimeOnly) e.deliveryTimeOnly = "Yetkazib berish vaqti majburiy";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleDeliveryNext = () => {
    if (validateDelivery()) {
      setStep(2);
      window.scrollTo(0, 0);
    }
  };

  const handleGetLocation = () => {
    if (typeof window !== "undefined" && !window.isSecureContext && location.hostname !== "localhost") {
      setGeoStatus("fallback");
      alert("Joylashuv faqat xavfsiz ulanishda (HTTPS) ishlaydi. Manzilni qo'lda kiriting.");
      return;
    }

    if (!navigator.geolocation) {
      alert(t("locationError") || "Geolocation is not supported by your browser");
      return;
    }

    setGettingLocation(true);
    setGeoStatus("loading");

    const onGeoError = (error: GeolocationPositionError) => {
      setGettingLocation(false);
      setGeoStatus("fallback");

      let message = "Joylashuvni aniqlab bo'lmadi. Manzilni qo'lda kiriting.";
      if (error.code === error.PERMISSION_DENIED) {
        message = "Joylashuv ruxsati rad etildi. Brauzerda ruxsat berib qayta urinib ko'ring.";
      } else if (error.code === error.TIMEOUT) {
        message = "Joylashuv aniqlash vaqti tugadi. Internet/GPS ni tekshirib qayta urinib ko'ring.";
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        message = "Joylashuv ma'lumoti topilmadi. Xaritada nuqta tanlang yoki manzilni qo'lda kiriting.";
      }
      alert(message);
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setPickedLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setGettingLocation(false);
        setGeoStatus("ok");
      },
      onGeoError,
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 120000,
      }
    );
  };

  useEffect(() => {
    let mounted = true;
    const setupMap = async () => {
      if (!mapContainerRef.current || typeof window === "undefined") return;
      if (!(window as any).L) {
        if (!document.querySelector("link[data-leaflet='1']")) {
          const css = document.createElement("link");
          css.rel = "stylesheet";
          css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
          css.setAttribute("data-leaflet", "1");
          document.head.appendChild(css);
        }
        await new Promise<void>((resolve, reject) => {
          const existing = document.querySelector("script[data-leaflet='1']");
          if (existing) {
            if ((window as any).L) resolve();
            else existing.addEventListener("load", () => resolve(), { once: true });
            return;
          }
          const script = document.createElement("script");
          script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
          script.async = true;
          script.setAttribute("data-leaflet", "1");
          script.onload = () => resolve();
          script.onerror = () => reject();
          document.body.appendChild(script);
        });
      }
      if (!mounted || !mapContainerRef.current) return;
      const L = (window as any).L;
      if (!mapRef.current) {
        mapRef.current = L.map(mapContainerRef.current).setView([41.3111, 69.2797], 12);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap",
        }).addTo(mapRef.current);
        mapRef.current.on("click", (e: any) => {
          const lat = e.latlng.lat;
          const lng = e.latlng.lng;
          setPickedLocation({ lat, lng });
        });
      }
    };
    setupMap().catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const reverseGeocode = async () => {
      if (!pickedLocation || !mapRef.current) return;
      const L = (window as any).L;
      if (markerRef.current) {
        markerRef.current.setLatLng([pickedLocation.lat, pickedLocation.lng]);
      } else {
        markerRef.current = L.marker([pickedLocation.lat, pickedLocation.lng]).addTo(mapRef.current);
      }
      mapRef.current.setView([pickedLocation.lat, pickedLocation.lng], 15);

      try {
        setGeoStatus("loading");
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${pickedLocation.lat}&lon=${pickedLocation.lng}&accept-language=uz`
        );
        if (!res.ok) throw new Error("reverse geocode error");
        const data = await res.json();
        const addr = data?.address || {};
        const road = addr.road || addr.pedestrian || addr.neighbourhood || "";
        const house = addr.house_number ? ` ${addr.house_number}` : "";
        const cityName = addr.city || addr.town || addr.village || addr.state || "";

        setDelivery((prev) => ({
          ...prev,
          street: road ? `${road}${house}` : prev.street,
          note: `${prev.note || ""}`.trim(),
        }));
        if (cityName && cities.length > 0) {
          const matched = cities.find((c) =>
            c.name.toLowerCase().includes(String(cityName).toLowerCase())
          );
          if (matched) {
            setDelivery((prev) => ({ ...prev, cityId: String(matched.id) }));
          }
        }
        setGeoStatus("ok");
      } catch {
        setGeoStatus("fallback");
      }
    };
    reverseGeocode();
  }, [pickedLocation, cities]);

  const formattedDeliveryAddress = () => {
    const parts = [delivery.street];
    if (delivery.apartment) parts.push(`${t("apartment") || "Apt/Office"}: ${delivery.apartment}`);
    if (delivery.entrance) parts.push(`${t("entrance") || "Entrance"}: ${delivery.entrance}`);
    if (delivery.floor) parts.push(`${t("floor") || "Floor"}: ${delivery.floor}`);
    if (delivery.intercom) parts.push(`${t("intercom") || "Intercom"}: ${delivery.intercom}`);
    return parts.join(", ");
  };

  const handleApplyCoupon = async () => {
    const code = couponCode.trim();
    if (!code) {
      setCouponMessage("Promo kod kiriting");
      setAppliedDiscount(0);
      return;
    }
    const shopId = items[0]?.shopId;
    if (!shopId) return;
    setCouponApplying(true);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId, couponCode: code, subtotal: totalPrice() }),
      });
      const data = await res.json();
      if (!res.ok || !data.valid) {
        setAppliedDiscount(0);
        setCouponMessage(data?.error || "Promo kod yaroqsiz");
        return;
      }
      setAppliedDiscount(Number(data.discountAmount || 0));
      setCouponMessage("Promo kod muvaffaqiyatli qo'llandi");
    } catch {
      setAppliedDiscount(0);
      setCouponMessage("Promo kodni tekshirib bo'lmadi");
    } finally {
      setCouponApplying(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      alert("Video hajmi 50MB dan oshmasligi kerak");
      return;
    }

    setGreetingUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setDelivery(p => ({ ...p, greetingUrl: data.url }));
        alert("Video muvaffaqiyatli yuklandi!");
      } else {
        alert(data.error || "Yuklashda xatolik");
      }
    } catch (err) {
      alert("Yuklashda xatolik yuz berdi");
    } finally {
      setGreetingUploading(false);
    }
  };

  const [isGroupGifting, setIsGroupGifting] = useState(false);

  const handlePlaceOrder = async () => {
    if (!session) return;
    setLoading(true);

    try {
      const shopId = items[0]?.shopId;
      const finalAddress = formattedDeliveryAddress();
      const geoNote = pickedLocation
        ? ` [geo:${pickedLocation.lat.toFixed(6)},${pickedLocation.lng.toFixed(6)}]`
        : "";
      const finalNote = `${delivery.note || ""}${geoNote}`.trim() || null;
      
      const combinedDeliveryTime =
        fulfillmentType === "shop_delivery" && delivery.deliveryDate && delivery.deliveryTimeOnly
          ? `${delivery.deliveryDate}T${delivery.deliveryTimeOnly}:00`
          : delivery.deliveryTime || null;

      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId,
          items: items.map(i => ({ productId: i.productId, title: i.title, price: i.price, quantity: i.quantity, imageUrl: i.imageUrl })),
          recipientName: delivery.recipientName,
          recipientPhone: delivery.recipientPhone,
          deliveryAddress: finalAddress,
          deliveryCityId: delivery.cityId || null,
          deliveryTime: combinedDeliveryTime,
          deliveryDate: fulfillmentType === "shop_delivery" ? delivery.deliveryDate || null : null,
          note: finalNote,
          greetingText: delivery.greetingText.trim() || null,
          greetingUrl: delivery.greetingUrl.trim() || null,
          deliveryLat: fulfillmentType === "shop_delivery" ? pickedLocation?.lat ?? null : null,
          deliveryLng: fulfillmentType === "shop_delivery" ? pickedLocation?.lng ?? null : null,
          paymentMethod,
          isGroupGifting,
          couponCode: couponCode.trim() || null,
          fulfillmentType,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.orderId) {
        throw new Error(orderData?.error || "Buyurtma yaratilmadi");
      }

      const newOrderId = orderData.orderId;
      const resolvedDiscount = Number(orderData.discountAmount || 0);
      setAppliedDiscount(resolvedDiscount);
      setOrderId(newOrderId);

      if (isGroupGifting) {
        clearCart();
        router.push(`/buyurtma/guruh?orderId=${newOrderId}`);
        return;
      }

      const feeLine = fulfillmentType === "pickup" ? 0 : shopDeliveryFee;
      const subtotalNet = Math.max(0, totalPrice() - resolvedDiscount);
      const platformFeeLine = computePlatformFee(subtotalNet);
      const payAmount = subtotalNet + feeLine + platformFeeLine;
      if (paymentMethod === "wallet") {
        const walletRes = await fetch("/api/wallet", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: newOrderId }),
        });
        const walletData = await walletRes.json();
        if (!walletRes.ok) {
          throw new Error(walletData?.error || "Hamyondan to'lashda xatolik");
        }
        clearCart();
        router.push(`/buyurtma/muvaffaqiyat?orderId=${newOrderId}`);
      } else if (paymentMethod !== "cash") {
        await fetch("/api/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: newOrderId,
            method: paymentMethod,
            amount: payAmount,
            isGroupGifting,
          }),
        });
        router.push(`/buyurtma/tulov?orderId=${newOrderId}&method=${paymentMethod}`);
      } else {
        clearCart();
        router.push(`/buyurtma/muvaffaqiyat?orderId=${newOrderId}`);
      }
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Xatolik yuz berdi. Qayta urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  };

  const total = totalPrice();
  const discountValue = appliedDiscount;
  const subtotalNet = Math.max(0, total - discountValue);
  const platformFeeLine = computePlatformFee(subtotalNet);
  const feeLine = fulfillmentType === "pickup" ? 0 : shopDeliveryFee;
  const grandTotal = subtotalNet + feeLine + platformFeeLine;

  if (status === "loading") return <GlobalLoader fullScreen />;

  return (
    <div style={{ padding: "2rem 1.5rem", background: "var(--gray-50)", minHeight: "100vh" }}>
      <main className="container" style={{ maxWidth: "1000px" }}>
        {/* Header Steps */}
        <div className="checkout-steps-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2.5rem" }}>
           <h1 style={{ fontWeight: "900", letterSpacing: "-0.02em" }}>{t("title")}</h1>
           <div className="checkout-steps-track" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: step >= 1 ? "var(--teal)" : "var(--gray-400)", fontWeight: "700" }}>
                 <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: step >= 1 ? "var(--teal)" : "var(--gray-200)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem" }}>1</div>
                 <span className="hide-mobile">{t("step1")}</span>
              </div>
              <div style={{ width: "30px", height: "2px", background: step >= 2 ? "var(--teal)" : "var(--gray-200)" }} />
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: step >= 2 ? "var(--teal)" : "var(--gray-400)", fontWeight: "700" }}>
                 <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: step >= 2 ? "var(--teal)" : "var(--gray-200)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem" }}>2</div>
                 <span className="hide-mobile">{t("step2")}</span>
              </div>
              <div style={{ width: "30px", height: "2px", background: step >= 3 ? "var(--teal)" : "var(--gray-200)" }} />
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: step >= 3 ? "var(--teal)" : "var(--gray-400)", fontWeight: "700" }}>
                 <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: step >= 3 ? "var(--teal)" : "var(--gray-200)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem" }}>3</div>
                 <span className="hide-mobile">{t("step3")}</span>
              </div>
           </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "2rem" }} className="checkout-main-grid">
          {/* Left Content Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
             
             {/* STEP 1: Delivery details */}
             {step === 1 && (
               <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} style={{ background: "white", borderRadius: "24px", padding: "2rem", boxShadow: "var(--shadow-sm)" }}>
                 <h2 style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.25rem", fontWeight: "800" }}>
                    <MapPin size={20} color="var(--teal)" /> {t("step1")}
                 </h2>

                 <div style={{ marginBottom: "1.75rem" }}>
                   <div style={{ fontSize: "0.75rem", fontWeight: "800", color: "var(--gray-500)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem" }}>Yetkazib berish usuli</div>
                   <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.85rem" }}>
                     {[
                       { id: "pickup" as const, icon: <Store size={22} />, title: FULFILLMENT_UZ.pickup, desc: "Buyurtmani do'kondan o'zingiz olib ketasiz.", disabled: shopInfo?.pickup_available === 0 },
                       { id: "shop_delivery" as const, icon: <Truck size={22} />, title: FULFILLMENT_UZ.shop_delivery, desc: "Do'kon buyurtmani qabul qiluvchiga yetkazadi.", disabled: shopInfo?.shop_delivery_available === 0 },
                     ].map((opt) => (
                       <button
                         key={opt.id}
                         type="button"
                         disabled={!!opt.disabled}
                         onClick={() => !opt.disabled && setFulfillmentType(opt.id)}
                         style={{
                           textAlign: "left",
                           padding: "1.15rem 1.2rem",
                           borderRadius: "16px",
                           border: fulfillmentType === opt.id ? "2px solid var(--teal)" : "2px solid var(--gray-100)",
                           background: fulfillmentType === opt.id ? "var(--teal-pale)" : "white",
                           cursor: opt.disabled ? "not-allowed" : "pointer",
                           opacity: opt.disabled ? 0.45 : 1,
                           display: "flex",
                           flexDirection: "column",
                           gap: "0.4rem",
                         }}
                       >
                         <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: "800", color: "var(--dark)" }}>
                           <span style={{ color: "var(--teal)" }}>{opt.icon}</span> {opt.title}
                         </div>
                         <div style={{ fontSize: "0.82rem", color: "var(--gray-600)", lineHeight: 1.35 }}>{opt.desc}</div>
                         {opt.disabled && <span style={{ fontSize: "0.72rem", fontWeight: "700", color: "var(--red)" }}>Hozir mavjud emas</span>}
                       </button>
                     ))}
                     <div
                       style={{
                         padding: "1.15rem 1.2rem",
                         borderRadius: "16px",
                         border: "2px dashed var(--gray-200)",
                         background: "linear-gradient(135deg, #fafafa 0%, #f3f4f6 100%)",
                         opacity: 0.92,
                         position: "relative",
                       }}
                     >
                       <div style={{ position: "absolute", top: "10px", right: "12px", fontSize: "0.65rem", fontWeight: "900", color: "var(--gray-500)", background: "white", padding: "0.2rem 0.5rem", borderRadius: "999px", border: "1px solid var(--gray-200)" }}>Tez kunda</div>
                       <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: "800", color: "var(--gray-500)" }}>
                         <Sparkles size={22} color="var(--gray-400)" /> {FULFILLMENT_UZ.courier_platform}
                       </div>
                       <div style={{ fontSize: "0.82rem", color: "var(--gray-500)", lineHeight: 1.35, marginTop: "0.35rem" }}>Platforma kuryeri orqali yetkazib berish keyingi yangilanishda ochiladi.</div>
                     </div>
                   </div>
                 </div>

                 {shopInfo?.default_preparation_time && (
                   <div style={{ marginBottom: "1.25rem", padding: "0.85rem 1rem", borderRadius: "12px", background: "var(--gray-50)", fontSize: "0.88rem", fontWeight: "600", color: "var(--gray-700)" }}>
                     ⏱ Taxminiy tayyorlanish: <strong style={{ color: "var(--teal)" }}>{shopInfo.default_preparation_time}</strong>
                   </div>
                 )}

                 {fulfillmentType === "pickup" && shopInfo && (
                   <div style={{ marginBottom: "1.5rem", padding: "1.25rem", borderRadius: "16px", border: "1px solid var(--teal)", background: "var(--teal-pale)" }}>
                     <div style={{ fontWeight: "900", marginBottom: "0.35rem", color: "var(--teal-dark)" }}>Do&apos;kon manzili</div>
                     <div style={{ fontSize: "0.95rem", fontWeight: "700", lineHeight: 1.45 }}>
                       {shopInfo.name}
                       {shopInfo.address ? ` — ${shopInfo.address}` : ""}
                       {shopInfo.city_name ? ` (${shopInfo.city_name})` : ""}
                     </div>
                     {shopInfo.pickup_instructions ? (
                       <div style={{ marginTop: "0.75rem", fontSize: "0.88rem", color: "var(--gray-700)" }}>
                         <strong>Olib ketish:</strong> {shopInfo.pickup_instructions}
                       </div>
                     ) : null}
                   </div>
                 )}
                 
                  {/* Kichik xarita — faqat do'kon yetkazishi */}
                 {fulfillmentType === "shop_delivery" && (
                 <div style={{ background: "var(--teal-pale)", borderRadius: "16px", padding: "1.5rem", marginBottom: "2rem", border: "1px dashed var(--teal)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                       <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Map size={24} color="var(--teal)" />
                       </div>
                       <div>
                          <div style={{ fontWeight: "800", color: "var(--teal)", marginBottom: "0.2rem" }}>{t("pinOnMap") || "Xaritada belgilash"}</div>
                          <div style={{ fontSize: "0.85rem", color: "var(--teal)", opacity: 0.8 }}>Manzilni aniqroq ko'rsatish ustunlik beradi</div>
                       </div>
                    </div>
                    <button type="button" onClick={handleGetLocation} className="btn btn-primary btn-sm" disabled={gettingLocation}>
                       <Navigation size={14} /> {gettingLocation ? (t("fetchingLocation") || "Aniqlanmoqda...") : (t("useLocation") || "Joylashuvni aniqlash")}
                    </button>
                    <div
                      ref={mapContainerRef}
                      style={{
                        width: "100%",
                        height: "220px",
                        borderRadius: "12px",
                        overflow: "hidden",
                        border: "1px solid var(--gray-200)",
                      }}
                    />
                    {pickedLocation && (
                      <div style={{ fontSize: "0.82rem", color: "var(--teal)" }}>
                        Tanlangan nuqta: {pickedLocation.lat.toFixed(5)}, {pickedLocation.lng.toFixed(5)}
                        {" "}— quyidagi maydonlarni tahrirlashingiz mumkin.
                      </div>
                    )}
                    {geoStatus === "loading" && (
                      <div style={{ fontSize: "0.8rem", color: "var(--gray-500)" }}>
                        Manzil ma'lumotlari xaritadan olinmoqda...
                      </div>
                    )}
                    {geoStatus === "fallback" && (
                      <div style={{ fontSize: "0.8rem", color: "var(--orange)" }}>
                        Avtomatik topilmadi. Ko'cha va shaharni qo'lda kiritsangiz ham buyurtma davom etadi.
                      </div>
                    )}
                 </div>
                 )}

                 <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                   <div className="form-group">
                     <label className="form-label">{t("recipientName")} *</label>
                     <input className="form-input" style={{ width: "100%" }} value={delivery.recipientName} onChange={e => setDelivery(p => ({ ...p, recipientName: e.target.value }))} />
                     {errors.recipientName && <div style={{ color: "var(--red)", fontSize: "0.75rem", marginTop: "0.25rem" }}>{errors.recipientName}</div>}
                   </div>
                   <div className="form-group">
                     <label className="form-label">{t("recipientPhone")} *</label>
                     <input className="form-input" style={{ width: "100%" }} value={delivery.recipientPhone} onChange={e => setDelivery(p => ({ ...p, recipientPhone: e.target.value }))} placeholder="+998 90 123 45 67" />
                     {errors.recipientPhone && <div style={{ color: "var(--red)", fontSize: "0.75rem", marginTop: "0.25rem" }}>{errors.recipientPhone}</div>}
                   </div>
                 </div>

                 {fulfillmentType === "shop_delivery" && (
                 <>
                 <div className="form-group" style={{ marginBottom: "1rem" }}>
                   <label className="form-label">{t("city")} *</label>
                   <div className="form-input" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--teal-pale)", borderColor: "rgba(30,86,76,0.18)" }}>
                     <span style={{ fontWeight: "700", color: "var(--teal-dark)" }}>{LAUNCH_CITY_LABEL}</span>
                     <span style={{ fontSize: "0.8rem", color: "var(--teal)", fontWeight: "700" }}>Faol shahar</span>
                   </div>
                   {errors.cityId && <div style={{ color: "var(--red)", fontSize: "0.75rem", marginTop: "0.25rem" }}>{errors.cityId}</div>}
                 </div>

                 <div className="form-group" style={{ marginBottom: "1rem" }}>
                    <label className="form-label">{t("street") || "Ko'cha va uy raqami"} *</label>
                    <input className="form-input" style={{ width: "100%" }} value={delivery.street} onChange={e => setDelivery(p => ({ ...p, street: e.target.value }))} placeholder="Mustaqillik shoh ko'chasi, 12-uy" />
                    {errors.street && <div style={{ color: "var(--red)", fontSize: "0.75rem", marginTop: "0.25rem" }}>{errors.street}</div>}
                 </div>

                 <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.5rem" }} className="address-grid">
                    <div className="form-group">
                       <label className="form-label" style={{ fontSize: "0.75rem" }}>{t("apartment") || "Xonadon"}</label>
                       <input className="form-input" style={{ width: "100%" }} value={delivery.apartment} onChange={e => setDelivery(p => ({ ...p, apartment: e.target.value }))} placeholder="1" />
                    </div>
                    <div className="form-group">
                       <label className="form-label" style={{ fontSize: "0.75rem" }}>{t("entrance") || "Yo'lak"}</label>
                       <input className="form-input" style={{ width: "100%" }} value={delivery.entrance} onChange={e => setDelivery(p => ({ ...p, entrance: e.target.value }))} placeholder="2" />
                    </div>
                    <div className="form-group">
                       <label className="form-label" style={{ fontSize: "0.75rem" }}>{t("floor") || "Qavat"}</label>
                       <input className="form-input" style={{ width: "100%" }} value={delivery.floor} onChange={e => setDelivery(p => ({ ...p, floor: e.target.value }))} placeholder="3" />
                    </div>
                    <div className="form-group">
                       <label className="form-label" style={{ fontSize: "0.75rem" }}>{t("intercom") || "Domofon"}</label>
                       <input className="form-input" style={{ width: "100%" }} value={delivery.intercom} onChange={e => setDelivery(p => ({ ...p, intercom: e.target.value }))} placeholder="1B" />
                    </div>
                 </div>

                 <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                   <div className="form-group">
                     <label className="form-label">Yetkazib berish sanasi *</label>
                     <input type="date" className="form-input" style={{ width: "100%" }} value={delivery.deliveryDate} onChange={e => setDelivery(p => ({ ...p, deliveryDate: e.target.value }))} />
                     {errors.deliveryDate && <div style={{ color: "var(--red)", fontSize: "0.75rem", marginTop: "0.25rem" }}>{errors.deliveryDate}</div>}
                   </div>
                   <div className="form-group">
                     <label className="form-label">Yetkazib berish vaqti *</label>
                     <input type="time" className="form-input" style={{ width: "100%" }} value={delivery.deliveryTimeOnly} onChange={e => setDelivery(p => ({ ...p, deliveryTimeOnly: e.target.value }))} />
                     {errors.deliveryTimeOnly && <div style={{ color: "var(--red)", fontSize: "0.75rem", marginTop: "0.25rem" }}>{errors.deliveryTimeOnly}</div>}
                   </div>
                 </div>
                 </>
                 )}

                 <div className="form-group" style={{ marginBottom: "2rem" }}>
                   <label className="form-label">{t("note")}</label>
                   <textarea className="form-input" style={{ width: "100%", minHeight: "80px" }} value={delivery.note} onChange={e => setDelivery(p => ({ ...p, note: e.target.value }))} placeholder="Kuryer uchun qo'shimcha ma'lumotlar..." />
                 </div>

                 {/* Video Tabriknoma / QR Code */}
                 <div style={{ background: "var(--teal-pale)", borderRadius: "16px", padding: "1.5rem", marginBottom: "2rem", border: "1px solid var(--teal)" }}>
                   <h3 style={{ fontWeight: "800", color: "var(--teal)", marginBottom: "0.5rem", fontSize: "1.1rem" }}>🎁 Maxsus Tabriknoma (QR Kod orqali)</h3>
                   <p style={{ fontSize: "0.85rem", color: "var(--gray-600)", marginBottom: "1rem" }}>
                     Sovg'a qutisiga QR kod yopishtiramiz. Qabul qiluvchi uni skaner qilsa, sizning tabrigingiz yoki videongiz ochiladi!
                   </p>
                   <div className="form-group" style={{ marginBottom: "1rem" }}>
                     <label className="form-label">Tabrik matni (ixtiyoriy)</label>
                     <textarea className="form-input" style={{ width: "100%", minHeight: "60px" }} value={delivery.greetingText} onChange={e => setDelivery(p => ({ ...p, greetingText: e.target.value }))} placeholder="Tug'ilgan kuning bilan!..." />
                   </div>
                   <div className="form-group">
                     <label className="form-label">Video yoki rasm havolasi (YouTube, Google Drive va h.k.)</label>
                     <input type="url" className="form-input" style={{ width: "100%", marginBottom: "0.5rem" }} value={delivery.greetingUrl} onChange={e => setDelivery(p => ({ ...p, greetingUrl: e.target.value }))} placeholder="https://youtube.com/..." />
                     <div style={{ fontSize: "0.85rem", color: "var(--gray-500)", marginBottom: "0.5rem", textAlign: "center" }}>YOKI</div>
                     <label className="btn btn-outline" style={{ width: "100%", display: "flex", justifyContent: "center", cursor: "pointer" }}>
                       {greetingUploading ? "Yuklanmoqda..." : "Videoni to'g'ridan-to'g'ri yuklash (Max 50MB)"}
                       <input type="file" accept="video/mp4,video/webm,video/quicktime" style={{ display: "none" }} onChange={handleVideoUpload} disabled={greetingUploading} />
                     </label>
                   </div>
                 </div>

                 <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button onClick={handleDeliveryNext} className="btn btn-primary btn-lg">Davom etish <ArrowRight size={18} /></button>
                 </div>
               </motion.div>
             )}

             {/* STEP 2: Payment */}
             {step === 2 && (
               <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ background: "white", borderRadius: "24px", padding: "2rem", boxShadow: "var(--shadow-sm)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
                     <button onClick={() => setStep(1)} className="btn btn-ghost" style={{ padding: "0.5rem" }}><ChevronLeft size={20} /></button>
                     <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.25rem", fontWeight: "800", margin: 0 }}>
                        <CreditCard size={20} color="var(--teal)" /> {t("paymentMethod")}
                     </h2>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
                     {[
                       { id: "wallet", name: "Hamyon", label: `Hamyon (${formatPrice(walletBalance)})` },
                       { id: "p2p_transfer", name: "P2P", label: t("p2p_transfer") || "Karta o'tkazmasi" }, 
                       { id: "cash", name: "Naqd", label: t("cash") || "Naqd" } 
                     ].map(method => (
                        <div 
                          key={method.id} 
                          onClick={() => { setPaymentMethod(method.id); setIsGroupGifting(false); }}
                          style={{ 
                             padding: "1.5rem", borderRadius: "16px", border: paymentMethod === method.id && !isGroupGifting ? "2px solid var(--teal)" : "2px solid var(--gray-100)",
                             background: paymentMethod === method.id && !isGroupGifting ? "var(--teal-pale)" : "white", cursor: "pointer",
                             display: "flex", alignItems: "center", gap: "1rem", transition: "all 0.2s"
                          }}
                        >
                           <div style={{ width: "24px", height: "24px", borderRadius: "50%", border: paymentMethod === method.id && !isGroupGifting ? "6px solid var(--teal)" : "2px solid var(--gray-300)" }} />
                           <div style={{ fontWeight: "700", fontSize: "1.1rem" }}>{method.label}</div>
                        </div>
                     ))}
                     
                     {/* Group Gifting Option */}
                     <div 
                        onClick={() => { setIsGroupGifting(true); setPaymentMethod("p2p_transfer"); }}
                        style={{ 
                           padding: "1.5rem", borderRadius: "16px", border: isGroupGifting ? "2px solid var(--gold)" : "2px solid var(--gray-100)",
                           background: isGroupGifting ? "var(--gold-pale)" : "white", cursor: "pointer",
                           display: "flex", alignItems: "center", gap: "1rem", transition: "all 0.2s"
                        }}
                      >
                         <div style={{ width: "24px", height: "24px", borderRadius: "50%", border: isGroupGifting ? "6px solid var(--gold)" : "2px solid var(--gray-300)" }} />
                         <div>
                           <div style={{ fontWeight: "800", fontSize: "1.1rem", color: "var(--gold-dark)" }}>Birgalikda yig'ish (Crowdfunding)</div>
                           <div style={{ fontSize: "0.85rem", color: "var(--gray-600)", marginTop: "0.25rem" }}>Do'stlaringiz bilan birgalikda to'lov qiling. Maxsus havola beriladi.</div>
                         </div>
                      </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button onClick={handlePlaceOrder} className="btn btn-primary btn-lg" disabled={loading}>
                       {loading ? "..." : (t("confirm") || "Buyurtmani tasdiqlash")} <CheckCircle size={18} />
                    </button>
                 </div>
               </motion.div>
             )}
          </div>

          {/* Right Summary Column */}
          <div>
            <div style={{ background: "white", borderRadius: "24px", padding: "2rem", boxShadow: "var(--shadow-xs)", position: "sticky", top: "2rem" }}>
               <h3 style={{ marginBottom: "1.5rem", fontWeight: "800", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.1rem" }}>
                  <Package size={20} /> {t("orderSummary")}
               </h3>
               
               <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem", maxHeight: "300px", overflowY: "auto" }}>
                  {items.map(item => (
                    <div key={item.productId} style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                      <img src={item.imageUrl || `https://picsum.photos/seed/${item.productId}/80/80`} alt={item.title} style={{ width: "50px", height: "50px", borderRadius: "8px", objectFit: "cover" }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: "700", fontSize: "0.85rem" }}>{item.title}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--gray-400)" }}>{item.quantity} x {formatPrice(item.price)}</div>
                      </div>
                      <div style={{ fontWeight: "800", fontSize: "0.9rem" }}>{formatPrice(item.price * item.quantity)}</div>
                    </div>
                  ))}
               </div>

               <div style={{ borderTop: "1px dashed var(--gray-200)", paddingTop: "1.5rem", marginBottom: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <input
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value.toUpperCase());
                        setAppliedDiscount(0);
                        setCouponMessage("");
                      }}
                      className="form-input"
                      placeholder="Promo kod (masalan: WELCOME10)"
                      style={{ width: "100%" }}
                    />
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={handleApplyCoupon}
                      disabled={couponApplying}
                      style={{ whiteSpace: "nowrap" }}
                    >
                      {couponApplying ? "..." : "Qo'llash"}
                    </button>
                  </div>
                  {!!couponMessage && (
                    <div
                      style={{
                        fontSize: "0.8rem",
                        color: appliedDiscount > 0 ? "var(--green)" : "var(--red)",
                      }}
                    >
                      {couponMessage}
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", color: "var(--gray-600)" }}>
                     <span>{tCommon("category")} x{items.reduce((s, i) => s + i.quantity, 0)}</span>
                     <span style={{ fontWeight: "600", color: "var(--dark)" }}>{formatPrice(total)}</span>
                  </div>
                  {!!discountValue && (
                    <div style={{ display: "flex", justifyContent: "space-between", color: "var(--green)" }}>
                      <span>Chegirma</span>
                      <span style={{ fontWeight: "700" }}>- {formatPrice(discountValue)}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", color: "var(--gray-600)" }}>
                     <span>{fulfillmentType === "pickup" ? "Olib ketish" : "Eltib berish xizmati"}</span>
                     <span style={{ fontWeight: "600", color: "var(--dark)" }}>{formatPrice(feeLine)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "var(--gray-600)" }}>
                    <span>Platforma xizmati (5%)</span>
                    <span style={{ fontWeight: "600", color: "var(--dark)" }}>{formatPrice(platformFeeLine)}</span>
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--gray-500)", lineHeight: 1.35, marginTop: "-0.35rem" }}>
                    Chegirmadan keyingi mahsulot summasidan 5% (admin / platforma haqi)
                  </div>
               </div>

               <div style={{ background: "var(--gray-50)", borderRadius: "12px", padding: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: "800", fontSize: "1.1rem" }}>Jami to'lov</span>
                  <span style={{ fontWeight: "900", fontSize: "1.3rem", color: "var(--gold-dark)" }}>{formatPrice(grandTotal)}</span>
               </div>
            </div>
          </div>
        </div>
      </main>
      <style>{`
        @media(max-width:900px){ 
           .checkout-main-grid { grid-template-columns: 1fr !important; }
           .hide-mobile { display: none; }
           .checkout-steps-head {
             flex-direction: column;
             align-items: flex-start !important;
             gap: 0.85rem;
             margin-bottom: 1.4rem !important;
           }
           .checkout-steps-track {
             width: 100%;
             overflow-x: auto;
             padding-bottom: 0.2rem;
             gap: 0.6rem !important;
           }
        }
        @media(max-width:500px){
           .address-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </div>
  );
}
