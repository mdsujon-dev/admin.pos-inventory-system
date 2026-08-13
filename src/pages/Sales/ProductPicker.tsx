import { Input, Modal, Select } from "antd";
import { Check, Loader2, PackageSearch, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import Button from "../../components/ui/Button";
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

const ALL = "all";

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
  /** What the search box has settled on, a beat behind the typing. */
  const [term, setTerm] = useState("");
  const [category, setCategory] = useState<string>(ALL);
  const [subCategory, setSubCategory] = useState<string>(ALL);
  const [brand, setBrand] = useState<string>(ALL);
  const searchRef = useRef<HTMLInputElement>(null);

  // One request per pause, not one per keystroke. On a counter connection the
  // difference between those two is whether the grid feels alive or stuck.
  useEffect(() => {
    const timer = setTimeout(() => setTerm(search.trim()), 250);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: categoryData } = useGetCategoriesQuery(
    [{ name: "limit", value: 100 }],
    { skip: !open }
  );
  const categories: ICategory[] = categoryData?.data?.data ?? [];

  const { data: subCategoryData } = useGetSubCategoriesQuery(
    [
      { name: "limit", value: 100 },
      ...(category !== ALL ? [{ name: "category", value: category }] : []),
    ],
    { skip: !open }
  );
  const subCategories: ISubCategory[] = subCategoryData?.data?.data ?? [];

  const { data: brandData } = useGetBrandsQuery([{ name: "limit", value: 100 }], {
    skip: !open,
  });
  const brands: IBrand[] = brandData?.data?.data ?? [];

  const { data, isFetching } = useGetProductsQuery(
    [
      { name: "limit", value: 50 },
      { name: "isActive", value: true },
      ...(term ? [{ name: "keyword", value: term }] : []),
      ...(category !== ALL ? [{ name: "category", value: category }] : []),
      ...(subCategory !== ALL
        ? [{ name: "subCategory", value: subCategory }]
        : []),
      ...(brand !== ALL ? [{ name: "brand", value: brand }] : []),
    ],
    { skip: !open }
  );

  const products: IProduct[] = useMemo(() => data?.data?.data ?? [], [data]);
  const rows = useMemo(() => toPickRows(products), [products]);

  const filtered = category !== ALL || subCategory !== ALL || brand !== ALL;

  const reset = () => {
    setCategory(ALL);
    setSubCategory(ALL);
    setBrand(ALL);
  };

  useEffect(() => {
    if (!open) return;
    setSearch("");
    setTerm("");
    reset();
    // The cashier opened this to type a name, so the caret starts there.
    const timer = setTimeout(() => searchRef.current?.focus(), 120);
    return () => clearTimeout(timer);
  }, [open]);

  const pick = (row: PickRow) => {
    if (row.stock <= 0) return;
    onPick(row.code);
    setOpen(false);
  };

  /**
   * Enter takes the first result.
   *
   * Typing a name and pressing Enter is how a till is used when both hands are
   * busy; making the cashier reach for the mouse to confirm the one obvious
   * match is the slowest possible ending to a fast search.
   */
  const takeFirst = () => {
    const first = rows.find((row) => row.stock > 0);
    if (first) pick(first);
  };

  return (
    <Modal
      title={
        <div className="flex items-baseline gap-2">
          <span>Add an item</span>
          {rows.length > 0 && (
            <span className="text-[12px] font-normal text-secondary-400">
              {rows.length} result{rows.length === 1 ? "" : "s"}
            </span>
          )}
        </div>
      }
      open={open}
      onCancel={() => setOpen(false)}
      footer={null}
      width={1000}
      destroyOnHidden
    >
      {/* The controls stay put while the grid scrolls under them — a filter
          you have to scroll back up to change is a filter nobody changes. */}
      <div className="sticky top-0 z-10 -mx-6 mb-3 border-b border-secondary-100 bg-white px-6 pb-3">
        <Input
          ref={searchRef as never}
          size="large"
          allowClear
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onPressEnter={takeFirst}
          placeholder="Type a product name, SKU or barcode…"
          prefix={<Search className="h-4 w-4 text-secondary-400" />}
          suffix={
            isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : null
          }
          className="!rounded-md"
        />

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Select
            value={category}
            onChange={(value) => {
              setCategory(value);
              // A sub-category from the old category would match nothing.
              setSubCategory(ALL);
            }}
            showSearch
            optionFilterProp="label"
            className="min-w-[170px] flex-1"
            options={[
              { label: "All categories", value: ALL },
              ...categories.map((row) => ({ label: row.name, value: row._id })),
            ]}
          />
          <Select
            value={subCategory}
            onChange={setSubCategory}
            showSearch
            optionFilterProp="label"
            className="min-w-[170px] flex-1"
            options={[
              { label: "All sub-categories", value: ALL },
              ...subCategories.map((row) => ({
                label: row.name,
                value: row._id,
              })),
            ]}
          />
          <Select
            value={brand}
            onChange={setBrand}
            showSearch
            optionFilterProp="label"
            className="min-w-[170px] flex-1"
            options={[
              { label: "All brands", value: ALL },
              ...brands.map((row) => ({ label: row.name, value: row._id })),
            ]}
          />
          {filtered && (
            <Button variant="link" size="sm" onClick={reset}>
              <X className="h-3.5 w-3.5" />
              Clear filters
            </Button>
          )}
        </div>
      </div>

      <div className="max-h-[52vh] overflow-y-auto pr-1">
        {rows.length === 0 ? (
          <div className="grid place-items-center gap-2 py-16 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-md bg-secondary-50 text-secondary-300">
              <PackageSearch className="h-6 w-6" />
            </span>
            <p className="m-0 text-[14px] font-semibold text-secondary-700">
              {term ? `Nothing matches “${term}”` : "Nothing to show"}
            </p>
            <p className="m-0 max-w-[320px] text-[12px] text-secondary-400">
              {filtered
                ? "Try clearing the filters — the item may sit under a different heading."
                : "Only active products appear here."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
            {rows.map((row) => {
              const out = row.stock <= 0;
              const inCart = selectedCodes.includes(row.code);
              const low =
                !out && row.lowStockAt != null && row.stock <= row.lowStockAt;
              const onOffer = row.price < row.listPrice;
              const src = imageUrl(row.image);

              return (
                <button
                  key={row.key}
                  type="button"
                  disabled={out}
                  onClick={() => pick(row)}
                  className={`group relative flex flex-col overflow-hidden rounded-md border text-left transition ${
                    out
                      ? "cursor-not-allowed border-secondary-100 bg-secondary-50 opacity-60"
                      : inCart
                        ? "border-primary bg-primary-50/60"
                        : "border-secondary-200 bg-white hover:border-primary hover:bg-primary-50/30"
                  }`}
                >
                  <div className="relative h-28 w-full bg-secondary-50">
                    {src ? (
                      <img
                        src={src}
                        alt={row.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                      />
                    ) : (
                      <div className="grid h-full place-items-center text-secondary-300">
                        <PackageSearch className="h-6 w-6" />
                      </div>
                    )}

                    {/* Already in the cart: a corner mark, not a veil over the
                        photo — the picture is how the item is recognised. */}
                    {inCart && (
                      <span className="absolute left-1.5 top-1.5 grid h-5 w-5 place-items-center rounded bg-primary text-white">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    )}

                    {onOffer && (
                      <span className="absolute bottom-1.5 left-1.5 rounded bg-primary px-1.5 py-[1px] text-[9px] font-bold uppercase tracking-[0.08em] text-white">
                        Offer
                      </span>
                    )}

                    {/* Stock on the tile, because a cashier picking by sight
                        needs to know before the tap, not after the refusal.
                        Amber once it is near the reorder level — the moment
                        worth noticing is before the last one goes. */}
                    <span
                      className={`absolute right-1.5 top-1.5 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        out
                          ? "bg-danger/10 text-danger"
                          : low
                            ? "bg-[#fffbeb] text-[#92400e]"
                            : "bg-white/90 text-secondary-700"
                      }`}
                    >
                      {out ? "None" : row.stock}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1 p-2">
                    {row.brand && (
                      <p className="m-0 truncate text-[10px] font-semibold uppercase tracking-wide text-secondary-400">
                        {row.brand}
                      </p>
                    )}
                    <p className="m-0 line-clamp-2 text-[12.5px] font-semibold leading-tight text-secondary-800">
                      {row.name}
                    </p>
                    {row.variantName && (
                      <span className="mt-1 inline-block max-w-full truncate rounded bg-primary-50 px-1.5 py-0.5 text-[10px] font-medium text-primary-700">
                        {row.variantName}
                      </span>
                    )}
                    <p className="m-0 mt-1.5 flex items-baseline gap-1.5">
                      <span className="text-[14px] font-bold text-primary-700">
                        <Money value={row.price} />
                      </span>
                      {onOffer && (
                        <span className="text-[11px] text-secondary-400 line-through">
                          <Money value={row.listPrice} />
                        </span>
                      )}
                      {row.unit && (
                        <span className="text-[10px] text-secondary-400">
                          / {row.unit}
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
