/**
 * Base URL of the ConvertTree API server.
 *
 * Set EXPO_PUBLIC_API_BASE_URL for native builds and for a web client served
 * from a different origin than the API. Empty means same-origin (relative URLs).
 */
export function getApiBaseUrl(): string {
  return (process.env.EXPO_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");
}
