import type { InventoryItem } from "@/lib/types";
import { getInventory } from "@/lib/smartsheet";
import { loadAccountRecords } from "@/lib/user-data";
import {
  findDuplicateInventoryIds,
  integritySummary,
  reconcileInventory,
} from "@/lib/inventory-integrity";
import { IntegrityManager } from "@/components/integrity-manager";
import "./integrity.css";

export const dynamic = "force-dynamic";

export default async function InventoryIntegrityPage() {
  const [masterResult, accountResult] = await Promise.allSettled([
    getInventory(),
    loadAccountRecords<InventoryItem>("inventory"),
  ]);
  const masterAvailable = masterResult.status === "fulfilled";
  const accountAvailable = accountResult.status === "fulfilled";
  const master = masterAvailable ? masterResult.value : [];
  const account = accountAvailable ? accountResult.value : undefined;
  const signedIn = account !== undefined;
  const comparisonReady = masterAvailable && accountAvailable && signedIn;
  const comparison = comparisonReady ? reconcileInventory(master, account) : [];
  const summary = integritySummary(comparison);
  const duplicates = [
    ...(masterAvailable
      ? findDuplicateInventoryIds(master).map((item) => ({
          ...item,
          source: "Smartsheet",
        }))
      : []),
    ...(signedIn
      ? findDuplicateInventoryIds(account).map((item) => ({
          ...item,
          source: "Account",
        }))
      : []),
  ];

  return (
    <main className="shell wideShell integrityShell">
      <section className="integrityHero">
        <div>
          <div className="eyebrow">Inventory protection</div>
          <h1>Inventory Integrity Center.</h1>
          <p className="lede">
            Your private Cedriva account is authoritative. Compare it with the
            legacy Smartsheet recovery source without overwriting newer values,
            storage, or corrections.
          </p>
        </div>
        <div
          className={`integrityScore ${
            comparisonReady && summary.score === 100 ? "good" : "attention"
          }`}
        >
          <strong>{comparisonReady ? `${summary.score}%` : "—"}</strong>
          <span>{comparisonReady ? "complete record matches" : "comparison paused"}</span>
          <small>{new Date().toLocaleString()}</small>
        </div>
      </section>

      {!accountAvailable && (
        <div className="integrityNotice">
          Cedriva could not safely load the private account inventory. No
          missing-record conclusion has been made. Try this audit again after
          the account service recovers.
        </div>
      )}
      {accountAvailable && !signedIn && (
        <div className="integrityNotice">
          Sign in to compare your private account with the legacy Smartsheet
          recovery source. Cedriva will not interpret a signed-out account as
          an empty collection.
        </div>
      )}
      {!masterAvailable && (
        <div className="integrityNotice">
          The legacy Smartsheet recovery source is temporarily unavailable.
          Your private Cedriva inventory remains authoritative and no records
          have been classified as missing.
        </div>
      )}

      <section className="integrityMetrics">
        <article>
          <span>Smartsheet migration source</span>
          <strong>{masterAvailable ? master.length : "—"}</strong>
          <small>
            {masterAvailable
              ? "founder records available for controlled recovery"
              : "source temporarily unavailable"}
          </small>
        </article>
        <article>
          <span>Private account</span>
          <strong>{signedIn ? account.length : "—"}</strong>
          <small>
            {signedIn
              ? "authoritative account inventory lots"
              : accountAvailable
                ? "sign in to inspect"
                : "account service temporarily unavailable"}
          </small>
        </article>
        <article>
          <span>Complete-record differences</span>
          <strong>{comparisonReady ? summary.mismatched : "—"}</strong>
          <small>
            Collection, quantity, value, evidence, and provenance fields
          </small>
        </article>
        <article
          className={
            comparisonReady && (summary.masterOnly || summary.accountOnly)
              ? "attention"
              : ""
          }
        >
          <span>Missing records</span>
          <strong>
            {comparisonReady ? summary.masterOnly + summary.accountOnly : "—"}
          </strong>
          <small>
            {comparisonReady
              ? `${summary.masterOnly} absent from account · ${summary.accountOnly} account-only`
              : "calculated only when both sources load safely"}
          </small>
        </article>
      </section>

      {comparisonReady ? (
        <IntegrityManager
          items={comparison}
          signedIn={signedIn}
          duplicateCount={duplicates.length}
        />
      ) : (
        <section className="card integrityPaused">
          <div className="eyebrow">Trust safeguard</div>
          <h2>No comparison was inferred from incomplete data.</h2>
          <p>
            Cedriva will resume the record-by-record audit only after both
            sources are available and the collector is signed in.
          </p>
          <div className="backupActions">
            {masterAvailable && (
              <a
                className="button secondary"
                href="/api/inventory-integrity/backup?scope=master"
              >
                Download master backup
              </a>
            )}
            {signedIn && (
              <a
                className="button secondary"
                href="/api/inventory-integrity/backup?scope=account"
              >
                Download account backup
              </a>
            )}
          </div>
        </section>
      )}

      {duplicates.length > 0 && (
        <section className="card duplicatePanel">
          <div className="eyebrow">Duplicate IDs</div>
          <h2>Manual review required</h2>
          {duplicates.map((item) => (
            <p key={`${item.source}-${item.inventoryId}`}>
              {item.source}: <strong>{item.inventoryId}</strong> appears{" "}
              {item.count} times.
            </p>
          ))}
        </section>
      )}
    </main>
  );
}
