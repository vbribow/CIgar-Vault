"use client";

import { useRef, useState } from "react";
import type { MutationStatus } from "@/lib/mutation-state";

export function useMutationGuard() {
  const [status, setStatus] = useState<MutationStatus>("idle");
  const locked = useRef(false);
  function begin() {
    if (locked.current || status === "success") return false;
    locked.current = true;
    setStatus("pending");
    return true;
  }
  function succeed() { locked.current = false; setStatus("success"); }
  function fail() { locked.current = false; setStatus("error"); }
  function reset() { locked.current = false; setStatus("idle"); }
  return { status, begin, succeed, fail, reset, pending: status === "pending", complete: status === "success" };
}
