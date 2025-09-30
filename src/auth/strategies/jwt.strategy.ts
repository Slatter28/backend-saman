import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

export interface JwtPayload {
  sub: number;
  correo: string;
  bodegaId?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'your-secret-key',
    });
    console.log('🔐 JwtStrategy configurado correctamente');
  }

  async validate(payload: JwtPayload) {
    console.log('🔍 Validando payload JWT:', payload);
    
    const tenantId = payload.bodegaId || 'principal';
    const user = await this.authService.findById(payload.sub, tenantId);
    
    if (!user) {
      throw new UnauthorizedException('Token inválido');
    }
    
    // Agregar bodegaId al usuario para el request
    return {
      ...user,
      bodegaId: tenantId
    };
  }
}
