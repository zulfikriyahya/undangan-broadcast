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
