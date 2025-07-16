import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Movimiento } from "./movimiento.entity";

@Entity('bodegas')
export class Bodega {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column({ nullable: true })
  ubicacion: string;

  @OneToMany(() => Movimiento, m => m.bodega)
  movimientos: Movimiento[];
}
