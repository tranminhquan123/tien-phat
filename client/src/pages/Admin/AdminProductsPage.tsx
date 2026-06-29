// src/pages/Admin/AdminProductsPage.tsx
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2, Star, ToggleLeft, ToggleRight, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { adminGetProducts, adminUpdateProduct, adminDeleteProduct } from '@/services/productService';
import { getCategories } from '@/services/categoryService';
import { getTileSizes } from '@/services/tileSizeService';
import { LoadingSpinner, EmptyState } from '@/components/LoadingSpinner';
import { Pagination } from '@/components/Pagination';
import {
  DEFAULT_TILE_SIZES,
  getTileSizeLabel,
  type TileSizeOption,
} from '@/constants/tileSizes';
import type { Product, Category } from '@/types';

type FormData = {
  name: string;
  description: string;
  price: string;
  unit: string;
  brand: string;
  origin: string;
  size: string;
  categoryId: string;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: string;
};

const EMPTY_FORM: FormData = {
  name: '',
  description: '',
  price: '',
  unit: '',
  brand: '',
  origin: '',
  size: '',
  categoryId: '',
  isActive: true,
  isFeatured: false,
  sortOrder: '0',
};

export function AdminProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tileSizes, setTileSizes] = useState<TileSizeOption[]>(DEFAULT_TILE_SIZES);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterCatId, setFilterCatId] = useState('');
  const [filterSize, setFilterSize] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const selectedFilterCategory = categories.find((category) => category.id === filterCatId);
  const selectedFormCategory = categories.find((category) => category.id === form.categoryId);
  const isTileFilter = selectedFilterCategory?.slug === 'gach-op-lat';
  const isTileForm = selectedFormCategory?.slug === 'gach-op-lat';

  const formTileSizes = form.size && !tileSizes.some((size) => size.value === form.size)
    ? [{ value: form.size, label: getTileSizeLabel(form.size) }, ...tileSizes]
    : tileSizes;

  const fetchProducts = useCallback(() => {
    setLoading(true);
    adminGetProducts({
      search: search || undefined,
      categoryId: filterCatId || undefined,
      size: filterSize || undefined,
      page,
    })
      .then((result) => {
        setProducts(result.products ?? []);
        setTotal(result.total);
        setTotalPages(result.totalPages);
      })
      .catch((error) => toast.error((error as Error).message))
      .finally(() => setLoading(false));
  }, [search, filterCatId, filterSize, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => {
    Promise.all([getCategories(), getTileSizes()])
      .then(([categoryResult, sizes]) => {
        setCategories(categoryResult.data ?? []);
        setTileSizes(sizes);
      })
      .catch((error) => toast.error((error as Error).message));
  }, []);

  function openEdit(product: Product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description ?? '',
      price: product.price ? String(product.price) : '',
      unit: product.unit ?? '',
      brand: product.brand ?? '',
      origin: product.origin ?? '',
      size: product.size ?? '',
      categoryId: product.categoryId,
      isActive: product.isActive,
      isFeatured: product.isFeatured,
      sortOrder: String(product.sortOrder),
    });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!editingId || !form.name || !form.categoryId) {
      toast.error('Nhập tên và chọn danh mục');
      return;
    }

    if (isTileForm && !form.size) {
      toast.error('Hãy chọn kích thước gạch');
      return;
    }

    setSaving(true);
    try {
      await adminUpdateProduct(editingId, {
        name: form.name,
        description: form.description || undefined,
        price: form.price ? parseFloat(form.price) : undefined,
        unit: form.unit || undefined,
        brand: form.brand || undefined,
        origin: form.origin || undefined,
        size: isTileForm ? form.size : null,
        categoryId: form.categoryId,
        isActive: form.isActive,
        isFeatured: form.isFeatured,
        sortOrder: parseInt(form.sortOrder) || 0,
      });
      toast.success('Đã cập nhật sản phẩm');
      setModalOpen(false);
      fetchProducts();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await adminDeleteProduct(id);
      toast.success('Đã xóa sản phẩm');
      setDeleteId(null);
      fetchProducts();
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  async function toggleActive(product: Product) {
    try {
      await adminUpdateProduct(product.id, { isActive: !product.isActive });
      toast.success(product.isActive ? 'Đã ẩn sản phẩm' : 'Đã hiện sản phẩm');
      fetchProducts();
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900">Sản phẩm</h1>
          <p className="text-sm text-gray-400">{total} sản phẩm</p>
        </div>
        <button onClick={() => navigate('/admin/san-pham/them-moi')} className="btn-primary text-sm">
          <Plus size={16} /> Thêm mới
        </button>
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <div className="relative max-w-xs flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(1); }}
            placeholder="Tìm theo tên, thương hiệu..."
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-brand-400 focus:outline-none"
          />
        </div>

        <select
          value={filterCatId}
          onChange={(event) => {
            const categoryId = event.target.value;
            const category = categories.find((item) => item.id === categoryId);
            setFilterCatId(categoryId);
            if (category?.slug !== 'gach-op-lat') setFilterSize('');
            setPage(1);
          }}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
        >
          <option value="">Tất cả danh mục</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>

        {isTileFilter && (
          <select
            value={filterSize}
            onChange={(event) => { setFilterSize(event.target.value); setPage(1); }}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
          >
            <option value="">Tất cả kích thước</option>
            {tileSizes.map((size) => <option key={size.value} value={size.value}>{size.label}</option>)}
          </select>
        )}
      </div>

      {loading ? (
        <LoadingSpinner className="py-20" />
      ) : products.length === 0 ? (
        <EmptyState icon={Package} title="Chưa có sản phẩm nào" description="Nhấn 'Thêm mới' để bắt đầu" />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  {['Sản phẩm', 'Danh mục', 'Kích thước', 'Giá', 'Nổi bật', 'Trạng thái', 'Thao tác'].map((heading) => (
                    <th key={heading} className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map((product) => {
                  const image = product.images.find((item) => item.isPrimary) ?? product.images[0];
                  return (
                    <tr key={product.id} className="transition-colors hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                            {image ? <img src={image.url} alt={product.name} className="h-full w-full object-cover" /> : <Package size={16} className="m-2 text-gray-300" />}
                          </div>
                          <div>
                            <p className="line-clamp-1 font-medium text-gray-900">{product.name}</p>
                            {product.brand && <p className="text-xs text-gray-400">{product.brand}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><span className="badge bg-gray-100 text-gray-600">{product.category.name}</span></td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600">{getTileSizeLabel(product.size) || '—'}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                        {product.price ? `${new Intl.NumberFormat('vi-VN').format(product.price)}đ` : <span className="text-xs italic text-gray-400">Liên hệ</span>}
                      </td>
                      <td className="px-4 py-3">{product.isFeatured && <Star size={15} className="fill-yellow-400 text-yellow-400" />}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleActive(product)} title="Bật/tắt hiển thị">
                          {product.isActive ? <ToggleRight size={22} className="text-green-500" /> : <ToggleLeft size={22} className="text-gray-300" />}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(product)} className="rounded-lg p-1.5 text-gray-400 hover:bg-brand-50 hover:text-brand-600" title="Sửa sản phẩm">
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => setDeleteId(product.id)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500" title="Xóa sản phẩm">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      {modalOpen && (
        <Modal title="Sửa sản phẩm" onClose={() => setModalOpen(false)}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <FieldLabel required>Tên sản phẩm</FieldLabel>
              <input className="field-input" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
            </div>
            <div>
              <FieldLabel required>Danh mục</FieldLabel>
              <select
                className="field-input"
                value={form.categoryId}
                onChange={(event) => {
                  const categoryId = event.target.value;
                  const category = categories.find((item) => item.id === categoryId);
                  setForm((current) => ({
                    ...current,
                    categoryId,
                    size: category?.slug === 'gach-op-lat' ? current.size : '',
                  }));
                }}
              >
                <option value="">-- Chọn danh mục --</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </div>
            {isTileForm && (
              <div>
                <FieldLabel required>Kích thước</FieldLabel>
                <select className="field-input" value={form.size} onChange={(event) => setForm((current) => ({ ...current, size: event.target.value }))}>
                  <option value="">-- Chọn kích thước --</option>
                  {formTileSizes.map((size) => <option key={size.value} value={size.value}>{size.label}</option>)}
                </select>
              </div>
            )}
            <div><FieldLabel>Thương hiệu</FieldLabel><input className="field-input" value={form.brand} onChange={(event) => setForm((current) => ({ ...current, brand: event.target.value }))} /></div>
            <div><FieldLabel>Giá (VNĐ)</FieldLabel><input type="number" className="field-input" value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))} /></div>
            <div><FieldLabel>Đơn vị</FieldLabel><input className="field-input" value={form.unit} onChange={(event) => setForm((current) => ({ ...current, unit: event.target.value }))} /></div>
            <div><FieldLabel>Xuất xứ</FieldLabel><input className="field-input" value={form.origin} onChange={(event) => setForm((current) => ({ ...current, origin: event.target.value }))} /></div>
            <div><FieldLabel>Thứ tự hiển thị</FieldLabel><input type="number" className="field-input" value={form.sortOrder} onChange={(event) => setForm((current) => ({ ...current, sortOrder: event.target.value }))} /></div>
            <div className="md:col-span-2"><FieldLabel>Mô tả</FieldLabel><textarea className="field-input resize-none" rows={3} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /></div>
            <div className="flex gap-6 md:col-span-2">
              <label className="flex cursor-pointer items-center gap-2"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} className="h-4 w-4 accent-brand-600" /><span className="text-sm font-medium text-gray-700">Hiển thị trên website</span></label>
              <label className="flex cursor-pointer items-center gap-2"><input type="checkbox" checked={form.isFeatured} onChange={(event) => setForm((current) => ({ ...current, isFeatured: event.target.checked }))} className="h-4 w-4 accent-brand-600" /><span className="text-sm font-medium text-gray-700">Sản phẩm nổi bật</span></label>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
            <button onClick={() => setModalOpen(false)} className="btn-outline py-2 text-sm">Hủy</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary py-2 text-sm disabled:opacity-60">{saving ? 'Đang lưu...' : 'Cập nhật'}</button>
          </div>
        </Modal>
      )}

      {deleteId && (
        <Modal title="Xác nhận xóa" onClose={() => setDeleteId(null)}>
          <p className="mb-6 text-gray-600">Bạn có chắc muốn xóa sản phẩm này? Hành động này không thể hoàn tác.</p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteId(null)} className="btn-outline py-2 text-sm">Hủy</button>
            <button onClick={() => handleDelete(deleteId)} className="rounded-lg bg-red-500 px-5 py-2 text-sm font-semibold text-white hover:bg-red-600">Xóa</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-600">{children}{required && <span className="ml-0.5 text-red-500">*</span>}</label>;
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={clsx('relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl')}>
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="font-black text-gray-900">{title}</h3>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-xl font-bold text-gray-400 hover:bg-gray-100 hover:text-gray-600">×</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
