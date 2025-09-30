import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any) {
    // Si hay error o no hay usuario, simplemente retorna null
    // No lanza excepción, permite que la request continúe sin usuario
    return user || null;
  }
}