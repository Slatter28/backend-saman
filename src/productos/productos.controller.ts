import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ProductosService } from './productos.service';
import { CreateProductoDto, UpdateProductoDto, QueryProductoDto } from './dto';
import { JwtAuthGuard } from '../auth/guards';

@ApiTags('productos')
@Controller('productos')
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  @Get()
  @ApiOperation({
    summary: 'Obtener lista de productos con paginación y filtros',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de productos obtenida exitosamente',
    schema: {
      example: {
        data: [
          {
            id: 1,
            codigo: 'PROD001',
            descripcion: 'Laptop Dell Inspiron 15',
            creadoEn: '2024-01-15T10:30:00.000Z',
            unidadMedida: {
              id: 1,
              nombre: 'und',
              descripcion: 'Unidad',
            },
          },
        ],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      },
    },
  })
  findAll(@Query() queryDto: QueryProductoDto) {
    return this.productosService.findAll(queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un producto por ID' })
  @ApiParam({
    name: 'id',
    description: 'ID del producto',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Producto encontrado',
    schema: {
      example: {
        id: 1,
        codigo: 'PROD001',
        descripcion: 'Laptop Dell Inspiron 15',
        creadoEn: '2024-01-15T10:30:00.000Z',
        unidadMedida: {
          id: 1,
          nombre: 'und',
          descripcion: 'Unidad',
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productosService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Crear un nuevo producto' })
  @ApiResponse({
    status: 201,
    description: 'Producto creado exitosamente',
    schema: {
      example: {
        id: 1,
        codigo: 'PROD001',
        descripcion: 'Laptop Dell Inspiron 15',
        creadoEn: '2024-01-15T10:30:00.000Z',
        unidadMedida: {
          id: 1,
          nombre: 'und',
          descripcion: 'Unidad',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({
    status: 409,
    description: 'Producto con este código ya existe',
  })
  create(@Body() createProductoDto: CreateProductoDto) {
    return this.productosService.create(createProductoDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Actualizar un producto' })
  @ApiParam({
    name: 'id',
    description: 'ID del producto',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Producto actualizado exitosamente',
    schema: {
      example: {
        id: 1,
        codigo: 'PROD001',
        descripcion: 'Laptop Dell Inspiron 15 - Actualizada',
        creadoEn: '2024-01-15T10:30:00.000Z',
        unidadMedida: {
          id: 1,
          nombre: 'und',
          descripcion: 'Unidad',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  @ApiResponse({
    status: 409,
    description: 'Producto con este código ya existe',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductoDto: UpdateProductoDto,
  ) {
    return this.productosService.update(id, updateProductoDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Eliminar un producto' })
  @ApiParam({
    name: 'id',
    description: 'ID del producto',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Producto eliminado exitosamente',
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productosService.remove(id);
  }
}
