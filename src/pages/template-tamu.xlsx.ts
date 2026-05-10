// src/pages/template-tamu.xlsx.ts
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
