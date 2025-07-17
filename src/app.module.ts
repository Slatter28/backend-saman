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
      entities: [Usuario, Producto, Bodega, UnidadMedida, Movimiento],
      synchronize: process.env.NODE_ENV === 'development', // ⚠️ solo para desarrollo
      logging: process.env.NODE_ENV === 'development',
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
