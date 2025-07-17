import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UnidadMedida } from '../entities/unidad-medida.entity';
import { Producto } from '../entities/producto.entity';
import {
  CreateUnidadMedidaDto,
  UpdateUnidadMedidaDto,
  QueryUnidadMedidaDto,
} from './dto';

@Injectable()
export class UnidadesMedidaService {
  constructor(
    @InjectRepository(UnidadMedida)
    private readonly unidadMedidaRepository: Repository<UnidadMedida>,
    @InjectRepository(Producto)
    private readonly productoRepository: Repository<Producto>,
  ) {}

  async findAll(queryDto: QueryUnidadMedidaDto) {
    const { page = 1, limit = 10, nombre } = queryDto;

    const skip = (page - 1) * limit;

    const queryBuilder = this.unidadMedidaRepository
      .createQueryBuilder('unidadMedida')
      .skip(skip)
      .take(limit);

    if (nombre) {
      queryBuilder.andWhere('unidadMedida.nombre ILIKE :nombre', {
        nombre: `%${nombre}%`,
      });
    }

    const [unidadesMedida, total] = await queryBuilder.getManyAndCount();

    return {
      data: unidadesMedida,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number): Promise<UnidadMedida> {
    const unidadMedida = await this.unidadMedidaRepository.findOne({
      where: { id },
      relations: ['productos'],
    });

    if (!unidadMedida) {
      throw new NotFoundException(
        `Unidad de medida con ID ${id} no encontrada`,
      );
    }

    return unidadMedida;
  }

  async create(
    createUnidadMedidaDto: CreateUnidadMedidaDto,
  ): Promise<UnidadMedida> {
    const { nombre, descripcion } = createUnidadMedidaDto;

    // Verificar si el nombre ya existe
    const existingUnidadMedida = await this.unidadMedidaRepository.findOne({
      where: { nombre },
    });

    if (existingUnidadMedida) {
      throw new ConflictException(
        `Unidad de medida con nombre '${nombre}' ya existe`,
      );
    }

    const unidadMedida = this.unidadMedidaRepository.create({
      nombre,
      descripcion,
    });

    return this.unidadMedidaRepository.save(unidadMedida);
  }

  async update(
    id: number,
    updateUnidadMedidaDto: UpdateUnidadMedidaDto,
  ): Promise<UnidadMedida> {
    const unidadMedida = await this.findOne(id);

    const { nombre, descripcion } = updateUnidadMedidaDto;

    // Verificar si el nuevo nombre ya existe (si se está cambiando)
    if (nombre && nombre !== unidadMedida.nombre) {
      const existingUnidadMedida = await this.unidadMedidaRepository.findOne({
        where: { nombre },
      });

      if (existingUnidadMedida) {
        throw new ConflictException(
          `Unidad de medida con nombre '${nombre}' ya existe`,
        );
      }
    }

    if (nombre) unidadMedida.nombre = nombre;
    if (descripcion !== undefined) unidadMedida.descripcion = descripcion;

    return this.unidadMedidaRepository.save(unidadMedida);
  }

  async remove(id: number): Promise<void> {
    const unidadMedida = await this.findOne(id);

    // Verificar si tiene productos asociados
    const productosCount = await this.productoRepository.count({
      where: { unidadMedida: { id } },
    });

    if (productosCount > 0) {
      throw new BadRequestException(
        `No se puede eliminar la unidad de medida porque tiene ${productosCount} producto(s) asociado(s)`,
      );
    }

    await this.unidadMedidaRepository.remove(unidadMedida);
  }
}
