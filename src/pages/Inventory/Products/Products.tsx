import { Button } from "antd";
import { Plus, Upload } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PermissionGate from "../../../components/Common/PermissionGate";
import ImportProductsModal from "../../../components/modal/inventory/ImportProductsModal";
import { useGetProductsQuery } from "../../../redux/features/inventory/productApi";
import ProductListView from "./ProductListView";

const Products = () => {
  const navigate = useNavigate();
  const [importing, setImporting] = useState(false);

  return (
    <>
      <ProductListView
        title="Products"
        subtitle="Everything in your catalog, single and variable"
        breadcrumbLabel="Products"
        canonicalPath="/inventory/products"
        useQuery={useGetProductsQuery}
        headerExtra={
          <PermissionGate module="Products" action="Create">
            <div className="flex flex-wrap gap-2">
              {/* Bulk load sits beside Add rather than behind a menu: a shop
                  moving onto the system reaches for it on day one, and never
                  again. Hiding it costs that first day. */}
              <Button
                icon={<Upload className="w-4 h-4" />}
                onClick={() => setImporting(true)}
              >
                Import
              </Button>
              <Button
                type="primary"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => navigate("/inventory/products/create")}
              >
                Add Product
              </Button>
            </div>
          </PermissionGate>
        }
      />

      <ImportProductsModal open={importing} setOpen={setImporting} />
    </>
  );
};

export default Products;
