# Kiểm thử frontend AI2

Thực hiện đêm 24 rạng sáng 25/11/2026 trên frontend D:\code\job-board-frontend, đối chiếu source backend 9a3d73f. Source backend không thay đổi. Đã khôi phục node_modules backend bằng npm ci để build và chạy kiểm thử.

## Kết quả

| Kiểm tra | Kết quả |
| --- | --- |
| npm test | 32/32 unit/API tests đạt |
| npm run build | TypeScript và Vite production build đạt |
| npm run lint | Exit 0, 9 cảnh báo có sẵn |
| Playwright Chrome | 67/67 đạt; bài tên ứng viên được chạy lại đạt sau sửa giữ tên khi đổi trạng thái |
| npm run check:contract | 41/41 route Swagger hiện diện |
| npm run test:live-ai2 không interception | Đạt sau bước chuẩn bị embedding tin kiểm thử |

## Testcase theo yêu cầu

| Phần | Các trường hợp đã kiểm tra |
| --- | --- |
| FE-1 | Tên thật trên danh sách/chi tiết, tên từ API danh sách khi detail thiếu, fallback mã, giữ tên sau cập nhật trạng thái; không chặn chi tiết nếu enrichment lỗi. |
| FE-2 | Pending sang done không F5 ở phân tích/gợi ý, dừng sau 60 giây, retry tạo chu kỳ mới, dừng khi error, hủy khi unmount/đổi CV và hủy matches đang chạy. |
| FE-3 | Mở ApplyDialog từ gợi ý, gửi đúng jobId/resumeId, điều hướng đơn đã tạo. Luồng thật thấy đơn ở danh sách, employer xem CV/AI và candidate thấy lịch sử phỏng vấn. |
| FE-4 | Rich hit không gọi chi tiết, null hợp lệ không kích hoạt fallback, legacy vẫn hoạt động, response hỗn hợp chỉ tải hit thiếu; thứ tự, lọc và phân trang; bỏ tin hết hạn/404 trong fallback. |
| FE-5 | like/fts/vector/hybrid qua URL, mode sai về hybrid. |
| Lỗi và cấu hình | HTTP 429 thân thiện, giới hạn q=300 ở input/API, AI tắt không có nút/menu/request AI, 401/403 không vượt quyền, mobile không tràn ngang. |

## Bằng chứng chạy backend thật

Dùng PostgreSQL job_board_db có schema AI, RabbitMQ, Redis, Ollama bge-m3 và Mailpit local. Script không dùng page.route hay response giả. Kết quả logs/ai2-live-result.json: companyId=6, jobId=13, applicationId=11; errors=[]; các bước đạt gồm:

1. Đăng ký employer/candidate, tạo công ty, đăng tin React có kỹ năng.
2. Upload PDF thật tạo bằng Chrome; RabbitMQ xử lý, giao diện hiển thị kỹ năng React không refresh.
3. Mở gợi ý, thấy tin kiểm thử và nút ứng tuyển; gửi hồ sơ qua ApplyDialog.
4. Đơn xuất hiện ở danh sách ứng viên; employer thấy tên thật và điểm AI 93%, CV tải được bằng endpoint xác thực.
5. Employer chuyển phỏng vấn; candidate nhìn thấy ghi chú/lịch sử thật.
6. Tìm công khai mode=like hiển thị hit mở rộng và không phát request GET /jobs/:id.

Ảnh trong logs/: ai2-live-resume-analysis.png, ai2-live-recommendations.png, ai2-live-employer-ai.png, ai2-live-employer-verified.png, ai2-live-candidate-verified.png, ai2-live-search.png. Logs bị Git bỏ qua, không chứa password/token trong báo cáo JSON.

## Giới hạn được phát hiện

- .env backend hiện trỏ job_board_practice_db thiếu cột AI và kiểu vector. Lần thử đầu upload thành công nhưng worker không lưu được phân tích. Chạy lại trên job_board_db đã có schema; không sửa/xóa schema hay .env practice.
- JobsService hiện chưa enqueue embedding khi tạo tin. Script dùng AiJobsService.embedJobs cho đúng tin kiểm thử trước khi tìm gợi ý. Luồng sau chuẩn bị này đạt; tự động xuất hiện trong gợi ý ngay sau đăng tin vẫn cần backend bổ sung enqueue. Không sửa source backend trong nhiệm vụ frontend.
- Backend lưu fileName do hệ thống tạo thay vì tên upload gốc; test live dùng bản ghi CV được trả về. Frontend không giả tên gốc.
- API chi tiết đơn chưa có candidateName, frontend bổ sung từ danh sách có quyền; nếu bổ sung lỗi vẫn giữ chi tiết và fallback mã.
- Search chưa trả currency, UI tiếp tục quy ước VND; cần hợp đồng bổ sung nếu có đa tiền tệ.

## Chạy lại

Chạy npm test, npm run build, npm run lint và npm run test:e2e -- --workers=3. Backend thật và frontend phải đang chạy trước npm run test:live-ai2. Lệnh live tạo dữ liệu local example.test và giữ lại để xem báo cáo; không chạy trên môi trường thật. Chọn backend bằng JOB_BOARD_BACKEND_DIR và database đã có schema bằng AI2_TEST_DB (mặc định job_board_db); runtime backend cũng phải dùng đúng database này.
