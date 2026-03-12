const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_DIR = path.join(__dirname);
const DB_PATH = path.join(DB_DIR, 'database.sqlite');

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const rawDb = new sqlite3.Database(DB_PATH, (err) => {
  if (err) console.error('[DB] 연결 실패:', err.message);
  else console.log(`[DB] SQLite connected: ${DB_PATH}`);
});

// Promise 래퍼
const db = {
  run: (sql, params = []) => new Promise((resolve, reject) => {
    rawDb.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  }),
  get: (sql, params = []) => new Promise((resolve, reject) => {
    rawDb.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  }),
  all: (sql, params = []) => new Promise((resolve, reject) => {
    rawDb.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  }),
  exec: (sql) => new Promise((resolve, reject) => {
    rawDb.exec(sql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  })
};

// 테이블 초기화
async function initDb() {
  await db.run('PRAGMA foreign_keys = ON');
  await db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key        TEXT PRIMARY KEY,
      value      TEXT NOT NULL DEFAULT '',
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      title            TEXT NOT NULL,
      department       TEXT DEFAULT '',
      location         TEXT DEFAULT '',
      employment_type  TEXT DEFAULT 'Full Time',
      description      TEXT DEFAULT '',
      required_skills  TEXT DEFAULT '',
      preferred_skills TEXT DEFAULT '',
      created_at       TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS candidates (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      email       TEXT NOT NULL,
      phone       TEXT,
      job_id      INTEGER,
      department  TEXT DEFAULT '',
      resume_path TEXT,
      linkedin    TEXT,
      notes       TEXT,
      status      TEXT DEFAULT 'Registered',
      ai_score    REAL,
      created_at  TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS interviews (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      candidate_id        INTEGER,
      token               TEXT UNIQUE NOT NULL,
      all_questions       TEXT DEFAULT '[]',
      confirmed_questions TEXT DEFAULT '[]',
      answers             TEXT DEFAULT '[]',
      ai_analysis         TEXT,
      status              TEXT DEFAULT 'Pending',
      created_at          TEXT DEFAULT (datetime('now','localtime')),
      completed_at        TEXT
    );
  `);
  console.log('[DB] Tables initialized');
}

initDb().catch(err => console.error('[DB] Init error:', err.message));

module.exports = db;
