import type { APIRoute } from "astro";
import { bootstrap, q } from "../../lib/db";
import { sendWA } from "../../lib/whatsapp";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

export const GET: APIRoute = async () => {
  await bootstrap();
  return json(await q.listBroadcast());
};

export const POST: APIRoute = async ({ request }) => {
  await bootstrap();
  const { tamu_id, pesan } = await request.json();
  if (!tamu_id || !pesan?.trim()) return json({ ok: false, error: "Data tidak valid" }, 400);

  const tamu = await q.getTamu(tamu_id);
  if (!tamu) return json({ ok: false, error: "Tamu tidak ditemukan" }, 404);

  const { insertId } = await q.insertBroadcast(tamu_id, pesan);
  try {
    await sendWA(tamu.no_telpon, pesan);
    await q.updateBroadcastSent(insertId);
    return json({ ok: true, status: "sent" });
  } catch (e) {
    await q.updateBroadcastFailed(insertId);
    return json({
      ok: false,
      status: "failed",
      error: e instanceof Error ? e.message : "Unknown error",
    });
  }
};
