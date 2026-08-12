import { Button, Input, Tag } from "antd";
import { Check, Loader2, Phone, UserPlus, X } from "lucide-react";
import { useEffect, useState } from "react";
import Money from "../../components/shared/Money";
import {
  ICustomer,
  useLazyFindCustomerByPhoneQuery,
} from "../../redux/features/sales/customerApi";

export interface NewCustomerDraft {
  name: string;
  phone: string;
  email?: string;
  address?: string;
}

/**
 * Who is buying.
 *
 * A phone number is typed, and one of three things is true: it is somebody the
 * shop knows, it is somebody new, or the sale is a walk-in and nobody is
 * asked. All three have to be reachable without leaving the till, because the
 * alternative is a cashier abandoning a full cart to go and create a customer.
 *
 * The lookup runs on demand rather than on every keystroke — a counter has
 * poor connectivity often enough that eleven requests for eleven digits is a
 * visible stutter.
 */
const CustomerPanel = ({
  customer,
  onPick,
  onDraft,
  draft,
}: {
  customer: ICustomer | null;
  onPick: (customer: ICustomer | null) => void;
  onDraft: (draft: NewCustomerDraft | null) => void;
  draft: NewCustomerDraft | null;
}) => {
  const [phone, setPhone] = useState("");
  const [searched, setSearched] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");

  const [lookup, { isFetching }] = useLazyFindCustomerByPhoneQuery();

  // The draft belongs to the panel's own fields; clearing it from outside
  // (after a sale) has to clear them too or the next customer inherits a name.
  useEffect(() => {
    if (!draft && !customer) {
      setPhone("");
      setName("");
      setCreating(false);
      setSearched(false);
    }
  }, [draft, customer]);

  const search = async () => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 6) return;

    const result = await lookup(digits).unwrap().catch(() => null);
    setSearched(true);

    if (result?.data) {
      onPick(result.data);
      onDraft(null);
      setCreating(false);
      return;
    }

    // No match is not an error — it is a new customer. Open the one field
    // needed to make one and keep the number that was already typed.
    onPick(null);
    setCreating(true);
  };

  const reset = () => {
    onPick(null);
    onDraft(null);
    setPhone("");
    setName("");
    setCreating(false);
    setSearched(false);
  };

  if (customer) {
    return (
      <div className="rounded-xl border border-primary-200 bg-primary-50 p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="m-0 flex items-center gap-2 text-sm font-semibold text-primary-700">
              <Check className="h-4 w-4" />
              <span className="truncate">{customer.name}</span>
            </p>
            <p className="m-0 font-mono text-xs text-secondary-500">
              {customer.phone}
            </p>
            {customer.totalDue > 0 && (
              <Tag className="!mt-1.5 !border-danger/30 !bg-danger/10 !text-[11px] !text-danger">
                Owes <Money value={customer.totalDue} />
              </Tag>
            )}
          </div>
          <Button
            size="small"
            type="text"
            icon={<X className="h-4 w-4" />}
            onClick={reset}
            title="Clear customer"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-secondary-100 bg-white p-3">
      <div className="flex gap-2">
        <Input
          value={phone}
          onChange={(event) => {
            setPhone(event.target.value);
            setSearched(false);
            setCreating(false);
            onDraft(null);
          }}
          onPressEnter={search}
          prefix={<Phone className="h-4 w-4 text-secondary-400" />}
          placeholder="Customer phone (optional)"
          allowClear
        />
        <Button
          onClick={search}
          disabled={phone.replace(/\D/g, "").length < 6}
          icon={
            isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : undefined
          }
        >
          Find
        </Button>
      </div>

      {creating && (
        <div className="mt-2 rounded-lg border border-dashed border-primary-300 bg-primary-50/50 p-2.5">
          <p className="m-0 mb-2 flex items-center gap-1.5 text-xs font-medium text-primary-700">
            <UserPlus className="h-3.5 w-3.5" />
            New number — give them a name and they are saved with the sale
          </p>
          <Input
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              onDraft(
                event.target.value.trim()
                  ? { name: event.target.value.trim(), phone }
                  : null
              );
            }}
            placeholder="Customer name"
            autoFocus
          />
        </div>
      )}

      {searched && !creating && (
        <p className="m-0 mt-2 text-xs text-secondary-500">
          Leave blank for a walk-in sale.
        </p>
      )}
    </div>
  );
};

export default CustomerPanel;
