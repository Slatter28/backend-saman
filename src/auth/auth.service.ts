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

    // Verificar si el usuario ya existe
    const existingUser = await this.usuarioRepository.findOne({
      where: { correo },
    });

    if (existingUser) {
      throw new ConflictException('El usuario con este correo ya existe');
    }

    // Hashear la contraseña
    const hashedPassword = await bcryptjs.hash(contrasena, 10);

    // Crear el usuario
    const usuario = this.usuarioRepository.create({
      ...userData,
      correo,
      contrasena: hashedPassword,
    });

    await this.usuarioRepository.save(usuario);

    // Remover la contraseña del resultado
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { contrasena: _, ...result } = usuario;
    return {
      usuario: result,
      access_token: this.generateJwtToken(usuario.id, usuario.correo),
    };
  }

  async login(loginDto: LoginDto) {
    const { correo, contrasena } = loginDto;

    // Buscar el usuario
    const usuario = await this.usuarioRepository.findOne({
      where: { correo },
    });

    if (!usuario) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Validar la contraseña
    const isPasswordValid = await bcryptjs.compare(
      contrasena,
      usuario.contrasena,
    );

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

  private generateJwtToken(userId: number, correo: string): string {
    const payload = { sub: userId, correo };
    return this.jwtService.sign(payload);
  }
}
