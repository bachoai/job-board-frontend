# Chạy fullstack local — 21/11/2026

Chỉ sửa mã frontend. Backend chạy từ clone nguyên gốc nhánh `feature/AI2`, commit `2239cfd9bad3496659911d4e266e3c2d12be70fa`, tại `logs/backend-ai2`. Không sửa hoặc chuyển nhánh `D:\code\job-board-backend`. `logs/` được Git bỏ qua.

## Khởi động lại trên máy hiện tại

Mở Docker Desktop. Trong PowerShell tại `D:\code\job-board-frontend`:

```powershell
docker start job_board_postgres job_board_rabbitmq job_board_redis job_board_mailpit job_board_ollama
npm.cmd run dev:fullstack
```

Lệnh thứ hai dùng backend đã build và `.env` runtime, chờ API sẵn sàng rồi chạy Vite. Dừng bằng Ctrl+C. Dừng các server đang dùng cổng 3000/5173 trước khi khởi động lại.

| Dịch vụ | Địa chỉ |
| --- | --- |
| Frontend | http://127.0.0.1:5173 |
| Backend API | http://localhost:3000/api |
| Swagger | http://localhost:3000/api-docs |
| Hộp thư Mailpit | http://localhost:8026 |
| PostgreSQL | 127.0.0.1:5435 |
| RabbitMQ | 127.0.0.1:5675 |
| Redis | 127.0.0.1:6382 |
| Ollama | http://127.0.0.1:11434 |

RabbitMQ/Redis dùng cổng riêng vì các dự án khác đang dùng 5673/6381. `scripts/fullstack.override.yml` chứa ánh xạ này. Không dùng `docker compose down -v` vì sẽ xóa dữ liệu.

## Chuẩn bị lại backend runtime khi cần

Chỉ clone khi thư mục chưa tồn tại:

```powershell
git clone --branch feature/AI2 --single-branch https://github.com/tlong1312/job-board-backend.git logs/backend-ai2
Push-Location logs/backend-ai2
npm.cmd ci
Copy-Item .env.example .env
npm.cmd run build
Pop-Location
```

Trong `.env` backend runtime: đặt `RABBITMQ_URL=amqp://127.0.0.1:5675`, `REDIS_HOST=127.0.0.1`, `REDIS_PORT=6382`, `DB_HOST=127.0.0.1`, `DB_PORT=5435`, `MAIL_PORT=1026`, `AI_ENABLED=true`, `EMBEDDING_MODEL=bge-m3`, `EMBEDDING_DIM=1024`. Sinh hai JWT secret ngẫu nhiên riêng thay giá trị mẫu; không commit `.env`.

Máy hiện tại đã có database/schema và model. Máy mới cần khởi tạo theo hướng dẫn backend; script frontend không tự migration, seed hoặc xóa database. Có thể chọn backend khác qua `$env:JOB_BOARD_BACKEND_DIR='đường-dẫn-backend-đã-build'`.

## Kết quả xác minh

- TypeScript + Vite production build đạt.
- 31 unit/API tests và 53/53 kiểm thử Chrome đạt. Lint không có lỗi; còn 9 cảnh báo có sẵn.
- Swagger đủ 41/41 API frontend cần. AI health và tìm kiếm hybrid trả HTTP 200, model `bge-m3`, 1024 chiều.
- Kiểm thử UI với backend/database thật đạt: đăng ký employer/candidate, tạo công ty, đăng tin có kỹ năng React, xem tin của mình, sửa hồ sơ, tải CV PDF, nộp đơn, employer xem CV, cập nhật phỏng vấn và candidate xem lịch sử. Không có `pageerror`.
- Tài khoản/dữ liệu kiểm thử có tên “Kiểm thử”, email miền `example.test`; thư đi vào Mailpit local. ID và ảnh xác minh: `logs/fullstack-live-result.json`, `logs/fullstack-employer-verified.png`, `logs/fullstack-candidate-verified.png`.
- Backend clone có `git status --short` rỗng. Các nhận định API thiếu trong `project-audit.md` là kết quả của bản backend cũ ngày 04/11.

Browser tests dùng interception để bao phủ cả tình huống lỗi; kiểm thử UI với backend thật là bước riêng. Chưa xác nhận toàn bộ thao tác admin và toàn bộ vòng đời phân tích/chấm điểm CV bằng dữ liệu thật.

## Các lỗi đã sửa

1. Trang employer tải được response phân trang mới, gồm tin ở trang sau; lọc đúng chủ sở hữu và giữ tin đóng/khóa. Dùng chung bộ tải với admin, từ chối metadata sai và dừng khi request bị hủy.
2. Upload CV thử lại được sau lỗi API mà không cần chọn lại file. Lỗi xóa CV giữ hộp xác nhận mở thay vì đóng như đã thành công.
3. Lưu hồ sơ giữ token mới nhất nếu API vừa gia hạn phiên.
4. Tải CV bằng Blob xử lý 401 giống API khác: xóa đúng phiên hết hạn và chuyển về đăng nhập; không xóa phiên mới nếu tài khoản đã thay đổi.
5. Bỏ thông báo cũ rằng hệ thống chưa gửi email tự động; backend hiện có hàng đợi email.

```powershell
npm.cmd run build
npm.cmd run lint
npm.cmd test
npm.cmd run test:a
npm.cmd run test:errors
npm.cmd run test:api
npm.cmd run test:ai
npm.cmd run test:e2e -- --workers=3
npm.cmd run check:contract
```
