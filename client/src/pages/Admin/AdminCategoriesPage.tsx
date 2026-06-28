// src/pages/Admin/AdminCategoriesPage.tsx
import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, FolderOpen, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { getCategories, adminCreateCategory, adminUpdateCategory, adminDeleteCategory } from '@/services/categoryService';
import { LoadingSpinner, EmptyState } from '@/components/LoadingSpinner';
import type { Category } from '@/types';

type FormData = { name: string; description: string; isActive: boolean; sortOrder: string };
const EMPTY: FormData = { name: '', description: '', isActive: true, sortOrder: '0' };

export function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  function fetch() {
    setLoading(true);
    getCategories().then((r) => setCategories(r.data ?? [])).finally(() => setLoading(false));
  }
  useEffect(() => { fetch(); }, []);

  function openCreate() { setEditId(null); setForm(EMPTY); setModalOpen(true); }
  function openEdit(c: Category) {
    setEditId(c.id);
    setForm({ name: c.name, description: c.description ?? '', isActive: c.isActive, sortOrder: String(c.sortOrder) });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.name) { toast.error('Nhập tên danh mục'); return; }
    setSaving(true);
    try {
      const data = { name: form.name, description: form.description || undefined, isActive: form.isActive, sortOrder: parseInt(form.sortOrder) || 0 };
      if (editId) { await adminUpdateCategory(editId, data); toast.success('Đã cập nhật'); }
      else { await adminCreateCategory(data); toast.success('Đã thêm danh mục'); }
      setModalOpen(false); fetch();
    } catch (err) { toast.error((err as Error).message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    try { await adminDeleteCategory(id); toast.success('Đã xóa'); setDeleteId(null); fetch(); }
    catch (err) { toast.error((err as Error).message); setDeleteId(null); }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-gray-900">Danh mục</h1>
          <p className="text-gray-400 text-sm">{categories.length} danh mục</p>
        </div>
        <button onClick={openCreate} className="btn-primary text-sm"><Plus size={16} /> Thêm mới</button>
      </div>

      {loading ? <LoadingSpinner className="py-20" /> : categories.length === 0 ? (
        <EmptyState icon={FolderOpen} title="Chưa có danh mục" />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Tên danh mục', 'Slug', 'Số SP', 'Trạng thái', 'Thứ tự', 'Thao tác'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-400">{c.slug}</td>
                  <td className="px-4 py-3 text-gray-600">{c._count?.products ?? 0}</td>
                  <td className="px-4 py-3">
                    <span className={clsx('badge', c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
                      {c.isActive ? 'Đang hiển thị' : 'Đã ẩn'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{c.sortOrder}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50"><Pencil size={15} /></button>
                      <button onClick={() => setDeleteId(c.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <Modal title={editId ? 'Sửa danh mục' : 'Thêm danh mục'} onClose={() => setModalOpen(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase">Tên danh mục *</label>
              <input className="field-input" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Gạch Ốp Lát" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase">Mô tả</label>
              <textarea className="field-input resize-none" rows={3} value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase">Thứ tự</label>
                <input type="number" className="field-input" value={form.sortOrder} onChange={(e) => setForm(p => ({ ...p, sortOrder: e.target.value }))} />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm(p => ({ ...p, isActive: e.target.checked }))} className="accent-brand-600 w-4 h-4" />
                  <span className="text-sm font-medium">Hiển thị</span>
                </label>
              </div>
            </div>
          </div>
          <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-gray-100">
            <button onClick={() => setModalOpen(false)} className="btn-outline text-sm py-2">Hủy</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary text-sm py-2 disabled:opacity-60">{saving ? 'Đang lưu...' : 'Lưu'}</button>
          </div>
        </Modal>
      )}

      {deleteId && (
        <Modal title="Xác nhận xóa" onClose={() => setDeleteId(null)}>
          <p className="text-gray-600 mb-6">Chỉ xóa được danh mục không có sản phẩm nào. Bạn có chắc không?</p>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setDeleteId(null)} className="btn-outline text-sm py-2">Hủy</button>
            <button onClick={() => handleDelete(deleteId)} className="bg-red-500 hover:bg-red-600 text-white font-semibold text-sm px-5 py-2 rounded-lg">Xóa</button>
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
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-black text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">×</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
