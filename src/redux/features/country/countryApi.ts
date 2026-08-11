import { baseApi } from "../../api/baseApi";

export interface ICountry {
  _id: string;
  name: string;
  code: string;
  flag: string;
  role: string;
  address: string;
  email: string;
  phone: string;
  accentSolid: string;
  serial_no: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const countryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCountries: builder.query({
      query: (args: { name: string; value: any }[] | undefined) => {
        const params = new URLSearchParams();
        if (args) {
          args.forEach((item) => {
            if (item?.value !== undefined && item?.value !== "") {
              params.append(item.name, String(item.value));
            }
          });
        }
        return {
          url: "/countries",
          method: "GET",
          params,
        };
      },
      providesTags: ["countries"],
    }),

    getCountryById: builder.query({
      query: (id: string) => ({
        url: `/countries/${id}`,
        method: "GET",
      }),
      providesTags: ["countries"],
    }),

    createCountry: builder.mutation({
      query: (data: Partial<ICountry>) => ({
        url: "/countries",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["countries"],
    }),

    updateCountry: builder.mutation({
      query: ({ id, data }: { id: string; data: Partial<ICountry> }) => ({
        url: `/countries/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["countries"],
    }),

    toggleCountryStatus: builder.mutation({
      query: (id: string) => ({
        url: `/countries/${id}/status`,
        method: "PATCH",
      }),
      invalidatesTags: ["countries"],
    }),

    updateCountrySerial: builder.mutation({
      query: ({ id, serial_no }: { id: string; serial_no: number }) => ({
        url: `/countries/${id}/serial`,
        method: "PATCH",
        body: { serial_no },
      }),
      invalidatesTags: ["countries"],
    }),

    deleteCountry: builder.mutation({
      query: (id: string) => ({
        url: `/countries/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["countries"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetCountriesQuery,
  // Fired on demand by the export button, which needs every matching row
  // rather than the page being shown.
  useLazyGetCountriesQuery,
  useGetCountryByIdQuery,
  useCreateCountryMutation,
  useUpdateCountryMutation,
  useToggleCountryStatusMutation,
  useUpdateCountrySerialMutation,
  useDeleteCountryMutation,
} = countryApi;
