import assert from "node:assert/strict";
import { MediaAssetStatusTransitionService } from "../apps/api/dist/modules/media-assets/media-asset-status-transition.service.js";

const records = new Map([
  [
    "media_ready_fixture",
    {
      id: "media_ready_fixture",
      lastWebhookEventId: null,
      playbackId: null,
      providerAssetId: null,
      providerUploadId: "upload_ready_fixture",
      status: "uploading"
    }
  ],
  [
    "media_failed_fixture",
    {
      id: "media_failed_fixture",
      lastWebhookEventId: null,
      playbackId: null,
      providerAssetId: null,
      providerUploadId: "upload_failed_fixture",
      status: "uploading"
    }
  ]
]);

const webhookEvents = new Map();

const repository = {
  async claimWebhookEvent(input) {
    const existing = webhookEvents.get(input.webhookEventId);

    if (existing !== undefined) {
      return {
        event: existing,
        status: "already_claimed"
      };
    }

    webhookEvents.set(input.webhookEventId, {
      applied: false,
      eventType: input.eventType,
      mediaAssetId: null,
      processedAt: null,
      providerEventId: input.webhookEventId,
      reason: null,
      transition: null
    });

    return {
      status: "claimed"
    };
  },

  async markWebhookEventProcessed(input) {
    const event = webhookEvents.get(input.webhookEventId);
    event.applied = input.applied;
    event.mediaAssetId = input.mediaAssetId ?? null;
    event.processedAt = new Date();
    event.reason = input.reason ?? null;
    event.transition = input.transition ?? null;
  },

  async releaseWebhookEvent(webhookEventId) {
    webhookEvents.delete(webhookEventId);
  },

  async applyAssetCreated(input) {
    const record = [...records.values()].find(
      (candidate) => candidate.providerUploadId === input.providerUploadId
    );

    if (record === undefined) {
      return null;
    }

    record.providerAssetId = input.providerAssetId;
    record.lastWebhookEventId = input.webhookEventId;
    record.status = "processing";
    return record;
  },

  async applyReady(input) {
    const record = records.get(input.mediaAssetId);

    if (record === undefined) {
      return null;
    }

    record.lastWebhookEventId = input.webhookEventId;
    record.playbackId = input.playbackId;
    record.providerAssetId = input.providerAssetId;
    record.status = "ready";
    return record;
  },

  async applyFailed(input) {
    const record = records.get(input.mediaAssetId);

    if (record === undefined) {
      return null;
    }

    record.status = "failed";
    record.failureReason = input.failureReason;
    record.lastWebhookEventId = input.webhookEventId;
    return record;
  }
};

const service = new MediaAssetStatusTransitionService(repository);

const readyAck = await service.applyMuxWebhook({
  created_at: 1700000001,
  data: {
    duration: 12.5,
    id: "asset_ready_fixture",
    passthrough: "media_ready_fixture",
    playback_ids: [{ id: "playback_ready_fixture", policy: "public" }],
    upload_id: "upload_ready_fixture"
  },
  id: "event_ready_fixture",
  type: "video.asset.ready"
});

assert.equal(readyAck.accepted, true);
assert.equal(readyAck.applied, true);
assert.equal(readyAck.mediaAssetId, "media_ready_fixture");
assert.equal(readyAck.transition, "ready");
assert.equal(records.get("media_ready_fixture").status, "ready");
assert.equal(records.get("media_ready_fixture").lastWebhookEventId, "event_ready_fixture");
assert.equal(records.get("media_ready_fixture").playbackId, "playback_ready_fixture");

const replayReadyAck = await service.applyMuxWebhook({
  created_at: 1700000001,
  data: {
    duration: 12.5,
    id: "asset_ready_fixture",
    passthrough: "media_ready_fixture",
    playback_ids: [{ id: "playback_ready_fixture", policy: "public" }],
    upload_id: "upload_ready_fixture"
  },
  id: "event_ready_fixture",
  type: "video.asset.ready"
});

assert.equal(replayReadyAck.accepted, true);
assert.equal(replayReadyAck.applied, false);
assert.equal(replayReadyAck.idempotentReplay, true);

const failedAck = await service.applyMuxWebhook({
  created_at: 1700000002,
  data: {
    errors: {
      messages: ["fixture upload failed"]
    },
    id: "upload_failed_fixture",
    passthrough: "media_failed_fixture"
  },
  id: "event_failed_fixture",
  type: "video.upload.errored"
});

assert.equal(failedAck.accepted, true);
assert.equal(failedAck.applied, true);
assert.equal(failedAck.mediaAssetId, "media_failed_fixture");
assert.equal(failedAck.transition, "failed");
assert.equal(records.get("media_failed_fixture").status, "failed");

const unsupportedAck = await service.applyMuxWebhook({
  created_at: 1700000003,
  data: {
    id: "asset_unused"
  },
  id: "event_unsupported_fixture",
  type: "video.asset.deleted"
});

assert.equal(unsupportedAck.accepted, true);
assert.equal(unsupportedAck.applied, false);

console.log("Phase 2 transition fixture passed.");
