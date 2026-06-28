// src/pages/Admin/DashboardPage.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package, FolderOpen, MessageSquare, TrendingUp,
  ArrowRight, Plus, type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { adminGetProducts } from '@/services/productService';
import { getCategories } from '@/services/categoryService';
import { adminGetContactStats } from '@/services/contactService';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface Stats {
  products: number;
  categories: number;
  contacts: { total: number; new: number; replied: number };
}

export function DashboardPage() {
  const { admin } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminGetProducts({ page: 1 }),
      getCategories(),
      adminGetContactStats(),
    ]).then(([prods, cats, contacts]) => {
      setStats({
        products: prods.total,
        categories: cats.data?.length ?? 0,
        contacts: contacts.data,
      });
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">
          {greeting}, {admin?.name}! 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats */}
      {loading ? (
        <LoadingSpinner className="py-16" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={Package}
            label="Tổng sản phẩm"
            value={stats?.products ?? 0}
            color="brand"
            to="/admin/san-pham"
          />
          <StatCard
            icon={FolderOpen}
            label="Danh mục"
            value={stats?.categories ?? 0}
            color="blue"
            to="/admin/danh-muc"
          />
          <StatCard
            icon={MessageSquare}
            label="Liên hệ mới"
            value={stats?.contacts.new ?? 0}
            badge={stats?.contacts.new ? 'Chưa đọc' : undefined}
            color="yellow"
            to="/admin/lien-he"
          />
          <StatCard
            icon={TrendingUp}
            label="Tổng liên hệ"
            value={stats?.contacts.total ?? 0}
            color="green"
            to="/admin/lien-he"
          />
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="card p-5">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Plus size={16} className="text-brand-600" /> Tác vụ nhanh
          </h2>
          <div className="space-y-2">
            {[
              { to: '/admin/san-pham', label: 'Thêm sản phẩm mới', icon: Package },
              { to: '/admin/danh-muc', label: 'Quản lý danh mục', icon: FolderOpen },
              { to: '/admin/lien-he', label: 'Xem liên hệ khách hàng', icon: MessageSquare },
              { to: '/admin/cai-dat', label: 'Cài đặt website', icon: TrendingUp },
            ].map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 text-gray-700 hover:text-brand-600 transition-colors group"
              >
                <Icon size={16} className="text-gray-400 group-hover:text-brand-500" />
                <span className="text-sm">{label}</span>
                <ArrowRight size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="font-bold text-gray-800 mb-4">Thống kê liên hệ</h2>
          {stats && (
            <div className="space-y-3">
              {[
                { label: 'Tổng liên hệ', value: stats.contacts.total, color: 'bg-gray-200' },
                { label: 'Chưa đọc', value: stats.contacts.new, color: 'bg-yellow-400' },
                { label: 'Đã phản hồi', value: stats.contacts.replied, color: 'bg-green-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${color}`} />
                  <span className="text-sm text-gray-600 flex-1">{label}</span>
                  <span className="font-bold text-gray-900">{value}</span>
                </div>
              ))}
              <Link
                to="/admin/lien-he"
                className="block mt-4 text-center text-sm text-brand-600 font-semibold hover:underline"
              >
                Xem tất cả liên hệ →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon, label, value, badge, color, to,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  badge?: string;
  color: 'brand' | 'blue' | 'yellow' | 'green';
  to: string;
}) {
  const colors = {
    brand: 'bg-brand-50 text-brand-600',
    blue: 'bg-blue-50 text-blue-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    green: 'bg-green-50 text-green-600',
  };

  return (
    <Link to={to} className="card p-5 hover:border-gray-200 group">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colors[color]}`}>
          <Icon size={20} />
        </div>
        {badge && (
          <span className="badge bg-yellow-100 text-yellow-700">{badge}</span>
        )}
      </div>
      <p className="text-3xl font-black text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </Link>
  );
}
