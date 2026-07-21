import { requireEnv } from "./config";
import { normalizeInventory } from "./inventory-model";
import type { InventoryItem, SmokingLog, Valuation } from "./types";

const BASE = "https://api.smartsheet.com/2.0";
const TIMEOUT_MS = 8_000;

type SmartsheetColumn = { id: number; title: string };
type SmartsheetCell = { columnId: number; value?: unknown; displayValue?: string };
type SmartsheetRow = { id: number; cells: SmartsheetCell[] };
type SmartsheetSheet = { id?: number; name?: string; columns: SmartsheetColumn[]; rows: SmartsheetRow[] };

function headers() {
  return {
    Authorization: `Bearer ${requireEnv("SMARTSHEET_ACCESS_TOKEN")}`,
    "Content-Type": "application/json",
    "smartsheet-integration-source": process.env.SMARTSHEET_INTEGRATION_SOURCE || "APPLICATION,CigarVault,CigarVault-MVP",
  };
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { ...headers(), ...init.headers },
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Smartsheet request failed (${response.status})`);
  return response.json() as Promise<T>;
}

const fieldColumns: Array<[keyof InventoryItem, string]> = [
  ["inventoryId", "Inventory ID"], ["catalogId", "Catalog ID"], ["collectionId", "Collection ID"],
  ["brand", "Brand"], ["line", "Line / Series"], ["vitola", "Cigar / Vitola"],
  ["vintage", "Production / Vintage Year"], ["packaging", "Packaging"], ["boxCode", "Box Code"],
  ["habanosSealPhotoLink", "Habanos Seal Photo Link"], ["habanosVerified", "Habanos Verified"],
  ["fullBoxQty", "Full Boxes"], ["sticksPerBox", "Cigars Per Box"], ["looseStickQty", "Loose Sticks"],
  ["knownBoxSizes", "Known Box Sizes"], ["boxFormatSourceUrl", "Box Format Source"], ["originalQty", "Original Qty"],
  ["smokedQty", "Qty Smoked"], ["currentQty", "Current Qty"], ["retailValue", "Retail Replacement Value"],
  ["actualCost", "Actual Cost"], ["storageLocationId", "Storage Location ID"], ["status", "Status"],
  ["priority", "Priority"], ["score", "Brian Score"], ["action", "Recommended Action"],
  ["photoLink", "Photo Link"], ["provenanceNotes", "Provenance Notes"], ["notes", "General Notes"],
];
const numericFields = new Set<keyof InventoryItem>(["originalQty", "smokedQty", "currentQty", "fullBoxQty", "sticksPerBox", "looseStickQty", "retailValue", "actualCost", "score"]);
const booleanFields = new Set<keyof InventoryItem>(["habanosVerified"]);

function sheetId() { return requireEnv("SMARTSHEET_INVENTORY_SHEET_ID"); }

function rowToInventory(row: SmartsheetRow, columns: SmartsheetColumn[]): InventoryItem {
  const titles = new Map(columns.map((column) => [column.id, column.title]));
  const values = new Map(row.cells.map((cell) => [titles.get(cell.columnId), cell.value ?? cell.displayValue]));
  const result: Record<string, unknown> = {};
  for (const [field, title] of fieldColumns) {
    const value = values.get(title);
    if (value === undefined || value === "") continue;
    result[field] = numericFields.has(field) ? Number(value) : booleanFields.has(field) ? value === true || value === "true" : value;
  }
  result.inventoryId ||= String(row.id);
  result.brand ||= "Unknown";
  result.line ||= "";
  result.vitola ||= "";
  return normalizeInventory(result as InventoryItem);
}

function cellsFor(item: InventoryItem, columns: SmartsheetColumn[]) {
  const ids = new Map(columns.map((column) => [column.title, column.id]));
  return fieldColumns.flatMap(([field, title]) => {
    const columnId = ids.get(title);
    const value = item[field];
    return columnId && value !== undefined ? [{ columnId, value }] : [];
  });
}

async function getSheet(): Promise<SmartsheetSheet> {
  return request<SmartsheetSheet>(`/sheets/${sheetId()}`);
}

export async function checkSmartsheet() {
  const sheet = await request<SmartsheetSheet>(`/sheets/${sheetId()}?pageSize=1`);
  const required = ["Inventory ID", "Brand", "Cigar / Vitola"];
  const titles = new Set(sheet.columns.map((column) => column.title));
  const missingColumns = required.filter((title) => !titles.has(title));
  return { ok: missingColumns.length === 0, sheetId: sheet.id ?? Number(sheetId()), sheetName: sheet.name, missingColumns };
}

export async function getInventory(): Promise<InventoryItem[]> {
  const sheet = await getSheet();
  return sheet.rows.map((row) => rowToInventory(row, sheet.columns));
}

export async function addInventoryRow(input: InventoryItem): Promise<void> {
  const item = normalizeInventory(input);
  const sheet = await getSheet();
  if (sheet.rows.some((row) => rowToInventory(row, sheet.columns).inventoryId === item.inventoryId)) {
    throw new Error(`Inventory ID ${item.inventoryId} already exists`);
  }
  await request(`/sheets/${sheetId()}/rows`, { method: "POST", body: JSON.stringify([{ toBottom: true, cells: cellsFor(item, sheet.columns) }]) });
}

export async function addInventoryRows(inputs: InventoryItem[]): Promise<number> {
  if (!inputs.length) return 0;
  const sheet = await getSheet();
  const existing = new Set(sheet.rows.map((row) => rowToInventory(row, sheet.columns).inventoryId));
  const pending = inputs.map(normalizeInventory).filter((item) => !existing.has(item.inventoryId));
  if (!pending.length) return 0;
  await request(`/sheets/${sheetId()}/rows`, { method: "POST", body: JSON.stringify(pending.map((item) => ({ toBottom: true, cells: cellsFor(item, sheet.columns) }))) });
  return pending.length;
}

export async function updateInventoryRow(inventoryId: string, input: InventoryItem): Promise<void> {
  const sheet = await getSheet();
  const row = sheet.rows.find((candidate) => rowToInventory(candidate, sheet.columns).inventoryId === inventoryId);
  if (!row) throw new Error(`Inventory ID ${inventoryId} was not found`);
  await request(`/sheets/${sheetId()}/rows`, { method: "PUT", body: JSON.stringify([{ id: row.id, cells: cellsFor(normalizeInventory(input), sheet.columns) }]) });
}

export async function deleteInventoryRow(inventoryId: string): Promise<void> {
  const sheet = await getSheet();
  const row = sheet.rows.find((candidate) => rowToInventory(candidate, sheet.columns).inventoryId === inventoryId);
  if (!row) throw new Error(`Inventory ID ${inventoryId} was not found`);
  await request(`/sheets/${sheetId()}/rows?ids=${row.id}`, { method: "DELETE" });
}

type RecordValue = string | number | boolean | undefined;
async function recordSheet(envName: string) { return request<SmartsheetSheet>(`/sheets/${requireEnv(envName)}`); }
function recordValues(row: SmartsheetRow, columns: SmartsheetColumn[]) {
  const titles = new Map(columns.map((column) => [column.id, column.title]));
  return new Map(row.cells.map((cell) => [titles.get(cell.columnId), cell.value ?? cell.displayValue]));
}
function recordCells(values: Array<[string, RecordValue]>, columns: SmartsheetColumn[]) {
  const ids = new Map(columns.map((column) => [column.title, column.id]));
  return values.flatMap(([title, value]) => value === undefined || !ids.has(title) ? [] : [{ columnId: ids.get(title), value }]);
}

export async function getSmokingLogs(): Promise<SmokingLog[]> {
  const sheet = await recordSheet("SMARTSHEET_SMOKING_LOG_SHEET_ID");
  return sheet.rows.map((row) => { const v = recordValues(row, sheet.columns); return { smokeId: String(v.get("Smoke ID") || row.id), inventoryId: String(v.get("Inventory ID") || ""), dateSmoked: String(v.get("Date Smoked") || ""), vintage: v.get("Production / Vintage Year") as string | number | undefined, overall: v.get("Overall 1–100") === undefined ? undefined : Number(v.get("Overall 1–100")), flavor: v.get("Flavor") as string | undefined, strength: v.get("Strength") as string | undefined, sweetness: v.get("Sweetness") as string | undefined, construction: v.get("Construction") as string | undefined, tastingNotes: v.get("Tasting Notes") as string | undefined, buyAgain: Boolean(v.get("Buy Again")) }; });
}
export async function addSmokingLog(log: SmokingLog): Promise<void> {
  const sheet = await recordSheet("SMARTSHEET_SMOKING_LOG_SHEET_ID");
  if (sheet.rows.some((row) => String(recordValues(row, sheet.columns).get("Smoke ID")) === log.smokeId)) throw new Error(`Smoke ID ${log.smokeId} already exists`);
  const cells = recordCells([["Smoke ID",log.smokeId],["Inventory ID",log.inventoryId],["Date Smoked",log.dateSmoked],["Production / Vintage Year",log.vintage],["Overall 1–100",log.overall],["Flavor",log.flavor],["Strength",log.strength],["Sweetness",log.sweetness],["Construction",log.construction],["Tasting Notes",log.tastingNotes],["Buy Again",log.buyAgain]], sheet.columns);
  await request(`/sheets/${requireEnv("SMARTSHEET_SMOKING_LOG_SHEET_ID")}/rows`, { method:"POST", body:JSON.stringify([{toBottom:true,cells}]) });
}

export async function recordSmokingLog(log: SmokingLog): Promise<void> {
  const [inventorySheet, smokingSheet] = await Promise.all([getSheet(), recordSheet("SMARTSHEET_SMOKING_LOG_SHEET_ID")]);
  if (smokingSheet.rows.some((row) => String(recordValues(row, smokingSheet.columns).get("Smoke ID")) === log.smokeId)) throw new Error(`Smoke ID ${log.smokeId} already exists`);
  const inventoryRow = inventorySheet.rows.find((row) => rowToInventory(row, inventorySheet.columns).inventoryId === log.inventoryId);
  if (!inventoryRow) throw new Error(`Inventory ID ${log.inventoryId} was not found`);
  const before = rowToInventory(inventoryRow, inventorySheet.columns);
  if (before.currentQty !== undefined && before.currentQty <= 0) throw new Error(`${log.inventoryId} has no remaining inventory`);
  const after = normalizeInventory({ ...before, smokedQty: (before.smokedQty ?? 0) + 1 });
  await request(`/sheets/${sheetId()}/rows`, { method: "PUT", body: JSON.stringify([{ id: inventoryRow.id, cells: cellsFor(after, inventorySheet.columns) }]) });
  try {
    const cells = recordCells([["Smoke ID",log.smokeId],["Inventory ID",log.inventoryId],["Date Smoked",log.dateSmoked],["Production / Vintage Year",log.vintage],["Overall 1–100",log.overall],["Flavor",log.flavor],["Strength",log.strength],["Sweetness",log.sweetness],["Construction",log.construction],["Tasting Notes",log.tastingNotes],["Buy Again",log.buyAgain]], smokingSheet.columns);
    await request(`/sheets/${requireEnv("SMARTSHEET_SMOKING_LOG_SHEET_ID")}/rows`, { method:"POST", body:JSON.stringify([{toBottom:true,cells}]) });
  } catch (error) {
    await request(`/sheets/${sheetId()}/rows`, { method: "PUT", body: JSON.stringify([{ id: inventoryRow.id, cells: cellsFor(before, inventorySheet.columns) }]) }).catch(() => undefined);
    throw error;
  }
}
export async function getValuations(): Promise<Valuation[]> {
  const sheet = await recordSheet("SMARTSHEET_VALUATIONS_SHEET_ID");
  return sheet.rows.map((row) => { const v=recordValues(row,sheet.columns); return { valuationId:String(v.get("Valuation ID")||row.id), inventoryId:String(v.get("Inventory ID")||""), valuationDate:String(v.get("Valuation Date")||""), replacementValue:v.get("Retail Replacement Value")===undefined?undefined:Number(v.get("Retail Replacement Value")), marketValue:v.get("Market Value")===undefined?undefined:Number(v.get("Market Value")), source:v.get("Source") as string|undefined, sourceUrl:v.get("Source URL") as string|undefined, confidence:v.get("Confidence") as string|undefined, notes:v.get("Notes") as string|undefined }; });
}
export async function addValuation(value: Valuation): Promise<void> {
  const sheet=await recordSheet("SMARTSHEET_VALUATIONS_SHEET_ID");
  if(sheet.rows.some((row)=>String(recordValues(row,sheet.columns).get("Valuation ID"))===value.valuationId)) throw new Error(`Valuation ID ${value.valuationId} already exists`);
  const cells=recordCells([["Valuation ID",value.valuationId],["Inventory ID",value.inventoryId],["Valuation Date",value.valuationDate],["Retail Replacement Value",value.replacementValue],["Market Value",value.marketValue],["Source",value.source],["Source URL",value.sourceUrl],["Confidence",value.confidence],["Notes",value.notes]],sheet.columns);
  await request(`/sheets/${requireEnv("SMARTSHEET_VALUATIONS_SHEET_ID")}/rows`,{method:"POST",body:JSON.stringify([{toBottom:true,cells}])});
}

export async function recordValuation(value: Valuation): Promise<void> {
  const [inventorySheet, valuationSheet] = await Promise.all([getSheet(), recordSheet("SMARTSHEET_VALUATIONS_SHEET_ID")]);
  if (valuationSheet.rows.some((row) => String(recordValues(row, valuationSheet.columns).get("Valuation ID")) === value.valuationId)) throw new Error(`Valuation ID ${value.valuationId} already exists`);
  const inventoryRow = inventorySheet.rows.find((row) => rowToInventory(row, inventorySheet.columns).inventoryId === value.inventoryId);
  if (!inventoryRow) throw new Error(`Inventory ID ${value.inventoryId} was not found`);
  const before = rowToInventory(inventoryRow, inventorySheet.columns);
  const after = value.replacementValue === undefined ? before : { ...before, retailValue: value.replacementValue };
  if (value.replacementValue !== undefined) await request(`/sheets/${sheetId()}/rows`, { method:"PUT", body:JSON.stringify([{id:inventoryRow.id,cells:cellsFor(after,inventorySheet.columns)}]) });
  try {
    const cells=recordCells([["Valuation ID",value.valuationId],["Inventory ID",value.inventoryId],["Valuation Date",value.valuationDate],["Retail Replacement Value",value.replacementValue],["Market Value",value.marketValue],["Source",value.source],["Source URL",value.sourceUrl],["Confidence",value.confidence],["Notes",value.notes]],valuationSheet.columns);
    await request(`/sheets/${requireEnv("SMARTSHEET_VALUATIONS_SHEET_ID")}/rows`,{method:"POST",body:JSON.stringify([{toBottom:true,cells}])});
  } catch (error) {
    if (value.replacementValue !== undefined) await request(`/sheets/${sheetId()}/rows`, { method:"PUT", body:JSON.stringify([{id:inventoryRow.id,cells:cellsFor(before,inventorySheet.columns)}]) }).catch(()=>undefined);
    throw error;
  }
}
