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
  status?: string;
  priority?: string;
  score?: number;
  action?: string;
};
