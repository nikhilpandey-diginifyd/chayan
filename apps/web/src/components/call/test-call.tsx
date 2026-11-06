"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { FormMessage } from "@/components/ui/field";
import { CallControls, canShareScreen } from "./call-controls";

const noop = () => () => {};

/**
 * Local stand-in for the video call when 100ms keys aren't set. It uses your
 * own camera and screen so you can test the page, attendance and file sharing.
 * The other person can't see or hear you in this mode.
 */
export function TestCall({
  otherName,
  startWithCamera,
  onLeave,
}: {
  otherName: string;
  startWithCamera: boolean;
  onLeave: () => void;
}) {
  const [cameraOn, setCameraOn] = useState(startWithCamera);
  const [micOn, setMicOn] = useState(true);
  const [sharing, setSharing] = useState(false);
  const cameraRef = useRef<HTMLVideoElement>(null);
  const screenRef = useRef<HTMLVideoElement>(null);
  const streams = useRef<{ camera?: MediaStream; screen?: MediaStream }>({});
  const shareSupported = useSyncExternalStore(noop, canShareScreen, () => false);

  useEffect(() => {
    if (!cameraOn) {
      streams.current.camera?.getTracks().forEach((track) => track.stop());
      streams.current.camera = undefined;
      return;
    }
    let cancelled = false;
    navigator.mediaDevices
      ?.getUserMedia({ video: true })
      .then((stream) => {
        if (cancelled) return stream.getTracks().forEach((track) => track.stop());
        streams.current.camera = stream;
        if (cameraRef.current) cameraRef.current.srcObject = stream;
      })
      .catch(() => setCameraOn(false));
    return () => {
      cancelled = true;
    };
  }, [cameraOn]);

  useEffect(
    () => () => {
      streams.current.camera?.getTracks().forEach((track) => track.stop());
      streams.current.screen?.getTracks().forEach((track) => track.stop());
    },
    [],
  );

  async function toggleShare() {
    if (sharing) {
      streams.current.screen?.getTracks().forEach((track) => track.stop());
      streams.current.screen = undefined;
      setSharing(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      streams.current.screen = stream;
      stream.getVideoTracks()[0]?.addEventListener("ended", () => setSharing(false));
      setSharing(true);
      requestAnimationFrame(() => {
        if (screenRef.current) screenRef.current.srcObject = stream;
      });
    } catch {
      // Cancelled by the person.
    }
  }

  return (
    <div className="space-y-4">
      <FormMessage tone="info">
        <strong>Test call.</strong> 100ms keys aren&apos;t set, so {otherName} can&apos;t see or
        hear you. Attendance and file sharing still work.
      </FormMessage>
      <div className="relative">
        {sharing ? (
          <video
            ref={screenRef}
            autoPlay
            muted
            playsInline
            className="bg-ink aspect-video w-full rounded-[var(--radius-control)] object-contain"
          />
        ) : (
          <p className="bg-ink grid aspect-video place-items-center rounded-[var(--radius-control)] text-white/80">
            {otherName} appears here in a real call
          </p>
        )}
        <div className="bg-ink absolute right-3 bottom-3 aspect-video w-32 overflow-hidden rounded-[var(--radius-control)] border-2 border-white sm:w-48">
          {cameraOn ? (
            <video
              ref={cameraRef}
              autoPlay
              muted
              playsInline
              className="size-full -scale-x-100 object-cover"
            />
          ) : (
            <p className="grid size-full place-items-center text-xs text-white/80">Camera off</p>
          )}
        </div>
      </div>
      <CallControls
        micOn={micOn}
        cameraOn={cameraOn}
        sharing={sharing}
        canShare={shareSupported}
        onToggleMic={() => setMicOn(!micOn)}
        onToggleCamera={() => setCameraOn(!cameraOn)}
        onToggleShare={toggleShare}
        onLeave={onLeave}
      />
    </div>
  );
}
