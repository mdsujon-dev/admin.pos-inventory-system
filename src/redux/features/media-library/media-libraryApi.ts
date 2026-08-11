import { baseApi } from "../../api/baseApi";

const mediaLibraryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    uploadMediaLibrary: builder.mutation({
      query: (payload) => ({
        url: "/media-library",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["media-library"],
    }),
    mediaLibraryList: builder.query({
      query: (args = {}) => {
        return {
          url: "/media-library",
          method: "GET",
          params: args,
        };
      },
      providesTags: ["media-library"],
    }),
    deleteMediaLibrary: builder.mutation({
      query: (name) => {
        return {
          url: `/media-library/${name}`,
          method: "DELETE",
        };
      },
      invalidatesTags: ["media-library"],
    }),
    // Rename the display name of a media item (oldName = its key/path).
    renameMediaLibrary: builder.mutation({
      query: ({ oldName, newName }: { oldName: string; newName: string }) => ({
        url: "/media-library/rename",
        method: "PATCH",
        body: { oldName, newName },
      }),
      invalidatesTags: ["media-library"],
    }),
    // Move a media item into a folder (folder = null / omit → root).
    moveMediaLibrary: builder.mutation({
      query: ({ key, folder }: { key: string; folder?: string | null }) => ({
        url: "/media-library/move",
        method: "PATCH",
        body: { key, folder },
      }),
      invalidatesTags: ["media-library"],
    }),
    // Get all soft-deleted media (the bin / trash).
    getBinnedMedia: builder.query({
      query: (args = {}) => ({
        url: "/media-library/bin",
        method: "GET",
        params: args,
      }),
      providesTags: ["media-library-bin"],
    }),
    // Restore a soft-deleted media item.
    restoreMediaLibrary: builder.mutation({
      query: (key: string) => ({
        url: `/media-library/restore/${encodeURIComponent(key)}`,
        method: "PATCH",
      }),
      invalidatesTags: ["media-library", "media-library-bin"],
    }),
    // Permanently delete a media item from R2 + DB.
    permanentDeleteMediaLibrary: builder.mutation({
      query: (key: string) => ({
        url: `/media-library/purge/${encodeURIComponent(key)}`,
        method: "DELETE",
      }),
      invalidatesTags: ["media-library-bin"],
    }),
    // Bulk restore multiple soft-deleted items.
    bulkRestoreMediaLibrary: builder.mutation({
      query: (keys: string[]) => ({
        url: "/media-library/bin/bulk-restore",
        method: "PATCH",
        body: { keys },
      }),
      invalidatesTags: ["media-library", "media-library-bin"],
    }),
    // Bulk permanently delete multiple items from R2 + DB.
    bulkPermanentDeleteMediaLibrary: builder.mutation({
      query: (keys: string[]) => ({
        url: "/media-library/bin/bulk-purge",
        method: "DELETE",
        body: { keys },
      }),
      invalidatesTags: ["media-library-bin"],
    }),
    // Get media usage
    getMediaUsage: builder.query({
      query: (id: string) => ({
        url: `/media-library/usage/${id}`,
        method: "GET",
      }),
      providesTags: ["media-library"],
    }),
  }),
});

export const {
  useGetMediaUsageQuery,
  useMediaLibraryListQuery,
  useUploadMediaLibraryMutation,
  useDeleteMediaLibraryMutation,
  useRenameMediaLibraryMutation,
  useMoveMediaLibraryMutation,
  useGetBinnedMediaQuery,
  useRestoreMediaLibraryMutation,
  usePermanentDeleteMediaLibraryMutation,
  useBulkRestoreMediaLibraryMutation,
  useBulkPermanentDeleteMediaLibraryMutation,
} = mediaLibraryApi;
