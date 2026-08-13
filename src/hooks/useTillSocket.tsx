import { useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { io, Socket } from "socket.io-client";
import { config } from "../config";
import { useCurrentToken } from "../redux/features/auth/authSlice";

/** Kept in step with the server's `SocketEvent`. */
const TillEvent = {
  JOIN: "till:join",
  LEAVE: "till:leave",
  PRESENCE: "till:presence",
  SCAN: "till:scan",
  RESULT: "till:result",
} as const;

const stripTrailingApi = (url: string) =>
  url.replace(/\/api\/?$/, "").replace(/\/$/, "");

/**
 * No 0/O/1/I/5/S.
 *
 * The code gets read off one screen and typed into another by someone holding
 * a phone in a shop, and the pairs above are the ones that get read wrong.
 */
const ALPHABET = "ABCDEFGHJKLMNPQRTUVWXYZ2346789";

export const makeTillCode = () =>
  Array.from(
    { length: 6 },
    () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  ).join("");

/**
 * The till code this browser is using, kept across reloads.
 *
 * Session storage rather than state: a cashier who refreshes the till page
 * mid-queue should not have to re-pair the phone in their colleague's hand.
 * Per tab, so two tills open on one machine cannot collide.
 */
const STORAGE_KEY = "pos.till.code";

export const useStoredTillCode = () => {
  const [code] = useState(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) return saved;
    const fresh = makeTillCode();
    sessionStorage.setItem(STORAGE_KEY, fresh);
    return fresh;
  });
  return code;
};

export interface TillPresence {
  tills: number;
  scanners: number;
}

/**
 * One end of a till pairing.
 *
 * Both ends run this hook — the register as `"till"`, the phone as
 * `"scanner"` — because both need the same three things: a live socket, the
 * room joined, and to know whether anyone is on the other side of it. What
 * differs is only which events each one listens to.
 *
 * Nothing here resolves a barcode. The string is handed to the caller and the
 * till looks it up over HTTP through the endpoint its own scan box uses, so
 * there is exactly one place that decides whether an item can be sold.
 */
export const useTillSocket = ({
  code,
  side,
  onScan,
  onResult,
  enabled = true,
}: {
  code: string;
  side: "till" | "scanner";
  onScan?: (barcode: string) => void;
  onResult?: (result: { barcode: string; ok: boolean; message: string }) => void;
  enabled?: boolean;
}) => {
  const token = useSelector(useCurrentToken);
  const socketRef = useRef<Socket | null>(null);

  const [connected, setConnected] = useState(false);
  const [presence, setPresence] = useState<TillPresence>({
    tills: 0,
    scanners: 0,
  });
  const [refusal, setRefusal] = useState<string | null>(null);

  // Held in refs so a caller that rebuilds its handler every render does not
  // tear the socket down and reconnect on every keystroke.
  const onScanRef = useRef(onScan);
  const onResultRef = useRef(onResult);
  useEffect(() => {
    onScanRef.current = onScan;
    onResultRef.current = onResult;
  }, [onScan, onResult]);

  useEffect(() => {
    if (!token || !enabled || !code) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setConnected(false);
      return;
    }

    const baseUrl = stripTrailingApi(
      config.server_url || config.api_url || window.location.origin
    );

    const socket = io(baseUrl, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
    });

    // Re-joined on every connect, not just the first: a reconnect is a new
    // socket on the server and it remembers none of the rooms the old one was
    // in, which is how a phone comes back from a lift and silently stops
    // working.
    const join = () => {
      socket.emit(
        TillEvent.JOIN,
        { code, side },
        (result: { ok: boolean; message?: string }) => {
          setConnected(!!result?.ok);
          setRefusal(result?.ok ? null : result?.message ?? "Could not pair");
        }
      );
    };

    socket.on("connect", join);
    socket.on("disconnect", () => setConnected(false));

    socket.on(TillEvent.PRESENCE, (payload: TillPresence) =>
      setPresence({
        tills: payload?.tills ?? 0,
        scanners: payload?.scanners ?? 0,
      })
    );

    if (side === "till") {
      socket.on(TillEvent.SCAN, (payload: { barcode?: string }) => {
        const barcode = String(payload?.barcode ?? "").trim();
        if (barcode) onScanRef.current?.(barcode);
      });
    } else {
      socket.on(
        TillEvent.RESULT,
        (payload: { barcode?: string; ok?: boolean; message?: string }) =>
          onResultRef.current?.({
            barcode: String(payload?.barcode ?? ""),
            ok: !!payload?.ok,
            message: String(payload?.message ?? ""),
          })
      );
    }

    socket.on("connect_error", (error: Error) => {
      setConnected(false);
      setRefusal(error.message);
    });

    socketRef.current = socket;

    return () => {
      socket.emit(TillEvent.LEAVE);
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [token, code, side, enabled]);

  /** Phone -> till. */
  const sendScan = useCallback((barcode: string) => {
    socketRef.current?.emit(TillEvent.SCAN, { barcode });
  }, []);

  /** Till -> phone. */
  const sendResult = useCallback(
    (result: { barcode: string; ok: boolean; message?: string }) => {
      socketRef.current?.emit(TillEvent.RESULT, result);
    },
    []
  );

  return { connected, presence, refusal, sendScan, sendResult };
};
