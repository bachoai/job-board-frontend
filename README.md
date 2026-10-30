# Jobboard Frontend — Thành viên A + B

Frontend React 19, TypeScript, Vite và React Router của hệ thống Job Board. Phần B (nhà tuyển dụng và quản trị) được giữ lại từ dự án frontend ban đầu; phần A (khách và ứng viên) đã tích hợp vào cùng ứng dụng theo tài liệu phân công.

**Chi tiết 11 trang A, API, các file thay đổi và hướng dẫn kiểm tra:** [README_A.md](./README_A.md).

**Chế độ dữ liệu thật:** Các trang `/jobs`, `/companies`, tìm kiếm, chi tiết tin và ứng tuyển dùng API NestJS/PostgreSQL, không sử dụng dữ liệu minh họa. Nếu backend trả lỗi HTTP 500, frontend hiển thị lỗi thật, không tự sinh tin tuyển dụng.

## Cài đặt

```bash
npm ci
cp .env.example .env
npm run dev
```

Trên Windows PowerShell, dùng `Copy-Item .env.example .env`. Cần chạy backend NestJS riêng ở `http://localhost:3000/api`; frontend ở địa chỉ mà Vite in ra (mặc định `http://localhost:5173`).

## Các khu vực chính

| Khu vực | Route | Phân quyền |
|---|---|---|
| Đăng ký/đăng nhập | `/register`, `/login` | Khách |
| Tìm việc và công ty | `/jobs`, `/jobs/:id`, `/companies`, `/companies/:id` | Công khai |
| Hồ sơ, CV và đơn đã nộp | `/me`, `/me/resumes`, `/me/applications`, `/me/applications/:id` | Candidate |
| Tin và hồ sơ tuyển dụng | `/employer/company`, `/employer/jobs`, `/employer/jobs/new`, `/employer/jobs/:id/edit`, `/employer/jobs/:id/applications`, `/employer/applications/:id`, `/employer/applications` | Employer |
| Quản lý hệ thống | `/admin/users`, `/admin/jobs`, `/admin/companies` | Admin |

Phần A và B chia thư mục `src/features/` theo role nhưng dùng chung `AuthProvider`, bộ gọi API và các component bảng/form/hộp xác nhận. Không có module AI trong bản này.

## Kiểm tra

```bash
npm run build
npm run lint
npm test
npm run test:a
npm run test:e2e
```

Bắt buộc kiểm tra với backend thực tế và cơ sở dữ liệu trước khi bàn giao nhóm. Một số endpoint có giới hạn được mô tả trong README_A.md.

## Lưu ý về lỗi PostgreSQL `job.province`

Backend đi kèm gọi cột `jobs.province` trong TypeORM và full-text search. Nếu database hiện tại chưa có cột, **GET `/api/jobs` vẫn lỗi HTTP 500 dù frontend đã dùng dữ liệu thật**. ZIP frontend này không sửa backend hay PostgreSQL. Backend ZIP đã có migration `db/migrations/001_add_province_ward.sql`; người quản lý database cần áp dụng migration vào đúng database trước khi thử lại các API. Công ty cũng cần có các cột `province` và `ward`.

Để kiểm tra, mở `http://localhost:3000/api/jobs?page=1&limit=9` và `http://localhost:3000/api/companies` trên trình duyệt; hai API phải trả dữ liệu thành công. Nếu không, kiểm tra log backend / database.

Kiểm thử phần giao tiếp dữ liệu thật (mock HTTP trong test, không thay backend): `npm run test:api`.
