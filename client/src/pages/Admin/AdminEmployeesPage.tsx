import { useCallback, useEffect, useMemo, useState } from 'react';
import { Eye, Pencil, Plus, Search, UserCheck, UserX } from 'lucide-react';
import toast from 'react-hot-toast';
import { TeamFormModal } from '@/components/team/TeamFormModal';
import { TeamStatsCards } from '@/components/team/TeamStatsCards';
import { getEmployee, getEmployees, getEmployeeStats } from '@/services/employeeClient';
import { addTeamMember, saveTeamMember, type TeamMemberInput } from '@/services/teamWriteClient';
import { api } from '@/services/api';
import type { TeamMember, TeamRole, TeamStats } from '@/types/teamMember';

const EMPTY_STATS: TeamStats = {
  total: 0,
  active: 0,
  inactive: 0,
  owners: 0,
  managers: 0,
  staff: 0,
  assigned: 0,
};

const ROLE_LABEL: Record<TeamRole, string> = {
  OWNER: 'Chủ tài khoản',
  MANAGER: 'Quản lý',
  STAFF: 'Nhân viên',
};

type EmployeeDetail = TeamMember & {
  assignedContacts?: Array<{ id: string; name: string; phone: string; status: string }>;
  chatSessions?: Array<{ id: string; customerName?: string | null; phone?: string | null; status: string }>;
  auditTargets?: Array<{
    id: string;
    action: string;
    createdAt: string;
    actorAdmin: { name: string; username: string };
  }>;
};

export function AdminEmployeesPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [stats, setStats] = useState<TeamStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<TeamRole | ''>('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE' | ''>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState<EmployeeDetail | null>(null);
  const [statusTarget, setStatusTarget] = useState<TeamMember | null>(null);
  const [replacementId, setReplacementId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, summary] = await Promise.all([
        getEmployees({
          search: search || undefined,
          role: role || undefined,
          status: status || undefined,
          page,
          limit: 20,
        }),
        getEmployeeStats(),
      ]);
      setMembers(list.employees || []);
      setTotalPages(list.totalPages || 1);
      setStats(summary.data || EMPTY_STATS);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [page, role, search, status]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, role, status]);

  const replacementOptions = useMemo(
    () => members.filter((member) => member.id !== statusTarget?.id && member.isActive && !member.deletedAt),
    [members, statusTarget]
  );

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(member: TeamMember) {
    setEditing(member);
    setFormOpen(true);
  }

  async function save(data: TeamMemberInput) {
    setSaving(true);
    try {
      if (editing) await saveTeamMember(editing.id, data);
      else await addTeamMember(data);
      toast.success(editing ? 'Đã cập nhật nhân viên' : 'Đã thêm nhân viên');
      setFormOpen(false);
      await load();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function view(member: TeamMember) {
    try {
      const response = await getEmployee(member.id);
      setDetail(response.data as EmployeeDetail);
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  async function reactivate(member: TeamMember) {
    try {
      await saveTeamMember(member.id, { isActive: true });
      toast.success('Đã kích hoạt lại nhân viên');
      await load();
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  async function confirmDisable() {
    if (!statusTarget) return;
    const workload = (statusTarget.activeContactCount || 0) + (statusTarget.activeChatCount || 0);
    if (workload > 0 && !replacementId) {
      toast.error('Hãy chọn nhân viên nhận bàn giao');
      return;
    }
    try {
      await api.put(`/auth/team/${statusTarget.id}/status`, {
        reassignToAdminId: replacementId || null,
      });
      toast.success('Đã vô hiệu hóa tài khoản và bàn giao dữ liệu');
      setStatusTarget(null);
      setReplacementId('');
      await load();
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Quản lý nhân viên</h1>
          <p className="mt-1 text-sm text-gray-500">Quản lý tài khoản, quyền hạn và việc phân công khách hàng.</p>
        </div>
        <button type="button" onClick={openCreate} className="btn-primary text-sm">
          <Plus size={16} /> Thêm nhân viên
        </button>
      </div>

      <TeamStatsCards stats={stats} />

      <div className="grid gap-3 rounded-xl border border-gray-200 bg-white p-4 md:grid-cols-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-3 text-sm"
            placeholder="Tên, tài khoản, email, điện thoại..."
          />
        </div>
        <select value={role} onChange={(event) => setRole(event.target.value as TeamRole | '')} className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm">
          <option value="">Mọi vai trò</option>
          <option value="OWNER">Chủ tài khoản</option>
          <option value="MANAGER">Quản lý</option>
          <option value="STAFF">Nhân viên</option>
        </select>
        <select value={status} onChange={(event) => setStatus(event.target.value as 'ACTIVE' | 'INACTIVE' | '')} className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm">
          <option value="">Mọi trạng thái</option>
          <option value="ACTIVE">Đang hoạt động</option>
          <option value="INACTIVE">Đã vô hiệu hóa</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Nhân viên</th>
                <th className="px-4 py-3">Liên hệ</th>
                <th className="px-4 py-3">Vai trò</th>
                <th className="px-4 py-3">Khách / Hội thoại</th>
                <th className="px-4 py-3">Đăng nhập gần nhất</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-16 text-center text-gray-400">Đang tải danh sách...</td></tr>
              ) : members.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-16 text-center text-gray-400">Không tìm thấy nhân viên phù hợp.</td></tr>
              ) : members.map((member) => {
                const active = member.isActive && !member.deletedAt;
                return (
                  <tr key={member.id} className="hover:bg-gray-50/70">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 font-black text-brand-700">
                          {member.name.trim().charAt(0).toUpperCase()}
                        </span>
                        <div><p className="font-bold text-gray-900">{member.name}</p><p className="text-xs text-gray-400">@{member.username}</p></div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600"><p>{member.email || '—'}</p><p className="text-xs text-gray-400">{member.phone || '—'}</p></td>
                    <td className="px-4 py-3"><span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-700">{ROLE_LABEL[member.role]}</span></td>
                    <td className="px-4 py-3 text-gray-600">{member.activeContactCount || 0} khách / {member.activeChatCount || 0} hội thoại</td>
                    <td className="px-4 py-3 text-gray-500">{member.lastLoginAt ? new Date(member.lastLoginAt).toLocaleString('vi-VN') : 'Chưa đăng nhập'}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{active ? 'Hoạt động' : 'Vô hiệu hóa'}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button type="button" onClick={() => void view(member)} className="rounded-lg p-2 text-gray-400 hover:bg-blue-50 hover:text-blue-600" title="Xem"><Eye size={16} /></button>
                        <button type="button" onClick={() => openEdit(member)} className="rounded-lg p-2 text-gray-400 hover:bg-brand-50 hover:text-brand-600" title="Sửa"><Pencil size={16} /></button>
                        {active ? (
                          <button type="button" onClick={() => setStatusTarget(member)} className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600" title="Vô hiệu hóa"><UserX size={16} /></button>
                        ) : (
                          <button type="button" onClick={() => void reactivate(member)} className="rounded-lg p-2 text-gray-400 hover:bg-green-50 hover:text-green-600" title="Kích hoạt"><UserCheck size={16} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 text-sm">
          <span className="text-gray-500">Trang {page}/{totalPages}</span>
          <div className="flex gap-2">
            <button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="btn-outline disabled:opacity-40">Trước</button>
            <button type="button" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)} className="btn-outline disabled:opacity-40">Sau</button>
          </div>
        </div>
      </div>

      {formOpen && <TeamFormModal member={editing} saving={saving} onClose={() => setFormOpen(false)} onSave={save} />}

      {statusTarget && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-black text-gray-900">Vô hiệu hóa {statusTarget.name}</h2>
            <p className="mt-2 text-sm text-gray-600">Nhân viên đang phụ trách {statusTarget.activeContactCount || 0} khách hàng và {statusTarget.activeChatCount || 0} hội thoại đang hoạt động.</p>
            {((statusTarget.activeContactCount || 0) + (statusTarget.activeChatCount || 0)) > 0 && (
              <label className="mt-4 block">
                <span className="mb-1.5 block text-xs font-bold uppercase text-gray-500">Nhân viên nhận bàn giao</span>
                <select value={replacementId} onChange={(event) => setReplacementId(event.target.value)} className="field-input">
                  <option value="">Chọn nhân viên</option>
                  {replacementOptions.map((member) => <option key={member.id} value={member.id}>{member.name} — {ROLE_LABEL[member.role]}</option>)}
                </select>
              </label>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => { setStatusTarget(null); setReplacementId(''); }} className="btn-outline">Hủy</button>
              <button type="button" onClick={() => void confirmDisable()} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700">Bàn giao và vô hiệu hóa</button>
            </div>
          </div>
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-[85] flex justify-end bg-black/30" onClick={() => setDetail(null)}>
          <aside className="h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-3"><div><h2 className="text-xl font-black text-gray-900">{detail.name}</h2><p className="text-sm text-gray-400">@{detail.username}</p></div><button type="button" onClick={() => setDetail(null)} className="btn-outline">Đóng</button></div>
            <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
              <Info label="Vai trò" value={ROLE_LABEL[detail.role]} />
              <Info label="Trạng thái" value={detail.isActive && !detail.deletedAt ? 'Hoạt động' : 'Vô hiệu hóa'} />
              <Info label="Email" value={detail.email || '—'} />
              <Info label="Điện thoại" value={detail.phone || '—'} />
              <Info label="Ngày tạo" value={new Date(detail.createdAt).toLocaleString('vi-VN')} />
              <Info label="Đăng nhập gần nhất" value={detail.lastLoginAt ? new Date(detail.lastLoginAt).toLocaleString('vi-VN') : 'Chưa đăng nhập'} />
            </dl>
            <h3 className="mt-7 font-black text-gray-900">Khách đang phụ trách ({detail.assignedContacts?.length || 0})</h3>
            <div className="mt-2 space-y-2">{detail.assignedContacts?.map((contact) => <div key={contact.id} className="rounded-lg bg-gray-50 p-3 text-sm"><strong>{contact.name}</strong><p className="text-xs text-gray-500">{contact.phone} · {contact.status}</p></div>) || null}</div>
            <h3 className="mt-7 font-black text-gray-900">Lịch sử quản trị</h3>
            <div className="mt-2 space-y-2">{detail.auditTargets?.map((log) => <div key={log.id} className="rounded-lg border border-gray-100 p-3 text-sm"><strong>{log.actorAdmin.name}</strong> — {log.action}<p className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleString('vi-VN')}</p></div>) || null}</div>
          </aside>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-gray-50 p-3"><dt className="text-xs font-bold uppercase text-gray-400">{label}</dt><dd className="mt-1 font-semibold text-gray-800">{value}</dd></div>;
}
