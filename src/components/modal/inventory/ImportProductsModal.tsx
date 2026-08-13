import { Alert, Modal, Table, Upload } from "antd";
import { Download, FileSpreadsheet, Upload as UploadIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import Button from "../../ui/Button";
import { useImportProductsMutation } from "../../../redux/features/inventory/productApi";

/**
 * The columns the file is read from.
 *
 * Only `name` and `sellingPrice` are needed; the rest fill in what they can.
 * Names are matched loosely so a spreadsheet with "Selling Price" or
 * "selling_price" still lands — a shop's existing file is whatever it is, and
 * asking them to rewrite the headers is asking them not to bother.
 */
const FIELDS = [
  "name",
  "sku",
  "barcode",
  "category",
  "subCategory",
  "brand",
  "unit",
  "purchasePrice",
  "cost",
  "sellingPrice",
  "discountPrice",
  "quantity",
  "lowStockAlert",
  "expiryDate",
  "description",
] as const;

const normalise = (header: string) =>
  header.toLowerCase().replace(/[^a-z0-9]/g, "");

const FIELD_BY_HEADER = new Map(
  FIELDS.map((field) => [normalise(field), field])
);

interface ParsedRow {
  key: number;
  [field: string]: unknown;
}

interface Outcome {
  row: number;
  name: string;
  status: "created" | "failed";
  message?: string;
}

/**
 * Loading a shop's existing product list.
 *
 * A business moving onto this system already has its stock written down
 * somewhere — almost always a spreadsheet. Typing four hundred products in by
 * hand is the reason a changeover stalls, so the file goes in as it is and the
 * screen reports what happened line by line.
 */
const ImportProductsModal = ({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (value: boolean) => void;
}) => {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [outcomes, setOutcomes] = useState<Outcome[] | null>(null);
  const [importProducts, { isLoading }] = useImportProductsMutation();

  const reset = () => {
    setRows([]);
    setFileName("");
    setOutcomes(null);
  };

  const read = async (file: File) => {
    try {
      const book = XLSX.read(await file.arrayBuffer());
      const sheet = book.Sheets[book.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: "",
      });

      const parsed = raw.map((line, index) => {
        const row: ParsedRow = { key: index };
        for (const [header, value] of Object.entries(line)) {
          const field = FIELD_BY_HEADER.get(normalise(header));
          if (field) row[field] = value;
        }
        return row;
      });

      // A file with no recognised name column is a file in the wrong shape;
      // saying so now beats a hundred rows of "No name".
      if (!parsed.some((row) => String(row.name ?? "").trim())) {
        toast.error("No 'name' column found — check the headings");
        return;
      }

      setRows(parsed);
      setFileName(file.name);
      setOutcomes(null);
    } catch {
      toast.error("Could not read that file");
    }
  };

  const downloadTemplate = () => {
    const sheet = XLSX.utils.json_to_sheet([
      {
        name: "Shampoo 200ml",
        sku: "",
        barcode: "",
        category: "Personal Care",
        subCategory: "Hair",
        brand: "Sunsilk",
        unit: "Piece",
        purchasePrice: 120,
        cost: 5,
        sellingPrice: 150,
        discountPrice: "",
        quantity: 24,
        lowStockAlert: 5,
        expiryDate: "",
        description: "",
      },
    ]);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "Products");
    XLSX.writeFile(book, "product-import-template.xlsx");
  };

  const submit = async () => {
    if (!rows.length) return;
    try {
      const result = await importProducts({
        // `key` is the table's row id, not a product field.
        rows: rows.map((row) => {
          const rest = { ...row } as Record<string, unknown>;
          delete rest.key;
          return rest;
        }),
      }).unwrap();
      setOutcomes(result?.data?.outcomes ?? []);
      toast.success(result?.message || "Import finished");
    } catch (e: any) {
      toast.error(e?.data?.message || "Could not import that file");
    }
  };

  const failed = outcomes?.filter((row) => row.status === "failed") ?? [];

  return (
    <Modal
      title="Import products"
      open={open}
      onCancel={() => {
        reset();
        setOpen(false);
      }}
      footer={null}
      width={860}
      destroyOnHidden
    >
      {!outcomes && (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Upload
              accept=".xlsx,.xls,.csv"
              showUploadList={false}
              beforeUpload={(file) => {
                read(file as unknown as File);
                return false;
              }}
            >
              <Button variant="default">
                <UploadIcon className="h-4 w-4" />
                Choose a file
              </Button>
            </Upload>
            <Button variant="link" onClick={downloadTemplate}>
              <Download className="h-4 w-4" />
              Download the template
            </Button>
            {fileName && (
              <span className="flex items-center gap-1.5 text-[12px] text-secondary-500">
                <FileSpreadsheet className="h-4 w-4" />
                {fileName} · {rows.length} row{rows.length === 1 ? "" : "s"}
              </span>
            )}
          </div>

          <Alert
            type="info"
            showIcon
            className="!mb-3"
            message="Only a name and a selling price are required"
            description="Categories, brands and units are created if they do not exist yet. Every row becomes a simple product; products with variants are still added from the form."
          />

          {rows.length > 0 && (
            <>
              <p className="m-0 mb-1.5 text-[12px] font-semibold text-secondary-600">
                First few rows, as they were read
              </p>
              <Table
                size="small"
                dataSource={rows.slice(0, 8)}
                pagination={false}
                scroll={{ x: true }}
                columns={[
                  { title: "Name", dataIndex: "name", key: "name" },
                  { title: "Category", dataIndex: "category", key: "category" },
                  { title: "Brand", dataIndex: "brand", key: "brand" },
                  { title: "Unit", dataIndex: "unit", key: "unit" },
                  { title: "Buy", dataIndex: "purchasePrice", key: "buy" },
                  { title: "Sell", dataIndex: "sellingPrice", key: "sell" },
                  { title: "Qty", dataIndex: "quantity", key: "qty" },
                ]}
              />
              <div className="mt-4 flex justify-end">
                <Button
                  variant="primary"
                  loading={isLoading}
                  onClick={submit}
                >
                  Import {rows.length} product{rows.length === 1 ? "" : "s"}
                </Button>
              </div>
            </>
          )}
        </>
      )}

      {outcomes && (
        <>
          <Alert
            type={failed.length ? "warning" : "success"}
            showIcon
            className="!mb-3"
            message={`${outcomes.length - failed.length} created, ${
              failed.length
            } skipped`}
            description={
              failed.length
                ? "Fix the rows below in your file and import it again — the ones that worked will be refused as duplicates, so nothing doubles."
                : "Every row went in."
            }
          />

          {failed.length > 0 && (
            <Table
              size="small"
              rowKey="row"
              dataSource={failed}
              pagination={{ pageSize: 8, hideOnSinglePage: true }}
              columns={[
                { title: "Row", dataIndex: "row", key: "row", width: 70 },
                { title: "Name", dataIndex: "name", key: "name" },
                { title: "Why", dataIndex: "message", key: "message" },
              ]}
            />
          )}

          <div className="mt-4 flex justify-end gap-2">
            <Button variant="default" onClick={reset}>
              Import another file
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                reset();
                setOpen(false);
              }}
            >
              Done
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
};

export default ImportProductsModal;
