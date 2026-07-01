import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  FolderOpen,
  Globe2,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  MessagesSquare,
  Package,
  PlusCircle,
  Settings,
  UsersRound,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '@/contexts/AuthContext';
import { adminGetChatStats } from '@/services/chatService';

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/san-pham', label: 'Sản phẩm', icon: Package, end: true },
  { to: '/admin/san-pham/them-moi', label: 'Thêm sản phẩm', icon: PlusCircle },
  { to: '/admin/danh-muc', label: 'Danh mục', icon: FolderOpen },
  { to: '/admin/nhan-vien', label: 'Nhân viên', icon: UsersRound },
  { to: '/admin/hoi-thoai', label: 'Hội thoại', icon: MessagesSquare, badge: true },
  { to: '/admin/lien-he', label: 'Liên hệ', icon: MessageSquare },
  { to: '/admin/cai-dat', label: 'Cài đặt', icon: Settings },
];

export function AdminLayoutRestored() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatBadge, setChatBadge] = useState(0);
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    async function refreshChatBadge() {
      try {
        const response = await adminGetChatStats();
        if (active) setChatBadge(response.data.waiting + response.data.unreadMessages);
      } catch {
        // Badge không làm gián đoạn trang quản trị.
      }
    }
    void refreshChatBadge();
    const interval = window.setInterval(refreshChatBadge, 15_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  function handleLogout() {
    logout();
    navigate('/admin/login');
  }

  const Sidebar = () => (
    <aside className="flex h-full w-64 shrink-0 flex-col bg-dark-900 text-gray-300">
      <div className="border-b border-white/10 px-6 py-5">
        <Link to="/" className="group flex items-center gap-2" onClick={() => setSidebarOpen(false)}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600"><span className="text-sm font-black text-white">TP</span></div>
          <div><p className="text-sm font-bold leading-tight text-white group-hover:text-brand-300">Tiến Phát</p><p className="text-xs leading-tight text-gray-500">Quản trị hệ thống</p></div>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => clsx(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              isActive ? 'bg-brand-600 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
            )}
          >
            <Icon size={18} />{label}
            {badge && chatBadge > 0 ? (
              <span className="ml-auto flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-black text-white">{chatBadge > 99 ? '99+' : chatBadge}</span>
            ) : <ChevronRight size={14} className="ml-auto opacity-40" />}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-white/10 px-3 py-4">
        <Link to="/" onClick={() => setSidebarOpen(false)} className="mb-3 flex w-full items-center gap-3 rounded-lg bg-brand-500/10 px-3 py-2.5 text-sm font-medium text-brand-300 hover:bg-brand-500/20 hover:text-white"><Globe2 size={18} />Xem website chính</Link>
        <div className="mb-2 px-3 py-2"><p className="text-sm font-medium text-white">{admin?.name}</p><p className="text-xs text-gray-500">@{admin?.username}</p></div>
        <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300"><LogOut size={18} />Đăng xuất</button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <div className="hidden md:flex"><Sidebar /></div>
      {sidebarOpen && <div className="fixed inset-0 z-50 flex md:hidden"><div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} /><div className="relative z-10"><Sidebar /></div></div>}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 md:hidden">
          <button type="button" onClick={() => setSidebarOpen(true)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100" aria-label="Mở menu quản trị"><Menu size={20} /></button>
          <span className="font-bold text-gray-800">Tiến Phát Admin</span>
          {chatBadge > 0 && <Link to="/admin/hoi-thoai" className="ml-auto flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600"><MessagesSquare size={15} />{chatBadge > 99 ? '99+' : chatBadge}</Link>}
          <Link to="/" className={clsx('rounded-lg p-2 text-brand-600 hover:bg-brand-50', chatBadge === 0 && 'ml-auto')} aria-label="Về website chính"><Globe2 size={20} /></Link>
        </div>
        <main className="flex-1 overflow-y-auto p-4 md:p-6"><Outlet /></main>
      </div>
    </div>
  );
}
