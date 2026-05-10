export type BroadcastStatus = "sent" | "failed" | "pending" | null;

export interface TamuItem {
  id: number;
  nama: string;
  kartu_url: string | null;
}
