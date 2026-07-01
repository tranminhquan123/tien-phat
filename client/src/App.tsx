import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PublicLayout } from '@/components/PublicLayout';
import { adminRouteSet } from '@/routing/AdminRouteSet';

const HomePage = lazy(() => import('@/pages/Home/HomePage').then((m) => ({ default: m.HomePage })));
const ProductsPage = lazy(() => import('@/pages/Products/ProductsPage').then((m) => ({ default: m.ProductsPage })));
const ProductDetailPage = lazy(() => import('@/pages/Products/ProductDetailPage').then((m) => ({ default: m.ProductDetailPage })));
const AboutPage = lazy(() => import('@/pages/About/AboutPage').then((m) => ({ default: m.AboutPage })));
const ContactPage = lazy(() => import('@/pages/Contact/ContactPage').then((m) => ({ default: m.ContactPage })));
const AdminLayout = lazy(() => import('@/components/AdminLayout').then((m) => ({ default: m.AdminLayout })));
const LoginPage = lazy(() => import('@/pages/Admin/LoginPage').then((m) => ({ default: m.LoginPage })));

function RequireAuth({ children }: { children: React.ReactNode }) {
  return useAuth().isAuthenticated ? <>{children}</> : <Navigate to="/admin/login" replace />;
}

export function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="flex min-h-[45vh] items-center justify-center text-sm text-gray-400">Đang tải nội dung...</div>}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/san-pham" element={<ProductsPage />} />
            <Route path="/san-pham/:slug" element={<ProductDetailPage />} />
            <Route path="/gioi-thieu" element={<AboutPage />} />
            <Route path="/lien-he" element={<ContactPage />} />
          </Route>
          <Route path="/admin/login" element={<LoginPage />} />
          <Route path="/admin" element={<RequireAuth><AdminLayout /></RequireAuth>}>
            {adminRouteSet()}
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
