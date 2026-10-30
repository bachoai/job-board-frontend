import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { Files, Eye, CalendarDays, CirclePlus } from "lucide-react";
import { DataTable } from "../../../components/common/DataTable";
import {
  PageHeading,
  Loading,
  ErrorMessage,
} from "../../../components/common/Feedback";
import { formatDate } from "../../../components/common/format";
import { StatusBadge } from "../../../components/common/StatusBadge";
import { applicationStatuses } from "../../../components/common/statuses";
import { StatCard } from "../../../components/common/StatCard";
import { useResource } from "../../../components/common/useResource";
import { employerApi } from "../api";
export function ApplicationsPage({ userId }: { userId: number }) {
  const [status, setStatus] = useState("");
  const [jobId, setJobId] = useState("");
  const resource = useResource(
    useCallback(
      (signal: AbortSignal) => employerApi.allApplications(userId, signal),
      [userId],
    ),
  );
  return (
    <main className="page">
      <PageHeading
        title="Hồ sơ ứng tuyển"
        description="Mỗi hồ sơ là một cơ hội để tìm thấy thành viên phù hợp cho đội ngũ."
        action={
          <Link className="primary" to="/employer/jobs/new">
            <CirclePlus size={17} /> Đăng tin mới
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
                label="Tổng hồ sơ"
                value={resource.data.rows.length}
                detail="Tất cả tin tuyển dụng"
                icon={Files}
              />
              <StatCard
                label="Hồ sơ mới"
                value={
                  resource.data.rows.filter((item) => item.status === "new")
                    .length
                }
                detail="Đang chờ bạn xem xét"
                icon={CirclePlus}
                tone="violet"
              />
              <StatCard
                label="Đã xem"
                value={
                  resource.data.rows.filter((item) => item.status === "viewed")
                    .length
                }
                detail="Đang trong quá trình đánh giá"
                icon={Eye}
                tone="amber"
              />
              <StatCard
                label="Phỏng vấn"
                value={
                  resource.data.rows.filter(
                    (item) => item.status === "interview",
                  ).length
                }
                detail="Tiến gần hơn đến đội ngũ"
                icon={CalendarDays}
                tone="green"
              />
            </div>
            <DataTable
              title="Tất cả hồ sơ"
              rows={resource.data.rows.filter(
                (row) =>
                  (!status || row.status === status) &&
                  (!jobId || String(row.jobId) === jobId),
              )}
              filtered={!!status || !!jobId}
              searchText={(row) =>
                `${row.id} ${row.candidateId} ${row.jobTitle}`
              }
              searchLabel="Tìm mã ứng viên, hồ sơ, vị trí…"
              filters={
                <>
                  <select
                    aria-label="Lọc theo tin tuyển dụng"
                    value={jobId}
                    onChange={(event) => setJobId(event.target.value)}
                  >
                    <option value="">Tất cả vị trí</option>
                    {resource.data.jobs.map((job) => (
                      <option key={job.id} value={job.id}>
                        {job.title}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label="Lọc trạng thái hồ sơ"
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                  >
                    <option value="">Mọi trạng thái</option>
                    {Object.entries(applicationStatuses).map(([key, value]) => (
                      <option key={key} value={key}>
                        {value}
                      </option>
                    ))}
                  </select>
                </>
              }
              emptyTitle="Chưa có hồ sơ ứng tuyển"
              columns={[
                {
                  key: "candidate",
                  title: "Ứng viên",
                  render: (row) => (
                    <div className="entity-cell">
                      <span className="entity-avatar violet">UV</span>
                      <div>
                        <strong>Ứng viên #{row.candidateId}</strong>
                        <div className="cell-muted">Hồ sơ #{row.id}</div>
                      </div>
                    </div>
                  ),
                },
                {
                  key: "job",
                  title: "Vị trí ứng tuyển",
                  render: (row) => (
                    <Link
                      className="table-link"
                      to={`/employer/jobs/${row.jobId}/applications`}
                    >
                      {row.jobTitle}
                    </Link>
                  ),
                },
                {
                  key: "createdAt",
                  title: "Ngày ứng tuyển",
                  render: (row) => formatDate(row.createdAt),
                },
                {
                  key: "status",
                  title: "Trạng thái",
                  render: (row) => <StatusBadge status={row.status} />,
                },
                {
                  key: "actions",
                  title: "Thao tác",
                  render: (row) => (
                    <Link
                      className="table-link"
                      to={`/employer/applications/${row.id}`}
                    >
                      Xem hồ sơ →
                    </Link>
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
