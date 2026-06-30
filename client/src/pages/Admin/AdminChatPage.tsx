import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bot,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Headphones,
  Inbox,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
  RefreshCw,
  Search,
  Send,
  UserRound,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import {
  adminGetChatSession,
  adminGetChatSessions,
  adminGetChatStats,
  adminSendChatMessage,
  adminUpdateChatStatus,
} from '@/services/chatService';
import type {
  AdminChatSessionDetail,
  AdminChatSessionListItem,
  AdminChatStats,
  ChatMessage,
  ChatSessionStatus,
} from '@/types';

const STATUS_META: Record<ChatSessionStatus, { label: string; className: string }> = {
  AI_ACTIVE: { label: 'AI đang tư vấn', className: 'bg-violet-100 text-violet-700' },
  WAITING_ADMIN: { label: 'Chờ tiếp nhận', className: 'bg-amber-100 text-amber-700' },
  ADMIN_ACTIVE: { label: 'Đang hỗ trợ', className: 'bg-blue-100 text-blue-700' },
  CLOSED: { label: 'Đã đóng', className: 'bg-gray-100 text-gray-500' },
};

const INTENT_LABELS: Record<string, string> = {
  LAT_NEN: 'Lát nền',
  OP_TUONG: 'Ốp tường',
  LAT_NGOAI_TROI: 'Lát ngoài trời',
  THIET_BI_VE_SINH: 'Thiết bị vệ sinh',
  SON_NUOC: 'Sơn nước',
  CHONG_THAM: 'Chống thấm',
  NOI_THAT_GO: 'Nội thất gỗ',
  XI_MANG_VUA: 'Xi măng & vữa',
};

const EMPTY_STATS: AdminChatStats = {
  total: 0,
  aiActive: 0,
  waiting: 0,
  active: 0,
  closed: 0,
  unreadMessages: 0,
};

export function AdminChatPage() {
  const [sessions, setSessions] = useState<AdminChatSessionListItem[]>([]);
  const [stats, setStats] = useState<AdminChatStats>(EMPTY_STATS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminChatSessionDetail | null>(null);
  const [statusFilter, setStatusFilter] = useState<ChatSessionStatus | ''>('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const listBusyRef = useRef(false);
  const detailBusyRef = useRef(false);
  const messageEndRef = useRef<HTMLDivElement | null>(null);

  const loadList = useCallback(async (silent = false) => {
    if (listBusyRef.current) return;
    listBusyRef.current = true;
    if (!silent) setLoadingList(true);

    try {
      const [listResponse, statsResponse] = await Promise.all([
        adminGetChatSessions({
          status: statusFilter || undefined,
          search: search || undefined,
          limit: 50,
        }),
        adminGetChatStats(),
      ]);
      const nextSessions = listResponse.sessions ?? [];
      setSessions(nextSessions);
      setStats(statsResponse.data ?? EMPTY_STATS);
      setSelectedId((current) => current ?? nextSessions[0]?.id ?? null);
    } catch (error) {
      if (!silent) toast.error((error as Error).message || 'Không thể tải hội thoại');
    } finally {
      listBusyRef.current = false;
      if (!silent) setLoadingList(false);
    }
  }, [statusFilter, search]);

  const loadDetail = useCallback(async (sessionId: string, silent = false) => {
    if (detailBusyRef.current) return;
    detailBusyRef.current = true;
    if (!silent) setLoadingDetail(true);

    try {
      const response = await adminGetChatSession(sessionId);
      setDetail(response.data);
    } catch (error) {
      if (!silent) toast.error((error as Error).message || 'Không thể tải cuộc trò chuyện');
    } finally {
      detailBusyRef.current = false;
      if (!silent) setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    void loadDetail(selectedId);
  }, [selectedId, loadDetail]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'hidden') return;
      void loadList(true);
      if (selectedId) void loadDetail(selectedId, true);
    }, 5000);
    return () => window.clearInterval(interval);
  }, [loadList, loadDetail, selectedId]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [detail?.session.messages.length]);

  const selectedListItem = useMemo(
    () => sessions.find((item) => item.id === selectedId) ?? null,
    [sessions, selectedId]
  );

  async function sendReply() {
    const content = reply.trim();
    if (!selectedId || !content || sending) return;

    setSending(true);
    setReply('');
    try {
      const response = await adminSendChatMessage(selectedId, content);
      setDetail((current) => current ? {
        ...current,
        session: {
          ...current.session,
          ...response.data.session,
          messages: [...current.session.messages, response.data.message],
        },
      } : current);
      await loadList(true);
    } catch (error) {
      setReply(content);
      toast.error((error as Error).message || 'Không thể gửi phản hồi');
    } finally {
      setSending(false);
    }
  }

  async function changeStatus(status: ChatSessionStatus) {
    if (!selectedId || changingStatus) return;
    setChangingStatus(true);
    try {
      const response = await adminUpdateChatStatus(selectedId, status);
      setDetail(response.data);
      await loadList(true);
      toast.success(`Đã chuyển sang “${STATUS_META[status].label}”`);
    } catch (error) {
      toast.error((error as Error).message || 'Không thể cập nhật trạng thái');
    } finally {
      setChangingStatus(false);
    }
  }

  const session = detail?.session;
  const displayName = session?.customerName || selectedListItem?.customerName || 'Khách chưa cung cấp tên';

  return (
    <div className="flex min-h-0 flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900">Trung tâm hội thoại</h1>
          <p className="mt-1 text-sm text-gray-400">Theo dõi chatbot và phản hồi khách hàng trực tiếp trên website.</p>
        </div>
        <button type="button" onClick={() => { void loadList(); if (selectedId) void loadDetail(selectedId); }} className="btn-outline text-sm">
          <RefreshCw size={16} /> Làm mới
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard label="Chờ tiếp nhận" value={stats.waiting} icon={Clock3} tone="amber" active={statusFilter === 'WAITING_ADMIN'} onClick={() => setStatusFilter(statusFilter === 'WAITING_ADMIN' ? '' : 'WAITING_ADMIN')} />
        <StatCard label="Đang hỗ trợ" value={stats.active} icon={Headphones} tone="blue" active={statusFilter === 'ADMIN_ACTIVE'} onClick={() => setStatusFilter(statusFilter === 'ADMIN_ACTIVE' ? '' : 'ADMIN_ACTIVE')} />
        <StatCard label="Tin chưa đọc" value={stats.unreadMessages} icon={MessageCircle} tone="red" active={false} onClick={() => setStatusFilter('WAITING_ADMIN')} />
        <StatCard label="AI đang tư vấn" value={stats.aiActive} icon={Bot} tone="violet" active={statusFilter === 'AI_ACTIVE'} onClick={() => setStatusFilter(statusFilter === 'AI_ACTIVE' ? '' : 'AI_ACTIVE')} />
        <StatCard label="Đã đóng" value={stats.closed} icon={CheckCircle2} tone="gray" active={statusFilter === 'CLOSED'} onClick={() => setStatusFilter(statusFilter === 'CLOSED' ? '' : 'CLOSED')} />
      </div>

      <div className="grid min-h-[680px] flex-1 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm lg:grid-cols-[320px_minmax(0,1fr)] 2xl:grid-cols-[320px_minmax(0,1fr)_300px]">
        <aside className="flex min-h-0 flex-col border-b border-gray-200 lg:border-b-0 lg:border-r">
          <div className="space-y-3 border-b border-gray-100 p-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-brand-400" placeholder="Tên, SĐT, kích thước..." />
            </div>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as ChatSessionStatus | '')} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-brand-400">
              <option value="">Tất cả hội thoại</option>
              {Object.entries(STATUS_META).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}
            </select>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {loadingList ? (
              <div className="flex h-40 items-center justify-center text-gray-400"><Loader2 className="animate-spin" /></div>
            ) : sessions.length === 0 ? (
              <div className="flex h-52 flex-col items-center justify-center px-6 text-center text-gray-400"><Inbox size={32} className="mb-2" /><p className="text-sm font-semibold">Không có hội thoại phù hợp</p></div>
            ) : sessions.map((item) => (
              <SessionListItem key={item.id} item={item} selected={item.id === selectedId} onClick={() => setSelectedId(item.id)} />
            ))}
          </div>
        </aside>

        <section className="flex min-h-[620px] min-w-0 flex-col bg-gray-50/60">
          {!selectedId ? (
            <EmptyConversation />
          ) : loadingDetail && !detail ? (
            <div className="flex flex-1 items-center justify-center text-gray-400"><Loader2 className="animate-spin" /></div>
          ) : session ? (
            <>
              <div className="flex flex-wrap items-center gap-3 border-b border-gray-200 bg-white px-4 py-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 font-black text-brand-700">{displayName.charAt(0).toUpperCase()}</div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-gray-900">{displayName}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                    {session.phone && <span>{session.phone}</span>}
                    <StatusBadge status={session.status} />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {session.status !== 'ADMIN_ACTIVE' && session.status !== 'CLOSED' && (
                    <button type="button" disabled={changingStatus} onClick={() => changeStatus('ADMIN_ACTIVE')} className="btn-primary py-2 text-xs"><Headphones size={15} /> Tiếp nhận</button>
                  )}
                  {session.status === 'CLOSED' ? (
                    <button type="button" disabled={changingStatus} onClick={() => changeStatus('WAITING_ADMIN')} className="btn-outline py-2 text-xs">Mở lại</button>
                  ) : (
                    <button type="button" disabled={changingStatus} onClick={() => changeStatus('CLOSED')} className="btn-outline border-red-200 py-2 text-xs text-red-600 hover:bg-red-50"><XCircle size={15} /> Đóng</button>
                  )}
                </div>
              </div>

              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
                {session.messages.map((message) => <AdminMessageBubble key={message.id} message={message} />)}
                <div ref={messageEndRef} />
              </div>

              <div className="border-t border-gray-200 bg-white p-3">
                <form onSubmit={(event) => { event.preventDefault(); void sendReply(); }} className="flex items-end gap-2">
                  <textarea
                    value={reply}
                    onChange={(event) => setReply(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        void sendReply();
                      }
                    }}
                    disabled={session.status === 'CLOSED' || sending}
                    rows={2}
                    maxLength={2000}
                    placeholder={session.status === 'CLOSED' ? 'Mở lại hội thoại để phản hồi' : 'Nhập phản hồi cho khách hàng...'}
                    className="max-h-32 min-h-[52px] flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-brand-400 disabled:bg-gray-100"
                  />
                  <button type="submit" disabled={!reply.trim() || sending || session.status === 'CLOSED'} className="flex h-[52px] w-[52px] items-center justify-center rounded-xl bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-40">
                    {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  </button>
                </form>
                <p className="mt-1.5 text-[11px] text-gray-400">Enter để gửi · Shift + Enter để xuống dòng · Tự động đồng bộ mỗi 5 giây</p>
              </div>
            </>
          ) : null}
        </section>

        <aside className="hidden min-h-0 overflow-y-auto border-l border-gray-200 bg-white p-4 2xl:block">
          {session ? <CustomerContext detail={detail} /> : <p className="text-center text-sm text-gray-400">Chưa chọn khách hàng</p>}
        </aside>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, active, onClick, tone }: { label: string; value: number; icon: LucideIcon; active: boolean; onClick: () => void; tone: 'amber' | 'blue' | 'red' | 'violet' | 'gray' }) {
  const tones = {
    amber: 'bg-amber-50 text-amber-700',
    blue: 'bg-blue-50 text-blue-700',
    red: 'bg-red-50 text-red-700',
    violet: 'bg-violet-50 text-violet-700',
    gray: 'bg-gray-100 text-gray-600',
  };
  return (
    <button type="button" onClick={onClick} className={clsx('flex items-center gap-3 rounded-xl border bg-white p-3 text-left transition hover:-translate-y-0.5 hover:shadow-sm', active ? 'border-brand-400 ring-2 ring-brand-100' : 'border-gray-200')}>
      <span className={clsx('flex h-9 w-9 items-center justify-center rounded-lg', tones[tone])}><Icon size={18} /></span>
      <span><strong className="block text-lg leading-none text-gray-900">{value}</strong><span className="mt-1 block text-xs text-gray-500">{label}</span></span>
    </button>
  );
}

function SessionListItem({ item, selected, onClick }: { item: AdminChatSessionListItem; selected: boolean; onClick: () => void }) {
  const name = item.customerName || item.contact?.name || 'Khách chưa cung cấp tên';
  return (
    <button type="button" onClick={onClick} className={clsx('w-full border-b border-gray-100 px-3 py-3 text-left transition', selected ? 'bg-brand-50' : 'hover:bg-gray-50', item.unreadCount > 0 && !selected && 'bg-amber-50/40')}>
      <div className="flex items-start gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-black text-gray-600">{name.charAt(0).toUpperCase()}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className={clsx('truncate text-sm text-gray-900', item.unreadCount > 0 ? 'font-black' : 'font-semibold')}>{name}</p>
            {item.unreadCount > 0 && <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{item.unreadCount > 9 ? '9+' : item.unreadCount}</span>}
          </div>
          <p className="mt-0.5 line-clamp-2 text-xs leading-4 text-gray-500">{item.lastMessage?.content || 'Chưa có nội dung'}</p>
          <div className="mt-2 flex items-center justify-between gap-2"><StatusBadge status={item.status} /><span className="text-[10px] text-gray-400">{formatRelativeTime(item.lastMessageAt)}</span></div>
        </div>
      </div>
    </button>
  );
}

function StatusBadge({ status }: { status: ChatSessionStatus }) {
  const meta = STATUS_META[status];
  return <span className={clsx('rounded-full px-2 py-0.5 text-[10px] font-semibold', meta.className)}>{meta.label}</span>;
}

function EmptyConversation() {
  return <div className="flex flex-1 flex-col items-center justify-center text-gray-400"><MessageCircle size={42} className="mb-3" /><p className="font-semibold">Chọn một hội thoại để bắt đầu</p></div>;
}

function AdminMessageBubble({ message }: { message: ChatMessage }) {
  if (message.sender === 'SYSTEM') {
    return <div className="flex justify-center"><span className="rounded-full bg-gray-200 px-3 py-1 text-center text-[11px] text-gray-500">{message.content}</span></div>;
  }
  const fromAdmin = message.sender === 'ADMIN';
  const fromCustomer = message.sender === 'CUSTOMER';
  return (
    <div className={clsx('flex items-start gap-2', fromAdmin && 'flex-row-reverse')}>
      <div className={clsx('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', fromAdmin ? 'bg-brand-600 text-white' : fromCustomer ? 'bg-blue-100 text-blue-700' : 'bg-dark-900 text-white')}>
        {fromAdmin ? <Headphones size={15} /> : fromCustomer ? <UserRound size={15} /> : <Bot size={15} />}
      </div>
      <div className={clsx('max-w-[78%]', fromAdmin && 'text-right')}>
        <p className="mb-1 px-1 text-[10px] font-semibold text-gray-400">{fromAdmin ? 'Nhân viên Tiến Phát' : fromCustomer ? 'Khách hàng' : 'Trợ lý tự động'}</p>
        <div className={clsx('whitespace-pre-line rounded-2xl px-3 py-2.5 text-left text-sm leading-5', fromAdmin ? 'rounded-tr-md bg-brand-600 text-white' : fromCustomer ? 'rounded-tl-md border border-blue-100 bg-white text-gray-800 shadow-sm' : 'rounded-tl-md border border-gray-200 bg-gray-100 text-gray-700')}>{message.content}</div>
        <p className="mt-1 px-1 text-[10px] text-gray-400">
          {new Date(message.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
          {fromAdmin && <span> · {message.isRead ? 'Khách đã nhận' : 'Đã gửi'}</span>}
        </p>
      </div>
    </div>
  );
}

function CustomerContext({ detail }: { detail: AdminChatSessionDetail | null }) {
  if (!detail) return null;
  const { session, contact } = detail;
  const tags = [
    session.detectedSize && session.detectedSize.replace('x', ' x '),
    session.detectedIntent && (INTENT_LABELS[session.detectedIntent] || session.detectedIntent),
    session.detectedBrand,
    session.detectedColor && `Màu ${session.detectedColor}`,
    session.detectedSpace && session.detectedSpace.replaceAll('-', ' '),
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Thông tin khách hàng</p>
        <h3 className="mt-2 font-black text-gray-900">{session.customerName || contact?.name || 'Chưa cung cấp tên'}</h3>
        {session.phone && <p className="mt-1 text-sm text-gray-500">{session.phone}</p>}
        {session.email && <p className="mt-0.5 break-all text-sm text-gray-500">{session.email}</p>}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <ContactAction href={session.phone ? `tel:${session.phone}` : undefined} icon={Phone} label="Gọi" tone="green" />
        <ContactAction href={session.phone ? `https://zalo.me/${session.phone.replace(/\D/g, '')}` : undefined} icon={MessageCircle} label="Zalo" tone="blue" external />
        <ContactAction href={session.email ? `mailto:${session.email}` : undefined} icon={Mail} label="Email" tone="violet" />
      </div>
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">Nhu cầu nhận diện</p>
        {tags.length ? <div className="flex flex-wrap gap-2">{tags.map((tag) => <span key={tag} className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold capitalize text-brand-700">{tag}</span>)}</div> : <p className="text-sm text-gray-400">Chưa đủ dữ liệu nhận diện</p>}
      </div>
      <div className="space-y-2 text-sm">
        <InfoRow label="Người phụ trách" value={session.assignedAdmin?.name || 'Chưa tiếp nhận'} />
        <InfoRow label="Bắt đầu" value={new Date(session.createdAt).toLocaleString('vi-VN')} />
        {session.acceptedAt && <InfoRow label="Tiếp nhận lúc" value={new Date(session.acceptedAt).toLocaleString('vi-VN')} />}
      </div>
      {session.sourcePage && <a href={session.sourcePage} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl border border-gray-200 p-3 text-xs font-semibold text-gray-600 hover:border-brand-200 hover:text-brand-600"><ExternalLink size={15} /> Mở trang khách đã gửi yêu cầu</a>}
      {contact && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
          <div className="flex items-center justify-between gap-2"><p className="text-xs font-bold uppercase tracking-wide text-gray-500">Liên hệ đã liên kết</p><span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-gray-500">{contact.status}</span></div>
          {contact.note && <p className="mt-2 whitespace-pre-line text-xs leading-5 text-gray-600">{contact.note}</p>}
        </div>
      )}
    </div>
  );
}

function ContactAction({ href, icon: Icon, label, tone, external = false }: { href?: string; icon: LucideIcon; label: string; tone: 'green' | 'blue' | 'violet'; external?: boolean }) {
  const tones = {
    green: 'border-green-100 bg-green-50 text-green-700',
    blue: 'border-blue-100 bg-blue-50 text-blue-700',
    violet: 'border-violet-100 bg-violet-50 text-violet-700',
  };
  return (
    <a href={href} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined} className={clsx('flex flex-col items-center gap-1 rounded-xl border p-2 text-xs font-semibold', href ? tones[tone] : 'pointer-events-none border-gray-100 text-gray-300')}>
      <Icon size={17} /> {label}
    </a>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-3 border-b border-gray-100 py-2"><span className="text-gray-400">{label}</span><span className="text-right font-semibold text-gray-700">{value}</span></div>;
}

function formatRelativeTime(value: string) {
  const date = new Date(value);
  const diffMinutes = Math.floor((Date.now() - date.getTime()) / 60_000);
  if (diffMinutes < 1) return 'Vừa xong';
  if (diffMinutes < 60) return `${diffMinutes} phút`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ`;
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}
