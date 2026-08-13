import { Modal, Tag } from "antd";
import { Smartphone, Wifi, WifiOff } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { TillPresence } from "../../../hooks/useTillSocket";

/**
 * Pairing a phone to this till.
 *
 * A QR of the scanner's own address, because the alternative is reading six
 * characters off one screen and typing them into another while holding a
 * phone — which works, and is printed underneath for when the camera will
 * not focus, but should not be the first thing anyone has to do.
 *
 * The address is built from `window.location.origin`, so a shop running this
 * on a local network gets the machine's own address rather than a hostname
 * only the till can resolve.
 */
const PhoneScannerModal = ({
  open,
  setOpen,
  code,
  connected,
  presence,
}: {
  open: boolean;
  setOpen: (value: boolean) => void;
  code: string;
  connected: boolean;
  presence: TillPresence;
}) => {
  const [qr, setQr] = useState<string | null>(null);
  const url = `${window.location.origin}/sales/scanner?till=${code}`;

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    QRCode.toDataURL(url, { width: 320, margin: 1 })
      .then((data) => !cancelled && setQr(data))
      // A failed QR is not a failed feature — the code below still pairs.
      .catch(() => !cancelled && setQr(null));

    return () => {
      cancelled = true;
    };
  }, [open, url]);

  const linked = presence.scanners > 0;

  return (
    <Modal
      title="Scan with a phone"
      open={open}
      onCancel={() => setOpen(false)}
      footer={null}
      width={440}
      destroyOnHidden
    >
      <div className="space-y-4 text-center">
        <p className="m-0 text-[13px] text-secondary-500">
          Point a phone camera at this code. Whatever it scans in the aisle
          lands in this cart.
        </p>

        <div className="mx-auto w-fit rounded-xl border border-secondary-100 bg-white p-3">
          {qr ? (
            <img src={qr} alt="Pairing code" className="h-[220px] w-[220px]" />
          ) : (
            <div className="grid h-[220px] w-[220px] place-items-center text-[12px] text-secondary-400">
              Type the code below on the phone
            </div>
          )}
        </div>

        <div>
          <p className="m-0 text-[11px] uppercase tracking-wide text-secondary-400">
            Or type this at /sales/scanner
          </p>
          <p className="m-0 font-mono text-[26px] font-bold tracking-[0.3em] text-secondary-800">
            {code}
          </p>
        </div>

        {/*
          Three states, not two. "Paired but no phone yet" is the one a cashier
          stands in front of while wondering whether to walk off with the
          handset, and merging it into "not connected" makes them wait for a
          thing that already happened.
        */}
        <Tag
          className={`!m-0 !px-3 !py-1 ${
            linked
              ? "!border-primary-200 !bg-primary-50 !text-primary-700"
              : connected
                ? "!border-[#f59e0b55] !bg-[#fffbeb] !text-[#92400e]"
                : "!border-danger/30 !bg-danger/5 !text-danger"
          }`}
        >
          {linked ? (
            <Smartphone className="mr-1.5 inline h-3.5 w-3.5" />
          ) : connected ? (
            <Wifi className="mr-1.5 inline h-3.5 w-3.5" />
          ) : (
            <WifiOff className="mr-1.5 inline h-3.5 w-3.5" />
          )}
          {linked
            ? `${presence.scanners} phone${
                presence.scanners === 1 ? "" : "s"
              } connected`
            : connected
              ? "Waiting for a phone"
              : "Till is offline"}
        </Tag>

        <p className="m-0 text-[11px] text-secondary-400">
          The phone must be signed in to the same shop and allowed to ring up
          sales. It sends only the code off the label — prices and stock are
          still decided here.
        </p>
      </div>
    </Modal>
  );
};

export default PhoneScannerModal;
