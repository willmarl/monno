import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

export interface RiskAssessment {
  riskScore: number; // 0-100
  isNewLocation: boolean;
  isNewDevice: boolean;
  reasons: string[];
}

@Injectable()
export class RiskScoringService {
  constructor(private prisma: PrismaService) {}

  /**
   * Assess risk for a login attempt
   * Returns risk score and flags for new location/device
   */
  async assessLoginRisk(
    userId: number,
    userAgent: string,
    ipAddress: string,
    country: string | null,
  ): Promise<RiskAssessment> {
    const reasons: string[] = [];
    let riskScore = 0;

    // Get user's previous sessions
    const previousSessions = await this.prisma.session.findMany({
      where: {
        userId,
        isValid: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Check for new location
    let isNewLocation = false;
    if (previousSessions.length > 0 && country) {
      const previousCountries = new Set(
        previousSessions
          .map((s) => s.country)
          .filter((c): c is string => c !== null),
      );

      if (!previousCountries.has(country)) {
        isNewLocation = true;
        riskScore += 30;
        reasons.push('Login from new country detected');
      }
    }

    // Check for new device
    let isNewDevice = false;
    if (previousSessions.length > 0 && userAgent) {
      const previousUserAgents = new Set(
        previousSessions
          .map((s) => s.userAgent)
          .filter((ua): ua is string => ua !== null),
      );

      if (!previousUserAgents.has(userAgent)) {
        isNewDevice = true;
        riskScore += 20;
        reasons.push('Login from new device detected');
      }
    }

    // Check for suspicious IP (different from all previous IPs)
    if (previousSessions.length > 0 && ipAddress) {
      const previousIPs = new Set(
        previousSessions
          .map((s) => s.ipAddress)
          .filter((ip): ip is string => ip !== null),
      );

      if (!previousIPs.has(ipAddress)) {
        riskScore += 10;
        reasons.push('Login from new IP address');
      }
    }

    // First login ever (no previous sessions)
    if (previousSessions.length === 0) {
      riskScore = 0; // New account, not risky
      reasons.push('First login');
    }

    // Cap risk score at 100
    riskScore = Math.min(riskScore, 100);

    return {
      riskScore,
      isNewLocation,
      isNewDevice,
      reasons,
    };
  }

  /**
   * Get risk level label
   */
  getRiskLevel(score: number): 'low' | 'medium' | 'high' {
    if (score < 20) return 'low';
    if (score < 50) return 'medium';
    return 'high';
  }

  /**
   * Get color for risk badge
   */
  getRiskColor(score: number): string {
    const level = this.getRiskLevel(score);
    switch (level) {
      case 'low':
        return 'green';
      case 'medium':
        return 'yellow';
      case 'high':
        return 'red';
    }
  }
}
