import { useGetLowStockProductsQuery } from "../../../redux/features/inventory/productApi";
import ProductListView from "./ProductListView";

const LowStocks = () => (
  <ProductListView
    title="Low Stocks"
    subtitle="Products at or below their low-stock threshold"
    breadcrumbLabel="Low Stocks"
    canonicalPath="/inventory/products/low-stock"
    useQuery={useGetLowStockProductsQuery}
    emptyHint="Nothing is running low. A variable product appears here when any one of its variants is low, not only when the total is — 100 in one size and none in another is still a size you cannot sell."
  />
);

export default LowStocks;
