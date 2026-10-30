import {
  BriefcaseBusiness,
  CircleCheck,
  Archive,
  Files,
  Plus,
} from "lucide-react";
import { StatCard } from "../../../components/common/StatCard";
import { formatDate } from "../../../components/common/format";
import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { DataTable } from "../../../components/common/DataTable";
import { ConfirmAction } from "../../../components/common/ConfirmAction";
import {
  ErrorMessage,
  Loading,
  PageHeading,
} from "../../../components/common/Feedback";
import { StatusBadge } from "../../../components/common/StatusBadge";
import { useResource } from "../../../components/common/useResource";
import { employerApi } from "../api";
import type { Job } from "../types";
export function MyJobsPage({ userId }: { userId: number }) {
  const [status, setStatus] = useState("");
  const resource = useResource(
    useCallback(
      async (signal: AbortSignal) => {
        const jobs = await employerApi.myJobs(userId, signal);
        const counts: Record<number, number | null> = {};
        let cursor = 0;
        await Promise.all(
          Array.from({ length: Math.min(jobs.length, 4) }, async () => {
            while (cursor < jobs.length && !signal.aborted) {
              const job = jobs[cursor++];
              try {
                counts[job.id] = (
                  await employerApi.applications(job.id, signal)
                ).length;
              } catch {
                counts[job.id] = null;
              }
            }
          }),
        );
        return { jobs, counts };
      },
      [userId],
    ),
  );
  function remove(id: number) {
    resource.setData(
      (current) =>
        current && {
          ...current,
          jobs: current.jobs.filter((job) => job.id !== id),
        },
    );
  }
  function replace(job: Job) {
    resource.setData(
      (current) =>
        current && {
          ...current,
          jobs: current.jobs.map((item) => (item.id === job.id ? job : item)),
        },
    );
  }
  return (
    <main className="page">
      <PageHeading
        title="Tin tuyển dụng của tôi"
        description="Quản lý cơ hội tuyển dụng và theo dõi hồ sơ của từng vị trí."
        action={
          <Link className="primary" to="/employer/jobs/new">
            <Plus size={17} /> Đăng tin mới
          </Link>
        }
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
                value={resource.data.jobs.length}
                detail="Tất cả trạng thái"
                icon={BriefcaseBusiness}
              />
              <StatCard
                label="Đang tuyển"
                value={
                  resource.data.jobs.filter((job) => job.status === "open")
                    .length
                }
                detail="Sẵn sàng nhận hồ sơ"
                icon={CircleCheck}
                tone="green"
              />
              <StatCard
                label="Đã đóng"
                value={
                  resource.data.jobs.filter((job) => job.status === "closed")
                    .length
                }
                detail="Đã ngừng nhận hồ sơ"
                icon={Archive}
                tone="slate"
              />
              <StatCard
                label="Hồ sơ ứng tuyển"
                value={
                  Object.values(resource.data.counts).some(
                    (value) => value === null,
                  )
                    ? "—"
                    : Object.values(resource.data.counts).reduce<number>(
                        (total, value) => total + (value || 0),
                        0,
                      )
                }
                detail="Từ các vị trí của bạn"
                icon={Files}
                tone="violet"
              />
            </div>
            {Object.values(resource.data.counts).some(
              (count) => count === null,
            ) && (
              <div className="alert">
                Một số số lượng hồ sơ chưa tải được.{" "}
                <button className="text-button" onClick={resource.reload}>
                  Tải lại
                </button>
              </div>
            )}
            <DataTable
              title="Danh sách tin tuyển dụng"
              filtered={!!status}
              rows={resource.data.jobs.filter(
                (job) => !status || job.status === status,
              )}
              searchText={(job) =>
                `${job.title} ${job.id} ${job.province || ""}`
              }
              searchLabel="Tìm theo tiêu đề, mã tin…"
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
              emptyTitle="Bạn chưa đăng tin nào"
              columns={[
                {
                  key: "title",
                  title: "Vị trí tuyển dụng",
                  render: (job) => (
                    <>
                      <div className="entity-cell">
                        <span className="entity-avatar">
                          <BriefcaseBusiness size={19} />
                        </span>
                        <strong>{job.title}</strong>
                      </div>
                      <div className="cell-muted">
                        #{job.id} · {job.province || "Chưa có địa điểm"}
                      </div>
                    </>
                  ),
                },
                {
                  key: "status",
                  title: "Trạng thái",
                  render: (job) => <StatusBadge status={job.status} />,
                },
                {
                  key: "posted",
                  title: "Ngày đăng",
                  render: (job) => formatDate(job.createdAt),
                },
                {
                  key: "deadline",
                  title: "Hạn nộp",
                  render: (job) => formatDate(job.deadline),
                },
                {
                  key: "applications",
                  title: "Hồ sơ",
                  render: (job) => (
                    <Link
                      className="table-link"
                      to={`/employer/jobs/${job.id}/applications`}
                    >
                      {resource.data?.counts[job.id] ?? "—"} hồ sơ →
                    </Link>
                  ),
                },
                {
                  key: "actions",
                  title: "Thao tác",
                  render: (job) => (
                    <div className="row-actions">
                      {job.status !== "blocked" && (
                        <Link
                          className="action-button"
                          to={`/employer/jobs/${job.id}/edit`}
                        >
                          Sửa
                        </Link>
                      )}
                      {job.status === "open" && (
                        <ConfirmAction
                          label="Đóng"
                          title="Đóng tin tuyển dụng?"
                          description={`Dừng nhận hồ sơ cho “${job.title}”. Hồ sơ đã nộp vẫn được giữ lại.`}
                          onConfirm={async () =>
                            replace(await employerApi.closeJob(job.id))
                          }
                        />
                      )}
                      <ConfirmAction
                        label="Xóa"
                        title="Xóa tin tuyển dụng?"
                        description={`Xóa vĩnh viễn “${job.title}”. Tin đã có hồ sơ cần được đóng thay vì xóa.`}
                        danger
                        onConfirm={async () => {
                          await employerApi.deleteJob(job.id);
                          remove(job.id);
                        }}
                      />
                    </div>
                  ),
                },
              ]}
            />
          </>
        )
      )}
    </main>
  );
}
