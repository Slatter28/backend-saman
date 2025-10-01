import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Query,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, UpdateUserDto, ToggleEstadoDto, CambiarContrasenaDto } from './dto';
import { CustomJwtGuard, RolesGuard } from './guards';
import { CurrentUser, Roles } from './decorators';
import { Usuario } from '../entities/usuario.entity';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}


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
  @Post('register')
  @ApiBearerAuth('JWT-auth')
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

 

  @UseGuards(CustomJwtGuard)
  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener todos los usuarios con paginación' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuarios paginada',
    schema: {
      example: {
        data: [
          {
            id: 1,
            nombre: 'Juan Pérez',
            correo: 'juan.perez@email.com',
            rol: 'bodeguero',
            bodegaId: 'principal',
            creadoEn: '2024-01-15T10:30:00.000Z',
          },
        ],
        meta: {
          total: 50,
          page: 1,
          limit: 10,
          totalPages: 5,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Token inválido' })
  async getAllUsers(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @CurrentUser() user: Usuario,
  ) {
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    return this.authService.findAll(pageNumber, limitNumber, user.bodegaId);
  }

  @UseGuards(CustomJwtGuard)
  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Actualizar un usuario por ID' })
  @ApiParam({ name: 'id', type: Number, description: 'ID del usuario', example: 5 })
  @ApiResponse({
    status: 200,
    description: 'Usuario actualizado exitosamente',
    schema: {
      example: {
        id: 5,
        nombre: 'Juan Pérez Actualizado',
        correo: 'juan.nuevo@email.com',
        rol: 'admin',
        bodegaId: 'sucursal',
        creadoEn: '2024-01-15T10:30:00.000Z',
        actualizadoEn: '2024-01-16T14:20:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Token inválido o usuario no encontrado' })
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: Usuario,
  ) {
    const userId = parseInt(id, 10);
    return this.authService.update(userId, updateUserDto, user.bodegaId);
  }

  @UseGuards(CustomJwtGuard)
  @Patch(':id/toggle-estado')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Activar o desactivar un usuario' })
  @ApiParam({ name: 'id', type: Number, description: 'ID del usuario', example: 2 })
  @ApiResponse({
    status: 200,
    description: 'Estado del usuario actualizado exitosamente',
    schema: {
      example: {
        id: 2,
        nombre: 'Juan Pérez',
        correo: 'juan.perez@email.com',
        rol: 'bodeguero',
        bodegaId: 'principal',
        estado: false,
        creadoEn: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Token inválido o usuario no encontrado' })
  async toggleEstado(
    @Param('id') id: string,
    @Body() toggleEstadoDto: ToggleEstadoDto,
    @CurrentUser() user: Usuario,
  ) {
    const userId = parseInt(id, 10);
    return this.authService.toggleEstado(userId, toggleEstadoDto.estado, user.bodegaId);
  }

  @UseGuards(CustomJwtGuard)
  @Patch(':id/cambiar-contrasena')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cambiar la contraseña de un usuario' })
  @ApiParam({ name: 'id', type: Number, description: 'ID del usuario', example: 2 })
  @ApiResponse({
    status: 200,
    description: 'Contraseña actualizada exitosamente',
    schema: {
      example: {
        id: 2,
        nombre: 'Juan Pérez',
        correo: 'juan.perez@email.com',
        rol: 'bodeguero',
        bodegaId: 'principal',
        estado: true,
        creadoEn: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Token inválido o usuario no encontrado' })
  async cambiarContrasena(
    @Param('id') id: string,
    @Body() cambiarContrasenaDto: CambiarContrasenaDto,
    @CurrentUser() user: Usuario,
  ) {
    const userId = parseInt(id, 10);
    return this.authService.cambiarContrasena(userId, cambiarContrasenaDto.contrasena, user.bodegaId);
  }

  @UseGuards(CustomJwtGuard)
  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Eliminar un usuario por ID' })
  @ApiParam({ name: 'id', type: Number, description: 'ID del usuario', example: 2 })
  @ApiResponse({
    status: 200,
    description: 'Usuario eliminado exitosamente',
    schema: {
      example: {
        message: 'Usuario eliminado exitosamente',
        id: 2,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Token inválido o usuario no encontrado' })
  async deleteUser(
    @Param('id') id: string,
    @CurrentUser() user: Usuario,
  ) {
    const userId = parseInt(id, 10);
    return this.authService.delete(userId, user.bodegaId);
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

  // @Post('create-test-user')
  // @HttpCode(HttpStatus.CREATED)
  // @ApiOperation({ summary: 'Crear usuario de prueba (temporal)' })
  // async createTestUser() {
  //   return this.authService.createTestUser();
  // }

  // @UseGuards(CustomJwtGuard, RolesGuard)
  // @Roles('admin')
  // @Get('admin-only')
  // @ApiBearerAuth('JWT-auth')
  // @ApiOperation({ summary: 'Endpoint solo para administradores' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Acceso autorizado',
  //   schema: {
  //     example: {
  //       message: 'Este endpoint solo es accesible para administradores',
  //       user: 'Juan Pérez',
  //     },
  //   },
  // })
  // @ApiResponse({ status: 401, description: 'Token inválido' })
  // @ApiResponse({ status: 403, description: 'Sin permisos' })
  // adminOnlyEndpoint(@CurrentUser() user: Usuario) {
  //   return {
  //     message: 'Este endpoint solo es accesible para administradores',
  //     user: user.nombre,
  //   };
  // }
}