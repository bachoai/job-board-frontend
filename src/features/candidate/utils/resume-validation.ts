export const MAX_RESUME_BYTES = 5 * 1024 * 1024;
export const validResumeMime = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
export function validateResumeFile(file: { name: string; size: number; type: string }): string {
  if (!/\.(pdf|doc|docx)$/i.test(file.name) || !validResumeMime.has(file.type))
    return "Chỉ chấp nhận tệp PDF, DOC hoặc DOCX.";
  if (file.size > MAX_RESUME_BYTES) return "Tệp CV không được vượt quá 5MB.";
  return "";
}
