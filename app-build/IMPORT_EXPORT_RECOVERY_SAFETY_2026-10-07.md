# Import, Export, Backup, and Restore Safety — October 7, 2026

The local audit covered CSV/XLSX preview and validation, duplicate acknowledgement, all-or-nothing inserts, edit-safe rollback, complete account export, owner comparison, recovery preview, missing-only restore, explicit replacement, and Smartsheet recovery.

Corrections in this batch:

- Account inventory is now the default backup scope. The shared master backup requires founder authorization and cannot be downloaded anonymously.
- Import rollback writes its complete planned deletion set and protected IDs before any deletion. A provider failure can therefore leave a visible `rollback-started` audit record instead of an unexplained partial outcome.
- Complete account exports with more than 10,000 records—common after sensor history accumulates—are accepted by recovery validation up to a bounded 250,000 records.

Existing protections retained: repeated inventory IDs are rejected; possible identity duplicates require explicit acknowledgement; imports insert all selected rows in one statement; rollback never deletes a record edited after import; recovery previews missing, conflicting, and identical rows; replacement requires the exact confirmation phrase; different-account exports require an explicit ownership acknowledgement; and all reads/writes are scoped to the signed-in account.

Remaining production-like acceptance: exercise a representative large export through the hosted request-size boundary. If the hosted platform rejects that payload, implement resumable chunked recovery before calling long-history restore complete. No production data was used in this audit.
