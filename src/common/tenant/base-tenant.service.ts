import { Injectable, Inject, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { TenantService } from './tenant.service';

@Injectable({ scope: Scope.REQUEST })
export class BaseTenantService {
  protected tenantId: string;

  constructor(
    @Inject(REQUEST) private request: Request,
    private dataSource: DataSource,
    private tenantService: TenantService,
  ) {
    // Obtener tenantId del request
    this.tenantId = request.tenantId || 'principal';
    console.log(`🏢 BaseTenantService inicializado para tenant: ${this.tenantId}`);
  }

  /**
   * Obtiene un repositorio configurado para el tenant actual
   */
  protected async getRepository<T>(entity: new () => T): Promise<Repository<T>> {
    const schemaName = this.getSchemaName(this.tenantId);
    
    // Crear query runner y configurar schema
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.query(`SET search_path TO ${schemaName}, public`);
    
    console.log(`🗄️ Repository configurado para esquema: ${schemaName}`);
    return queryRunner.manager.getRepository(entity);
  }

  /**
   * Mapea tenantId a nombre de esquema
   */
  private getSchemaName(tenantId: string): string {
    const schemaMap: Record<string, string> = {
      'principal': 'inventario_principal',
      'sucursal': 'inventario_sucursal',
    };

    return schemaMap[tenantId] || 'inventario_principal';
  }

  /**
   * Getter para obtener el tenant actual
   */
  getCurrentTenant(): string {
    return this.tenantId;
  }
}