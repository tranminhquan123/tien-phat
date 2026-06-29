// src/pages/Products/ProductsPage.tsx
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import clsx from 'clsx';

import { getProducts } from '@/services/productService';
import { getCategories } from '@/services/categoryService';
import { getTileSizes } from '@/services/tileSizeService';
import { ProductCard } from '@/components/ProductCard';
import { Pagination } from '@/components/Pagination';
import { LoadingSpinner, EmptyState } from '@/components/LoadingSpinner';
import {
  DEFAULT_TILE_SIZES,
  getTileSizeLabel,
  type TileSizeOption,
} from '@/constants/tileSizes';
import type { Product, Category } from '@/types';

export function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tileSizes, setTileSizes] = useState<TileSizeOption[]>(DEFAULT_TILE_SIZES);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '');

  const categorySlug = searchParams.get('category') ?? '';
  const size = searchParams.get('size') ?? '';
  const search = searchParams.get('search') ?? '';
  const page = parseInt(searchParams.get('page') ?? '1');

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams);

    if (value) next.set(key, value);
    else next.delete(key);

    if (key === 'category' && value !== 'gach-op-lat') {
      next.delete('size');
    }

    if (key === 'size' && value) {
      next.set('category', 'gach-op-lat');
    }

    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  }

  const fetchProducts = useCallback(() => {
    setLoading(true);
    getProducts({
      category: categorySlug || undefined,
      size: size || undefined,
      search: search || undefined,
      page,
      limit: 12,
    })
      .then((res) => {
        setProducts(res.products ?? []);
        setTotalPages(res.totalPages ?? 1);
        setTotal(res.total ?? 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [categorySlug, size, search, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => {
    getCategories(true).then((response) => setCategories(response.data ?? []));
    getTileSizes().then(setTileSizes);
  }, []);

  function handleSearchSubmit(event: React.FormEvent) {
    event.preventDefault();
    setParam('search', searchInput);
  }

  const activeCategory = categories.find((category) => category.slug === categorySlug);
  const activeSizeLabel = getTileSizeLabel(size);
  const pageTitle = activeCategory
    ? `${activeCategory.name}${activeSizeLabel ? ` - ${activeSizeLabel}` : ''}`
    : 'Tất cả sản phẩm';

  return (
    <div className="container mx-auto py-8">
      <div className="text-sm text-gray-400 mb-6">
        <span>Trang chủ</span> / <span>Sản phẩm</span>
        {activeCategory && <span> / <span className="text-gray-700">{activeCategory.name}</span></span>}
        {activeSizeLabel && <span> / <span className="text-gray-700">{activeSizeLabel}</span></span>}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">{pageTitle}</h1>
          {!loading && <p className="text-gray-400 text-sm mt-0.5">Tìm thấy {total} sản phẩm</p>}
        </div>

        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Tìm sản phẩm..."
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400 w-56"
            />
          </div>
          <button type="submit" className="btn-primary py-2 px-4 text-sm">Tìm</button>
          <button
            type="button"
            onClick={() => setFilterOpen(!filterOpen)}
            className="sm:hidden p-2 border border-gray-200 rounded-lg text-gray-500"
          >
            <SlidersHorizontal size={18} />
          </button>
        </form>
      </div>

      <div className="flex gap-6">
        <aside
          className={clsx(
            'shrink-0 w-56 space-y-4',
            'hidden sm:block',
            filterOpen && '!block fixed inset-0 z-50 bg-white p-6 overflow-y-auto sm:static sm:p-0 sm:z-auto sm:bg-transparent'
          )}
        >
          {filterOpen && (
            <button
              onClick={() => setFilterOpen(false)}
              className="sm:hidden flex items-center gap-1 text-sm text-gray-500 mb-4"
            >
              <X size={16} /> Đóng
            </button>
          )}

          {(categorySlug || size || search) && (
            <div className="p-3 bg-brand-50 rounded-xl">
              <p className="text-xs font-semibold text-brand-700 mb-2">Đang lọc:</p>
              <div className="flex flex-wrap gap-1">
                {categorySlug && (
                  <button
                    onClick={() => setParam('category', '')}
                    className="badge bg-brand-100 text-brand-700 gap-1"
                  >
                    {activeCategory?.name} <X size={10} />
                  </button>
                )}
                {size && (
                  <button
                    onClick={() => setParam('size', '')}
                    className="badge bg-brand-100 text-brand-700 gap-1"
                  >
                    {activeSizeLabel} <X size={10} />
                  </button>
                )}
                {search && (
                  <button
                    onClick={() => { setParam('search', ''); setSearchInput(''); }}
                    className="badge bg-brand-100 text-brand-700 gap-1"
                  >
                    "{search}" <X size={10} />
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="card p-4">
            <p className="font-bold text-gray-800 mb-3 text-sm">Danh mục</p>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => setParam('category', '')}
                  className={clsx(
                    'w-full text-left px-2 py-1.5 rounded-lg text-sm transition-colors',
                    !categorySlug ? 'bg-brand-600 text-white font-medium' : 'text-gray-600 hover:bg-gray-50'
                  )}
                >
                  Tất cả
                </button>
              </li>

              {categories.map((category) => (
                <li key={category.id}>
                  <button
                    onClick={() => {
                      setParam('category', category.slug);
                      setFilterOpen(false);
                    }}
                    className={clsx(
                      'w-full text-left px-2 py-1.5 rounded-lg text-sm transition-colors flex justify-between items-center',
                      category.slug === categorySlug
                        ? 'bg-brand-600 text-white font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    <span>{category.name}</span>
                    {category._count && (
                      <span className={clsx('text-xs', category.slug === categorySlug ? 'text-white/70' : 'text-gray-400')}>
                        {category._count.products}
                      </span>
                    )}
                  </button>

                  {category.slug === 'gach-op-lat' && categorySlug === 'gach-op-lat' && (
                    <ul className="mt-1 ml-3 pl-3 border-l border-gray-200 space-y-0.5">
                      {tileSizes.map((tileSize) => (
                        <li key={tileSize.value}>
                          <button
                            onClick={() => {
                              setParam('size', tileSize.value);
                              setFilterOpen(false);
                            }}
                            className={clsx(
                              'w-full text-left px-2 py-1.5 rounded-md text-xs transition-colors',
                              size === tileSize.value
                                ? 'bg-brand-50 text-brand-700 font-semibold'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-brand-600'
                            )}
                          >
                            {tileSize.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          {loading ? (
            <LoadingSpinner className="py-24" />
          ) : products.length === 0 ? (
            <EmptyState
              icon={Search}
              title="Không tìm thấy sản phẩm"
              description="Chưa có sản phẩm thuộc kích thước này hoặc bộ lọc hiện tại không có kết quả"
            />
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              <Pagination
                page={page}
                totalPages={totalPages}
                onChange={(nextPage) => setParam('page', String(nextPage))}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
