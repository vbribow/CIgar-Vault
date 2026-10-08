import { createHmac, timingSafeEqual } from "node:crypto";
import { accountEmailDeliveryStatus, type AccountEmailDeliveryStatus } from "./alert-notifications";

export type ResendDeliveryEvent = {
  type: string;
  created_at: string;
  data?: { email_id?: string; bounce?: { message?: string } };
};

export function validResendWebhookSignature(
  payload: string,
  headers: { id: string | null; timestamp: string | null; signature: string | null },
  secret: string,
  nowSeconds = Date.now() / 1000,
) {
  if (!headers.id || !headers.timestamp || !headers.signature || !secret.startsWith("whsec_")) return false;
  const timestamp = Number(headers.timestamp);
  if (!Number.isFinite(timestamp) || Math.abs(nowSeconds - timestamp) > 300) return false;
  let key: Buffer;
  try { key = Buffer.from(secret.slice(6), "base64"); } catch { return false; }
  const expected = createHmac("sha256", key).update(`${headers.id}.${headers.timestamp}.${payload}`).digest("base64");
  const expectedBytes = Buffer.from(expected);
  return headers.signature.split(" ").some(part => {
    const [version, value] = part.split(",", 2);
    const supplied = Buffer.from(version === "v1" ? value || "" : "");
    return supplied.length === expectedBytes.length && timingSafeEqual(supplied, expectedBytes);
  });
}

export function resendDeliveryUpdate(event: ResendDeliveryEvent): {
  providerId: string;
  status: AccountEmailDeliveryStatus;
  occurredAt: string;
  failure?: string;
} | undefined {
  const providerId = event.data?.email_id?.trim();
  const occurredAt = event.created_at && !Number.isNaN(Date.parse(event.created_at)) ? new Date(event.created_at).toISOString() : undefined;
  if (!providerId || !occurredAt || !event.type.startsWith("email.")) return undefined;
  const providerEvent = event.type.slice("email.".length);
  const status = accountEmailDeliveryStatus(providerEvent);
  if (status === "unknown") return undefined;
  return {
    providerId,
    status,
    occurredAt,
    failure: status === "failed" ? event.data?.bounce?.message || `Provider reported ${providerEvent}` : undefined,
  };
}
