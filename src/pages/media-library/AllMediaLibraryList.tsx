import { CopyOutlined, DeleteOutlined, DownOutlined, InfoCircleOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Dropdown,
  Empty,
  Input,
  message,
  Pagination,
  Popconfirm,
  Space,
  Tooltip,
  Modal,
} from "antd";
import type { MenuProps } from "antd";
import { ChevronRight, Folder, FolderPlus, Pencil, Search, Trash2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { IoMdAdd } from "react-icons/io";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import PageHeader from "../../components/Common/PageHeader";
import PageMeta from "../../components/Common/PageMeta";
import PermissionGate from "../../components/Common/PermissionGate";
import { useHasPermission } from "../../hooks/useHasPermission";
import MediaLibraryUploadModal, {
  type MediaLibraryUploadKind,
} from "../../components/modal/media/MediaLibraryUploadModal";
import MediaUsageModal from "../../components/modal/media/MediaUsageModal";
import MediaLibraryItemPreview from "../../components/shared/MediaLibraryItemPreview";
import MediaSearchAndDelete from "../../components/shared/MediaSearchAndDelete";
import { config } from "../../config";
import { useAppSelector, useDebounced } from "../../redux/features/hooks";
import {
  useMediaLibraryListQuery,
  useMoveMediaLibraryMutation,
  useRenameMediaLibraryMutation,
} from "../../redux/features/media-library/media-libraryApi";
import {
  useCreateFolderMutation,
  useDeleteFolderMutation,
  useGetFoldersQuery,
  useUpdateFolderMutation,
} from "../../redux/features/folder/folderApi";

import { useSearchParams } from "react-router-dom";

function fullMediaAccessUrl(path: string) {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("//")) return path;
  const base = String(config.image_access_url).replace(/\/$/, "");
  return `${base}/${String(path).replace(/^\//, "")}`;
}

const AllMediaLibraryList = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounced({ searchQuery: searchTerm, delay: 500 });
  const isCollapsed = useAppSelector((state) => state.sidebar.isCollapsed);
  
  const [usageModal, setUsageModal] = useState({ open: false, id: "" });

  // ── Folder navigation (URL based) ──────────────────────────────────
  const [searchParams, setSearchParams] = useSearchParams();
  const currentFolder = searchParams.get("folder") || null;
  const breadcrumbStr = searchParams.get("b");
  
  const breadcrumb = useMemo<{ id: string; name: string }[]>(() => {
    try {
      return breadcrumbStr ? JSON.parse(decodeURIComponent(breadcrumbStr)) : [];
    } catch {
      return [];
    }
  }, [breadcrumbStr]);
  const [folderModal, setFolderModal] = useState<{
    open: boolean;
    mode: "create" | "rename";
    id?: string;
    name: string;
  }>({ open: false, mode: "create", name: "" });

  const { data: foldersData } = useGetFoldersQuery(currentFolder ?? "root");
  const folders: any[] = foldersData?.data ?? [];

  const [createFolder, { isLoading: savingFolder }] = useCreateFolderMutation();
  const [updateFolder, { isLoading: renamingFolder }] =
    useUpdateFolderMutation();
  const [deleteFolder] = useDeleteFolderMutation();
  const [renameMedia, { isLoading: renamingMedia }] =
    useRenameMediaLibraryMutation();
  const [moveMedia] = useMoveMediaLibraryMutation();

  // Rename-image modal + the media key currently being dragged.
  const [renameModal, setRenameModal] = useState<{
    open: boolean;
    key: string;
    name: string;
  }>({ open: false, key: "", name: "" });
  const dragKeyRef = useRef<string | null>(null);

  const { data, isFetching, refetch } = useMediaLibraryListQuery({
    page,
    limit,
    search: debouncedSearch || undefined,
    folder: currentFolder ?? undefined,
  });

  const [openMediaLibraryUploadModal, setOpenMediaLibraryUploadModal] =
    useState(false);
  const [uploadKind, setUploadKind] =
    useState<MediaLibraryUploadKind>("image");
  const canDeleteMedia = useHasPermission("Media Library", "Delete");

  const handleCopy = (relativeOrFullUrl: string) => {
    const full = fullMediaAccessUrl(relativeOrFullUrl);
    navigator.clipboard.writeText(full);
    message.success("URL copied to clipboard");
  };

  const openUpload = (kind: MediaLibraryUploadKind) => {
    setUploadKind(kind);
    setOpenMediaLibraryUploadModal(true);
  };

  // ── Folder navigation + CRUD ─────────────────────────────────────────
  const openFolder = (folder: any) => {
    const newBreadcrumb = [...breadcrumb, { id: folder._id, name: folder.name }];
    const newParams = new URLSearchParams(searchParams);
    newParams.set("folder", folder._id);
    newParams.set("b", encodeURIComponent(JSON.stringify(newBreadcrumb)));
    setSearchParams(newParams);
    setPage(1);
  };

  // index === -1 → back to root
  const goToCrumb = (index: number) => {
    const newParams = new URLSearchParams(searchParams);
    if (index < 0) {
      newParams.delete("folder");
      newParams.delete("b");
    } else {
      const newBreadcrumb = breadcrumb.slice(0, index + 1);
      newParams.set("folder", breadcrumb[index].id);
      newParams.set("b", encodeURIComponent(JSON.stringify(newBreadcrumb)));
    }
    setSearchParams(newParams);
    setPage(1);
  };

  const submitFolder = async () => {
    const name = folderModal.name.trim();
    if (!name) return;
    try {
      if (folderModal.mode === "create") {
        await createFolder({ name, parent: currentFolder }).unwrap();
        message.success("Folder created");
      } else if (folderModal.id) {
        await updateFolder({ id: folderModal.id, name }).unwrap();
        message.success("Folder renamed");
      }
      setFolderModal({ open: false, mode: "create", name: "" });
    } catch (e: any) {
      message.error(e?.data?.message || "Something went wrong");
    }
  };

  const handleDeleteFolder = async (id: string) => {
    try {
      await deleteFolder(id).unwrap();
      message.success("Folder deleted");
    } catch (e: any) {
      message.error(e?.data?.message || "Failed to delete folder");
    }
  };

  const submitRename = async () => {
    const name = renameModal.name.trim();
    if (!name || !renameModal.key) return;
    try {
      await renameMedia({ oldName: renameModal.key, newName: name }).unwrap();
      message.success("Image renamed");
      setRenameModal({ open: false, key: "", name: "" });
    } catch (e: any) {
      message.error(e?.data?.message || "Failed to rename");
    }
  };

  // Drop a dragged media item into a folder (folderId = null → back to root).
  const handleDropOnFolder = async (folderId: string | null) => {
    const key = dragKeyRef.current;
    dragKeyRef.current = null;
    if (!key) return;
    try {
      await moveMedia({ key, folder: folderId }).unwrap();
      message.success(folderId ? "Moved into folder" : "Moved to root");
    } catch (e: any) {
      message.error(e?.data?.message || "Failed to move");
    }
  };

  const uploadMenuItems: MenuProps["items"] = [
    { key: "image", label: "Image", onClick: () => openUpload("image") },
    { key: "video", label: "Video", onClick: () => openUpload("video") },
    { key: "audio", label: "Audio", onClick: () => openUpload("audio") },
    {
      key: "document",
      label: "Document",
      onClick: () => openUpload("document"),
    },
    { key: "other", label: "Other", onClick: () => openUpload("other") },
  ];

  const images = data?.data?.data || [];
  const meta = data?.data?.meta || {};

  // Media cards carry no selection checkbox, so this screen never holds a
  // selection: `mode: "single"` keeps the shared Select All out of the toolbar
  // and the empty list keeps the bulk path unreachable. Deleting here is one
  // file at a time, from the card's own bin icon.
  const { handleDelete, searchAndDeleteControls } =
    MediaSearchAndDelete({
      images,
      data,
      selectedItems: [],
      mode: "single",
      setSelectedItems: () => {},
      onAddNew: () => openUpload("image"),
      onRefetch: refetch,
      showAddButton: false,
    });

  return (
    <div>
      <PageMeta
        title="Media Library - POS & Inventory Admin Panel"
        description="Manage your media library. Upload, organize, and delete images, video, audio, documents, and other assets."
        keywords="media library, image upload, file management, assets, POS & Inventory"
        canonicalUrl={`${window.location.origin}/media`}
        noindex={true}
      />
      <PageHeader
        title="Media"
        subtitle="Manage your media library"
        breadcrumbs={[{ title: "Dashboard", path: "/" }, { title: "Media" }]}
        extra={
          <Space>
            <PermissionGate module="Media Library" action="Create">
              <Button
                icon={<FolderPlus className="w-4 h-4" />}
                onClick={() =>
                  setFolderModal({ open: true, mode: "create", name: "" })
                }
                className="font-semibold"
              >
                New Folder
              </Button>
            </PermissionGate>
            <PermissionGate module="Media Library" action="Create">
              <Dropdown menu={{ items: uploadMenuItems }} trigger={["click"]}>
                <Button type="primary" className="font-semibold">
                  <IoMdAdd className="text-lg" />
                  <span>Upload</span>
                  <DownOutlined className="text-xs" />
                </Button>
              </Dropdown>
            </PermissionGate>
          </Space>
        }
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <Input
          placeholder="Search media by name..."
          prefix={<Search className="w-4 h-4 text-secondary-400" />}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          className="w-full sm:max-w-xs shrink-0"
        />
        <div className="shrink-0">{searchAndDeleteControls}</div>
      </div>

      {/* Folder breadcrumb */}
      <div className="mb-4 flex items-center gap-1 text-sm flex-wrap">
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
          className={`flex items-center gap-1 px-2 py-1 rounded-[7px] hover:bg-primary-50 ${
            currentFolder === null
              ? "text-primary font-semibold"
              : "text-secondary-600"
          }`}
        >
          <Folder className="w-4 h-4" /> Root
        </button>
        {breadcrumb.map((c, i) => (
          <span key={c.id} className="flex items-center gap-1">
            <ChevronRight className="w-3.5 h-3.5 text-secondary-400" />
            <button
              onClick={() => goToCrumb(i)}
              className={`px-2 py-1 rounded-[7px] hover:bg-primary-50 ${
                i === breadcrumb.length - 1
                  ? "text-primary font-semibold"
                  : "text-secondary-600"
              }`}
            >
              {c.name}
            </button>
          </span>
        ))}
      </div>

      {/* Folders grid (Windows-explorer style) */}
      {folders.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 mb-6">
          {folders.map((f: any) => (
            <div
              key={f._id}
              onDoubleClick={() => openFolder(f)}
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add("ring-2", "ring-primary");
              }}
              onDragLeave={(e) =>
                e.currentTarget.classList.remove("ring-2", "ring-primary")
              }
              onDrop={(e) => {
                e.currentTarget.classList.remove("ring-2", "ring-primary");
                handleDropOnFolder(f._id);
              }}
              className="group relative aspect-square flex flex-col items-center justify-center gap-2 p-3 rounded-xl border border-primary bg-white transition-all duration-300 shadow-[0_8px_24px_-4px_rgba(1,149,50,0.25)] cursor-pointer"
              title={f.name}
            >
              <button
                onClick={() => openFolder(f)}
                className="flex flex-col items-center gap-2 w-full min-w-0"
              >
                <Folder
                  className="w-16 h-16 text-primary"
                  fill="currentColor"
                />
                <span className="text-xs font-semibold text-secondary-800 text-center truncate w-full">
                  {f.name}
                </span>
              </button>
              <div className="absolute top-1 right-1 hidden group-hover:flex items-center gap-1">
                <Tooltip title="Rename">
                  <button
                    onClick={() =>
                      setFolderModal({
                        open: true,
                        mode: "rename",
                        id: f._id,
                        name: f.name,
                      })
                    }
                    className="p-1 rounded bg-white/90 hover:bg-primary-50 text-secondary-500 hover:text-primary shadow-sm"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </Tooltip>
                <Popconfirm
                  title="Delete this folder and everything inside?"
                  onConfirm={() => handleDeleteFolder(f._id)}
                  okText="Yes"
                  cancelText="No"
                >
                  <button className="p-1 rounded bg-white/90 hover:bg-primary-50 text-secondary-500 hover:text-primary-600 shadow-sm">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </Popconfirm>
              </div>
            </div>
          ))}
        </div>
      )}

      {isFetching ? (
        <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 ${isCollapsed ? 'xl:grid-cols-5' : 'xl:grid-cols-4'} gap-4`}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <Skeleton height={170} />
              <div className="mt-2">
                <Skeleton height={20} width={`80%`} />
                <Skeleton height={15} width={`60%`} />
                <Skeleton height={15} width={`70%`} />
                <Skeleton height={15} width={`50%`} />
                <Skeleton height={15} width={`90%`} />
              </div>
            </Card>
          ))}
        </div>
      ) : images.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <Empty description="No media found" />
        </div>
      ) : (
        <>
          <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 ${isCollapsed ? 'xl:grid-cols-5' : 'xl:grid-cols-4'} gap-4`}>
            {images.map((img: any) => (
              <Card
                key={img.path}
                draggable
                onDragStart={() => (dragKeyRef.current = img.path)}
                onDragEnd={() => (dragKeyRef.current = null)}
                styles={{ body: { padding: '12px' } }}
                bodyStyle={{ padding: '12px' }}
                className="overflow-hidden w-full transition-all duration-300 shadow-md shadow-primary/20 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-1 border !border-primary/10 hover:!border-primary-100 cursor-grab active:cursor-grabbing"
                cover={
                  <div className="relative w-full h-[170px] overflow-hidden">
                    <div className="w-full h-full flex items-center justify-center">
                      <MediaLibraryItemPreview
                        item={{
                          name: img.name,
                          url: img.url,
                          type: img.type,
                        }}
                      />
                    </div>
                  </div>
                }
                actions={[
                  <Tooltip title="Copy URL" key="copy">
                    <CopyOutlined
                      onClick={() => handleCopy(img.url)}
                      className="text-primary hover:text-primary-700 cursor-pointer text-lg transition-colors duration-200"
                    />
                  </Tooltip>,
                  <Tooltip title="Usage Info" key="usage">
                    <InfoCircleOutlined
                      onClick={() => setUsageModal({ open: true, id: img.id })}
                      className="text-primary-500 hover:text-primary-700 cursor-pointer text-lg transition-colors duration-200"
                    />
                  </Tooltip>,
                  <Tooltip title="Rename" key="rename">
                    <Pencil
                      onClick={() =>
                        setRenameModal({
                          open: true,
                          key: img.path,
                          name: img.name?.replace(/\.[^/.]+$/, "") || img.name,
                        })
                      }
                      className="w-[18px] h-[18px] mx-auto text-secondary-500 hover:text-primary cursor-pointer transition-colors duration-200"
                    />
                  </Tooltip>,
                  ...(canDeleteMedia
                    ? [
                        <Tooltip title="Delete" key="delete">
                          <Popconfirm
                            title="Delete this file?"
                            onConfirm={() => handleDelete(img.path)}
                            okText="Yes"
                            cancelText="No"
                          >
                            <DeleteOutlined className="text-primary-500 hover:text-primary-700 cursor-pointer text-lg transition-colors duration-200" />
                          </Popconfirm>
                        </Tooltip>,
                      ]
                    : []),
                ]}
              >
                <Card.Meta
                  title={
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-base text-secondary-900 truncate capitalize">
                          {img.name}
                        </p>
                        <span className="text-xs text-secondary-400">
                          Added on {img.date}
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold tracking-wide uppercase bg-primary-50 text-primary px-2 py-1 rounded-full border border-primary-100">
                        {img.type}
                      </span>
                    </div>
                  }
                  description={
                    <div className="mt-3 space-y-2 text-[13px] text-secondary-600">
                      <div className="flex items-center justify-between">
                        <span className="text-secondary-500">File size</span>
                        <span className="font-semibold text-primary">
                          {img.size}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-secondary-500">Dimensions</span>
                        <span className="font-semibold text-secondary-900">
                          {img.dimensions && typeof img.dimensions === "object"
                            ? `${img.dimensions.width}×${img.dimensions.height} ${img.dimensions.unit}`
                            : img.dimensions}
                        </span>
                      </div>
                    </div>
                  }
                />
              </Card>
            ))}
          </div>

          <div className="flex justify-center py-5">
            <Pagination
              current={meta.page || 1}
              pageSize={meta.limit || limit}
              total={meta.total || 0}
              showSizeChanger
              hideOnSinglePage={true}
              pageSizeOptions={["10", "25", "50", "100", "200", "500", "1000"]}
              onChange={(newPage, newLimit) => {
                setPage(newPage);
                setLimit(newLimit);
              }}
              onShowSizeChange={(_current, newLimit) => {
                setPage(1);
                setLimit(newLimit);
              }}
            />
          </div>
        </>
      )}

      {openMediaLibraryUploadModal && (
        <MediaLibraryUploadModal
          key={uploadKind}
          open={openMediaLibraryUploadModal}
          setOpen={setOpenMediaLibraryUploadModal}
          uploadKind={uploadKind}
          folder={currentFolder}
        />
      )}

      {/* Create / rename folder */}
      <Modal
        open={folderModal.open}
        title={folderModal.mode === "create" ? "New Folder" : "Rename Folder"}
        okText={folderModal.mode === "create" ? "Create" : "Save"}
        confirmLoading={savingFolder || renamingFolder}
        onOk={submitFolder}
        onCancel={() =>
          setFolderModal({ open: false, mode: "create", name: "" })
        }
        destroyOnClose
      >
        <Input
          autoFocus
          placeholder="Folder name"
          value={folderModal.name}
          onChange={(e) =>
            setFolderModal((prev) => ({ ...prev, name: e.target.value }))
          }
          onPressEnter={submitFolder}
        />
      </Modal>

      {/* Rename image */}
      <Modal
        open={renameModal.open}
        title="Rename Image"
        okText="Save"
        confirmLoading={renamingMedia}
        onOk={submitRename}
        onCancel={() => setRenameModal({ open: false, key: "", name: "" })}
        destroyOnClose
      >
        <Input
          autoFocus
          placeholder="New image name"
          value={renameModal.name}
          onChange={(e) =>
            setRenameModal((prev) => ({ ...prev, name: e.target.value }))
          }
          onPressEnter={submitRename}
        />
      </Modal>

      {/* Usage Info Modal */}
      <MediaUsageModal
        open={usageModal.open}
        setOpen={(open) => setUsageModal((prev) => ({ ...prev, open }))}
        mediaId={usageModal.id}
      />
    </div>
  );
};

export default AllMediaLibraryList;
