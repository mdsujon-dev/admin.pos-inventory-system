import { Input, Tag } from "antd";
import {
  Camera,
  CameraOff,
  CheckCircle2,
  Keyboard,
  Link2,
  Link2Off,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PageMeta from "../../components/Common/PageMeta";
import Button from "../../components/ui/Button";
import { useTillSocket } from "../../hooks/useTillSocket";

/**
 * `BarcodeDetector` is a browser API, not a library, and TypeScript's DOM
 * definitions have not caught up with it. Declared to the extent this file
 * uses it rather than pulled in wholesale.
 */
interface DetectedBarcode {
  rawValue: string;
}
interface BarcodeDetectorLike {
  detect: (source: CanvasImageSource) => Promise<DetectedBarcode[]>;
}
type BarcodeDetectorCtor = new (options?: {
  formats?: string[];
}) => BarcodeDetectorLike;

const getDetectorCtor = (): BarcodeDetectorCtor | null =>
  (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor })
    .BarcodeDetector ?? null;

/**
 * Why the camera cannot be used, in the words of the thing to fix.
 *
 * Browsers hide `navigator.mediaDevices` outright on a plain-http origin, so
 * without this check the failure surfaces as "no camera on this device" on a
 * phone that plainly has one — and the shop goes looking for a hardware fault
 * that is really a missing `s` in the address bar.
 */
const cameraBlocker = (): string | null => {
  if (!window.isSecureContext) {
    return "Phone cameras only open on a secure address. Open this page over https (or through localhost) and the scanner will work — until then, type codes below.";
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    return "This browser will not give a page access to the camera. Type codes below instead.";
  }
  if (!getDetectorCtor()) {
    return "This browser cannot read barcodes from a camera — Chrome on Android can. Type codes below instead.";
  }
  return null;
};

/**
 * The formats a shop's labels actually carry.
 *
 * Named rather than left to the default, because asking for every format the
 * device knows makes each frame slower to decode and lets a QR code on the
 * packaging win over the barcode beside it.
 */
const FORMATS = [
  "code_128",
  "code_39",
  "ean_13",
  "ean_8",
  "upc_a",
  "upc_e",
  "itf",
  "codabar",
];

/**
 * The same code twice in a row is almost always one label held still.
 *
 * A camera reads thirty frames a second; without this a single item lands in
 * the cart thirty times. Two of the same item is a real thing a shop sells, so
 * the guard expires rather than blocking the code outright.
 */
const REPEAT_GUARD_MS = 1500;

interface ScanLog {
  id: number;
  barcode: string;
  state: "sent" | "ok" | "failed";
  message?: string;
}

/**
 * A phone standing in for a barcode scanner.
 *
 * Opened by pointing the phone's camera at the code on the till screen. It
 * sends nothing but the string off the label — the till looks that string up
 * through the same endpoint its own scan box uses, so an item that could not
 * be sold at the register cannot be sold from the aisle either.
 *
 * Built for one hand in a shop, not for a desk: everything that matters is
 * above the fold, the tap targets are large, and the outcome of a scan is a
 * colour and a buzz rather than something to read.
 */
const PhoneScanner = () => {
  const [params] = useSearchParams();
  const [code, setCode] = useState(
    (params.get("till") ?? "").toUpperCase().slice(0, 6)
  );
  const [paired, setPaired] = useState(!!params.get("till"));

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastRef = useRef<{ barcode: string; at: number }>({
    barcode: "",
    at: 0,
  });

  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manual, setManual] = useState("");
  const [log, setLog] = useState<ScanLog[]>([]);

  // Worked out once. Whether a camera can be used at all does not change
  // while somebody stands in an aisle.
  const [blocker] = useState(cameraBlocker);
  const canScan = !blocker;

  const onResult = useCallback(
    (result: { barcode: string; ok: boolean; message: string }) => {
      setLog((rows) =>
        rows.map((row) =>
          row.barcode === result.barcode && row.state === "sent"
            ? {
                ...row,
                state: result.ok ? "ok" : "failed",
                message: result.message,
              }
            : row
        )
      );
      // Told through the phone rather than shown on it: whoever is holding
      // this is looking at a shelf, not at the screen.
      if ("vibrate" in navigator) {
        navigator.vibrate(result.ok ? 40 : [60, 60, 60]);
      }
    },
    []
  );

  const { connected, presence, refusal, sendScan } = useTillSocket({
    code,
    side: "scanner",
    onResult,
    enabled: paired && code.length === 6,
  });

  const submit = useCallback(
    (raw: string) => {
      const barcode = raw.trim();
      if (!barcode) return;

      const now = Date.now();
      if (
        lastRef.current.barcode === barcode &&
        now - lastRef.current.at < REPEAT_GUARD_MS
      ) {
        return;
      }
      lastRef.current = { barcode, at: now };

      sendScan(barcode);
      setLog((rows) =>
        [{ id: now, barcode, state: "sent" as const }, ...rows].slice(0, 12)
      );
    },
    [sendScan]
  );

  /** Camera on, frames decoded, camera off when the page goes away. */
  useEffect(() => {
    if (!cameraOn) return;

    let cancelled = false;
    let frame = 0;
    const Detector = getDetectorCtor();

    const run = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          // The back camera, and a resolution worth decoding. `ideal` rather
          // than `exact` so a laptop with only a front camera still opens.
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setCameraError(null);

        if (!Detector) return;
        const detector = new Detector({ formats: FORMATS });

        const tick = async () => {
          if (cancelled || !videoRef.current) return;
          try {
            const found = await detector.detect(videoRef.current);
            if (found.length > 0) submit(found[0].rawValue);
          } catch {
            // A frame that will not decode is the normal case, not an error.
          }
          frame = requestAnimationFrame(() => void tick());
        };
        frame = requestAnimationFrame(() => void tick());
      } catch (error) {
        setCameraError(
          error instanceof Error && error.name === "NotAllowedError"
            ? "Camera permission was refused. Allow it in your browser settings, or type codes below."
            : "No camera could be opened on this device. Type codes below instead."
        );
        setCameraOn(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [cameraOn, submit]);

  const tillPresent = presence.tills > 0;

  if (!paired || code.length !== 6) {
    return (
      <div className="mx-auto max-w-sm px-4 py-10">
        <PageMeta title="Phone Scanner - POS" description="Pair with a till" noindex />
        <h1 className="m-0 text-[20px] font-bold text-secondary-800">
          Pair with a till
        </h1>
        <p className="mt-1 text-[13px] text-secondary-500">
          Open the till, press <strong>Phone scanner</strong>, and type the six
          characters it shows.
        </p>

        <Input
          size="large"
          value={code}
          maxLength={6}
          autoFocus
          placeholder="ABC123"
          onChange={(event) =>
            setCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
          }
          className="!mt-5 !text-center !font-mono !text-[24px] !tracking-[0.3em]"
        />

        <Button
          variant="primary"
          size="lg"
          className="!mt-4 w-full"
          disabled={code.length !== 6}
          onClick={() => setPaired(true)}
        >
          Pair
        </Button>

        {refusal && (
          <p className="mt-3 text-center text-[12px] text-danger">{refusal}</p>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-3 py-4">
      <PageMeta
        title="Phone Scanner - POS"
        description="Scan items into the till"
        noindex
      />

      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="m-0 text-[16px] font-bold text-secondary-800">
            Scanning into {code}
          </p>
          <p className="m-0 text-[11px] text-secondary-500">
            {connected && tillPresent
              ? "The till is listening"
              : connected
                ? "Paired, but the till is not open"
                : "Connecting…"}
          </p>
        </div>
        <Tag
          className={`!m-0 ${
            connected && tillPresent
              ? "!border-primary-200 !bg-primary-50 !text-primary-700"
              : "!border-[#f59e0b55] !bg-[#fffbeb] !text-[#92400e]"
          }`}
        >
          {connected && tillPresent ? (
            <Link2 className="mr-1 inline h-3 w-3" />
          ) : (
            <Link2Off className="mr-1 inline h-3 w-3" />
          )}
          {connected && tillPresent ? "Linked" : "Waiting"}
        </Tag>
      </div>

      {/*
        The viewfinder is kept square and the guide line sits across the
        middle: a barcode is read along its length, and people aim at the
        middle of whatever box they are shown.
      */}
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-secondary-900">
        <video
          ref={videoRef}
          playsInline
          muted
          className={`h-full w-full object-cover ${cameraOn ? "" : "hidden"}`}
        />
        {cameraOn ? (
          <>
            <span className="pointer-events-none absolute inset-x-6 top-1/2 h-0.5 -translate-y-1/2 bg-danger/80" />
            <span className="pointer-events-none absolute inset-6 rounded-lg border-2 border-white/50" />
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <CameraOff className="h-10 w-10 text-white/40" />
            <p className="m-0 text-[13px] text-white/70">
              {blocker ?? "Camera is off"}
            </p>
          </div>
        )}
      </div>

      {canScan && (
        <Button
          variant={cameraOn ? "outline" : "primary"}
          size="lg"
          className="!mt-3 w-full"
          onClick={() => setCameraOn((on) => !on)}
        >
          <Camera className="h-4 w-4" />
          {cameraOn ? "Stop camera" : "Start camera"}
        </Button>
      )}

      {cameraError && (
        <p className="mt-2 text-[12px] text-danger">{cameraError}</p>
      )}

      {/*
        Always present, never a fallback that appears only once something has
        gone wrong: a peeled label is an everyday event, and the box for it
        should not have to be found in a hurry.
      */}
      <form
        className="mt-3 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          submit(manual);
          setManual("");
        }}
      >
        <Input
          size="large"
          value={manual}
          onChange={(event) => setManual(event.target.value)}
          placeholder="Type a code"
          prefix={<Keyboard className="h-4 w-4 text-secondary-400" />}
        />
        <Button variant="default" size="lg" disabled={!manual.trim()}>
          Send
        </Button>
      </form>

      <div className="mt-4">
        <p className="m-0 mb-2 text-[11px] font-semibold uppercase tracking-wide text-secondary-400">
          Last scans
        </p>
        {log.length === 0 ? (
          <p className="m-0 text-[12px] text-secondary-400">
            Nothing sent yet.
          </p>
        ) : (
          <div className="space-y-1.5">
            {log.map((row) => (
              <div
                key={row.id}
                className={`flex items-center justify-between gap-2 rounded-md border px-3 py-2 ${
                  row.state === "ok"
                    ? "border-primary-200 bg-primary-50"
                    : row.state === "failed"
                      ? "border-danger/30 bg-danger/5"
                      : "border-secondary-100"
                }`}
              >
                <span className="min-w-0">
                  <span className="block truncate font-mono text-[12px] text-secondary-800">
                    {row.barcode}
                  </span>
                  {row.message && (
                    <span className="block text-[11px] text-secondary-500">
                      {row.message}
                    </span>
                  )}
                </span>
                {row.state === "ok" ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary-600" />
                ) : row.state === "failed" ? (
                  <XCircle className="h-4 w-4 shrink-0 text-danger" />
                ) : (
                  <span className="shrink-0 text-[11px] text-secondary-400">
                    sending…
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PhoneScanner;
