/** A job may receive applications only while open and before its deadline. */
export function isOpenJob(job: { status: string; deadline: string | null }, now = new Date()) {
  const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return job.status === "open" && (!job.deadline || job.deadline.slice(0, 10) >= localDate);
}
