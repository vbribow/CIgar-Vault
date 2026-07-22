export const RECOVERY_COOLDOWN_SECONDS = 65 * 60;
export const RECOVERY_COOLDOWN_KEY = "cigar-vault:recovery-cooldown-until";

export function recoveryCooldownUntil(now = Date.now()) {
  return now + RECOVERY_COOLDOWN_SECONDS * 1000;
}

export function recoverySecondsRemaining(until: number, now = Date.now()) {
  return Math.max(0, Math.ceil((until - now) / 1000));
}

export function formatRecoveryCountdown(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}
