import { NextRequest } from "next/server";
import { db, initDb } from "@/db";
import { auth } from "@/lib/auth";
import { generateId, DELIVERY_FEE, formatPrice, computePlatformFee } from "@/lib/utils";
import { sendTelegramMessage } from "@/lib/telegram";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { apiError, apiSuccess } from "@/lib/apiResponse";

try { initDb(); } catch {}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return apiError("Kirish talab etiladi", 401, "UNAUTHORIZED");

    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get("shopId");
    const status = searchParams.get("status");

    let query = `
      SELECT o.*, 
        u.name as customer_name, u.email as customer_email, u.phone as customer_phone,
        s.name as shop_name,
        ci.name as city_name
      FROM orders o
      LEFT JOIN users u ON o.customer_id = u.id
      LEFT JOIN shops s ON o.shop_id = s.id
      LEFT JOIN cities ci ON o.delivery_city_id = ci.id
      WHERE 1=1
    `;
    const params: string[] = [];

    if (session.user.role === "customer") {
      query += " AND o.customer_id = ?";
      params.push(session.user.id);
    } else if (session.user.role === "provider" && shopId) {
      query += " AND o.shop_id = ?";
      params.push(shopId);
    } else if (session.user.role === "admin") {
      if (shopId) { query += " AND o.shop_id = ?"; params.push(shopId); }
    }

    if (status) { query += " AND o.status = ?"; params.push(status); }
    query += " ORDER BY o.created_at DESC";

    const orders = db.$client.prepare(query).all(...params);

    // Attach items + payments (birgalikda to'lov progress va mijozda shkala uchun)
    const ordersWithItems = orders.map((order: unknown) => {
      const o = order as { id: string };
      const items = db.$client.prepare("SELECT * FROM order_items WHERE order_id = ?").all(o.id);
      const payments = db.$client.prepare("SELECT * FROM payments WHERE order_id = ?").all(o.id);
      return { ...o, items, payments };
    });

    return apiSuccess({ orders: ordersWithItems });
  } catch (e) {
    console.error(e);
    return apiError("Xatolik");
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return apiError("Kirish talab etiladi", 401, "UNAUTHORIZED");

    const rate = checkRateLimit(
      `orders:create:${session.user.id}:${getClientIp(req)}`,
      20,
      10 * 60 * 1000
    );
    if (!rate.ok) {
      return apiError(
        "Juda ko'p buyurtma urinishlari. Keyinroq qayta urinib ko'ring.",
        429,
        "RATE_LIMIT"
      );
    }

    const body = await req.json();
    const {
      shopId, items, recipientName, recipientPhone,
      deliveryAddress, deliveryCityId, deliveryTime, deliveryDate,
      note, greetingText, greetingUrl, paymentMethod, isGroupGifting, couponCode, deliveryLat, deliveryLng,
      fulfillmentType: fulfillmentTypeRaw,
    } = body;

    const fulfillmentType =
      fulfillmentTypeRaw === "pickup" || fulfillmentTypeRaw === "shop_delivery"
        ? fulfillmentTypeRaw
        : "";

    if (fulfillmentTypeRaw === "courier_platform") {
      return apiError(
        "Kuryer orqali yetkazib berish tez orada ochiladi. Hozircha boshqa usulni tanlang.",
        400,
        "FULFILLMENT_UNAVAILABLE"
      );
    }

    if (!fulfillmentType) {
      return apiError("Yetkazib berish usulini tanlang", 400, "VALIDATION_ERROR");
    }

    if (!shopId || !items?.length || !recipientName || !recipientPhone) {
      return apiError("Majburiy maydonlar to'ldirilmagan", 400, "VALIDATION_ERROR");
    }

    const shop = db.$client
      .prepare(`
        SELECT s.id, s.name, s.delivery_fee, s.address, s.city_id, s.pickup_available, s.shop_delivery_available,
          s.delivery_area_city_ids, s.default_preparation_time, s.pickup_instructions,
          ci.name as shop_city_name
        FROM shops s
        LEFT JOIN cities ci ON s.city_id = ci.id
        WHERE s.id = ? AND s.is_active = 1
      `)
      .get(shopId) as
      | {
          id: string;
          name: string;
          delivery_fee: number | null;
          address: string | null;
          city_id: number | null;
          pickup_available: number | null;
          shop_delivery_available: number | null;
          delivery_area_city_ids: string | null;
          default_preparation_time: string | null;
          pickup_instructions: string | null;
          shop_city_name: string | null;
        }
      | undefined;
    if (!shop) {
      return apiError("Do'kon topilmadi", 404, "NOT_FOUND");
    }

    if (fulfillmentType === "pickup" && !shop.pickup_available) {
      return apiError("Bu do'kon uchun olib ketish hozir mavjud emas", 400, "PICKUP_DISABLED");
    }
    if (fulfillmentType === "shop_delivery" && !shop.shop_delivery_available) {
      return apiError("Do'kon yetkazib berishi hozir o'chirilgan", 400, "SHOP_DELIVERY_DISABLED");
    }

    const cityIdNum =
      deliveryCityId !== undefined && deliveryCityId !== null && deliveryCityId !== ""
        ? parseInt(String(deliveryCityId), 10)
        : NaN;
    const hasCity = Number.isFinite(cityIdNum);

    if (fulfillmentType === "shop_delivery") {
      if (!deliveryAddress || !String(deliveryAddress).trim()) {
        return apiError("Yetkazib berish manzili kiritilishi shart", 400, "VALIDATION_ERROR");
      }
      if (!hasCity) {
        return apiError("Yetkazib berish shahri tanlanishi shart", 400, "VALIDATION_ERROR");
      }
      if (!deliveryDate || !String(deliveryDate).trim()) {
        return apiError("Yetkazib berish sanasi kiritilishi shart", 400, "VALIDATION_ERROR");
      }
    }

    const areaRaw = shop.delivery_area_city_ids?.trim();
    if (fulfillmentType === "shop_delivery" && areaRaw) {
      const allowed = areaRaw.split(",").map((s) => s.trim()).filter(Boolean);
      if (allowed.length && hasCity && !allowed.includes(String(cityIdNum))) {
        return apiError("Tanlangan shaharga bu do'kon yetkazib bermaydi", 400, "DELIVERY_AREA");
      }
    }

    let resolvedDeliveryAddress = String(deliveryAddress || "").trim();
    if (fulfillmentType === "pickup") {
      const parts = [
        shop.name ? `Do'kon: ${shop.name}` : null,
        shop.address?.trim() || null,
        shop.shop_city_name || null,
      ].filter(Boolean);
      resolvedDeliveryAddress = parts.join(" · ") || "Do'kondan olib ketish";
    }

    const baseDeliveryFee =
      typeof shop.delivery_fee === "number" && !Number.isNaN(shop.delivery_fee)
        ? shop.delivery_fee
        : DELIVERY_FEE;
    const deliveryFee = fulfillmentType === "pickup" ? 0 : baseDeliveryFee;

    const resolvedDeliveryDate =
      fulfillmentType === "shop_delivery" && deliveryDate
        ? String(deliveryDate).trim()
        : null;

    type RequestItem = {
      productId: string;
      quantity: number;
      imageUrl?: string;
      title?: string;
      price?: number;
    };
    const normalizedItems = (items as RequestItem[])
      .filter((item) => item?.productId && Number.isFinite(item.quantity) && item.quantity > 0)
      .map((item) => ({
        productId: item.productId,
        quantity: Math.floor(item.quantity),
        imageUrl: item.imageUrl || null,
      }));
    if (normalizedItems.length === 0) {
      return apiError("Mahsulotlar noto'g'ri", 400, "VALIDATION_ERROR");
    }

    const productIds = normalizedItems.map((item) => item.productId);
    const placeholders = productIds.map(() => "?").join(",");
    const products = db.$client
      .prepare(`
        SELECT p.id, p.title, p.price, p.shop_id, p.stock_qty
        FROM products p
        WHERE p.is_active = 1
          AND p.shop_id = ?
          AND p.id IN (${placeholders})
      `)
      .all(shopId, ...productIds) as Array<{
        id: string;
        title: string;
        price: number;
        shop_id: string;
        stock_qty: number;
      }>;
    if (products.length !== normalizedItems.length) {
      return apiError(
        "Ba'zi mahsulotlar topilmadi yoki noto'g'ri do'konga tegishli",
        400,
        "PRODUCTS_INVALID"
      );
    }

    const productMap = new Map(products.map((product) => [product.id, product]));
    let totalAmount = 0;
    const resolvedItems = normalizedItems.map((item) => {
      const product = productMap.get(item.productId)!;
      if (product.stock_qty < item.quantity) {
        throw new Error(`OUT_OF_STOCK:${product.id}`);
      }
      const lineTotal = product.price * item.quantity;
      totalAmount += lineTotal;
      return {
        productId: product.id,
        title: product.title,
        price: product.price,
        quantity: item.quantity,
        imageUrl: item.imageUrl,
      };
    });

    const orderId = generateId();
    let discountAmount = 0;
    const normalizedCouponCode =
      couponCode && typeof couponCode === "string" ? couponCode.trim().toUpperCase() : "";

    const createOrderTx = db.$client.transaction(() => {
      if (normalizedCouponCode) {
        const coupon = db.$client
          .prepare(
            `SELECT *
             FROM coupons
             WHERE shop_id = ? AND code = ? AND is_active = 1
             LIMIT 1`
          )
          .get(shopId, normalizedCouponCode) as
          | {
              id: string;
              discount_type: "percent" | "fixed";
              discount_value: number;
              min_order_amount: number;
              max_discount_amount: number | null;
              usage_limit: number | null;
              used_count: number;
              expires_at: string | null;
            }
          | undefined;
        if (coupon) {
          const notExpired =
            !coupon.expires_at || new Date(coupon.expires_at).getTime() > Date.now();
          const underUsageLimit =
            coupon.usage_limit == null || coupon.used_count < coupon.usage_limit;
          const passesMinAmount = totalAmount >= (coupon.min_order_amount || 0);
          if (notExpired && underUsageLimit && passesMinAmount) {
            if (coupon.discount_type === "percent") {
              discountAmount = (totalAmount * coupon.discount_value) / 100;
            } else {
              discountAmount = coupon.discount_value;
            }
            if (coupon.max_discount_amount && discountAmount > coupon.max_discount_amount) {
              discountAmount = coupon.max_discount_amount;
            }
            if (discountAmount > totalAmount) discountAmount = totalAmount;
            const couponUpdate = db.$client
              .prepare(
                "UPDATE coupons SET used_count = used_count + 1 WHERE id = ? AND (usage_limit IS NULL OR used_count < usage_limit)"
              )
              .run(coupon.id);
            if (couponUpdate.changes === 0) {
              throw new Error("COUPON_LIMIT_REACHED");
            }
          }
        }
      }

      const discountedTotalAmount = Math.max(0, totalAmount - discountAmount);
      const platformFeeAtCreate = computePlatformFee(discountedTotalAmount);

      const parsedDeliveryLat =
        fulfillmentType === "shop_delivery" && Number.isFinite(Number(deliveryLat))
          ? Number(deliveryLat)
          : null;
      const parsedDeliveryLng =
        fulfillmentType === "shop_delivery" && Number.isFinite(Number(deliveryLng))
          ? Number(deliveryLng)
          : null;

      const resolvedCityId =
        fulfillmentType === "pickup"
          ? shop.city_id ?? (hasCity ? cityIdNum : null)
          : hasCity
            ? cityIdNum
            : null;

      db.$client.prepare(`
        INSERT INTO orders (id, customer_id, shop_id, total_amount, delivery_fee,
          recipient_name, recipient_phone, delivery_address, delivery_city_id,
          delivery_lat, delivery_lng, delivery_time, delivery_date, note, greeting_text, greeting_url, payment_method, is_group_gifting,
          fulfillment_type, platform_fee, payment_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'unpaid')
      `).run(
        orderId, session.user.id, shopId, discountedTotalAmount, deliveryFee,
        recipientName, recipientPhone, resolvedDeliveryAddress,
        resolvedCityId, parsedDeliveryLat, parsedDeliveryLng, deliveryTime || null, resolvedDeliveryDate,
        note || null,
        greetingText || null, greetingUrl || null,
        paymentMethod || "cash",
        isGroupGifting ? 1 : 0,
        fulfillmentType,
        platformFeeAtCreate
      );

      const itemStmt = db.$client.prepare(`
        INSERT INTO order_items (order_id, product_id, title, price, quantity, image_url)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      const stockUpdateStmt = db.$client.prepare(
        "UPDATE products SET orders_count = orders_count + 1, stock_qty = stock_qty - ? WHERE id = ? AND stock_qty >= ?"
      );

      resolvedItems.forEach((item) => {
        itemStmt.run(orderId, item.productId, item.title, item.price, item.quantity, item.imageUrl || null);
        const stockUpdated = stockUpdateStmt.run(item.quantity, item.productId, item.quantity);
        if (stockUpdated.changes === 0) {
          throw new Error(`OUT_OF_STOCK:${item.productId}`);
        }
      });
    });

    createOrderTx();
    const discountedTotalAmount = Math.max(0, totalAmount - discountAmount);

    // Send Telegram Notification
    try {
      const message = `
<b>🛍 Yangi buyurtma!</b>
ID: <code>#${orderId.slice(-8).toUpperCase()}</code>
Do'kon: <b>${shop.name || "Noma'lum"}</b>
Mijoz: ${recipientName}
Tel: ${recipientPhone}
Summa: <b>${formatPrice(discountedTotalAmount)}</b>
Usul: ${fulfillmentType === "pickup" ? "Olib ketish" : "Do'kon yetkazadi"}
Manzil: ${resolvedDeliveryAddress}
      `;
      sendTelegramMessage(message); // Async, don't wait
    } catch (err) {
      console.error("Notify error:", err);
    }

    return apiSuccess({ orderId, discountAmount });
  } catch (e) {
    console.error(e);
    if (e instanceof Error && e.message.startsWith("OUT_OF_STOCK:")) {
      return apiError("Ba'zi mahsulotlar omborda yetarli emas", 409, "OUT_OF_STOCK");
    }
    if (e instanceof Error && e.message === "COUPON_LIMIT_REACHED") {
      return apiError("Kupon limiti tugagan", 409, "COUPON_LIMIT_REACHED");
    }
    return apiError("Xatolik");
  }
}
