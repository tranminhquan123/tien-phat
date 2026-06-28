// src/pages/Home/HomePage.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Truck, Star, HeadphonesIcon, Package } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

import { getCategories } from '@/services/categoryService';
import { getProducts } from '@/services/productService';
import { getBanners } from '@/services/configService';
import { ProductCard } from '@/components/ProductCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import type { Category, Product, Banner } from '@/types';

const WHY_US = [
  { icon: ShieldCheck, title: 'Hàng chính hãng 100%', desc: 'Cam kết nguồn gốc xuất xứ rõ ràng, có hóa đơn chứng từ đầy đủ.' },
  { icon: Star, title: 'Giá tốt nhất thị trường', desc: 'Làm trực tiếp với nhà sản xuất, không qua trung gian – giá luôn cạnh tranh.' },
  { icon: Truck, title: 'Giao hàng toàn TP.HCM', desc: 'Đội xe tải riêng, giao đúng hẹn.' },
  { icon: HeadphonesIcon, title: 'Tư vấn tận tâm', desc: 'Nhân viên tận tình, sẵn sàng tư vấn miễn phí.' },
];

const FALLBACK_BANNERS: Banner[] = [
  { id: '1', title: 'Vật Liệu Xây Dựng Chất Lượng Cao', subtitle: 'Cam kết chính hãng – Giá tốt nhất thị trường', imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1400&q=80', isActive: true, sortOrder: 1 },
  { id: '2', title: 'Trang Trí Nội Thất Đẳng Cấp', subtitle: 'Hàng ngàn mẫu mã đa dạng cho mọi không gian', imageUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1400&q=80', isActive: true, sortOrder: 2 },
  { id: '3', title: 'Giao Hàng Tận Công Trình', subtitle: 'Nhanh chóng – Đúng hẹn – Trọn gói', imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400&q=80', isActive: true, sortOrder: 3 },
];

export function HomePage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getBanners(true).catch(() => ({ data: [] })),
      getCategories(true).catch(() => ({ data: [] })),
      getProducts({ featured: true, limit: 8 }).catch(() => ({ products: [] })),
    ]).then(([bannersRes, catsRes, prodsRes]) => {
      setBanners((bannersRes.data?.length ? bannersRes.data : FALLBACK_BANNERS));
      setCategories(catsRes.data ?? []);
      setFeatured(prodsRes.products ?? []);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* ── HERO SLIDER ─────────────────────────────────── */}
      <section className="relative">
        <Swiper
          modules={[Autoplay, Pagination, Navigation]}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          navigation
          loop
          className="w-full h-[420px] md:h-[540px]"
        >
          {banners.map((banner) => (
            <SwiperSlide key={banner.id}>
              <div className="relative w-full h-full">
                <img
                  src={banner.imageUrl}
                  alt={banner.title ?? 'Banner'}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent flex items-center">
                  <div className="container mx-auto px-6">
                    {banner.title && (
                      <h1 className="text-white font-black text-3xl md:text-5xl max-w-xl leading-tight drop-shadow-lg">
                        {banner.title}
                      </h1>
                    )}
                    {banner.subtitle && (
                      <p className="text-white/90 mt-3 text-base md:text-lg max-w-md">
                        {banner.subtitle}
                      </p>
                    )}
                    <div className="mt-6 flex gap-3">
                      <Link to="/san-pham" className="btn-primary shadow-lg">
                        Xem sản phẩm <ArrowRight size={16} />
                      </Link>
                      <Link to="/lien-he" className="bg-white/20 backdrop-blur hover:bg-white/30 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors">
                        Liên hệ ngay
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </section>

      {/* ── DANH MỤC ────────────────────────────────────── */}
      <section className="py-14 bg-gray-50">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-brand-600 font-semibold text-sm mb-1">Khám phá</p>
              <h2 className="section-title">Danh mục sản phẩm</h2>
            </div>
            <Link to="/san-pham" className="text-brand-600 font-semibold text-sm flex items-center gap-1 hover:underline">
              Xem tất cả <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <LoadingSpinner className="py-16" />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/san-pham?category=${cat.slug}`}
                  className="card p-4 flex flex-col items-center gap-3 text-center hover:border-brand-200 group"
                >
                  <div className="w-16 h-16 rounded-xl bg-brand-50 flex items-center justify-center group-hover:bg-brand-100 transition-colors">
                    {cat.imageUrl ? (
                      <img src={cat.imageUrl} alt={cat.name} className="w-10 h-10 object-contain" />
                    ) : (
                      <Package size={28} className="text-brand-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800 group-hover:text-brand-600 transition-colors leading-tight">
                      {cat.name}
                    </p>
                    {cat._count && (
                      <p className="text-xs text-gray-400 mt-0.5">{cat._count.products} SP</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── SẢN PHẨM NỔI BẬT ───────────────────────────── */}
      {featured.length > 0 && (
        <section className="py-14">
          <div className="container mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-brand-600 font-semibold text-sm mb-1">Được yêu thích</p>
                <h2 className="section-title">Sản phẩm nổi bật</h2>
              </div>
              <Link to="/san-pham?featured=true" className="text-brand-600 font-semibold text-sm flex items-center gap-1 hover:underline">
                Xem thêm <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {featured.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── TẠI SAO CHỌN TIẾN PHÁT ─────────────────────── */}
      <section className="py-14 bg-dark-900 text-white">
        <div className="container mx-auto">
          <div className="text-center mb-10">
            <p className="text-brand-400 font-semibold text-sm mb-1">Cam kết của chúng tôi</p>
            <h2 className="text-2xl md:text-3xl font-black">Tại sao chọn Tiến Phát?</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {WHY_US.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-6 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                <div className="w-12 h-12 bg-brand-600 rounded-xl flex items-center justify-center mb-4">
                  <Icon size={22} />
                </div>
                <h3 className="font-bold text-base mb-2">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ───────────────────────────────────────── */}
      <section className="py-12 bg-brand-600 text-white">
        <div className="container mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: '5+', label: 'Năm kinh nghiệm' },
            { value: '5.000+', label: 'Khách hàng tin dùng' },
            { value: '200+', label: 'Sản phẩm đa dạng' },
            { value: '98%', label: 'Khách hàng hài lòng' },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="text-3xl md:text-4xl font-black">{value}</p>
              <p className="text-white/80 text-sm mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA LIÊN HỆ ─────────────────────────────────── */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto text-center">
          <h2 className="section-title mb-3">Cần tư vấn vật liệu xây dựng?</h2>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            Nhân viên của Tiến Phát sẵn sàng hỗ trợ bạn lựa chọn vật liệu phù hợp nhất cho công trình.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="tel:0764432015" className="btn-primary text-base px-8 py-3 shadow-md shadow-brand-200">
              📞 Gọi ngay: 0764 432 015
            </a>
            <Link to="/lien-he" className="btn-outline text-base px-8 py-3">
              Gửi yêu cầu tư vấn
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
