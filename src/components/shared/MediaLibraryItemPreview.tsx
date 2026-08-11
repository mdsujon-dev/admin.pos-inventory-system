import { EyeOutlined, FileOutlined } from "@ant-design/icons";
import { Modal } from "antd";
import { useState } from "react";
import { config } from "../../config";
import {
  inferMediaLibraryKind,
  isPdfItem,
} from "../../utils/mediaLibraryKind";
import AntImage from "./AntImage";

export type MediaLibraryItemShape = {
  name: string;
  url: string;
  type?: string;
};

function buildAccessUrl(path: string) {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("//")) return path;
  const base = String(config.image_access_url).replace(/\/$/, "");
  return `${base}/${String(path).replace(/^\//, "")}`;
}

/** PDF grid cell: thumbnail + click opens full viewer modal (same idea as Ant Image preview). */
function MediaLibraryPdfPreview({
  item,
  src,
}: {
  item: MediaLibraryItemShape;
  src: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        className="relative w-full h-full min-h-[170px] cursor-pointer group outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-t-xl overflow-hidden bg-[#f5f5f5]"
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        <iframe
          title=""
          src={src}
          className="w-full h-full min-h-[170px] border-0 bg-white pointer-events-none scale-[0.98] origin-top"
          loading="lazy"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/0 group-hover:bg-black/45 transition-colors pointer-events-none">
          <EyeOutlined className="text-white text-2xl opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
          <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity drop-shadow">
            Preview
          </span>
        </div>
      </div>

      <Modal
        open={open}
        title={item.name}
        onCancel={() => setOpen(false)}
        footer={null}
        width="min(92vw, 1100px)"
        centered
        destroyOnClose
        styles={{
          body: {
            height: "min(78vh, 820px)",
            padding: 0,
          },
        }}
      >
        <iframe
          title={item.name}
          src={src}
          className="w-full h-full min-h-[min(78vh,820px)] border-0 bg-[#4d4d4d]"
        />
      </Modal>
    </>
  );
}

const MediaLibraryItemPreview = ({ item }: { item: MediaLibraryItemShape }) => {
  const kind = inferMediaLibraryKind(item);
  const src = buildAccessUrl(item.url);
  const accessurl = !item.url?.startsWith("http") && !item.url?.startsWith("//");

  if (kind === "image") {
    return (
      <AntImage
        accessurl={accessurl}
        preview
        alt={item.name}
        src={item.url}
        className="max-w-full max-h-full w-full h-auto object-contain bg-[#f5f5f5] block rounded-t-xl"
      />
    );
  }

  if (kind === "video") {
    return (
      <video
        key={item.name}
        className="max-w-full max-h-full w-full h-full object-contain bg-black"
        controls
        muted
        playsInline
        preload="metadata"
        src={src}
      />
    );
  }

  if (kind === "audio") {
    return (
      <div className="w-full h-full min-h-[140px] flex items-center justify-center bg-[#f5f5f5] p-3">
        <audio
          controls
          className="w-full max-w-full"
          preload="metadata"
          src={src}
        />
      </div>
    );
  }

  if (kind === "document") {
    if (isPdfItem(item)) {
      return <MediaLibraryPdfPreview item={item} src={src} />;
    }
    const ext = item.name.includes(".")
      ? item.name.slice(item.name.lastIndexOf(".")).toUpperCase()
      : "FILE";
    return (
      <div className="w-full h-full min-h-[170px] flex flex-col items-center justify-center gap-2 bg-[#f5f5f5] text-secondary-600 px-2">
        <FileOutlined className="text-5xl text-primary/70" />
        <span className="text-xs font-semibold uppercase tracking-wide">
          {ext.replace(".", "")}
        </span>
        <span className="text-[11px] text-center line-clamp-2 text-secondary-500">
          {item.name}
        </span>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[170px] flex flex-col items-center justify-center gap-2 bg-[#f5f5f5] text-secondary-600 px-2">
      <FileOutlined className="text-5xl text-secondary-400" />
      <span className="text-[11px] text-center line-clamp-2">{item.name}</span>
    </div>
  );
};

export default MediaLibraryItemPreview;
