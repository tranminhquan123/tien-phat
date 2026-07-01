import { useState } from 'react';
import type { ContactStatus, CrmContact } from '@/types/crm';
import { CrmAvatar } from './CrmAvatar';

const columns: Array<{ title: string; statuses: ContactStatus[]; dropStatus: ContactStatus }> = [
  { title: 'Mới', statuses: ['NEW', 'READING'], dropStatus: 'NEW' },
  { title: 'Đang tư vấn', statuses: ['RECEIVED', 'CONSULTING', 'REPLIED'], dropStatus: 'CONSULTING' },
  { title: 'Chờ khách', statuses: ['WAITING_CUSTOMER'], dropStatus: 'WAITING_CUSTOMER' },
  { title: 'Đã báo giá', statuses: ['QUOTED'], dropStatus: 'QUOTED' },
  { title: 'Đã chốt', statuses: ['WON'], dropStatus: 'WON' },
  { title: 'Kết thúc', statuses: ['LOST', 'CLOSED'], dropStatus: 'LOST' },
];

export function CrmKanban({
  contacts,
  onOpen,
  onMove,
}: {
  contacts: CrmContact[];
  onOpen: (id: string) => void;
  onMove: (id: string, status: ContactStatus) => void;
}) {
  const [dragged, setDragged] = useState<string | null>(null);

  return (
    <div className="overflow-x-auto pb-2">
      <div className="grid min-w-[1450px] grid-cols-6 gap-3">
        {columns.map((column) => {
          const items = contacts.filter((item) => column.statuses.includes(item.status));
          return (
            <section
              key={column.title}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                if (dragged) onMove(dragged, column.dropStatus);
                setDragged(null);
              }}
              className="min-h-[520px] rounded-2xl border border-gray-200 bg-gray-50 p-3"
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-black text-gray-800">{column.title}</h3>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-gray-500">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map((item) => (
                  <article
                    key={item.id}
                    draggable
                    onDragStart={() => setDragged(item.id)}
                    onDragEnd={() => setDragged(null)}
                    onClick={() => onOpen(item.id)}
                    className="cursor-grab rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-start gap-2">
                      <CrmAvatar name={item.name} small />
                      <div className="min-w-0"><p className="truncate text-sm font-bold text-gray-900">{item.name}</p><p className="text-[10px] text-gray-400">{item.assignedAdmin?.name || 'Chưa phân công'}</p></div>
                    </div>
                    <p className="mt-2 line-clamp-3 text-xs leading-5 text-gray-600">{item.aiSummary || item.message.split('\n')[0]}</p>
                    {item.followUpAt && <p className="mt-2 text-[10px] font-semibold text-violet-600">Hẹn: {new Date(item.followUpAt).toLocaleString('vi-VN')}</p>}
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
