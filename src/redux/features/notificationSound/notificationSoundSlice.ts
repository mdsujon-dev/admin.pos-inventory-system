import { createSlice, createSelector, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";

export interface NotificationSoundOption {
  /** Stable preset key — also used as the `file` value (`generated:<id>`). */
  id: string;
  /** Display name shown in the settings table. */
  name: string;
  /** `generated:*` preset string consumed by `playNotificationSound`. */
  file: string;
}

/**
 * Catalog of sounds available to the user. Synthesized tones — no audio files
 * need to ship with the app. Keep the `id` values in sync with the presets
 * defined in `playNotificationSound.ts` (`TONE_PRESETS`).
 */
export const AVAILABLE_SOUNDS: readonly NotificationSoundOption[] = [
  { id: "default", name: "Default", file: "generated:default" },
  { id: "chime", name: "Chime", file: "generated:chime" },
  { id: "pop", name: "Pop", file: "generated:pop" },
  { id: "bell", name: "Bell", file: "generated:bell" },
  { id: "beep", name: "Beep", file: "generated:beep" },
  { id: "ding", name: "Ding", file: "generated:ding" },
  { id: "ping", name: "Ping", file: "generated:ping" },
  { id: "click", name: "Click", file: "generated:click" },
  { id: "tone", name: "Tone", file: "generated:tone" },
  { id: "bubble", name: "Bubble", file: "generated:bubble" },
  { id: "chord", name: "Chord", file: "generated:chord" },
  { id: "alert", name: "Alert", file: "generated:alert" },
  { id: "tap", name: "Tap", file: "generated:tap" },
  { id: "whistle", name: "Whistle", file: "generated:whistle" },
  { id: "note", name: "Note", file: "generated:note" },
  { id: "tick", name: "Tick", file: "generated:tick" },
  { id: "melody", name: "Melody", file: "generated:melody" },
  { id: "fanfare", name: "Fanfare", file: "generated:fanfare" },
  { id: "soft", name: "Soft", file: "generated:soft" },
  { id: "sharp", name: "Sharp", file: "generated:sharp" },
] as const;

export interface NotificationSoundState {
  /** Master toggle — when false, no sound plays on incoming notifications. */
  enabled: boolean;
  /** Which sound from `AVAILABLE_SOUNDS` is currently active. */
  activeId: string;
  /** Master volume, 0..1 (clamped on write). */
  volume: number;
}

const DEFAULT_ID = AVAILABLE_SOUNDS[0].id;

const initialState: NotificationSoundState = {
  enabled: false,
  activeId: DEFAULT_ID,
  volume: 0.5,
};

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);

const notificationSoundSlice = createSlice({
  name: "notificationSound",
  initialState,
  reducers: {
    setActiveSoundId: (state, action: PayloadAction<string>) => {
      const known = AVAILABLE_SOUNDS.some((s) => s.id === action.payload);
      state.activeId = known ? action.payload : DEFAULT_ID;
    },
    setVolume: (state, action: PayloadAction<number>) => {
      state.volume = clamp01(Number.isFinite(action.payload) ? action.payload : 0.5);
    },
    setEnabled: (state, action: PayloadAction<boolean>) => {
      state.enabled = action.payload;
    },
    resetNotificationSound: () => initialState,
  },
});

export const {
  setActiveSoundId,
  setVolume,
  setEnabled,
  resetNotificationSound,
} = notificationSoundSlice.actions;

export default notificationSoundSlice.reducer;

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

export const selectNotificationSoundState = (state: RootState) =>
  state.notificationSound;

export const selectActiveSound = createSelector(
  [
    (state: RootState) => state.notificationSound.activeId,
    (state: RootState) => state.notificationSound.volume,
    (state: RootState) => state.notificationSound.enabled,
  ],
  (activeId, volume, enabled) => {
    const option =
      AVAILABLE_SOUNDS.find((s) => s.id === activeId) ?? AVAILABLE_SOUNDS[0];
    return { ...option, volume, enabled };
  }
);
