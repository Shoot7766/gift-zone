const db = new (require('better-sqlite3'))(require('path').join(process.cwd(), 'sovga.db'));
try {
  db.prepare('SELECT 1 FROM reviews LIMIT 1').get();
  console.log('reviews table already exists');
} catch(e) {
  db.prepare(`CREATE TABLE reviews (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    order_id TEXT,
    rating INTEGER NOT NULL,
    comment TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`).run();
  console.log('reviews table created');
}
db.close();
console.log('Done!');
