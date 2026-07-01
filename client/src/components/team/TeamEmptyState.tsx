import { Users } from 'lucide-react';

export function TeamEmptyState() {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white text-gray-400">
      <Users size={34} />
      <p className="mt-2 text-sm font-semibold">Chưa có nhân viên phù hợp</p>
    </div>
  );
}
