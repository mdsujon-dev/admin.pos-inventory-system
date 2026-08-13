import { Button, Input, Tag, Tooltip } from "antd";
import { Check, Loader2, MapPin, Phone, UserPlus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
 * Enough digits to be a real number worth asking the server about.
 *
 * A Bangladeshi mobile is eleven; landlines and short forms run to nine or
 * ten. Below that the cashier is still typing, and a lookup on every keystroke
 * is ten wasted requests on a counter connection that is rarely good.
 */
const LOOKUP_AT = 10;

/**
 * Who is buying.
 *
 * A phone number is typed, and one of three things is true: it is somebody the
 * shop knows, it is somebody new, or the sale is a walk-in and nobody is
 * asked. All three have to be reachable without leaving the till, because the
 * alternative is a cashier abandoning a full cart to go and create a customer.
 *
 * The lookup fires on its own once the number is long enough, debounced — so
 * a returning customer appears while the cashier is still reaching for the
 * next item, without the eleven requests that typing eleven digits would make.
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
  const [address, setAddress] = useState("");

  const [lookup, { isFetching }] = useLazyFindCustomerByPhoneQuery();
  /** The number the last lookup was for, so the same one is not asked twice. */
  const askedFor = useRef("");

  // The draft belongs to the panel's own fields; clearing it from outside
  // (after a sale) has to clear them too or the next customer inherits a name.
  useEffect(() => {
    if (!draft && !customer) {
      setPhone("");
      setName("");
      setAddress("");
      setCreating(false);
      setSearched(false);
      askedFor.current = "";
    }
  }, [draft, customer]);

  const search = async (raw?: string) => {
    const digits = (raw ?? phone).replace(/\D/g, "");
    if (digits.length < 6) return;

    askedFor.current = digits;
    const result = await lookup(digits).unwrap().catch(() => null);
    setSearched(true);

    if (result?.data) {
      onPick(result.data);
      onDraft(null);
      setCreating(false);
      return;
    }

    // No match is not an error — it is a new customer. Open the fields needed
    // to make one and keep the number that was already typed.
    onPick(null);
    setCreating(true);
  };

  /**
   * Look them up while the cashier is still working, not on a button press.
   *
   * 450ms is long enough that a full number is typed as one lookup and short
   * enough that the name is on screen before the next item is scanned.
   */
  useEffect(() => {
    const digits = phone.replace(/\D/g, "");
    if (customer || digits.length < LOOKUP_AT || digits === askedFor.current) {
      return;
    }
    const timer = setTimeout(() => search(digits), 450);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone, customer]);

  const pushDraft = (nextName: string, nextAddress: string) =>
    onDraft(
      nextName.trim()
        ? {
            name: nextName.trim(),
            phone,
            address: nextAddress.trim() || undefined,
          }
        : null
    );

  const reset = () => {
    onPick(null);
    onDraft(null);
    setPhone("");
    setName("");
    setAddress("");
    setCreating(false);
    setSearched(false);
    askedFor.current = "";
  };

  if (customer) {
    return (
      <div className="rounded-xl bg-primary-50 p-3 shadow-[0_2px_10px_-4px_rgba(1,149,50,.18)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="m-0 flex items-center gap-2 text-sm font-semibold text-primary-700">
              <Check className="h-4 w-4" />
              <span className="truncate">{customer.name}</span>
            </p>
            <p className="m-0 font-mono text-xs text-secondary-500">
              {customer.phone}
            </p>
            {/* The address is why a delivery gets to the right house, so it
                belongs on the card rather than one click away. */}
            {customer.address && (
              <p className="m-0 mt-0.5 flex items-start gap-1 text-xs text-secondary-500">
                <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                <span className="line-clamp-2">{customer.address}</span>
              </p>
            )}
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {customer.totalDue > 0 && (
                <Tag className="!m-0 !border-danger/30 !bg-danger/10 !text-[11px] !text-danger">
                  Owes <Money value={customer.totalDue} />
                </Tag>
              )}
              {customer.saleCount > 0 && (
                <Tag className="!m-0 !text-[11px]">
                  {customer.saleCount} past sale
                  {customer.saleCount === 1 ? "" : "s"}
                </Tag>
              )}
            </div>
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
    <div className="rounded-xl bg-white p-3 shadow-[0_2px_10px_-4px_rgba(16,24,40,.1)]">
      {/* Named, because a blank phone box beside a cart does not say what it
          is for — and the sentence is where the walk-in case is granted. */}
      <p className="m-0 mb-2 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-secondary-500">
        <UserPlus className="h-3.5 w-3.5" />
        Customer
        <span className="font-normal normal-case tracking-normal text-secondary-400">
          — optional for a walk-in
        </span>
      </p>
      <div className="flex gap-2">
        <Input
          value={phone}
          onChange={(event) => {
            setPhone(event.target.value);
            setSearched(false);
            setCreating(false);
            onDraft(null);
          }}
          onPressEnter={() => search()}
          prefix={
            <Tooltip title="This is the customer's identity — one number, one person">
              <Phone className="h-4 w-4 cursor-help text-secondary-400" />
            </Tooltip>
          }
          suffix={
            isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : null
          }
          placeholder="Phone number"
          allowClear
        />
        {/* Still here for the short numbers the auto-lookup does not reach. */}
        <Button
          onClick={() => search()}
          disabled={phone.replace(/\D/g, "").length < 6 || isFetching}
        >
          Find
        </Button>
      </div>

      {creating && (
        <div className="mt-2 space-y-2 rounded-lg border border-dashed border-primary-300 bg-primary-50/50 p-2.5">
          <p className="m-0 flex items-center gap-1.5 text-xs font-medium text-primary-700">
            <UserPlus className="h-3.5 w-3.5" />
            New number — they are created with the sale
          </p>
          <Input
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              pushDraft(event.target.value, address);
            }}
            placeholder="Customer name"
            autoFocus
          />
          <Input
            value={address}
            onChange={(event) => {
              setAddress(event.target.value);
              pushDraft(name, event.target.value);
            }}
            prefix={<MapPin className="h-4 w-4 text-secondary-400" />}
            placeholder="Address (optional)"
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
