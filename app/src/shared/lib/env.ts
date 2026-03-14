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

function readEnvList(key: string, fallback: string[]) {
  const rawValue = readEnv(key, "");
  if (!rawValue) {
    return fallback;
  }

  const values = rawValue
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return values.length > 0 ? values : fallback;
}

export const appEnv = {
  graphqlUrl: readRequiredEnv("VITE_GRAPHQL_URL"),
  appBrandName: readEnv("VITE_APP_BRAND_NAME", "PLN Dashboard"),
  reportRegionName: readEnv("VITE_REPORT_REGION_NAME", "UPT Cibinong"),
  reportGitetName: readEnv("VITE_REPORT_GITET_NAME", "Cibinong"),
  reportWhatsAppPhone: readEnv("VITE_REPORT_WHATSAPP_PHONE", ""),
  reportTimezoneLabel: readEnv("VITE_REPORT_TIMEZONE_LABEL", "WIB"),
  reportMutasiUnits: readEnvList("VITE_REPORT_MUTASI_UNITS", ["GITET 500kV", "GI 150/70kV"]),
  reportBulananRegions: readEnvList("VITE_REPORT_BULANAN_REGIONS", [
    "UPT Cibinong",
    "UPT Depok",
    "UPT Bekasi",
  ]),
  reportPrintUnits: readEnvList("VITE_REPORT_PRINT_UNITS", [
    "Cilegon",
    "Depok 1",
    "Depok 2",
    "Saguling 1",
    "Saguling 2",
    "Tambun 1",
    "Tambun 2",
  ]),
};
