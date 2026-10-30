import { API_BASE_URL } from "../../../lib/axios";
import { applicationStatuses } from "../../../components/common/statuses";
import { formatDate, routeId } from "../../../components/common/format";
import { useCallback, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ApplicationStatusForm as StatusPanel } from "../components/ApplicationStatusForm";
import {
  EmptyState,
  ErrorMessage,
  Loading,
  PageHeading,
} from "../../../components/common/Feedback";
import { StatusBadge } from "../../../components/common/StatusBadge";
import { useResource } from "../../../components/common/useResource";
import { employerApi } from "../api";

function resumeUrl(path: string) {
  try {
    const base = new URL(API_BASE_URL);
    const url = new URL(path, `${base.origin}/`);
    return ["http:", "https:"].includes(url.protocol) &&
      url.origin === base.origin &&
      url.pathname.startsWith("/uploads/")
      ? url.href
      : null;
  } catch {
    return null;
  }
}
function ResumePanel({ id }: { id: number }) {
  const resource = useResource(
    useCallback((signal: AbortSignal) => employerApi.resume(id, signal), [id]),
  );
  const url = resource.data && resumeUrl(resource.data.fileUrl);
  return (
    <section className="card">
      <h2>CV đính kèm</h2>
      {resource.loading ? (
        <Loading />
      ) : resource.error ? (
        <ErrorMessage message={resource.error} retry={resource.reload} />
      ) : (
        resource.data && (
          <>
            <div className="resume-info">
              <span className="document-icon">CV</span>
              <div>
                <strong>{resource.data.fileName}</strong>
                <p>
                  {resource.data.fileSize
                    ? `${Math.ceil(resource.data.fileSize / 1024)} KB`
                    : "Tài liệu ứng viên"}
                </p>
              </div>
              {url && (
                <a
                  className="secondary"
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Mở CV ↗
                </a>
              )}
            </div>
            {!url && (
              <ErrorMessage message="Đường dẫn CV không hợp lệ hoặc chưa sẵn sàng." />
            )}
            {url && resource.data.mimeType === "application/pdf" && (
              <iframe
                className="cv-preview"
                title={`Xem CV ${resource.data.fileName}`}
                src={url}
              />
            )}
            {url && resource.data.mimeType !== "application/pdf" && (
              <p className="hint">Mở hoặc tải tài liệu Word để xem nội dung.</p>
            )}
          </>
        )
      )}
    </section>
  );
}
function HistoryPanel({ id }: { id: number }) {
  const resource = useResource(
    useCallback((signal: AbortSignal) => employerApi.history(id, signal), [id]),
  );
  return (
    <section className="card">
      <h2>Lịch sử xử lý</h2>
      {resource.loading ? (
        <Loading />
      ) : resource.error ? (
        <ErrorMessage message={resource.error} retry={resource.reload} />
      ) : !resource.data?.length ? (
        <EmptyState title="Chưa có thay đổi trạng thái" />
      ) : (
        <ol className="timeline">
          {resource.data.map((item) => (
            <li key={item.id}>
              <div>
                <StatusBadge status={item.toStatus} />
                <span className="cell-muted">
                  {formatDate(item.createdAt, true)}
                </span>
              </div>
              {item.fromStatus && (
                <p>
                  Từ:{" "}
                  {applicationStatuses[
                    item.fromStatus as keyof typeof applicationStatuses
                  ] || item.fromStatus}
                </p>
              )}
              {item.note && <p className="preserve-lines">{item.note}</p>}
              <span className="hint">
                Người cập nhật: #{item.changedBy ?? "—"}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
export function ApplicationDetailPage({ userId }: { userId: number }) {
  const id = routeId(useParams().id);
  const [historyVersion, setHistoryVersion] = useState(0);
  const resource = useResource(
    useCallback(
      async (signal: AbortSignal) => {
        if (!id) throw new Error("Mã hồ sơ không hợp lệ.");
        const application = await employerApi.application(id, signal);
        const job = await employerApi.job(application.jobId, signal);
        return { application, job };
      },
      [id],
    ),
  );
  return (
    <main className="page">
      <PageHeading
        title={
          resource.data
            ? `Hồ sơ #${resource.data.application.id}`
            : "Chi tiết hồ sơ"
        }
        description={
          resource.data?.job.title || "Xem CV, thư giới thiệu và lịch sử xử lý."
        }
        action={
          <Link
            className="secondary"
            to={
              resource.data
                ? `/employer/jobs/${resource.data.job.id}/applications`
                : "/employer/jobs"
            }
          >
            ← Danh sách hồ sơ
          </Link>
        }
      />
      {resource.loading ? (
        <Loading />
      ) : resource.error ? (
        <ErrorMessage message={resource.error} retry={resource.reload} />
      ) : (
        resource.data && (
          <div className="detail-grid">
            <div>
              <section className="card">
                <div className="candidate-heading">
                  <span className="avatar">UV</span>
                  <div>
                    <h2>Ứng viên #{resource.data.application.candidateId}</h2>
                    <p>
                      Ứng tuyển{" "}
                      {formatDate(resource.data.application.createdAt, true)}
                    </p>
                  </div>
                </div>
                <h3>Thư giới thiệu</h3>
                <p className="preserve-lines cover-letter">
                  {resource.data.application.coverLetter ||
                    "Ứng viên không gửi thư giới thiệu."}
                </p>
              </section>
              {resource.data.application.resumeId ? (
                <ResumePanel id={resource.data.application.resumeId} />
              ) : (
                <section className="card">
                  <EmptyState title="Ứng viên không đính kèm CV" />
                </section>
              )}
              <HistoryPanel
                key={historyVersion}
                id={resource.data.application.id}
              />
            </div>
            <aside>
              <StatusPanel
                application={resource.data.application}
                canEdit={resource.data.job.createdBy === userId}
                onSaved={(application) => {
                  resource.setData(
                    (value) => value && { ...value, application },
                  );
                  setHistoryVersion((value) => value + 1);
                }}
              />
            </aside>
          </div>
        )
      )}
    </main>
  );
}
