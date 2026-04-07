function readEnv(key: string, fallback: string) {
  const value = import.meta.env[key as keyof ImportMetaEnv];
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function readRequiredEnv(key: string) {
  const value = import.meta.env[key as keyof ImportMetaEnv];
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }
  throw new Error(`Missing required env: ${key}`);
}

export const appEnv = {
  graphqlUrl: readRequiredEnv("VITE_GRAPHQL_URL"),
  appBrandName: readEnv("VITE_APP_BRAND_NAME", "PLN Dashboard"),
  reportWhatsAppPhone: readEnv("VITE_REPORT_WHATSAPP_PHONE", ""),
  reportTimezoneLabel: readEnv("VITE_REPORT_TIMEZONE_LABEL", "WIB"),
};
