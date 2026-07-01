import clsx from 'clsx';

export function CrmAvatar({ name, small = false }: { name: string; small?: boolean }) {
  return (
    <span className={clsx('flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-black text-brand-700', small ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm')}>
      {name.trim().charAt(0).toUpperCase() || '?'}
    </span>
  );
}
