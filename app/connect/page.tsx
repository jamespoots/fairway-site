"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { QRCodeSVG } from "qrcode.react";
import { CONNECT_HELPER_BASE_URL } from "@/app/config/connect";

type ConnectState = "checking" | "not-found" | "found";

type StatusPayload = Record<string, unknown>;

type HelperSummary = {
  apiVersion: string;
  runtimeStartTime: string;
  gsproConnectorState: string;
  gsproAvailable: boolean;
  pairingReadiness: string;
  gsproConnected: boolean;
  gsproActive: boolean;
  shotFeedConnected: boolean;
  lastShotAt: string;
  pairingReady: boolean;
  phoneJoined: boolean;
  pairedAt: string;
  replayObservedAt: string;
  replayUpdatedAt: string;
  replayVersionKey: string;
  replayVideoUrl: string;
  sessionId: string;
};

const REQUEST_TIMEOUT_MS = 2200;
const STATUS_POLL_INTERVAL_MS = 2500;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getByPath(source: unknown, path: string): unknown {
  if (!isRecord(source)) {
    return undefined;
  }

  return path.split(".").reduce<unknown>((acc, key) => {
    if (!isRecord(acc)) {
      return undefined;
    }

    return acc[key];
  }, source);
}

function firstValue(source: unknown, paths: string[]): string {
  for (const path of paths) {
    const value = getByPath(source, path);

    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }

    if (typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }
  }

  return "Unavailable";
}

function formatStartTime(raw: string): string {
  if (raw === "Unavailable") {
    return raw;
  }

  const parsed = new Date(raw);

  if (Number.isNaN(parsed.getTime())) {
    return raw;
  }

  return parsed.toLocaleString();
}

function parseTimestamp(value: string): number | null {
  if (value.trim().length === 0 || value === "Unavailable") {
    return null;
  }

  const numericValue = Number(value);

  if (Number.isFinite(numericValue)) {
    if (numericValue > 1e12) {
      return numericValue;
    }

    if (numericValue > 1e9) {
      return numericValue * 1000;
    }
  }

  const parsedValue = Date.parse(value);

  return Number.isNaN(parsedValue) ? null : parsedValue;
}

function isFreshReplayForPairing(pairedAt: string, replayObservedAt: string): boolean {
  const pairedTimestamp = parseTimestamp(pairedAt);
  const replayTimestamp = parseTimestamp(replayObservedAt);

  if (pairedTimestamp === null || replayTimestamp === null) {
    return true;
  }

  return replayTimestamp >= pairedTimestamp;
}

function isLoopbackHost(hostname: string): boolean {
  const normalized = hostname.trim().toLowerCase();

  return normalized === "localhost" || normalized === "127.0.0.1" || normalized === "::1";
}

function resolveDesktopHost(): string | null {
  if (typeof window !== "undefined" && !isLoopbackHost(window.location.hostname)) {
    return window.location.hostname;
  }

  try {
    const helperUrl = new URL(CONNECT_HELPER_BASE_URL);

    return isLoopbackHost(helperUrl.hostname) ? null : helperUrl.hostname;
  } catch {
    return null;
  }
}

function buildPairingConfig(sessionId: string, desktopHost: string | null) {
  if (sessionId.trim().length === 0 || sessionId === "Unavailable" || !desktopHost) {
    return null;
  }

  return {
    type: "fairway-connect-pair",
    sessionId,
    helperHttpUrl: `http://${desktopHost}:30304`,
    helperWsUrl: `ws://${desktopHost}:30303`,
  };
}

function buildPairingPayload(sessionId: string, desktopHost: string | null): string | null {
  const pairingConfig = buildPairingConfig(sessionId, desktopHost);

  return pairingConfig ? JSON.stringify(pairingConfig) : null;
}

function formatDebugValue(value: string | boolean | null | undefined): string {
  if (value === null) {
    return "null";
  }

  if (value === undefined) {
    return "undefined";
  }

  return String(value);
}

function getRenderedCopyForStage(stage: string) {
  switch (stage) {
    case "checking":
      return {
        title: "Checking for helper",
        body: `Attempting to reach your local helper at ${CONNECT_HELPER_BASE_URL}.`,
      };
    case "not-found":
      return {
        title: "Helper not found",
        body: "Fairway Connect requires a small desktop helper running locally before pairing can begin.",
      };
    case "gspro-disconnected":
      return {
        title: "Fairway Connect Helper is running",
        body: "Your desktop helper is online, but the GSPro connector is not connected yet. Open GSPro and make sure the Fairway Connect integration is connected before continuing.",
      };
    case "gspro-waiting-first-shot":
      return {
        title: "Helper is running",
        body: "Waiting to verify GSPro shot feed",
      };
    case "gspro-connected":
      return {
        title: "Helper connected to GSPro",
        body: "Your desktop helper is running and GSPro is connected. Fairway is preparing the phone pairing step.",
      };
    case "pairing-ready":
      return {
        title: "Ready to connect your iPhone",
        body: "Fairway Connect Helper and GSPro are ready. Fairway on iPhone can now scan to connect.",
      };
    case "phone-joined":
      return {
        title: "iPhone connected",
        body: "Fairway on iPhone has joined this pairing session successfully.",
      };
    case "replay-ready":
      return {
        title: "Replay ready on desktop",
        body: "Fairway on iPhone is connected and the first replay is ready in the Fairway Connect dashboard.",
      };
    default:
      return {
        title: "Unknown stage",
        body: "No rendered copy selected.",
      };
  }
}

type LadderStepStatus = "complete" | "active" | "locked";

function StepCard({
  stepNumber,
  title,
  copy,
  status,
  isLast,
  children,
}: {
  stepNumber: number;
  title: string;
  copy?: string;
  status: LadderStepStatus;
  isLast: boolean;
  children?: ReactNode;
}) {
  const isCompact = status !== "active";
  const iconClassName =
    status === "complete"
      ? "border-emerald-300/40 bg-emerald-300/20 text-emerald-50"
      : status === "active"
        ? "border-sky-300/40 bg-sky-300/20 text-sky-50"
        : "border-white/15 bg-black/20 text-white/45";
  const lineClassName = status === "complete" ? "bg-emerald-200/30" : "bg-white/10";
  const cardClassName =
    status === "complete"
      ? "border-emerald-300/20 bg-emerald-300/[0.06]"
      : status === "active"
        ? "border-sky-300/30 bg-sky-300/[0.08] shadow-[0_16px_40px_rgba(14,165,233,0.10)]"
        : "border-white/10 bg-black/15";
  const badgeClassName =
    status === "complete"
      ? "border border-emerald-300/30 bg-emerald-300/15 text-emerald-50"
      : status === "active"
        ? "border border-sky-300/30 bg-sky-300/15 text-sky-50"
        : "border border-white/10 bg-white/[0.04] text-white/55";
  const statusLabel = status === "complete" ? "Complete" : status === "active" ? "Current" : "Locked";

  return (
    <div className="flex gap-3">
      <div className="flex w-7 flex-col items-center">
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold ${iconClassName}`}
        >
          {status === "complete" ? "✓" : stepNumber}
        </div>
        {!isLast && <div className={`mt-1.5 w-px flex-1 ${lineClassName}`} />}
      </div>

      <div className={`flex-1 rounded-2xl border ${isCompact ? "px-4 py-3.5" : "p-4 sm:p-5"} ${cardClassName}`}>
        <div className={`flex flex-col ${isCompact ? "gap-2 sm:flex-row sm:items-center sm:justify-between" : "gap-3 sm:flex-row sm:items-start sm:justify-between"}`}>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/45">Step {stepNumber}</p>
            <h2 className={`text-white ${isCompact ? "mt-1 text-lg font-medium" : "mt-1.5 text-xl font-semibold sm:text-2xl"}`}>{title}</h2>
            {copy ? (
              <p className={`max-w-2xl text-white/72 ${isCompact ? "mt-1 text-sm" : "mt-2.5 text-sm"}`}>{copy}</p>
            ) : null}
          </div>

          <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${badgeClassName}`}>
            {statusLabel}
          </span>
        </div>

        {children ? <div className={isCompact ? "mt-3" : "mt-4"}>{children}</div> : null}
      </div>
    </div>
  );
}

function QrPanel({
  title,
  description,
  label,
  minHeightClassName,
  qrValue,
}: {
  title: string;
  description?: string;
  label?: string;
  minHeightClassName: string;
  qrValue?: string | null;
}) {
  return (
    <div
      className={`flex ${minHeightClassName} items-center justify-center rounded-3xl border border-white/15 bg-white/[0.04] p-6 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]`}
    >
      <div>
        {label ? <p className="text-sm uppercase tracking-[0.2em] text-white/45">{label}</p> : null}
        {qrValue ? (
          <div className="mx-auto mt-3 flex h-44 w-44 items-center justify-center rounded-2xl bg-white p-3 shadow-[0_10px_24px_rgba(0,0,0,0.24)]">
            <QRCodeSVG value={qrValue} size={152} bgColor="#ffffff" fgColor="#111111" includeMargin />
          </div>
        ) : (
          <div className="mx-auto mt-3 flex h-44 w-44 items-center justify-center rounded-2xl border border-dashed border-white/20 bg-black/25">
            <span className="text-sm text-white/60">{title}</span>
          </div>
        )}
        {description ? <p className="mx-auto mt-4 max-w-sm text-sm text-white/65">{description}</p> : null}
      </div>
    </div>
  );
}

async function fetchJsonWithTimeout(url: string, timeoutMs: number): Promise<unknown> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    return response.json();
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function summarize(health: unknown, status: unknown): HelperSummary {
  const statusRecord = isRecord(status) ? status : null;
  const connectors = isRecord(statusRecord?.connectors) ? statusRecord.connectors : null;
  const gspro = isRecord(connectors?.gspro) ? connectors.gspro : null;
  const pairing = isRecord(statusRecord?.pairing) ? statusRecord.pairing : null;

  const apiVersion =
    typeof statusRecord?.apiVersion === "string" && statusRecord.apiVersion.trim().length > 0
      ? statusRecord.apiVersion
      : firstValue(status, ["api.version", "version"]);
  const runtimeStartTime = formatStartTime(
    typeof statusRecord?.runtimeStartedAt === "string" &&
      statusRecord.runtimeStartedAt.trim().length > 0
      ? statusRecord.runtimeStartedAt
      : firstValue(status, [
          "runtime.startTime",
          "runtime.startedAt",
          "startedAt",
          "startTime",
          "uptime.startedAt",
        ])
  );
  const gsproConnectorState =
    typeof gspro?.state === "string" && gspro.state.trim().length > 0
      ? gspro.state
      : firstValue(status, ["connectors.gspro.state", "gspro.connector.state", "gspro.state"]);
  const gsproAvailable =
    typeof gspro?.available === "boolean"
      ? gspro.available
      : false;
  const lastShotAt = firstValue(status, ["connectors.gspro.lastShotAt", "gspro.lastShotAt"]);
  const pairingReadiness =
    typeof pairing?.ready === "boolean"
      ? String(pairing.ready)
      : firstValue(status, ["pairing.readiness", "pairing.ready", "pairing.isReady", "ready"]);
  // Trust the helper's explicit GSPro boolean and fail closed when it is missing.
  const gsproConnected =
    typeof gspro?.connected === "boolean"
      ? gspro.connected
      : false;
  const pairingReady =
    typeof pairing?.ready === "boolean"
      ? pairing.ready
      : false;
  const gsproActive =
    gsproConnected && typeof gspro?.active === "boolean"
      ? gspro.active
      : false;
  const shotFeedConnected =
    gsproConnected && typeof gspro?.shotFeedConnected === "boolean"
      ? gspro.shotFeedConnected
      : false;
  const sessionId =
    typeof pairing?.sessionId === "string" && pairing.sessionId.trim().length > 0
      ? pairing.sessionId
      : firstValue(status, ["pairing.sessionId", "sessionId", "session.id", "activeSessionId"]);

  return {
    apiVersion,
    runtimeStartTime,
    gsproConnectorState,
    gsproAvailable,
    pairingReadiness,
    gsproConnected,
    gsproActive,
    shotFeedConnected,
    lastShotAt,
    pairingReady,
    phoneJoined: false,
    pairedAt: "Unavailable",
    replayObservedAt: "Unavailable",
    replayUpdatedAt: "Unavailable",
    replayVersionKey: "Unavailable",
    replayVideoUrl: "Unavailable",
    sessionId,
  };
}

export default function ConnectPage() {
  const [state, setState] = useState<ConnectState>("checking");
  const [summary, setSummary] = useState<HelperSummary | null>(null);
  const hasRedirectedToDashboardRef = useRef(false);

  const healthUrl = useMemo(() => `${CONNECT_HELPER_BASE_URL}/health`, []);
  const statusUrl = useMemo(() => `${CONNECT_HELPER_BASE_URL}/status`, []);
  const stage = useMemo(() => {
    if (state !== "found" || !summary) {
      return state;
    }

    if (!summary.gsproConnected) {
      return "gspro-disconnected";
    }

    if (!summary.gsproActive) {
      return "gspro-waiting-first-shot";
    }

    if (!summary.pairingReady) {
      return "gspro-connected";
    }

    // A replay from earlier in the same session must not unlock replay-ready for a new pairing.
    if (
      summary.phoneJoined &&
      summary.replayVideoUrl !== "Unavailable" &&
      isFreshReplayForPairing(summary.pairedAt, summary.replayObservedAt)
    ) {
      return "replay-ready";
    }

    if (summary.phoneJoined) {
      return "phone-joined";
    }

    return "pairing-ready";
  }, [state, summary]);
  const desktopHost = useMemo(() => resolveDesktopHost(), []);
  const pairingConfig = useMemo(
    () => buildPairingConfig(summary?.sessionId ?? "", desktopHost),
    [desktopHost, summary?.sessionId]
  );
  const helperDashboardUrl = useMemo(
    () => (desktopHost ? `http://${desktopHost}:30304/` : null),
    [desktopHost]
  );
  const pairingQrValue = useMemo(() => {
    if (state !== "found" || !summary?.gsproConnected || !summary.pairingReady) {
      return null;
    }

    return buildPairingPayload(summary.sessionId, desktopHost);
  }, [desktopHost, state, summary]);
  const helperDetected = state === "found";
  const qrPayloadAvailable = pairingQrValue !== null;
  const shouldRenderQr = stage === "pairing-ready" && qrPayloadAvailable;
  const helperRunning = state === "found";
  const gsproShotFeedVerified = summary?.gsproActive === true;
  const iphoneConnected = summary?.phoneJoined === true;
  const replayReceived = stage === "replay-ready";
  const currentStepIndex = !helperRunning
    ? 0
    : !gsproShotFeedVerified
      ? 1
      : !iphoneConnected
        ? 2
        : 3;
  const helperStepCopy = undefined;
  const helperStepTitle = helperRunning ? "Fairway Connect is running" : "Start Fairway Connect";
  const gsproStepTitle = gsproShotFeedVerified
    ? "GSPro shot feed verified"
    : "Take one shot in GSPro";
  const gsproStepCopy = undefined;
  const iphoneStepTitle = iphoneConnected ? "iPhone connected" : "Connect your iPhone";
  const iphoneStepCopy = undefined;
  const replayStepTitle = replayReceived
    ? "Send first replay"
    : "Record a shot with Fairway on your iPhone";
  const replayStepCopy = replayReceived
    ? "First replay received"
    : undefined;

  useEffect(() => {
    const renderedCopy = getRenderedCopyForStage(stage);

    console.log("[/connect] rendered path", {
      rawHelperState: state,
      helperDetected,
      gsproAvailable: summary?.gsproAvailable ?? null,
      gsproConnected: summary?.gsproConnected ?? null,
      gsproActive: summary?.gsproActive ?? null,
      shotFeedConnected: summary?.shotFeedConnected ?? null,
      selectedStage: stage,
      selectedTitle: renderedCopy.title,
      selectedBody: renderedCopy.body,
    });
  }, [helperDetected, stage, state, summary]);

  useEffect(() => {
    if (!replayReceived || !helperDashboardUrl || hasRedirectedToDashboardRef.current) {
      return;
    }

    hasRedirectedToDashboardRef.current = true;
    window.location.href = helperDashboardUrl;
  }, [helperDashboardUrl, replayReceived]);

  useEffect(() => {
    let isActive = true;
    let pollingId: number | null = null;

    async function refreshHelper(showCheckingState: boolean): Promise<void> {
      if (showCheckingState) {
        setState("checking");
      }

      try {
        const health = await fetchJsonWithTimeout(healthUrl, REQUEST_TIMEOUT_MS);
        const status = await fetchJsonWithTimeout(statusUrl, REQUEST_TIMEOUT_MS);

        if (!isActive) {
          return;
        }

        console.log("[/connect] raw helper status payload", status);

        const statusRecord = isRecord(status) ? status : null;
        const connectors = isRecord(statusRecord?.connectors) ? statusRecord.connectors : null;
        const gsproStatus = isRecord(connectors?.gspro) ? connectors.gspro : null;
        const nextSummary = summarize(health, status);

        if (nextSummary.sessionId !== "Unavailable") {
          try {
            const latestReplay = await fetchJsonWithTimeout(
              `${CONNECT_HELPER_BASE_URL}/api/sessions/${encodeURIComponent(nextSummary.sessionId)}/latest-replay`,
              REQUEST_TIMEOUT_MS
            );

            if (isActive && isRecord(latestReplay) && typeof latestReplay.phoneJoined === "boolean") {
              nextSummary.phoneJoined = latestReplay.phoneJoined;
            }

            const replay = isRecord(latestReplay) && isRecord(latestReplay.replay) ? latestReplay.replay : null;
            const latestReplayRecord = isRecord(latestReplay) ? latestReplay : null;
            const replayVideoUrl =
              typeof replay?.videoUrl === "string" && replay.videoUrl.trim().length > 0
                ? replay.videoUrl
                : "Unavailable";
            const replayUpdatedAt =
              typeof replay?.updatedAt === "string" && replay.updatedAt.trim().length > 0
                ? replay.updatedAt
                : "Unavailable";
            const pairedAt =
              typeof latestReplayRecord?.pairedAt === "string" && latestReplayRecord.pairedAt.trim().length > 0
                ? latestReplayRecord.pairedAt
                : "Unavailable";
            const lastReplayAt =
              typeof latestReplayRecord?.lastReplayAt === "string" && latestReplayRecord.lastReplayAt.trim().length > 0
                ? latestReplayRecord.lastReplayAt
                : "Unavailable";
            const replayObservedAt =
              replayUpdatedAt !== "Unavailable" ? replayUpdatedAt : lastReplayAt;

            nextSummary.replayVideoUrl = replayVideoUrl;
            nextSummary.pairedAt = pairedAt;
            nextSummary.replayObservedAt = replayObservedAt;
            nextSummary.replayUpdatedAt = replayUpdatedAt;
            nextSummary.replayVersionKey =
              replayUpdatedAt !== "Unavailable" ? replayUpdatedAt : replayVideoUrl;

            console.log("[/connect] latest replay state", {
              sessionId: nextSummary.sessionId,
              phoneJoined: nextSummary.phoneJoined,
              pairedAt,
              lastReplayAt,
              replay,
              replayVideoUrl,
              replayUpdatedAt,
            });
          } catch {
            nextSummary.phoneJoined = false;
            nextSummary.pairedAt = "Unavailable";
            nextSummary.replayObservedAt = "Unavailable";
            nextSummary.replayUpdatedAt = "Unavailable";
            nextSummary.replayVersionKey = "Unavailable";
            nextSummary.replayVideoUrl = "Unavailable";
          }
        }

        setSummary(nextSummary);
        setState("found");

        const derivedStage =
          !nextSummary.gsproConnected
            ? "gspro-disconnected"
            : !nextSummary.gsproActive
              ? "gspro-waiting-first-shot"
              : !nextSummary.pairingReady
                ? "gspro-connected"
                : nextSummary.phoneJoined && nextSummary.replayVideoUrl !== "Unavailable"
                  ? isFreshReplayForPairing(nextSummary.pairedAt, nextSummary.replayObservedAt)
                    ? "replay-ready"
                    : "phone-joined"
                  : nextSummary.phoneJoined
                    ? "phone-joined"
                    : "pairing-ready";

        console.log("[/connect] derived stage", {
          sessionId: nextSummary.sessionId,
          phoneJoined: nextSummary.phoneJoined,
          pairedAt: nextSummary.pairedAt,
          replayObservedAt: nextSummary.replayObservedAt,
          replayVideoUrl: nextSummary.replayVideoUrl,
          derivedStage,
        });

        console.log("[/connect] helper and gspro state", {
          helperState: "found",
          gsproAvailable:
            typeof gsproStatus?.available === "boolean" ? gsproStatus.available : "missing",
          gsproConnected:
            typeof gsproStatus?.connected === "boolean" ? gsproStatus.connected : "missing",
          gsproActive:
            typeof gsproStatus?.active === "boolean" ? gsproStatus.active : "missing",
          shotFeedConnected:
            typeof gsproStatus?.shotFeedConnected === "boolean"
              ? gsproStatus.shotFeedConnected
              : "missing",
          selectedStage: derivedStage,
        });
      } catch {
        if (!isActive) {
          return;
        }

        setSummary(null);
        setState("not-found");
      }
    }

    void refreshHelper(true);

    pollingId = window.setInterval(() => {
      void refreshHelper(false);
    }, STATUS_POLL_INTERVAL_MS);

    return () => {
      isActive = false;
      if (pollingId !== null) {
        window.clearInterval(pollingId);
      }
    };
  }, [healthUrl, statusUrl]);

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto w-full max-w-3xl">
        <header className="mb-5 text-center">
          <h1
            className="text-[clamp(2rem,5vw,3rem)] tracking-tight"
            style={{ fontFamily: '"Times New Roman", Times, serif' }}
          >
            Fairway Connect
          </h1>
        </header>

        <section className="rounded-2xl border border-white/15 bg-white/[0.03] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <div className="space-y-8">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-white/50">Setup flow</p>
              <div className="mt-3 space-y-3">
                <StepCard
                  stepNumber={1}
                  title={helperStepTitle}
                  copy={helperStepCopy}
                  status={currentStepIndex === 0 ? "active" : helperRunning ? "complete" : "locked"}
                  isLast={false}
                >
                  {currentStepIndex === 0 ? (
                    <div className="space-y-4">
                      {state === "checking" && (
                        <p className="text-sm text-white/65">
                          Checking for Fairway Connect at {CONNECT_HELPER_BASE_URL}.
                        </p>
                      )}

                      {state === "not-found" && (
                        <div className="space-y-4">
                          <button
                            type="button"
                            className="rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/15"
                          >
                            Download (Coming Soon)
                          </button>

                          <ol className="list-decimal space-y-2 pl-5 text-white/72">
                            <li>Download Fairway Connect</li>
                            <li>Open Fairway Connect on your computer</li>
                            <li>Return to this page</li>
                          </ol>
                        </div>
                      )}
                    </div>
                  ) : null}
                </StepCard>

                <StepCard
                  stepNumber={2}
                  title={gsproStepTitle}
                  copy={gsproStepCopy}
                  status={currentStepIndex === 1 ? "active" : gsproShotFeedVerified ? "complete" : "locked"}
                  isLast={false}
                />

                <StepCard
                  stepNumber={3}
                  title={iphoneStepTitle}
                  copy={iphoneStepCopy}
                  status={currentStepIndex === 2 ? "active" : iphoneConnected ? "complete" : "locked"}
                  isLast={false}
                >
                  {currentStepIndex === 2 ? (
                    <QrPanel
                      minHeightClassName="min-h-64"
                      qrValue={pairingQrValue}
                      title="QR code coming soon"
                    />
                  ) : null}
                </StepCard>

                <StepCard
                  stepNumber={4}
                  title={replayStepTitle}
                  copy={replayStepCopy}
                  status={currentStepIndex === 3 ? "active" : replayReceived ? "complete" : "locked"}
                  isLast={true}
                />
              </div>
            </div>

            {state === "found" && summary && (
              <>
                <div className="border border-white/10 bg-black/20 p-4 text-left text-xs text-white/65">
                <p>QR debug</p>
                <dl className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div>
                    <dt className="text-white/40">helperDetected</dt>
                    <dd>{formatDebugValue(helperDetected)}</dd>
                  </div>
                  <div>
                    <dt className="text-white/40">gsproConnected</dt>
                    <dd>{formatDebugValue(summary.gsproConnected)}</dd>
                  </div>
                  <div>
                    <dt className="text-white/40">pairingReady</dt>
                    <dd>{formatDebugValue(summary.pairingReady)}</dd>
                  </div>
                  <div>
                    <dt className="text-white/40">sessionId</dt>
                    <dd className="break-all">{formatDebugValue(summary.sessionId)}</dd>
                  </div>
                  <div>
                    <dt className="text-white/40">desktopHost</dt>
                    <dd>{formatDebugValue(desktopHost)}</dd>
                  </div>
                  <div>
                    <dt className="text-white/40">helperHttpUrl</dt>
                    <dd className="break-all">{formatDebugValue(pairingConfig?.helperHttpUrl)}</dd>
                  </div>
                  <div>
                    <dt className="text-white/40">helperWsUrl</dt>
                    <dd className="break-all">{formatDebugValue(pairingConfig?.helperWsUrl)}</dd>
                  </div>
                  <div>
                    <dt className="text-white/40">qrPayloadAvailable</dt>
                    <dd>{formatDebugValue(qrPayloadAvailable)}</dd>
                  </div>
                  <div>
                    <dt className="text-white/40">shouldRenderQr</dt>
                    <dd>{formatDebugValue(shouldRenderQr)}</dd>
                  </div>
                </dl>
                </div>

                <div className="rounded-2xl border border-amber-300/30 bg-amber-300/10 p-4 text-left text-sm text-amber-50">
                  <p className="text-xs uppercase tracking-[0.2em] text-amber-100/80">DEBUG CONNECT STATE</p>
                  <dl className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div>
                      <dt className="text-amber-100/60">helperDetected</dt>
                      <dd>{formatDebugValue(helperDetected)}</dd>
                    </div>
                    <div>
                      <dt className="text-amber-100/60">raw helper state</dt>
                      <dd>{state}</dd>
                    </div>
                    <div>
                      <dt className="text-amber-100/60">gsproAvailable</dt>
                      <dd>{formatDebugValue(summary.gsproAvailable)}</dd>
                    </div>
                    <div>
                      <dt className="text-amber-100/60">gsproConnected</dt>
                      <dd>{formatDebugValue(summary.gsproConnected)}</dd>
                    </div>
                    <div>
                      <dt className="text-amber-100/60">gsproActive</dt>
                      <dd>{formatDebugValue(summary.gsproActive)}</dd>
                    </div>
                    <div>
                      <dt className="text-amber-100/60">shotFeedConnected</dt>
                      <dd>{formatDebugValue(summary.shotFeedConnected)}</dd>
                    </div>
                    <div>
                      <dt className="text-amber-100/60">selectedStage</dt>
                      <dd>{stage}</dd>
                    </div>
                  </dl>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/45">Helper details</p>
                  <dl className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
                    <div>
                      <dt className="text-white/45">API version</dt>
                      <dd className="mt-1 text-white/80">{summary.apiVersion}</dd>
                    </div>
                    <div>
                      <dt className="text-white/45">Runtime start time</dt>
                      <dd className="mt-1 text-white/80">{summary.runtimeStartTime}</dd>
                    </div>
                    <div>
                      <dt className="text-white/45">Session ID</dt>
                      <dd className="mt-1 break-all text-white/80">{summary.sessionId}</dd>
                    </div>
                  </dl>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
