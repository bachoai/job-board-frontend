import { routeId } from "../../../components/common/format";
import { useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import {
  PageHeading,
  ErrorMessage,
  Loading,
} from "../../../components/common/Feedback";
import { useResource } from "../../../components/common/useResource";
import { employerApi } from "../api";
import { JobEditor } from "../components/JobEditor";
import type { Session } from "../../../lib/api";
export function EditJobPage({
  user,
  onSubmittingChange,
}: {
  user: Session["user"];
  onSubmittingChange: (busy: boolean) => void;
}) {
  const id = routeId(useParams().id);
  const resource = useResource(
    useCallback(
      async (signal: AbortSignal) => {
        if (!id) throw new Error("Mã tin tuyển dụng không hợp lệ.");
        const [job, companies] = await Promise.all([
          employerApi.job(id, signal),
          employerApi.companies(user.id, signal),
        ]);
        if (job.createdBy !== user.id)
          throw new Error("Bạn không có quyền chỉnh sửa tin tuyển dụng này.");
        if (job.status === "blocked")
          throw new Error("Tin đã bị quản trị viên chặn, không thể chỉnh sửa.");
        return { job, companies };
      },
      [id, user.id],
    ),
  );
  return (
    <main className="page">
      <PageHeading
        title="Sửa tin tuyển dụng"
        description="Cập nhật thông tin và giữ cơ hội tuyển dụng luôn rõ ràng."
        action={
          <Link className="secondary" to="/employer/jobs">
            Về danh sách
          </Link>
        }
      />
      {resource.loading ? (
        <Loading />
      ) : resource.error ? (
        <ErrorMessage message={resource.error} retry={resource.reload} />
      ) : (
        resource.data && (
          <JobEditor
            userId={user.id}
            original={resource.data.job}
            companies={resource.data.companies}
            onSubmittingChange={onSubmittingChange}
          />
        )
      )}
    </main>
  );
}
