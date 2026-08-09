import assert from "node:assert/strict";
import test from "node:test";
import type { CigarResearch } from "../lib/cigar-research";
import {
  cigarResearchQueryHash,
  cigarResearchServiceStatus,
  normalizeCigarResearchQuery,
  retainVisitedResearchEvidence,
  webSearchEvidenceUrls,
} from "../lib/cigar-research-service";

test("live research fails closed until billing activation is explicit", () => {
  const pending = cigarResearchServiceStatus({} as NodeJS.ProcessEnv);
  assert.equal(pending.available, false);
  assert.equal(pending.code, "billing_pending");
  const missingKey = cigarResearchServiceStatus({ OPENAI_RESEARCH_ENABLED: "true" } as unknown as NodeJS.ProcessEnv);
  assert.equal(missingKey.available, false);
  assert.equal(missingKey.code, "misconfigured");
  const ready = cigarResearchServiceStatus({ OPENAI_RESEARCH_ENABLED: "true", OPENAI_API_KEY: "secret" } as unknown as NodeJS.ProcessEnv);
  assert.equal(ready.available, true);
  assert.equal(ready.dailyLimit, 3);
});

test("Opus6 spacing variants share one cache identity", () => {
  assert.equal(normalizeCigarResearchQuery("Fuente Opus 6 Red Box"), "fuente opus6 red box");
  assert.equal(
    cigarResearchQueryHash("Fuente Opus 6 Red Box"),
    cigarResearchQueryHash("FUENTE OPUS6 RED BOX"),
  );
});

test("only URLs visited by the web-search tool survive provenance validation", () => {
  const visited = "https://maker.example/opus6-red";
  const listing = "https://retailer.example/opus6-red?utm_source=test";
  const result = {
    profile: {
      brand: "Arturo Fuente", line: "Fuente Fuente OpusX", vitola: "Opus6 Red assortment",
      dimensions: "", country: "Dominican Republic", factory: "", blender: "", wrapper: "",
      binder: "", filler: "", strength: "", packaging: "Six-cigar travel humidor", releaseYear: "2024",
      edition: "Red", summary: "A six-cigar presentation.",
    },
    confidence: "High",
    uncertainties: [],
    sources: [
      { name: "Maker", url: visited, supports: "Product identity" },
      { name: "Invented", url: "https://unvisited.example/item", supports: "Nothing" },
    ],
    availability: {
      checkedAt: "2026-08-09", summary: "One observation", legalCaution: "Verify independently.",
      listings: [
        { seller: "Retailer", sellerType: "Authorized retailer", title: "Exact set", url: listing,
          availability: "In stock", askingPrice: 600, quantity: 6, unitPrice: 100,
          listingDate: "2026-08-09", condition: "New", notes: "Exact identity" },
        { seller: "Unknown", sellerType: "Other", title: "Unsupported", url: "https://unvisited.example/listing",
          availability: "Unknown", askingPrice: undefined, quantity: undefined, unitPrice: undefined,
          listingDate: undefined, condition: undefined, notes: "Unsupported" },
      ],
    },
  } as CigarResearch;
  const payload = { output: [{ type: "web_search_call", action: { sources: [{ url: visited }, { url: "https://retailer.example/opus6-red" }] } }] };
  assert.equal(webSearchEvidenceUrls(payload).size, 2);
  const safe = retainVisitedResearchEvidence(result, payload);
  assert.deepEqual(safe.sources.map(source => source.name), ["Maker"]);
  assert.deepEqual(safe.availability.listings.map(value => value.seller), ["Retailer"]);
});
