# Cấu hình AI hỗ trợ Admin

Tính năng phân tích hội thoại có hai chế độ:

1. **OpenAI**: tóm tắt và soạn phản hồi tự nhiên hơn.
2. **Phân tích quy tắc**: hoạt động tự động khi chưa cấu hình OpenAI, không làm gián đoạn trang Admin.

## Cấu hình trên Render

Mở dịch vụ backend, chọn **Environment** và thêm:

- `OPENAI_API_KEY`: khóa dự án OpenAI của bạn.
- `OPENAI_MODEL`: `gpt-5-mini`.

Sau đó chọn **Save Changes** và deploy lại backend.

Không đặt khóa API trong frontend, GitHub hoặc `SiteConfig`. Khóa chỉ được lưu trong Environment của backend.

## Cách kiểm tra

1. Mở Admin > Hội thoại.
2. Chọn một cuộc trò chuyện có nội dung khách hàng.
3. Chọn **Phân tích ngay**.
4. Kiểm tra tóm tắt, dữ liệu trích xuất, điểm tiềm năng và sản phẩm gợi ý.
5. Chọn **AI soạn phản hồi**. Bản nháp chỉ được đưa vào ô nhập; Admin vẫn phải kiểm tra và tự gửi.

Khi cấu hình OpenAI không hợp lệ hoặc dịch vụ tạm lỗi, hệ thống tự chuyển sang bộ phân tích quy tắc và hiển thị cảnh báo trong Admin.
