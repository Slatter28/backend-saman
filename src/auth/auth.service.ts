import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Inject,
  Scope,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository, QueryRunner } from 'typeorm';
import * as bcryptjs from 'bcryptjs';
import { Usuario } from '../entities/usuario.entity';
import { RegisterDto, LoginDto } from './dto';

@Injectable({ scope: Scope.REQUEST })
export class AuthService {
  private tenantId: string;
  private queryRunner: QueryRunner;

  constructor(
    @Inject(REQUEST) private request: Request,
    @InjectDataSource() private dataSource: DataSource,
    private readonly jwtService: JwtService,
  ) {
    // Para auth, siempre empezamos con 'principal' por defecto
    // El tenant real se determina en el login
    this.tenantId = 'principal';
    console.log(`🔐 AuthService inicializado`);
  }

  private getSchemaName(tenantId: string): string {
    const schemaMap: Record<string, string> = {
      'principal': 'inventario_principal',
      'sucursal': 'inventario_sucursal',
    };
    return schemaMap[tenantId] || 'inventario_principal';
  }

  private async executeWithTenant<T>(
    operation: (usuarioRepository: Repository<Usuario>) => Promise<T>,
    tenantId: string = this.tenantId
  ): Promise<T> {
    const schemaName = this.getSchemaName(tenantId);
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.query(`SET search_path TO ${schemaName}, public`);
      console.log(`🔧 Ejecutando operación en esquema: ${schemaName}`);

      const usuarioRepository = queryRunner.manager.getRepository(Usuario);
      const result = await operation(usuarioRepository);
      return result;
    } finally {
      // 🔥 IMPORTANTE: Siempre liberar el QueryRunner
      await queryRunner.release();
      console.log(`✅ QueryRunner liberado para esquema: ${schemaName}`);
    }
  }

  async register(registerDto: RegisterDto) {
    const { correo, contrasena, bodegaId = 'principal', ...userData } = registerDto;

    console.log('=== REGISTER DEBUG ===');
    console.log('Registrando usuario:', correo);
    console.log('BodegaId:', bodegaId);

    return this.executeWithTenant(async (usuarioRepository) => {
      // Verificar si el usuario ya existe EN EL TENANT ESPECIFICADO
      const existingUser = await usuarioRepository.findOne({
        where: { correo },
      });

      if (existingUser) {
        throw new ConflictException('El usuario con este correo ya existe');
      }

      // Crear el usuario EN EL TENANT ESPECIFICADO
      const usuario = usuarioRepository.create({
        ...userData,
        correo,
        contrasena,
        bodegaId,
      });

      const savedUser = await usuarioRepository.save(usuario);

      console.log(`✅ Usuario registrado en esquema: ${this.getSchemaName(bodegaId)}`);

      // Remover la contraseña del resultado
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { contrasena: _, ...result } = savedUser;
      return {
        usuario: result,
        access_token: this.generateJwtToken({
          id: savedUser.id,
          correo: savedUser.correo,
          bodegaId
        }),
      };
    }, bodegaId);
  }

  async login(loginDto: LoginDto) {
    const { correo, contrasena, bodegaId } = loginDto;

    console.log('=== LOGIN DEBUG ===');
    console.log('Intentando iniciar sesión con:', correo);
    console.log('BodegaId solicitada:', bodegaId);

    // Si no se especifica bodegaId, buscar en ambos esquemas
    let usuario: Usuario | null = null;
    let finalBodegaId = bodegaId;

    if (bodegaId) {
      // Buscar en el esquema específico
      usuario = await this.executeWithTenant(async (usuarioRepository) => {
        return usuarioRepository.findOne({ where: { correo } });
      }, bodegaId);
      finalBodegaId = bodegaId;
    } else {
      // Buscar en todos los esquemas disponibles
      const tenants = ['principal', 'sucursal'];

      for (const tenant of tenants) {
        const foundUser = await this.executeWithTenant(async (usuarioRepository) => {
          return usuarioRepository.findOne({ where: { correo } });
        }, tenant);

        if (foundUser) {
          usuario = foundUser;
          finalBodegaId = tenant;
          break;
        }
      }
    }

    if (!usuario) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Validar la contraseña
    const isPasswordValid = await bcryptjs.compare(contrasena, usuario.contrasena);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Validar acceso a la bodega (los admin pueden acceder a cualquier bodega)
    if (usuario.rol !== 'admin' && bodegaId && usuario.bodegaId !== bodegaId) {
      throw new UnauthorizedException('No tienes acceso a esta bodega');
    }

    console.log(`✅ Login exitoso para bodega: ${finalBodegaId}`);

    // Remover la contraseña del resultado
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { contrasena: _, ...result } = usuario;

    return {
      usuario: { ...result, bodegaId: finalBodegaId },
      access_token: this.generateJwtToken({
        id: usuario.id,
        correo: usuario.correo,
        bodegaId: finalBodegaId
      }),
    };
  }

  async validateUser(correo: string, contrasena: string): Promise<any> {
    // Buscar en todos los esquemas para validación
    const tenants = ['principal', 'sucursal'];

    for (const tenant of tenants) {
      const usuario = await this.executeWithTenant(async (usuarioRepository) => {
        return usuarioRepository.findOne({ where: { correo } });
      }, tenant);

      if (usuario && (await bcryptjs.compare(contrasena, usuario.contrasena))) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { contrasena: _, ...result } = usuario;
        return { ...result, bodegaId: tenant };
      }
    }

    return null;
  }

  async findById(id: number, tenantId: string = 'principal'): Promise<Usuario> {
    return this.executeWithTenant(async (usuarioRepository) => {
      return usuarioRepository.findOne({ where: { id } });
    }, tenantId);
  }

  async createTestUser() {
    const testUser = {
      nombre: 'Usuario Test',
      correo: 'test@test.com',
      contrasena: '123456',
      rol: 'admin' as const,
      bodegaId: 'principal',
    };

    return this.executeWithTenant(async (usuarioRepository) => {
      // Verificar si ya existe
      const existingUser = await usuarioRepository.findOne({
        where: { correo: testUser.correo },
      });

      if (existingUser) {
        return {
          message: 'Usuario de prueba ya existe',
          credenciales: {
            correo: 'test@test.com',
            contrasena: '123456',
          },
        };
      }

      const usuario = usuarioRepository.create(testUser);
      await usuarioRepository.save(usuario);

      console.log('✅ Usuario de prueba creado en inventario_principal');

      return {
        message: 'Usuario de prueba creado exitosamente',
        credenciales: {
          correo: 'test@test.com',
          contrasena: '123456',
        },
      };
    }, 'principal');
  }

  private generateJwtToken(usuario: { id: number; correo: string; bodegaId?: string }): string {
    const payload = {
      sub: usuario.id,
      correo: usuario.correo,
      bodegaId: usuario.bodegaId || 'principal'
    };

    console.log('🔑 Generando JWT con payload:', payload);
    return this.jwtService.sign(payload);
  }
}