// src/pages/Admin/AdminContactsPage.tsx
import { useEffect, useState, useCallback } from 'react';
import { MessageSquare, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { adminGetContacts, adminUpdateContact } from '@/services/contactService';
import { LoadingSpinner, EmptyState } from '@/components/LoadingSpinner';
import { Pagination } from '@/components/Pagination';
import type { ContactMessage } from '@/types';

const STATUS_LABELS: Record<ContactMessage['status'], { label: string; cls: string }> = {
  NEW: { label: 'Mới', cls: 'bg-yellow-100 text-yellow-700' },
  READING: { label: 'Đang đọc', cls: 'bg-blue-100 text-blue-700' },
  REPLIED: { label: 'Đã phản hồi', cls: 'bg-green-100 text-green-700' },
  CLOSED: { label: 'Đã đóng', cls: 'bg-gray-100 text-gray-500' },
};

export function AdminContactsPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const fetch = useCallback(() => {
    setLoading(true);
    adminGetContacts({ status: filterStatus || undefined, page })
      .then((r) => { setMessages(r.messages ?? []); setTotal(r.total); setTotalPages(r.totalPages); })
      .catch(console.error).finally(() => setLoading(false));
  }, [filterStatus, page]);

  useEffect(() => { fetch(); }, [fetch]);

  function openDetail(msg: ContactMessage) {
    setSelected(msg);
    setNote(msg.note ?? '');
    if (msg.status === 'NEW') {
      adminUpdateContact(msg.id, { status: 'READING' }).then(fetch);
    }
  }

  async function handleUpdate(status: ContactMessage['status']) {
    if (!selected) return;
    setSaving(true);
    try {
      await adminUpdateContact(selected.id, { status, note });
      toast.success('Đã cập nhật');
      setSelected(null);
      fetch();
    } catch (err) { toast.error((err as Error).message); }
    finally { setSaving(false); }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-gray-900">Liên hệ khách hàng</h1>
          <p className="text-gray-400 text-sm">{total} tin nhắn</p>
        </div>
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400"
        >
          <option value="">Tất cả trạng thái</option>
          {Object.entries(STATUS_LABELS).map(([v, { label }]) => (
            <option key={v} value={v}>{label}</option>
          ))}
        </select>
      </div>

      {loading ? <LoadingSpinner className="py-20" /> : messages.length === 0 ? (
        <EmptyState icon={MessageSquare} title="Chưa có tin nhắn nào" />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Khách hàng', 'Nội dung', 'Thời gian', 'Trạng thái', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {messages.map((msg) => {
                const st = STATUS_LABELS[msg.status];
                return (
                  <tr key={msg.id} className={clsx('hover:bg-gray-50/50 transition-colors', msg.status === 'NEW' && 'bg-yellow-50/40')}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{msg.name}</p>
                      <p className="text-xs text-gray-400">{msg.phone}</p>
                      {msg.email && <p className="text-xs text-gray-400">{msg.email}</p>}
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-gray-700 line-clamp-3 whitespace-pre-line text-xs leading-relaxed">{msg.message}</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-400 text-xs">
                      {new Date(msg.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={clsx('badge', st.cls)}>{st.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openDetail(msg)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50"
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-black text-gray-900">Chi tiết liên hệ</h3>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-gray-400">Họ tên</p><p className="font-semibold">{selected.name}</p></div>
                <div><p className="text-xs text-gray-400">Điện thoại</p><a href={`tel:${selected.phone}`} className="font-semibold text-brand-600">{selected.phone}</a></div>
                {selected.email && <div><p className="text-xs text-gray-400">Email</p><p className="font-semibold">{selected.email}</p></div>}
                <div><p className="text-xs text-gray-400">Ngày gửi</p><p className="text-sm">{new Date(selected.createdAt).toLocaleString('vi-VN')}</p></div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-1">Nội dung</p>
                <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">{selected.message}</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase">Ghi chú nội bộ</label>
                <textarea className={clsx('field-input resize-none', note.includes('[Hệ thống]') && 'border-amber-200 bg-amber-50/50')} rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ghi chú về khách hàng này..." />
                {note.includes('[Hệ thống]') && <p className="mt-1.5 text-xs text-amber-700">Email thông báo chưa gửi thành công. Kiểm tra SMTP và dùng chức năng gửi email thử trong Cài đặt.</p>}
              </div>
              <div className="flex gap-2 flex-wrap">
                {(['READING', 'REPLIED', 'CLOSED'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => handleUpdate(s)}
                    disabled={saving || selected.status === s}
                    className={clsx(
                      'text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50',
                      STATUS_LABELS[s].cls,
                      'hover:opacity-80'
                    )}
                  >
                    → {STATUS_LABELS[s].label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
