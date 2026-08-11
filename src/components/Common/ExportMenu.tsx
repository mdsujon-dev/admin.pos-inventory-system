import { Button, Dropdown, Tooltip } from "antd";
import type { ButtonProps } from "antd";
import { Download, FileSpreadsheet, FileText, FileType2 } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";

import {
  exportToExcel,
  exportToPdf,
  exportToWord,
  type ExportSheet,
} from "../../utils/tableExport";

export type ExportFormat = "xlsx" | "pdf" | "docx";

/**
 * The three files every list in the panel offers, in one button.
 *
 * Pages hand over a `sheet` — a title and a plain grid — and nothing else: the
 * menu, the file names, the "building your file" wait, the empty-list guard and
 * the failure toast all live here. Before this, each list that wanted an export
 * grew its own dropdown, and they drifted: different wording, different
 * formats offered, some silently doing nothing when the list was empty.
 *
 *   <ExportMenu sheet={buildSheet} disabled={rows.length === 0} />
 *
 * `sheet` may be a function, and may be async — a list that only holds the page
 * it is showing can fetch every matching row at the moment Export is clicked
 * rather than keeping them all in memory for a button nobody may press.
 */
const FORMATS: {
  key: ExportFormat;
  label: string;
  icon: typeof FileSpreadsheet;
  /** The one most people want; picked out so the eye lands on it. */
  primary?: boolean;
  run: (sheet: ExportSheet) => void | Promise<void>;
}[] = [
  {
    key: "xlsx",
    label: "Excel (.xlsx)",
    icon: FileSpreadsheet,
    run: exportToExcel,
  },
  {
    key: "pdf",
    label: "PDF (.pdf)",
    icon: FileText,
    primary: true,
    run: exportToPdf,
  },
  { key: "docx", label: "Word (.docx)", icon: FileType2, run: exportToWord },
];

type Props = {
  /**
   * The grid to write out, or a (possibly async) builder called on click.
   *
   * The builder is told which file was chosen, so a page can hand Excel the
   * whole record and the printed formats the columns that fit on a page — see
   * `makeSheet`'s `columns` / `detail`.
   */
  sheet:
    | ExportSheet
    | ((format: ExportFormat) => ExportSheet | Promise<ExportSheet>);
  /** Narrow the menu — defaults to all three. */
  formats?: ExportFormat[];
  label?: string;
  disabled?: boolean;
  size?: ButtonProps["size"];
  type?: ButtonProps["type"];
  className?: string;
};

const ExportMenu = ({
  sheet,
  formats,
  label = "Export",
  disabled,
  size = "middle",
  type = "default",
  className,
}: Props) => {
  // Building can mean a round trip for every matching row, so the button says
  // so rather than looking dead for a second or two.
  const [busy, setBusy] = useState(false);

  const items = FORMATS.filter(
    (f) => !formats || formats.includes(f.key)
  ).map((f) => ({
    key: f.key,
    label: (
      <span
        className={`flex items-center gap-2 ${
          f.primary ? "font-semibold text-primary" : ""
        }`}
      >
        <f.icon className="h-3.5 w-3.5" />
        {f.label}
      </span>
    ),
  }));

  const handle = async (key: string) => {
    const format = FORMATS.find((f) => f.key === key);
    if (!format || busy) return;

    setBusy(true);
    try {
      const built =
        typeof sheet === "function" ? await sheet(format.key) : sheet;

      // Writing an empty file looks like a broken export. Say why instead.
      if (!built?.rows?.length) {
        toast.warn("Nothing to export — the list is empty");
        return;
      }

      await format.run(built);
      toast.success(
        `Exported ${built.rows.length} row${built.rows.length === 1 ? "" : "s"}`
      );
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || "Could not export");
    } finally {
      setBusy(false);
    }
  };

  const button = (
    <Button
      size={size}
      type={type}
      className={className}
      disabled={disabled}
      loading={busy}
      icon={!busy && <Download className="h-3.5 w-3.5" />}
    >
      {busy ? "Preparing..." : label}
    </Button>
  );

  // A greyed-out button with no explanation reads as broken. Antd swallows
  // hover events on a disabled button, so the tooltip goes on a wrapper.
  if (disabled) {
    return (
      <Tooltip title="Nothing to export — this list is empty">
        <span className="inline-block cursor-not-allowed">{button}</span>
      </Tooltip>
    );
  }

  return (
    <Dropdown
      trigger={["click"]}
      disabled={busy}
      menu={{ items, onClick: ({ key }) => handle(key) }}
    >
      {button}
    </Dropdown>
  );
};

export default ExportMenu;
