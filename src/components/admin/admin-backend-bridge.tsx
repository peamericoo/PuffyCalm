"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ensureAdminBackendSession,
  logoutAdminBackend,
  type AdminPing,
} from "@/lib/api/admin-auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BridgeState =
  | { status: "loading" }
  | { status: "ok"; ping: AdminPing }
  | { status: "forbidden"; message: string }
  | { status: "error"; message: string; httpStatus?: number };

type Props = {
  /** Short-lived Google ID token from Auth.js (admin/staff only). */
  googleIdToken?: string | null;
  className?: string;
};

/**
 * Proves Phase E: FE admin → FastAPI cookies → GET /admin/ping.
 * Allowlist on Auth.js is UX only; 401/403 from BE is the real barrier.
 */
export function AdminBackendBridge({ googleIdToken, className }: Props) {
  const [state, setState] = useState<BridgeState>({ status: "loading" });

  const run = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const ping = await ensureAdminBackendSession({ googleIdToken });
      setState({ status: "ok", ping });
    } catch (e) {
      const err = e as Error & { status?: number };
      if (err.status === 403) {
        setState({
          status: "forbidden",
          message:
            err.message ||
            "This account is not authorized on the API (ADMIN_EMAILS).",
        });
        return;
      }
      setState({
        status: "error",
        message: err.message || "Backend auth failed",
        httpStatus: err.status,
      });
    }
  }, [googleIdToken]);

  useEffect(() => {
    void run();
  }, [run]);

  return (
    <div
      className={cn(
        "rounded-[1.35rem] border border-border/70 bg-white p-6 shadow-sm",
        className,
      )}
    >
      <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        Backend session (API)
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Real barrier: FastAPI JWT cookies +{" "}
        <code className="text-[11px]">ADMIN_EMAILS</code>. FE email list is UX
        only.
      </p>

      <div className="mt-4 space-y-2 text-sm">
        {state.status === "loading" && (
          <p className="text-muted-foreground">Connecting to admin API…</p>
        )}
        {state.status === "ok" && (
          <div className="space-y-1">
            <p className="font-medium text-emerald-700">
              GET /api/v1/admin/ping → 200
            </p>
            <p className="text-muted-foreground">
              role <span className="font-medium text-foreground">{state.ping.role}</span>
              {" · "}
              user <code className="text-xs">{state.ping.userId}</code>
            </p>
            <p className="text-xs text-muted-foreground">{state.ping.message}</p>
          </div>
        )}
        {state.status === "forbidden" && (
          <div className="space-y-1">
            <p className="font-medium text-amber-800">403 — not admin on API</p>
            <p className="text-muted-foreground">{state.message}</p>
          </div>
        )}
        {state.status === "error" && (
          <div className="space-y-1">
            <p className="font-medium text-destructive">
              Backend auth failed
              {state.httpStatus ? ` (${state.httpStatus})` : ""}
            </p>
            <p className="text-muted-foreground">{state.message}</p>
            {!googleIdToken && (
              <p className="text-xs text-muted-foreground">
                No Google ID token in session — sign out and sign in again so
                the bridge can exchange a fresh token.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => void run()}>
          Retry ping
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => void logoutAdminBackend().then(run)}
        >
          Clear API cookies
        </Button>
      </div>
    </div>
  );
}
