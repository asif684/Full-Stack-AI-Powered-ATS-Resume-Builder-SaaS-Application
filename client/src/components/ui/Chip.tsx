import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChipProps {
  label: string;
  selected?: boolean;
  removable?: boolean;
  onRemove?: () => void;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'selected' | 'option';
}

export function Chip({
  label,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  selected = false,
  removable = false,
  onRemove,
  onClick,
  className,
  variant = 'default',
}: ChipProps) {
  const baseClasses = 'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-all duration-200';

  const variantClasses = {
    default: 'bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer',
    selected: 'bg-primary-100 text-primary-800 ring-2 ring-primary-500',
    option: 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-50 cursor-pointer',
  };

  return (
    <span
      className={cn(baseClasses, variantClasses[variant], className)}
      onClick={onClick}
    >
      <span className="truncate max-w-[150px]">{label}</span>
      {removable && onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1.5 rounded-full p-0.5 hover:bg-gray-200 transition-colors"
        >
          <X size={14} />
        </button>
      )}
    </span>
  );
}