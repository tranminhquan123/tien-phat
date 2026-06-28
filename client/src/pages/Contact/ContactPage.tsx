// src/pages/Contact/ContactPage.tsx
import { useState } from 'react';
import { Phone, Mail, MapPin, Clock, Facebook, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { submitContact } from '@/services/contactService';

const MAP_EMBED_URL = 'https://www.google.com/maps?q=10.807691,106.7848308&z=17&output=embed';
const MAP_OPEN_URL = 'https://www.google.com/maps/search/?api=1&query=10.807691,106.7848308';

export function ContactPage() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.phone || !form.message) {
      toast.error('Vui lòng nhập đầy đủ họ tên, số điện thoại và nội dung.');
      return;
    }

    setSubmitting(true);
    try {
      await submitContact(form);
      toast.success('Gửi liên hệ thành công! Chúng tôi sẽ phản hồi trong thời gian sớm nhất.');
      setForm({ name: '', phone: '', email: '', message: '' });
    } catch (err) {
      toast.error((err as Error).message || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="bg-dark-900 text-white py-14">
        <div className="container mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-black mb-2">Liên hệ với chúng tôi</h1>
          <p className="text-gray-400">Đội ngũ Tiến Phát luôn sẵn sàng hỗ trợ bạn 24/7</p>
        </div>
      </div>

      <div className="container mx-auto py-12 grid lg:grid-cols-2 gap-10">
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-black text-gray-900 mb-1">Thông tin liên hệ</h2>
            <p className="text-gray-500 text-sm">
              Hãy liên hệ với chúng tôi qua các kênh bên dưới hoặc gửi form, chúng tôi sẽ phản hồi trong vòng 30 phút.
            </p>
          </div>

          {[
            { icon: Phone, label: 'Hotline', value: '0764 432 015', href: 'tel:0764432015' },
            { icon: Mail, label: 'Email', value: 'hochiminh145632@gmail.com', href: 'mailto:hochiminh145632@gmail.com' },
            { icon: MapPin, label: 'Địa chỉ', value: '137 Đường Liên Phường, Phường Phước Long, TP. Hồ Chí Minh', href: MAP_OPEN_URL },
            { icon: Clock, label: 'Giờ làm việc', value: 'Thứ 2 – Thứ 6: 7:30 – 17:30', href: null },
            { icon: Facebook, label: 'Facebook', value: 'facebook.com/tienphat', href: 'https://www.facebook.com/VLXDTIENPHAT' },
          ].map(({ icon: Icon, label, value, href }) => (
            <div key={label} className="flex items-start gap-4 p-4 card">
              <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center shrink-0">
                <Icon size={18} className="text-brand-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                {href ? (
                  <a
                    href={href}
                    target={href.startsWith('http') ? '_blank' : undefined}
                    rel="noreferrer"
                    className="text-sm font-semibold text-gray-800 hover:text-brand-600 transition-colors"
                  >
                    {value}
                  </a>
                ) : (
                  <p className="text-sm font-semibold text-gray-800">{value}</p>
                )}
              </div>
            </div>
          ))}

          <div className="rounded-xl overflow-hidden h-64 bg-gray-200 shadow-sm">
            <iframe
              src={MAP_EMBED_URL}
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
            href={MAP_OPEN_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-brand-600 font-semibold text-sm hover:underline"
          >
            <MapPin size={16} /> Xem chỉ đường trên Google Maps
          </a>
        </div>

        <div className="card p-6 md:p-8">
          <h2 className="text-xl font-black text-gray-900 mb-6">Gửi yêu cầu tư vấn</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Họ và tên <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Nguyễn Văn A"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Số điện thoại <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="0764 432 015"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email (không bắt buộc)</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="example@gmail.com"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nội dung <span className="text-red-500">*</span>
              </label>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                rows={5}
                placeholder="Tôi cần tư vấn về gạch ốp lát cho nhà bếp diện tích 20m²..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full justify-center py-3 text-base disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Send size={18} />
              {submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
