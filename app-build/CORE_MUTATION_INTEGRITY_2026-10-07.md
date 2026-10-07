# Core Mutation Integrity — October 7, 2026

Synthetic review covered inventory, collection membership, valuations, smoke logging, photos, and storage. Existing revision checks protect inventory edits/deletes, collection/member edits, valuation invalidation, smoke edits, and photo updates. Collection presentation assets are excluded from component membership and component valuation totals.

One systemic gap was confirmed and corrected: creating a Vault-backed smoke previously deducted from the inventory snapshot without requiring the revision the user selected. A concurrent device edit could therefore be overwritten. Vault-backed smoke requests now carry the selected lot revision; the server compares it before deduction, performs a conditional write, and removes the just-created smoke record if the inventory deduction conflicts. Manual/outside-Vault smokes remain independent of inventory.

Remaining human acceptance: use two devices on one disposable lot, save a smoke after changing the lot on the other device, verify the stale save is rejected, refresh, save once, and confirm one smoke plus one exact quantity deduction.
