// MY STUDIO — Card.tsx
// PURPOSE: Simple card wrapper with consistent styling

import { cn } from '@/lib/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={cn('rounded-xl border border-border bg-surface-1', className)}>
      {children}
    </div>
  );
}
