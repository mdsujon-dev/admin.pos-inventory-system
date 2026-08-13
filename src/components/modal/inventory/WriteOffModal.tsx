import { DatePicker, Input, InputNumber, Modal, Select } from "antd";
import dayjs from "dayjs";
import { PackageX, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import Button from "../../ui/Button";
import Money from "../../shared/Money";
import {
  IProduct,
  useGetProductsQuery,
} from "../../../redux/features/inventory/productApi";
import {
  useCreateWriteOffMutation,
  WRITE_OFF_REASONS,
} from "../../../redux/features/inventory/writeOffApi";

/** One sellable thing, flattened out of a product or one of its variants. */
interface Option {
  key: string;
  product: string;
  variantId: string | null;
  label: string;
  sku: string;
  stock: number;
  cost: number;
}

const toOptions = (products: IProduct[]): Option[] =>
  products.flatMap((product): Option[] => {
    if (product.type === "single") {
      return [
        {
          key: product._id,
          product: product._id,
          variantId: null,
          label: product.name,
          sku: product.sku,
          stock: product.quantity ?? 0,
          cost: (product.purchasePrice ?? 0) + (product.cost ?? 0),
        },
      ];
    }
    return (product.variants ?? []).map((variant): Option => ({
      key: `${product._id}-${variant._id ?? variant.sku}`,
      product: product._id,
      variantId: (variant._id as string) ?? null,
      label: `${product.name} — ${
        variant.options.map((option) => option.value).join(" / ") || variant.name
      }`,
      sku: variant.sku,
      stock: variant.quantity ?? 0,
      cost: (variant.purchasePrice ?? 0) + (variant.cost ?? 0),
    }));
  });

interface Line extends Option {
  quantity: number;
}

/**
 * Taking stock off the shelf that was never sold.
 *
 * Expired, broken, stolen, handed out as a sample — the goods are gone either
 * way, and the shop is poorer by what they cost. Recording it is the only way
 * the shelf count stays true and the loss is ever counted; the alternative is
 * a stocktake three months later that nobody can explain.
 *
 * The cost shown here is the product's own purchase price, as an estimate. The
 * figure that reaches the books is whatever the batches actually gave up,
 * worked out on the server — this is a preview, not the answer.
 */
const WriteOffModal = ({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (value: boolean) => void;
}) => {
  const [search, setSearch] = useState("");
  const [term, setTerm] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [reason, setReason] = useState<string>("expired");
  const [note, setNote] = useState("");
  const [when, setWhen] = useState(dayjs());

  const [createWriteOff, { isLoading }] = useCreateWriteOffMutation();

  useEffect(() => {
    const timer = setTimeout(() => setTerm(search.trim()), 250);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!open) return;
    setSearch("");
    setTerm("");
    setLines([]);
    setReason("expired");
    setNote("");
    setWhen(dayjs());
  }, [open]);

  const { data } = useGetProductsQuery(
    [
      { name: "limit", value: 30 },
      { name: "isActive", value: true },
      ...(term ? [{ name: "keyword", value: term }] : []),
    ],
    { skip: !open }
  );

  const options = useMemo(
    // Nothing on the shelf cannot be written off, so it is not offered.
    () => toOptions(data?.data?.data ?? []).filter((row) => row.stock > 0),
    [data]
  );

  const add = (key: string) => {
    const option = options.find((row) => row.key === key);
    if (!option || lines.some((row) => row.key === key)) return;
    setLines((current) => [...current, { ...option, quantity: 1 }]);
    setSearch("");
  };

  const estimate = lines.reduce(
    (sum, row) => sum + row.quantity * row.cost,
    0
  );

  const onSubmit = async () => {
    if (!lines.length) {
      toast.error("Pick at least one item");
      return;
    }
    try {
      const result = await createWriteOff({
        items: lines.map((row) => ({
          product: row.product,
          variantId: row.variantId,
          quantity: row.quantity,
        })),
        reason,
        note: note.trim() || undefined,
        writtenOffAt: when.toISOString(),
      }).unwrap();
      toast.success(result?.message || "Written off");
      setOpen(false);
    } catch (e: any) {
      toast.error(e?.data?.message || "Could not write that off");
    }
  };

  return (
    <Modal
      title="Write stock off"
      open={open}
      onCancel={() => setOpen(false)}
      onOk={onSubmit}
      okText="Write off"
      okButtonProps={{ loading: isLoading, disabled: lines.length === 0 }}
      width={720}
      destroyOnHidden
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <p className="m-0 mb-1 text-[12px] font-medium text-secondary-600">
            Why is it leaving the shelf?
          </p>
          <Select
            value={reason}
            onChange={setReason}
            className="w-full"
            options={WRITE_OFF_REASONS.map((row) => ({ ...row }))}
          />
        </div>
        <div>
          <p className="m-0 mb-1 text-[12px] font-medium text-secondary-600">
            When
          </p>
          <DatePicker
            value={when}
            onChange={(value) => value && setWhen(value)}
            format="DD MMM YYYY"
            allowClear={false}
            className="w-full"
          />
        </div>
      </div>

      <p className="m-0 mb-1 mt-3 text-[12px] font-medium text-secondary-600">
        What is going
      </p>
      <Select
        showSearch
        value={null}
        placeholder="Search a product or variant…"
        className="w-full"
        filterOption={false}
        onSearch={setSearch}
        onChange={add}
        options={options.map((row) => ({
          value: row.key,
          label: (
            <span className="flex items-center justify-between gap-3">
              <span className="truncate">{row.label}</span>
              <span className="shrink-0 text-[11px] text-secondary-400">
                {row.stock} on shelf
              </span>
            </span>
          ),
        }))}
      />

      {lines.length > 0 && (
        <div className="mt-3 overflow-hidden rounded-md border border-secondary-100">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-secondary-50 text-left text-[11px] uppercase tracking-wide text-secondary-500">
                <th className="px-3 py-2">Item</th>
                <th className="px-3 py-2 text-center">On shelf</th>
                <th className="px-3 py-2 text-center">Writing off</th>
                <th className="px-3 py-2 text-right">Cost</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {lines.map((row) => (
                <tr key={row.key} className="border-t border-secondary-100">
                  <td className="px-3 py-2">
                    <p className="m-0 font-medium text-secondary-800">
                      {row.label}
                    </p>
                    <span className="font-mono text-[11px] text-secondary-400">
                      {row.sku}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center text-secondary-500">
                    {row.stock}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <InputNumber
                      size="small"
                      min={1}
                      max={row.stock}
                      value={row.quantity}
                      onChange={(value) =>
                        setLines((current) =>
                          current.map((line) =>
                            line.key === row.key
                              ? {
                                  ...line,
                                  quantity: Math.min(
                                    Number(value) || 1,
                                    line.stock
                                  ),
                                }
                              : line
                          )
                        )
                      }
                      className="w-[72px]"
                    />
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-secondary-800">
                    <Money value={row.quantity * row.cost} />
                  </td>
                  <td className="px-1 py-2 text-center">
                    <Button
                      variant="custom"
                      size="sm"
                      onClick={() =>
                        setLines((current) =>
                          current.filter((line) => line.key !== row.key)
                        )
                      }
                      className="!h-7 !w-7 !bg-transparent !px-0 !shadow-none text-secondary-300 hover:text-danger"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Input.TextArea
        className="!mt-3"
        rows={2}
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="What happened? (optional)"
      />

      <div className="mt-3 flex items-center justify-between rounded-md bg-[#fffbeb] px-3 py-2">
        <span className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-[#92400e]">
          <PackageX className="h-4 w-4" />
          Estimated loss
        </span>
        <span className="text-[17px] font-bold text-[#92400e]">
          <Money value={estimate} />
        </span>
      </div>
      <p className="m-0 mt-1.5 text-[11px] text-secondary-400">
        An estimate at the product&rsquo;s own cost. The books take whatever the
        actual batches cost, worked out when this is saved.
      </p>
    </Modal>
  );
};

export default WriteOffModal;
