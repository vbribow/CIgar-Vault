"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { DataMode } from "@/lib/config";
import type { InventoryItem } from "@/lib/types";
import { InventoryCorrectionAssistant } from "@/components/inventory-correction-assistant";
import { PhotoManager } from "@/components/photo-manager";

export function InventoryRecordTools({ initialItem, inventory, mode }: { initialItem: InventoryItem; inventory: InventoryItem[]; mode: DataMode }) {
  const [item, setItem] = useState(initialItem);
  const router = useRouter();
  function synchronize(updated: InventoryItem) { setItem(updated); router.refresh(); }
  return <>
    <InventoryCorrectionAssistant item={item} inventory={inventory} mode={mode} onApplied={synchronize} />
    <PhotoManager item={item} onAttached={synchronize} />
  </>;
}
