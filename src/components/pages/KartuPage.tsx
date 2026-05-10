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
    id: "ivory",
    label: "Ivory Elegance",
    bg: "linear-gradient(160deg, #fdf8f0 0%, #f5ede0 50%, #ede0cc 100%)",
    accent: "#8b5e3c",
    gold: "#c49a5a",
    text: "#2c1a0e",
    subtext: "rgba(44,26,14,0.62)",
    panelBg: "rgba(139,94,60,0.07)",
    divider: "rgba(139,94,60,0.22)",
    badge: "rgba(139,94,60,0.09)",
  },
  {
    id: "midnight",
    label: "Midnight Gold",
    bg: "linear-gradient(160deg, #0d0d1a 0%, #141428 50%, #1a1a35 100%)",
    accent: "#c9a84c",
    gold: "#e8d080",
    text: "#f5f0e8",
    subtext: "rgba(245,240,232,0.60)",
    panelBg: "rgba(201,168,76,0.07)",
    divider: "rgba(201,168,76,0.22)",
    badge: "rgba(201,168,76,0.10)",
  },
  {
    id: "sage",
    label: "Sage & Champagne",
    bg: "linear-gradient(160deg, #f0f4ee 0%, #e4ede0 50%, #d4e2cc 100%)",
    accent: "#4a7c59",
    gold: "#8a9e6a",
    text: "#1c2e20",
    subtext: "rgba(28,46,32,0.58)",
    panelBg: "rgba(74,124,89,0.07)",
    divider: "rgba(74,124,89,0.22)",
    badge: "rgba(74,124,89,0.09)",
  },
  {
    id: "blush",
    label: "Blush Rosé",
    bg: "linear-gradient(160deg, #fdf0f3 0%, #f5e2e8 50%, #ead0d8 100%)",
    accent: "#9c4a62",
    gold: "#c4808e",
    text: "#2e0e18",
    subtext: "rgba(46,14,24,0.60)",
    panelBg: "rgba(156,74,98,0.07)",
    divider: "rgba(156,74,98,0.20)",
    badge: "rgba(156,74,98,0.09)",
  },
  {
    id: "slate",
    label: "Slate & Silver",
    bg: "linear-gradient(160deg, #1c2330 0%, #242e3e 50%, #2c3850 100%)",
    accent: "#94a8c4",
    gold: "#c0d0e0",
    text: "#eef2f8",
    subtext: "rgba(238,242,248,0.58)",
    panelBg: "rgba(148,168,196,0.07)",
    divider: "rgba(148,168,196,0.22)",
    badge: "rgba(148,168,196,0.10)",
  },
  {
    id: "sand",
    label: "Desert Sand",
    bg: "linear-gradient(160deg, #f7f2e8 0%, #ede4d0 50%, #e0d0b4 100%)",
    accent: "#7a5c2e",
    gold: "#b08840",
    text: "#2a1e08",
    subtext: "rgba(42,30,8,0.60)",
    panelBg: "rgba(122,92,46,0.07)",
    divider: "rgba(122,92,46,0.20)",
    badge: "rgba(122,92,46,0.09)",
  },
];

const GOOGLE_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Cormorant+Garamond:ital,wght@0,300;0,500;0,600;1,300&family=Montserrat:wght@300;400;500;600&display=swap";

async function ensureFontsLoaded(): Promise<void> {
  if (document.querySelector(`link[href="${GOOGLE_FONTS_URL}"]`)) {
    await document.fonts.ready;
    return;
  }
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = GOOGLE_FONTS_URL;
  document.head.appendChild(link);
  await new Promise<void>((resolve) => {
    link.onload = () => resolve();
    link.onerror = () => resolve();
    setTimeout(resolve, 3000);
  });
  await document.fonts.ready;
}

function buildKartuHTML(event: Event, namaTamu: string, theme: Theme): string {
  const tgl = new Date(event.tanggal);
  const tglFmt = tgl.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const waktu =
    tgl.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) +
    " WIB" +
    " s.d. Selesai";

  const foto = event.foto_path
    ? `<img src="${event.foto_path}" style="width:100%;height:100%;object-fit:cover;display:block"/>`
    : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:${theme.panelBg}"><svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="${theme.accent}" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round" opacity=".35"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>`;

  const corner = (
    w: number,
    h: number
  ) => `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none">
    <path d="M2 ${h} L2 2 L${w} 2" stroke="${theme.accent}" stroke-width="1.2" stroke-linecap="square" opacity="0.45"/>
    <path d="M6 ${h} L6 6 L${w} 6" stroke="${theme.gold}" stroke-width="0.5" stroke-linecap="square" opacity="0.35"/>
  </svg>`;

  const LEFT_W = 260;
  const CARD_H = 460;
  const INSET = 14;

  return `<div style="
  width:800px;height:${CARD_H}px;position:relative;overflow:hidden;
  background:${theme.bg};font-family:'Montserrat',sans-serif;
">
  <div style="position:absolute;top:0;left:0">${corner(52, 52)}</div>
  <div style="position:absolute;top:0;right:0;transform:scaleX(-1)">${corner(52, 52)}</div>
  <div style="position:absolute;bottom:0;left:0;transform:scaleY(-1)">${corner(52, 52)}</div>
  <div style="position:absolute;bottom:0;right:0;transform:scale(-1,-1)">${corner(52, 52)}</div>
  <div style="position:absolute;inset:${INSET}px;border:0.5px solid ${theme.divider};pointer-events:none"></div>

  <svg style="position:absolute;top:22px;right:24px;opacity:0.10" width="66" height="66" viewBox="0 0 100 100">
    <path d="M50 5 L61 35 L93 35 L68 54 L79 84 L50 65 L21 84 L32 54 L7 35 L39 35Z" fill="none" stroke="${theme.accent}" stroke-width="1.5"/>
    <path d="M50 18 L58 40 L82 40 L63 53 L71 75 L50 62 L29 75 L37 53 L18 40 L42 40Z" fill="none" stroke="${theme.gold}" stroke-width="0.7"/>
  </svg>

  <!-- LEFT PANEL -->
  <div style="
    position:absolute;left:${INSET}px;top:${INSET}px;bottom:${INSET}px;width:${LEFT_W}px;
    border-right:0.5px solid ${theme.divider};
    display:flex;flex-direction:column;align-items:center;justify-content:center;
    gap:0;padding:20px 22px;box-sizing:border-box;
  ">
    <!-- Photo -->
    <div style="position:relative;width:136px;height:136px;margin-bottom:16px;flex-shrink:0">
      <svg style="position:absolute;top:-9px;left:-9px;width:154px;height:154px" viewBox="0 0 154 154">
        <circle cx="77" cy="77" r="73" fill="none" stroke="${theme.accent}" stroke-width="0.7" stroke-dasharray="3 5" opacity="0.45"/>
      </svg>
      <div style="position:absolute;inset:-3px;border-radius:50%;border:0.8px solid ${theme.accent};opacity:0.3"></div>
      <div style="width:136px;height:136px;border-radius:50%;overflow:hidden;border:1.5px solid ${theme.accent}">${foto}</div>
    </div>

    <!-- Putra ke -->
    <p style="font-family:'Montserrat',sans-serif;font-size:8px;font-weight:600;letter-spacing:3.5px;text-transform:uppercase;color:${theme.gold};margin:0 0 10px;text-align:center">PUTRA KE-${event.anak_ke}</p>

    <!-- Divider -->
    <div style="display:flex;align-items:center;width:100%;gap:8px;margin-bottom:12px">
      <div style="flex:1;height:0.5px;background:${theme.divider}"></div>
      <svg width="6" height="6" viewBox="0 0 6 6"><rect x="0" y="0" width="6" height="6" transform="rotate(45 3 3)" fill="${theme.accent}" opacity=".5"/></svg>
      <div style="flex:1;height:0.5px;background:${theme.divider}"></div>
    </div>

    <!-- Parents -->
    <div style="text-align:center;width:100%">
      <p style="font-family:'Cormorant Garamond',serif;font-style:italic;font-size:10px;color:${theme.subtext};margin:0 0 8px">Putra dari Pasangan</p>
      <p style="font-family:'Playfair Display',serif;font-size:13px;font-weight:600;color:${theme.text};line-height:1.4;margin:0">${event.nama_bapak}</p>
      <p style="font-family:'Cormorant Garamond',serif;font-size:13px;color:${theme.gold};margin:3px 0">&amp;</p>
      <p style="font-family:'Playfair Display',serif;font-size:13px;font-weight:600;color:${theme.text};line-height:1.4;margin:0">${event.nama_ibu}</p>
    </div>
  </div>

  <!-- RIGHT PANEL -->
  <div style="
    position:absolute;
    left:${INSET + LEFT_W + 1}px;right:${INSET}px;
    top:${INSET}px;bottom:${INSET}px;
    display:flex;flex-direction:column;justify-content:center;
    padding:18px 26px;box-sizing:border-box;
  ">
    <!-- Walimatul Khitan label -->
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
      <div style="height:0.5px;flex:1;background:${theme.divider}"></div>
      <p style="font-family:'Montserrat',sans-serif;font-size:7.5px;font-weight:600;letter-spacing:4px;text-transform:uppercase;color:${theme.accent};margin:0;white-space:nowrap">Walimatul Khitan</p>
      <div style="height:0.5px;flex:1;background:${theme.divider}"></div>
    </div>

    <!-- Guest name -->
    <p style="font-family:'Cormorant Garamond',serif;font-style:italic;font-size:10.5px;color:${theme.subtext};margin:0 0 2px">Kepada Yang Terhormat, Bapak / Ibu / Saudara/i:</p>
    <p style="
      font-family:'Playfair Display',serif;font-size:18px;font-weight:700;
      color:${theme.text};line-height:1.2;margin:0 0 8px;
      padding-bottom:8px;border-bottom:0.5px solid ${theme.divider};
    ">${namaTamu}</p>

    <!-- Body -->
    <p style="font-family:'Cormorant Garamond',serif;font-size:11.5px;line-height:1.7;color:${theme.subtext};margin:0 0 10px">
      Dengan penuh kebahagiaan, kami mengundang kehadiran Bapak / Ibu / Saudara/i dalam acara khitanan putra kami:
    </p>

    <!-- Child name box -->
    <div style="margin-bottom:10px;position:relative">
      <div style="position:absolute;top:0;left:0;width:10px;height:10px;border-top:1px solid ${theme.gold};border-left:1px solid ${theme.gold}"></div>
      <div style="position:absolute;top:0;right:0;width:10px;height:10px;border-top:1px solid ${theme.gold};border-right:1px solid ${theme.gold}"></div>
      <div style="position:absolute;bottom:0;left:0;width:10px;height:10px;border-bottom:1px solid ${theme.gold};border-left:1px solid ${theme.gold}"></div>
      <div style="position:absolute;bottom:0;right:0;width:10px;height:10px;border-bottom:1px solid ${theme.gold};border-right:1px solid ${theme.gold}"></div>
      <p style="font-family:'Playfair Display',serif;font-size:22px;font-weight:700;color:${theme.accent};letter-spacing:1px;line-height:44px;height:44px;margin:0;text-align:center;background:${theme.badge};border-top:1px solid ${theme.accent};border-bottom:1px solid ${theme.accent};overflow:hidden">${event.nama_anak}</p>
    </div>

    <!-- Event details -->
    <div style="border:0.5px solid ${theme.divider};background:${theme.panelBg};padding:8px 12px">
      ${[
        ["HARI / TANGGAL", tglFmt],
        ["WAKTU", waktu],
        ["TEMPAT", event.alamat],
      ]
        .map(
          ([label, val], i, arr) => `
        <div style="display:flex;gap:10px;padding:${i === 0 ? "0" : "5px"} 0 ${i === arr.length - 1 ? "0" : "5px"};${i < arr.length - 1 ? `border-bottom:0.5px solid ${theme.divider}` : ""}">
          <p style="font-family:'Montserrat',sans-serif;font-size:8px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:${theme.gold};margin:0;min-width:72px;padding-top:1px;flex-shrink:0">${label}</p>
          <p style="font-family:'Montserrat',sans-serif;font-size:10px;font-weight:400;color:${theme.text};margin:0;line-height:1.5">${val}</p>
        </div>
      `
        )
        .join("")}
    </div>

    <p style="font-family:'Cormorant Garamond',serif;font-style:italic;font-size:9px;color:${theme.subtext};text-align:right;margin:8px 0 0;opacity:.6">Kehadiran Anda adalah kehormatan bagi kami</p>
  </div>
</div>`;
}

// ─── Everything below is identical to original ────────────────────────────────

async function generatePNG(event: Event, namaTamu: string, theme: Theme): Promise<Blob> {
  await ensureFontsLoaded();

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
    height: 460,
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
            <CardTitle>
              Preview — {selectedTamu?.nama}
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                Tema: {selectedTheme.label}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/40 rounded-xl p-4 overflow-auto">
              <div className="relative" style={{ height: 276, width: "100%", maxWidth: 480 }}>
                <div
                  style={{
                    transformOrigin: "top left",
                    transform: "scale(0.6)",
                    width: 800,
                    height: 460,
                    position: "absolute",
                    top: 0,
                    left: 0,
                    borderRadius: 0,
                    overflow: "hidden",
                    boxShadow: "0 12px 40px rgba(0,0,0,0.18)",
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
