"use client";

import { Mic, MicOff, MonitorUp, PhoneOff, Video, VideoOff } from "lucide-react";
import { cn } from "@/lib/utils";

function ControlButton({
  label,
  active,
  danger,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  danger?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn(
        "grid size-12 place-items-center rounded-full border transition-colors",
        danger
          ? "border-omr bg-omr text-white hover:opacity-90"
          : active === false
            ? "border-omr/40 bg-omr-soft text-omr"
            : "border-line bg-surface text-ink hover:border-ink-muted",
      )}
    >
      {children}
    </button>
  );
}

export function CallControls({
  micOn,
  cameraOn,
  sharing,
  canShare,
  onToggleMic,
  onToggleCamera,
  onToggleShare,
  onLeave,
}: {
  micOn: boolean;
  cameraOn: boolean;
  sharing: boolean;
  canShare: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onToggleShare: () => void;
  onLeave: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <ControlButton
        label={micOn ? "Mute microphone" : "Unmute microphone"}
        active={micOn}
        onClick={onToggleMic}
      >
        {micOn ? (
          <Mic aria-hidden="true" className="size-5" />
        ) : (
          <MicOff aria-hidden="true" className="size-5" />
        )}
      </ControlButton>
      <ControlButton
        label={cameraOn ? "Turn camera off" : "Turn camera on"}
        active={cameraOn}
        onClick={onToggleCamera}
      >
        {cameraOn ? (
          <Video aria-hidden="true" className="size-5" />
        ) : (
          <VideoOff aria-hidden="true" className="size-5" />
        )}
      </ControlButton>
      {canShare ? (
        <ControlButton
          label={sharing ? "Stop sharing your screen" : "Share your screen"}
          active={sharing ? true : undefined}
          onClick={onToggleShare}
        >
          <MonitorUp aria-hidden="true" className="size-5" />
        </ControlButton>
      ) : null}
      <ControlButton label="Leave call" danger onClick={onLeave}>
        <PhoneOff aria-hidden="true" className="size-5" />
      </ControlButton>
    </div>
  );
}

/** Screen sharing needs getDisplayMedia, which phone browsers don't offer. */
export function canShareScreen() {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.mediaDevices?.getDisplayMedia === "function"
  );
}
