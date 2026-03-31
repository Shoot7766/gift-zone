import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";
import bcrypt from "bcryptjs";
import { CATEGORY_CATALOG } from "@/lib/categoryCatalog";

const dbPath = process.env.VERCEL
  ? path.join("/tmp", "sovga.db")
  : path.join(process.cwd(), "sovga.db");
const sqlite = new Database(dbPath);

// Enable WAL mode for better performance
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });

export function initDb() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      phone TEXT,
      role TEXT NOT NULL DEFAULT 'customer',
      avatar TEXT,
      wallet_balance REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      name_ru TEXT,
      name_en TEXT
    );

    CREATE TABLE IF NOT EXISTS shops (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      description TEXT,
      logo TEXT,
      cover_image TEXT,
      phone TEXT,
      telegram TEXT,
      instagram TEXT,
      city_id INTEGER REFERENCES cities(id),
      address TEXT,
      working_hours TEXT,
      rating REAL DEFAULT 0,
      reviews_count INTEGER DEFAULT 0,
      is_verified INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      delivery_fee REAL DEFAULT 20000,
      balance REAL DEFAULT 0,
      pending_balance REAL DEFAULT 0,
      location_lat REAL,
      location_lng REAL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      name_ru TEXT,
      name_en TEXT,
      icon TEXT,
      image TEXT,
      slug TEXT NOT NULL UNIQUE,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS subcategories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL REFERENCES categories(id),
      name TEXT NOT NULL,
      name_ru TEXT,
      name_en TEXT,
      icon TEXT,
      image TEXT,
      slug TEXT NOT NULL UNIQUE,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      shop_id TEXT NOT NULL REFERENCES shops(id),
      category_id INTEGER REFERENCES categories(id),
      subcategory_id INTEGER REFERENCES subcategories(id),
      title TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      stock_qty INTEGER NOT NULL DEFAULT 0,
      low_stock_threshold INTEGER NOT NULL DEFAULT 5,
      preparation_time TEXT,
      city_id INTEGER REFERENCES cities(id),
      rating REAL DEFAULT 0,
      reviews_count INTEGER DEFAULT 0,
      orders_count INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS product_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id TEXT NOT NULL REFERENCES products(id),
      url TEXT NOT NULL,
      is_primary INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES users(id),
      product_id TEXT NOT NULL REFERENCES products(id),
      quantity INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS saved_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES users(id),
      product_id TEXT NOT NULL REFERENCES products(id),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL REFERENCES users(id),
      shop_id TEXT NOT NULL REFERENCES shops(id),
      status TEXT NOT NULL DEFAULT 'pending',
      total_amount REAL NOT NULL,
      delivery_fee REAL DEFAULT 0,
      recipient_name TEXT NOT NULL,
      recipient_phone TEXT NOT NULL,
      delivery_address TEXT NOT NULL,
      delivery_city_id INTEGER REFERENCES cities(id),
      delivery_lat REAL,
      delivery_lng REAL,
      delivery_time TEXT,
      note TEXT,
      greeting_text TEXT,
      greeting_url TEXT,
      payment_method TEXT,
      payment_status TEXT NOT NULL DEFAULT 'unpaid',
      payment_transaction_id TEXT,
      is_group_gifting INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL REFERENCES orders(id),
      product_id TEXT REFERENCES products(id),
      title TEXT NOT NULL,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      image_url TEXT
    );

    CREATE TABLE IF NOT EXISTS custom_requests (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL REFERENCES users(id),
      shop_id TEXT REFERENCES shops(id),
      description TEXT NOT NULL,
      reference_image TEXT,
      budget REAL,
      delivery_date TEXT,
      delivery_address TEXT,
      city_id INTEGER REFERENCES cities(id),
      status TEXT NOT NULL DEFAULT 'pending',
      provider_response TEXT,
      quoted_price REAL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id),
      method TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      transaction_id TEXT,
      proof_image TEXT,
      provider_response TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES users(id),
      product_id TEXT REFERENCES products(id),
      shop_id TEXT REFERENCES shops(id),
      rating INTEGER NOT NULL,
      comment TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS chats (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL REFERENCES users(id),
      shop_id TEXT NOT NULL REFERENCES shops(id),
      last_message TEXT,
      updated_at TEXT DEFAULT (datetime('now')),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id TEXT NOT NULL REFERENCES chats(id),
      sender_id TEXT NOT NULL REFERENCES users(id),
      text TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS user_events (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      date TEXT NOT NULL,
      reminder_days INTEGER DEFAULT 7,
      is_recurring INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS event_gifts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id TEXT NOT NULL REFERENCES user_events(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(id),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS withdrawals (
      id TEXT PRIMARY KEY,
      shop_id TEXT NOT NULL REFERENCES shops(id),
      amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      bank_card TEXT NOT NULL,
      bank_name TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS wallet_transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'success',
      order_id TEXT REFERENCES orders(id),
      note TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS coupons (
      id TEXT PRIMARY KEY,
      shop_id TEXT NOT NULL REFERENCES shops(id),
      code TEXT NOT NULL UNIQUE,
      discount_type TEXT NOT NULL,
      discount_value REAL NOT NULL,
      min_order_amount REAL DEFAULT 0,
      max_discount_amount REAL,
      usage_limit INTEGER,
      used_count INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      expires_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS quick_replies (
      id TEXT PRIMARY KEY,
      shop_id TEXT NOT NULL REFERENCES shops(id),
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      target_role TEXT NOT NULL DEFAULT 'all',
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS admin_audit_logs (
      id TEXT PRIMARY KEY,
      admin_user_id TEXT NOT NULL REFERENCES users(id),
      action_type TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT,
      note TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ai_queries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      query TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS password_resets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      token_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Lightweight forward migrations for existing databases.
  const productCols = sqlite
    .prepare("PRAGMA table_info(products)")
    .all() as Array<{ name: string }>;
  if (!productCols.some((c) => c.name === "stock_qty")) {
    sqlite.exec("ALTER TABLE products ADD COLUMN stock_qty INTEGER NOT NULL DEFAULT 0;");
  }
  if (!productCols.some((c) => c.name === "subcategory_id")) {
    sqlite.exec("ALTER TABLE products ADD COLUMN subcategory_id INTEGER REFERENCES subcategories(id);");
  }
  if (!productCols.some((c) => c.name === "low_stock_threshold")) {
    sqlite.exec(
      "ALTER TABLE products ADD COLUMN low_stock_threshold INTEGER NOT NULL DEFAULT 5;"
    );
  }

  const shopCols = sqlite
    .prepare("PRAGMA table_info(shops)")
    .all() as Array<{ name: string }>;
  if (!shopCols.some((c) => c.name === "delivery_fee")) {
    sqlite.exec(
      "ALTER TABLE shops ADD COLUMN delivery_fee REAL DEFAULT 20000;"
    );
  }
  if (!shopCols.some((c) => c.name === "location_lat")) {
    sqlite.exec("ALTER TABLE shops ADD COLUMN location_lat REAL;");
  }
  if (!shopCols.some((c) => c.name === "location_lng")) {
    sqlite.exec("ALTER TABLE shops ADD COLUMN location_lng REAL;");
  }

  const userCols = sqlite.prepare("PRAGMA table_info(users)").all() as Array<{ name: string }>;
  if (!userCols.some((c) => c.name === "wallet_balance")) {
    sqlite.exec("ALTER TABLE users ADD COLUMN wallet_balance REAL DEFAULT 0;");
  }

  const catCols = sqlite.prepare("PRAGMA table_info(categories)").all() as Array<{ name: string }>;
  if (!catCols.some((c) => c.name === "image")) {
    sqlite.exec("ALTER TABLE categories ADD COLUMN image TEXT;");
  }
  if (!catCols.some((c) => c.name === "sort_order")) {
    sqlite.exec("ALTER TABLE categories ADD COLUMN sort_order INTEGER DEFAULT 0;");
  }
  const hasSubcategories = sqlite
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'subcategories'")
    .get() as { name?: string } | undefined;
  if (!hasSubcategories?.name) {
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS subcategories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER NOT NULL REFERENCES categories(id),
        name TEXT NOT NULL,
        name_ru TEXT,
        name_en TEXT,
        icon TEXT,
        image TEXT,
        slug TEXT NOT NULL UNIQUE,
        sort_order INTEGER DEFAULT 0
      );
    `);
  }

  const orderCols = sqlite
    .prepare("PRAGMA table_info(orders)")
    .all() as Array<{ name: string }>;
  if (!orderCols.some((c) => c.name === "delivery_lat")) {
    sqlite.exec("ALTER TABLE orders ADD COLUMN delivery_lat REAL;");
  }
  if (!orderCols.some((c) => c.name === "delivery_lng")) {
    sqlite.exec("ALTER TABLE orders ADD COLUMN delivery_lng REAL;");
  }
  if (!orderCols.some((c) => c.name === "greeting_text")) {
    sqlite.exec("ALTER TABLE orders ADD COLUMN greeting_text TEXT;");
  }
  if (!orderCols.some((c) => c.name === "greeting_url")) {
    sqlite.exec("ALTER TABLE orders ADD COLUMN greeting_url TEXT;");
  }
  if (!orderCols.some((c) => c.name === "is_group_gifting")) {
    sqlite.exec("ALTER TABLE orders ADD COLUMN is_group_gifting INTEGER DEFAULT 0;");
  }
  if (!orderCols.some((c) => c.name === "fulfillment_type")) {
    sqlite.exec("ALTER TABLE orders ADD COLUMN fulfillment_type TEXT NOT NULL DEFAULT 'shop_delivery';");
  }
  if (!orderCols.some((c) => c.name === "platform_fee")) {
    sqlite.exec("ALTER TABLE orders ADD COLUMN platform_fee REAL DEFAULT 0;");
  }
  if (!orderCols.some((c) => c.name === "delivery_date")) {
    sqlite.exec("ALTER TABLE orders ADD COLUMN delivery_date TEXT;");
  }

  if (!shopCols.some((c) => c.name === "pickup_available")) {
    sqlite.exec("ALTER TABLE shops ADD COLUMN pickup_available INTEGER DEFAULT 1;");
  }
  if (!shopCols.some((c) => c.name === "shop_delivery_available")) {
    sqlite.exec("ALTER TABLE shops ADD COLUMN shop_delivery_available INTEGER DEFAULT 1;");
  }
  if (!shopCols.some((c) => c.name === "delivery_area_city_ids")) {
    sqlite.exec("ALTER TABLE shops ADD COLUMN delivery_area_city_ids TEXT;");
  }
  if (!shopCols.some((c) => c.name === "default_preparation_time")) {
    sqlite.exec("ALTER TABLE shops ADD COLUMN default_preparation_time TEXT;");
  }
  if (!shopCols.some((c) => c.name === "pickup_instructions")) {
    sqlite.exec("ALTER TABLE shops ADD COLUMN pickup_instructions TEXT;");
  }

  const hasAnnouncements = sqlite
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'announcements'"
    )
    .get() as { name?: string } | undefined;
  if (!hasAnnouncements?.name) {
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS announcements (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        target_role TEXT NOT NULL DEFAULT 'all',
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);
  }

  const hasAuditLogs = sqlite
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'admin_audit_logs'"
    )
    .get() as { name?: string } | undefined;
  if (!hasAuditLogs?.name) {
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS admin_audit_logs (
        id TEXT PRIMARY KEY,
        admin_user_id TEXT NOT NULL REFERENCES users(id),
        action_type TEXT NOT NULL,
        target_type TEXT NOT NULL,
        target_id TEXT,
        note TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);
  }
  const hasAiQueries = sqlite
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'ai_queries'"
    )
    .get() as { name?: string } | undefined;
  if (!hasAiQueries?.name) {
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS ai_queries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        query TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);
  }

  const hasWalletTransactions = sqlite
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'wallet_transactions'")
    .get() as { name?: string } | undefined;
  if (!hasWalletTransactions?.name) {
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS wallet_transactions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'success',
        order_id TEXT REFERENCES orders(id),
        note TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);
  }

  const requiredCities = [
    ["Navoiy", "Навои", "Navoi"],
    ["Zarafshon", "Зарафшан", "Zarafshan"],
  ];
  const cityInsert = sqlite.prepare(
    "INSERT OR IGNORE INTO cities (name, name_ru, name_en) VALUES (?, ?, ?)"
  );
  for (const [name, nameRu, nameEn] of requiredCities) {
    cityInsert.run(name, nameRu, nameEn);
  }

  const upsertCategory = sqlite.prepare(`
    INSERT INTO categories (name, icon, image, slug, sort_order)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(slug) DO UPDATE SET
      name = excluded.name,
      icon = excluded.icon,
      image = excluded.image,
      sort_order = excluded.sort_order
  `);
  const findCategory = sqlite.prepare("SELECT id FROM categories WHERE slug = ?");
  const upsertSubcategory = sqlite.prepare(`
    INSERT INTO subcategories (category_id, name, icon, slug, sort_order)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(slug) DO UPDATE SET
      category_id = excluded.category_id,
      name = excluded.name,
      icon = excluded.icon,
      sort_order = excluded.sort_order
  `);
  const syncCatalogTx = sqlite.transaction(() => {
    for (const category of CATEGORY_CATALOG) {
      upsertCategory.run(
        category.name,
        category.icon,
        category.image || null,
        category.slug,
        category.sortOrder
      );
      const foundCategory = findCategory.get(category.slug) as { id: number } | undefined;
      if (!foundCategory) continue;
      for (const subcategory of category.subcategories) {
        upsertSubcategory.run(
          foundCategory.id,
          subcategory.name,
          subcategory.icon || null,
          subcategory.slug,
          subcategory.sortOrder
        );
      }
    }
  });
  syncCatalogTx();

  const zarafshonCity = sqlite
    .prepare("SELECT id FROM cities WHERE lower(name) = lower('Zarafshon') LIMIT 1")
    .get() as { id: number } | undefined;
  if (zarafshonCity) {
    const demoPasswordHash = bcrypt.hashSync("demo", 10);
    const upsertDemoUser = sqlite.prepare(`
      INSERT INTO users (id, name, email, password, role, phone)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        email = excluded.email,
        password = excluded.password,
        role = excluded.role,
        phone = excluded.phone
    `);
    [
      ["demo-provider-z-1", "Gift Zone Demo 1", "demo-z-1@giftzone.uz"],
      ["demo-provider-z-2", "Gift Zone Demo 2", "demo-z-2@giftzone.uz"],
      ["demo-provider-z-3", "Gift Zone Demo 3", "demo-z-3@giftzone.uz"],
      ["demo-provider-z-4", "Gift Zone Demo 4", "demo-z-4@giftzone.uz"],
    ].forEach(([id, name, email]) => {
      upsertDemoUser.run(id, name, email, demoPasswordHash, "provider", "+998933100764");
    });

    const hasZarafshonShops = sqlite
      .prepare("SELECT COUNT(*) as c FROM shops WHERE city_id = ?")
      .get(zarafshonCity.id) as { c: number };
    if (!hasZarafshonShops.c) {
      sqlite.exec(`
        INSERT OR IGNORE INTO shops (id, user_id, name, description, phone, telegram, instagram, city_id, address, working_hours, rating, reviews_count, is_verified, is_active, delivery_fee, cover_image) VALUES
          ('demo-shop-z-1', 'demo-provider-z-1', 'Gift Zone Premium', 'Zamonaviy premium sovg''alar va yorqin sovg''a qutilari to''plamlari.', '+998933100764', '@giftzone_uz', 'giftzone_uz', ${zarafshonCity.id}, 'Zarafshon', '09:00 - 22:00', 4.9, 124, 1, 1, 15000, 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?q=80&w=1200&fit=crop'),
          ('demo-shop-z-2', 'demo-provider-z-2', 'Zarafshon Gullar', 'Gullar, romantik buketlar va syurpriz kompozitsiyalar.', '+998933100764', '@zarafshonflowers', 'zarafshonflowers', ${zarafshonCity.id}, 'Zarafshon', '08:00 - 21:00', 4.8, 96, 1, 1, 12000, 'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?q=80&w=1200&fit=crop'),
          ('demo-shop-z-3', 'demo-provider-z-3', 'Shirin Kayfiyat', 'Shirinliklar, bento tortlar va estetik desert qutilari.', '+998933100764', '@sweetmood_z', 'sweetmood_z', ${zarafshonCity.id}, 'Zarafshon', '10:00 - 22:00', 4.7, 71, 1, 1, 12000, 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?q=80&w=1200&fit=crop'),
          ('demo-shop-z-4', 'demo-provider-z-4', 'Romantik Yorug''lik', 'LED, neon va juftliklar uchun zamonaviy sovg''alar.', '+998933100764', '@romanticglow_z', 'romanticglow_z', ${zarafshonCity.id}, 'Zarafshon', '10:00 - 23:00', 4.6, 54, 1, 1, 18000, 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=1200&fit=crop');

        INSERT OR IGNORE INTO products (id, shop_id, category_id, subcategory_id, title, description, price, stock_qty, city_id, rating, reviews_count, orders_count, is_active) VALUES
          ('demo-product-z-1', 'demo-shop-z-1', (SELECT id FROM categories WHERE slug = 'gift-boxes'), (SELECT id FROM subcategories WHERE slug = 'premium-gift-boxes'), 'Neon sovg''a qutisi', 'Logo ranglariga mos premium syurpriz sovg''a qutisi.', 289000, 20, ${zarafshonCity.id}, 4.9, 41, 87, 1),
          ('demo-product-z-2', 'demo-shop-z-1', (SELECT id FROM categories WHERE slug = 'romantic-gifts'), (SELECT id FROM subcategories WHERE slug = 'surprise-sets'), 'Romantik neon to''plam', 'Yorqin ko''k-pushti rangdagi romantik sovg''a to''plami.', 349000, 14, ${zarafshonCity.id}, 4.8, 28, 63, 1),
          ('demo-product-z-3', 'demo-shop-z-2', (SELECT id FROM categories WHERE slug = 'flowers'), (SELECT id FROM subcategories WHERE slug = 'rose-bouquets'), '51 ta atirgul', 'Zarafshon uchun premium atirgul buketi.', 420000, 9, ${zarafshonCity.id}, 4.9, 33, 59, 1),
          ('demo-product-z-4', 'demo-shop-z-2', (SELECT id FROM categories WHERE slug = 'flowers'), (SELECT id FROM subcategories WHERE slug = 'flower-boxes'), 'Gul qutisi Deluxe', 'Zamonaviy gul qutisi premium dizaynda.', 265000, 16, ${zarafshonCity.id}, 4.7, 18, 44, 1),
          ('demo-product-z-5', 'demo-shop-z-3', (SELECT id FROM categories WHERE slug = 'cakes'), (SELECT id FROM subcategories WHERE slug = 'bento-cakes'), 'Sevgi bento torti', 'Minimalistik va estetik bento tort.', 119000, 18, ${zarafshonCity.id}, 4.7, 17, 38, 1),
          ('demo-product-z-6', 'demo-shop-z-3', (SELECT id FROM categories WHERE slug = 'sweets-chocolate-gifts'), (SELECT id FROM subcategories WHERE slug = 'ferrero-collections'), 'Premium shirinlik qutisi', 'Ferrero va desertlardan iborat premium quti.', 199000, 12, ${zarafshonCity.id}, 4.8, 24, 52, 1),
          ('demo-product-z-7', 'demo-shop-z-4', (SELECT id FROM categories WHERE slug = 'led-neon-gifts'), (SELECT id FROM subcategories WHERE slug = 'neon-signs'), 'Maxsus neon yozuv', 'Ism yoziladigan neon dekor sovg''a.', 459000, 7, ${zarafshonCity.id}, 4.6, 15, 27, 1),
          ('demo-product-z-8', 'demo-shop-z-4', (SELECT id FROM categories WHERE slug = 'led-neon-gifts'), (SELECT id FROM subcategories WHERE slug = 'photo-lamps'), 'LED syurpriz lampa', 'Foto va yozuvli zamonaviy lampalar.', 229000, 10, ${zarafshonCity.id}, 4.5, 11, 22, 1);

        INSERT OR IGNORE INTO product_images (product_id, url, is_primary) VALUES
          ('demo-product-z-1', 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=800&fit=crop', 1),
          ('demo-product-z-2', 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?q=80&w=800&fit=crop', 1),
          ('demo-product-z-3', 'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?q=80&w=800&fit=crop', 1),
          ('demo-product-z-4', 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?q=80&w=800&fit=crop', 1),
          ('demo-product-z-5', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=800&fit=crop', 1),
          ('demo-product-z-6', 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?q=80&w=800&fit=crop', 1),
          ('demo-product-z-7', 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=800&fit=crop', 1),
          ('demo-product-z-8', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=800&fit=crop', 1),
          ('demo-product-z-1', 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?q=80&w=800&fit=crop', 0),
          ('demo-product-z-3', 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?q=80&w=800&fit=crop', 0),
          ('demo-product-z-5', 'https://images.unsplash.com/photo-1464306076886-da185f6a9d05?q=80&w=800&fit=crop', 0),
          ('demo-product-z-7', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&fit=crop', 0);
      `);
    }

    sqlite.exec(`
      UPDATE shops
      SET description = 'Zamonaviy premium sovg''alar va yorqin sovg''a qutilari to''plamlari.'
      WHERE id = 'demo-shop-z-1';
      UPDATE shops
      SET name = 'Zarafshon Gullar',
          description = 'Gullar, romantik buketlar va syurpriz kompozitsiyalar.'
      WHERE id = 'demo-shop-z-2';
      UPDATE shops
      SET name = 'Shirin Kayfiyat',
          description = 'Shirinliklar, bento tortlar va estetik desert qutilari.'
      WHERE id = 'demo-shop-z-3';
      UPDATE shops
      SET name = 'Romantik Yorug''lik',
          description = 'LED, neon va juftliklar uchun zamonaviy sovg''alar.'
      WHERE id = 'demo-shop-z-4';
      UPDATE products
      SET category_id = (SELECT id FROM categories WHERE slug = 'gift-boxes'),
          title = 'Neon sovg''a qutisi',
          description = 'Logo ranglariga mos premium syurpriz sovg''a qutisi.',
          subcategory_id = (SELECT id FROM subcategories WHERE slug = 'premium-gift-boxes')
      WHERE id = 'demo-product-z-1';
      UPDATE products
      SET category_id = (SELECT id FROM categories WHERE slug = 'romantic-gifts'),
          title = 'Romantik neon to''plam',
          description = 'Yorqin ko''k-pushti rangdagi romantik sovg''a to''plami.',
          subcategory_id = (SELECT id FROM subcategories WHERE slug = 'surprise-sets')
      WHERE id = 'demo-product-z-2';
      UPDATE products
      SET category_id = (SELECT id FROM categories WHERE slug = 'flowers'),
          title = '51 ta atirgul',
          description = 'Zarafshon uchun premium atirgul buketi.',
          subcategory_id = (SELECT id FROM subcategories WHERE slug = 'rose-bouquets')
      WHERE id = 'demo-product-z-3';
      UPDATE products
      SET category_id = (SELECT id FROM categories WHERE slug = 'flowers'),
          title = 'Gul qutisi Deluxe',
          description = 'Zamonaviy gul qutisi premium dizaynda.',
          subcategory_id = (SELECT id FROM subcategories WHERE slug = 'flower-boxes')
      WHERE id = 'demo-product-z-4';
      UPDATE products
      SET category_id = (SELECT id FROM categories WHERE slug = 'cakes'),
          title = 'Sevgi bento torti',
          description = 'Minimalistik va estetik bento tort.',
          subcategory_id = (SELECT id FROM subcategories WHERE slug = 'bento-cakes')
      WHERE id = 'demo-product-z-5';
      UPDATE products
      SET category_id = (SELECT id FROM categories WHERE slug = 'sweets-chocolate-gifts'),
          title = 'Premium shirinlik qutisi',
          description = 'Ferrero va desertlardan iborat premium quti.',
          subcategory_id = (SELECT id FROM subcategories WHERE slug = 'ferrero-collections')
      WHERE id = 'demo-product-z-6';
      UPDATE products
      SET category_id = (SELECT id FROM categories WHERE slug = 'led-neon-gifts'),
          title = 'Maxsus neon yozuv',
          description = 'Ism yoziladigan neon dekor sovg''a.',
          subcategory_id = (SELECT id FROM subcategories WHERE slug = 'neon-signs')
      WHERE id = 'demo-product-z-7';
      UPDATE products
      SET category_id = (SELECT id FROM categories WHERE slug = 'led-neon-gifts'),
          title = 'LED syurpriz lampa',
          description = 'Foto va yozuvli zamonaviy lampalar.',
          subcategory_id = (SELECT id FROM subcategories WHERE slug = 'photo-lamps')
      WHERE id = 'demo-product-z-8';
    `);
  }
}
