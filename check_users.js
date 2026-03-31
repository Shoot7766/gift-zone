const Database = require('better-sqlite3');
const db = new Database('sovga.db');
const users = db.prepare('SELECT email, password, role FROM users LIMIT 10').all();
console.log(JSON.stringify(users, null, 2));
