import { useState } from 'react';
import { ArrowDown, ArrowUp, Check, Pencil, Plus, Tags, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  normalizeCategoryChild,
  saveCategoryChildren,
  type CategoryChildOption,
} from '@/services/categoryChildService';

type Props = {
  categoryName: string;
  categorySlug: string;
  items: CategoryChildOption[];
  onChange: (items: CategoryChildOption[]) => void;
};

export function AdminCategoryChildrenPanel({
  categoryName,
  categorySlug,
  items,
  onChange,
}: Props) {
  const [newItem, setNewItem] = useState('');
  const [editingValue, setEditingValue] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  const isTileCategory = categorySlug === 'gach-op-lat';
  const itemLabel = isTileCategory ? 'Kích thước' : 'Danh mục cấp 2';
  const placeholder = isTileCategory ? 'Ví dụ: 120 x 120' : 'Ví dụ: Sơn nội thất';

  async function persist(next: CategoryChildOption[], message: string) {
    setSaving(true);
    try {
      await saveCategoryChildren(categorySlug, next);
      onChange(next);
      toast.success(message);
      return true;
    } catch (error) {
      toast.error((error as Error).message);
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function addItem(event: React.FormEvent) {
    event.preventDefault();
    const normalized = normalizeCategoryChild(categorySlug, newItem);

    if (!normalized) {
      toast.error(isTileCategory ? 'Nhập kích thước theo dạng 120 x 120' : 'Nhập tên danh mục cấp 2');
      return;
    }

    if (items.some((item) => item.value === normalized.value)) {
      toast.error(`${itemLabel} này đã tồn tại`);
      return;
    }

    const saved = await persist([...items, normalized], `Đã thêm ${normalized.label}`);
    if (saved) setNewItem('');
  }

  async function updateItem(originalValue: string) {
    const normalized = normalizeCategoryChild(categorySlug, draft);

    if (!normalized) {
      toast.error(isTileCategory ? 'Nhập kích thước theo dạng 120 x 120' : 'Nhập tên danh mục cấp 2');
      return;
    }

    if (
      normalized.value !== originalValue &&
      items.some((item) => item.value === normalized.value)
    ) {
      toast.error(`${itemLabel} này đã tồn tại`);
      return;
    }

    const saved = await persist(
      items.map((item) => item.value === originalValue ? normalized : item),
      `Đã cập nhật thành ${normalized.label}`
    );

    if (saved) {
      setEditingValue(null);
      setDraft('');
    }
  }

  async function removeItem(value: string) {
    const target = items.find((item) => item.value === value);
    await persist(
      items.filter((item) => item.value !== value),
      `Đã xóa ${target?.label ?? value}`
    );
  }

  async function moveItem(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= items.length) return;

    const next = [...items];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    await persist(next, 'Đã cập nhật thứ tự hiển thị');
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Tags size={18} className="text-brand-600" />
            <h2 className="font-bold text-gray-900">
              {isTileCategory ? 'Kích thước gạch ốp lát' : `Danh mục cấp 2 của ${categoryName}`}
            </h2>
          </div>
          <p className="mt-1 text-xs text-gray-400">
            Thêm, sửa, xóa và sắp xếp các mục con hiển thị trên website.
          </p>
        </div>

        <form onSubmit={addItem} className="flex gap-2">
          <input
            value={newItem}
            onChange={(event) => setNewItem(event.target.value)}
            placeholder={placeholder}
            className="field-input w-48"
            disabled={saving}
          />
          <button type="submit" className="btn-primary py-2 text-sm" disabled={saving}>
            <Plus size={16} /> Thêm
          </button>
        </form>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-400">
          Chưa có danh mục cấp 2. Hãy thêm mục đầu tiên.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-100">
          <div className="grid grid-cols-[minmax(150px,1fr)_minmax(120px,1fr)_auto] gap-3 border-b border-gray-100 bg-gray-50 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <span>{itemLabel}</span>
            <span>Giá trị lọc</span>
            <span>Thao tác</span>
          </div>

          <div className="divide-y divide-gray-100">
            {items.map((item, index) => {
              const editing = editingValue === item.value;

              return (
                <div
                  key={item.value}
                  className="grid grid-cols-[minmax(150px,1fr)_minmax(120px,1fr)_auto] items-center gap-3 px-4 py-3"
                >
                  {editing ? (
                    <input
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      className="field-input max-w-52 py-1.5"
                      autoFocus
                      disabled={saving}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') updateItem(item.value);
                        if (event.key === 'Escape') setEditingValue(null);
                      }}
                    />
                  ) : (
                    <span className="font-semibold text-gray-800">{item.label}</span>
                  )}

                  <span className="font-mono text-xs text-gray-400">{item.value}</span>

                  <div className="flex justify-end gap-1">
                    {editing ? (
                      <>
                        <button
                          type="button"
                          onClick={() => updateItem(item.value)}
                          disabled={saving}
                          className="rounded-lg p-2 text-green-600 hover:bg-green-50 disabled:opacity-40"
                          title="Cập nhật"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingValue(null)}
                          disabled={saving}
                          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 disabled:opacity-40"
                          title="Hủy"
                        >
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => moveItem(index, -1)}
                          disabled={saving || index === 0}
                          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 disabled:opacity-30"
                          title="Di chuyển lên"
                        >
                          <ArrowUp size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveItem(index, 1)}
                          disabled={saving || index === items.length - 1}
                          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 disabled:opacity-30"
                          title="Di chuyển xuống"
                        >
                          <ArrowDown size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingValue(item.value);
                            setDraft(item.label);
                          }}
                          disabled={saving}
                          className="rounded-lg p-2 text-gray-400 hover:bg-brand-50 hover:text-brand-600 disabled:opacity-40"
                          title="Sửa"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeItem(item.value)}
                          disabled={saving}
                          className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
                          title="Xóa"
                        >
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
