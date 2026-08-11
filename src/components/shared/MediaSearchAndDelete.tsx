import { Button, Checkbox } from "antd";
import { useState } from "react";
import { HiPlus } from "react-icons/hi2";
import { toast } from "react-toastify";
import { useDeleteMediaLibraryMutation } from "../../redux/features/media-library/media-libraryApi";

interface MediaSearchAndDeleteProps {
  images: any[];
  selectedItems: string[];
  setSelectedItems: React.Dispatch<React.SetStateAction<string[]>>;
  onAddNew?: () => void;
  onRefetch?: () => void;
  showAddButton?: boolean;
  addButtonText?: string;
  className?: string;
  data: any;
  mode?: "single" | "multiple";
}

const MediaSearchAndDelete = ({
  data,
  images,
  selectedItems,
  setSelectedItems,
  onAddNew,
  onRefetch,
  showAddButton = true,
  addButtonText = "Add New",
  className = "",
  mode = "single",
}: MediaSearchAndDeleteProps) => {
  const [deleteMediaLibrary] = useDeleteMediaLibraryMutation();
  const [isDeleting, setIsDeleting] = useState(false);

  // Single delete
  const handleDelete = async (name: string) => {
    try {
      const res = await deleteMediaLibrary(name).unwrap();
      if (res.success) {
        toast.success("Image moved to Media Bin");
        onRefetch?.();
      }
    } catch (error: any) {
      console.error(error);
      // Surface the backend reason (e.g. "used by product X…") so the user
      // knows why it can't be deleted and where the image is still in use.
      toast.error(error?.data?.message || "Failed to delete image");
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;
    setIsDeleting(true);

    try {
      const deletePromises = selectedItems.map((name) =>
        deleteMediaLibrary(name).unwrap()
      );
      await Promise.all(deletePromises);
      toast.success(`${selectedItems.length} image(s) moved to Media Bin`);
      setSelectedItems([]);
      onRefetch?.();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.data?.message || "Failed to delete some images");
    } finally {
      setIsDeleting(false);
    }
  };

  // Selection handling
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(images.map((img: any) => img.path ?? img.name));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (name: string, checked: boolean) => {
    if (checked) {
      setSelectedItems((prev) => [...prev, name]);
    } else {
      setSelectedItems((prev) => prev.filter((item) => item !== name));
    }
  };

  const isAllSelected =
    images.length > 0 && selectedItems.length === images.length;
  const isIndeterminate =
    selectedItems.length > 0 && selectedItems.length < images.length;

  return {
    isDeleting,
    handleDelete,
    handleBulkDelete,
    handleSelectAll,
    handleSelectItem,
    searchAndDeleteControls: (
      <div className={`flex flex-col gap-4 ${className}`}>
        {/* Controls Row */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-3">
            {images.length > 0 && mode === "multiple" && (
              <Checkbox
                checked={isAllSelected}
                indeterminate={isIndeterminate}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="text-sm font-medium"
              >
                <span className="ml-2 text-secondary-700">
                  Select All ({selectedItems.length}/{images.length})
                </span>
              </Checkbox>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {showAddButton && onAddNew && (
              <Button
                type="primary"
                icon={<HiPlus className="text-lg" />}
                onClick={onAddNew}
                className="font-semibold flex items-center gap-2"
              >
                {addButtonText}
              </Button>
            )}
          </div>
          {/* Total Count */}
          <div className="text-sm text-secondary-500 font-medium">
            Total: {data?.data.meta?.total || 0} items
          </div>
        </div>
      </div>
    ),
    selectionCheckbox: (
      name: string,
      checked: boolean,
      onChange?: (e: any) => void
    ) => (
      <Checkbox
        checked={checked}
        onChange={(e) => {
          e.stopPropagation();
          handleSelectItem(name, e.target.checked);
          onChange?.(e);
        }}
        style={{ transform: "scale(1.2)" }}
      />
    ),
  };
};

export default MediaSearchAndDelete;
