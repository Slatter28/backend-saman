import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Inject,
  Scope,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Bodega } from '../entities/bodega.entity';
import { Movimiento } from '../entities/movimiento.entity';
import { CreateBodegaDto, UpdateBodegaDto, QueryBodegaDto } from './dto';

@Injectable({ scope: Scope.REQUEST })
export class BodegasService {
  private tenantId: string;

  constructor(
    @Inject(REQUEST) private request: Request,
    @InjectDataSource() private dataSource: DataSource,
  ) {
    // Prioridad: usuario autenticado > middleware > por defecto
    const userTenant = (request as any).user?.bodegaId;
    const middlewareTenant = request.tenantId;

    this.tenantId = userTenant || middlewareTenant || 'principal';
    console.log(`🏢 BodegasService inicializado para tenant: ${this.tenantId}`);

    if ((request as any).user) {
      console.log(`👤 Usuario autenticado detectado: ${(request as any).user.correo} - Tenant: ${this.tenantId}`);
    } else if (middlewareTenant) {
      console.log(`🔧 Tenant desde middleware: ${this.tenantId}`);
    } else {
      console.log(`👤 Sin usuario autenticado, usando tenant por defecto: ${this.tenantId}`);
    }
  }

  private getSchemaName(tenantId: string): string {
    const schemaMap: Record<string, string> = {
      'principal': 'inventario_principal',
      'sucursal': 'inventario_sucursal',
    };
    return schemaMap[tenantId] || 'inventario_principal';
  }

  private async executeWithTenant<T>(
    operation: (manager: any) => Promise<T>
  ): Promise<T> {
    const schemaName = this.getSchemaName(this.tenantId);
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.query(`SET search_path TO ${schemaName}, public`);
      console.log(`🗄️ Ejecutando operación en esquema: ${schemaName}`);

      // Pasar el EntityManager al callback
      const result = await operation(queryRunner.manager);
      return result;
    } finally {
      // 🔥 IMPORTANTE: Siempre liberar el QueryRunner
      await queryRunner.release();
      console.log(`✅ QueryRunner liberado para esquema: ${schemaName}`);
    }
  }

  getCurrentTenant(): string {
    return this.tenantId;
  }

  async findAll(queryDto: QueryBodegaDto) {
    const { page = 1, limit = 10, nombre, ubicacion } = queryDto;

    const skip = (page - 1) * limit;

    return this.executeWithTenant(async (manager) => {
      const bodegaRepository = manager.getRepository(Bodega);

      const queryBuilder = bodegaRepository
        .createQueryBuilder('bodega')
        .skip(skip)
        .take(limit);

      if (nombre) {
        queryBuilder.andWhere('bodega.nombre ILIKE :nombre', {
          nombre: `%${nombre}%`,
        });
      }

      if (ubicacion) {
        queryBuilder.andWhere('bodega.ubicacion ILIKE :ubicacion', {
          ubicacion: `%${ubicacion}%`,
        });
      }

      const [bodegas, total] = await queryBuilder.getManyAndCount();

      console.log(`🏪 Bodegas encontradas en ${this.getCurrentTenant()}: ${total}`);

      return {
        data: bodegas,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    });
  }

  async findOne(id: number): Promise<Bodega> {
    return this.executeWithTenant(async (manager) => {
      const bodegaRepository = manager.getRepository(Bodega);

      const bodega = await bodegaRepository.findOne({
        where: { id },
        relations: ['movimientos'],
      });

      if (!bodega) {
        throw new NotFoundException(`Bodega con ID ${id} no encontrada en ${this.getCurrentTenant()}`);
      }

      console.log(`🏪 Bodega encontrada en ${this.getCurrentTenant()}:`, bodega.nombre);
      return bodega;
    });
  }

  async create(createBodegaDto: CreateBodegaDto): Promise<Bodega> {
    const { nombre, ubicacion } = createBodegaDto;

    return this.executeWithTenant(async (manager) => {
      const bodegaRepository = manager.getRepository(Bodega);

      // Verificar si el nombre ya existe EN EL TENANT ACTUAL
      const existingBodega = await bodegaRepository.findOne({
        where: { nombre },
      });

      if (existingBodega) {
        throw new ConflictException(`Bodega con nombre '${nombre}' ya existe en ${this.getCurrentTenant()}`);
      }

      const bodega = bodegaRepository.create({
        nombre,
        ubicacion,
      });

      const savedBodega = await bodegaRepository.save(bodega);

      console.log(`✅ Bodega creada en ${this.getCurrentTenant()}:`, savedBodega.nombre);
      return savedBodega;
    });
  }

  async update(id: number, updateBodegaDto: UpdateBodegaDto): Promise<Bodega> {
    return this.executeWithTenant(async (manager) => {
      const bodegaRepository = manager.getRepository(Bodega);

      // Buscar la bodega existente
      const bodega = await bodegaRepository.findOne({
        where: { id },
        relations: ['movimientos'],
      });

      if (!bodega) {
        throw new NotFoundException(`Bodega con ID ${id} no encontrada en ${this.getCurrentTenant()}`);
      }

      const { nombre, ubicacion } = updateBodegaDto;

      // Verificar si el nuevo nombre ya existe EN EL TENANT ACTUAL (si se está cambiando)
      if (nombre && nombre !== bodega.nombre) {
        const existingBodega = await bodegaRepository.findOne({
          where: { nombre },
        });

        if (existingBodega) {
          throw new ConflictException(`Bodega con nombre '${nombre}' ya existe en ${this.getCurrentTenant()}`);
        }
      }

      if (nombre) bodega.nombre = nombre;
      if (ubicacion !== undefined) bodega.ubicacion = ubicacion;

      const savedBodega = await bodegaRepository.save(bodega);

      console.log(`✅ Bodega actualizada en ${this.getCurrentTenant()}:`, savedBodega.nombre);
      return savedBodega;
    });
  }

  async remove(id: number): Promise<void> {
    return this.executeWithTenant(async (manager) => {
      const bodegaRepository = manager.getRepository(Bodega);
      const movimientoRepository = manager.getRepository(Movimiento);

      const bodega = await bodegaRepository.findOne({
        where: { id },
        relations: ['movimientos'],
      });

      if (!bodega) {
        throw new NotFoundException(`Bodega con ID ${id} no encontrada en ${this.getCurrentTenant()}`);
      }

      // Verificar si tiene movimientos asociados EN EL TENANT ACTUAL
      const movimientosCount = await movimientoRepository.count({
        where: { bodega: { id } },
      });

      if (movimientosCount > 0) {
        throw new BadRequestException(
          `No se puede eliminar la bodega porque tiene ${movimientosCount} movimiento(s) asociado(s) en ${this.getCurrentTenant()}`,
        );
      }

      await bodegaRepository.remove(bodega);

      console.log(`🗑️ Bodega eliminada de ${this.getCurrentTenant()}:`, bodega.nombre);
    });
  }

  async getInventarioBodega(id: number) {
    return this.executeWithTenant(async (manager) => {
      const bodegaRepository = manager.getRepository(Bodega);
      const movimientoRepository = manager.getRepository(Movimiento);

      const bodega = await bodegaRepository.findOne({
        where: { id },
      });

      if (!bodega) {
        throw new NotFoundException(`Bodega con ID ${id} no encontrada en ${this.getCurrentTenant()}`);
      }

      // Obtener el inventario agrupado por producto EN EL TENANT ACTUAL
      const inventario = await movimientoRepository
        .createQueryBuilder('movimiento')
        .select([
          'producto.id as "productoId"',
          'producto.codigo as "productoCodigo"',
          'producto.descripcion as "productoDescripcion"',
          'unidadMedida.nombre as "unidadMedida"',
          'SUM(CASE WHEN movimiento.tipo = \'entrada\' THEN movimiento.cantidad ELSE -movimiento.cantidad END) as "stock"',
        ])
        .leftJoin('movimiento.producto', 'producto')
        .leftJoin('producto.unidadMedida', 'unidadMedida')
        .where('movimiento.bodega.id = :bodegaId', { bodegaId: id })
        .groupBy(
          'producto.id, producto.codigo, producto.descripcion, unidadMedida.nombre',
        )
        .having(
          "SUM(CASE WHEN movimiento.tipo = 'entrada' THEN movimiento.cantidad ELSE -movimiento.cantidad END) > 0",
        )
        .orderBy('producto.codigo', 'ASC')
        .getRawMany();

      console.log(`📊 Inventario calculado para bodega ${bodega.nombre} en ${this.getCurrentTenant()}: ${inventario.length} productos`);

      return {
        bodega: {
          id: bodega.id,
          nombre: bodega.nombre,
          ubicacion: bodega.ubicacion,
        },
        inventario: inventario.map((item) => ({
          producto: {
            id: parseInt(item.productoId),
            codigo: item.productoCodigo,
            descripcion: item.productoDescripcion,
            unidadMedida: item.unidadMedida,
          },
          stock: parseFloat(item.stock),
        })),
        totalProductos: inventario.length,
      };
    });
  }
}
