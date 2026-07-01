import { NavLink, Outlet } from 'react-router-dom';

export function AdminLayoutNext() {
  return (
    <div className="flex h-screen">
      <aside className="w-64 bg-dark-900 p-4 text-white">
        <NavLink to="/admin/doi-ngu">Nhân viên</NavLink>
      </aside>
      <main className="flex-1 overflow-y-auto p-6"><Outlet /></main>
    </div>
  );
}
