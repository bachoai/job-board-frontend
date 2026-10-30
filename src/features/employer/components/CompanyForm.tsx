import { Building2 } from "lucide-react";
import { useRef, useState } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { Field, ErrorMessage } from "../../../components/common/Feedback";
import { employerApi } from "../api";
import type { Company, CompanyInput } from "../types";
export function CompanyForm({
  company,
  onSaved,
}: {
  company?: Company;
  onSaved: (company: Company) => void;
}) {
  const [values, setValues] = useState({
    name: company?.name || "",
    description: company?.description || "",
    website: company?.website || "",
    address: company?.address || "",
    province: company?.province || "",
    ward: company?.ward || "",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof typeof values, string>>
  >({});
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (pending.current) return;
    const next: typeof errors = {};
    if (!values.name.trim()) next.name = "Vui lòng nhập tên công ty.";
    if (values.name.trim().length > 200)
      next.name = "Tên công ty tối đa 200 ký tự.";
    if (values.address.length > 255) next.address = "Địa chỉ tối đa 255 ký tự.";
    if (values.province.length > 255)
      next.province = "Tỉnh/thành phố tối đa 255 ký tự.";
    if (values.ward.length > 255) next.ward = "Phường/xã tối đa 255 ký tự.";
    if (values.website.trim()) {
      try {
        const url = new URL(values.website.trim());
        if (
          !["https:", "http:"].includes(url.protocol) ||
          !url.hostname.includes(".")
        )
          throw new Error();
      } catch {
        next.website = "Nhập URL hợp lệ, ví dụ https://congty.vn.";
      }
    }
    setErrors(next);
    setError("");
    setSaved(false);
    if (Object.keys(next).length) {
      document.getElementById(Object.keys(next)[0])?.focus();
      return;
    }
    const body = Object.fromEntries(
      Object.entries(values).map(([key, value]) => [key, value.trim() || null]),
    ) as CompanyInput;
    pending.current = true;
    setBusy(true);
    try {
      const result = company
        ? await employerApi.updateCompany(company.id, body)
        : await employerApi.createCompany(body);
      onSaved(result);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể lưu công ty.");
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  function props(name: keyof typeof values) {
    return {
      id: name,
      name,
      value: values[name],
      "aria-invalid": !!errors[name],
      "aria-describedby": errors[name] ? `${name}-error` : undefined,
      onChange: (
        event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
      ) => {
        setValues((current) => ({ ...current, [name]: event.target.value }));
        setErrors((current) => ({ ...current, [name]: undefined }));
        setSaved(false);
      },
    };
  }
  return (
    <form onSubmit={submit} noValidate className="card company-form">
      <fieldset className="form-fields" disabled={busy}>
        <div className="section-title">
          <span className="section-number">
            <Building2 size={18} />
          </span>
          <div>
            <h2>{company ? "Thông tin công ty" : "Tạo công ty mới"}</h2>
            <p>Giới thiệu nơi làm việc của bạn với ứng viên.</p>
          </div>
        </div>
        <Field name="name" label="Tên công ty *" error={errors.name}>
          <input
            {...props("name")}
            required
            maxLength={200}
            placeholder="Tên công ty của bạn"
          />
        </Field>
        <Field name="website" label="Website" error={errors.website}>
          <input
            {...props("website")}
            type="url"
            placeholder="https://congty.vn"
          />
        </Field>
        <Field name="description" label="Giới thiệu công ty">
          <textarea
            {...props("description")}
            rows={6}
            placeholder="Lĩnh vực hoạt động, văn hóa và đội ngũ…"
          />
        </Field>
        <Field name="address" label="Địa chỉ" error={errors.address}>
          <input {...props("address")} maxLength={255} />
        </Field>
        <div className="two-cols">
          <Field
            name="province"
            label="Tỉnh / thành phố"
            error={errors.province}
          >
            <input {...props("province")} maxLength={255} />
          </Field>
          <Field name="ward" label="Phường / xã" error={errors.ward}>
            <input {...props("ward")} maxLength={255} />
          </Field>
        </div>
        {error && <ErrorMessage message={error} />}
        {saved && (
          <div className="alert success" role="status">
            Đã lưu thông tin công ty.
          </div>
        )}
        <div className="form-actions">
          <span>* Thông tin bắt buộc</span>
          <button className="primary" disabled={busy}>
            {busy ? "Đang lưu…" : company ? "Lưu thông tin" : "Tạo công ty"}
          </button>
        </div>
      </fieldset>
    </form>
  );
}
