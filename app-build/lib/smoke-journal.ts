export function smokeEntryOrder<T extends { smokeId: string; dateSmoked: string }>(records: T[], smokeId: string) {
  const ordered = [...records].sort((a, b) => a.dateSmoked.localeCompare(b.dateSmoked) || a.smokeId.localeCompare(b.smokeId));
  const index = ordered.findIndex(record => record.smokeId === smokeId);
  return index < 0 ? undefined : index + 1;
}

type ComparableSmoke = {
  smokeId?: string; inventoryId: string; cigarName?: string; dateSmoked: string;
  overall?: number; flavor?: string; strength?: string; construction?: string; burn?: string; tastingNotes?: string; buyAgain?: boolean;
};
const normalized = (value?: string) => value?.trim().replace(/\s+/g, " ").toLowerCase() || "";
export function findNearDuplicateSmoke(records: ComparableSmoke[], candidate: ComparableSmoke) {
  return records.find(record =>
    record.inventoryId === candidate.inventoryId &&
    normalized(record.cigarName) === normalized(candidate.cigarName) &&
    record.dateSmoked === candidate.dateSmoked &&
    record.overall === candidate.overall &&
    normalized(record.flavor) === normalized(candidate.flavor) &&
    normalized(record.strength) === normalized(candidate.strength) &&
    normalized(record.construction) === normalized(candidate.construction) &&
    normalized(record.burn) === normalized(candidate.burn) &&
    normalized(record.tastingNotes) === normalized(candidate.tastingNotes) &&
    Boolean(record.buyAgain) === Boolean(candidate.buyAgain),
  );
}
