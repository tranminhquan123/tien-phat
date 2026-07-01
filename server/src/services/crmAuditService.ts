export const CRM_STATUS_LABELS = {
  NEW: 'Mới',
  READING: 'Đã xem',
  RECEIVED: 'Đã tiếp nhận',
  CONSULTING: 'Đang tư vấn',
  WAITING_CUSTOMER: 'Chờ khách phản hồi',
  QUOTED: 'Đã gửi báo giá',
  WON: 'Đã chốt đơn',
  LOST: 'Không thành công',
  REPLIED: 'Đã phản hồi',
  CLOSED: 'Đã đóng',
} as const;

export const CRM_PRIORITY_LABELS = {
  LOW: 'Thấp',
  MEDIUM: 'Trung bình',
  HIGH: 'Cao',
} as const;
