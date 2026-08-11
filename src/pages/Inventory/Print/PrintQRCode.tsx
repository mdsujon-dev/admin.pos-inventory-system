import QRCodeImage from "../../../components/shared/QRCodeImage";
import PrintLabelsView from "./PrintLabelsView";

const PrintQRCode = () => (
  <PrintLabelsView
    title="Print QR Code"
    subtitle="Build a sheet of QR labels and print it"
    canonicalPath="/inventory/print-qr-code"
    labelWidth={130}
    renderCode={(value) => <QRCodeImage value={value} size={96} />}
  />
);

export default PrintQRCode;
