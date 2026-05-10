import type { APIRoute } from "astro";
import * as XLSX from "xlsx";
import { bootstrap, q } from "../../../lib/db";
import { normalizePhone } from "../../../lib/utils";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

const normalize = (s: string) => s.toLowerCase().replace(/[\s_]/g, "");

const COLUMN_MAP = {
  nama: ["namalengkap", "nama"],
  alamat: ["alamat"],
  telpon: ["notelpon", "notelepon", "nohp", "telepon", "hp", "phone"],
};

function findKey(row: Record<string, unknown>, candidates: string[]) {
  return Object.keys(row).find((k) => candidates.includes(normalize(k)));
}

export const POST: APIRoute = async ({ request }) => {
  await bootstrap();
  const form = await request.formData();
  const file = form.get("file") as File;
  if (!file || file.size === 0) return json({ ok: false, error: "File tidak ditemukan" }, 400);

  const wb = XLSX.read(Buffer.from(await file.arrayBuffer()), { type: "buffer" });
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" }) as Record<
    string,
    unknown
  >[];

  const batch: { nama: string; alamat: string; no_telpon: string }[] = [];
  let skipped = 0;

  for (const row of rows) {
    const namaKey = findKey(row, COLUMN_MAP.nama);
    const nama = namaKey ? String(row[namaKey]).trim() : "";
    if (!nama) {
      skipped++;
      continue;
    }

    const alamatKey = findKey(row, COLUMN_MAP.alamat);
    const telponKey = findKey(row, COLUMN_MAP.telpon);
    batch.push({
      nama,
      alamat: alamatKey ? String(row[alamatKey]).trim() : "",
      no_telpon: telponKey ? normalizePhone(String(row[telponKey])) : "",
    });
  }

  await q.insertTamuBatch(batch);
  return json({ ok: true, inserted: batch.length, skipped });
};
