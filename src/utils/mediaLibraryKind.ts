export type MediaLibraryKind =
  | "image"
  | "video"
  | "audio"
  | "document"
  | "other";

const VIDEO_EXT = /\.(mp4|webm|mov|mkv|avi|ogv|m4v)(\?.*)?$/i;
const AUDIO_EXT = /\.(mp3|wav|ogg|m4a|aac|flac|opus|wma|aiff?)(\?.*)?$/i;
const IMAGE_EXT = /\.(jpe?g|png|gif|webp|svg|bmp|ico|avif)(\?.*)?$/i;
const DOCUMENT_EXT =
  /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|rtf|odt|ods)(\?.*)?$/i;

/** Infer kind from API `type` (often MIME) and file `name`. */
export function inferMediaLibraryKind(item: {
  type?: string;
  name?: string;
}): MediaLibraryKind {
  const mime = String(item.type || "").toLowerCase();
  const name = String(item.name || "");

  if (mime.startsWith("video/") || VIDEO_EXT.test(name)) return "video";
  if (mime.startsWith("audio/") || AUDIO_EXT.test(name)) return "audio";
  if (mime.startsWith("image/") || IMAGE_EXT.test(name)) return "image";

  if (
    mime === "application/pdf" ||
    mime === "text/csv" ||
    DOCUMENT_EXT.test(name)
  ) {
    return "document";
  }

  if (
    /word|excel|powerpoint|spreadsheet|msword|officedocument|ms-excel|ms-powerpoint/i.test(
      mime
    )
  ) {
    return "document";
  }

  if (mime.startsWith("text/")) {
    if (/html|css|javascript/.test(mime)) return "other";
    return "document";
  }

  if (
    mime.startsWith("application/") &&
    !/(zip|gzip|x-gzip|x-zip|json|javascript|octet-stream|wasm)/i.test(mime)
  ) {
    return "document";
  }

  return "other";
}

export function isPdfItem(item: { type?: string; name?: string }): boolean {
  const mime = String(item.type || "").toLowerCase();
  return mime === "application/pdf" || /\.pdf(\?.*)?$/i.test(item.name || "");
}
