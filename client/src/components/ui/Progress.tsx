import { cn } from '@/lib/utils';

interface ProgressProps {
  current: number;
  total: number;
  className?: string;
  activeColor?: string;
}

export function Progress({ current, total, className, activeColor = 'bg-primary-600' }: ProgressProps) {
  const percentage = Math.min(100, (current / total) * 100);

  return (
    <div className={cn('w-full bg-gray-200 rounded-full h-2.5 overflow-hidden', className)}>
      <div
        className={`h-full transition-all duration-300 ${activeColor} rounded-full`}
        style={{ width: `${percentage}%` }}
      />
      <div className="mt-1.5 flex justify-between text-xs text-gray-500">
        <span>{current} of {total}</span>
        <span>{Math.round(percentage)}%</span>
      </div>
    </div>
  );
}