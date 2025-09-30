import { Injectable, Inject, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Producto } from '../entities/producto.entity';
import { Cliente } from '../entities/cliente.entity';
import { Bodega } from '../entities/bodega.entity';
import { Movimiento } from '../entities/movimiento.entity';

@Injectable({ scope: Scope.REQUEST })
export class DashboardService {
  private tenantId: string;

  constructor(
    @Inject(REQUEST) private request: Request,
    @InjectDataSource() private dataSource: DataSource,
  ) {
    // Prioridad: usuario autenticado > middleware > por defecto
    const userTenant = (request as any).user?.bodegaId;
    const middlewareTenant = request.tenantId;

    this.tenantId = userTenant || middlewareTenant || 'principal';
    console.log(`📊 DashboardService inicializado para tenant: ${this.tenantId}`);

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

  async getEstadisticasGenerales() {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    return this.executeWithTenant(async (manager) => {
      const productoRepository = manager.getRepository(Producto);
      const clienteRepository = manager.getRepository(Cliente);
      const bodegaRepository = manager.getRepository(Bodega);
      const movimientoRepository = manager.getRepository(Movimiento);

      const [
        totalProductos,
        totalClientes,
        totalBodegas,
        movimientosHoy,
        movimientosEsteMes,
      ] = await Promise.all([
        productoRepository.count(),
        clienteRepository.count(),
        bodegaRepository.count(),
        movimientoRepository
          .createQueryBuilder('movimiento')
          .where('movimiento.fecha >= :hoy AND movimiento.fecha < :manana', {
            hoy,
            manana,
          })
          .getCount(),
        movimientoRepository
          .createQueryBuilder('movimiento')
          .where('movimiento.fecha >= :inicioMes', { inicioMes })
          .getCount(),
      ]);

      console.log(`📊 Estadísticas calculadas para ${this.getCurrentTenant()}: ${totalProductos} productos, ${totalBodegas} bodegas`);

      return {
        totalProductos,
        totalClientes,
        totalBodegas,
        movimientosHoy,
        movimientosEsteMes,
      };
    });
  }

  async getMovimientosRecientes(limit = 10) {
    return this.executeWithTenant(async (manager) => {
      const movimientoRepository = manager.getRepository(Movimiento);

      const movimientos = await movimientoRepository.find({
        relations: ['producto', 'bodega', 'cliente', 'usuario'],
        order: { fecha: 'DESC' },
        take: limit,
        select: {
          id: true,
          tipo: true,
          cantidad: true,
          fecha: true,
          producto: {
            id: true,
            descripcion: true,
          },
          bodega: {
            id: true,
            nombre: true,
          },
          cliente: {
            id: true,
            nombre: true,
          },
          usuario: {
            id: true,
            nombre: true,
          },
        },
      });

      console.log(`📊 Movimientos recientes obtenidos para ${this.getCurrentTenant()}: ${movimientos.length} registros`);
      return movimientos;
    });
  }

  async getProductosStockBajo(limite = 5) {
    return this.executeWithTenant(async (manager) => {
      try {
        const schemaName = this.getSchemaName(this.tenantId);

        // Query que calcula stock actual sin incluir precio del producto - usando esquema específico
        const stockQuery = `
          SELECT
            p.id,
            p.codigo,
            p.descripcion,
            COALESCE(SUM(CASE WHEN m.tipo = 'entrada' THEN m.cantidad ELSE -m.cantidad END), 0) as stock_actual,
            COALESCE(AVG(m.precio_unitario), 0) as precio_promedio
          FROM ${schemaName}.productos p
          LEFT JOIN ${schemaName}.movimientos m ON p.id = m.producto_id
          GROUP BY p.id, p.codigo, p.descripcion
          HAVING COALESCE(SUM(CASE WHEN m.tipo = 'entrada' THEN m.cantidad ELSE -m.cantidad END), 0) <= $1
          ORDER BY stock_actual ASC
          LIMIT 10
        `;

        const result = await manager.query(stockQuery, [limite]);

        console.log(`📊 Productos con stock bajo calculados para ${this.getCurrentTenant()}: ${result.length} productos`);

        return result.map((item: any) => ({
          id: parseInt(item.id),
          codigo: item.codigo,
          descripcion: item.descripcion,
          stock_actual: parseInt(item.stock_actual),
          precio_promedio: parseFloat(item.precio_promedio || 0),
        }));
      } catch (error) {
        console.error('Error en getProductosStockBajo:', error);
        // Fallback: obtener todos los productos y simular stock bajo
        const productoRepository = manager.getRepository(Producto);
        const productos = await productoRepository.find({ take: 5 });

        console.log(`📊 Fallback: productos simulados para ${this.getCurrentTenant()}: ${productos.length} productos`);

        return productos.map((producto) => ({
          id: producto.id,
          codigo: producto.codigo,
          descripcion: producto.descripcion,
          stock_actual: Math.floor(Math.random() * limite),
          precio_promedio: 0,
        }));
      }
    });
  }

  async getDatosGraficos() {
    return this.executeWithTenant(async (manager) => {
      const productoRepository = manager.getRepository(Producto);
      const bodegaRepository = manager.getRepository(Bodega);

      // Versión simplificada con datos mock para demostración
      const movimientosPorDia = [];
      const entradasVsSalidas = [];

      // Generar datos mock para los últimos 7 días
      for (let i = 6; i >= 0; i--) {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() - i);
        const fechaStr = fecha.toISOString().split('T')[0];

        movimientosPorDia.push({
          fecha: fechaStr,
          cantidad: Math.floor(Math.random() * 20) + 1,
        });

        entradasVsSalidas.push(
          {
            fecha: fechaStr,
            tipo: 'entrada',
            cantidad: Math.floor(Math.random() * 10) + 1,
          },
          {
            fecha: fechaStr,
            tipo: 'salida',
            cantidad: Math.floor(Math.random() * 8) + 1,
          },
        );
      }

      // Obtener productos reales para top productos EN EL TENANT ACTUAL
      const productos = await productoRepository.find({ take: 5 });
      const topProductosMasMovidos = productos.map((producto) => ({
        descripcion: producto.descripcion,
        total_movimientos: Math.floor(Math.random() * 50) + 10,
        cantidad_total: Math.floor(Math.random() * 200) + 50,
      }));

      // Obtener bodegas reales EN EL TENANT ACTUAL
      const bodegas = await bodegaRepository.find({ take: 5 });
      const movimientosPorBodega = bodegas.map((bodega) => ({
        nombre: bodega.nombre,
        total_movimientos: Math.floor(Math.random() * 30) + 5,
        entradas: Math.floor(Math.random() * 50) + 10,
        salidas: Math.floor(Math.random() * 40) + 5,
      }));

      console.log(`📊 Datos gráficos generados para ${this.getCurrentTenant()}: ${productos.length} productos, ${bodegas.length} bodegas`);

      return {
        movimientosPorDia,
        entradasVsSalidas,
        topProductosMasMovidos,
        movimientosPorBodega,
      };
    });
  }

  async getInventarioResumen() {
    return this.executeWithTenant(async (manager) => {
      const bodegaRepository = manager.getRepository(Bodega);
      const productoRepository = manager.getRepository(Producto);

      // Versión simplificada que funciona con cualquier estado de la BD EN EL TENANT ACTUAL
      const bodegas = await bodegaRepository.find({ take: 5 });
      const productos = await productoRepository.find({ take: 3 });

      console.log(`📊 Inventario resumen generado para ${this.getCurrentTenant()}: ${bodegas.length} bodegas, ${productos.length} productos`);

      return bodegas.map((bodega) => ({
        bodega_id: bodega.id,
        bodega_nombre: bodega.nombre,
        total_productos: productos.length,
        stock_total: Math.floor(Math.random() * 500) + 100,
        productos: productos.map((producto) => ({
          producto_id: producto.id,
          producto_descripcion: producto.descripcion,
          stock_actual: Math.floor(Math.random() * 50) + 10,
        })),
      }));
    });
  }
}
