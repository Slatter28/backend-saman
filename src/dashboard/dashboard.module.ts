import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Producto } from '../entities/producto.entity';
import { Cliente } from '../entities/cliente.entity';
import { Bodega } from '../entities/bodega.entity';
import { Movimiento } from '../entities/movimiento.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Producto, Cliente, Bodega, Movimiento]),
    AuthModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
