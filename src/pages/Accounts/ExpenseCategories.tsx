import { Button, Form, Input, Modal, Space, Switch, Tag, Tooltip } from "antd";
import { Edit, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";
import PageHeader from "../../components/Common/PageHeader";
import PageMeta from "../../components/Common/PageMeta";
import PermissionGate from "../../components/Common/PermissionGate";
import { FormInput } from "../../components/Form/FormInput";
import InventoryFormModal from "../../components/modal/inventory/InventoryFormModal";
import {
  IExpenseCategory,
  useCreateExpenseCategoryMutation,
  useDeleteExpenseCategoryMutation,
  useGetExpenseCategoriesQuery,
  useToggleExpenseCategoryStatusMutation,
  useUpdateExpenseCategoryMutation,
} from "../../redux/features/accounts/reportApi";
import DataTable from "../../components/Table/DataTable";

const { confirm } = Modal;

/**
 * The headings money is spent under.
 *
 * Twelve are seeded on first read so the ledger works before anyone
 * configures it. They exist because free text degrades: "elec bill",
 * "Electricity" and "current bill" are one cost that otherwise reports as
 * three, and no report built on that can be trusted.
 */
const ExpenseCategories = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<IExpenseCategory | null>(null);
  const [form] = Form.useForm();

  const { data, isFetching } = useGetExpenseCategoriesQuery(undefined);
  const [createCategory, { isLoading: creating }] =
    useCreateExpenseCategoryMutation();
  const [updateCategory, { isLoading: updating }] =
    useUpdateExpenseCategoryMutation();
  const [toggleStatus] = useToggleExpenseCategoryStatusMutation();
  const [deleteCategory] = useDeleteExpenseCategoryMutation();

  const categories: IExpenseCategory[] = data?.data || [];
  const isEditing = Boolean(selected?._id);

  const handleSubmit = async (values: Partial<IExpenseCategory>) => {
    const payload = {
      name: values.name?.trim(),
      description: values.description?.trim() || "",
      isRecurring: values.isRecurring ?? false,
      isActive: values.isActive ?? true,
    };
    try {
      if (isEditing) {
        await updateCategory({ id: selected!._id, data: payload }).unwrap();
        toast.success("Heading updated");
      } else {
        await createCategory(payload).unwrap();
        toast.success("Heading created");
      }
      setIsOpen(false);
      form.resetFields();
    } catch (error: any) {
      toast.error(error?.data?.message || "Could not save the heading");
    }
  };

  const handleDelete = (category: IExpenseCategory) => {
    confirm({
      title: `Delete "${category.name}"?`,
      content:
        "Headings already used by ledger entries cannot be deleted — deactivate those instead.",
      okText: "Yes, Delete",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteCategory(category._id).unwrap();
          toast.success("Heading deleted");
        } catch (error: any) {
          toast.error(error?.data?.message || "Could not delete the heading");
        }
      },
    });
  };

  return (
    <div>
      <PageMeta
        title="Expense Categories - POS & Inventory"
        description="Headings that running costs group under"
        noindex
      />
      <PageHeader
        title="Expense Categories"
        subtitle="The headings running costs are grouped under in every report"
        breadcrumbs={[
          { title: "Dashboard", path: "/" },
          { title: "Accounts", path: "/accounts" },
          { title: "Expense Categories" },
        ]}
        extra={
          <PermissionGate module="Accounts" action="Create">
            <Button
              type="primary"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => {
                setSelected(null);
                setIsOpen(true);
              }}
              className="!border-0 !bg-gradient-to-r !from-primary-600 !to-primary-500 shadow-primary"
            >
              Add Heading
            </Button>
          </PermissionGate>
        }
      />

      <DataTable
        data={categories}
        rowKey="_id"
        loading={isFetching}
        columns={[
          {
              title: "Heading",
              key: "name",
              render: (_: unknown, row: any) => (
                <div className="min-w-0">
                  <p className="m-0 font-medium text-secondary-800">
                    {row.name}
                    {row.isRecurring && (
                      <Tag className="!ml-2 !border-primary-200 !bg-primary-50 !text-[11px] !text-primary-700">
                        Recurring
                      </Tag>
                    )}
                  </p>
                  {row.description && (
                    <span className="text-xs text-secondary-500">
                      {row.description}
                    </span>
                  )}
                </div>
              ),
            },
            {
              title: "Status",
              key: "isActive",
              width: 130,
              render: (_: unknown, row: any) => (
                <PermissionGate
                  module="Accounts"
                  action="Update"
                  fallback={
                    <span
                      className={
                        row.isActive ? "text-primary" : "text-secondary-400"
                      }
                    >
                      {row.isActive ? "Active" : "Inactive"}
                    </span>
                  }
                >
                  <Switch
                    checked={row.isActive}
                    checkedChildren="Active"
                    unCheckedChildren="Inactive"
                    onChange={async () => {
                      try {
                        await toggleStatus(row._id).unwrap();
                      } catch {
                        toast.error("Could not update the heading");
                      }
                    }}
                  />
                </PermissionGate>
              ),
            },
            {
              title: "Actions",
              key: "actions",
              width: 120,
              render: (_: unknown, row: any) => (
                <Space>
                  <PermissionGate module="Accounts" action="Update">
                    <Tooltip title="Edit">
                      <Button
                        icon={<Edit className="h-4 w-4" />}
                        onClick={() => {
                          setSelected(row);
                          setIsOpen(true);
                        }}
                      />
                    </Tooltip>
                  </PermissionGate>
                  <PermissionGate module="Accounts" action="Delete">
                    <Tooltip title="Delete">
                      <Button
                        danger
                        icon={<Trash2 className="h-4 w-4" />}
                        onClick={() => handleDelete(row)}
                      />
                    </Tooltip>
                  </PermissionGate>
                </Space>
              ),
            },
          ]}
        />
      {isOpen && (
        <InventoryFormModal
          open={isOpen}
          setOpen={setIsOpen}
          entity="Expense Category"
          isEditing={isEditing}
          loading={creating || updating}
          form={form}
          onSubmit={handleSubmit}
          initialValues={{
            name: selected?.name ?? "",
            description: selected?.description ?? "",
            isRecurring: selected?.isRecurring ?? false,
            isActive: selected?.isActive ?? true,
          }}
        >
          <FormInput
            label="Heading"
            name="name"
            rules={[
              { required: true, message: "Name is required" },
              { max: 80, message: "Name is too long" },
            ]}
            placeholder="e.g. Shop Rent"
          />
          <Form.Item label="Description" name="description">
            <Input.TextArea rows={2} placeholder="Optional" />
          </Form.Item>
          <Form.Item
            label="Recurring"
            name="isRecurring"
            valuePropName="checked"
            tooltip="Rent and salary recur every month; repairs do not"
          >
            <Switch checkedChildren="Monthly" unCheckedChildren="One-off" />
          </Form.Item>
          <Form.Item label="Status" name="isActive" valuePropName="checked">
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>
        </InventoryFormModal>
      )}
    </div>
  );
};

export default ExpenseCategories;
