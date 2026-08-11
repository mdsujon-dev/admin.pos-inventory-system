import dayjs from "dayjs";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  PageOrientation,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

/**
 * One shape, three files.
 *
 * Any list in the panel — the attendance register, the student list, a batch
 * roster — hands this module the same plain grid rather than each building its
 * own Excel, PDF and Word writer. Which rows are exceptional is decided by
 * whoever builds the grid and arrives already flagged, so an exported file can
 * never disagree with the screen it came from.
 *
 * Pair it with `<ExportMenu sheet={...} />` rather than calling the three
 * exporters by hand — that component is the button, the loading state and the
 * error toast around these functions.
 */
export type ExportRow = {
  cells: (string | number)[];
  /** Rendered in red across all three formats. */
  isLow?: boolean;
};

export type ExportSheet = {
  /** Becomes the file name and the heading on the page. */
  title: string;
  subtitle?: string;
  headers: string[];
  rows: ExportRow[];
  /** Printed under the heading so the colour is never unexplained. */
  note?: string;
};

/**
 * The sheet every list builds, built the same way.
 *
 * Without this each page wrote its own subtitle and its own "N records" line,
 * and they disagreed — some counted, some named the filters, some said nothing,
 * so two exported files from the same panel did not look like they came from
 * the same system. A page now says what it is called, what is being shown and
 * how one record becomes a row; the rest is identical everywhere.
 *
 *   makeSheet({
 *     title: "Faculty",
 *     unit: "trainer",
 *     filters: [status && `Status: ${status}`],
 *     headers: ["ID", "Name"],
 *     rows: faculties,
 *     cells: (f) => [f.facultyId, f.name],
 *   })
 */
/** Which file is being written — some columns only belong in one of them. */
export type SheetFormat = "xlsx" | "pdf" | "docx";

export type SheetColumn<T> = {
  header: string;
  cell: (row: T) => string | number;
  /**
   * Excel only.
   *
   * A spreadsheet is the place to keep everything on file — every field of the
   * record, however long, because a column nobody needs can be hidden and one
   * that was never written cannot be recovered. A PDF or a Word file is a page
   * somebody reads: thirty columns on it are thirty unreadable columns. So the
   * full record goes to Excel and the printed formats carry what a person
   * actually looks for.
   */
  detail?: boolean;
};

export const makeSheet = <T>({
  title,
  unit = "record",
  filters = [],
  headers,
  rows,
  cells,
  columns,
  format,
  isLow,
  note,
}: {
  title: string;
  /** Singular noun for the count line — "trainer", "payment", "batch". */
  unit?: string;
  /** Whatever narrowed the list; falsy entries are dropped. */
  filters?: (string | false | undefined | null)[];
  rows: T[];
  /** Same columns in every format. Use `columns` instead to vary by format. */
  headers?: string[];
  cells?: (row: T) => (string | number)[];
  /** Per-column definition, so `detail` columns can be Excel-only. */
  columns?: SheetColumn<T>[];
  /** The file being written; only matters alongside `columns`. */
  format?: SheetFormat;
  /** Rows worth picking out in red — overdue, failed, below the bar. */
  isLow?: (row: T) => boolean;
  note?: string;
}): ExportSheet => {
  const active = filters.filter(Boolean) as string[];

  const picked = columns?.filter((c) => !c.detail || format === "xlsx");
  const finalHeaders = picked ? picked.map((c) => c.header) : headers ?? [];
  const rowCells = picked
    ? (r: T) => picked.map((c) => c.cell(r))
    : cells ?? (() => []);

  return {
    title,
    subtitle: [
      `${rows.length} ${unit}${rows.length === 1 ? "" : "s"}`,
      ...active,
    ].join("  ·  "),
    // Said on the page itself, because a printed list with no note looks like
    // the whole list to whoever is handed it.
    note:
      note ??
      (active.length
        ? "Filtered list — clear the filters to export everything."
        : undefined),
    headers: finalHeaders,
    rows: rows.map((r) => ({
      cells: rowCells(r).map((c) => c ?? ""),
      ...(isLow ? { isLow: isLow(r) } : {}),
    })),
  };
};

const fileName = (title: string, ext: string) =>
  `${title.replace(/[^\w\d-]+/g, "-").replace(/-+/g, "-").toLowerCase()}-${dayjs().format(
    "YYYY-MM-DD"
  )}.${ext}`;

const saveBlob = (blob: Blob, name: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  // Revoked on the next tick — doing it immediately cancels the download in
  // Firefox before the file is written.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

/* ── Excel ──────────────────────────────────────────────────────────────── */

export const exportToExcel = (sheet: ExportSheet) => {
  const body = [
    [sheet.title],
    ...(sheet.subtitle ? [[sheet.subtitle]] : []),
    ...(sheet.note ? [[sheet.note]] : []),
    [],
    sheet.headers,
    ...sheet.rows.map((r) => r.cells),
  ];

  const ws = XLSX.utils.aoa_to_sheet(body);

  // Widths have to be set by hand — SheetJS ships no autofit, and without this
  // every name column opens eight characters wide.
  ws["!cols"] = sheet.headers.map((h, i) => ({
    wch: Math.min(
      40,
      Math.max(
        h.length + 2,
        ...sheet.rows.map((r) => String(r.cells[i] ?? "").length + 2)
      )
    ),
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Attendance");
  XLSX.writeFile(wb, fileName(sheet.title, "xlsx"));
};

/* ── PDF ────────────────────────────────────────────────────────────────── */

const PDF_FONT_SIZE = 8;
const PDF_ROW_HEIGHT = 16;
const PDF_HEADER_HEIGHT = 18;
const PDF_PAD = 4;

export const exportToPdf = (sheet: ExportSheet) => {
  // Landscape: a register is far wider than it is tall once the dates are in.
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const margin = 32;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const usable = pageWidth - margin * 2;

  doc.setFontSize(PDF_FONT_SIZE);

  // Columns are sized from what they actually hold rather than by a fixed
  // ratio: a register is mostly one-letter date columns, and giving those the
  // same room as the name column is what used to push IDs onto a second line
  // and over the row below.
  const widths = sheet.headers.map((h, i) => {
    const longest = sheet.rows.reduce(
      (w, r) => Math.max(w, doc.getTextWidth(String(r.cells[i] ?? ""))),
      doc.getTextWidth(String(h))
    );
    // Capped, or one unusually long cell — a mail address, a list of three
    // courses — takes the page and squeezes the short columns beside it until
    // even their headings are cut short.
    return Math.min(longest + PDF_PAD * 2, usable * 0.32);
  });
  const natural = widths.reduce((a, b) => a + b, 0);
  // Scale to the page either way — spare room goes back to the columns, and an
  // over-wide table is squeezed rather than run off the edge.
  const scale = usable / natural;
  for (let i = 0; i < widths.length; i++) widths[i] *= scale;

  const xOf = (i: number) =>
    margin + widths.slice(0, i).reduce((a, b) => a + b, 0);

  // Whatever is left after squeezing gets cut, so a long name can never bleed
  // into the column beside it.
  const fit = (text: string, width: number) => {
    const room = width - PDF_PAD * 2;
    if (doc.getTextWidth(text) <= room) return text;
    let cut = text;
    while (cut.length > 1 && doc.getTextWidth(`${cut}...`) > room)
      cut = cut.slice(0, -1);
    return `${cut}...`;
  };

  // The first column is a name and reads better ranged left; everything else is
  // a mark, a date or a number, and lines up down the middle.
  const drawCell = (text: string, i: number, top: number, height: number) => {
    const shown = fit(text, widths[i]);
    const baseline = top + height / 2 + PDF_FONT_SIZE / 2 - 1.5;
    if (i === 0) doc.text(shown, xOf(i) + PDF_PAD, baseline);
    else doc.text(shown, xOf(i) + widths[i] / 2, baseline, { align: "center" });
  };

  let y = margin;
  let tableTop = 0;

  // Verticals are drawn once per page, from the header down to wherever the
  // last row landed — drawing them per cell would be thousands of strokes.
  const closeGrid = () => {
    if (!tableTop) return;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
    for (let i = 0; i <= widths.length; i++) {
      const x = i === widths.length ? margin + usable : xOf(i);
      doc.line(x, tableTop, x, y);
    }
    doc.line(margin, tableTop, margin + usable, tableTop);
  };

  const drawHeaderRow = () => {
    tableTop = y;
    doc.setFillColor(243, 244, 246);
    doc.rect(margin, y, usable, PDF_HEADER_HEIGHT, "F");
    doc.setFontSize(PDF_FONT_SIZE);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(60);
    sheet.headers.forEach((h, i) =>
      drawCell(String(h), i, y, PDF_HEADER_HEIGHT)
    );
    doc.setFont("helvetica", "normal");
    y += PDF_HEADER_HEIGHT;
  };

  doc.setFontSize(14);
  doc.setTextColor(20);
  doc.text(sheet.title, margin, y + 10);
  y += 20;

  if (sheet.subtitle) {
    doc.setFontSize(9);
    doc.setTextColor(110);
    doc.text(sheet.subtitle, margin, y + 8);
    y += 14;
  }
  if (sheet.note) {
    doc.setFontSize(8);
    doc.setTextColor(180, 40, 40);
    doc.text(sheet.note, margin, y + 8);
    y += 14;
  }

  y += 6;
  drawHeaderRow();

  doc.setFontSize(PDF_FONT_SIZE);
  for (const row of sheet.rows) {
    if (y + PDF_ROW_HEIGHT > pageHeight - margin) {
      closeGrid();
      doc.addPage();
      y = margin;
      drawHeaderRow();
      doc.setFontSize(PDF_FONT_SIZE);
    }

    const setRowColor = () => {
      if (row.isLow) doc.setTextColor(180, 30, 30);
      else doc.setTextColor(40);
    };

    if (row.isLow) {
      doc.setFillColor(254, 226, 226);
      doc.rect(margin, y, usable, PDF_ROW_HEIGHT, "F");
    }
    setRowColor();

    row.cells.forEach((cell, i) => {
      const text = String(cell ?? "");
      // A present mark reads as the brand green even on a red low-attendance
      // row — the row colour is about the student, not about that day.
      if (text === "P") doc.setTextColor(40, 95, 20);
      drawCell(text, i, y, PDF_ROW_HEIGHT);
      if (text === "P") setRowColor();
    });

    y += PDF_ROW_HEIGHT;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
    doc.line(margin, y, margin + usable, y);
  }

  closeGrid();

  doc.save(fileName(sheet.title, "pdf"));
};

/* ── Word ───────────────────────────────────────────────────────────────── */

/** Grey hairlines on every edge, so the table reads as a table on paper too. */
const WORD_BORDER = { style: BorderStyle.SINGLE, size: 2, color: "CBD5E1" };
const WORD_BORDERS = {
  top: WORD_BORDER,
  bottom: WORD_BORDER,
  left: WORD_BORDER,
  right: WORD_BORDER,
};

const wordCell = (
  text: string,
  opts?: { head?: boolean; low?: boolean; first?: boolean }
) =>
  new TableCell({
    borders: WORD_BORDERS,
    // Word packs text against the cell edge by default; a register with this
    // many columns needs the breathing room to stay readable.
    margins: { top: 40, bottom: 40, left: 80, right: 80 },
    shading: opts?.head
      ? { fill: "F3F4F6" }
      : opts?.low
      ? { fill: "FEE2E2" }
      : undefined,
    children: [
      new Paragraph({
        // Names range left, everything else — marks, dates, amounts — centres,
        // matching the on-screen table and the PDF.
        alignment: opts?.first ? AlignmentType.LEFT : AlignmentType.CENTER,
        children: [
          new TextRun({
            text,
            bold: opts?.head,
            color: opts?.head ? "334155" : opts?.low ? "B91C1C" : "1F2937",
            size: 18, // half-points, so 9pt — a register has a lot of columns
          }),
        ],
      }),
    ],
  });

export const exportToWord = async (sheet: ExportSheet) => {
  // Landscape once a table is wider than a portrait page can carry without
  // squeezing every column to a couple of characters.
  const landscape = sheet.headers.length > 6;

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              orientation: landscape
                ? PageOrientation.LANDSCAPE
                : PageOrientation.PORTRAIT,
            },
            margin: { top: 720, bottom: 720, left: 720, right: 720 },
          },
        },
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 60 },
            children: [
              new TextRun({ text: sheet.title, bold: true, color: "285F14" }),
            ],
          }),
          ...(sheet.subtitle
            ? [
                new Paragraph({
                  spacing: { after: 40 },
                  children: [
                    new TextRun({
                      text: sheet.subtitle,
                      size: 18,
                      color: "6B7280",
                    }),
                  ],
                }),
              ]
            : []),
          ...(sheet.note
            ? [
                new Paragraph({
                  children: [
                    new TextRun({ text: sheet.note, color: "B91C1C", size: 18 }),
                  ],
                }),
              ]
            : []),
          new Paragraph({ text: "", spacing: { after: 120 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                // Repeated at the top of every page — a table that runs over
                // the page break is unreadable without its headings.
                tableHeader: true,
                children: sheet.headers.map((h, i) =>
                  wordCell(h, { head: true, first: i === 0 })
                ),
              }),
              ...sheet.rows.map(
                (r) =>
                  new TableRow({
                    children: r.cells.map((c, i) =>
                      wordCell(String(c ?? ""), { low: r.isLow, first: i === 0 })
                    ),
                  })
              ),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: `Generated ${dayjs().format("DD MMM YYYY, h:mm A")}`,
                size: 16,
                color: "9CA3AF",
              }),
            ],
          }),
        ],
      },
    ],
  });

  saveBlob(await Packer.toBlob(doc), fileName(sheet.title, "docx"));
};
