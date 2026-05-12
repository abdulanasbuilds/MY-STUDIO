// MY STUDIO — StepProgress.tsx
// PURPOSE: Multi-step progress indicator for generation pipelines

import { cn } from '@/lib/cn';

type StepStatus = 'pending' | 'active' | 'complete' | 'error';

interface Step {
  label: string;
  status: StepStatus;
  timeElapsed?: string;
}

interface StepProgressProps {
  steps: Step[];
}

const statusStyles: Record<StepStatus, string> = {
  pending: 'bg-surface-2 text-text-secondary/40',
  active: 'bg-primary/20 text-primary ring-2 ring-primary/50',
  complete: 'bg-success/20 text-success',
  error: 'bg-error/20 text-error',
};

const lineStyles: Record<StepStatus, string> = {
  pending: 'bg-surface-2',
  active: 'bg-primary/30',
  complete: 'bg-success/50',
  error: 'bg-error/50',
};

export function StepProgress({ steps }: StepProgressProps) {
  return (
    <div className="space-y-0">
      {steps.map((step, index) => (
        <div key={step.label} className="flex items-start gap-3">
          {/* Step indicator column */}
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold',
                statusStyles[step.status],
                step.status === 'active' && 'animate-pulse',
              )}
            >
              {step.status === 'complete' ? '\u2713' : index + 1}
            </div>
            {index < steps.length - 1 && (
              <div className={cn('h-8 w-0.5', lineStyles[step.status])} />
            )}
          </div>

          {/* Step label */}
          <div className="flex items-center gap-2 pt-1.5">
            <span
              className={cn(
                'text-sm',
                step.status === 'active' && 'font-medium text-text-primary',
                step.status === 'complete' && 'text-text-secondary',
                step.status === 'pending' && 'text-text-secondary/40',
                step.status === 'error' && 'text-error',
              )}
            >
              {step.label}
            </span>
            {step.timeElapsed && (
              <span className="text-xs text-text-secondary/50">{step.timeElapsed}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
