/** The `[{ name, value }]` shape the list screens pass to their query hooks. */
export type QueryArg = { name: string; value: any };

/**
 * Turns list-screen filter args into request params, dropping anything the user
 * hasn't set. Empty values are omitted rather than sent as `keyword=`, which
 * the API would otherwise treat as a real (and unmatchable) filter.
 */
export const buildQueryParams = (args?: QueryArg[]): URLSearchParams => {
  const params = new URLSearchParams();
  if (!args) return params;

  args.forEach((item) => {
    if (item?.value !== undefined && item?.value !== null && item?.value !== "") {
      params.append(item.name, String(item.value));
    }
  });

  return params;
};
