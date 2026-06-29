// src/components/Navbar.tsx
import { useState, useEffect, useMemo } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, Phone, ChevronDown, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { getCategories } from '@/services/categoryService';
import {
  getCategoryChildrenMap,
  type CategoryChildOption,
} from '@/services/categoryChildService';
import type { Category } from '@/types';

type NavItem = {
  to: string;
  label: string;
  children?: NavItem[];
};

function buildNavLinks(
  categories: Category[],
  childrenBySlug: Record<string, CategoryChildOption[]>
): NavItem[] {
  const productCategories: NavItem[] = categories.map((category) => {
    const children = childrenBySlug[category.slug] ?? [];

    return {
      label: category.name,
      to: `/san-pham?category=${category.slug}`,
      children: children.length > 0
        ? children.map((child) => ({
            label: child.label,
            to: `/san-pham?category=${category.slug}&size=${encodeURIComponent(child.value)}`,
          }))
        : undefined,
    };
  });

  return [
    { to: '/', label: 'Trang chủ' },
    {
      label: 'Sản phẩm',
      to: '/san-pham',
      children: productCategories,
    },
    { to: '/gioi-thieu', label: 'Giới thiệu' },
    { to: '/lien-he', label: 'Liên hệ' },
  ];
}

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropdown, setDropdown] = useState<string | null>(null);
  const [subDropdown, setSubDropdown] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [childrenBySlug, setChildrenBySlug] = useState<Record<string, CategoryChildOption[]>>({});
  const location = useLocation();

  const navLinks = useMemo(
    () => buildNavLinks(categories, childrenBySlug),
    [categories, childrenBySlug]
  );

  useEffect(() => {
    getCategories(true)
      .then(async (response) => {
        const list = response.data ?? [];
        const childMap = await getCategoryChildrenMap(list.map((category) => category.slug));
        setCategories(list);
        setChildrenBySlug(childMap);
      })
      .catch(() => {
        setCategories([]);
        setChildrenBySlug({});
      });
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setDropdown(null);
    setSubDropdown(null);
  }, [location]);

  return (
    <>
      <div className="bg-brand-700 text-white text-sm py-1.5 hidden md:block">
        <div className="container mx-auto flex justify-between items-center">
          <span className="opacity-90">Thứ 2 – Thứ 6: 7:30 – 17:30 | 137 Đường Liên Phường, Phường Phước Long, TP.HCM</span>
          <a href="tel:0764432015" className="flex items-center gap-1 font-semibold hover:opacity-80 transition-opacity">
            <Phone size={14} />
            0764 432 015
          </a>
        </div>
      </div>

      <header
        className={clsx(
          'sticky top-0 z-50 bg-white transition-shadow duration-300',
          scrolled ? 'shadow-md' : 'shadow-sm'
        )}
      >
        <div className="container mx-auto flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-10 h-10 bg-brand-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-lg leading-none">TP</span>
            </div>
            <div className="hidden sm:block">
              <p className="font-black text-gray-900 leading-tight text-base">TIẾN PHÁT</p>
              <p className="text-xs text-gray-500 leading-tight">Vật Liệu Xây Dựng & Nội Thất</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) =>
              link.children ? (
                <div
                  key={link.label}
                  className="relative"
                  onMouseEnter={() => setDropdown(link.label)}
                  onMouseLeave={() => {
                    setDropdown(null);
                    setSubDropdown(null);
                  }}
                  onFocus={() => setDropdown(link.label)}
                  onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                      setDropdown(null);
                      setSubDropdown(null);
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
                    <div className="absolute top-full left-0 pt-2 w-60 z-50">
                      <div className="bg-white border border-gray-100 rounded-xl shadow-xl py-1 overflow-visible">
                        {link.children.map((child) => (
                          <div
                            key={child.to}
                            className="relative"
                            onMouseEnter={() => setSubDropdown(child.children ? child.label : null)}
                          >
                            <Link
                              to={child.to}
                              className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-600 transition-colors"
                            >
                              <span>{child.label}</span>
                              {child.children && <ChevronRight size={15} />}
                            </Link>

                            {child.children && subDropdown === child.label && (
                              <div className="absolute left-full top-0 pl-2 w-52">
                                <div className="bg-white border border-gray-100 rounded-xl shadow-xl py-1 overflow-hidden">
                                  {child.children.map((subChild) => (
                                    <Link
                                      key={subChild.to}
                                      to={subChild.to}
                                      className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-600 transition-colors"
                                    >
                                      {subChild.label}
                                    </Link>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
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

          <div className="flex items-center gap-3">
            <a
              href="tel:0764432015"
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

        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white pb-4 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="container mx-auto space-y-1 pt-3">
              {navLinks.map((link) => (
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
                    <div key={child.to}>
                      <Link
                        to={child.to}
                        className="flex items-center justify-between pl-8 pr-4 py-2 text-sm text-gray-500 hover:text-brand-600"
                      >
                        <span>{child.label}</span>
                        {child.children && <ChevronDown size={14} />}
                      </Link>
                      {child.children?.map((subChild) => (
                        <Link
                          key={subChild.to}
                          to={subChild.to}
                          className="block pl-12 pr-4 py-1.5 text-sm text-gray-400 hover:text-brand-600"
                        >
                          {subChild.label}
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              ))}

              <div className="pt-2 px-4">
                <a
                  href="tel:0764432015"
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
