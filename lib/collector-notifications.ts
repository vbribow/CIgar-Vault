import type { PriceMatch, WishlistItem } from "@/lib/types";

export type CollectorNotification = {
  id: string;
  kind: "Price match" | "Availability" | "Purchase follow-up" | "Monitoring";
  priority: "High" | "Medium" | "Standard";
  title: string;
  detail: string;
  occurredAt: string;
  href: string;
  externalUrl?: string;
  price?: number;
};

const priorityWeight = { High: 3, Medium: 2, Standard: 1 } as const;

function matchNotification(item: WishlistItem, match: PriceMatch): CollectorNotification {
  return {
    id: `MATCH-${item.wishlistId}-${match.url}`,
    kind: "Price match",
    priority: item.priority,
    title: `${item.brand} ${item.vitola} is at or below target`,
    detail: `${match.seller} lists ${item.line} at $${match.price.toFixed(2)} per cigar against your $${match.targetPrice.toFixed(2)} target.`,
    occurredAt: item.availabilityLastCheckedAt || item.createdAt,
    href: `/wishlist#${encodeURIComponent(item.wishlistId)}`,
    externalUrl: match.url,
    price: match.price,
  };
}

export function buildCollectorNotifications(items: WishlistItem[], now = new Date()): CollectorNotification[] {
  const notifications: CollectorNotification[] = [];
  for (const item of items) {
    for (const match of item.priceMatches || []) notifications.push(matchNotification(item, match));

    if (item.status === "Watching" && item.targetPrice === undefined) {
      notifications.push({
        id: `TARGET-${item.wishlistId}`,
        kind: "Monitoring",
        priority: "Standard",
        title: `Set a target for ${item.brand} ${item.vitola}`,
        detail: "Add a per-cigar target price to enable automatic market matching.",
        occurredAt: item.createdAt,
        href: `/wishlist#${encodeURIComponent(item.wishlistId)}`,
      });
    }

    if (item.status === "Watching" && item.targetPrice !== undefined) {
      const checked = item.availabilityLastCheckedAt ? new Date(item.availabilityLastCheckedAt).getTime() : Number.NaN;
      if (!Number.isFinite(checked) || now.getTime() - checked > 36 * 60 * 60 * 1000) {
        notifications.push({
          id: `STALE-${item.wishlistId}`,
          kind: "Monitoring",
          priority: item.priority === "High" ? "High" : "Medium",
          title: `${item.brand} ${item.vitola} needs a market refresh`,
          detail: item.availabilityLastCheckedAt ? "The last availability check is more than 36 hours old." : "This target has not been checked yet.",
          occurredAt: item.availabilityLastCheckedAt || item.createdAt,
          href: `/wishlist#${encodeURIComponent(item.wishlistId)}`,
        });
      }
    }

    if (item.status === "Purchased" && !item.inventoryId) {
      notifications.push({
        id: `PURCHASE-${item.wishlistId}`,
        kind: "Purchase follow-up",
        priority: "High",
        title: `Add ${item.brand} ${item.vitola} to the vault`,
        detail: "This purchase is recorded but has not yet been converted into owned inventory.",
        occurredAt: item.purchasedAt || item.createdAt,
        href: `/wishlist#purchase-${encodeURIComponent(item.wishlistId)}`,
      });
    }
  }
  return notifications.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority] || b.occurredAt.localeCompare(a.occurredAt));
}
