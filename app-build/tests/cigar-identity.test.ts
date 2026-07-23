import assert from "node:assert/strict";
import test from "node:test";
import { canonicalCigarIdentity, cigarIdentityKey, cigarProductKey, sameCigarIdentity } from "../lib/cigar-identity";

test("canonical identity normalizes accents, punctuation, spacing, and known brand aliases", () => {
  const first = cigarIdentityKey({ brand: "Padrón", line: " 1964 Anniversary ", vitola: "Exclusivo", vintage: 2024 });
  const second = cigarIdentityKey({ brand: "Padron", line: "1964  Anniversary", vitola: "Exclusivo", vintage: "2024" });
  assert.equal(first, second);
});

test("product identity connects catalog records while release identity preserves vintage", () => {
  const current = { brand: "Cohiba", line: "Siglo IV", vitola: "Marevas" };
  const release2024 = { ...current, vintage: 2024 };
  const release2025 = { ...current, vintage: 2025 };
  assert.equal(cigarProductKey(release2024), cigarProductKey(release2025));
  assert.notEqual(cigarIdentityKey(release2024), cigarIdentityKey(release2025));
});

test("canonical identity produces a stable Cedriva id and rejects incomplete identities", () => {
  const complete = canonicalCigarIdentity({ brand: "Partagás", line: "Serie D No. 4", vitola: "Robusto" });
  assert.match(complete.identityId, /^CIG-[A-F0-9]{8}$/);
  assert.equal(complete.complete, true);
  assert.equal(canonicalCigarIdentity({ brand: "Cohiba", line: "Unknown", vitola: "Robusto" }).complete, false);
  assert.equal(sameCigarIdentity(complete, { brand: "Partagas", line: "Serie D No. 4", vitola: "Robusto" }), true);
});
