import { Button, Switch, Tag } from "antd";
import dayjs from "dayjs";
import { CalendarClock, CheckCircle2, Clock, PhoneCall, Plus } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/Common/PageHeader";
import PageMeta from "../../components/Common/PageMeta";
import PermissionGate from "../../components/Common/PermissionGate";
import { MetricCard } from "../../components/Common/MetricCard";
import Money from "../../components/shared/Money";
import DataTable from "../../components/Table/DataTable";
import TableEmpty from "../../components/Table/TableEmpty";
import CompleteFollowUpModal from "../../components/modal/crm/CompleteFollowUpModal";
import FollowUpModal from "../../components/modal/crm/FollowUpModal";
import { useGetDueFollowUpsQuery } from "../../redux/features/crm/crmApi";

/**
 * What is owed a call today.
 *
 * The whole point of logging a conversation is the next one; without a dated
 * list, "I'll ring him next week" is a note nobody ever reads again.
 */
const FollowUps = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [scheduling, setScheduling] = useState(false);
  const [closing, setClosing] = useState<any | null>(null);
  /**
   * Due-only by default, because that is the working list.
   *
   * Without the switch, a promise scheduled for next week vanishes the moment
   * it is made and does not reappear until the day it lands — which reads as
   * the save having failed.
   */
  const [includeUpcoming, setIncludeUpcoming] = useState(false);

  const { data, isFetching } = useGetDueFollowUpsQuery(
    includeUpcoming ? [{ name: "includeUpcoming", value: "true" }] : undefined
  );

  const rows = data?.data ?? [];
  const today = dayjs().endOf("day");
  const overdue = rows.filter((row: any) =>
    dayjs(row.followUpAt).isBefore(dayjs(), "day")
  ).length;
  const dueToday = rows.filter((row: any) =>
    dayjs(row.followUpAt).isSame(dayjs(), "day")
  ).length;
  const upcoming = rows.filter((row: any) =>
    dayjs(row.followUpAt).isAfter(today)
  ).length;
  const owed = rows.reduce(
    (sum: number, row: any) => sum + (row.customer?.totalDue ?? 0),
    0
  );

  return (
    <div>
      <PageMeta
        title="Follow-ups - POS & Inventory"
        description="Customers owed a call"
        noindex
      />
      <PageHeader
        title="Follow-ups"
        subtitle="Calls and visits promised, and now due"
        breadcrumbs={[
          { title: "Dashboard", path: "/" },
          { title: "Sales" },
          { title: "Follow-ups" },
        ]}
        extra={
          <PermissionGate module="CRM" action="Create">
            <Button
              type="primary"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => setScheduling(true)}
              className="!border-0 !bg-gradient-to-r !from-primary-600 !to-primary-500 shadow-primary"
            >
              Schedule a follow-up
            </Button>
          </PermissionGate>
        }
      />

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={Clock}
          label="Overdue"
          accent={overdue > 0 ? "#f43f5e" : "#64748b"}
          hint={overdue > 0 ? "Promised and already late" : "Nothing is late"}
          value={overdue}
          loading={isFetching}
        />
        <MetricCard
          icon={PhoneCall}
          label="Due today"
          accent="#019532"
          hint="Ring these before closing"
          value={dueToday}
          loading={isFetching}
        />
        <MetricCard
          icon={CalendarClock}
          label="Upcoming"
          accent="#8b5cf6"
          hint={
            includeUpcoming ? "Scheduled ahead" : "Turn on the switch to see them"
          }
          value={includeUpcoming ? upcoming : "—"}
          loading={isFetching}
        />
        <MetricCard
          icon={CheckCircle2}
          label="Owed by these customers"
          accent="#f59e0b"
          hint="A call about money is an easier call to make"
          value={<Money value={owed} />}
          loading={isFetching}
        />
      </div>

      <div className="mb-4 flex items-center gap-2">
        <Switch
          size="small"
          checked={includeUpcoming}
          onChange={(value) => {
            setIncludeUpcoming(value);
            setCurrentPage(1);
          }}
        />
        <span className="text-[13px] text-secondary-600">
          Show the ones scheduled ahead too
        </span>
      </div>

      <DataTable
        data={rows}
        rowKey="_id"
        loading={isFetching}
        total={rows.length}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        limit={limit}
        setLimit={setLimit}
        isPaginate={rows.length > limit}
        emptyText={
          <TableEmpty
            icon={PhoneCall}
            title="Nothing owed a call"
            hint="Schedule one from here, or from any customer's profile."
          />
        }
        columns={[
          {
            title: "Due",
            key: "followUpAt",
            width: 140,
            render: (_: unknown, row: any) => {
              const late = dayjs(row.followUpAt).isBefore(dayjs(), "day");
              const now = dayjs(row.followUpAt).isSame(dayjs(), "day");
              return (
                <div>
                  <p
                    className={`m-0 text-sm font-medium ${
                      late ? "text-danger" : "text-secondary-800"
                    }`}
                  >
                    {dayjs(row.followUpAt).format("DD MMM YYYY")}
                  </p>
                  <span
                    className={`text-[11px] ${
                      late ? "text-danger" : "text-secondary-400"
                    }`}
                  >
                    {/* Counted by hand rather than with fromNow(): dayjs's
                        relativeTime plugin is not registered in this app. */}
                    {late
                      ? `${dayjs().diff(dayjs(row.followUpAt), "day")} days late`
                      : now
                        ? "Today"
                        : `in ${dayjs(row.followUpAt).diff(dayjs(), "day") + 1} day${
                            dayjs(row.followUpAt).diff(dayjs(), "day") + 1 === 1
                              ? ""
                              : "s"
                          }`}
                  </span>
                </div>
              );
            },
          },
          {
            title: "Customer",
            key: "customer",
            render: (_: unknown, row: any) => (
              <div className="min-w-0">
                <p className="m-0 truncate font-medium text-secondary-800">
                  {row.customer?.name ?? "Unknown"}
                </p>
                <span className="font-mono text-[11px] text-secondary-400">
                  {row.customer?.phone}
                </span>
              </div>
            ),
          },
          {
            title: "About",
            key: "summary",
            render: (_: unknown, row: any) => (
              <div className="min-w-0">
                <p className="m-0 truncate text-sm text-secondary-700">
                  {row.summary}
                </p>
                {row.detail && (
                  <span className="text-[11px] text-secondary-400">
                    {row.detail}
                  </span>
                )}
              </div>
            ),
          },
          {
            title: "Kind",
            key: "type",
            width: 100,
            render: (_: unknown, row: any) => (
              <Tag className="!m-0 !text-[11px] capitalize">{row.type}</Tag>
            ),
          },
          {
            title: "Owes",
            key: "due",
            width: 110,
            render: (_: unknown, row: any) =>
              row.customer?.totalDue > 0 ? (
                <Tag className="!m-0 !border-danger/30 !bg-danger/10 !text-[11px] !text-danger">
                  <Money value={row.customer.totalDue} />
                </Tag>
              ) : (
                <span className="text-secondary-400">—</span>
              ),
          },
          {
            title: "",
            key: "actions",
            fixed: "right" as const,
            width: 170,
            render: (_: unknown, row: any) => (
              <div className="flex gap-2">
                <Button
                  size="small"
                  onClick={() => navigate(`/customers/${row.customer?._id ?? ""}`)}
                >
                  Open
                </Button>
                <PermissionGate module="CRM" action="Update">
                  <Button
                    size="small"
                    type="primary"
                    icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                    onClick={() => setClosing(row)}
                  >
                    Done
                  </Button>
                </PermissionGate>
              </div>
            ),
          },
        ]}
      />

      <FollowUpModal open={scheduling} setOpen={setScheduling} />

      {closing && (
        <CompleteFollowUpModal
          activity={closing}
          open={!!closing}
          setOpen={(value) => !value && setClosing(null)}
        />
      )}
    </div>
  );
};

export default FollowUps;
