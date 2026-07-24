/**
 * Client IP for sessions, geolocation, and throttle keys.
 *
 * Uses Express `req.ip`, which only trusts `X-Forwarded-For` when
 * `trust proxy` is configured (see `main.ts` / `TRUST_PROXY`).
 * Never read `X-Forwarded-For` (or similar) directly — clients can spoof it.
 */
export function clientIp(req: {
  ip?: string;
  socket?: { remoteAddress?: string };
}): string {
  const raw = req.ip || req.socket?.remoteAddress;
  if (!raw) return 'unknown';
  return raw.trim();
}
