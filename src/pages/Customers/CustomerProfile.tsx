import {
  Button,
  DatePicker,
  Input,
  Modal,
  Select,
  Tag,
  Timeline,
} from "antd";
import DataTable from "../../components/Table/DataTable";
import dayjs, { Dayjs } from "dayjs";
import {
  ArrowLeft,
  MessageSquarePlus,
  Package,
  Phone,
  Receipt,
  ShoppingBag,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import PageHeader from "../../components/Common/PageHeader";
import PageMeta from "../../components/Common/PageMeta";
import PermissionGate from "../../components/Common/PermissionGate";
import { Loading } from "../../components/shared/Loading";
import Money from "../../components/shared/Money";
import {
  useGetCustomerProfileQuery,
  useLogActivityMutation,
} from "../../redux/features/crm/crmApi";
import { SectionCard, StatTile } from "../Inventory/Products/ProductFormUI";

const ACTIVITY_LABELS: Record<string, string> = {
  purchase: "Purchase",
  call: "Call",
  sms: "SMS",
  visit: "Visit",
  note: "Note",
  complaint: "Complaint",
  followup: "Follow-up",
};

/**
 * Everything about one customer on one screen.
 *
 * The feed mixes purchases with calls and notes deliberately: "bought twice in
 * March, complained in April, has not been back" is a story, and it is
 * unreadable if the buying and the talking live in two separate lists.
 */
const CustomerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [logging, setLogging] = useState(false);
  const [type, setType] = useState("call");
  const [summary, setSummary] = useState("");
  const [detail, setDetail] = useState("");
  const [followUpAt, setFollowUpAt] = useState<Dayjs | null>(null);

  const [invoicesPage, setInvoicesPage] = useState(1);
  const [invoicesLimit, setInvoicesLimit] = useState(10);
  const [favouritesPage, setFavouritesPage] = useState(1);
  const [favouritesLimit, setFavouritesLimit] = useState(8);

  const { data, isFetching } = useGetCustomerProfileQuery(id as string, {
    skip: !id,
  });
  const [logActivity, { isLoading: saving }] = useLogActivityMutation();

  if (isFetching) return <Loading />;

  const profile = data?.data;
  if (!profile) return null;

  const { customer, invoices, activity, favourites, totals } = profile;

  const submitLog = async () => {
    if (!summary.trim()) {
      toast.error("Say what happened");
      return;
    }
    try {
      await logActivity({
        customer: id,
        type,
        summary: summary.trim(),
        detail: detail.trim() || undefined,
        followUpAt: followUpAt ? followUpAt.toISOString() : null,
      }).unwrap();
      toast.success("Logged");
      setLogging(false);
      setSummary("");
      setDetail("");
      setFollowUpAt(null);
    } catch (error: any) {
      toast.error(error?.data?.message || "Could not log that");
    }
  };

  return (
    <div>
      <PageMeta
        title={`${customer.name} - Customer - POS & Inventory`}
        description="Customer history, balance and activity"
        noindex
      />
      <PageHeader
        title={customer.name}
        subtitle={customer.phone}
        breadcrumbs={[
          { title: "Dashboard", path: "/" },
          { title: "Sales" },
          { title: "Customers", path: "/customers" },
          { title: customer.name },
        ]}
        extra={
          <div className="flex gap-2">
            <Button
              icon={<ArrowLeft className="h-4 w-4" />}
              onClick={() => navigate("/customers")}
            >
              All customers
            </Button>
            <PermissionGate module="CRM" action="Create">
              <Button
                type="primary"
                icon={<MessageSquarePlus className="h-4 w-4" />}
                onClick={() => setLogging(true)}
                className="!border-0 !bg-gradient-to-r !from-primary-600 !to-primary-500 shadow-primary"
              >
                Log a call or note
              </Button>
            </PermissionGate>
          </div>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={Receipt} label="Purchases" tone="muted">
          {totals.invoiceCount}
        </StatTile>
        <StatTile icon={Wallet} label="Spent" tone="brand">
          <Money value={totals.billed} />
        </StatTile>
        <StatTile
          icon={ShoppingBag}
          label="Average sale"
          tone="brand"
          note={
            totals.lastPurchaseAt
              ? `Last in ${dayjs(totals.lastPurchaseAt).format("DD MMM YYYY")}`
              : undefined
          }
        >
          <Money value={totals.averageSale} />
        </StatTile>
        <StatTile
          icon={Phone}
          label="Owes"
          tone={totals.due > 0 ? "danger" : "muted"}
        >
          <Money value={totals.due} />
        </StatTile>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <SectionCard
            icon={Receipt}
            title="Purchases"
            subtitle="Newest first"
          >
            <DataTable
              data={invoices}
              rowKey="_id"
              isPaginate={invoices.length > invoicesLimit}
              currentPage={invoicesPage}
              setCurrentPage={setInvoicesPage}
              limit={invoicesLimit}
              setLimit={setInvoicesLimit}
              total={invoices.length}
              columns={[
                {
                  title: "Invoice",
                  key: "invoiceNo",
                  render: (_: unknown, row: any) => (
                    <div>
                      <p className="m-0 font-mono text-xs font-semibold">
                        {row.invoiceNo}
                      </p>
                      <span className="text-[11px] text-secondary-400">
                        {dayjs(row.saleDate).format("DD MMM YYYY")}
                      </span>
                    </div>
                  ),
                },
                {
                  title: "Items",
                  key: "items",
                  width: 70,
                  render: (_: unknown, row: any) =>
                    (row.items ?? []).reduce(
                      (sum: number, item: any) => sum + item.quantity,
                      0
                    ),
                },
                {
                  title: "Total",
                  key: "grandTotal",
                  width: 110,
                  render: (_: unknown, row: any) => (
                    <Money value={row.grandTotal} />
                  ),
                },
                {
                  title: "Due",
                  key: "due",
                  width: 100,
                  render: (_: unknown, row: any) =>
                    row.due > 0 ? (
                      <span className="font-medium text-danger">
                        <Money value={row.due} />
                      </span>
                    ) : (
                      <Tag className="!m-0 !border-primary-200 !bg-primary-50 !text-[11px] !text-primary-700">
                        Paid
                      </Tag>
                    ),
                },
                {
                  title: "",
                  key: "open",
                  width: 70,
                  render: (_: unknown, row: any) => (
                    <Button
                      size="small"
                      onClick={() => navigate(`/sales/invoices/${row._id}`)}
                    >
                      Open
                    </Button>
                  ),
                },
              ]}
            />
          </SectionCard>

          <SectionCard
            icon={Package}
            title="What they come in for"
            subtitle="Their own top items — not the shop's"
          >
            <DataTable
              data={favourites}
              rowKey={(row: any) =>
                `${row._id.product}-${row._id.variantId ?? "none"}`
              }
              isPaginate={favourites.length > favouritesLimit}
              currentPage={favouritesPage}
              setCurrentPage={setFavouritesPage}
              limit={favouritesLimit}
              setLimit={setFavouritesLimit}
              total={favourites.length}
              columns={[
                {
                  title: "Item",
                  key: "name",
                  render: (_: unknown, row: any) => (
                    <div className="min-w-0">
                      <p className="m-0 truncate text-sm text-secondary-800">
                        {row.name}
                        {row.variantName ? ` — ${row.variantName}` : ""}
                      </p>
                      <span className="font-mono text-[11px] text-secondary-400">
                        {row.sku}
                      </span>
                    </div>
                  ),
                },
                {
                  title: "Bought",
                  key: "timesBought",
                  width: 90,
                  render: (_: unknown, row: any) => `${row.timesBought}×`,
                },
                {
                  title: "Units",
                  key: "quantity",
                  width: 80,
                  render: (_: unknown, row: any) => row.quantity,
                },
                {
                  title: "Spent",
                  key: "spent",
                  width: 110,
                  render: (_: unknown, row: any) => <Money value={row.spent} />,
                },
              ]}
            />
          </SectionCard>
        </div>

        <SectionCard
          icon={MessageSquarePlus}
          title="Activity"
          subtitle="Purchases, calls and notes in one thread"
        >
          {activity.length === 0 ? (
            <p className="m-0 text-sm text-secondary-500">
              Nothing logged yet.
            </p>
          ) : (
            <Timeline
              items={activity.map((row: any) => ({
                color: row.type === "purchase" ? "green" : "gray",
                children: (
                  <div>
                    <p className="m-0 text-sm font-medium text-secondary-800">
                      {row.summary}
                    </p>
                    <p className="m-0 text-[11px] text-secondary-400">
                      {ACTIVITY_LABELS[row.type] ?? row.type} ·{" "}
                      {dayjs(row.happenedAt).format("DD MMM YYYY")}
                      {row.createdByName ? ` · ${row.createdByName}` : ""}
                    </p>
                    {row.detail && (
                      <p className="m-0 mt-1 text-xs text-secondary-600">
                        {row.detail}
                      </p>
                    )}
                    {row.followUpAt && !row.followUpDone && (
                      <Tag className="!mt-1 !border-danger/30 !bg-danger/10 !text-[11px] !text-danger">
                        Follow up {dayjs(row.followUpAt).format("DD MMM")}
                      </Tag>
                    )}
                  </div>
                ),
              }))}
            />
          )}
        </SectionCard>
      </div>

      <Modal
        open={logging}
        onCancel={() => setLogging(false)}
        title="Log an activity"
        okText="Save"
        confirmLoading={saving}
        onOk={submitLog}
      >
        <label className="mb-1 block text-[13px] font-medium text-secondary-700">
          What happened
        </label>
        <Select
          value={type}
          onChange={setType}
          className="mb-3 w-full"
          options={Object.entries(ACTIVITY_LABELS)
            .filter(([value]) => value !== "purchase")
            .map(([value, label]) => ({ value, label }))}
        />
        <Input
          className="mb-3"
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          placeholder="One line — e.g. Called about the delayed order"
        />
        <Input.TextArea
          className="mb-3"
          rows={3}
          value={detail}
          onChange={(event) => setDetail(event.target.value)}
          placeholder="Detail (optional)"
        />
        <label className="mb-1 block text-[13px] font-medium text-secondary-700">
          Follow up on
        </label>
        <DatePicker
          value={followUpAt}
          onChange={setFollowUpAt}
          className="w-full"
          placeholder="Optional — a promise with no date is one nobody keeps"
        />
      </Modal>
    </div>
  );
};

export default CustomerProfile;
