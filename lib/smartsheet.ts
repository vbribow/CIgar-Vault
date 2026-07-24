import { requireEnv } from "./config";
import { consumeOneInventory, normalizeInventory } from "./inventory-model";
import type { ActivityInput } from "./activity-model";
import type { AlertDelivery, CatalogCigar, CigarCollection, EnvironmentalSensor, Humidor, HumidorReading, InventoryActivity, InventoryItem, SmokingLog, Valuation } from "./types";

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
  ["photoLink", "Photo Link"], ["boxPhotoLink", "Box Photo Link"], ["boxCodePhotoLink", "Box Code Photo Link"],
  ["provenanceDocumentLink", "Provenance Document Link"], ["provenanceNotes", "Provenance Notes"], ["notes", "General Notes"],
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

export async function getCatalog(): Promise<CatalogCigar[]> {
  const sheet = await recordSheet("SMARTSHEET_CATALOG_SHEET_ID");
  return sheet.rows.map((row) => {
    const values = recordValues(row, sheet.columns);
    return {
      catalogId: String(values.get("Catalog ID") || row.id),
      brand: String(values.get("Brand") || ""),
      line: String(values.get("Line / Series") || ""),
      vitola: String(values.get("Cigar / Vitola") || ""),
      country: values.get("Country") as string | undefined,
      sourceUrl: values.get("Source URL") as string | undefined,
      researchStatus: values.get("Research Status") as string | undefined,
    };
  }).filter((item) => item.brand && !["Pending review","Rejected"].includes(item.researchStatus || ""));
}

function catalogFromRow(row:SmartsheetRow,columns:SmartsheetColumn[]):CatalogCigar{const values=recordValues(row,columns);return{catalogId:String(values.get("Catalog ID")||row.id),brand:String(values.get("Brand")||""),line:String(values.get("Line / Series")||""),vitola:String(values.get("Cigar / Vitola")||""),country:values.get("Country") as string|undefined,sourceUrl:values.get("Source URL") as string|undefined,researchStatus:values.get("Research Status") as string|undefined}}
export async function getCatalogDiscoveries(){const sheet=await recordSheet("SMARTSHEET_CATALOG_SHEET_ID");return sheet.rows.map(row=>catalogFromRow(row,sheet.columns)).filter(item=>item.brand&&item.researchStatus==="Pending review")}
export async function addCatalogDiscoveries(items:CatalogCigar[]){if(!items.length)return 0;const sheet=await recordSheet("SMARTSHEET_CATALOG_SHEET_ID");const existing=new Set(sheet.rows.map(row=>catalogFromRow(row,sheet.columns).catalogId));const pending=items.filter(item=>!existing.has(item.catalogId));if(!pending.length)return 0;const rows=pending.map(item=>({toBottom:true,cells:recordCells([["Catalog ID",item.catalogId],["Brand",item.brand],["Line / Series",item.line],["Cigar / Vitola",item.vitola],["Country",item.country],["Source URL",item.sourceUrl],["Research Status","Pending review"]],sheet.columns)}));await request(`/sheets/${requireEnv("SMARTSHEET_CATALOG_SHEET_ID")}/rows`,{method:"POST",body:JSON.stringify(rows)});return pending.length}
export async function reviewCatalogDiscoveries(items:CatalogCigar[],status:"Approved"|"Rejected"){if(!items.length)return 0;const sheet=await recordSheet("SMARTSHEET_CATALOG_SHEET_ID");const byId=new Map(sheet.rows.map(row=>[catalogFromRow(row,sheet.columns).catalogId,row]));const updates=items.map(item=>{const row=byId.get(item.catalogId);if(!row)throw new Error(`Catalog discovery ${item.catalogId} was not found`);return{id:row.id,cells:recordCells([["Brand",item.brand],["Line / Series",item.line],["Cigar / Vitola",item.vitola],["Country",item.country],["Source URL",item.sourceUrl],["Research Status",status]],sheet.columns)}});await request(`/sheets/${requireEnv("SMARTSHEET_CATALOG_SHEET_ID")}/rows`,{method:"PUT",body:JSON.stringify(updates)});return updates.length}

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
  return sheet.rows.map((row) => { const v = recordValues(row, sheet.columns); return { smokeId: String(v.get("Smoke ID") || row.id), inventoryId: String(v.get("Inventory ID") || ""), cigarName:v.get("Cigar Name") as string|undefined, dateSmoked: String(v.get("Date Smoked") || ""), vintage: v.get("Production / Vintage Year") as string | number | undefined, overall: v.get("Overall 1–100") === undefined ? undefined : Number(v.get("Overall 1–100")), flavor: v.get("Flavor") as string | undefined, strength: v.get("Strength") as string | undefined, sweetness: v.get("Sweetness") as string | undefined, construction: v.get("Construction") as string | undefined, tastingNotes: v.get("Tasting Notes") as string | undefined, buyAgain: Boolean(v.get("Buy Again")) }; });
}
export async function addSmokingLog(log: SmokingLog): Promise<void> {
  const sheet = await recordSheet("SMARTSHEET_SMOKING_LOG_SHEET_ID");
  if (sheet.rows.some((row) => String(recordValues(row, sheet.columns).get("Smoke ID")) === log.smokeId)) throw new Error(`Smoke ID ${log.smokeId} already exists`);
  const cells = recordCells([["Smoke ID",log.smokeId],["Inventory ID",log.inventoryId],["Cigar Name",log.cigarName],["Date Smoked",log.dateSmoked],["Production / Vintage Year",log.vintage],["Overall 1–100",log.overall],["Flavor",log.flavor],["Strength",log.strength],["Sweetness",log.sweetness],["Construction",log.construction],["Tasting Notes",log.tastingNotes],["Buy Again",log.buyAgain]], sheet.columns);
  await request(`/sheets/${requireEnv("SMARTSHEET_SMOKING_LOG_SHEET_ID")}/rows`, { method:"POST", body:JSON.stringify([{toBottom:true,cells}]) });
}

export async function recordSmokingLog(log: SmokingLog): Promise<void> {
  const [inventorySheet, smokingSheet] = await Promise.all([getSheet(), recordSheet("SMARTSHEET_SMOKING_LOG_SHEET_ID")]);
  if (smokingSheet.rows.some((row) => String(recordValues(row, smokingSheet.columns).get("Smoke ID")) === log.smokeId)) throw new Error(`Smoke ID ${log.smokeId} already exists`);
  const inventoryRow = inventorySheet.rows.find((row) => rowToInventory(row, inventorySheet.columns).inventoryId === log.inventoryId);
  if (!inventoryRow) throw new Error(`Inventory ID ${log.inventoryId} was not found`);
  const before = rowToInventory(inventoryRow, inventorySheet.columns);
  if (before.currentQty !== undefined && before.currentQty <= 0) throw new Error(`${log.inventoryId} has no remaining inventory`);
  const after = consumeOneInventory(before);
  await request(`/sheets/${sheetId()}/rows`, { method: "PUT", body: JSON.stringify([{ id: inventoryRow.id, cells: cellsFor(after, inventorySheet.columns) }]) });
  try {
    const cells = recordCells([["Smoke ID",log.smokeId],["Inventory ID",log.inventoryId],["Cigar Name",log.cigarName],["Date Smoked",log.dateSmoked],["Production / Vintage Year",log.vintage],["Overall 1–100",log.overall],["Flavor",log.flavor],["Strength",log.strength],["Sweetness",log.sweetness],["Construction",log.construction],["Tasting Notes",log.tastingNotes],["Buy Again",log.buyAgain]], smokingSheet.columns);
    await request(`/sheets/${requireEnv("SMARTSHEET_SMOKING_LOG_SHEET_ID")}/rows`, { method:"POST", body:JSON.stringify([{toBottom:true,cells}]) });
  } catch (error) {
    await request(`/sheets/${sheetId()}/rows`, { method: "PUT", body: JSON.stringify([{ id: inventoryRow.id, cells: cellsFor(before, inventorySheet.columns) }]) }).catch(() => undefined);
    throw error;
  }
}
export async function getValuations(): Promise<Valuation[]> {
  const sheet = await recordSheet("SMARTSHEET_VALUATIONS_SHEET_ID");
  return sheet.rows.map((row) => { const v=recordValues(row,sheet.columns); return { valuationId:String(v.get("Valuation ID")||row.id), inventoryId:String(v.get("Inventory ID")||""), valuationDate:String(v.get("Valuation Date")||""), replacementValue:v.get("Retail Replacement Value")===undefined?undefined:Number(v.get("Retail Replacement Value")), marketValue:v.get("Market Value")===undefined?undefined:Number(v.get("Market Value")), lastSaleValue:v.get("Last Sale Value")===undefined?undefined:Number(v.get("Last Sale Value")), lastSaleDate:v.get("Last Sale Date") as string|undefined, lastSaleVenue:v.get("Last Sale Venue") as string|undefined, lastSaleSourceUrl:v.get("Last Sale Source URL") as string|undefined, source:v.get("Source") as string|undefined, sourceUrl:v.get("Source URL") as string|undefined, confidence:v.get("Confidence") as string|undefined, notes:v.get("Notes") as string|undefined }; });
}
export async function addValuation(value: Valuation): Promise<void> {
  const sheet=await recordSheet("SMARTSHEET_VALUATIONS_SHEET_ID");
  if(sheet.rows.some((row)=>String(recordValues(row,sheet.columns).get("Valuation ID"))===value.valuationId)) throw new Error(`Valuation ID ${value.valuationId} already exists`);
  const cells=recordCells([["Valuation ID",value.valuationId],["Inventory ID",value.inventoryId],["Valuation Date",value.valuationDate],["Retail Replacement Value",value.replacementValue],["Market Value",value.marketValue],["Last Sale Value",value.lastSaleValue],["Last Sale Date",value.lastSaleDate],["Last Sale Venue",value.lastSaleVenue],["Last Sale Source URL",value.lastSaleSourceUrl],["Source",value.source],["Source URL",value.sourceUrl],["Confidence",value.confidence],["Notes",value.notes]],sheet.columns);
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
    const cells=recordCells([["Valuation ID",value.valuationId],["Inventory ID",value.inventoryId],["Valuation Date",value.valuationDate],["Retail Replacement Value",value.replacementValue],["Market Value",value.marketValue],["Last Sale Value",value.lastSaleValue],["Last Sale Date",value.lastSaleDate],["Last Sale Venue",value.lastSaleVenue],["Last Sale Source URL",value.lastSaleSourceUrl],["Source",value.source],["Source URL",value.sourceUrl],["Confidence",value.confidence],["Notes",value.notes]],valuationSheet.columns);
    await request(`/sheets/${requireEnv("SMARTSHEET_VALUATIONS_SHEET_ID")}/rows`,{method:"POST",body:JSON.stringify([{toBottom:true,cells}])});
  } catch (error) {
    if (value.replacementValue !== undefined) await request(`/sheets/${sheetId()}/rows`, { method:"PUT", body:JSON.stringify([{id:inventoryRow.id,cells:cellsFor(before,inventorySheet.columns)}]) }).catch(()=>undefined);
    throw error;
  }
}

function activityFromRow(row: SmartsheetRow, columns: SmartsheetColumn[]): InventoryActivity {
  const v = recordValues(row, columns);
  const number = (title: string) => v.get(title) === undefined || v.get(title) === "" ? undefined : Number(v.get(title));
  return { activityId:String(v.get("Activity ID")||row.id), inventoryId:String(v.get("Inventory ID")||""), eventDate:String(v.get("Event Date")||""), eventType:String(v.get("Event Type")||"Correction") as InventoryActivity["eventType"], quantityChange:number("Quantity Change"), boxesChange:number("Boxes Change"), looseSticksChange:number("Loose Sticks Change"), totalAmount:number("Total Amount"), fromStorage:v.get("From Storage") as string|undefined, toStorage:v.get("To Storage") as string|undefined, resultingQuantity:number("Resulting Quantity"), resultingFullBoxes:number("Resulting Full Boxes"), resultingLooseSticks:number("Resulting Loose Sticks"), notes:v.get("Notes") as string|undefined, createdAt:v.get("Created At") as string|undefined };
}

export async function getActivities(): Promise<InventoryActivity[]> {
  const sheet = await recordSheet("SMARTSHEET_ACTIVITY_SHEET_ID");
  return sheet.rows.map((row) => activityFromRow(row, sheet.columns)).sort((a,b) => `${b.eventDate}${b.createdAt||""}`.localeCompare(`${a.eventDate}${a.createdAt||""}`));
}

function removeSticks(item: InventoryItem, quantity: number): InventoryItem {
  if (quantity > (item.currentQty ?? 0)) throw new Error(`Only ${item.currentQty ?? 0} cigars remain in ${item.inventoryId}`);
  let boxes = item.fullBoxQty ?? 0;
  let loose = item.looseStickQty ?? (item.fullBoxQty === undefined ? item.currentQty ?? 0 : 0);
  while (quantity > loose && boxes > 0 && item.sticksPerBox) { boxes -= 1; loose += item.sticksPerBox; }
  if (quantity > loose) throw new Error("Count the box and loose-stick breakdown before removing this quantity");
  return normalizeInventory({ ...item, fullBoxQty:boxes, looseStickQty:loose-quantity });
}

export async function recordActivity(input: ActivityInput): Promise<InventoryActivity> {
  const [inventorySheet, activitySheet] = await Promise.all([getSheet(), recordSheet("SMARTSHEET_ACTIVITY_SHEET_ID")]);
  const inventoryRow = inventorySheet.rows.find((row) => rowToInventory(row, inventorySheet.columns).inventoryId === input.inventoryId);
  if (!inventoryRow) throw new Error(`Inventory ID ${input.inventoryId} was not found`);
  const before = rowToInventory(inventoryRow, inventorySheet.columns);
  let after = before;
  const beforeBoxes = before.fullBoxQty ?? 0;
  const beforeLoose = before.looseStickQty ?? (before.fullBoxQty === undefined ? before.currentQty ?? 0 : 0);
  const boxSticks = input.boxes * (before.sticksPerBox ?? 0);
  if ((input.boxes > 0 || input.eventType === "Open box") && !before.sticksPerBox) throw new Error("Set cigars per box on this lot first");
  if (["Purchase","Add sticks","Correction"].includes(input.eventType)) after = normalizeInventory({ ...before, fullBoxQty:beforeBoxes+input.boxes, looseStickQty:beforeLoose+input.quantity });
  if (input.eventType === "Add box") after = normalizeInventory({ ...before, fullBoxQty:beforeBoxes+input.boxes, looseStickQty:beforeLoose });
  if (input.eventType === "Open box") { if (beforeBoxes < 1) throw new Error("No full box is available to open"); after = normalizeInventory({ ...before, fullBoxQty:beforeBoxes-1, looseStickQty:beforeLoose+(before.sticksPerBox??0) }); }
  if (["Smoke","Gift","Sale","Damaged / discarded"].includes(input.eventType)) after = removeSticks(before, input.eventType === "Smoke" ? Math.max(1,input.quantity) : input.quantity + boxSticks);
  if (input.eventType === "Storage move") after = normalizeInventory({ ...before, storageLocationId:input.toStorage });
  const activity: InventoryActivity = { activityId:`ACT-${crypto.randomUUID()}`, inventoryId:input.inventoryId, eventDate:input.eventDate, eventType:input.eventType, quantityChange:(after.currentQty??0)-(before.currentQty??0), boxesChange:(after.fullBoxQty??0)-beforeBoxes, looseSticksChange:(after.looseStickQty??0)-beforeLoose, totalAmount:input.totalAmount, fromStorage:input.eventType==="Storage move"?before.storageLocationId:undefined, toStorage:input.toStorage, resultingQuantity:after.currentQty, resultingFullBoxes:after.fullBoxQty, resultingLooseSticks:after.looseStickQty, notes:input.notes, createdAt:new Date().toISOString() };
  await request(`/sheets/${sheetId()}/rows`, { method:"PUT", body:JSON.stringify([{id:inventoryRow.id,cells:cellsFor(after,inventorySheet.columns)}]) });
  try {
    const cells=recordCells([["Activity ID",activity.activityId],["Inventory ID",activity.inventoryId],["Event Date",activity.eventDate],["Event Type",activity.eventType],["Quantity Change",activity.quantityChange],["Boxes Change",activity.boxesChange],["Loose Sticks Change",activity.looseSticksChange],["Total Amount",activity.totalAmount],["From Storage",activity.fromStorage],["To Storage",activity.toStorage],["Resulting Quantity",activity.resultingQuantity],["Resulting Full Boxes",activity.resultingFullBoxes],["Resulting Loose Sticks",activity.resultingLooseSticks],["Notes",activity.notes],["Created At",activity.createdAt]],activitySheet.columns);
    await request(`/sheets/${requireEnv("SMARTSHEET_ACTIVITY_SHEET_ID")}/rows`,{method:"POST",body:JSON.stringify([{toBottom:true,cells}])});
  } catch (error) {
    await request(`/sheets/${sheetId()}/rows`, { method:"PUT", body:JSON.stringify([{id:inventoryRow.id,cells:cellsFor(before,inventorySheet.columns)}]) }).catch(()=>undefined);
    throw error;
  }
  return activity;
}

export async function getCollections():Promise<CigarCollection[]>{
  const sheet=await recordSheet("SMARTSHEET_COLLECTIONS_SHEET_ID");
  return sheet.rows.map(row=>{const v=recordValues(row,sheet.columns);const number=(title:string)=>v.get(title)===undefined||v.get(title)===""?undefined:Number(v.get(title));return{collectionId:String(v.get("Collection ID")||row.id),name:String(v.get("Collection Name")||"Untitled collection"),maker:v.get("Maker / Collaboration") as string|undefined,releaseYear:v.get("Release Year") as string|number|undefined,edition:v.get("Edition / Release") as string|undefined,expectedComponents:number("Expected Components"),expectedCigars:number("Expected Cigars"),wholeMarketValue:number("Whole Collection Market Value"),acquisitionCost:number("Acquisition Cost"),valuationDate:v.get("Valuation Date") as string|undefined,valuationSource:v.get("Valuation Source") as string|undefined,valuationSourceUrl:v.get("Valuation Source URL") as string|undefined,status:v.get("Status") as CigarCollection["status"],photoLink:v.get("Photo Link") as string|undefined,notes:v.get("Notes") as string|undefined};});
}

export async function saveCollection(value:CigarCollection,memberIds:string[]):Promise<void>{
  const[collectionSheet,inventorySheet]=await Promise.all([recordSheet("SMARTSHEET_COLLECTIONS_SHEET_ID"),getSheet()]);
  const values:Array<[string,RecordValue]>=[["Collection ID",value.collectionId],["Collection Name",value.name],["Maker / Collaboration",value.maker],["Release Year",value.releaseYear],["Edition / Release",value.edition],["Expected Components",value.expectedComponents],["Expected Cigars",value.expectedCigars],["Whole Collection Market Value",value.wholeMarketValue],["Acquisition Cost",value.acquisitionCost],["Valuation Date",value.valuationDate],["Valuation Source",value.valuationSource],["Valuation Source URL",value.valuationSourceUrl],["Status",value.status],["Photo Link",value.photoLink],["Notes",value.notes]];
  const existing=collectionSheet.rows.find(row=>String(recordValues(row,collectionSheet.columns).get("Collection ID"))===value.collectionId);const cells=recordCells(values,collectionSheet.columns);
  if(existing)await request(`/sheets/${requireEnv("SMARTSHEET_COLLECTIONS_SHEET_ID")}/rows`,{method:"PUT",body:JSON.stringify([{id:existing.id,cells}])});else await request(`/sheets/${requireEnv("SMARTSHEET_COLLECTIONS_SHEET_ID")}/rows`,{method:"POST",body:JSON.stringify([{toBottom:true,cells}])});
  const selected=new Set(memberIds);const updates=inventorySheet.rows.flatMap(row=>{const item=rowToInventory(row,inventorySheet.columns);const shouldSelect=selected.has(item.inventoryId);if(item.collectionId!==value.collectionId&&!shouldSelect)return[];if(item.collectionId===value.collectionId&&shouldSelect)return[];return[{id:row.id,cells:cellsFor(normalizeInventory({...item,collectionId:shouldSelect?value.collectionId:""}),inventorySheet.columns)}];});
  if(updates.length)await request(`/sheets/${sheetId()}/rows`,{method:"PUT",body:JSON.stringify(updates)});
}

export async function getHumidors():Promise<Humidor[]>{const sheet=await recordSheet("SMARTSHEET_HUMIDORS_SHEET_ID");return sheet.rows.map(row=>{const v=recordValues(row,sheet.columns);const n=(title:string,fallback:number)=>v.get(title)===undefined?fallback:Number(v.get(title));return{humidorId:String(v.get("Humidor ID")||row.id),name:String(v.get("Humidor Name")||"Unnamed humidor"),type:v.get("Type") as string|undefined,capacity:n("Capacity",0)||undefined,location:v.get("Room / Location") as string|undefined,targetTempF:n("Target Temperature F",68),minTempF:n("Minimum Temperature F",65),maxTempF:n("Maximum Temperature F",72),targetHumidity:n("Target Humidity RH",67),minHumidity:n("Minimum Humidity RH",62),maxHumidity:n("Maximum Humidity RH",72),humidificationDevice:v.get("Humidification Device") as string|undefined,sensorName:v.get("Sensor Name") as string|undefined,photoLink:v.get("Photo Link") as string|undefined,notes:v.get("Notes") as string|undefined};});}
export async function getHumidorReadings():Promise<HumidorReading[]>{const sheet=await recordSheet("SMARTSHEET_HUMIDOR_READINGS_SHEET_ID");return sheet.rows.map(row=>{const v=recordValues(row,sheet.columns);return{readingId:String(v.get("Reading ID")||row.id),humidorId:String(v.get("Humidor ID")||""),sensorId:v.get("Sensor ID") as string|undefined,provider:v.get("Provider") as string|undefined,externalReadingId:v.get("External Reading ID") as string|undefined,recordedAt:String(v.get("Recorded At")||""),temperatureF:Number(v.get("Temperature F")||0),humidity:Number(v.get("Humidity RH")||0),batteryPercent:v.get("Battery Percent")===undefined?undefined:Number(v.get("Battery Percent")),source:v.get("Source") as string|undefined,notes:v.get("Notes") as string|undefined,importedAt:v.get("Imported At") as string|undefined};}).sort((a,b)=>b.recordedAt.localeCompare(a.recordedAt));}
export async function saveHumidor(value:Humidor,memberIds:string[]):Promise<void>{const[humidorSheet,inventorySheet]=await Promise.all([recordSheet("SMARTSHEET_HUMIDORS_SHEET_ID"),getSheet()]);const values:Array<[string,RecordValue]>=[["Humidor ID",value.humidorId],["Humidor Name",value.name],["Type",value.type],["Capacity",value.capacity],["Room / Location",value.location],["Target Temperature F",value.targetTempF],["Minimum Temperature F",value.minTempF],["Maximum Temperature F",value.maxTempF],["Target Humidity RH",value.targetHumidity],["Minimum Humidity RH",value.minHumidity],["Maximum Humidity RH",value.maxHumidity],["Humidification Device",value.humidificationDevice],["Sensor Name",value.sensorName],["Photo Link",value.photoLink],["Notes",value.notes]];const existing=humidorSheet.rows.find(row=>String(recordValues(row,humidorSheet.columns).get("Humidor ID"))===value.humidorId);const cells=recordCells(values,humidorSheet.columns);if(existing)await request(`/sheets/${requireEnv("SMARTSHEET_HUMIDORS_SHEET_ID")}/rows`,{method:"PUT",body:JSON.stringify([{id:existing.id,cells}])});else await request(`/sheets/${requireEnv("SMARTSHEET_HUMIDORS_SHEET_ID")}/rows`,{method:"POST",body:JSON.stringify([{toBottom:true,cells}])});const selected=new Set(memberIds);const updates=inventorySheet.rows.flatMap(row=>{const item=rowToInventory(row,inventorySheet.columns);const isHere=item.storageLocationId===value.humidorId;const should=selected.has(item.inventoryId);if(isHere===should)return[];return[{id:row.id,cells:cellsFor(normalizeInventory({...item,storageLocationId:should?value.humidorId:""}),inventorySheet.columns)}];});if(updates.length)await request(`/sheets/${sheetId()}/rows`,{method:"PUT",body:JSON.stringify(updates)});}
export async function addHumidorReading(value:Omit<HumidorReading,"readingId">):Promise<HumidorReading>{const sheet=await recordSheet("SMARTSHEET_HUMIDOR_READINGS_SHEET_ID");const result={...value,readingId:`READ-${crypto.randomUUID()}`};const cells=recordCells([["Reading ID",result.readingId],["Humidor ID",result.humidorId],["Sensor ID",result.sensorId],["Provider",result.provider],["External Reading ID",result.externalReadingId],["Recorded At",result.recordedAt],["Temperature F",result.temperatureF],["Humidity RH",result.humidity],["Battery Percent",result.batteryPercent],["Source",result.source],["Notes",result.notes],["Imported At",result.importedAt]],sheet.columns);await request(`/sheets/${requireEnv("SMARTSHEET_HUMIDOR_READINGS_SHEET_ID")}/rows`,{method:"POST",body:JSON.stringify([{toBottom:true,cells}])});return result;}

export async function getSensors():Promise<EnvironmentalSensor[]>{const sheet=await recordSheet("SMARTSHEET_SENSORS_SHEET_ID");return sheet.rows.map(row=>{const v=recordValues(row,sheet.columns);return{sensorId:String(v.get("Sensor ID")||row.id),humidorId:String(v.get("Humidor ID")||""),provider:String(v.get("Provider")||"Unknown"),model:v.get("Model") as string|undefined,name:String(v.get("Sensor Name")||"Unnamed sensor"),externalDeviceId:v.get("External Device ID") as string|undefined,syncMethod:String(v.get("Sync Method")||"Manual") as EnvironmentalSensor["syncMethod"],connectionStatus:String(v.get("Connection Status")||"Needs setup") as EnvironmentalSensor["connectionStatus"],lastSyncAt:v.get("Last Sync At") as string|undefined,batteryPercent:v.get("Battery Percent")===undefined?undefined:Number(v.get("Battery Percent")),firmware:v.get("Firmware") as string|undefined,notes:v.get("Notes") as string|undefined};});}
export async function saveSensor(value:EnvironmentalSensor):Promise<void>{const sheet=await recordSheet("SMARTSHEET_SENSORS_SHEET_ID");const cells=recordCells([["Sensor ID",value.sensorId],["Humidor ID",value.humidorId],["Provider",value.provider],["Model",value.model],["Sensor Name",value.name],["External Device ID",value.externalDeviceId],["Sync Method",value.syncMethod],["Connection Status",value.connectionStatus],["Last Sync At",value.lastSyncAt],["Battery Percent",value.batteryPercent],["Firmware",value.firmware],["Notes",value.notes]],sheet.columns);const existing=sheet.rows.find(row=>String(recordValues(row,sheet.columns).get("Sensor ID"))===value.sensorId);if(existing)await request(`/sheets/${requireEnv("SMARTSHEET_SENSORS_SHEET_ID")}/rows`,{method:"PUT",body:JSON.stringify([{id:existing.id,cells}])});else await request(`/sheets/${requireEnv("SMARTSHEET_SENSORS_SHEET_ID")}/rows`,{method:"POST",body:JSON.stringify([{toBottom:true,cells}])});}
export async function ingestSensorReadings(values:Array<Omit<HumidorReading,"readingId"> & {externalReadingId:string}>){const sheet=await recordSheet("SMARTSHEET_HUMIDOR_READINGS_SHEET_ID");const existing=new Set(sheet.rows.map(row=>String(recordValues(row,sheet.columns).get("External Reading ID")||"")));const pending=values.filter(v=>!existing.has(v.externalReadingId));if(!pending.length)return{imported:0,duplicates:values.length};const importedAt=new Date().toISOString();const rows=pending.map(value=>{const result={...value,readingId:`READ-${crypto.randomUUID()}`,importedAt};return{toBottom:true,cells:recordCells([["Reading ID",result.readingId],["Humidor ID",result.humidorId],["Sensor ID",result.sensorId],["Provider",result.provider],["External Reading ID",result.externalReadingId],["Recorded At",result.recordedAt],["Temperature F",result.temperatureF],["Humidity RH",result.humidity],["Battery Percent",result.batteryPercent],["Source",result.source],["Notes",result.notes],["Imported At",result.importedAt]],sheet.columns)}});for(let i=0;i<rows.length;i+=400)await request(`/sheets/${requireEnv("SMARTSHEET_HUMIDOR_READINGS_SHEET_ID")}/rows`,{method:"POST",body:JSON.stringify(rows.slice(i,i+400))});return{imported:pending.length,duplicates:values.length-pending.length};}

export async function getAlertDeliveries():Promise<AlertDelivery[]>{const sheet=await recordSheet("SMARTSHEET_ALERTS_SHEET_ID");return sheet.rows.map(row=>{const v=recordValues(row,sheet.columns);return{alertId:String(v.get("Alert ID")||row.id),humidorId:String(v.get("Humidor ID")||""),sensorId:v.get("Sensor ID") as string|undefined,severity:String(v.get("Severity")||"Attention") as AlertDelivery["severity"],alertType:String(v.get("Alert Type")||"Climate"),message:String(v.get("Message")||""),readingId:v.get("Reading ID") as string|undefined,detectedAt:String(v.get("Detected At")||""),emailSentAt:v.get("Email Sent At") as string|undefined,smsSentAt:v.get("SMS Sent At") as string|undefined,status:String(v.get("Status")||"Pending") as AlertDelivery["status"],notes:v.get("Notes") as string|undefined};}).sort((a,b)=>b.detectedAt.localeCompare(a.detectedAt));}
export async function saveAlertDelivery(value:AlertDelivery):Promise<void>{const sheet=await recordSheet("SMARTSHEET_ALERTS_SHEET_ID");const cells=recordCells([["Alert ID",value.alertId],["Humidor ID",value.humidorId],["Sensor ID",value.sensorId],["Severity",value.severity],["Alert Type",value.alertType],["Message",value.message],["Reading ID",value.readingId],["Detected At",value.detectedAt],["Email Sent At",value.emailSentAt],["SMS Sent At",value.smsSentAt],["Status",value.status],["Notes",value.notes]],sheet.columns);await request(`/sheets/${requireEnv("SMARTSHEET_ALERTS_SHEET_ID")}/rows`,{method:"POST",body:JSON.stringify([{toBottom:true,cells}])});}
