import { useGetExpiredProductsQuery } from "../../../redux/features/inventory/productApi";
import ProductListView from "./ProductListView";

const ExpiredProducts = () => (
  <ProductListView
    title="Expired Products"
    subtitle="Stock that is already past its expiry date"
    breadcrumbLabel="Expired Products"
    canonicalPath="/inventory/products/expired"
    useQuery={useGetExpiredProductsQuery}
    showExpiry
    emptyHint="Nothing has expired. A product appears here once its expiry date has passed — for a variable product, as soon as its earliest-dated variant does."
  />
);

export default ExpiredProducts;
