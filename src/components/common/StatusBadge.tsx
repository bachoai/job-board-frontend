const labels: Record<string, string> = {
  open: "Đang tuyển",
  closed: "Đã đóng",
  blocked: "Bị chặn",
  new: "Mới",
  viewed: "Đã xem",
  interview: "Phỏng vấn",
  rejected: "Từ chối",
  active: "Hoạt động",
  inactive: "Đã khóa",
  candidate: "Ứng viên",
  employer: "Nhà tuyển dụng",
  admin: "Quản trị viên",
};
export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`status-badge status-${Object.hasOwn(labels, status) ? status : "unknown"}`}
      title={labels[status] ? undefined : status}
    >
      {labels[status] || "Chưa xác định"}
    </span>
  );
}
