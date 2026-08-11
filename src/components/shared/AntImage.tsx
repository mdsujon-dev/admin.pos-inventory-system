import { Image } from "antd";
import { config } from "../../config";

interface AntImageProps {
  src: string;
  alt?: string;
  accessurl?: boolean;
  className?: string;
  height?: number | string;
  width?: number | string;
  title?: string;
  style?: React.CSSProperties;
  preview?: boolean;
  fallback?: string;
}

export default function AntImage({
  src,
  alt = "image",
  accessurl = false,
  className,
  height,
  width,
  title,
  style,
  preview = true,
  fallback = "/fallback.png",
}: AntImageProps) {
  const finalSrc = accessurl ? `${config.image_access_url}/${src}` : src;

  return (
    <Image
      src={finalSrc}
      alt={alt}
      title={title}
      className={className}
      style={{
        ...style,
        height,
        width,
        objectFit: "cover",
        borderRadius: "0px",
      }}
      loading="lazy"
      preview={preview}
      fallback={fallback}
    />
  );
}
