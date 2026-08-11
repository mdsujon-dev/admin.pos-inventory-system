import { baseApi } from "../../api/baseApi";

const folderApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Direct sub-folders of a given folder. Pass the folder id, or "root"
    // (or nothing) for top-level folders.
    getFolders: builder.query({
      query: (parent?: string) => ({
        url: "/folders",
        method: "GET",
        params: { parent: parent || "root" },
      }),
      providesTags: ["folders"],
    }),
    getFolderTree: builder.query({
      query: () => ({ url: "/folders/tree", method: "GET" }),
      providesTags: ["folders"],
    }),
    createFolder: builder.mutation({
      query: (body: { name: string; parent?: string | null }) => ({
        url: "/folders/create",
        method: "POST",
        body,
      }),
      invalidatesTags: ["folders"],
    }),
    updateFolder: builder.mutation({
      query: ({ id, ...body }: { id: string; name?: string; parent?: string | null }) => ({
        url: `/folders/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["folders"],
    }),
    deleteFolder: builder.mutation({
      query: (id: string) => ({
        url: `/folders/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["folders", "media-library"],
    }),
  }),
});

export const {
  useGetFoldersQuery,
  useGetFolderTreeQuery,
  useCreateFolderMutation,
  useUpdateFolderMutation,
  useDeleteFolderMutation,
} = folderApi;
