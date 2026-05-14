'use client';

// MY STUDIO — Login Page
// PURPOSE: Email + password authentication with Supabase

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

import { createBrowserClient } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function Page() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createBrowserClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      router.push('/avatar');
      router.refresh();
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <Card className="w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-text-primary">MY STUDIO</h1>
          <p className="mt-2 text-text-secondary">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-error/30 bg-error/10 p-3 text-sm text-error">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="mb-1 block text-sm text-text-secondary">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-border bg-surface-2 px-4 py-2.5 text-text-primary placeholder:text-text-secondary/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm text-text-secondary">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-border bg-surface-2 px-4 py-2.5 text-text-primary placeholder:text-text-secondary/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Enter your password"
            />
          </div>

          <Button type="submit" variant="primary" size="lg" isLoading={loading} className="w-full">
            Sign In
          </Button>
        </form>
      </Card>
    </div>
  );
}

;
