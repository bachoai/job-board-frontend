export function formatDate(value: string | null | undefined, time = false) {
  if (!value) return "—";
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat(
        "vi-VN",
        time
          ? {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }
          : { day: "2-digit", month: "2-digit", year: "numeric" },
      ).format(date);
}
export function routeId(value?: string) {
  return value &&
    /^\d+$/.test(value) &&
    Number.isSafeInteger(Number(value)) &&
    Number(value) > 0
    ? Number(value)
    : null;
}
