import { LoaderCircle } from "lucide-react";
export function LoadingSpinner() {
  return (
    <div className="loading-state" role="status">
      <LoaderCircle className="spinner-icon" size={22} />
      Đang tải dữ liệu…
    </div>
  );
}
