import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST ?? "127.0.0.1",
  port: parseInt(process.env.DB_PORT ?? "3306"),
  user: process.env.DB_USER ?? "root",
  password: process.env.DB_PASS ?? "18012000",
  database: process.env.DB_NAME ?? "undangan_khitanan",
  waitForConnections: true,
  connectionLimit: 10,
  timezone: "+07:00",
});

export async function bootstrap() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS event (
      id         INT PRIMARY KEY DEFAULT 1,
      nama_anak  VARCHAR(255),
      foto_path  VARCHAR(255),
      anak_ke    INT,
      nama_bapak VARCHAR(255),
      nama_ibu   VARCHAR(255),
      alamat     TEXT,
      tanggal    DATETIME
    )
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS tamu (
      id         INT PRIMARY KEY AUTO_INCREMENT,
      nama       VARCHAR(255) NOT NULL,
      alamat     TEXT,
      no_telpon  VARCHAR(30),
      kartu_url  TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS broadcast (
      id       INT PRIMARY KEY AUTO_INCREMENT,
      tamu_id  INT NOT NULL,
      pesan    TEXT,
      status   VARCHAR(20) DEFAULT 'pending',
      sent_at  DATETIME,
      FOREIGN KEY (tamu_id) REFERENCES tamu(id) ON DELETE CASCADE
    )
  `);
}

export interface Event {
  id: number;
  nama_anak: string;
  foto_path: string;
  anak_ke: number;
  nama_bapak: string;
  nama_ibu: string;
  alamat: string;
  tanggal: string;
}

export interface Tamu {
  id: number;
  nama: string;
  alamat: string;
  no_telpon: string;
  kartu_url: string | null;
  created_at: string;
  broadcast_status?: string | null;
}

export interface Broadcast {
  id: number;
  tamu_id: number;
  pesan: string;
  status: string;
  sent_at: string | null;
  nama?: string;
  no_telpon?: string;
}

async function one<T>(sql: string, params: unknown[] = []): Promise<T | undefined> {
  const [rows] = await pool.execute<any[]>(sql, params);
  return rows[0] as T | undefined;
}

async function all<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  const [rows] = await pool.execute<any[]>(sql, params);
  return rows as T[];
}

async function run(sql: string, params: unknown[] = []): Promise<{ insertId: number }> {
  const [result] = await pool.execute<any>(sql, params);
  return { insertId: result.insertId };
}

export const q = {
  getEvent: () => one<Event>("SELECT * FROM event WHERE id = 1"),

  upsertEvent: (d: Omit<Event, "id">) =>
    run(
      `INSERT INTO event (id, nama_anak, foto_path, anak_ke, nama_bapak, nama_ibu, alamat, tanggal)
       VALUES (1, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         nama_anak  = VALUES(nama_anak),
         foto_path  = VALUES(foto_path),
         anak_ke    = VALUES(anak_ke),
         nama_bapak = VALUES(nama_bapak),
         nama_ibu   = VALUES(nama_ibu),
         alamat     = VALUES(alamat),
         tanggal    = VALUES(tanggal)`,
      [d.nama_anak, d.foto_path, d.anak_ke, d.nama_bapak, d.nama_ibu, d.alamat, d.tanggal]
    ),

  listTamu: () =>
    all<Tamu>(`
      SELECT t.*,
        (SELECT status FROM broadcast WHERE tamu_id = t.id ORDER BY id DESC LIMIT 1) AS broadcast_status
      FROM tamu t ORDER BY t.id DESC
    `),

  getTamu: (id: number) => one<Tamu>("SELECT * FROM tamu WHERE id = ?", [id]),

  insertTamu: (nama: string, alamat: string, no_telpon: string) =>
    run("INSERT INTO tamu (nama, alamat, no_telpon) VALUES (?, ?, ?)", [nama, alamat, no_telpon]),

  insertTamuBatch: async (rows: { nama: string; alamat: string; no_telpon: string }[]) => {
    if (!rows.length) return;
    const placeholders = rows.map(() => "(?, ?, ?)").join(", ");
    const params = rows.flatMap((r) => [r.nama, r.alamat, r.no_telpon]);
    await run(`INSERT INTO tamu (nama, alamat, no_telpon) VALUES ${placeholders}`, params);
  },

  updateTamu: (id: number, nama: string, alamat: string, no_telpon: string) =>
    run("UPDATE tamu SET nama=?, alamat=?, no_telpon=? WHERE id=?", [nama, alamat, no_telpon, id]),

  updateKartuUrl: (id: number, kartu_url: string) =>
    run("UPDATE tamu SET kartu_url=? WHERE id=?", [kartu_url, id]),

  deleteTamu: (id: number) => run("DELETE FROM tamu WHERE id=?", [id]),

  listBroadcast: () =>
    all<Broadcast>(`
      SELECT b.*, t.nama, t.no_telpon
      FROM broadcast b JOIN tamu t ON t.id = b.tamu_id
      ORDER BY b.id DESC LIMIT 100
    `),

  insertBroadcast: (tamu_id: number, pesan: string) =>
    run("INSERT INTO broadcast (tamu_id, pesan, status) VALUES (?, ?, 'pending')", [
      tamu_id,
      pesan,
    ]),

  updateBroadcastSent: (id: number) =>
    run("UPDATE broadcast SET status='sent', sent_at=NOW() WHERE id=?", [id]),

  updateBroadcastFailed: (id: number) =>
    run("UPDATE broadcast SET status='failed' WHERE id=?", [id]),

  stats: async () => {
    const [total, sent, failed] = await Promise.all([
      one<{ n: number }>("SELECT COUNT(*) AS n FROM tamu"),
      one<{ n: number }>("SELECT COUNT(*) AS n FROM broadcast WHERE status='sent'"),
      one<{ n: number }>("SELECT COUNT(*) AS n FROM broadcast WHERE status='failed'"),
    ]);
    return {
      total: total?.n ?? 0,
      sent: sent?.n ?? 0,
      failed: failed?.n ?? 0,
    };
  },
};

export default pool;
