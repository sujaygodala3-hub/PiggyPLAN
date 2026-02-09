import sqlite3 from "sqlite3";
import path from "path";

const db = new sqlite3.Database(path.join(process.cwd(), "app.db"));

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      twofa_enabled INTEGER NOT NULL DEFAULT 0,
      twofa_secret TEXT
    )
  `);
});

export default db;
