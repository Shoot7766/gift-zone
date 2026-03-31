// Formatting helpers
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("uz-UZ").format(Math.round(amount)) + " so'm";
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("uz-UZ", {
    year: "numeric", month: "long", day: "numeric",
  });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("uz-UZ", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

export function generateId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function truncate(str: string, maxLen: number): string {
  return str.length <= maxLen ? str : str.slice(0, maxLen) + "...";
}

export const DELIVERY_FEE = 20000;
export const LAUNCH_CITY_NAME = "Zarafshon";
export const LAUNCH_CITY_LABEL = "Zarafshon shahri";

/** Platform komissiyasi: mahsulotlar summasidan (total_amount) 5% */
export const PLATFORM_FEE_RATE = 0.05;

export function computePlatformFee(subtotalAmount: number): number {
  return Math.round(subtotalAmount * PLATFORM_FEE_RATE);
}

export function computeShopPayoutFromSubtotal(subtotalAmount: number): number {
  return Math.max(0, subtotalAmount - computePlatformFee(subtotalAmount));
}

/** Mijoz to'lashi kerak bo'lgan jami: mahsulot (chegirmadan keyin) + yetkazish + 5% platforma haqi */
export function getOrderGrossTotal(order: {
  total_amount: number;
  delivery_fee?: number | null;
  platform_fee?: number | null;
}): number {
  const df =
    typeof order.delivery_fee === "number" && !Number.isNaN(order.delivery_fee)
      ? order.delivery_fee
      : 0;
  const pf =
    order.platform_fee != null && order.platform_fee > 0
      ? order.platform_fee
      : computePlatformFee(order.total_amount);
  return order.total_amount + df + pf;
}

export const FULFILLMENT_UZ: Record<string, string> = {
  pickup: "Do'kondan olib ketish",
  shop_delivery: "Do'kon yetkazib beradi",
  courier_platform: "Kuryer / platforma",
};

export const ORDER_STATUS_UZ: Record<string, string> = {
  pending:            "Kutilmoqda",
  accepted:           "Qabul qilindi",
  preparing:          "Tayyorlanmoqda",
  ready_for_pickup:   "Olib ketishga tayyor",
  out_for_delivery:   "Yo'lda",
  delivered:          "Yetkazildi",
  cancelled:          "Bekor qilindi",
};

// CSS class-based colors for status badges (using inline style instead of Tailwind)
export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending:            "badge-orange",
  accepted:           "badge-blue",
  preparing:          "badge-purple",
  ready_for_pickup:   "badge-blue",
  out_for_delivery:   "badge-orange",
  delivered:          "badge-green",
  cancelled:          "badge-red",
};

export const ORDER_STATUS_BG: Record<string, { bg: string; color: string }> = {
  pending:            { bg: "#FEF3C7", color: "#92400E" },
  accepted:           { bg: "#DBEAFE", color: "#1E40AF" },
  preparing:          { bg: "#EDE9FE", color: "#5B21B6" },
  ready_for_pickup:   { bg: "#CCFBF1", color: "#115E59" },
  out_for_delivery:   { bg: "#FFEDD5", color: "#9A3412" },
  delivered:          { bg: "#D1FAE5", color: "#065F46" },
  cancelled:          { bg: "#FEE2E2", color: "#991B1B" },
};

export const PAYMENT_STATUS_UZ: Record<string, string> = {
  unpaid:   "To'lanmagan",
  paid:     "To'langan",
  refunded: "Qaytarilgan",
};

export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  unpaid:   "badge-red",
  paid:     "badge-green",
  refunded: "badge-gray",
};

export const PAYMENT_STATUS_BG: Record<string, { bg: string; color: string }> = {
  unpaid:   { bg: "#FEE2E2", color: "#991B1B" },
  paid:     { bg: "#D1FAE5", color: "#065F46" },
  refunded: { bg: "#F3F4F6", color: "#4B5563" },
};
