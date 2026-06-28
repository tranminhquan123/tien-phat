// src/components/Footer.tsx
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Clock, Facebook } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-dark-900 text-gray-300">
      <div className="container mx-auto py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Brand */}
        <div className="lg:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-brand-600 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-white font-black text-lg">TP</span>
            </div>
            <div>
              <p className="font-black text-white text-base leading-tight">TIẾN PHÁT</p>
              <p className="text-xs text-gray-400 leading-tight">Vật Liệu Xây Dựng & Nội Thất</p>
            </div>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed">
            Hơn 6 năm cung cấp vật liệu xây dựng và nội thất chất lượng cao tại TP. Hồ Chí Minh.
          </p>
        </div>

        {/* Danh mục */}
        <div>
          <h3 className="text-white font-semibold mb-4">Sản phẩm</h3>
          <ul className="space-y-2 text-sm">
            {[
              ['Gạch Ốp Lát', '/san-pham?category=gach-op-lat'],
              ['Sơn Nước', '/san-pham?category=son-nuoc'],
              ['Chống Thấm', '/san-pham?category=vat-lieu-chong-tham'],
              ['Thiết Bị Vệ Sinh', '/san-pham?category=thiet-bi-ve-sinh'],
              ['Nội Thất Gỗ', '/san-pham?category=noi-that-go'],
            ].map(([label, to]) => (
              <li key={to}>
                <Link to={to} className="hover:text-brand-400 transition-colors">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Links */}
        <div>
          <h3 className="text-white font-semibold mb-4">Thông tin</h3>
          <ul className="space-y-2 text-sm">
            {[
              ['Giới thiệu', '/gioi-thieu'],
              ['Sản phẩm', '/san-pham'],
              ['Liên hệ', '/lien-he'],
              ['Chính sách bảo hành', '/chinh-sach'],
            ].map(([label, to]) => (
              <li key={to}>
                <Link to={to} className="hover:text-brand-400 transition-colors">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-white font-semibold mb-4">Liên hệ</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-2.5">
              <MapPin size={16} className="text-brand-400 shrink-0 mt-0.5" />
              <span>137 Đường Liên Phường, Phường Phước Long, TP. Hồ Chí Minh</span>
            </li>
            <li className="flex gap-2.5">
              <Phone size={16} className="text-brand-400 shrink-0 mt-0.5" />
              <a href="tel:0764432015" className="hover:text-brand-400 transition-colors">
                0764 432 015
              </a>
            </li>
            <li className="flex gap-2.5">
              <Mail size={16} className="text-brand-400 shrink-0 mt-0.5" />
              <a href="mailto:info@tienphat.com.vn" className="hover:text-brand-400 transition-colors">
                hochiminh145632@gmail.com
              </a>
            </li>
            <li className="flex gap-2.5">
              <Clock size={16} className="text-brand-400 shrink-0 mt-0.5" />
              <span>Thứ 2 – Thứ 6: 7:30 – 17:30</span>
              <br></br>
              <span> Thứ 7: 7:30 – 17:00</span>
            </li>
            <li className="flex gap-2.5">
              <Facebook size={16} className="text-brand-400 shrink-0 mt-0.5" />
              <a href="https://www.facebook.com/VLXDTIENPHAT" target="_blank" rel="noreferrer" className="hover:text-brand-400 transition-colors">
                Facebook Tiến Phát
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container mx-auto py-4 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-gray-500">
          <span>© {new Date().getFullYear()} Công ty TNHH VLXD & Trang Trí Nội Thất Tiến Phát. Tất cả quyền được bảo lưu.</span>
          <Link to="/admin" className="hover:text-gray-400 transition-colors">
            Quản trị
          </Link>
        </div>
      </div>
    </footer>
  );
}
