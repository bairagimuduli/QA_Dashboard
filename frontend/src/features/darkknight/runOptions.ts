/**
 * Matches DarkKnight Gatling framework: ConfigManager (-Dinjection_profile, -Dusers),
 * InjectionProfiles.java profile keys, optional -Dduration_seconds (see DarkKnight YEAR_PLAN.md).
 */

export const INJECTION_PROFILE_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Default (from config.properties)" },
  { value: "default", label: "default — API-level load config" },
  { value: "single", label: "single" },
  { value: "multi", label: "multi — uses Users count below (atOnceUsers)" },
  { value: "smoke", label: "smoke — light ramp / constant" },
  { value: "load", label: "load — moderate ramp / constant / ramp down" },
  { value: "stress", label: "stress — heavy multi-phase" },
  { value: "spike", label: "spike — spike pattern" },
  { value: "endurance", label: "endurance — long constant phase" },
  { value: "volume", label: "volume — high volume phases" },
  { value: "custom", label: "custom — short ramp/constant" },
  { value: "custom5min", label: "custom5min — 5 min shaped load" },
];

/** -Dusers / -Dduration_seconds: set via text fields in UI; empty = omit */

export function buildRunGradleArgs(params: {
  injectionProfile: string;
  users: string;
  durationSeconds: string;
  extraGradleArgs: string;
}): string[] {
  const args: string[] = [];
  const inj = params.injectionProfile.trim();
  if (inj) args.push(`-Dinjection_profile=${inj}`);
  const u = params.users.trim();
  if (u) args.push(`-Dusers=${u}`);
  const d = params.durationSeconds.trim();
  if (d) args.push(`-Dduration_seconds=${d}`);
  const extra = params.extraGradleArgs
    .split(/\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  args.push(...extra);
  return args;
}
