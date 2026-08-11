import { Button } from "antd";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PermissionGate from "../../../components/Common/PermissionGate";
import { useGetProductsQuery } from "../../../redux/features/inventory/productApi";
import ProductListView from "./ProductListView";

const Products = () => {
  const navigate = useNavigate();

  return (
    <ProductListView
      title="Products"
      subtitle="Everything in your catalog, single and variable"
      breadcrumbLabel="Products"
      canonicalPath="/inventory/products"
      useQuery={useGetProductsQuery}
      headerExtra={
        <PermissionGate module="Products" action="Create">
          <Button
            type="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => navigate("/inventory/products/create")}
          >
            Add Product
          </Button>
        </PermissionGate>
      }
    />
  );
};

export default Products;
