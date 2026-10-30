import { useState } from "react";
import { ConfirmAction } from "../../../components/common/ConfirmAction";
import { StatusBadge } from "../../../components/common/StatusBadge";
import { applicationStatuses } from "../../../components/common/statuses";
import { employerApi } from "../api";
import type { Application } from "../types";
export function ApplicationStatusForm({
  application,
  onSaved,
  canEdit,
}: {
  application: Application;
  onSaved: (value: Application) => void;
  canEdit: boolean;
}) {
  const [status, setStatus] = useState("");
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);
  const terminal = application.status === "rejected";
  return (
    <section className="card">
      <h2>Xử lý hồ sơ</h2>
      <div className="current-status">
        Hiện tại <StatusBadge status={application.status} />
      </div>
      {terminal ? (
        <div className="alert">
          Hồ sơ đã bị từ chối và không thể thay đổi trạng thái.
        </div>
      ) : !canEdit ? (
        <div className="alert">
          Chỉ người đăng tin được thay đổi trạng thái hồ sơ.
        </div>
      ) : (
        <>
          <label htmlFor="application-status">Trạng thái mới</label>
          <select
            id="application-status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setSaved(false);
            }}
          >
            <option value="">Chọn trạng thái</option>
            {Object.entries(applicationStatuses)
              .filter(([key]) => key !== "new" && key !== application.status)
              .map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
          </select>
          <label htmlFor="status-note" className="note-label">
            Ghi chú cho ứng viên
          </label>
          <textarea
            id="status-note"
            value={note}
            onChange={(event) => {
              setNote(event.target.value);
              setSaved(false);
            }}
            rows={5}
            placeholder="Nội dung phản hồi, lịch phỏng vấn…"
          />
          <p className="hint notification-note">
            Ghi chú được lưu trong lịch sử hồ sơ của ứng viên. Hiện hệ thống
            chưa gửi email tự động.
          </p>
          <ConfirmAction
            label="Cập nhật trạng thái"
            title="Xác nhận cập nhật hồ sơ?"
            description={`${status ? applicationStatuses[status as keyof typeof applicationStatuses] : ""}${status === "rejected" ? ": Sau khi từ chối, không thể đổi lại trạng thái." : ": Ghi chú sẽ được lưu trong lịch sử hồ sơ."}`}
            disabled={!status}
            danger={status === "rejected"}
            onConfirm={async () => {
              const result = await employerApi.updateStatus(
                application.id,
                status,
                note,
              );
              onSaved(result);
              setStatus("");
              setNote("");
              setSaved(true);
            }}
          />
        </>
      )}
      {saved && (
        <div className="alert success" role="status">
          Đã cập nhật trạng thái và lịch sử hồ sơ.
        </div>
      )}
    </section>
  );
}
