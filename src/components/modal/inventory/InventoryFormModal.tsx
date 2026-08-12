import { Button, Form, FormInstance } from "antd";
import {
  Contact,
  FolderTree,
  Landmark,
  Layers,
  LucideIcon,
  Package,
  Ruler,
  Tag,
  Wallet,
  Warehouse,
  X,
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
  "Variant Attribute": Layers,
  Vendor: Warehouse,
  "Vendor Payment": Wallet,
  Customer: Contact,
  "Expense Category": Landmark,
  "Payment Provider": Landmark,
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
         it has to be pulled back out to reach the modal's edges. `overflow`
         is what keeps the decorative discs inside the rounded corners. */
      styles={{
        header: {
          position: "relative",
          overflow: "hidden",
          margin: "-20px -24px 0",
          padding: "8px 24px",
          borderRadius: "8px 8px 0 0",
          background:
            "linear-gradient(100deg, #017527 0%, #019532 48%, #09ae40 100%)",
        },
        body: { paddingTop: 22 },
      }}
      /* White on the band, so it reads against the gradient rather than
         disappearing into it. */
      closeIcon={
        <X className="h-4 w-4 text-white/75 transition-colors hover:text-white" />
      }
      title={
        <div className="relative">
          {/* Depth without an image: two soft discs bleeding off the edge. */}
          <span className="pointer-events-none absolute -right-16 -top-20 h-36 w-36 rounded-full bg-white/10" />
          <span className="pointer-events-none absolute -bottom-24 right-6 h-36 w-36 rounded-full bg-white/[0.07]" />

          <div className="relative flex items-center gap-3 pr-8">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-white/25 bg-white/15 text-white backdrop-blur-sm">
              <Icon className="h-[18px] w-[18px]" />
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-2">
                <span className="truncate text-[19px] font-semibold leading-tight text-white">
                  {isEditing ? `Edit ${entity}` : `Create ${entity}`}
                </span>
                <span className="shrink-0 rounded-full bg-white/20 px-2 py-px text-[10px] font-semibold uppercase tracking-wider text-white">
                  {isEditing ? "Editing" : "New"}
                </span>
              </span>
              <span className="block truncate text-[13px] font-normal leading-tight text-white/80">
                {isEditing
                  ? `Update this ${entity.toLowerCase()}'s details`
                  : `Add a new ${entity.toLowerCase()} to the catalog`}
              </span>
            </span>
          </div>
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
