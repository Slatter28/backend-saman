import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Movimiento } from "./movimiento.entity";
import { UnidadMedida } from "./unidad-medida.entity";

@Entity('productos')
export class Producto {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  codigo: string;

  @Column()
  descripcion: string;

  @ManyToOne(() => UnidadMedida, u => u.productos)
  @JoinColumn({ name: 'unidad_medida_id' })
  unidadMedida: UnidadMedida;

  @CreateDateColumn()
  creadoEn: Date;

  @OneToMany(() => Movimiento, m => m.producto)
  movimientos: Movimiento[];
}
