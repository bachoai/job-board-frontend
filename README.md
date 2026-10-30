# Jobboard Frontend — Employer & Admin

## Chạy ứng dụng

Yêu cầu Node.js 24+ và npm. Nếu chưa có `.env`:

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

Cấu hình API:

```dotenv
VITE_API_BASE_URL=http://localhost:3000/api
```

`VITE_API_URL` cũ vẫn hoạt động nếu chưa đặt `VITE_API_BASE_URL`. Base URL bao gồm `/api` đúng một lần; các API feature chỉ dùng đường dẫn như `/jobs`.

Chạy backend riêng, mở `/login` hoặc một trang cần dùng và đăng nhập bằng tài khoản employer/admin đã có. Bản production không có dữ liệu demo hoặc tài khoản mặc định.

## Thay đổi giao diện và cấu trúc

- Sidebar dùng icon Lucide, menu theo vai trò và thông tin tài khoản. Điện thoại dùng menu dạng drawer với focus trap, nút đóng và phím Escape.
- Header cố định có breadcrumb, tên/email, vai trò và đăng xuất; footer dùng chung.
- Card số liệu lấy từ response thực tế, không có biểu đồ tăng trưởng hoặc số liệu giả.
- Bảng có tiêu đề, số kết quả, tìm kiếm, bộ lọc, phân trang và cuộn ngang trên điện thoại.
- Form thống nhất label, lỗi, trạng thái focus/disabled; form công ty có thẻ hồ sơ và form tin có xem trước.
- Xác nhận thao tác, loading, empty/error/success states được dùng chung trên mọi trang.
- Giữ React + TypeScript + Vite, React Router và CSS của dự án. Thêm Lucide React và dùng Axios đã có sẵn. Giữ logic validation đang hoạt động, không chuyển toàn bộ form sang thư viện khác chỉ để thay giao diện. TypeScript đã bật `strict`.
- Không tạo trang Public/Candidate hoặc hệ thống Auth mới. Màn hình đăng nhập độc lập đã có ở bản trước được giữ lại và logic của nó được tách vào provider để thuận tiện ghép với phần A.

```text
src/
├── app/
│   ├── router/
│   │   ├── AppRouter.tsx
│   │   └── ProtectedRoute.tsx
│   └── providers/
│       ├── AuthProvider.tsx
│       ├── auth-context.ts
│       └── useAuth.ts
├── layouts/
│   ├── MainLayout.tsx
│   ├── EmployerLayout.tsx
│   └── AdminLayout.tsx
├── components/
│   ├── layout/{Header,Sidebar,Footer}.tsx
│   └── common/
│       ├── DataTable.tsx
│       ├── StatusBadge.tsx
│       ├── StatCard.tsx
│       ├── FormInput.tsx
│       ├── ConfirmDialog.tsx
│       ├── ErrorMessage.tsx
│       ├── LoadingSpinner.tsx
│       ├── Feedback.tsx
│       ├── ConfirmAction.tsx
│       ├── useResource.ts
│       ├── format.ts
│       └── statuses.ts
├── features/
│   ├── employer/
│   │   ├── pages/
│   │   │   ├── CompanyPage.tsx
│   │   │   ├── CreateJobPage.tsx
│   │   │   ├── EditJobPage.tsx
│   │   │   ├── MyJobsPage.tsx
│   │   │   ├── ApplicationsPage.tsx
│   │   │   ├── JobApplicationsPage.tsx
│   │   │   └── ApplicationDetailPage.tsx
│   │   ├── components/
│   │   │   ├── CompanyForm.tsx
│   │   │   ├── JobForm.tsx
│   │   │   ├── ApplicationStatusForm.tsx
│   │   │   ├── JobEditor.tsx
│   │   │   ├── job-form.ts
│   │   │   ├── job-form.test.mjs
│   │   │   └── job-draft.ts
│   │   ├── api/{companies,jobs,applications}.api.ts
│   │   ├── api/index.ts
│   │   └── types/index.ts
│   └── admin/
│       ├── pages/{Users,Jobs,Companies}Page.tsx
│       ├── api/{users,jobs,companies}.api.ts
│       └── api/index.ts
├── lib/
│   ├── axios.ts
│   └── api.ts
├── styles/global.css
├── App.tsx
├── App.css
├── index.css
└── main.tsx
```

`Feedback.tsx`, `ConfirmAction.tsx` và `JobEditor.tsx` giữ các export tương thích với mã cũ; phần triển khai hiện nằm trong các component có tên rõ ràng. `App.tsx` chỉ gắn provider/router và CSS. Khi ghép phần A, dùng AuthProvider/guard của nhóm hoặc đồng bộ về cùng `jobboard.session`; không cần sửa từng page.

Mọi thao tác lỗi đều hiển thị thông báo API; không giả báo thành công. Tin bị chặn không sửa được, hồ sơ đã từ chối không đổi lại được, ngày nộp mới không được nằm trong quá khứ. Các trạng thái theo enum backend; giá trị lạ dùng badge trung tính. Không có tính năng AI.

## Backend hiện tại và các giới hạn giữ nguyên

- **Sửa công ty:** gọi `PATCH /companies/:id` đúng DTO. Controller backend đang truyền `@CurrentUser('id')` vào service cần `currentUser.id/role`, nên có thể trả 403 kể cả đúng chủ công ty. Frontend hiển thị lỗi và giữ nội dung; không thể sửa lỗi này chỉ bằng UI.
- **Mở khóa người dùng:** backend chỉ có thao tác đặt `isActive=false`, chưa có API mở khóa. Nút mở khóa bị vô hiệu hóa và có giải thích.
- **Email:** cập nhật hồ sơ hiện chỉ ghi dữ liệu và lịch sử; chưa gửi email tự động. Giao diện không hứa email đã được gửi.
- **Tin của tôi:** chưa có `/jobs/mine`; dùng `/jobs` có Bearer token rồi lọc `createdBy`. Backend cho employer/admin xem mọi trạng thái khi token hợp lệ. Số hồ sơ lấy qua `/applications?jobId=...`, tối đa 4 yêu cầu đồng thời; khi chưa tải được hiển thị `—`.
- **Ứng viên:** response hồ sơ chỉ có `candidateId`; hiển thị mã ứng viên thay vì bịa họ tên/email hoặc gọi API người dùng mà employer không có quyền.
- **CV:** dùng `/resumes/:id` và `fileUrl` dưới `/uploads/` của cùng máy chủ backend. PDF có vùng xem, Word có liên kết mở/tải. Không mở URL giao thức lạ hoặc máy chủ ngoài.
- **Phiên:** Axios chung tại `lib/axios.ts`; `lib/api.ts` giữ Bearer token, gia hạn, timeout, hủy request và lỗi tiếng Việt. Do `/auth/refresh` cũng cần access token hợp lệ, gia hạn khi token còn dưới 60 giây; nếu đã hết hạn thì đăng nhập lại. Bản nháp tin mới được giữ trong tab theo tài khoản và xóa sau khi tạo thành công.
- **Sửa tin:** không đổi companyId, giữ currency, gửi null để xóa trường nullable. Không gửi lại hạn cũ không đổi, nên vẫn sửa được tin đã hết hạn. Các lần lưu liên tiếp dùng dữ liệu vừa lưu làm gốc.

## Kiểm tra

```powershell
npm run build
npm run lint
npm test
npm run test:e2e
```

Playwright dùng Chrome cài trên máy, tự chạy Vite cổng 5173. Có thể đổi `channel` trong `playwright.config.ts`. Unit tests kiểm tra validation/payload; browser tests bao phủ các luồng B, quyền, phiên, lỗi API, menu mobile và giao diện dashboard. Fixture và request interception chỉ nằm trong `tests/`, không ghi lên backend thật.

Ảnh kiểm tra nằm trong `test-results/` và được bỏ qua trong Git. Cần thử tích hợp với backend/cơ sở dữ liệu thật trước khi triển khai.
