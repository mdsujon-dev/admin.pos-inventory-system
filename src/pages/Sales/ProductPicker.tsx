import { Input, Modal, Segmented, Tag } from "antd";
import { Loader2, PackageSearch, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import Money from "../../components/shared/Money";
import { config } from "../../config";
import {
  ICategory,
  useGetCategoriesQuery,
} from "../../redux/features/inventory/categoryApi";
import {
  IProduct,
  useGetProductsQuery,
} from "../../redux/features/inventory/productApi";

/** One thing that can be rung up: a product, or one variant of one. */
interface PickRow {
  key: string;
  name: string;
  variantName: string;
  /** What the scan box would be given. */
  code: string;
  price: number;
  listPrice: number;
  stock: number;
  image: string | null;
}

const imageUrl = (path?: string | null) =>
  !path ? null : path.startsWith("http") ? path : `${config.image_access_url}${path}`;

const offerOf = (row: { sellingPrice: number; discountPrice?: number | null }) =>
  row.discountPrice && row.discountPrice > 0 && row.discountPrice < row.sellingPrice
    ? row.discountPrice
    : row.sellingPrice;

const toRows = (products: IProduct[]): PickRow[] =>
  products.flatMap((product) => {
    if (product.type === "single") {
      const code = product.barcode?.trim() || product.sku;
      return code
        ? [
            {
              key: product._id,
              name: product.name,
              variantName: "",
              code,
              price: offerOf(product),
              listPrice: product.sellingPrice,
              stock: product.quantity ?? 0,
              image: product.images?.[0] ?? null,
            },
          ]
        : [];
    }

    return (product.variants ?? [])
      .map((variant): PickRow | null => {
        const code = variant.barcode?.trim() || variant.sku;
        if (!code) return null;
        return {
          key: `${product._id}-${variant._id ?? variant.sku}`,
          name: product.name,
          variantName:
            variant.options.map((option) => option.value).join(" / ") ||
            variant.name,
          code,
          price: offerOf(variant),
          listPrice: variant.sellingPrice,
          stock: variant.quantity ?? 0,
          image: variant.image ?? product.images?.[0] ?? null,
        };
      })
      .filter((row): row is PickRow => row !== null);
  });

/**
 * Finding an item without its barcode.
 *
 * The scanner is still the fast path and the safe one, but a label peels off,
 * a customer changes their mind at the counter, and loose goods never had a
 * barcode to begin with. Refusing to serve those cases does not make the shop
 * more careful — it makes the cashier keep a calculator under the desk.
 *
 * What this returns is a *code*, not a cart line. The picked item then goes
 * through the same scan call as everything else, so the server's checks —
 * expired, inactive, nothing left on the shelf — apply either way.
 */
const ProductPicker = ({
  open,
  setOpen,
  onPick,
}: {
  open: boolean;
  setOpen: (value: boolean) => void;
  onPick: (code: string) => void;
}) => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const searchRef = useRef<HTMLInputElement>(null);

  const { data: categoryData } = useGetCategoriesQuery(
    [{ name: "limit", value: 100 }],
    { skip: !open }
  );
  const categories: ICategory[] = categoryData?.data?.data ?? [];

  const { data, isFetching } = useGetProductsQuery(
    [
      { name: "limit", value: 60 },
      { name: "isActive", value: true },
      ...(search ? [{ name: "keyword", value: search }] : []),
      ...(category !== "all" ? [{ name: "category", value: category }] : []),
    ],
    { skip: !open }
  );

  const products: IProduct[] = useMemo(() => data?.data?.data ?? [], [data]);
  const rows = useMemo(() => toRows(products), [products]);

  useEffect(() => {
    if (open) {
      setSearch("");
      setCategory("all");
      // The cashier opened this to type a name, so the caret starts there.
      const timer = setTimeout(() => searchRef.current?.focus(), 120);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const pick = (row: PickRow) => {
    if (row.stock <= 0) return;
    onPick(row.code);
    setOpen(false);
  };

  return (
    <Modal
      title="Add an item"
      open={open}
      onCancel={() => setOpen(false)}
      footer={null}
      width={880}
      destroyOnHidden
    >
      <div className="mb-3 flex flex-col gap-3">
        <Input
          ref={searchRef as never}
          size="large"
          allowClear
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Type a product name, SKU or barcode…"
          prefix={<Search className="h-4 w-4 text-secondary-400" />}
          suffix={
            isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : null
          }
          className="!rounded-xl"
        />

        {categories.length > 0 && (
          <div className="overflow-x-auto">
            <Segmented
              value={category}
              onChange={(value) => setCategory(String(value))}
              options={[
                { label: "All", value: "all" },
                ...categories.map((row) => ({
                  label: row.name,
                  value: row._id,
                })),
              ]}
            />
          </div>
        )}
      </div>

      <div className="max-h-[52vh] overflow-y-auto pr-1">
        {rows.length === 0 ? (
          <div className="grid place-items-center gap-2 py-14 text-center">
            <PackageSearch className="h-8 w-8 text-secondary-300" />
            <p className="m-0 text-[13px] text-secondary-500">
              {search
                ? `Nothing matches “${search}”`
                : "No active products in this category"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {rows.map((row) => {
              const out = row.stock <= 0;
              const src = imageUrl(row.image);
              return (
                <button
                  key={row.key}
                  type="button"
                  disabled={out}
                  onClick={() => pick(row)}
                  className={`flex flex-col overflow-hidden rounded-xl border text-left transition ${
                    out
                      ? "cursor-not-allowed border-secondary-100 bg-secondary-50 opacity-60"
                      : "border-secondary-200 bg-white hover:border-primary hover:shadow-[0_8px_20px_-12px_rgba(1,149,50,.6)]"
                  }`}
                >
                  <div className="relative h-24 w-full bg-secondary-50">
                    {src ? (
                      <img
                        src={src}
                        alt={row.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-full place-items-center text-secondary-300">
                        <PackageSearch className="h-6 w-6" />
                      </div>
                    )}
                    {/* Stock on the tile, because a cashier picking by sight
                        needs to know before the tap, not after the refusal. */}
                    <span
                      className={`absolute right-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                        out
                          ? "bg-danger/10 text-danger"
                          : "bg-white/90 text-secondary-700"
                      }`}
                    >
                      {out ? "None" : row.stock}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1 p-2">
                    <p className="m-0 line-clamp-2 text-[12px] font-semibold leading-tight text-secondary-800">
                      {row.name}
                    </p>
                    {row.variantName && (
                      <Tag className="!m-0 !mt-1 !border-primary-200 !bg-primary-50 !px-1.5 !text-[10px] !text-primary-700">
                        {row.variantName}
                      </Tag>
                    )}
                    <p className="m-0 mt-1 flex items-baseline gap-1.5">
                      <span className="text-[14px] font-bold text-primary-700">
                        <Money value={row.price} />
                      </span>
                      {row.price < row.listPrice && (
                        <span className="text-[11px] text-secondary-400 line-through">
                          <Money value={row.listPrice} />
                        </span>
                      )}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ProductPicker;
