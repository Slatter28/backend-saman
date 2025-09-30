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
import { UnidadMedida } from '../entities/unidad-medida.entity';
import { Producto } from '../entities/producto.entity';
import {
  CreateUnidadMedidaDto,
  UpdateUnidadMedidaDto,
  QueryUnidadMedidaDto,
} from './dto';

@Injectable({ scope: Scope.REQUEST })
export class UnidadesMedidaService {
  private tenantId: string;

  constructor(
    @Inject(REQUEST) private request: Request,
    @InjectDataSource() private dataSource: DataSource,
  ) {
    // Prioridad: usuario autenticado > middleware > por defecto
    const userTenant = (request as any).user?.bodegaId;
    const middlewareTenant = request.tenantId;

    this.tenantId = userTenant || middlewareTenant || 'principal';
    console.log(`📏 UnidadesMedidaService inicializado para tenant: ${this.tenantId}`);

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

  async findAll(queryDto: QueryUnidadMedidaDto) {
    const { page = 1, limit = 10, nombre } = queryDto;

    const skip = (page - 1) * limit;

    return this.executeWithTenant(async (manager) => {
      const unidadMedidaRepository = manager.getRepository(UnidadMedida);

      const queryBuilder = unidadMedidaRepository
        .createQueryBuilder('unidadMedida')
        .skip(skip)
        .take(limit);

      if (nombre) {
        queryBuilder.andWhere('unidadMedida.nombre ILIKE :nombre', {
          nombre: `%${nombre}%`,
        });
      }

      const [unidadesMedida, total] = await queryBuilder.getManyAndCount();

      console.log(`📏 Unidades de medida encontradas en ${this.getCurrentTenant()}: ${total}`);

      return {
        data: unidadesMedida,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    });
  }

  async findOne(id: number): Promise<UnidadMedida> {
    return this.executeWithTenant(async (manager) => {
      const unidadMedidaRepository = manager.getRepository(UnidadMedida);

      const unidadMedida = await unidadMedidaRepository.findOne({
        where: { id },
        relations: ['productos'],
      });

      if (!unidadMedida) {
        throw new NotFoundException(
          `Unidad de medida con ID ${id} no encontrada en ${this.getCurrentTenant()}`,
        );
      }

      console.log(`📏 Unidad de medida encontrada en ${this.getCurrentTenant()}:`, unidadMedida.nombre);
      return unidadMedida;
    });
  }

  async create(
    createUnidadMedidaDto: CreateUnidadMedidaDto,
  ): Promise<UnidadMedida> {
    const { nombre, descripcion } = createUnidadMedidaDto;

    return this.executeWithTenant(async (manager) => {
      const unidadMedidaRepository = manager.getRepository(UnidadMedida);

      // Verificar si el nombre ya existe EN EL TENANT ACTUAL
      const existingUnidadMedida = await unidadMedidaRepository.findOne({
        where: { nombre },
      });

      if (existingUnidadMedida) {
        throw new ConflictException(
          `Unidad de medida con nombre '${nombre}' ya existe en ${this.getCurrentTenant()}`,
        );
      }

      const unidadMedida = unidadMedidaRepository.create({
        nombre,
        descripcion,
      });

      const savedUnidadMedida = await unidadMedidaRepository.save(unidadMedida);

      console.log(`✅ Unidad de medida creada en ${this.getCurrentTenant()}:`, savedUnidadMedida.nombre);
      return savedUnidadMedida;
    });
  }

  async update(
    id: number,
    updateUnidadMedidaDto: UpdateUnidadMedidaDto,
  ): Promise<UnidadMedida> {
    return this.executeWithTenant(async (manager) => {
      const unidadMedidaRepository = manager.getRepository(UnidadMedida);

      // Buscar la unidad de medida existente
      const unidadMedida = await unidadMedidaRepository.findOne({
        where: { id },
        relations: ['productos'],
      });

      if (!unidadMedida) {
        throw new NotFoundException(
          `Unidad de medida con ID ${id} no encontrada en ${this.getCurrentTenant()}`,
        );
      }

      const { nombre, descripcion } = updateUnidadMedidaDto;

      // Verificar si el nuevo nombre ya existe EN EL TENANT ACTUAL (si se está cambiando)
      if (nombre && nombre !== unidadMedida.nombre) {
        const existingUnidadMedida = await unidadMedidaRepository.findOne({
          where: { nombre },
        });

        if (existingUnidadMedida) {
          throw new ConflictException(
            `Unidad de medida con nombre '${nombre}' ya existe en ${this.getCurrentTenant()}`,
          );
        }
      }

      if (nombre) unidadMedida.nombre = nombre;
      if (descripcion !== undefined) unidadMedida.descripcion = descripcion;

      const savedUnidadMedida = await unidadMedidaRepository.save(unidadMedida);

      console.log(`✅ Unidad de medida actualizada en ${this.getCurrentTenant()}:`, savedUnidadMedida.nombre);
      return savedUnidadMedida;
    });
  }

  async remove(id: number): Promise<void> {
    return this.executeWithTenant(async (manager) => {
      const unidadMedidaRepository = manager.getRepository(UnidadMedida);
      const productoRepository = manager.getRepository(Producto);

      const unidadMedida = await unidadMedidaRepository.findOne({
        where: { id },
        relations: ['productos'],
      });

      if (!unidadMedida) {
        throw new NotFoundException(
          `Unidad de medida con ID ${id} no encontrada en ${this.getCurrentTenant()}`,
        );
      }

      // Verificar si tiene productos asociados EN EL TENANT ACTUAL
      const productosCount = await productoRepository.count({
        where: { unidadMedida: { id } },
      });

      if (productosCount > 0) {
        throw new BadRequestException(
          `No se puede eliminar la unidad de medida porque tiene ${productosCount} producto(s) asociado(s) en ${this.getCurrentTenant()}`,
        );
      }

      await unidadMedidaRepository.remove(unidadMedida);

      console.log(`🗑️ Unidad de medida eliminada de ${this.getCurrentTenant()}:`, unidadMedida.nombre);
    });
  }
}
