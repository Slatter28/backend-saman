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
import { DataSource, Repository } from 'typeorm';
import { Producto } from '../entities/producto.entity';
import { UnidadMedida } from '../entities/unidad-medida.entity';
import { CreateProductoDto, UpdateProductoDto, QueryProductoDto } from './dto';

@Injectable({ scope: Scope.REQUEST })
export class ProductosService {
  private tenantId: string;

  constructor(
    @Inject(REQUEST) private request: Request,
    @InjectDataSource() private dataSource: DataSource,
  ) {
    // Prioridad: usuario autenticado > middleware > por defecto
    const userTenant = (request as any).user?.bodegaId;
    const middlewareTenant = request.tenantId;

    this.tenantId = userTenant || middlewareTenant || 'principal';
    console.log(`🏢 ProductosService inicializado para tenant: ${this.tenantId}`);

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

  async findAll(queryDto: QueryProductoDto) {
    const {
      page = 1,
      limit = 10,
      codigo,
      descripcion,
      unidadMedidaId,
    } = queryDto;

    const skip = (page - 1) * limit;

    return this.executeWithTenant(async (manager) => {
      const productoRepository = manager.getRepository(Producto);

      const queryBuilder = productoRepository
        .createQueryBuilder('producto')
        .leftJoinAndSelect('producto.unidadMedida', 'unidadMedida')
        .skip(skip)
        .take(limit);

      if (codigo) {
        queryBuilder.andWhere('producto.codigo ILIKE :codigo', {
          codigo: `%${codigo}%`,
        });
      }

      if (descripcion) {
        queryBuilder.andWhere('producto.descripcion ILIKE :descripcion', {
          descripcion: `%${descripcion}%`,
        });
      }

      if (unidadMedidaId) {
        queryBuilder.andWhere('producto.unidadMedida.id = :unidadMedidaId', {
          unidadMedidaId,
        });
      }

      const [productos, total] = await queryBuilder.getManyAndCount();

      console.log(`📦 Productos encontrados en ${this.getCurrentTenant()}: ${total}`);

      return {
        data: productos,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    });
  }

  async findOne(id: number): Promise<Producto> {
    return this.executeWithTenant(async (manager) => {
      const productoRepository = manager.getRepository(Producto);

      const producto = await productoRepository.findOne({
        where: { id },
        relations: ['unidadMedida'],
      });

      if (!producto) {
        throw new NotFoundException(`Producto con ID ${id} no encontrado en ${this.getCurrentTenant()}`);
      }

      console.log(`📦 Producto encontrado en ${this.getCurrentTenant()}:`, producto.codigo);
      return producto;
    });
  }

  async create(createProductoDto: CreateProductoDto): Promise<Producto> {
    const { codigo, descripcion, unidadMedidaId } = createProductoDto;

    return this.executeWithTenant(async (manager) => {
      const productoRepository = manager.getRepository(Producto);
      const unidadMedidaRepository = manager.getRepository(UnidadMedida);

      // Verificar si el código ya existe EN EL TENANT ACTUAL
      const existingProduct = await productoRepository.findOne({
        where: { codigo },
      });

      if (existingProduct) {
        throw new ConflictException(`Producto con código '${codigo}' ya existe en ${this.getCurrentTenant()}`);
      }

      // Verificar que la unidad de medida existe EN EL TENANT ACTUAL
      const unidadMedida = await unidadMedidaRepository.findOne({
        where: { id: unidadMedidaId },
      });

      if (!unidadMedida) {
        throw new BadRequestException(
          `Unidad de medida con ID ${unidadMedidaId} no encontrada en ${this.getCurrentTenant()}`,
        );
      }

      const producto = productoRepository.create({
        codigo,
        descripcion,
        unidadMedida,
      });

      const savedProducto = await productoRepository.save(producto);

      console.log(`✅ Producto creado en ${this.getCurrentTenant()}:`, savedProducto.codigo);

      // Buscar y retornar el producto completo con relaciones
      return productoRepository.findOne({
        where: { id: savedProducto.id },
        relations: ['unidadMedida'],
      });
    });
  }

  async update(
    id: number,
    updateProductoDto: UpdateProductoDto,
  ): Promise<Producto> {
    return this.executeWithTenant(async (manager) => {
      const productoRepository = manager.getRepository(Producto);
      const unidadMedidaRepository = manager.getRepository(UnidadMedida);

      // Buscar el producto existente
      const producto = await productoRepository.findOne({
        where: { id },
        relations: ['unidadMedida'],
      });

      if (!producto) {
        throw new NotFoundException(`Producto con ID ${id} no encontrado en ${this.getCurrentTenant()}`);
      }

      const { codigo, descripcion, unidadMedidaId } = updateProductoDto;

      // Verificar si el nuevo código ya existe EN EL TENANT ACTUAL (si se está cambiando)
      if (codigo && codigo !== producto.codigo) {
        const existingProduct = await productoRepository.findOne({
          where: { codigo },
        });

        if (existingProduct) {
          throw new ConflictException(
            `Producto con código '${codigo}' ya existe en ${this.getCurrentTenant()}`,
          );
        }
      }

      // Verificar que la nueva unidad de medida existe EN EL TENANT ACTUAL (si se está cambiando)
      if (unidadMedidaId && unidadMedidaId !== producto.unidadMedida.id) {
        const unidadMedida = await unidadMedidaRepository.findOne({
          where: { id: unidadMedidaId },
        });

        if (!unidadMedida) {
          throw new BadRequestException(
            `Unidad de medida con ID ${unidadMedidaId} no encontrada en ${this.getCurrentTenant()}`,
          );
        }

        producto.unidadMedida = unidadMedida;
      }

      if (codigo) producto.codigo = codigo;
      if (descripcion) producto.descripcion = descripcion;

      await productoRepository.save(producto);

      console.log(`✅ Producto actualizado en ${this.getCurrentTenant()}:`, producto.codigo);

      // Retornar el producto actualizado con relaciones
      return productoRepository.findOne({
        where: { id },
        relations: ['unidadMedida'],
      });
    });
  }

  async remove(id: number): Promise<void> {
    return this.executeWithTenant(async (manager) => {
      const productoRepository = manager.getRepository(Producto);

      const producto = await productoRepository.findOne({
        where: { id },
        relations: ['unidadMedida'],
      });

      if (!producto) {
        throw new NotFoundException(`Producto con ID ${id} no encontrado en ${this.getCurrentTenant()}`);
      }

      await productoRepository.remove(producto);

      console.log(`🗑️ Producto eliminado de ${this.getCurrentTenant()}:`, producto.codigo);
    });
  }
}