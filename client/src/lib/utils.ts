import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
  });
}

export function formatDateFull(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function maskApiKey(key: string): string {
  if (key.length <= 8) return '••••••••';
  return key.slice(0, 4) + '••••' + key.slice(-4);
}

export function getLatencyBadge(latencyTier: string): { label: string; className: string } {
  switch (latencyTier) {
    case 'ultra-fast':
      return { label: '⚡⚡ Ultra Fast', className: 'badge-success' };
    case 'fast':
      return { label: '⚡ Fast', className: 'badge-primary' };
    default:
      return { label: 'Standard', className: 'badge-gray' };
  }
}

export function getPriorityBadge(priority: string): { label: string; className: string } {
  switch (priority) {
    case 'CRITICAL':
      return { label: 'Critical', className: 'badge-danger' };
    case 'IMPORTANT':
      return { label: 'Important', className: 'badge-warning' };
    default:
      return { label: 'Optional', className: 'badge-gray' };
  }
}

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    'hard skills/tools/tech': 'badge-primary',
    'certs/education': 'badge-success',
    'job titles': 'badge-warning',
    'jargon/acronyms': 'badge-gray',
    'soft skills': 'badge-purple',
  };
  return colors[category.toLowerCase()] || 'badge-gray';
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}