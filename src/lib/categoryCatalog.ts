export type CategorySeed = {
  slug: string;
  name: string;
  icon: string;
  image?: string;
  sortOrder: number;
  subcategories: Array<{ slug: string; name: string; icon?: string; sortOrder: number }>;
};

export const CATEGORY_CATALOG: CategorySeed[] = [
  { slug: "trending-gifts", name: "Trend sovg'alar", icon: "🔥", sortOrder: 1, subcategories: [
    { slug: "viral-gifts", name: "Viral sovg'alar", sortOrder: 1 }, { slug: "instagram-style-gifts", name: "Instagram uslubidagi sovg'alar", sortOrder: 2 }, { slug: "tiktok-trending-gifts", name: "TikTok trendlari", sortOrder: 3 }, { slug: "bestseller-gifts", name: "Eng ko'p sotilganlar", sortOrder: 4 }, { slug: "premium-trending-gifts", name: "Premium trendlar", sortOrder: 5 },
  ]},
  { slug: "flowers", name: "Gullar", icon: "🌸", sortOrder: 2, subcategories: [
    { slug: "rose-bouquets", name: "Atirgul guldastalari", sortOrder: 1 }, { slug: "premium-bouquets", name: "Premium guldastalar", sortOrder: 2 }, { slug: "flower-boxes", name: "Gul qutilari", sortOrder: 3 }, { slug: "101-roses", name: "101 atirgul", sortOrder: 4 }, { slug: "budget-bouquets", name: "Hamyonbop guldastalar", sortOrder: 5 }, { slug: "artificial-flowers", name: "Sun'iy gullar", sortOrder: 6 }, { slug: "flowers-with-gifts", name: "Gul va sovg'a to'plamlari", sortOrder: 7 },
  ]},
  { slug: "gift-boxes", name: "Sovg'a qutilari", icon: "🎁", sortOrder: 3, subcategories: [
    { slug: "romantic-gift-boxes", name: "Romantik qutilar", sortOrder: 1 }, { slug: "gift-boxes-for-men", name: "Erkaklar uchun qutilar", sortOrder: 2 }, { slug: "gift-boxes-for-women", name: "Ayollar uchun qutilar", sortOrder: 3 }, { slug: "mini-gift-boxes", name: "Mini qutilar", sortOrder: 4 }, { slug: "premium-gift-boxes", name: "Premium qutilar", sortOrder: 5 }, { slug: "surprise-boxes", name: "Syurpriz qutilar", sortOrder: 6 }, { slug: "themed-boxes", name: "Mavzuli qutilar", sortOrder: 7 },
  ]},
  { slug: "sweets-chocolate-gifts", name: "Shirinlik va shokolad", icon: "🍫", sortOrder: 4, subcategories: [
    { slug: "chocolate-boxes", name: "Shokolad qutilari", sortOrder: 1 }, { slug: "ferrero-collections", name: "Ferrero to'plamlari", sortOrder: 2 }, { slug: "candy-boxes", name: "Konfetlar", sortOrder: 3 }, { slug: "dessert-boxes", name: "Pishiriqlar", sortOrder: 4 }, { slug: "fruit-boxes", name: "Meva qutilari", sortOrder: 5 }, { slug: "sweet-gift-combos", name: "Shirinlik va sovg'a", sortOrder: 6 },
  ]},
  { slug: "cakes", name: "Tortlar", icon: "🎂", sortOrder: 5, subcategories: [
    { slug: "bento-cakes", name: "Bento tortlar", sortOrder: 1 }, { slug: "birthday-cakes", name: "Tug'ilgan kun tortlari", sortOrder: 2 }, { slug: "mini-cakes", name: "Mini tortlar", sortOrder: 3 }, { slug: "custom-cakes", name: "Maxsus tortlar", sortOrder: 4 }, { slug: "romantic-cakes", name: "Romantik tortlar", sortOrder: 5 }, { slug: "kids-cakes", name: "Bolalar tortlari", sortOrder: 6 },
  ]},
  { slug: "toys", name: "O'yinchoqlar", icon: "🧸", sortOrder: 6, subcategories: [
    { slug: "teddy-bears", name: "Ayiqchalar", sortOrder: 1 }, { slug: "plush-toys", name: "Yumshoq o'yinchoqlar", sortOrder: 2 }, { slug: "large-toys", name: "Katta o'yinchoqlar", sortOrder: 3 }, { slug: "kids-toys", name: "Bolalar o'yinchoqlari", sortOrder: 4 }, { slug: "soft-toys", name: "Momiq o'yinchoqlar", sortOrder: 5 },
  ]},
  { slug: "led-neon-gifts", name: "LED / Neon sovg'alar", icon: "💡", sortOrder: 7, subcategories: [
    { slug: "led-lamps", name: "LED lampalar", sortOrder: 1 }, { slug: "photo-lamps", name: "Foto lampalar", sortOrder: 2 }, { slug: "custom-name-lamps", name: "Ismli lampalar", sortOrder: 3 }, { slug: "neon-signs", name: "Neon yozuvlar", sortOrder: 4 }, { slug: "rgb-gifts", name: "RGB sovg'alar", sortOrder: 5 },
  ]},
  { slug: "custom-gifts", name: "Shaxsiylashtirilgan sovg'alar", icon: "🖼️", sortOrder: 8, subcategories: [
    { slug: "photo-frames", name: "Foto ramkalar", sortOrder: 1 }, { slug: "personalized-gifts", name: "Ismli sovg'alar", sortOrder: 2 }, { slug: "custom-text-gifts", name: "Maxsus yozuvli sovg'alar", sortOrder: 3 }, { slug: "engraved-gifts", name: "O'yib yozilgan sovg'alar", sortOrder: 4 }, { slug: "printed-photo-products", name: "Bosma foto mahsulotlar", sortOrder: 5 },
  ]},
  { slug: "romantic-gifts", name: "Romantik sovg'alar", icon: "💘", sortOrder: 9, subcategories: [
    { slug: "love-boxes", name: "Sevgi qutilari", sortOrder: 1 }, { slug: "surprise-sets", name: "Syurpriz to'plamlar", sortOrder: 2 }, { slug: "couple-gifts", name: "Juftliklar uchun", sortOrder: 3 }, { slug: "proposal-gifts", name: "Taklif qilish uchun", sortOrder: 4 }, { slug: "heart-shaped-gifts", name: "Yurak shaklidagi sovg'alar", sortOrder: 5 },
  ]},
  { slug: "gifts-for-women", name: "Ayollar uchun", icon: "💄", sortOrder: 10, subcategories: [
    { slug: "cosmetics-sets", name: "Kosmetika to'plamlari", sortOrder: 1 }, { slug: "perfume-women", name: "Parfyumeriya", sortOrder: 2 }, { slug: "women-accessories", name: "Aksessuarlar", sortOrder: 3 }, { slug: "beauty-boxes", name: "Go'zallik qutilari", sortOrder: 4 }, { slug: "fashion-gifts", name: "Moda sovg'alari", sortOrder: 5 },
  ]},
  { slug: "gifts-for-men", name: "Erkaklar uchun", icon: "⌚", sortOrder: 11, subcategories: [
    { slug: "watches", name: "Soatlar", sortOrder: 1 }, { slug: "wallets", name: "Hamyonlar", sortOrder: 2 }, { slug: "perfume-men", name: "Parfyumeriya", sortOrder: 3 }, { slug: "gadget-gifts", name: "Gadjetlar", sortOrder: 4 }, { slug: "mens-gift-boxes", name: "Erkaklar qutilari", sortOrder: 5 },
  ]},
  { slug: "gifts-for-kids", name: "Bolalar uchun", icon: "🧒", sortOrder: 12, subcategories: [
    { slug: "baby-gift-sets", name: "Chaqaloqlar to'plami", sortOrder: 1 }, { slug: "kids-toys-sets", name: "O'yinchoqlar", sortOrder: 2 }, { slug: "kids-gift-boxes", name: "Bolalar qutilari", sortOrder: 3 }, { slug: "educational-toys", name: "Rivojlantiruvchi o'yinchoqlar", sortOrder: 4 }, { slug: "colorful-gifts", name: "Rang-barang sovg'alar", sortOrder: 5 },
  ]},
  { slug: "holiday-gifts", name: "Bayram sovg'alari", icon: "🎉", sortOrder: 13, subcategories: [
    { slug: "birthday-gifts", name: "Tug'ilgan kun", sortOrder: 1 }, { slug: "womens-day-gifts", name: "8-mart", sortOrder: 2 }, { slug: "new-year-gifts", name: "Yangi yil", sortOrder: 3 }, { slug: "valentines-gifts", name: "Sevishganlar kuni", sortOrder: 4 }, { slug: "wedding-gifts", name: "To'y sovg'alari", sortOrder: 5 }, { slug: "graduation-gifts", name: "Bitiruv kechasi", sortOrder: 6 },
  ]},
  { slug: "gaming-gifts", name: "Geymer sovg'alari", icon: "🎮", sortOrder: 14, subcategories: [
    { slug: "gaming-accessories", name: "Geymer aksessuarlari", sortOrder: 1 }, { slug: "gaming-rgb-gifts", name: "RGB sovg'alar", sortOrder: 2 }, { slug: "gaming-sets", name: "O'yin to'plamlari", sortOrder: 3 }, { slug: "headsets", name: "Quloqchinlar", sortOrder: 4 }, { slug: "gamer-boxes", name: "Geymer qutilari", sortOrder: 5 },
  ]},
  { slug: "home-gifts", name: "Uy uchun sovg'alar", icon: "🏠", sortOrder: 15, subcategories: [
    { slug: "home-decor", name: "Uy dekori", sortOrder: 1 }, { slug: "scented-candles", name: "Xushbo'y shamlar", sortOrder: 2 }, { slug: "interior-gifts", name: "Interyer sovg'alari", sortOrder: 3 }, { slug: "decorative-items", name: "Dekorativ buyumlar", sortOrder: 4 }, { slug: "home-gift-sets", name: "Uy to'plamlari", sortOrder: 5 },
  ]},
  { slug: "handmade-gifts", name: "Qo'lda yasalgan", icon: "🪡", sortOrder: 16, subcategories: [
    { slug: "handmade-products", name: "Qo'l mehnati", sortOrder: 1 }, { slug: "diy-gifts", name: "DIY sovg'alar", sortOrder: 2 }, { slug: "custom-handmade-boxes", name: "Maxsus qo'l mehnati qutilari", sortOrder: 3 }, { slug: "unique-gifts", name: "Noyob sovg'alar", sortOrder: 4 },
  ]},
  { slug: "premium-gifts", name: "Premium sovg'alar", icon: "💎", sortOrder: 17, subcategories: [
    { slug: "luxury-gift-boxes", name: "Hashamatli qutilar", sortOrder: 1 }, { slug: "branded-gifts", name: "Brend sovg'alar", sortOrder: 2 }, { slug: "expensive-gifts", name: "Qimmatbaho sovg'alar", sortOrder: 3 }, { slug: "exclusive-sets", name: "Eksklyuziv to'plamlar", sortOrder: 4 },
  ]},
  { slug: "jewelry", name: "Zargarlik buyumlari", icon: "💍", sortOrder: 18, subcategories: [
    { slug: "rings", name: "Uzuklar", sortOrder: 1 }, { slug: "earrings", name: "Sirg'alar", sortOrder: 2 }, { slug: "bracelets", name: "Bilaguzuklar", sortOrder: 3 }, { slug: "necklaces", name: "Marjonlar", sortOrder: 4 }, { slug: "mens-jewelry", name: "Erkaklar aksessuarlari", sortOrder: 5 },
  ]},
  { slug: "surprise-gifts", name: "Syurpriz sovg'alar", icon: "🎁", sortOrder: 19, subcategories: [
    { slug: "mystery-boxes", name: "Sirli qutilar", sortOrder: 1 }, { slug: "blind-gifts", name: "Ko'r-korona sovg'alar", sortOrder: 2 }, { slug: "random-gifts", name: "Tasodifiy sovg'alar", sortOrder: 3 }, { slug: "surprise-packages", name: "Syurpriz paketlar", sortOrder: 4 },
  ]},
  { slug: "cute-gifts", name: "Yoqimtoy sovg'alar", icon: "🩷", sortOrder: 20, subcategories: [
    { slug: "kawaii-gifts", name: "Kavayi sovg'alar", sortOrder: 1 }, { slug: "cute-gift-boxes", name: "Yoqimtoy qutilar", sortOrder: 2 }, { slug: "aesthetic-gifts", name: "Estetik sovg'alar", sortOrder: 3 },
  ]},
  { slug: "office-business-gifts", name: "Ofis / Biznes sovg'alari", icon: "💼", sortOrder: 21, subcategories: [
    { slug: "corporate-gifts", name: "Korporativ sovg'alar", sortOrder: 1 }, { slug: "business-gift-sets", name: "Biznes to'plamlar", sortOrder: 2 }, { slug: "office-gifts", name: "Ofis sovg'alari", sortOrder: 3 }, { slug: "partner-gifts", name: "Hamkorlar uchun", sortOrder: 4 },
  ]},
  { slug: "universal-gifts", name: "Universal sovg'alar", icon: "🌍", sortOrder: 22, subcategories: [
    { slug: "gifts-for-everyone", name: "Barcha uchun", sortOrder: 1 }, { slug: "last-minute-gifts", name: "So'nggi daqiqa sovg'alari", sortOrder: 2 }, { slug: "budget-gifts", name: "Hamyonbop sovg'alar", sortOrder: 3 }, { slug: "quick-gift-ideas", name: "Tezkor g'oyalar", sortOrder: 4 },
  ]},
  { slug: "fast-delivery-gifts", name: "Tez yetkazib berish", icon: "🚀", sortOrder: 23, subcategories: [
    { slug: "same-day-delivery-gifts", name: "Shu kunning o'zida", sortOrder: 1 }, { slug: "express-gifts", name: "Ekspress sovg'alar", sortOrder: 2 }, { slug: "ready-to-ship-gifts", name: "Tayyor sovg'alar", sortOrder: 3 },
  ]},
  { slug: "budget-categories", name: "Byudjet bo'yicha", icon: "💰", sortOrder: 24, subcategories: [
    { slug: "under-50k", name: "50 minggacha", sortOrder: 1 }, { slug: "50k-100k", name: "50 ming - 100 ming", sortOrder: 2 }, { slug: "100k-200k", name: "100 ming - 200 ming", sortOrder: 3 }, { slug: "200k-plus", name: "200 mingdan qimmat", sortOrder: 4 },
  ]},
  { slug: "city-based-categories", name: "Shahar bo'yicha", icon: "📍", sortOrder: 25, subcategories: [
    { slug: "tashkent-gifts", name: "Toshkent", sortOrder: 1 }, { slug: "samarkand-gifts", name: "Samarqand", sortOrder: 2 }, { slug: "navoi-gifts", name: "Navoiy", sortOrder: 3 }, { slug: "bukhara-gifts", name: "Buxoro", sortOrder: 4 }, { slug: "other-cities-gifts", name: "Boshqa shaharlar", sortOrder: 5 },
  ]},
];
