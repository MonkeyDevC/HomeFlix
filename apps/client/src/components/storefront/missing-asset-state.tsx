import { PlaybackUnavailableState } from "./playback-unavailable-state";

export function MissingAssetState({ message }: Readonly<{ message: string }>) {
  return (
    <PlaybackUnavailableState
      title="Sin video disponible"
      message={message}
    />
  );
}

