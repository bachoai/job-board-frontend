# Kiểm thử trên dữ liệu database có sẵn

Ngày kiểm thử 25/11/2026. Chrome và API thật, không interception, không seed, không đăng ký tài khoản hoặc tạo tin/đơn/CV. Đăng nhập tài khoản có sẵn tạo refresh token và cập nhật bộ đếm/cache thông thường. So sánh hash trước và sau của các bảng nghiệp vụ xác nhận dữ liệu không đổi.

## Môi trường

Server hiện tại cổng 3000/5173 dùng job_board_db. File .env backend trỏ job_board_practice_db nên kiểm thử database này trên server riêng 3001/5174. Server practice không dùng chung Redis cache với server chính; phạm vi này chưa xác nhận Redis/rate limit trên practice. Không sửa .env hay schema.

| Database | Users | Công ty | Tin | Đơn | CV | Job embeddings | AI scores |
| --- | --- | --- | --- | --- | --- | --- | --- |
| job_board_db | 17 | 6 | 13 | 11 | 4 | 3 | 3 |
| job_board_practice_db | 10 | 3 | 10 | 8 | 1 | missing | missing |

## Kết quả

| Database | Đạt | Không đạt | Bỏ qua |
| --- | --- | --- | --- |
| job_board_db | 23 | 1 | 1 |
| job_board_practice_db | 19 | 4 | 0 |

Tổng cộng 42 đạt, 5 không đạt, 1 bỏ qua. Năm kiểm tra không đạt phản ánh hai nguyên nhân, không phải năm lỗi độc lập.

## Lỗi xác nhận

1. job_board_practice_db thiếu bảng job_embeddings và application_scores. AI search vector/hybrid trả HTTP 500; tìm kiếm mặc định hybrid trên UI báo lỗi. UI hiển thị thông báo và chuyển Tìm kiếm cơ bản thành công, không trắng trang. Search like/fts vẫn hoạt động. Đây là vấn đề sẵn sàng schema AI của database hiện có; không tự tạo migration trong đợt kiểm thử.
2. job_board_db có CV id=1 nhưng file vật lý không tồn tại trong uploads của backend hiện chạy; GET /resumes/1/file bằng admin trả 404. CV id=2,3,4 trả 200, file có trên đĩa và dữ liệu bắt đầu bằng %PDF. Practice có một CV, tải được.

## Trường hợp đạt

- Danh sách công khai khớp chính xác ID tin open, còn hạn trong SQL; admin thấy đầy đủ tin.
- Danh sách đơn employer khớp ID, tên ứng viên và trạng thái trong DB; chi tiết và số dòng lịch sử khớp.
- Employer khác không được xem đơn của chủ tin khác trên practice: 403.
- Candidate chỉ nhận đơn và CV thuộc tài khoản đang đăng nhập.
- Tìm kiếm AI like/fts/vector/hybrid trên job_board_db chỉ trả tin đủ điều kiện và có trường mở rộng.
- Các CV đã phân tích có sẵn trong job_board_db: gợi ý loại tin đóng/hết hạn và tin đã ứng tuyển.
- Điểm và trạng thái AI API khớp application_scores đã lưu, trong sai số làm tròn 0.0011.
- UI hiển thị tên ứng viên và chi tiết; tìm theo tên, từ khóa không có kết quả và cả bốn bộ lọc new/viewed/interview/rejected khớp bản ghi practice.
- Trang đơn/CV candidate và giao diện mobile chạy trên dữ liệu thật, không tràn ngang, không có pageerror.
- Hash toàn bộ bản ghi users, companies, jobs, skills, job_skills, applications, application_status_history, resumes và các bảng AI hiện diện không đổi sau kiểm thử; không tính bảng phiên/cache.

## Tài khoản và giới hạn

Hai tài khoản mẫu id=2 employer, id=3 candidate của job_board_db đang is_active=false. Đăng nhập trả 403 đúng; không mở khóa hay đổi mật khẩu. Chọn employer id=4 và candidate đang hoạt động có sẵn để tiếp tục. Bỏ qua đăng nhập employer thứ hai đang hoạt động ở job_board_db vì không có tài khoản mẫu phù hợp; phân quyền chéo employer đã kiểm tra ở practice.

Đợt này chỉ đọc dữ liệu nghiệp vụ; không xác nhận thao tác tạo/sửa/xóa, nộp/rút đơn hay upload mới bằng dữ liệu có sẵn. Bộ kiểm thử tạo dữ liệu mới trước đó là một đợt riêng.

## Bằng chứng

Chi tiết máy đọc được: logs/existing-data/results.json. Ảnh trong logs/existing-data gồm public/search, applicants/detail, candidate applications/resumes và mobile cho cả hai database; practice có ảnh search-error, basic-search-fallback và practice-applicant-filters. Các tệp logs bị Git bỏ qua; không chứa token/password trong JSON báo cáo.

## Chi tiết testcase

| Database | Kiểm tra | Kết quả |
| --- | --- | --- |
| job_board_db | locked existing account denied 2 | pass |
| job_board_db | locked existing account denied 3 | pass |
| job_board_db | login active existing admin | pass |
| job_board_db | login active existing employer | pass |
| job_board_db | login active existing employer2 | skipped |
| job_board_db | login active existing candidate | pass |
| job_board_db | public jobs exactly match open and unexpired DB rows | pass |
| job_board_db | admin sees all existing jobs | pass |
| job_board_db | employer application names/status match database | pass |
| job_board_db | candidate sees only their own applications and CVs | pass |
| job_board_db | employer detail/history match existing application | pass |
| job_board_db | AI search like uses existing eligible jobs | pass |
| job_board_db | AI search fts uses existing eligible jobs | pass |
| job_board_db | AI search vector uses existing eligible jobs | pass |
| job_board_db | AI search hybrid uses existing eligible jobs | pass |
| job_board_db | AI schema ready for CV parsing and scoring | pass |
| job_board_db | existing parsed CV recommendations exclude applied/expired jobs | pass |
| job_board_db | existing CV files are downloadable with authorization | fail |
| job_board_db | AI applicant scores match persisted database values | pass |
| job_board_db | UI public cards and real search | pass |
| job_board_db | UI existing applicants names/filter/detail | pass |
| job_board_db | UI candidate existing applications and CVs | pass |
| job_board_db | UI mobile existing public data fits viewport | pass |
| job_board_db | no browser JavaScript errors | pass |
| job_board_db | existing business data unchanged after tests | pass |
| job_board_practice_db | login active existing admin | pass |
| job_board_practice_db | login active existing employer | pass |
| job_board_practice_db | login active existing employer2 | pass |
| job_board_practice_db | login active existing candidate | pass |
| job_board_practice_db | public jobs exactly match open and unexpired DB rows | pass |
| job_board_practice_db | admin sees all existing jobs | pass |
| job_board_practice_db | employer application names/status match database | pass |
| job_board_practice_db | candidate sees only their own applications and CVs | pass |
| job_board_practice_db | employer detail/history match existing application | pass |
| job_board_practice_db | other employer cannot read application detail | pass |
| job_board_practice_db | AI search like uses existing eligible jobs | pass |
| job_board_practice_db | AI search fts uses existing eligible jobs | pass |
| job_board_practice_db | AI search vector uses existing eligible jobs | fail |
| job_board_practice_db | AI search hybrid uses existing eligible jobs | fail |
| job_board_practice_db | AI schema ready for CV parsing and scoring | fail |
| job_board_practice_db | existing CV files are downloadable with authorization | pass |
| job_board_practice_db | UI public cards and real search | fail |
| job_board_practice_db | UI existing applicants names/filter/detail | pass |
| job_board_practice_db | UI candidate existing applications and CVs | pass |
| job_board_practice_db | UI mobile existing public data fits viewport | pass |
| job_board_practice_db | no browser JavaScript errors | pass |
| job_board_practice_db | existing business data unchanged after tests | pass |
| job_board_practice_db | UI candidate name search, no results and all four status filters match existing rows | pass |
