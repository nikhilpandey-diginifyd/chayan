"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  selectIsConnectedToRoom,
  selectIsLocalAudioEnabled,
  selectIsLocalScreenShared,
  selectIsLocalVideoEnabled,
  selectLocalPeer,
  selectPeersScreenSharing,
  selectRemotePeers,
  selectScreenShareByPeerID,
  useHMSActions,
  useHMSStore,
  useVideo,
} from "@100mslive/react-sdk";
import { FormMessage } from "@/components/ui/field";
import { CallControls, canShareScreen } from "./call-controls";

function VideoTile({
  trackId,
  name,
  mirror,
  fit = "cover",
  className,
}: {
  trackId?: string;
  name: string;
  mirror?: boolean;
  fit?: "cover" | "contain";
  className?: string;
}) {
  const { videoRef } = useVideo({ trackId });
  return (
    <div
      className={`bg-ink relative overflow-hidden rounded-[var(--radius-control)] ${className ?? ""}`}
    >
      {trackId ? (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={`size-full ${fit === "cover" ? "object-cover" : "object-contain"} ${mirror ? "-scale-x-100" : ""}`}
        />
      ) : (
        <p className="grid size-full place-items-center px-4 text-center text-white/80">
          {name}
          <span className="sr-only"> (camera off)</span>
        </p>
      )}
      <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
        {name}
      </span>
    </div>
  );
}

const noop = () => () => {};

export function HmsCall({
  token,
  userName,
  otherName,
  startWithCamera,
  startWithMic,
  onLeave,
}: {
  token: string;
  userName: string;
  otherName: string;
  startWithCamera: boolean;
  startWithMic: boolean;
  onLeave: () => void;
}) {
  const actions = useHMSActions();
  const connected = useHMSStore(selectIsConnectedToRoom);
  const localPeer = useHMSStore(selectLocalPeer);
  const remotePeers = useHMSStore(selectRemotePeers);
  const micOn = useHMSStore(selectIsLocalAudioEnabled);
  const cameraOn = useHMSStore(selectIsLocalVideoEnabled);
  const sharing = useHMSStore(selectIsLocalScreenShared);
  const screenSharers = useHMSStore(selectPeersScreenSharing);
  const sharer = screenSharers[0];
  const screenTrack = useHMSStore(selectScreenShareByPeerID(sharer?.id));
  const [error, setError] = useState<string | null>(null);
  const joined = useRef(false);
  const shareSupported = useSyncExternalStore(noop, canShareScreen, () => false);

  useEffect(() => {
    if (joined.current) return;
    joined.current = true;
    actions
      .join({
        userName,
        authToken: token,
        settings: { isAudioMuted: !startWithMic, isVideoMuted: !startWithCamera },
      })
      .catch(() => setError("We couldn't connect to the call. Check your connection and rejoin."));
    return () => {
      void actions.leave();
    };
  }, [actions, token, userName, startWithCamera, startWithMic]);

  const remote = remotePeers[0];

  async function toggleShare() {
    try {
      await actions.setScreenShareEnabled(!sharing);
    } catch {
      // The person cancelled the browser's share picker.
    }
  }

  return (
    <div className="space-y-4">
      {error ? <FormMessage tone="error">{error}</FormMessage> : null}
      {!connected && !error ? <p className="text-ink-muted">Connecting…</p> : null}

      {sharer && screenTrack ? (
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <VideoTile
            trackId={screenTrack.id}
            name={`${sharer.isLocal ? "You are" : `${sharer.name} is`} sharing`}
            fit="contain"
            className="aspect-video"
          />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-1">
            <VideoTile
              trackId={remote?.videoTrack}
              name={remote?.name ?? `Waiting for ${otherName}`}
              className="aspect-video"
            />
            <VideoTile trackId={localPeer?.videoTrack} name="You" mirror className="aspect-video" />
          </div>
        </div>
      ) : (
        <div className="relative">
          <VideoTile
            trackId={remote?.videoTrack}
            name={remote ? remote.name : `Waiting for ${otherName} to join…`}
            className="aspect-video"
          />
          <VideoTile
            trackId={localPeer?.videoTrack}
            name="You"
            mirror
            className="absolute right-3 bottom-3 aspect-video w-32 border-2 border-white sm:w-48"
          />
        </div>
      )}

      <CallControls
        micOn={micOn}
        cameraOn={cameraOn}
        sharing={sharing}
        canShare={shareSupported}
        onToggleMic={() => void actions.setLocalAudioEnabled(!micOn)}
        onToggleCamera={() => void actions.setLocalVideoEnabled(!cameraOn)}
        onToggleShare={toggleShare}
        onLeave={() => {
          void actions.leave();
          onLeave();
        }}
      />
      {!shareSupported ? (
        <p className="text-ink-muted text-center text-sm">
          Screen sharing works on a computer. On a phone, share a photo from the panel instead.
        </p>
      ) : null}
    </div>
  );
}
