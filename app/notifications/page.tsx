import { NotificationCenter } from "@/components/notification-center";
import { buildCollectorNotifications } from "@/lib/collector-notifications";
import { loadWishlist } from "@/lib/data";
import "./notifications.css";
import "./controls.css";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const wishlist = await loadWishlist();
  return <main className="shell notificationPage"><NotificationCenter notifications={buildCollectorNotifications(wishlist)} items={wishlist}/></main>;
}
