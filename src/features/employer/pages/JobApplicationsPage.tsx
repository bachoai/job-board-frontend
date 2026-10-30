import { applicationStatuses } from "../../../components/common/statuses";
import { formatDate, routeId } from "../../../components/common/format";
import { useCallback, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { DataTable } from "../../../components/common/DataTable";
import {
  ErrorMessage,
  Loading,
  PageHeading,
} from "../../../components/common/Feedback";
import { StatusBadge } from "../../../components/common/StatusBadge";
import { useResource } from "../../../components/common/useResource";
import { employerApi } from "../api";
export function JobApplicationsPage() {
  const id = routeId(useParams().id);
  const [status, setStatus] = useState("");
  const resource = useResource(
    useCallback(
      async (signal: AbortSignal) => {
        if (!id) throw new Error("Mã tin không hợp lệ.");
        const [job, applications] = await Promise.all([
          employerApi.job(id, signal),
          employerApi.applications(id, signal),
        ]);
        return { job, applications };
      },
      [id],
    ),
  );
  return (
    <main className="page">
      <PageHeading
        title="Hồ sơ ứng tuyển"
        description={
          resource.data?.job.title ||
          "Theo dõi và xem xét hồ sơ của từng ứng viên."
        }
        action={
          <Link className="secondary" to="/employer/jobs">
            ← Tin của tôi
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
            <div className="alert">
              Danh sách hiển thị theo mã ứng viên. Mở hồ sơ để đọc CV và thư
              giới thiệu.
            </div>
            <DataTable
              title="Danh sách ứng viên"
              filtered={!!status}
              rows={resource.data.applications.filter(
                (item) => !status || item.status === status,
              )}
              searchText={(item) =>
                `${item.candidateId} ${item.id} ${item.coverLetter || ""}`
              }
              searchLabel="Tìm mã hồ sơ, mã ứng viên…"
              filters={
                <select
                  aria-label="Lọc trạng thái hồ sơ"
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                >
                  <option value="">Mọi trạng thái</option>
                  {Object.entries(applicationStatuses).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              }
              emptyTitle="Chưa có hồ sơ ứng tuyển"
              columns={[
                {
                  key: "candidate",
                  title: "Ứng viên",
                  render: (item) => (
                    <>
                      <strong>Ứng viên #{item.candidateId}</strong>
                      <div className="cell-muted">Hồ sơ #{item.id}</div>
                    </>
                  ),
                },
                {
                  key: "date",
                  title: "Ngày ứng tuyển",
                  render: (item) => formatDate(item.createdAt, true),
                },
                {
                  key: "cv",
                  title: "CV",
                  render: (item) =>
                    item.resumeId ? `CV #${item.resumeId}` : "Không đính kèm",
                },
                {
                  key: "status",
                  title: "Trạng thái",
                  render: (item) => <StatusBadge status={item.status} />,
                },
                {
                  key: "actions",
                  title: "Thao tác",
                  render: (item) => (
                    <Link
                      className="table-link"
                      to={`/employer/applications/${item.id}`}
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
