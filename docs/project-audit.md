# Kết quả rà soát Job Board — 04/11/2026

## Kết luận

Frontend chạy và build được, AI health/tìm kiếm hybrid hoạt động trên máy local. Hệ thống **chưa hoàn chỉnh để triển khai**: backend `feature/AI2` thiếu API frontend cần, có lỗi phân quyền CV, lỗi truyền thông tin người dùng và thiếu nối luồng kỹ năng/embedding khi đăng tin.

Phạm vi kiểm tra: router/guard/session, API và DTO, module Public/Candidate/Employer/Admin/AI, luồng CV/ứng tuyển, cấu hình chạy local, TypeScript, lint, unit/browser tests, dependency audit và đối chiếu Swagger. Lỗi quyền ghi/xóa được xác định bằng đọc controller/service; không thử xóa CV, đổi chủ CV, mở khóa hoặc thay đổi dữ liệu nghiệp vụ để chứng minh lỗi.

Backend chỉ được đọc/kiểm tra, giữ nguyên mã nguồn theo yêu cầu trước đó. Frontend hiện tại trên nhánh `ai`, commit gốc đợt rà soát `025d5d8`; các thay đổi rà soát mới chưa commit/push.

## Các lỗi cần ưu tiên sửa

| Ưu tiên | Phát hiện và bằng chứng | Ảnh hưởng | Hướng sửa backend |
| --- | --- | --- | --- |
| P0 | `resumes.controller.ts:183`: `DELETE /resumes/:id` có `@Public()`; service xóa DB và file mà không kiểm tra chủ sở hữu. | Người chưa đăng nhập có thể yêu cầu xóa CV theo ID. Chưa gọi DELETE để thử trên dữ liệu thật. | Bắt buộc xác thực; chỉ chủ CV hoặc admin được xóa; kiểm tra quan hệ ứng tuyển trước khi xóa. |
| P0 | `resumes.controller.ts:173`: PATCH chỉ kiểm tra role candidate, không truyền user xuống service kiểm tra chủ CV. | Ứng viên có thể chỉnh CV của người khác nếu biết ID, gồm thay đổi mặc định. | Kiểm tra sở hữu trong service; không tin user ID từ request body. |
| P1 | `resumes.controller.ts:138` dùng `currentUser.userId`; JWT guard chỉ tạo `{id, role}`. Thử thật bằng tài khoản employer: GET `/resumes` trả 12 CV thuộc tài khoản khác. | Rò rỉ metadata CV giữa tài khoản. Lọc ở frontend không bảo vệ response server. | Dùng `currentUser.id`; hạn chế role; employer chỉ đọc CV trong đơn của tin thuộc mình nếu nghiệp vụ cho phép. |
| P1 | `applications.service.ts:create` nhận `resumeId` rồi lưu trực tiếp; chưa kiểm tra CV thuộc candidate đang nộp. | Có thể gắn CV của tài khoản khác vào đơn của mình. Chưa tạo đơn giả để thử. | Kiểm tra CV tồn tại và `resume.userId === candidateId` trước khi lưu. |
| P1 | Thiếu `GET /users/me`. `/users/:id` chỉ dành cho admin; thử bằng employer nhận 403 ở `/users/me`. Candidate cũng bị RolesGuard chặn theo mã nguồn. | Hồ sơ cá nhân không tải được; form chỉnh sửa bị chặn. | Thêm route `me` trước `:id`, lấy ID từ JWT, không cho client chọn tài khoản khác. |
| P1 | Thiếu `PATCH /users/unlock/:id`, được xác nhận qua Swagger. DTO/service PATCH user hiện không cập nhật `isActive`. | Admin không thể mở khóa tài khoản qua giao diện. | Thêm endpoint/service admin-only, kiểm tra tài khoản, cập nhật `isActive=true`; không dùng API sửa hồ sơ để vượt quyền. |
| P1 | Thiếu `GET /skills`; `CreateJobDto`/`UpdateJobDto` và JobsService chưa xử lý `skillIds`/`job_skills`. | Form đăng/sửa tin bị chặn khi không tải được skills; chỉ thêm route danh sách vẫn chưa đủ để lưu kỹ năng. | Đăng ký module skills, DTO mảng ID hợp lệ và lưu quan hệ trong transaction; đọc lại kỹ năng khi xem/sửa tin. |
| P1 | `companies.controller.ts:60,73` truyền `@CurrentUser('id')` là số, còn service cần object có `id,role`. | Đúng chủ công ty vẫn bị 403 khi sửa; admin/employer xóa công ty cũng bị từ chối. | Truyền toàn bộ `@CurrentUser()` với kiểu rõ ràng và kiểm tra chủ/admin trong service. |
| P1 | GET `/applications/:id` chỉ `@Roles('candidate')`. | Employer không tải được chi tiết thường, thư giới thiệu và luồng đổi trạng thái trên trang chi tiết. | Cho employer truy cập sau kiểm tra quyền sở hữu tin; candidate chỉ đọc đơn của chính mình. |
| P1 | GET `/resumes/:id/file` chỉ chủ CV/admin. | Employer không xem/tải CV của đơn thuộc tin mình. | Kiểm tra quan hệ CV → đơn → tin → chủ tin; không công khai file để xử lý lỗi này. |
| P1 | JobsService tạo/sửa tin chưa gọi `AiJobsProducer`; chưa xử lý kỹ năng và vector cũ. | Tin mới không tự có embedding; tin đã sửa có thể giữ embedding cũ. | Enqueue sau khi lưu tạo/sửa; bảo đảm queue xử lý lại khi nội dung hoặc kỹ năng đổi, có retry/giám sát lỗi. |
| P1 | JwtAuthGuard xác minh chữ ký JWT nhưng chưa kiểm tra trạng thái tài khoản hiện tại. | Khóa tài khoản chưa vô hiệu hóa access token đang còn hạn; refresh có kiểm tra `isActive` nhưng các request khác chưa có. | Kiểm tra tài khoản active trong bước xác thực hoặc cơ chế thu hồi token phù hợp; kiểm thử khóa trong khi đang đăng nhập. |
| P2 | GET metadata `/resumes/:id` public; `main.ts` đăng ký static `/uploads`, đường dẫn dựa trên `__dirname` khác với upload dùng cwd. | Metadata bị công khai; nguy cơ công khai file khi static trỏ đúng, hoặc 404 do đường dẫn build khác nhau. Chưa kết luận file CV hiện tại tải được công khai. | Bảo vệ metadata, chỉ phục vụ công khai logo; thống nhất đường dẫn lưu file và tải file có quyền. |
| P2 | Entity Job không có relation company/skills; API danh sách/chi tiết chỉ trả các ID. Candidate applications cũng chỉ có ID, không có tên tin/công ty. | Một số màn hình hiện fallback `Công ty #...` hoặc mã tin, tìm kiếm thường theo tên công ty chưa đầy đủ. | Bổ sung projection/DTO trả đúng thông tin công khai cần dùng; tránh trả dư thông tin owner. |
| P2 | Schema `application_scores` thiếu trong SQL backend versioned; runtime local đã được bổ sung ở bước bật AI trước đó. | Chạy trên máy khác/DB mới có thể lỗi dù local đang chạy. | Migration chính thức cho toàn bộ bảng/cột AI; tương thích model 1024 chiều và kiểm tra schema khi triển khai. |

P0 = rủi ro truy cập/thay đổi CV không được phép; P1 = chặn nghiệp vụ hoặc thiếu kiểm soát quyền; P2 = dữ liệu hiển thị, kiểm thử và vận hành cần hoàn thiện. Đây là phân loại của đợt rà soát, không phải điểm CVSS.

## Kiểm chứng hệ thống thật

- Frontend tại `http://127.0.0.1:5173`; backend Swagger tại `http://localhost:3000/api-docs`.
- GET jobs/companies trả 200. Admin login và GET users thành công; employer login, GET jobs và công ty theo owner thành công.
- GET `/ai/health`: 200, `ok=true`, model `bge-m3`, vector 1024 chiều. Tìm kiếm hybrid: 200.
- GET `/skills`: 404. GET `/users/me` bằng employer: 403. Hai route thiếu còn lại được xác nhận trong Swagger, không gọi PATCH mở khóa khi đang kiểm tra chỉ đọc.
- PostgreSQL có 17 tài khoản, 0 tin tuyển dụng, 0 đơn ứng tuyển ở thời điểm kiểm tra. Vì vậy chưa thể xác nhận toàn bộ vòng đời đăng tin → nộp CV → xếp hạng → duyệt đơn bằng dữ liệu thật.
- Đã xác nhận lỗi rò rỉ danh sách CV bằng response count; không ghi nội dung CV, token hoặc password vào báo cáo.
- Docker PostgreSQL còn cảnh báo collation version mismatch. Cần kế hoạch bảo trì/reindex trước khi refresh collation version, không chỉ đổi metadata để che cảnh báo.

## Thay đổi frontend trong đợt rà soát

1. Thêm `src/components/common/AppErrorBoundary.tsx`, gắn vào `src/App.tsx`: lỗi render bất ngờ hiển thị thông báo, nút tải lại và liên kết về việc làm, thay vì toàn bộ trang trắng.
2. `src/features/public/api/public.api.ts`: kiểm tra response phân trang trước khi giao cho page; dữ liệu sai chuyển thành thông báo lỗi có thể thử lại. Tiếp tục hỗ trợ mảng của AI2 và response phân trang.
3. Thêm regression tests tại `tests/app-error-boundary.spec.ts` và `tests/public-api-real.test.mjs`.
4. Thêm `scripts/check-api-contract.mjs`, lệnh `npm run check:contract`: kiểm tra chỉ đọc 41 route frontend cần so với Swagger đang chạy; hiện **38 có, 3 thiếu**. Lệnh cố ý trả exit code 1 khi thiếu API, không phải frontend bị crash. Kiểm tra route có mặt không chứng minh quyền hay response đúng.

Không ẩn lỗi backend, giả báo thành công, dùng dữ liệu giả trong ứng dụng, đổi role hoặc gọi URL public để vượt quyền. Không dùng `npm audit fix --force` trong đợt kiểm tra.

## Kết quả kiểm tra

| Kiểm tra | Kết quả |
| --- | --- |
| Frontend TypeScript + Vite build | Đạt |
| Frontend lint | Exit 0, 9 cảnh báo có sẵn |
| Frontend unit/API tests | 28 bài đạt sau bổ sung regression |
| Frontend Playwright | **49/49 đạt**, chạy toàn bộ với `--workers=3` (51,1 giây). Lần chạy trước với 8 workers đồng thời kiểm tra backend có 2 timeout click; lần chạy lại toàn bộ đạt. |
| Backend TypeScript `tsc --noEmit --incremental false` | Đạt, không sửa mã nguồn |
| Backend Jest `npm test -- --runInBand` | 46 đạt, 6 thất bại; 5 suite đạt/6 suite thất bại. Các test scaffold thiếu mock repository/DataSource/service trong TestingModule. |
| Backend ESLint, không `--fix` | Exit 1: 2 lỗi, 13 cảnh báo. Hai lỗi ở `ai/cvs/cv-text-reader.ts` về regex ký tự điều khiển và khoảng trắng đặc biệt. Cần xem mục đích làm sạch CV trước khi sửa rule/code. |
| Frontend `npm audit --omit=dev` | Không có advisory được báo trong production dependencies tại thời điểm kiểm tra; không chứng minh toàn bộ ứng dụng an toàn. |
| Backend `npm audit --omit=dev` | 6 mục dependency: 3 high, 3 moderate. Có cả mục cha và dependency bắc cầu, không phải 6 lỗi độc lập. |

Các dependency được npm audit nêu: `@nestjs/platform-express`, `multer`, `body-parser`, `@nestjs/swagger`, `js-yaml`, `qs`. Cần nâng phiên bản có kiểm thử; npm đề xuất nâng major Swagger ở một số mục nên không tự áp dụng.

Kiểm tra browser với backend thật sau thay đổi: trang chủ, tìm kiếm AI, công ty, tin của employer và hồ sơ của employer đều hiển thị, không có pageerror. Các trang employer không có request thất bại trong lần kiểm tra này; danh sách rỗng đúng DB. Điều này không xác nhận các thao tác tạo/sửa/xóa hoặc nghiệp vụ chưa có dữ liệu.

Nguồn advisory do npm audit trả về: [body-parser](https://github.com/advisories/GHSA-27r3-jxmh-p828), [multer](https://github.com/advisories/GHSA-q7qp-rjg7-q26m), [js-yaml](https://github.com/advisories/GHSA-r3ph-w7gj-g6xm), [qs](https://github.com/advisories/GHSA-6pq8-jhm2-2vcw).

## Thứ tự hoàn thiện đề xuất

1. Sửa quyền CV, kiểm tra CV khi ứng tuyển và trạng thái tài khoản trong backend; thêm test từ chối truy cập chéo tài khoản.
2. Bổ sung 3 API còn thiếu; sửa CurrentUser của công ty và quyền employer đọc đơn/CV.
3. Hoàn thiện lưu kỹ năng, enqueue embedding, migration AI và DTO trả dữ liệu cho frontend.
4. Sửa các test backend, xử lý lint và nâng dependency theo advisory.
5. Kiểm thử xuyên suốt với tài khoản candidate/employer/admin và bộ dữ liệu kiểm thử riêng sau khi API đã hoàn thiện. Không thể thay bước này bằng browser tests dùng interception.

Xem thêm [tài liệu tích hợp AI](ai-integration.md) về endpoint và cấu hình local. Các script/log trong `logs/` là dữ liệu kiểm tra local bị bỏ qua Git.
