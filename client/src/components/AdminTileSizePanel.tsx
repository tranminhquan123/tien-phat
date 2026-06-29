import { useState } from 'react';
import { ArrowDown, ArrowUp, Check, Pencil, Plus, Ruler, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { normalizeTileSize, type TileSizeOption } from '@/constants/tileSizes';
import { saveTileSizes } from '@/services/tileSizeService';

type Props = {
  sizes: TileSizeOption[];
  onChange: (sizes: TileSizeOption[]) => void;
};

export function AdminTileSizePanel({ sizes, onChange }: Props) {
  const [newSize, setNewSize] = useState('');
  const [editingValue, setEditingValue] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  async function persist(next: TileSizeOption[], message: string): Promise<boolean> {
    setSaving(true);
    try {
      await saveTileSizes(next);
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

  async function addSize(event: React.FormEvent) {
    event.preventDefault();
    const normalized = normalizeTileSize(newSize);
    if (!normalized) return toast.error('Nhập kích thước theo dạng 120 x 120');
    if (sizes.some((item) => item.value === normalized.value)) return toast.error('Kích thước này đã tồn tại');
    const saved = await persist([...sizes, normalized], `Đã thêm ${normalized.label}`);
    if (saved) setNewSize('');
  }

  async function updateSize(originalValue: string) {
    const normalized = normalizeTileSize(draft);
    if (!normalized) return toast.error('Nhập kích thước theo dạng 120 x 120');
    if (normalized.value !== originalValue && sizes.some((item) => item.value === normalized.value)) {
      return toast.error('Kích thước này đã tồn tại');
    }
    const saved = await persist(
      sizes.map((item) => item.value === originalValue ? normalized : item),
      `Đã cập nhật thành ${normalized.label}`
    );
    if (saved) {
      setEditingValue(null);
      setDraft('');
    }
  }

  async function removeSize(value: string) {
    if (sizes.length === 1) return toast.error('Phải giữ lại ít nhất một kích thước');
    const target = sizes.find((item) => item.value === value);
    await persist(sizes.filter((item) => item.value !== value), `Đã xóa ${target?.label ?? value}`);
  }

  async function moveSize(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= sizes.length) return;
    const next = [...sizes];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    await persist(next, 'Đã cập nhật thứ tự kích thước');
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Ruler size={18} className="text-brand-600" />
            <h2 className="font-bold text-gray-900">Kích thước gạch ốp lát</h2>
          </div>
          <p className="mt-1 text-xs text-gray-400">Thêm, sửa, xóa và sắp xếp kích thước hiển thị trên website.</p>
        </div>
        <form onSubmit={addSize} className="flex gap-2">
          <input
            value={newSize}
            onChange={(event) => setNewSize(event.target.value)}
            placeholder="Ví dụ: 120 x 120"
            className="field-input w-44"
            disabled={saving}
          />
          <button type="submit" className="btn-primary py-2 text-sm" disabled={saving}>
            <Plus size={16} /> Thêm
          </button>
        </form>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-100">
        <div className="grid grid-cols-[minmax(130px,1fr)_minmax(120px,1fr)_auto] gap-3 border-b border-gray-100 bg-gray-50 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
          <span>Kích thước</span><span>Giá trị lọc</span><span>Thao tác</span>
        </div>
        <div className="divide-y divide-gray-100">
          {sizes.map((size, index) => {
            const editing = editingValue === size.value;
            return (
              <div key={size.value} className="grid grid-cols-[minmax(130px,1fr)_minmax(120px,1fr)_auto] items-center gap-3 px-4 py-3">
                {editing ? (
                  <input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    className="field-input max-w-44 py-1.5"
                    autoFocus
                    disabled={saving}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') updateSize(size.value);
                      if (event.key === 'Escape') setEditingValue(null);
                    }}
                  />
                ) : <span className="font-semibold text-gray-800">{size.label}</span>}
                <span className="font-mono text-xs text-gray-400">{size.value}</span>
                <div className="flex justify-end gap-1">
                  {editing ? (
                    <>
                      <button type="button" onClick={() => updateSize(size.value)} disabled={saving} className="rounded-lg p-2 text-green-600 hover:bg-green-50"><Check size={16} /></button>
                      <button type="button" onClick={() => setEditingValue(null)} disabled={saving} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"><X size={16} /></button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => moveSize(index, -1)} disabled={saving || index === 0} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 disabled:opacity-30"><ArrowUp size={15} /></button>
                      <button type="button" onClick={() => moveSize(index, 1)} disabled={saving || index === sizes.length - 1} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 disabled:opacity-30"><ArrowDown size={15} /></button>
                      <button type="button" onClick={() => { setEditingValue(size.value); setDraft(size.label); }} disabled={saving} className="rounded-lg p-2 text-gray-400 hover:bg-brand-50 hover:text-brand-600"><Pencil size={15} /></button>
                      <button type="button" onClick={() => removeSize(size.value)} disabled={saving || sizes.length === 1} className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-30"><Trash2 size={15} /></button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <p className="mt-3 text-xs text-gray-400">Sản phẩm cũ không tự đổi khi bạn sửa giá trị kích thước; hãy cập nhật lại trong mục Sản phẩm.</p>
    </div>
  );
}
