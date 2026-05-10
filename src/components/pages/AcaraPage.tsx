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
    <div className="fade-in space-y-4">
      <div className="mb-1">
        <h1 className="text-xl font-bold text-foreground">Setup Acara</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Isi informasi acara khitanan untuk digunakan di kartu undangan dan pesan broadcast.
        </p>
      </div>

      {alert && (
        <Alert variant={alert.variant}>
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}

      <form ref={formRef} onSubmit={handleSubmit} method="post" encType="multipart/form-data">
        <div className="bento-grid">
          <Card className="sm:col-span-2">
            <CardHeader>
              <CardTitle>Identitas Anak</CardTitle>
            </CardHeader>
            <CardContent>
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
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Waktu &amp; Tempat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Tanggal &amp; Waktu Acara *" id="tanggal">
                <Input
                  id="tanggal"
                  name="tanggal"
                  type="datetime-local"
                  required
                  defaultValue={event?.tanggal ?? ""}
                />
              </Field>

              <Field label="Alamat Acara *" id="alamat">
                <Textarea
                  id="alamat"
                  name="alamat"
                  required
                  defaultValue={event?.alamat ?? ""}
                  placeholder="Jl. Mawar No. 12, RT 03/05, Kel. Cipete"
                />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Foto Anak</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Field label="Upload Foto" id="foto">
                <Input
                  id="foto"
                  name="foto"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </Field>
              {preview ? (
                <div className="flex items-center gap-3 mt-1">
                  <img
                    src={preview}
                    alt="Preview foto"
                    className="w-20 h-20 object-cover rounded-xl border-2 border-primary shadow-sm"
                  />
                  <p className="text-xs text-muted-foreground">Preview foto anak</p>
                </div>
              ) : (
                <div className="w-20 h-20 rounded-xl bg-muted border-2 border-dashed border-border flex items-center justify-center text-2xl">
                  &#128102;
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-4 flex justify-end">
          <Button type="submit" disabled={loading} size="lg">
            {loading ? "Menyimpan..." : "Simpan Data Acara"}
          </Button>
        </div>
      </form>
    </div>
  );
}
