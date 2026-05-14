/**
 * @my-studio/config — Feature flags for MY STUDIO modules
 *
 * AVATAR defaults to enabled; every other module defaults to disabled.
 * Toggle via environment variables: FEATURE_AVATAR, FEATURE_MOVIE, etc.
 * Named exports only.
 */

export const FEATURES = {
  AVATAR: process.env.FEATURE_AVATAR !== 'false',
  MOVIE: process.env.FEATURE_MOVIE !== 'false',
  DOCUMENTARY: process.env.FEATURE_DOCUMENTARY !== 'false',
  EDITOR: process.env.FEATURE_EDITOR !== 'false',
  REMIX: process.env.FEATURE_REMIX !== 'false',
  RIVALS: process.env.FEATURE_RIVALS !== 'false',
  NEWS: process.env.FEATURE_NEWS !== 'false',
  WORKFLOW: process.env.FEATURE_WORKFLOW !== 'false',
  AUDIO: process.env.FEATURE_AUDIO !== 'false',
  THUMBNAILS: process.env.FEATURE_THUMBNAILS !== 'false',
  CLIPPER: process.env.FEATURE_CLIPPER !== 'false',
  REMIXER: process.env.FEATURE_REMIXER !== 'false',
  VIRAL_DB: process.env.FEATURE_VIRAL_DB !== 'false',
  SPY: process.env.FEATURE_SPY !== 'false',
  DUBBING: process.env.FEATURE_DUBBING !== 'false',
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
