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
  const [filterStatus, setFilterStatus] = useState("all");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [progress, setProgress] = useState<{ value: number; label: string } | null>(null);
  const [running, setRunning] = useState(false);
  const [tamuList, setTamuList] = useState(initialTamu);
  const [riwayat, setRiwayat] = useState<Broadcast[]>([]);
  const stopRef = useRef(false);

  async function loadRiwayat() {
    const res = await fetch("/api/broadcast");
    setRiwayat(await res.json());
  }

  async function refreshTamu() {
    const res = await fetch("/api/tamu");
    const all: Tamu[] = await res.json();
    setTamuList(
      all
        .filter((t) => t.no_telpon)
        .map((t) => ({ ...t, last_status: t.broadcast_status ?? null })) as any[]
    );
  }

  useEffect(() => {
    loadRiwayat();
  }, []);

  const filtered = useMemo(
    () =>
      tamuList.filter((t) => {
        const matchName = t.nama.toLowerCase().includes(search.toLowerCase());
        const matchStatus =
          filterStatus === "all"
            ? true
            : filterStatus === "belum"
              ? !t.last_status || t.last_status === "failed"
              : t.last_status === filterStatus;
        return matchName && matchStatus;
      }),
    [tamuList, search, filterStatus]
  );

  const previewText = useMemo(
    () => resolveVars(template, event, tamuList[0]?.nama ?? "Budi Santoso", tamuList[0]?.kartu_url),
    [template, event, tamuList]
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
    await Promise.all([loadRiwayat(), refreshTamu()]);
  }

  const sentCount = riwayat.filter((r) => r.status === "sent").length;
  const failedCount = riwayat.filter((r) => r.status === "failed").length;

  return (
    <div className="fade-in space-y-4">
      <div className="mb-1">
        <h1 className="text-xl font-bold text-foreground">Broadcast WhatsApp</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Kirim undangan massal via WhatsApp dengan template pesan dinamis.
        </p>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
        <div className="space-y-4">
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
                    variant={template === TEMPLATES[key] ? "default" : "outline"}
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
                    <code key={v} className="bg-muted px-1 rounded mr-1 text-xs">
                      {v}
                    </code>
                  )
                )}
              </p>

              <Textarea rows={8} value={template} onChange={(e) => setTemplate(e.target.value)} />

              <div className="rounded-lg bg-muted/40 border border-border/60 p-3">
                <p className="text-xs font-semibold text-primary mb-1.5">Preview (tamu pertama)</p>
                <pre className="text-xs text-foreground whitespace-pre-wrap break-words font-sans leading-relaxed">
                  {previewText}
                </pre>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                Pilih Penerima
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  {selected.size} dipilih
                </span>
              </CardTitle>
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
                    <SelectItem value="all">Semua</SelectItem>
                    <SelectItem value="belum">Belum Terkirim</SelectItem>
                    <SelectItem value="sent">Sudah Terkirim</SelectItem>
                    <SelectItem value="failed">Gagal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between text-xs border-b border-border/50 pb-2">
                <label className="flex items-center gap-2 font-semibold cursor-pointer select-none">
                  <input type="checkbox" onChange={(e) => toggleAll(e.target.checked)} />
                  Pilih Semua ({filtered.length})
                </label>
              </div>

              <div className="max-h-64 overflow-y-auto scrollbar-thin space-y-0.5">
                {filtered.map((t) => (
                  <label
                    key={t.id}
                    className={`flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer text-sm hover:bg-muted/50 transition-colors ${t.last_status === "sent" ? "opacity-60" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(t.id)}
                      onChange={(e) => toggleOne(t.id, e.target.checked)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold leading-none truncate">{t.nama}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{t.no_telpon}</p>
                    </div>
                    <StatusBadge status={t.last_status as BroadcastStatus} />
                  </label>
                ))}
                {!filtered.length && (
                  <p className="text-xs text-muted-foreground py-6 text-center">
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
                <div className="space-y-2">
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
                  <div className="max-h-36 overflow-y-auto scrollbar-thin space-y-0.5 mt-1">
                    {logs.map((log, i) => (
                      <p
                        key={i}
                        className={`text-xs ${log.ok ? "text-emerald-600" : "text-destructive"}`}
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

        <div className="space-y-4">
          <div className="bento-grid-2">
            <Card>
              <CardContent className="p-4 text-center">
                <span className="block text-2xl font-extrabold text-emerald-600">{sentCount}</span>
                <span className="text-xs text-muted-foreground font-semibold">Terkirim</span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <span className="block text-2xl font-extrabold text-destructive">
                  {failedCount}
                </span>
                <span className="text-xs text-muted-foreground font-semibold">Gagal</span>
              </CardContent>
            </Card>
          </div>

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
              <div className="max-h-[480px] overflow-y-auto scrollbar-thin">
                {riwayat.length === 0 && (
                  <p className="text-xs text-muted-foreground py-6 text-center">
                    Belum ada riwayat.
                  </p>
                )}
                {riwayat.map((r) => (
                  <div key={r.id} className="py-3 border-b border-border/50 last:border-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="font-semibold text-sm truncate">{r.nama}</span>
                      <StatusBadge status={r.status as BroadcastStatus} />
                    </div>
                    <p className="text-xs text-muted-foreground">{r.no_telpon}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {r.pesan?.substring(0, 80)}
                      {(r.pesan?.length ?? 0) > 80 ? "..." : ""}
                    </p>
                    <p className="text-xs text-muted-foreground/50 mt-0.5">
                      {r.sent_at ?? r.status}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
