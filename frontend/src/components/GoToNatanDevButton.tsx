import { AtSign } from 'lucide-react';

const NATAN_DEV_URL = '/natanmarinho.dev';

interface GoToNatanDevButtonProps {
  variant?: 'pill' | 'icon';
  className?: string;
}

export default function GoToNatanDevButton({ variant = 'pill', className = '' }: GoToNatanDevButtonProps) {
  if (variant === 'icon') {
    return (
      <a
        href={NATAN_DEV_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center justify-center text-sky-400 hover:text-sky-300 transition-all cursor-pointer ${className}`}
        title="Visitar @natanmarinho.dev em nova aba"
        aria-label="Visitar @natanmarinho.dev em nova aba"
      >
        <AtSign className="w-4 h-4" />
      </a>
    );
  }

  return (
    <a
      href={NATAN_DEV_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-1.5 text-[10px] font-bold px-3 py-2 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 transition-all cursor-pointer whitespace-nowrap ${className}`}
      title="Visitar @natanmarinho.dev em nova aba"
    >
      <AtSign className="w-3 h-3" />
      @natanmarinho.dev
    </a>
  );
}
