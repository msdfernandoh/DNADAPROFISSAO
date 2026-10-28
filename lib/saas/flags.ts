export type FeatureEnvironment = Record<string, string | undefined>;
/** Only server code may read these switches; public/query/cookie flags have no authority. */
export function v1Flags(env: FeatureEnvironment) {
  return Object.freeze({ individualAccess: env.DNA_V1_ACCESS_ENABLED === 'true', internalPreview: env.DNA_V1_INTERNAL_PREVIEW_ENABLED === 'true' });
}
export const LIVE_V1_CAPABILITIES = Object.freeze({ leadAccess: false, completion: false, billing: false, publicReports: false, courseOffers: false });

/** Independent, fail-closed gates. Access alone never enables a completion or draft. */
export function evaluationFlags(env: FeatureEnvironment) {
  const completion = v1Flags(env).individualAccess && env.DNA_V1_COMPLETION_ENABLED === 'true';
  return Object.freeze({ completion, draftPreview: completion && v1Flags(env).internalPreview });
}
