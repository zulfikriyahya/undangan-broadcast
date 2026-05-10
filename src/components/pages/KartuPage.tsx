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

interface Theme {
  id: string;
  label: string;
  bg: string;
  accent: string;
  gold: string;
  text: string;
  subtext: string;
  panelBg: string;
  divider: string;
  badge: string;
}

const THEMES: Theme[] = [
  {
    id: "emerald",
    label: "Emerald",
    bg: "linear-gradient(135deg, #0d3321 0%, #1b5e3b 45%, #2d8a5e 100%)",
    accent: "#d4af37",
    gold: "#f0d060",
    text: "#ffffff",
    subtext: "rgba(255,255,255,0.75)",
    panelBg: "rgba(0,0,0,0.28)",
    divider: "rgba(212,175,55,0.5)",
    badge: "rgba(212,175,55,0.15)",
  },
  {
    id: "navy",
    label: "Navy Gold",
    bg: "linear-gradient(135deg, #0a1628 0%, #1a3050 45%, #1e4976 100%)",
    accent: "#c9a84c",
    gold: "#e8c96a",
    text: "#ffffff",
    subtext: "rgba(255,255,255,0.72)",
    panelBg: "rgba(0,0,0,0.30)",
    divider: "rgba(201,168,76,0.5)",
    badge: "rgba(201,168,76,0.15)",
  },
  {
    id: "maroon",
    label: "Maroon",
    bg: "linear-gradient(135deg, #2d0a14 0%, #5c1a28 45%, #8b2d42 100%)",
    accent: "#e8c97a",
    gold: "#f5dfa0",
    text: "#ffffff",
    subtext: "rgba(255,255,255,0.72)",
    panelBg: "rgba(0,0,0,0.28)",
    divider: "rgba(232,201,122,0.5)",
    badge: "rgba(232,201,122,0.15)",
  },
  {
    id: "purple",
    label: "Royal Purple",
    bg: "linear-gradient(135deg, #1a0a2e 0%, #2d1b5e 45%, #4a2d8a 100%)",
    accent: "#d4a0ff",
    gold: "#e8c8ff",
    text: "#ffffff",
    subtext: "rgba(255,255,255,0.72)",
    panelBg: "rgba(0,0,0,0.28)",
    divider: "rgba(212,160,255,0.45)",
    badge: "rgba(212,160,255,0.15)",
  },
  {
    id: "slate",
    label: "Slate Silver",
    bg: "linear-gradient(135deg, #0f1923 0%, #1e2d3d 45%, #2d4158 100%)",
    accent: "#94a3b8",
    gold: "#cbd5e1",
    text: "#ffffff",
    subtext: "rgba(255,255,255,0.70)",
    panelBg: "rgba(0,0,0,0.28)",
    divider: "rgba(148,163,184,0.45)",
    badge: "rgba(148,163,184,0.15)",
  },
  {
    id: "rose",
    label: "Rose Gold",
    bg: "linear-gradient(135deg, #2d0d18 0%, #5c1e30 45%, #8c3a50 100%)",
    accent: "#f4b8c8",
    gold: "#fad4de",
    text: "#ffffff",
    subtext: "rgba(255,255,255,0.72)",
    panelBg: "rgba(0,0,0,0.25)",
    divider: "rgba(244,184,200,0.45)",
    badge: "rgba(244,184,200,0.15)",
  },
];

function buildKartuHTML(event: Event, namaTamu: string, theme: Theme): string {
  const tgl = new Date(event.tanggal);
  const tglFmt = tgl.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const waktu = tgl.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB";
  const foto = event.foto_path
    ? `<img src="${event.foto_path}" style="width:100%;height:100%;object-fit:cover;display:block"/>`
    : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:3.5rem">&#x1F466;</div>`;

  return `
<div style="
  width:800px;height:500px;position:relative;overflow:hidden;
  font-family:'Georgia',serif;
  background:${theme.bg};
">

  <!-- Ornamen lingkaran kiri atas -->
  <svg style="position:absolute;top:-40px;left:-40px;width:220px;height:220px;opacity:0.18" viewBox="0 0 220 220">
    <circle cx="110" cy="110" r="100" fill="none" stroke="${theme.accent}" stroke-width="1.5"/>
    <circle cx="110" cy="110" r="78"  fill="none" stroke="${theme.gold}"   stroke-width="0.8"/>
    <circle cx="110" cy="110" r="56"  fill="none" stroke="${theme.accent}" stroke-width="1.2"/>
  </svg>

  <!-- Ornamen lingkaran kanan bawah -->
  <svg style="position:absolute;bottom:-50px;right:-50px;width:240px;height:240px;opacity:0.15" viewBox="0 0 240 240">
    <circle cx="120" cy="120" r="110" fill="none" stroke="${theme.accent}" stroke-width="1.5"/>
    <circle cx="120" cy="120" r="88"  fill="none" stroke="${theme.gold}"   stroke-width="0.8"/>
    <circle cx="120" cy="120" r="66"  fill="none" stroke="${theme.accent}" stroke-width="1.2"/>
  </svg>

  <!-- Ornamen bunga sudut kiri atas -->
  <svg style="position:absolute;top:0;left:0;width:90px;height:90px;opacity:0.22" viewBox="0 0 90 90">
    <path d="M0 0 Q45 20 90 0 Q70 45 90 90 Q45 70 0 90 Q20 45 0 0Z" fill="${theme.accent}"/>
  </svg>

  <!-- Ornamen bunga sudut kanan bawah -->
  <svg style="position:absolute;bottom:0;right:0;width:90px;height:90px;opacity:0.22;transform:rotate(180deg)" viewBox="0 0 90 90">
    <path d="M0 0 Q45 20 90 0 Q70 45 90 90 Q45 70 0 90 Q20 45 0 0Z" fill="${theme.accent}"/>
  </svg>

  <!-- Garis dekoratif atas -->
  <div style="position:absolute;top:14px;left:110px;right:20px;height:1px;background:linear-gradient(to right,transparent,${theme.accent},transparent);opacity:0.5"></div>
  <!-- Garis dekoratif bawah -->
  <div style="position:absolute;bottom:14px;left:110px;right:20px;height:1px;background:linear-gradient(to right,transparent,${theme.accent},transparent);opacity:0.5"></div>

  <!-- Panel kiri — foto + nama orang tua -->
  <div style="
    position:absolute;left:0;top:0;width:255px;height:500px;
    background:${theme.panelBg};
    backdrop-filter:blur(6px);
    display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;
    padding:0 20px;
  ">
    <!-- Frame foto -->
    <div style="position:relative;width:148px;height:148px">
      <!-- Ring luar -->
      <div style="
        position:absolute;inset:-6px;border-radius:50%;
        border:2px solid ${theme.accent};opacity:0.6;
      "></div>
      <!-- Ring dalam -->
      <div style="
        position:absolute;inset:-2px;border-radius:50%;
        border:2px solid ${theme.gold};
      "></div>
      <!-- Foto -->
      <div style="
        width:148px;height:148px;border-radius:50%;overflow:hidden;
        background:rgba(0,0,0,0.3);
      ">${foto}</div>
      <!-- Ornamen titik -->
      ${[0, 60, 120, 180, 240, 300]
        .map(
          (deg) => `
        <div style="
          position:absolute;width:6px;height:6px;border-radius:50%;
          background:${theme.accent};
          top:50%;left:50%;
          transform:translate(-50%,-50%) rotate(${deg}deg) translateY(-84px);
        "></div>
      `
        )
        .join("")}
    </div>

    <!-- Nama orang tua -->
    <div style="text-align:center;line-height:1.6">
      <p style="color:${theme.accent};font-size:11px;letter-spacing:2px;text-transform:uppercase;margin-bottom:4px;font-family:Georgia,serif">
        Putra ke-${event.anak_ke}
      </p>
      <div style="width:40px;height:1px;background:${theme.accent};margin:0 auto 8px;opacity:0.6"></div>
      <p style="color:${theme.subtext};font-size:12px;margin-bottom:2px">Pasangan</p>
      <p style="color:${theme.text};font-size:13px;font-weight:bold;margin-bottom:1px">${event.nama_bapak}</p>
      <p style="color:${theme.accent};font-size:11px;margin-bottom:1px">&amp;</p>
      <p style="color:${theme.text};font-size:13px;font-weight:bold">${event.nama_ibu}</p>
    </div>
  </div>

  <!-- Divider vertikal -->
  <div style="
    position:absolute;left:255px;top:24px;width:1px;height:452px;
    background:linear-gradient(to bottom,transparent,${theme.divider} 20%,${theme.divider} 80%,transparent);
  "></div>

  <!-- Konten kanan -->
  <div style="
    position:absolute;left:268px;top:0;right:0;height:500px;
    display:flex;flex-direction:column;justify-content:center;
    padding:28px 32px 28px 20px;
  ">
    <!-- Label undangan -->
    <div style="
      display:inline-flex;align-items:center;gap:8px;
      margin-bottom:10px;
    ">
      <div style="width:24px;height:1px;background:${theme.accent}"></div>
      <p style="color:${theme.accent};font-size:10px;letter-spacing:3px;text-transform:uppercase">
        Undangan Khitanan
      </p>
      <div style="width:24px;height:1px;background:${theme.accent}"></div>
    </div>

    <!-- Kepada -->
    <p style="color:${theme.subtext};font-size:11px;margin-bottom:3px;font-style:italic">
      Kepada Yang Terhormat,
    </p>
    <p style="
      color:${theme.text};font-size:19px;font-weight:bold;
      border-bottom:1px solid ${theme.divider};
      padding-bottom:10px;margin-bottom:12px;
      line-height:1.3;
    ">${namaTamu}</p>

    <!-- Kalimat undangan -->
    <p style="color:${theme.subtext};font-size:11.5px;line-height:1.8;margin-bottom:14px">
      Dengan penuh kebahagiaan, kami mengundang kehadiran Bapak/Ibu/Saudara/i
      dalam <span style="color:${theme.accent};font-weight:bold">Walimatul Khitan</span> putra kami:
    </p>

    <!-- Nama anak -->
    <div style="text-align:center;margin-bottom:16px;position:relative">
      <div style="
        background:${theme.badge};
        border:1px solid ${theme.divider};
        border-radius:8px;
        padding:10px 16px;
        display:inline-block;
        min-width:200px;
      ">
        <p style="
          color:${theme.accent};font-size:26px;font-weight:bold;
          letter-spacing:1.5px;line-height:1.2;
          text-shadow:0 2px 12px rgba(0,0,0,0.4);
          margin:0;
        ">${event.nama_anak}</p>
      </div>
    </div>

    <!-- Detail acara -->
    <div style="
      background:${theme.panelBg};
      border:1px solid ${theme.divider};
      border-radius:8px;padding:10px 14px;
      font-size:11.5px;color:${theme.text};line-height:2;
    ">
      <div style="display:flex;align-items:flex-start;gap:8px">
        <span style="color:${theme.accent};font-size:13px;margin-top:2px">&#x1F4C5;</span>
        <span><strong>${tglFmt}</strong></span>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <span style="color:${theme.accent};font-size:13px">&#x23F0;</span>
        <span><strong>${waktu}</strong></span>
      </div>
      <div style="display:flex;align-items:flex-start;gap:8px">
        <span style="color:${theme.accent};font-size:13px;margin-top:2px">&#x1F4CD;</span>
        <span style="line-height:1.5"><strong>${event.alamat}</strong></span>
      </div>
    </div>

    <!-- Footer -->
    <p style="
      color:${theme.subtext};font-size:10px;text-align:right;
      margin-top:10px;font-style:italic;opacity:0.7;
    ">Kehadiran Anda adalah kehormatan bagi kami</p>
  </div>

</div>`;
}

async function generatePNG(event: Event, namaTamu: string, theme: Theme): Promise<Blob> {
  let target = document.getElementById(RENDER_ID);
  if (!target) {
    target = document.createElement("div");
    target.id = RENDER_ID;
    target.style.cssText = "position:fixed;left:-9999px;top:0;z-index:-1";
    document.body.appendChild(target);
  }
  target.innerHTML = buildKartuHTML(event, namaTamu, theme);
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

async function uploadKartu(
  event: Event,
  tamuId: number,
  namaTamu: string,
  theme: Theme
): Promise<string | null> {
  const blob = await generatePNG(event, namaTamu, theme);
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
  const [selectedTheme, setSelectedTheme] = useState<Theme>(THEMES[0]);
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
    setPreviewHtml(buildKartuHTML(event, selectedTamu.nama, selectedTheme));
  }

  async function downloadSatu() {
    if (!event || !selectedTamu) return;
    const blob = await generatePNG(event, selectedTamu.nama, selectedTheme);
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
      const blob = await generatePNG(event, tamu[i].nama, selectedTheme);
      downloadBlob(blob, `${sanitizeFilename(tamu[i].nama)}.png`);
      await sleep(600);
    }
    setProgress({ value: 100, label: `Selesai! ${tamu.length} kartu didownload.` });
  }

  async function uploadSatu() {
    if (!event || !selectedTamu) return;
    setProgress({ value: 0, label: `Uploading ${selectedTamu.nama}...` });
    const url = await uploadKartu(event, selectedTamu.id, selectedTamu.nama, selectedTheme);
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
      await uploadKartu(event, tamu[i].id, tamu[i].nama, selectedTheme);
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
      <script
        src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"
        async
      />

      <div className="mb-1">
        <h1 className="text-xl font-bold text-foreground">Kartu Undangan</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Generate, preview, dan upload kartu undangan per tamu.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pilih Tema Warna</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setSelectedTheme(t);
                  if (selectedTamu && event)
                    setPreviewHtml(buildKartuHTML(event, selectedTamu.nama, t));
                }}
                title={t.label}
                className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-200 ${
                  selectedTheme.id === t.id
                    ? "border-primary ring-2 ring-primary/30 scale-105"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <span
                  className="w-4 h-4 rounded-full shrink-0 shadow-sm"
                  style={{ background: t.bg }}
                />
                {t.label}
                {selectedTheme.id === t.id && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-background" />
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

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
            <div className="flex items-center justify-between">
              <CardTitle>
                Preview — {selectedTamu?.nama}
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  Tema: {selectedTheme.label}
                </span>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/40 rounded-xl p-4 overflow-auto">
              <div className="relative" style={{ height: 285, width: "100%", maxWidth: 480 }}>
                <div
                  style={{
                    transformOrigin: "top left",
                    transform: "scale(0.6)",
                    width: 800,
                    height: 500,
                    position: "absolute",
                    top: 0,
                    left: 0,
                    borderRadius: 12,
                    overflow: "hidden",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
                  }}
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
