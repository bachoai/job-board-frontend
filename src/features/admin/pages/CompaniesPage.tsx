import { formatDate } from "../../../components/common/format";
import { useCallback } from "react";
import { DataTable } from "../../../components/common/DataTable";
import { ConfirmAction } from "../../../components/common/ConfirmAction";
import {
  ErrorMessage,
  Loading,
  PageHeading,
} from "../../../components/common/Feedback";
import { useResource } from "../../../components/common/useResource";
import { adminApi } from "../api";
function websiteUrl(value: string | null) {
  try {
    const url = new URL(value || "");
    return ["http:", "https:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}
export function CompaniesPage() {
  const resource = useResource(
    useCallback((signal: AbortSignal) => adminApi.companies(signal), []),
  );
  return (
    <main className="page">
      <PageHeading
        title="Quản lý công ty"
        description="Theo dõi doanh nghiệp và xử lý hồ sơ công ty không phù hợp."
      />
      {resource.loading ? (
        <Loading />
      ) : resource.error ? (
        <ErrorMessage message={resource.error} retry={resource.reload} />
      ) : (
        resource.data && (
          <DataTable
            title="Danh sách công ty"
            rows={resource.data}
            searchText={(company) =>
              `${company.name} ${company.id} ${company.ownerId} ${company.province || ""}`
            }
            searchLabel="Tìm tên công ty, mã công ty, mã chủ sở hữu…"
            emptyTitle="Chưa có công ty"
            columns={[
              {
                key: "name",
                title: "Công ty",
                render: (company) => (
                  <>
                    <strong>{company.name}</strong>
                    <div className="cell-muted">
                      #{company.id} · Chủ sở hữu #{company.ownerId}
                    </div>
                  </>
                ),
              },
              {
                key: "address",
                title: "Địa chỉ",
                render: (company) => (
                  <span>
                    {[company.address, company.ward, company.province]
                      .filter(Boolean)
                      .join(", ") || "—"}
                  </span>
                ),
              },
              {
                key: "website",
                title: "Website",
                render: (company) =>
                  websiteUrl(company.website) ? (
                    <a
                      className="table-link"
                      href={websiteUrl(company.website)!}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {company.website} ↗
                    </a>
                  ) : (
                    "—"
                  ),
              },
              {
                key: "date",
                title: "Ngày tạo",
                render: (company) => formatDate(company.createdAt),
              },
              {
                key: "actions",
                title: "Thao tác",
                render: (company) => (
                  <ConfirmAction
                    label="Xóa"
                    title="Xóa công ty và toàn bộ tin tuyển dụng?"
                    description={`Xóa vĩnh viễn “${company.name}” sẽ xóa cả tin tuyển dụng và các dữ liệu ứng tuyển liên quan. Thao tác không thể hoàn tác.`}
                    danger
                    onConfirm={async () => {
                      await adminApi.deleteCompany(company.id);
                      resource.setData(
                        (list) =>
                          list?.filter((item) => item.id !== company.id) || [],
                      );
                    }}
                  />
                ),
              },
            ]}
          />
        )
      )}
    </main>
  );
}
