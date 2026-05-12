// MY STUDIO — Studio Layout (Server Component)
// PURPOSE: Reads feature flags from @my-studio/config on the server and passes them to the client shell

import { FEATURES } from '@my-studio/config/feature-flags';

import { StudioShell } from '@/components/studio/StudioShell';

/**
 * Maps FEATURES (uppercase keys like AVATAR, VIRAL_DB) to the lowercase
 * nav-item keys used by StudioShell (avatar, viral-db).
 * Library and Settings are always enabled — they are system pages, not modules.
 */
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
    // System pages — always enabled
    library: true,
    settings: true,
  };
}

export function StudioLayout({ children }: { children: React.ReactNode }) {
  const featureFlags = buildFeatureFlags();

  return <StudioShell featureFlags={featureFlags}>{children}</StudioShell>;
}

export { StudioLayout as default };
