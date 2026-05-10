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
