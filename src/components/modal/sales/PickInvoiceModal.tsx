import { Input, Modal, Tag } from "antd";
import dayjs from "dayjs";
import { Loader2, Receipt, Search } from "lucide-react";
import { useEffect, useState } from "react";
import Money from "../../shared/Money";
import { useGetSalesQuery } from "../../../redux/features/sales/saleApi";

/**
 * Which invoice is coming back.
 *
 * A return has to hang off a sale — that is where the price the customer
 * actually paid lives, and which batch each unit left on. So the way in from
 * the returns screen is to find the invoice first, exactly as the counter
 * does: the customer hands over a receipt, or gives a phone number.
 */
const PickInvoiceModal = ({
  open,
  setOpen,
  onPick,
}: {
  open: boolean;
  setOpen: (value: boolean) => void;
  onPick: (saleId: string) => void;
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

  const { data, isFetching } = useGetSalesQuery(
    [
      { name: "limit", value: 12 },
      ...(term ? [{ name: "keyword", value: term }] : []),
    ],
    { skip: !open }
  );

  const rows = data?.data?.data ?? [];

  return (
    <Modal
      title="Which invoice is coming back?"
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
        placeholder="Invoice number, customer name or phone…"
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
              ? `No invoice matches “${term}”`
              : "No sales yet — nothing can come back."}
          </p>
        </div>
      ) : (
        <div className="max-h-[52vh] space-y-2 overflow-y-auto pr-1">
          {rows.map((sale: any) => {
            // An invoice already fully credited has nothing left to give back;
            // saying so here saves opening it to find out.
            const spent = sale.returnedAmount ?? 0;
            const done = spent >= sale.grandTotal;
            return (
              <button
                key={sale._id}
                type="button"
                disabled={done}
                onClick={() => {
                  onPick(sale._id);
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
                    {sale.invoiceNo}
                  </p>
                  <span className="text-[11px] text-secondary-400">
                    {dayjs(sale.saleDate).format("DD MMM YYYY, h:mm A")}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="m-0 truncate text-[13px] text-secondary-700">
                    {sale.customerName || "Walk-in customer"}
                  </p>
                  {sale.customerPhone && (
                    <span className="font-mono text-[11px] text-secondary-400">
                      {sale.customerPhone}
                    </span>
                  )}
                </div>

                <div className="shrink-0 text-right">
                  <p className="m-0 text-[14px] font-bold text-secondary-800">
                    <Money value={sale.grandTotal} />
                  </p>
                  {spent > 0 && (
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

export default PickInvoiceModal;
