/**
 * Form.Item `normalize` for a native number input.
 *
 * A `type="number"` field hands back a string, but every validator on the
 * server expects a number. An empty field becomes `undefined` rather than
 * `""` or `NaN`, which is what "not provided" means to those validators.
 */
export const toNumber = (value: unknown) => {
  if (value === "" || value === null || value === undefined) return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
};
