// src/pages/Products/ProductsPage.tsx
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import clsx from 'clsx';

import { getProducts } from '@/services/productService';
import { getCategories } from '@/services/categoryService';
import { ProductCard } from '@/components/ProductCard';
import { Pagination } from '@/components/Pagination';
import { LoadingSpinner, EmptyState } from '@/components/LoadingSpinner';
import type { Product, Category } from '@/types';

export function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '');

  const categorySlug = searchParams.get('category') ?? '';
  const search = searchParams.get('search') ?? '';
  const page = parseInt(searchParams.get('page') ?? '1');

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  }

  const fetchProducts = useCallback(() => {
    setLoading(true);
    getProducts({ category: categorySlug || undefined, search: search || undefined, page, limit: 12 })
      .then((res) => {
        setProducts(res.products ?? []);
        setTotalPages(res.totalPages ?? 1);
        setTotal(res.total ?? 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [categorySlug, search, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { getCategories(true).then((r) => setCategories(r.data ?? [])); }, []);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setParam('search', searchInput);
  }

  const activeCategory = categories.find((c) => c.slug === categorySlug);

  return (
    <div className="container mx-auto py-8">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-400 mb-6">
        <span>Trang chủ</span> / <span>Sản phẩm</span>
        {activeCategory && <span> / <span className="text-gray-700">{activeCategory.name}</span></span>}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">
            {activeCategory ? activeCategory.name : 'Tất cả sản phẩm'}
          </h1>
          {!loading && (
            <p className="text-gray-400 text-sm mt-0.5">Tìm thấy {total} sản phẩm</p>
          )}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm sản phẩm..."
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400 w-56"
            />
          </div>
          <button type="submit" className="btn-primary py-2 px-4 text-sm">
            Tìm
          </button>
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
        {/* Sidebar filter */}
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

          {/* Active filters */}
          {(categorySlug || search) && (
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

          {/* Categories */}
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
              {categories.map((cat) => (
                <li key={cat.id}>
                  <button
                    onClick={() => { setParam('category', cat.slug); setFilterOpen(false); }}
                    className={clsx(
                      'w-full text-left px-2 py-1.5 rounded-lg text-sm transition-colors flex justify-between items-center',
                      cat.slug === categorySlug
                        ? 'bg-brand-600 text-white font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    <span>{cat.name}</span>
                    {cat._count && (
                      <span className={clsx('text-xs', cat.slug === categorySlug ? 'text-white/70' : 'text-gray-400')}>
                        {cat._count.products}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Product grid */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <LoadingSpinner className="py-24" />
          ) : products.length === 0 ? (
            <EmptyState
              icon={Search}
              title="Không tìm thấy sản phẩm"
              description="Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"
            />
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
              <Pagination
                page={page}
                totalPages={totalPages}
                onChange={(p) => setParam('page', String(p))}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
