"use client";

import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useState } from "react";
import type { DataMode } from "@/lib/config";
import type { InventoryItem } from "@/lib/types";

const InventoryCorrectionAssistant = dynamic(
  () => import("@/components/inventory-correction-assistant").then(module => module.InventoryCorrectionAssistant),
  { loading: () => <div className="deferredToolLoading compact" role="status">Preparing correction safeguards…</div> },
);
const PhotoManager = dynamic(
  () => import("@/components/photo-manager").then(module => module.PhotoManager),
  { loading: () => <div className="deferredToolLoading compact" role="status">Preparing private attachments…</div> },
);

export function InventoryRecordTools({ initialItem, inventory, mode }: { initialItem: InventoryItem; inventory: InventoryItem[]; mode: DataMode }) {
  const [item, setItem] = useState(initialItem);
  const router = useRouter();
  function synchronize(updated: InventoryItem) { setItem(updated); router.refresh(); }
  return <>
    <InventoryCorrectionAssistant item={item} inventory={inventory} mode={mode} onApplied={synchronize} />
    <PhotoManager item={item} onAttached={synchronize} />
  </>;
}
