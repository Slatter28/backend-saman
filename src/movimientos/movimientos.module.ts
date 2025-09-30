import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MovimientosService } from './movimientos.service';
import { MovimientosController } from './movimientos.controller';
import { Movimiento } from '../entities/movimiento.entity';
import { Producto } from '../entities/producto.entity';
import { Bodega } from '../entities/bodega.entity';
import { Cliente } from '../entities/cliente.entity';
import { Usuario } from '../entities/usuario.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Movimiento, Producto, Bodega, Cliente, Usuario]),
    AuthModule,
  ],
  controllers: [MovimientosController],
  providers: [MovimientosService],
  exports: [MovimientosService],
})
export class MovimientosModule {}
