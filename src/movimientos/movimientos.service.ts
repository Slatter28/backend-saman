import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as XLSX from 'xlsx';
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
  ExcelQueryDto,
  InventarioExcelQueryDto,
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
    const { productoId, bodegaId, clienteId, cantidad, observacion } =
      createEntradaDto;

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

    const movimiento = this.movimientoRepository.create({
      tipo: 'entrada',
      cantidad,
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
    const { productoId, bodegaId, clienteId, cantidad, observacion } =
      createSalidaDto;

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

    const movimiento = this.movimientoRepository.create({
      tipo: 'salida',
      cantidad,
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

  async getInventarioGeneral(filtros?: {
    bodegaId?: number;
    productoId?: number;
    stockMinimo?: number;
    soloStockBajo?: boolean;
    incluirCeros?: boolean;
  }) {
    let queryBuilder = this.movimientoRepository
      .createQueryBuilder('movimiento')
      .select([
        'producto.id as "productoId"',
        'producto.codigo as "productoCodigo"',
        'producto.descripcion as "productoDescripcion"',
        'unidadMedida.nombre as "unidadMedida"',
        'bodega.id as "bodegaId"',
        'bodega.nombre as "bodegaNombre"',
        'bodega.ubicacion as "bodegaUbicacion"',
        'SUM(CASE WHEN movimiento.tipo = \'entrada\' THEN movimiento.cantidad ELSE -movimiento.cantidad END) as "stock"',
        'COUNT(movimiento.id) as "totalMovimientos"',
        'MAX(movimiento.fecha) as "ultimoMovimiento"',
        'SUM(CASE WHEN movimiento.tipo = \'entrada\' THEN movimiento.cantidad ELSE 0 END) as "totalEntradas"',
        'SUM(CASE WHEN movimiento.tipo = \'salida\' THEN movimiento.cantidad ELSE 0 END) as "totalSalidas"',
      ])
      .leftJoin('movimiento.producto', 'producto')
      .leftJoin('producto.unidadMedida', 'unidadMedida')
      .leftJoin('movimiento.bodega', 'bodega')
      .groupBy(
        'producto.id, producto.codigo, producto.descripcion, unidadMedida.nombre, bodega.id, bodega.nombre, bodega.ubicacion',
      );

    // Aplicar filtros WHERE
    if (filtros?.bodegaId) {
      queryBuilder = queryBuilder.andWhere('bodega.id = :bodegaId', {
        bodegaId: filtros.bodegaId,
      });
    }

    if (filtros?.productoId) {
      queryBuilder = queryBuilder.andWhere('producto.id = :productoId', {
        productoId: filtros.productoId,
      });
    }

    // ✅ CORREGIDO: Aplicar filtros HAVING correctamente
    const stockCalculation =
      "SUM(CASE WHEN movimiento.tipo = 'entrada' THEN movimiento.cantidad ELSE -movimiento.cantidad END)";

    // Si no incluir ceros, aplicar filtro básico
    if (!filtros?.incluirCeros) {
      queryBuilder = queryBuilder.having(`${stockCalculation} > 0`);
    }

    // Si hay stock mínimo Y no es solo stock bajo
    if (filtros?.stockMinimo && !filtros?.soloStockBajo) {
      if (!filtros?.incluirCeros) {
        // Ya hay un HAVING, usar andHaving
        queryBuilder = queryBuilder.andHaving(
          `${stockCalculation} >= :stockMinimo`,
          {
            stockMinimo: filtros.stockMinimo,
          },
        );
      } else {
        // Primer HAVING
        queryBuilder = queryBuilder.having(
          `${stockCalculation} >= :stockMinimo`,
          {
            stockMinimo: filtros.stockMinimo,
          },
        );
      }
    }

    // Si es solo stock bajo
    if (filtros?.soloStockBajo) {
      if (!filtros?.incluirCeros || filtros?.stockMinimo) {
        // Ya hay un HAVING, usar andHaving
        queryBuilder = queryBuilder.andHaving(`${stockCalculation} <= 10`);
      } else {
        // Primer HAVING
        queryBuilder = queryBuilder.having(`${stockCalculation} <= 10`);
      }
    }

    queryBuilder = queryBuilder
      .orderBy('producto.codigo', 'ASC')
      .addOrderBy('bodega.nombre', 'ASC');

    const inventario = await queryBuilder.getRawMany();

    // Calcular estadísticas
    const estadisticas = {
      totalProductosDiferentes: new Set(
        inventario.map((item) => item.productoId),
      ).size,
      totalBodegas: new Set(inventario.map((item) => item.bodegaId)).size,
      stockTotalUnidades: inventario.reduce(
        (sum, item) => sum + parseFloat(item.stock),
        0,
      ),
      totalRegistros: inventario.length,
      productosStockBajo: inventario.filter(
        (item) => parseFloat(item.stock) <= 10,
      ).length,
      ultimaActualizacion: new Date().toISOString(),
    };

    // Resumen por bodega
    const resumenPorBodega = inventario.reduce((acc, item) => {
      const bodegaId = parseInt(item.bodegaId);
      if (!acc[bodegaId]) {
        acc[bodegaId] = {
          bodega: {
            id: bodegaId,
            nombre: item.bodegaNombre,
            ubicacion: item.bodegaUbicacion,
          },
          totalProductos: 0,
          stockTotal: 0,
        };
      }
      acc[bodegaId].totalProductos++;
      acc[bodegaId].stockTotal += parseFloat(item.stock);
      return acc;
    }, {});

    // Resumen por producto (stock total en todas las bodegas)
    const resumenPorProducto = inventario.reduce((acc, item) => {
      const productoId = parseInt(item.productoId);
      if (!acc[productoId]) {
        acc[productoId] = {
          producto: {
            id: productoId,
            codigo: item.productoCodigo,
            descripcion: item.productoDescripcion,
            unidadMedida: item.unidadMedida,
          },
          stockTotal: 0,
          bodegas: 0,
          ultimoMovimiento: item.ultimoMovimiento,
        };
      }
      acc[productoId].stockTotal += parseFloat(item.stock);
      acc[productoId].bodegas++;

      // Mantener el último movimiento más reciente
      if (
        new Date(item.ultimoMovimiento) >
        new Date(acc[productoId].ultimoMovimiento || '1970-01-01')
      ) {
        acc[productoId].ultimoMovimiento = item.ultimoMovimiento;
      }

      return acc;
    }, {});

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
          ubicacion: item.bodegaUbicacion,
        },
        stock: parseFloat(item.stock),
        totalMovimientos: parseInt(item.totalMovimientos),
        ultimoMovimiento: item.ultimoMovimiento,
        totalEntradas: parseFloat(item.totalEntradas),
        totalSalidas: parseFloat(item.totalSalidas),
      })),
      estadisticas,
      resumenPorBodega: Object.values(resumenPorBodega),
      resumenPorProducto: Object.values(resumenPorProducto),
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
      const cantidadNumerica = Number(mov.cantidad);
      const cantidad =
        mov.tipo === 'entrada' ? cantidadNumerica : -cantidadNumerica;
      saldoAcumulado += cantidad;

      return {
        id: mov.id,
        fecha: mov.fecha,
        tipo: mov.tipo,
        cantidad: mov.cantidad,
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
    const { cantidad, observacion } = updateMovimientoDto;

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
    if (observacion !== undefined) movimiento.observacion = observacion;

    return this.movimientoRepository.save(movimiento);
  }

  async remove(id: number): Promise<void> {
    const movimiento = await this.findOne(id);
    await this.movimientoRepository.remove(movimiento);
  }

  async generateExcelReport(queryDto: ExcelQueryDto): Promise<Buffer> {
    const movimientosData = await this.findAllForExcel(queryDto);

    const entradas = movimientosData.filter((mov) => mov.tipo === 'entrada');
    const salidas = movimientosData.filter((mov) => mov.tipo === 'salida');

    const workbook = XLSX.utils.book_new();

    const entradasData = entradas.map((mov) => ({
      Fecha: new Date(mov.fecha).toLocaleDateString('es-ES'),
      'Código Producto': mov.producto.codigo,
      'Descripción Producto': mov.producto.descripcion,
      'Cliente/Proveedor': mov.cliente ? mov.cliente.nombre : 'Sin cliente',
      Cantidad: mov.cantidad,
      'Unidad Medida': mov.producto.unidadMedida?.nombre || 'Sin unidad',
      Bodega: mov.bodega.nombre,
      Observación: mov.observacion || '',
    }));

    const salidasData = salidas.map((mov) => ({
      Fecha: new Date(mov.fecha).toLocaleDateString('es-ES'),
      'Código Producto': mov.producto.codigo,
      'Descripción Producto': mov.producto.descripcion,
      'Cliente/Proveedor': mov.cliente ? mov.cliente.nombre : 'Sin cliente',
      Cantidad: mov.cantidad,
      'Unidad Medida': mov.producto.unidadMedida?.nombre || 'Sin unidad',
      Bodega: mov.bodega.nombre,
      Observación: mov.observacion || '',
    }));

    // Crear hojas con diseño mejorado
    const entradasWorksheet = this.createStyledWorksheet(entradasData, 'ENTRADAS DE INVENTARIO', '#4CAF50');
    const salidasWorksheet = this.createStyledWorksheet(salidasData, 'SALIDAS DE INVENTARIO', '#F44336');

    XLSX.utils.book_append_sheet(workbook, entradasWorksheet, 'Entradas');
    XLSX.utils.book_append_sheet(workbook, salidasWorksheet, 'Salidas');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  private createStyledWorksheet(data: any[], title: string, headerColor: string) {
    // Crear hoja con título primero, luego agregar datos
    const worksheet = XLSX.utils.aoa_to_sheet([[title]]);
    
    // Agregar una fila vacía después del título
    XLSX.utils.sheet_add_aoa(worksheet, [[]], { origin: 'A2' });
    
    // Agregar datos empezando desde la fila 3
    if (data.length > 0) {
      XLSX.utils.sheet_add_json(worksheet, data, { origin: 'A3', skipHeader: false });
    }

    // Configurar anchos de columnas
    const columnWidths = [
      { wch: 12 }, // Fecha
      { wch: 15 }, // Código
      { wch: 35 }, // Descripción
      { wch: 25 }, // Cliente/Proveedor
      { wch: 10 }, // Cantidad
      { wch: 15 }, // Unidad
      { wch: 20 }, // Bodega
      { wch: 30 }, // Observación
    ];
    worksheet['!cols'] = columnWidths;

    // Obtener el rango de datos
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');

    // Mergear celdas para el título
    if (!worksheet['!merges']) worksheet['!merges'] = [];
    worksheet['!merges'].push({
      s: { r: 0, c: 0 },
      e: { r: 0, c: 7 }
    });

    // Estilo para el título
    const titleStyle = {
      font: { bold: true, size: 16, color: { rgb: '2C3E50' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      fill: { fgColor: { rgb: 'ECF0F1' } },
      border: {
        top: { style: 'medium', color: { rgb: '2C3E50' } },
        bottom: { style: 'medium', color: { rgb: '2C3E50' } },
        left: { style: 'medium', color: { rgb: '2C3E50' } },
        right: { style: 'medium', color: { rgb: '2C3E50' } },
      },
    };
    
    if (worksheet['A1']) {
      worksheet['A1'].s = titleStyle;
    }

    // Estilos para las cabeceras (fila 3)
    const headerStyle = {
      font: { bold: true, color: { rgb: 'FFFFFF' }, size: 12 },
      fill: { fgColor: { rgb: headerColor.replace('#', '') } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: {
        top: { style: 'thin', color: { rgb: '000000' } },
        bottom: { style: 'thin', color: { rgb: '000000' } },
        left: { style: 'thin', color: { rgb: '000000' } },
        right: { style: 'thin', color: { rgb: '000000' } },
      },
    };

    // Estilos para las celdas de datos
    const dataStyle = {
      font: { size: 10 },
      alignment: { vertical: 'center', wrapText: true },
      border: {
        top: { style: 'thin', color: { rgb: 'CCCCCC' } },
        bottom: { style: 'thin', color: { rgb: 'CCCCCC' } },
        left: { style: 'thin', color: { rgb: 'CCCCCC' } },
        right: { style: 'thin', color: { rgb: 'CCCCCC' } },
      },
    };

    // Estilo para filas alternadas
    const alternateRowStyle = {
      ...dataStyle,
      fill: { fgColor: { rgb: 'F8F9FA' } },
    };

    if (data.length > 0) {
      // Aplicar estilos a las cabeceras (fila 3, índice 2)
      for (let col = 0; col <= 7; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 2, c: col });
        if (worksheet[cellAddress]) {
          worksheet[cellAddress].s = headerStyle;
        }
      }

      // Aplicar estilos a las celdas de datos (desde fila 4, índice 3)
      for (let row = 3; row <= range.e.r; row++) {
        const isAlternate = (row - 3) % 2 === 0;
        for (let col = 0; col <= 7; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
          if (worksheet[cellAddress]) {
            // Aplicar estilo base
            worksheet[cellAddress].s = isAlternate ? alternateRowStyle : dataStyle;
            
            // Estilos especiales para columnas específicas
            if (col === 4) { // Columna Cantidad
              worksheet[cellAddress].s = {
                ...worksheet[cellAddress].s,
                alignment: { horizontal: 'right', vertical: 'center' },
                numFmt: '#,##0.00',
              };
            } else if (col === 0) { // Columna Fecha
              worksheet[cellAddress].s = {
                ...worksheet[cellAddress].s,
                alignment: { horizontal: 'center', vertical: 'center' },
              };
            }
          }
        }
      }
    }

    // Configurar altura de filas
    if (!worksheet['!rows']) worksheet['!rows'] = [];
    worksheet['!rows'][0] = { hpx: 30 }; // Título
    worksheet['!rows'][1] = { hpx: 10 }; // Fila vacía
    worksheet['!rows'][2] = { hpx: 25 }; // Cabeceras
    
    // Altura para filas de datos
    for (let i = 3; i <= range.e.r; i++) {
      worksheet['!rows'][i] = { hpx: 20 };
    }

    return worksheet;
  }

  async generateInventarioExcelReport(queryDto: InventarioExcelQueryDto): Promise<Buffer> {
    const inventarioData = await this.getInventarioForExcel(queryDto);

    const workbook = XLSX.utils.book_new();

    // Crear hoja de inventario con diseño mejorado
    const inventarioWorksheet = this.createInventarioStyledWorksheet(inventarioData, 'REPORTE DE INVENTARIO', '#2196F3');

    XLSX.utils.book_append_sheet(workbook, inventarioWorksheet, 'Inventario');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  private async getInventarioForExcel(queryDto: InventarioExcelQueryDto) {
    let queryBuilder = this.movimientoRepository
      .createQueryBuilder('movimiento')
      .select([
        'producto.codigo as "codigoProducto"',
        'producto.descripcion as "descripcion"',
        'bodega.nombre as "bodega"',
        'unidadMedida.nombre as "medida"',
        'SUM(CASE WHEN movimiento.tipo = \'entrada\' THEN movimiento.cantidad ELSE 0 END) as "entradas"',
        'SUM(CASE WHEN movimiento.tipo = \'salida\' THEN movimiento.cantidad ELSE 0 END) as "salidas"',
        'SUM(CASE WHEN movimiento.tipo = \'entrada\' THEN movimiento.cantidad ELSE -movimiento.cantidad END) as "stock"',
      ])
      .leftJoin('movimiento.producto', 'producto')
      .leftJoin('producto.unidadMedida', 'unidadMedida')
      .leftJoin('movimiento.bodega', 'bodega')
      .groupBy(
        'producto.codigo, producto.descripcion, bodega.nombre, unidadMedida.nombre',
      )
      .orderBy('producto.codigo', 'ASC')
      .addOrderBy('bodega.nombre', 'ASC');

    // Aplicar filtro de bodega si se especifica
    if (queryDto.bodegaId) {
      queryBuilder = queryBuilder.andWhere('bodega.id = :bodegaId', { 
        bodegaId: queryDto.bodegaId 
      });
    }

    const resultado = await queryBuilder.getRawMany();

    return resultado.map((item) => ({
      'CODIGO PRODUCTO': item.codigoProducto,
      'DESCRIPCION': item.descripcion,
      'BODEGA': item.bodega,
      'MEDIDA': item.medida || 'Sin unidad',
      'ENTRADAS': parseFloat(item.entradas) || 0,
      'SALIDAS': parseFloat(item.salidas) || 0,
      'STOCK': parseFloat(item.stock) || 0,
    }));
  }

  private createInventarioStyledWorksheet(data: any[], title: string, headerColor: string) {
    // Crear hoja con título primero
    const worksheet = XLSX.utils.aoa_to_sheet([[title]]);
    
    // Agregar una fila vacía después del título
    XLSX.utils.sheet_add_aoa(worksheet, [[]], { origin: 'A2' });
    
    // Agregar datos empezando desde la fila 3
    if (data.length > 0) {
      XLSX.utils.sheet_add_json(worksheet, data, { origin: 'A3', skipHeader: false });
    }

    // Configurar anchos de columnas específicos para inventario
    const columnWidths = [
      { wch: 18 }, // CODIGO PRODUCTO
      { wch: 40 }, // DESCRIPCION
      { wch: 20 }, // BODEGA
      { wch: 12 }, // MEDIDA
      { wch: 12 }, // ENTRADAS
      { wch: 12 }, // SALIDAS
      { wch: 12 }, // STOCK
    ];
    worksheet['!cols'] = columnWidths;

    // Obtener el rango de datos
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');

    // Mergear celdas para el título
    if (!worksheet['!merges']) worksheet['!merges'] = [];
    worksheet['!merges'].push({
      s: { r: 0, c: 0 },
      e: { r: 0, c: 6 }
    });

    // Estilo para el título
    const titleStyle = {
      font: { bold: true, size: 16, color: { rgb: '2C3E50' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      fill: { fgColor: { rgb: 'ECF0F1' } },
      border: {
        top: { style: 'medium', color: { rgb: '2C3E50' } },
        bottom: { style: 'medium', color: { rgb: '2C3E50' } },
        left: { style: 'medium', color: { rgb: '2C3E50' } },
        right: { style: 'medium', color: { rgb: '2C3E50' } },
      },
    };
    
    if (worksheet['A1']) {
      worksheet['A1'].s = titleStyle;
    }

    // Estilos para las cabeceras (fila 3)
    const headerStyle = {
      font: { bold: true, color: { rgb: 'FFFFFF' }, size: 12 },
      fill: { fgColor: { rgb: headerColor.replace('#', '') } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: {
        top: { style: 'thin', color: { rgb: '000000' } },
        bottom: { style: 'thin', color: { rgb: '000000' } },
        left: { style: 'thin', color: { rgb: '000000' } },
        right: { style: 'thin', color: { rgb: '000000' } },
      },
    };

    // Estilos para las celdas de datos
    const dataStyle = {
      font: { size: 10 },
      alignment: { vertical: 'center', wrapText: true },
      border: {
        top: { style: 'thin', color: { rgb: 'CCCCCC' } },
        bottom: { style: 'thin', color: { rgb: 'CCCCCC' } },
        left: { style: 'thin', color: { rgb: 'CCCCCC' } },
        right: { style: 'thin', color: { rgb: 'CCCCCC' } },
      },
    };

    // Estilo para filas alternadas
    const alternateRowStyle = {
      ...dataStyle,
      fill: { fgColor: { rgb: 'F8F9FA' } },
    };

    // Estilo para stock bajo (menor a 10)
    const lowStockStyle = {
      ...dataStyle,
      fill: { fgColor: { rgb: 'FFEBEE' } },
      font: { ...dataStyle.font, color: { rgb: 'D32F2F' } },
    };

    if (data.length > 0) {
      // Aplicar estilos a las cabeceras (fila 3, índice 2)
      for (let col = 0; col <= 6; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 2, c: col });
        if (worksheet[cellAddress]) {
          worksheet[cellAddress].s = headerStyle;
        }
      }

      // Aplicar estilos a las celdas de datos (desde fila 4, índice 3)
      for (let row = 3; row <= range.e.r; row++) {
        const isAlternate = (row - 3) % 2 === 0;
        
        // Obtener el valor del stock para determinar el estilo
        const stockCellAddress = XLSX.utils.encode_cell({ r: row, c: 6 });
        const stockValue = worksheet[stockCellAddress] ? parseFloat(worksheet[stockCellAddress].v) : 0;
        const isLowStock = stockValue < 10;

        for (let col = 0; col <= 6; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
          if (worksheet[cellAddress]) {
            // Aplicar estilo base o de stock bajo
            if (isLowStock) {
              worksheet[cellAddress].s = lowStockStyle;
            } else {
              worksheet[cellAddress].s = isAlternate ? alternateRowStyle : dataStyle;
            }
            
            // Estilos especiales para columnas específicas
            if (col >= 4 && col <= 6) { // Columnas ENTRADAS, SALIDAS, STOCK
              worksheet[cellAddress].s = {
                ...worksheet[cellAddress].s,
                alignment: { horizontal: 'right', vertical: 'center' },
                numFmt: '#,##0.00',
              };
            } else if (col === 0) { // Columna CODIGO PRODUCTO
              worksheet[cellAddress].s = {
                ...worksheet[cellAddress].s,
                alignment: { horizontal: 'center', vertical: 'center' },
              };
            }
          }
        }
      }
    }

    // Configurar altura de filas
    if (!worksheet['!rows']) worksheet['!rows'] = [];
    worksheet['!rows'][0] = { hpx: 30 }; // Título
    worksheet['!rows'][1] = { hpx: 10 }; // Fila vacía
    worksheet['!rows'][2] = { hpx: 25 }; // Cabeceras
    
    // Altura para filas de datos
    for (let i = 3; i <= range.e.r; i++) {
      worksheet['!rows'][i] = { hpx: 20 };
    }

    return worksheet;
  }

  private async findAllForExcel(queryDto: ExcelQueryDto) {
    const {
      tipo,
      productoId,
      productoCodigo,
      bodegaId,
      clienteId,
      fechaDesde,
      fechaHasta,
      usuarioId,
    } = queryDto;

    const queryBuilder = this.movimientoRepository
      .createQueryBuilder('movimiento')
      .leftJoinAndSelect('movimiento.producto', 'producto')
      .leftJoinAndSelect('producto.unidadMedida', 'unidadMedida')
      .leftJoinAndSelect('movimiento.bodega', 'bodega')
      .leftJoinAndSelect('movimiento.usuario', 'usuario')
      .leftJoinAndSelect('movimiento.cliente', 'cliente')
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

    return await queryBuilder.getMany();
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
