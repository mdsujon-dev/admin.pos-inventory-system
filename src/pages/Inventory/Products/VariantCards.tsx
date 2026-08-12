import {
  Button,
  Collapse,
  DatePicker,
  Empty,
  Input,
  InputNumber,
  Switch,
  Tag,
  Tooltip,
} from "antd";
import dayjs from "dayjs";
import { Plus, Trash2, HelpCircle } from "lucide-react";
import { config } from "../../../config";
import SetMediaModal from "../../../components/modal/media/SetMediaModal";
import { useState, useEffect, useRef } from "react";
import { DraftVariant } from "./useVariantBuilder";

interface VariantCardsProps {
  variants: DraftVariant[];
  onChange: (key: string, patch: Partial<DraftVariant>) => void;
  onRemove: (key: string) => void;
  onAdd: () => void;
  /** Placeholder for rows that leave their own threshold blank. */
  fallbackLowStock: number;
}

/** A labelled field, so every input in the grid lines up the same way. */
const Field = ({
  label,
  required,
  children,
  hint,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}) => (
  <div className="min-w-0">
    <label className="mb-1 flex items-center gap-1.5 text-[13px] font-medium text-secondary-700">
      <span>
        {label}
        {required && <span className="ml-0.5 text-danger">*</span>}
      </span>
      {hint && (
        <Tooltip title={hint} placement="top">
          <HelpCircle className="h-3.5 w-3.5 cursor-help text-secondary-400 outline-none hover:text-primary" />
        </Tooltip>
      )}
    </label>
    {children}
  </div>
);

const MultiImageSlot = ({
  label,
  values = [],
  onSelect,
}: {
  label: string;
  values?: string[];
  onSelect: (urls: string[]) => void;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="col-span-full sm:col-span-2 lg:col-span-3">
      <label className="mb-1 block text-[13px] font-medium text-secondary-700">
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {values.map((val, idx) => {
          const src = val.startsWith("http") ? val : `${config.image_access_url}${val}`;
          return (
            <div key={idx} className="relative h-[120px] w-[120px] overflow-hidden rounded-lg border border-secondary-200">
              <img src={src} alt="variant" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(values.filter((_, i) => i !== idx));
                }}
                className="absolute right-1 top-1 rounded bg-white/90 p-1 text-danger shadow-sm hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}
        <div
          onClick={() => setOpen(true)}
          className="flex h-32 w-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-secondary-300 bg-secondary-50 text-secondary-500 transition-colors hover:border-primary-400 hover:text-primary"
        >
          <Plus className="h-6 w-6 text-secondary-400" />
          <span className="text-sm">Upload</span>
        </div>
      </div>

      {open && (
        <SetMediaModal
          open={open}
          setOpen={setOpen}
          selectionMode="multiple"
          type="image"
          onSelectImage={(selected) => {
            const arr = Array.isArray(selected) ? selected : [selected];
            onSelect([...values, ...arr]);
          }}
        />
      )}
    </div>
  );
};

/**
 * The variant editor: one card per variant, each a self-contained sellable
 * item with its own images, prices, stock and expiry.
 *
 * Cards rather than a wide table because a variant now carries images and
 * three prices — as table columns that is a horizontal scroll nobody can read,
 * and the image slots have nowhere to live.
 */
const VariantCards = ({
  variants,
  onChange,
  onRemove,
  onAdd,
  fallbackLowStock,
}: VariantCardsProps) => {
  const [activeKeys, setActiveKeys] = useState<string | string[]>(
    variants.map((variant) => variant.key)
  );

  const prevVariants = useRef(variants);
  useEffect(() => {
    if (variants.length > prevVariants.current.length) {
      // Find the keys that were just added
      const newKeys = variants
        .map((v) => v.key)
        .filter((k) => !prevVariants.current.find((pv) => pv.key === k));

      setActiveKeys((prev) => {
        const prevArray = Array.isArray(prev) ? prev : [prev];
        return [...prevArray, ...newKeys];
      });
    }
    prevVariants.current = variants;
  }, [variants]);

  if (variants.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-secondary-300 py-8">
        <Empty description="No variants yet. Add one by hand, or pick attribute values above and generate them." />
        <div className="mt-3 flex justify-center">
          <Button type="primary" icon={<Plus className="h-4 w-4" />} onClick={onAdd}>
            Add Variant
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Collapse
        activeKey={activeKeys}
        onChange={setActiveKeys}
        items={variants.map((variant, index) => ({
          key: variant.key,
          label: (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-secondary-800">
                Variant {index + 1}
              </span>
              {variant.name && <Tag color="var(--primary)">{variant.name}</Tag>}
              {variant.sku && (
                <span className="font-mono text-xs text-secondary-400">
                  {variant.sku}
                </span>
              )}
              {!variant.isActive && <Tag>Inactive</Tag>}
            </div>
          ),
          extra: (
            <Tooltip title="Remove this variant">
              <Button
                danger
                type="text"
                size="small"
                icon={<Trash2 className="h-4 w-4" />}
                onClick={(event) => {
                  // The header is the collapse toggle; without this, deleting
                  // also expands or collapses the card on the way out.
                  event.stopPropagation();
                  onRemove(variant.key);
                }}
              />
            </Tooltip>
          ),
          children: (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Variant Name" required>
                  <Input
                    value={variant.name}
                    onChange={(e) =>
                      onChange(variant.key, { name: e.target.value })
                    }
                    placeholder="e.g. Red / Small"
                    status={variant.name?.trim() ? undefined : "error"}
                  />
                </Field>
                <Field label="Variant SKU" required>
                  <Input
                    value={variant.sku}
                    onChange={(e) =>
                      onChange(variant.key, { sku: e.target.value })
                    }
                    placeholder="e.g. TSHIRT-RED-S"
                    status={variant.sku?.trim() ? undefined : "error"}
                  />
                </Field>
                <Field label="Barcode">
                  <Input
                    value={variant.barcode ?? ""}
                    onChange={(e) =>
                      onChange(variant.key, { barcode: e.target.value })
                    }
                    placeholder="Optional"
                  />
                </Field>
                <Field label="Weight">
                  <InputNumber
                    type="number"
                    min={0}
                    value={variant.weight ?? undefined}
                    onChange={(value) =>
                      onChange(variant.key, {
                        weight: value === null ? null : Number(value),
                      })
                    }
                    className="w-full"
                    placeholder="Optional"
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Purchase Price">
                  <InputNumber
                    type="number"
                    min={0}
                    value={variant.purchasePrice || null}
                    placeholder="0"
                    onChange={(value) =>
                      onChange(variant.key, {
                        purchasePrice: Number(value) || 0,
                      })
                    }
                    className="w-full"
                  />
                </Field>
                <Field label="Cost" hint="Freight, duty, handling">
                  <InputNumber
                    type="number"
                    min={0}
                    value={variant.cost || null}
                    placeholder="0"
                    onChange={(value) =>
                      onChange(variant.key, { cost: Number(value) || 0 })
                    }
                    className="w-full"
                  />
                </Field>
                <Field label="Total Cost" hint="Purchase + Cost">
                  <InputNumber
                    type="number"
                    value={
                      ((Number(variant.purchasePrice) || 0) +
                      (Number(variant.cost) || 0)) || null
                    }
                    placeholder="0"
                    disabled
                    className="w-full"
                  />
                </Field>
                <Field label="Selling Price" required>
                  <InputNumber
                    type="number"
                    min={0}
                    value={variant.sellingPrice || null}
                    placeholder="0"
                    onChange={(value) =>
                      onChange(variant.key, { sellingPrice: Number(value) || 0 })
                    }
                    className="w-full"
                    status={Number(variant.sellingPrice) > 0 ? undefined : "warning"}
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Discount / Offer Price" hint="Must not exceed selling price">
                  <InputNumber
                    type="number"
                    min={0}
                    value={variant.discountPrice ?? undefined}
                    onChange={(value) =>
                      onChange(variant.key, {
                        discountPrice: value === null ? null : Number(value),
                      })
                    }
                    className="w-full"
                    placeholder="Optional"
                    status={
                      variant.discountPrice != null &&
                      variant.discountPrice > variant.sellingPrice
                        ? "error"
                        : undefined
                    }
                  />
                </Field>
                <Field label="Current Stock">
                  <InputNumber
                    type="number"
                    min={0}
                    precision={0}
                    value={variant.quantity || null}
                    placeholder="0"
                    onChange={(value) =>
                      onChange(variant.key, { quantity: Number(value) || 0 })
                    }
                    className="w-full"
                  />
                </Field>
                <Field
                  label="Low Stock At"
                  hint={`Blank uses the product's ${fallbackLowStock}`}
                >
                  <InputNumber
                    type="number"
                    min={0}
                    precision={0}
                    value={variant.lowStockAlert ?? undefined}
                    placeholder={String(fallbackLowStock)}
                    onChange={(value) =>
                      onChange(variant.key, {
                        lowStockAlert: value === null ? null : Number(value),
                      })
                    }
                    className="w-full"
                  />
                </Field>
                <Field label="Expiry Date">
                  <DatePicker
                    value={variant.expiryDate ? dayjs(variant.expiryDate) : null}
                    onChange={(date) =>
                      onChange(variant.key, {
                        expiryDate: date ? date.toISOString() : null,
                      })
                    }
                    className="w-full"
                  />
                </Field>
              </div>

              {/* Full width rather than a fifth column: this is prose, and a
                  quarter-width box would show two words at a time. */}
              <Field
                label="Description"
                hint="What sets this variant apart from the others"
              >
                <Input.TextArea
                  rows={4}
                  value={variant.description ?? ""}
                  onChange={(e) =>
                    onChange(variant.key, { description: e.target.value })
                  }
                  placeholder="Optional — e.g. 500g glass jar, screw cap"
                  maxLength={2000}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MultiImageSlot
                  label="Variant Images"
                  values={variant.images || []}
                  onSelect={(urls) => onChange(variant.key, { images: urls })}
                />
                <Field label="Status">
                  <Switch
                    checked={variant.isActive}
                    checkedChildren="Active"
                    unCheckedChildren="Inactive"
                    onChange={(checked) =>
                      onChange(variant.key, { isActive: checked })
                    }
                  />
                </Field>
              </div>
            </div>
          ),
        }))}
      />

      <Button
        block
        type="dashed"
        icon={<Plus className="h-4 w-4" />}
        onClick={onAdd}
      >
        Add Variant
      </Button>
    </div>
  );
};

export default VariantCards;
