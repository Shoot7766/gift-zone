const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(process.cwd(), 'sovga.db');
const db = new Database(dbPath);

console.log('--- Applying Migrations ---');

try {
  // Adding missing columns to shops
  const shopsInfo = db.prepare('PRAGMA table_info(shops)').all();
  const shopCols = shopsInfo.map(c => c.name);
  
  if (!shopCols.includes('balance')) {
    db.prepare('ALTER TABLE shops ADD COLUMN balance REAL DEFAULT 0').run();
    console.log('Added balance to shops');
  }
  if (!shopCols.includes('pending_balance')) {
    db.prepare('ALTER TABLE shops ADD COLUMN pending_balance REAL DEFAULT 0').run();
    console.log('Added pending_balance to shops');
  }

  // Adding missing column to payments
  const paymentsInfo = db.prepare('PRAGMA table_info(payments)').all();
  const paymentCols = paymentsInfo.map(c => c.name);

  if (!paymentCols.includes('proof_image')) {
    db.prepare('ALTER TABLE payments ADD COLUMN proof_image TEXT').run();
    console.log('Added proof_image to payments');
  }

  console.log('Migrations complete!');
} catch (e) {
  console.error('Migration failed:', e.message);
}

db.close();
