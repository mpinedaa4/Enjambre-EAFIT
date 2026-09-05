import {
  Column,
  Entity,
  OneToMany,
  ManyToMany,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { GroupMember } from '../../groups/entities/group-member.entity.js';
import { Committee } from '../../committees/entities/committee.entity.js';
import { Permanence } from '../../permanences/entities/permanence.entity.js';

@Entity('member')
export class Member {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'id_epik', type: 'int', unique: true })
  idEpik: number;

  @Column({
    transformer: {
      to: (value: string) => value?.trim().toUpperCase(),
      from: (value: string) => value,
    },
    type: 'varchar',
    length: 255,
  })
  fullName: string;

  @Column({ name: 'document_type', type: 'varchar', length: 100 })
  documentType: string;

  @Column({ name: 'document_number', type: 'varchar', length: 100, unique: true })
  documentNumber: string;

  @Column({
    transformer: {
      to: (value: string) => value?.trim().toUpperCase(),
      from: (value: string) => value,
    },
    type: 'varchar',
    length: 255,
    unique: true,
  })
  email: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  phone: string;

  @Column({ type: 'varchar', length: 255 })
  program: string;

  @Column({ name: 'second_program', type: 'varchar', length: 255, nullable: true })
  secondProgram: string;

  @OneToMany('GroupMember', 'member')
  groupMembers: GroupMember[];

  @ManyToMany('Committee', 'members')
  committees: Committee[];

  @OneToMany('Permanence', 'member')
  permanences: Permanence[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
