import { InventoryItem } from "./types";

const BASE = "https://api.smartsheet.com/2.0";

type SmartsheetColumn = { id: number; title: string };
type SmartsheetCell = { columnId: number; value?: unknown; displayValue?: string };
type SmartsheetRow = { id: number; cells: SmartsheetCell[] };
type SmartsheetSheet = { columns: SmartsheetColumn[]; rows: SmartsheetRow[] };

function headers() {
  const token = process.env.SMARTSHEET_ACCESS_TOKEN;
  if (!token) throw new Error("SMARTSHEET_ACCESS_TOKEN is missing");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "smartsheet-integration-source": process.env.SMARTSHEET_INTEGRATION_SOURCE || "APPLICATION,CigarVault,CigarVault-MVP",
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE}${path}`, { ...init, headers: { ...headers(), ...(init?.headers || {}) }, cache: "no-store" });
  if (!response.ok) throw new Error(`Smartsheet ${response.status}: ${await response.text()}`);
  return response.json() as Promise<T>;
}

export async function getInventory(): Promise<InventoryItem[]> {
  const sheetId = process.env.SMARTSHEET_INVENTORY_SHEET_ID;
  if (!sheetId) throw new Error("SMARTSHEET_INVENTORY_SHEET_ID is missing");
  const sheet = await request<SmartsheetSheet>(`/sheets/${sheetId}`);
  const titles = new Map(sheet.columns.map((column) => [column.id, column.title]));
  return sheet.rows.map((row) => {
    const values = new Map(row.cells.map((cell) => [titles.get(cell.columnId), cell.value ?? cell.displayValue]));
    const number = (name: string) => {
      const value = values.get(name);
      return typeof value === "number" ? value : value === undefined || value === "" ? undefined : Number(value);
    };
    return {
      inventoryId: String(values.get("Inventory ID") || row.id),
      catalogId: String(values.get("Catalog ID") || "") || undefined,
      brand: String(values.get("Brand") || "Unknown"),
      line: String(values.get("Line / Series") || ""),
      vitola: String(values.get("Cigar / Vitola") || ""),
      vintage: values.get("Production / Vintage Year") as string | number | undefined,
      originalQty: number("Original Qty"),
      smokedQty: number("Qty Smoked"),
      currentQty: number("Current Qty"),
      retailValue: number("Retail Replacement Value"),
      status: String(values.get("Status") || "") || undefined,
      priority: String(values.get("Priority") || "") || undefined,
      score: number("Brian Score"),
      action: String(values.get("Recommended Action") || "") || undefined,
    };
  });
}

export async function addInventoryRow(item: InventoryItem): Promise<void> {
  const sheetId = process.env.SMARTSHEET_INVENTORY_SHEET_ID;
  if (!sheetId) throw new Error("SMARTSHEET_INVENTORY_SHEET_ID is missing");
  const sheet = await request<SmartsheetSheet>(`/sheets/${sheetId}?pageSize=1`);
  const columnId = new Map(sheet.columns.map((column) => [column.title, column.id]));
  const cells = [
    ["Inventory ID", item.inventoryId], ["Catalog ID", item.catalogId], ["Brand", item.brand],
    ["Line / Series", item.line], ["Cigar / Vitola", item.vitola], ["Production / Vintage Year", item.vintage],
    ["Original Qty", item.originalQty], ["Qty Smoked", item.smokedQty ?? 0], ["Status", item.status || "Hold"],
    ["Priority", item.priority || "Medium"], ["Brian Score", item.score], ["Recommended Action", item.action],
  ].flatMap(([title, value]) => value === undefined || !columnId.get(String(title)) ? [] : [{ columnId: columnId.get(String(title)), value }]);
  await request(`/sheets/${sheetId}/rows`, { method: "POST", body: JSON.stringify([{ toBottom: true, cells }]) });
}
