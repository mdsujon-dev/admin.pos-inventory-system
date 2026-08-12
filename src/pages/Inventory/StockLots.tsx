import { Empty, Select, Switch, Table, Tag } from "antd";
import dayjs from "dayjs";
import { Layers, Package, Wallet } from "lucide-react";
import { useState } from "react";
import PageHeader from "../../components/Common/PageHeader";
import PageMeta from "../../components/Common/PageMeta";
import Money from "../../components/shared/Money";
import {
  IProduct,
  useGetProductsQuery,
} from "../../redux/features/inventory/productApi";
import {
  IStockLot,
  useGetProductLotsQuery,
} from "../../redux/features/purchasing/purchaseApi";
import { SectionCard, StatTile } from "./Products/ProductFormUI";

/**
 * The batches behind one product.
 *
 * Stock is a single number everywhere else in the panel; this is the screen
 * that shows what that number is made of — which arrival it came from, what
 * each one cost, and which will sell first. It is also where a "why is my
 * profit lower this month" question gets answered, because the reason is
 * usually a batch bought dearer than the last one.
 */
const StockLots = () => {
  const [productId, setProductId] = useState<string | undefined>();
  const [includeSpent, setIncludeSpent] = useState(false);

  const { data: productData } = useGetProductsQuery([
    { name: "limit", value: 500 },
  ]);
  const products: IProduct[] = productData?.data?.data || [];

  const { data, isFetching } = useGetProductLotsQuery(
    { productId: productId as string, includeSpent },
    { skip: !productId }
  );

  const lots: IStockLot[] = data?.data || [];
  const open = lots.filter((lot) => lot.remaining > 0);
  const onHand = open.reduce((sum, lot) => sum + lot.remaining, 0);
  const value = open.reduce((sum, lot) => sum + lot.remaining * lot.unitCost, 0);

  return (
    <div>
      <PageMeta
        title="Stock Batches - POS & Inventory"
        description="FIFO cost layers behind every product's stock"
        noindex
      />
      <PageHeader
        title="Stock Batches"
        subtitle="What the shelf count is actually made of, and what each batch cost"
        breadcrumbs={[
          { title: "Dashboard", path: "/" },
          { title: "Inventory" },
          { title: "Stock Batches" },
        ]}
      />

      <div className="mb-5 flex flex-wrap items-center gap-4">
        <Select
          value={productId}
          onChange={setProductId}
          showSearch
          optionFilterProp="label"
          placeholder="Pick a product"
          className="min-w-[320px]"
          options={products.map((product) => ({
            label: `${product.name} (${product.sku})`,
            value: product._id,
          }))}
        />
        <label className="flex items-center gap-2 text-sm text-secondary-600">
          <Switch
            size="small"
            checked={includeSpent}
            onChange={setIncludeSpent}
          />
          Show spent batches
        </label>
      </div>

      {!productId ? (
        <div className="rounded-xl border border-dashed border-secondary-300 py-12">
          <Empty description="Pick a product to see the batches behind its stock" />
        </div>
      ) : (
        <>
          <div className="mb-5 grid gap-3 sm:grid-cols-3">
            <StatTile icon={Package} label="On hand" tone="brand">
              {onHand}
            </StatTile>
            <StatTile icon={Wallet} label="Stock value" tone="brand">
              <Money value={value} />
            </StatTile>
            <StatTile
              icon={Layers}
              label="Open batches"
              tone="muted"
              note={`${lots.length} in total`}
            >
              {open.length}
            </StatTile>
          </div>

          <SectionCard
            icon={Layers}
            title="Batches"
            subtitle="Oldest first — that is the order sales consume them in"
          >
            <Table
              dataSource={[...lots].sort(
                (a, b) =>
                  new Date(a.receivedAt).getTime() -
                  new Date(b.receivedAt).getTime()
              )}
              rowKey="_id"
              loading={isFetching}
              size="small"
              pagination={{ pageSize: 20, hideOnSinglePage: true }}
              columns={[
                {
                  title: "Received",
                  key: "receivedAt",
                  width: 130,
                  render: (_: unknown, row: IStockLot) => (
                    <div>
                      <p className="m-0 text-sm text-secondary-800">
                        {dayjs(row.receivedAt).format("DD MMM YYYY")}
                      </p>
                      {row.reference && (
                        <span className="font-mono text-[11px] text-secondary-400">
                          {row.reference}
                        </span>
                      )}
                    </div>
                  ),
                },
                {
                  title: "Vendor",
                  key: "vendor",
                  width: 160,
                  render: (_: unknown, row: IStockLot) =>
                    typeof row.vendor === "object" && row.vendor ? (
                      row.vendor.name
                    ) : (
                      <span className="text-secondary-400">Opening stock</span>
                    ),
                },
                {
                  title: "Unit cost",
                  key: "unitCost",
                  width: 110,
                  render: (_: unknown, row: IStockLot) => (
                    <span className="font-medium text-secondary-800">
                      <Money value={row.unitCost} />
                    </span>
                  ),
                },
                {
                  title: "Received",
                  key: "quantity",
                  width: 90,
                  render: (_: unknown, row: IStockLot) => row.quantity,
                },
                {
                  title: "Remaining",
                  key: "remaining",
                  width: 110,
                  render: (_: unknown, row: IStockLot) =>
                    row.remaining > 0 ? (
                      <span className="font-semibold text-primary-700">
                        {row.remaining}
                      </span>
                    ) : (
                      <Tag className="!m-0 !text-[11px]">Spent</Tag>
                    ),
                },
                {
                  title: "Value left",
                  key: "value",
                  width: 110,
                  render: (_: unknown, row: IStockLot) => (
                    <Money value={row.remaining * row.unitCost} />
                  ),
                },
                {
                  title: "Expiry",
                  key: "expiryDate",
                  width: 120,
                  render: (_: unknown, row: IStockLot) => {
                    if (!row.expiryDate)
                      return <span className="text-secondary-400">—</span>;
                    const expired = dayjs(row.expiryDate).isBefore(dayjs());
                    return (
                      <span className={expired ? "font-medium text-danger" : ""}>
                        {dayjs(row.expiryDate).format("DD MMM YYYY")}
                      </span>
                    );
                  },
                },
              ]}
            />
          </SectionCard>
        </>
      )}
    </div>
  );
};

export default StockLots;
