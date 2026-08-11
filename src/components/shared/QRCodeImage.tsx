import QRCode from "qrcode";
import { useEffect, useState } from "react";

interface QRCodeImageProps {
  value: string;
  size?: number;
  /** Show the encoded value under the code. */
  showValue?: boolean;
  className?: string;
}

/**
 * Renders a QR code as an <img> backed by a data URL.
 *
 * A data URL rather than a canvas because these labels go through
 * `react-to-print`, which serialises the DOM into a new document — a canvas
 * carries no pixels across that and prints blank.
 */
const QRCodeImage = ({
  value,
  size = 96,
  showValue = true,
  className,
}: QRCodeImageProps) => {
  const [dataUrl, setDataUrl] = useState<string>("");

  useEffect(() => {
    if (!value) {
      setDataUrl("");
      return;
    }

    let cancelled = false;
    QRCode.toDataURL(value, {
      width: size,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#000000", light: "#ffffff" },
    })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setDataUrl("");
      });

    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (!value) return null;

  return (
    <div className={`inline-flex flex-col items-center ${className ?? ""}`}>
      {dataUrl ? (
        <img src={dataUrl} alt={`QR code ${value}`} width={size} height={size} />
      ) : (
        <div style={{ width: size, height: size }} className="bg-secondary-100" />
      )}
      {showValue && (
        <span className="mt-1 font-mono text-[11px] tracking-[0.08em] text-black">
          {value}
        </span>
      )}
    </div>
  );
};

export default QRCodeImage;
