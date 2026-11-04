# Tích hợp AI frontend

Triển khai trên nhánh frontend `feature/ai`, đối chiếu backend `feature/AI2` tại commit `a2b6c20`. Không sửa mã nguồn backend. Dữ liệu giả chỉ có trong kiểm thử; giao diện ứng dụng gọi API thật qua `src/lib/api.ts`.

## Bật giao diện

```dotenv
VITE_API_BASE_URL=http://localhost:3000/api
VITE_AI_ENABLED=true
```

Khởi động lại Vite sau khi đổi biến môi trường. Đặt `VITE_AI_ENABLED=false` để ẩn chức năng, menu, route AI và ngừng các request AI. Cờ frontend không bật module backend.

## Màn hình và API

Các đường dẫn bên dưới tương đối với `/api`.

| Màn hình | API | Hành vi |
| --- | --- | --- |
| `/jobs` | `GET /ai/search?q=...&mode=hybrid&limit=50` | Tìm bằng câu tự nhiên; lấy chi tiết thật qua `GET /jobs/:id`, giữ thứ tự AI, bỏ tin đã xóa/đóng/hết hạn. Bộ lọc và phân trang chạy trên tập kết quả. Điểm tìm kiếm không đổi thành phần trăm. Có nút chuyển sang tìm kiếm thường khi lỗi. |
| `/me/resumes` | `GET /ai/resumes/:id/parsed` | Mở phân tích từng CV: kỹ năng chuẩn hóa/được đề cập, số năm, cấp độ, tỉnh, vị trí mong muốn và thời gian phân tích. Hiển thị riêng trạng thái chờ/lỗi; làm mới theo yêu cầu. |
| Phân tích CV | `POST /ai/resumes/:id/process` | Chỉ gọi khi người dùng yêu cầu phân tích lại; tải lại kết quả đã lưu sau khi thành công. Upload bình thường không gọi POST này. |
| `/me/recommended-jobs` | `GET /ai/resumes/:id/matches?limit=10` | Chọn CV thuộc tài khoản, ưu tiên CV mặc định; kiểm tra parsed trước khi tìm. Đổi CV hủy request cũ và xóa kết quả cũ. Hiển thị điểm, nhãn, kỹ năng khớp/thiếu và liên kết tin. |
| `/employer/jobs/:id/applications` | `GET /ai/jobs/:id/applicants` | Chuyển giữa danh sách thường và xếp hạng AI; tìm kiếm, lọc đánh giá, sắp xếp điểm. Giữ riêng trạng thái đang chờ/chưa chấm được. |
| `/employer/applications/:id?jobId=...` | `GET /ai/jobs/:jobId/applicants` | Lấy đánh giá ứng viên từ danh sách mà employer có quyền: điểm, cosine, tỷ lệ kỹ năng, chênh cấp độ, kỹ năng, lý do, thời gian chấm. |
| Chi tiết ứng tuyển | `POST /ai/applications/:id/score` | Chấm lại theo thao tác rõ ràng rồi tải lại danh sách đánh giá. Không tự thay đổi trạng thái đơn hoặc từ chối ứng viên. |

Danh sách CV dùng `GET /resumes`, lọc thêm `userId` theo phiên hiện tại. Backend AI2 không có `/resumes/users/me`. Search công khai không gửi Bearer; các API AI còn lại dùng phiên hiện tại. Lỗi 401/403 không được xử lý bằng endpoint thay thế để vượt quyền.

Điểm phù hợp hợp lệ trong `[0, 1]` được đổi thành phần trăm; `0` là điểm hợp lệ. Nhãn lấy từ backend: `suitable` → Phù hợp cao, `review` → Cần xem xét, `unsuitable` → Ít phù hợp. `pending`, `unscored` và điểm thiếu không được coi là ít phù hợp. Điểm chỉ là thông tin hỗ trợ quyết định.

## Tệp triển khai

- `src/features/ai/`: types, API, cờ cấu hình, tiện ích ánh xạ, hook thao tác, CSS và các component phân tích CV, điểm, kỹ năng, bảng xếp hạng, đánh giá đơn.
- `src/features/candidate/pages/RecommendedJobsPage.tsx`: trang gợi ý mới; `ResumesPage.tsx` gắn phân tích; `candidate.api.ts` tải CV theo hợp đồng AI2 và lọc CV của tài khoản.
- `src/features/public/pages/JobsPage.tsx`: tìm kiếm AI và tìm kiếm thường; `public.api.ts` bỏ endpoint tìm kiếm cũ không tồn tại; `JobDetailPage.tsx` khai báo kiểu resource rõ ràng.
- `src/features/employer/pages/{ApplicationsPage,JobApplicationsPage,ApplicationDetailPage}.tsx`: liên kết có ngữ cảnh job, bảng AI và đánh giá chi tiết, thông báo giới hạn quyền.
- `src/layouts/CandidateLayout.tsx`, `src/app/router/AppRouter.tsx`, `src/App.tsx`: menu, route theo quyền và CSS. Menu AI trên điện thoại chia hai cột.
- `src/lib/api.ts`: hỗ trợ timeout riêng từng request. Mặc định Axios vẫn 20 giây; tìm kiếm AI 90 giây, xử lý CV 120 giây, chấm lại 180 giây. Các luồng có AbortSignal và hủy khi rời trang/đổi đối tượng.
- `src/components/common/useResource.ts`: không hiển thị dữ liệu/lỗi của loader cũ khi đổi đối tượng; `DataTable.tsx` đặt lại trang khi đổi bộ lọc ngoài bảng.
- `.env.example`, `package.json`, `playwright.config.ts`, `tests/ai*.{ts,mjs}`, `tests/helpers/load-api.mjs`, `src/features/ai/utils/ai.test.mjs`: cấu hình và kiểm thử. Các test cũ được cập nhật hợp đồng API/liên kết.

## Backend cần hoàn thiện

Các mục sau được ghi nhận từ mã nguồn AI2; frontend không tự sửa quyền hoặc cấu trúc DB.

1. `GET /applications/:id` hiện chỉ cấp role candidate. Employer nhận 403 nên không thể xem thư giới thiệu, CV, lịch sử hoặc đổi trạng thái qua luồng chi tiết hiện tại. Cần backend cho employer truy cập với kiểm tra quyền sở hữu tin. Frontend vẫn có thể hiển thị phần AI từ API applicants có kiểm tra chủ tin.
2. `GET /resumes/:id/file` chỉ cho chủ CV/admin. Cần backend cho employer tải CV gắn với đơn của tin thuộc mình, nếu đây là nghiệp vụ mong muốn. Frontend không dùng URL upload để vượt quyền.
3. `GET /resumes` truyền `currentUser.userId` trong khi JWT guard tạo `req.user.id`. Giá trị undefined có thể khiến service trả CV của mọi tài khoản. Cần sửa backend sang ID đúng và kiểm tra quyền phía server. Lọc thêm ở frontend chỉ ngăn hiển thị CV ngoài tài khoản, không khắc phục rò rỉ response của server.
4. Metadata `GET /resumes/:id` đang public và thư mục `/uploads` được phục vụ tĩnh, gồm cả CV. Cần giới hạn metadata và chỉ phục vụ công khai tài nguyên phù hợp như logo; CV phải đi qua endpoint có kiểm tra quyền.
5. AI cần `AI_ENABLED=true`, Ollama cùng model tương thích (mặc định `bge-m3`, vector 1024 chiều), RabbitMQ và PostgreSQL có pgvector. Cần chạy schema AI đúng cho DB đang dùng và tạo embeddings cho tin/CV; mount init SQL không chạy lại tự động với volume cũ.
6. `ai-init.sql` của nhánh hiện tại tạo các cột phân tích CV và `job_embeddings` nhưng chưa định nghĩa `application_scores`, dù các service chấm điểm truy vấn bảng này. Cần backend bổ sung migration/schema chính thức cho bảng điểm trước khi dùng xếp hạng/chấm lại.

## Kiểm chứng và môi trường thực tế

- Build frontend thành công. Lint thành công với 9 cảnh báo có sẵn tại các thành phần cũ.
- 25 kiểm thử Node thành công: validation tin/CV, lỗi API, ánh xạ điểm/nhãn, thứ tự và trạng thái chấm, hợp đồng API, timeout, CV thuộc tài khoản.
- 48 kiểm thử Playwright thành công trong lần chạy toàn bộ, gồm 15 bài AI/cờ tắt. Có kiểm tra mobile, thứ tự tìm kiếm, bỏ tin hết hạn, hủy request khi đổi CV, lỗi và thử lại, quyền employer, không tự đổi trạng thái đơn và upload không bị AI chặn.
- Kiểm thử browser dùng interception trong thư mục `tests/`; chưa xác nhận kết quả AI dương tính với Ollama/DB thật.
- Khi tích hợp frontend ban đầu, AI backend chưa bật. Theo yêu cầu bật AI tiếp theo của người dùng, đã cấu hình `.env` local backend: `AI_ENABLED=true`, `OLLAMA_URL=http://127.0.0.1:11434`, model `bge-m3`, 1024 chiều, RabbitMQ cổng 5675; khởi động lại backend. Không sửa mã nguồn backend.
- Đã sao lưu DB trong `logs/backups/job-board-before-ai.dump`, cài pgvector cho container PostgreSQL hiện có, cập nhật extension lên 0.8.7, chạy `ai-init.sql` và tạo bảng `application_scores` tương thích với các truy vấn service. Script bổ sung local là `logs/ai-scores-init.sql` (bỏ qua Git); vẫn cần migration chính thức của backend cho môi trường khác.
- Đã chạy Ollama bằng container `job_board_ollama`, lưu model trong volume `job_board_ollama`. Cấu hình khởi chạy local: `docker compose -p job-board-ai -f logs/ai-services.yml up -d` (tệp local bỏ qua Git). PostgreSQL hiện được cài thêm package trong container; nếu xóa/tạo lại container từ image `postgres:16` thì phải cài lại package hoặc dùng image pgvector phù hợp.
- Kiểm tra thật ngày 04/11/2026: `GET /api/ai/health` trả 200 với `{ok:true,model:"bge-m3",dimensions:1024}`; tìm kiếm `mode=hybrid` và `mode=fts` trả 200. Queue `ai.embedding` có một consumer đang kết nối. Frontend tiếp tục trả 200 tại cổng 5173.
- Database hiện có 0 tin tuyển dụng, 0 đơn ứng tuyển; tìm kiếm trả mảng rỗng đúng dữ liệu. Chưa xác nhận luồng gợi ý/xếp hạng với tin, CV và đơn thật sau khi bật AI; không tạo thêm dữ liệu mẫu hoặc tự xử lý lại các CV hiện có trong bước bật dịch vụ.

```powershell
npm run build
npm run lint
npm test
npm run test:a
npm run test:errors
npm run test:ai
npm run test:api
npm run test:e2e
```

Ảnh kiểm tra nằm trong `test-results/` (bỏ qua Git): tìm kiếm desktop, phân tích CV, xếp hạng trên tablet, gợi ý trên điện thoại và đánh giá chi tiết.
