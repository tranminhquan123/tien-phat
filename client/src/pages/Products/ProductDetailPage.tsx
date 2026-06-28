// src/pages/Products/ProductDetailPage.tsx
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ChevronLeft, Phone, MapPin, Tag, Box, Globe, Ruler,
  ZoomIn, Star,
} from 'lucide-react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

import { getProductBySlug } from '@/services/productService';
import { ProductCard } from '@/components/ProductCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import type { Product } from '@/types';

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    window.scrollTo(0, 0);
    getProductBySlug(slug)
      .then((res) => {
        setProduct(res.data.product);
        setRelated(res.data.related);
        setActiveImg(0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <LoadingSpinner className="py-40" size="lg" />;
  if (!product) {
    return (
      <div className="container mx-auto py-20 text-center">
        <p className="text-gray-500 text-lg">Không tìm thấy sản phẩm</p>
        <Link to="/san-pham" className="btn-primary mt-4">Quay lại danh sách</Link>
      </div>
    );
  }

  const sortedImages = [...product.images].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="container mx-auto py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link to="/" className="hover:text-brand-600">Trang chủ</Link>
        <span>/</span>
        <Link to="/san-pham" className="hover:text-brand-600">Sản phẩm</Link>
        <span>/</span>
        <Link to={`/san-pham?category=${product.category.slug}`} className="hover:text-brand-600">
          {product.category.name}
        </Link>
        <span>/</span>
        <span className="text-gray-700 font-medium truncate max-w-xs">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16">
        {/* Images */}
        <div>
          {/* Main image */}
          <div
            className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 cursor-zoom-in mb-3 group"
            onClick={() => setLightboxOpen(true)}
          >
            {sortedImages[activeImg] ? (
              <img
                src={sortedImages[activeImg].url}
                alt={sortedImages[activeImg].altText ?? product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Box size={64} className="text-gray-300" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-end justify-end p-3">
              <ZoomIn size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded p-0.5" />
            </div>
          </div>

          {/* Thumbnails */}
          {sortedImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {sortedImages.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImg(idx)}
                  className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                    idx === activeImg ? 'border-brand-500' : 'border-transparent'
                  }`}
                >
                  <img src={img.url} alt={img.altText ?? ''} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <p className="text-brand-600 text-sm font-medium flex items-center gap-1 mb-2">
            <Tag size={13} /> {product.category.name}
          </p>
          <h1 className="text-2xl font-black text-gray-900 mb-4 leading-snug">
            {product.name}
          </h1>

          {/* Price */}
          {product.price ? (
            <div className="bg-brand-50 rounded-xl p-4 mb-5">
              <p className="text-xs text-gray-500 mb-1">Giá tham khảo</p>
              <p className="text-3xl font-black text-brand-600">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
                {product.unit && <span className="text-base font-normal text-gray-500">/{product.unit}</span>}
              </p>
              <p className="text-xs text-gray-400 mt-1">* Giá có thể thay đổi. Liên hệ để có báo giá chính xác nhất.</p>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-4 mb-5">
              <p className="text-gray-600 font-semibold">Liên hệ để được báo giá tốt nhất</p>
            </div>
          )}

          {/* Specs */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {product.brand && (
              <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                <Star size={15} className="text-brand-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Thương hiệu</p>
                  <p className="text-sm font-semibold">{product.brand}</p>
                </div>
              </div>
            )}
            {product.origin && (
              <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                <Globe size={15} className="text-brand-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Xuất xứ</p>
                  <p className="text-sm font-semibold">{product.origin}</p>
                </div>
              </div>
            )}
            {product.unit && (
              <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                <Ruler size={15} className="text-brand-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Đơn vị tính</p>
                  <p className="text-sm font-semibold">{product.unit}</p>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <div className="mb-6">
              <h3 className="font-bold text-gray-800 mb-2">Mô tả sản phẩm</h3>
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}

          {/* CTA */}
          <div className="flex flex-col gap-3 mt-auto">
            <a
              href="tel:0764432015"
              className="btn-primary justify-center text-base py-3"
            >
              <Phone size={18} /> Gọi ngay: 0764 432 015
            </a>
            <Link to="/lien-he" className="btn-outline justify-center text-base py-3">
              <MapPin size={18} /> Gửi yêu cầu báo giá
            </Link>
          </div>
        </div>
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <section>
          <h2 className="text-xl font-black text-gray-900 mb-5">Sản phẩm liên quan</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Lightbox */}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={activeImg}
        slides={sortedImages.map((img) => ({ src: img.url, alt: img.altText ?? product.name }))}
        on={{ view: ({ index }) => setActiveImg(index) }}
      />

      {/* Back */}
      <Link
        to="/san-pham"
        className="mt-10 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-brand-600 transition-colors"
      >
        <ChevronLeft size={16} /> Quay lại danh sách
      </Link>
    </div>
  );
}
