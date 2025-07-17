import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Producto } from './producto.entity';

@Entity('unidades_medida')
export class UnidadMedida {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string; // ej: "und"

  @Column({ nullable: true })
  descripcion: string;

  @OneToMany(() => Producto, (p) => p.unidadMedida)
  productos: Producto[];
}
