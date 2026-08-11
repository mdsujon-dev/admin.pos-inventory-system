import { Button, Modal } from "antd";
import dayjs from "dayjs";
import { Printer } from "lucide-react";

import amountInWords from "../../utils/amountInWords";

export type VoucherKind =
  | "fee-payment"
  | "fee-refund"
  | "salary-payment"
  | "salary-return";

/**
 * Four documents, one layout.
 *
 * A money receipt and a salary voucher differ only in who is paying whom and
 * what the signature line says. Keeping them as one component means the
 * institute's name, the amount in words and the print rules can never drift
 * apart between them — which is exactly how a set of receipts ends up looking
 * like it came from four different offices.
 */
const COPY: Record<
  VoucherKind,
  { title: string; partyLabel: string; direction: string; signature: string }
> = {
  "fee-payment": {
    title: "Money Receipt",
    partyLabel: "Received from",
    direction: "Received with thanks the sum of",
    signature: "Received by",
  },
  "fee-refund": {
    title: "Refund Voucher",
    partyLabel: "Refunded to",
    direction: "Refunded the sum of",
    signature: "Paid by",
  },
  "salary-payment": {
    title: "Salary Voucher",
    partyLabel: "Paid to",
    direction: "Paid the sum of",
    signature: "Paid by",
  },
  "salary-return": {
    title: "Salary Return Voucher",
    partyLabel: "Returned by",
    direction: "Received back the sum of",
    signature: "Received by",
  },
};

export interface VoucherData {
  kind: VoucherKind;
  /** RCP-2026-0007 / SAL-2026-0003 */
  number?: string;
  date?: string | Date;
  /** The person on the other side of the transaction. */
  partyName?: string;
  partyId?: string;
  partyPhone?: string;
  amount: number;
  method?: string;
  reference?: string;
  /** "Course fee — Spoken English" or "Salary for Aug 2026". */
  particulars?: string;
  /** Fee vouchers only: where this leaves the student. */
  totalPayable?: number;
  totalPaid?: number;
  totalDue?: number;
  handledBy?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  data: VoucherData | null;
}

const Row = ({ label, value }: { label: string; value?: React.ReactNode }) =>
  value ? (
    <div className="flex gap-2 text-[13px]">
      <span className="w-28 shrink-0 text-secondary-500">{label}</span>
      <span className="font-medium text-secondary-900">: {value}</span>
    </div>
  ) : null;

const VoucherModal = ({ open, onClose, data }: Props) => {
  if (!data) return null;
  const copy = COPY[data.kind];
  const isFee = data.kind === "fee-payment" || data.kind === "fee-refund";

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={620}
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Close</Button>
          <Button
            type="primary"
            icon={<Printer className="h-4 w-4" />}
            // The browser's own dialog handles paper size and "save as PDF",
            // so there is nothing to build for either.
            onClick={() => window.print()}
          >
            Print
          </Button>
        </div>
      }
    >
      {/* `voucher-print` is what the print stylesheet keeps on the page —
          everything else in the app is hidden while printing. */}
      <div className="voucher-print bg-white p-6 text-secondary-900">
        {/* Letterhead */}
        <div className="border-b-2 border-secondary-900 pb-3 text-center">
          <h1 className="text-xl font-bold tracking-wide">
            AYESHA POS & Inventory
          </h1>
          <p className="mt-0.5 text-xs text-secondary-500">
            Skill development &amp; professional training
          </p>
        </div>

        <div className="mt-4 flex items-start justify-between">
          <span className="rounded border border-secondary-900 px-3 py-1 text-sm font-bold uppercase tracking-wider">
            {copy.title}
          </span>
          <div className="text-right text-[13px]">
            <div>
              <span className="text-secondary-500">No.</span>{" "}
              <span className="font-mono font-semibold">
                {data.number || "—"}
              </span>
            </div>
            <div>
              <span className="text-secondary-500">Date</span>{" "}
              <span className="font-medium">
                {dayjs(data.date).format("DD MMM YYYY")}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-1.5">
          <Row label={copy.partyLabel} value={data.partyName} />
          <Row label="ID" value={data.partyId} />
          <Row label="Mobile" value={data.partyPhone} />
          <Row label="Particulars" value={data.particulars} />
          <Row
            label="Payment mode"
            value={
              data.method ? (
                <span className="capitalize">{data.method}</span>
              ) : undefined
            }
          />
          <Row label="Reference" value={data.reference} />
        </div>

        {/* The amount, twice — figures and words. */}
        <div className="mt-5 rounded border border-secondary-200 bg-secondary-50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-secondary-500">
              {copy.direction}
            </span>
            <span className="text-2xl font-bold">
              ৳ {Number(data.amount || 0).toLocaleString("en-BD")}
            </span>
          </div>
          <p className="mt-1 text-[13px] italic text-secondary-700">
            {amountInWords(data.amount)}
          </p>
        </div>

        {/* Where the student stands after this — the question every parent
            asks at the desk, answered on the paper they walk away with. */}
        {isFee && data.totalPayable !== undefined && (
          <div className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded border border-secondary-200 bg-secondary-200 text-center">
            <div className="bg-white p-2">
              <p className="text-[11px] text-secondary-500">Total payable</p>
              <p className="text-sm font-semibold">
                ৳ {Number(data.totalPayable || 0).toLocaleString("en-BD")}
              </p>
            </div>
            <div className="bg-white p-2">
              <p className="text-[11px] text-secondary-500">Total paid</p>
              <p className="text-sm font-semibold">
                ৳ {Number(data.totalPaid || 0).toLocaleString("en-BD")}
              </p>
            </div>
            <div className="bg-white p-2">
              <p className="text-[11px] text-secondary-500">Balance due</p>
              <p
                className={`text-sm font-semibold ${
                  (data.totalDue || 0) > 0 ? "text-red-600" : ""
                }`}
              >
                ৳ {Number(data.totalDue || 0).toLocaleString("en-BD")}
              </p>
            </div>
          </div>
        )}

        {/* Signatures */}
        <div className="mt-12 flex justify-between gap-8">
          <div className="flex-1 border-t border-secondary-400 pt-1 text-center text-xs text-secondary-600">
            {copy.signature}
            {data.handledBy && (
              <span className="block text-[11px] text-secondary-400">
                {data.handledBy}
              </span>
            )}
          </div>
          <div className="flex-1 border-t border-secondary-400 pt-1 text-center text-xs text-secondary-600">
            Authorised signature
          </div>
        </div>

        <p className="mt-6 text-center text-[10px] text-secondary-400">
          This is a computer-generated voucher.
        </p>
      </div>
    </Modal>
  );
};

export default VoucherModal;
