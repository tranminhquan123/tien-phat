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
      .then((response) => {
        setProduct(response.data.product);
        setRelated(response.data.related);
        setActiveImg(0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <LoadingSpinner className="py-40" size="lg" />;

  if (!product) {
    return (
      <div className="container mx-auto py-20 text-center">
        <p className="text-lg text-gray-500">Không tìm thấy sản phẩm</p>
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
    product.piecesPerBox != null ? `${product.piecesPerBox} viên/thùng` : '',
    product.areaPerBox != null ? `${formatDecimal(product.areaPerBox)} m²/thùng` : '',
  ].filter(Boolean).join(' · ');

  const specifications = [
    { label: 'Màu sắc', value: product.color },
    { label: 'Loại gạch', value: product.productType },
    { label: 'Bề mặt', value: product.surface },
    { label: 'Men', value: product.glaze },
    { label: 'Công năng', value: product.application },
    { label: 'Hoa văn', value: product.pattern },
    { label: 'Bộ sưu tập', value: product.collection },
    { label: 'Số face', value: product.faceCount != null ? `${product.faceCount} face` : undefined },
    { label: 'Quy cách đóng gói', value: packageValue || undefined },
  ].filter((item): item is { label: string; value: string } => Boolean(item.value));

  const spaces = product.spaces
    ? product.spaces.split(/[,;\n/]+/).map((item) => item.trim()).filter(Boolean)
    : [];

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-gray-400">
        <Link to="/" className="hover:text-brand-600">Trang chủ</Link>
        <span>/</span>
        <Link to="/san-pham" className="hover:text-brand-600">Sản phẩm</Link>
        <span>/</span>
        <Link to={categoryLink} className="hover:text-brand-600">{product.category.name}</Link>
        {childLabel && (
          <>
            <span>/</span>
            <span className="text-gray-600">{childLabel}</span>
          </>
        )}
        <span>/</span>
        <span className="max-w-xs truncate font-medium text-gray-700">{product.name}</span>
      </div>

      <div className="mb-12 grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)] lg:gap-10">
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

            <div className="absolute inset-0 flex items-end justify-end bg-black/0 p-4 transition-colors group-hover:bg-black/5">
              <div className="flex items-center gap-2 rounded-full bg-black/55 px-3 py-2 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                <ZoomIn size={16} /> Xem ảnh lớn
              </div>
            </div>
          </div>

          {sortedImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {sortedImages.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => setActiveImg(index)}
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                    index === activeImg
                      ? 'border-brand-500'
                      : 'border-transparent hover:border-gray-300'
                  }`}
                  aria-label={`Xem ảnh ${index + 1}`}
                >
                  <img
                    src={image.url}
                    alt={image.altText ?? `${product.name} ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="min-w-0">
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
                {new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND',
                }).format(product.price)}
                {product.unit && (
                  <span className="text-base font-normal text-gray-500">/{normalizeUnit(product.unit)}</span>
                )}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Giá có thể thay đổi. Liên hệ để nhận báo giá chính xác nhất.
              </p>
            </div>
          ) : (
            <div className="mb-5 rounded-xl bg-gray-50 p-4">
              <p className="font-semibold text-gray-700">Liên hệ để được báo giá tốt nhất</p>
            </div>
          )}

          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
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
            <section className="mb-5 overflow-hidden rounded-2xl border border-gray-200 bg-white">
              <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-5 py-3.5">
                <ClipboardList size={17} className="text-brand-600" />
                <div>
                  <h2 className="font-bold text-gray-900">Thông số kỹ thuật</h2>
                  <p className="text-xs text-gray-400">Thông tin chi tiết của sản phẩm</p>
                </div>
              </div>

              {specifications.length > 0 && (
                <dl className="grid grid-cols-1 sm:grid-cols-2">
                  {specifications.map((item) => (
                    <div
                      key={item.label}
                      className="border-b border-gray-100 px-5 py-3.5 sm:odd:border-r"
                    >
                      <dt className="text-xs font-medium text-gray-400">{item.label}</dt>
                      <dd className="mt-1 break-words text-sm font-semibold leading-5 text-gray-800">
                        {item.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}

              {spaces.length > 0 && (
                <div className="border-t border-gray-100 px-5 py-4">
                  <div className="mb-2 flex items-center gap-2">
                    <MapPin size={15} className="text-brand-500" />
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Không gian sử dụng
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {spaces.map((space) => (
                      <span
                        key={space}
                        className="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700"
                      >
                        {space}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <a href="tel:0764432015" className="btn-primary justify-center py-3 text-base">
              <Phone size={18} /> Gọi ngay
            </a>
            <Link to="/lien-he" className="btn-outline justify-center py-3 text-base">
              <MapPin size={18} /> Yêu cầu báo giá
            </Link>
          </div>
          <p className="mt-2 text-center text-xs text-gray-400 sm:text-left">
            Hotline: <a href="tel:0764432015" className="font-semibold text-brand-600">0764 432 015</a>
          </p>
        </div>
      </div>

      {descriptionHtml && (
        <section className="mb-16 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 bg-gray-50/80 px-6 py-4 md:px-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">Thông tin chi tiết</p>
            <h2 className="mt-1 text-2xl font-black text-gray-900">Mô tả sản phẩm</h2>
          </div>
          <div className="mx-auto max-w-5xl px-6 py-7 md:px-8 md:py-9">
            <div
              className="rich-text-content text-[15px] text-gray-600 md:text-base"
              dangerouslySetInnerHTML={{ __html: descriptionHtml }}
            />
          </div>
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
        slides={sortedImages.map((image) => ({
          src: image.url,
          alt: image.altText ?? product.name,
        }))}
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

type IconComponent = typeof Maximize2;

function InfoCard({ icon: Icon, label, value }: { icon: IconComponent; label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-xl bg-gray-50 p-3.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-brand-500 shadow-sm">
        <Icon size={16} />
      </div>
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
