import type { TeamRole } from '@/types/teamMember';
import type { TeamMemberInput } from '@/services/teamWriteClient';

export function TeamFormFields({ form, setForm, includePassword }: {
  form: TeamMemberInput;
  setForm: (value: TeamMemberInput) => void;
  includePassword: boolean;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="Họ và tên"><input required minLength={2} className="field-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
      <Field label="Tên đăng nhập"><input required minLength={4} className="field-input" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></Field>
      <Field label="Email"><input type="email" className="field-input" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
      <Field label="Số điện thoại"><input className="field-input" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
      <Field label="Vai trò"><select className="field-input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as TeamRole })}><option value="STAFF">Nhân viên</option><option value="MANAGER">Quản lý</option><option value="OWNER">Chủ tài khoản</option></select></Field>
      {includePassword && <Field label="Mật khẩu"><input required type="password" minLength={8} className="field-input" value={form.password || ''} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label><span className="mb-1.5 block text-xs font-bold uppercase text-gray-500">{label}</span>{children}</label>;
}
