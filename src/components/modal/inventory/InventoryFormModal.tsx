import { Button, Form, FormInstance } from "antd";
import { ReactNode } from "react";
import AntModal from "../../shared/AntModal";

interface InventoryFormModalProps {
  open: boolean;
  setOpen: (val: boolean) => void;
  /** Shown as the modal heading, e.g. "Category". Create/Edit is prefixed. */
  entity: string;
  isEditing: boolean;
  loading: boolean;
  form: FormInstance;
  initialValues?: Record<string, unknown>;
  onSubmit: (values: any) => void;
  width?: number;
  children: ReactNode;
}

/**
 * The shell every inventory form sits in: heading, footer buttons, and the
 * Form instance wiring.
 *
 * One component covers both create and edit because the two differ only in the
 * verb and whether `initialValues` is populated — the panel's older modules
 * carry a near-identical pair of files per entity, and six more pairs would be
 * six more places to keep in sync.
 */
const InventoryFormModal = ({
  open,
  setOpen,
  entity,
  isEditing,
  loading,
  form,
  initialValues,
  onSubmit,
  width = 640,
  children,
}: InventoryFormModalProps) => {
  return (
    <AntModal
      open={open}
      setOpen={setOpen}
      title={`${isEditing ? "Edit" : "Create"} ${entity}`}
      width={width}
      footer={
        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
          <Button disabled={loading} onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            type="primary"
            loading={loading}
            disabled={loading}
            onClick={() => form.submit()}
          >
            {isEditing ? "Save Changes" : "Create"}
          </Button>
        </div>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onSubmit}
        initialValues={initialValues}
        className="pt-2"
      >
        {children}
      </Form>
    </AntModal>
  );
};

export default InventoryFormModal;
