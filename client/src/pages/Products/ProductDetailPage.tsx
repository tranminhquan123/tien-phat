// src/pages/Products/ProductDetailPage.tsx
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ChevronLeft,
  Phone,
  MapPin,
  Tag,
  Box,
  Globe,
  Ruler,
  ZoomIn,
  Star,
  Maximize2,
  ClipboardList,
} from 'lucide-react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

import { getProductBySlug } from '@/services/productService';
import { formatCategoryChildValue } from '@/services/categoryChildService';
import { ProductCard } from '@/components/ProductCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { prepareRichTextForDisplay } from '@/utils/richText';
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
  const childLabel = formatCategoryChildValue(product.category.slug, product.size);
  const childFieldLabel = product.category.slug === 'gach-op-lat' ? 'Kích thước' : 'Danh mục cấp 2';
  const descriptionHtml = prepareRichTextForDisplay(product.description);
  const categoryLink = product.size
    ? `/san-pham?category=${product.category.slug}&size=${encodeURIComponent(product.size)}`
    : `/san-pham?category=${product.category.slug}`;

  const packageValue = [
    product.piecesPerBox ? `${product.piecesPerBox} viên/thùng` : '',
    product.areaPerBox ? `${formatDecimal(product.areaPerBox)} m²/thùng` : '',
  ].filter(Boolean).join(' · ');

  const specifications = [
    { label: 'Màu sắc', value: product.color },
    { label: 'Loại gạch', value: product.productType },
    { label: 'Bề mặt', value: product.surface },
    { label: 'Men', value: product.glaze },
    { label: 'Công năng', value: product.application },
    { label: 'Hoa văn', value: product.pattern },
    { label: 'Bộ sưu tập', value: product.collection },
    { label: 'Số face', value: product.faceCount != null ? String(product.faceCount) : undefined },
    { label: 'Quy cách đóng gói', value: packageValue || undefined },
  ].filter((item): item is { label: string; value: string } => Boolean(item.value));

  const spaces = product.spaces
    ? product.spaces.split(/[,;\n]+/).map((item) => item.trim()).filter(Boolean)
    : [];

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-gray-400">
        <Link to="/" className="hover:text-brand-600">Trang chủ</Link>
        <span>/</span>
        <Link to="/san-pham" className="hover:text-brand-600">Sản phẩm</Link>
        <span>/</span>
        <Link to={categoryLink} className="hover:text-brand-600">
          {product.category.name}
        </Link>
        {childLabel && <><span>/</span><span className="text-gray-600">{childLabel}</span></>}
        <span>/</span>
        <span className="max-w-xs truncate font-medium text-gray-700">{product.name}</span>
      </div>

      <div className="mb-12 grid grid-cols-1 items-start gap-10 lg:grid-cols-2">
        <div className="lg:sticky lg:top-24">
          <div
            className="group relative mb-3 aspect-square cursor-zoom-in overflow-hidden rounded-2xl bg-gray-100"
            onClick={() => setLightboxOpen(true)}
          >
            {sortedImages[activeImg] ? (
              <img
                src={sortedImages[activeImg].url}
                alt={sortedImages[activeImg].altText ?? product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Box size={64} className="text-gray-300" />
              </div>
            )}
            <div className="absolute inset-0 flex items-end justify-end bg-black/0 p-3 transition-colors group-hover:bg-black/5">
              <ZoomIn size={22} className="rounded-md bg-black/50 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          </div>

          {sortedImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {sortedImages.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImg(idx)}
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                    idx === activeImg ? 'border-brand-500' : 'border-transparent'
                  }`}
                >
                  <img src={img.url} alt={img.altText ?? ''} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <p className="mb-2 flex items-center gap-1 text-sm font-medium text-brand-600">
            <Tag size={13} /> {product.category.name}{childLabel ? ` · ${childLabel}` : ''}
          </p>
          <h1 className="mb-4 text-2xl font-black leading-snug text-gray-900 md:text-3xl">
            {product.name}
          </h1>

          {product.price ? (
            <div className="mb-5 rounded-xl bg-brand-50 p-4">
              <p className="mb-1 text-xs text-gray-500">Giá tham khảo</p>
              <p className="text-3xl font-black text-brand-600">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
                {product.unit && <span className="text-base font-normal text-gray-500">/{product.unit}</span>}
              </p>
              <p className="mt-1 text-xs text-gray-400">* Giá có thể thay đổi. Liên hệ để có báo giá chính xác nhất.</p>
            </div>
          ) : (
            <div className="mb-5 rounded-xl bg-gray-50 p-4">
              <p className="font-semibold text-gray-600">Liên hệ để được báo giá tốt nhất</p>
            </div>
          )}

          <div className="mb-5 grid grid-cols-2 gap-3">
            {childLabel && (
              <InfoCard icon={Maximize2} label={childFieldLabel} value={childLabel} />
            )}
            {product.brand && (
              <InfoCard icon={Star} label="Thương hiệu" value={product.brand} />
            )}
            {product.origin && (
              <InfoCard icon={Globe} label="Xuất xứ" value={product.origin} />
            )}
            {product.unit && (
              <InfoCard icon={Ruler} label="Đơn vị tính" value={normalizeUnit(product.unit)} />
            )}
          </div>

          {(specifications.length > 0 || spaces.length > 0) && (
            <section className="mb-5 overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-3">
                <ClipboardList size={17} className="text-brand-600" />
                <h2 className="font-bold text-gray-900">Thông số kỹ thuật</h2>
              </div>

              {specifications.length > 0 && (
                <dl className="grid grid-cols-1 sm:grid-cols-2">
                  {specifications.map((item) => (
                    <div key={item.label} className="border-b border-gray-100 px-4 py-3 sm:odd:border-r">
                      <dt className="text-xs font-medium text-gray-400">{item.label}</dt>
                      <dd className="mt-1 text-sm font-semibold leading-5 text-gray-800">{item.value}</dd>
                    </div>
                  ))}
                </dl>
              )}

              {spaces.length > 0 && (
                <div className="px-4 py-4">
                  <p className="mb-2 text-xs font-medium text-gray-400">Không gian sử dụng</p>
                  <div className="flex flex-wrap gap-2">
                    {spaces.map((space) => (
                      <span key={space} className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
                        {space}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          <div className="mt-auto flex flex-col gap-3">
            <a href="tel:0764432015" className="btn-primary justify-center py-3 text-base">
              <Phone size={18} /> Gọi ngay: 0764 432 015
            </a>
            <Link to="/lien-he" className="btn-outline justify-center py-3 text-base">
              <MapPin size={18} /> Gửi yêu cầu báo giá
            </Link>
          </div>
        </div>
      </div>

      {descriptionHtml && (
        <section className="mb-16 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-6 border-b border-gray-100 pb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">Thông tin chi tiết</p>
            <h2 className="mt-1 text-2xl font-black text-gray-900">Mô tả sản phẩm</h2>
          </div>
          <div
            className="rich-text-content text-[15px] text-gray-600 md:text-base"
            dangerouslySetInnerHTML={{ __html: descriptionHtml }}
          />
        </section>
      )}

      {related.length > 0 && (
        <section>
          <h2 className="mb-5 text-xl font-black text-gray-900">Sản phẩm liên quan</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {related.map((relatedProduct) => (
              <ProductCard key={relatedProduct.id} product={relatedProduct} />
            ))}
          </div>
        </section>
      )}

      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={activeImg}
        slides={sortedImages.map((img) => ({ src: img.url, alt: img.altText ?? product.name }))}
        on={{ view: ({ index }) => setActiveImg(index) }}
      />

      <Link
        to={categoryLink}
        className="mt-10 inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-brand-600"
      >
        <ChevronLeft size={16} /> Quay lại danh sách
      </Link>
    </div>
  );
}

type IconComponent = React.ComponentType<{ size?: number; className?: string }>;

function InfoCard({ icon: Icon, label, value }: { icon: IconComponent; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg bg-gray-50 p-3">
      <Icon size={15} className="mt-0.5 shrink-0 text-brand-500" />
      <div className="min-w-0">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="break-words text-sm font-semibold text-gray-800">{value}</p>
      </div>
    </div>
  );
}

function formatDecimal(value: number) {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(value);
}

function normalizeUnit(unit: string) {
  return unit.trim().toLowerCase() === 'm2' ? 'm²' : unit;
}
