// src/pages/Admin/AdminSettingsPage.tsx
import { useEffect, useState } from 'react';
import { MailCheck, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { getSiteConfig, adminUpdateConfig } from '@/services/configService';
import { changePassword } from '@/services/authService';
import { adminSendContactTestEmail } from '@/services/contactService';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import type { SiteConfig } from '@/types';

type ConfigField = {
  key: keyof SiteConfig;
  label: string;
  placeholder: string;
  type?: string;
  helper?: string;
};

const CONFIG_FIELDS: ConfigField[] = [
  { key: 'site_name', label: 'Tên công ty', placeholder: 'Công ty TNHH Tiến Phát' },
  { key: 'site_phone', label: 'Số điện thoại', placeholder: '0764 432 015', type: 'tel' },
  { key: 'site_email', label: 'Email hiển thị trên website', placeholder: 'info@tienphat.com.vn', type: 'email' },
  {
    key: 'contact_notification_email',
    label: 'Email nhận thông báo khách hàng',
    placeholder: 'your-email@gmail.com',
    type: 'email',
    helper: 'Mọi yêu cầu tư vấn mới sẽ được gửi tới địa chỉ này. Trên Render Free, backend ưu tiên Resend API thay vì SMTP.',
  },
  { key: 'site_address', label: 'Địa chỉ', placeholder: '137 Đường Liên Phường, Phường Phước Long, TP.HCM' },
  { key: 'site_zalo', label: 'Số Zalo', placeholder: '0764432015' },
  { key: 'site_facebook', label: 'Facebook URL', placeholder: 'https://facebook.com/...' },
  { key: 'site_working_hours', label: 'Giờ làm việc', placeholder: 'Thứ 2 - Thứ 7: 7:30 - 17:30' },
];

export function AdminSettingsPage() {
  const [config, setConfig] = useState<Partial<SiteConfig>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);

  const [pwForm, setPwForm] = useState({ oldPassword: '', newPassword: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    getSiteConfig()
      .then((response) => setConfig(response.data ?? {}))
      .catch((error) => toast.error((error as Error).message))
      .finally(() => setLoading(false));
  }, []);

  async function handleSaveConfig() {
    setSaving(true);
    try {
      await adminUpdateConfig(config as SiteConfig);
      toast.success('Đã lưu cài đặt website');
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleTestEmail() {
    const recipient = (config.contact_notification_email || config.site_email || '').trim();

    if (!recipient) {
      toast.error('Hãy nhập email nhận thông báo trước');
      return;
    }

    setTestingEmail(true);
    try {
      const response = await adminSendContactTestEmail(recipient);
      toast.success(response.message || `Đã gửi email kiểm tra đến ${recipient}`);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setTestingEmail(false);
    }
  }

  async function handleChangePassword(event: React.FormEvent) {
    event.preventDefault();
    if (!pwForm.oldPassword || !pwForm.newPassword) {
      toast.error('Nhập đầy đủ thông tin');
      return;
    }
    if (pwForm.newPassword !== pwForm.confirm) {
      toast.error('Mật khẩu mới không khớp');
      return;
    }
    if (pwForm.newPassword.length < 6) {
      toast.error('Mật khẩu tối thiểu 6 ký tự');
      return;
    }

    setPwSaving(true);
    try {
      await changePassword(pwForm.oldPassword, pwForm.newPassword);
      toast.success('Đã đổi mật khẩu thành công');
      setPwForm({ oldPassword: '', newPassword: '', confirm: '' });
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setPwSaving(false);
    }
  }

  if (loading) return <LoadingSpinner className="py-20" />;

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="mb-1 text-xl font-black text-gray-900">Cài đặt</h1>
        <p className="text-sm text-gray-400">Thông tin công ty và cài đặt hệ thống</p>
      </div>

      <div className="card p-6">
        <h2 className="mb-5 font-bold text-gray-900">Thông tin công ty</h2>
        <div className="space-y-4">
          {CONFIG_FIELDS.map(({ key, label, placeholder, type = 'text', helper }) => (
            <div key={String(key)}>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-600">
                {label}
              </label>
              <input
                type={type}
                className="field-input"
                value={config[key] ?? ''}
                onChange={(event) => setConfig((current) => ({
                  ...current,
                  [key]: event.target.value,
                }))}
                placeholder={placeholder}
              />
              {helper && <p className="mt-1.5 text-xs leading-relaxed text-gray-400">{helper}</p>}
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={handleSaveConfig}
            disabled={saving}
            className="btn-primary text-sm disabled:opacity-60"
          >
            <Save size={16} /> {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
          </button>
          <button
            onClick={handleTestEmail}
            disabled={testingEmail}
            className="btn-outline text-sm disabled:opacity-60"
          >
            <MailCheck size={16} /> {testingEmail ? 'Đang gửi...' : 'Gửi email kiểm tra'}
          </button>
        </div>

        <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800">
          Render Free chặn các cổng SMTP thông dụng. Hãy cấu hình RESEND_API_KEY trong Environment của backend; SMTP chỉ được dùng làm phương án dự phòng ở môi trường cho phép kết nối SMTP.
        </div>
      </div>

      <div className="card p-6">
        <h2 className="mb-5 font-bold text-gray-900">Đổi mật khẩu</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          {[
            { key: 'oldPassword', label: 'Mật khẩu hiện tại' },
            { key: 'newPassword', label: 'Mật khẩu mới' },
            { key: 'confirm', label: 'Xác nhận mật khẩu mới' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-600">
                {label}
              </label>
              <input
                type="password"
                className="field-input"
                value={pwForm[key as keyof typeof pwForm]}
                onChange={(event) => setPwForm((current) => ({
                  ...current,
                  [key]: event.target.value,
                }))}
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
