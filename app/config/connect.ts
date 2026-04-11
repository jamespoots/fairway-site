const DEFAULT_HELPER_BASE_URL = "http://127.0.0.1:30304";

const configuredBaseUrl = process.env.NEXT_PUBLIC_CONNECT_HELPER_BASE_URL?.trim();

const normalizedBaseUrl = configuredBaseUrl
  ? configuredBaseUrl.replace(/\/+$/, "")
  : DEFAULT_HELPER_BASE_URL;

export const CONNECT_HELPER_BASE_URL = normalizedBaseUrl;
