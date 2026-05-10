import type { APIRoute } from "astro";
import { bootstrap, q } from "../../lib/db";
import { normalizePhone } from "../../lib/utils";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

const err = (msg: string, status = 400) => json({ ok: false, error: msg }, status);

export const GET: APIRoute = async () => {
  await bootstrap();
  return json(await q.listTamu());
};

export const POST: APIRoute = async ({ request }) => {
  await bootstrap();
  const { nama, alamat, no_telpon } = await request.json();
  if (!nama?.trim()) return err("Nama wajib diisi");
  const result = await q.insertTamu(
    nama.trim(),
    alamat?.trim() ?? "",
    no_telpon ? normalizePhone(no_telpon) : ""
  );
  return json({ ok: true, id: result.insertId });
};

export const PUT: APIRoute = async ({ request }) => {
  await bootstrap();
  const { id, nama, alamat, no_telpon } = await request.json();
  if (!id || !nama?.trim()) return err("Data tidak valid");
  await q.updateTamu(
    id,
    nama.trim(),
    alamat?.trim() ?? "",
    no_telpon ? normalizePhone(no_telpon) : ""
  );
  return json({ ok: true });
};

export const PATCH: APIRoute = async ({ request }) => {
  await bootstrap();
  const { id, kartu_url } = await request.json();
  if (!id || !kartu_url) return err("Data tidak valid");
  await q.updateKartuUrl(id, kartu_url);
  return json({ ok: true });
};

export const DELETE: APIRoute = async ({ url }) => {
  await bootstrap();
  const id = url.searchParams.get("id");
  if (!id) return err("ID diperlukan");
  await q.deleteTamu(parseInt(id));
  return json({ ok: true });
};
