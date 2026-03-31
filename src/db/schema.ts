import { sql } from "drizzle-orm";
import {
  integer,
  real,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

// ─── Users ───────────────────────────────────────────────────────────────────
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  phone: text("phone"),
  role: text("role", { enum: ["customer", "provider", "admin"] })
    .notNull()
    .default("customer"),
  avatar: text("avatar"),
  walletBalance: real("wallet_balance").default(0),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

// ─── Cities ───────────────────────────────────────────────────────────────────
export const cities = sqliteTable("cities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  nameRu: text("name_ru"),
  nameEn: text("name_en"),
});

// ─── Shops ───────────────────────────────────────────────────────────────────
export const shops = sqliteTable("shops", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  logo: text("logo"),
  coverImage: text("cover_image"),
  phone: text("phone"),
  telegram: text("telegram"),
  instagram: text("instagram"),
  cityId: integer("city_id").references(() => cities.id),
  address: text("address"),
  workingHours: text("working_hours"),
  rating: real("rating").default(0),
  reviewsCount: integer("reviews_count").default(0),
  isVerified: integer("is_verified", { mode: "boolean" }).default(false),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  deliveryFee: real("delivery_fee").default(20000),
  pickupAvailable: integer("pickup_available", { mode: "boolean" }).default(true),
  shopDeliveryAvailable: integer("shop_delivery_available", { mode: "boolean" }).default(true),
  deliveryAreaCityIds: text("delivery_area_city_ids"), // comma-separated city ids; empty = all
  defaultPreparationTime: text("default_preparation_time"),
  pickupInstructions: text("pickup_instructions"),
  balance: real("balance").default(0), // [NEW] Available for withdrawal
  pendingBalance: real("pending_balance").default(0), // [NEW] From orders not yet delivered
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

// ─── Categories ───────────────────────────────────────────────────────────────
export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  nameRu: text("name_ru"),
  nameEn: text("name_en"),
  icon: text("icon"),
  image: text("image"),
  slug: text("slug").notNull().unique(),
  sortOrder: integer("sort_order").default(0),
});

export const subcategories = sqliteTable("subcategories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id),
  name: text("name").notNull(),
  nameRu: text("name_ru"),
  nameEn: text("name_en"),
  icon: text("icon"),
  image: text("image"),
  slug: text("slug").notNull().unique(),
  sortOrder: integer("sort_order").default(0),
});

// ─── Products ─────────────────────────────────────────────────────────────────
export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  shopId: text("shop_id")
    .notNull()
    .references(() => shops.id),
  categoryId: integer("category_id").references(() => categories.id),
  subcategoryId: integer("subcategory_id").references(() => subcategories.id),
  title: text("title").notNull(),
  description: text("description"),
  price: real("price").notNull(),
  stockQty: integer("stock_qty").notNull().default(0),
  lowStockThreshold: integer("low_stock_threshold").notNull().default(5),
  preparationTime: text("preparation_time"),
  cityId: integer("city_id").references(() => cities.id),
  rating: real("rating").default(0),
  reviewsCount: integer("reviews_count").default(0),
  ordersCount: integer("orders_count").default(0),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

// ─── Coupons ─────────────────────────────────────────────────────────────────
export const coupons = sqliteTable("coupons", {
  id: text("id").primaryKey(),
  shopId: text("shop_id")
    .notNull()
    .references(() => shops.id),
  code: text("code").notNull().unique(),
  discountType: text("discount_type", { enum: ["percent", "fixed"] }).notNull(),
  discountValue: real("discount_value").notNull(),
  minOrderAmount: real("min_order_amount").default(0),
  maxDiscountAmount: real("max_discount_amount"),
  usageLimit: integer("usage_limit"),
  usedCount: integer("used_count").notNull().default(0),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  expiresAt: text("expires_at"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

// ─── Quick Replies ───────────────────────────────────────────────────────────
export const quickReplies = sqliteTable("quick_replies", {
  id: text("id").primaryKey(),
  shopId: text("shop_id")
    .notNull()
    .references(() => shops.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

// ─── Broadcast Messages ──────────────────────────────────────────────────────
export const announcements = sqliteTable("announcements", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  targetRole: text("target_role", {
    enum: ["all", "customer", "provider"],
  })
    .notNull()
    .default("all"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

// ─── Admin Audit Logs ────────────────────────────────────────────────────────
export const adminAuditLogs = sqliteTable("admin_audit_logs", {
  id: text("id").primaryKey(),
  adminUserId: text("admin_user_id")
    .notNull()
    .references(() => users.id),
  actionType: text("action_type").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id"),
  note: text("note"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const aiQueries = sqliteTable("ai_queries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  query: text("query").notNull(),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

// ─── Product Images ───────────────────────────────────────────────────────────
export const productImages = sqliteTable("product_images", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: text("product_id")
    .notNull()
    .references(() => products.id),
  url: text("url").notNull(),
  isPrimary: integer("is_primary", { mode: "boolean" }).default(false),
});

// ─── Cart Items ───────────────────────────────────────────────────────────────
export const cartItems = sqliteTable("cart_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  productId: text("product_id")
    .notNull()
    .references(() => products.id),
  quantity: integer("quantity").notNull().default(1),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

// ─── Saved Items ──────────────────────────────────────────────────────────────
export const savedItems = sqliteTable("saved_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  productId: text("product_id")
    .notNull()
    .references(() => products.id),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

// ─── Orders ───────────────────────────────────────────────────────────────────
export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  customerId: text("customer_id")
    .notNull()
    .references(() => users.id),
  shopId: text("shop_id")
    .notNull()
    .references(() => shops.id),
  status: text("status", {
    enum: [
      "pending",
      "accepted",
      "preparing",
      "ready_for_pickup",
      "out_for_delivery",
      "delivered",
      "cancelled",
    ],
  })
    .notNull()
    .default("pending"),
  fulfillmentType: text("fulfillment_type", {
    enum: ["pickup", "shop_delivery", "courier_platform"],
  })
    .notNull()
    .default("shop_delivery"),
  platformFee: real("platform_fee").default(0),
  totalAmount: real("total_amount").notNull(),
  deliveryFee: real("delivery_fee").default(0),
  recipientName: text("recipient_name").notNull(),
  recipientPhone: text("recipient_phone").notNull(),
  deliveryAddress: text("delivery_address").notNull(),
  deliveryCityId: integer("delivery_city_id").references(() => cities.id),
  deliveryLat: real("delivery_lat"),
  deliveryLng: real("delivery_lng"),
  deliveryTime: text("delivery_time"),
  deliveryDate: text("delivery_date"),
  note: text("note"),
  greetingText: text("greeting_text"),
  greetingUrl: text("greeting_url"),
  paymentMethod: text("payment_method", {
    enum: ["click", "payme", "uzum", "cash", "p2p_transfer", "wallet"],
  }),
  paymentStatus: text("payment_status", { enum: ["unpaid", "paid", "refunded"] })
    .notNull()
    .default("unpaid"),
  paymentTransactionId: text("payment_transaction_id"),
  isGroupGifting: integer("is_group_gifting", { mode: "boolean" }).default(false),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
});

// ─── Order Items ──────────────────────────────────────────────────────────────
export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id),
  productId: text("product_id").references(() => products.id),
  title: text("title").notNull(),
  price: real("price").notNull(),
  quantity: integer("quantity").notNull(),
  imageUrl: text("image_url"),
});

// ─── Custom Requests ──────────────────────────────────────────────────────────
export const customRequests = sqliteTable("custom_requests", {
  id: text("id").primaryKey(),
  customerId: text("customer_id")
    .notNull()
    .references(() => users.id),
  shopId: text("shop_id").references(() => shops.id),
  description: text("description").notNull(),
  referenceImage: text("reference_image"),
  budget: real("budget"),
  deliveryDate: text("delivery_date"),
  deliveryAddress: text("delivery_address"),
  cityId: integer("city_id").references(() => cities.id),
  status: text("status", {
    enum: ["pending", "accepted", "rejected", "completed"],
  })
    .notNull()
    .default("pending"),
  providerResponse: text("provider_response"),
  quotedPrice: real("quoted_price"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

// ─── Payments ─────────────────────────────────────────────────────────────────
export const payments = sqliteTable("payments", {
  id: text("id").primaryKey(),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id),
  method: text("method", { enum: ["click", "payme", "uzum", "cash", "p2p_transfer", "wallet"] }).notNull(),
  amount: real("amount").notNull(),
  status: text("status", { enum: ["pending", "success", "failed", "refunded"] })
    .notNull()
    .default("pending"),
  transactionId: text("transaction_id"),
  proofImage: text("proof_image"), // [NEW] Added for P2P receipts
  providerResponse: text("provider_response"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const walletTransactions = sqliteTable("wallet_transactions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  type: text("type", { enum: ["topup", "order_payment", "refund", "adjustment"] }).notNull(),
  amount: real("amount").notNull(),
  status: text("status", { enum: ["pending", "success", "failed"] }).notNull().default("success"),
  orderId: text("order_id").references(() => orders.id),
  note: text("note"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

// ─── Reviews ──────────────────────────────────────────────────────────────────
export const reviews = sqliteTable("reviews", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  productId: text("product_id").references(() => products.id),
  shopId: text("shop_id").references(() => shops.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

// ─── Chats ────────────────────────────────────────────────────────────────────
export const chats = sqliteTable("chats", {
  id: text("id").primaryKey(),
  customerId: text("customer_id")
    .notNull()
    .references(() => users.id),
  shopId: text("shop_id")
    .notNull()
    .references(() => shops.id),
  lastMessage: text("last_message"),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

// ─── Messages ─────────────────────────────────────────────────────────────────
export const messages = sqliteTable("messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  chatId: text("chat_id")
    .notNull()
    .references(() => chats.id),
  senderId: text("sender_id")
    .notNull()
    .references(() => users.id),
  text: text("text").notNull(),
  isRead: integer("is_read", { mode: "boolean" }).default(false),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

// ─── User Events ──────────────────────────────────────────────────────────────
export const userEvents = sqliteTable("user_events", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  name: text("name").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD
  reminderDays: integer("reminder_days").default(7),
  isRecurring: integer("is_recurring", { mode: "boolean" }).default(true),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

// ─── Event Gifts ──────────────────────────────────────────────────────────────
export const eventGifts = sqliteTable("event_gifts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  eventId: text("event_id")
    .notNull()
    .references(() => userEvents.id, { onDelete: "cascade" }),
  productId: text("product_id")
    .notNull()
    .references(() => products.id),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

// ─── Withdrawals ──────────────────────────────────────────────────────────────
export const withdrawals = sqliteTable("withdrawals", {
  id: text("id").primaryKey(),
  shopId: text("shop_id")
    .notNull()
    .references(() => shops.id),
  amount: real("amount").notNull(),
  status: text("status", { enum: ["pending", "completed", "rejected"] })
    .notNull()
    .default("pending"),
  bankCard: text("bank_card").notNull(),
  bankName: text("bank_name"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
});


// ─── Types ────────────────────────────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type Shop = typeof shops.$inferSelect;
export type Product = typeof products.$inferSelect;
export type ProductImage = typeof productImages.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type CustomRequest = typeof customRequests.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Subcategory = typeof subcategories.$inferSelect;
export type City = typeof cities.$inferSelect;
export type CartItem = typeof cartItems.$inferSelect;
export type Chat = typeof chats.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type UserEvent = typeof userEvents.$inferSelect;
export type EventGift = typeof eventGifts.$inferSelect;
export type Withdrawal = typeof withdrawals.$inferSelect;
export type Coupon = typeof coupons.$inferSelect;
export type QuickReply = typeof quickReplies.$inferSelect;
export type Announcement = typeof announcements.$inferSelect;
export type AdminAuditLog = typeof adminAuditLogs.$inferSelect;
export type WalletTransaction = typeof walletTransactions.$inferSelect;
