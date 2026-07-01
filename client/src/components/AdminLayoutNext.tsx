import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

function Item({ to, children, end = false }: { to: string; children: React.ReactNode; end?: boolean }) {
  return <NavLink to={to} end={end} className={({ isActive }) => `block rounded-lg px-3 py-2.5 text-sm ${isActive ? 'bg-brand-600 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>{children}</NavLink>;
}

export function AdminLayoutNext() {
  const [open, setOpen] = useState(false);
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <aside className={`${open ? 'block' : 'hidden'} fixed inset-y-0 left-0 z-50 w-64 bg-dark-900 p-4 text-white md:static md:flex md:shrink-0 md:flex-col`}>
        <p className="mb-5 px-3 font-black">Tiến Phát Admin</p>
        <nav className="flex-1 space-y-1">
          <Item to="/admin" end>Dashboard</Item><Item to="/admin/san-pham">Sản phẩm</Item><Item to="/admin/san-pham/them-moi">Thêm sản phẩm</Item><Item to="/admin/danh-muc">Danh mục</Item><Item to="/admin/doi-ngu">Nhân viên</Item><Item to="/admin/hoi-thoai">Hội thoại</Item><Item to="/admin/lien-he">Liên hệ</Item><Item to="/admin/cai-dat">Cài đặt</Item>
        </nav>
        <div className="border-t border-white/10 px-3 pt-4"><p className="text-sm font-semibold">{admin?.name}</p><p className="text-xs text-gray-500">@{admin?.username}</p><button type="button" onClick={() => { logout(); navigate('/admin/login'); }} className="mt-3 text-sm text-red-400">Đăng xuất</button></div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col"><header className="border-b bg-white px-4 py-3 md:hidden"><button type="button" onClick={() => setOpen(!open)}><Menu size={20} /></button></header><main className="min-w-0 flex-1 overflow-y-auto p-4 md:p-6"><Outlet /></main></div>
    </div>
  );
}
