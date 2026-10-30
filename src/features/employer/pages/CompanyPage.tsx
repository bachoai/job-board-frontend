import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Globe, MapPin, ShieldCheck } from "lucide-react";
import {
  ErrorMessage,
  Loading,
  PageHeading,
} from "../../../components/common/Feedback";
import { useResource } from "../../../components/common/useResource";
import { employerApi } from "../api";
import { CompanyForm } from "../components/CompanyForm";
export function CompanyPage({ userId }: { userId: number }) {
  const resource = useResource(
    useCallback(
      (signal: AbortSignal) => employerApi.companies(userId, signal),
      [userId],
    ),
  );
  const [selected, setSelected] = useState<number | "new" | null>(null);
  const [message, setMessage] = useState("");
  const current =
    selected === "new"
      ? undefined
      : resource.data?.find((company) => company.id === selected) ||
        resource.data?.[0];
  return (
    <main className="page">
      <PageHeading
        title="Công ty của tôi"
        description="Một hồ sơ công ty rõ ràng giúp ứng viên hiểu hơn về bạn."
        action={
          <Link className="primary" to="/employer/jobs/new">
            ＋ Đăng tin
          </Link>
        }
      />
      {resource.loading ? (
        <Loading />
      ) : resource.error ? (
        <ErrorMessage message={resource.error} retry={resource.reload} />
      ) : (
        <>
          <div className="company-selector">
            <label>
              Chọn công ty{" "}
              <select
                aria-label="Chọn công ty"
                value={selected === "new" || !current ? "new" : current.id}
                onChange={(event) => {
                  setSelected(
                    event.target.value === "new"
                      ? "new"
                      : Number(event.target.value),
                  );
                  setMessage("");
                }}
              >
                {resource.data?.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
                <option value="new">＋ Tạo công ty mới</option>
              </select>
            </label>
          </div>
          {message && (
            <div className="alert success" role="status">
              {message}
            </div>
          )}
          <div className="company-layout">
            <CompanyForm
              key={current?.id || "new"}
              company={current}
              onSaved={(company) => {
                resource.setData((list) =>
                  list?.some((item) => item.id === company.id)
                    ? list.map((item) =>
                        item.id === company.id ? company : item,
                      )
                    : [...(list || []), company],
                );
                setSelected(company.id);
                setMessage("Đã lưu thông tin công ty.");
              }}
            />
            <aside className="card company-profile">
              <div className="company-cover" />
              <div className="company-profile-content">
                <div className="company-mark">
                  <Building2 size={25} />
                </div>
                <h2>{current?.name || "Công ty của bạn"}</h2>
                <p className="profile-subtitle">
                  {current
                    ? `Hồ sơ công ty #${current.id}`
                    : "Hoàn thiện hồ sơ để bắt đầu tuyển dụng"}
                </p>
                <div className="profile-row">
                  <Globe size={16} />
                  <span>{current?.website || "Chưa cập nhật website"}</span>
                </div>
                <div className="profile-row">
                  <MapPin size={16} />
                  <span>
                    {current
                      ? [current.address, current.ward, current.province]
                          .filter(Boolean)
                          .join(", ") || "Chưa cập nhật địa chỉ"
                      : "Địa điểm làm việc của công ty"}
                  </span>
                </div>
                <div className="profile-row">
                  <ShieldCheck size={16} />
                  <span>Thông tin được hiển thị với ứng viên</span>
                </div>
                <p className="profile-description">
                  {current?.description ||
                    "Giới thiệu văn hóa, lĩnh vực hoạt động và những điều tạo nên sự khác biệt của công ty bạn."}
                </p>
              </div>
            </aside>
          </div>
        </>
      )}
    </main>
  );
}
