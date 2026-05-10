// src/lib/db.ts
import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.resolve("data/undangan.db");
const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS event (
    id INTEGER PRIMARY KEY,
    nama_anak TEXT, foto_path TEXT, anak_ke INTEGER,
    nama_bapak TEXT, nama_ibu TEXT, alamat TEXT, tanggal TEXT
  );

  CREATE TABLE IF NOT EXISTS tamu (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT NOT NULL,
    alamat TEXT,
    no_telpon TEXT,
    kartu_url TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS broadcast (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tamu_id INTEGER NOT NULL,
    pesan TEXT,
    status TEXT DEFAULT 'pending',
    sent_at TEXT,
    FOREIGN KEY (tamu_id) REFERENCES tamu(id) ON DELETE CASCADE
  );
`);

// Migrasi: tambah kolom kartu_url jika belum ada (untuk DB lama)
try {
  db.exec(`ALTER TABLE tamu ADD COLUMN kartu_url TEXT`);
} catch (_) {
  // kolom sudah ada, skip
}

export default db;
