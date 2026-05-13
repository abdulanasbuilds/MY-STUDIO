/**
 * @my-studio/config — Feature flags for MY STUDIO modules
 *
 * AVATAR defaults to enabled; every other module defaults to disabled.
 * Toggle via environment variables: FEATURE_AVATAR, FEATURE_MOVIE, etc.
 * Named exports only.
 */

export const FEATURES = {
  AVATAR: process.env.FEATURE_AVATAR !== 'false',
  MOVIE: process.env.FEATURE_MOVIE === 'true',
  DOCUMENTARY: process.env.FEATURE_DOCUMENTARY === 'true',
  EDITOR: process.env.FEATURE_EDITOR === 'true',
  REMIX: process.env.FEATURE_REMIX === 'true',
  RIVALS: process.env.FEATURE_RIVALS === 'true',
  NEWS: process.env.FEATURE_NEWS === 'true',
  WORKFLOW: process.env.FEATURE_WORKFLOW === 'true',
  AUDIO: process.env.FEATURE_AUDIO === 'true',
  THUMBNAILS: process.env.FEATURE_THUMBNAILS === 'true',
  CLIPPER: process.env.FEATURE_CLIPPER === 'true',
  REMIXER: process.env.FEATURE_REMIXER === 'true',
  VIRAL_DB: process.env.FEATURE_VIRAL_DB === 'true',
  SPY: process.env.FEATURE_SPY === 'true',
  DUBBING: process.env.FEATURE_DUBBING === 'true',
  HUMAN_FEEL: process.env.FEATURE_HUMAN_FEEL !== 'false',
} as const;

/** Union of all module flag names. */
export type Module =
  | 'AVATAR'
  | 'MOVIE'
  | 'DOCUMENTARY'
  | 'EDITOR'
  | 'REMIX'
  | 'RIVALS'
  | 'NEWS'
  | 'WORKFLOW'
  | 'AUDIO'
  | 'THUMBNAILS'
  | 'CLIPPER'
  | 'REMIXER'
  | 'VIRAL_DB'
  | 'SPY'
  | 'DUBBING'
  | 'HUMAN_FEEL';

/**
 * Returns whether a given module is currently enabled.
 */
export function isEnabled(name: keyof typeof FEATURES): boolean {
  return FEATURES[name];
}
