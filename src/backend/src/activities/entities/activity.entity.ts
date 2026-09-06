import {
  Column,
  Entity,
  OneToMany,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Group } from '../../groups/entities/group.entity.js';
import { Committee } from '../../committees/entities/committee.entity.js';
import { Permanence } from '../../permanences/entities/permanence.entity.js';

@Entity('activity')
export class Activity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'int' })
  weight: number;

  @Column({ type: 'varchar', length: 5 })
  period: string;

  @ManyToOne(() => Group, (group) => group.activities, {
    eager: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ referencedColumnName: 'id' })
  group: Group;

  @ManyToOne(() => Committee, (committee) => committee.activities, {
    eager: true,
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ referencedColumnName: 'id' })
  committee: Committee | null;

  @OneToMany('Permanence', 'activity')
  permanences: Permanence[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
