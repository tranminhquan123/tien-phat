// src/pages/Admin/AdminProductsPage.tsx
import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Pencil, Trash2, Star, ToggleLeft, ToggleRight, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { adminGetProducts, adminCreateProduct, adminUpdateProduct, adminDeleteProduct } from '@/services/productService';
import { getCategories } from '@/services/categoryService';
import { LoadingSpinner, EmptyState } from '@/components/LoadingSpinner';
import { Pagination } from '@/components/Pagination';
import type { Product, Category } from '@/types';

type FormData = {
  name: string; description: string; price: string; unit: string;
  brand: string; origin: string; categoryId: string;
  isActive: boolean; isFeatured: boolean; sortOrder: string;
};

const EMPTY_FORM: FormData = {
  name: '', description: '', price: '', unit: '',
  brand: '', origin: '', categoryId: '',
  isActive: true, isFeatured: false, sortOrder: '0',
};

export function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterCatId, setFilterCatId] = useState('');
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetch = useCallback(() => {
    setLoading(true);
    adminGetProducts({ search: search || undefined, categoryId: filterCatId || undefined, page })
      .then((r) => { setProducts(r.products ?? []); setTotal(r.total); setTotalPages(r.totalPages); })
      .catch(console.error).finally(() => setLoading(false));
  }, [search, filterCatId, page]);

  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => { getCategories().then((r) => setCategories(r.data ?? [])); }, []);

  function openCreate() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, categoryId: categories[0]?.id ?? '' });
    setModalOpen(true);
  }

  function openEdit(p: Product) {
    setEditingId(p.id);
    setForm({
      name: p.name, description: p.description ?? '', price: p.price ? String(p.price) : '',
      unit: p.unit ?? '', brand: p.brand ?? '', origin: p.origin ?? '',
      categoryId: p.categoryId, isActive: p.isActive, isFeatured: p.isFeatured,
      sortOrder: String(p.sortOrder),
    });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.name || !form.categoryId) { toast.error('Nhập tên và chọn danh mục'); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name, description: form.description || undefined,
        price: form.price ? parseFloat(form.price) : undefined,
        unit: form.unit || undefined, brand: form.brand || undefined,
        origin: form.origin || undefined, categoryId: form.categoryId,
        isActive: form.isActive, isFeatured: form.isFeatured,
        sortOrder: parseInt(form.sortOrder) || 0,
      };
      if (editingId) {
        await adminUpdateProduct(editingId, payload);
        toast.success('Đã cập nhật sản phẩm');
      } else {
        await adminCreateProduct(payload);
        toast.success('Đã thêm sản phẩm');
      }
      setModalOpen(false);
      fetch();
    } catch (err) { toast.error((err as Error).message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    try {
      await adminDeleteProduct(id);
      toast.success('Đã xóa sản phẩm');
      setDeleteId(null);
      fetch();
    } catch (err) { toast.error((err as Error).message); }
  }

  async function toggleActive(p: Product) {
    try {
      await adminUpdateProduct(p.id, { isActive: !p.isActive });
      toast.success(p.isActive ? 'Đã ẩn sản phẩm' : 'Đã hiện sản phẩm');
      fetch();
    } catch (err) { toast.error((err as Error).message); }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-gray-900">Sản phẩm</h1>
          <p className="text-gray-400 text-sm">{total} sản phẩm</p>
        </div>
        <button onClick={openCreate} className="btn-primary text-sm">
          <Plus size={16} /> Thêm mới
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Tìm theo tên, thương hiệu..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400"
          />
        </div>
        <select
          value={filterCatId}
          onChange={(e) => { setFilterCatId(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400"
        >
          <option value="">Tất cả danh mục</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSpinner className="py-20" />
      ) : products.length === 0 ? (
        <EmptyState icon={Package} title="Chưa có sản phẩm nào" description="Nhấn 'Thêm mới' để bắt đầu" />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Sản phẩm', 'Danh mục', 'Giá', 'Nổi bật', 'Trạng thái', 'Thao tác'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map((p) => {
                  const img = p.images[0];
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                            {img ? (
                              <img src={img.url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Package size={16} className="m-2 text-gray-300" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 line-clamp-1">{p.name}</p>
                            {p.brand && <p className="text-xs text-gray-400">{p.brand}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="badge bg-gray-100 text-gray-600">{p.category.name}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                        {p.price
                          ? `${new Intl.NumberFormat('vi-VN').format(p.price)}đ`
                          : <span className="text-gray-400 italic text-xs">Liên hệ</span>}
                      </td>
                      <td className="px-4 py-3">
                        {p.isFeatured && <Star size={15} className="text-yellow-400 fill-yellow-400" />}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleActive(p)} className="focus:outline-none" title="Bật/tắt hiển thị">
                          {p.isActive
                            ? <ToggleRight size={22} className="text-green-500" />
                            : <ToggleLeft size={22} className="text-gray-300" />}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEdit(p)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => setDeleteId(p.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          >
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

      {/* Modal thêm/sửa */}
      {modalOpen && (
        <Modal title={editingId ? 'Sửa sản phẩm' : 'Thêm sản phẩm'} onClose={() => setModalOpen(false)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <FieldLabel required>Tên sản phẩm</FieldLabel>
              <input className="field-input" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Gạch Ốp Lát 60x60 Marble White" />
            </div>
            <div>
              <FieldLabel required>Danh mục</FieldLabel>
              <select className="field-input" value={form.categoryId} onChange={(e) => setForm(p => ({ ...p, categoryId: e.target.value }))}>
                <option value="">-- Chọn danh mục --</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <FieldLabel>Thương hiệu</FieldLabel>
              <input className="field-input" value={form.brand} onChange={(e) => setForm(p => ({ ...p, brand: e.target.value }))} placeholder="Đồng Tâm, Prime, Viglacera..." />
            </div>
            <div>
              <FieldLabel>Giá (VNĐ)</FieldLabel>
              <input type="number" className="field-input" value={form.price} onChange={(e) => setForm(p => ({ ...p, price: e.target.value }))} placeholder="150000" />
            </div>
            <div>
              <FieldLabel>Đơn vị</FieldLabel>
              <input className="field-input" value={form.unit} onChange={(e) => setForm(p => ({ ...p, unit: e.target.value }))} placeholder="m², cái, thùng, kg..." />
            </div>
            <div>
              <FieldLabel>Xuất xứ</FieldLabel>
              <input className="field-input" value={form.origin} onChange={(e) => setForm(p => ({ ...p, origin: e.target.value }))} placeholder="Việt Nam, Ý, Tây Ban Nha..." />
            </div>
            <div>
              <FieldLabel>Thứ tự hiển thị</FieldLabel>
              <input type="number" className="field-input" value={form.sortOrder} onChange={(e) => setForm(p => ({ ...p, sortOrder: e.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <FieldLabel>Mô tả</FieldLabel>
              <textarea className="field-input resize-none" rows={3} value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Mô tả chi tiết về sản phẩm..." />
            </div>
            <div className="md:col-span-2 flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm(p => ({ ...p, isActive: e.target.checked }))} className="accent-brand-600 w-4 h-4" />
                <span className="text-sm font-medium text-gray-700">Hiển thị trên website</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm(p => ({ ...p, isFeatured: e.target.checked }))} className="accent-brand-600 w-4 h-4" />
                <span className="text-sm font-medium text-gray-700">Sản phẩm nổi bật</span>
              </label>
            </div>
          </div>
          <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-gray-100">
            <button onClick={() => setModalOpen(false)} className="btn-outline text-sm py-2">Hủy</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary text-sm py-2 disabled:opacity-60">
              {saving ? 'Đang lưu...' : editingId ? 'Cập nhật' : 'Thêm mới'}
            </button>
          </div>
        </Modal>
      )}

      {/* Confirm delete */}
      {deleteId && (
        <Modal title="Xác nhận xóa" onClose={() => setDeleteId(null)}>
          <p className="text-gray-600 mb-6">Bạn có chắc muốn xóa sản phẩm này? Hành động này không thể hoàn tác.</p>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setDeleteId(null)} className="btn-outline text-sm py-2">Hủy</button>
            <button onClick={() => handleDelete(deleteId)} className="bg-red-500 hover:bg-red-600 text-white font-semibold text-sm px-5 py-2 rounded-lg transition-colors">
              Xóa
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={clsx('relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto')}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-black text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">×</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
