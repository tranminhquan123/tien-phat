import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Ruler, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  DEFAULT_TILE_SIZES,
  normalizeTileSize,
  type TileSizeOption,
} from '@/constants/tileSizes';
import { getTileSizes, saveTileSizes } from '@/services/tileSizeService';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export function AdminTileSizesPage() {
  const [sizes, setSizes] = useState<TileSizeOption[]>(DEFAULT_TILE_SIZES);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getTileSizes()
      .then(setSizes)
      .finally(() => setLoading(false));
  }, []);

  async function persist(nextSizes: TileSizeOption[], successMessage: string) {
    setSaving(true);
    try {
      await saveTileSizes(nextSizes);
      setSizes(nextSizes);
      toast.success(successMessage);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    const normalized = normalizeTileSize(input);

    if (!normalized) {
      toast.error('Nhập kích thước theo dạng 120 x 120');
      return;
    }

    if (sizes.some((size) => size.value === normalized.value)) {
      toast.error('Kích thước này đã tồn tại');
      return;
    }

    await persist([...sizes, normalized], `Đã thêm kích thước ${normalized.label}`);
    setInput('');
  }

  async function handleDelete(index: number) {
    const target = sizes[index];
    const nextSizes = sizes.filter((_, currentIndex) => currentIndex !== index);
    await persist(nextSizes, `Đã xóa kích thước ${target.label}`);
  }

  async function move(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= sizes.length) return;

    const nextSizes = [...sizes];
    [nextSizes[index], nextSizes[nextIndex]] = [nextSizes[nextIndex], nextSizes[index]];
    await persist(nextSizes, 'Đã cập nhật thứ tự kích thước');
  }

  if (loading) return <LoadingSpinner className="py-20" />;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-black text-gray-900">Kích thước gạch</h1>
        <p className="mt-1 text-sm text-gray-400">
          Quản lý các kích thước hiển thị trong menu Gạch Ốp Lát và biểu mẫu sản phẩm.
        </p>
      </div>

      <form onSubmit={handleAdd} className="card p-5">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-600">
          Thêm kích thước mới
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Ruler size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ví dụ: 120 x 120"
              className="field-input pl-10"
              disabled={saving}
            />
          </div>
          <button type="submit" className="btn-primary justify-center" disabled={saving}>
            <Plus size={17} /> Thêm kích thước
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-400">
          Có thể nhập 120x120, 120 x 120 hoặc dùng dấu ×. Hệ thống sẽ tự chuẩn hóa.
        </p>
      </form>

      <div className="card overflow-hidden">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="font-bold text-gray-900">Danh sách kích thước</h2>
          <p className="text-xs text-gray-400">{sizes.length} kích thước đang được sử dụng</p>
        </div>

        <div className="divide-y divide-gray-100">
          {sizes.map((size, index) => (
            <div key={size.value} className="flex items-center gap-3 px-5 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <Ruler size={17} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-800">{size.label}</p>
                <p className="text-xs text-gray-400">Giá trị lọc: {size.value}</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={saving || index === 0}
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30"
                  title="Di chuyển lên"
                >
                  <ArrowUp size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={saving || index === sizes.length - 1}
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30"
                  title="Di chuyển xuống"
                >
                  <ArrowDown size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(index)}
                  disabled={saving || sizes.length === 1}
                  className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-30"
                  title="Xóa kích thước"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Khi xóa một kích thước, sản phẩm cũ đang dùng kích thước đó vẫn giữ nguyên dữ liệu nhưng mục kích thước sẽ không còn xuất hiện trong menu để chọn mới.
      </div>
    </div>
  );
}
