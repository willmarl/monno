import { describe, expect, it } from 'vitest';
import { clientIp } from './request-ip';

describe('clientIp', () => {
  it('prefers Express req.ip (trust-proxy–aware)', () => {
    expect(clientIp({ ip: '1.2.3.4' })).toBe('1.2.3.4');
  });

  it('falls back to socket remoteAddress', () => {
    expect(clientIp({ socket: { remoteAddress: '::1' } })).toBe('::1');
  });

  it('trims whitespace', () => {
    expect(clientIp({ ip: '  8.8.8.8  ' })).toBe('8.8.8.8');
  });

  it('returns unknown when missing', () => {
    expect(clientIp({})).toBe('unknown');
  });
});
