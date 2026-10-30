import { AlertTriangle, CircleHelp, LoaderCircle } from "lucide-react";
import { useId, useRef, useState } from "react";
import { ErrorMessage } from "./Feedback";
export function ConfirmDialog({
  label,
  title,
  description,
  onConfirm,
  disabled = false,
  danger = false,
}: {
  label: string;
  title: string;
  description: string;
  onConfirm: () => Promise<unknown>;
  disabled?: boolean;
  danger?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false);
  return (
    <>
      <button
        type="button"
        className={danger ? "action-button danger-text" : "action-button"}
        disabled={disabled}
        onClick={() => {
          setError("");
          dialog.current?.showModal();
        }}
      >
        {label}
      </button>
      <dialog
        ref={dialog}
        className="confirm-dialog"
        aria-labelledby={titleId}
        onCancel={(event) => {
          if (pending.current) event.preventDefault();
        }}
      >
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            if (pending.current) return;
            pending.current = true;
            setBusy(true);
            setError("");
            try {
              await onConfirm();
              dialog.current?.close();
            } catch (err) {
              setError(
                err instanceof Error ? err.message : "Thao tác thất bại.",
              );
            } finally {
              pending.current = false;
              setBusy(false);
            }
          }}
        >
          <div
            className={danger ? "dialog-symbol destructive" : "dialog-symbol"}
          >
            {danger ? <AlertTriangle size={25} /> : <CircleHelp size={25} />}
          </div>
          <h2 id={titleId}>{title}</h2>
          <p>{description}</p>
          {error && <ErrorMessage message={error} />}
          <div className="dialog-actions">
            <button
              type="button"
              className="secondary"
              disabled={busy}
              onClick={() => dialog.current?.close()}
            >
              Hủy
            </button>
            <button
              className={danger ? "danger-button" : "primary"}
              disabled={busy}
            >
              {busy ? (
                <>
                  <LoaderCircle size={15} className="spinner-icon" /> Đang xử
                  lý…
                </>
              ) : (
                "Xác nhận"
              )}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
