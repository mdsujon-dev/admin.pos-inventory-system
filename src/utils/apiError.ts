/**
 * The most useful sentence an API refusal contains.
 *
 * A validation failure comes back with a generic `message` and the fact that
 * actually explains it buried in `errorSources` — so a save refused over one
 * bad field showed a toast saying nothing, and the field that caused it stayed
 * invisible. Prefer the specific reason, fall back to the general one.
 */
export const apiError = (err: unknown, fallback = "Something went wrong") => {
  const data = (err as { data?: Record<string, unknown> })?.data;
  if (!data) return fallback;

  const sources = data.errorSources as
    | { path?: string; message?: string }[]
    | undefined;

  const first = sources?.find((s) => s?.message);
  if (first?.message) {
    // "body.logo" reads as noise; the last segment is the field somebody sees.
    const field = String(first.path || "").split(".").filter(Boolean).pop();
    return field ? `${field}: ${first.message}` : first.message;
  }

  return (data.message as string) || fallback;
};
