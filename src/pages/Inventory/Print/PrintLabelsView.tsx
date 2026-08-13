import { Button, Checkbox, Input, InputNumber, Segmented, Switch, Tag } from "antd";
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
  code: string;
  /**
   * Where the code came from. A label printed from the SKU still scans, but
   * it means nobody has given that item a barcode of its own — worth seeing
   * before a hundred of them go on the shelf.
   */
  codeSource: "barcode" | "sku";
  price: number;
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
const toLabelItems = (products: IProduct[]): LabelItem[] =>
  products.flatMap((product) => {
    if (product.type === "single") {
      const own = product.barcode?.trim();
      const code = own || product.sku;
      return code
        ? [
            {
              key: product._id,
              productName: product.name,
              variantLabel: "",
              code,
              codeSource: own ? ("barcode" as const) : ("sku" as const),
              price: product.sellingPrice,
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
          code,
          codeSource: own ? ("barcode" as const) : ("sku" as const),
          price: variant.sellingPrice,
          stock: variant.quantity ?? 0,
        };
      })
      .filter((item): item is LabelItem => item !== null);
  });

type LabelFormat = "barcode" | "qr";

/**
 * How each format is drawn, and how wide its label needs to be. A QR code is
 * square and a Code 128 barcode is a wide strip, so one width cannot serve
 * both without wasting half the sheet.
 */
const FORMATS: Record<
  LabelFormat,
  { label: string; width: number; render: (value: string) => ReactNode }
> = {
  barcode: {
    label: "Barcode",
    width: 210,
    // `maxWidth` is the label minus its padding. Without it a long SKU draws a
    // strip wider than the label it sits in and runs over the neighbour.
    render: (value) => (
      <Barcode value={value} moduleWidth={1.6} height={46} maxWidth={186} />
    ),
  },
  qr: {
    label: "QR Code",
    width: 130,
    render: (value) => <QRCodeImage value={value} size={96} />,
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
  const { width: labelWidth, render: renderCode } = FORMATS[format];

  const title = "Print Labels";
  const subtitle = "Build a sheet of shelf labels — barcode or QR — and print it";
  const canonicalPath = "/inventory/print-labels";

  const [searchText, setSearchText] = useState("");
  const [copies, setCopies] = useState<Record<string, number>>({});
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [showName, setShowName] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
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

  const sheetRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: sheetRef,
    documentTitle: title,
    pageStyle: `
      @page { margin: 8mm; }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
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
          hint={`${FORMATS[format].label} format`}
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
          subtitle="What comes out of the printer, at roughly the printed size"
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
                    style={{ width: labelWidth }}
                    className="flex max-w-full break-inside-avoid flex-col items-center overflow-hidden rounded border border-dashed border-secondary-300 p-2"
                  >
                    {showName && (
                      <p className="m-0 mb-1 w-full truncate text-center text-[11px] font-semibold text-black">
                        {label.productName}
                        {label.variantLabel ? ` · ${label.variantLabel}` : ""}
                      </p>
                    )}
                    {renderCode(label.code)}
                    {showPrice && (
                      <p className="m-0 mt-1 text-[12px] font-bold text-black">
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
