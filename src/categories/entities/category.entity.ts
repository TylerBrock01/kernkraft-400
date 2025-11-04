import { Entity, Column, PrimaryGeneratedColumn, BaseEntity } from 'typeorm';
@Entity()
export class Category extends BaseEntity{
  @PrimaryGeneratedColumn()
  id: number;

  @Column({type:'varchar', length: 50})
  name: string;
}
