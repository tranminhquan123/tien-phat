import type { CrmContact } from '@/types/crm';

export function CrmList({ contacts, onOpen }: { contacts: CrmContact[]; onOpen: (id: string) => void }) {
  return (
    <div className="grid gap-3">
      {contacts.map((item) => (
        <button key={item.id} type="button" onClick={() => onOpen(item.id)} className="rounded-xl border border-gray-200 bg-white p-4 text-left">
          <p className="font-bold text-gray-900">{item.name}</p>
          <p className="mt-1 text-xs text-gray-500">{item.status}</p>
        </button>
      ))}
    </div>
  );
}
