import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UnidadesMedidaService } from './unidades-medida.service';
import { UnidadesMedidaController } from './unidades-medida.controller';
import { UnidadMedida } from '../entities/unidad-medida.entity';
import { Producto } from '../entities/producto.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UnidadMedida, Producto])],
  controllers: [UnidadesMedidaController],
  providers: [UnidadesMedidaService],
  exports: [UnidadesMedidaService],
})
export class UnidadesMedidaModule {}
