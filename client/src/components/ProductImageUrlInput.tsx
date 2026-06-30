// src/components/ProductImageUrlInput.tsx
import { useRef, useState } from 'react';
import { ImagePlus, Trash2, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

type Props = {
  value: string;
  onChange: (value: string) => void;
};

const MAX_IMAGES = 12;
const MAX_SIZE = 12 * 1024 * 1024;
const MAX_DIMENSION = 1200;
const WEBP_QUALITY = 0.72;

async function optimizeImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) {
    bitmap.close();
    throw new Error('Trình duyệt không hỗ trợ xử lý ảnh');
  }

  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return canvas.toDataURL('image/webp', WEBP_QUALITY);
}

export function ProductImageUrlInput({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const images = value ? value.split('\n').filter(Boolean) : [];

  async function selectImages(files: FileList | null) {
    if (!files?.length) return;

    const available = MAX_IMAGES - images.length;
    if (available <= 0) {
      toast.error(`Chỉ được chọn tối đa ${MAX_IMAGES} ảnh`);
      return;
    }

    const allSelected = Array.from(files);
    const selected = allSelected.slice(0, available);

    if (allSelected.length > available) {
      toast(`Chỉ thêm ${available} ảnh để không vượt quá giới hạn ${MAX_IMAGES} ảnh`);
    }

    if (selected.some((file) => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type))) {
      toast.error('Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP');
      return;
    }
    if (selected.some((file) => file.size > MAX_SIZE)) {
      toast.error('Mỗi ảnh gốc không được vượt quá 12 MB');
      return;
    }

    setLoading(true);
    try {
      const newImages: string[] = [];
      for (const file of selected) {
        newImages.push(await optimizeImage(file));
      }
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
        Chọn tối đa {MAX_IMAGES} ảnh JPG, PNG hoặc WEBP. Ảnh được tự động chuyển sang WEBP tối đa 1200 px; ảnh đầu tiên là ảnh đại diện.
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
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-white px-4 py-5 text-sm font-semibold text-gray-600 hover:border-brand-400 hover:bg-brand-50 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Upload size={18} />
        {loading
          ? 'Đang tối ưu ảnh...'
          : images.length >= MAX_IMAGES
            ? `Đã đủ ${MAX_IMAGES} ảnh`
            : `Chọn ảnh từ máy tính (${images.length}/${MAX_IMAGES})`}
      </button>

      {images.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {images.map((image, index) => (
            <div key={index} className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-white">
              <img src={image} alt={`Ảnh ${index + 1}`} loading="lazy" decoding="async" className="h-full w-full object-cover" />
              {index === 0 && <span className="absolute left-1 top-1 rounded bg-brand-600 px-1.5 py-0.5 text-[10px] text-white">Ảnh chính</span>}
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
                aria-label={`Xóa ảnh ${index + 1}`}
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
