import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GeolocationService } from './geolocation.service';

@Module({
  imports: [HttpModule],
  providers: [GeolocationService],
  exports: [GeolocationService],
})
export class GeolocationModule {}
