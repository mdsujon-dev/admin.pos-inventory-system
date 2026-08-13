import {
  Button,
  Checkbox,
  Input,
  InputNumber,
  Segmented,
  Select,
  Switch,
  Tag,
} from "antd";
import { ColumnsType } from "antd/es/table";
import { Boxes, Layers, Printer, ScanLine, Search } from "lucide-react";
import { ReactNode, useMemo, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import PageHeader from "../../../components/Common/PageHeader";
import PageMeta from "../../../components/Common/PageMeta";
import { MetricCard } from "../../../components/Common/MetricCard";
import Barcode from "../../../components/shared/Barcode";
import Money from "../../../components/shared/Money";
import QRCodeImage from "../../../components/shared/QRCodeImage";
import DataTable from "../../../components/Table/DataTable";
import TableEmpty from "../../../components/Table/TableEmpty";
import {
  IProduct,
  useGetProductsQuery,
} from "../../../redux/features/inventory/productApi";
import { SectionCard } from "../Products/ProductFormUI";

/** One printable label: a thing with its own code, price and name. */
export interface LabelItem {
  key: string;
  productName: string;
  /** "Red / S" for a variant, empty for a single product. */
  variantLabel: string;
  /** Who makes it. Small, above the name — the way a shelf label reads. */
  brand: string;
  /** "kg", "pcs" — printed beside the price so the price means something. */
  unit: string;
  code: string;
  /**
   * Where the code came from. A label printed from the SKU still scans, but
   * it means nobody has given that item a barcode of its own — worth seeing
   * before a hundred of them go on the shelf.
   */
  codeSource: "barcode" | "sku";
  price: number;
  /**
   * What it sells for today, if that is less than the ticket price.
   *
   * A label that shows only the offer price hides the saving, and a label that
   * shows only the ticket price is wrong at the till. Both, with the old one
   * struck through, is what a shopper is used to reading.
   */
  offerPrice: number | null;
  /**
   * How many are on the shelf.
   *
   * A shelf label is for something on a shelf, so this both filters the list
   * and answers the question anyone printing is actually asking: how many
   * copies do I need.
   */
  stock: number;
}

/**
 * Flattens products into label rows.
 *
 * A variable product is not one label — each variant is a separate physical
 * item with its own code and price, and printing the parent would give every
 * size the same barcode.
 */
/** A populated reference, or nothing readable. */
const nameOf = (ref: unknown) =>
  ref && typeof ref === "object" ? ((ref as { name?: string }).name ?? "") : "";

const shortUnit = (ref: unknown) =>
  ref && typeof ref === "object"
    ? ((ref as { shortName?: string; name?: string }).shortName ??
      (ref as { name?: string }).name ??
      "")
    : "";

/** The offer price, but only when it is actually an offer. */
const offerOf = (row: { sellingPrice: number; discountPrice?: number | null }) =>
  row.discountPrice && row.discountPrice > 0 && row.discountPrice < row.sellingPrice
    ? row.discountPrice
    : null;

const toLabelItems = (products: IProduct[]): LabelItem[] =>
  products.flatMap((product) => {
    const brand = nameOf(product.brand);
    const unit = shortUnit(product.unit);

    if (product.type === "single") {
      const own = product.barcode?.trim();
      const code = own || product.sku;
      return code
        ? [
            {
              key: product._id,
              productName: product.name,
              variantLabel: "",
              brand,
              unit,
              code,
              codeSource: own ? ("barcode" as const) : ("sku" as const),
              price: product.sellingPrice,
              offerPrice: offerOf(product),
              stock: product.quantity ?? 0,
            },
          ]
        : [];
    }

    return (product.variants ?? [])
      .map((variant) => {
        const own = variant.barcode?.trim();
        const code = own || variant.sku;
        if (!code) return null;
        return {
          key: `${product._id}-${variant._id ?? variant.sku}`,
          productName: product.name,
          variantLabel:
            variant.options.map((option) => option.value).join(" / ") ||
            variant.name,
          brand,
          unit,
          code,
          codeSource: own ? ("barcode" as const) : ("sku" as const),
          // The variant's own money, not the parent's — that is the whole
          // point of a variant having a price field.
          price: variant.sellingPrice,
          offerPrice: offerOf(variant),
          stock: variant.quantity ?? 0,
        };
      })
      .filter((item): item is LabelItem => item !== null);
  });

type LabelFormat = "barcode" | "qr";

/** CSS millimetres to pixels at the 96dpi the browser lays out in. */
const MM = 3.779527559;

/**
 * The stock a label is printed on.
 *
 * Retail shelf labels come off small thermal roll printers, not off A4 — the
 * printer holds one size of die-cut roll and every label is its own page. So
 * the size is the page size, and picking it here is what makes the output line
 * up with the physical roll instead of landing somewhere on a sheet of paper.
 *
 * `roll: false` is the fallback for printing onto plain paper on an ordinary
 * office printer, where the labels tile across the sheet and get cut by hand.
 */
interface LabelSize {
  label: string;
  hint: string;
  /** Millimetres, as the roll is sold. */
  width: number;
  height: number;
  roll: boolean;
}

const SIZES: Record<string, LabelSize> = {
  "38x25": {
    label: "38 × 25",
    hint: "The common shelf label",
    width: 38,
    height: 25,
    roll: true,
  },
  "50x25": {
    label: "50 × 25",
    hint: "Wider — fits a long barcode",
    width: 50,
    height: 25,
    roll: true,
  },
  "50x30": {
    label: "50 × 30",
    hint: "Room for name and price",
    width: 50,
    height: 30,
    roll: true,
  },
  "40x30": {
    label: "40 × 30",
    hint: "Squarer, good for QR",
    width: 40,
    height: 30,
    roll: true,
  },
  "32x19": {
    label: "32 × 19",
    hint: "Small items and pharmacy",
    width: 32,
    height: 19,
    roll: true,
  },
  "58mm": {
    label: "58 mm roll",
    hint: "Receipt-width thermal printers",
    width: 58,
    height: 40,
    roll: true,
  },
  a4: {
    label: "A4 sheet",
    hint: "Plain paper, cut by hand",
    width: 48,
    height: 30,
    roll: false,
  },
};

/**
 * Type sized in millimetres, not pixels.
 *
 * A label is a physical object and the only question about its text is whether
 * a person can read it across a shelf. Millimetres survive the trip to the
 * printer unchanged; a pixel size set for the screen comes out at whatever the
 * printer's own resolution makes of it.
 *
 * 2.6mm is roughly 7.5pt — small, but this is a shelf label, and it is the
 * same height as the digits already printed under the bars.
 */
const TYPE = {
  brand: 1.9,
  name: 2.6,
  nameLead: 1.15,
  price: 3.4,
  /** The struck-through ticket price sits beside the offer, so it is smaller. */
  wasPrice: 2.2,
};

/**
 * How much room the symbol gets once the text has taken its share.
 *
 * Worked out per size rather than fixed, because a 19mm label and a 40mm one
 * are not the same label with different margins — on the short one the bars
 * have to give way or there is nothing left to scan.
 *
 * Taller labels give the name two lines. Most product names do not fit on one
 * at this width, and a name cut off after three words is not a name.
 */
const codeBox = (
  size: LabelSize,
  showName: boolean,
  showPrice: boolean,
  showBrand: boolean
) => {
  const nameLines = size.height >= 24 ? 2 : 1;
  const innerWidth = size.width - 3;
  const used =
    (showBrand ? TYPE.brand * 1.2 : 0) +
    (showName ? TYPE.name * TYPE.nameLead * nameLines : 0) +
    (showPrice ? TYPE.price * 1.15 : 0) +
    2;
  const innerHeight = Math.max(size.height - used, 5);
  return { innerWidth, innerHeight, nameLines };
};

/** What gets drawn in the middle of the label. */
const FORMATS: Record<
  LabelFormat,
  {
    label: string;
    render: (
      value: string,
      box: { innerWidth: number; innerHeight: number }
    ) => ReactNode;
  }
> = {
  barcode: {
    label: "Barcode",
    render: (value, box) => (
      <Barcode
        value={value}
        moduleWidth={1.6}
        height={Math.max(box.innerHeight * MM - 9, 16)}
        maxWidth={box.innerWidth * MM}
      />
    ),
  },
  qr: {
    label: "QR Code",
    render: (value, box) => (
      <QRCodeImage
        value={value}
        // Square, so the smaller of the two dimensions is the one that binds.
        size={Math.max(
          Math.min(box.innerWidth, box.innerHeight) * MM - 6,
          32
        )}
        showValue={false}
      />
    ),
  },
};

/**
 * Shelf labels, in either format.
 *
 * One screen rather than two: picking the items, counting the copies and
 * laying out the sheet were identical on both of the pages this replaces, and
 * the only real difference — what gets drawn in the middle of the label — is
 * now a toggle. Two screens also meant deciding which one to open before
 * knowing which format the printer had loaded.
 *
 * Every variant is its own row, because every variant is its own pack with its
 * own code; printing the parent would put one barcode on every size.
 */
const PrintLabelsView = () => {
  const [format, setFormat] = useState<LabelFormat>("barcode");
  const [sizeKey, setSizeKey] = useState<string>("38x25");
  const size = SIZES[sizeKey];
  const { render: renderCode } = FORMATS[format];

  const title = "Print Labels";
  const subtitle = "Build a sheet of shelf labels — barcode or QR — and print it";
  const canonicalPath = "/inventory/print-labels";

  const [searchText, setSearchText] = useState("");
  const [copies, setCopies] = useState<Record<string, number>>({});
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [showName, setShowName] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  const [showBrand, setShowBrand] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  /**
   * Out-of-stock rows are hidden by default.
   *
   * A shelf label goes on a shelf, and there is nothing to put it on. The
   * switch exists because printing ahead of a delivery is a real thing people
   * do — but it is the exception, so it is not what the screen opens on.
   */
  const [includeOutOfStock, setIncludeOutOfStock] = useState(false);

  const box = codeBox(size, showName, showPrice, showBrand);

  const sheetRef = useRef<HTMLDivElement>(null);

  /**
   * The page is the label.
   *
   * On a roll printer the paper is already cut to size, so every label has to
   * be its own page with no margin — anything else and the content creeps a
   * little further off the sticker with each one. On plain paper the labels
   * tile instead, and the page is an ordinary sheet with a margin to cut in.
   */
  const handlePrint = useReactToPrint({
    contentRef: sheetRef,
    documentTitle: title,
    pageStyle: size.roll
      ? `
      @page { size: ${size.width}mm ${size.height}mm; margin: 0; }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; }
        /* The global print rules position this absolutely, which is right for
           printing the live page but fatal here: absolutely positioned content
           does not paginate, so every label after the first was dropped. */
        .label-print {
          display: block !important;
          position: static !important;
          padding: 0 !important;
        }
        .pos-label {
          width: ${size.width}mm;
          height: ${size.height}mm;
          border: 0 !important;
          border-radius: 0 !important;
          break-after: page;
          page-break-after: always;
        }
        .pos-label:last-child { break-after: auto; page-break-after: auto; }
      }
    `
      : `
      @page { size: A4; margin: 8mm; }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        /* Same reason as above — a sheet of labels runs past one page. */
        .label-print { position: static !important; }
      }
    `,
  });

  const { data, isFetching } = useGetProductsQuery([
    { name: "limit", value: 200 },
    { name: "isActive", value: true },
    ...(searchText ? [{ name: "keyword", value: searchText }] : []),
  ]);

  // Memoised rather than `data?.data?.data || []` inline: the fallback would
  // be a new array identity on every render, so the flattening below would
  // re-run (and re-key every label) even when nothing changed.
  const products: IProduct[] = useMemo(() => data?.data?.data || [], [data]);
  const allItems = useMemo(() => toLabelItems(products), [products]);

  const labelItems = useMemo(
    () =>
      includeOutOfStock ? allItems : allItems.filter((item) => item.stock > 0),
    [allItems, includeOutOfStock]
  );

  const hiddenCount = allItems.length - labelItems.length;
  const noBarcode = labelItems.filter(
    (item) => item.codeSource === "sku"
  ).length;

  const selectedItems = useMemo(
    () => labelItems.filter((item) => selectedKeys.includes(item.key)),
    [labelItems, selectedKeys]
  );

  // Each selected row expands into as many copies as asked for; that expanded
  // list is what the sheet renders.
  const sheet = useMemo(
    () =>
      selectedItems.flatMap((item) =>
        Array.from({ length: copies[item.key] ?? 1 }, (_, index) => ({
          ...item,
          copyKey: `${item.key}-${index}`,
        }))
      ),
    [selectedItems, copies]
  );

  /**
   * One label per unit on the shelf.
   *
   * The usual reason for opening this screen is a delivery that has just been
   * put out, and the copy count anybody wants is the count already on the row
   * beside it — typing it in twenty times is work the screen can do.
   */
  const copiesFromStock = () =>
    setCopies((previous) => {
      const next = { ...previous };
      selectedItems.forEach((item) => {
        next[item.key] = Math.min(Math.max(item.stock, 1), 200);
      });
      return next;
    });

  const columns: ColumnsType<LabelItem> = [
    {
      title: "Product",
      key: "product",
      render: (_, record) => (
        <div className="min-w-0">
          <p className="m-0 truncate font-medium text-secondary-800">
            {record.productName}
          </p>
          {record.variantLabel && (
            <Tag className="!m-0 !mt-1 !border-primary-200 !bg-primary-50 !text-[11px] !text-primary-700">
              {record.variantLabel}
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: "Code",
      key: "code",
      width: 200,
      render: (_, record) => (
        <div className="min-w-0">
          <p className="m-0 truncate font-mono text-[12px] text-secondary-700">
            {record.code}
          </p>
          {record.codeSource === "sku" && (
            // Not an error — it scans fine. It just means nobody gave this
            // item a barcode of its own, which is worth knowing before a
            // hundred labels go out.
            <Tag className="!m-0 !mt-0.5 !border-[#f59e0b55] !bg-[#fffbeb] !px-1.5 !text-[10px] !text-[#92400e]">
              from SKU
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: "Price",
      key: "price",
      width: 110,
      render: (_, record) => (
        <span className="font-semibold text-secondary-800">
          <Money value={record.price} />
        </span>
      ),
    },
    {
      title: "In stock",
      key: "stock",
      width: 100,
      render: (_, record) =>
        record.stock > 0 ? (
          <span className="font-medium text-secondary-800">{record.stock}</span>
        ) : (
          <Tag className="!m-0 !border-danger/30 !bg-danger/10 !text-[11px] !text-danger">
            None
          </Tag>
        ),
    },
    {
      title: "Copies",
      key: "copies",
      width: 110,
      render: (_, record) => (
        <InputNumber
          size="small"
          min={1}
          max={200}
          precision={0}
          value={copies[record.key] ?? 1}
          onChange={(value) =>
            setCopies((previous) => ({
              ...previous,
              [record.key]: Number(value) || 1,
            }))
          }
          className="w-full"
        />
      ),
    },
  ];

  return (
    <div>
      <PageMeta
        title={`${title} - POS & Inventory Admin Panel`}
        description={subtitle}
        canonicalUrl={`${window.location.origin}${canonicalPath}`}
        noindex={true}
      />
      <PageHeader
        title={title}
        subtitle={subtitle}
        breadcrumbs={[
          { title: "Dashboard", path: "/" },
          { title: "Inventory" },
          { title },
        ]}
        extra={
          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={sizeKey}
              onChange={setSizeKey}
              className="min-w-[180px]"
              // The size a printer is loaded with is the first thing to pick,
              // because it decides how much room the rest of the label has.
              options={Object.entries(SIZES).map(([value, row]) => ({
                value,
                label: (
                  <span className="flex items-center justify-between gap-3">
                    <span>
                      {row.label}
                      {row.roll ? " mm" : ""}
                    </span>
                    <span className="text-[11px] text-secondary-400">
                      {row.hint}
                    </span>
                  </span>
                ),
              }))}
            />
            <Segmented
              value={format}
              onChange={(value) => setFormat(value as LabelFormat)}
              options={Object.entries(FORMATS).map(([value, row]) => ({
                value,
                label: row.label,
              }))}
            />
            <Button
              type="primary"
              icon={<Printer className="w-4 h-4" />}
              disabled={sheet.length === 0}
              onClick={() => handlePrint()}
              className="!border-0 !bg-gradient-to-r !from-primary-600 !to-primary-500 shadow-primary"
            >
              Print {sheet.length > 0 ? `(${sheet.length})` : ""}
            </Button>
          </div>
        }
      />

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={Boxes}
          label="Labelable items"
          accent="#3b82f6"
          hint={
            hiddenCount > 0
              ? `${hiddenCount} hidden — nothing on the shelf`
              : "Every variant counts on its own"
          }
          value={labelItems.length}
          loading={isFetching}
        />
        <MetricCard
          icon={Layers}
          label="Selected"
          accent="#8b5cf6"
          hint={
            selectedItems.length === 0
              ? "Tick rows to build the sheet"
              : "Selection survives paging"
          }
          value={selectedItems.length}
          loading={isFetching}
        />
        <MetricCard
          icon={Printer}
          label="Labels to print"
          accent="#019532"
          hint={`${FORMATS[format].label} · ${
            size.roll ? `${size.width}×${size.height} mm` : "A4 sheet"
          }`}
          value={sheet.length}
          loading={isFetching}
        />
        <MetricCard
          icon={ScanLine}
          label="Without a barcode"
          accent={noBarcode > 0 ? "#f59e0b" : "#64748b"}
          hint={
            noBarcode > 0
              ? "Printing their SKU instead — still scans"
              : "Every item has its own code"
          }
          value={noBarcode}
          loading={isFetching}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {/* Two thirds for the picking, one for the sheet: choosing what to
            label is where the work is, and the preview only has to be
            recognisable. */}
        <div className="xl:col-span-2">
        <SectionCard
          title="Pick what to label"
          subtitle="Every variant is its own row, with its own code"
        >
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              placeholder="Search by name, SKU or barcode..."
              prefix={<Search className="w-4 h-4 text-secondary-400" />}
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setCurrentPage(1);
              }}
              allowClear
            />
            <Button
              size="middle"
              disabled={selectedItems.length === 0}
              onClick={copiesFromStock}
            >
              Copies = stock
            </Button>
          </div>

          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <label className="flex items-center gap-2 text-[13px] text-secondary-600">
              <Switch
                size="small"
                checked={includeOutOfStock}
                onChange={(value) => {
                  setIncludeOutOfStock(value);
                  setCurrentPage(1);
                }}
              />
              Include out of stock
            </label>
            {selectedKeys.length > 0 && (
              <Button size="small" onClick={() => setSelectedKeys([])}>
                Clear {selectedKeys.length} selected
              </Button>
            )}
          </div>

          <DataTable
            data={labelItems}
            columns={columns}
            rowKey="key"
            loading={isFetching}
            total={labelItems.length}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            limit={limit}
            setLimit={setLimit}
            isPaginate={labelItems.length > limit}
            selectRow
            selectedRowKeys={selectedKeys}
            setSelectedRowKeys={setSelectedKeys}
            emptyText={
              <TableEmpty
                icon={ScanLine}
                title={
                  hiddenCount > 0
                    ? "Nothing in stock to label"
                    : "No printable items"
                }
                hint={
                  hiddenCount > 0
                    ? "Turn on “Include out of stock” to print ahead of a delivery."
                    : "A product needs a SKU or barcode before it can produce a label."
                }
              />
            }
          />
        </SectionCard>
        </div>

        <SectionCard
          title="The sheet"
          subtitle={
            size.roll
              ? `${size.width} × ${size.height} mm — one label per page`
              : "Tiled on an A4 sheet, to be cut by hand"
          }
        >
          <div className="mb-3 flex flex-wrap items-center gap-4">
            <Checkbox
              checked={showName}
              onChange={(e) => setShowName(e.target.checked)}
            >
              <span className="text-[13px]">Product name</span>
            </Checkbox>
            <Checkbox
              checked={showPrice}
              onChange={(e) => setShowPrice(e.target.checked)}
            >
              <span className="text-[13px]">Price</span>
            </Checkbox>
            <Checkbox
              checked={showBrand}
              onChange={(e) => setShowBrand(e.target.checked)}
            >
              <span className="text-[13px]">Brand</span>
            </Checkbox>
          </div>

          {sheet.length === 0 ? (
            <TableEmpty
              icon={Printer}
              title="Nothing on the sheet yet"
              hint="Tick an item on the left and it appears here, ready to print."
            />
          ) : (
            // A fixed height, not a max: the panel beside it is a full-page
            // table, and a preview that grew with the sheet would drag the page
            // down to whatever length somebody happened to ask for.
            <div className="h-[520px] overflow-y-auto overscroll-contain rounded-lg border border-secondary-100 bg-secondary-50 p-2">
              {/* Only this element is handed to the printer, so the border and
                  the grey backing around it never reach the paper.
                  `label-print` is what the global print rules un-hide. */}
              <div
                ref={sheetRef}
                className="label-print flex flex-wrap justify-center gap-3 bg-white p-2"
              >
                {sheet.map((label) => (
                  <div
                    key={label.copyKey}
                    // Sized in millimetres, the unit the roll is sold in, so
                    // what is on screen is what comes off the printer.
                    style={{
                      width: `${size.width}mm`,
                      height: `${size.height}mm`,
                    }}
                    className="pos-label flex break-inside-avoid flex-col items-center justify-center overflow-hidden rounded border border-dashed border-secondary-300 bg-white px-[1.5mm] py-[1mm]"
                  >
                    {showName && (
                      <p
                        className="m-0 w-full overflow-hidden text-center font-semibold text-black"
                        style={{
                          fontSize: `${TYPE.name}mm`,
                          lineHeight: TYPE.nameLead,
                          // Two lines then stop, rather than one line cut mid
                          // word — the second line is usually where the size or
                          // the colour lives.
                          display: "-webkit-box",
                          WebkitBoxOrient: "vertical",
                          WebkitLineClamp: box.nameLines,
                        }}
                      >
                        {label.productName}
                        {label.variantLabel ? ` · ${label.variantLabel}` : ""}
                      </p>
                    )}
                    {renderCode(label.code, box)}
                    {showPrice && (
                      <p
                        className="m-0 font-bold text-black"
                        style={{
                          fontSize: `${TYPE.price}mm`,
                          lineHeight: 1.15,
                        }}
                      >
                        {label.price}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
};

export default PrintLabelsView;
