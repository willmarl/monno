import { fetcher } from "@/lib/fetcher";
import { CaptureEventPayload, CaptureEventResponse } from "./types/analytics";

export const captureBackendEvent = (payload: CaptureEventPayload) =>
  fetcher<CaptureEventResponse>("/analytics/track", {
    method: "POST",
    json: payload,
  });
