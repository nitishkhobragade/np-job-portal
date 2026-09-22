"use client";

import { useEffect } from "react";

export function HashPurgeHandler() {
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, []);

  return null;
}
