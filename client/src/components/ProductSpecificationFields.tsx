import type { Product } from '@/types';

export type ProductSpecificationForm = {
  color: string;
  productType: string;
  surface: string;
  glaze: string;
  application: string;
  pattern: string;
  spaces: string;
  collection: string;
  faceCount: string;
  piecesPerBox: string;
  areaPerBox: string;
};

export const EMPTY_PRODUCT_SPECIFICATIONS: ProductSpecificationForm = {
  color: '',
  productType: '',
  surface: '',
  glaze: '',
  application: '',
  pattern: '',
  spaces: '',
  collection: '',
  faceCount: '',
  piecesPerBox: '',
  areaPerBox: '',
};

export function productToSpecificationForm(product: Product): ProductSpecificationForm {
  return {
    color: product.color ?? '',
    productType: product.productType ?? '',
    surface: product.surface ?? '',
    glaze: product.glaze ?? '',
    application: product.application ?? '',
    pattern: product.pattern ?? '',
    spaces: product.spaces ?? '',
    collection: product.collection ?? '',
    faceCount: product.faceCount != null ? String(product.faceCount) : '',
    piecesPerBox: product.piecesPerBox != null ? String(product.piecesPerBox) : '',
    areaPerBox: product.areaPerBox != null ? String(product.areaPerBox) : '',
  };
}

export function specificationPayload(
  form: ProductSpecificationForm,
  emptyValue: undefined | null
) {
  const text = (value: string) => value.trim() || emptyValue;
  const integer = (value: string) => value ? Number.parseInt(value, 10) : emptyValue;
  const decimal = (value: string) => value ? Number.parseFloat(value) : emptyValue;

  return {
    color: text(form.color),
    productType: text(form.productType),
    surface: text(form.surface),
    glaze: text(form.glaze),
    application: text(form.application),
    pattern: text(form.pattern),
    spaces: text(form.spaces),
    collection: text(form.collection),
    faceCount: integer(form.faceCount),
    piecesPerBox: integer(form.piecesPerBox),
    areaPerBox: decimal(form.areaPerBox),
  };
}

type Props = {
  value: ProductSpecificationForm;
  onChange: (value: ProductSpecificationForm) => void;
};

export function ProductSpecificationFields({ value, onChange }: Props) {
  function update<K extends keyof ProductSpecificationForm>(
    key: K,
    nextValue: ProductSpecificationForm[K]
  ) {
    onChange({ ...value, [key]: nextValue });
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-gray-50/70 p-5">
      <div className="mb-4">
        <h3 className="font-bold text-gray-900">Thông số kỹ thuật</h3>
        <p className="mt-1 text-xs text-gray-400">
          Các trường để trống sẽ không hiển thị ngoài trang sản phẩm.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Màu sắc">
          <input className="field-input" value={value.color} onChange={(event) => update('color', event.target.value)} placeholder="Kem, trắng, xám..." />
        </Field>
        <Field label="Loại gạch">
          <input className="field-input" value={value.productType} onChange={(event) => update('productType', event.target.value)} placeholder="Gạch Porcelain" />
        </Field>
        <Field label="Bề mặt">
          <input className="field-input" value={value.surface} onChange={(event) => update('surface', event.target.value)} placeholder="Mờ láng, bóng, nhám..." />
        </Field>
        <Field label="Men">
          <input className="field-input" value={value.glaze} onChange={(event) => update('glaze', event.target.value)} placeholder="Mờ láng, men bóng..." />
        </Field>
        <Field label="Công năng">
          <input className="field-input" value={value.application} onChange={(event) => update('application', event.target.value)} placeholder="Ốp tường và lát nền" />
        </Field>
        <Field label="Hoa văn">
          <input className="field-input" value={value.pattern} onChange={(event) => update('pattern', event.target.value)} placeholder="Vân đá, terrazzo..." />
        </Field>
        <Field label="Bộ sưu tập">
          <input className="field-input" value={value.collection} onChange={(event) => update('collection', event.target.value)} placeholder="MOMENT" />
        </Field>
        <Field label="Số face">
          <input type="number" min="0" className="field-input" value={value.faceCount} onChange={(event) => update('faceCount', event.target.value)} placeholder="6" />
        </Field>
        <Field label="Số viên/thùng">
          <input type="number" min="0" className="field-input" value={value.piecesPerBox} onChange={(event) => update('piecesPerBox', event.target.value)} placeholder="6" />
        </Field>
        <Field label="Diện tích/thùng (m²)">
          <input type="number" min="0" step="0.01" className="field-input" value={value.areaPerBox} onChange={(event) => update('areaPerBox', event.target.value)} placeholder="1.08" />
        </Field>
        <div className="md:col-span-2">
          <Field label="Không gian sử dụng">
            <textarea
              rows={3}
              className="field-input resize-y"
              value={value.spaces}
              onChange={(event) => update('spaces', event.target.value)}
              placeholder="Phòng khách, phòng ngủ, phòng bếp, ban công, ngoại thất..."
            />
          </Field>
        </div>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-600">
        {label}
      </span>
      {children}
    </label>
  );
}
