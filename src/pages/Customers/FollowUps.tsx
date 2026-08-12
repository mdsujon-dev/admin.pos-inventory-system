import { Button, Empty, Table, Tag } from "antd";
import dayjs from "dayjs";
import { CheckCircle2, PhoneCall } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import PageHeader from "../../components/Common/PageHeader";
import PageMeta from "../../components/Common/PageMeta";
import PermissionGate from "../../components/Common/PermissionGate";
import Money from "../../components/shared/Money";
import {
  useCompleteFollowUpMutation,
  useGetDueFollowUpsQuery,
} from "../../redux/features/crm/crmApi";
import { SectionCard } from "../Inventory/Products/ProductFormUI";

/**
 * What is owed a call today.
 *
 * The whole point of logging a conversation is the next one; without a dated
 * list, "I'll ring him next week" is a note nobody ever reads again.
 */
const FollowUps = () => {
  const navigate = useNavigate();
  const { data, isFetching } = useGetDueFollowUpsQuery(undefined);
  const [completeFollowUp] = useCompleteFollowUpMutation();

  const rows = data?.data ?? [];

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
      />

      <SectionCard
        icon={PhoneCall}
        title="Due now"
        subtitle="Oldest promise first"
      >
        {rows.length === 0 && !isFetching ? (
          <Empty description="Nothing owed a call. Log one from a customer's profile." />
        ) : (
          <Table
            dataSource={rows}
            rowKey="_id"
            loading={isFetching}
            size="small"
            pagination={{ pageSize: 20, hideOnSinglePage: true }}
            columns={[
              {
                title: "Due",
                key: "followUpAt",
                width: 130,
                render: (_: unknown, row: any) => {
                  const overdue = dayjs(row.followUpAt).isBefore(dayjs(), "day");
                  return (
                    <div>
                      <p
                        className={`m-0 text-sm font-medium ${
                          overdue ? "text-danger" : "text-secondary-800"
                        }`}
                      >
                        {dayjs(row.followUpAt).format("DD MMM YYYY")}
                      </p>
                      {overdue && (
                        <span className="text-[11px] text-danger">Overdue</span>
                      )}
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
                width: 170,
                render: (_: unknown, row: any) => (
                  <div className="flex gap-2">
                    <Button
                      size="small"
                      onClick={() =>
                        navigate(`/customers/${row.customer?._id ?? ""}`)
                      }
                    >
                      Open
                    </Button>
                    <PermissionGate module="CRM" action="Update">
                      <Button
                        size="small"
                        type="primary"
                        icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                        onClick={async () => {
                          try {
                            await completeFollowUp(row._id).unwrap();
                            toast.success("Marked done");
                          } catch {
                            toast.error("Could not mark it done");
                          }
                        }}
                      >
                        Done
                      </Button>
                    </PermissionGate>
                  </div>
                ),
              },
            ]}
          />
        )}
      </SectionCard>
    </div>
  );
};

export default FollowUps;
