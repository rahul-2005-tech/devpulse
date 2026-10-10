import { useEffect, useState } from "react";

let toastTimer: ReturnType<typeof setTimeout> | null = null;

export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: "info" | "error" } | null>(null);

  useEffect(() => {
    if (!toast) return;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => setToast(null), 4000);
    return () => {
      if (toastTimer) clearTimeout(toastTimer);
    };
  }, [toast]);

  const show = (message: string, type: "info" | "error" = "info") => {
    setToast({ message, type });
  };

  return { toast, show };
}
