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
    <circle cx="0" cy="0" r="80"  fill="none" stroke="#d4af37" stroke-width="1.5"/>
  </svg>
  <svg style="position:absolute;bottom:0;right:0;width:160px;opacity:.25;transform:rotate(180deg)" viewBox="0 0 160 160">
    <circle cx="0" cy="0" r="140" fill="none" stroke="#fff" stroke-width="1.5"/>
    <circle cx="0" cy="0" r="110" fill="none" stroke="#fff" stroke-width="1"/>
    <circle cx="0" cy="0" r="80"  fill="none" stroke="#d4af37" stroke-width="1.5"/>
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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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

  const uploaded = tamuData.filter((t) => t.kartu_url).length;
  const pctUpload = tamuData.length ? Math.round((uploaded / tamuData.length) * 100) : 0;

  return (
    <div className="fade-in space-y-4">
      <div className="mb-1">
        <h1 className="text-xl font-bold text-foreground">Kartu Undangan</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Generate, preview, dan upload kartu undangan per tamu.
        </p>
      </div>

      <script
        src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"
        async
      />

      <div className="bento-grid">
        <Card>
          <CardHeader>
            <CardTitle>Pilih Tamu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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

            <div className="grid grid-cols-2 gap-2">
              <Button onClick={preview} disabled={!selectedId} variant="outline" size="sm">
                Preview
              </Button>
              <Button onClick={downloadSatu} disabled={!selectedId} variant="success" size="sm">
                Download
              </Button>
              <Button onClick={uploadSatu} disabled={!selectedId} variant="secondary" size="sm">
                Upload URL
              </Button>
              <Button onClick={downloadSemua} variant="warning" size="sm">
                Download Semua
              </Button>
            </div>
            <Button onClick={uploadSemua} variant="default" size="sm" className="w-full">
              Upload Semua
            </Button>

            {progress && (
              <div className="space-y-1.5 pt-1">
                <Progress value={progress.value} />
                <p className="text-xs text-muted-foreground">{progress.label}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Status Upload
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {uploaded}/{tamuData.length} kartu
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={pctUpload} />
            <p className="text-xs text-muted-foreground">{pctUpload}% kartu sudah di-upload</p>
            <div className="max-h-48 overflow-y-auto scrollbar-thin space-y-0.5">
              {tamuData.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0"
                >
                  <span className="text-sm font-medium truncate mr-2">{t.nama}</span>
                  {t.kartu_url ? (
                    <a href={t.kartu_url} target="_blank" rel="noreferrer" className="shrink-0">
                      <Badge variant="sent">Siap</Badge>
                    </a>
                  ) : (
                    <Badge variant="none" className="shrink-0">
                      Belum
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {previewHtml && (
        <Card>
          <CardHeader>
            <CardTitle>Preview Kartu — {selectedTamu?.nama}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/40 rounded-lg p-3 overflow-auto">
              <div
                style={{
                  transformOrigin: "top left",
                  transform: "scale(0.55)",
                  width: 800,
                  height: 500,
                }}
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
