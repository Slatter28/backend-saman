import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Movimiento } from "./movimiento.entity";

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

  @OneToMany(() => Movimiento, mov => mov.usuario)
  movimientos: Movimiento[];
}
