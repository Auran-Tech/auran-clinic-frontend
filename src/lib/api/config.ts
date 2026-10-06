const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

if (import.meta.env.PROD && !configuredApiBaseUrl) {
  throw new Error("VITE_API_BASE_URL is required for production builds.");
}

export const apiBaseUrl =
  configuredApiBaseUrl || "http://localhost:5000/api";

export function currentLocale(): "en" | "ar" {
  return localStorage.getItem("auran.clinic.locale") === "ar" ? "ar" : "en";
}
