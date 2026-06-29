// src/pages/Contact/ContactPage.tsx
import { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Facebook,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Ruler,
  Send,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  submitContact,
  type PreferredContact,
} from '@/services/contactService';
import { getSiteConfig } from '@/services/configService';
import { getCategoryChildren } from '@/services/categoryChildService';
import { DEFAULT_TILE_SIZES, type TileSizeOption } from '@/constants/tileSizes';
import type { SiteConfig } from '@/types';

const MAP_EMBED_URL = 'https://www.google.com/maps?q=10.807691,106.7848308&z=17&output=embed';
const MAP_OPEN_URL = 'https://www.google.com/maps/search/?api=1&query=10.807691,106.7848308';

type ContactFormState = {
  inquiryType: string;
  tileSize: string;
  area: string;
  location: string;
  preferredContact: PreferredContact;
  preferredTime: string;
  name: string;
  phone: string;
  email: string;
  message: string;
};

type InquiryOption = {
  value: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

const INITIAL_FORM: ContactFormState = {
  inquiryType: '',
  tileSize: '',
  area: '',
  location: '',
  preferredContact: 'PHONE',
  preferredTime: '',
  name: '',
  phone: '',
  email: '',
  message: '',
};

const INQUIRY_OPTIONS: InquiryOption[] = [
  { value: 'Gạch lát nền', label: 'Gạch lát nền', description: 'Phòng khách, phòng ngủ, nhà bếp', icon: Ruler },
  { value: 'Gạch ốp tường', label: 'Gạch ốp tường', description: 'Tường bếp, nhà tắm, mặt tiền', icon: Building2 },
  { value: 'Gạch lát sân / ban công', label: 'Lát sân / ban công', description: 'Ngoài trời, sân thượng, lối đi', icon: MapPin },
  { value: 'Thiết bị vệ sinh', label: 'Thiết bị vệ sinh', description: 'Bồn cầu, lavabo, vòi sen', icon: Sparkles },
  { value: 'Sơn và chống thấm', label: 'Sơn & chống thấm', description: 'Nội thất, ngoại thất, mái và tường', icon: ShieldCheck },
  { value: 'Khác', label: 'Nhu cầu khác', description: 'Mô tả yêu cầu để được hỗ trợ', icon: MessageCircle },
];

const CONTACT_METHODS: Array<{ value: PreferredContact; label: string }> = [
  { value: 'PHONE', label: 'Điện thoại' },
  { value: 'ZALO', label: 'Zalo' },
  { value: 'EMAIL', label: 'Email' },
];

export function ContactPage() {
  const [form, setForm] = useState<ContactFormState>(INITIAL_FORM);
  const [config, setConfig] = useState<Partial<SiteConfig>>({});
  const [tileSizes, setTileSizes] = useState<TileSizeOption[]>(DEFAULT_TILE_SIZES);
  const [step, setStep] = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [website, setWebsite] = useState('');
  const [startedAt, setStartedAt] = useState(() => Date.now());

  useEffect(() => {
    getSiteConfig()
      .then((response) => setConfig(response.data ?? {}))
      .catch(() => undefined);

    getCategoryChildren('gach-op-lat')
      .then((items) => setTileSizes(items.length > 0 ? items : DEFAULT_TILE_SIZES))
      .catch(() => setTileSizes(DEFAULT_TILE_SIZES));
  }, []);

  const phone = config.site_phone || '0764 432 015';
  const phoneDigits = phone.replace(/\D/g, '');
  const email = config.site_email || 'hochiminh145632@gmail.com';
  const address = config.site_address || '137 Đường Liên Phường, Phường Phước Long, TP. Hồ Chí Minh';
  const workingHours = config.site_working_hours || 'Thứ 2 – Thứ 6: 7:30 – 17:30';
  const facebook = config.site_facebook || 'https://www.facebook.com/VLXDTIENPHAT';
  const configuredMap = config.site_map_url?.trim();
  const mapEmbedUrl = configuredMap && (configuredMap.includes('output=embed') || configuredMap.includes('/embed'))
    ? configuredMap
    : MAP_EMBED_URL;
  const mapOpenUrl = configuredMap?.startsWith('http') ? configuredMap : MAP_OPEN_URL;

  const contactItems = useMemo(() => [
    { icon: Phone, label: 'Hotline', value: phone, href: `tel:${phoneDigits}` },
    { icon: Mail, label: 'Email', value: email, href: `mailto:${email}` },
    { icon: MapPin, label: 'Địa chỉ', value: address, href: mapOpenUrl },
    { icon: Clock, label: 'Giờ làm việc', value: workingHours, href: '' },
    { icon: Facebook, label: 'Facebook', value: 'Tiến Phát VLXD', href: facebook },
  ], [address, email, facebook, mapOpenUrl, phone, phoneDigits, workingHours]);

  function updateField<Key extends keyof ContactFormState>(key: Key, value: ContactFormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function goToDetails() {
    if (!form.inquiryType) {
      toast.error('Hãy chọn nhu cầu cần tư vấn');
      return;
    }
    setStep(2);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!form.name.trim() || !form.phone.trim() || !form.message.trim()) {
      toast.error('Vui lòng nhập họ tên, số điện thoại và nội dung cần tư vấn.');
      return;
    }

    if (form.preferredContact === 'EMAIL' && !form.email.trim()) {
      toast.error('Vui lòng nhập email khi chọn hình thức liên hệ qua email.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await submitContact({
        ...form,
        email: form.email.trim() || undefined,
        sourcePage: window.location.href,
        website,
        startedAt,
      });

      setRequestId(response.data.id);
      setForm(INITIAL_FORM);
      setStep(1);
      setStartedAt(Date.now());
      toast.success('Yêu cầu của bạn đã được Tiến Phát tiếp nhận.');
    } catch (error) {
      toast.error((error as Error).message || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  }

  function startAnotherRequest() {
    setRequestId(null);
    setStep(1);
    setStartedAt(Date.now());
  }

  return (
    <div className="bg-gray-50/60">
      <section className="bg-dark-900 py-14 text-white">
        <div className="container mx-auto text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-brand-400">Tư vấn vật liệu xây dựng</p>
          <h1 className="mb-3 text-3xl font-black md:text-4xl">Gửi yêu cầu cho Tiến Phát</h1>
          <p className="mx-auto max-w-2xl text-sm leading-6 text-gray-400 md:text-base">
            Cung cấp một vài thông tin về công trình để đội ngũ tư vấn chuẩn bị sản phẩm phù hợp trước khi liên hệ lại.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3 text-xs text-gray-300">
            {['Lưu yêu cầu vào hệ thống', 'Thông báo ngay cho nhân viên', 'Phản hồi trong giờ làm việc'].map((item) => (
              <span key={item} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5">
                <CheckCircle2 size={14} className="text-brand-400" /> {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="container mx-auto grid gap-8 py-10 lg:grid-cols-[0.85fr_1.15fr] lg:py-12">
        <aside className="space-y-5">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-brand-600">Kết nối trực tiếp</p>
            <h2 className="text-2xl font-black text-gray-900">Thông tin liên hệ</h2>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              Gọi điện hoặc nhắn Zalo khi cần hỗ trợ ngay. Form tư vấn phù hợp khi bạn muốn gửi đầy đủ nhu cầu và thông tin công trình.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {contactItems.map(({ icon: Icon, label, value, href }) => (
              <div key={label} className="card flex items-start gap-4 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50">
                  <Icon size={18} className="text-brand-600" />
                </div>
                <div className="min-w-0">
                  <p className="mb-0.5 text-xs text-gray-400">{label}</p>
                  {href ? (
                    <a
                      href={href}
                      target={href.startsWith('http') ? '_blank' : undefined}
                      rel="noreferrer"
                      className="break-words text-sm font-semibold text-gray-800 transition-colors hover:text-brand-600"
                    >
                      {value}
                    </a>
                  ) : (
                    <p className="text-sm font-semibold text-gray-800">{value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="h-64 overflow-hidden rounded-xl bg-gray-200 shadow-sm">
            <iframe
              src={mapEmbedUrl}
              title="Bản đồ Công ty Tiến Phát"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>

          <a
            href={mapOpenUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:underline"
          >
            <MapPin size={16} /> Xem chỉ đường trên Google Maps
          </a>
        </aside>

        <section className="card self-start overflow-hidden">
          {requestId ? (
            <div className="flex min-h-[560px] flex-col items-center justify-center px-6 py-12 text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
                <CheckCircle2 size={34} />
              </div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-green-600">Đã tiếp nhận</p>
              <h2 className="text-2xl font-black text-gray-900">Cảm ơn bạn đã gửi yêu cầu</h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-gray-500">
                Thông tin đã được lưu trong hệ thống. Nhân viên Tiến Phát sẽ kiểm tra và liên hệ theo hình thức bạn đã chọn.
              </p>
              <div className="mt-6 rounded-xl bg-gray-50 px-5 py-3 text-sm text-gray-500">
                Mã yêu cầu: <strong className="text-gray-900">{requestId.slice(0, 8).toUpperCase()}</strong>
              </div>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <button type="button" onClick={startAnotherRequest} className="btn-outline">
                  Gửi yêu cầu khác
                </button>
                <a href={`tel:${phoneDigits}`} className="btn-primary">
                  <Phone size={17} /> Gọi ngay
                </a>
              </div>
            </div>
          ) : (
            <>
              <div className="border-b border-gray-100 bg-white px-6 py-5 md:px-8">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">Bước {step} / 2</p>
                    <h2 className="mt-1 text-xl font-black text-gray-900">
                      {step === 1 ? 'Bạn đang cần tư vấn gì?' : 'Thông tin công trình và liên hệ'}
                    </h2>
                  </div>
                  <div className="flex gap-1.5">
                    <span className={`h-2 w-10 rounded-full ${step >= 1 ? 'bg-brand-600' : 'bg-gray-200'}`} />
                    <span className={`h-2 w-10 rounded-full ${step >= 2 ? 'bg-brand-600' : 'bg-gray-200'}`} />
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 md:p-8">
                <input
                  type="text"
                  name="website"
                  value={website}
                  onChange={(event) => setWebsite(event.target.value)}
                  className="hidden"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                />

                {step === 1 ? (
                  <div>
                    <p className="mb-5 text-sm leading-6 text-gray-500">
                      Chọn nhóm nhu cầu gần nhất. Bạn vẫn có thể mô tả chi tiết ở bước tiếp theo.
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {INQUIRY_OPTIONS.map(({ value, label, description, icon: Icon }) => {
                        const selected = form.inquiryType === value;
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => updateField('inquiryType', value)}
                            className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                              selected
                                ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-100'
                                : 'border-gray-200 bg-white hover:border-brand-200 hover:bg-brand-50/40'
                            }`}
                          >
                            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${selected ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                              <Icon size={19} />
                            </span>
                            <span>
                              <span className="block text-sm font-bold text-gray-900">{label}</span>
                              <span className="mt-1 block text-xs leading-5 text-gray-400">{description}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <button type="button" onClick={goToDetails} className="btn-primary mt-7 w-full justify-center py-3">
                      Tiếp tục <ChevronRight size={18} />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="rounded-xl border border-brand-100 bg-brand-50 px-4 py-3">
                      <p className="text-xs text-brand-600">Nhu cầu đã chọn</p>
                      <p className="mt-0.5 font-bold text-gray-900">{form.inquiryType}</p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Kích thước mong muốn">
                        <select
                          className="field-input"
                          value={form.tileSize}
                          onChange={(event) => updateField('tileSize', event.target.value)}
                        >
                          <option value="">Chưa xác định</option>
                          {tileSizes.map((size) => (
                            <option key={size.value} value={size.label}>{size.label}</option>
                          ))}
                        </select>
                      </Field>

                      <Field label="Diện tích dự kiến">
                        <div className="relative">
                          <input
                            type="text"
                            inputMode="decimal"
                            className="field-input pr-12"
                            value={form.area}
                            onChange={(event) => updateField('area', event.target.value)}
                            placeholder="Ví dụ: 35"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">m²</span>
                        </div>
                      </Field>
                    </div>

                    <Field label="Khu vực sử dụng hoặc địa điểm công trình">
                      <input
                        type="text"
                        className="field-input"
                        value={form.location}
                        onChange={(event) => updateField('location', event.target.value)}
                        placeholder="Ví dụ: phòng khách tại TP. Thủ Đức"
                      />
                    </Field>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">Muốn được liên hệ qua</label>
                      <div className="grid grid-cols-3 gap-2">
                        {CONTACT_METHODS.map((method) => (
                          <button
                            key={method.value}
                            type="button"
                            onClick={() => updateField('preferredContact', method.value)}
                            className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors ${
                              form.preferredContact === method.value
                                ? 'border-brand-500 bg-brand-50 text-brand-700'
                                : 'border-gray-200 text-gray-500 hover:border-brand-200'
                            }`}
                          >
                            {method.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <Field label="Thời gian thuận tiện">
                      <select
                        className="field-input"
                        value={form.preferredTime}
                        onChange={(event) => updateField('preferredTime', event.target.value)}
                      >
                        <option value="">Bất kỳ trong giờ làm việc</option>
                        <option value="Buổi sáng (7:30 - 11:30)">Buổi sáng (7:30 - 11:30)</option>
                        <option value="Buổi chiều (13:00 - 17:30)">Buổi chiều (13:00 - 17:30)</option>
                        <option value="Liên hệ qua Zalo trước">Nhắn Zalo trước khi gọi</option>
                      </select>
                    </Field>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Họ và tên" required>
                        <input
                          type="text"
                          className="field-input"
                          value={form.name}
                          onChange={(event) => updateField('name', event.target.value)}
                          placeholder="Nguyễn Văn A"
                        />
                      </Field>
                      <Field label="Số điện thoại" required>
                        <input
                          type="tel"
                          className="field-input"
                          value={form.phone}
                          onChange={(event) => updateField('phone', event.target.value)}
                          placeholder="0764 432 015"
                        />
                      </Field>
                    </div>

                    <Field label={`Email${form.preferredContact === 'EMAIL' ? '' : ' (không bắt buộc)'}`} required={form.preferredContact === 'EMAIL'}>
                      <input
                        type="email"
                        className="field-input"
                        value={form.email}
                        onChange={(event) => updateField('email', event.target.value)}
                        placeholder="example@gmail.com"
                      />
                    </Field>

                    <Field label="Nội dung cần tư vấn" required>
                      <textarea
                        className="field-input resize-none"
                        rows={5}
                        value={form.message}
                        onChange={(event) => updateField('message', event.target.value)}
                        placeholder="Ví dụ: Tôi cần gạch 30 x 60 lát nền phòng khách, ưu tiên màu sáng và bề mặt dễ vệ sinh..."
                      />
                    </Field>

                    <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row">
                      <button type="button" onClick={() => setStep(1)} className="btn-outline flex-1 justify-center py-3">
                        <ChevronLeft size={18} /> Quay lại
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="btn-primary flex-[1.4] justify-center py-3 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Send size={18} /> {submitting ? 'Đang gửi...' : 'Gửi yêu cầu tư vấn'}
                      </button>
                    </div>

                    <p className="text-center text-xs leading-5 text-gray-400">
                      Bằng việc gửi form, bạn đồng ý để Tiến Phát liên hệ nhằm hỗ trợ nhu cầu đã cung cấp.
                    </p>
                  </div>
                )}
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}{required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
