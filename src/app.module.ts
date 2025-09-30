import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm'; // 🆕 Importar DataSource
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
import { TenantModule, TenantMiddleware } from './common/tenant';

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
        rejectUnauthorized: false,
      },
      entities: [Usuario, Producto, Bodega, UnidadMedida, Movimiento, Cliente],
      synchronize: process.env.NODE_ENV === 'development',
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
    TenantModule,
    AuthModule,
    ProductosModule,
    UnidadesMedidaModule,
    BodegasModule,
    ClientesModule,
    MovimientosModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // 🆕 Agregar proveedor DATA_SOURCE
    {
      provide: 'DATA_SOURCE',
      useFactory: (dataSource: DataSource) => dataSource,
      inject: [DataSource],
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .exclude(
        'auth/login',
        'auth/register',
        'auth/create-test-user'
      )
      .forRoutes('*');
  }
}