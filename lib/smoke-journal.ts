export function smokeEntryOrder<T extends { smokeId: string; dateSmoked: string }>(records: T[], smokeId: string) {
  const ordered = [...records].sort((a, b) => a.dateSmoked.localeCompare(b.dateSmoked) || a.smokeId.localeCompare(b.smokeId));
  const index = ordered.findIndex(record => record.smokeId === smokeId);
  return index < 0 ? undefined : index + 1;
}
