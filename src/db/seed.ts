import { db, initDb } from "./index";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

async function seed() {
  console.log("🌱 Ma'lumotlar bazasi to'ldirilmoqda...");

  // Init tables
  initDb();

  // Temporarily disable foreign keys to allow a clean wipe and re-seed
  db.$client.pragma("foreign_keys = OFF");

  // Clear existing data to avoid PK/FK conflicts
  db.$client.pragma("foreign_keys = OFF");
  db.$client.exec(`
    DELETE FROM wallet_transactions;
    DELETE FROM reviews;
    DELETE FROM product_images;
    DELETE FROM order_items;
    DELETE FROM orders;
    DELETE FROM cart_items;
    DELETE FROM saved_items;
    DELETE FROM products;
    DELETE FROM subcategories;
    DELETE FROM shops;
    DELETE FROM categories;
    DELETE FROM cities;
    DELETE FROM users;
    DELETE FROM sqlite_sequence WHERE name IN ('cities', 'categories', 'product_images', 'cart_items', 'saved_items', 'order_items', 'reviews');
  `);


  // Cities
  const cityStmt = db.$client.prepare(`
    INSERT OR IGNORE INTO cities (name, name_ru, name_en) VALUES (?, ?, ?)
  `);
  [
    ["Navoiy", "Навои", "Navoi"],
    ["Zarafshon", "Зарафшан", "Zarafshan"],
    ["Toshkent", "Ташкент", "Tashkent"],
    ["Samarqand", "Самарканд", "Samarkand"],
    ["Buxoro", "Бухара", "Bukhara"],
    ["Namangan", "Наманган", "Namangan"],
    ["Andijon", "Андижан", "Andijan"],
    ["Farg'ona", "Фергана", "Fergana"],
    ["Qarshi", "Карши", "Karshi"],
    ["Nukus", "Нукус", "Nukus"],
  ].forEach(([name, ru, en]) => cityStmt.run(name, ru, en));

  // Categories
  const catStmt = db.$client.prepare(`
    INSERT OR IGNORE INTO categories (name, name_ru, name_en, icon, slug) VALUES (?, ?, ?, ?, ?)
  `);
  [
    ["Gul buketi", "Букет цветов", "Flower Bouquet", "🌸", "flowers"],
    ["Sovg'a quti", "Подарочная коробка", "Gift Box", "🎁", "gift-box"],
    ["Shaxsiy sovg'a", "Персональный подарок", "Custom Gift", "✨", "custom"],
    ["Shirinliklar", "Сладости", "Sweets", "🍫", "sweets"],
    ["Dekoratsiya", "Декорация", "Decoration", "🎀", "decoration"],
    ["Fotografiya", "Фотография", "Photography", "📸", "photography"],
    ["Sham va aromatlar", "Свечи и ароматы", "Candles & Aromas", "🕯️", "candles"],
    ["To'y sovg'alari", "Свадебные подарки", "Wedding Gifts", "💍", "wedding"],
  ].forEach(([name, ru, en, icon, slug]) =>
    catStmt.run(name, ru, en, icon, slug)
  );

  const hashedAdmin = await bcrypt.hash("admin123", 10);
  const hashedUser = await bcrypt.hash("user123", 10);
  const hashedProvider = await bcrypt.hash("shop123", 10);

  const adminId = uuidv4();
  const customerId = uuidv4();
  const providerId1 = uuidv4();
  const providerId2 = uuidv4();

  // Users
  const userStmt = db.$client.prepare(`
    INSERT OR IGNORE INTO users (id, name, email, password, phone, role) VALUES (?, ?, ?, ?, ?, ?)
  `);
  userStmt.run(adminId, "Admin", "admin@sovga.uz", hashedAdmin, "+998901234567", "admin");
  userStmt.run(customerId, "Alisher Nazarov", "user@sovga.uz", hashedUser, "+998901112233", "customer");
  userStmt.run(providerId1, "Gulnora Rahimova", "shop1@sovga.uz", hashedProvider, "+998909876543", "provider");
  userStmt.run(providerId2, "Jasur Toshmatov", "shop2@sovga.uz", hashedProvider, "+998907654321", "provider");

  // Shops
  const shopId1 = uuidv4();
  const shopId2 = uuidv4();
  const shopStmt = db.$client.prepare(`
    INSERT OR IGNORE INTO shops (id, user_id, name, description, phone, telegram, instagram, city_id, address, working_hours, rating, reviews_count, is_verified, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  shopStmt.run(
    shopId1, providerId1,
    "Gullar Dunyosi",
    "Toshkentdagi eng yaxshi gul va sovg'a do'koni. Har qanday tadbir uchun individual dizayn.",
    "+998909876543", "@gullardunyosi", "gullardunyosi",
    1, "Yunusobod tumani, 14-mavze", "9:00 - 21:00",
    4.8, 124, 1, 1
  );
  shopStmt.run(
    shopId2, providerId2,
    "Sevgi Sovg'alari",
    "Premium sovg'a qutilari, shaxsiylashtirilgan yubiley va to'y sovg'alari.",
    "+998907654321", "@sevgisovgalari", "sevgisovgalari",
    1, "Mirzo Ulug'bek tumani, 5-uy", "10:00 - 20:00",
    4.6, 89, 1, 1
  );

  // Products
  const products = [
    {
      id: uuidv4(), shopId: shopId1, catId: 1, title: "Qizil atirgullar buketi (51 ta)",
      desc: "51 ta chiroyli qizil atirguldan tuzilgan romantik buket. Sevgilisi, turmush o'rtog'i yoki onasi uchun eng yaxshi sovg'a.",
      price: 350000, prep: "2-3 soat", cityId: 1
    },
    {
      id: uuidv4(), shopId: shopId1, catId: 1, title: "Choy atirgullari (25 ta)",
      desc: "Nozik choy atirgullaridan tuzilgan klassik buket. Har qanday munosabat uchun mos.",
      price: 180000, prep: "1-2 soat", cityId: 1
    },
    {
      id: uuidv4(), shopId: shopId1, catId: 1, title: "Aralash gul kompozitsiyasi",
      desc: "Atirgul, xrizantema va lola aralashmasidan tuzilgan rang-barang buket.",
      price: 250000, prep: "2-4 soat", cityId: 1
    },
    {
      id: uuidv4(), shopId: shopId2, catId: 2, title: "Premium sovg'a qutisi",
      desc: "Shokolad, xushbo'y shamlar, qo'lda yasalgan sovunlar va boshqa qimmatbaho mahsulotlar to'plami.",
      price: 450000, prep: "1 kun", cityId: 1
    },
    {
      id: uuidv4(), shopId: shopId2, catId: 2, title: "Shirinliklar qutisi",
      desc: "Turli xil premium shokoladlar, makaron pechene va boshqa shirinliklardan iborat sovg'a qutisi.",
      price: 280000, prep: "3-4 soat", cityId: 1
    },
    {
      id: uuidv4(), shopId: shopId2, catId: 3, title: "Shaxsiy fotoalbom",
      desc: "Sizning xotiralaringiz bilan bezatilgan qo'lda yasalgan premium fotoalbom.",
      price: 320000, prep: "2-3 kun", cityId: 1
    },
  ];

  const prodStmt = db.$client.prepare(`
    INSERT OR IGNORE INTO products (id, shop_id, category_id, title, description, price, preparation_time, city_id, rating, reviews_count, orders_count, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);
  const imgStmt = db.$client.prepare(`
    INSERT INTO product_images (product_id, url, is_primary) VALUES (?, ?, ?)
  `);

  const sampleImages = [
    "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=800&fit=crop", 
    "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?q=80&w=800&fit=crop", 
    "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?q=80&w=800&fit=crop", 
    "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?q=80&w=800&fit=crop", 
    "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?q=80&w=800&fit=crop", 
    "https://images.unsplash.com/photo-1602874801007-bd458cb6c975?q=80&w=800&fit=crop", 
  ];

  products.forEach((p, i) => {
    prodStmt.run(p.id, p.shopId, p.catId, p.title, p.desc, p.price, p.prep, p.cityId,
      (4.5 + Math.random() * 0.5).toFixed(1), Math.floor(Math.random() * 50) + 5, Math.floor(Math.random() * 30) + 2);
    imgStmt.run(p.id, sampleImages[i], 1);
  });

  console.log("✅ Ma'lumotlar bazasi muvaffaqiyatli to'ldirildi!");
  console.log("📧 Admin: admin@sovga.uz / admin123");
  console.log("📧 Mijoz: user@sovga.uz / user123");
  console.log("📧 Do'kon: shop1@sovga.uz / shop123");
  process.exit(0);
}

seed().catch((e) => { console.error(e); process.exit(1); });
