import {
  MapPin,
  Banknote,
  CalendarDays,
  Lightbulb,
  Check,
  Plus,
} from "lucide-react";
import { useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Field, ErrorMessage } from "../../../components/common/Feedback";
import { ConfirmAction } from "../../../components/common/ConfirmAction";

import { employerApi } from "../api";
import type { Company, Job } from "../types";
import { clearDraft, loadDraft, saveDraft } from "./job-draft";
import { emptyForm, jobLevels, jobTypes, today, validateJob } from "./job-form";
import type { JobForm as JobFormValues } from "./job-form";

export function JobForm({
  userId,
  companies,
  original: initialJob,
  onSubmittingChange = () => {},
}: {
  userId: number;
  companies: Company[];
  original?: Job;
  onSubmittingChange?: (busy: boolean) => void;
}) {
  const navigate = useNavigate();
  const [original, setOriginal] = useState(initialJob);
  const [form, setForm] = useState<JobFormValues>(() =>
    original
      ? {
          companyId: String(original.companyId),
          title: original.title,
          description: original.description || "",
          location: original.location || "",
          province: original.province || "",
          jobType: original.jobType,
          level: original.level || "",
          salaryMin:
            original.salaryMin == null ? "" : String(original.salaryMin),
          salaryMax:
            original.salaryMax == null ? "" : String(original.salaryMax),
          deadline: original.deadline || "",
        }
      : {
          ...loadDraft(userId),
          companyId: companies.some(
            (c) => String(c.id) === loadDraft(userId).companyId,
          )
            ? loadDraft(userId).companyId
            : companies.length === 1
              ? String(companies[0].id)
              : "",
        },
  );
  const [errors, setErrors] = useState<
    Partial<Record<keyof JobFormValues, string>>
  >({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<{ id: number; title: string } | null>(
    null,
  );
  const [saved, setSaved] = useState(false);
  const pending = useRef(false);
  const notice = useRef<HTMLDivElement>(null);
  const company = companies.find((c) => c.id === Number(form.companyId));
  const currency = original?.currency || "VND";

  function update(name: keyof JobFormValues, value: string) {
    const next = { ...form, [name]: value };
    setForm(next);
    setErrors((current) => ({ ...current, [name]: undefined }));
    setError("");
    setSaved(false);
    if (!original) saveDraft(userId, next);
  }
  function attrs(name: keyof JobFormValues) {
    return {
      id: name,
      name,
      value: form[name],
      "aria-invalid": !!errors[name],
      "aria-describedby": errors[name]
        ? `${name}-error`
        : ["title", "description", "deadline"].includes(name)
          ? `${name}-hint`
          : undefined,
      onChange: (
        event: ChangeEvent<
          HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >,
      ) => update(name, event.target.value),
    };
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    const next = validateJob(form, original?.deadline);
    if (!companies.some((c) => c.id === Number(form.companyId)))
      next.companyId = "Vui lòng chọn một công ty của bạn.";
    setErrors(next);
    setError("");
    if (Object.keys(next).length) {
      document.getElementById(Object.keys(next)[0])?.focus();
      return;
    }
    pending.current = true;
    setBusy(true);
    onSubmittingChange(true);
    try {
      if (original) {
        const updated = await employerApi.updateJob(
          original.id,
          form,
          original,
        );
        setOriginal(updated);
        setSaved(true);
      } else {
        const result = await employerApi.createJob(form);
        if (
          !Number.isSafeInteger(result.id) ||
          typeof result.title !== "string"
        )
          throw new Error(
            "Máy chủ chưa trả về thông tin tin tuyển dụng hợp lệ. Vui lòng kiểm tra trước khi đăng lại.",
          );
        clearDraft(userId);
        setCreated(result);
      }
      requestAnimationFrame(() => notice.current?.focus());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không thể lưu tin tuyển dụng.",
      );
      requestAnimationFrame(() => notice.current?.focus());
    } finally {
      pending.current = false;
      setBusy(false);
      onSubmittingChange(false);
    }
  }
  if (created)
    return (
      <div className="card success-card" role="status">
        <span className="success-icon">
          <Check size={30} />
        </span>
        <div className="eyebrow">ĐĂNG TIN THÀNH CÔNG</div>
        <h1
          tabIndex={-1}
          ref={(element) => {
            element?.focus();
          }}
        >
          Tin tuyển dụng đã sẵn sàng.
        </h1>
        <p>
          <strong>{created.title}</strong>
        </p>
        <p>Mã tin #{created.id} · Đang tuyển</p>
        <p>Ứng viên có thể tìm thấy tin tuyển dụng của bạn.</p>
        <div className="success-actions">
          <Link className="secondary" to="/employer/jobs">
            Về tin của tôi
          </Link>
          <button
            className="primary"
            onClick={() => {
              setCreated(null);
              const next = { ...emptyForm, companyId: form.companyId };
              setForm(next);
              saveDraft(userId, next);
              setErrors({});
            }}
          >
            <Plus size={16} /> Đăng một tin khác
          </button>
        </div>
      </div>
    );
  return (
    <div className="content-grid">
      <form onSubmit={submit} noValidate aria-busy={busy}>
        <fieldset disabled={busy} className="form-fields">
          <section className="card">
            <div className="section-title">
              <span className="section-number">01</span>
              <div>
                <h2>Thông tin công việc</h2>
                <p>Cho ứng viên biết bạn đang tìm kiếm ai.</p>
              </div>
            </div>
            <Field
              name="companyId"
              label="Công ty đăng tuyển *"
              error={errors.companyId}
            >
              <select
                {...attrs("companyId")}
                disabled={!!original || busy || !companies.length}
              >
                <option value="">Chọn công ty của bạn</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              name="title"
              label="Tiêu đề tuyển dụng *"
              error={errors.title}
              hint={`${form.title.length}/150 ký tự. Nên ghi rõ vị trí và chuyên môn.`}
            >
              <input
                {...attrs("title")}
                required
                maxLength={150}
                placeholder="VD: Backend Developer (NestJS)"
              />
            </Field>
            <Field
              name="description"
              label="Mô tả công việc"
              error={errors.description}
              hint="Gợi ý: trách nhiệm công việc, yêu cầu ứng viên và quyền lợi."
            >
              <textarea
                {...attrs("description")}
                rows={8}
                placeholder={
                  "Mô tả vai trò và những điều ứng viên sẽ làm…\n\nYêu cầu ứng viên…\n\nQuyền lợi khi gia nhập đội ngũ…"
                }
              />
            </Field>
            <div className="two-cols">
              <Field
                name="jobType"
                label="Hình thức làm việc"
                error={errors.jobType}
              >
                <select {...attrs("jobType")}>
                  {Object.entries(jobTypes).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field name="level" label="Cấp bậc" error={errors.level}>
                <select {...attrs("level")}>
                  <option value="">Chọn cấp bậc (không bắt buộc)</option>
                  {Object.entries(jobLevels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </section>
          <section className="card">
            <div className="section-title">
              <span className="section-number">02</span>
              <div>
                <h2>Địa điểm & mức lương</h2>
                <p>Thông tin rõ ràng giúp thu hút ứng viên phù hợp.</p>
              </div>
            </div>
            <div className="two-cols">
              <Field
                name="province"
                label="Tỉnh / thành phố"
                error={errors.province}
              >
                <input
                  {...attrs("province")}
                  maxLength={80}
                  placeholder="VD: Thành phố Hồ Chí Minh"
                />
              </Field>
              <Field
                name="location"
                label="Địa điểm làm việc"
                error={errors.location}
              >
                <input
                  {...attrs("location")}
                  maxLength={150}
                  placeholder="VD: 123 Nguyễn Huệ, phường Sài Gòn"
                />
              </Field>
            </div>
            <div className="two-cols">
              <Field
                name="salaryMin"
                label={`Lương tối thiểu (${currency} / tháng)`}
                error={errors.salaryMin}
              >
                <input
                  {...attrs("salaryMin")}
                  type="number"
                  min="0"
                  max="2147483647"
                  step="1"
                  placeholder="VD: 15000000"
                />
              </Field>
              <Field
                name="salaryMax"
                label={`Lương tối đa (${currency} / tháng)`}
                error={errors.salaryMax}
              >
                <input
                  {...attrs("salaryMax")}
                  type="number"
                  min="0"
                  max="2147483647"
                  step="1"
                  placeholder="VD: 25000000"
                />
              </Field>
            </div>
            <p className="hint salary-hint">
              Để trống mức lương nếu bạn muốn trao đổi trực tiếp với ứng viên.
            </p>
          </section>
          <section className="card">
            <div className="section-title">
              <span className="section-number">03</span>
              <div>
                <h2>Thời gian nhận hồ sơ</h2>
                <p>Chọn thời hạn cho cơ hội tuyển dụng này.</p>
              </div>
            </div>
            <Field
              name="deadline"
              label="Hạn nộp hồ sơ"
              error={errors.deadline}
              hint={
                original
                  ? "Có thể giữ nguyên hạn cũ. Hạn mới phải từ hôm nay trở đi."
                  : "Hạn nộp từ hôm nay trở đi. Có thể để trống nếu chưa xác định."
              }
            >
              <input {...attrs("deadline")} type="date" min={today()} />
            </Field>
          </section>
          {error && <ErrorMessage message={error} focus />}
          {saved && (
            <div
              ref={notice}
              tabIndex={-1}
              className="alert success"
              role="status"
            >
              Đã lưu thay đổi.
            </div>
          )}
          <div className="form-actions">
            <span>
              <span className="required">*</span> Thông tin bắt buộc
              <br />
              {!original && "Bản nháp được giữ trong tab này."}
            </span>
            <div className="row-actions">
              <Link className="secondary" to="/employer/jobs">
                Về danh sách
              </Link>
              <button className="primary" disabled={busy || !companies.length}>
                {busy
                  ? "Đang đăng tin…"
                  : original
                    ? "Lưu thay đổi"
                    : "Đăng tin tuyển dụng →"}
              </button>
            </div>
          </div>
        </fieldset>
      </form>
      <aside className="right-column">
        <section className="preview-card">
          <div className="preview-label">
            <span className="live-dot" /> XEM TRƯỚC TIN TUYỂN DỤNG
          </div>
          <div className="company-mark">{company?.name.charAt(0) || "J"}</div>
          <h2>{form.title.trim() || "Vị trí bạn đang tìm kiếm"}</h2>
          <p>{company?.name || "Tên công ty của bạn"}</p>
          <div className="preview-tags">
            <span>{jobTypes[form.jobType as keyof typeof jobTypes]}</span>
            {form.level && (
              <span>{jobLevels[form.level as keyof typeof jobLevels]}</span>
            )}
          </div>
          <div className="preview-detail">
            <MapPin size={16} />
            <span>{form.province || form.location || "Địa điểm làm việc"}</span>
          </div>
          <div className="preview-detail">
            <Banknote size={16} />
            <span>
              {form.salaryMin || form.salaryMax
                ? `${form.salaryMin ? Number(form.salaryMin).toLocaleString("vi-VN") : "…"} – ${form.salaryMax ? Number(form.salaryMax).toLocaleString("vi-VN") : "…"} ${currency}`
                : "Lương thỏa thuận"}
            </span>
          </div>
          <div className="preview-detail">
            <CalendarDays size={16} />
            <span>
              {form.deadline
                ? `Hạn nộp: ${form.deadline.split("-").reverse().join("/")}`
                : "Chưa xác định hạn nộp"}
            </span>
          </div>
          <div className="preview-footer">
            {original
              ? "Bản xem trước nội dung chỉnh sửa"
              : "Tin sẽ hiển thị sau khi đăng thành công"}
          </div>
        </section>
        {original && original.status === "open" && (
          <section className="card close-card">
            <h3>Đã tuyển đủ người?</h3>
            <p>Đóng tin để dừng nhận hồ sơ mới.</p>
            <ConfirmAction
              label="Đóng tin"
              title="Đóng tin tuyển dụng?"
              description="Tin sẽ ngừng nhận hồ sơ mới. Các hồ sơ đã nộp vẫn được giữ lại."
              onConfirm={async () => {
                await employerApi.closeJob(original.id);
                navigate("/employer/jobs");
              }}
              disabled={busy}
            />
          </section>
        )}
        <section className="writing-tip">
          <span>
            <Lightbulb size={22} />
          </span>
          <h3>Một tin tốt bắt đầu từ sự rõ ràng</h3>
          <p>
            Tiêu đề cụ thể, mô tả dễ hiểu và mức lương minh bạch giúp ứng viên
            tự tin ứng tuyển.
          </p>
        </section>
      </aside>
    </div>
  );
}
