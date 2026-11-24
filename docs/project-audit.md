# Rà soát frontend AI2

Cập nhật 25/11/2026, đối chiếu frontend gốc 529d02f và source backend local 9a3d73f. Báo cáo này thay các nhận định của lần rà soát backend cũ; không tiếp tục liệt kê các lỗi quyền công ty, thiếu route skills/users/mine/unlock hoặc thiếu migration như lỗi hiện tại khi chưa kiểm chứng lại.

## Kết quả sửa frontend

| Phần | Kết quả |
| --- | --- |
| FE-1 | Tên ứng viên ở danh sách, tổng hợp và chi tiết; tìm theo tên, fallback mã. Chi tiết chưa có tên được bổ sung từ API danh sách có quyền. |
| FE-2 | Hook dùng chung polling 3 giây, giới hạn cứng 60 giây; hủy timer/request khi unmount, đổi CV hoặc retry; dừng khi lỗi/done. |
| FE-3 | ApplyDialog trên thẻ gợi ý, dùng luồng ứng tuyển và điều hướng chi tiết đơn hiện có. |
| FE-4 | Source BE có hợp đồng mở rộng. Hit đầy đủ không gọi chi tiết; legacy/mixed chỉ tải hit thiếu trường, tối đa 4 request đồng thời. |
| FE-5 | Đọc mode qua URL, mode không hợp lệ trở về hybrid. |
| FE-6 | README, tích hợp AI, chạy local và báo cáo được cập nhật, tách kết quả cũ khỏi lần chạy hiện tại. |
| FE-7 | Xem bằng chứng và giới hạn ở báo cáo kiểm thử. |

Không có thay đổi tự động trạng thái ứng tuyển. Các lỗi API được hiển thị, không có dữ liệu demo fallback trong mã ứng dụng. Đánh giá AI hỗ trợ người tuyển dụng, không phải kết luận tuyển dụng.

## Điểm cần theo dõi

API chi tiết đơn chưa trả candidateName; frontend dùng danh sách đã được cấp quyền. Có thể bỏ request bổ sung khi BE thống nhất DTO. Search chưa có currency nên thẻ dùng VND theo quy ước hiện có. Kiểm tra Swagger có route không chứng minh response và quyền hoạt động; cần luồng thật.

Xem [kiểm thử AI2](ai2-verification.md), [cấu hình AI](ai-integration.md), [chạy local](local-fullstack.md).

## Phát hiện từ lần chạy thật

Practice DB hiện thiếu parsed_at/parsed_data và kiểu vector, nên luồng AI dùng job_board_db đã có schema AI, không thay đổi .env hay schema practice. JobsService chưa enqueue embedding khi đăng tin; cần chạy tác vụ embedding backend cho dữ liệu mới. FE-7 đã đi trọn luồng sau bước chuẩn bị embedding cho riêng tin kiểm thử, không chứng minh backend tự enqueue.
