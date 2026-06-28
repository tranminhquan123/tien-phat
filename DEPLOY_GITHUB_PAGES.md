# Deploy frontend lên GitHub Pages

Frontend đã được cấu hình để chạy tại:

`https://tranminhquan123.github.io/tien-phat/`

## 1. Backend phải được deploy riêng

GitHub Pages chỉ chạy frontend tĩnh. Backend trong thư mục `server` cần được deploy lên một dịch vụ Node.js khác.

Sau khi có URL backend công khai, tạo file `client/.env.production`:

```env
VITE_API_URL=https://ten-backend-cua-ban/api
```

Không đưa `DATABASE_URL` hoặc `JWT_SECRET` vào frontend.

## 2. Build và đẩy frontend lên nhánh gh-pages

```bash
cd client
npm install
npm run deploy
```

Lệnh `npm run deploy` sẽ tự build rồi đẩy thư mục `client/dist` lên nhánh `gh-pages`.

## 3. Bật GitHub Pages

Trong repository GitHub:

1. Mở `Settings`.
2. Chọn `Pages`.
3. Ở `Build and deployment`, chọn `Deploy from a branch`.
4. Chọn branch `gh-pages` và thư mục `/(root)`.
5. Nhấn `Save`.

## 4. Cập nhật website sau này

Sau khi sửa code và push lên `main`, chạy lại:

```bash
cd client
npm run deploy
```

## Routing

Bản production dùng HashRouter để tránh lỗi 404 trên GitHub Pages. URL trang con sẽ có dạng:

`https://tranminhquan123.github.io/tien-phat/#/san-pham`
