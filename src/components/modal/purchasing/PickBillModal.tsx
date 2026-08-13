import { Input, Modal, Tag } from "antd";
import dayjs from "dayjs";
import { Loader2, Receipt, Search } from "lucide-react";
import { useEffect, useState } from "react";
import Money from "../../shared/Money";
import { useGetPurchasesQuery } from "../../../redux/features/purchasing/purchaseApi";

/**
 * Which delivery is going back.
 *
 * A return hangs off a bill: that is where the price paid and the batch the
 * goods went into are both recorded. Finding the bill first is also how the
 * stockroom works — the delivery note comes out before anything is boxed up.
 */
const PickBillModal = ({
  open,
  setOpen,
  onPick,
}: {
  open: boolean;
  setOpen: (value: boolean) => void;
  onPick: (purchaseId: string) => void;
}) => {
  const [search, setSearch] = useState("");
  const [term, setTerm] = useState("");

  useEffect(() => {
    if (!open) return;
    setSearch("");
    setTerm("");
  }, [open]);

  useEffect(() => {
    const timer = setTimeout(() => setTerm(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isFetching } = useGetPurchasesQuery(
    [
      { name: "limit", value: 12 },
      ...(term ? [{ name: "keyword", value: term }] : []),
    ],
    { skip: !open }
  );

  const rows = data?.data?.data ?? [];

  return (
    <Modal
      title="Which bill is going back?"
      open={open}
      onCancel={() => setOpen(false)}
      footer={null}
      width={720}
      destroyOnHidden
    >
      <Input
        size="large"
        allowClear
        autoFocus
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Bill number, supplier bill no or vendor name…"
        prefix={<Search className="h-4 w-4 text-secondary-400" />}
        suffix={
          isFetching ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : null
        }
        className="!mb-3 !rounded-md"
      />

      {rows.length === 0 ? (
        <div className="grid place-items-center gap-2 py-12 text-center">
          <Receipt className="h-8 w-8 text-secondary-300" />
          <p className="m-0 text-[13px] text-secondary-500">
            {term
              ? `No bill matches “${term}”`
              : "No purchases yet — nothing can go back."}
          </p>
        </div>
      ) : (
        <div className="max-h-[52vh] space-y-2 overflow-y-auto pr-1">
          {rows.map((bill: any) => {
            // A bill fully credited has nothing left to send back; saying so
            // here saves opening it to find out.
            const sent = bill.returnedAmount ?? 0;
            const done = sent >= bill.grandTotal;
            return (
              <button
                key={bill._id}
                type="button"
                disabled={done}
                onClick={() => {
                  onPick(bill._id);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-md border px-3 py-2.5 text-left transition ${
                  done
                    ? "cursor-not-allowed border-secondary-100 bg-secondary-50 opacity-60"
                    : "border-secondary-100 bg-white hover:border-primary hover:bg-primary-50/40"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="m-0 font-mono text-[13px] font-semibold text-secondary-800">
                    {bill.purchaseNo}
                  </p>
                  <span className="text-[11px] text-secondary-400">
                    {dayjs(bill.purchaseDate).format("DD MMM YYYY")}
                    {bill.billNo ? ` · ${bill.billNo}` : ""}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="m-0 truncate text-[13px] text-secondary-700">
                    {bill.vendorName}
                  </p>
                  {bill.due > 0 && (
                    <span className="text-[11px] text-danger">
                      Owing <Money value={bill.due} />
                    </span>
                  )}
                </div>

                <div className="shrink-0 text-right">
                  <p className="m-0 text-[14px] font-bold text-secondary-800">
                    <Money value={bill.grandTotal} />
                  </p>
                  {sent > 0 && (
                    <Tag className="!m-0 !mt-0.5 !border-[#f59e0b55] !bg-[#fffbeb] !text-[10px] !text-[#92400e]">
                      {done ? "Fully returned" : "Part returned"}
                    </Tag>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </Modal>
  );
};

export default PickBillModal;
