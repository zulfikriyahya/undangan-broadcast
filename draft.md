# BLUEPRINT

## astro.config.mjs
```js
import node from "@astrojs/node";
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";

export default defineConfig({
  output: "server",
  adapter: node({ mode: "standalone" }),
  integrations: [react(), tailwind({ applyBaseStyles: false })],
});

```
---

## .env
```bash
SITE_URL=http://localhost:4000
WA_ENDPOINT=https://wapi.zedlabs.id/api/messages/send
WA_API_KEY=cedb42552eea73ca6e897807b80f07fd1e081aa1f93173fe
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASS=18012000
DB_NAME=undangan_khitanan

```
---

## package.json
```json
{
  "name": "undangan-khitanan",
  "type": "module",
  "version": "1.0.0",
  "engines": {
    "node": ">=22.12.0"
  },
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview"
  },
  "dependencies": {
    "@astrojs/node": "^10.1.0",
    "@astrojs/react": "^4.0.0",
    "@radix-ui/react-dialog": "^1.1.0",
    "@radix-ui/react-label": "^2.1.0",
    "@radix-ui/react-select": "^2.1.0",
    "@radix-ui/react-slot": "^1.1.0",
    "astro": "^6.3.1",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "dotenv": "^17.4.2",
    "lucide-react": "^0.383.0",
    "mysql2": "^3.11.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "tailwind-merge": "^2.3.0",
    "tailwindcss": "^3.4.0",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "@astrojs/tailwind": "^5.1.0",
    "@types/node": "^25.6.2",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0"
  }
}

```
---

## src/components/hooks/useFlashAlert.ts
```ts
import { useState } from "react";

export type AlertVariant = "success" | "destructive" | "warning" | "info";

export interface AlertState {
  message: string;
  variant: AlertVariant;
}

export function useFlashAlert(duration = 4000) {
  const [alert, setAlert] = useState<AlertState | null>(null);

  function show(message: string, variant: AlertVariant = "success") {
    setAlert({ message, variant });
    if (duration > 0) setTimeout(() => setAlert(null), duration);
  }

  function clear() {
    setAlert(null);
  }

  return { alert, show, clear };
}

```
---

## src/components/KartuUndangan.astro
```astro
---
// src/components/KartuUndangan.astro
// Komponen ini hanya dipakai sebagai referensi markup.
// Di halaman /kartu, template ini di-render via JS dengan data dinamis.
---

```
---

## src/components/pages/AcaraPage.tsx
```tsx
import { useRef, useState } from "react";
import type { Event } from "../../lib/db";
import { useFlashAlert } from "../../hooks/useFlashAlert";
import { Alert, AlertDescription } from "../ui/alert";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";

interface Props {
  event: Event | null;
}

function Field({
  label,
  id,
  children,
  className,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

export default function AcaraPage({ event }: Props) {
  const { alert, show } = useFlashAlert();
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(event?.foto_path ?? "");
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formRef.current) return;
    setLoading(true);
    try {
      const res = await fetch("/api/event", {
        method: "POST",
        body: new FormData(formRef.current),
      });
      const data = await res.json();
      if (data.ok) show("Data acara berhasil disimpan.", "success");
      else throw new Error();
    } catch {
      show("Terjadi kesalahan, coba lagi.", "destructive");
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setPreview(URL.createObjectURL(file));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Setup Acara</CardTitle>
      </CardHeader>
      <CardContent>
        {alert && (
          <Alert variant={alert.variant} className="mb-4">
            <AlertDescription>{alert.message}</AlertDescription>
          </Alert>
        )}

        <form ref={formRef} onSubmit={handleSubmit} encType="multipart/form-data">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nama Anak *" id="nama_anak">
              <Input
                id="nama_anak"
                name="nama_anak"
                required
                defaultValue={event?.nama_anak ?? ""}
                placeholder="Muhammad Farhan"
              />
            </Field>

            <Field label="Anak Ke- *" id="anak_ke">
              <Input
                id="anak_ke"
                name="anak_ke"
                type="number"
                min="1"
                required
                defaultValue={event?.anak_ke ?? 1}
              />
            </Field>

            <Field label="Nama Bapak *" id="nama_bapak">
              <Input
                id="nama_bapak"
                name="nama_bapak"
                required
                defaultValue={event?.nama_bapak ?? ""}
                placeholder="Ahmad Fauzi"
              />
            </Field>

            <Field label="Nama Ibu *" id="nama_ibu">
              <Input
                id="nama_ibu"
                name="nama_ibu"
                required
                defaultValue={event?.nama_ibu ?? ""}
                placeholder="Siti Rahayu"
              />
            </Field>

            <Field label="Alamat Acara *" id="alamat" className="sm:col-span-2">
              <Textarea
                id="alamat"
                name="alamat"
                required
                defaultValue={event?.alamat ?? ""}
                placeholder="Jl. Mawar No. 12, RT 03/05, Kel. Cipete"
              />
            </Field>

            <Field label="Tanggal & Waktu Acara *" id="tanggal">
              <Input
                id="tanggal"
                name="tanggal"
                type="datetime-local"
                required
                defaultValue={event?.tanggal ?? ""}
              />
            </Field>

            <Field label="Foto Anak" id="foto">
              <Input
                id="foto"
                name="foto"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />
              {preview && (
                <img
                  src={preview}
                  alt="Preview foto"
                  className="mt-2 w-20 h-20 object-cover rounded-lg border-2 border-primary"
                />
              )}
            </Field>
          </div>

          <div className="mt-5">
            <Button type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan Data Acara"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

```
---

## src/components/pages/BroadcastPage.tsx
```tsx
import { useEffect, useMemo, useRef, useState } from "react";
import type { Broadcast, Event, Tamu } from "../../lib/db";
import { formatDate } from "../../lib/utils";
import type { BroadcastStatus } from "../../types";
import { Alert, AlertDescription } from "../ui/alert";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Progress } from "../ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";

const TEMPLATES: Record<string, string> = {
  formal: `Assalamu'alaikum Wr. Wb.

Kepada Yth. Bapak/Ibu/Saudara/i {{nama}}

Dengan memohon Ridho Allah SWT, kami mengundang Bapak/Ibu/Saudara/i untuk hadir dalam acara Syukuran Khitanan putra kami:

*{{nama_anak}}*

Tanggal: {{tanggal}}
Tempat: {{alamat}}
Kartu Undangan: {{kartu_url}}

Kehadiran Bapak/Ibu/Saudara/i merupakan kehormatan dan kebahagiaan bagi kami.

Wassalamu'alaikum Wr. Wb.`,

  santai: `Halo {{nama}}

Kami dengan bahagia mengundang kamu ke acara khitanan putra kami *{{nama_anak}}*!

Tanggal: {{tanggal}}
Tempat: {{alamat}}
Kartu Undangan: {{kartu_url}}

Yuk hadir, kita rayakan bersama!`,

  singkat: `Assalamu'alaikum, {{nama}}.

Kami mengundang ke acara Khitanan *{{nama_anak}}* pada {{tanggal}} di {{alamat}}.
Kartu Undangan: {{kartu_url}}

Mohon kehadiran Bapak/Ibu. Terima kasih.`,
};

function resolveVars(
  template: string,
  event: Event | null,
  nama: string,
  kartuUrl?: string | null
) {
  return template
    .replace(/{{nama}}/g, nama)
    .replace(/{{nama_anak}}/g, event?.nama_anak ?? "")
    .replace(/{{tanggal}}/g, event ? formatDate(event.tanggal) : "")
    .replace(/{{alamat}}/g, event?.alamat ?? "")
    .replace(/{{kartu_url}}/g, kartuUrl ?? "(kartu belum di-upload)");
}

const STATUS_BADGE: Record<string, React.ReactElement> = {
  sent: <Badge variant="sent">Terkirim</Badge>,
  failed: <Badge variant="failed">Gagal</Badge>,
  pending: <Badge variant="pending">Pending</Badge>,
};

function StatusBadge({ status }: { status: BroadcastStatus }) {
  return STATUS_BADGE[status ?? ""] ?? <Badge variant="none">Belum</Badge>;
}

interface LogEntry {
  nama: string;
  ok: boolean;
  note?: string;
}

interface Props {
  event: Event | null;
  tamu: (Tamu & { last_status?: string | null })[];
}

export default function BroadcastPage({ event, tamu: initialTamu }: Props) {
  const [template, setTemplate] = useState(TEMPLATES.formal);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [progress, setProgress] = useState<{ value: number; label: string } | null>(null);
  const [running, setRunning] = useState(false);
  const [riwayat, setRiwayat] = useState<Broadcast[]>([]);
  const stopRef = useRef(false);

  async function loadRiwayat() {
    const res = await fetch("/api/broadcast");
    setRiwayat(await res.json());
  }

  useEffect(() => {
    loadRiwayat();
  }, []);

  const filtered = useMemo(
    () =>
      initialTamu.filter((t) => {
        const matchName = t.nama.toLowerCase().includes(search.toLowerCase());
        const matchStatus = !filterStatus
          ? true
          : filterStatus === "belum"
            ? !t.last_status || t.last_status === "failed"
            : t.last_status === filterStatus;
        return matchName && matchStatus;
      }),
    [initialTamu, search, filterStatus]
  );

  const previewText = useMemo(
    () =>
      resolveVars(
        template,
        event,
        initialTamu[0]?.nama ?? "Budi Santoso",
        initialTamu[0]?.kartu_url
      ),
    [template, event, initialTamu]
  );

  function toggleAll(checked: boolean) {
    setSelected(checked ? new Set(filtered.map((t) => t.id)) : new Set());
  }

  function toggleOne(id: number, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  }

  async function startBroadcast() {
    const targets = filtered.filter((t) => selected.has(t.id));
    if (!targets.length) return alert("Pilih minimal 1 tamu.");
    if (!template.trim()) return alert("Tulis pesan terlebih dahulu.");
    if (!confirm(`Kirim pesan ke ${targets.length} tamu?`)) return;

    stopRef.current = false;
    setRunning(true);
    setLogs([]);
    setProgress({ value: 0, label: "" });

    for (let i = 0; i < targets.length; i++) {
      if (stopRef.current) {
        setProgress({
          value: Math.round((i / targets.length) * 100),
          label: `Dihentikan pada tamu ke-${i + 1}.`,
        });
        break;
      }

      const t = targets[i];
      const pesan = resolveVars(template, event, t.nama, t.kartu_url);
      setProgress({
        value: Math.round(((i + 1) / targets.length) * 100),
        label: `Mengirim ${i + 1}/${targets.length}: ${t.nama}...`,
      });

      try {
        const res = await fetch("/api/broadcast", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tamu_id: t.id, pesan }),
        });
        const data = await res.json();
        setLogs((prev) => [{ nama: t.nama, ok: data.ok, note: data.error }, ...prev]);
      } catch {
        setLogs((prev) => [{ nama: t.nama, ok: false, note: "Network error" }, ...prev]);
      }

      if (i < targets.length - 1 && !stopRef.current) {
        await new Promise((r) => setTimeout(r, 2500));
      }
    }

    setRunning(false);
    loadRiwayat();
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
      <div className="space-y-4">
        {!event && (
          <Alert variant="warning">
            <AlertDescription>
              Data acara belum diisi.{" "}
              <a href="/acara" className="font-bold underline">
                Setup dulu
              </a>
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Compose Pesan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2 flex-wrap items-center">
              <span className="text-xs text-muted-foreground font-semibold">Template:</span>
              {Object.keys(TEMPLATES).map((key) => (
                <Button
                  key={key}
                  variant="outline"
                  size="sm"
                  onClick={() => setTemplate(TEMPLATES[key])}
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Variabel:{" "}
              {["{{nama}}", "{{nama_anak}}", "{{tanggal}}", "{{alamat}}", "{{kartu_url}}"].map(
                (v) => (
                  <code key={v} className="bg-muted px-1 rounded mr-1">
                    {v}
                  </code>
                )
              )}
            </p>
            <Textarea rows={8} value={template} onChange={(e) => setTemplate(e.target.value)} />
            <div className="rounded-lg bg-muted/60 border border-border p-3">
              <p className="text-xs font-semibold text-primary mb-1">Preview (tamu pertama)</p>
              <pre className="text-xs text-foreground whitespace-pre-wrap break-words font-sans">
                {previewText}
              </pre>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pilih Penerima</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Cari nama..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Semua" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua</SelectItem>
                  <SelectItem value="belum">Belum Terkirim</SelectItem>
                  <SelectItem value="sent">Sudah Terkirim</SelectItem>
                  <SelectItem value="failed">Gagal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between text-xs border-b border-border pb-2">
              <label className="flex items-center gap-2 font-semibold cursor-pointer">
                <input type="checkbox" onChange={(e) => toggleAll(e.target.checked)} />
                Pilih Semua
              </label>
              <span className="text-primary font-semibold">{selected.size} dipilih</span>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-0.5">
              {filtered.map((t) => (
                <label
                  key={t.id}
                  className={`flex items-center gap-2 px-2 py-2 rounded cursor-pointer text-sm hover:bg-muted/60 ${t.last_status === "sent" ? "opacity-60" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(t.id)}
                    onChange={(e) => toggleOne(t.id, e.target.checked)}
                  />
                  <div className="flex-1">
                    <p className="font-semibold leading-none">{t.nama}</p>
                    <p className="text-xs text-muted-foreground">{t.no_telpon}</p>
                  </div>
                  <StatusBadge status={t.last_status as BroadcastStatus} />
                </label>
              ))}
              {!filtered.length && (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  Tidak ada tamu ditemukan.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 space-y-3">
            <Button
              variant="wa"
              className="w-full text-base py-5"
              onClick={startBroadcast}
              disabled={running}
            >
              {running ? "Mengirim..." : "Mulai Broadcast"}
            </Button>

            {progress && (
              <div className="space-y-1.5">
                <Progress value={progress.value} />
                <p className="text-xs text-muted-foreground">{progress.label}</p>
                {running && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      stopRef.current = true;
                    }}
                  >
                    Stop
                  </Button>
                )}
                <div className="max-h-40 overflow-y-auto space-y-0.5">
                  {logs.map((log, i) => (
                    <p
                      key={i}
                      className={`text-xs ${log.ok ? "text-emerald-700" : "text-destructive"}`}
                    >
                      {log.ok ? "OK" : "GAGAL"} — {log.nama}
                      {log.note ? ` (${log.note})` : ""}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Riwayat Broadcast</CardTitle>
              <Button variant="outline" size="sm" onClick={loadRiwayat}>
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-[560px] overflow-y-auto">
              {riwayat.length === 0 && (
                <p className="text-xs text-muted-foreground py-4 text-center">Belum ada riwayat.</p>
              )}
              {riwayat.map((r) => (
                <div key={r.id} className="py-3 border-b border-border last:border-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="font-semibold text-sm">{r.nama}</span>
                    <StatusBadge status={r.status as BroadcastStatus} />
                  </div>
                  <p className="text-xs text-muted-foreground">{r.no_telpon}</p>
                  <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap line-clamp-2">
                    {r.pesan?.substring(0, 80)}
                    {(r.pesan?.length ?? 0) > 80 ? "..." : ""}
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">{r.sent_at ?? r.status}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

```
---

## src/components/pages/DashboardPage.tsx
```tsx
import type { Event } from "../../lib/db";
import { formatDate } from "../../lib/utils";
import { Alert, AlertDescription } from "../ui/alert";
import { Card, CardContent } from "../ui/card";

interface Stats {
  total: number;
  sent: number;
  failed: number;
}

interface Props {
  event: Event | null;
  stats: Stats;
}

const statItems = (stats: Stats) => [
  { label: "Total Tamu", value: stats.total, className: "text-primary" },
  { label: "Terkirim", value: stats.sent, className: "text-emerald-600" },
  { label: "Gagal", value: stats.failed, className: "text-destructive" },
  { label: "Belum Kirim", value: stats.total - stats.sent, className: "text-amber-600" },
];

export default function DashboardPage({ event, stats }: Props) {
  return (
    <div className="space-y-4">
      {!event && (
        <Alert variant="warning">
          <AlertDescription>
            Data acara belum diisi.{" "}
            <a href="/acara" className="font-bold underline">
              Setup sekarang
            </a>
          </AlertDescription>
        </Alert>
      )}

      {event && (
        <Card>
          <CardContent className="p-5">
            <div className="flex gap-5 items-start">
              <div className="shrink-0">
                {event.foto_path ? (
                  <img
                    src={event.foto_path}
                    alt="Foto anak"
                    className="w-24 h-24 rounded-lg object-cover border-2 border-primary"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-lg bg-accent border-2 border-primary flex items-center justify-center text-3xl">
                    👦
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-foreground">Khitanan {event.nama_anak}</h2>
                <p className="text-sm text-muted-foreground">
                  Putra ke-{event.anak_ke} dari{" "}
                  <span className="font-semibold text-foreground">{event.nama_bapak}</span>
                  {" & "}
                  <span className="font-semibold text-foreground">{event.nama_ibu}</span>
                </p>
                <p className="text-sm text-muted-foreground">{formatDate(event.tanggal)}</p>
                <p className="text-sm text-muted-foreground">{event.alamat}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statItems(stats).map(({ label, value, className }) => (
          <Card key={label}>
            <CardContent className="p-4 text-center">
              <span className={`block text-3xl font-extrabold ${className}`}>{value}</span>
              <span className="text-xs text-muted-foreground font-semibold">{label}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

```
---

## src/components/pages/KartuPage.tsx
```tsx
import { useState } from "react";
import type { Event } from "../../lib/db";
import { sanitizeFilename } from "../../lib/utils";
import type { TamuItem } from "../../types";
import { Alert, AlertDescription } from "../ui/alert";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Progress } from "../ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface Props {
  event: Event | null;
  tamu: TamuItem[];
}

const RENDER_ID = "kartu-render-target";

function buildKartuHTML(event: Event, namaTamu: string): string {
  const tgl = new Date(event.tanggal);
  const tglFmt = tgl.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const waktu = tgl.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB";
  const fotoHtml = event.foto_path
    ? `<img src="${event.foto_path}" style="width:100%;height:100%;object-fit:cover"/>`
    : `<span style="font-size:3rem">&#x1F466;</span>`;

  return `
<div style="width:800px;height:500px;position:relative;overflow:hidden;font-family:Georgia,serif;background:linear-gradient(135deg,#1b4332 0%,#2d6a4f 40%,#52b788 100%)">
  <svg style="position:absolute;top:0;left:0;width:160px;opacity:.25" viewBox="0 0 160 160">
    <circle cx="0" cy="0" r="140" fill="none" stroke="#fff" stroke-width="1.5"/>
    <circle cx="0" cy="0" r="110" fill="none" stroke="#fff" stroke-width="1"/>
    <circle cx="0" cy="0" r="80" fill="none" stroke="#d4af37" stroke-width="1.5"/>
  </svg>
  <svg style="position:absolute;bottom:0;right:0;width:160px;opacity:.25;transform:rotate(180deg)" viewBox="0 0 160 160">
    <circle cx="0" cy="0" r="140" fill="none" stroke="#fff" stroke-width="1.5"/>
    <circle cx="0" cy="0" r="110" fill="none" stroke="#fff" stroke-width="1"/>
    <circle cx="0" cy="0" r="80" fill="none" stroke="#d4af37" stroke-width="1.5"/>
  </svg>
  <div style="position:absolute;left:0;top:0;width:260px;height:500px;background:rgba(0,0,0,.25);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px">
    <div style="width:160px;height:160px;border-radius:50%;border:4px solid #d4af37;overflow:hidden;background:#1b4332;display:flex;align-items:center;justify-content:center">
      ${fotoHtml}
    </div>
    <p style="color:#d4af37;font-size:13px;text-align:center;padding:0 16px;line-height:1.5">
      Putra ke-${event.anak_ke} dari<br/>
      <strong style="color:#fff">${event.nama_bapak}</strong><br/>
      &amp; <strong style="color:#fff">${event.nama_ibu}</strong>
    </p>
  </div>
  <div style="position:absolute;left:260px;top:20px;width:2px;height:460px;background:linear-gradient(to bottom,transparent,#d4af37,#d4af37,transparent)"></div>
  <div style="position:absolute;left:278px;top:0;right:0;height:500px;display:flex;flex-direction:column;justify-content:center;padding:24px 32px 24px 20px">
    <p style="color:rgba(255,255,255,.7);font-size:11px;letter-spacing:2px;text-transform:uppercase;margin-bottom:2px">Kepada Yth.</p>
    <p style="color:#fff;font-size:20px;font-weight:bold;margin-bottom:12px;border-bottom:1px solid rgba(212,175,55,.4);padding-bottom:8px">${namaTamu}</p>
    <p style="color:rgba(255,255,255,.85);font-size:12px;line-height:1.7;margin-bottom:12px">
      Dengan penuh kebahagiaan, kami mengundang Bapak/Ibu/Saudara/i untuk hadir dalam acara
      <strong style="color:#d4af37">Khitanan</strong> putra kami:
    </p>
    <p style="color:#d4af37;font-size:28px;font-weight:bold;text-align:center;text-shadow:0 2px 8px rgba(0,0,0,.4);margin-bottom:14px;letter-spacing:1px">${event.nama_anak}</p>
    <div style="background:rgba(0,0,0,.25);border-radius:8px;padding:10px 14px;font-size:12px;color:#fff;line-height:2">
      <div>&#x1F4C5; <strong>${tglFmt}</strong></div>
      <div>&#x23F0; <strong>${waktu}</strong></div>
      <div>&#x1F4CD; <strong>${event.alamat}</strong></div>
    </div>
    <p style="color:rgba(255,255,255,.5);font-size:10px;text-align:right;margin-top:10px;font-style:italic">Kehadiran Anda adalah kehormatan bagi kami</p>
  </div>
</div>`;
}

async function generatePNG(event: Event, namaTamu: string): Promise<Blob> {
  let target = document.getElementById(RENDER_ID);
  if (!target) {
    target = document.createElement("div");
    target.id = RENDER_ID;
    target.style.cssText = "position:fixed;left:-9999px;top:0;z-index:-1";
    document.body.appendChild(target);
  }
  target.innerHTML = buildKartuHTML(event, namaTamu);

  const canvas = await (window as any).html2canvas(target.firstElementChild, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: null,
    width: 800,
    height: 500,
  });
  return new Promise((res) => canvas.toBlob((b: Blob) => res(b), "image/png"));
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

async function uploadKartu(event: Event, tamuId: number, namaTamu: string): Promise<string | null> {
  const blob = await generatePNG(event, namaTamu);
  const filename = `${sanitizeFilename(namaTamu)}.png`;
  const fd = new FormData();
  fd.append("file", blob, filename);
  fd.append("filename", filename);

  const res = await fetch("/api/kartu/upload", { method: "POST", body: fd });
  const data = await res.json();
  if (!data.ok) return null;

  await fetch("/api/tamu", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: tamuId, kartu_url: data.url }),
  });
  return data.url;
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

interface ProgressState {
  value: number;
  label: string;
}

export default function KartuPage({ event, tamu }: Props) {
  const [selectedId, setSelectedId] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [tamuData, setTamuData] = useState(tamu);

  const selectedTamu = tamuData.find((t) => String(t.id) === selectedId);

  async function refreshKartuStatus() {
    const res = await fetch("/api/tamu");
    const all: any[] = await res.json();
    setTamuData(all.map(({ id, nama, kartu_url }) => ({ id, nama, kartu_url })));
  }

  function preview() {
    if (!event || !selectedTamu) return;
    setPreviewHtml(buildKartuHTML(event, selectedTamu.nama));
  }

  async function downloadSatu() {
    if (!event || !selectedTamu) return;
    const blob = await generatePNG(event, selectedTamu.nama);
    downloadBlob(blob, `${sanitizeFilename(selectedTamu.nama)}.png`);
  }

  async function downloadSemua() {
    if (!event || !tamu.length) return;
    if (!confirm(`Generate & download ${tamu.length} kartu?`)) return;
    for (let i = 0; i < tamu.length; i++) {
      setProgress({
        value: Math.round(((i + 1) / tamu.length) * 100),
        label: `Generating ${i + 1}/${tamu.length}: ${tamu[i].nama}`,
      });
      const blob = await generatePNG(event, tamu[i].nama);
      downloadBlob(blob, `${sanitizeFilename(tamu[i].nama)}.png`);
      await sleep(600);
    }
    setProgress({ value: 100, label: `Selesai! ${tamu.length} kartu didownload.` });
  }

  async function uploadSatu() {
    if (!event || !selectedTamu) return;
    setProgress({ value: 0, label: `Uploading ${selectedTamu.nama}...` });
    const url = await uploadKartu(event, selectedTamu.id, selectedTamu.nama);
    setProgress({ value: 100, label: url ? "Upload berhasil!" : "Upload gagal." });
    if (url) refreshKartuStatus();
  }

  async function uploadSemua() {
    if (!event || !tamu.length) return;
    if (!confirm(`Generate & upload ${tamu.length} kartu?`)) return;
    for (let i = 0; i < tamu.length; i++) {
      setProgress({
        value: Math.round(((i + 1) / tamu.length) * 100),
        label: `Upload ${i + 1}/${tamu.length}: ${tamu[i].nama}`,
      });
      await uploadKartu(event, tamu[i].id, tamu[i].nama);
      await sleep(500);
    }
    setProgress({ value: 100, label: "Semua kartu berhasil di-upload!" });
    refreshKartuStatus();
  }

  if (!event) {
    return (
      <Alert variant="warning">
        <AlertDescription>
          Data acara belum diisi.{" "}
          <a href="/acara" className="font-bold underline">
            Setup dulu
          </a>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <script
        src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"
        async
      />

      <Card>
        <CardHeader>
          <CardTitle>Generate Kartu Undangan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1.5 min-w-[200px]">
              <label className="text-xs font-semibold text-muted-foreground">Pilih Tamu</label>
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger>
                  <SelectValue placeholder="— Pilih tamu —" />
                </SelectTrigger>
                <SelectContent>
                  {tamu.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={preview} disabled={!selectedId}>
                Preview
              </Button>
              <Button variant="success" onClick={downloadSatu} disabled={!selectedId}>
                Download
              </Button>
              <Button variant="outline" onClick={uploadSatu} disabled={!selectedId}>
                Upload URL
              </Button>
              <Button variant="warning" onClick={downloadSemua}>
                Download Semua
              </Button>
              <Button variant="secondary" onClick={uploadSemua}>
                Upload Semua
              </Button>
            </div>
          </div>

          {progress && (
            <div className="space-y-1.5">
              <Progress value={progress.value} />
              <p className="text-xs text-muted-foreground">{progress.label}</p>
            </div>
          )}

          {previewHtml && (
            <div className="bg-muted rounded-lg p-3 overflow-auto">
              <div
                style={{
                  transformOrigin: "top left",
                  transform: "scale(0.6)",
                  width: 800,
                  height: 500,
                }}
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status Kartu Tamu</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted text-muted-foreground text-xs">
                  <th className="px-3 py-2 text-left">Nama</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">URL</th>
                </tr>
              </thead>
              <tbody>
                {tamuData.map((t) => (
                  <tr key={t.id} className="border-b border-border hover:bg-muted/40">
                    <td className="px-3 py-2 font-medium">{t.nama}</td>
                    <td className="px-3 py-2">
                      {t.kartu_url ? (
                        <Badge variant="sent">Siap</Badge>
                      ) : (
                        <Badge variant="none">Belum di-upload</Badge>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {t.kartu_url ? (
                        <a
                          href={t.kartu_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary text-xs underline"
                        >
                          Lihat
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

```
---

## src/components/pages/TamuPage.tsx
```tsx
import { useEffect, useState } from "react";
import type { Tamu } from "../../lib/db";
import { useFlashAlert } from "../../hooks/useFlashAlert";
import type { BroadcastStatus } from "../../types";
import { Alert, AlertDescription } from "../ui/alert";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

const STATUS_BADGE: Record<string, React.ReactElement> = {
  sent: <Badge variant="sent">Terkirim</Badge>,
  failed: <Badge variant="failed">Gagal</Badge>,
  pending: <Badge variant="pending">Pending</Badge>,
};

function StatusBadge({ status }: { status: BroadcastStatus }) {
  return STATUS_BADGE[status ?? ""] ?? <Badge variant="none">—</Badge>;
}

interface EditDialogProps {
  tamu: Tamu | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

function EditDialog({ tamu, open, onClose, onSaved }: EditDialogProps) {
  const [nama, setNama] = useState("");
  const [alamat, setAlamat] = useState("");
  const [hp, setHp] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (tamu) {
      setNama(tamu.nama);
      setAlamat(tamu.alamat ?? "");
      setHp(tamu.no_telpon ?? "");
    }
  }, [tamu]);

  async function save() {
    if (!nama.trim() || !tamu) return;
    setSaving(true);
    await fetch("/api/tamu", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: tamu.id, nama, alamat, no_telpon: hp }),
    });
    setSaving(false);
    onSaved();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Tamu</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="e-nama">Nama *</Label>
            <Input id="e-nama" value={nama} onChange={(e) => setNama(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="e-alamat">Alamat</Label>
            <Input id="e-alamat" value={alamat} onChange={(e) => setAlamat(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="e-hp">No. Telpon</Label>
            <Input id="e-hp" value={hp} onChange={(e) => setHp(e.target.value)} />
          </div>
          <div className="flex gap-2 pt-1">
            <Button onClick={save} disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
            <Button variant="secondary" onClick={onClose}>
              Batal
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function TamuPage() {
  const [allTamu, setAllTamu] = useState<Tamu[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [editTarget, setEditTarget] = useState<Tamu | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [nama, setNama] = useState("");
  const [alamat, setAlamat] = useState("");
  const [hp, setHp] = useState("");
  const importAlert = useFlashAlert();
  const tambahAlert = useFlashAlert();

  async function loadTamu() {
    const res = await fetch("/api/tamu");
    setAllTamu(await res.json());
  }

  useEffect(() => {
    loadTamu();
  }, []);

  const filtered = allTamu.filter((t) => {
    const matchName = t.nama.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus
      ? true
      : filterStatus === "null"
        ? !t.broadcast_status
        : t.broadcast_status === filterStatus;
    return matchName && matchStatus;
  });

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/tamu/import", { method: "POST", body: fd });
    const data = await res.json();
    if (data.ok) {
      importAlert.show(
        `Berhasil import ${data.inserted} tamu.${data.skipped ? ` (${data.skipped} dilewati)` : ""}`,
        "success"
      );
      loadTamu();
    } else {
      importAlert.show(data.error ?? "Import gagal.", "destructive");
    }
    e.target.value = "";
  }

  async function tambahTamu() {
    if (!nama.trim()) {
      tambahAlert.show("Nama wajib diisi.", "warning");
      return;
    }
    const res = await fetch("/api/tamu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nama, alamat, no_telpon: hp }),
    });
    const data = await res.json();
    if (data.ok) {
      tambahAlert.show("Tamu berhasil ditambahkan.", "success");
      setNama("");
      setAlamat("");
      setHp("");
      loadTamu();
    } else {
      tambahAlert.show(data.error ?? "Gagal.", "destructive");
    }
  }

  async function hapus(id: number) {
    if (!confirm("Hapus tamu ini?")) return;
    await fetch(`/api/tamu?id=${id}`, { method: "DELETE" });
    loadTamu();
  }

  function getCheckedIds(): number[] {
    return Array.from(document.querySelectorAll<HTMLInputElement>(".row-check:checked")).map((c) =>
      parseInt(c.dataset.id!)
    );
  }

  async function hapusSemua() {
    const ids = getCheckedIds().length > 0 ? getCheckedIds() : allTamu.map((t) => t.id);
    if (!confirm(`Hapus ${ids.length} tamu?`)) return;
    await Promise.all(ids.map((id) => fetch(`/api/tamu?id=${id}`, { method: "DELETE" })));
    loadTamu();
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Import dari Excel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Kolom yang dikenali: <code className="bg-muted px-1 rounded text-xs">nama_lengkap</code>
            , <code className="bg-muted px-1 rounded text-xs">alamat</code>,{" "}
            <code className="bg-muted px-1 rounded text-xs">no_telpon</code> (opsional).
          </p>
          <div className="flex gap-2 flex-wrap items-center">
            <Input type="file" accept=".xlsx,.xls" className="w-auto" onChange={handleImport} />
            <Button variant="secondary" asChild>
              <a href="/template-tamu.xlsx" download>
                Unduh Template
              </a>
            </Button>
          </div>
          {importAlert.alert && (
            <Alert variant={importAlert.alert.variant}>
              <AlertDescription>{importAlert.alert.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tambah Tamu Manual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-[2fr_2fr_1.5fr_auto] gap-2">
            <Input
              placeholder="Nama lengkap *"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
            />
            <Input
              placeholder="Alamat"
              value={alamat}
              onChange={(e) => setAlamat(e.target.value)}
            />
            <Input
              placeholder="No. Telpon (08xxx)"
              value={hp}
              onChange={(e) => setHp(e.target.value)}
            />
            <Button onClick={tambahTamu}>Tambah</Button>
          </div>
          {tambahAlert.alert && (
            <Alert variant={tambahAlert.alert.variant}>
              <AlertDescription>{tambahAlert.alert.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center flex-wrap gap-2">
            <CardTitle>Daftar Tamu</CardTitle>
            <div className="flex gap-2 flex-wrap">
              <Input
                placeholder="Cari nama..."
                className="w-40"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua Status</SelectItem>
                  <SelectItem value="sent">Terkirim</SelectItem>
                  <SelectItem value="failed">Gagal</SelectItem>
                  <SelectItem value="null">Belum Kirim</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="destructive" size="sm" onClick={hapusSemua}>
                Hapus
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">Belum ada data tamu.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-muted text-muted-foreground text-xs">
                    <th className="px-3 py-2 text-left w-8">
                      <input
                        type="checkbox"
                        onChange={(e) =>
                          document
                            .querySelectorAll<HTMLInputElement>(".row-check")
                            .forEach((c) => (c.checked = e.target.checked))
                        }
                      />
                    </th>
                    <th className="px-3 py-2 text-left">#</th>
                    <th className="px-3 py-2 text-left">Nama</th>
                    <th className="px-3 py-2 text-left">Alamat</th>
                    <th className="px-3 py-2 text-left">No. Telpon</th>
                    <th className="px-3 py-2 text-left">Status WA</th>
                    <th className="px-3 py-2 text-left">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t, i) => (
                    <tr
                      key={t.id}
                      className="border-b border-border hover:bg-muted/40 transition-colors"
                    >
                      <td className="px-3 py-2">
                        <input type="checkbox" className="row-check" data-id={t.id} />
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                      <td className="px-3 py-2 font-semibold">{t.nama}</td>
                      <td className="px-3 py-2 text-muted-foreground">{t.alamat || "—"}</td>
                      <td className="px-3 py-2 text-muted-foreground">{t.no_telpon || "—"}</td>
                      <td className="px-3 py-2">
                        <StatusBadge status={t.broadcast_status as BroadcastStatus} />
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditTarget(t);
                              setEditOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => hapus(t.id)}>
                            Hapus
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-muted-foreground mt-2">
                Menampilkan {filtered.length} dari {allTamu.length} tamu
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <EditDialog
        tamu={editTarget}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={loadTamu}
      />
    </div>
  );
}

```
---

## src/components/types/index.ts
```ts
export type BroadcastStatus = "sent" | "failed" | "pending" | null;

export interface TamuItem {
  id: number;
  nama: string;
  kartu_url: string | null;
}

```
---

## src/components/ui/alert.tsx
```tsx
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "../../lib/utils";

const alertVariants = cva("relative w-full rounded-lg border px-4 py-3 text-sm", {
  variants: {
    variant: {
      default: "bg-background text-foreground",
      success: "border-emerald-200 bg-emerald-50 text-emerald-800",
      destructive: "border-red-200 bg-red-50 text-red-800",
      warning: "border-amber-200 bg-amber-50 text-amber-800",
      info: "border-blue-200 bg-blue-50 text-blue-800",
    },
  },
  defaultVariants: { variant: "default" },
});

export const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
));
Alert.displayName = "Alert";

export const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("font-semibold", className)} {...props} />
));
AlertDescription.displayName = "AlertDescription";

```
---

## src/components/ui/badge.tsx
```tsx
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        sent: "border-transparent bg-emerald-100 text-emerald-800",
        failed: "border-transparent bg-red-100 text-red-800",
        pending: "border-transparent bg-amber-100 text-amber-800",
        none: "border-transparent bg-muted text-muted-foreground",
        outline: "text-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

```
---

## src/components/ui/button.tsx
```tsx
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        success: "bg-emerald-600 text-white hover:bg-emerald-700",
        warning: "bg-amber-500 text-white hover:bg-amber-600",
        wa: "bg-[#25d366] text-white hover:bg-[#1ebe5d]",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-7 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

```
---

## src/components/ui/card.tsx
```tsx
import * as React from "react";
import { cn } from "../../lib/utils";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("rounded-xl border bg-card text-card-foreground shadow-sm", className)}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1 p-5 pb-3", className)} {...props} />
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-sm font-bold leading-none text-primary", className)}
      {...props}
    />
  )
);
CardTitle.displayName = "CardTitle";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-5 pt-0", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

export { Card, CardContent, CardHeader, CardTitle };

```
---

## src/components/ui/dialog.tsx
```tsx
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import * as React from "react";
import { cn } from "../../lib/utils";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-xl border bg-card p-6 shadow-xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 mb-4", className)} {...props} />
);

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-sm font-bold text-primary", className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

export { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger };

```
---

## src/components/ui/input.tsx
```tsx
import * as React from "react";
import { cn } from "../../lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };

```
---

## src/components/ui/label.tsx
```tsx
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "../../lib/utils";

const labelVariants = cva(
  "text-xs font-semibold leading-none text-muted-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
);

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root ref={ref} className={cn(labelVariants(), className)} {...props} />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };

```
---

## src/components/ui/progress.tsx
```tsx
import * as React from "react";
import { cn } from "../../lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("relative h-2.5 w-full overflow-hidden rounded-full bg-muted", className)}
      {...props}
    >
      <div
        className="h-full bg-primary transition-all duration-300 rounded-full"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
);
Progress.displayName = "Progress";

export { Progress };

```
---

## src/components/ui/select.tsx
```tsx
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import * as React from "react";
import { cn } from "../../lib/utils";

const Select = SelectPrimitive.Root;
const SelectValue = SelectPrimitive.Value;
const SelectGroup = SelectPrimitive.Group;

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-card text-card-foreground shadow-md",
        position === "popper" && "translate-y-1",
        className
      )}
      position={position}
      {...props}
    >
      <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

export { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue };

```
---

## src/components/ui/textarea.tsx
```tsx
import * as React from "react";
import { cn } from "../../lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-y",
      className
    )}
    ref={ref}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export { Textarea };

```
---

## src/layouts/Layout.astro
```astro
---
import "../styles/globals.css";

const { title } = Astro.props;

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/acara", label: "Acara" },
  { href: "/tamu", label: "Tamu" },
  { href: "/kartu", label: "Kartu" },
  { href: "/broadcast", label: "Broadcast" },
];

const current = Astro.url.pathname;
---

<!doctype html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title} — Undangan Khitanan</title>
  </head>
  <body>
    <header class="bg-primary text-primary-foreground px-6 py-3.5 flex items-center gap-3">
      <h1 class="text-sm font-bold tracking-wide">Undangan Khitanan</h1>
    </header>

    <nav class="bg-card border-b border-border flex overflow-x-auto">
      {
        NAV.map(({ href, label }) => (
          <a
            href={href}
            class={[
              "px-5 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors",
              current === href
                ? "text-primary border-primary"
                : "text-muted-foreground border-transparent hover:bg-muted",
            ].join(" ")}
          >
            {label}
          </a>
        ))
      }
    </nav>

    <main class="max-w-5xl mx-auto px-5 py-6 space-y-4">
      <slot />
    </main>
  </body>
</html>

```
---

## src/lib/db.ts
```ts
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST ?? "127.0.0.1",
  port: parseInt(process.env.DB_PORT ?? "3306"),
  user: process.env.DB_USER ?? "root",
  password: process.env.DB_PASS ?? "",
  database: process.env.DB_NAME ?? "undangan_khitanan",
  waitForConnections: true,
  connectionLimit: 10,
  timezone: "+07:00",
});

export async function bootstrap() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS event (
      id         INT PRIMARY KEY DEFAULT 1,
      nama_anak  VARCHAR(255),
      foto_path  VARCHAR(255),
      anak_ke    INT,
      nama_bapak VARCHAR(255),
      nama_ibu   VARCHAR(255),
      alamat     TEXT,
      tanggal    DATETIME
    )
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS tamu (
      id         INT PRIMARY KEY AUTO_INCREMENT,
      nama       VARCHAR(255) NOT NULL,
      alamat     TEXT,
      no_telpon  VARCHAR(30),
      kartu_url  TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS broadcast (
      id       INT PRIMARY KEY AUTO_INCREMENT,
      tamu_id  INT NOT NULL,
      pesan    TEXT,
      status   VARCHAR(20) DEFAULT 'pending',
      sent_at  DATETIME,
      FOREIGN KEY (tamu_id) REFERENCES tamu(id) ON DELETE CASCADE
    )
  `);
}

export interface Event {
  id: number;
  nama_anak: string;
  foto_path: string;
  anak_ke: number;
  nama_bapak: string;
  nama_ibu: string;
  alamat: string;
  tanggal: string;
}

export interface Tamu {
  id: number;
  nama: string;
  alamat: string;
  no_telpon: string;
  kartu_url: string | null;
  created_at: string;
  broadcast_status?: string | null;
}

export interface Broadcast {
  id: number;
  tamu_id: number;
  pesan: string;
  status: string;
  sent_at: string | null;
  nama?: string;
  no_telpon?: string;
}

async function one<T>(sql: string, params: unknown[] = []): Promise<T | undefined> {
  const [rows] = await pool.execute<any[]>(sql, params);
  return rows[0] as T | undefined;
}

async function all<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  const [rows] = await pool.execute<any[]>(sql, params);
  return rows as T[];
}

async function run(sql: string, params: unknown[] = []): Promise<{ insertId: number }> {
  const [result] = await pool.execute<any>(sql, params);
  return { insertId: result.insertId };
}

export const q = {
  getEvent: () => one<Event>("SELECT * FROM event WHERE id = 1"),

  upsertEvent: (d: Omit<Event, "id">) =>
    run(
      `INSERT INTO event (id, nama_anak, foto_path, anak_ke, nama_bapak, nama_ibu, alamat, tanggal)
       VALUES (1, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         nama_anak  = VALUES(nama_anak),
         foto_path  = VALUES(foto_path),
         anak_ke    = VALUES(anak_ke),
         nama_bapak = VALUES(nama_bapak),
         nama_ibu   = VALUES(nama_ibu),
         alamat     = VALUES(alamat),
         tanggal    = VALUES(tanggal)`,
      [d.nama_anak, d.foto_path, d.anak_ke, d.nama_bapak, d.nama_ibu, d.alamat, d.tanggal]
    ),

  listTamu: () =>
    all<Tamu>(`
      SELECT t.*,
        (SELECT status FROM broadcast WHERE tamu_id = t.id ORDER BY id DESC LIMIT 1) AS broadcast_status
      FROM tamu t ORDER BY t.id DESC
    `),

  getTamu: (id: number) => one<Tamu>("SELECT * FROM tamu WHERE id = ?", [id]),

  insertTamu: (nama: string, alamat: string, no_telpon: string) =>
    run("INSERT INTO tamu (nama, alamat, no_telpon) VALUES (?, ?, ?)", [nama, alamat, no_telpon]),

  insertTamuBatch: async (rows: { nama: string; alamat: string; no_telpon: string }[]) => {
    if (!rows.length) return;
    const placeholders = rows.map(() => "(?, ?, ?)").join(", ");
    const params = rows.flatMap((r) => [r.nama, r.alamat, r.no_telpon]);
    await run(`INSERT INTO tamu (nama, alamat, no_telpon) VALUES ${placeholders}`, params);
  },

  updateTamu: (id: number, nama: string, alamat: string, no_telpon: string) =>
    run("UPDATE tamu SET nama=?, alamat=?, no_telpon=? WHERE id=?", [nama, alamat, no_telpon, id]),

  updateKartuUrl: (id: number, kartu_url: string) =>
    run("UPDATE tamu SET kartu_url=? WHERE id=?", [kartu_url, id]),

  deleteTamu: (id: number) => run("DELETE FROM tamu WHERE id=?", [id]),

  listBroadcast: () =>
    all<Broadcast>(`
      SELECT b.*, t.nama, t.no_telpon
      FROM broadcast b JOIN tamu t ON t.id = b.tamu_id
      ORDER BY b.id DESC LIMIT 100
    `),

  insertBroadcast: (tamu_id: number, pesan: string) =>
    run("INSERT INTO broadcast (tamu_id, pesan, status) VALUES (?, ?, 'pending')", [
      tamu_id,
      pesan,
    ]),

  updateBroadcastSent: (id: number) =>
    run("UPDATE broadcast SET status='sent', sent_at=NOW() WHERE id=?", [id]),

  updateBroadcastFailed: (id: number) =>
    run("UPDATE broadcast SET status='failed' WHERE id=?", [id]),

  stats: async () => {
    const [total, sent, failed] = await Promise.all([
      one<{ n: number }>("SELECT COUNT(*) AS n FROM tamu"),
      one<{ n: number }>("SELECT COUNT(*) AS n FROM broadcast WHERE status='sent'"),
      one<{ n: number }>("SELECT COUNT(*) AS n FROM broadcast WHERE status='failed'"),
    ]);
    return {
      total: total?.n ?? 0,
      sent: sent?.n ?? 0,
      failed: failed?.n ?? 0,
    };
  },
};

export default pool;

```
---

## src/lib/phone.ts
```ts
export function normalizePhone(raw: string): string {
  let n = raw.trim().replace(/\D/g, "");
  if (n.startsWith("62")) n = "0" + n.slice(2);
  if (n.startsWith("+62")) n = "0" + n.slice(3);
  return n;
}

```
---

## src/lib/utils.ts
```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizePhone(raw: string): string {
  let n = raw.trim().replace(/\D/g, "");
  if (n.startsWith("62")) n = "0" + n.slice(2);
  return n;
}

export function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\u00C0-\u024F\s]/g, "")
    .trim()
    .replace(/\s+/g, "_");
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("id-ID", {
    dateStyle: "full",
    timeStyle: "short",
  });
}

```
---

## src/lib/whatsapp.ts
```ts
const ENDPOINT = process.env.WA_ENDPOINT ?? "";
const API_KEY = process.env.WA_API_KEY ?? "";

export async function sendWA(number: string, message: string): Promise<void> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
    body: JSON.stringify({ number, message }),
  });
  if (!res.ok) throw new Error(`WA API ${res.status}`);
}

```
---

## src/pages/acara.astro
```astro
---
import Layout from "../layouts/Layout.astro";
import { bootstrap, q } from "../lib/db";
import AcaraPage from "../components/pages/AcaraPage";

await bootstrap();
const event = (await q.getEvent()) ?? null;
---

<Layout title="Setup Acara">
  <AcaraPage event={event} client:load />
</Layout>

```
---

## src/pages/api/broadcast.ts
```ts
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

```
---

## src/pages/api/event.ts
```ts
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

```
---

## src/pages/api/kartu/upload.ts
```ts
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

```
---

## src/pages/api/tamu/import.ts
```ts
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

```
---

## src/pages/api/tamu.ts
```ts
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

```
---

## src/pages/broadcast.astro
```astro
---
import Layout from "../layouts/Layout.astro";
import { bootstrap, q } from "../lib/db";
import BroadcastPage from "../components/pages/BroadcastPage";

await bootstrap();
const event = (await q.getEvent()) ?? null;
const tamu = (await q.listTamu()).filter((t) => t.no_telpon) as any[];
---

<Layout title="Broadcast WhatsApp">
  <BroadcastPage event={event} tamu={tamu} client:load />
</Layout>

```
---

## src/pages/index.astro
```astro
---
import Layout from "../layouts/Layout.astro";
import { bootstrap, q } from "../lib/db";
import DashboardPage from "../components/pages/DashboardPage";

await bootstrap();
const event = (await q.getEvent()) ?? null;
const stats = await q.stats();
---

<Layout title="Dashboard">
  <DashboardPage event={event} stats={stats} client:load />
</Layout>

```
---

## src/pages/kartu.astro
```astro
---
import Layout from "../layouts/Layout.astro";
import { bootstrap, q } from "../lib/db";
import KartuPage from "../components/pages/KartuPage";

await bootstrap();
const event = (await q.getEvent()) ?? null;
const tamu = (await q.listTamu()).map(({ id, nama, kartu_url }) => ({ id, nama, kartu_url }));
---

<Layout title="Kartu Undangan">
  <KartuPage event={event} tamu={tamu} client:load />
</Layout>

```
---

## src/pages/tamu.astro
```astro
---
import Layout from "../layouts/Layout.astro";
import TamuPage from "../components/pages/TamuPage";
---

<Layout title="Tamu Undangan">
  <TamuPage client:load />
</Layout>

```
---

## src/pages/template-tamu.xlsx.ts
```ts
import type { APIRoute } from "astro";
import * as XLSX from "xlsx";

export const GET: APIRoute = () => {
  const ws = XLSX.utils.aoa_to_sheet([
    ["nama_lengkap", "alamat", "no_telpon"],
    ["Budi Santoso", "Jl. Melati No. 5, Jakarta", "08123456789"],
    ["Sari Dewi", "Jl. Anggrek No. 10, Bogor", ""],
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Tamu");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new Response(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="template-tamu.xlsx"',
    },
  });
};

```
---

## src/styles/globals.css
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 120 20% 97%;
    --foreground: 150 20% 10%;
    --card: 0 0% 100%;
    --card-foreground: 150 20% 10%;
    --primary: 150 42% 30%;
    --primary-foreground: 0 0% 100%;
    --secondary: 150 20% 94%;
    --secondary-foreground: 150 42% 20%;
    --muted: 150 10% 94%;
    --muted-foreground: 150 10% 45%;
    --accent: 150 30% 88%;
    --accent-foreground: 150 42% 20%;
    --destructive: 0 72% 51%;
    --destructive-foreground: 0 0% 100%;
    --border: 150 15% 88%;
    --input: 150 15% 88%;
    --ring: 150 42% 30%;
    --radius: 0.625rem;
  }

  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground font-sans antialiased;
  }
}

```
---

## tailwind.config.mjs
```js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./src/**/*.{astro,html,js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
};

```
---

## tsconfig.json
```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}

```
---
