import { NextRequest, NextResponse } from "next/server";
import { db, initDb } from "@/db";
import { auth } from "@/lib/auth";

try {
  initDb();
} catch {}

type CartLine = {
  id: string;
  productId: string;
  title: string;
  price: number;
  imageUrl: string;
  shopId: string;
  shopName: string;
  quantity: number;
  preparationTime?: string;
};

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "customer") {
      return NextResponse.json({ error: "Kirish talab etiladi" }, { status: 401 });
    }

    const body = await req.json();
    const orderId = body.orderId as string | undefined;
    if (!orderId) {
      return NextResponse.json({ error: "orderId kerak" }, { status: 400 });
    }

    const order = db.$client
      .prepare(
        `SELECT o.id, o.shop_id, o.recipient_name, o.recipient_phone, o.delivery_address,
                o.delivery_city_id, o.delivery_time, o.note, s.name as shop_name
         FROM orders o
         JOIN shops s ON o.shop_id = s.id
         WHERE o.id = ? AND o.customer_id = ?`
      )
      .get(orderId, session.user.id) as
      | {
          id: string;
          shop_id: string;
          recipient_name: string;
          recipient_phone: string;
          delivery_address: string;
          delivery_city_id: number | null;
          delivery_time: string | null;
          note: string | null;
          shop_name: string;
        }
      | undefined;

    if (!order) {
      return NextResponse.json({ error: "Buyurtma topilmadi" }, { status: 404 });
    }

    const rawItems = db.$client
      .prepare(
        `SELECT oi.product_id, oi.title, oi.price, oi.quantity, oi.image_url,
                p.title as product_title, p.price as product_price, p.preparation_time,
                p.is_active, pi.url as primary_image
         FROM order_items oi
         LEFT JOIN products p ON oi.product_id = p.id
         LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = 1
         WHERE oi.order_id = ?`
      )
      .all(orderId) as {
      product_id: string | null;
      title: string;
      price: number;
      quantity: number;
      image_url: string | null;
      product_title: string | null;
      product_price: number | null;
      preparation_time: string | null;
      is_active: number | null;
      primary_image: string | null;
    }[];

    const cartItems: CartLine[] = [];
    const skipped: string[] = [];

    for (const row of rawItems) {
      if (!row.product_id || row.is_active !== 1) {
        skipped.push(row.title);
        continue;
      }

      const title = row.product_title || row.title;
      const price = row.product_price ?? row.price;
      const imageUrl =
        row.primary_image ||
        row.image_url ||
        `https://picsum.photos/seed/${row.product_id}/400/300`;

      cartItems.push({
        id: row.product_id,
        productId: row.product_id,
        title,
        price,
        imageUrl,
        shopId: order.shop_id,
        shopName: order.shop_name,
        quantity: row.quantity,
        preparationTime: row.preparation_time || undefined,
      });
    }

    if (cartItems.length === 0) {
      return NextResponse.json(
        { error: "Buyurtmadagi mahsulotlar hozir mavjud emas", skipped },
        { status: 400 }
      );
    }

    return NextResponse.json({
      cartItems,
      shopId: order.shop_id,
      prefill: {
        recipientName: order.recipient_name,
        recipientPhone: order.recipient_phone,
        cityId: order.delivery_city_id != null ? String(order.delivery_city_id) : "",
        street: order.delivery_address,
        apartment: "",
        entrance: "",
        floor: "",
        intercom: "",
        deliveryTime: order.delivery_time || "",
        note: order.note || "",
      },
      skipped: skipped.length ? skipped : undefined,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Xatolik" }, { status: 500 });
  }
}
