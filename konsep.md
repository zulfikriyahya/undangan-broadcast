# Aplikasi Undangan Khitanan
> Sistem manajemen undangan digital untuk acara khitanan — mulai dari input data, generate kartu, hingga broadcast WhatsApp.

---

## 1. Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | Astro (SSR mode) |
| Database | SQLite via `better-sqlite3` |
| Parsing Excel | `xlsx` (SheetJS) |
| Generate Gambar | `html2canvas` (client-side) |
| WhatsApp | REST API `wapi.zedlabs.id` |
| Styling | Tailwind CSS |

---

## 2. Struktur Database

### Tabel `event`
Satu baris saja — konfigurasi acara.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | INTEGER PK | Auto |
| `nama_anak` | TEXT | Nama anak yang dikhitan |
| `foto_path` | TEXT | Path file foto anak |
| `anak_ke` | INTEGER | Urutan anak |
| `nama_bapak` | TEXT | |
| `nama_ibu` | TEXT | |
| `alamat` | TEXT | Alamat lengkap acara |
| `tanggal` | TEXT | Tanggal & waktu acara |

### Tabel `tamu`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | INTEGER PK | Auto |
| `nama` | TEXT | Nama lengkap tamu |
| `alamat` | TEXT | |
| `no_telpon` | TEXT | Opsional, format `08xxx` |
| `created_at` | TEXT | Timestamp import |

### Tabel `broadcast`
Tracking riwayat pengiriman pesan.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | INTEGER PK | Auto |
| `tamu_id` | INTEGER FK | Relasi ke `tamu` |
| `pesan` | TEXT | Isi pesan yang dikirim |
| `status` | TEXT | `pending` / `sent` / `failed` |
| `sent_at` | TEXT | Timestamp kirim |

---

## 3. Modul & Fitur

### 3.1 Setup Acara
- Form input data acara: nama anak, foto, anak ke-berapa, nama bapak, nama ibu, alamat, tanggal
- Upload foto anak → disimpan ke `/public/uploads/`
- Data disimpan ke tabel `event` (upsert — hanya 1 record)

### 3.2 Manajemen Tamu

**Import Excel:**
- Upload file `.xlsx`
- Kolom wajib: `nama_lengkap`, `alamat`
- Kolom opsional: `no_telpon`
- Validasi: skip baris kosong, normalisasi nomor HP ke format `08xxx`
- Preview data sebelum disimpan (tabel konfirmasi)
- Tombol "Simpan Semua" → bulk insert ke tabel `tamu`

**Input Manual:**
- Form tambah tamu satu per satu
- Inline pada halaman daftar tamu

**Daftar Tamu:**
- Tabel dengan kolom: nama, alamat, no telpon, status broadcast
- Fitur: hapus, edit, filter (sudah/belum dikirimi)

### 3.3 Generate Kartu Undangan

**Template Kartu:**
- Desain HTML/CSS fixed-size (misal `800×500px`)
- Komponen kartu:
  - Background ornamen islami
  - Foto anak (dari `event.foto_path`)
  - Teks bismillah / pembuka
  - Nama anak + "putra ke-N dari Bpk. X & Ibu Y"
  - Alamat & tanggal acara
  - **Nama tamu** (dinamis, dipersonalisasi per undangan)

**Alur Generate:**
1. Pilih tamu dari daftar
2. Render template HTML dengan data acara + nama tamu
3. `html2canvas` konversi ke canvas → export PNG
4. File otomatis bernama `[nama_tamu].png`

**Generate Massal:**
- Tombol "Download Semua" → generate & download satu per satu secara berurutan (dengan delay kecil antar undangan)

### 3.4 Broadcast WhatsApp

**Konfigurasi Pesan:**
- Textarea template pesan dengan variabel dinamis:
  - `{{nama}}` → nama tamu
  - `{{nama_anak}}` → nama anak
  - `{{tanggal}}` → tanggal acara
  - `{{alamat}}` → alamat acara
- Preview pesan sebelum kirim

**Seleksi Penerima:**
- Centang individual atau "Pilih Semua"
- Filter: hanya tamu yang belum dikirimi
- Hanya tamu dengan `no_telpon` terisi yang bisa dipilih

**Proses Kirim:**
- Kirim **satu per satu secara berurutan** dengan delay 2–3 detik antar pesan (hindari spam block)
- Progress bar realtime
- Status per tamu diupdate langsung: `pending` → `sent` / `failed`
- Log error jika gagal (nomor tidak valid, API error)

**API Call:**
```
POST https://wapi.zedlabs.id/api/messages/send
Headers: { "x-api-key": "cedb42552eea..." }
Body: { "number": "08xxx", "message": "teks pesan" }
```

---

## 4. Struktur Halaman (Routes Astro)

```
/                     → Dashboard (ringkasan: jumlah tamu, status broadcast)
/acara                → Setup data acara
/tamu                 → Daftar tamu + import Excel + tambah manual
/kartu                → Preview & download kartu undangan
/broadcast            → Compose pesan + kirim + riwayat
```

---

## 5. Struktur Folder Proyek

```
/
├── src/
│   ├── pages/
│   │   ├── index.astro
│   │   ├── acara.astro
│   │   ├── tamu.astro
│   │   ├── kartu.astro
│   │   ├── broadcast.astro
│   │   └── api/
│   │       ├── event.ts         → GET, POST
│   │       ├── tamu.ts          → GET, POST, DELETE
│   │       ├── tamu/import.ts   → POST (bulk dari Excel)
│   │       └── broadcast.ts     → POST (kirim WA)
│   ├── components/
│   │   ├── KartuUndangan.astro  → Template kartu (render HTML)
│   │   └── TamuTable.astro
│   └── lib/
│       ├── db.ts                → Inisialisasi SQLite
│       └── whatsapp.ts          → Helper kirim WA
├── public/
│   └── uploads/                 → Foto anak
├── data/
│   └── undangan.db              → File SQLite
└── astro.config.mjs
```

---

## 6. Alur Kerja User (End-to-End)

```
1. Buka /acara       → Isi data acara & upload foto anak
        ↓
2. Buka /tamu        → Import Excel atau tambah manual
        ↓
3. Buka /kartu       → Preview kartu, download PNG per tamu / massal
        ↓
4. Buka /broadcast   → Tulis pesan, pilih tamu, kirim WA
        ↓
5. Dashboard /       → Pantau statistik & status broadcast
```

---

## 7. Validasi & Edge Cases

| Kasus | Penanganan |
|---|---|
| No telpon kosong | Tamu tetap tersimpan, tidak muncul di opsi broadcast |
| No telpon format salah | Normalisasi otomatis: `+62` → `08`, `62` → `08` |
| Foto tidak diupload | Kartu tetap render dengan placeholder foto |
| API WA gagal | Status `failed`, bisa retry per tamu |
| Import Excel kolom tidak sesuai | Tampilkan error mapping kolom sebelum simpan |
| Kirim ke nomor duplikat | Warning, user bisa override |
