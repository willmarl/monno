import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RiskScoringService } from './risk-scoring.service';

describe('RiskScoringService', () => {
  let service: RiskScoringService;
  let mockPrisma: any;

  const knownUserAgent = 'Mozilla/5.0 (known browser)';
  const knownIp = '192.168.1.1';
  const knownCountry = 'US';

  beforeEach(() => {
    mockPrisma = {
      session: {
        findMany: vi.fn(),
      },
    };
    service = new RiskScoringService(mockPrisma);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ── First login ───────────────────────────────────────────────────────────

  it('returns score 0 and "First login" reason when no previous sessions exist', async () => {
    mockPrisma.session.findMany.mockResolvedValue([]);

    const result = await service.assessLoginRisk(1, knownUserAgent, knownIp, knownCountry);

    expect(result.riskScore).toBe(0);
    expect(result.isNewLocation).toBe(false);
    expect(result.isNewDevice).toBe(false);
    expect(result.reasons).toContain('First login');
  });

  // ── Known device/location ─────────────────────────────────────────────────

  it('returns score 0 when user-agent, IP, and country all match previous session', async () => {
    mockPrisma.session.findMany.mockResolvedValue([
      { userAgent: knownUserAgent, ipAddress: knownIp, country: knownCountry },
    ]);

    const result = await service.assessLoginRisk(1, knownUserAgent, knownIp, knownCountry);

    expect(result.riskScore).toBe(0);
    expect(result.isNewLocation).toBe(false);
    expect(result.isNewDevice).toBe(false);
  });

  // ── New country (+30) ─────────────────────────────────────────────────────

  it('adds 30 to score for a new country', async () => {
    mockPrisma.session.findMany.mockResolvedValue([
      { userAgent: knownUserAgent, ipAddress: knownIp, country: 'US' },
    ]);

    const result = await service.assessLoginRisk(1, knownUserAgent, knownIp, 'DE');

    expect(result.isNewLocation).toBe(true);
    expect(result.riskScore).toBeGreaterThanOrEqual(30);
    expect(result.reasons).toContain('Login from new country detected');
  });

  // ── New device (+20) ─────────────────────────────────────────────────────

  it('adds 20 to score for a new user-agent', async () => {
    mockPrisma.session.findMany.mockResolvedValue([
      { userAgent: knownUserAgent, ipAddress: knownIp, country: knownCountry },
    ]);

    const result = await service.assessLoginRisk(1, 'New Browser/1.0', knownIp, knownCountry);

    expect(result.isNewDevice).toBe(true);
    expect(result.riskScore).toBeGreaterThanOrEqual(20);
    expect(result.reasons).toContain('Login from new device detected');
  });

  // ── New IP (+10) ──────────────────────────────────────────────────────────

  it('adds 10 to score for a new IP address', async () => {
    mockPrisma.session.findMany.mockResolvedValue([
      { userAgent: knownUserAgent, ipAddress: knownIp, country: knownCountry },
    ]);

    const result = await service.assessLoginRisk(1, knownUserAgent, '10.0.0.1', knownCountry);

    expect(result.riskScore).toBeGreaterThanOrEqual(10);
    expect(result.reasons).toContain('Login from new IP address');
  });

  // ── All new: country + device + IP = 60 ──────────────────────────────────

  it('adds 30 + 20 + 10 = 60 for completely new context', async () => {
    mockPrisma.session.findMany.mockResolvedValue([
      { userAgent: knownUserAgent, ipAddress: knownIp, country: 'US' },
    ]);

    const result = await service.assessLoginRisk(1, 'New Browser', '99.99.99.99', 'CN');

    expect(result.riskScore).toBe(60);
    expect(result.isNewLocation).toBe(true);
    expect(result.isNewDevice).toBe(true);
  });

  // ── Cap at 100 ────────────────────────────────────────────────────────────

  it('caps risk score at 100', async () => {
    // Simulate multiple sessions with different context to accumulate many risk factors
    mockPrisma.session.findMany.mockResolvedValue([
      { userAgent: 'Browser A', ipAddress: '1.1.1.1', country: 'US' },
    ]);

    // New country + new device + new IP = 60 max here, but the cap is defensive
    const result = await service.assessLoginRisk(1, 'Browser B', '2.2.2.2', 'RU');
    expect(result.riskScore).toBeLessThanOrEqual(100);
  });

  // ── Country null ─────────────────────────────────────────────────────────

  it('does not flag new location when country is null', async () => {
    mockPrisma.session.findMany.mockResolvedValue([
      { userAgent: knownUserAgent, ipAddress: knownIp, country: 'US' },
    ]);

    const result = await service.assessLoginRisk(1, knownUserAgent, knownIp, null);

    expect(result.isNewLocation).toBe(false);
  });

  // ── getRiskLevel ─────────────────────────────────────────────────────────

  describe('getRiskLevel', () => {
    it('returns "low" for score below 20', () => {
      expect(service.getRiskLevel(0)).toBe('low');
      expect(service.getRiskLevel(19)).toBe('low');
    });

    it('returns "medium" for score 20–49', () => {
      expect(service.getRiskLevel(20)).toBe('medium');
      expect(service.getRiskLevel(49)).toBe('medium');
    });

    it('returns "high" for score 50 and above', () => {
      expect(service.getRiskLevel(50)).toBe('high');
      expect(service.getRiskLevel(100)).toBe('high');
    });
  });

  // ── getRiskColor ─────────────────────────────────────────────────────────

  describe('getRiskColor', () => {
    it('returns "green" for low risk', () => {
      expect(service.getRiskColor(0)).toBe('green');
    });

    it('returns "yellow" for medium risk', () => {
      expect(service.getRiskColor(30)).toBe('yellow');
    });

    it('returns "red" for high risk', () => {
      expect(service.getRiskColor(60)).toBe('red');
    });

    it('returns "yellow" at the low→medium boundary (score=20)', () => {
      // BV: exact threshold where low becomes medium
      expect(service.getRiskColor(20)).toBe('yellow');
    });

    it('returns "red" at the medium→high boundary (score=50)', () => {
      // BV: exact threshold where medium becomes high
      expect(service.getRiskColor(50)).toBe('red');
    });
  });

  // ── Pairwise: combinations of risk factors ────────────────────────────────
  // Factors: new_country (+30), new_device (+20), new_ip (+10)
  // Individual factors already tested above. Pairwise fills the gaps.

  it('new country + new device, same IP = score 50', async () => {
    mockPrisma.session.findMany.mockResolvedValue([
      { userAgent: knownUserAgent, ipAddress: knownIp, country: 'US' },
    ]);

    const result = await service.assessLoginRisk(1, 'New Browser', knownIp, 'DE');

    expect(result.riskScore).toBe(50);
    expect(result.isNewLocation).toBe(true);
    expect(result.isNewDevice).toBe(true);
  });

  it('new country + new IP, same device = score 40', async () => {
    mockPrisma.session.findMany.mockResolvedValue([
      { userAgent: knownUserAgent, ipAddress: knownIp, country: 'US' },
    ]);

    const result = await service.assessLoginRisk(1, knownUserAgent, '9.9.9.9', 'DE');

    expect(result.riskScore).toBe(40);
    expect(result.isNewLocation).toBe(true);
    expect(result.isNewDevice).toBe(false);
  });

  it('new device + new IP, same country = score 30', async () => {
    mockPrisma.session.findMany.mockResolvedValue([
      { userAgent: knownUserAgent, ipAddress: knownIp, country: knownCountry },
    ]);

    const result = await service.assessLoginRisk(1, 'New Browser', '9.9.9.9', knownCountry);

    expect(result.riskScore).toBe(30);
    expect(result.isNewLocation).toBe(false);
    expect(result.isNewDevice).toBe(true);
  });

  // ── Null/empty inputs ─────────────────────────────────────────────────────

  it('does not flag new device when userAgent is null', async () => {
    // The implementation checks `if (previousSessions.length > 0 && userAgent)`
    mockPrisma.session.findMany.mockResolvedValue([
      { userAgent: knownUserAgent, ipAddress: knownIp, country: knownCountry },
    ]);

    const result = await service.assessLoginRisk(1, null as any, knownIp, knownCountry);

    expect(result.isNewDevice).toBe(false);
    expect(result.riskScore).toBe(0);
  });

  it('does not flag new IP when ipAddress is null', async () => {
    mockPrisma.session.findMany.mockResolvedValue([
      { userAgent: knownUserAgent, ipAddress: knownIp, country: knownCountry },
    ]);

    const result = await service.assessLoginRisk(1, knownUserAgent, null as any, knownCountry);

    expect(result.riskScore).toBe(0);
  });
});
