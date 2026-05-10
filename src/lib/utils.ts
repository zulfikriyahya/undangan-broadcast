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
