import { Input, Modal, Select, Tag } from "antd";
import { Check, Loader2, PackageSearch, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import Money from "../../components/shared/Money";
import {
  ICategory,
  useGetCategoriesQuery,
} from "../../redux/features/inventory/categoryApi";
import {
  IProduct,
  useGetProductsQuery,
} from "../../redux/features/inventory/productApi";
import { imageUrl, PickRow, toPickRows } from "./pickRows";
import {
  ISubCategory,
  useGetSubCategoriesQuery,
} from "../../redux/features/inventory/subCategoryApi";
import {
  IBrand,
  useGetBrandsQuery,
} from "../../redux/features/inventory/brandApi";

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
  selectedCodes = [],
}: {
  open: boolean;
  setOpen: (value: boolean) => void;
  onPick: (code: string) => void;
  selectedCodes?: string[];
}) => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [subCategory, setSubCategory] = useState<string>("all");
  const [brand, setBrand] = useState<string>("all");
  const searchRef = useRef<HTMLInputElement>(null);

  const { data: categoryData } = useGetCategoriesQuery(
    [{ name: "limit", value: 100 }],
    { skip: !open }
  );
  const categories: ICategory[] = categoryData?.data?.data ?? [];

  const { data: subCategoryData } = useGetSubCategoriesQuery(
    [{ name: "limit", value: 100 }, ...(category !== "all" ? [{ name: "category", value: category }] : [])],
    { skip: !open }
  );
  const subCategories: ISubCategory[] = subCategoryData?.data?.data ?? [];

  const { data: brandData } = useGetBrandsQuery(
    [{ name: "limit", value: 100 }],
    { skip: !open }
  );
  const brands: IBrand[] = brandData?.data?.data ?? [];

  const { data, isFetching } = useGetProductsQuery(
    [
      { name: "limit", value: 50 },
      { name: "isActive", value: true },
      ...(search ? [{ name: "keyword", value: search }] : []),
      ...(category !== "all" ? [{ name: "category", value: category }] : []),
      ...(subCategory !== "all" ? [{ name: "subCategory", value: subCategory }] : []),
      ...(brand !== "all" ? [{ name: "brand", value: brand }] : []),
    ],
    { skip: !open }
  );

  const products: IProduct[] = useMemo(() => data?.data?.data ?? [], [data]);
  const rows = useMemo(() => toPickRows(products), [products]);

  useEffect(() => {
    if (open) {
      setSearch("");
      setCategory("all");
      setSubCategory("all");
      setBrand("all");
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
      width={1000}
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
          className="!rounded-md"
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Select
            value={category}
            onChange={(val) => {
              setCategory(val);
              setSubCategory("all"); // Reset subcategory when category changes
            }}
            options={[
              { label: "All Categories", value: "all" },
              ...categories.map((c) => ({ label: c.name, value: c._id })),
            ]}
          />
          <Select
            value={subCategory}
            onChange={(val) => setSubCategory(val)}
            options={[
              { label: "All Sub-categories", value: "all" },
              ...subCategories.map((s) => ({ label: s.name, value: s._id })),
            ]}
          />
          <Select
            value={brand}
            onChange={(val) => setBrand(val)}
            options={[
              { label: "All Brands", value: "all" },
              ...brands.map((b) => ({ label: b.name, value: b._id })),
            ]}
          />
        </div>
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
                  className={`relative flex flex-col overflow-hidden rounded-md border text-left transition ${
                    out
                      ? "cursor-not-allowed border-secondary-100 bg-secondary-50 opacity-60"
                      : selectedCodes?.includes(row.code)
                      ? "border-primary-500 bg-primary-50 ring-2 ring-primary-500/50"
                      : "border-secondary-200 bg-white hover:border-primary"
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
                    {selectedCodes?.includes(row.code) && (
                      <div className="absolute inset-0 bg-primary-500/10 flex items-center justify-center">
                        <div className="bg-primary text-white rounded-full p-1 shadow-sm">
                          <Check className="h-5 w-5" />
                        </div>
                      </div>
                    )}
                    {/* Stock on the tile, because a cashier picking by sight
                        needs to know before the tap, not after the refusal. */}
                    <span
                      className={`absolute right-1.5 top-1.5 rounded px-1.5 py-0.5 text-[10px] font-semibold ${
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
