# BLUEPRINT

## astro.config.mjs
```js
// astro.config.mjs
import node from "@astrojs/node";
import { defineConfig } from "astro/config";

export default defineConfig({
  output: "server",
  adapter: node({ mode: "standalone" }),
});

```
---

## .env
```bash
SITE_URL=http://localhost:4000

```
---

## package.json
```json
{
  "name": "undangan-khitanan",
  "type": "module",
  "version": "0.0.1",
  "engines": {
    "node": ">=22.12.0"
  },
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "astro": "astro"
  },
  "dependencies": {
    "@astrojs/node": "^10.1.0",
    "astro": "^6.3.1",
    "better-sqlite3": "^12.9.0",
    "dotenv": "^17.4.2",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.13",
    "@types/node": "^25.6.2"
  }
}
```
---

## src/components/KartuUndangan.astro
```astro
---
// src/components/KartuUndangan.astro
// Komponen ini hanya dipakai sebagai referensi markup.
// Di halaman /kartu, template ini di-render via JS dengan data dinamis.
---

```
---

## src/layouts/Layout.astro
```astro
---
// src/layouts/Layout.astro
const { title } = Astro.props;
const nav = [
  { href: "/", label: "🏠 Dashboard" },
  { href: "/acara", label: "📋 Acara" },
  { href: "/tamu", label: "👥 Tamu" },
  { href: "/kartu", label: "🎴 Kartu" },
  { href: "/broadcast", label: "📢 Broadcast" },
];
const current = Astro.url.pathname;
---

<!doctype html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title} — Undangan Khitanan</title>
    <style>
      *,
      *::before,
      *::after {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      body {
        font-family: "Segoe UI", sans-serif;
        background: #f0f4f0;
        color: #333;
      }
      header {
        background: linear-gradient(135deg, #2d6a4f, #52b788);
        color: #fff;
        padding: 14px 24px;
        display: flex;
        align-items: center;
        gap: 12px;
      }
      header h1 {
        font-size: 1.1rem;
        font-weight: 700;
      }
      nav {
        background: #fff;
        display: flex;
        border-bottom: 2px solid #e0e0e0;
        overflow-x: auto;
      }
      nav a {
        padding: 12px 18px;
        font-size: 0.85rem;
        font-weight: 600;
        color: #666;
        text-decoration: none;
        white-space: nowrap;
        border-bottom: 3px solid transparent;
      }
      nav a.active {
        color: #2d6a4f;
        border-bottom-color: #2d6a4f;
      }
      nav a:hover {
        background: #f5f5f5;
      }
      main {
        max-width: 1100px;
        margin: 0 auto;
        padding: 24px 20px;
      }
    </style>
  </head>
  <body>
    <header>
      <span>🕌</span>
      <h1>Undangan Khitanan</h1>
    </header>
    <nav>
      {
        nav.map((n) => (
          <a href={n.href} class={current === n.href ? "active" : ""}>
            {n.label}
          </a>
        ))
      }
    </nav>
    <main>
      <slot />
    </main>
  </body>
</html>

```
---

## src/lib/db.ts
```ts
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

```
---

## src/lib/phone.ts
```ts
// src/lib/phone.ts
export function normalizePhone(raw: string): string {
  let n = raw.trim().replace(/\D/g, ""); // hapus non-digit
  if (n.startsWith("62")) n = "0" + n.slice(2);
  if (n.startsWith("+62")) n = "0" + n.slice(3);
  return n;
}

```
---

## src/lib/whatsapp.ts
```ts
// src/lib/whatsapp.ts
const ENDPOINT = "https://wapi.zedlabs.id/api/messages/send";
const API_KEY = "cedb42552eea73ca6e897807b80f07fd1e081aa1f93173fe";

export async function sendWA(number: string, message: string) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
    body: JSON.stringify({ number, message }),
  });

  if (!res.ok) throw new Error(`WA API error: ${res.status}`);
  return res.json();
}

```
---

## src/pages/acara.astro
```astro
---
// src/pages/acara.astro
import Layout from "../layouts/Layout.astro";
import db from "../lib/db";

const event = (db.prepare("SELECT * FROM event WHERE id = 1").get() as any) ?? {};
---

<Layout title="Setup Acara">
  <div class="card">
    <h2>📋 Data Acara</h2>

    <div id="alert" class="alert" style="display:none"></div>

    <form id="form-acara" enctype="multipart/form-data">
      <div class="form-grid">
        <div class="field">
          <label>Nama Anak *</label>
          <input
            name="nama_anak"
            required
            value={event.nama_anak ?? ""}
            placeholder="Muhammad Farhan"
          />
        </div>

        <div class="field">
          <label>Anak Ke- *</label>
          <input name="anak_ke" type="number" min="1" required value={event.anak_ke ?? 1} />
        </div>

        <div class="field">
          <label>Nama Bapak *</label>
          <input
            name="nama_bapak"
            required
            value={event.nama_bapak ?? ""}
            placeholder="Ahmad Fauzi"
          />
        </div>

        <div class="field">
          <label>Nama Ibu *</label>
          <input name="nama_ibu" required value={event.nama_ibu ?? ""} placeholder="Siti Rahayu" />
        </div>

        <div class="field" style="grid-column: span 2">
          <label>Alamat Acara *</label>
          <textarea
            name="alamat"
            rows="2"
            required
            placeholder="Jl. Mawar No. 12, RT 03/05, Kel. Cipete, Jakarta Selatan"
            >{event.alamat ?? ""}</textarea
          >
        </div>

        <div class="field">
          <label>Tanggal & Waktu Acara *</label>
          <input name="tanggal" type="datetime-local" required value={event.tanggal ?? ""} />
        </div>

        <div class="field">
          <label>Foto Anak</label>
          <input name="foto" type="file" accept="image/*" />
          {event.foto_path && <img src={event.foto_path} alt="Foto anak" class="preview-img" />}
        </div>
      </div>

      <div class="actions">
        <button type="submit" class="btn btn-primary">💾 Simpan Data Acara</button>
      </div>
    </form>
  </div>
</Layout>

<style>
  .card {
    background: #fff;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
  }
  .card h2 {
    font-size: 1rem;
    font-weight: 700;
    color: #2d6a4f;
    margin-bottom: 20px;
  }
  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
  @media (max-width: 600px) {
    .form-grid {
      grid-template-columns: 1fr;
    }
    .field[style] {
      grid-column: span 1 !important;
    }
  }
  .field label {
    font-size: 0.8rem;
    font-weight: 600;
    color: #555;
    display: block;
    margin-bottom: 5px;
  }
  input,
  textarea,
  select {
    width: 100%;
    padding: 9px 12px;
    border: 1.5px solid #ddd;
    border-radius: 8px;
    font-size: 0.875rem;
    font-family: inherit;
    transition: 0.2s;
    resize: vertical;
  }
  input:focus,
  textarea:focus {
    outline: none;
    border-color: #52b788;
  }
  .preview-img {
    margin-top: 10px;
    width: 90px;
    height: 90px;
    object-fit: cover;
    border-radius: 8px;
    border: 2px solid #52b788;
  }
  .actions {
    margin-top: 20px;
  }
  .btn {
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 600;
  }
  .btn-primary {
    background: #2d6a4f;
    color: #fff;
  }
  .btn-primary:hover {
    background: #245a41;
  }
  .alert {
    padding: 10px 14px;
    border-radius: 8px;
    margin-bottom: 16px;
    font-size: 0.875rem;
    font-weight: 600;
  }
  .alert.success {
    background: #d8f3dc;
    color: #1b4332;
  }
  .alert.error {
    background: #ffe0e0;
    color: #9b1c1c;
  }
</style>

<script>
  const form = document.getElementById("form-acara") as HTMLFormElement;
  const alert = document.getElementById("alert") as HTMLDivElement;

  // Preview foto sebelum upload
  const fotoInput = form.querySelector('input[name="foto"]') as HTMLInputElement;
  fotoInput.addEventListener("change", () => {
    const file = fotoInput.files?.[0];
    if (!file) return;
    let img = form.querySelector(".preview-img") as HTMLImageElement;
    if (!img) {
      img = document.createElement("img");
      img.className = "preview-img";
      fotoInput.after(img);
    }
    img.src = URL.createObjectURL(file);
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
    btn.disabled = true;
    btn.textContent = "Menyimpan...";

    try {
      const fd = new FormData(form);
      const res = await fetch("/api/event", { method: "POST", body: fd });
      const data = await res.json();

      if (data.ok) {
        showAlert("✅ Data acara berhasil disimpan!", "success");
      } else {
        throw new Error("Gagal simpan");
      }
    } catch {
      showAlert("❌ Terjadi kesalahan, coba lagi.", "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "💾 Simpan Data Acara";
    }
  });

  function showAlert(msg: string, type: "success" | "error") {
    alert.textContent = msg;
    alert.className = `alert ${type}`;
    alert.style.display = "block";
    setTimeout(() => {
      alert.style.display = "none";
    }, 4000);
  }
</script>

```
---

## src/pages/api/broadcast.ts
```ts
// src/pages/api/broadcast.ts
import type { APIRoute } from "astro";
import db from "../../lib/db";
import { sendWA } from "../../lib/whatsapp";

export const POST: APIRoute = async ({ request }) => {
  const { tamu_id, pesan } = await request.json();

  if (!tamu_id || !pesan?.trim()) {
    return new Response(JSON.stringify({ ok: false, error: "Data tidak valid" }), { status: 400 });
  }

  const tamu = db.prepare("SELECT * FROM tamu WHERE id = ?").get(tamu_id) as any;
  if (!tamu) {
    return new Response(JSON.stringify({ ok: false, error: "Tamu tidak ditemukan" }), {
      status: 404,
    });
  }

  // Simpan record broadcast dulu dengan status pending
  const rec = db
    .prepare("INSERT INTO broadcast (tamu_id, pesan, status) VALUES (?, ?, ?)")
    .run(tamu_id, pesan, "pending");

  const broadcastId = rec.lastInsertRowid;

  try {
    await sendWA(tamu.no_telpon, pesan);
    db.prepare(
      "UPDATE broadcast SET status = 'sent', sent_at = datetime('now','localtime') WHERE id = ?"
    ).run(broadcastId);
    return new Response(JSON.stringify({ ok: true, status: "sent" }));
  } catch (err: any) {
    db.prepare("UPDATE broadcast SET status = 'failed' WHERE id = ?").run(broadcastId);
    return new Response(JSON.stringify({ ok: false, status: "failed", error: err.message }));
  }
};

// Tambahkan ke src/pages/api/broadcast.ts
export const GET: APIRoute = () => {
  const rows = db.prepare(`
    SELECT b.*, t.nama, t.no_telpon
    FROM broadcast b
    JOIN tamu t ON t.id = b.tamu_id
    ORDER BY b.id DESC
    LIMIT 100
  `).all();
  return new Response(JSON.stringify(rows), {
    headers: { 'Content-Type': 'application/json' },
  });
};

```
---

## src/pages/api/event.ts
```ts
// src/pages/api/event.ts
import type { APIRoute } from "astro";
import db from "../../lib/db";
import path from "path";
import fs from "fs";

export const GET: APIRoute = () => {
  const row = db.prepare("SELECT * FROM event WHERE id = 1").get();
  return new Response(JSON.stringify(row ?? {}), {
    headers: { "Content-Type": "application/json" },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();

  const nama_anak = form.get("nama_anak") as string;
  const anak_ke = parseInt(form.get("anak_ke") as string) || 1;
  const nama_bapak = form.get("nama_bapak") as string;
  const nama_ibu = form.get("nama_ibu") as string;
  const alamat = form.get("alamat") as string;
  const tanggal = form.get("tanggal") as string;
  const foto = form.get("foto") as File | null;

  // Ambil foto_path lama jika tidak upload baru
  const existing = db.prepare("SELECT foto_path FROM event WHERE id = 1").get() as any;
  let foto_path = existing?.foto_path ?? "";

  if (foto && foto.size > 0) {
    const ext = foto.name.split(".").pop();
    const filename = `anak_${Date.now()}.${ext}`;
    const dest = path.resolve("public/uploads", filename);
    const buf = Buffer.from(await foto.arrayBuffer());
    fs.writeFileSync(dest, buf);
    foto_path = `/uploads/${filename}`;
  }

  db.prepare(
    `
    INSERT INTO event (id, nama_anak, foto_path, anak_ke, nama_bapak, nama_ibu, alamat, tanggal)
    VALUES (1, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      nama_anak  = excluded.nama_anak,
      foto_path  = excluded.foto_path,
      anak_ke    = excluded.anak_ke,
      nama_bapak = excluded.nama_bapak,
      nama_ibu   = excluded.nama_ibu,
      alamat     = excluded.alamat,
      tanggal    = excluded.tanggal
  `
  ).run(nama_anak, foto_path, anak_ke, nama_bapak, nama_ibu, alamat, tanggal);

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
};

```
---

## src/pages/api/kartu/upload.ts
```ts
// src/pages/api/kartu/upload.ts
import type { APIRoute } from "astro";
import fs from "fs";
import path from "path";

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const file = form.get("file") as File;
  const filename = form.get("filename") as string;

  if (!file || !filename) {
    return new Response(JSON.stringify({ ok: false, error: "Data tidak lengkap" }), {
      status: 400,
    });
  }

  // Sanitasi filename
  const safe = filename.replace(/[^a-zA-Z0-9À-ÿ_\-\.]/g, "_");
  const dest = path.resolve("public/uploads/kartu", safe);
  const buf = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(dest, buf);

  const siteUrl = import.meta.env.SITE_URL ?? "http://localhost:4000";
  const url = `${siteUrl}/uploads/kartu/${safe}`;

  return new Response(JSON.stringify({ ok: true, url }), {
    headers: { "Content-Type": "application/json" },
  });
};

```
---

## src/pages/api/tamu/import.ts
```ts
// src/pages/api/tamu/import.ts
import type { APIRoute } from "astro";
import * as XLSX from "xlsx";
import db from "../../../lib/db";
import { normalizePhone } from "../../../lib/phone";

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const file = form.get("file") as File;

  if (!file || file.size === 0) {
    return new Response(JSON.stringify({ ok: false, error: "File tidak ditemukan" }), {
      status: 400,
    });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const wb = XLSX.read(buf, { type: "buffer" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: "" }) as Record<string, any>[];

  // Cari kolom fleksibel (case-insensitive, trim)
  const normalize = (s: string) => s.toLowerCase().replace(/[\s_]/g, "");
  const findKey = (row: Record<string, any>, candidates: string[]) =>
    Object.keys(row).find((k) => candidates.includes(normalize(k)));

  let inserted = 0;
  let skipped = 0;

  const insert = db.prepare("INSERT INTO tamu (nama, alamat, no_telpon) VALUES (?, ?, ?)");
  const importAll = db.transaction((data: typeof rows) => {
    for (const row of data) {
      const namaKey = findKey(row, ["namalengkap", "nama"]);
      const alamatKey = findKey(row, ["alamat"]);
      const hpKey = findKey(row, ["notelpon", "notelepon", "nohp", "telepon", "hp", "phone"]);

      const nama = namaKey ? String(row[namaKey]).trim() : "";
      if (!nama) {
        skipped++;
        continue;
      }

      const alamat = alamatKey ? String(row[alamatKey]).trim() : "";
      const hp = hpKey ? normalizePhone(String(row[hpKey])) : "";

      insert.run(nama, alamat, hp);
      inserted++;
    }
  });

  importAll(rows);

  return new Response(JSON.stringify({ ok: true, inserted, skipped }), {
    headers: { "Content-Type": "application/json" },
  });
};

```
---

## src/pages/api/tamu.ts
```ts
// src/pages/api/tamu.ts
import type { APIRoute } from "astro";
import db from "../../lib/db";
import { normalizePhone } from "../../lib/phone";

// GET — ambil semua tamu
export const GET: APIRoute = () => {
  const rows = db
    .prepare(
      `
    SELECT t.*,
      (SELECT status FROM broadcast WHERE tamu_id = t.id ORDER BY id DESC LIMIT 1) as broadcast_status
    FROM tamu t
    ORDER BY t.id DESC
  `
    )
    .all();
  return new Response(JSON.stringify(rows), {
    headers: { "Content-Type": "application/json" },
  });
};

// POST — tambah satu tamu
export const POST: APIRoute = async ({ request }) => {
  const { nama, alamat, no_telpon } = await request.json();
  if (!nama?.trim()) {
    return new Response(JSON.stringify({ ok: false, error: "Nama wajib diisi" }), { status: 400 });
  }
  const phone = no_telpon ? normalizePhone(no_telpon) : "";
  const result = db
    .prepare("INSERT INTO tamu (nama, alamat, no_telpon) VALUES (?, ?, ?)")
    .run(nama.trim(), alamat?.trim() ?? "", phone);

  return new Response(JSON.stringify({ ok: true, id: result.lastInsertRowid }), {
    headers: { "Content-Type": "application/json" },
  });
};

// DELETE — hapus tamu by id (query param)
export const DELETE: APIRoute = ({ url }) => {
  const id = url.searchParams.get("id");
  if (!id) return new Response(JSON.stringify({ ok: false }), { status: 400 });
  db.prepare("DELETE FROM tamu WHERE id = ?").run(id);
  return new Response(JSON.stringify({ ok: true }));
};

// Tambahkan ke src/pages/api/tamu.ts
export const PUT: APIRoute = async ({ request }) => {
  const { id, nama, alamat, no_telpon } = await request.json();
  if (!id || !nama?.trim()) {
    return new Response(JSON.stringify({ ok: false, error: 'Data tidak valid' }), { status: 400 });
  }
  const phone = no_telpon ? normalizePhone(no_telpon) : '';
  db.prepare(
    'UPDATE tamu SET nama = ?, alamat = ?, no_telpon = ? WHERE id = ?'
  ).run(nama.trim(), alamat?.trim() ?? '', phone, id);

  return new Response(JSON.stringify({ ok: true }));
};

// Tambahkan ke src/pages/api/tamu/index.ts
export const PATCH: APIRoute = async ({ request }) => {
  const { id, kartu_url } = await request.json();
  if (!id || !kartu_url) {
    return new Response(JSON.stringify({ ok: false }), { status: 400 });
  }
  db.prepare('UPDATE tamu SET kartu_url = ? WHERE id = ?').run(kartu_url, id);
  return new Response(JSON.stringify({ ok: true }));
};

```
---

## src/pages/broadcast.astro
```astro
---
// src/pages/broadcast.astro
import Layout from "../layouts/Layout.astro";
import db from "../lib/db";

const event = db.prepare("SELECT * FROM event WHERE id = 1").get() as any;
const tamu = db
  .prepare(
    `
  SELECT t.*,
    (SELECT status FROM broadcast WHERE tamu_id = t.id ORDER BY id DESC LIMIT 1) as last_status
  FROM tamu t
  WHERE t.no_telpon != '' AND t.no_telpon IS NOT NULL
  ORDER BY t.nama ASC
`
  )
  .all() as any[];
---

<Layout title="Broadcast WhatsApp">
  {
    !event && (
      <div class="banner">
        ⚠️ Data acara belum diisi. <a href="/acara">Setup dulu →</a>
      </div>
    )
  }

  <div class="grid-layout">
    <!-- Kiri: Compose & Kirim -->
    <div>
      <!-- Template Pesan -->
      <div class="card">
        <h2>✍️ Compose Pesan</h2>

        <div class="template-pills">
          <span class="pill-label">Template cepat:</span>
          <button class="pill" data-tpl="formal">Formal</button>
          <button class="pill" data-tpl="santai">Santai</button>
          <button class="pill" data-tpl="singkat">Singkat</button>
        </div>

        <div class="var-hint">
          Variabel: <code set:html="{{nama}}" />
          <code set:html="{{nama_anak}}" />
          <code set:html="{{tanggal}}" />
          <code set:html="{{alamat}}" />
        </div>

        <textarea id="pesan-template" rows="8" placeholder="Tulis pesan di sini..."></textarea>

        <div class="preview-box">
          <p class="preview-title">👁️ Preview pesan (contoh untuk tamu pertama)</p>
          <pre id="pesan-preview"></pre>
        </div>
      </div>

      <!-- Pilih Penerima -->
      <div class="card">
        <h2>👥 Pilih Penerima</h2>

        <div class="filter-row">
          <input id="search-tamu" placeholder="🔍 Cari nama..." />
          <select id="filter-kirim">
            <option value="">Semua</option>
            <option value="belum">Belum Terkirim</option>
            <option value="sent">Sudah Terkirim</option>
            <option value="failed">Gagal</option>
          </select>
        </div>

        <div class="check-all-row">
          <label>
            <input type="checkbox" id="check-all" />
            <strong>Pilih Semua</strong>
          </label>
          <span id="selected-count" class="selected-count">0 dipilih</span>
        </div>

        <div id="tamu-list" class="tamu-list"></div>

        <div id="no-hp-warning" class="alert info" style="display:none">
          ⚠️ Tamu tanpa nomor HP tidak ditampilkan di sini.
          <a href="/tamu">Lengkapi data →</a>
        </div>
      </div>

      <!-- Tombol Kirim -->
      <div class="card">
        <button class="btn btn-wa btn-block" id="btn-broadcast"> 📢 Mulai Broadcast </button>

        <!-- Progress -->
        <div id="progress-wrap" style="display:none;margin-top:16px">
          <div class="progress-bg"><div class="progress-fill" id="progress-fill"></div></div>
          <p id="progress-label" class="progress-label"></p>
          <div id="progress-log" class="progress-log"></div>
          <button class="btn btn-danger btn-sm" id="btn-stop" style="margin-top:8px">⛔ Stop</button
          >
        </div>
      </div>
    </div>

    <!-- Kanan: Riwayat -->
    <div>
      <div class="card">
        <div
          style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"
        >
          <h2 style="margin:0">📜 Riwayat Broadcast</h2>
          <button class="btn btn-secondary btn-sm" id="btn-refresh-log">🔄 Refresh</button>
        </div>
        <div id="riwayat-list" class="riwayat-list"></div>
      </div>
    </div>
  </div>
</Layout>

<script define:vars={{ event, tamu }}>
  window.__EVENT__ = event;
  window.__TAMU__ = tamu;
</script>

<script>
  const ev = (window as any).__EVENT__;
  const tamuAll = (window as any).__TAMU__ as any[];

  // ── Template Pesan ──────────────────────────────────────────────────────────
  const TEMPLATES: Record<string, string> = {
    formal: `Assalamu'alaikum Wr. Wb.

Kepada Yth. Bapak/Ibu/Saudara/i {{nama}}

Dengan memohon Ridho Allah SWT, kami mengundang Bapak/Ibu/Saudara/i untuk hadir dalam acara Syukuran Khitanan putra kami:

*{{nama_anak}}*

📅 {{tanggal}}
📍 {{alamat}}
🎴 Kartu Undangan: {{kartu_url}}

Kehadiran Bapak/Ibu/Saudara/i merupakan kehormatan dan kebahagiaan bagi kami.

Wassalamu'alaikum Wr. Wb.`,

    santai: `Halo {{nama}} 👋

Kami dengan bahagia mengundang kamu ke acara khitanan putra kami *{{nama_anak}}*! 🎉

📅 {{tanggal}}
📍 {{alamat}}
🎴 Kartu Undangan: {{kartu_url}}

Yuk hadir, kita rayakan bersama! 🤲`,

    singkat: `Assalamu'alaikum, {{nama}}.

Kami mengundang ke acara Khitanan *{{nama_anak}}* pada {{tanggal}} di {{alamat}}.
🎴 Kartu Undangan: {{kartu_url}}

Mohon kehadiran Bapak/Ibu. Terima kasih 🙏`,
  };

  function resolveVars(template: string, nama: string, kartuUrl?: string): string {
    const tgl = ev
      ? new Date(ev.tanggal).toLocaleString("id-ID", { dateStyle: "full", timeStyle: "short" })
      : "";
    return template
      .replace(/{{nama}}/g, nama)
      .replace(/{{nama_anak}}/g, ev?.nama_anak ?? "")
      .replace(/{{tanggal}}/g, tgl)
      .replace(/{{alamat}}/g, ev?.alamat ?? "")
      .replace(/{{kartu_url}}/g, kartuUrl ?? "(kartu belum di-upload)");
  }

  const pesanTA = document.getElementById("pesan-template") as HTMLTextAreaElement;
  const pesanPrev = document.getElementById("pesan-preview") as HTMLPreElement;

  function updatePreview() {
    const sample = tamuAll[0]?.nama ?? "Budi Santoso";
    pesanPrev.textContent = resolveVars(pesanTA.value, sample);
  }

  pesanTA.addEventListener("input", updatePreview);

  // Template pills
  document.querySelectorAll(".pill[data-tpl]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = (btn as HTMLElement).dataset.tpl!;
      pesanTA.value = TEMPLATES[key] ?? "";
      updatePreview();
    });
  });

  // Default template
  pesanTA.value = TEMPLATES.formal;
  updatePreview();

  // ── Render Daftar Tamu ──────────────────────────────────────────────────────
  let filteredTamu = [...tamuAll];

  function renderTamuList(data: any[]) {
    const list = document.getElementById("tamu-list")!;
    const warn = document.getElementById("no-hp-warning")!;

    // Cek ada tamu tanpa HP
    const tamuNoHp = (window as any).__TAMU_ALL_COUNT__ > tamuAll.length;
    warn.style.display = tamuNoHp ? "block" : "none";

    if (data.length === 0) {
      list.innerHTML =
        '<p style="color:#aaa;font-size:.85rem;padding:8px">Tidak ada tamu ditemukan.</p>';
      updateSelectedCount();
      return;
    }

    list.innerHTML = data
      .map(
        (t) => `
    <label class="tamu-item ${t.last_status === "sent" ? "sent" : ""}">


<input type="checkbox" class="tamu-check"
  data-id="${t.id}"
  data-nama="${t.nama}"
  data-kartu-url="${t.kartu_url ?? ""}"   // ← tambah ini
/>
      <div class="tamu-info">
        <strong>${t.nama}</strong>
        <span>${t.no_telpon}</span>
      </div>
      ${statusTag(t.last_status)}
    </label>
  `
      )
      .join("");

    document
      .querySelectorAll(".tamu-check")
      .forEach((cb) => cb.addEventListener("change", updateSelectedCount));
    updateSelectedCount();
  }

  function statusTag(s: string | null) {
    if (s === "sent") return '<span class="badge badge-sent">✅ Terkirim</span>';
    if (s === "failed") return '<span class="badge badge-failed">❌ Gagal</span>';
    if (s === "pending") return '<span class="badge badge-pending">⏳ Pending</span>';
    return '<span class="badge badge-none">Belum</span>';
  }

  function updateSelectedCount() {
    const n = document.querySelectorAll(".tamu-check:checked").length;
    document.getElementById("selected-count")!.textContent = `${n} dipilih`;
  }

  // Filter & Search
  function applyFilter() {
    const q = (document.getElementById("search-tamu") as HTMLInputElement).value.toLowerCase();
    const status = (document.getElementById("filter-kirim") as HTMLSelectElement).value;
    filteredTamu = tamuAll.filter((t) => {
      const matchName = t.nama.toLowerCase().includes(q);
      const matchStatus = !status
        ? true
        : status === "belum"
          ? !t.last_status || t.last_status === "failed"
          : status === "sent"
            ? t.last_status === "sent"
            : status === "failed"
              ? t.last_status === "failed"
              : true;
      return matchName && matchStatus;
    });
    renderTamuList(filteredTamu);
  }

  document.getElementById("search-tamu")!.addEventListener("input", applyFilter);
  document.getElementById("filter-kirim")!.addEventListener("change", applyFilter);

  // Check all
  document.getElementById("check-all")!.addEventListener("change", (e) => {
    const checked = (e.target as HTMLInputElement).checked;
    document.querySelectorAll(".tamu-check").forEach((cb: any) => (cb.checked = checked));
    updateSelectedCount();
  });

  renderTamuList(tamuAll);

  // ── Broadcast ───────────────────────────────────────────────────────────────
  let stopFlag = false;

  document.getElementById("btn-stop")!.addEventListener("click", () => {
    stopFlag = true;
  });

  document.getElementById("btn-broadcast")!.addEventListener("click", async () => {
    const selected = Array.from(
      document.querySelectorAll(".tamu-check:checked")
    ) as HTMLInputElement[];

    if (!selected.length) {
      alert("Pilih minimal 1 tamu.");
      return;
    }
    if (!pesanTA.value.trim()) {
      alert("Tulis pesan terlebih dahulu.");
      return;
    }
    if (!confirm(`Kirim pesan ke ${selected.length} tamu?`)) return;

    stopFlag = false;
    const btn = document.getElementById("btn-broadcast") as HTMLButtonElement;
    const progressWrap = document.getElementById("progress-wrap")!;
    const progressFill = document.getElementById("progress-fill")! as HTMLElement;
    const progressLbl = document.getElementById("progress-label")!;
    const progressLog = document.getElementById("progress-log")!;

    btn.disabled = true;
    progressWrap.style.display = "block";
    progressLog.innerHTML = "";

    let sent = 0,
      failed = 0;

    for (let i = 0; i < selected.length; i++) {
      if (stopFlag) {
        progressLbl.textContent = `⛔ Dihentikan pada tamu ke-${i + 1}.`;
        break;
      }

      const id = selected[i].dataset.id!;
      // Di loop broadcast, ubah:
      const nama = selected[i].dataset.nama!;
      const kartuUrl = selected[i].dataset.kartuUrl ?? ""; // ← tambah
      const pesan = resolveVars(pesanTA.value, nama, kartuUrl); // ← pass kartuUrl

      progressLbl.textContent = `Mengirim ${i + 1}/${selected.length}: ${nama}...`;
      progressFill.style.width = `${Math.round(((i + 1) / selected.length) * 100)}%`;

      try {
        const res = await fetch("/api/broadcast", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tamu_id: parseInt(id), pesan }),
        });
        const data = await res.json();

        if (data.ok) {
          sent++;
          addLog(progressLog, `✅ ${nama}`, "success");
        } else {
          failed++;
          addLog(progressLog, `❌ ${nama} — ${data.error ?? "Gagal"}`, "error");
        }
      } catch {
        failed++;
        addLog(progressLog, `❌ ${nama} — Network error`, "error");
      }

      // Delay 2.5 detik antar kirim
      if (i < selected.length - 1 && !stopFlag) {
        await new Promise((r) => setTimeout(r, 2500));
      }
    }

    if (!stopFlag) {
      progressLbl.textContent = `✅ Selesai! ${sent} terkirim, ${failed} gagal.`;
    }

    btn.disabled = false;
    loadRiwayat();
  });

  function addLog(container: HTMLElement, msg: string, type: string) {
    const p = document.createElement("p");
    p.textContent = msg;
    p.className = `log-item log-${type}`;
    container.prepend(p);
  }

  // ── Riwayat ──────────────────────────────────────────────────────────────────
  async function loadRiwayat() {
    const res = await fetch("/api/broadcast");
    const rows = (await res.json()) as any[];
    const list = document.getElementById("riwayat-list")!;

    if (!rows.length) {
      list.innerHTML = '<p style="color:#aaa;font-size:.85rem">Belum ada riwayat.</p>';
      return;
    }

    list.innerHTML = rows
      .map(
        (r) => `
    <div class="riwayat-item">
      <div class="riwayat-top">
        <strong>${r.nama}</strong>
        ${statusTag(r.status)}
      </div>
      <p class="riwayat-hp">${r.no_telpon}</p>
      <p class="riwayat-pesan">${r.pesan.substring(0, 80)}${r.pesan.length > 80 ? "..." : ""}</p>
      <p class="riwayat-time">${r.sent_at ?? r.status}</p>
    </div>
  `
      )
      .join("");
  }

  document.getElementById("btn-refresh-log")!.addEventListener("click", loadRiwayat);
  loadRiwayat();
</script>

<style>
  .banner {
    background: #fff3cd;
    border: 1px solid #ffc107;
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 16px;
    font-size: 0.875rem;
  }
  .banner a {
    color: #2d6a4f;
    font-weight: 700;
  }
  .card {
    background: #fff;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
    margin-bottom: 16px;
  }
  .card h2 {
    font-size: 1rem;
    font-weight: 700;
    color: #2d6a4f;
    margin-bottom: 12px;
  }

  .grid-layout {
    display: grid;
    grid-template-columns: 1.4fr 1fr;
    gap: 16px;
  }
  @media (max-width: 800px) {
    .grid-layout {
      grid-template-columns: 1fr;
    }
  }

  .template-pills {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 10px;
  }
  .pill-label {
    font-size: 0.78rem;
    color: #888;
    font-weight: 600;
  }
  .pill {
    padding: 4px 12px;
    border: 1.5px solid #52b788;
    border-radius: 99px;
    background: #fff;
    color: #2d6a4f;
    font-size: 0.78rem;
    font-weight: 700;
    cursor: pointer;
  }
  .pill:hover {
    background: #e9f5ee;
  }

  .var-hint {
    font-size: 0.75rem;
    color: #888;
    margin-bottom: 8px;
  }
  code {
    background: #f0f4f0;
    padding: 1px 5px;
    border-radius: 4px;
    font-size: 0.73rem;
  }

  textarea {
    width: 100%;
    padding: 10px 12px;
    border: 1.5px solid #ddd;
    border-radius: 8px;
    font-size: 0.85rem;
    font-family: inherit;
    resize: vertical;
  }
  textarea:focus {
    outline: none;
    border-color: #52b788;
  }

  .preview-box {
    background: #f9fffe;
    border: 1px solid #b7e4c7;
    border-radius: 8px;
    padding: 12px;
    margin-top: 10px;
  }
  .preview-title {
    font-size: 0.75rem;
    color: #52b788;
    font-weight: 700;
    margin-bottom: 6px;
  }
  pre {
    font-family: inherit;
    font-size: 0.8rem;
    color: #333;
    white-space: pre-wrap;
    word-break: break-word;
    margin: 0;
  }

  .filter-row {
    display: flex;
    gap: 8px;
    margin-bottom: 10px;
  }
  .filter-row input,
  .filter-row select {
    flex: 1;
    padding: 8px 10px;
    border: 1.5px solid #ddd;
    border-radius: 8px;
    font-size: 0.85rem;
  }
  .filter-row input:focus,
  .filter-row select:focus {
    outline: none;
    border-color: #52b788;
  }

  .check-all-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 0;
    border-bottom: 1px solid #f0f0f0;
    margin-bottom: 8px;
    font-size: 0.85rem;
  }
  .selected-count {
    font-size: 0.78rem;
    color: #52b788;
    font-weight: 700;
  }

  .tamu-list {
    max-height: 320px;
    overflow-y: auto;
  }
  .tamu-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 6px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.85rem;
  }
  .tamu-item:hover {
    background: #f5faf7;
  }
  .tamu-item.sent {
    opacity: 0.6;
  }
  .tamu-info {
    flex: 1;
  }
  .tamu-info strong {
    display: block;
  }
  .tamu-info span {
    font-size: 0.75rem;
    color: #888;
  }

  .badge {
    padding: 2px 8px;
    border-radius: 20px;
    font-size: 0.72rem;
    font-weight: 700;
    white-space: nowrap;
  }
  .badge-sent {
    background: #d8f3dc;
    color: #1b4332;
  }
  .badge-failed {
    background: #ffe0e0;
    color: #9b1c1c;
  }
  .badge-pending {
    background: #fff3cd;
    color: #856404;
  }
  .badge-none {
    background: #f0f0f0;
    color: #888;
  }

  .btn {
    padding: 9px 16px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 600;
  }
  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .btn-block {
    width: 100%;
    padding: 12px;
    font-size: 1rem;
  }
  .btn-wa {
    background: #25d366;
    color: #fff;
  }
  .btn-wa:hover:not(:disabled) {
    background: #1ebe5d;
  }
  .btn-secondary {
    background: #6c757d;
    color: #fff;
  }
  .btn-danger {
    background: #e63946;
    color: #fff;
  }
  .btn-sm {
    padding: 6px 12px;
    font-size: 0.78rem;
  }

  .progress-bg {
    background: #e0e0e0;
    border-radius: 99px;
    height: 10px;
    overflow: hidden;
  }
  .progress-fill {
    background: linear-gradient(90deg, #25d366, #1ebe5d);
    height: 100%;
    width: 0%;
    transition: width 0.3s;
    border-radius: 99px;
  }
  .progress-label {
    font-size: 0.8rem;
    color: #555;
    margin-top: 6px;
  }
  .progress-log {
    max-height: 160px;
    overflow-y: auto;
    margin-top: 8px;
  }
  .log-item {
    font-size: 0.78rem;
    padding: 3px 0;
    border-bottom: 1px solid #f5f5f5;
  }
  .log-success {
    color: #1b4332;
  }
  .log-error {
    color: #9b1c1c;
  }

  .alert.info {
    background: #e0f0ff;
    color: #1a4f7a;
    border-radius: 8px;
    padding: 10px 14px;
    font-size: 0.82rem;
  }
  .alert.info a {
    color: #2d6a4f;
    font-weight: 700;
  }

  .riwayat-list {
    max-height: 560px;
    overflow-y: auto;
  }
  .riwayat-item {
    padding: 10px 0;
    border-bottom: 1px solid #f0f0f0;
  }
  .riwayat-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 3px;
  }
  .riwayat-hp {
    font-size: 0.75rem;
    color: #888;
  }
  .riwayat-pesan {
    font-size: 0.78rem;
    color: #555;
    margin-top: 3px;
    white-space: pre-wrap;
  }
  .riwayat-time {
    font-size: 0.72rem;
    color: #bbb;
    margin-top: 2px;
  }
</style>

```
---

## src/pages/index.astro
```astro
---
// src/pages/index.astro
import Layout from "../layouts/Layout.astro";
import db from "../lib/db";

const event = db.prepare("SELECT * FROM event WHERE id = 1").get() as any;
const total = (db.prepare("SELECT COUNT(*) as n FROM tamu").get() as any).n;
const sent = (db.prepare("SELECT COUNT(*) as n FROM broadcast WHERE status='sent'").get() as any).n;
const failed = (
  db.prepare("SELECT COUNT(*) as n FROM broadcast WHERE status='failed'").get() as any
).n;
---

<Layout title="Dashboard">
  {
    !event && (
      <div class="banner">
        ⚠️ Data acara belum diisi. <a href="/acara">Setup sekarang →</a>
      </div>
    )
  }

  {
    event && (
      <div class="event-summary card">
        <div class="foto-wrap">
          {event.foto_path ? (
            <img src={event.foto_path} alt="foto" />
          ) : (
            <div class="foto-placeholder">📷</div>
          )}
        </div>
        <div class="event-info">
          <p class="bismillah">بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ</p>
          <h2>Khitanan {event.nama_anak}</h2>
          <p>
            Putra ke-{event.anak_ke} dari <strong>{event.nama_bapak}</strong> &{" "}
            <strong>{event.nama_ibu}</strong>
          </p>
          <p>
            📅{" "}
            {new Date(event.tanggal).toLocaleString("id-ID", {
              dateStyle: "full",
              timeStyle: "short",
            })}
          </p>
          <p>📍 {event.alamat}</p>
        </div>
      </div>
    )
  }

  <div class="stats">
    <div class="stat-card">
      <span class="stat-num">{total}</span>
      <span class="stat-label">Total Tamu</span>
    </div>
    <div class="stat-card">
      <span class="stat-num" style="color:#40916c">{sent}</span>
      <span class="stat-label">Terkirim</span>
    </div>
    <div class="stat-card">
      <span class="stat-num" style="color:#e63946">{failed}</span>
      <span class="stat-label">Gagal</span>
    </div>
    <div class="stat-card">
      <span class="stat-num" style="color:#f4a261">{total - sent}</span>
      <span class="stat-label">Belum Kirim</span>
    </div>
  </div>
</Layout>

<style>
  .banner {
    background: #fff3cd;
    border: 1px solid #ffc107;
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 16px;
    font-size: 0.875rem;
  }
  .banner a {
    color: #2d6a4f;
    font-weight: 700;
  }
  .card {
    background: #fff;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
    margin-bottom: 16px;
  }
  .event-summary {
    display: flex;
    gap: 20px;
    align-items: flex-start;
  }
  .foto-wrap img,
  .foto-placeholder {
    width: 100px;
    height: 100px;
    border-radius: 10px;
    object-fit: cover;
    border: 2px solid #52b788;
    flex-shrink: 0;
  }
  .foto-placeholder {
    background: #e9f5ee;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
  }
  .event-info {
    flex: 1;
  }
  .bismillah {
    font-size: 1.1rem;
    color: #2d6a4f;
    margin-bottom: 6px;
  }
  .event-info h2 {
    font-size: 1.2rem;
    color: #1b4332;
    margin-bottom: 6px;
  }
  .event-info p {
    font-size: 0.875rem;
    color: #555;
    margin-bottom: 4px;
  }
  .stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
  }
  @media (max-width: 600px) {
    .stats {
      grid-template-columns: repeat(2, 1fr);
    }
    .event-summary {
      flex-direction: column;
    }
  }
  .stat-card {
    background: #fff;
    border-radius: 10px;
    padding: 16px;
    text-align: center;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  }
  .stat-num {
    display: block;
    font-size: 2rem;
    font-weight: 800;
    color: #2d6a4f;
  }
  .stat-label {
    font-size: 0.78rem;
    color: #888;
    font-weight: 600;
  }
</style>

```
---

## src/pages/kartu.astro
```astro
---
// src/pages/kartu.astro
import Layout from '../layouts/Layout.astro';
import db from '../lib/db';

const event    = db.prepare('SELECT * FROM event WHERE id = 1').get() as any;
const tamuRes  = db.prepare('SELECT id, nama, kartu_url FROM tamu ORDER BY nama ASC').all() as any[];
const tamu     = tamuRes;
---
<Layout title="Kartu Undangan">

  {!event && (
    <div class="banner">⚠️ Data acara belum diisi. <a href="/acara">Setup dulu →</a></div>
  )}

  {event && (
    <>
      <!-- Kontrol -->
      <div class="card">
        <h2>🎴 Generate Kartu Undangan</h2>

        <div class="control-row">
          <div class="field" style="flex:1">
            <label>Pilih Tamu</label>
            <select id="sel-tamu">
              <option value="">— Pilih tamu —</option>
              {tamu.map(t => <option value={t.id} data-nama={t.nama}>{t.nama}</option>)}
            </select>
          </div>
          <div class="btn-group">
            <button class="btn btn-primary"   id="btn-preview">👁️ Preview</button>
            <button class="btn btn-success"   id="btn-download-satu"    disabled>⬇️ Download</button>
            <button class="btn btn-secondary" id="btn-upload-satu"      disabled>☁️ Upload URL</button>
            <button class="btn btn-warning"   id="btn-download-semua">📦 Download Semua</button>
            <button class="btn btn-info"      id="btn-upload-semua">☁️ Upload Semua</button>
        </div>
        </div>

        <!-- Progress download semua -->
        <div id="progress-wrap" style="display:none;margin-top:14px">
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" id="progress-fill"></div>
          </div>
          <p id="progress-label" class="progress-label"></p>
        </div>
      </div>

      <!-- Preview Area -->
<!-- Tambah di bawah preview area -->
<div class="card">
  <h2>📋 Status Kartu Tamu</h2>
  <div class="table-wrap">
    <table>
      <thead>
        <tr><th>Nama</th><th>Status Kartu</th><th>URL</th></tr>
      </thead>
      <tbody>
        {tamu.map(t => (
          <tr>
            <td>{t.nama}</td>
            <td>
              {t.kartu_url
                ? <span class="badge badge-sent">✅ Siap</span>
                : <span class="badge badge-none">Belum di-upload</span>
              }
            </td>
            <td>
              {t.kartu_url
                ? <a href={t.kartu_url} target="_blank" class="url-link">Lihat →</a>
                : '—'
              }
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
    </>
  )}

  <!-- Hidden render target untuk html2canvas -->
  <div id="render-target" style="position:fixed;left:-9999px;top:0;z-index:-1"></div>

</Layout>

<!-- Inject data acara ke window -->
<script define:vars={{ event, tamu }}>
  window.__EVENT__ = event;
  window.__TAMU__  = tamu;
</script>

<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>

<script>
// ── Template Kartu ──────────────────────────────────────────────────────────
function buildKartuHTML(event: any, namaTamu: string): string {
  const tgl = new Date(event.tanggal);
  const tglFormatted = tgl.toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
  const waktu = tgl.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

  return `
  <div style="
    width:800px; height:500px; position:relative; overflow:hidden;
    font-family:'Georgia',serif;
    background: linear-gradient(135deg, #1b4332 0%, #2d6a4f 40%, #52b788 100%);
  ">
    <!-- Ornamen sudut -->
    <svg style="position:absolute;top:0;left:0;width:160px;opacity:.25" viewBox="0 0 160 160">
      <circle cx="0" cy="0" r="140" fill="none" stroke="#fff" stroke-width="1.5"/>
      <circle cx="0" cy="0" r="110" fill="none" stroke="#fff" stroke-width="1"/>
      <circle cx="0" cy="0" r="80"  fill="none" stroke="#d4af37" stroke-width="1.5"/>
    </svg>
    <svg style="position:absolute;bottom:0;right:0;width:160px;opacity:.25;transform:rotate(180deg)" viewBox="0 0 160 160">
      <circle cx="0" cy="0" r="140" fill="none" stroke="#fff" stroke-width="1.5"/>
      <circle cx="0" cy="0" r="110" fill="none" stroke="#fff" stroke-width="1"/>
      <circle cx="0" cy="0" r="80"  fill="none" stroke="#d4af37" stroke-width="1.5"/>
    </svg>

    <!-- Panel kiri (foto) -->
    <div style="
      position:absolute; left:0; top:0; width:260px; height:500px;
      background:rgba(0,0,0,.25);
      display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px;
    ">
      <div style="
        width:160px; height:160px; border-radius:50%;
        border:4px solid #d4af37;
        overflow:hidden; background:#1b4332;
        display:flex; align-items:center; justify-content:center;
      ">
        ${event.foto_path
          ? `<img src="${event.foto_path}" style="width:100%;height:100%;object-fit:cover" />`
          : `<span style="font-size:3rem">👦</span>`
        }
      </div>
      <p style="color:#d4af37;font-size:13px;text-align:center;padding:0 16px;line-height:1.5">
        Putra ke-${event.anak_ke} dari<br/>
        <strong style="color:#fff">${event.nama_bapak}</strong><br/>
        &amp; <strong style="color:#fff">${event.nama_ibu}</strong>
      </p>
    </div>

    <!-- Garis pembatas emas -->
    <div style="position:absolute;left:260px;top:20px;width:2px;height:460px;background:linear-gradient(to bottom,transparent,#d4af37,#d4af37,transparent)"></div>

    <!-- Panel kanan (isi) -->
    <div style="
      position:absolute; left:278px; top:0; right:0; height:500px;
      display:flex; flex-direction:column; justify-content:center;
      padding:24px 32px 24px 20px;
    ">
      <!-- Bismillah -->
      <p style="color:#d4af37;font-size:18px;text-align:center;margin-bottom:6px;letter-spacing:1px">
        بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ
      </p>

      <!-- Kepada -->
      <p style="color:rgba(255,255,255,.7);font-size:11px;letter-spacing:2px;text-transform:uppercase;margin-bottom:2px">
        Kepada Yth.
      </p>
      <p style="color:#fff;font-size:20px;font-weight:bold;margin-bottom:12px;border-bottom:1px solid rgba(212,175,55,.4);padding-bottom:8px">
        ${namaTamu}
      </p>

      <!-- Undangan -->
      <p style="color:rgba(255,255,255,.85);font-size:12px;line-height:1.7;margin-bottom:12px">
        Dengan penuh kebahagiaan, kami mengundang Bapak/Ibu/Saudara/i
        untuk hadir dalam acara <strong style="color:#d4af37">Khitanan</strong> putra kami:
      </p>

      <!-- Nama anak -->
      <p style="
        color:#d4af37;font-size:28px;font-weight:bold;text-align:center;
        text-shadow:0 2px 8px rgba(0,0,0,.4);margin-bottom:14px;
        letter-spacing:1px;
      ">
        ${event.nama_anak}
      </p>

      <!-- Detail acara -->
      <div style="background:rgba(0,0,0,.25);border-radius:8px;padding:10px 14px;font-size:12px;color:#fff;line-height:2">
        <div>📅 <strong>${tglFormatted}</strong></div>
        <div>⏰ <strong>${waktu}</strong></div>
        <div>📍 <strong>${event.alamat}</strong></div>
      </div>

      <!-- Footer -->
      <p style="color:rgba(255,255,255,.5);font-size:10px;text-align:right;margin-top:10px;font-style:italic">
        Kehadiran Anda adalah kehormatan bagi kami 🤲
      </p>
    </div>
  </div>`;
}

// ── Generate PNG ─────────────────────────────────────────────────────────────
async function generatePNG(event: any, namaTamu: string): Promise<Blob> {
  const target = document.getElementById('render-target')!;
  target.innerHTML = buildKartuHTML(event, namaTamu);
  const el = target.firstElementChild as HTMLElement;

  const canvas = await (window as any).html2canvas(el, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: null,
    width: 800,
    height: 500,
  });

  return new Promise(res => canvas.toBlob(b => res(b!), 'image/png'));
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href = url; a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9À-ÿ\s]/g, '').trim().replace(/\s+/g, '_');
}

// ── Event Listeners ───────────────────────────────────────────────────────────
const ev       = (window as any).__EVENT__;
const tamuList = (window as any).__TAMU__;

const selTamu       = document.getElementById('sel-tamu')       as HTMLSelectElement;
const btnPreview    = document.getElementById('btn-preview')     as HTMLButtonElement;
const btnDlSatu     = document.getElementById('btn-download-satu') as HTMLButtonElement;
const btnDlSemua    = document.getElementById('btn-download-semua') as HTMLButtonElement;
const previewArea   = document.getElementById('preview-area')!;
const progressWrap  = document.getElementById('progress-wrap')!;
const progressFill  = document.getElementById('progress-fill')!;
const progressLabel = document.getElementById('progress-label')!;

// Preview
btnPreview.addEventListener('click', () => {
  const opt = selTamu.selectedOptions[0];
  if (!opt?.dataset.nama) { alert('Pilih tamu terlebih dahulu.'); return; }
  previewArea.innerHTML = buildKartuHTML(ev, opt.dataset.nama);
  previewArea.style.transform = 'scale(1)';
  btnDlSatu.disabled = false;
});

// Download satu
btnDlSatu.addEventListener('click', async () => {
  const opt = selTamu.selectedOptions[0];
  if (!opt?.dataset.nama) return;
  btnDlSatu.disabled = true;
  btnDlSatu.textContent = 'Generating...';
  const blob = await generatePNG(ev, opt.dataset.nama);
  downloadBlob(blob, `${sanitizeFilename(opt.dataset.nama)}.png`);
  btnDlSatu.disabled = false;
  btnDlSatu.textContent = '⬇️ Download';
});

// Download semua
btnDlSemua.addEventListener('click', async () => {
  if (!tamuList.length) { alert('Belum ada data tamu.'); return; }
  if (!confirm(`Generate & download ${tamuList.length} kartu undangan?`)) return;

  btnDlSemua.disabled = true;
  progressWrap.style.display = 'block';

  for (let i = 0; i < tamuList.length; i++) {
    const t = tamuList[i];
    progressLabel.textContent = `Generating ${i + 1}/${tamuList.length}: ${t.nama}`;
    progressFill.style.width  = `${Math.round(((i + 1) / tamuList.length) * 100)}%`;

    const blob = await generatePNG(ev, t.nama);
    downloadBlob(blob, `${sanitizeFilename(t.nama)}.png`);

    // Delay kecil agar browser tidak kewalahan
    await new Promise(r => setTimeout(r, 600));
  }

  progressLabel.textContent = `✅ Selesai! ${tamuList.length} kartu berhasil didownload.`;
  btnDlSemua.disabled = false;
});

// Tambahkan di bagian script kartu.astro

// Upload PNG ke server dan simpan URL ke tamu
async function uploadKartu(tamuId: number, namaTamu: string): Promise<string | null> {
  const blob     = await generatePNG(ev, namaTamu);
  const filename = `${sanitizeFilename(namaTamu)}.png`;

  const fd = new FormData();
  fd.append('file', blob, filename);
  fd.append('filename', filename);

  const res  = await fetch('/api/kartu/upload', { method: 'POST', body: fd });
  const data = await res.json();
  if (!data.ok) return null;

  // Simpan URL ke tamu
  await fetch('/api/tamu', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: tamuId, kartu_url: data.url }),
  });

  return data.url;
}

// Upload satu
document.getElementById('btn-upload-satu')!.addEventListener('click', async () => {
  const opt = selTamu.selectedOptions[0];
  if (!opt?.dataset.nama) return;

  const btn  = document.getElementById('btn-upload-satu') as HTMLButtonElement;
  btn.disabled = true;
  btn.textContent = 'Uploading...';

  const tamuId = parseInt(opt.value);
  const url    = await uploadKartu(tamuId, opt.dataset.nama);

  if (url) {
    alert(`✅ Kartu berhasil di-upload!\nURL: ${url}`);
    location.reload(); // refresh tabel status
  } else {
    alert('❌ Upload gagal.');
  }
  btn.disabled = false;
  btn.textContent = '☁️ Upload URL';
});

// Upload semua
document.getElementById('btn-upload-semua')!.addEventListener('click', async () => {
  if (!tamuList.length) { alert('Belum ada data tamu.'); return; }
  if (!confirm(`Generate & upload kartu untuk ${tamuList.length} tamu?`)) return;

  const btn          = document.getElementById('btn-upload-semua') as HTMLButtonElement;
  const progressWrap = document.getElementById('progress-wrap')!;
  const progressFill = document.getElementById('progress-fill')! as HTMLElement;
  const progressLbl  = document.getElementById('progress-label')!;

  btn.disabled = true;
  progressWrap.style.display = 'block';

  for (let i = 0; i < tamuList.length; i++) {
    const t = tamuList[i];
    progressLbl.textContent = `Upload ${i + 1}/${tamuList.length}: ${t.nama}`;
    progressFill.style.width = `${Math.round(((i + 1) / tamuList.length) * 100)}%`;

    await uploadKartu(t.id, t.nama);
    await new Promise(r => setTimeout(r, 500));
  }

  progressLbl.textContent = `✅ Semua kartu berhasil di-upload!`;
  btn.disabled = false;
  setTimeout(() => location.reload(), 1500);
});
</script>

<style>
  .banner { background:#fff3cd; border:1px solid #ffc107; border-radius:8px; padding:12px 16px; margin-bottom:16px; font-size:.875rem; }
  .banner a { color:#2d6a4f; font-weight:700; }
  .card { background:#fff; border-radius:12px; padding:20px; box-shadow:0 2px 8px rgba(0,0,0,.07); margin-bottom:16px; }
  .card h2 { font-size:1rem; font-weight:700; color:#2d6a4f; margin-bottom:14px; }

  .control-row { display:flex; gap:14px; align-items:flex-end; flex-wrap:wrap; }
  .field { display:flex; flex-direction:column; gap:5px; }
  .field label { font-size:.8rem; font-weight:600; color:#555; }
  select { padding:9px 12px; border:1.5px solid #ddd; border-radius:8px; font-size:.875rem; min-width:220px; }
  select:focus { outline:none; border-color:#52b788; }

  .btn-group { display:flex; gap:8px; flex-wrap:wrap; }
  .btn { padding:9px 16px; border:none; border-radius:8px; cursor:pointer; font-size:.85rem; font-weight:600; }
  .btn:disabled { opacity:.5; cursor:not-allowed; }
  .btn-primary { background:#2d6a4f; color:#fff; }
  .btn-success { background:#40916c; color:#fff; }
  .btn-warning { background:#e07b3d; color:#fff; }

  .progress-bar-bg { background:#e0e0e0; border-radius:99px; height:10px; overflow:hidden; }
  .progress-bar-fill { background:linear-gradient(90deg,#2d6a4f,#52b788); height:100%; width:0%; transition:width .3s; border-radius:99px; }
  .progress-label { font-size:.8rem; color:#555; margin-top:6px; }

  .preview-area { min-height:200px; display:flex; align-items:center; justify-content:center; overflow:auto; background:#f5f5f5; border-radius:8px; padding:12px; }
  .preview-area > div { transform-origin:top left; transform:scale(.7); }
  .placeholder-hint { color:#aaa; font-size:.875rem; }

  @media(max-width:900px) {
    .preview-area > div { transform:scale(.45); }
  }
</style>

```
---

## src/pages/tamu.astro
```astro
---
// src/pages/tamu.astro
import Layout from "../layouts/Layout.astro";
---

<Layout title="Tamu Undangan">
  <!-- Import Excel -->
  <div class="card">
    <h2>📥 Import dari Excel</h2>
    <p class="hint">
      Kolom yang dikenali: <code>nama_lengkap</code>, <code>alamat</code>, <code>no_telpon</code> (opsional).
      Baris tanpa nama akan dilewati.
    </p>
    <div class="import-row">
      <input type="file" id="excel-file" accept=".xlsx,.xls" />
      <button class="btn btn-success" id="btn-import">📤 Import</button>
      <a href="/template-tamu.xlsx" class="btn btn-secondary" download>⬇️ Unduh Template</a>
    </div>
    <div id="import-result" class="alert" style="display:none"></div>
  </div>

  <!-- Tambah Manual -->
  <div class="card">
    <h2>➕ Tambah Tamu Manual</h2>
    <div class="form-inline">
      <input id="inp-nama" placeholder="Nama lengkap *" />
      <input id="inp-alamat" placeholder="Alamat" />
      <input id="inp-hp" placeholder="No. Telpon (08xxx)" />
      <button class="btn btn-primary" id="btn-tambah">Tambah</button>
    </div>
    <div id="tambah-result" class="alert" style="display:none"></div>
  </div>

  <!-- Daftar Tamu -->
  <div class="card">
    <div class="table-header">
      <h2>👥 Daftar Tamu</h2>
      <div class="table-actions">
        <input id="search" placeholder="🔍 Cari nama..." />
        <select id="filter-status">
          <option value="">Semua Status</option>
          <option value="sent">✅ Terkirim</option>
          <option value="failed">❌ Gagal</option>
          <option value="null">⏳ Belum Kirim</option>
        </select>
        <button class="btn btn-danger btn-sm" id="btn-hapus-semua">🗑️ Hapus Semua</button>
      </div>
    </div>

    <div class="table-wrap">
      <table id="tabel-tamu">
        <thead>
          <tr>
            <th><input type="checkbox" id="check-all" /></th>
            <th>#</th>
            <th>Nama</th>
            <th>Alamat</th>
            <th>No. Telpon</th>
            <th>Status WA</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody id="tbody"></tbody>
      </table>
      <p id="empty-state" style="display:none;text-align:center;padding:32px;color:#999">
        Belum ada data tamu.
      </p>
    </div>
    <div id="tabel-info" class="tabel-info"></div>
  </div>

  <!-- Modal Edit -->
  <div id="modal" class="modal-overlay" style="display:none">
    <div class="modal-box">
      <h3>✏️ Edit Tamu</h3>
      <input type="hidden" id="edit-id" />
      <div class="field"><label>Nama *</label><input id="edit-nama" /></div>
      <div class="field"><label>Alamat</label><input id="edit-alamat" /></div>
      <div class="field"><label>No. Telpon</label><input id="edit-hp" /></div>
      <div class="modal-actions">
        <button class="btn btn-primary" id="btn-save-edit">💾 Simpan</button>
        <button class="btn btn-secondary" id="btn-cancel-edit">Batal</button>
      </div>
    </div>
  </div>
</Layout>

<style>
  .card {
    background: #fff;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
    margin-bottom: 16px;
  }
  .card h2 {
    font-size: 1rem;
    font-weight: 700;
    color: #2d6a4f;
    margin-bottom: 12px;
  }
  .hint {
    font-size: 0.8rem;
    color: #888;
    margin-bottom: 10px;
  }
  code {
    background: #f0f4f0;
    padding: 1px 5px;
    border-radius: 4px;
    font-size: 0.78rem;
  }

  .import-row {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
  }
  .form-inline {
    display: grid;
    grid-template-columns: 2fr 2fr 1.5fr auto;
    gap: 10px;
  }
  @media (max-width: 640px) {
    .form-inline {
      grid-template-columns: 1fr;
    }
  }

  input[type="text"],
  input:not([type="file"]):not([type="checkbox"]),
  select {
    padding: 9px 12px;
    border: 1.5px solid #ddd;
    border-radius: 8px;
    font-size: 0.875rem;
    width: 100%;
  }
  input:focus,
  select:focus {
    outline: none;
    border-color: #52b788;
  }

  .btn {
    padding: 9px 16px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 600;
    white-space: nowrap;
  }
  .btn-primary {
    background: #2d6a4f;
    color: #fff;
  }
  .btn-success {
    background: #40916c;
    color: #fff;
  }
  .btn-secondary {
    background: #6c757d;
    color: #fff;
  }
  .btn-danger {
    background: #e63946;
    color: #fff;
  }
  .btn-sm {
    padding: 7px 12px;
    font-size: 0.78rem;
  }

  .table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 12px;
  }
  .table-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
  }
  .table-actions input,
  .table-actions select {
    width: auto;
  }

  .table-wrap {
    overflow-x: auto;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
  }
  th {
    background: #f0f4f0;
    padding: 10px 12px;
    text-align: left;
    font-size: 0.78rem;
    color: #555;
    font-weight: 700;
  }
  td {
    padding: 10px 12px;
    border-bottom: 1px solid #f0f0f0;
    vertical-align: middle;
  }
  tr:hover td {
    background: #f9fffe;
  }

  .badge {
    padding: 3px 8px;
    border-radius: 20px;
    font-size: 0.73rem;
    font-weight: 700;
  }
  .badge-sent {
    background: #d8f3dc;
    color: #1b4332;
  }
  .badge-failed {
    background: #ffe0e0;
    color: #9b1c1c;
  }
  .badge-pending {
    background: #fff3cd;
    color: #856404;
  }
  .badge-none {
    background: #f0f0f0;
    color: #888;
  }

  .tabel-info {
    font-size: 0.78rem;
    color: #888;
    margin-top: 8px;
  }

  .alert {
    padding: 10px 14px;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 600;
    margin-top: 10px;
  }
  .alert.success {
    background: #d8f3dc;
    color: #1b4332;
  }
  .alert.error {
    background: #ffe0e0;
    color: #9b1c1c;
  }
  .alert.info {
    background: #e0f0ff;
    color: #1a4f7a;
  }

  /* Modal */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }
  .modal-box {
    background: #fff;
    border-radius: 14px;
    padding: 24px;
    width: 100%;
    max-width: 420px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  }
  .modal-box h3 {
    font-size: 1rem;
    font-weight: 700;
    color: #2d6a4f;
    margin-bottom: 16px;
  }
  .field {
    margin-bottom: 12px;
  }
  .field label {
    font-size: 0.8rem;
    font-weight: 600;
    color: #555;
    display: block;
    margin-bottom: 4px;
  }
  .modal-actions {
    display: flex;
    gap: 10px;
    margin-top: 16px;
  }
</style>

<script>
  let allTamu: any[] = [];

  // ── Utils ──────────────────────────────────────────────
  const $ = (id: string) => document.getElementById(id)!;
  function showAlert(el: HTMLElement, msg: string, type: string, duration = 4000) {
    el.textContent = msg;
    el.className = `alert ${type}`;
    el.style.display = "block";
    if (duration)
      setTimeout(() => {
        el.style.display = "none";
      }, duration);
  }

  const statusBadge = (s: string | null) => {
    if (s === "sent") return '<span class="badge badge-sent">✅ Terkirim</span>';
    if (s === "failed") return '<span class="badge badge-failed">❌ Gagal</span>';
    if (s === "pending") return '<span class="badge badge-pending">⏳ Pending</span>';
    return '<span class="badge badge-none">—</span>';
  };

  // ── Load & Render ──────────────────────────────────────
  async function loadTamu() {
    const res = await fetch("/api/tamu");
    allTamu = await res.json();
    renderTable(allTamu);
  }

  function renderTable(data: any[]) {
    const tbody = $("tbody") as HTMLTableSectionElement;
    const empty = $("empty-state");
    const info = $("tabel-info");
    tbody.innerHTML = "";

    if (data.length === 0) {
      empty.style.display = "block";
      info.textContent = "";
      return;
    }
    empty.style.display = "none";
    info.textContent = `Menampilkan ${data.length} dari ${allTamu.length} tamu`;

    data.forEach((t, i) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><input type="checkbox" class="row-check" data-id="${t.id}" /></td>
        <td>${i + 1}</td>
        <td><strong>${t.nama}</strong></td>
        <td>${t.alamat || '<span style="color:#bbb">—</span>'}</td>
        <td>${t.no_telpon || '<span style="color:#bbb">—</span>'}</td>
        <td>${statusBadge(t.broadcast_status)}</td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="openEdit(${t.id})">✏️</button>
          <button class="btn btn-danger btn-sm" onclick="hapusTamu(${t.id})">🗑️</button>
        </td>`;
      tbody.appendChild(tr);
    });
  }

  // ── Filter & Search ────────────────────────────────────
  function applyFilter() {
    const q = ($("search") as HTMLInputElement).value.toLowerCase();
    const status = ($("filter-status") as HTMLSelectElement).value;
    const filtered = allTamu.filter((t) => {
      const matchName = t.nama.toLowerCase().includes(q);
      const matchStatus = !status
        ? true
        : status === "null"
          ? !t.broadcast_status
          : t.broadcast_status === status;
      return matchName && matchStatus;
    });
    renderTable(filtered);
  }
  $("search").addEventListener("input", applyFilter);
  $("filter-status").addEventListener("change", applyFilter);

  // ── Check All ──────────────────────────────────────────
  $("check-all").addEventListener("change", (e) => {
    const checked = (e.target as HTMLInputElement).checked;
    document.querySelectorAll(".row-check").forEach((cb: any) => (cb.checked = checked));
  });

  // ── Import Excel ───────────────────────────────────────
  $("btn-import").addEventListener("click", async () => {
    const fileInput = $("excel-file") as HTMLInputElement;
    const resultEl = $("import-result");
    const file = fileInput.files?.[0];
    if (!file) {
      showAlert(resultEl, "⚠️ Pilih file Excel terlebih dahulu.", "error");
      return;
    }

    const fd = new FormData();
    fd.append("file", file);

    const btn = $("btn-import") as HTMLButtonElement;
    btn.disabled = true;
    btn.textContent = "Mengimport...";

    try {
      const res = await fetch("/api/tamu/import", { method: "POST", body: fd });
      const data = await res.json();
      if (data.ok) {
        showAlert(
          resultEl,
          `✅ Berhasil import ${data.inserted} tamu. ${data.skipped ? `(${data.skipped} baris dilewati)` : ""}`,
          "success"
        );
        fileInput.value = "";
        await loadTamu();
      } else {
        showAlert(resultEl, `❌ ${data.error}`, "error");
      }
    } catch {
      showAlert(resultEl, "❌ Terjadi kesalahan.", "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "📤 Import";
    }
  });

  // ── Tambah Manual ──────────────────────────────────────
  $("btn-tambah").addEventListener("click", async () => {
    const nama = ($("inp-nama") as HTMLInputElement).value;
    const alamat = ($("inp-alamat") as HTMLInputElement).value;
    const hp = ($("inp-hp") as HTMLInputElement).value;
    const result = $("tambah-result");

    if (!nama.trim()) {
      showAlert(result, "⚠️ Nama wajib diisi.", "error");
      return;
    }

    const res = await fetch("/api/tamu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nama, alamat, no_telpon: hp }),
    });
    const data = await res.json();
    if (data.ok) {
      showAlert(result, "✅ Tamu berhasil ditambahkan.", "success");
      ($("inp-nama") as HTMLInputElement).value = "";
      ($("inp-alamat") as HTMLInputElement).value = "";
      ($("inp-hp") as HTMLInputElement).value = "";
      await loadTamu();
    } else {
      showAlert(result, `❌ ${data.error}`, "error");
    }
  });

  // ── Hapus Satu ─────────────────────────────────────────
  (window as any).hapusTamu = async (id: number) => {
    if (!confirm("Hapus tamu ini?")) return;
    await fetch(`/api/tamu?id=${id}`, { method: "DELETE" });
    await loadTamu();
  };

  // ── Hapus Semua ────────────────────────────────────────
  $("btn-hapus-semua").addEventListener("click", async () => {
    const checked = Array.from(
      document.querySelectorAll(".row-check:checked")
    ) as HTMLInputElement[];
    if (checked.length === 0) {
      if (!confirm(`Hapus SEMUA ${allTamu.length} tamu?`)) return;
      await Promise.all(allTamu.map((t) => fetch(`/api/tamu?id=${t.id}`, { method: "DELETE" })));
    } else {
      if (!confirm(`Hapus ${checked.length} tamu yang dipilih?`)) return;
      await Promise.all(
        checked.map((cb) => fetch(`/api/tamu?id=${cb.dataset.id}`, { method: "DELETE" }))
      );
    }
    await loadTamu();
  });

  // ── Edit ───────────────────────────────────────────────
  (window as any).openEdit = (id: number) => {
    const t = allTamu.find((x) => x.id === id);
    if (!t) return;
    ($("edit-id") as HTMLInputElement).value = t.id;
    ($("edit-nama") as HTMLInputElement).value = t.nama;
    ($("edit-alamat") as HTMLInputElement).value = t.alamat ?? "";
    ($("edit-hp") as HTMLInputElement).value = t.no_telpon ?? "";
    $("modal").style.display = "flex";
  };

  $("btn-cancel-edit").addEventListener("click", () => {
    $("modal").style.display = "none";
  });

  $("btn-save-edit").addEventListener("click", async () => {
    const id = ($("edit-id") as HTMLInputElement).value;
    const nama = ($("edit-nama") as HTMLInputElement).value;
    const alamat = ($("edit-alamat") as HTMLInputElement).value;
    const hp = ($("edit-hp") as HTMLInputElement).value;

    const res = await fetch("/api/tamu", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, nama, alamat, no_telpon: hp }),
    });
    const data = await res.json();
    if (data.ok) {
      $("modal").style.display = "none";
      await loadTamu();
    }
  });

  // ── Init ───────────────────────────────────────────────
  loadTamu();
</script>

```
---

## src/pages/template-tamu.xlsx.ts
```ts
// src/pages/template-tamu.xlsx.ts
import type { APIRoute } from "astro";
import * as XLSX from "xlsx";

export const GET: APIRoute = () => {
  const ws = XLSX.utils.aoa_to_sheet([
    ["nama_lengkap", "alamat", "no_telpon"],
    ["Budi Santoso", "Jl. Melati No. 5, Jakarta", "08123456789"],
    ["Sari Dewi", "Jl. Anggrek No. 10, Bogor", ""],
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Tamu");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new Response(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="template-tamu.xlsx"',
    },
  });
};

```
---

## tsconfig.json
```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}

```
---

## .vscode/extensions.json
```json
{
  "recommendations": ["astro-build.astro-vscode"],
  "unwantedRecommendations": []
}

```
---

## .vscode/launch.json
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "command": "./node_modules/.bin/astro dev",
      "name": "Development server",
      "request": "launch",
      "type": "node-terminal"
    }
  ]
}

```
---
