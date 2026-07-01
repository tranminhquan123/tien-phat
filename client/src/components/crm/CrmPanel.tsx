import type { ReactNode } from 'react';

export function CrmPanel({ title, children }: { title: string; children: ReactNode }) {
  return <section className="rounded-xl border border-gray-200 bg-white p-4"><h3 className="mb-3 font-bold text-gray-900">{title}</h3>{children}</section>;
}
