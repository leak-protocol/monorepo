import {
  GetCoinData,
  GetCoinHoldersData,
  GetCoinHoldersResponse,
  GetCoinPriceHistoryData,
  GetCoinPriceHistoryResponse,
  GetCoinResponse,
  GetCoinsData,
  GetCoinsResponse,
  GetCoinSwapsData,
  GetCoinSwapsResponse,
  GetProfileBalancesData,
  GetProfileBalancesResponse,
  GetProfileCoinsData,
  GetProfileCoinsResponse,
  GetProfileData,
  GetProfileResponse,
  GetTraderLeaderboardData,
  GetTraderLeaderboardResponse,
  GetTokenInfoData,
  GetTokenInfoResponse,
  GetContentCoinPoolConfigData,
  GetContentCoinPoolConfigResponse,
  GetWalletTradeActivityData,
  GetWalletTradeActivityResponse,
} from "../client/types.gen";
import {
  getCoin as getCoinSDK,
  getCoins as getCoinsSDK,
  getCoinHolders as getCoinHoldersSDK,
  getCoinPriceHistory as getCoinPriceHistorySDK,
  getCoinSwaps as getCoinSwapsSDK,
  getProfile as getProfileSDK,
  getProfileBalances as getProfileBalancesSDK,
  getProfileCoins as getProfileCoinsSDK,
  getTokenInfo as getTokenInfoSDK,
  getTraderLeaderboard as getTraderLeaderboardSDK,
  getContentCoinPoolConfig as getContentCoinPoolConfigSDK,
  getWalletTradeActivity as getWalletTradeActivitySDK,
} from "../client/sdk.gen";
import { getApiKeyMeta } from "./api-key";
import { RequestOptionsType } from "./query-types";
import { RequestResult } from "@hey-api/client-fetch";

export type { RequestResult };

type GetCoinQuery = GetCoinData["query"];
export type { GetCoinQuery, GetCoinData };
export type { GetCoinResponse } from "../client/types.gen";

export type CoinData = NonNullable<GetCoinResponse["zora20Token"]>;

export const getCoin = async (
  query: GetCoinQuery,
  options?: RequestOptionsType<GetCoinData>,
): Promise<RequestResult<GetCoinResponse>> => {
  return await getCoinSDK({
    ...options,
    query,
    ...getApiKeyMeta(),
  });
};

type GetCoinsQuery = GetCoinsData["query"];
export type { GetCoinsQuery, GetCoinsData };
export type { GetCoinsResponse } from "../client/types.gen";

export const getCoins = async (
  query: GetCoinsQuery,
  options?: RequestOptionsType<GetCoinsData>,
): Promise<RequestResult<GetCoinsResponse>> => {
  return await getCoinsSDK({
    query: {
      coins: query.coins.map((coinData) => JSON.stringify(coinData)) as any,
    },
    ...getApiKeyMeta(),
    ...options,
  });
};

type GetCoinHoldersQuery = GetCoinHoldersData["query"];
export type { GetCoinHoldersQuery, GetCoinHoldersData };
export type { GetCoinHoldersResponse } from "../client/types.gen";

export const getCoinHolders = async (
  query: GetCoinHoldersQuery,
  options?: RequestOptionsType<GetCoinHoldersData>,
): Promise<RequestResult<GetCoinHoldersResponse>> => {
  return await getCoinHoldersSDK({
    query,
    ...getApiKeyMeta(),
    ...options,
  });
};

type GetCoinPriceHistoryQuery = GetCoinPriceHistoryData["query"];
export type { GetCoinPriceHistoryQuery, GetCoinPriceHistoryData };
export type { GetCoinPriceHistoryResponse } from "../client/types.gen";

export const getCoinPriceHistory = async (
  query: GetCoinPriceHistoryQuery,
  options?: RequestOptionsType<GetCoinPriceHistoryData>,
): Promise<RequestResult<GetCoinPriceHistoryResponse>> => {
  return await getCoinPriceHistorySDK({
    query,
    ...getApiKeyMeta(),
    ...options,
  });
};

type GetCoinSwapsQuery = GetCoinSwapsData["query"];
export type { GetCoinSwapsQuery, GetCoinSwapsData };
export type { GetCoinSwapsResponse } from "../client/types.gen";

export const getCoinSwaps = async (
  query: GetCoinSwapsQuery,
  options?: RequestOptionsType<GetCoinSwapsData>,
): Promise<RequestResult<GetCoinSwapsResponse>> => {
  return await getCoinSwapsSDK({
    query,
    ...getApiKeyMeta(),
    ...options,
  });
};

type GetProfileQuery = GetProfileData["query"];
export type { GetProfileQuery, GetProfileData };
export type { GetProfileResponse } from "../client/types.gen";

export const getProfile = async (
  query: GetProfileQuery,
  options?: RequestOptionsType<GetProfileData>,
): Promise<RequestResult<GetProfileResponse>> => {
  return await getProfileSDK({
    query,
    ...getApiKeyMeta(),
    ...options,
  });
};

type GetProfileCoinsQuery = GetProfileCoinsData["query"];
export type { GetProfileCoinsQuery, GetProfileCoinsData };
export type { GetProfileCoinsResponse } from "../client/types.gen";

export const getProfileCoins = async (
  query: GetProfileCoinsQuery,
  options?: RequestOptionsType<GetProfileCoinsData>,
): Promise<RequestResult<GetProfileCoinsResponse>> => {
  return await getProfileCoinsSDK({
    query,
    ...getApiKeyMeta(),
    ...options,
  });
};

type GetProfileBalancesQuery = GetProfileBalancesData["query"];
export type { GetProfileBalancesQuery, GetProfileBalancesData };
export type { GetProfileBalancesResponse } from "../client/types.gen";

export const getProfileBalances = async (
  query: GetProfileBalancesQuery,
  options?: RequestOptionsType<GetProfileBalancesData>,
): Promise<RequestResult<GetProfileBalancesResponse>> => {
  return await getProfileBalancesSDK({
    query,
    ...getApiKeyMeta(),
    ...options,
  });
};

type GetTokenInfoQuery = GetTokenInfoData["query"];
export type { GetTokenInfoQuery, GetTokenInfoData };
export type { GetTokenInfoResponse } from "../client/types.gen";

export const getTokenInfo = async (
  query: GetTokenInfoQuery,
  options?: RequestOptionsType<GetTokenInfoData>,
): Promise<RequestResult<GetTokenInfoResponse>> => {
  return await getTokenInfoSDK({
    query,
    ...getApiKeyMeta(),
    ...options,
  });
};

type GetTraderLeaderboardQuery = GetTraderLeaderboardData["query"];
export type { GetTraderLeaderboardQuery, GetTraderLeaderboardData };
export type { GetTraderLeaderboardResponse } from "../client/types.gen";

export const getTraderLeaderboard = async (
  query: GetTraderLeaderboardQuery = {},
  options?: RequestOptionsType<GetTraderLeaderboardData>,
): Promise<RequestResult<GetTraderLeaderboardResponse>> => {
  return await getTraderLeaderboardSDK({
    query,
    ...getApiKeyMeta(),
    ...options,
  });
};

type GetContentCoinPoolConfigQuery = GetContentCoinPoolConfigData["query"];
export type { GetContentCoinPoolConfigQuery, GetContentCoinPoolConfigData };
export type { GetContentCoinPoolConfigResponse } from "../client/types.gen";

export const getContentCoinPoolConfig = async (
  query: GetContentCoinPoolConfigQuery,
  options?: RequestOptionsType<GetContentCoinPoolConfigData>,
): Promise<RequestResult<GetContentCoinPoolConfigResponse>> => {
  return await getContentCoinPoolConfigSDK({
    query,
    ...getApiKeyMeta(),
    ...options,
  });
};

type GetWalletTradeActivityQuery = GetWalletTradeActivityData["query"];
export type { GetWalletTradeActivityQuery, GetWalletTradeActivityData };
export type { GetWalletTradeActivityResponse } from "../client/types.gen";

export const getWalletTradeActivity = async (
  query: GetWalletTradeActivityQuery,
  options?: RequestOptionsType<GetWalletTradeActivityData>,
): Promise<RequestResult<GetWalletTradeActivityResponse>> => {
  return await getWalletTradeActivitySDK({
    query,
    ...getApiKeyMeta(),
    ...options,
  });
};
