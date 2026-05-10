import type { APIRoute } from "astro";
import fs from "fs";
import path from "path";
import { bootstrap, q } from "../../lib/db";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

export const GET: APIRoute = async () => {
  await bootstrap();
  return json((await q.getEvent()) ?? {});
};

export const POST: APIRoute = async ({ request }) => {
  await bootstrap();
  const form = await request.formData();
  const get = (key: string) => (form.get(key) as string) ?? "";

  const existing = await q.getEvent();
  let foto_path = existing?.foto_path ?? "";

  const foto = form.get("foto") as File | null;
  if (foto && foto.size > 0) {
    const ext = foto.name.split(".").pop();
    const filename = `anak_${Date.now()}.${ext}`;
    const dest = path.resolve("public/uploads", filename);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, Buffer.from(await foto.arrayBuffer()));
    foto_path = `/uploads/${filename}`;
  }

  await q.upsertEvent({
    nama_anak: get("nama_anak"),
    foto_path,
    anak_ke: parseInt(get("anak_ke")) || 1,
    nama_bapak: get("nama_bapak"),
    nama_ibu: get("nama_ibu"),
    alamat: get("alamat"),
    tanggal: get("tanggal"),
  });

  return json({ ok: true });
};
