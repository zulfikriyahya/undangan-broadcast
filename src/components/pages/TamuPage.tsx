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
  const [filterStatus, setFilterStatus] = useState("all");
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
    const matchStatus =
      filterStatus === "all"
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
                  <SelectItem value="all">Semua Status</SelectItem>
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
