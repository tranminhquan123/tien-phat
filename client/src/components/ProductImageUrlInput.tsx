// src/components/ProductImageUrlInput.tsx
import { ImagePlus } from 'lucide-react';

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function ProductImageUrlInput({ value, onChange }: Props) {
  const urls = value
    .split(/\r?\n|,/)
    .map((url) => url.trim())
    .filter(Boolean)
    .slice(0, 6);

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
        <ImagePlus size={17} className="text-brand-600" />
        Hình ảnh sản phẩm
      </div>
      <textarea
        className="field-input resize-none bg-white"
        rows={4}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={'Dán địa chỉ ảnh, mỗi dòng một ảnh.\nẢnh ở dòng đầu sẽ là ảnh đại diện.'}
      />
      <p className="mt-2 text-xs text-gray-500">
        Dùng đường dẫn ảnh công khai bắt đầu bằng http:// hoặc https://.
      </p>
      {urls.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {urls.map((url, index) => (
            <div key={`${url}-${index}`} className="relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-white">
              <img src={url} alt={`Xem trước ${index + 1}`} className="h-full w-full object-cover" />
              {index === 0 && (
                <span className="absolute left-1 top-1 rounded bg-brand-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  Ảnh chính
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
