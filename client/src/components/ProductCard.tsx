// src/components/ProductCard.tsx
import { Link } from 'react-router-dom';
import { Tag, ExternalLink, Package } from 'lucide-react';
import clsx from 'clsx';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const images = Array.isArray(product.images) ? product.images : [];
  const primaryImage = images.find((img) => img.isPrimary) ?? images[0];
  const categoryName = product.category?.name ?? 'Sản phẩm';

  return (
    <Link
      to={`/san-pham/${product.slug}`}
      className={clsx('card group flex flex-col overflow-hidden', className)}
    >
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        {primaryImage ? (
          <img
            src={primaryImage.url}
            alt={primaryImage.altText ?? product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="text-gray-300" size={48} />
          </div>
        )}

        {product.isFeatured && (
          <span className="absolute top-2 left-2 badge bg-brand-100 text-brand-700">
            Nổi bật
          </span>
        )}

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 flex items-center justify-center">
          <ExternalLink
            size={20}
            className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          />
        </div>
      </div>

      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <p className="text-xs text-brand-600 font-medium flex items-center gap-1">
          <Tag size={11} />
          {categoryName}
        </p>

        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-brand-600 transition-colors">
          {product.name}
        </h3>

        {(product.brand || product.origin) && (
          <p className="text-xs text-gray-400">
            {[product.brand, product.origin].filter(Boolean).join(' · ')}
          </p>
        )}

        {product.price ? (
          <p className="mt-auto pt-2 text-brand-600 font-bold text-sm">
            {new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND',
            }).format(product.price)}
            {product.unit && (
              <span className="text-gray-400 font-normal text-xs">/{product.unit}</span>
            )}
          </p>
        ) : (
          <p className="mt-auto pt-2 text-gray-400 text-xs italic">
            Liên hệ để báo giá
          </p>
        )}
      </div>
    </Link>
  );
}
