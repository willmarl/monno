/**
 * Dev/debug HTTP routes (`/rate`, `/error`, …). Opt-in only —
 * never registered unless ENABLE_TEST_ENDPOINTS=true.
 */
export function areTestEndpointsEnabled(): boolean {
  return process.env.ENABLE_TEST_ENDPOINTS === 'true';
}
