import Mux from "@mux/mux-node";
import type { ApiRuntimeConfig } from "../../env.js";

export type MuxPlaybackSigner = {
  readonly signPlaybackToken: (playbackId: string) => Promise<string>;
};

export function createMuxPlaybackSigner(
  config: ApiRuntimeConfig
): MuxPlaybackSigner | null {
  const signingKey = config.mux.jwtSigningKey;
  const privateKey = config.mux.jwtPrivateKey;

  if (signingKey === undefined || privateKey === undefined) {
    return null;
  }

  const mux = new Mux({
    jwtPrivateKey: privateKey,
    jwtSigningKey: signingKey,
    ...(config.mux.tokenId === undefined ? {} : { tokenId: config.mux.tokenId }),
    ...(config.mux.tokenSecret === undefined
      ? {}
      : { tokenSecret: config.mux.tokenSecret })
  });

  return {
    async signPlaybackToken(playbackId: string): Promise<string> {
      return mux.jwt.signPlaybackId(playbackId, {
        expiration: "1h",
        type: "video"
      });
    }
  };
}
