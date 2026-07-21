export type InventoryItem = {
  inventoryId: string;
  catalogId?: string;
  brand: string;
  line: string;
  vitola: string;
  vintage?: string | number;
  originalQty?: number;
  smokedQty?: number;
  currentQty?: number;
  retailValue?: number;
  actualCost?: number;
  collectionId?: string;
  packaging?: string;
  storageLocationId?: string;
  status?: string;
  priority?: string;
  score?: number;
  action?: string;
  photoLink?: string;
  provenanceNotes?: string;
  notes?: string;
};

export type InventoryInput = Omit<InventoryItem, "currentQty"> & { currentQty?: number };

export type SmokingLog = { smokeId: string; inventoryId: string; dateSmoked: string; vintage?: string | number; overall?: number; flavor?: string; strength?: string; sweetness?: string; construction?: string; tastingNotes?: string; buyAgain?: boolean };
export type Valuation = { valuationId: string; inventoryId: string; valuationDate: string; replacementValue?: number; marketValue?: number; source?: string; sourceUrl?: string; confidence?: string; notes?: string };
