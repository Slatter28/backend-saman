import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductosService } from './productos.service';
import { ProductosController } from './productos.controller';
import { Producto } from '../entities/producto.entity';
import { UnidadMedida } from '../entities/unidad-medida.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Producto, UnidadMedida])],
  controllers: [ProductosController],
  providers: [ProductosService],
  exports: [ProductosService],
})
export class ProductosModule {}
