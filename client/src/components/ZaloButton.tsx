// src/components/ZaloButton.tsx
import { Phone } from 'lucide-react';

export function ZaloButton() {
  return (
    <div className="fixed bottom-6 right-5 z-50 flex flex-col items-end gap-3">
      {/* Zalo */}
      <a
        href="https://zalo.me/0909123456"
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg transition-all duration-200 hover:scale-105 group"
        aria-label="Chat Zalo"
      >
        <span className="hidden group-hover:block pl-3 pr-1 text-sm font-semibold whitespace-nowrap">
          Chat Zalo
        </span>
        <div className="w-12 h-12 flex items-center justify-center shrink-0">
          <svg viewBox="0 0 32 32" fill="white" className="w-7 h-7">
            <path d="M16 2C8.268 2 2 7.82 2 15c0 3.874 1.74 7.356 4.513 9.82L5.5 30l5.45-2.53A14.9 14.9 0 0 0 16 28c7.732 0 14-5.82 14-13S23.732 2 16 2zm-4.5 14.5h-2v-6h2v6zm3 0h-2v-6h2v6zm3 0h-2v-6h2v6z" />
          </svg>
        </div>
      </a>

      {/* Phone */}
      <a
        href="tel:0909123456"
        className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white rounded-full shadow-lg transition-all duration-200 hover:scale-105 group animate-bounce"
        aria-label="Gọi ngay"
      >
        <span className="hidden group-hover:block pl-3 pr-1 text-sm font-semibold whitespace-nowrap">
          0909 123 456
        </span>
        <div className="w-12 h-12 flex items-center justify-center shrink-0">
          <Phone size={22} />
        </div>
      </a>
    </div>
  );
}
