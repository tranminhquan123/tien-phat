import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { TeamEmptyState } from '@/components/team/TeamEmptyState';
import { TeamFormModal } from '@/components/team/TeamFormModal';
import { TeamMemberCard } from '@/components/team/TeamMemberCard';
import { TeamStatsCards } from '@/components/team/TeamStatsCards';
import { api } from '@/services/api';
import { addTeamMember, saveTeamMember, type TeamMemberInput } from '@/services/teamWriteClient';
import type { TeamMember, TeamRole } from '@/types/teamMember';
import { useTeamDirectory } from './team/useTeamDirectory';

export function AdminTeamPage() {
  const team = useTeamDirectory();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(member: TeamMember) {
    setEditing(member);
    setModalOpen(true);
  }

  async function save(data: TeamMemberInput) {
    setSaving(true);
    try {
      if (editing) await saveTeamMember(editing.id, data);
      else await addTeamMember(data);
      toast.success(editing ? 'Đã cập nhật nhân viên' : 'Đã thêm nhân viên');
      setModalOpen(false);
      await team.refresh();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(member: TeamMember) {
    const count = (member.activeContactCount || 0) + (member.activeChatCount || 0);
    let replacementId: string | null = null;
    if (count > 0) {
      const options = team.members
        .filter((item) => item.id !== member.id && item.isActive && !item.deletedAt)
        .map((item) => `${item.name}: ${item.id}`)
        .join('\n');
      replacementId = window.prompt(`Nhập ID người nhận bàn giao:\n${options}`)?.trim() || null;
      if (!replacementId) return;
    } else if (!window.confirm(`Ngừng tài khoản của ${member.name}?`)) {
      return;
    }

    try {
      await api.put(`/auth/team/${member.id}/status`, { reassignToAdminId: replacementId });
      toast.success('Đã cập nhật trạng thái nhân viên');
      await team.refresh();
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h1 className="text-xl font-black text-gray-900">Quản lý nhân viên</h1><p className="mt-1 text-sm text-gray-400">Quản lý tài khoản và phân công khách hàng.</p></div>
        <button type="button" onClick={openCreate} className="btn-primary text-sm"><Plus size={16} /> Thêm nhân viên</button>
      </div>
      <TeamStatsCards stats={team.stats} />
      <div className="grid gap-2 rounded-xl border border-gray-200 bg-white p-3 md:grid-cols-3">
        <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input value={team.search} onChange={(e) => team.setSearch(e.target.value)} className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-3 text-sm" placeholder="Tên, tài khoản, email..." /></div>
        <select value={team.role} onChange={(e) => team.setRole(e.target.value as TeamRole | '')} className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm"><option value="">Mọi vai trò</option><option value="OWNER">Chủ tài khoản</option><option value="MANAGER">Quản lý</option><option value="STAFF">Nhân viên</option></select>
        <select value={team.status} onChange={(e) => team.setStatus(e.target.value as 'ACTIVE' | 'INACTIVE' | '')} className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm"><option value="">Mọi trạng thái</option><option value="ACTIVE">Đang hoạt động</option><option value="INACTIVE">Ngừng hoạt động</option></select>
      </div>
      {team.loading ? <p className="py-20 text-center text-sm text-gray-400">Đang tải...</p> : team.members.length === 0 ? <TeamEmptyState /> : <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{team.members.map((member) => <TeamMemberCard key={member.id} member={member} onEdit={openEdit} onOther={changeStatus} />)}</div>}
      {modalOpen && <TeamFormModal member={editing} saving={saving} onClose={() => setModalOpen(false)} onSave={save} />}
    </div>
  );
}
