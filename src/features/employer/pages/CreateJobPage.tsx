import { useCallback } from "react";
import { Link } from "react-router-dom";
import {
  PageHeading,
  ErrorMessage,
  Loading,
  EmptyState,
} from "../../../components/common/Feedback";
import { useResource } from "../../../components/common/useResource";
import { employerApi } from "../api";
import { JobEditor } from "../components/JobEditor";
import type { Session } from "../../../lib/api";
export function CreateJobPage({
  user,
  onSubmittingChange,
}: {
  user: Session["user"];
  onSubmittingChange: (busy: boolean) => void;
}) {
  const resource = useResource(
    useCallback(
      (signal: AbortSignal) => employerApi.companies(user.id, signal),
      [user.id],
    ),
  );
  return (
    <main className="page">
      <PageHeading
        title="Đăng tin tuyển dụng"
        description="Cơ hội mới của bạn. Bước tiếp theo của một ứng viên."
      />
      {resource.loading ? (
        <Loading />
      ) : resource.error ? (
        <ErrorMessage message={resource.error} retry={resource.reload} />
      ) : !resource.data?.length ? (
        <section className="card">
          <EmptyState title="Tài khoản chưa có công ty">
            <p>Tạo hồ sơ công ty trước khi đăng tin tuyển dụng.</p>
            <Link className="primary" to="/employer/company">
              Tạo công ty
            </Link>
            <button className="text-button" onClick={resource.reload}>
              Tải lại công ty
            </button>
          </EmptyState>
        </section>
      ) : (
        <JobEditor
          userId={user.id}
          companies={resource.data}
          onSubmittingChange={onSubmittingChange}
        />
      )}
    </main>
  );
}
