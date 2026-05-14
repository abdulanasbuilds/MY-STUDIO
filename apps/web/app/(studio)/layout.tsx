// MY STUDIO — Studio Layout (Server Component)
// PURPOSE: Reads feature flags, blocks disabled modules (404), and passes flags to client shell

import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { FEATURES } from '@my-studio/config/feature-flags';

import { StudioShell } from '@/components/studio/StudioShell';

/** Map URL path prefix to feature flag key */
const PATH_TO_FEATURE: Record<string, keyof typeof FEATURES> = {
  '/avatar': 'AVATAR',
  '/movie': 'MOVIE',
  '/documentary': 'DOCUMENTARY',
  '/editor': 'EDITOR',
  '/remix': 'REMIX',
  '/rivals': 'RIVALS',
  '/news': 'NEWS',
  '/workflow': 'WORKFLOW',
  '/audio': 'AUDIO',
  '/thumbnails': 'THUMBNAILS',
  '/clipper': 'CLIPPER',
  '/remixer': 'REMIXER',
  '/viral-db': 'VIRAL_DB',
  '/spy': 'SPY',
  '/dubbing': 'DUBBING',
  '/human-feel': 'HUMAN_FEEL',
};

function buildFeatureFlags(): Record<string, boolean> {
  return {
    avatar: FEATURES.AVATAR,
    movie: FEATURES.MOVIE,
    documentary: FEATURES.DOCUMENTARY,
    editor: FEATURES.EDITOR,
    remix: FEATURES.REMIX,
    rivals: FEATURES.RIVALS,
    news: FEATURES.NEWS,
    workflow: FEATURES.WORKFLOW,
    audio: FEATURES.AUDIO,
    thumbnails: FEATURES.THUMBNAILS,
    clipper: FEATURES.CLIPPER,
    remixer: FEATURES.REMIXER,
    'viral-db': FEATURES.VIRAL_DB,
    spy: FEATURES.SPY,
    dubbing: FEATURES.DUBBING,
    'human-feel': FEATURES.HUMAN_FEEL,
    library: true,
    settings: true,
  };
}

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') ?? headersList.get('x-invoke-path') ?? '';

  // Check if current path corresponds to a disabled feature → return 404
  const matchingPath = Object.keys(PATH_TO_FEATURE).find((p) => pathname.startsWith(p));
  if (matchingPath) {
    const flagKey = PATH_TO_FEATURE[matchingPath];
    if (!FEATURES[flagKey]) {
      notFound();
    }
  }

  const featureFlags = buildFeatureFlags();

  return <StudioShell featureFlags={featureFlags}>{children}</StudioShell>;
}

;
