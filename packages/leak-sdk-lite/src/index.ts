export {
  createCoinCall,
  createCoin,
  createCoinSmartWallet,
  validateCreateCoinCalls,
  getCoinCreateFromLogs,
  CreateConstants,
} from "./actions/createCoin";
export type {
  CreateCoinArgs,
  CoinDeploymentLogArgs,
  RawUriMetadata,
} from "./actions/createCoin";

export {
  createQuote,
  createTradeCall,
  tradeCoin,
  tradeCoinSmartWallet,
  validateTradeParameters,
} from "./actions/tradeCoin";
export type { QuoteResult, TradeParameters } from "./actions/tradeCoin";

export {
  updateCoinURI,
  updateCoinURISmartWallet,
  updateCoinURICall,
  validateUpdateCoinURI,
} from "./actions/updateCoinURI";
export type { UpdateCoinURIArgs } from "./actions/updateCoinURI";

export {
  updatePayoutRecipient,
  updatePayoutRecipientSmartWallet,
  updatePayoutRecipientCall,
  validateUpdatePayoutRecipient,
} from "./actions/updatePayoutRecipient";
export type { UpdatePayoutRecipientArgs } from "./actions/updatePayoutRecipient";

export { quoteExactInputSingle } from "./onchain/quote";
export type { QuoteArgs } from "./onchain/quote";
export { encodeV4Swap, CMD_V4_SWAP } from "./onchain/routerEncode";
export type { EncodeSwapArgs } from "./onchain/routerEncode";

export {
  encodeCurve,
  marketCapToTick,
  tickToMarketCap,
  LEAK_MEME,
  LEAK_STABLE,
} from "./curves";
export type { CurvePreset } from "./curves";
export { EXTERNAL_43114, TOKENS_43114 } from "./external-registry";
export type { ExternalEntry } from "./external-registry";
export type { PoolKey } from "./types";

// Normalized call types + user-operation adapter
export {
  toGenericCall,
  toUserOperationCalls,
  isContractCall,
  isSendCall,
} from "./utils/calls";
export type {
  GenericCall,
  UserOperationCall,
  ContractCall,
  SendCall,
} from "./utils/calls";

export {
  prepareUserOperation,
  submitUserOperation,
  CoinbaseGasError,
} from "./utils/userOperation";
export type { PreparedUserOperation } from "./utils/userOperation";

export { rethrowDecodedRevert } from "./utils/rethrowDecodedRevert";
export { validateClientNetwork } from "./utils/validateClientNetwork";

// Metadata Validation Utils
export * from "./metadata";

// Uploader: metadata builder and types only; the hosted provider was removed.
export * from "./uploader";
