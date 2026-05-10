export function normalizePhone(raw: string): string {
  let n = raw.trim().replace(/\D/g, "");
  if (n.startsWith("62")) n = "0" + n.slice(2);
  if (n.startsWith("+62")) n = "0" + n.slice(3);
  return n;
}
