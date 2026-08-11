import {
  CheckSquareOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  RedoOutlined,
} from "@ant-design/icons";
import {
  Button,
  Checkbox,
  Empty,
  Modal,
  Pagination,
  Popconfirm,
  Spin,
  Tag,
  Tooltip,
  message,
} from "antd";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import PageHeader from "../../../components/Common/PageHeader";
import PageMeta from "../../../components/Common/PageMeta";
import PermissionGate from "../../../components/Common/PermissionGate";
import { config } from "../../../config";
import {
  useBulkPermanentDeleteMediaLibraryMutation,
  useBulkRestoreMediaLibraryMutation,
  useGetBinnedMediaQuery,
  usePermanentDeleteMediaLibraryMutation,
  useRestoreMediaLibraryMutation,
} from "../../../redux/features/media-library/media-libraryApi";

const { confirm } = Modal;

const MediaBin: React.FC = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [restoringKey, setRestoringKey] = useState<string | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  const { data, isFetching, refetch } = useGetBinnedMediaQuery({ page, limit });
  const [restoreMedia] = useRestoreMediaLibraryMutation();
  const [permanentDelete] = usePermanentDeleteMediaLibraryMutation();
  const [bulkRestore, { isLoading: isBulkRestoring }] = useBulkRestoreMediaLibraryMutation();
  const [bulkPurge, { isLoading: isBulkPurging }] = useBulkPermanentDeleteMediaLibraryMutation();

  const items = data?.data?.data || [];
  const meta = data?.data?.meta || {};

  const allKeys = items.map((i: any) => i.path);
  const isAllSelected = allKeys.length > 0 && selectedKeys.length === allKeys.length;
  const isIndeterminate = selectedKeys.length > 0 && selectedKeys.length < allKeys.length;

  const toggleSelectAll = () => {
    setSelectedKeys(isAllSelected ? [] : allKeys);
  };

  const toggleSelect = (key: string) => {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // ── Single actions ──────────────────────────────────────────────────────
  const handleRestore = async (key: string, name: string) => {
    try {
      setRestoringKey(key);
      await restoreMedia(key).unwrap();
      message.success(`"${name}" restored to media library`);
      setSelectedKeys((prev) => prev.filter((k) => k !== key));
    } catch (e: any) {
      message.error(e?.data?.message || "Failed to restore");
    } finally {
      setRestoringKey(null);
    }
  };

  const handlePermanentDelete = (key: string, name: string) => {
    confirm({
      title: "Permanently delete this file?",
      icon: <ExclamationCircleOutlined className="text-red-500" />,
      content: (
        <div>
          <p className="text-gray-600 mb-1">
            <strong>"{name}"</strong> will be permanently removed from storage.
          </p>
          <p className="text-red-500 text-sm font-medium">
            ⚠️ This action cannot be undone.
          </p>
        </div>
      ),
      okText: "Yes, Delete Forever",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          setDeletingKey(key);
          await permanentDelete(key).unwrap();
          message.success(`"${name}" permanently deleted`);
          setSelectedKeys((prev) => prev.filter((k) => k !== key));
        } catch (e: any) {
          message.error(e?.data?.message || "Failed to delete");
        } finally {
          setDeletingKey(null);
        }
      },
    });
  };

  // ── Bulk actions ────────────────────────────────────────────────────────
  const handleBulkRestore = async () => {
    if (selectedKeys.length === 0) return;
    try {
      const res = await bulkRestore(selectedKeys).unwrap();
      message.success(res?.message || `${selectedKeys.length} file(s) restored`);
      setSelectedKeys([]);
    } catch (e: any) {
      message.error(e?.data?.message || "Bulk restore failed");
    }
  };

  const handleBulkPurge = () => {
    if (selectedKeys.length === 0) return;
    confirm({
      title: `Permanently delete ${selectedKeys.length} file(s)?`,
      icon: <ExclamationCircleOutlined className="text-red-500" />,
      content: (
        <p className="text-red-500 font-medium">
          ⚠️ All selected files will be removed from R2 storage. This cannot be undone.
        </p>
      ),
      okText: `Delete ${selectedKeys.length} File(s)`,
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          const res = await bulkPurge(selectedKeys).unwrap();
          message.success(res?.message || `${selectedKeys.length} file(s) permanently deleted`);
          setSelectedKeys([]);
        } catch (e: any) {
          message.error(e?.data?.message || "Bulk purge failed");
        }
      },
    });
  };

  const fullSrc = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http") || url.startsWith("//")) return url;
    return `${String(config.image_access_url).replace(/\/$/, "")}/${String(url).replace(/^\//, "")}`;
  };

  return (
    <div>
      <PageMeta
        title="Media Bin - POS & Inventory Admin Panel"
        description="View and restore soft-deleted media files."
        keywords="media bin, trash, restore, deleted files"
        canonicalUrl={`${window.location.origin}/settings/media-bin`}
        noindex={true}
      />

      <PageHeader
        title="Media Bin"
        subtitle="Restore or permanently delete soft-deleted media files"
        breadcrumbs={[
          { title: "Dashboard", path: "/" },
          { title: "Settings" },
          { title: "Media Bin" },
        ]}
        extra={
          <Button
            icon={<RedoOutlined />}
            onClick={() => refetch()}
            loading={isFetching}
          >
            Refresh
          </Button>
        }
      />

      {/* ── Stats / info banner ─────────────────────────────────────────── */}
      <div className="mb-4 flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-red-50 to-orange-50 border border-red-100">
        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
          <Trash2 className="w-5 h-5 text-red-500" />
        </div>
        <div>
          <p className="font-semibold text-red-700">
            {meta.total ?? 0} file{(meta.total ?? 0) !== 1 ? "s" : ""} in bin
          </p>
          <p className="text-sm text-red-500">
            Restore to bring files back, or permanently delete to free storage.
          </p>
        </div>
      </div>

      {/* ── Bulk action bar (visible when items are selected) ───────────── */}
      {items.length > 0 && (
        <div
          className={`mb-4 flex flex-wrap items-center gap-3 px-4 py-3 rounded-lg border transition-all duration-200 ${
            selectedKeys.length > 0
              ? "bg-primary-50 border-primary-200 shadow-sm"
              : "bg-gray-50 border-gray-200"
          }`}
        >
          {/* Select all checkbox */}
          <Checkbox
            checked={isAllSelected}
            indeterminate={isIndeterminate}
            onChange={toggleSelectAll}
            className="font-medium"
          >
            <span className="text-sm text-gray-700">
              {isAllSelected
                ? "Deselect All"
                : isIndeterminate
                ? `${selectedKeys.length} selected`
                : "Select All"}
            </span>
          </Checkbox>

          {selectedKeys.length > 0 && (
            <>
              <div className="h-4 w-px bg-gray-300" />
              <span className="text-sm font-semibold text-primary">
                <CheckSquareOutlined className="mr-1" />
                {selectedKeys.length} file{selectedKeys.length > 1 ? "s" : ""} selected
              </span>
              {/* Restoring and purging are separate grants on the server
                  (`Media Bin/restore`, `Media Bin/delete`), and `Media Bin/view`
                  is what opens this page — so someone who may look through the
                  bin was being shown two buttons that answer 403. */}
              <div className="ml-auto flex items-center gap-2">
                <PermissionGate module="Media Bin" action="Restore">
                  <Button
                    type="primary"
                    icon={<RedoOutlined />}
                    loading={isBulkRestoring}
                    onClick={handleBulkRestore}
                    className="!bg-green-500 !border-green-500 hover:!bg-green-600 font-semibold"
                  >
                    Restore {selectedKeys.length} Selected
                  </Button>
                </PermissionGate>
                <PermissionGate module="Media Bin" action="Delete">
                  <Popconfirm
                    title={`Permanently delete ${selectedKeys.length} file(s)?`}
                    description="This cannot be undone and will remove files from R2 storage."
                    onConfirm={handleBulkPurge}
                    okText="Delete All"
                    cancelText="Cancel"
                    okButtonProps={{ danger: true }}
                  >
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      loading={isBulkPurging}
                      className="font-semibold"
                    >
                      Purge {selectedKeys.length} Selected
                    </Button>
                  </Popconfirm>
                </PermissionGate>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Content ─────────────────────────────────────────────────────── */}
      {isFetching ? (
        <div className="flex justify-center items-center h-64">
          <Spin size="large" tip="Loading bin..." />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
            <Trash2 className="w-8 h-8 text-green-400" />
          </div>
          <Empty
            description={
              <div className="text-center">
                <p className="font-semibold text-gray-700">Media Bin is Empty</p>
                <p className="text-sm text-gray-500">
                  No deleted files found. Deleted media will appear here.
                </p>
              </div>
            }
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3">
            {items.map((item: any) => {
              const isImage =
                item.mediaType === "image" ||
                /\.(png|jpe?g|gif|webp|svg|avif|bmp)$/i.test(item.name || "");
              const isVideo =
                item.mediaType === "video" ||
                /\.(mp4|webm|mov|mkv|avi|ogv|m4v)$/i.test(item.name || "");
              const isChecked = selectedKeys.includes(item.path);

              return (
                <div
                  key={item.path}
                  className={`group relative bg-white rounded-xl border overflow-hidden transition-all duration-200 ${
                    isChecked
                      ? "border-primary ring-2 ring-primary shadow-md"
                      : "border-red-100 hover:border-red-200 hover:shadow-md"
                  }`}
                >
                  {/* ── Checkbox top-left ─────────────────────────────── */}
                  <div className="absolute top-1.5 left-1.5 z-30">
                    <Checkbox
                      checked={isChecked}
                      onChange={() => toggleSelect(item.path)}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-white/90 rounded shadow-sm"
                    />
                  </div>

                  {/* ── Deleted tag top-right ─────────────────────────── */}
                  <div className="absolute top-1.5 right-1.5 z-20">
                    <Tag
                      color="red"
                      className="text-[10px] font-semibold px-1.5 py-0 m-0 leading-tight"
                    >
                      Deleted
                    </Tag>
                  </div>

                  {/* ── Media preview ─────────────────────────────────── */}
                  <div
                    className="h-[170px] flex items-center justify-center bg-red-50/20 overflow-hidden relative cursor-pointer"
                    onClick={() => toggleSelect(item.path)}
                  >
                    {isImage ? (
                      <img
                        src={fullSrc(item.url)}
                        alt={item.name}
                        className="max-w-full max-h-full object-contain opacity-60 grayscale"
                      />
                    ) : isVideo ? (
                      <video
                        src={fullSrc(item.url)}
                        className="max-w-full max-h-full object-contain opacity-60"
                        muted
                        playsInline
                        preload="metadata"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-gray-400">
                        <DeleteOutlined className="text-3xl" />
                        <span className="text-xs uppercase font-semibold">
                          {item.extension?.replace(".", "") || "file"}
                        </span>
                      </div>
                    )}

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                      <PermissionGate module="Media Bin" action="Restore">
                        <Tooltip title="Restore to library">
                          <Button
                            type="primary"
                            size="small"
                            icon={<RedoOutlined />}
                            loading={restoringKey === item.path}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRestore(item.path, item.name);
                            }}
                            className="!bg-green-500 !border-green-500 hover:!bg-green-600 shadow-lg"
                          >
                            Restore
                          </Button>
                        </Tooltip>
                      </PermissionGate>
                      <PermissionGate module="Media Bin" action="Delete">
                        <Tooltip title="Delete forever">
                          <Button
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            loading={deletingKey === item.path}
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePermanentDelete(item.path, item.name);
                            }}
                            className="shadow-lg"
                          >
                            Purge
                          </Button>
                        </Tooltip>
                      </PermissionGate>
                    </div>
                  </div>

                  {/* ── Info ──────────────────────────────────────────── */}
                  <div className="p-2 border-t border-red-50">
                    <p
                      className="text-xs font-semibold truncate text-gray-700 mb-0.5"
                      title={item.name}
                    >
                      {item.name}
                    </p>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] text-gray-400">{item.size}</span>
                      {item.dimensions && (
                        <span className="text-[10px] text-gray-400">
                          {item.dimensions.width}×{item.dimensions.height}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-red-400 mt-0.5 truncate">
                      {item.date}
                    </p>
                  </div>

                  {/* ── Bottom quick actions ───────────────────────────── */}
                  <div className="flex border-t border-red-50">
                    <Tooltip title="Restore">
                      <button
                        disabled={restoringKey === item.path}
                        onClick={() => handleRestore(item.path, item.name)}
                        className="flex-1 py-1.5 flex items-center justify-center gap-1 text-green-600 hover:bg-green-50 transition-colors text-xs font-semibold disabled:opacity-50"
                      >
                        {restoringKey === item.path ? (
                          <Spin size="small" />
                        ) : (
                          <RedoOutlined />
                        )}
                        Restore
                      </button>
                    </Tooltip>
                    <div className="w-px bg-red-50" />
                    <Popconfirm
                      title="Permanently delete?"
                      description="This cannot be undone."
                      onConfirm={() => handlePermanentDelete(item.path, item.name)}
                      okText="Delete"
                      cancelText="Cancel"
                      okButtonProps={{ danger: true }}
                    >
                      <button
                        disabled={deletingKey === item.path}
                        className="flex-1 py-1.5 flex items-center justify-center gap-1 text-red-500 hover:bg-red-50 transition-colors text-xs font-semibold disabled:opacity-50"
                      >
                        {deletingKey === item.path ? (
                          <Spin size="small" />
                        ) : (
                          <DeleteOutlined />
                        )}
                        Purge
                      </button>
                    </Popconfirm>
                  </div>
                </div>
              );
            })}
          </div>

          {(meta.total || 0) > (meta.limit || limit) && (
            <div className="flex justify-center py-6">
              <Pagination
                current={meta.page || 1}
                pageSize={meta.limit || limit}
                total={meta.total || 0}
                showSizeChanger
                pageSizeOptions={["25", "50", "100"]}
                onChange={(newPage, newLimit) => {
                  setPage(newPage);
                  setLimit(newLimit);
                  setSelectedKeys([]);
                }}
                onShowSizeChange={(_current, newLimit) => {
                  setPage(1);
                  setLimit(newLimit);
                  setSelectedKeys([]);
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MediaBin;
