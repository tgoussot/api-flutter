import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

const dbPath = path.resolve(process.env.DB_PATH || './data/users.db');

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);

// email UNIQ
// password_hash hash Argon2id
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name    TEXT    NOT NULL,
    last_name     TEXT    NOT NULL,
    email         TEXT    NOT NULL UNIQUE,
    password_hash TEXT    NOT NULL,
    role          INTEGER NOT NULL
  )
`);

export default db;
