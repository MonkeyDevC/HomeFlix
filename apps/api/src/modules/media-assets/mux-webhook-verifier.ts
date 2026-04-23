import { createHmac, timingSafeEqual } from "node:crypto";

export interface MuxWebhookVerificationResult {
  readonly ok: boolean;
  readonly reason?: string;
}

export function verifyMuxWebhookSignature(
  rawBody: string,
  signatureHeader: string | undefined,
  secret: string | undefined,
  nowSeconds = Math.floor(Date.now() / 1000),
  toleranceSeconds = 300
): MuxWebhookVerificationResult {
  if (secret === undefined) {
    return {
      ok: false,
      reason: "MUX_WEBHOOK_SECRET is not configured."
    };
  }

  if (signatureHeader === undefined) {
    return {
      ok: false,
      reason: "Missing mux-signature header."
    };
  }

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key, value];
    })
  );

  const timestamp = parts.t;
  const signature = parts.v1;

  if (timestamp === undefined || signature === undefined) {
    return {
      ok: false,
      reason: "Invalid mux-signature header."
    };
  }

  const timestampNumber = Number.parseInt(timestamp, 10);

  if (!Number.isInteger(timestampNumber)) {
    return {
      ok: false,
      reason: "Invalid mux-signature timestamp."
    };
  }

  if (Math.abs(nowSeconds - timestampNumber) > toleranceSeconds) {
    return {
      ok: false,
      reason: "Mux webhook signature timestamp is outside tolerance."
    };
  }

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");

  const expectedBuffer = Buffer.from(expected, "hex");
  const actualBuffer = Buffer.from(signature, "hex");

  if (expectedBuffer.length !== actualBuffer.length) {
    return {
      ok: false,
      reason: "Mux webhook signature length mismatch."
    };
  }

  if (!timingSafeEqual(expectedBuffer, actualBuffer)) {
    return {
      ok: false,
      reason: "Mux webhook signature mismatch."
    };
  }

  return {
    ok: true
  };
}
