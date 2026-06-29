// src/pages/Admin/AdminProductCreatePage.tsx
import { useEffect, useState } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ProductImageUrlInput } from '@/components/ProductImageUrlInput';
import { getCategories } from '@/services/categoryService';
import { adminCreateProduct } from '@/services/productService';
import { getTileSizes } from '@/services/tileSizeService';
import {
  DEFAULT_TILE_SIZES,
  type TileSizeOption,
} from '@/constants/tileSizes';
import type { Category } from '@/types';

export function AdminProductCreatePage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [tileSizes, setTileSizes] = useState<TileSizeOption[]>(DEFAULT_TILE_SIZES);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', price: '', unit: '', brand: '', origin: '', size: '',
    categoryId: '', sortOrder: '0', imageUrls: '', isActive: true, isFeatured: false,
  });

  useEffect(() => {
    Promise.all([getCategories(), getTileSizes()])
      .then(([categoryResult, sizes]) => {
        const list = categoryResult.data ?? [];
        setCategories(list);
        setTileSizes(sizes);
        setForm((current) => ({
          ...current,
          categoryId: current.categoryId || list[0]?.id || '',
        }));
      })
      .catch((error) => toast.error((error as Error).message));
  }, []);

  const selectedCategory = categories.find((category) => category.id === form.categoryId);
  const isTileCategory = selectedCategory?.slug === 'gach-op-lat';

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!form.name.trim() || !form.categoryId) {
      toast.error('Nhập tên sản phẩm và chọn danh mục');
      return;
    }

    if (isTileCategory && !form.size) {
      toast.error('Hãy chọn kích thước gạch');
      return;
    }

    const imageUrls = form.imageUrls
      .split(/\r?\n/)
      .map((url) => url.trim())
      .filter(Boolean);

    if (imageUrls.length === 0) {
      toast.error('Hãy chọn ít nhất một hình ảnh sản phẩm');
      return;
    }

    const images = imageUrls.map((url, index) => ({
      url,
      isPrimary: index === 0,
      sortOrder: index,
    }));

    setSaving(true);
    try {
      await adminCreateProduct({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        price: form.price ? Number(form.price) : undefined,
        unit: form.unit.trim() || undefined,
        brand: form.brand.trim() || undefined,
        origin: form.origin.trim() || undefined,
        size: isTileCategory ? form.size : undefined,
        categoryId: form.categoryId,
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive,
        isFeatured: form.isFeatured,
        images,
      });
      toast.success('Đã thêm sản phẩm và hình ảnh');
      navigate('/admin/san-pham');
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900">Thêm sản phẩm</h1>
          <p className="text-sm text-gray-400">Điền thông tin và chọn tối đa 12 hình ảnh trực tiếp từ máy tính</p>
        </div>
        <Link to="/admin/san-pham" className="btn-outline py-2 text-sm">
          <ArrowLeft size={16} /> Quay lại
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5 p-6">
        <div>
          <Label required>Tên sản phẩm</Label>
          <input className="field-input" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Gạch ốp lát 60x60" />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label required>Danh mục</Label>
            <select
              className="field-input"
              value={form.categoryId}
              onChange={(event) => {
                const nextCategoryId = event.target.value;
                const nextCategory = categories.find((category) => category.id === nextCategoryId);
                setForm((current) => ({
                  ...current,
                  categoryId: nextCategoryId,
                  size: nextCategory?.slug === 'gach-op-lat' ? current.size : '',
                }));
              }}
            >
              <option value="">-- Chọn danh mục --</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </div>

          {isTileCategory && (
            <div>
              <Label required>Kích thước</Label>
              <select className="field-input" value={form.size} onChange={(event) => setForm((current) => ({ ...current, size: event.target.value }))}>
                <option value="">-- Chọn kích thước --</option>
                {tileSizes.map((size) => <option key={size.value} value={size.value}>{size.label}</option>)}
              </select>
              <Link to="/admin/danh-muc" className="mt-1 inline-block text-xs font-medium text-brand-600 hover:underline">
                Quản lý kích thước trong danh mục Gạch Ốp Lát
              </Link>
            </div>
          )}

          <div><Label>Thương hiệu</Label><input className="field-input" value={form.brand} onChange={(event) => setForm((current) => ({ ...current, brand: event.target.value }))} /></div>
          <div><Label>Giá</Label><input type="number" className="field-input" value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))} /></div>
          <div><Label>Đơn vị</Label><input className="field-input" value={form.unit} onChange={(event) => setForm((current) => ({ ...current, unit: event.target.value }))} placeholder="m², thùng, cái..." /></div>
          <div><Label>Xuất xứ</Label><input className="field-input" value={form.origin} onChange={(event) => setForm((current) => ({ ...current, origin: event.target.value }))} /></div>
          <div><Label>Thứ tự hiển thị</Label><input type="number" className="field-input" value={form.sortOrder} onChange={(event) => setForm((current) => ({ ...current, sortOrder: event.target.value }))} /></div>
        </div>

        <div><Label>Mô tả</Label><textarea rows={4} className="field-input resize-none" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /></div>

        <ProductImageUrlInput value={form.imageUrls} onChange={(value) => setForm((current) => ({ ...current, imageUrls: value }))} />

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} className="h-4 w-4 accent-brand-600" />Hiển thị trên website</label>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700"><input type="checkbox" checked={form.isFeatured} onChange={(event) => setForm((current) => ({ ...current, isFeatured: event.target.checked }))} className="h-4 w-4 accent-brand-600" />Sản phẩm nổi bật</label>
        </div>

        <div className="flex justify-end border-t border-gray-100 pt-5">
          <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60"><Save size={17} /> {saving ? 'Đang lưu...' : 'Lưu sản phẩm'}</button>
        </div>
      </form>
    </div>
  );
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-600">{children}{required && <span className="ml-0.5 text-red-500">*</span>}</label>;
}
