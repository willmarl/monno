import { api } from "./kyClient";
import type { Options } from "ky";

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiError {
  success: false;
  message: string;
  error: string;
  statusCode: number;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export async function fetcher<T>(url: string, options?: Options): Promise<T> {
  // Remove leading slash if present (ky's prefixUrl handles the base URL)
  const cleanUrl = url.startsWith("/") ? url.slice(1) : url;

  try {
    const response = await api(cleanUrl, options);

    // Check if response is ok, if not it's an HTTP error
    if (!response.ok) {
      const status = response.status;
      let message = `HTTP ${status}`;
      let errorCode = "HTTP_ERROR";

      // Try to parse error response body
      try {
        const errorData = (await response.json()) as any;
        message = errorData?.message || message;
        errorCode = errorData?.error || errorCode;
      } catch {
        // If JSON parsing fails, keep defaults
      }

      const err = new Error(message) as any;
      err.statusCode = status;
      err.error = errorCode;
      throw err;
    }

    const json = await response.json<ApiResponse<T>>();

    if (!json.success) {
      const err = new Error(json.message) as any;
      err.statusCode = json.statusCode;
      err.error = json.error;
      throw err;
    }

    return json.data;
  } catch (error: any) {
    // If it's already our custom error with statusCode, just re-throw
    if (error?.statusCode !== undefined) {
      throw error;
    }

    // If it's an HTTPError from ky with a response, create a proper error object
    if (error?.response?.status) {
      const status = error.response.status;
      let message = error.message || `HTTP ${status}`;
      let errorCode = "HTTP_ERROR";

      // Try to parse error response body
      try {
        // Note: response body might have already been consumed, so this may fail
        const errorData = (await error.response.clone().json()) as any;
        message = errorData?.message || message;
        errorCode = errorData?.error || errorCode;
      } catch {
        // Could not parse error response body
      }

      const err = new Error(message) as any;
      err.statusCode = status;
      err.error = errorCode;
      throw err;
    }

    // Handle any other unexpected errors
    throw new Error(error?.message || "An unknown error occurred");
  }
}
