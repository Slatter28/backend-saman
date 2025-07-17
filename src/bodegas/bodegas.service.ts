import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bodega } from '../entities/bodega.entity';
import { Movimiento } from '../entities/movimiento.entity';
import { CreateBodegaDto, UpdateBodegaDto, QueryBodegaDto } from './dto';

@Injectable()
export class BodegasService {
  constructor(
    @InjectRepository(Bodega)
    private readonly bodegaRepository: Repository<Bodega>,
    @InjectRepository(Movimiento)
    private readonly movimientoRepository: Repository<Movimiento>,
  ) {}

  async findAll(queryDto: QueryBodegaDto) {
    const { page = 1, limit = 10, nombre, ubicacion } = queryDto;

    const skip = (page - 1) * limit;

    const queryBuilder = this.bodegaRepository
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

    return {
      data: bodegas,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number): Promise<Bodega> {
    const bodega = await this.bodegaRepository.findOne({
      where: { id },
      relations: ['movimientos'],
    });

    if (!bodega) {
      throw new NotFoundException(`Bodega con ID ${id} no encontrada`);
    }

    return bodega;
  }

  async create(createBodegaDto: CreateBodegaDto): Promise<Bodega> {
    const { nombre, ubicacion } = createBodegaDto;

    // Verificar si el nombre ya existe
    const existingBodega = await this.bodegaRepository.findOne({
      where: { nombre },
    });

    if (existingBodega) {
      throw new ConflictException(`Bodega con nombre '${nombre}' ya existe`);
    }

    const bodega = this.bodegaRepository.create({
      nombre,
      ubicacion,
    });

    return this.bodegaRepository.save(bodega);
  }

  async update(id: number, updateBodegaDto: UpdateBodegaDto): Promise<Bodega> {
    const bodega = await this.findOne(id);

    const { nombre, ubicacion } = updateBodegaDto;

    // Verificar si el nuevo nombre ya existe (si se está cambiando)
    if (nombre && nombre !== bodega.nombre) {
      const existingBodega = await this.bodegaRepository.findOne({
        where: { nombre },
      });

      if (existingBodega) {
        throw new ConflictException(`Bodega con nombre '${nombre}' ya existe`);
      }
    }

    if (nombre) bodega.nombre = nombre;
    if (ubicacion !== undefined) bodega.ubicacion = ubicacion;

    return this.bodegaRepository.save(bodega);
  }

  async remove(id: number): Promise<void> {
    const bodega = await this.findOne(id);

    // Verificar si tiene movimientos asociados
    const movimientosCount = await this.movimientoRepository.count({
      where: { bodega: { id } },
    });

    if (movimientosCount > 0) {
      throw new BadRequestException(
        `No se puede eliminar la bodega porque tiene ${movimientosCount} movimiento(s) asociado(s)`,
      );
    }

    await this.bodegaRepository.remove(bodega);
  }

  async getInventarioBodega(id: number) {
    const bodega = await this.findOne(id);

    // Obtener el inventario agrupado por producto
    const inventario = await this.movimientoRepository
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
  }
}
