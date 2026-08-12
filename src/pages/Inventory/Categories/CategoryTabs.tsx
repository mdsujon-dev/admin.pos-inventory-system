import { Button, Tabs } from "antd";
import { LayoutGrid, Plus, Rows3 } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import PageHeader from "../../../components/Common/PageHeader";
import PageMeta from "../../../components/Common/PageMeta";
import PermissionGate from "../../../components/Common/PermissionGate";
import CategoryModal from "../../../components/modal/inventory/CategoryModal";
import SubCategoryModal from "../../../components/modal/inventory/SubCategoryModal";
import SubCategories from "../SubCategories/SubCategories";
import Categories from "./Categories";

type TabKey = "categories" | "sub-categories";

/**
 * Categories and sub categories on one screen.
 *
 * They were two sidebar entries, and the split was arbitrary: a sub category
 * has no meaning without its parent, and filing one usually means looking at
 * the other in the same breath. One screen with two tabs keeps them together
 * without pretending they are one table.
 *
 * Both create buttons live up here rather than inside their tabs, so adding a
 * sub category does not first require switching to the tab that offers it.
 */
const CategoryTabs = () => {
  const [params, setParams] = useSearchParams();

  // The tab is in the URL so the two old addresses can each land on their own
  // table, and so a tab someone is working in survives a refresh.
  const active: TabKey =
    params.get("tab") === "sub-categories" ? "sub-categories" : "categories";

  const [creatingCategory, setCreatingCategory] = useState(false);
  const [creatingSubCategory, setCreatingSubCategory] = useState(false);

  const setTab = (key: string) => {
    setParams(key === "categories" ? {} : { tab: key }, { replace: true });
  };

  return (
    <div>
      <PageMeta
        title="Category - POS & Inventory Admin Panel"
        description="Product categories and the sub categories under them"
        canonicalUrl={`${window.location.origin}/inventory/categories`}
        noindex={true}
      />
      <PageHeader
        title="Category"
        subtitle="Group products into categories, and break each one down further"
        breadcrumbs={[
          { title: "Dashboard", path: "/" },
          { title: "Inventory" },
          { title: "Category" },
        ]}
        extra={
          <div className="flex flex-wrap items-center gap-2">
            <PermissionGate module="Categories" action="Create">
              <Button
                icon={<Plus className="h-4 w-4" />}
                onClick={() => setCreatingCategory(true)}
              >
                Add Category
              </Button>
            </PermissionGate>
            <PermissionGate module="Sub Categories" action="Create">
              <Button
                type="primary"
                icon={<Plus className="h-4 w-4" />}
                onClick={() => setCreatingSubCategory(true)}
                className="!border-0 !bg-gradient-to-r !from-primary-600 !to-primary-500 shadow-primary"
              >
                Add Sub Category
              </Button>
            </PermissionGate>
          </div>
        }
      />

      <Tabs
        activeKey={active}
        onChange={setTab}
        items={[
          {
            key: "categories",
            label: (
              <span className="flex items-center gap-2">
                <LayoutGrid className="h-4 w-4" />
                Categories
              </span>
            ),
            children: <Categories embedded />,
          },
          {
            key: "sub-categories",
            label: (
              <span className="flex items-center gap-2">
                <Rows3 className="h-4 w-4" />
                Sub Categories
              </span>
            ),
            children: <SubCategories embedded />,
          },
        ]}
      />

      {creatingCategory && (
        <CategoryModal
          open
          setOpen={() => setCreatingCategory(false)}
          onCreated={() => {
            setCreatingCategory(false);
            setTab("categories");
          }}
        />
      )}
      {creatingSubCategory && (
        <SubCategoryModal
          open
          setOpen={() => setCreatingSubCategory(false)}
          onCreated={() => {
            setCreatingSubCategory(false);
            // Land on the table the new row is actually in, rather than
            // leaving someone looking at a list that did not change.
            setTab("sub-categories");
          }}
        />
      )}
    </div>
  );
};

export default CategoryTabs;
