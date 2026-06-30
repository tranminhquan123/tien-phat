// src/App.tsx
import { lazy, Suspense } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PublicLayout } from '@/components/PublicLayout';

const HomePage = lazy(() => import('@/pages/Home/HomePage').then((module) => ({ default: module.HomePage })));
const ProductsPage = lazy(() => import('@/pages/Products/ProductsPage').then((module) => ({ default: module.ProductsPage })));
const ProductDetailPage = lazy(() => import('@/pages/Products/ProductDetailPage').then((module) => ({ default: module.ProductDetailPage })));
const AboutPage = lazy(() => import('@/pages/About/AboutPage').then((module) => ({ default: module.AboutPage })));
const ContactPage = lazy(() => import('@/pages/Contact/ContactPage').then((module) => ({ default: module.ContactPage })));

const AdminLayout = lazy(() => import('@/components/AdminLayout').then((module) => ({ default: module.AdminLayout })));
const LoginPage = lazy(() => import('@/pages/Admin/LoginPage').then((module) => ({ default: module.LoginPage })));
const DashboardPage = lazy(() => import('@/pages/Admin/DashboardPage').then((module) => ({ default: module.DashboardPage })));
const AdminProductsPage = lazy(() => import('@/pages/Admin/AdminProductsPage').then((module) => ({ default: module.AdminProductsPage })));
const AdminProductCreatePage = lazy(() => import('@/pages/Admin/AdminProductCreatePage').then((module) => ({ default: module.AdminProductCreatePage })));
const AdminCategoriesPage = lazy(() => import('@/pages/Admin/AdminCategoriesPage').then((module) => ({ default: module.AdminCategoriesPage })));
const AdminChatPage = lazy(() => import('@/pages/Admin/AdminChatPage').then((module) => ({ default: module.AdminChatPage })));
const AdminContactsPage = lazy(() => import('@/pages/Admin/AdminContactsPage').then((module) => ({ default: module.AdminContactsPage })));
const AdminSettingsPage = lazy(() => import('@/pages/Admin/AdminSettingsPage').then((module) => ({ default: module.AdminSettingsPage })));

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/admin/login" replace />;
}

function RouteFallback() {
  return (
    <div className="flex min-h-[45vh] items-center justify-center bg-white">
      <div className="flex items-center gap-3 text-sm text-gray-400">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        Đang tải nội dung...
      </div>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/san-pham" element={<ProductsPage />} />
            <Route path="/san-pham/:slug" element={<ProductDetailPage />} />
            <Route path="/gioi-thieu" element={<AboutPage />} />
            <Route path="/lien-he" element={<ContactPage />} />
          </Route>

          <Route path="/admin/login" element={<LoginPage />} />
          <Route
            path="/admin"
            element={
              <RequireAuth>
                <AdminLayout />
              </RequireAuth>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="san-pham" element={<AdminProductsPage />} />
            <Route path="san-pham/them-moi" element={<AdminProductCreatePage />} />
            <Route path="danh-muc" element={<AdminCategoriesPage />} />
            <Route path="hoi-thoai" element={<AdminChatPage />} />
            <Route path="lien-he" element={<AdminContactsPage />} />
            <Route path="cai-dat" element={<AdminSettingsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
