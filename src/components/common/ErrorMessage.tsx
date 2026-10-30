import { useEffect, useRef } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
export function ErrorMessage({
  message,
  retry,
  focus = false,
}: {
  message: string;
  retry?: () => void;
  focus?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (focus) ref.current?.focus();
  }, [message, focus]);
  return (
    <div ref={ref} tabIndex={-1} className="alert error" role="alert">
      <AlertCircle size={18} aria-hidden="true" />
      <span>{message}</span>
      {retry && (
        <button className="text-button" onClick={retry}>
          <RotateCcw size={14} /> Thử lại
        </button>
      )}
    </div>
  );
}
