import { useEffect, useState } from 'react';
import { Mail, MessageCircle, Phone, X } from 'lucide-react';
import type { AdminUser } from '@/types';
import type { ContactPriority, ContactStatus, CrmContactDetail } from '@/types/crm';
import type { CrmUpdatePayload } from '@/services/crmService';
import { PRIORITY_META, STATUS_META } from './crmConstants';

export function CrmDetailPanel({
  detail,
  admins,
  saving,
  onClose,
  onSave,
}: {
  detail: CrmContactDetail;
  admins: AdminUser[];
  saving: boolean;
  onClose: () => void;
  onSave: (data: CrmUpdatePayload) => Promise<void>;
}) {
  const contact = detail.contact;
  const [status, setStatus] = useState<ContactStatus>(contact.status);
  const [priority, setPriority] = useState<ContactPriority>(contact.priority);
  const [assignedAdminId, setAssignedAdminId] = useState(contact.assignedAdminId || '');
  const [followUpAt, setFollowUpAt] = useState(toLocalInput(contact.followUpAt));
  const [note, setNote] = useState(contact.note || '');

  useEffect(() => {
    setStatus(contact.status);
    setPriority(contact.priority);
    setAssignedAdminId(contact.assignedAdminId || '');
    setFollowUpAt(toLocalInput(contact.followUpAt));
    setNote(contact.note || '');
  }, [contact.id, contact.updatedAt]);

  async function save() {
    await onSave({
      status,
      priority,
      assignedAdminId: assignedAdminId || null,
      followUpAt: followUpAt ? new Date(followUpAt).toISOString() : null,
      note,
    });
  }

  return (
    <div className="fixed inset-0 z-[80] flex justify-end">
      <button type="button" aria-label="Đóng" onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <aside className="relative flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl">
        <header className="flex items-start gap-3 border-b border-gray-100 px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-black text-gray-900">{contact.name}</h2>
            <p className="mt-1 text-sm text-gray-500">{contact.phone}{contact.email ? ` · ${contact.email}` : ''}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"><X size={20} /></button>
        </header>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
          <div className="grid grid-cols-3 gap-2">
            <a href={`tel:${contact.phone}`} className="flex items-center justify-center gap-2 rounded-xl border border-green-100 bg-green-50 px-3 py-2.5 text-xs font-bold text-green-700"><Phone size={16} /> Gọi</a>
            <a href={`https://zalo.me/${contact.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5 text-xs font-bold text-blue-700"><MessageCircle size={16} /> Zalo</a>
            <a href={contact.email ? `mailto:${contact.email}` : undefined} className="flex items-center justify-center gap-2 rounded-xl border border-violet-100 bg-violet-50 px-3 py-2.5 text-xs font-bold text-violet-700"><Mail size={16} /> Email</a>
          </div>

          <section className="grid gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 md:grid-cols-2">
            <Field label="Trạng thái">
              <select value={status} onChange={(event) => setStatus(event.target.value as ContactStatus)} className="field-input py-2 text-sm">
                {Object.entries(STATUS_META).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}
              </select>
            </Field>
            <Field label="Mức ưu tiên">
              <select value={priority} onChange={(event) => setPriority(event.target.value as ContactPriority)} className="field-input py-2 text-sm">
                {Object.entries(PRIORITY_META).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}
              </select>
            </Field>
            <Field label="Người phụ trách">
              <select value={assignedAdminId} onChange={(event) => setAssignedAdminId(event.target.value)} className="field-input py-2 text-sm">
                <option value="">Chưa phân công</option>
                {admins.map((admin) => <option key={admin.id} value={admin.id}>{admin.name}</option>)}
              </select>
            </Field>
            <Field label="Liên hệ tiếp theo">
              <input type="datetime-local" value={followUpAt} onChange={(event) => setFollowUpAt(event.target.value)} className="field-input py-2 text-sm" />
            </Field>
          </section>

          {(contact.aiSummary || detail.linkedChat?.aiSummary) && (
            <section className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-violet-600">Tóm tắt AI</p>
              <p className="mt-2 text-sm leading-6 text-gray-700">{contact.aiSummary || detail.linkedChat?.aiSummary}</p>
              {(contact.leadScore ?? detail.linkedChat?.leadScore) !== null && <p className="mt-2 text-xs font-bold text-violet-700">Điểm tiềm năng: {contact.leadScore ?? detail.linkedChat?.leadScore}/100</p>}
            </section>
          )}

          <section className="rounded-2xl border border-gray-200 p-4">
            <p className="text-xs font-black uppercase tracking-wide text-gray-500">Nội dung yêu cầu</p>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-gray-700">{contact.message}</p>
          </section>

          <Field label="Ghi chú nội bộ">
            <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={4} className="field-input resize-none text-sm" placeholder="Thông tin chỉ nhân viên nhìn thấy..." />
          </Field>

          <section>
            <p className="mb-3 text-xs font-black uppercase tracking-wide text-gray-500">Lịch sử hoạt động</p>
            <div className="space-y-2">
              {contact.activities.map((item) => (
                <article key={item.id} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                  <div className="flex justify-between gap-3"><strong className="text-[11px] text-gray-700">{item.type}</strong><time className="text-[10px] text-gray-400">{new Date(item.createdAt).toLocaleString('vi-VN')}</time></div>
                  <p className="mt-1 whitespace-pre-line text-xs leading-5 text-gray-600">{item.content}</p>
                </article>
              ))}
            </div>
          </section>
        </div>

        <footer className="flex gap-2 border-t border-gray-100 bg-white p-4">
          <button type="button" onClick={onClose} className="btn-outline flex-1 justify-center">Hủy</button>
          <button type="button" disabled={saving} onClick={save} className="btn-primary flex-[1.5] justify-center disabled:opacity-50">{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
        </footer>
      </aside>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">{label}</span>{children}</label>;
}

function toLocalInput(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}
