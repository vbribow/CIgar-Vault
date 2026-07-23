import { NotificationCenter } from "@/components/notification-center";
import { buildCollectorNotifications, buildRatingNotifications } from "@/lib/collector-notifications";
import { loadRatingDrafts, loadWishlist } from "@/lib/data";
import { loadInventory } from "@/lib/inventory";
import "./notifications.css";
import "./controls.css";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const [wishlist,ratingDrafts,inventory] = await Promise.all([loadWishlist(),loadRatingDrafts(),loadInventory()]);
  return <main className="shell notificationPage"><NotificationCenter notifications={[...buildRatingNotifications(ratingDrafts,inventory),...buildCollectorNotifications(wishlist)]} items={wishlist} ratingDrafts={ratingDrafts}/></main>;
}
