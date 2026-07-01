import { Pencil, UserRound } from 'lucide-react';
import type { TeamMember } from '@/types/teamMember';

const roles = { OWNER: 'Chủ tài khoản', MANAGER: 'Quản lý', STAFF: 'Nhân viên' } as const;

export function TeamMemberCard({ member, onEdit }: { member: TeamMember; onEdit: (member: TeamMember) => void }) {
  const active = member.isActive && !member.deletedAt;
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700"><UserRound size={18} /></span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-gray-900">{member.name}</p>
          <p className="text-xs text-gray-400">@{member.username}</p>
        </div>
        <button type="button" onClick={() => onEdit(member)} className="rounded-lg p-2 text-gray-400 hover:bg-brand-50 hover:text-brand-600"><Pencil size={16} /></button>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <Info label="Vai trò" value={roles[member.role]} />
        <Info label="Trạng thái" value={active ? 'Hoạt động' : 'Ngừng hoạt động'} />
        <Info label="Khách phụ trách" value={String(member.activeContactCount || 0)} />
        <Info label="Hội thoại" value={String(member.activeChatCount || 0)} />
      </div>
    </article>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-gray-50 p-2"><span className="block text-[10px] text-gray-400">{label}</span><strong className="mt-1 block text-gray-700">{value}</strong></div>;
}
