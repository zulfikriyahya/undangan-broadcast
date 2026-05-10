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
