export interface CaptureEventPayload {
  eventName: string;
  data?: Record<string, any>;
}

export interface CaptureEventResponse {
  success: boolean;
}
