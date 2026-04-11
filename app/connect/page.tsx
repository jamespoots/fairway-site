"use client";

import { useEffect, useMemo, useState } from "react";
import { CONNECT_HELPER_BASE_URL } from "@/app/config/connect";

type ConnectState = "checking" | "not-found" | "found";

type StatusPayload = Record<string, unknown>;

type HelperSummary = {
  apiVersion: string;
  runtimeStartTime: string;
  gsproConnectorState: string;
  pairingReadiness: string;
  gsproConnected: boolean;
  gsproActive: boolean;
  lastShotAt: string;
  pairingReady: boolean;
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

function QrPlaceholderSection({
  title,
  description,
  label = "QR placeholder",
  minHeightClassName,
}: {
  title: string;
  description: string;
  label?: string;
  minHeightClassName: string;
}) {
  return (
    <div
      className={`flex ${minHeightClassName} items-center justify-center rounded-3xl border border-white/15 bg-white/[0.04] p-8 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]`}
    >
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-white/45">{label}</p>
        <div className="mx-auto mt-5 flex h-48 w-48 items-center justify-center rounded-2xl border border-dashed border-white/20 bg-black/25">
          <span className="text-sm text-white/60">{title}</span>
        </div>
        <p className="mx-auto mt-5 max-w-sm text-sm text-white/65">{description}</p>
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
  const gsproActive =
    typeof gspro?.active === "boolean"
      ? gspro.active
      : firstValue(status, ["connectors.gspro.active"]).toLowerCase() === "true";
  const lastShotAt = firstValue(status, ["connectors.gspro.lastShotAt", "gspro.lastShotAt"]);
  const pairingReadiness =
    typeof pairing?.ready === "boolean"
      ? String(pairing.ready)
      : firstValue(status, ["pairing.readiness", "pairing.ready", "pairing.isReady", "ready"]);
  const gsproConnected =
    typeof gspro?.connected === "boolean"
      ? gspro.connected
      : gsproConnectorState.toLowerCase() === "connected";
  const pairingReady =
    typeof pairing?.ready === "boolean"
      ? pairing.ready
      : pairingReadiness.toLowerCase() === "true";
  const sessionId =
    typeof pairing?.sessionId === "string" && pairing.sessionId.trim().length > 0
      ? pairing.sessionId
      : firstValue(status, ["pairing.sessionId", "sessionId", "session.id", "activeSessionId"]);

  return {
    apiVersion,
    runtimeStartTime,
    gsproConnectorState,
    pairingReadiness,
    gsproConnected,
    gsproActive,
    lastShotAt,
    pairingReady,
    sessionId,
  };
}

export default function ConnectPage() {
  const [state, setState] = useState<ConnectState>("checking");
  const [summary, setSummary] = useState<HelperSummary | null>(null);

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

    return "pairing-ready";
  }, [state, summary]);

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

        setSummary(summarize(health, status));
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
    <main className="min-h-screen px-6 py-16">
      <div className="mx-auto w-full max-w-3xl">
        <header className="mb-10 text-center">
          <h1
            className="text-[clamp(2rem,5vw,3rem)] tracking-tight"
            style={{ fontFamily: '"Times New Roman", Times, serif' }}
          >
            Fairway Connect
          </h1>
          <p className="mt-3 text-white/70">
            Securely checks your local Fairway desktop helper to prepare pairing.
          </p>
        </header>

        <section className="rounded-2xl border border-white/15 bg-white/[0.03] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          {state === "checking" && (
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-white/50">State</p>
              <h2 className="mt-2 text-2xl font-semibold">Checking for helper</h2>
              <p className="mt-3 text-white/70">
                Attempting to reach your local helper at {CONNECT_HELPER_BASE_URL}.
              </p>
            </div>
          )}

          {state === "not-found" && (
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-white/50">State</p>
              <h2 className="mt-2 text-2xl font-semibold">Helper not found</h2>
              <p className="mt-3 text-white/80">
                Fairway Connect requires a small desktop helper running locally before
                pairing can begin.
              </p>

              <button
                type="button"
                className="mt-6 rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/15"
              >
                Download Helper (Coming Soon)
              </button>

              <ol className="mt-6 list-decimal space-y-2 pl-5 text-white/75">
                <li>Download the helper</li>
                <li>Open the helper on desktop</li>
                <li>Return to this page</li>
              </ol>
            </div>
          )}

          {state === "found" && summary && (
            <div className="space-y-8">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-white/50">Connection status</p>

                {stage === "gspro-disconnected" && (
                  <div className="mt-3 space-y-5">
                    <div>
                      <h2 className="text-2xl font-semibold text-white">Fairway Connect Helper is running</h2>
                      <p className="mt-3 max-w-2xl text-white/75">
                        Your desktop helper is online, but the GSPro connector is not connected yet.
                        Open GSPro and make sure the Fairway Connect integration is connected before
                        continuing.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-amber-400/25 bg-amber-300/10 p-5">
                      <p className="text-sm uppercase tracking-[0.2em] text-amber-100/80">Next step</p>
                      <p className="mt-3 text-lg font-medium text-amber-50">
                        Open GSPro and connect the GSPro connector.
                      </p>
                      <p className="mt-2 text-sm text-amber-100/75">
                        Once GSPro is connected, this page will advance automatically.
                      </p>
                    </div>
                  </div>
                )}

                {stage === "gspro-waiting-first-shot" && (
                  <div className="mt-3 space-y-5">
                    <div>
                      <h2 className="text-2xl font-semibold text-white">GSPro connected</h2>
                      <p className="mt-3 max-w-2xl text-white/75">
                        GSPro connected. Waiting for first shot.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-sky-300/25 bg-sky-300/10 p-5">
                      <p className="text-sm uppercase tracking-[0.2em] text-sky-100/80">Status</p>
                      <p className="mt-3 text-lg font-medium text-sky-50">
                        The connector is online and will advance after the first shot is detected.
                      </p>
                    </div>

                    <QrPlaceholderSection
                      label="QR area"
                      minHeightClassName="min-h-72"
                      title="QR code coming soon"
                      description="This reserved panel will display the production pairing QR when generation is enabled."
                    />
                  </div>
                )}

                {stage === "gspro-connected" && (
                  <div className="mt-3 space-y-5">
                    <div>
                      <h2 className="text-2xl font-semibold text-white">Helper connected to GSPro</h2>
                      <p className="mt-3 max-w-2xl text-white/75">
                        Your desktop helper is running and GSPro is connected. Fairway is preparing the
                        phone pairing step.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-emerald-400/25 bg-emerald-300/10 p-5">
                      <p className="text-sm uppercase tracking-[0.2em] text-emerald-100/80">Ready state</p>
                      <p className="mt-3 text-lg font-medium text-emerald-50">
                        Connection looks healthy. QR pairing will appear here when ready.
                      </p>
                    </div>

                    <QrPlaceholderSection
                      label="QR area"
                      minHeightClassName="min-h-72"
                      title="QR code coming soon"
                      description="This reserved panel will display the production pairing QR when generation is enabled."
                    />
                  </div>
                )}

                {stage === "pairing-ready" && (
                  <div className="mt-3 space-y-5">
                    <div>
                      <h2 className="text-2xl font-semibold text-white">Ready to connect your iPhone</h2>
                      <p className="mt-3 max-w-2xl text-white/75">
                        Fairway Connect Helper and GSPro are ready. Fairway on iPhone can now scan to
                        connect.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-emerald-300/30 bg-emerald-300/10 p-5">
                      <p className="text-sm uppercase tracking-[0.2em] text-emerald-100/80">Pairing ready</p>
                      <p className="mt-3 text-lg font-medium text-emerald-50">
                        Fairway on iPhone can now scan to connect.
                      </p>
                    </div>

                    <QrPlaceholderSection
                      minHeightClassName="min-h-80"
                      title="QR code coming soon"
                      description="This reserved panel will display the production pairing QR when generation is enabled."
                    />
                  </div>
                )}
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
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
