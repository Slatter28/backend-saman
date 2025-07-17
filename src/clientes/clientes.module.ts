import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientesService } from './clientes.service';
import { ClientesController } from './clientes.controller';
import { Cliente } from '../entities/cliente.entity';
import { Movimiento } from '../entities/movimiento.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Cliente, Movimiento])],
  controllers: [ClientesController],
  providers: [ClientesService],
  exports: [ClientesService],
})
export class ClientesModule {}
