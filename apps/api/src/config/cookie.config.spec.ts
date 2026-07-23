import { describe, expect, it, afterEach } from 'vitest';
import { getCookieSameSite } from './cookie.config';

describe('getCookieSameSite', () => {
  const prev = process.env.COOKIE_SAMESITE;

  afterEach(() => {
    if (prev === undefined) delete process.env.COOKIE_SAMESITE;
    else process.env.COOKIE_SAMESITE = prev;
  });

  it('defaults to lax', () => {
    delete process.env.COOKIE_SAMESITE;
    expect(getCookieSameSite()).toBe('lax');
  });

  it('accepts none / strict / lax', () => {
    process.env.COOKIE_SAMESITE = 'none';
    expect(getCookieSameSite()).toBe('none');
    process.env.COOKIE_SAMESITE = 'STRICT';
    expect(getCookieSameSite()).toBe('strict');
    process.env.COOKIE_SAMESITE = 'lax';
    expect(getCookieSameSite()).toBe('lax');
  });

  it('falls back to lax on garbage', () => {
    process.env.COOKIE_SAMESITE = 'whatever';
    expect(getCookieSameSite()).toBe('lax');
  });
});
