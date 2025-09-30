import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Usuario } from './usuario.entity';
import { Producto } from './producto.entity';
import { Bodega } from './bodega.entity';
import { Cliente } from './cliente.entity';

@Entity('movimientos')
export class Movimiento {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: ['entrada', 'salida'] })
  tipo: 'entrada' | 'salida';

  @Column({ type: 'numeric' })
  cantidad: number;

  @Column({ type: 'numeric', default: 0 })
  precio: number;

  @Column({ type: 'timestamp', default: () => 'NOW()' })
  fecha: Date;

  @ManyToOne(() => Producto, (p) => p.movimientos)
  @JoinColumn({ name: 'producto_id' })
  producto: Producto;

  @ManyToOne(() => Bodega, (b) => b.movimientos)
  @JoinColumn({ name: 'bodega_id' })
  bodega: Bodega;

  @ManyToOne(() => Usuario, (u) => u.movimientos)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @ManyToOne(() => Cliente, (c) => c.movimientos, { nullable: true })
  @JoinColumn({ name: 'cliente_id' })
  cliente: Cliente;

  @Column({ nullable: true })
  observacion: string;
}
