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

        <form ref={formRef} onSubmit={handleSubmit} method="post" encType="multipart/form-data">
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
