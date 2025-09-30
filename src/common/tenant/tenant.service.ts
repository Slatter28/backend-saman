import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';

@Injectable()
export class TenantService {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  /**
   * Obtiene un EntityManager configurado para un tenant específico
   */
  getEntityManager(tenantId: string): EntityManager {
    // Mapear tenantId a nombre de esquema
    const schemaName = this.getSchemaName(tenantId);
    
    // Crear query runner con el esquema específico
    const queryRunner = this.dataSource.createQueryRunner();
    
    // Configurar el search_path para PostgreSQL
    queryRunner.manager.query(`SET search_path TO ${schemaName}, public`);
    
    return queryRunner.manager;
  }

  /**
   * Mapea el tenantId a nombre de esquema
   */
  private getSchemaName(tenantId: string): string {
    const schemaMap: Record<string, string> = {
      'principal': 'inventario_principal',
      'sucursal': 'inventario_sucursal',
    };

    return schemaMap[tenantId] || 'inventario_principal';
  }

  /**
   * Valida si un tenantId es válido
   */
  isValidTenant(tenantId: string): boolean {
    return ['principal', 'sucursal'].includes(tenantId);
  }

  /**
   * Obtiene la lista de tenants disponibles
   */
  getAvailableTenants(): Array<{id: string, nombre: string}> {
    return [
      { id: 'principal', nombre: 'Bodega Principal' },
      { id: 'sucursal', nombre: 'Bodega Sucursal' },
    ];
  }
}