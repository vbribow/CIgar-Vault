import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const required = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "CRON_SECRET",
  "NEXT_PUBLIC_SUPPORT_EMAIL",
];

const featureGroups = {
  sensorPush: ["SENSORPUSH_EMAIL", "SENSORPUSH_PASSWORD", "SENSORPUSH_ACCOUNT_USER_ID"],
  transactionalEmail: ["RESEND_API_KEY", "RESEND_WEBHOOK_SECRET", "HOJAVIA_EMAIL_FROM"],
  googlePlaces: ["GOOGLE_PLACES_API_KEY", "GOOGLE_PLACES_SEARCH_ENABLED"],
  stripe: ["STRIPE_SECRET_KEY", "STRIPE_FOUNDER_PRICE_ID", "STRIPE_WEBHOOK_SECRET"],
  paidResearch: ["OPENAI_API_KEY", "OPENAI_RESEARCH_ENABLED"],
};

const sourceRoot = resolve(process.argv[2] || ".");
const example = await readFile(resolve(sourceRoot, ".env.example"), "utf8");
const declared = new Set([...example.matchAll(/^([A-Z][A-Z0-9_]*)=/gm)].map(match => match[1]));
const missingDeclarations = [...new Set([...required, ...Object.values(featureGroups).flat()])]
  .filter(name => !declared.has(name));
const presence = Object.fromEntries(required.map(name => [name, Boolean(process.env[name]?.trim())]));
const featurePresence = Object.fromEntries(Object.entries(featureGroups).map(([feature, names]) => [
  feature,
  Object.fromEntries(names.map(name => [name, Boolean(process.env[name]?.trim())])),
]));
const strict = process.argv.includes("--require-present");
const missingRequired = required.filter(name => !presence[name]);

console.log(JSON.stringify({
  scope: "names and presence only",
  valuesPrinted: false,
  required,
  missingDeclarations,
  presence,
  optionalFeaturePresence: featurePresence,
  releaseDecision: missingDeclarations.length || (strict && missingRequired.length) ? "hold" : "pass",
  note: strict ? "Production presence was required." : "Presence is informational unless --require-present is supplied in the deployment environment.",
}, null, 2));

if (missingDeclarations.length || (strict && missingRequired.length)) process.exitCode = 2;
