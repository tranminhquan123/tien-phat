import type { CrmContact } from '@/types/crm';
import { CrmRow } from './CrmRow';

export function CrmList({ contacts, onOpen }: { contacts: CrmContact[]; onOpen: (id: string) => void }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
      <table className="min-w-[860px] w-full text-sm">
        <thead className="border-b border-gray-100 bg-gray-50">
          <tr>
            {['Khách hàng', 'Nhu cầu', 'Phụ trách', 'Liên hệ tiếp theo', 'Trạng thái', ''].map((header) => (
              <th key={header} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {contacts.map((item) => <CrmRow key={item.id} item={item} onOpen={onOpen} />)}
        </tbody>
      </table>
    </div>
  );
}
