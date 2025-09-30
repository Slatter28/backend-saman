import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto';
import { CustomJwtGuard, RolesGuard } from './guards';
import { CurrentUser, Roles } from './decorators';
import { Usuario } from '../entities/usuario.entity';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar nuevo usuario' })
  @ApiResponse({
    status: 201,
    description: 'Usuario registrado exitosamente',
    schema: {
      example: {
        usuario: {
          id: 1,
          nombre: 'Juan Pérez',
          correo: 'juan.perez@email.com',
          rol: 'bodeguero',
          bodegaId: 'principal',
          creadoEn: '2024-01-15T10:30:00.000Z',
        },
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({ status: 409, description: 'Usuario ya existe' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  // 🔧 QUITAR LocalAuthGuard del login
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login exitoso',
    schema: {
      example: {
        usuario: {
          id: 1,
          nombre: 'Juan Pérez',
          correo: 'juan.perez@email.com',
          rol: 'bodeguero',
          bodegaId: 'principal',
          creadoEn: '2024-01-15T10:30:00.000Z',
        },
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(CustomJwtGuard)
  @Get('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Perfil del usuario',
    schema: {
      example: {
        id: 1,
        nombre: 'Juan Pérez',
        correo: 'juan.perez@email.com',
        rol: 'bodeguero',
        bodegaId: 'principal',
        creadoEn: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Token inválido' })
  getProfile(@CurrentUser() user: Usuario) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { contrasena, ...result } = user;
    return result;
  }

  @UseGuards(CustomJwtGuard)
  @Get('validate')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Validar token JWT' })
  @ApiResponse({
    status: 200,
    description: 'Token válido',
    schema: {
      example: {
        valid: true,
        user: {
          id: 1,
          nombre: 'Juan Pérez',
          correo: 'juan.perez@email.com',
          rol: 'bodeguero',
          bodegaId: 'principal',
          creadoEn: '2024-01-15T10:30:00.000Z',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Token inválido' })
  validateToken(@CurrentUser() user: Usuario) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { contrasena, ...result } = user;
    return {
      valid: true,
      user: result,
    };
  }

  @Post('create-test-user')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear usuario de prueba (temporal)' })
  async createTestUser() {
    return this.authService.createTestUser();
  }

  @UseGuards(CustomJwtGuard, RolesGuard)
  @Roles('admin')
  @Get('admin-only')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Endpoint solo para administradores' })
  @ApiResponse({
    status: 200,
    description: 'Acceso autorizado',
    schema: {
      example: {
        message: 'Este endpoint solo es accesible para administradores',
        user: 'Juan Pérez',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Token inválido' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  adminOnlyEndpoint(@CurrentUser() user: Usuario) {
    return {
      message: 'Este endpoint solo es accesible para administradores',
      user: user.nombre,
    };
  }
}