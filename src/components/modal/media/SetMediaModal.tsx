import {
  CopyOutlined,
  DeleteOutlined,
  FileOutlined,
  FolderOutlined,
} from "@ant-design/icons";
import {
  Button,
  Empty,
  Input,
  message,
  Modal,
  Pagination,
  Popconfirm,
  Tooltip,
} from "antd";
import { ChevronRight, Folder, FolderPlus, Pencil, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { IoMdAdd } from "react-icons/io";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { config } from "../../../config";
import { useDebounced } from "../../../redux/features/hooks";
import {
  useMediaLibraryListQuery,
  useMoveMediaLibraryMutation,
} from "../../../redux/features/media-library/media-libraryApi";
import {
  useCreateFolderMutation,
  useDeleteFolderMutation,
  useGetFoldersQuery,
  useUpdateFolderMutation,
} from "../../../redux/features/folder/folderApi";
import MediaSearchAndDelete from "../../shared/MediaSearchAndDelete";
import MediaLibraryUploadModal from "./MediaLibraryUploadModal";

interface SetMediaModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onSelectImage?: (imageUrl: string | string[], data?: any) => void;
  selectionMode?: "single" | "multiple";
  initialSelected?: string[] | string;
  type?: "image" | "video" | "audio" | "document" | "other";
}

function filterItemsForSetMedia<
  T extends { type?: string; name?: string; url?: string },
>(items: T[], kind: NonNullable<SetMediaModalProps["type"]>): T[] {
  if (kind === "video") {
    return items.filter((item) => {
      const mime = String(item.type || "").toLowerCase();
      if (mime.startsWith("video/")) return true;
      return /\.(mp4|webm|mov|mkv|avi|ogv|m4v)(\?.*)?$/i.test(
        String(item.name || "")
      );
    });
  }
  // Syllabus sheets, brochures, forms — anything handed over as a file rather
  // than shown on screen.
  if (kind === "document") {
    return items.filter((item) => {
      const mime = String(item.type || "").toLowerCase();
      if (mime.startsWith("application/") || mime.startsWith("text/")) {
        return true;
      }
      return /\.(pdf|docx?|xlsx?|pptx?|txt|csv)(\?.*)?$/i.test(
        String(item.name || "")
      );
    });
  }
  if (kind === "image") {
    return items.filter((item) => {
      const mime = String(item.type || "").toLowerCase();
      if (mime.startsWith("video/")) return false;
      // A PDF is not a picture, so it has no business in an image picker.
      if (mime === "application/pdf") return false;
      return !/\.(mp4|webm|mov|mkv|avi|ogv|m4v|pdf|docx?|xlsx?|pptx?)(\?.*)?$/i.test(
        String(item.name || "")
      );
    });
  }
  return items;
}

const SetMediaModal: React.FC<SetMediaModalProps> = ({
  open,
  setOpen,
  onSelectImage,
  selectionMode = "single",
  initialSelected,
  type = "image",
}) => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(100);
  const [searchText, setSearchText] = useState("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // -- Folder navigation with breadcrumb ----------------------------------
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<{ id: string; name: string }[]>([]);

  // -- Folder create / rename modal ----------------------------------------
  const [folderModal, setFolderModal] = useState<{
    open: boolean;
    mode: "create" | "rename";
    id?: string;
    name: string;
  }>({ open: false, mode: "create", name: "" });

  const [openMediaLibraryUploadModal, setOpenMediaLibraryUploadModal] = useState(false);
  const debouncedSearch = useDebounced({ searchQuery: searchText, delay: 500 });

  // -- Drag to move --------------------------------------------------------
  const dragKeyRef = useRef<string | null>(null);
  const [moveMedia] = useMoveMediaLibraryMutation();
  const [createFolder, { isLoading: savingFolder }] = useCreateFolderMutation();
  const [updateFolder, { isLoading: renamingFolder }] = useUpdateFolderMutation();
  const [deleteFolder] = useDeleteFolderMutation();

  const isVideoMode = type === "video";
  const isDocMode = type === "document";

  const { data, isFetching, refetch } = useMediaLibraryListQuery(
    {
      page,
      limit,
      search: debouncedSearch || undefined,
      type,
      folder: currentFolderId ?? undefined,
    },
    { skip: !open }
  );

  const { data: folderData, isFetching: isFolderFetching, refetch: refetchFolders } =
    useGetFoldersQuery(currentFolderId ?? "root", { skip: !open });

  const images = useMemo(
    () => (Array.isArray(data?.data?.data) ? data.data.data : []),
    [data]
  );

  const folders = useMemo(
    () => (Array.isArray(folderData?.data) ? folderData.data : []),
    [folderData]
  );

  const displayItems = useMemo(
    () => filterItemsForSetMedia(images, type),
    [images, type]
  );

  const meta = data?.data?.meta || {};

  useEffect(() => {
    if (displayItems?.length === 0) return;

    if (selectionMode === "single" && typeof initialSelected === "string") {
      const found = displayItems?.find(
        (img) => img.url === initialSelected || img.name === initialSelected
      );
      if (found?.url) setSelectedImage(found.url);
    } else if (selectionMode === "multiple" && Array.isArray(initialSelected)) {
      const foundNames = displayItems
        .filter(
          (img) =>
            (img.url && initialSelected.includes(img.url)) ||
            (img.name && initialSelected.includes(img.name))
        )
        .map((img) => img.name)
        .filter((name): name is string => name !== undefined);
      setSelectedItems(foundNames);
    }
  }, [displayItems, initialSelected, selectionMode]);

  const handleCopy = (url: string) => {
    try {
      navigator.clipboard.writeText(url);
      message.success("URL copied to clipboard");
    } catch {
      message.error("Failed to copy URL");
    }
  };

  const {
    isDeleting,
    handleDelete,
    handleBulkDelete,
    searchAndDeleteControls,
    selectionCheckbox,
  } = MediaSearchAndDelete({
    images: displayItems,
    data,
    selectedItems,
    mode: selectionMode,
    setSelectedItems,
    onAddNew: () => setOpenMediaLibraryUploadModal(true),
    onRefetch: () => {
      refetch();
      refetchFolders();
    },
    showAddButton: false,
  });

  const handleImageClick = (url: string, name: string) => {
    if (selectionMode === "single") {
      setSelectedImage(url);
      setSelectedItems([name]);
    } else {
      setSelectedItems((prev) =>
        prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
      );
    }
  };

  const isOkDisabled = () => {
    if (selectionMode === "single") return !selectedImage;
    return selectedItems.length === 0;
  };

  const handleOk = () => {
    if (selectionMode === "single" && selectedImage) {
      const selectedMedia = displayItems.find((img) => img.url === selectedImage);
      onSelectImage?.(selectedImage, selectedMedia);
    } else if (selectionMode === "multiple" && selectedItems.length > 0) {
      const selectedMedia = displayItems.filter(
        (img) => img.name && selectedItems.includes(img.name)
      );
      const selectedUrls = selectedMedia.map((img) => img.url as string);
      onSelectImage?.(selectedUrls, selectedMedia);
    }

    setSelectedImage(null);
    setSelectedItems([]);
    setOpen(false);
  };

  const handleCancel = () => {
    setOpen(false);
    setSelectedImage(null);
    setSelectedItems([]);
    setSearchText("");
    setCurrentFolderId(null);
    setBreadcrumb([]);
  };

  // -- Folder navigation ---------------------------------------------------
  const openFolder = (folder: any) => {
    setBreadcrumb((prev) => [...prev, { id: folder._id, name: folder.name }]);
    setCurrentFolderId(folder._id);
    setPage(1);
  };

  const goToCrumb = (index: number) => {
    if (index < 0) {
      setBreadcrumb([]);
      setCurrentFolderId(null);
    } else {
      setBreadcrumb((prev) => prev.slice(0, index + 1));
      setCurrentFolderId(breadcrumb[index].id);
    }
    setPage(1);
  };

  // -- Folder CRUD ---------------------------------------------------------
  const submitFolder = async () => {
    const name = folderModal.name.trim();
    if (!name) return;
    try {
      if (folderModal.mode === "create") {
        await createFolder({ name, parent: currentFolderId }).unwrap();
        message.success("Folder created");
      } else if (folderModal.id) {
        await updateFolder({ id: folderModal.id, name }).unwrap();
        message.success("Folder renamed");
      }
      setFolderModal({ open: false, mode: "create", name: "" });
      refetchFolders();
    } catch (e: any) {
      message.error(e?.data?.message || "Something went wrong");
    }
  };

  const handleDeleteFolder = async (id: string) => {
    try {
      await deleteFolder(id).unwrap();
      message.success("Folder deleted");
      refetchFolders();
    } catch (e: any) {
      message.error(e?.data?.message || "Failed to delete folder");
    }
  };

  // -- Drag & drop move ----------------------------------------------------
  const handleDropOnFolder = async (folderId: string | null) => {
    const key = dragKeyRef.current;
    dragKeyRef.current = null;
    if (!key) return;
    try {
      await moveMedia({ key, folder: folderId }).unwrap();
      message.success(folderId ? "Moved into folder" : "Moved to root");
      refetch();
    } catch (e: any) {
      message.error(e?.data?.message || "Failed to move");
    }
  };

  // -- Context-menu style "Move here" button while dragging ----------------
  const [draggingKey, setDraggingKey] = useState<string | null>(null);

  // One word for whatever this picker is currently picking, so every label
  // below reads correctly instead of saying "image" for a PDF.
  const noun = isVideoMode ? "Video" : isDocMode ? "File" : "Image";
  const nounLower = noun.toLowerCase();

  const modalTitle = `?? Select a${
    noun === "Image" ? "n" : ""
  } ${noun} from Media`;

  const okTextSingle = `Set ${noun}`;
  const okTextMultiple = `Set Selected ${noun}s`;

  const emptyDescription =
    `No ${nounLower}s found` + (folders.length === 0 ? " and no folders." : ".");

  const bulkDeleteTitle = `Delete ${selectedItems.length} selected ${nounLower}(s)?`;

  const singleDeleteTitle = `Delete this ${nounLower}?`;

  return (
    <>
      <Modal
        open={open}
        onCancel={handleCancel}
        onOk={handleOk}
        okText={selectionMode === "single" ? okTextSingle : okTextMultiple}
        okButtonProps={{ disabled: isOkDisabled() }}
        width="100%"
        destroyOnClose
        centered
        title={modalTitle}
      >
        <div className="flex flex-col h-[65vh]">
          {/* -- Top bar ---------------------------------------------------- */}
          <div className="flex gap-2 mb-3">
            <Input
              placeholder="Search media by name..."
              prefix={<Search className="w-4 h-4 text-secondary-400" />}
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setPage(1);
              }}
              className="flex-1"
              size="middle"
            />

            <Tooltip title="Upload Image">
              <Button
                onClick={() => setOpenMediaLibraryUploadModal(true)}
                type="primary"
                className="flex items-center gap-1"
                size="middle"
              >
                <IoMdAdd />
                <span className="hidden md:inline">Upload</span>
              </Button>
            </Tooltip>

            <Tooltip title="New Folder">
              <Button
                onClick={() =>
                  setFolderModal({ open: true, mode: "create", name: "" })
                }
                type="default"
                className="flex items-center gap-1"
                size="middle"
                icon={<FolderPlus className="w-4 h-4" />}
              >
                <span className="hidden md:inline">New Folder</span>
              </Button>
            </Tooltip>

            {selectedItems.length > 0 && selectionMode === "multiple" && (
              <Popconfirm
                title={bulkDeleteTitle}
                onConfirm={handleBulkDelete}
                okText="Yes"
                cancelText="No"
              >
                <Button
                  loading={isDeleting}
                  className="flex items-center gap-1"
                  size="middle"
                >
                  <DeleteOutlined />
                  <span className="hidden xs:inline">({selectedItems.length})</span>
                </Button>
              </Popconfirm>
            )}
          </div>

          {/* -- Breadcrumb navigation ----------------------------------- */}
          <div className="flex items-center gap-1 text-sm flex-wrap mb-2 px-1">
            <button
              onClick={() => goToCrumb(-1)}
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add("bg-primary-100");
              }}
              onDragLeave={(e) => e.currentTarget.classList.remove("bg-primary-100")}
              onDrop={(e) => {
                e.currentTarget.classList.remove("bg-primary-100");
                handleDropOnFolder(null);
              }}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md transition-colors ${
                currentFolderId === null
                  ? "text-primary font-semibold bg-primary-50"
                  : "text-secondary-500 hover:bg-primary-50 hover:text-primary"
              }`}
            >
              <Folder className="w-3.5 h-3.5" />
              Root
            </button>

            {breadcrumb.map((crumb, i) => (
              <span key={crumb.id} className="flex items-center gap-1">
                <ChevronRight className="w-3 h-3 text-secondary-400" />
                <button
                  onClick={() => goToCrumb(i)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add("bg-primary-100");
                  }}
                  onDragLeave={(e) =>
                    e.currentTarget.classList.remove("bg-primary-100")
                  }
                  onDrop={(e) => {
                    e.currentTarget.classList.remove("bg-primary-100");
                    handleDropOnFolder(crumb.id);
                  }}
                  className={`px-2 py-0.5 rounded-md transition-colors ${
                    i === breadcrumb.length - 1
                      ? "text-primary font-semibold bg-primary-50"
                      : "text-secondary-500 hover:bg-primary-50 hover:text-primary"
                  }`}
                >
                  {crumb.name}
                </button>
              </span>
            ))}
          </div>

          {/* -- Filter/delete controls ---------------------------------- */}
          <div className="mb-2">{searchAndDeleteControls}</div>

          {/* -- Grid ---------------------------------------------------- */}
          <div className="flex-1 overflow-hidden">
            {isFetching || isFolderFetching ? (
              <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 sm:gap-3 h-full overflow-y-auto">
                {Array.from({ length: 21 }).map((_, i) => (
                  <div key={i} className="border rounded-lg overflow-hidden">
                    <Skeleton height={110} />
                    <div className="p-2">
                      <Skeleton height={14} width="80%" />
                      <Skeleton height={10} width="60%" />
                    </div>
                  </div>
                ))}
              </div>
            ) : displayItems?.length === 0 && folders.length === 0 ? (
              <div className="flex justify-center items-center h-full">
                <Empty description={emptyDescription} />
              </div>
            ) : (
              <div className="h-full flex flex-col">
                <div className="flex-1 overflow-y-auto">
                  <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 sm:gap-3 p-1">

                    {/* -- Folders first --------------------------------- */}
                    {!searchText &&
                      folders.map((f: any) => (
                        <div
                          key={f._id}
                          onDoubleClick={() => openFolder(f)}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.add(
                              "ring-2",
                              "ring-primary",
                              "bg-primary-50"
                            );
                          }}
                          onDragLeave={(e) =>
                            e.currentTarget.classList.remove(
                              "ring-2",
                              "ring-primary",
                              "bg-primary-50"
                            )
                          }
                          onDrop={(e) => {
                            e.currentTarget.classList.remove(
                              "ring-2",
                              "ring-primary",
                              "bg-primary-50"
                            );
                            handleDropOnFolder(f._id);
                          }}
                          className="group relative rounded-lg border border-secondary-200 hover:border-primary cursor-pointer overflow-hidden transition-all duration-200 flex flex-col items-center justify-center p-3 bg-secondary-50 hover:bg-primary-50/30 h-[140px]"
                          title={`Double-click to open • Drag media here to move`}
                        >
                          {/* Open button */}
                          <button
                            onClick={() => openFolder(f)}
                            className="flex flex-col items-center gap-1.5 w-full"
                          >
                            <FolderOutlined className="text-4xl text-primary" />
                            <p
                              className="text-xs font-semibold truncate w-full text-center px-1 text-secondary-700"
                              title={f.name}
                            >
                              {f.name}
                            </p>
                          </button>

                          {/* Hover actions */}
                          <div className="absolute top-1 right-1 hidden group-hover:flex items-center gap-1">
                            <Tooltip title="Rename folder">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFolderModal({
                                    open: true,
                                    mode: "rename",
                                    id: f._id,
                                    name: f.name,
                                  });
                                }}
                                className="p-1 rounded bg-white/90 hover:bg-primary-50 text-secondary-500 hover:text-primary shadow-sm transition-colors"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                            </Tooltip>
                            <Popconfirm
                              title="Delete this folder and everything inside?"
                              onConfirm={(e) => {
                                e?.stopPropagation();
                                handleDeleteFolder(f._id);
                              }}
                              okText="Yes"
                              cancelText="No"
                            >
                              <button
                                onClick={(e) => e.stopPropagation()}
                                className="p-1 rounded bg-white/90 hover:bg-primary-50 text-secondary-500 hover:text-primary-600 shadow-sm transition-colors"
                              >
                                <DeleteOutlined className="text-xs" />
                              </button>
                            </Popconfirm>
                          </div>

                          {/* Move-here hint when dragging */}
                          {draggingKey && (
                            <div className="absolute inset-0 bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-lg">
                              <span className="text-[10px] font-bold text-primary bg-white/90 px-1.5 py-0.5 rounded shadow-sm">
                                Drop here
                              </span>
                            </div>
                          )}
                        </div>
                      ))}

                    {/* -- Media items ------------------------------------ */}
                    {displayItems?.map((img: any) => {
                      const isSelected =
                        selectionMode === "single"
                          ? selectedImage === img.url
                          : selectedItems.includes(img.name);

                      const fullSrc =
                        img.url?.startsWith("http") || img.url?.startsWith("//")
                          ? img.url
                          : `${String(config.image_access_url).replace(/\/$/, "")}/${String(img.url).replace(/^\//, "")}`;

                      return (
                        <div
                          key={img.name}
                          draggable
                          onDragStart={() => {
                            dragKeyRef.current = img.path;
                            setDraggingKey(img.path);
                          }}
                          onDragEnd={() => {
                            dragKeyRef.current = null;
                            setDraggingKey(null);
                          }}
                          className={`relative rounded-lg border cursor-grab active:cursor-grabbing overflow-hidden transition-all duration-200 ${
                            isSelected
                              ? "ring-[2px] ring-primary border-primary shadow-md"
                              : "border-secondary-200 ring-[1px] ring-transparent hover:border-primary-100 hover:ring-primary-100"
                          }`}
                          onClick={() => handleImageClick(img.url, img.name)}
                        >
                          <div className="absolute top-1 left-1 z-30">
                            {selectionCheckbox(img.name, isSelected)}
                          </div>

                          <div className="absolute top-1 right-1 z-30 flex gap-1">
                            <Tooltip title="Copy URL">
                              <CopyOutlined
                                className="text-primary-500 hover:text-primary-700 cursor-pointer text-base p-1 rounded bg-white shadow-sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopy(fullSrc);
                                }}
                              />
                            </Tooltip>
                            <Tooltip title="Delete">
                              <Popconfirm
                                title={singleDeleteTitle}
                                onConfirm={(e) => {
                                  e?.stopPropagation();
                                  handleDelete(img.name);
                                }}
                                okText="Yes"
                                cancelText="No"
                              >
                                <DeleteOutlined
                                  className="text-primary-500 hover:text-primary-700 cursor-pointer text-base p-1 rounded bg-white shadow-sm"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </Popconfirm>
                            </Tooltip>
                          </div>

                          <div className="h-[90px] flex items-center justify-center bg-secondary-50 overflow-hidden">
                            {isVideoMode ? (
                              <video
                                className="max-w-full max-h-full object-contain bg-[#f5f5f5]"
                                muted
                                playsInline
                                preload="metadata"
                                src={fullSrc}
                              />
                            ) : isDocMode ? (
                              // A document has no thumbnail, so the extension
                              // is what tells them apart at a glance.
                              <div className="flex flex-col items-center gap-1 text-secondary-400">
                                <FileOutlined className="text-2xl" />
                                <span className="text-[10px] font-semibold uppercase">
                                  {String(img.name || "")
                                    .split(".")
                                    .pop()
                                    ?.slice(0, 4) || "file"}
                                </span>
                              </div>
                            ) : (
                              <img
                                alt={img.name}
                                src={fullSrc}
                                className="max-w-full max-h-full object-contain bg-[#f5f5f5]"
                              />
                            )}
                          </div>

                          <div className="p-1 sm:p-1.5 bg-white border-t">
                            <p className="text-[10px] xs:text-xs font-medium truncate mb-0.5">
                              {img.name}
                            </p>
                            {img.dimensions && (
                              <p className="text-[8px] xs:text-[10px] text-secondary-500">
                                {img.dimensions.width}x{img.dimensions.height}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {(meta.total || 0) > (meta.limit || limit) && (
                  <div className="flex-shrink-0 border-t pt-2 mt-2">
                    <div className="flex justify-center px-2">
                      <Pagination
                        current={meta.page || 1}
                        pageSize={meta.limit || limit}
                        total={meta.total || 0}
                        showSizeChanger
                        pageSizeOptions={["15", "30", "50", "75", "100", "200", "500"]}
                        onChange={(newPage, newLimit) => {
                          setPage(newPage);
                          setLimit(newLimit);
                        }}
                        onShowSizeChange={(_current, newLimit) => {
                          setPage(1);
                          setLimit(newLimit);
                        }}
                        responsive
                        size="small"
                        showTotal={(total, range) => (
                          <span className="text-xs text-secondary-500 hidden sm:inline">
                            {range[0]}-{range[1]} of {total}
                          </span>
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {openMediaLibraryUploadModal && (
          <MediaLibraryUploadModal
            open={openMediaLibraryUploadModal}
            setOpen={setOpenMediaLibraryUploadModal}
            uploadKind={isVideoMode ? "video" : isDocMode ? "document" : "image"}
            folder={currentFolderId}
          />
        )}
      </Modal>

      {/* -- Create / Rename Folder Modal ----------------------------------- */}
      <Modal
        title={folderModal.mode === "create" ? "New Folder" : "Rename Folder"}
        open={folderModal.open}
        onOk={submitFolder}
        onCancel={() => setFolderModal({ open: false, mode: "create", name: "" })}
        confirmLoading={savingFolder || renamingFolder}
        okText={folderModal.mode === "create" ? "Create" : "Save"}
        destroyOnClose
      >
        <Input
          placeholder="Folder name"
          value={folderModal.name}
          onChange={(e) =>
            setFolderModal((prev) => ({ ...prev, name: e.target.value }))
          }
          onPressEnter={submitFolder}
          autoFocus
        />
      </Modal>
    </>
  );
};

export default SetMediaModal;
