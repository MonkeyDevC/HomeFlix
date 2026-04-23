export interface MuxWebhookPayload {
  readonly id?: string;
  readonly created_at?: number | string;
  readonly data?: Record<string, unknown>;
  readonly type?: string;
}

export function parseMuxWebhookPayload(rawBody: string): MuxWebhookPayload {
  const parsed = JSON.parse(rawBody) as unknown;

  if (!isRecord(parsed)) {
    return {};
  }

  const createdAt = getNumberOrString(parsed.created_at);
  const eventId = getString(parsed.id);

  return {
    ...(eventId === undefined ? {} : { id: eventId }),
    ...(createdAt === undefined ? {} : { created_at: createdAt }),
    ...(isRecord(parsed.data) ? { data: parsed.data } : {}),
    ...(typeof parsed.type === "string" ? { type: parsed.type } : {})
  };
}

export function getString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export function getNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export function getWebhookDate(event: MuxWebhookPayload): Date {
  const createdAt = event.created_at;

  if (typeof createdAt === "number") {
    return new Date(createdAt * 1000);
  }

  if (typeof createdAt === "string") {
    const parsed = Number.parseInt(createdAt, 10);

    if (Number.isInteger(parsed)) {
      return new Date(parsed * 1000);
    }
  }

  return new Date();
}

export function getFirstPlaybackId(data: Record<string, unknown>): string | undefined {
  const playbackIds = data.playback_ids;

  if (!Array.isArray(playbackIds)) {
    return undefined;
  }

  const [firstPlaybackId] = playbackIds;

  if (!isRecord(firstPlaybackId)) {
    return undefined;
  }

  return getString(firstPlaybackId.id);
}

export function getFailureReason(data: Record<string, unknown>): string {
  const errors = data.errors;

  if (!isRecord(errors)) {
    return "Mux reported a processing failure.";
  }

  const messages = errors.messages;

  if (Array.isArray(messages) && typeof messages[0] === "string") {
    return messages[0];
  }

  const type = getString(errors.type);
  return type === undefined ? "Mux reported a processing failure." : type;
}

function getNumberOrString(value: unknown): number | string | undefined {
  if (typeof value === "number" || typeof value === "string") {
    return value;
  }

  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
