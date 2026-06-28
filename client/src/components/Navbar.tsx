// src/components/Navbar.tsx
import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, Phone, ChevronDown } from 'lucide-react';
import clsx from 'clsx';

const NAV_LINKS = [
  { to: '/', label: 'Trang chủ' },
  {
    label: 'Sản phẩm',
    to: '/san-pham',
    children: [
      { to: '/san-pham?category=gach-op-lat', label: 'Gạch Ốp Lát' },
      { to: '/san-pham?category=son-nuoc', label: 'Sơn Nước' },
      { to: '/san-pham?category=vat-lieu-chong-tham', label: 'Chống Thấm' },
      { to: '/san-pham?category=thiet-bi-ve-sinh', label: 'Thiết Bị Vệ Sinh' },
      { to: '/san-pham?category=noi-that-go', label: 'Nội Thất Gỗ' },
    ],
  },
  { to: '/gioi-thieu', label: 'Giới thiệu' },
  { to: '/lien-he', label: 'Liên hệ' },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropdown, setDropdown] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setDropdown(null);
  }, [location]);

  return (
    <>
      {/* Top bar */}
      <div className="bg-brand-700 text-white text-sm py-1.5 hidden md:block">
        <div className="container mx-auto flex justify-between items-center">
          <span className="opacity-90">Thứ 2 – Thứ 6: 7:30 – 17:30 | 137 Đường Liên Phường, Phường Phước Long, TP.HCM</span>
          <a href="tel:0764432015" className="flex items-center gap-1 font-semibold hover:opacity-80 transition-opacity">
            <Phone size={14} />
            0764432015
          </a>
        </div>
      </div>

      {/* Main nav */}
      <header
        className={clsx(
          'sticky top-0 z-50 bg-white transition-shadow duration-300',
          scrolled ? 'shadow-md' : 'shadow-sm'
        )}
      >
        <div className="container mx-auto flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-10 h-10 bg-brand-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-lg leading-none">TP</span>
            </div>
            <div className="hidden sm:block">
              <p className="font-black text-gray-900 leading-tight text-base">TIẾN PHÁT</p>
              <p className="text-xs text-gray-500 leading-tight">Vật Liệu Xây Dựng & Nội Thất</p>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) =>
              link.children ? (
                <div
                  key={link.label}
                  className="relative"
                  onMouseEnter={() => setDropdown(link.label)}
                  onMouseLeave={() => setDropdown(null)}
                  onFocus={() => setDropdown(link.label)}
                  onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                      setDropdown(null);
                    }
                  }}
                >
                  <NavLink
                    to={link.to}
                    className={({ isActive }) =>
                      clsx(
                        'flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                        isActive
                          ? 'text-brand-600 bg-brand-50'
                          : 'text-gray-700 hover:text-brand-600 hover:bg-gray-50'
                      )
                    }
                  >
                    {link.label}
                    <ChevronDown size={14} className={clsx('transition-transform', dropdown === link.label && 'rotate-180')} />
                  </NavLink>
                  {dropdown === link.label && (
                    <div className="absolute top-full left-0 pt-2 w-56 z-50">
                      <div className="bg-white border border-gray-100 rounded-xl shadow-xl py-1 overflow-hidden">
                        {link.children.map((child) => (
                          <Link
                            key={child.to}
                            to={child.to}
                            className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-600 transition-colors"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  className={({ isActive }) =>
                    clsx(
                      'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                      isActive
                        ? 'text-brand-600 bg-brand-50'
                        : 'text-gray-700 hover:text-brand-600 hover:bg-gray-50'
                    )
                  }
                >
                  {link.label}
                </NavLink>
              )
            )}
          </nav>

          {/* CTA + Mobile button */}
          <div className="flex items-center gap-3">
            <a
              href="tel:0909123456"
              className="hidden md:flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              <Phone size={15} />
              Gọi ngay
            </a>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              aria-label="Menu"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white pb-4">
            <div className="container mx-auto space-y-1 pt-3">
              {NAV_LINKS.map((link) => (
                <div key={link.label}>
                  <NavLink
                    to={link.to}
                    end={link.to === '/'}
                    className={({ isActive }) =>
                      clsx(
                        'block px-4 py-2.5 rounded-lg text-sm font-medium',
                        isActive ? 'text-brand-600 bg-brand-50' : 'text-gray-700 hover:bg-gray-50'
                      )
                    }
                  >
                    {link.label}
                  </NavLink>
                  {link.children?.map((child) => (
                    <Link
                      key={child.to}
                      to={child.to}
                      className="block pl-8 pr-4 py-2 text-sm text-gray-500 hover:text-brand-600"
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              ))}
              <div className="pt-2 px-4">
                <a
                  href="tel:0909123456"
                  className="flex items-center justify-center gap-2 bg-brand-600 text-white py-3 rounded-xl font-semibold text-sm"
                >
                  <Phone size={16} />
                  Gọi ngay: 0764 432 015
                </a>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
