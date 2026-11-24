# Chạy frontend và backend AI2 local

Frontend ở D:\code\job-board-frontend. Source backend đã đối chiếu ở D:\code\job-board-backend, commit 9a3d73f (có hợp đồng search mở rộng theo yêu cầu bản 90be71d). Clone cũ logs/backend-ai2 không có search mở rộng; nếu dùng clone này frontend sẽ chạy fallback.

## Chuẩn bị

Mở Docker Desktop, khởi động các container job_board_postgres, job_board_rabbitmq, job_board_redis, job_board_mailpit và job_board_ollama đã có trên máy. Không xóa volume hoặc seed lại DB đang sử dụng.

Backend cần npm ci, npm run build, .env local hợp lệ, schema AI và model bge-m3. Dùng cổng PostgreSQL 5435, RabbitMQ 5675, Redis 6382, Mailpit SMTP 1026 và Ollama 11434 theo container hiện tại. Cấu hình AI_ENABLED=true ở backend, OLLAMA_URL=http://127.0.0.1:11434, EMBEDDING_MODEL=bge-m3, EMBEDDING_DIM=1024. Bảo quản JWT secret và mật khẩu trong .env, không commit.

Frontend .env:

```dotenv
VITE_API_BASE_URL=http://localhost:3000/api
VITE_AI_ENABLED=true
```

Sau khi backend build xong, PowerShell tại frontend:

```powershell
$env:JOB_BOARD_BACKEND_DIR='D:\code\job-board-backend'
npm.cmd run dev:fullstack
```

Hoặc chạy backend riêng bằng npm run start:prod rồi npm run dev ở frontend. Kiểm tra entry build thực tế dist/main.js hoặc dist/src/main.js; dev:fullstack hỗ trợ cả hai. Frontend http://127.0.0.1:5173, API http://localhost:3000/api, Swagger /api-docs. Không chạy hai backend cùng cổng.

## Kiểm thử

```powershell
npm.cmd test
npm.cmd run build
npm.cmd run lint
npm.cmd run test:e2e -- --workers=3
npm.cmd run check:contract
```

npm test chạy toàn bộ unit/API regression, bao gồm AI. Playwright dùng Chrome và Vite, có interception để thử cả lỗi; luồng backend thật phải chạy riêng. Tắt VITE_AI_ENABLED và khởi động lại Vite để thử chế độ không AI.

Xem [kết quả lần chạy hiện tại](ai2-verification.md). Kết quả live ngày 21/11 trong logs/fullstack-live-result.json là lịch sử của backend clone cũ, không dùng để chứng minh FE-7 của bản mới.

## Luồng thật AI2

`npm run test:live-ai2` tạo dữ liệu kiểm thử example.test và lưu bằng chứng trong logs/ai2-live-*. Backend phải chạy cùng database (mặc định job_board_db, chọn bằng AI2_TEST_DB) có schema AI; .env hiện có thể trỏ practice DB thiếu schema AI. JOB_BOARD_BACKEND_DIR chọn backend đã build. Script tạo embedding cho riêng tin kiểm thử qua service thật vì JobsService hiện chưa enqueue khi tạo tin; không che giới hạn này. Không chạy script trên production. Xem ai2-verification.md trước khi chạy.
