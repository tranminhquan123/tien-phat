import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  CircleDollarSign,
  Clock3,
  Columns3,
  Headphones,
  Inbox,
  List,
  Loader2,
  RefreshCw,
  Search,
  Trophy,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { AdminUser } from '@/types';
import type {
  ContactPriority,
  ContactSource,
  ContactStatus,
  CrmContact,
  CrmContactDetail,
  CrmStats,
} from '@/types/crm';
import {
  getCrmContact,
  getCrmContacts,
  getCrmOptions,
  getCrmStats,
  updateCrmContact,
  type CrmListParams,
  type CrmUpdatePayload,
} from '@/services/crmService';
import { CrmDetailPanel } from '@/components/crm/CrmDetailPanel';
import { CrmKanban } from '@/components/crm/CrmKanban';
import { CrmList } from '@/components/crm/CrmList';
import { PRIORITY_META, SOURCE_LABELS, STATUS_META } from '@/components/crm/crmConstants';
import { Pagination } from '@/components/Pagination';

const EMPTY_STATS: CrmStats = {
  total: 0,
  new: 0,
  consulting: 0,
  waitingCustomer: 0,
  quoted: 0,
  won: 0,
  lost: 0,
  highPriority: 0,
  followUpToday: 0,
  overdue: 0,
};

export function AdminContactsPage() {
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [stats, setStats] = useState<CrmStats>(EMPTY_STATS);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [detail, setDetail] = useState<CrmContactDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [view, setView] = useState<'LIST' | 'KANBAN'>('LIST');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ContactStatus | ''>('');
  const [priority, setPriority] = useState<ContactPriority | ''>('');
  const [source, setSource] = useState<ContactSource | ''>('');
  const [followUp, setFollowUp] = useState<CrmListParams['followUp'] | ''>('');

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [listResponse, statsResponse] = await Promise.all([
        getCrmContacts({
          status: status || undefined,
          priority: priority || undefined,
          source: source || undefined,
          followUp: followUp || undefined,
          search: search || undefined,
          page,
          limit: view === 'KANBAN' ? 100 : 30,
        }),
        getCrmStats(),
      ]);
      setContacts(listResponse.messages ?? []);
      setTotal(listResponse.total);
      setTotalPages(listResponse.totalPages);
      setStats(statsResponse.data ?? EMPTY_STATS);
    } catch (error) {
      if (!silent) toast.error((error as Error).message || 'Không thể tải dữ liệu CRM');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [status, priority, source, followUp, search, page, view]);

  useEffect(() => {
    getCrmOptions().then((response) => setAdmins(response.data.admins ?? [])).catch(() => undefined);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    void load();
  }, [load]);

  async function openContact(id: string) {
    setDetailLoading(true);
    try {
      const response = await getCrmContact(id);
      let next = response.data;
      if (next.contact.status === 'NEW') {
        await updateCrmContact(id, { status: 'READING' });
        next = (await getCrmContact(id)).data;
        void load(true);
      }
      setDetail(next);
    } catch (error) {
      toast.error((error as Error).message || 'Không thể mở khách hàng');
    } finally {
      setDetailLoading(false);
    }
  }

  async function saveContact(data: CrmUpdatePayload) {
    if (!detail || saving) return;
    setSaving(true);
    try {
      await updateCrmContact(detail.contact.id, data);
      const refreshed = await getCrmContact(detail.contact.id);
      setDetail(refreshed.data);
      await load(true);
      toast.success('Đã cập nhật hồ sơ khách hàng');
    } catch (error) {
      toast.error((error as Error).message || 'Không thể cập nhật khách hàng');
    } finally {
      setSaving(false);
    }
  }

  async function moveContact(id: string, nextStatus: ContactStatus) {
    const current = contacts.find((item) => item.id === id);
    if (!current || current.status === nextStatus) return;
    setContacts((items) => items.map((item) => item.id === id ? { ...item, status: nextStatus } : item));
    try {
      await updateCrmContact(id, { status: nextStatus });
      await load(true);
      toast.success(`Đã chuyển sang ${STATUS_META[nextStatus].label}`);
    } catch (error) {
      setContacts((items) => items.map((item) => item.id === id ? current : item));
      toast.error((error as Error).message || 'Không thể chuyển trạng thái');
    }
  }

  function applyStatFilter(filter: string) {
    setPage(1);
    if (filter === 'TODAY' || filter === 'OVERDUE') {
      setStatus('');
      setFollowUp(filter);
    } else {
      setFollowUp('');
      setStatus(filter as ContactStatus);
    }
  }

  function clearFilters() {
    setSearchInput('');
    setSearch('');
    setStatus('');
    setPriority('');
    setSource('');
    setFollowUp('');
    setPage(1);
  }

  const statCards = [
    { label: 'Khách mới', value: stats.new, icon: Inbox, filter: 'NEW', tone: 'bg-amber-50 text-amber-700' },
    { label: 'Đang tư vấn', value: stats.consulting, icon: Headphones, filter: 'CONSULTING', tone: 'bg-blue-50 text-blue-700' },
    { label: 'Đã báo giá', value: stats.quoted, icon: CircleDollarSign, filter: 'QUOTED', tone: 'bg-indigo-50 text-indigo-700' },
    { label: 'Đã chốt', value: stats.won, icon: Trophy, filter: 'WON', tone: 'bg-green-50 text-green-700' },
    { label: 'Chăm sóc hôm nay', value: stats.followUpToday, icon: Clock3, filter: 'TODAY', tone: 'bg-violet-50 text-violet-700' },
    { label: 'Quá hạn', value: stats.overdue, icon: AlertTriangle, filter: 'OVERDUE', tone: 'bg-red-50 text-red-700' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2"><h1 className="text-xl font-black text-gray-900">Mini CRM khách hàng</h1><span className="rounded-full bg-brand-100 px-2.5 py-1 text-[10px] font-black text-brand-700">{total} khách</span></div>
          <p className="mt-1 text-sm text-gray-400">Quản lý nhu cầu, lịch chăm sóc và tiến trình bán hàng.</p>
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-lg border border-gray-200 bg-white p-1">
            <button type="button" onClick={() => setView('LIST')} className={`rounded-md p-2 ${view === 'LIST' ? 'bg-brand-50 text-brand-700' : 'text-gray-400'}`} title="Danh sách"><List size={17} /></button>
            <button type="button" onClick={() => setView('KANBAN')} className={`rounded-md p-2 ${view === 'KANBAN' ? 'bg-brand-50 text-brand-700' : 'text-gray-400'}`} title="Quy trình"><Columns3 size={17} /></button>
          </div>
          <button type="button" onClick={() => void load()} className="btn-outline text-sm"><RefreshCw size={16} /> Làm mới</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-6">
        {statCards.map((card) => (
          <button key={card.label} type="button" onClick={() => applyStatFilter(card.filter)} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 text-left transition hover:-translate-y-0.5 hover:shadow-sm">
            <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.tone}`}><card.icon size={18} /></span>
            <span><strong className="block text-lg leading-none text-gray-900">{card.value}</strong><span className="mt-1 block text-xs text-gray-500">{card.label}</span></span>
          </button>
        ))}
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[minmax(220px,1.5fr)_repeat(4,minmax(140px,1fr))_auto]">
          <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-brand-400" placeholder="Tên, SĐT, nội dung, ghi chú..." /></div>
          <select value={status} onChange={(event) => { setStatus(event.target.value as ContactStatus | ''); setPage(1); }} className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none"><option value="">Tất cả trạng thái</option>{Object.entries(STATUS_META).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}</select>
          <select value={priority} onChange={(event) => { setPriority(event.target.value as ContactPriority | ''); setPage(1); }} className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none"><option value="">Mọi ưu tiên</option>{Object.entries(PRIORITY_META).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}</select>
          <select value={source} onChange={(event) => { setSource(event.target.value as ContactSource | ''); setPage(1); }} className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none"><option value="">Mọi nguồn</option>{Object.entries(SOURCE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          <select value={followUp} onChange={(event) => { setFollowUp(event.target.value as CrmListParams['followUp'] | ''); setPage(1); }} className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none"><option value="">Mọi lịch chăm sóc</option><option value="TODAY">Hôm nay</option><option value="OVERDUE">Quá hạn</option><option value="UPCOMING">Sắp tới</option><option value="NONE">Chưa đặt lịch</option></select>
          <button type="button" onClick={clearFilters} className="rounded-lg px-3 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100">Xóa lọc</button>
        </div>
      </section>

      {loading ? (
        <div className="flex min-h-80 items-center justify-center gap-2 text-sm text-gray-400"><Loader2 size={20} className="animate-spin" /> Đang tải CRM...</div>
      ) : contacts.length === 0 ? (
        <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white text-gray-400"><Inbox size={36} /><p className="mt-2 text-sm font-semibold">Không có khách hàng phù hợp</p></div>
      ) : view === 'LIST' ? (
        <CrmList contacts={contacts} onOpen={openContact} />
      ) : (
        <CrmKanban contacts={contacts} onOpen={openContact} onMove={moveContact} />
      )}

      {view === 'LIST' && <Pagination page={page} totalPages={totalPages} onChange={setPage} />}
      {detailLoading && !detail && <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/20"><Loader2 className="animate-spin text-white" /></div>}
      {detail && <CrmDetailPanel detail={detail} admins={admins} saving={saving} onClose={() => setDetail(null)} onSave={saveContact} />}
    </div>
  );
}
