// src/components/ProductImageUrlInput.tsx
import { useRef, useState } from 'react';
import { ImagePlus, Trash2, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

type Props = {
  value: string;
  onChange: (value: string) => void;
};

const MAX_IMAGES = 6;
const MAX_SIZE = 8 * 1024 * 1024;

function readImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error(`Không thể đọc ảnh ${file.name}`));
    reader.readAsDataURL(file);
  });
}

export function ProductImageUrlInput({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const images = value ? value.split('\n').filter(Boolean) : [];

  async function selectImages(files: FileList | null) {
    if (!files?.length) return;
    const selected = Array.from(files).slice(0, MAX_IMAGES - images.length);

    if (selected.some((file) => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type))) {
      toast.error('Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP');
      return;
    }
    if (selected.some((file) => file.size > MAX_SIZE)) {
      toast.error('Mỗi ảnh không được vượt quá 8 MB');
      return;
    }

    setLoading(true);
    try {
      const newImages = await Promise.all(selected.map(readImage));
      onChange([...images, ...newImages].join('\n'));
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function removeImage(index: number) {
    onChange(images.filter((_, current) => current !== index).join('\n'));
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
        <ImagePlus size={17} className="text-brand-600" />
        Hình ảnh sản phẩm
      </div>
      <p className="mb-3 text-xs text-gray-500">
        Chọn tối đa {MAX_IMAGES} ảnh từ máy tính. Ảnh đầu tiên là ảnh đại diện.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(event) => selectImages(event.target.files)}
      />
      <button
        type="button"
        disabled={loading || images.length >= MAX_IMAGES}
        onClick={() => inputRef.current?.click()}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-white px-4 py-5 text-sm font-semibold text-gray-600 hover:border-brand-400 hover:bg-brand-50 hover:text-brand-600 disabled:opacity-50"
      >
        <Upload size={18} />
        {loading ? 'Đang đọc ảnh...' : 'Chọn ảnh từ máy tính'}
      </button>

      {images.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {images.map((image, index) => (
            <div key={index} className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-white">
              <img src={image} alt={`Ảnh ${index + 1}`} className="h-full w-full object-cover" />
              {index === 0 && <span className="absolute left-1 top-1 rounded bg-brand-600 px-1.5 py-0.5 text-[10px] text-white">Ảnh chính</span>}
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100"
                aria-label="Xóa ảnh"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
