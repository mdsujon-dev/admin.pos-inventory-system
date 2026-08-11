import dayjs, { Dayjs } from "dayjs";

const range = (start: number, end: number) =>
  Array.from({ length: Math.max(0, end - start) }, (_, i) => start + i);

// Disable any day before today — for meeting / follow-up pickers.
export const disabledPastDate = (d: Dayjs | null) =>
  !!d && d < dayjs().startOf("day");

// Disable hours/minutes that are already in the past (only for today), so a
// meeting time can never be set in the past.
export const disabledPastTime = (d: Dayjs | null) => {
  const now = dayjs();
  if (!d || !d.isSame(now, "day")) return {};
  return {
    disabledHours: () => range(0, now.hour()),
    disabledMinutes: (h: number) =>
      h === now.hour() ? range(0, now.minute() + 1) : [],
  };
};

// For native <input type="datetime-local"> min attribute.
export const nowLocalInput = () => dayjs().format("YYYY-MM-DDTHH:mm");
