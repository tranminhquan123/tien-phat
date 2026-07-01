import type { ContactActivityType, ContactPriority, ContactSource, ContactStatus } from '@/types/crm';

export const STATUS_META: Record<ContactStatus, { label: string; className: string }> = {
  NEW: { label: 'Mới', className: 'bg-amber-100 text-amber-700' },
  READING: { label: 'Đã xem', className: 'bg-sky-100 text-sky-700' },
  RECEIVED: { label: 'Đã tiếp nhận', className: 'bg-cyan-100 text-cyan-700' },
  CONSULTING: { label: 'Đang tư vấn', className: 'bg-blue-100 text-blue-700' },
  WAITING_CUSTOMER: { label: 'Chờ khách phản hồi', className: 'bg-violet-100 text-violet-700' },
  QUOTED: { label: 'Đã gửi báo giá', className: 'bg-indigo-100 text-indigo-700' },
  WON: { label: 'Đã chốt đơn', className: 'bg-green-100 text-green-700' },
  LOST: { label: 'Không thành công', className: 'bg-red-100 text-red-700' },
  REPLIED: { label: 'Đã phản hồi', className: 'bg-emerald-100 text-emerald-700' },
  CLOSED: { label: 'Đã đóng', className: 'bg-gray-100 text-gray-500' },
};

export const PRIORITY_META: Record<ContactPriority, { label: string; className: string }> = {
  LOW: { label: 'Thấp', className: 'bg-gray-100 text-gray-600' },
  MEDIUM: { label: 'Trung bình', className: 'bg-blue-50 text-blue-700' },
  HIGH: { label: 'Cao', className: 'bg-red-100 text-red-700' },
};

export const SOURCE_LABELS: Record<ContactSource, string> = {
  CONTACT_FORM: 'Biểu mẫu',
  CHATBOT: 'Chatbot',
  MANUAL: 'Nhập thủ công',
  OTHER: 'Nguồn khác',
};

export const ACTIVITY_META: Record<ContactActivityType, { label: string; className: string }> = {
  CREATED: { label: 'Khởi tạo', className: 'bg-gray-100 text-gray-600' },
  STATUS_CHANGED: { label: 'Trạng thái', className: 'bg-blue-100 text-blue-700' },
  NOTE_ADDED: { label: 'Ghi chú', className: 'bg-amber-100 text-amber-700' },
  FOLLOW_UP_SET: { label: 'Hẹn chăm sóc', className: 'bg-violet-100 text-violet-700' },
  FOLLOW_UP_COMPLETED: { label: 'Đã chăm sóc', className: 'bg-green-100 text-green-700' },
  CONTACTED: { label: 'Đã liên hệ', className: 'bg-emerald-100 text-emerald-700' },
  ASSIGNED: { label: 'Phân công', className: 'bg-cyan-100 text-cyan-700' },
  PRIORITY_CHANGED: { label: 'Ưu tiên', className: 'bg-red-100 text-red-700' },
  SYSTEM: { label: 'Hệ thống', className: 'bg-gray-100 text-gray-500' },
};
