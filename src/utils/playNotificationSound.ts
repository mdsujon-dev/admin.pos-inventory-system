import { config } from "../config";

const buildAudioUrl = (file: string) => {
  if (!file) return "";
  if (/^https?:\/\//i.test(file)) return file;
  return `${config.image_access_url}${file.startsWith("/") ? "" : "/"}${file}`;
};

const clampVolume = (v?: number) => Math.min(Math.max(v ?? 1, 0), 1);

// ---------------------------------------------------------------------------
// WAV generation — produces a tiny PCM data URL we can hand to HTMLAudioElement.
// We avoid the Web Audio API (it can stay suspended even after a user gesture)
// and avoid FileReader/Blob URLs (their async callback drops transient user
// activation, so `audio.play()` afterwards gets silently blocked).
// ---------------------------------------------------------------------------

interface ToneNote {
  freq: number;
  duration: number;
  /** Optional waveform (defaults to sine). */
  shape?: "sine" | "square" | "triangle";
}

const SAMPLE_RATE = 22050;

const writeString = (view: DataView, offset: number, str: string) => {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
};

const sampleAt = (
  shape: ToneNote["shape"],
  freq: number,
  t: number
): number => {
  const phase = 2 * Math.PI * freq * t;
  switch (shape) {
    case "square":
      return Math.sin(phase) >= 0 ? 1 : -1;
    case "triangle":
      return (2 / Math.PI) * Math.asin(Math.sin(phase));
    default:
      return Math.sin(phase);
  }
};

const buildWavBuffer = (notes: ToneNote[], volume: number): ArrayBuffer => {
  const gap = 0.04;
  const totalDuration =
    notes.reduce((sum, n) => sum + n.duration, 0) +
    Math.max(notes.length - 1, 0) * gap;
  const numSamples = Math.floor(SAMPLE_RATE * totalDuration);
  const dataBytes = numSamples * 2;

  const buffer = new ArrayBuffer(44 + dataBytes);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataBytes, true);
  writeString(view, 8, "WAVE");

  // fmt subchunk
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // subchunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample

  // data subchunk
  writeString(view, 36, "data");
  view.setUint32(40, dataBytes, true);

  // Fill the buffer with concatenated notes + envelopes
  let writeOffset = 0;
  const peak = volume * 0.9; // leave a little headroom
  for (let n = 0; n < notes.length; n++) {
    const note = notes[n];
    const noteSamples = Math.floor(SAMPLE_RATE * note.duration);
    const attackSamples = Math.min(Math.floor(SAMPLE_RATE * 0.01), noteSamples);
    const releaseSamples = Math.min(
      Math.floor(SAMPLE_RATE * 0.06),
      noteSamples - attackSamples
    );

    for (let i = 0; i < noteSamples; i++) {
      const t = i / SAMPLE_RATE;
      let env = peak;
      if (i < attackSamples) env *= i / attackSamples;
      else if (i >= noteSamples - releaseSamples) {
        env *= (noteSamples - i) / releaseSamples;
      }
      const sampleVal = sampleAt(note.shape, note.freq, t) * env;
      const intVal = Math.max(-1, Math.min(1, sampleVal)) * 32767;
      view.setInt16(44 + (writeOffset + i) * 2, intVal, true);
    }
    writeOffset += noteSamples;

    // silence gap between notes
    if (n < notes.length - 1) {
      writeOffset += Math.floor(SAMPLE_RATE * gap);
    }
  }

  return buffer;
};

// Synchronous base64 encoding of the WAV buffer. We avoid FileReader/Blob URLs
// here on purpose: browsers only honor `audio.play()` while transient user
// activation is "live", and that flag does not survive an async `await` /
// FileReader callback. Generating the data URL inline keeps `play()` in the
// same tick as the click handler.
const bufferToDataUrl = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(
      null,
      bytes.subarray(i, i + CHUNK) as unknown as number[]
    );
  }
  return `data:audio/wav;base64,${btoa(binary)}`;
};

const TONE_PRESETS: Record<string, ToneNote[]> = {
  // Originals
  default: [{ freq: 880, duration: 0.35 }],
  chime: [
    { freq: 1175, duration: 0.25 },
    { freq: 880, duration: 0.45 },
  ],
  pop: [{ freq: 523, duration: 0.18, shape: "triangle" }],
  bell: [
    { freq: 1568, duration: 0.2 },
    { freq: 1568, duration: 0.55 },
  ],
  beep: [{ freq: 1000, duration: 0.25, shape: "square" }],

  // ---- 15 additional presets to reach 20 total ----
  ding: [{ freq: 1760, duration: 0.4 }],
  ping: [{ freq: 2093, duration: 0.18, shape: "triangle" }],
  click: [{ freq: 600, duration: 0.06, shape: "square" }],
  tone: [{ freq: 660, duration: 0.55 }],
  bubble: [
    { freq: 523, duration: 0.08, shape: "triangle" },
    { freq: 784, duration: 0.08, shape: "triangle" },
    { freq: 1047, duration: 0.14, shape: "triangle" },
  ],
  chord: [
    { freq: 523, duration: 0.45 },
    { freq: 659, duration: 0.45 },
    { freq: 784, duration: 0.55 },
  ],
  alert: [
    { freq: 880, duration: 0.18, shape: "square" },
    { freq: 1175, duration: 0.18, shape: "square" },
    { freq: 880, duration: 0.18, shape: "square" },
  ],
  tap: [{ freq: 440, duration: 0.07, shape: "triangle" }],
  whistle: [
    { freq: 1800, duration: 0.18, shape: "triangle" },
    { freq: 2200, duration: 0.32, shape: "triangle" },
  ],
  note: [{ freq: 740, duration: 0.4 }],
  tick: [{ freq: 1200, duration: 0.05, shape: "square" }],
  melody: [
    { freq: 523, duration: 0.18 },
    { freq: 659, duration: 0.18 },
    { freq: 784, duration: 0.3 },
  ],
  fanfare: [
    { freq: 523, duration: 0.14 },
    { freq: 659, duration: 0.14 },
    { freq: 784, duration: 0.14 },
    { freq: 1047, duration: 0.4 },
  ],
  soft: [{ freq: 392, duration: 0.6 }],
  sharp: [{ freq: 2400, duration: 0.12, shape: "square" }],

  // Used by installAudioUnlock — short + volume:0 keeps the WAV tiny.
  __silent__: [{ freq: 0, duration: 0.02 }],
};

// Cache generated data URLs per preset+volume so repeat plays are O(1).
const urlCache = new Map<string, string>();

const getToneUrl = (preset: string, volume: number): string => {
  const key = `${preset}@${volume.toFixed(2)}`;
  const cached = urlCache.get(key);
  if (cached) return cached;
  const buffer = buildWavBuffer(
    TONE_PRESETS[preset] || TONE_PRESETS.default,
    volume
  );
  const url = bufferToDataUrl(buffer);
  urlCache.set(key, url);
  return url;
};

const playGeneratedTone = (
  preset: string,
  volume: number
): HTMLAudioElement | null => {
  if (typeof window === "undefined") return null;
  try {
    const url = getToneUrl(preset, volume);
    const audio = new Audio(url);
    audio.volume = 1; // amplitude is already baked into the WAV
    audio.play().catch((err) =>
      console.warn(
        "[notification-sound] play() rejected:",
        err?.name,
        err?.message
      )
    );
    return audio;
  } catch (err) {
    console.warn("[notification-sound] generation failed:", err);
    return null;
  }
};

// Tiny silent WAV (lazy-built) used to "warm" autoplay permission on the very
// first user gesture. After this runs once, programmatic `audio.play()` from
// socket events (no gesture in scope) is allowed by Chromium/Firefox.
let unlockBound = false;
export const installAudioUnlock = () => {
  if (unlockBound || typeof window === "undefined") return;
  unlockBound = true;
  const unlock = () => {
    try {
      const silentUrl = getToneUrl("__silent__", 0);
      const a = new Audio(silentUrl);
      a.volume = 0;
      a.play().catch(() => {});
    } catch {
      /* ignore — worst case the first socket-driven sound is muted */
    }
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
    window.removeEventListener("touchstart", unlock);
  };
  window.addEventListener("pointerdown", unlock);
  window.addEventListener("keydown", unlock);
  window.addEventListener("touchstart", unlock);
};

const resolvePresetKey = (name?: string, file?: string): string => {
  const candidates = [
    name,
    file
      ?.replace(/^generated:/, "")
      ?.replace(/^.*\//, "")
      ?.replace(/\.[^.]+$/, ""),
  ];
  for (const c of candidates) {
    const key = c?.toLowerCase()?.trim();
    if (key && TONE_PRESETS[key]) return key;
  }
  return "default";
};

interface ActiveAudio {
  stop: () => void;
}

interface PlayOptions {
  name?: string;
  file?: string;
  volume?: number;
}

const handleFor = (audio: HTMLAudioElement | null): ActiveAudio => ({
  stop: () => {
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
  },
});

/**
 * Plays a notification sound. Tries the user-configured file URL first,
 * falls back to a generated tone derived from name/file on any failure.
 */
export const playNotificationSound = (
  fileOrOptions: string | PlayOptions,
  volume?: number
): ActiveAudio | null => {
  installAudioUnlock();

  const opts: PlayOptions =
    typeof fileOrOptions === "string"
      ? { file: fileOrOptions, volume }
      : fileOrOptions;

  const file = opts.file?.trim() ?? "";
  const name = opts.name?.trim();
  const v = clampVolume(opts.volume);
  const nameKey = name?.toLowerCase();

  // Case 1: explicit generated preset on the file field
  if (file.startsWith("generated:")) {
    const preset = file.slice("generated:".length).toLowerCase() || "default";
    return handleFor(
      playGeneratedTone(TONE_PRESETS[preset] ? preset : "default", v)
    );
  }

  // Case 2: legacy placeholder path (`/sounds/X.mp3`) that was never shipped.
  // Skip the broken Audio() roundtrip and go straight to a name-matched tone.
  const isLegacyPlaceholder = /^\/sounds\/[a-z0-9_-]+\.(mp3|wav|ogg|m4a)$/i.test(
    file
  );
  if (isLegacyPlaceholder && nameKey && TONE_PRESETS[nameKey]) {
    return handleFor(playGeneratedTone(nameKey, v));
  }

  // Case 3: real URL or upload path → try the audio element, fall back to a
  // matching tone on load/play error.
  const isPlayableUrl =
    file && (/^https?:\/\//i.test(file) || file.startsWith("/"));
  if (isPlayableUrl) {
    try {
      const audio = new Audio(buildAudioUrl(file));
      audio.volume = v;
      let fellBack = false;
      const fallback = () => {
        if (fellBack) return;
        fellBack = true;
        playGeneratedTone(resolvePresetKey(name, file), v);
      };
      audio.addEventListener("error", fallback);
      audio.play().catch(fallback);
      return handleFor(audio);
    } catch {
      // fall through to tone
    }
  }

  // Case 4: nothing usable — generated tone derived from name
  return handleFor(playGeneratedTone(resolvePresetKey(name, file), v));
};
