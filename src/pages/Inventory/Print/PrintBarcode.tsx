import Barcode from "../../../components/shared/Barcode";
import PrintLabelsView from "./PrintLabelsView";

const PrintBarcode = () => (
  <PrintLabelsView
    title="Print Barcode"
    subtitle="Build a sheet of Code 128 shelf labels and print it"
    canonicalPath="/inventory/print-barcode"
    labelWidth={200}
    renderCode={(value) => <Barcode value={value} moduleWidth={1.6} height={48} />}
  />
);

export default PrintBarcode;
