'use client';

import { useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const supabase = createBrowserClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        window.location.href = '/library';
      } else {
        window.location.href = '/auth/login';
      }
    });
  }, []);

  return (
    <div className="flex h-screen items-center justify-center bg-bg">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-text-secondary">Loading MY STUDIO...</p>
      </div>
    </div>
  );
}