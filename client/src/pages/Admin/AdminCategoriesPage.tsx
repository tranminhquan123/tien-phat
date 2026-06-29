// src/pages/Admin/AdminCategoriesPage.tsx
import { Fragment, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, FolderOpen, ChevronDown, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import {
  getCategories,
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
} from '@/services/categoryService';
import {
  getCategoryChildrenMap,
  type CategoryChildOption,
} from '@/services/categoryChildService';
import { AdminCategoryChildrenPanel } from '@/components/AdminCategoryChildrenPanel';
import { LoadingSpinner, EmptyState } from '@/components/LoadingSpinner';
import type { Category } from '@/types';

type FormData = { name: string; description: string; isActive: boolean; sortOrder: string };
const EMPTY: FormData = { name: '', description: '', isActive: true, sortOrder: '0' };

export function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [childrenBySlug, setChildrenBySlug] = useState<Record<string, CategoryChildOption[]>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  function fetchData() {
    setLoading(true);
    getCategories()
      .then(async (categoryResult) => {
        const list = categoryResult.data ?? [];
        const childMap = await getCategoryChildrenMap(list.map((category) => category.slug));
        setCategories(list);
        setChildrenBySlug(childMap);
      })
      .catch((error) => toast.error((error as Error).message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchData(); }, []);

  function openCreate() {
    setEditId(null);
    setForm(EMPTY);
    setModalOpen(true);
  }

  function openEdit(category: Category) {
    setEditId(category.id);
    setForm({
      name: category.name,
      description: category.description ?? '',
      isActive: category.isActive,
      sortOrder: String(category.sortOrder),
    });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) return toast.error('Nhập tên danh mục');

    setSaving(true);
    try {
      const data = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        isActive: form.isActive,
        sortOrder: parseInt(form.sortOrder) || 0,
      };

      if (editId) {
        await adminUpdateCategory(editId, data);
        toast.success('Đã cập nhật danh mục');
      } else {
        await adminCreateCategory(data);
        toast.success('Đã thêm danh mục');
      }

      setModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await adminDeleteCategory(id);
      toast.success('Đã xóa danh mục');
      setDeleteId(null);
      fetchData();
    } catch (error) {
      toast.error((error as Error).message);
      setDeleteId(null);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900">Danh mục</h1>
          <p className="text-sm text-gray-400">{categories.length} danh mục</p>
        </div>
        <button onClick={openCreate} className="btn-primary text-sm">
          <Plus size={16} /> Thêm mới
        </button>
      </div>

      {loading ? (
        <LoadingSpinner className="py-20" />
      ) : categories.length === 0 ? (
        <EmptyState icon={FolderOpen} title="Chưa có danh mục" />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  {['Tên danh mục', 'Slug', 'Số SP', 'Trạng thái', 'Thứ tự', 'Thao tác'].map((heading) => (
                    <th key={heading} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-50">
                {categories.map((category) => {
                  const expanded = expandedId === category.id;
                  const childItems = childrenBySlug[category.slug] ?? [];
                  const childCountLabel = category.slug === 'gach-op-lat'
                    ? `${childItems.length} kích thước`
                    : `${childItems.length} mục con`;

                  return (
                    <Fragment key={category.id}>
                      <tr className={clsx('hover:bg-gray-50/50', expanded && 'bg-brand-50/30')}>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          <button
                            type="button"
                            onClick={() => setExpandedId(expanded ? null : category.id)}
                            className="flex items-center gap-2 font-semibold hover:text-brand-600"
                            aria-expanded={expanded}
                          >
                            {expanded ? <ChevronDown size={17} /> : <ChevronRight size={17} />}
                            <span>{category.name}</span>
                            <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs text-brand-700">
                              {childCountLabel}
                            </span>
                          </button>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-400">{category.slug}</td>
                        <td className="px-4 py-3 text-gray-600">{category._count?.products ?? 0}</td>
                        <td className="px-4 py-3">
                          <span className={clsx('badge', category.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
                            {category.isActive ? 'Đang hiển thị' : 'Đã ẩn'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{category.sortOrder}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <button
                              onClick={() => openEdit(category)}
                              className="rounded-lg p-1.5 text-gray-400 hover:bg-brand-50 hover:text-brand-600"
                              title="Sửa danh mục"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => setDeleteId(category.id)}
                              className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                              title="Xóa danh mục"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {expanded && (
                        <tr>
                          <td colSpan={6} className="bg-gray-50/80 px-4 py-5">
                            <AdminCategoryChildrenPanel
                              categoryName={category.name}
                              categorySlug={category.slug}
                              items={childItems}
                              onChange={(nextItems) => {
                                setChildrenBySlug((current) => ({
                                  ...current,
                                  [category.slug]: nextItems,
                                }));
                              }}
                            />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalOpen && (
        <Modal title={editId ? 'Sửa danh mục' : 'Thêm danh mục'} onClose={() => setModalOpen(false)}>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase text-gray-600">Tên danh mục *</label>
              <input
                className="field-input"
                value={form.name}
                onChange={(event) => setForm((previous) => ({ ...previous, name: event.target.value }))}
                placeholder="Gạch Ốp Lát"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase text-gray-600">Mô tả</label>
              <textarea
                className="field-input resize-none"
                rows={3}
                value={form.description}
                onChange={(event) => setForm((previous) => ({ ...previous, description: event.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase text-gray-600">Thứ tự</label>
                <input
                  type="number"
                  className="field-input"
                  value={form.sortOrder}
                  onChange={(event) => setForm((previous) => ({ ...previous, sortOrder: event.target.value }))}
                />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) => setForm((previous) => ({ ...previous, isActive: event.target.checked }))}
                    className="h-4 w-4 accent-brand-600"
                  />
                  <span className="text-sm font-medium">Hiển thị</span>
                </label>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
            <button onClick={() => setModalOpen(false)} className="btn-outline py-2 text-sm">Hủy</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary py-2 text-sm disabled:opacity-60">
              {saving ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </Modal>
      )}

      {deleteId && (
        <Modal title="Xác nhận xóa" onClose={() => setDeleteId(null)}>
          <p className="mb-6 text-gray-600">Chỉ xóa được danh mục không có sản phẩm nào. Bạn có chắc không?</p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteId(null)} className="btn-outline py-2 text-sm">Hủy</button>
            <button
              onClick={() => handleDelete(deleteId)}
              className="rounded-lg bg-red-500 px-5 py-2 text-sm font-semibold text-white hover:bg-red-600"
            >
              Xóa
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="font-black text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-xl font-bold text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            ×
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
