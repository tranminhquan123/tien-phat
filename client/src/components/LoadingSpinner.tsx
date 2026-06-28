// src/components/LoadingSpinner.tsx
import type { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClass = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }[size];
  return (
    <div className={clsx('flex items-center justify-center', className)}>
      <div
        className={clsx(
          'border-2 border-gray-200 border-t-brand-600 rounded-full animate-spin',
          sizeClass
        )}
      />
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {Icon && <Icon size={48} className="text-gray-300 mb-4" />}
      <p className="text-gray-600 font-semibold text-lg">{title}</p>
      {description && <p className="text-gray-400 text-sm mt-1">{description}</p>}
    </div>
  );
}
