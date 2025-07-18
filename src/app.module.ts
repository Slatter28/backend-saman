import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from './entities/usuario.entity';
import { Producto } from './entities/producto.entity';
import { Bodega } from './entities/bodega.entity';
import { UnidadMedida } from './entities/unidad-medida.entity';
import { Movimiento } from './entities/movimiento.entity';
import { Cliente } from './entities/cliente.entity';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ProductosModule } from './productos/productos.module';
import { UnidadesMedidaModule } from './unidades-medida/unidades-medida.module';
import { BodegasModule } from './bodegas/bodegas.module';
import { ClientesModule } from './clientes/clientes.module';
import { MovimientosModule } from './movimientos/movimientos.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: {
        rejectUnauthorized: false, // Para evitar problemas con certificados SSL en producción
      },
      entities: [Usuario, Producto, Bodega, UnidadMedida, Movimiento, Cliente],
      synchronize: process.env.NODE_ENV === 'development', // ⚠️ solo para desarrollo
      logging: process.env.NODE_ENV === 'development',
    }),
    TypeOrmModule.forFeature([
      Usuario,
      Producto,
      Bodega,
      UnidadMedida,
      Movimiento,
      Cliente,
    ]),
    AuthModule,
    ProductosModule,
    UnidadesMedidaModule,
    BodegasModule,
    ClientesModule,
    MovimientosModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
