// src/App.tsx
import {
  BrowserRouter,
  HashRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

// Public layout
import { PublicLayout } from '@/components/PublicLayout';
import { HomePage } from '@/pages/Home/HomePage';
import { ProductsPage } from '@/pages/Products/ProductsPage';
import { ProductDetailPage } from '@/pages/Products/ProductDetailPage';
import { AboutPage } from '@/pages/About/AboutPage';
import { ContactPage } from '@/pages/Contact/ContactPage';

// Admin
import { AdminLayout } from '@/components/AdminLayout';
import { LoginPage } from '@/pages/Admin/LoginPage';
import { DashboardPage } from '@/pages/Admin/DashboardPage';
import { AdminProductsPage } from '@/pages/Admin/AdminProductsPage';
import { AdminProductCreatePage } from '@/pages/Admin/AdminProductCreatePage';
import { AdminCategoriesPage } from '@/pages/Admin/AdminCategoriesPage';
import { AdminContactsPage } from '@/pages/Admin/AdminContactsPage';
import { AdminSettingsPage } from '@/pages/Admin/AdminSettingsPage';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/admin/login" replace />;
}

export function App() {
  const Router = import.meta.env.PROD ? HashRouter : BrowserRouter;

  return (
    <Router>
      <Routes>
        {/* Public */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/san-pham" element={<ProductsPage />} />
          <Route path="/san-pham/:slug" element={<ProductDetailPage />} />
          <Route path="/gioi-thieu" element={<AboutPage />} />
          <Route path="/lien-he" element={<ContactPage />} />
        </Route>

        {/* Admin */}
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
          <Route path="lien-he" element={<AdminContactsPage />} />
          <Route path="cai-dat" element={<AdminSettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
