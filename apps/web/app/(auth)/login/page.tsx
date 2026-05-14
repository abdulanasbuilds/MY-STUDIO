'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

import { createBrowserClient } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function Page() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
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
      let authError;

      if (isSignUp) {
        const result = await supabase.auth.signUp({ email, password });
        authError = result.error;
        if (!authError) {
          setError('Check your email for a confirmation link!');
          setLoading(false);
          return;
        }
      } else {
        const result = await supabase.auth.signInWithPassword({ email, password });
        authError = result.error;
      }

      if (authError) {
        setError(authError.message);
        return;
      }

      router.push('/avatar');
      router.refresh();
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <Card className="w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-text-primary">MY STUDIO</h1>
          <p className="mt-2 text-text-secondary">
            {isSignUp ? 'Create your account' : 'Sign in to your account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-border/30 bg-surface-2 p-3 text-sm text-text-primary">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="mb-1 block text-sm text-text-secondary">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full rounded-lg border border-border bg-surface-2 px-4 py-2.5 text-text-primary placeholder:text-text-secondary/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="you@example.com" />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm text-text-secondary">Password</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              className="w-full rounded-lg border border-border bg-surface-2 px-4 py-2.5 text-text-primary placeholder:text-text-secondary/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Enter your password" />
          </div>

          <Button type="submit" variant="primary" size="lg" isLoading={loading} className="w-full">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-text-secondary">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button onClick={() => { setIsSignUp(!isSignUp); setError(null); }} className="text-primary hover:underline">
            {isSignUp ? 'Sign In' : 'Create one'}
          </button>
        </p>
      </Card>
    </div>
  );
}
