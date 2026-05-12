'use client';

// MY STUDIO — ComingSoon.tsx
// PURPOSE: Placeholder component for modules not yet enabled

import { Lock } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface ComingSoonProps {
  module: string;
  description: string;
}

export function ComingSoon({ module, description }: ComingSoonProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="max-w-md p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface-2">
          <Lock className="h-6 w-6 text-text-secondary" />
        </div>
        <h2 className="text-xl font-bold text-text-primary">{module}</h2>
        <p className="mt-2 text-sm text-text-secondary">{description}</p>
        <p className="mt-4 text-xs text-text-secondary/60">
          This module is coming soon.
        </p>
        <Button variant="outline" size="sm" className="mt-6">
          Get notified
        </Button>
      </Card>
    </div>
  );
}
