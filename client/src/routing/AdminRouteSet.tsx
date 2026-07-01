import { lazy } from 'react';
import { Route } from 'react-router-dom';

const Dashboard = lazy(() => import('@/pages/Admin/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const Products = lazy(() => import('@/pages/Admin/AdminProductsPage').then((m) => ({ default: m.AdminProductsPage })));
const ProductCreate = lazy(() => import('@/pages/Admin/AdminProductCreatePage').then((m) => ({ default: m.AdminProductCreatePage })));
const Categories = lazy(() => import('@/pages/Admin/AdminCategoriesPage').then((m) => ({ default: m.AdminCategoriesPage })));
const Team = lazy(() => import('@/pages/Admin/AdminTeamPage').then((m) => ({ default: m.AdminTeamPage })));
const Chat = lazy(() => import('@/pages/Admin/AdminChatPage').then((m) => ({ default: m.AdminChatPage })));
const Contacts = lazy(() => import('@/pages/Admin/AdminContactsPage').then((m) => ({ default: m.AdminContactsPage })));
const Settings = lazy(() => import('@/pages/Admin/AdminSettingsPage').then((m) => ({ default: m.AdminSettingsPage })));

export function adminRouteSet() {
  return (
    <>
      <Route index element={<Dashboard />} />
      <Route path="san-pham" element={<Products />} />
      <Route path="san-pham/them-moi" element={<ProductCreate />} />
      <Route path="danh-muc" element={<Categories />} />
      <Route path="doi-ngu" element={<Team />} />
      <Route path="hoi-thoai" element={<Chat />} />
      <Route path="lien-he" element={<Contacts />} />
      <Route path="cai-dat" element={<Settings />} />
    </>
  );
}
