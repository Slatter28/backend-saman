import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Movimiento } from './movimiento.entity';
import * as bcrypt from 'bcrypt';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column({ unique: true })
  correo: string;

  @Column()
  contrasena: string;

  @Column({ type: 'enum', enum: ['admin', 'bodeguero'] })
  rol: 'admin' | 'bodeguero';

  @CreateDateColumn()
  creadoEn: Date;

  @OneToMany(() => Movimiento, (mov) => mov.usuario)
  movimientos: Movimiento[];

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.contrasena) {
      const saltRounds = 10;
      this.contrasena = await bcrypt.hash(this.contrasena, saltRounds);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.contrasena);
  }
}
