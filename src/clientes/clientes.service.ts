import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Scope,
  Inject,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Request } from 'express';
import { Cliente } from '../entities/cliente.entity';
import { Movimiento } from '../entities/movimiento.entity';
import { CreateClienteDto, UpdateClienteDto, QueryClienteDto } from './dto';

@Injectable({ scope: Scope.REQUEST })
export class ClientesService {
  private tenantId: string;

  constructor(
    @Inject(REQUEST) private request: Request,
    @InjectDataSource() private dataSource: DataSource,
  ) {
    // Prioridad: usuario autenticado > middleware > por defecto
    const userTenant = (request as any).user?.bodegaId;
    const middlewareTenant = request.tenantId;

    console.log(`🔍 ClientesService constructor DEBUG:`);
    console.log(`   - userTenant (user.bodegaId): "${userTenant}"`);
    console.log(`   - middlewareTenant: "${middlewareTenant}"`);
    console.log(`   - user completo:`, (request as any).user);

    this.tenantId = userTenant || middlewareTenant || 'principal';
    console.log(`👥 ClientesService inicializado para tenant: "${this.tenantId}"`);

    if ((request as any).user) {
      console.log(`👤 Usuario autenticado detectado: ${(request as any).user.correo} - Tenant: ${this.tenantId}`);
    } else if (middlewareTenant) {
      console.log(`🔧 Tenant desde middleware: ${this.tenantId}`);
    } else {
      console.log(`👤 Sin usuario autenticado, usando tenant por defecto: ${this.tenantId}`);
    }
  }

  getCurrentTenant(): string {
    return this.tenantId;
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

    console.log(`🔍 ClientesService DEBUG:`);
    console.log(`   - this.tenantId: "${this.tenantId}"`);
    console.log(`   - schemaName calculado: "${schemaName}"`);

    try {
      await queryRunner.connect();
      await queryRunner.query(`SET search_path TO ${schemaName}, public`);
      console.log(`🗄️ Ejecutando operación en esquema: ${schemaName}`);

      // Verificar el search_path actual
      const searchPathResult = await queryRunner.query('SHOW search_path');
      console.log(`📍 Search path actual: ${JSON.stringify(searchPathResult)}`);

      // Verificar si la tabla clientes existe en el esquema del tenant
      const tableExistsQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = $1 AND table_name = 'clientes'
        );
      `;
      const tableExists = await queryRunner.query(tableExistsQuery, [schemaName]);
      console.log(`🔍 ¿Tabla 'clientes' existe en esquema '${schemaName}'?: ${JSON.stringify(tableExists)}`);

      // Pasar el EntityManager al callback
      const result = await operation(queryRunner.manager);
      return result;
    } finally {
      // 🔥 IMPORTANTE: Siempre liberar el QueryRunner
      await queryRunner.release();
      console.log(`✅ QueryRunner liberado para esquema: ${schemaName}`);
    }
  }

  async findAll(queryDto: QueryClienteDto) {
    return this.executeWithTenant(async (manager) => {
      const { page = 1, limit = 10, nombre, tipo, email } = queryDto;

      const skip = (page - 1) * limit;

      const queryBuilder = manager
        .getRepository(Cliente)
        .createQueryBuilder('cliente')
        .skip(skip)
        .take(limit);

      if (nombre) {
        queryBuilder.andWhere('cliente.nombre ILIKE :nombre', {
          nombre: `%${nombre}%`,
        });
      }

      // if (tipo) {
      //   queryBuilder.andWhere('cliente.tipo = :tipo', { tipo });
      // }

      if (email) {
        queryBuilder.andWhere('cliente.email ILIKE :email', {
          email: `%${email}%`,
        });
      }

      const [clientes, total] = await queryBuilder.getManyAndCount();


         console.log(` Clientes encontrados en ${this.getCurrentTenant()}: ${total}`);

      return {
        data: clientes,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    });
  }

  async findOne(id: number): Promise<Cliente> {
    return this.executeWithTenant(async (manager) => {
      const cliente = await manager.getRepository(Cliente).findOne({
        where: { id },
        relations: ['movimientos'],
      });

      if (!cliente) {
        throw new NotFoundException(`Cliente con ID ${id} no encontrado`);
      }

      return cliente;
    });
  }

  async create(createClienteDto: CreateClienteDto): Promise<Cliente> {
    return this.executeWithTenant(async (manager) => {
      const { nombre, telefono, email, direccion, tipo } = createClienteDto;

      // Verificar si el email ya existe (si se proporciona)
      if (email) {
        const existingClient = await manager.getRepository(Cliente).findOne({
          where: { email },
        });

        if (existingClient) {
          throw new ConflictException(`Cliente con email '${email}' ya existe`);
        }
      }

      const cliente = manager.getRepository(Cliente).create({
        nombre,
        telefono,
        email,
        direccion,
        tipo,
      });

      return manager.getRepository(Cliente).save(cliente);
    });
  }

  async update(
    id: number,
    updateClienteDto: UpdateClienteDto,
  ): Promise<Cliente> {
    return this.executeWithTenant(async (manager) => {
      const cliente = await this.findOne(id);

      const { nombre, telefono, email, direccion, tipo } = updateClienteDto;

      // Verificar si el nuevo email ya existe (si se está cambiando)
      if (email && email !== cliente.email) {
        const existingClient = await manager.getRepository(Cliente).findOne({
          where: { email },
        });

        if (existingClient) {
          throw new ConflictException(`Cliente con email '${email}' ya existe`);
        }
      }

      if (nombre) cliente.nombre = nombre;
      if (telefono !== undefined) cliente.telefono = telefono;
      if (email !== undefined) cliente.email = email;
      if (direccion !== undefined) cliente.direccion = direccion;
      if (tipo) cliente.tipo = tipo;

      return manager.getRepository(Cliente).save(cliente);
    });
  }

  async remove(id: number): Promise<void> {
    return this.executeWithTenant(async (manager) => {
      const cliente = await this.findOne(id);

      // Verificar si tiene movimientos asociados
      const movimientosCount = await manager.getRepository(Movimiento).count({
        where: { cliente: { id } },
      });

      if (movimientosCount > 0) {
        throw new BadRequestException(
          `No se puede eliminar el cliente porque tiene ${movimientosCount} movimiento(s) asociado(s)`,
        );
      }

      await manager.getRepository(Cliente).remove(cliente);
    });
  }

  async getMovimientosCliente(id: number) {
    return this.executeWithTenant(async (manager) => {
      const cliente = await this.findOne(id);

      const movimientos = await manager.getRepository(Movimiento).find({
        where: { cliente: { id } },
        relations: ['producto', 'bodega', 'usuario'],
        order: { fecha: 'DESC' },
      });

      return {
        cliente: {
          id: cliente.id,
          nombre: cliente.nombre,
          tipo: cliente.tipo,
          email: cliente.email,
          telefono: cliente.telefono,
        },
        movimientos: movimientos.map((mov) => ({
          id: mov.id,
          tipo: mov.tipo,
          cantidad: mov.cantidad,
          precio: mov.precio,
          fecha: mov.fecha,
          observacion: mov.observacion,
          producto: {
            id: mov.producto.id,
            codigo: mov.producto.codigo,
            descripcion: mov.producto.descripcion,
          },
          bodega: {
            id: mov.bodega.id,
            nombre: mov.bodega.nombre,
          },
          usuario: {
            id: mov.usuario.id,
            nombre: mov.usuario.nombre,
          },
        })),
        totalMovimientos: movimientos.length,
      };
    });
  }
}
