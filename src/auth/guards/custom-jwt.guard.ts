import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { AuthService } from '../auth.service';

@Injectable()
export class CustomJwtGuard implements CanActivate {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Token not found');
    }

    try {
      const jwtSecret = this.configService.get<string>('JWT_SECRET') || 'your-secret-key';
      const payload = jwt.verify(token, jwtSecret) as any;

      // Find the user with tenant context
      const tenantId = payload.bodegaId || 'principal';
      const user = await this.authService.findById(payload.sub, tenantId);

      if (!user) {
        throw new UnauthorizedException('Invalid token');
      }

      // Add user and tenant to request
      request.user = {
        ...user,
        bodegaId: tenantId
      };

      console.log(`🔐 Custom JWT Guard: Usuario autenticado: ${user.correo} - Tenant: ${tenantId}`);
      return true;
    } catch (error) {
      console.error('🔐 Custom JWT Guard: Error validating token:', error.message);
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}