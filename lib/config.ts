export type DataMode = "mock" | "smartsheet";

export function dataMode(): DataMode {
  if (process.env.USE_MOCK_DATA === "true") return "mock";
  if (process.env.USE_MOCK_DATA === "false") return "smartsheet";
  return process.env.NODE_ENV === "production" ? "smartsheet" : "mock";
}

export function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

export function authorizeWrite(request: Request): boolean {
  const expected = process.env.FOUNDER_WRITE_KEY;
  if (!expected) return process.env.NODE_ENV !== "production" && dataMode() === "mock";
  return request.headers.get("x-founder-key") === expected;
}

export function authorizeSensorSync(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET?.trim();
  const authorization = request.headers.get("authorization");
  if (cronSecret && authorization === `Bearer ${cronSecret}`) return true;
  return authorizeWrite(request);
}
