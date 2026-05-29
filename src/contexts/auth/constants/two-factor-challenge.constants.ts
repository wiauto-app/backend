export const TWO_FACTOR_CHALLENGE_ALLOWED_PATHS = [
  "/auth/admin/verify-2fa",
  "/auth/admin/verify-backup-code",
  "/auth/admin/two-factor/challenge",
  "/auth/admin/logout",
] as const;

export const isTwoFactorChallengeAllowedPath = (path: string): boolean => {
  const normalized_path = path.split("?")[0] ?? path;
  return TWO_FACTOR_CHALLENGE_ALLOWED_PATHS.some((allowed_path) =>
    normalized_path.endsWith(allowed_path),
  );
};
