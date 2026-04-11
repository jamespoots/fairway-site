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
  sessionId: string;
};

const REQUEST_TIMEOUT_MS = 2200;

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
  const apiVersion = firstValue(status, [
    "apiVersion",
    "api.version",
    "version",
  ]);
  const runtimeStartTime = formatStartTime(
    firstValue(status, [
      "runtimeStartedAt",
      "runtime.startTime",
      "runtime.startedAt",
      "startedAt",
      "startTime",
      "uptime.startedAt",
    ])
  );
  const gsproConnectorState = firstValue(status, [
    "gspro.connectorState",
    "gspro.connector.state",
    "connectors.gspro.state",
    "gspro.state",
  ]);
  const pairingReadiness = firstValue(status, [
    "pairing.readiness",
    "pairing.ready",
    "pairing.isReady",
    "readyForPairing",
    "ready",
  ]);
  const sessionId = firstValue(status, [
    "pairing.sessionId",
    "sessionId",
    "session.id",
    "activeSessionId",
  ]);

  return {
    apiVersion,
    runtimeStartTime,
    gsproConnectorState,
    pairingReadiness,
    sessionId,
  };
}

export default function ConnectPage() {
  const [state, setState] = useState<ConnectState>("checking");
  const [summary, setSummary] = useState<HelperSummary | null>(null);

  const healthUrl = useMemo(() => `${CONNECT_HELPER_BASE_URL}/health`, []);
  const statusUrl = useMemo(() => `${CONNECT_HELPER_BASE_URL}/status`, []);

  useEffect(() => {
    let isActive = true;

    async function checkHelper(): Promise<void> {
      setState("checking");

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

    checkHelper();

    return () => {
      isActive = false;
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
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-white/50">State</p>
              <h2 className="mt-2 text-2xl font-semibold">Helper found</h2>
              <p className="mt-2 text-emerald-300">Helper running</p>

              <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                  <dt className="text-xs uppercase tracking-wide text-white/50">API version</dt>
                  <dd className="mt-1 text-base text-white">{summary.apiVersion}</dd>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                  <dt className="text-xs uppercase tracking-wide text-white/50">Runtime start time</dt>
                  <dd className="mt-1 text-base text-white">{summary.runtimeStartTime}</dd>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                  <dt className="text-xs uppercase tracking-wide text-white/50">GSPro connector state</dt>
                  <dd className="mt-1 text-base text-white">{summary.gsproConnectorState}</dd>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                  <dt className="text-xs uppercase tracking-wide text-white/50">Pairing readiness</dt>
                  <dd className="mt-1 text-base text-white">{summary.pairingReadiness}</dd>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/20 p-4 sm:col-span-2">
                  <dt className="text-xs uppercase tracking-wide text-white/50">Session ID</dt>
                  <dd className="mt-1 break-all text-base text-white">{summary.sessionId}</dd>
                </div>
              </dl>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
