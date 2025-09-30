import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BodegasService } from './bodegas.service';
import { BodegasController } from './bodegas.controller';
import { Bodega } from '../entities/bodega.entity';
import { Movimiento } from '../entities/movimiento.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Bodega, Movimiento]),
    AuthModule,
  ],
  controllers: [BodegasController],
  providers: [BodegasService],
  exports: [BodegasService],
})
export class BodegasModule {}
