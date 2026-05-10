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
