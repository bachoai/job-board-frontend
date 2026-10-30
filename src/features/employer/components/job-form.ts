export const jobTypes = {
  full_time: "Toàn thời gian",
  part_time: "Bán thời gian",
  internship: "Thực tập",
  contract: "Hợp đồng",
};
export const jobLevels = {
  intern: "Thực tập sinh",
  junior: "Junior",
  middle: "Middle",
  senior: "Senior",
};
export interface JobForm {
  companyId: string;
  title: string;
  description: string;
  location: string;
  province: string;
  jobType: string;
  level: string;
  salaryMin: string;
  salaryMax: string;
  deadline: string;
}
export const emptyForm: JobForm = {
  companyId: "",
  title: "",
  description: "",
  location: "",
  province: "",
  jobType: "full_time",
  level: "",
  salaryMin: "",
  salaryMax: "",
  deadline: "",
};
export function today() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
export function validateJob(
  form: JobForm,
  originalDeadline?: string | null,
): Partial<Record<keyof JobForm, string>> {
  const errors: Partial<Record<keyof JobForm, string>> = {};
  if (
    !form.companyId ||
    !Number.isSafeInteger(Number(form.companyId)) ||
    Number(form.companyId) < 1
  )
    errors.companyId = "Vui lòng chọn công ty đăng tuyển.";
  if (!form.title.trim()) errors.title = "Vui lòng nhập tiêu đề tuyển dụng.";
  else if (form.title.trim().length > 150)
    errors.title = "Tiêu đề tối đa 150 ký tự.";
  if (form.location.trim().length > 150)
    errors.location = "Địa điểm tối đa 150 ký tự.";
  if (form.province.trim().length > 80)
    errors.province = "Tỉnh / thành phố tối đa 80 ký tự.";
  if (!Object.hasOwn(jobTypes, form.jobType))
    errors.jobType = "Hình thức làm việc không hợp lệ.";
  if (form.level && !Object.hasOwn(jobLevels, form.level))
    errors.level = "Cấp bậc không hợp lệ.";
  for (const key of ["salaryMin", "salaryMax"] as const) {
    if (
      form[key] !== "" &&
      (!/^\d+$/.test(form[key]) || Number(form[key]) > 2147483647)
    )
      errors[key] = "Nhập số nguyên từ 0 đến 2.147.483.647.";
  }
  if (
    form.salaryMin !== "" &&
    form.salaryMax !== "" &&
    Number(form.salaryMax) < Number(form.salaryMin)
  )
    errors.salaryMax = "Lương tối đa phải lớn hơn hoặc bằng lương tối thiểu.";
  if (
    form.deadline &&
    form.deadline !== originalDeadline &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(form.deadline) ||
      Number.isNaN(Date.parse(form.deadline)) ||
      new Date(form.deadline).toISOString().slice(0, 10) !== form.deadline ||
      form.deadline < today())
  )
    errors.deadline = "Hạn nộp phải là ngày hợp lệ từ hôm nay trở đi.";
  return errors;
}
export function jobPayload(form: JobForm) {
  return {
    companyId: Number(form.companyId),
    title: form.title.trim(),
    jobType: form.jobType,
    currency: "VND",
    ...(form.description.trim()
      ? { description: form.description.trim() }
      : {}),
    ...(form.location.trim() ? { location: form.location.trim() } : {}),
    ...(form.province.trim() ? { province: form.province.trim() } : {}),
    ...(form.level ? { level: form.level } : {}),
    ...(form.salaryMin !== "" ? { salaryMin: Number(form.salaryMin) } : {}),
    ...(form.salaryMax !== "" ? { salaryMax: Number(form.salaryMax) } : {}),
    ...(form.deadline ? { deadline: form.deadline } : {}),
  };
}
