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
