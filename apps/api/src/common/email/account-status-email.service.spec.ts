import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AccountStatusEmailService } from './account-status-email.service';

describe('AccountStatusEmailService', () => {
  const enqueueEmail = vi.fn().mockResolvedValue(undefined);
  const getLogoUrl = vi.fn().mockReturnValue('http://logo');
  let service: AccountStatusEmailService;

  beforeEach(() => {
    enqueueEmail.mockClear();
    service = new AccountStatusEmailService(
      { enqueueEmail } as any,
      { getLogoUrl } as any,
    );
  });

  it('skips when email is missing', async () => {
    await service.sendIfPossible({
      username: 'bob',
      email: null,
      previousStatus: 'ACTIVE',
      newStatus: 'BANNED',
    });
    expect(enqueueEmail).not.toHaveBeenCalled();
  });

  it('skips when status did not change', async () => {
    await service.sendIfPossible({
      username: 'bob',
      email: 'bob@example.com',
      previousStatus: 'ACTIVE',
      newStatus: 'ACTIVE',
    });
    expect(enqueueEmail).not.toHaveBeenCalled();
  });

  it('enqueues email on status change', async () => {
    await service.sendIfPossible({
      username: 'bob',
      email: 'bob@example.com',
      previousStatus: 'ACTIVE',
      newStatus: 'SUSPENDED',
      reason: 'spam',
      expireAt: new Date('2026-08-01T00:00:00.000Z'),
    });

    expect(enqueueEmail).toHaveBeenCalledOnce();
    const [to, subject, html, template] = enqueueEmail.mock.calls[0];
    expect(to).toBe('bob@example.com');
    expect(subject).toMatch(/suspended/i);
    expect(html).toContain('bob');
    expect(html).toContain('SUSPENDED');
    expect(html).toContain('spam');
    expect(template).toBe('account-status-changed');
  });
});
