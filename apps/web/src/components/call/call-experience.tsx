"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { HMSRoomProvider } from "@100mslive/react-sdk";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/field";
import { CallClock } from "./call-clock";
import { HmsCall } from "./hms-call";
import { SessionFiles } from "./session-files";
import { TestCall } from "./test-call";

type JoinResult =
  | { mode: "hms"; token: string; userName: string; role: string }
  | { mode: "test"; userName: string; role: string };

export type CallProps = {
  bookingId: string;
  role: "mentor" | "aspirant";
  otherName: string;
  startsAt: string;
  endsAt: string;
  closesAt: string;
  note: string | null;
};

function usePresenceHeartbeat(bookingId: string, active: boolean) {
  useEffect(() => {
    if (!active) return;
    const beat = () =>
      fetch(`/api/sessions/${bookingId}/presence`, { method: "POST", keepalive: true }).catch(
        () => {},
      );
    beat();
    const timer = setInterval(beat, 30_000);
    return () => clearInterval(timer);
  }, [bookingId, active]);
}

export function CallExperience(props: CallProps) {
  const [joinState, setJoinState] = useState<"setup" | "joining" | "in_call" | "left">("setup");
  const [join, setJoin] = useState<JoinResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const previewRef = useRef<HTMLVideoElement>(null);
  const previewStream = useRef<MediaStream | null>(null);

  usePresenceHeartbeat(props.bookingId, joinState === "in_call");

  const stopPreview = useCallback(() => {
    previewStream.current?.getTracks().forEach((track) => track.stop());
    previewStream.current = null;
  }, []);

  useEffect(() => {
    if (joinState !== "setup" || !cameraOn) {
      stopPreview();
      return;
    }
    let cancelled = false;
    navigator.mediaDevices
      ?.getUserMedia({ video: true, audio: false })
      .then((stream) => {
        if (cancelled) return stream.getTracks().forEach((track) => track.stop());
        previewStream.current = stream;
        if (previewRef.current) previewRef.current.srcObject = stream;
      })
      .catch(() => setError("We can't reach your camera. You can still join with it off."));
    return () => {
      cancelled = true;
      stopPreview();
    };
  }, [cameraOn, joinState, stopPreview]);

  async function joinCall() {
    setError(null);
    setJoinState("joining");
    stopPreview();
    const response = await fetch(`/api/sessions/${props.bookingId}/join`, { method: "POST" }).catch(
      () => null,
    );
    const data = (await response?.json().catch(() => null)) as
      (JoinResult & { error?: string }) | null;
    if (!response?.ok || !data || data.error) {
      setError(data?.error ?? "We couldn't start the call. Check your connection and try again.");
      setJoinState("setup");
      return;
    }
    setJoin(data);
    setJoinState("in_call");
  }

  const leave = useCallback(() => setJoinState("left"), []);

  if (joinState === "left") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-3xl font-extrabold">You left the call</h1>
        <p className="text-ink-muted mt-3">You can rejoin until the session time is over.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Button type="button" onClick={() => setJoinState("setup")}>
            Rejoin
          </Button>
          <Link
            href={`/bookings/${props.bookingId}`}
            className="text-pen inline-flex h-11 items-center px-4 font-semibold"
          >
            Back to the booking
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Session with {props.otherName}</h1>
          <CallClock startsAt={props.startsAt} endsAt={props.endsAt} closesAt={props.closesAt} />
        </div>
        <Link href={`/bookings/${props.bookingId}`} className="text-pen text-sm font-semibold">
          Booking details
        </Link>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          {joinState === "in_call" && join?.mode === "hms" ? (
            <HMSRoomProvider>
              <HmsCall
                token={join.token}
                userName={join.userName}
                otherName={props.otherName}
                startWithCamera={cameraOn}
                startWithMic={micOn}
                onLeave={leave}
              />
            </HMSRoomProvider>
          ) : joinState === "in_call" && join?.mode === "test" ? (
            <TestCall otherName={props.otherName} startWithCamera={cameraOn} onLeave={leave} />
          ) : (
            <div className="border-line bg-surface panel rounded-[var(--radius-panel)] border p-5 sm:p-6">
              <div className="bg-ink relative aspect-video overflow-hidden rounded-[var(--radius-control)]">
                {cameraOn ? (
                  <video
                    ref={previewRef}
                    autoPlay
                    muted
                    playsInline
                    className="size-full -scale-x-100 object-cover"
                  />
                ) : (
                  <p className="grid size-full place-items-center text-white/80">Camera is off</p>
                )}
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={cameraOn}
                    onChange={(event) => setCameraOn(event.target.checked)}
                    className="accent-pen size-4"
                  />
                  Camera on
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={micOn}
                    onChange={(event) => setMicOn(event.target.checked)}
                    className="accent-pen size-4"
                  />
                  Microphone on
                </label>
                <Button
                  type="button"
                  onClick={joinCall}
                  disabled={joinState === "joining"}
                  className="ml-auto"
                >
                  {joinState === "joining" ? "Joining…" : "Join call"}
                </Button>
              </div>
              {error ? (
                <div className="mt-4">
                  <FormMessage tone="error">{error}</FormMessage>
                </div>
              ) : null}
            </div>
          )}
        </div>

        <aside className="space-y-5">
          {props.note ? (
            <section className="border-line bg-surface panel rounded-[var(--radius-panel)] border p-4">
              <h2 className="text-sm font-semibold">
                {props.role === "mentor" ? "What they want help with" : "Your note"}
              </h2>
              <p className="text-ink-muted mt-1 text-sm whitespace-pre-line">{props.note}</p>
            </section>
          ) : null}
          <SessionFiles bookingId={props.bookingId} />
        </aside>
      </div>
    </div>
  );
}
