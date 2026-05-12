/**
 * @my-studio/config — Central configuration for MY STUDIO
 *
 * All values are read from process.env.
 * Named exports only.
 */

export const config = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  },

  modal: {
    baseUrl: process.env.MODAL_BASE_URL ?? '',
    apiSecretToken: process.env.MODAL_API_SECRET_TOKEN ?? '',
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? '',
    apiKey: process.env.CLOUDINARY_API_KEY ?? '',
    apiSecret: process.env.CLOUDINARY_API_SECRET ?? '',
  },

  upstash: {
    redisRestUrl: process.env.UPSTASH_REDIS_REST_URL ?? '',
    redisRestToken: process.env.UPSTASH_REDIS_REST_TOKEN ?? '',
  },

  deployment: {
    mode: (process.env.DEPLOYMENT_MODE as 'development' | 'personal' | 'selfhost' | 'production') ?? 'development',
  },

  brand: {
    name: 'MY STUDIO' as const,
    creator: '@abdulanasbuilds' as const,
  },
} as const;

/**
 * Validates that all required environment variables are present.
 * Throws a descriptive error listing every missing variable.
 */
export function validateConfig(): void {
  const missing: string[] = [];

  // Supabase — required in all modes
  if (!config.supabase.url) {
    missing.push('NEXT_PUBLIC_SUPABASE_URL');
  }
  if (!config.supabase.anonKey) {
    missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  if (!config.supabase.serviceRoleKey) {
    missing.push('SUPABASE_SERVICE_ROLE_KEY');
  }

  // Modal — required for generation pipelines
  if (!config.modal.baseUrl) {
    missing.push('MODAL_BASE_URL');
  }
  if (!config.modal.apiSecretToken) {
    missing.push('MODAL_API_SECRET_TOKEN');
  }

  // Cloudinary — required for media storage
  if (!config.cloudinary.cloudName) {
    missing.push('CLOUDINARY_CLOUD_NAME');
  }
  if (!config.cloudinary.apiKey) {
    missing.push('CLOUDINARY_API_KEY');
  }
  if (!config.cloudinary.apiSecret) {
    missing.push('CLOUDINARY_API_SECRET');
  }

  // Upstash — required for rate limiting
  if (!config.upstash.redisRestUrl) {
    missing.push('UPSTASH_REDIS_REST_URL');
  }
  if (!config.upstash.redisRestToken) {
    missing.push('UPSTASH_REDIS_REST_TOKEN');
  }

  if (missing.length > 0) {
    throw new Error(
      `[MY STUDIO] Missing required environment variables:\n` +
        missing.map((v) => `  - ${v}`).join('\n') +
        `\n\nCopy packages/config/environments/personal.env.example to .env.local and fill in the values.`,
    );
  }
}
