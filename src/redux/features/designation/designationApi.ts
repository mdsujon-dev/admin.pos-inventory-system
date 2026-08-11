import { baseApi } from "../../api/baseApi";

export const designationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Every designation an admin may see.
     *
     * The internal "Super Admin" row is never returned: the seed owns it and
     * nobody assigns it.
     */
    // `void` on the arg so every call site is `useGetDesignationsQuery()` —
    // there is nothing left to narrow the list by.
    getDesignations: builder.query<any, void>({
      query: () => ({
        url: "/designations",
        method: "GET",
      }),
      providesTags: ["designations"],
    }),

    // Get single designation by ID
    getDesignationById: builder.query({
      query: (id: string) => ({
        url: `/designations/${id}`,
        method: "GET",
      }),
      providesTags: ["designations"],
    }),

    // Create designation
    createDesignation: builder.mutation({
      query: (data: {
        name: string;
        description?: string;
        is_active?: boolean;
      }) => ({
        url: "/designations",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["designations"],
    }),

    // Update designation
    updateDesignation: builder.mutation({
      query: ({
        id,
        data,
      }: {
        id: string;
        data: {
          name?: string;
          description?: string;
          is_active?: boolean;
        };
      }) => ({
        url: `/designations/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["designations"],
    }),

    // Delete designation
    deleteDesignation: builder.mutation({
      query: (id: string) => ({
        url: `/designations/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["designations"],
    }),

    // Toggle designation status
    toggleDesignationStatus: builder.mutation({
      query: (id: string) => ({
        url: `/designations/${id}/status`,
        method: "PATCH",
      }),
      invalidatesTags: ["designations"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetDesignationsQuery,
  useGetDesignationByIdQuery,
  useCreateDesignationMutation,
  useUpdateDesignationMutation,
  useDeleteDesignationMutation,
  useToggleDesignationStatusMutation,
} = designationApi;

