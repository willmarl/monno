import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

export interface GeoLocation {
  country: string;
  countryCode: string;
  city: string;
  latitude: number;
  longitude: number;
  timezone: string;
  isp: string;
}

@Injectable()
export class GeolocationService {
  private readonly logger = new Logger(GeolocationService.name);
  private readonly API_URL = 'http://ip-api.com/json';
  private readonly CACHE_TTL = 7 * 24 * 60 * 60; // 7 days

  constructor(private httpService: HttpService) {}

  /**
   * Get geolocation data for an IP address
   * Uses ip-api.com free tier (45 requests/minute)
   * Results are cached for 7 days
   */
  async getGeolocation(ipAddress: string): Promise<GeoLocation | null> {
    if (!ipAddress || ipAddress === 'unknown') {
      return null;
    }

    try {
      // Query ip-api.com
      const response = await lastValueFrom(
        this.httpService.get<any>(this.API_URL, {
          params: {
            query: ipAddress,
            fields:
              'country,countryCode,city,lat,lon,timezone,isp,status,message',
          },
        }),
      );

      if (response.data.status === 'fail') {
        this.logger.warn(
          `Geolocation lookup failed for ${ipAddress}: ${response.data.message}`,
        );
        return null;
      }

      const geoData: GeoLocation = {
        country: response.data.country || 'Unknown',
        countryCode: response.data.countryCode || 'XX',
        city: response.data.city || 'Unknown',
        latitude: response.data.lat || 0,
        longitude: response.data.lon || 0,
        timezone: response.data.timezone || 'UTC',
        isp: response.data.isp || 'Unknown',
      };

      return geoData;
    } catch (error) {
      this.logger.error(`Error fetching geolocation for ${ipAddress}:`, error);
      return null;
    }
  }

  /**
   * Get a display string for location
   */
  formatLocation(geo: GeoLocation | null): string {
    if (!geo) return 'Unknown Location';
    return `${geo.city}, ${geo.country}`;
  }
}
