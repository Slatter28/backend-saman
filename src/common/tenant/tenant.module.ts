import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TenantService } from './tenant.service';
import { TenantMiddleware } from './tenant.middleware';

@Module({
  imports: [ConfigModule],
  providers: [TenantService, TenantMiddleware],
  exports: [TenantService, TenantMiddleware],
})
export class TenantModule {}