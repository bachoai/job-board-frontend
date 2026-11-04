import { useEffect, useState } from "react";
type Loader<T> = (signal: AbortSignal) => Promise<T>;
export function useResource<T>(loader: Loader<T>) {
  const [result, setResult] = useState<{ loader: Loader<T>; version: number; data: T | null; error: string } | null>(null);
  const [version, setVersion] = useState(0);
  const current = result?.loader === loader && result.version === version ? result : null;
  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const data = await loader(controller.signal);
        if (!controller.signal.aborted) setResult({ loader, version, data, error: "" });
      } catch (err) {
        if (!controller.signal.aborted) setResult({ loader, version, data: null, error: err instanceof Error ? err.message : "Không thể tải dữ liệu." });
      }
    })();
    return () => controller.abort();
  }, [loader, version]);
  return {
    data: current?.data ?? null,
    loading: current === null,
    error: current?.error || "",
    setData(action: import("react").SetStateAction<T | null>) {
      setResult((previous) => {
        if (!previous || previous.loader !== loader || previous.version !== version) return previous;
        return { ...previous, data: typeof action === "function" ? (action as (value: T | null) => T | null)(previous.data) : action };
      });
    },
    reload() {
      setVersion((value) => value + 1);
    },
  };
}
