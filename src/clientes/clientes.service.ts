import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cliente } from '../entities/cliente.entity';
import { Movimiento } from '../entities/movimiento.entity';
import { CreateClienteDto, UpdateClienteDto, QueryClienteDto } from './dto';

@Injectable()
export class ClientesService {
  constructor(
    @InjectRepository(Cliente)
    private readonly clienteRepository: Repository<Cliente>,
    @InjectRepository(Movimiento)
    private readonly movimientoRepository: Repository<Movimiento>,
  ) {}

  async findAll(queryDto: QueryClienteDto) {
    const { page = 1, limit = 10, nombre, tipo, email } = queryDto;

    const skip = (page - 1) * limit;

    const queryBuilder = this.clienteRepository
      .createQueryBuilder('cliente')
      .skip(skip)
      .take(limit);

    if (nombre) {
      queryBuilder.andWhere('cliente.nombre ILIKE :nombre', {
        nombre: `%${nombre}%`,
      });
    }

    if (tipo) {
      queryBuilder.andWhere('cliente.tipo = :tipo', { tipo });
    }

    if (email) {
      queryBuilder.andWhere('cliente.email ILIKE :email', {
        email: `%${email}%`,
      });
    }

    const [clientes, total] = await queryBuilder.getManyAndCount();

    return {
      data: clientes,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number): Promise<Cliente> {
    const cliente = await this.clienteRepository.findOne({
      where: { id },
      relations: ['movimientos'],
    });

    if (!cliente) {
      throw new NotFoundException(`Cliente con ID ${id} no encontrado`);
    }

    return cliente;
  }

  async create(createClienteDto: CreateClienteDto): Promise<Cliente> {
    const { nombre, telefono, email, direccion, tipo } = createClienteDto;

    // Verificar si el email ya existe (si se proporciona)
    if (email) {
      const existingClient = await this.clienteRepository.findOne({
        where: { email },
      });

      if (existingClient) {
        throw new ConflictException(`Cliente con email '${email}' ya existe`);
      }
    }

    const cliente = this.clienteRepository.create({
      nombre,
      telefono,
      email,
      direccion,
      tipo,
    });

    return this.clienteRepository.save(cliente);
  }

  async update(
    id: number,
    updateClienteDto: UpdateClienteDto,
  ): Promise<Cliente> {
    const cliente = await this.findOne(id);

    const { nombre, telefono, email, direccion, tipo } = updateClienteDto;

    // Verificar si el nuevo email ya existe (si se está cambiando)
    if (email && email !== cliente.email) {
      const existingClient = await this.clienteRepository.findOne({
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

    return this.clienteRepository.save(cliente);
  }

  async remove(id: number): Promise<void> {
    const cliente = await this.findOne(id);

    // Verificar si tiene movimientos asociados
    const movimientosCount = await this.movimientoRepository.count({
      where: { cliente: { id } },
    });

    if (movimientosCount > 0) {
      throw new BadRequestException(
        `No se puede eliminar el cliente porque tiene ${movimientosCount} movimiento(s) asociado(s)`,
      );
    }

    await this.clienteRepository.remove(cliente);
  }

  async getMovimientosCliente(id: number) {
    const cliente = await this.findOne(id);

    const movimientos = await this.movimientoRepository.find({
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
  }
}
