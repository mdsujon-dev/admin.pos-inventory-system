import {
  Button,
  Card,
  Checkbox,
  Empty,
  Input,
  InputNumber,
  Segmented,
  Switch,
  Table,
  Tag,
} from "antd";
import { ColumnsType } from "antd/es/table";
import { Printer, Search } from "lucide-react";
import { ReactNode, useMemo, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import PageHeader from "../../../components/Common/PageHeader";
import PageMeta from "../../../components/Common/PageMeta";
import Barcode from "../../../components/shared/Barcode";
import QRCodeImage from "../../../components/shared/QRCodeImage";
import {
  IProduct,
  useGetProductsQuery,
} from "../../../redux/features/inventory/productApi";

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
    width: 200,
    render: (value) => <Barcode value={value} moduleWidth={1.6} height={48} />,
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
      includeOutOfStock
        ? allItems
        : allItems.filter((item) => item.stock > 0),
    [allItems, includeOutOfStock]
  );

  const hiddenCount = allItems.length - labelItems.length;

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

  const columns: ColumnsType<LabelItem> = [
    {
      title: "Product",
      key: "product",
      render: (_, record) => (
        <div>
          <p className="m-0 font-medium text-secondary-800">
            {record.productName}
          </p>
          {record.variantLabel && (
            <Tag color="var(--primary)" className="mt-1">
              {record.variantLabel}
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: "Code",
      key: "code",
      width: 190,
      render: (_, record) => (
        <div>
          <span className="font-mono text-xs">{record.code}</span>
          {record.codeSource === "sku" && (
            <Tag className="!ml-1.5 !m-0 !px-1.5 !text-[10px]">from SKU</Tag>
          )}
        </div>
      ),
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      width: 100,
    },
    {
      title: "In stock",
      key: "stock",
      width: 90,
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
          <div className="flex items-center gap-3">
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

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Select Items">
          <Input
            placeholder="Search by name, SKU or barcode..."
            prefix={<Search className="w-4 h-4 text-secondary-400" />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            className="mb-3"
          />

          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <label className="flex items-center gap-2 text-sm text-secondary-600">
              <Switch
                size="small"
                checked={includeOutOfStock}
                onChange={setIncludeOutOfStock}
              />
              Include out of stock
            </label>
            {!includeOutOfStock && hiddenCount > 0 && (
              <span className="text-xs text-secondary-400">
                {hiddenCount} item{hiddenCount === 1 ? "" : "s"} hidden — nothing
                on the shelf to label
              </span>
            )}
          </div>
          <Table
            dataSource={labelItems}
            columns={columns}
            rowKey="key"
            size="small"
            loading={isFetching}
            pagination={{ pageSize: 10, showSizeChanger: false }}
            rowSelection={{
              selectedRowKeys: selectedKeys,
              onChange: (keys) => setSelectedKeys(keys as string[]),
            }}
            locale={{
              emptyText: hiddenCount > 0
                ? "Nothing in stock to label. Turn on 'Include out of stock' to print ahead of a delivery."
                : "No printable items. A product needs a SKU or barcode to produce a label.",
            }}
          />
        </Card>

        <Card
          title="Preview"
          extra={
            <div className="flex items-center gap-4">
              <Checkbox
                checked={showName}
                onChange={(e) => setShowName(e.target.checked)}
              >
                Name
              </Checkbox>
              <Checkbox
                checked={showPrice}
                onChange={(e) => setShowPrice(e.target.checked)}
              >
                Price
              </Checkbox>
            </div>
          }
        >
          {sheet.length === 0 ? (
            <Empty description="Select items on the left to build the label sheet" />
          ) : (
            <div ref={sheetRef} className="flex flex-wrap gap-3 bg-white p-2">
              {sheet.map((label) => (
                <div
                  key={label.copyKey}
                  style={{ width: labelWidth }}
                  className="flex flex-col items-center border border-dashed border-secondary-300 rounded p-2 break-inside-avoid"
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
          )}
        </Card>
      </div>
    </div>
  );
};

export default PrintLabelsView;
