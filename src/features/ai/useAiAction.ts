import { useEffect, useRef, useState } from "react";
import { aiErrorText } from "./utils/ai";

/** Explicit user actions only. Cancelling the browser request does not undo server processing. */
export function useAiAction<T>() {
  const controller = useRef<AbortController | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<T | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  async function run(operation: (signal: AbortSignal) => Promise<T>, onSuccess?: (value: T) => void) {
    if (controller.current) return;
    const request = new AbortController();
    controller.current = request;
    setBusy(true); setError(""); setResult(null);
    try {
      const value = await operation(request.signal);
      if (!request.signal.aborted) { setResult(value); onSuccess?.(value); }
    } catch (err) {
      if (!request.signal.aborted) setError(aiErrorText(err));
    } finally {
      if (!request.signal.aborted) setBusy(false);
      if (controller.current === request) controller.current = null;
    }
  }
  return { busy, error, result, run };
}
