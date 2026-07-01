import { PRIORITY_META, STATUS_META } from './crmConstants';
import type { ContactPriority, ContactStatus } from '@/types/crm';

export function formatCrmEvent(content: string) {
  if (content.startsWith('STATUS:')) {
    const [from, to] = content.slice(7).split('>');
    const fromLabel = STATUS_META[from as ContactStatus]?.label || from;
    const toLabel = STATUS_META[to as ContactStatus]?.label || to;
    return `Chuyển trạng thái từ ${fromLabel} sang ${toLabel}`;
  }
  if (content.startsWith('PRIORITY:')) {
    const [from, to] = content.slice(9).split('>');
    const fromLabel = PRIORITY_META[from as ContactPriority]?.label || from;
    const toLabel = PRIORITY_META[to as ContactPriority]?.label || to;
    return `Đổi mức ưu tiên từ ${fromLabel} sang ${toLabel}`;
  }
  if (content.startsWith('FOLLOW_UP:')) {
    const value = content.slice(10);
    return value === 'CLEARED'
      ? 'Đã xóa lịch chăm sóc'
      : `Đặt lịch chăm sóc lúc ${new Date(value).toLocaleString('vi-VN')}`;
  }
  if (content.startsWith('ASSIGNED:')) return 'Đã thay đổi người phụ trách';
  if (content === 'NOTE:CLEARED') return 'Đã xóa ghi chú nội bộ';
  return content;
}
