import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Producto } from '../entities/producto.entity';
import { UnidadMedida } from '../entities/unidad-medida.entity';
import { CreateProductoDto, UpdateProductoDto, QueryProductoDto } from './dto';

@Injectable()
export class ProductosService {
  constructor(
    @InjectRepository(Producto)
    private readonly productoRepository: Repository<Producto>,
    @InjectRepository(UnidadMedida)
    private readonly unidadMedidaRepository: Repository<UnidadMedida>,
  ) {}

  async findAll(queryDto: QueryProductoDto) {
    const {
      page = 1,
      limit = 10,
      codigo,
      descripcion,
      unidadMedidaId,
    } = queryDto;

    const skip = (page - 1) * limit;

    const queryBuilder = this.productoRepository
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

    return {
      data: productos,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number): Promise<Producto> {
    const producto = await this.productoRepository.findOne({
      where: { id },
      relations: ['unidadMedida'],
    });

    if (!producto) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    return producto;
  }

  async create(createProductoDto: CreateProductoDto): Promise<Producto> {
    const { codigo, descripcion, unidadMedidaId } = createProductoDto;

    // Verificar si el código ya existe
    const existingProduct = await this.productoRepository.findOne({
      where: { codigo },
    });

    if (existingProduct) {
      throw new ConflictException(`Producto con código '${codigo}' ya existe`);
    }

    // Verificar que la unidad de medida existe
    const unidadMedida = await this.unidadMedidaRepository.findOne({
      where: { id: unidadMedidaId },
    });

    if (!unidadMedida) {
      throw new BadRequestException(
        `Unidad de medida con ID ${unidadMedidaId} no encontrada`,
      );
    }

    const producto = this.productoRepository.create({
      codigo,
      descripcion,
      unidadMedida,
    });

    const savedProducto = await this.productoRepository.save(producto);

    return this.findOne(savedProducto.id);
  }

  async update(
    id: number,
    updateProductoDto: UpdateProductoDto,
  ): Promise<Producto> {
    const producto = await this.findOne(id);

    const { codigo, descripcion, unidadMedidaId } = updateProductoDto;

    // Verificar si el nuevo código ya existe (si se está cambiando)
    if (codigo && codigo !== producto.codigo) {
      const existingProduct = await this.productoRepository.findOne({
        where: { codigo },
      });

      if (existingProduct) {
        throw new ConflictException(
          `Producto con código '${codigo}' ya existe`,
        );
      }
    }

    // Verificar que la nueva unidad de medida existe (si se está cambiando)
    if (unidadMedidaId && unidadMedidaId !== producto.unidadMedida.id) {
      const unidadMedida = await this.unidadMedidaRepository.findOne({
        where: { id: unidadMedidaId },
      });

      if (!unidadMedida) {
        throw new BadRequestException(
          `Unidad de medida con ID ${unidadMedidaId} no encontrada`,
        );
      }

      producto.unidadMedida = unidadMedida;
    }

    if (codigo) producto.codigo = codigo;
    if (descripcion) producto.descripcion = descripcion;

    await this.productoRepository.save(producto);

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const producto = await this.findOne(id);

    await this.productoRepository.remove(producto);
  }
}
