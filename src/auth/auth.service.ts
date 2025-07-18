import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcryptjs from 'bcryptjs';
import { Usuario } from '../entities/usuario.entity';
import { RegisterDto, LoginDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { correo, contrasena, ...userData } = registerDto;

    console.log('=== REGISTER DEBUG ===');
    console.log('Registrando usuario:', correo);
    console.log('Contraseña original:', contrasena);

    // Verificar si el usuario ya existe
    const existingUser = await this.usuarioRepository.findOne({
      where: { correo },
    });

    if (existingUser) {
      throw new ConflictException('El usuario con este correo ya existe');
    }

    // NO hashear aquí - dejar que el hook de la entidad lo haga
    console.log('Creando usuario sin hashear contraseña (hook lo hará)');

    // Crear el usuario
    const usuario = this.usuarioRepository.create({
      ...userData,
      correo,
      contrasena, // Sin hashear - el hook @BeforeInsert lo hará
    });

    const savedUser = await this.usuarioRepository.save(usuario);
    console.log('Usuario guardado con hash:', savedUser.contrasena);

    // Remover la contraseña del resultado
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { contrasena: _, ...result } = savedUser;
    return {
      usuario: result,
      access_token: this.generateJwtToken(savedUser.id, savedUser.correo),
    };
  }

  async login(loginDto: LoginDto) {
    const { correo, contrasena } = loginDto;

    console.log('=== LOGIN DEBUG ===');
    console.log('Intentando iniciar sesión con:', correo);
    console.log('Contraseña proporcionada:', contrasena);
    console.log('Longitud de contraseña:', contrasena.length);

    // Buscar el usuario
    const usuario = await this.usuarioRepository.findOne({
      where: { correo },
    });

    console.log('Usuario encontrado:', usuario ? 'SÍ' : 'NO');
    if (usuario) {
      console.log('Hash almacenado:', usuario.contrasena);
      console.log('Longitud del hash:', usuario.contrasena.length);
    }

    if (!usuario) {
      throw new UnauthorizedException('usuario inválido');
    }

    // Validar la contraseña
    console.log('Comparando contraseñas...');
    const isPasswordValid = await bcryptjs.compare(
      contrasena,
      usuario.contrasena,
    );
    console.log('¿Contraseña válida?:', isPasswordValid);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Remover la contraseña del resultado
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { contrasena: _, ...result } = usuario;
    return {
      usuario: result,
      access_token: this.generateJwtToken(usuario.id, usuario.correo),
    };
  }

  async validateUser(correo: string, contrasena: string): Promise<any> {
    const usuario = await this.usuarioRepository.findOne({
      where: { correo },
    });

    if (usuario && (await bcryptjs.compare(contrasena, usuario.contrasena))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { contrasena: _, ...result } = usuario;
      return result;
    }
    return null;
  }

  async findById(id: number): Promise<Usuario> {
    return this.usuarioRepository.findOne({
      where: { id },
    });
  }

  async createTestUser() {
    const testUser = {
      nombre: 'Usuario Test',
      correo: 'test@test.com',
      contrasena: '123456',
      rol: 'admin' as const,
    };

    // Verificar si ya existe
    const existingUser = await this.usuarioRepository.findOne({
      where: { correo: testUser.correo },
    });

    if (existingUser) {
      // Si existe, solo retornamos info de que ya existe
      return {
        message: 'Usuario de prueba ya existe',
        credenciales: {
          correo: 'test@test.com',
          contrasena: '123456',
        },
      };
    }

    // Crear directamente con contraseña sin hashear (el hook lo hará)
    const usuario = this.usuarioRepository.create(testUser);
    await this.usuarioRepository.save(usuario);

    return {
      message: 'Usuario de prueba creado exitosamente',
      credenciales: {
        correo: 'test@test.com',
        contrasena: '123456',
      },
    };
  }

  private generateJwtToken(userId: number, correo: string): string {
    const payload = { sub: userId, correo };
    return this.jwtService.sign(payload);
  }
}
