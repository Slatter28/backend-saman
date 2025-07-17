import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Movimiento } from './movimiento.entity';

@Entity('clientes')
export class Cliente {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column({ nullable: true })
  telefono: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  direccion: string;

  @Column({ type: 'enum', enum: ['proveedor', 'cliente', 'ambos'] })
  tipo: 'proveedor' | 'cliente' | 'ambos';

  @CreateDateColumn()
  creadoEn: Date;

  @OneToMany(() => Movimiento, (movimiento) => movimiento.cliente)
  movimientos: Movimiento[];
}
