import { useEffect, useState } from 'react';
import type { TeamMember } from '@/types/teamMember';
import type { TeamMemberInput } from '@/services/teamWriteClient';
import { TeamFormFields } from './TeamFormFields';

const empty: TeamMemberInput = { name: '', username: '', email: '', phone: '', role: 'STAFF', password: '' };

export function TeamFormModal({ member, saving, onClose, onSave }: {
  member: TeamMember | null;
  saving: boolean;
  onClose: () => void;
  onSave: (data: TeamMemberInput) => Promise<void>;
}) {
  const [form, setForm] = useState<TeamMemberInput>(empty);
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    setForm(member ? {
      name: member.name,
      username: member.username,
      email: member.email || '',
      phone: member.phone || '',
      role: member.role,
    } : empty);
    setConfirmPassword('');
  }, [member]);

  const passwordMismatch = !member && Boolean(form.password) && form.password !== confirmPassword;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={(event) => { event.preventDefault(); if (!passwordMismatch) void onSave(form); }} className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="font-black">{member ? 'Cập nhật nhân viên' : 'Thêm nhân viên'}</h2>
        <div className="mt-5"><TeamFormFields form={form} setForm={setForm} includePassword={!member} /></div>
        {!member && <label className="mt-4 block"><span className="mb-1.5 block text-xs font-bold uppercase text-gray-500">Xác nhận mật khẩu</span><input required type="password" minLength={8} className="field-input" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></label>}
        {passwordMismatch && <p className="mt-2 text-xs text-red-500">Mật khẩu xác nhận chưa khớp.</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-outline">Hủy</button>
          <button disabled={saving || passwordMismatch} className="btn-primary disabled:opacity-50">{saving ? 'Đang lưu...' : 'Lưu'}</button>
        </div>
      </form>
    </div>
  );
}
