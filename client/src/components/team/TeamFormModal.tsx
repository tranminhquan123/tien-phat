import type { TeamMember } from '@/types/teamMember';

export function TeamFormModal({ member, onClose }: { member: TeamMember | null; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white p-6">
        <h2 className="font-black">{member ? 'Cập nhật nhân viên' : 'Thêm nhân viên'}</h2>
        <button type="button" onClick={onClose} className="btn-outline mt-6">Đóng</button>
      </div>
    </div>
  );
}
