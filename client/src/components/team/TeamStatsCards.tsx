import { ShieldCheck, UserCheck, UserCog, Users, UserX } from 'lucide-react';
import type { TeamStats } from '@/types/teamMember';

export function TeamStatsCards({ stats }: { stats: TeamStats }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      <Card label="Tổng nhân viên" value={stats.total} icon={<Users size={18} />} />
      <Card label="Đang hoạt động" value={stats.active} icon={<UserCheck size={18} />} />
      <Card label="Ngừng hoạt động" value={stats.inactive} icon={<UserX size={18} />} />
      <Card label="Đang phụ trách" value={stats.assigned} icon={<UserCog size={18} />} />
      <Card label="Quản lý" value={stats.owners + stats.managers} icon={<ShieldCheck size={18} />} />
    </div>
  );
}

function Card({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-700">{icon}</span>
      <span><strong className="block text-lg leading-none text-gray-900">{value}</strong><small className="mt-1 block text-xs text-gray-500">{label}</small></span>
    </div>
  );
}
