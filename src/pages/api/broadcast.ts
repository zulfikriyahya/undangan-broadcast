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
