import { ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import type { CrmContact } from '@/types/crm';
import { SOURCE_LABELS, STATUS_META } from './crmConstants';
import { CrmAvatar } from './CrmAvatar';

function brief(item: CrmContact) {
  const line = item.message.split('\n').find((value) => value.startsWith('Nội dung:'));
  return item.aiSummary || line?.replace('Nội dung:', '').trim() || item.message.split('\n')[0];
}

export function CrmRow({ item, onOpen }: { item: CrmContact; onOpen: (id: string) => void }) {
  const status = STATUS_META[item.status];
  return (
    <tr onClick={() => onOpen(item.id)} className={clsx('cursor-pointer transition hover:bg-gray-50', item.status === 'NEW' && 'bg-amber-50/40')}>
      <td className="px-4 py-3"><div className="flex items-center gap-3"><CrmAvatar name={item.name} /><div><p className="font-bold text-gray-900">{item.name}</p><p className="text-[10px] text-gray-400">{SOURCE_LABELS[item.source]}</p></div></div></td>
      <td className="max-w-sm px-4 py-3"><p className="line-clamp-3 text-xs leading-5 text-gray-600">{brief(item)}</p></td>
      <td className="px-4 py-3 text-xs text-gray-600">{item.assignedAdmin?.name || 'Chưa phân công'}</td>
      <td className="px-4 py-3 text-xs text-gray-500">{item.followUpAt ? new Date(item.followUpAt).toLocaleString('vi-VN') : 'Chưa đặt lịch'}</td>
      <td className="px-4 py-3"><span className={clsx('rounded-full px-2.5 py-1 text-[10px] font-bold', status.className)}>{status.label}</span></td>
      <td className="px-4 py-3"><ChevronRight size={17} className="text-gray-300" /></td>
    </tr>
  );
}
