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
  const statusLabel = status === "complete" ? "Complete" : status === "active" ? "Current" : "Pending";

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
    <main className="h-[calc(100dvh-9.5rem)] px-6 pt-6 pb-2 overflow-hidden">
      <div className="mx-auto flex h-full w-full max-w-3xl flex-col">
        <header className="mb-4 shrink-0 text-center">
          <h1
            className="text-[clamp(2rem,5vw,3rem)] tracking-tight"
            style={{ fontFamily: '"Times New Roman", Times, serif' }}
          >
            Fairway Connect
          </h1>
        </header>

        <section className="min-h-0 flex-1 rounded-2xl border border-white/15 bg-white/[0.03] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <div className="h-full overflow-y-auto pr-1">
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
          </div>
        </section>
      </div>
    </main>
  );
}
