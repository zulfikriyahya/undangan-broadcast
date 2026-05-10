// src/lib/whatsapp.ts
const ENDPOINT = "https://wapi.zedlabs.id/api/messages/send";
const API_KEY = "cedb42552eea73ca6e897807b80f07fd1e081aa1f93173fe";

export async function sendWA(number: string, message: string) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
    body: JSON.stringify({ number, message }),
  });

  if (!res.ok) throw new Error(`WA API error: ${res.status}`);
  return res.json();
}
