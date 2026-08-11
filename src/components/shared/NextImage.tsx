import { config } from "../../config";

interface ImageProps {
  src: string;
  alt?: string;
  accessurl?: boolean;
  className?: string;
  title?: string;
  style?: React.CSSProperties;
  priority?: boolean;
  quality?: number;
  width?: number | string;
  height?: number | string;
}
export default function NextImage({
  src,
  alt = "image",
  className,
  title,
  style,
  accessurl = false,
  width,
  height,
}: ImageProps) {
  return (
    <img
      src={`${accessurl ? config.image_access_url + "/" + src : src}`}
      alt={alt}
      title={title}
      className={className}
      style={style}
      width={width}
      height={height}
      loading="lazy"
    />
  );
}
