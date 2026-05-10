import { useState } from "react";

export type AlertVariant = "success" | "destructive" | "warning" | "info";

export interface AlertState {
  message: string;
  variant: AlertVariant;
}

export function useFlashAlert(duration = 4000) {
  const [alert, setAlert] = useState<AlertState | null>(null);

  function show(message: string, variant: AlertVariant = "success") {
    setAlert({ message, variant });
    if (duration > 0) setTimeout(() => setAlert(null), duration);
  }

  function clear() {
    setAlert(null);
  }

  return { alert, show, clear };
}
