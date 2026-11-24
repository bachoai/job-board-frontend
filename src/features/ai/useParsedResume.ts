import { useCallback, useEffect, useState } from "react";
import { aiApi } from "./api/ai.api";
import type { AiParsedResume } from "./types/ai.types";

/** One bounded polling cycle per selection or explicit retry. */
export function useParsedResume(resumeId: number, enabled = true) {
  const [version, setVersion] = useState(0);
  const [state, setState] = useState<{ id: number; version: number; data: AiParsedResume | null; error: string; timedOut: boolean } | null>(null);
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    const deadline = Date.now() + 60000;
    let timer: ReturnType<typeof setTimeout>;
    const stopTimer = setTimeout(() => {
      controller.abort();
      clearTimeout(timer);
      setState(previous => ({ id: resumeId, version,
        data: previous?.id === resumeId && previous.version === version && previous.data ? previous.data : { resumeId, status: "pending", parsedAt: null, data: null },
        error: "", timedOut: true }));
    }, 60000);
    const poll = async () => {
      try {
        const data = await aiApi.getParsedResume(resumeId, controller.signal);
        if (controller.signal.aborted) return;
        const timedOut = data.status === "pending" && Date.now() >= deadline;
        setState({ id: resumeId, version, data, error: "", timedOut });
        if (data.status !== "pending" || timedOut) clearTimeout(stopTimer);
        if (data.status === "pending" && !timedOut) timer = setTimeout(() => void poll(), Math.min(3000, deadline - Date.now()));
      } catch (error) {
        clearTimeout(stopTimer);
        if (!controller.signal.aborted) setState({ id: resumeId, version, data: null, error: error instanceof Error ? error.message : "Không thể tải kết quả CV.", timedOut: false });
      }
    };
    void poll();
    return () => { controller.abort(); clearTimeout(timer); clearTimeout(stopTimer); };
  }, [resumeId, enabled, version]);
  const current = enabled && state?.id === resumeId && state.version === version ? state : null;
  return { data: current?.data ?? null, error: current?.error || "", loading: enabled && !current, timedOut: current?.timedOut ?? false,
    reload: useCallback(() => setVersion(v => v + 1), []) };
}
