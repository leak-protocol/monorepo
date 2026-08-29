import { curveChoiceById, NATIVE_CURRENCY } from "./presets";

export type CreateFormValues = {
  name: string;
  symbol: string;
  uri: string;
  curveId: string;
};

export type CreateFormErrors = Partial<Record<keyof CreateFormValues, string>>;

export type CreateFormResult = {
  valid: boolean;
  errors: CreateFormErrors;
  /** Only built when every field is valid. */
  poolConfig?: `0x${string}`;
};

/** On-chain symbol: uppercase letters and digits, 1-11 characters, so displays don't break. */
const SYMBOL_RE = /^[A-Z0-9]{1,11}$/;

/**
 * Validates the create-coin form. Pure, no I/O — callable from a test or from render
 * without a chain.
 *
 * An invalid `curveId` becomes a field error rather than letting `curveChoiceById`
 * throw: bad input should not take the screen down.
 */
export function validateCreateForm(values: CreateFormValues): CreateFormResult {
  const errors: CreateFormErrors = {};

  if (!values.name.trim()) {
    errors.name = "Name cannot be empty";
  } else if (values.name.trim().length > 64) {
    errors.name = "Name is at most 64 characters";
  }

  if (!SYMBOL_RE.test(values.symbol)) {
    errors.symbol = "Symbol must be 1-11 UPPERCASE letters or digits";
  }

  const uri = values.uri.trim();
  if (!uri) {
    errors.uri = "A metadata URI is required";
  } else if (!uri.startsWith("ipfs://") && !uri.startsWith("https://")) {
    errors.uri = "URI must start with ipfs:// or https://";
  }

  let poolConfig: `0x${string}` | undefined;
  try {
    const choice = curveChoiceById(values.curveId);
    if (Object.keys(errors).length === 0) {
      poolConfig = choice.encodeConfig(NATIVE_CURRENCY);
    }
  } catch {
    errors.curveId = "No valid curve selected";
  }

  const valid = Object.keys(errors).length === 0;
  return { valid, errors, poolConfig: valid ? poolConfig : undefined };
}
