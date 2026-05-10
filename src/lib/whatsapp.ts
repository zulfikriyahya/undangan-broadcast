const ENDPOINT = import.meta.env.WA_ENDPOINT ?? process.env.WA_ENDPOINT ?? "";
const API_KEY = import.meta.env.WA_API_KEY ?? process.env.WA_API_KEY ?? "";

export async function sendWA(number: string, message: string): Promise<void> {
  if (!ENDPOINT) throw new Error("WA_ENDPOINT tidak dikonfigurasi");
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
    body: JSON.stringify({ number, message }),
  });
  if (!res.ok) throw new Error(`WA API ${res.status}: ${await res.text()}`);
}
