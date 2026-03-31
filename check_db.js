const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(process.cwd(), 'sovga.db');
const db = new Database(dbPath);

console.log('--- shops table columns ---');
const shopsInfo = db.prepare('PRAGMA table_info(shops)').all();
shopsInfo.forEach(col => console.log(col.name));

console.log('\n--- payments table columns ---');
const paymentsInfo = db.prepare('PRAGMA table_info(payments)').all();
paymentsInfo.forEach(col => console.log(col.name));

console.log('\n--- withdrawals table exists? ---');
try {
  db.prepare('SELECT 1 FROM withdrawals LIMIT 1').get();
  console.log('Yes');
} catch (e) {
  console.log('No:', e.message);
}

db.close();
