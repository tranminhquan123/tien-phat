// src/pages/Admin/AdminSettingsPage.tsx
import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { getSiteConfig, adminUpdateConfig } from '@/services/configService';
import { changePassword } from '@/services/authService';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import type { SiteConfig } from '@/types';

const CONFIG_FIELDS: { key: keyof SiteConfig; label: string; placeholder: string; type?: string }[] = [
  { key: 'site_name', label: 'Tên công ty', placeholder: 'Công ty TNHH Tiến Phát' },
  { key: 'site_phone', label: 'Số điện thoại', placeholder: '0909 123 456', type: 'tel' },
  { key: 'site_email', label: 'Email', placeholder: 'info@tienphat.com.vn', type: 'email' },
  { key: 'site_address', label: 'Địa chỉ', placeholder: '123 Nguyễn Văn Linh, Q.7, TP.HCM' },
  { key: 'site_zalo', label: 'Số Zalo', placeholder: '0764432015' },
  { key: 'site_facebook', label: 'Facebook URL', placeholder: 'https://facebook.com/...' },
  { key: 'site_working_hours', label: 'Giờ làm việc', placeholder: 'Thứ 2 - Thứ 7: 7:30 - 17:30' },
];

export function AdminSettingsPage() {
  const [config, setConfig] = useState<Partial<SiteConfig>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [pwForm, setPwForm] = useState({ oldPassword: '', newPassword: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    getSiteConfig()
      .then((r) => setConfig(r.data ?? {}))
      .finally(() => setLoading(false));
  }, []);

  async function handleSaveConfig() {
    setSaving(true);
    try {
      await adminUpdateConfig(config as SiteConfig);
      toast.success('Đã lưu cài đặt website');
    } catch (err) { toast.error((err as Error).message); }
    finally { setSaving(false); }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!pwForm.oldPassword || !pwForm.newPassword) { toast.error('Nhập đầy đủ thông tin'); return; }
    if (pwForm.newPassword !== pwForm.confirm) { toast.error('Mật khẩu mới không khớp'); return; }
    if (pwForm.newPassword.length < 6) { toast.error('Mật khẩu tối thiểu 6 ký tự'); return; }
    setPwSaving(true);
    try {
      await changePassword(pwForm.oldPassword, pwForm.newPassword);
      toast.success('Đã đổi mật khẩu thành công');
      setPwForm({ oldPassword: '', newPassword: '', confirm: '' });
    } catch (err) { toast.error((err as Error).message); }
    finally { setPwSaving(false); }
  }

  if (loading) return <LoadingSpinner className="py-20" />;

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-xl font-black text-gray-900 mb-1">Cài đặt</h1>
        <p className="text-gray-400 text-sm">Thông tin công ty và cài đặt hệ thống</p>
      </div>

      {/* Site config */}
      <div className="card p-6">
        <h2 className="font-bold text-gray-900 mb-5">Thông tin công ty</h2>
        <div className="space-y-4">
          {CONFIG_FIELDS.map(({ key, label, placeholder, type = 'text' }) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">{label}</label>
              <input
                type={type}
                className="field-input"
                value={config[key] ?? ''}
                onChange={(e) => setConfig((p) => ({ ...p, [key]: e.target.value }))}
                placeholder={placeholder}
              />
            </div>
          ))}
        </div>
        <button onClick={handleSaveConfig} disabled={saving} className="btn-primary text-sm mt-6 disabled:opacity-60">
          <Save size={16} /> {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
        </button>
      </div>

      {/* Change password */}
      <div className="card p-6">
        <h2 className="font-bold text-gray-900 mb-5">Đổi mật khẩu</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          {[
            { key: 'oldPassword', label: 'Mật khẩu hiện tại' },
            { key: 'newPassword', label: 'Mật khẩu mới' },
            { key: 'confirm', label: 'Xác nhận mật khẩu mới' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">{label}</label>
              <input
                type="password"
                className="field-input"
                value={pwForm[key as keyof typeof pwForm]}
                onChange={(e) => setPwForm((p) => ({ ...p, [key]: e.target.value }))}
                placeholder="••••••••"
              />
            </div>
          ))}
          <button type="submit" disabled={pwSaving} className="btn-primary text-sm disabled:opacity-60">
            {pwSaving ? 'Đang đổi...' : 'Đổi mật khẩu'}
          </button>
        </form>
      </div>
    </div>
  );
}
