import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantService } from './tenant.service';
import * as jwt from 'jsonwebtoken';

// Extender el tipo Request para incluir tenantId
declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
    }
  }
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private tenantService: TenantService) {}

  use(req: Request, res: Response, next: NextFunction) {
    try {
      // Extraer token del header Authorization
      const token = this.extractTokenFromHeader(req);

      if (token) {
        try {
          // Verificar y decodificar el token manualmente
          const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
          const payload = jwt.verify(token, jwtSecret) as any;

          // Extraer tenantId del payload o usar default
          const tenantId = payload.bodegaId || 'principal';

          // Validar que sea un tenant válido
          if (!this.tenantService.isValidTenant(tenantId)) {
            throw new BadRequestException(`Tenant inválido: ${tenantId}`);
          }

          // Agregar tenantId al request
          req.tenantId = tenantId;

          console.log(`🏢 Tenant detectado: ${tenantId}`);
        } catch (error) {
          // Si el token es inválido, usar tenant por defecto
          req.tenantId = 'principal';
          console.log('⚠️ Token inválido, usando tenant por defecto');
        }
      } else {
        // Sin token, usar tenant por defecto
        req.tenantId = 'principal';
        console.log('📝 Sin token, usando tenant por defecto');
      }

    } catch (error) {
      // En caso de cualquier error, usar tenant por defecto
      req.tenantId = 'principal';
      console.log('❌ Error en middleware, usando tenant por defecto:', error.message);
    }

    next();
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}