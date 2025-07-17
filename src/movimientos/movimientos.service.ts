import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Movimiento } from '../entities/movimiento.entity';
import { Producto } from '../entities/producto.entity';
import { Bodega } from '../entities/bodega.entity';
import { Cliente } from '../entities/cliente.entity';
import { Usuario } from '../entities/usuario.entity';
import {
  CreateEntradaDto,
  CreateSalidaDto,
  UpdateMovimientoDto,
  QueryMovimientoDto,
} from './dto';

@Injectable()
export class MovimientosService {
  constructor(
    @InjectRepository(Movimiento)
    private readonly movimientoRepository: Repository<Movimiento>,
    @InjectRepository(Producto)
    private readonly productoRepository: Repository<Producto>,
    @InjectRepository(Bodega)
    private readonly bodegaRepository: Repository<Bodega>,
    @InjectRepository(Cliente)
    private readonly clienteRepository: Repository<Cliente>,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
  ) {}

  async createEntrada(
    createEntradaDto: CreateEntradaDto,
    userId: number,
  ): Promise<Movimiento> {
    const {
      productoId,
      bodegaId,
      clienteId,
      cantidad,
      precio_unitario,
      observacion,
    } = createEntradaDto;

    // Validar que el producto existe
    const producto = await this.productoRepository.findOne({
      where: { id: productoId },
    });
    if (!producto) {
      throw new NotFoundException(
        `Producto con ID ${productoId} no encontrado`,
      );
    }

    // Validar que la bodega existe
    const bodega = await this.bodegaRepository.findOne({
      where: { id: bodegaId },
    });
    if (!bodega) {
      throw new NotFoundException(`Bodega con ID ${bodegaId} no encontrada`);
    }

    // Validar que el usuario existe
    const usuario = await this.usuarioRepository.findOne({
      where: { id: userId },
    });
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
    }

    // Validar cliente si se proporciona
    let cliente = null;
    if (clienteId) {
      cliente = await this.clienteRepository.findOne({
        where: { id: clienteId },
      });
      if (!cliente) {
        throw new NotFoundException(
          `Cliente con ID ${clienteId} no encontrado`,
        );
      }
      // Validar que el cliente puede ser proveedor
      if (cliente.tipo !== 'proveedor' && cliente.tipo !== 'ambos') {
        throw new BadRequestException(
          'El cliente seleccionado no es un proveedor válido',
        );
      }
    }

    // Calcular precio total
    const precio_total = precio_unitario ? cantidad * precio_unitario : null;

    const movimiento = this.movimientoRepository.create({
      tipo: 'entrada',
      cantidad,
      precio_unitario,
      precio_total,
      observacion,
      producto,
      bodega,
      usuario,
      cliente,
    });

    return this.movimientoRepository.save(movimiento);
  }

  async createSalida(
    createSalidaDto: CreateSalidaDto,
    userId: number,
  ): Promise<Movimiento> {
    const {
      productoId,
      bodegaId,
      clienteId,
      cantidad,
      precio_unitario,
      observacion,
    } = createSalidaDto;

    // Validar que el producto existe
    const producto = await this.productoRepository.findOne({
      where: { id: productoId },
    });
    if (!producto) {
      throw new NotFoundException(
        `Producto con ID ${productoId} no encontrado`,
      );
    }

    // Validar que la bodega existe
    const bodega = await this.bodegaRepository.findOne({
      where: { id: bodegaId },
    });
    if (!bodega) {
      throw new NotFoundException(`Bodega con ID ${bodegaId} no encontrada`);
    }

    // Validar que el usuario existe
    const usuario = await this.usuarioRepository.findOne({
      where: { id: userId },
    });
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
    }

    // Validar stock disponible
    const stockDisponible = await this.getStockProductoBodega(
      productoId,
      bodegaId,
    );
    if (stockDisponible < cantidad) {
      throw new BadRequestException(
        `Stock insuficiente. Stock disponible: ${stockDisponible}, solicitado: ${cantidad}`,
      );
    }

    // Validar cliente si se proporciona
    let cliente = null;
    if (clienteId) {
      cliente = await this.clienteRepository.findOne({
        where: { id: clienteId },
      });
      if (!cliente) {
        throw new NotFoundException(
          `Cliente con ID ${clienteId} no encontrado`,
        );
      }
      // Validar que el cliente puede comprar
      if (cliente.tipo !== 'cliente' && cliente.tipo !== 'ambos') {
        throw new BadRequestException(
          'El cliente seleccionado no es un cliente válido',
        );
      }
    }

    // Calcular precio total
    const precio_total = precio_unitario ? cantidad * precio_unitario : null;

    const movimiento = this.movimientoRepository.create({
      tipo: 'salida',
      cantidad,
      precio_unitario,
      precio_total,
      observacion,
      producto,
      bodega,
      usuario,
      cliente,
    });

    return this.movimientoRepository.save(movimiento);
  }

  async findAll(queryDto: QueryMovimientoDto) {
    const {
      page = 1,
      limit = 10,
      tipo,
      productoId,
      productoCodigo,
      bodegaId,
      clienteId,
      fechaDesde,
      fechaHasta,
      usuarioId,
    } = queryDto;

    const skip = (page - 1) * limit;

    const queryBuilder = this.movimientoRepository
      .createQueryBuilder('movimiento')
      .leftJoinAndSelect('movimiento.producto', 'producto')
      .leftJoinAndSelect('producto.unidadMedida', 'unidadMedida')
      .leftJoinAndSelect('movimiento.bodega', 'bodega')
      .leftJoinAndSelect('movimiento.usuario', 'usuario')
      .leftJoinAndSelect('movimiento.cliente', 'cliente')
      .skip(skip)
      .take(limit)
      .orderBy('movimiento.fecha', 'DESC');

    if (tipo) {
      queryBuilder.andWhere('movimiento.tipo = :tipo', { tipo });
    }

    if (productoId) {
      queryBuilder.andWhere('producto.id = :productoId', { productoId });
    }

    if (productoCodigo) {
      queryBuilder.andWhere('producto.codigo ILIKE :productoCodigo', {
        productoCodigo: `%${productoCodigo}%`,
      });
    }

    if (bodegaId) {
      queryBuilder.andWhere('bodega.id = :bodegaId', { bodegaId });
    }

    if (clienteId) {
      queryBuilder.andWhere('cliente.id = :clienteId', { clienteId });
    }

    if (usuarioId) {
      queryBuilder.andWhere('usuario.id = :usuarioId', { usuarioId });
    }

    if (fechaDesde && fechaHasta) {
      queryBuilder.andWhere(
        'movimiento.fecha BETWEEN :fechaDesde AND :fechaHasta',
        {
          fechaDesde: new Date(fechaDesde),
          fechaHasta: new Date(fechaHasta + ' 23:59:59'),
        },
      );
    } else if (fechaDesde) {
      queryBuilder.andWhere('movimiento.fecha >= :fechaDesde', {
        fechaDesde: new Date(fechaDesde),
      });
    } else if (fechaHasta) {
      queryBuilder.andWhere('movimiento.fecha <= :fechaHasta', {
        fechaHasta: new Date(fechaHasta + ' 23:59:59'),
      });
    }

    const [movimientos, total] = await queryBuilder.getManyAndCount();

    return {
      data: movimientos,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByProductoCodigo(codigo: string) {
    const movimientos = await this.movimientoRepository
      .createQueryBuilder('movimiento')
      .leftJoinAndSelect('movimiento.producto', 'producto')
      .leftJoinAndSelect('producto.unidadMedida', 'unidadMedida')
      .leftJoinAndSelect('movimiento.bodega', 'bodega')
      .leftJoinAndSelect('movimiento.usuario', 'usuario')
      .leftJoinAndSelect('movimiento.cliente', 'cliente')
      .where('producto.codigo = :codigo', { codigo })
      .orderBy('movimiento.fecha', 'DESC')
      .getMany();

    return {
      codigo,
      movimientos,
      totalMovimientos: movimientos.length,
    };
  }

  async getInventarioGeneral() {
    const inventario = await this.movimientoRepository
      .createQueryBuilder('movimiento')
      .select([
        'producto.id as "productoId"',
        'producto.codigo as "productoCodigo"',
        'producto.descripcion as "productoDescripcion"',
        'unidadMedida.nombre as "unidadMedida"',
        'bodega.id as "bodegaId"',
        'bodega.nombre as "bodegaNombre"',
        'SUM(CASE WHEN movimiento.tipo = \'entrada\' THEN movimiento.cantidad ELSE -movimiento.cantidad END) as "stock"',
      ])
      .leftJoin('movimiento.producto', 'producto')
      .leftJoin('producto.unidadMedida', 'unidadMedida')
      .leftJoin('movimiento.bodega', 'bodega')
      .groupBy(
        'producto.id, producto.codigo, producto.descripcion, unidadMedida.nombre, bodega.id, bodega.nombre',
      )
      .having(
        "SUM(CASE WHEN movimiento.tipo = 'entrada' THEN movimiento.cantidad ELSE -movimiento.cantidad END) > 0",
      )
      .orderBy('producto.codigo', 'ASC')
      .addOrderBy('bodega.nombre', 'ASC')
      .getRawMany();

    return {
      inventario: inventario.map((item) => ({
        producto: {
          id: parseInt(item.productoId),
          codigo: item.productoCodigo,
          descripcion: item.productoDescripcion,
          unidadMedida: item.unidadMedida,
        },
        bodega: {
          id: parseInt(item.bodegaId),
          nombre: item.bodegaNombre,
        },
        stock: parseFloat(item.stock),
      })),
      totalItems: inventario.length,
    };
  }

  async getKardexProducto(productoId: number) {
    const producto = await this.productoRepository.findOne({
      where: { id: productoId },
      relations: ['unidadMedida'],
    });

    if (!producto) {
      throw new NotFoundException(
        `Producto con ID ${productoId} no encontrado`,
      );
    }

    const kardex = await this.movimientoRepository
      .createQueryBuilder('movimiento')
      .leftJoinAndSelect('movimiento.bodega', 'bodega')
      .leftJoinAndSelect('movimiento.usuario', 'usuario')
      .leftJoinAndSelect('movimiento.cliente', 'cliente')
      .where('movimiento.producto.id = :productoId', { productoId })
      .orderBy('movimiento.fecha', 'ASC')
      .getMany();

    let saldoAcumulado = 0;
    const kardexConSaldo = kardex.map((mov) => {
      const cantidad = mov.tipo === 'entrada' ? mov.cantidad : -mov.cantidad;
      saldoAcumulado += cantidad;

      return {
        id: mov.id,
        fecha: mov.fecha,
        tipo: mov.tipo,
        cantidad: mov.cantidad,
        precio_unitario: mov.precio_unitario,
        precio_total: mov.precio_total,
        saldo: saldoAcumulado,
        observacion: mov.observacion,
        bodega: {
          id: mov.bodega.id,
          nombre: mov.bodega.nombre,
        },
        usuario: {
          id: mov.usuario.id,
          nombre: mov.usuario.nombre,
        },
        cliente: mov.cliente
          ? {
              id: mov.cliente.id,
              nombre: mov.cliente.nombre,
              tipo: mov.cliente.tipo,
            }
          : null,
      };
    });

    return {
      producto: {
        id: producto.id,
        codigo: producto.codigo,
        descripcion: producto.descripcion,
        unidadMedida: producto.unidadMedida.nombre,
      },
      kardex: kardexConSaldo,
      stockActual: saldoAcumulado,
      totalMovimientos: kardex.length,
    };
  }

  async findOne(id: number): Promise<Movimiento> {
    const movimiento = await this.movimientoRepository.findOne({
      where: { id },
      relations: [
        'producto',
        'producto.unidadMedida',
        'bodega',
        'usuario',
        'cliente',
      ],
    });

    if (!movimiento) {
      throw new NotFoundException(`Movimiento con ID ${id} no encontrado`);
    }

    return movimiento;
  }

  async update(
    id: number,
    updateMovimientoDto: UpdateMovimientoDto,
  ): Promise<Movimiento> {
    const movimiento = await this.findOne(id);
    const { cantidad, precio_unitario, observacion } = updateMovimientoDto;

    // Si se actualiza la cantidad en una salida, validar stock
    if (
      cantidad &&
      movimiento.tipo === 'salida' &&
      cantidad !== movimiento.cantidad
    ) {
      const stockDisponible = await this.getStockProductoBodega(
        movimiento.producto.id,
        movimiento.bodega.id,
      );
      // Stock disponible + cantidad actual del movimiento (ya que se va a cambiar)
      const stockTotal = stockDisponible + movimiento.cantidad;

      if (stockTotal < cantidad) {
        throw new BadRequestException(
          `Stock insuficiente para la nueva cantidad. Stock disponible: ${stockTotal}, solicitado: ${cantidad}`,
        );
      }
    }

    if (cantidad) movimiento.cantidad = cantidad;
    if (precio_unitario !== undefined)
      movimiento.precio_unitario = precio_unitario;
    if (observacion !== undefined) movimiento.observacion = observacion;

    // Recalcular precio total si se cambió cantidad o precio unitario
    if (
      (cantidad || precio_unitario !== undefined) &&
      movimiento.precio_unitario
    ) {
      movimiento.precio_total =
        movimiento.cantidad * movimiento.precio_unitario;
    }

    return this.movimientoRepository.save(movimiento);
  }

  async remove(id: number): Promise<void> {
    const movimiento = await this.findOne(id);
    await this.movimientoRepository.remove(movimiento);
  }

  private async getStockProductoBodega(
    productoId: number,
    bodegaId: number,
  ): Promise<number> {
    const result = await this.movimientoRepository
      .createQueryBuilder('movimiento')
      .select(
        "SUM(CASE WHEN movimiento.tipo = 'entrada' THEN movimiento.cantidad ELSE -movimiento.cantidad END)",
        'stock',
      )
      .where('movimiento.producto.id = :productoId', { productoId })
      .andWhere('movimiento.bodega.id = :bodegaId', { bodegaId })
      .getRawOne();

    return parseFloat(result.stock) || 0;
  }
}
