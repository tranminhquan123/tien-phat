// src/components/AdminLayout.tsx
import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, FolderOpen, MessageSquare,
  Settings, LogOut, Menu, ChevronRight, Globe2, PlusCircle,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '@/contexts/AuthContext';

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/san-pham', label: 'Sản phẩm', icon: Package, end: true },
  { to: '/admin/san-pham/them-moi', label: 'Thêm sản phẩm', icon: PlusCircle },
  { to: '/admin/danh-muc', label: 'Danh mục', icon: FolderOpen },
  { to: '/admin/lien-he', label: 'Liên hệ', icon: MessageSquare },
  { to: '/admin/cai-dat', label: 'Cài đặt', icon: Settings },
];

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/admin/login');
  }

  const Sidebar = () => (
    <aside className="flex flex-col h-full bg-dark-900 text-gray-300 w-64 shrink-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <Link to="/" className="flex items-center gap-2 group" onClick={() => setSidebarOpen(false)}>
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-sm">TP</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight group-hover:text-brand-300 transition-colors">Tiến Phát</p>
            <p className="text-xs text-gray-500 leading-tight">Quản trị hệ thống</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-600 text-white'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              )
            }
            onClick={() => setSidebarOpen(false)}
          >
            <Icon size={18} />
            {label}
            <ChevronRight size={14} className="ml-auto opacity-40" />
          </NavLink>
        ))}
      </nav>

      {/* Website + User + logout */}
      <div className="px-3 py-4 border-t border-white/10">
        <Link
          to="/"
          onClick={() => setSidebarOpen(false)}
          className="mb-3 flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-brand-300 bg-brand-500/10 hover:bg-brand-500/20 hover:text-white transition-colors"
        >
          <Globe2 size={18} />
          Xem website chính
        </Link>
        <div className="px-3 py-2 mb-2">
          <p className="text-white text-sm font-medium">{admin?.name}</p>
          <p className="text-gray-500 text-xs">@{admin?.username}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
        >
          <LogOut size={18} />
          Đăng xuất
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
            aria-label="Mở menu quản trị"
          >
            <Menu size={20} />
          </button>
          <span className="font-bold text-gray-800">Tiến Phát Admin</span>
          <Link to="/" className="ml-auto p-2 rounded-lg text-brand-600 hover:bg-brand-50" aria-label="Về website chính">
            <Globe2 size={20} />
          </Link>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
