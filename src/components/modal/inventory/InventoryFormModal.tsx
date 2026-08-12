import { Button, Form, FormInstance } from "antd";
import {
  FolderTree,
  Layers,
  LucideIcon,
  Package,
  Ruler,
  ShieldCheck,
  Tag,
} from "lucide-react";
import { ReactNode } from "react";
import AntModal from "../../shared/AntModal";

/**
 * One icon per inventory entity, so the six modals are told apart at a glance
 * rather than by reading the heading. Keyed on the `entity` label the callers
 * already pass, which keeps them unchanged.
 */
const ENTITY_ICONS: Record<string, LucideIcon> = {
  Brand: Tag,
  Category: FolderTree,
  "Sub Category": FolderTree,
  Unit: Ruler,
  Warranty: ShieldCheck,
  "Variant Attribute": Layers,
};

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
  const Icon = ENTITY_ICONS[entity] ?? Package;

  return (
    <AntModal
      open={open}
      setOpen={setOpen}
      width={width}
      /* Full-bleed band: the header sits inside the content's own padding, so
         it has to be pulled back out to reach the modal's edges. */
      styles={{
        header: {
          margin: "-20px -24px 0",
          padding: "16px 24px",
          borderRadius: "8px 8px 0 0",
          borderBottom: "1px solid rgba(1,149,50,0.15)",
          background:
            "linear-gradient(90deg, rgba(1,149,50,0.10) 0%, rgba(9,174,64,0.03) 50%, rgba(255,255,255,0) 100%)",
        },
        body: { paddingTop: 20 },
      }}
      title={
        <div className="flex items-center gap-3 pr-8">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-primary">
            <Icon className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-base font-semibold text-secondary-800">
              {isEditing ? `Edit ${entity}` : `Create ${entity}`}
            </span>
            <span className="block truncate text-xs font-normal text-secondary-500">
              {isEditing
                ? `Update this ${entity.toLowerCase()}'s details`
                : `Add a new ${entity.toLowerCase()} to the catalog`}
            </span>
          </span>
        </div>
      }
      footer={
        <div className="mt-4 flex justify-end gap-2 border-t border-primary/15 pt-4">
          <Button
            className="min-w-24"
            disabled={loading}
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            className="min-w-32 !border-0 !bg-gradient-to-r !from-primary-600 !to-primary-500 shadow-primary hover:!from-primary-700 hover:!to-primary-600"
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
