# Tích hợp frontend với backend AI2

Đối chiếu yêu cầu bản 90be71d với source backend local 9a3d73f ngày 25/11/2026. Không thay đổi source backend. Ứng dụng gọi API thật; interception chỉ dùng trong kiểm thử.

## Cấu hình

```dotenv
VITE_API_BASE_URL=http://localhost:3000/api
VITE_AI_ENABLED=true
```

Khởi động lại Vite sau khi đổi biến. false ẩn menu, nút và route AI, không phát request AI. Frontend không bật AI thay backend; backend cần AI_ENABLED=true, RabbitMQ, PostgreSQL/pgvector và Ollama có bge-m3 1024 chiều.

## Các luồng

| Màn hình | API tương đối với /api | Hành vi |
| --- | --- | --- |
| /jobs | GET /ai/search | Đọc ?mode=like, fts, vector, hybrid; mặc định hybrid khi thiếu/không hợp lệ. Tối đa 50 kết quả. Dùng hit đầy đủ để vẽ thẻ; chỉ tải GET /jobs/:id với hit thiếu trường mở rộng. Giữ thứ tự, bỏ trùng ID và tin hết hạn; fallback bỏ 404/closed/blocked. |
| /me/resumes | GET /ai/resumes/:id/parsed | Tải khi mở phân tích. Pending tự tải lại sau 3 giây, tối đa 60 giây. Done/error/lỗi HTTP dừng; thử lại tạo chu kỳ mới. Unmount hủy request/timer. |
| /me/recommended-jobs | Parsed rồi GET /ai/resumes/:id/matches | Ưu tiên CV mặc định thuộc tài khoản. Pending tự chờ phân tích, done mới gọi matches. Đổi CV xóa kết quả và hủy công việc cũ. Nút Ứng tuyển ngay mở ApplyDialog. |
| Đơn của employer | GET /applications?jobId=... | Hiển thị/tìm candidateName; fallback mã khi thiếu/rỗng. Chi tiết đơn thiếu tên thì lấy từ danh sách được cấp quyền. |
| Xếp hạng/đánh giá | GET /ai/jobs/:id/applicants | Giữ phân biệt pending, unscored, điểm 0 và unsuitable; không đổi trạng thái nghiệp vụ. |
| Phân tích/chấm lại | POST /ai/resumes/:id/process hoặc /ai/applications/:id/score | Chỉ thực hiện khi người dùng yêu cầu. |

Hit mở rộng gồm companyName và jobType có thể null, salaryMin/salaryMax number|null, deadline YYYY-MM-DD|null; null khác với thiếu thuộc tính. Card không tạo ID chủ sở hữu giả. Search chưa trả currency; UI giữ quy ước VND hiện có, cần BE thêm currency nếu hỗ trợ nhiều loại tiền.

Từ khóa tối đa 300 ký tự ở input và API adapter. HTTP 429 hiển thị “Thử lại sau ít phút”, có thử lại/tìm cơ bản. Tìm công khai không gửi Bearer; endpoint CV/đơn dùng phiên và giữ nguyên phân quyền 401/403.

Xem [kết quả kiểm thử](ai2-verification.md). Các kết luận lỗi backend từ đợt rà soát cũ đã được thay bằng hợp đồng hiện tại; không coi lịch sử là lỗi đang tồn tại.
