import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { AuthService } from '../auth.service';

@Injectable()
export class OptionalCustomJwtGuard implements CanActivate {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    // If no token, allow the request to continue without authentication
    if (!token) {
      console.log(`ðŸ”“ Optional Custom JWT Guard: Sin token, continuando sin autenticaciÃ³n`);
      return true;
    }

    try {
      const jwtSecret = this.configService.get<string>('JWT_SECRET') || 'your-secret-key';
      const payload = jwt.verify(token, jwtSecret) as any;

      // Find the user with tenant context
      const tenantId = payload.bodegaId || 'principal';
      const user = await this.authService.findById(payload.sub, tenantId);

      if (user) {
        // Add user and tenant to request
        request.user = {
          ...user,
          bodegaId: tenantId
        };
        console.log(`ðŸ” Optional Custom JWT Guard: Usuario autenticado: ${user.correo} - Tenant: ${tenantId}`);
      } else {
        console.log(`ðŸ”“ Optional Custom JWT Guard: Usuario no encontrado para token, continuando sin autenticaciÃ³n`);
      }

      return true;
    } catch (error) {
      console.log(`ðŸ”“ Optional Custom JWT Guard: Token invÃ¡lido, continuando sin autenticaciÃ³n:`, error.message);
      return true; // Allow the request to continue even with invalid token
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}