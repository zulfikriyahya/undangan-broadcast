import type { APIRoute } from "astro";
import fs from "fs";
import path from "path";
import { sanitizeFilename } from "../../../lib/utils";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const file = form.get("file") as File;
  const filename = form.get("filename") as string;
  if (!file || !filename) return json({ ok: false, error: "Data tidak lengkap" }, 400);

  const safe = sanitizeFilename(filename.replace(/\.png$/, "")) + ".png";
  const dest = path.resolve("public/uploads/kartu", safe);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, Buffer.from(await file.arrayBuffer()));

  const siteUrl = import.meta.env.SITE_URL ?? "http://localhost:4000";
  return json({ ok: true, url: `${siteUrl}/uploads/kartu/${safe}` });
};
