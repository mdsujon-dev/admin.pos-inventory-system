import { useMemo } from "react";

/**
 * Code 128 bar patterns, indexed by symbol value.
 *
 * Each string gives the widths, in modules, of alternating bars and spaces
 * starting with a bar. Index 103–105 are the Start A/B/C symbols and 106 is
 * Stop (which carries a seventh element — the trailing bar).
 */
const PATTERNS = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112",
];

const START_B = 104;
const STOP = 106;

/**
 * Encodes `value` as Code 128 subset B and returns the bar/space run lengths.
 *
 * Subset B covers ASCII 32–126, which is every character a SKU or barcode
 * field on this panel can hold. Anything outside that range has no symbol, so
 * it is dropped rather than encoded as something else — a barcode that scans
 * as the wrong string is worse than one character short.
 */
const encode = (value: string): number[] => {
  const chars = value.split("").filter((char) => {
    const code = char.charCodeAt(0);
    return code >= 32 && code <= 126;
  });

  const codes = [START_B, ...chars.map((char) => char.charCodeAt(0) - 32)];

  // Checksum: start value plus each symbol weighted by its position, mod 103.
  const checksum =
    codes.reduce(
      (sum, code, index) => sum + code * (index === 0 ? 1 : index),
      0
    ) % 103;

  return [...codes, checksum, STOP]
    .map((code) => PATTERNS[code])
    .join("")
    .split("")
    .map(Number);
};

interface BarcodeProps {
  value: string;
  /** Width of one module in px. 2 keeps a 12-char SKU readable on a label. */
  moduleWidth?: number;
  height?: number;
  /** Show the human-readable value under the bars. */
  showValue?: boolean;
  /**
   * The widest the symbol may be drawn, in px.
   *
   * A Code 128 symbol is as wide as its content is long, so a 20-character SKU
   * is twice the strip of a 10-character one. Left unbounded it simply spills
   * out of whatever it was placed in; bounded, it is squeezed to fit instead.
   * The bar-to-space ratios are what a scanner reads, and those are preserved
   * under the squeeze — a narrower symbol is still a valid one.
   */
  maxWidth?: number;
  className?: string;
}

/**
 * Renders a scannable Code 128 barcode as inline SVG.
 *
 * Inline rather than a canvas or an image so it survives `react-to-print`,
 * which serialises the DOM — a canvas would print blank.
 */
const Barcode = ({
  value,
  moduleWidth = 2,
  height = 56,
  showValue = true,
  maxWidth,
  className,
}: BarcodeProps) => {
  const runs = useMemo(() => encode(value ?? ""), [value]);

  if (!value) return null;

  const totalModules = runs.reduce((sum, run) => sum + run, 0);
  const width = totalModules * moduleWidth;
  // Drawn at its natural size unless that overflows, then scaled down on the
  // x axis only — the height of a barcode carries no information, so squashing
  // it as well would just make it harder to aim a scanner at.
  const drawnWidth = maxWidth ? Math.min(width, maxWidth) : width;

  const bars: { x: number; width: number }[] = [];
  let cursor = 0;
  runs.forEach((run, index) => {
    // Runs alternate bar, space, bar, … starting with a bar.
    if (index % 2 === 0) {
      bars.push({ x: cursor * moduleWidth, width: run * moduleWidth });
    }
    cursor += run;
  });

  return (
    <div
      className={`inline-flex max-w-full flex-col items-center ${className ?? ""}`}
    >
      <svg
        width={drawnWidth}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`Barcode ${value}`}
        shapeRendering="crispEdges"
      >
        <rect width={width} height={height} fill="#ffffff" />
        {bars.map((bar, index) => (
          <rect
            key={index}
            x={bar.x}
            y={0}
            width={bar.width}
            height={height}
            fill="#000000"
          />
        ))}
      </svg>
      {showValue && (
        <span
          className="mt-1 max-w-full truncate font-mono text-[10px] tracking-[0.08em] text-black"
          style={{ width: drawnWidth }}
        >
          {value}
        </span>
      )}
    </div>
  );
};

export default Barcode;
