// MY STUDIO — validate-env.ts
// PURPOSE: Validate all required environment variables are set
// Run: npx tsx scripts/validate-env.ts

const required: Record<string, string[]> = {
  Supabase: [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ],
  Modal: [
    'MODAL_BASE_URL',
    'MODAL_API_SECRET_TOKEN',
  ],
  Cloudinary: [
    'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME',
  ],
};

const optional: Record<string, string[]> = {
  Supabase: ['SUPABASE_SERVICE_ROLE_KEY'],
  Cloudinary: ['CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'],
  Upstash: ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'],
};

const missing: string[] = [];
const warnings: string[] = [];

for (const [service, vars] of Object.entries(required)) {
  for (const v of vars) {
    if (!process.env[v]) {
      missing.push(`${service}: ${v}`);
    }
  }
}

for (const [service, vars] of Object.entries(optional)) {
  for (const v of vars) {
    if (!process.env[v]) {
      warnings.push(`${service}: ${v} (optional)`);
    }
  }
}

if (warnings.length > 0) {
  console.warn('Optional environment variables not set:');
  warnings.forEach((w) => console.warn(`  - ${w}`));
  console.warn('');
}

if (missing.length > 0) {
  console.error('Missing required environment variables:');
  missing.forEach((m) => console.error(`  - ${m}`));
  process.exit(1);
} else {
  console.log('All required environment variables are set.');
}

export {};
