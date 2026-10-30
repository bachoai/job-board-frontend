import {
  BriefcaseBusiness,
  CircleCheck,
  ShieldBan,
  Archive,
} from "lucide-react";
import { StatCard } from "../../../components/common/StatCard";
import { formatDate } from "../../../components/common/format";
import { useCallback, useState } from "react";
import { DataTable } from "../../../components/common/DataTable";
import { ConfirmAction } from "../../../components/common/ConfirmAction";
import {
  ErrorMessage,
  Loading,
  PageHeading,
} from "../../../components/common/Feedback";
import { StatusBadge } from "../../../components/common/StatusBadge";
import { useResource } from "../../../components/common/useResource";
import { adminApi } from "../api";
export function JobsPage() {
  const [status, setStatus] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const resource = useResource(
    useCallback((signal: AbortSignal) => adminApi.jobs(signal), []),
  );
  const detail = resource.data?.find((job) => job.id === expanded);
  return (
    <main className="page">
      <PageHeading
        title="Duyệt tin tuyển dụng"
        description="Kiểm tra nội dung và chặn các tin vi phạm."
      />
      {resource.loading ? (
        <Loading />
      ) : resource.error ? (
        <ErrorMessage message={resource.error} retry={resource.reload} />
      ) : (
        resource.data && (
          <>
            <div className="stats-grid">
              <StatCard
                label="Tổng tin tuyển dụng"
                value={resource.data.length}
                detail="Trên toàn hệ thống"
                icon={BriefcaseBusiness}
              />
              <StatCard
                label="Đang tuyển"
                value={
                  resource.data.filter((job) => job.status === "open").length
                }
                detail="Đang tiếp nhận hồ sơ"
                icon={CircleCheck}
                tone="green"
              />
              <StatCard
                label="Đã đóng"
                value={
                  resource.data.filter((job) => job.status === "closed").length
                }
                detail="Đã ngừng tuyển dụng"
                icon={Archive}
                tone="slate"
              />
              <StatCard
                label="Đã chặn"
                value={
                  resource.data.filter((job) => job.status === "blocked").length
                }
                detail="Được kiểm soát nội dung"
                icon={ShieldBan}
                tone="amber"
              />
            </div>
            <DataTable
              title="Danh sách tin tuyển dụng"
              filtered={!!status}
              rows={resource.data.filter(
                (job) => !status || job.status === status,
              )}
              searchText={(job) =>
                `${job.title} ${job.id} ${job.companyId} ${job.province || ""}`
              }
              searchLabel="Tìm tiêu đề, mã tin, mã công ty…"
              filters={
                <select
                  aria-label="Lọc trạng thái tin"
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                >
                  <option value="">Mọi trạng thái</option>
                  <option value="open">Đang tuyển</option>
                  <option value="closed">Đã đóng</option>
                  <option value="blocked">Bị chặn</option>
                </select>
              }
              columns={[
                {
                  key: "title",
                  title: "Tin tuyển dụng",
                  render: (job) => (
                    <>
                      <button
                        className="table-link title-button"
                        onClick={() => setExpanded(job.id)}
                      >
                        {job.title}
                      </button>
                      <div className="cell-muted">
                        #{job.id} · Công ty #{job.companyId} · Người đăng #
                        {job.createdBy}
                      </div>
                    </>
                  ),
                },
                {
                  key: "province",
                  title: "Địa điểm",
                  render: (job) => job.province || "—",
                },
                {
                  key: "status",
                  title: "Trạng thái",
                  render: (job) => <StatusBadge status={job.status} />,
                },
                {
                  key: "deadline",
                  title: "Hạn nộp",
                  render: (job) => formatDate(job.deadline),
                },
                {
                  key: "actions",
                  title: "Thao tác",
                  render: (job) => (
                    <div className="row-actions">
                      <button
                        className="action-button"
                        onClick={() => setExpanded(job.id)}
                      >
                        Xem
                      </button>
                      <ConfirmAction
                        label="Chặn"
                        title="Chặn tin tuyển dụng?"
                        description={`Chặn “${job.title}”. Tin sẽ không hiển thị với ứng viên và chủ tin không thể chỉnh sửa.`}
                        disabled={job.status === "blocked"}
                        onConfirm={async () => {
                          const updated = await adminApi.blockJob(job.id);
                          resource.setData(
                            (list) =>
                              list?.map((item) =>
                                item.id === job.id ? updated : item,
                              ) || [],
                          );
                        }}
                      />
                      <ConfirmAction
                        label="Xóa"
                        title="Xóa tin tuyển dụng?"
                        description={`Xóa vĩnh viễn “${job.title}”. Nếu tin đã có hồ sơ, hãy chặn tin thay vì xóa.`}
                        danger
                        onConfirm={async () => {
                          await adminApi.deleteJob(job.id);
                          resource.setData(
                            (list) =>
                              list?.filter((item) => item.id !== job.id) || [],
                          );
                        }}
                      />
                    </div>
                  ),
                },
              ]}
            />
            {detail && (
              <section className="card job-review">
                <div className="section-title">
                  <div>
                    <h2>{detail.title}</h2>
                    <p>
                      Tin #{detail.id} · Công ty #{detail.companyId}
                    </p>
                  </div>
                  <button
                    className="secondary"
                    onClick={() => setExpanded(null)}
                  >
                    Đóng chi tiết
                  </button>
                </div>
                <StatusBadge status={detail.status} />
                <p className="preserve-lines">
                  {detail.description || "Tin không có mô tả."}
                </p>
                <p>
                  {detail.location || detail.province || "Chưa có địa điểm"}
                </p>
              </section>
            )}
          </>
        )
      )}
    </main>
  );
}
