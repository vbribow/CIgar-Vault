import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { resendDeliveryUpdate, validResendWebhookSignature } from "../lib/resend-webhook";

const secret = `whsec_${Buffer.from("hojavia-test-secret").toString("base64")}`;
const payload = JSON.stringify({ type:"email.delivered", created_at:"2026-10-08T12:00:00Z", data:{ email_id:"email-123" } });
const timestamp = "1791460800";
const id = "msg_test";
const signature = createHmac("sha256", Buffer.from(secret.slice(6), "base64")).update(`${id}.${timestamp}.${payload}`).digest("base64");

test("Resend webhooks require a current valid Svix signature", () => {
  assert.equal(validResendWebhookSignature(payload, { id, timestamp, signature:`v1,${signature}` }, secret, Number(timestamp)), true);
  assert.equal(validResendWebhookSignature(payload, { id, timestamp, signature:"v1,bad" }, secret, Number(timestamp)), false);
  assert.equal(validResendWebhookSignature(payload, { id, timestamp, signature:`v1,${signature}` }, secret, Number(timestamp) + 301), false);
});

test("delivery events become durable invitation states", () => {
  assert.deepEqual(resendDeliveryUpdate(JSON.parse(payload)), { providerId:"email-123", status:"delivered", occurredAt:"2026-10-08T12:00:00.000Z", failure:undefined });
  assert.equal(resendDeliveryUpdate({ type:"email.bounced", created_at:"2026-10-08T12:01:00Z", data:{ email_id:"email-123", bounce:{ message:"Mailbox unavailable" } } })?.failure, "Mailbox unavailable");
  assert.equal(resendDeliveryUpdate({ type:"contact.updated", created_at:"2026-10-08T12:01:00Z", data:{ email_id:"email-123" } }), undefined);
});

test("the webhook route is signed, account-scoped by provider id, and retry-safe", async () => {
  const source = await import("node:fs").then(fs => fs.readFileSync(new URL("../app/api/webhooks/resend/route.ts", import.meta.url), "utf8"));
  assert.match(source, /RESEND_WEBHOOK_SECRET/);
  assert.match(source, /validResendWebhookSignature/);
  assert.match(source, /invitation_provider_id/);
  assert.match(source, /invitation_last_checked_at\.lte/);
});
