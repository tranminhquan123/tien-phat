import { NavLink, Outlet } from 'react-router-dom';

function Item({ to, children, end = false }: { to: string; children: React.ReactNode; end?: boolean }) {
  return <NavLink to={to} end={end} className={({ isActive }) => `block rounded-lg px-3 py-2.5 text-sm ${isActive ? 'bg-brand-600 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>{children}</NavLink>;
}

export function AdminLayoutNext() {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <aside className="w-64 shrink-0 bg-dark-900 p-4 text-white">
        <p className="mb-5 px-3 font-black">Tiến Phát Admin</p>
        <nav className="space-y-1">
          <Item to="/admin" end>Dashboard</Item>
          <Item to="/admin/san-pham">Sản phẩm</Item>
          <Item to="/admin/san-pham/them-moi">Thêm sản phẩm</Item>
          <Item to="/admin/danh-muc">Danh mục</Item>
          <Item to="/admin/doi-ngu">Nhân viên</Item>
          <Item to="/admin/hoi-thoai">Hội thoại</Item>
          <Item to="/admin/lien-he">Liên hệ</Item>
          <Item to="/admin/cai-dat">Cài đặt</Item>
        </nav>
      </aside>
      <main className="min-w-0 flex-1 overflow-y-auto p-4 md:p-6"><Outlet /></main>
    </div>
  );
}
