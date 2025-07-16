import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from './entities/usuario.entity';
import { Producto } from './entities/producto.entity';
import { Bodega } from './entities/bodega.entity';
import { UnidadMedida } from './entities/unidad-medida.entity';
import { Movimiento } from './entities/movimiento.entity';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'dpg-d1rg0t7diees73bt6jk0-a.oregon-postgres.render.com',          // Cambia por el host de tu DB postgresql://dbsaman_user:sr33ikCa3ACMwyP59ATCKw6LboXNvqGW@dpg-d1rg0t7diees73bt6jk0-a.oregon-postgres.render.com/dbsaman
      port: 5432,
      username: 'dbsaman_user',
      password: 'sr33ikCa3ACMwyP59ATCKw6LboXNvqGW',
      database: 'dbsaman',
      ssl: {
        rejectUnauthorized: false, // Para evitar problemas con certificados SSL en producción
      },
      entities: [
        Usuario,
        Producto,
        Bodega,
        UnidadMedida,
        Movimiento,
      ],
      synchronize: true, // ⚠️ solo para desarrollo
      logging: true
    }),
    TypeOrmModule.forFeature([
      Usuario,
      Producto,
      Bodega,
      UnidadMedida,
      Movimiento,
    ]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
