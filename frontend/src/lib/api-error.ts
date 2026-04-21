import { AxiosError } from "axios";

type ApiErrorPayload = {
  detail?: string;
  message?: string;
  [key: string]: unknown;
};

export function getApiErrorMessage(error: unknown, fallback = "Something went wrong.") {
  if (!error || typeof error !== "object") return fallback;

  const maybeAxios = error as AxiosError<ApiErrorPayload>;
  const status = maybeAxios.response?.status;
  const data = maybeAxios.response?.data;

  if (status === 0) {
    return "Network error. Check your internet connection and backend availability.";
  }

  if (status === 404) {
    const responseUrl = (maybeAxios.request as { responseURL?: string } | undefined)?.responseURL || "";
    if (responseUrl.includes(".netlify.app/api/")) {
      return "Backend API URL is not configured. Set NEXT_PUBLIC_API_URL in Netlify to your deployed Django API (ending with /api).";
    }
  }

  if (typeof data === "string") return data;
  if (data && typeof data === "object") {
    if (typeof data.detail === "string") return data.detail;
    if (typeof data.message === "string") return data.message;

    const firstField = Object.values(data)[0];
    if (Array.isArray(firstField) && typeof firstField[0] === "string") {
      return firstField[0];
    }
    if (typeof firstField === "string") {
      return firstField;
    }
  }

  if (maybeAxios.message) return maybeAxios.message;
  return fallback;
}

export function isApiConfigurationError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string" &&
    String((error as { message: string }).message).includes("NEXT_PUBLIC_API_URL")
  );
}
