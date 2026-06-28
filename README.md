# 🏗️ Website Công ty TNHH VLXD & Nội Thất Tiến Phát

Website được viết lại hoàn toàn bằng stack hiện đại: **React + TypeScript + Tailwind CSS** (FE) và **Node.js + Express + Prisma + PostgreSQL** (BE).

---

## 📁 Cấu trúc project

```
tien-phat/
├── client/          # Frontend (Vite + React + TypeScript + Tailwind)
└── server/          # Backend (Node.js + Express + Prisma + PostgreSQL)
```

---

## ⚙️ Yêu cầu hệ thống

- Node.js >= 18
- PostgreSQL >= 14
- npm >= 9

---

## 🚀 Cài đặt và chạy

### 1. Backend (server)

```bash
cd server

# Cài dependencies
npm install

# Tạo file .env từ mẫu
cp .env.example .env
# → Mở .env và điền DATABASE_URL, JWT_SECRET

# Tạo database và chạy migration
npx prisma migrate dev --name init

# Tạo dữ liệu mẫu (admin mặc định, categories, banners)
npm run db:seed

# Chạy server development
npm run dev
# → Server chạy tại http://localhost:4000
```

**Tài khoản admin mặc định sau khi seed:**
- Username: `admin`
- Password: `tienPhat@2025`

---

### 2. Frontend (client)

```bash
cd client

# Cài dependencies
npm install

# Chạy development server
npm run dev
# → Website chạy tại http://localhost:5173
```

---

## 🌐 Trang public

| URL | Trang |
|-----|-------|
| `/` | Trang chủ |
| `/san-pham` | Danh sách sản phẩm |
| `/san-pham?category=gach-op-lat` | Lọc theo danh mục |
| `/san-pham/:slug` | Chi tiết sản phẩm |
| `/gioi-thieu` | Giới thiệu công ty |
| `/lien-he` | Liên hệ + form gửi yêu cầu |

## 🔐 Trang Admin

| URL | Trang |
|-----|-------|
| `/admin/login` | Đăng nhập admin |
| `/admin` | Dashboard thống kê |
| `/admin/san-pham` | Quản lý sản phẩm (CRUD) |
| `/admin/danh-muc` | Quản lý danh mục (CRUD) |
| `/admin/lien-he` | Xem & xử lý liên hệ khách hàng |
| `/admin/cai-dat` | Cài đặt thông tin công ty & đổi mật khẩu |

---

## 📡 API Endpoints

### Public
- `GET /api/products` – Danh sách sản phẩm (filter, search, pagination)
- `GET /api/products/:slug` – Chi tiết sản phẩm + related
- `GET /api/categories` – Danh sách danh mục
- `POST /api/contacts` – Gửi liên hệ
- `GET /api/config` – Cấu hình website
- `GET /api/config/banners` – Danh sách banner

### Admin (yêu cầu Bearer Token)
- `POST /api/auth/login` – Đăng nhập
- `PUT /api/auth/change-password` – Đổi mật khẩu
- `GET/POST/PUT/DELETE /api/products/admin/*` – CRUD sản phẩm
- `GET/POST/PUT/DELETE /api/categories/admin/*` – CRUD danh mục
- `GET/PUT /api/contacts/admin/*` – Quản lý liên hệ
- `PUT /api/config/admin` – Cập nhật cài đặt

---

## 🗄️ Schema Database

| Bảng | Mô tả |
|------|-------|
| `Admin` | Tài khoản quản trị |
| `Category` | Danh mục sản phẩm |
| `Product` | Sản phẩm |
| `ProductImage` | Ảnh sản phẩm (nhiều ảnh/sản phẩm) |
| `Banner` | Banner trang chủ |
| `ContactMessage` | Tin nhắn liên hệ từ khách hàng |
| `SiteConfig` | Cấu hình website (key-value) |

---

## 🛠️ Build production

```bash
# Backend
cd server && npm run build

# Frontend
cd client && npm run build
# → Output: client/dist/
```

---

## 📦 Tech Stack

| Phần | Công nghệ |
|------|-----------|
| Frontend | Vite, React 18, TypeScript, Tailwind CSS |
| Routing | React Router v6 |
| UI Slider | Swiper.js |
| Lightbox | yet-another-react-lightbox |
| Toast | react-hot-toast |
| Icons | Lucide React |
| Backend | Node.js, Express.js, TypeScript |
| ORM | Prisma |
| Database | PostgreSQL |
| Auth | JWT (jsonwebtoken) |
| Password | bcryptjs |
| Email | Nodemailer |
