import { Search } from "lucide-react";
import { Loading } from "./Feedback";
import { useState } from "react";
import type { ReactNode } from "react";
import { EmptyState } from "./Feedback";
export interface Column<T> {
  key: string;
  title: string;
  render: (row: T) => ReactNode;
}
export function DataTable<T extends { id: number }>({
  rows,
  columns,
  searchText,
  searchLabel = "Tìm kiếm",
  filters,
  filtered = false,
  title = "Danh sách",
  loading = false,
  emptyTitle = "Chưa có dữ liệu",
}: {
  rows: T[];
  columns: Column<T>[];
  searchText: (row: T) => string;
  searchLabel?: string;
  filters?: ReactNode;
  filtered?: boolean;
  title?: string;
  loading?: boolean;
  emptyTitle?: string;
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const matched = rows.filter((row) =>
    searchText(row)
      .toLocaleLowerCase("vi")
      .includes(query.trim().toLocaleLowerCase("vi")),
  );
  const pages = Math.max(1, Math.ceil(matched.length / pageSize));
  const current = Math.min(page, pages);
  const visible = matched.slice((current - 1) * pageSize, current * pageSize);
  return (
    <div className="table-card">
      <div className="table-heading">
        <div>
          <h2>
            {title} <span className="count-pill">{rows.length}</span>
          </h2>
          <p>Quản lý và theo dõi thông tin trong danh sách.</p>
        </div>
        <span className="table-heading-label">Dữ liệu hiện tại</span>
      </div>
      <div className="table-toolbar">
        <label className="search-field">
          <Search size={17} aria-hidden="true" />
          <span className="sr-only">{searchLabel}</span>
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder={searchLabel}
          />
        </label>
        <div className="table-filters">{filters}</div>
      </div>
      {loading ? (
        <Loading />
      ) : visible.length ? (
        <div
          className="table-scroll"
          tabIndex={0}
          role="region"
          aria-label="Bảng dữ liệu, có thể cuộn ngang"
        >
          <table>
            <caption className="sr-only">{searchLabel}</caption>
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column.key} scope="col">
                    {column.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr key={row.id}>
                  {columns.map((column) => (
                    <td key={column.key}>{column.render(row)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title={query || filtered ? "Không có kết quả phù hợp" : emptyTitle}
        >
          <p>Thử thay đổi bộ lọc hoặc tải lại dữ liệu.</p>
        </EmptyState>
      )}
      <p className="table-scroll-hint">
        Vuốt ngang để xem thêm cột và thao tác.
      </p>
      <div className="pagination">
        <span>
          {matched.length} kết quả · Trang {current}/{pages}
        </span>
        <div>
          <label>
            Số dòng{" "}
            <select
              aria-label="Số dòng mỗi trang"
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
            >
              <option>10</option>
              <option>20</option>
              <option>50</option>
            </select>
          </label>
          <button
            className="secondary"
            aria-label="Trang trước"
            disabled={current === 1}
            onClick={() => setPage(current - 1)}
          >
            ←
          </button>
          <button
            className="secondary"
            aria-label="Trang sau"
            disabled={current === pages}
            onClick={() => setPage(current + 1)}
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}
