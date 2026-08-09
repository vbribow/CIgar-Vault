import { createHash } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { CigarResearchSchema, cigarResearchJsonSchema, type CigarResearch } from "./cigar-research";
import { responseOutputText } from "./cigar-vision";

const DAY_MS = 86_400_000;
const DEFAULT_DAILY_LIMIT = 3;
const DEFAULT_CACHE_HOURS = 24;

export type CigarResearchServiceStatus = {
  available: boolean;
  code: "ready" | "billing_pending" | "disabled" | "misconfigured";
  message: string;
  dailyLimit: number;
  cacheHours: number;
};

export class CigarResearchServiceError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 502,
    public readonly retryable = false,
  ) {
    super(message);
    this.name = "CigarResearchServiceError";
  }
}

function boundedInteger(value: string | undefined, fallback: number, maximum: number) {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, maximum) : fallback;
}

export function cigarResearchServiceStatus(env: NodeJS.ProcessEnv = process.env): CigarResearchServiceStatus {
  const dailyLimit = boundedInteger(env.OPENAI_RESEARCH_DAILY_USER_LIMIT, DEFAULT_DAILY_LIMIT, 25);
  const cacheHours = boundedInteger(env.OPENAI_RESEARCH_CACHE_HOURS, DEFAULT_CACHE_HOURS, 168);
  if (env.OPENAI_RESEARCH_ENABLED !== "true") return {
    available: false,
    code: env.OPENAI_RESEARCH_ENABLED === "false" ? "disabled" : "billing_pending",
    message: "Live research is prepared but remains off until API billing, a hard spending limit, and founder activation are complete.",
    dailyLimit,
    cacheHours,
  };
  if (!env.OPENAI_API_KEY?.trim()) return {
    available: false,
    code: "misconfigured",
    message: "Live research is enabled but its protected server credential is missing.",
    dailyLimit,
    cacheHours,
  };
  return { available: true, code: "ready", message: "Live source research is available.", dailyLimit, cacheHours };
}

export function normalizeCigarResearchQuery(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ").trim().replace(/\bopus\s+(\d+)\b/g, "opus$1");
}

export function cigarResearchQueryHash(value: string) {
  return createHash("sha256").update(normalizeCigarResearchQuery(value)).digest("hex");
}

export function researchSafetyIdentifier(userId: string) {
  return createHash("sha256").update(`hojavia-research:${userId}`).digest("hex").slice(0, 64);
}

function adminClient(env: NodeJS.ProcessEnv = process.env): SupabaseClient | undefined {
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return undefined;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function requireAdmin() {
  const client = adminClient();
  if (!client) throw new CigarResearchServiceError("persistence_unavailable", "Research safeguards are not configured yet.", 503);
  return client;
}

function persistenceFailure(message?: string) {
  return new CigarResearchServiceError(
    "persistence_unavailable",
    /does not exist|schema cache/i.test(message || "")
      ? "The protected research ledger has not been provisioned yet."
      : "The protected research ledger is temporarily unavailable.",
    503,
    true,
  );
}

export async function readCachedCigarResearch(query: string, now = new Date()) {
  const client = requireAdmin();
  const { data, error } = await client.from("cigar_research_cache")
    .select("result,availability_expires_at")
    .eq("query_hash", cigarResearchQueryHash(query)).maybeSingle();
  if (error) throw persistenceFailure(error.message);
  if (!data || new Date(String(data.availability_expires_at)).getTime() <= now.getTime()) return undefined;
  const parsed = CigarResearchSchema.safeParse(data.result);
  return parsed.success ? parsed.data : undefined;
}

export async function writeCachedCigarResearch(query: string, result: CigarResearch, now = new Date()) {
  const client = requireAdmin();
  const status = cigarResearchServiceStatus();
  const { error } = await client.from("cigar_research_cache").upsert({
    query_hash: cigarResearchQueryHash(query),
    normalized_query: normalizeCigarResearchQuery(query),
    canonical_identity: [result.profile.brand, result.profile.line, result.profile.vitola].filter(Boolean).join(" "),
    result,
    source_urls: result.sources.map(source => source.url),
    identity_expires_at: new Date(now.getTime() + 180 * DAY_MS).toISOString(),
    availability_expires_at: new Date(now.getTime() + status.cacheHours * 3_600_000).toISOString(),
    updated_at: now.toISOString(),
  }, { onConflict: "query_hash" });
  if (error) throw persistenceFailure(error.message);
}

export async function recordCigarResearchCacheHit(userId: string, submissionId: string, query: string, now = new Date()) {
  const client = requireAdmin();
  const { error } = await client.from("cigar_research_requests").insert({
    request_id: submissionId,
    user_id: userId,
    query_hash: cigarResearchQueryHash(query),
    normalized_query: normalizeCigarResearchQuery(query),
    status: "cached",
    cache_hit: true,
    billable: false,
    completed_at: now.toISOString(),
  });
  if (error && error.code !== "23505") throw persistenceFailure(error.message);
}

export async function beginCigarResearch(userId: string, submissionId: string, query: string, model: string, now = new Date()) {
  const client = requireAdmin();
  const status = cigarResearchServiceStatus();
  const dayStart = new Date(now); dayStart.setUTCHours(0, 0, 0, 0);
  const { count, error: countError } = await client.from("cigar_research_requests")
    .select("request_id", { count: "exact", head: true })
    .eq("user_id", userId).eq("billable", true).gte("created_at", dayStart.toISOString());
  if (countError) throw persistenceFailure(countError.message);
  if ((count || 0) >= status.dailyLimit) throw new CigarResearchServiceError(
    "daily_limit",
    `You have used today’s ${status.dailyLimit} live-research request${status.dailyLimit === 1 ? "" : "s"}. Cached Hojavía records remain available.`,
    429,
  );
  const { error } = await client.from("cigar_research_requests").insert({
    request_id: submissionId,
    user_id: userId,
    query_hash: cigarResearchQueryHash(query),
    normalized_query: normalizeCigarResearchQuery(query),
    model,
    status: "running",
    cache_hit: false,
    billable: true,
  });
  if (error?.code === "23505") throw new CigarResearchServiceError("duplicate_request", "This research request is already running or complete.", 409);
  if (error) throw persistenceFailure(error.message);
}

export async function finishCigarResearch(submissionId: string, outcome: {
  status: "completed" | "failed";
  inputTokens?: number;
  outputTokens?: number;
  webSearchCalls?: number;
  errorCode?: string;
}, now = new Date()) {
  const client = requireAdmin();
  const { error } = await client.from("cigar_research_requests").update({
    status: outcome.status,
    input_tokens: outcome.inputTokens || 0,
    output_tokens: outcome.outputTokens || 0,
    web_search_calls: outcome.webSearchCalls || 0,
    error_code: outcome.errorCode || null,
    completed_at: now.toISOString(),
  }).eq("request_id", submissionId);
  if (error) throw persistenceFailure(error.message);
}

function canonicalSourceUrl(value: string) {
  try {
    const url = new URL(value);
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) if (/^(utm_|fbclid|gclid|ref$)/i.test(key)) url.searchParams.delete(key);
    return `${url.protocol}//${url.hostname.toLowerCase()}${url.pathname.replace(/\/$/, "")}${url.search}`;
  } catch { return ""; }
}

export function webSearchEvidenceUrls(payload: unknown) {
  const urls = new Set<string>();
  if (!payload || typeof payload !== "object") return urls;
  const output = (payload as { output?: unknown[] }).output;
  if (!Array.isArray(output)) return urls;
  for (const item of output) {
    if (!item || typeof item !== "object" || (item as { type?: string }).type !== "web_search_call") continue;
    const sources = (item as { action?: { sources?: unknown[] } }).action?.sources;
    if (!Array.isArray(sources)) continue;
    for (const source of sources) {
      const url = source && typeof source === "object" ? (source as { url?: unknown }).url : undefined;
      if (typeof url === "string") urls.add(canonicalSourceUrl(url));
    }
  }
  return urls;
}

export function retainVisitedResearchEvidence(result: CigarResearch, payload: unknown): CigarResearch {
  const visited = webSearchEvidenceUrls(payload);
  if (!visited.size) throw new CigarResearchServiceError("evidence_missing", "Research completed without a verifiable source trail. No result was saved.", 422);
  const sources = result.sources.filter(source => visited.has(canonicalSourceUrl(source.url)));
  if (!sources.length) throw new CigarResearchServiceError("evidence_missing", "No cited source could be tied to the completed web research. No result was saved.", 422);
  const listings = result.availability.listings.filter(listing => visited.has(canonicalSourceUrl(listing.url)));
  return { ...result, sources, availability: { ...result.availability, listings } };
}

function providerError(status: number, message: string) {
  if (status === 429) return new CigarResearchServiceError("provider_rate_limit", "Live research is busy or has reached its protected usage limit. Try again later.", 503, true);
  if (status === 401 || status === 403) return new CigarResearchServiceError("provider_auth", "The research service credential needs administrator attention.", 503);
  if (/billing|quota|credit/i.test(message)) return new CigarResearchServiceError("provider_billing", "Live research has reached its approved spending boundary.", 503);
  return new CigarResearchServiceError("provider_error", "Live research could not complete. No result was saved.", 502, status >= 500);
}

export async function requestCigarResearch(input: {
  query: string;
  userId: string;
  prompt: string;
  model: string;
  fetcher?: typeof fetch;
}) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new CigarResearchServiceError("provider_auth", "The research service credential is missing.", 503);
  const fetcher = input.fetcher || fetch;
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetcher("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: input.model,
          reasoning: { effort: "medium" },
          store: false,
          max_output_tokens: 7000,
          max_tool_calls: 8,
          safety_identifier: researchSafetyIdentifier(input.userId),
          tools: [{ type: "web_search", search_context_size: "medium" }],
          tool_choice: "required",
          include: ["web_search_call.action.sources"],
          input: input.prompt,
          text: { format: { type: "json_schema", name: "cigar_research", strict: true, schema: cigarResearchJsonSchema } },
        }),
        signal: AbortSignal.timeout(110_000),
      });
      const payload = await response.json();
      if (!response.ok) {
        const message = (payload as { error?: { message?: string } }).error?.message || `HTTP ${response.status}`;
        const error = providerError(response.status, message);
        if (error.retryable && attempt === 0) { lastError = error; continue; }
        throw error;
      }
      const output = responseOutputText(payload);
      if (!output) throw new CigarResearchServiceError("empty_result", "Research returned no usable record. No result was saved.", 422);
      const result = retainVisitedResearchEvidence(CigarResearchSchema.parse(JSON.parse(output)), payload);
      const usage = (payload as { usage?: { input_tokens?: number; output_tokens?: number } }).usage || {};
      return {
        result,
        usage: {
          inputTokens: usage.input_tokens || 0,
          outputTokens: usage.output_tokens || 0,
          webSearchCalls: Array.isArray((payload as { output?: unknown[] }).output)
            ? (payload as { output: Array<{ type?: string }> }).output.filter(item => item.type === "web_search_call").length
            : 0,
        },
      };
    } catch (error) {
      if (error instanceof CigarResearchServiceError) throw error;
      if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
        throw new CigarResearchServiceError("timeout", "Live research took too long. Nothing was saved; you can retry safely.", 504, true);
      }
      lastError = error;
      if (attempt === 0) continue;
    }
  }
  throw lastError instanceof CigarResearchServiceError
    ? lastError
    : new CigarResearchServiceError("network_error", "The research provider could not be reached. Nothing was saved.", 502, true);
}
