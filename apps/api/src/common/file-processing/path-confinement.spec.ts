import { describe, it, expect } from 'vitest';
import * as path from 'path';
import { resolveWithinRoot } from './path-confinement';

describe('resolveWithinRoot', () => {
  const root = '/var/app/uploads';

  it('allows paths inside the root', () => {
    expect(resolveWithinRoot(root, 'avatars', 'a.webp')).toBe(
      path.resolve(root, 'avatars', 'a.webp'),
    );
  });

  it('rejects .. traversal out of the root', () => {
    expect(resolveWithinRoot(root, '..', 'etc', 'passwd')).toBeNull();
  });

  it('rejects prefix-sibling escape (/uploads vs /uploads_evil)', () => {
    // Simulates old startsWith bug: /uploads_evil starts with /uploads
    expect(resolveWithinRoot('/uploads', '..', 'uploads_evil', 'x')).toBeNull();
  });

  it('allows the root itself', () => {
    expect(resolveWithinRoot(root)).toBe(path.resolve(root));
  });
});
